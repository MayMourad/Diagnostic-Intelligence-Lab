// Tiny bilingual (English / Arabic, RTL) layer. Feature modules register their own dictionaries next to the code
// that uses them, so a string and its translation are always edited together. tests/i18n.test.mjs checks parity.
const dicts = { en: {}, ar: {} };
let lang = 'en';
const subs = new Set();
const missing = new Set();

export function register(bundle) {
  Object.assign(dicts.en, bundle.en || {});
  Object.assign(dicts.ar, bundle.ar || {});
}
export const dictionaries = dicts;
export const has = (key) => key in dicts.en;
export const getLang = () => lang;
export const dir = () => (lang === 'ar' ? 'rtl' : 'ltr');

export function t(key, vars) {
  let s = dicts[lang][key] ?? dicts.en[key];
  if (s === undefined) {
    if (!missing.has(key)) { missing.add(key); console.warn('[i18n] missing key:', key); }
    s = key;
  }
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
  return s;
}

export function setLang(next) {
  if (!dicts[next] || next === lang) return;
  lang = next;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
    document.documentElement.dir = dir();
  }
  subs.forEach((f) => f(next));
}
export function onLang(f) { subs.add(f); return () => subs.delete(f); }

// Localised number/date helpers. Clinical figures stay in Western digits in both languages on purpose
// (units and thresholds must read identically in a referral letter), so we only localise dates.
export const fmtPct = (v, d = 0) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(d)}%`);
export const fmtNum = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(d));
export function fmtDate(ts) {
  try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(ts); } catch { return new Date(ts).toISOString(); }
}
