// Single source of truth for naming. The title is TEMPORARY: change `name`/`short` here (and nowhere else) when a final
// brand is chosen. The mark below is deliberately generic — a reticle, a scale and one flagged finding — so it does not
// depend on any one medical specialty or on the words of the name.
export const BRAND = {
  name: 'Diagnostic Intelligence Lab',
  nameAr: 'مختبر الذكاء التشخيصي',
  short: 'Diagnostic Lab',
  shortAr: 'المختبر التشخيصي',
  provisional: true,
  school: 'ADNOC Schools — Madinat Zayed',
  schoolAr: 'مدارس أدنوك — مدينة زايد',
  students: [
    { name: 'May Ahmed Mourad', nameAr: 'مي أحمد مراد', grade: 'G12' },
    { name: 'Shamsa Faris Almazrouei', nameAr: 'شمسة فارس المزروعي', grade: 'G12' },
    { name: 'Fatima Mohamed Almazrouei', nameAr: 'فاطمة محمد المزروعي', grade: 'G11' },
  ],
  version: '0.2.0',
};

// Reticle mark. `currentColor` for strokes so it inherits theme; the "finding" dot uses --accent.
export function markSVG(size = 28) {
  return `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    <circle cx="16" cy="16" r="11.5" stroke="currentColor" stroke-width="1.25"/>
    <path d="M16 9.5a6.5 6.5 0 1 0 6.5 6.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
    <path d="M1.5 16h5M25.5 16h5M16 1.5v5M16 25.5v5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".55"/>
    <circle cx="23.2" cy="8.8" r="2.1" fill="var(--accent, #4A9A92)"/>
  </svg>`;
}
