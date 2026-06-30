import { iconBase, wmoIcon } from '../weather-icon.js';

export function init(container, data, lang, _apiData, forecastData) {
  const page = window.location.pathname.split('/').pop() || 'index';
  const otherLang = lang === 'de' ? 'en' : 'de';

  const today = forecastData?.today ?? {};
  const quality = today.waterquality ?? null;
  const iconName = wmoIcon(today.weatherCode);
  const temp = today.temperature != null ? `${today.temperature}°C` : '–';

  const qualityLabel = quality ? (data.quality?.[quality] ?? quality) : null;
  const badgeHtml = qualityLabel
    ? `<span class="header__forecast-badge" data-quality="${quality}">
         <span class="header__forecast-badge-dot"></span>
         ${qualityLabel}
       </span>`
    : '';
  const iconHtml = iconName
    ? `<img class="header__forecast-icon" src="${iconBase}${iconName}.svg" alt="" width="20" height="20">`
    : '';

  container.innerHTML = `
    <header class="header">
      <div class="header__nav-row">
        <nav class="header__nav">
          <a class="header__link ${page === 'index' || page === '' ? 'header__link--active' : ''}"
             href="./?lang=${lang}">${data.dashboardLabel}</a>
          <a class="header__link ${page === 'faq' ? 'header__link--active' : ''}"
             href="faq?lang=${lang}">${data.faqLabel}</a>
        </nav>
        <a class="header__lang-switch" href="?lang=${otherLang}">
          ${data.switchLanguageToLabel}
          <img class="header__lang-icon${lang === 'en' ? ' header__lang-icon--flipped' : ''}"
               src="${import.meta.env.BASE_URL}assets/icons/switch-chevrons.svg" alt="" width="8" height="16">
        </a>
      </div>
      <div class="header__forecast" aria-hidden="true">
        <div class="header__forecast-inner">
          <span class="header__forecast-today">${data.todayLabel}</span>
          <div class="header__forecast-data">
            ${badgeHtml}
            ${iconHtml}
            <span class="header__forecast-temp">${temp}</span>
          </div>
        </div>
      </div>
    </header>
  `;

  const header = container.querySelector('.header');

  let isExpanded = false;
  let lastScrollY = window.scrollY;
  let upwardAccum = 0;

  function onScroll() {
    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    // Shadow: fades in above 50px, disappears only at the very top
    if (scrollY <= 0) {
      header.classList.remove('header--shadow');
    } else if (scrollY > 50) {
      header.classList.add('header--shadow');
    }

    // At top: always reset to collapsed
    if (scrollY <= 50) {
      if (isExpanded) {
        isExpanded = false;
        header.classList.remove('header--expanded');
      }
      upwardAccum = 0;
      return;
    }

    if (delta > 0) {
      // Scrolling down: reset upward accumulator, expand if not already
      upwardAccum = 0;
      if (!isExpanded) {
        isExpanded = true;
        header.classList.add('header--expanded');
      }
    } else if (delta < 0) {
      // Scrolling up: accumulate — collapse after 50px
      upwardAccum += -delta;
      if (isExpanded && upwardAccum >= 50) {
        isExpanded = false;
        upwardAccum = 0;
        header.classList.remove('header--expanded');
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}
