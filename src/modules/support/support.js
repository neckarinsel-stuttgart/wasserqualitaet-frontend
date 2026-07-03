export function init(container, data) {
  container.innerHTML = `
    <section class="support">
      <div class="support__card">
        <h2 class="support__title">${data.title}</h2>
        <p class="support__text">${data.text}</p>
        <a class="btn-m-filled" href="${data.button.url}" target="_blank" rel="noopener noreferrer">
          ${data.button.title}
          <span class="btn-icon-mask btn-icon-mask--chevron-right" aria-hidden="true"></span>
        </a>
      </div>
    </section>
  `;
}
