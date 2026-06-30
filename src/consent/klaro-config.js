// Klaro consent config. Add new third-party services/purposes here as the
// site grows (analytics, marketing cookies, etc.) — everything else in the
// app reads consent state through the shared manager in ./index.js.
// Translations are loaded at runtime from public/modules/consent/consent-{lang}.json.
export function createKlaroConfig(lang, translations) {
  return {
    version: 1,
    lang,
    elementID: 'klaro',
    styling: { theme: ['light', 'bottom', 'wide'] },
    noAutoLoad: false,
    htmlTexts: true,
    groupByPurpose: true,
    storageMethod: 'cookie',
    cookieName: 'klaro',
    cookieExpiresAfterDays: 365,
    default: false,
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,

    services: [
      {
        name: 'klaro',
        purposes: ['necessary'],
        required: true,
      },
      {
        // Placeholder — wire up an actual analytics service here once decided.
        name: 'statistics',
        purposes: ['analytics'],
        default: false,
        required: false,
      },
      {
        name: 'openstreetmap',
        purposes: ['content'],
        default: false,
        required: false,
      },
      {
        name: 'vesselfinder',
        purposes: ['content'],
        default: false,
        required: false,
      },
    ],

    translations: { [lang]: translations },
  };
}
