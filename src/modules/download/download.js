const iconBase = `${import.meta.env.BASE_URL}assets/icons/icons-small/`;
const downloadIcon = `<img class="btn-icon" src="${iconBase}download.svg" width="16" height="16" alt="" aria-hidden="true">`;

export function init(container, data) {
  const buttonsHtml = data.button.map(btn => `
    <a class="btn-m-lucent" href="${btn.url}" download>
      ${btn.title}
      ${downloadIcon}
    </a>
  `).join('');

  container.innerHTML = `
    <section class="download">
      <div class="download__card">
        <div class="download__text-group">
          <h2 class="download__title">${data.title}</h2>
          <p class="download__text">${data.text}</p>
        </div>
        <div class="download__actions">${buttonsHtml}</div>
      </div>
    </section>
  `;
}
