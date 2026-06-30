const iconBase = `${import.meta.env.BASE_URL}assets/icons/icons-small/`;
const linkExternalIcon = `<img class="btn-icon" src="${iconBase}link-external.svg" width="16" height="16" alt="" aria-hidden="true">`;

const chevronSvg = `<img class="footer__chevron" src="${iconBase}chevron-down.svg" width="16" height="16" alt="" aria-hidden="true">`;

function imageBlock(image) {
  if (!image) return '';
  return `
    <figure class="footer__image">
      <img src="${image.src}" alt="${image.alt}">
      <figcaption class="footer__image-caption">${image.caption}</figcaption>
    </figure>
  `;
}

function teamBlock(team) {
  if (!team?.length) return '';
  const rows = team.map(m => `
    <li class="footer__team-member">
      <span class="footer__team-role">${m.role}</span>
      <span class="footer__team-name">${m.name}</span>
      <a class="link-ext" href="${m.url}" target="_blank" rel="noopener noreferrer">
        <span class="link-ext__label">${m.linktitle}</span>
        ${linkExternalIcon}
      </a>
    </li>
  `).join('');
  return `
    <p class="footer__team-title">Team</p>
    <ul class="footer__team">${rows}</ul>
  `;
}

function linksBlock(link) {
  if (!link) return '';
  const links = Array.isArray(link) ? link : [link];
  return links
    .map(
      (l) => `
    <a class="link-ext" href="${l.url}" target="_blank" rel="noopener noreferrer">
      <span class="link-ext__label">${l.label}</span>
      ${linkExternalIcon}
    </a>
  `
    )
    .join('');
}

function supportBlock(support) {
  if (!support) return '';
  const links = support.links.map(l =>
    `<a class="link-ext" href="${l.url}" target="_blank" rel="noopener noreferrer">
      <span class="link-ext__label">${l.label}</span>
      ${linkExternalIcon}
    </a>`
  ).join('');
  const logos = support.logos.map(l =>
    `<img class="footer__support-logo" src="${l.src}" alt="${l.alt}">`
  ).join('');
  return `
    <div class="footer__support">
      <p class="footer__support-title">${support.title}</p>
      <p>${support.text}</p>
      <div class="footer__support-links">${links}</div>
      <div class="footer__support-logos">${logos}</div>
    </div>
  `;
}

function sectionBodyHtml(section) {
  if (section.content) {
    return section.content.map(block => `
      ${block.text ? block.text.split('\n\n').map(p => `<p>${p}</p>`).join('') : ''}
      ${linksBlock(block.link)}
    `).join('');
  }
  return `
    ${section.text ? section.text.split('\n\n').map(p => `<p>${p}</p>`).join('') : ''}
    ${imageBlock(section.image)}
    ${teamBlock(section.team)}
    ${supportBlock(section.support)}
    ${linksBlock(section.link)}
  `;
}

export function init(container, data, lang) {
  const sectionsHtml = data.sections.map(section => `
    <details class="footer__accordion">
      <summary class="footer__accordion-title">
        ${section.title}
        ${chevronSvg}
      </summary>
      <div class="footer__accordion-body">
        ${sectionBodyHtml(section)}
      </div>
    </details>
  `).join('');

  const legalHtml = data.legal.map(item =>
    `<a class="btn-m-outlined" href="${item.url}?lang=${lang}">${item.label}</a>`
  ).join('');

  container.innerHTML = `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__sections">${sectionsHtml}</div>
        <div class="footer__bottom">
          <nav class="footer__legal" aria-label="Legal">${legalHtml}</nav>
          <p class="footer__copyright">${data.copyright}</p>
        </div>
      </div>
    </footer>
  `;
}
