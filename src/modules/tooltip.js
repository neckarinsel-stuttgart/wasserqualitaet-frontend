export function tooltip(text, ariaLabel) {
  const base = import.meta.env.BASE_URL || '/';
  return `<button class="tooltip-btn" data-tooltip="${text}" aria-label="${ariaLabel}" type="button">
    <img src="${base}assets/icons/info-icon.svg" alt="" width="16" height="16">
  </button>`;
}
