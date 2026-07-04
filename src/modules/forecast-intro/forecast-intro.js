const pinIcon = `${import.meta.env.BASE_URL}assets/icons/pin.svg`;

export function init(container, data) {
  container.innerHTML = `
    <section class="forecast-intro">
      <p class="forecast-intro__brand">${data.brand}</p>
      <p class="forecast-intro__tagline">
        ${data.tagline}
        <span class="forecast-intro__location">
          <img class="forecast-intro__pin" src="${pinIcon}" alt="">
          ${data.location}
        </span>
      </p>
      <p class="forecast-intro__credit">${data.creditPrefix ? `<span>${data.creditPrefix}</span> ` : ''}${data.creditUrl ? `<a href="${data.creditUrl}" target="_blank" rel="noopener">${data.credit}</a>` : data.credit}</p>
    </section>
  `;
}
