import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getConsentManager, showConsentManager } from '../../consent/index.js';

function pinIcon(number, active) {
  return L.divIcon({
    // L.divIcon's `className` option replaces (not appends to) its default
    // 'leaflet-div-icon', so that class has to be added back explicitly for
    // the `.locations__pin.leaflet-div-icon` override to ever match.
    className: `locations__pin leaflet-div-icon${active ? ' locations__pin--active' : ''}`,
    html: `
      <svg class="locations__pin-shape" viewBox="0 0 28 36">
        <path d="M14 35C14 35 26 22.4 26 13.5 26 6.6 20.6 1 14 1S2 6.6 2 13.5C2 22.4 14 35 14 35Z"/>
      </svg>
      <span>${number}</span>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
  });
}

function placeholderHtml(loadLabel, hint, settingsLabel) {
  return `
    <div class="locations__placeholder">
      <div class="locations__placeholder-bg"></div>
      <p class="locations__consent-hint">
        <span>${hint}</span><br>
        <button type="button" class="locations__consent-settings">${settingsLabel}</button>
      </p>
      <button type="button" class="locations__load-btn">${loadLabel}</button>
    </div>
  `;
}

// Gates a panel's content behind Klaro consent for `serviceName`. Calls
// onGranted() the moment consent becomes true, whether that happened via
// this panel's own load button, the sitewide banner, or the consent modal.
function wireConsentGate(panel, serviceName, onGranted) {
  const manager = getConsentManager();
  const placeholder = panel.querySelector('.locations__placeholder');
  const loadBtn = panel.querySelector('.locations__load-btn');
  const settingsBtn = panel.querySelector('.locations__consent-settings');

  let granted = false;
  const reveal = () => {
    if (granted) return;
    granted = true;
    placeholder.hidden = true;
    onGranted();
  };

  if (manager.getConsent(serviceName)) reveal();

  loadBtn.addEventListener('click', () => {
    manager.updateConsent(serviceName, true);
    manager.saveAndApplyConsents();
  });

  settingsBtn.addEventListener('click', () => showConsentManager());

  // Listen for 'saveConsents' rather than 'consents': the latter fires on every
  // switch toggle inside Klaro's modal, before the user confirms via its save/
  // accept button, which would load the service ahead of actual consent.
  manager.watch({
    update(_manager, eventType, data) {
      if (eventType === 'saveConsents' && data.consents[serviceName]) reveal();
    },
  });
}

function initMap(panel, locations) {
  const mapEl = panel.querySelector('.locations__map');
  const chipsEl = panel.querySelector('.locations__chips');
  mapEl.hidden = false;
  chipsEl.hidden = false;

  const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: false }).setView(
    [Number(locations[0].lat), Number(locations[0].long)],
    13
  );

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    detectRetina: true,
  }).addTo(map);

  const markers = locations.map((loc, i) =>
    L.marker([Number(loc.lat), Number(loc.long)], { icon: pinIcon(i + 1, i === 0) }).addTo(map)
  );

  const chips = [...chipsEl.querySelectorAll('.locations__chip')];

  const setActiveLocation = (index) => {
    chips.forEach((chip, i) => chip.classList.toggle('locations__chip--active', i === index));
    markers.forEach((marker, i) => marker.setIcon(pinIcon(i + 1, i === index)));
    const loc = locations[index];
    map.flyTo([Number(loc.lat), Number(loc.long)], 15);
  };

  chips.forEach((chip, i) => chip.addEventListener('click', () => setActiveLocation(i)));

  new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
}

function initShipTraffic(panel, shiptraffic) {
  const shipEl = panel.querySelector('.locations__ship');
  shipEl.hidden = false;

  // Vesselfinder's official embed snippet uses document.write, which browsers
  // block for scripts injected after page load — exactly our consent-gated
  // case. The widget is itself just an iframe onto this URL, so build that
  // directly instead.
  const params = new URLSearchParams({
    zoom: shiptraffic.zoom,
    lat: shiptraffic.lat,
    lon: shiptraffic.long,
    names: 'true',
  });

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.vesselfinder.com/aismap?${params}`;
  iframe.title = shiptraffic.title;
  iframe.loading = 'lazy';

  shipEl.appendChild(iframe);
}

export function init(container, data) {
  const chipsHtml = data.map
    .map(
      (loc, i) => `
    <button type="button" class="locations__chip${i === 0 ? ' locations__chip--active' : ''}">
      <span class="locations__chip-number">${i + 1}</span>
      <span class="locations__chip-title">${loc.title}</span>
    </button>
  `
    )
    .join('');

  container.innerHTML = `
    <section class="locations">
      <h2 class="locations__title">${data.title}</h2>
      <div class="locations__panels">
        <div class="locations__panel" data-panel="map">
          <button type="button" class="locations__expand-overlay" aria-label="${data.mapLabel}"></button>
          <span class="locations__badge">${data.mapLabel}</span>
          ${placeholderHtml(data.loadMapLabel, data.consentHint, data.consentSettingsLabel)}
          <div class="locations__map" hidden></div>
          <div class="locations__chips" hidden>${chipsHtml}</div>
        </div>
        <div class="locations__panel" data-panel="ship">
          <button type="button" class="locations__expand-overlay" aria-label="${data.shiptraffic.title}"></button>
          <span class="locations__badge">${data.shiptraffic.title}</span>
          ${placeholderHtml(data.loadShipLabel, data.consentHint, data.consentSettingsLabel)}
          <div class="locations__ship" hidden></div>
        </div>
      </div>
    </section>
  `;

  const panels = [...container.querySelectorAll('.locations__panel')];
  const mapPanel = container.querySelector('[data-panel="map"]');
  const shipPanel = container.querySelector('[data-panel="ship"]');

  const setActivePanel = (activeEl) => {
    panels.forEach((panel) => {
      const isActive = panel === activeEl;
      panel.classList.toggle('locations__panel--active', isActive);
      panel.classList.toggle('locations__panel--minimized', !isActive);
      panel.querySelector('.locations__expand-overlay').hidden = isActive;
    });
  };

  panels.forEach((panel) => {
    panel
      .querySelector('.locations__expand-overlay')
      .addEventListener('click', () => setActivePanel(panel));
  });

  setActivePanel(mapPanel);

  wireConsentGate(mapPanel, 'openstreetmap', () => initMap(mapPanel, data.map));
  wireConsentGate(shipPanel, 'vesselfinder', () => initShipTraffic(shipPanel, data.shiptraffic));
}
