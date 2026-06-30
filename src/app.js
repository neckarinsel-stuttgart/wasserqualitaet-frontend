import './modules/styles.scss';
import { initConsent } from './consent/index.js';

const lang = new URLSearchParams(window.location.search).get('lang') || import.meta.env.VITE_DEFAULT_LANG || 'de';
document.documentElement.lang = lang;

const moduleMap = {
  header: () => import('./modules/header/header.js'),
  forecast: () => import('./modules/forecast/forecast.js'),
  'intro-faq': () => import('./modules/intro-faq/intro-faq.js'),
  'video-faq': () => import('./modules/video-faq/video-faq.js'),
  guidelines: () => import('./modules/guidelines/guidelines.js'),
  locations: () => import('./modules/locations/locations.js'),
  faq: () => import('./modules/faq/faq.js'),
  footer: () => import('./modules/footer/footer.js'),
  download: () => import('./modules/download/download.js'),
  support: () => import('./modules/support/support.js'),
  impressum: () => import('./modules/impressum/impressum.js'),
  datenschutz: () => import('./modules/datenschutz/datenschutz.js'),
  monitor: () => import('./modules/monitor/monitor.js'),
};


const todayDate = new Date();
const tomorrowDate = new Date();
tomorrowDate.setDate(todayDate.getDate() + 1);

function formatDMY(date) {
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}
function formatISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const todayStr = formatDMY(todayDate);
const tomorrowStr = formatDMY(tomorrowDate);
const todayISO = formatISO(todayDate);
const tomorrowISO = formatISO(tomorrowDate);

const forecastData = {
  "forecastCreated": null,
  "today": {
    "date": todayStr,
    "waterquality": null,
    "weatherCode": null,
    "temperature": null,
    "waterTemperature": null,
    "wind": null,
  },
  "tomorrow": {
    "date": tomorrowStr,
    "waterquality": null,
    "weatherCode": null,
    "temperature": null,
    "waterTemperature": null,
    "wind": null,
  },
};

// ── API → forecastData mapping ────────────────────────────────────────────────
// Edit these when the upstream API field names change.

const WEATHER_FIELDS = {
  temperature: 'temperature_2m',
  weatherCode: 'weather_code',
  wind: 'wind_speed_10m',
};

// Each entry: which API date field identifies the day, and which boolean field
// holds the prediction for that day (true = excellent, false = poor).
const PREDICTION_SLOTS = [
  { dateField: 'prediction_date', qualityField: 'prediction' },
  { dateField: 'prediction_day_after_date', qualityField: 'prediction_day_after' },
];

// ─────────────────────────────────────────────────────────────────────────────

function apiLog(label, status, detail) {
  const icon = status === 'ok' ? '✓' : status === 'warn' ? '⚠' : '✗';
  const style = status === 'ok' ? 'color:#4caf50' : status === 'warn' ? 'color:#ff9800' : 'color:#f44336';
  console.log(`%c${icon} [API] ${label}%c  ${detail}`, `font-weight:bold;${style}`, 'color:inherit');
}

function daysDiff(isoDate) {
  if (!isoDate) return null;
  const diff = Math.round((Date.now() - new Date(isoDate + 'T12:00:00').getTime()) / 86400000);
  return diff;
}

const apiDataPromise = Promise.all([
  fetch('/api/plot-data.php').then(r => r.json()).catch(() => null),
  fetch('/api/get_all_predictions.php').then(r => r.json()).catch(() => null),
]).then(([plotData, allPredictions]) => {
  if (plotData?.rows?.length) {
    apiLog('plot-data', 'ok', `${plotData.rows.length} rows — ${plotData.year}-${String(plotData.month).padStart(2, '0')}`);
  } else {
    apiLog('plot-data', 'error', 'no data');
  }

  if (Array.isArray(allPredictions) && allPredictions.length) {
    const first = allPredictions[0].prediction_date;
    const last = allPredictions.at(-1).prediction_date;
    apiLog('all-predictions', 'ok', `${allPredictions.length} days — ${first} → ${last}`);
  } else {
    apiLog('all-predictions', 'error', 'no data');
  }

  return { plotData, allPredictions };
});

// Water temperature for today and tomorrow (separate endpoint)
const waterTempPromise = fetch('/api/get_water_temp.php')
  .then(r => r.json())
  .then(api => {
    if (!Array.isArray(api) || !api.length) {
      apiLog('water-temp', 'error', 'no data');
      return;
    }
    const todayVal = api[0]?.Ho_Ne_Temperatur;
    const tomorrowVal = api[1]?.Ho_Ne_Temperatur;
    if (todayVal != null) forecastData.today.waterTemperature = Math.round(todayVal);
    if (tomorrowVal != null) forecastData.tomorrow.waterTemperature = Math.round(tomorrowVal);
    apiLog('water-temp', 'ok', `today ${todayVal ?? '–'}°C / tomorrow ${tomorrowVal ?? '–'}°C`);
  })
  .catch(err => apiLog('water-temp', 'error', `fetch failed — ${err.message}`));

const weatherPromise = fetch('/api/get_current_weather.php')
  .then(r => r.json())
  .then(api => {
    if (!api) { apiLog('current-weather', 'error', 'no data'); return; }
    const v = (key) => api[WEATHER_FIELDS[key]];
    const temp = v('temperature');
    const wind = v('wind');
    if (temp != null) forecastData.today.temperature = Math.round(temp);
    if (v('weatherCode') != null) forecastData.today.weatherCode = parseInt(v('weatherCode'));
    if (wind != null) forecastData.today.wind = Math.round(wind);
    if (temp != null) {
      apiLog('current-weather', 'ok', `${Math.round(temp)}°C, wind ${Math.round(wind ?? 0)} km/h`);
    } else {
      apiLog('current-weather', 'warn', 'served from stale cache — all fields null');
    }
  })
  .catch(err => apiLog('current-weather', 'error', `fetch failed — ${err.message}`));

