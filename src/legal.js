export function contentBlocksHtml(content) {
  return content
    .map((block) => {
      if (block.type === 'ul') {
        return `<ul class="legal__list">${block.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
      }
      if (block.type === 'h3') {
        return `<h3 class="legal__subheading">${block.text}</h3>`;
      }
      return `<p>${block.text}</p>`;
    })
    .join('');
}

export function sectionsHtml(sections) {
  return sections
    .map(
      (section) => `
    <section class="legal__section">
      <h2 class="legal__heading">${section.heading}</h2>
      ${contentBlocksHtml(section.content)}
    </section>
  `
    )
    .join('');
}

export function introHtml(intro) {
  if (!intro) return '';
  if (Array.isArray(intro)) {
    return intro.map((p) => `<p class="legal__intro">${p}</p>`).join('');
  }
  return `<p class="legal__intro">${intro}</p>`;
}
