import { showConsentManager } from '../../consent/index.js';
import { introHtml, sectionsHtml } from '../../legal.js';

export function init(container, data) {
  container.innerHTML = `
    <section class="legal">
      <h1 class="legal__title">${data.title}</h1>
      ${introHtml(data.intro)}
      <section class="legal__section legal__section--consent">
        <h2 class="legal__heading">${data.consent.heading}</h2>
        <p>${data.consent.text}</p>
        <button type="button" class="btn-m-filled">${data.consent.buttonLabel}</button>
      </section>
      ${sectionsHtml(data.sections)}
    </section>
  `;

  container
    .querySelector('.legal__section--consent .btn-m-filled')
    .addEventListener('click', () => showConsentManager());
}
