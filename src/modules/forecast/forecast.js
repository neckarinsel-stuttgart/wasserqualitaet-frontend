import { tooltip } from '../tooltip.js';
import { iconBase, wmoIcon } from '../weather-icon.js';

const refreshIcon = `${import.meta.env.BASE_URL}assets/icons/icons-small/refresh.svg`;

// ── Winter break animation ───────────────────────────────────────────────────
// Loops: "Brrr…" (letters appear one by one) → message runs right to left as an
// endless chain of copies → repeat. Weather values show "Zz" during the break.

const WINTER_LETTER_DELAY = 120; // ms between letters
const WINTER_HOLD = 1200;        // ms the full "Brrr…" stays before the message
const WINTER_SPEED = 90;         // px per second for the scrolling message
const WINTER_MARQUEE_LOOPS = 3;  // how many message lengths scroll by before "Brrr…" again

let winterTimer = null;

function stopWinter() {
  clearTimeout(winterTimer);
  winterTimer = null;
}

function formatWinterDate(isoDate, lang) {
  if (!isoDate) return '';
  return new Intl.DateTimeFormat(lang, { day: '2-digit', month: 'long' })
    .format(new Date(isoDate + 'T12:00:00'));
}

function renderWinter(qualityEl, winterBreak, translations, lang) {
  const date = formatWinterDate(winterBreak.end, lang);
  const message = (translations.winterBreak ?? '{date}').replace('{date}', date).trim();
  const brr = translations.winterBrr ?? 'Brrrrrrrrrr';

  qualityEl.dataset.quality = 'winter';
  qualityEl.innerHTML = `
    <span class="forecast__sr-only">${message}</span>
    <span class="forecast__winter" aria-hidden="true"></span>
  `;
  const stage = qualityEl.querySelector('.forecast__winter');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stage.textContent = message;
    return;
  }

  const showBrr = () => {
    const [first, ...rest] = [...brr];
    stage.innerHTML = `<span class="forecast__quality-dot"></span><span class="forecast__winter-word">${first}</span>`;
    const word = stage.querySelector('.forecast__winter-word');
    let i = 0;
    const step = () => {
      if (i < rest.length) {
        word.insertAdjacentHTML('beforeend', `<span class="forecast__winter-letter">${rest[i++]}</span>`);
        winterTimer = setTimeout(step, WINTER_LETTER_DELAY);
      } else {
        winterTimer = setTimeout(showMessage, WINTER_HOLD);
      }
    };
    winterTimer = setTimeout(step, WINTER_LETTER_DELAY);
  };

  const showMessage = () => {
    const item = `<span class="forecast__winter-marquee-item">${message}<span class="forecast__quality-dot"></span></span>`;
    stage.innerHTML = `<span class="forecast__winter-marquee">${item}</span>`;
    const track = stage.firstElementChild;
    // One copy scrolls out per iteration; enough copies keep the box filled meanwhile.
    const itemWidth = track.firstElementChild.offsetWidth;
    const copies = Math.ceil(qualityEl.clientWidth / itemWidth) + 1;
    track.innerHTML = item.repeat(copies);
    track.style.setProperty('--marquee-to', `${-itemWidth}px`);
    track.style.setProperty('--marquee-duration', `${itemWidth / WINTER_SPEED}s`);
    track.style.setProperty('--marquee-loops', WINTER_MARQUEE_LOOPS);
    track.classList.add('forecast__winter-marquee--running');
    track.addEventListener('animationend', showBrr, { once: true });
  };

  showBrr();
}

// ─────────────────────────────────────────────────────────────────────────────

function renderDay(container, dayData, translations, winterBreak, lang) {
  const qualityEl = container.querySelector('.forecast__quality-value');
  stopWinter();
  if (winterBreak) {
    renderWinter(qualityEl, winterBreak, translations, lang);
  } else {
    renderQuality(qualityEl, dayData, translations);
  }
  const zz = translations.winterValue ?? 'Zz';
  renderWeather(container, winterBreak
    ? { ...dayData, temperature: zz, waterTemperature: zz, wind: zz }
    : dayData);
}

