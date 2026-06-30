import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const iconBase = `${import.meta.env.BASE_URL}assets/icons/video-control-icons/`;

function setState(card, state) {
  card.querySelector('.video-faq__poster').hidden = state !== 'poster';
  card.querySelector('.video-faq__overlay').hidden = state === 'playing';
  card.querySelector('.video-faq__controls').hidden = state !== 'playing';
  card.querySelector('.video-faq__timeline').hidden = state !== 'playing';
}

export function init(container, data) {
  const slidesHtml = data.videos.map(video => `
    <div class="swiper-slide video-faq__slide">
      <div class="video-faq__card">
        <video class="video-faq__video" preload="none" playsinline>
          <source src="${video.src}" type="video/mp4">
        </video>
        <img class="video-faq__poster" src="${video.poster}" alt="">
        <div class="video-faq__overlay">
          <div class="video-faq__details">
            ${video.duration ? `<span class="video-faq__duration">${video.duration}</span>` : ''}
            <p class="video-faq__title">${video.title}</p>
            <button class="video-faq__play-btn" aria-label="${data.playLabel}">
              <img src="${iconBase}play.svg" alt=""><span class="video-faq__play-label">Play</span>
            </button>
          </div>
        </div>
        <div class="video-faq__controls" hidden>
          <button class="video-faq__pause-btn" aria-label="Pause">
            <img src="${iconBase}pause.svg" alt="">
          </button>
          <button class="video-faq__back-btn" aria-label="Back 5 seconds">
            <img src="${iconBase}back-5.svg" alt="">
          </button>
        </div>
        <div class="video-faq__timeline" hidden>
          <div class="video-faq__timeline-fill"></div>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <section class="video-faq">
      <div class="swiper video-faq__swiper">
        <div class="swiper-wrapper">${slidesHtml}</div>
      </div>
      <div class="video-faq__nav">
        <button class="video-faq__prev" aria-label="Previous"></button>
        <button class="video-faq__next" aria-label="Next"></button>
      </div>
    </section>
  `;

  const videos = [];

  container.querySelectorAll('.video-faq__card').forEach(card => {
    const video = card.querySelector('.video-faq__video');
    const overlay = card.querySelector('.video-faq__overlay');
    const playBtn = card.querySelector('.video-faq__play-btn');
    const pauseBtn = card.querySelector('.video-faq__pause-btn');
    const backBtn = card.querySelector('.video-faq__back-btn');
    const timeline = card.querySelector('.video-faq__timeline');
    const timelineFill = card.querySelector('.video-faq__timeline-fill');

    videos.push(video);

    const play = () => {
      videos.forEach(v => { if (v !== video) v.pause(); });
      video.play();
    };

    playBtn.addEventListener('click', play);
    overlay.addEventListener('click', play);
    video.addEventListener('click', () => video.pause());
    pauseBtn.addEventListener('click', () => video.pause());
    backBtn.addEventListener('click', () => {
      video.currentTime = Math.max(0, video.currentTime - 5);
    });

    timeline.addEventListener('click', e => {
      if (!video.duration) return;
      const rect = timeline.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      video.currentTime = ratio * video.duration;
    });

    video.addEventListener('play', () => setState(card, 'playing'));
    video.addEventListener('pause', () => {
      if (video.ended) return;
      setState(card, 'paused');
    });
    video.addEventListener('ended', () => setState(card, 'poster'));
    video.addEventListener('timeupdate', () => {
      timelineFill.style.width = `${(video.currentTime / video.duration) * 100 || 0}%`;
    });
  });

  new Swiper(container.querySelector('.video-faq__swiper'), {
    modules: [Navigation, FreeMode],
    slidesPerView: 'auto',
    spaceBetween: 8,
    freeMode: true,
    navigation: {
      prevEl: container.querySelector('.video-faq__prev'),
      nextEl: container.querySelector('.video-faq__next'),
    },
  });

  // Pause a video as soon as its card leaves the viewport, whether that's
  // from scrolling the page or from swiping/navigating the carousel.
  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        entry.target.querySelector('.video-faq__video').pause();
      }
    });
  }, { threshold: 0 });

  container.querySelectorAll('.video-faq__card').forEach(card => {
    visibilityObserver.observe(card);
  });
}
