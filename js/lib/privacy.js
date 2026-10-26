// Free-text safeguard: flags strings that look like personal identifiers so they are not entered into notes or letters.
// Pattern-based and deliberately conservative; it cannot detect names. Pure — unit-tested.
const RULES = [
  ['email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ['emirates-id', /\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/],
  ['phone', /(?:\+|00)?\d[\d\s().-]{8,}\d/],
  ['long-number', /\b\d{8,}\b/],
  ['date-of-birth', /\b(?:dob|d\.o\.b|born)\b[^.\n]{0,20}\d/i],
  ['mrn', /\b(?:mrn|medical record|file no|patient id)\b[^.\n]{0,12}[:#]?\s*[A-Z0-9-]{4,}/i],
];
export function scanIdentifiers(text) {
  const found = [];
  const s = String(text || '');
  for (const [kind, re] of RULES) { const m = s.match(re); if (m) found.push({ kind, sample: m[0].slice(0, 24) }); }
  return found;
}
