import * as klaro from 'klaro';
import { createKlaroConfig } from './klaro-config.js';

let manager;

// Sets up the sitewide consent banner/modal once. Any module can then read
// or react to consent via getConsentManager()/showConsentManager().
export async function initConsent(lang) {
  const translations = await fetch(`${import.meta.env.BASE_URL}modules/consent/consent-${lang}.json`).then(r => r.json());
  const config = createKlaroConfig(lang, translations);
  klaro.setup(config);
  manager = klaro.getManager(config);
  return manager;
}

export function getConsentManager() {
  return manager;
}

export function showConsentManager() {
  klaro.show(undefined, true);
}
