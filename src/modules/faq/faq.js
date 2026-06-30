const iconBase = `${import.meta.env.BASE_URL}assets/icons/icons-small/`;
const chevronRightIcon = `<img class="btn-icon" src="${iconBase}chevron-right.svg" width="16" height="16" alt="" aria-hidden="true">`;
const linkExternalIcon = `<img class="btn-icon" src="${iconBase}link-external.svg" width="16" height="16" alt="" aria-hidden="true">`;
const chevronHtml = `<span class="faq__chevron" aria-hidden="true"></span>`;

export function init(container, data) {
  const listHtml = data.categories.map(cat => `
    <li class="faq__category">
      <h3 class="faq__category-label">${cat.title}</h3>
      <ul class="faq__items">
        ${cat.items.map(item => `
          <li>
            <details class="faq__item"${item.id ? ` id="${item.id}"` : ''}>
              <summary class="faq__question">
                <span class="faq__question-text">${item.title}</span>
                ${chevronHtml}
              </summary>
              <div class="faq__answer">
                <p>${item.text}</p>
                ${item.sources.length ? `
                  <div class="faq__sources">
                    <span class="faq__sources-label">${data.sourceLabel}</span>
                    <ul>
                      ${item.sources.map(s => `
                        <li>
                          <a class="link-ext" href="${s.url}" target="_blank" rel="noopener noreferrer">
                            <span class="link-ext__label">${s.title}</span>
                            ${linkExternalIcon}
                          </a>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </details>
          </li>
        `).join('')}
      </ul>
    </li>
  `).join('');

  const knowledgeLinkHtml = data.knowledgeLink ? `
    <div class="faq__knowledge-link">
      <p class="faq__knowledge-title">${data.knowledgeLink.title}</p>
      <a class="btn-m-outlined" href="${data.knowledgeLink.url}" target="_blank" rel="noopener noreferrer">
        ${data.knowledgeLink.label}
        ${chevronRightIcon}
      </a>
    </div>
  ` : '';

  container.innerHTML = `
    <section class="faq">
      ${data.title ? `<h2 class="faq__title">${data.title}</h2>` : ''}
      <ul class="faq__list">${listHtml}</ul>
      ${knowledgeLinkHtml}
    </section>
  `;

  const hash = window.location.hash.slice(1);
  if (hash) {
    const target = container.querySelector(`details#${CSS.escape(hash)}`);
    if (target) {
      target.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
