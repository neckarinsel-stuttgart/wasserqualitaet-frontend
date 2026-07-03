import { introHtml, sectionsHtml } from '../../legal.js';

export function init(container, data) {
  container.innerHTML = `
    <section class="legal">
      <h1 class="legal__title">${data.title}</h1>
      ${introHtml(data.intro)}
      ${sectionsHtml(data.sections)}
    </section>
  `;
}