const nextDayWeatherPromise = fetch('/api/get_next_day_weather_prediction.php')
  .then(r => r.json())
  .then(raw => {
    const api = Array.isArray(raw) ? raw[0] : raw;
    if (!api) { apiLog('next-day-weather', 'error', 'no data'); return; }
    const temp = api[WEATHER_FIELDS.temperature];
    const wind = api[WEATHER_FIELDS.wind];
    if (temp != null) forecastData.tomorrow.temperature = Math.round(temp);
    if (api[WEATHER_FIELDS.weatherCode] != null) forecastData.tomorrow.weatherCode = parseInt(api[WEATHER_FIELDS.weatherCode]);
    if (wind != null) forecastData.tomorrow.wind = Math.round(wind);
    if (temp != null) {
      apiLog('next-day-weather', 'ok', `${Math.round(temp)}°C, wind ${Math.round(wind ?? 0)} km/h`);
    } else {
      apiLog('next-day-weather', 'warn', 'served from stale cache — all fields null');
    }
  })
  .catch(err => apiLog('next-day-weather', 'error', `fetch failed — ${err.message}`));

const predictionPromise = fetch('/api/get_daily_prediction.php')
  .then(r => r.json())
  .then(api => {
    if (!api) { apiLog('daily-prediction', 'error', 'no data'); return; }
    if (api.is_current_day === false) {
      const diff = daysDiff(api.prediction_date);
      if (diff === 1 && api.prediction_day_after_date === todayISO && api.prediction_day_after != null) {
        forecastData.today.waterquality = api.prediction_day_after ? 'excellent' : 'poor';
        forecastData.forecastCreated = formatDMY(new Date(api.prediction_date + 'T12:00:00'));
        apiLog('daily-prediction', 'warn',
          `is_current_day=false — using day_after as fallback — today: ${forecastData.today.waterquality} (from ${api.prediction_date})`);
        return;
      }
      apiLog('daily-prediction', 'warn',
        `is_current_day=false — prediction_date ${api.prediction_date ?? '?'} (${diff != null ? diff + ' day(s) old' : 'unknown age'}) — not shown`);
      return;
    }
    for (const { dateField, qualityField } of PREDICTION_SLOTS) {
      const date = api[dateField];
      const value = api[qualityField];
      if (!date || value == null) continue;
      const q = value ? 'excellent' : 'poor';
      if (date === todayISO) forecastData.today.waterquality = q;
      if (date === tomorrowISO) forecastData.tomorrow.waterquality = q;
    }
    const createdDate = api[PREDICTION_SLOTS[0].dateField];
    if (createdDate) forecastData.forecastCreated = formatDMY(new Date(createdDate + 'T12:00:00'));
    apiLog('daily-prediction', 'ok',
      `today: ${forecastData.today.waterquality ?? '–'}, tomorrow: ${forecastData.tomorrow.waterquality ?? '–'} (from ${createdDate ?? '?'})`);
  })
  .catch(err => apiLog('daily-prediction', 'error', `fetch failed — ${err.message}`));

function setFavicon(quality) {
  const base = import.meta.env.BASE_URL;
  const name = quality === 'excellent' ? 'favicon-excellent'
    : quality === 'poor' ? 'favicon-poor'
      : 'favicon-default';
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  link.href = `${base}assets/icons/${name}.png`;
}

setFavicon(null);
predictionPromise.then(() => setFavicon(forecastData.today.waterquality));

initConsent(lang).then(() => {
  document.querySelectorAll('[data-module]').forEach(async (container) => {
    const name = container.dataset.module;
    if (!moduleMap[name]) return;

    try {
      const [{ init }, data, apiData] = await Promise.all([
        moduleMap[name](),
        fetch(`${import.meta.env.BASE_URL}modules/${name}/${name}-${lang}.json`).then(r => r.json()),
        apiDataPromise,
        weatherPromise,
        nextDayWeatherPromise,
        predictionPromise,
        waterTempPromise,
      ]);
      init(container, data, lang, apiData, forecastData);
    } catch (err) {
      console.error(`Module "${name}" failed to load:`, err);
    }
  });
});

// Tooltip implementation
let tooltipEl;
function getOrCreateTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "tooltip-popup";
    tooltipEl.setAttribute("role", "tooltip");
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function positionTooltip(tooltip, target) {
  const rect = target.getBoundingClientRect();
  const scrollY = window.scrollY;
  tooltip.style.left = "0px";
  tooltip.style.top = "0px";
  tooltip.style.visibility = "hidden";
  tooltip.classList.add("is-visible");
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  tooltip.classList.remove("is-visible");
  tooltip.style.visibility = "";

  let left = rect.left + rect.width / 2 - width / 2;
  const padding = 8;
  left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));
  const top = rect.top + scrollY - height - 8;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function showTooltip(target) {
  const tooltip = getOrCreateTooltip();
  tooltip.textContent = target.dataset.tooltip;
  positionTooltip(tooltip, target);
  tooltip.classList.add("is-visible");
}

function hideTooltip() {
  getOrCreateTooltip().classList.remove("is-visible");
}

function initTooltips() {
  document.addEventListener("mouseover", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) showTooltip(target);
  });
  document.addEventListener("mouseout", (event) => {
    if (event.target.closest("[data-tooltip]")) hideTooltip();
  });
  document.addEventListener("focusin", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) showTooltip(target);
  });
  document.addEventListener("focusout", (event) => {
    if (event.target.closest("[data-tooltip]")) hideTooltip();
  });
}

initTooltips();
