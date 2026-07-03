export function init(container, data) {
  container.innerHTML = `
    <section class="intro-faq">
        <h1 class="intro-faq__description">${data.description}</h1>
    </section>
  `;
}
