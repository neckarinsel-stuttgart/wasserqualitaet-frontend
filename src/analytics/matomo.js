import { getConsentManager } from '../consent/index.js';

const MATOMO_URL = import.meta.env.VITE_MATOMO_URL;
const SITE_ID = import.meta.env.VITE_MATOMO_SITE_ID;

let loaded = false;

function track() {
  if (loaded) {
    window._paq.push(['setConsentGiven']);
    return;
  }
  window._paq = window._paq || [];
  window._paq.push(['setTrackerUrl', MATOMO_URL + 'matomo.php']);
  window._paq.push(['setSiteId', SITE_ID]);
  window._paq.push(['trackPageView']);
  window._paq.push(['enableLinkTracking']);
  const s = document.createElement('script');
  s.async = true;
  s.src = MATOMO_URL + 'matomo.js';
  document.head.appendChild(s);
  loaded = true;
}

function optOut() {
  if (!loaded) return;
  window._paq.push(['optUserOut']);
}

export function initMatomo() {
  if (!MATOMO_URL || !SITE_ID) return;
  const manager = getConsentManager();
  if (manager.getConsent('matomo')) track();
  manager.watch({
    update(_manager, eventType, data) {
      if (eventType !== 'saveConsents') return;
      data.consents.matomo ? track() : optOut();
    },
  });
}
