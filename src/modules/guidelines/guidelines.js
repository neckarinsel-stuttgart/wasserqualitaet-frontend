import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const iconBase = `${import.meta.env.BASE_URL}assets/icons/icons-small/`;
const warningIcon = `${import.meta.env.BASE_URL}assets/icons/baden-verboten.svg`;
const chevronDownIcon = `<img class="guidelines__chevron" src="${iconBase}chevron-down.svg" width="16" height="16" alt="" aria-hidden="true">`;
const chevronRightIcon = `<img class="btn-icon" src="${iconBase}chevron-right.svg" width="16" height="16" alt="" aria-hidden="true">`;

export function init(container, data) {
  const itemsHtml = data.items.map(item => `
    <li class="swiper-slide guidelines__slide">
      <details class="guidelines__item">
        <summary class="guidelines__question">
          ${item.title}
          ${chevronDownIcon}
        </summary>
        <div class="guidelines__answer">
          <p>${item.text}</p>
          ${item.links?.length ? `
            <ul class="guidelines__links">
              ${item.links.map(l => `
                <li>
                  <a class="btn-m-outlined" href="${l.url}" target="_blank" rel="noopener noreferrer">
                    ${l.title}
                    ${chevronRightIcon}
                  </a>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      </details>
    </li>
  `).join('');

  const warningHtml = data.warning ? `
    <div class="guidelines__warning">
      <img class="guidelines__warning-icon" src="${warningIcon}" width="64" height="64" alt="" aria-hidden="true">
      <div class="guidelines__warning-text">
        <strong>${data.warning.label}</strong>
        ${data.warning.text}
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <section class="guidelines">
      <h2 class="guidelines__title">${data.title}</h2>
      ${warningHtml}
      <div class="guidelines__swiper swiper">
        <ul class="guidelines__list swiper-wrapper">${itemsHtml}</ul>
      </div>
      <div class="guidelines__nav">
        <button class="guidelines__prev" aria-label="Vorheriger"></button>
        <button class="guidelines__next" aria-label="Nächster"></button>
      </div>
    </section>
  `;

  const swiperEl = container.querySelector('.guidelines__swiper');
  const prevEl = container.querySelector('.guidelines__prev');
  const nextEl = container.querySelector('.guidelines__next');

  let swiper = null;

  const allDetails = [...container.querySelectorAll('.guidelines__item')];

  function initSwiper() {
    if (swiper) return;
    allDetails.forEach(el => { el.open = true; });
    swiper = new Swiper(swiperEl, {
      modules: [Navigation],
      slidesPerView: 'auto',
      spaceBetween: 8,
      slidesOffsetBefore: 18,
      slidesOffsetAfter: 18,
      navigation: { prevEl, nextEl },
    });
  }

  function destroySwiper() {
    if (!swiper) return;
    swiper.destroy(true, true);
    swiper = null;
    allDetails.forEach(el => { el.open = false; });
  }

  const mq = window.matchMedia('(max-width: 700px)');
  mq.addEventListener('change', e => e.matches ? initSwiper() : destroySwiper());
  if (mq.matches) initSwiper();
}
