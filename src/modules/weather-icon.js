export const iconBase = `${import.meta.env.BASE_URL}assets/icons/weather-icons/`;

export function wmoIcon(code) {
  if (code == null) return null;
  if (code <= 1) return 'clear';
  if (code <= 2) return 'partly-cloudy';
  if (code <= 3) return 'cloudy';
  if (code <= 49) return 'cloudy';
  if (code <= 67) return 'rain';
  if (code <= 79) return 'cloudy';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'cloudy';
  if (code <= 99) return 'rain';
  return 'cloudy';
}
