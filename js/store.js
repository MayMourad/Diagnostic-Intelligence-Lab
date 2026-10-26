// Local-only session store. Everything lives in this browser (localStorage, falling back to memory).
// Nothing is transmitted. Records concern synthetic teaching cases only and carry no patient identifiers.
import { wilson } from './lib/metrics.js';

const KEY = 'dil.v2';
let mem = null;
const subs = new Set();

const blank = () => ({
  lang: 'en',
  duels: {}, // caseId → duel attempt record (see recordDuel)
  studied: {}, // caseId → true when reference layers were opened before a locked interpretation
  review: {}, // caseId → { interp, approval }
  referrals: [], // approved referral letters
  events: [], // append-only local audit trail
});

function read() {
  if (mem) return mem;
  try { mem = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { mem = blank(); }
  return mem;
}
function write() {
  try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* private mode or quota: keep in memory only */ }
  subs.forEach((f) => f(mem));
}

export const state = () => read();
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export function update(fn) { fn(read()); write(); }
export function logEvent(type, caseId, detail = '') {
  update((s) => { s.events.push({ ts: Date.now(), type, caseId, detail }); if (s.events.length > 500) s.events.shift(); });
}
export function resetAll() { mem = blank(); write(); }

// --- duel -----------------------------------------------------------------------------------------
// A duel record is created when the visitor LOCKS an interpretation. `practice` is true when the
// reference layers had already been opened for that case, so it is excluded from the educational score.
export function derivedReferral(i) {
  if (!i.gradable) return 'ungradable';
  return i.grade >= 2 || i.dme ? 'refer' : 'routine';
}

export function classify(interp, ref) {
  if (!ref.gradable) return interp.gradable ? 'UG-overcall' : 'UG-correct'; // graded an image the reference excludes
  if (!interp.gradable) return 'UG-missed'; // called a gradable image ungradable
  const predRef = interp.grade >= 2 || interp.dme;
  if (ref.referable) return predRef ? 'TP' : 'FN';
  return predRef ? 'FP' : 'TN';
}

export function recordDuel(caseId, interp, ref) {
  const category = classify(interp, ref);
  const practice = !!read().studied[caseId];
  const rec = {
    caseId, ts: Date.now(), interp, practice, category,
    gradeExact: ref.gradable && interp.gradable ? interp.grade === ref.icdr : null,
    gradeError: ref.gradable && interp.gradable ? Math.abs(interp.grade - ref.icdr) : null,
    dmeCorrect: ref.gradable && interp.gradable ? interp.dme === ref.dme : null,
  };
  update((s) => { s.duels[caseId] = rec; });
  logEvent('duel-locked', caseId, `${category}${practice ? ' (practice)' : ''}`);
  return rec;
}

export function learnerStats() {
  const recs = Object.values(read().duels).filter((r) => !r.practice);
  const c = { TP: 0, FP: 0, TN: 0, FN: 0, 'UG-correct': 0, 'UG-missed': 0, 'UG-overcall': 0 };
  recs.forEach((r) => c[r.category]++);
  const pos = c.TP + c.FN;
  const neg = c.TN + c.FP;
  const graded = recs.filter((r) => r.gradeExact !== null);
  const ugRef = c['UG-correct'] + c['UG-overcall'];
  return {
    n: recs.length, counts: c,
    sensitivity: pos ? c.TP / pos : null, specificity: neg ? c.TN / neg : null,
    sensCI: wilson(c.TP, pos), specCI: wilson(c.TN, neg),
    referralAccuracy: pos + neg ? (c.TP + c.TN) / (pos + neg) : null,
    exactGrade: graded.length ? graded.filter((r) => r.gradeExact).length / graded.length : null,
    meanGradeError: graded.length ? graded.reduce((a, r) => a + r.gradeError, 0) / graded.length : null,
    ungradableRecognised: ugRef ? c['UG-correct'] / ugRef : null,
    practice: Object.values(read().duels).filter((r) => r.practice).length,
  };
}