function renderQuality(qualityEl, dayData, translations) {
  const hasQuality = dayData.waterquality != null;
  const qualityLabel = hasQuality ? (translations.quality[dayData.waterquality] ?? dayData.waterquality) : (translations.qualityUnavailable ?? '–');
  qualityEl.innerHTML = hasQuality
    ? `<span class="forecast__quality-dot"></span>${qualityLabel}`
    : qualityLabel;
  qualityEl.dataset.quality = hasQuality ? dayData.waterquality : '';
}

function renderWeather(container, dayData) {
  const weatherIcon = container.querySelector('.forecast__weather-icon--weather');
  const iconName = wmoIcon(dayData.weatherCode);
  if (iconName) {
    weatherIcon.src = `${iconBase}${iconName}.svg`;
    weatherIcon.alt = iconName;
    weatherIcon.style.display = '';
  } else {
    weatherIcon.src = '';
    weatherIcon.alt = '';
    weatherIcon.style.display = 'none';
  }

  container.querySelector('[data-field="temperature"]').innerHTML = dayData.temperature != null ? `${dayData.temperature}<span class="forecast__unit">°C</span>` : '–';
  container.querySelector('[data-field="waterTemperature"]').innerHTML = dayData.waterTemperature != null ? `${dayData.waterTemperature}<span class="forecast__unit">°C</span>` : '–';
  container.querySelector('[data-field="wind"]').innerHTML = dayData.wind != null ? `${dayData.wind}<span class="forecast__unit">km/h</span>` : '–';
}

export function init(container, data, lang, _apiData, forecastData) {
  const updateTime = forecastData.forecastCreated ?? data.forecastUnavailable;

  container.innerHTML = `
    <section class="forecast">
      <div class="forecast__header">
        <h2 class="forecast__title">${data.title}</h2>
        <div class="forecast__date-switch">
          <button class="forecast__date-btn forecast__date-btn--active" data-day="today">
            <span class="forecast__date-btn-label">${data.today}</span>
            <span class="forecast__date-btn-date">, ${forecastData.today.date}</span>
          </button>
          <button class="forecast__date-btn" data-day="tomorrow">
            <span class="forecast__date-btn-label">${data.tomorrow}</span>
          </button>
        </div>
      </div>
      <div class="forecast__panels">
        <div class="forecast__main">
          <div class="forecast__quality">
            <span class="forecast__quality-label">
              ${data.waterQualityForecast}
              ${tooltip(data.waterQualityForecastTooltip, data.waterQualityForecastTooltipLabel)}
            </span>
            <span class="forecast__quality-value">–</span>
          </div>
          <div class="forecast__weather">
            <span class="forecast__weather-item">
              <span class="forecast__weather-label">${data.weather}</span>
              <span class="forecast__weather-iconwrapper">
                <span class="forecast__weather-value" data-field="temperature">–</span>
                <img class="forecast__weather-icon forecast__weather-icon--weather" src="" alt="">
              </span>
            </span>
            <span class="forecast__weather-item">
              <span class="forecast__weather-label">${data.waterTemperature}</span>
              <span class="forecast__weather-iconwrapper">
                <span class="forecast__weather-value" data-field="waterTemperature">–</span>
                <img class="forecast__weather-icon" src="${iconBase}watertemperature.svg" alt="water temperature">
              </span>
            </span>
            <span class="forecast__weather-item">
              <span class="forecast__weather-label">${data.wind}</span>
              <span class="forecast__weather-iconwrapper">
                <span class="forecast__weather-value" data-field="wind">–</span>
                <img class="forecast__weather-icon" src="${iconBase}windspeed.svg" alt="wind speed">
              </span>
            </span>
          </div>
        </div>
        <div class="forecast__footer">
          <div class="forecast__update">
            <img class="forecast__update-icon" src="${refreshIcon}" alt="" aria-hidden="true" width="16" height="16">
            <span class="forecast__update-label">${data.forecastCreated}:</span>
            <span class="forecast__update-time">${updateTime}</span>${tooltip(data.forecastCreatedTooltip, data.forecastCreatedTooltipLabel)}
          </div>
        </div>
      </div>
    </section>
  `;

  renderDay(container, forecastData.today, data, forecastData.winterBreak, lang);

  container.querySelectorAll('.forecast__date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.forecast__date-btn').forEach(b => b.classList.remove('forecast__date-btn--active'));
      btn.classList.add('forecast__date-btn--active');
      renderDay(container, forecastData[btn.dataset.day], data, forecastData.winterBreak, lang);
    });
  });
}
