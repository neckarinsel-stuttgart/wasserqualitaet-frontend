import { tooltip } from '../tooltip.js';
import { iconBase, wmoIcon } from '../weather-icon.js';

const pinIcon = `${import.meta.env.BASE_URL}assets/icons/pin.svg`;
const refreshIcon = `${import.meta.env.BASE_URL}assets/icons/icons-small/refresh.svg`;

function renderDay(container, dayData, translations) {
  const qualityEl = container.querySelector('.forecast__quality-value');
  const hasQuality = dayData.waterquality != null;
  const qualityLabel = hasQuality ? (translations.quality[dayData.waterquality] ?? dayData.waterquality) : (translations.qualityUnavailable ?? '–');
  qualityEl.innerHTML = hasQuality
    ? `<span class="forecast__quality-dot"></span>${qualityLabel}`
    : qualityLabel;
  qualityEl.dataset.quality = hasQuality ? dayData.waterquality : '';

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

export function init(container, data, _lang, _apiData, forecastData) {
  const updateTime = forecastData.forecastCreated ?? data.forecastUnavailable;

  container.innerHTML = `
    <section class="forecast">
      <div class="forecast__top">
        <div class="forecast__intro">
          <p class="forecast__intro-brand">${data.introBrand}</p>
          <p class="forecast__intro-tagline">
            ${data.introTagline}
            <span class="forecast__intro-location">
              <img class="forecast__intro-pin" src="${pinIcon}" alt="">
              ${data.location}
            </span>
          </p>
          <p class="forecast__intro-credit">${data.introCreditUrl ? `<a href="${data.introCreditUrl}" target="_blank" rel="noopener">${data.introCredit}</a>` : data.introCredit}</p>
        </div>
        <div class="forecast__date-switch">
          <button class="forecast__date-btn forecast__date-btn--active" data-day="today">
            <span class="forecast__date-btn-label">${data.today}</span>
            <span class="forecast__date-btn-date">, ${forecastData.today.date}</span>
          </button>
          <button class="forecast__date-btn" data-day="tomorrow">
            <span class="forecast__date-btn-label">${data.tomorrow}</span>
            <span class="forecast__date-btn-date">, ${forecastData.tomorrow.date}</span>
          </button>
        </div>
      </div>
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
          <span class="forecast__update-time">${updateTime}</span>
        </div>
      </div>
    </section>
  `;

  renderDay(container, forecastData.today, data);

  container.querySelectorAll('.forecast__date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.forecast__date-btn').forEach(b => b.classList.remove('forecast__date-btn--active'));
      btn.classList.add('forecast__date-btn--active');
      renderDay(container, forecastData[btn.dataset.day], data);
    });
  });
}
