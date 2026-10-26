// Diagnostic-accuracy statistics. Pure functions, no DOM — unit-tested in tests/metrics.test.mjs.
// Convention everywhere: reference 1 = referable DR (positive), 0 = non-referable (negative);
// a case is predicted positive when score >= threshold.
import { mulberry32 } from './rng.js';

export function confusion(rows, threshold) {
  const cm = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const r of rows) {
    const pred = r.score >= threshold;
    if (r.reference === 1) pred ? cm.tp++ : cm.fn++;
    else pred ? cm.fp++ : cm.tn++;
  }
  return cm;
}

// Wilson score interval for a binomial proportion (95 % by default).
export function wilson(k, n, z = 1.959964) {
  if (n === 0) return { lo: null, hi: null };
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { lo: Math.max(0, (c - m) / d), hi: Math.min(1, (c + m) / d) };
}

const ratio = (k, n) => (n === 0 ? null : k / n);

export function rates(cm) {
  const { tp, fp, tn, fn } = cm;
  const pos = tp + fn;
  const neg = tn + fp;
  const n = pos + neg;
  const sens = ratio(tp, pos);
  const spec = ratio(tn, neg);
  const ppv = ratio(tp, tp + fp);
  const npv = ratio(tn, tn + fn);
  const f1 = tp + fp + fn === 0 ? null : (2 * tp) / (2 * tp + fp + fn);
  return {
    n, pos, neg, prevalence: ratio(pos, n),
    sensitivity: sens, specificity: spec, ppv, npv,
    accuracy: ratio(tp + tn, n),
    balancedAccuracy: sens === null || spec === null ? null : (sens + spec) / 2,
    f1,
    sensitivityCI: wilson(tp, pos),
    specificityCI: wilson(tn, neg),
  };
}

// Rank-based AUC (Mann–Whitney U, ties counted half). Returns null if a class is missing.
export function auc(rows) {
  const pos = rows.filter((r) => r.reference === 1).map((r) => r.score);
  const neg = rows.filter((r) => r.reference === 0).map((r) => r.score);
  if (!pos.length || !neg.length) return null;
  const sorted = rows.map((r) => ({ s: r.score, y: r.reference })).sort((a, b) => a.s - b.s);
  let rankSumPos = 0;
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].s === sorted[i].s) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) if (sorted[k].y === 1) rankSumPos += avgRank;
    i = j + 1;
  }
  return (rankSumPos - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length);
}

// ROC points from the most conservative threshold (nothing positive) to the most liberal.
export function rocPoints(rows) {
  const thresholds = [...new Set(rows.map((r) => r.score))].sort((a, b) => b - a);
  const pts = [{ threshold: Infinity, fpr: 0, tpr: 0 }];
  for (const t of thresholds) {
    const { sensitivity, specificity } = rates(confusion(rows, t));
    pts.push({ threshold: t, tpr: sensitivity ?? 0, fpr: specificity === null ? 0 : 1 - specificity });
  }
  return pts;
}

// Choose an operating threshold on development data only (never on the test partition).
//  strategy 'youden'      → maximise sensitivity + specificity − 1
//  strategy 'sensitivity' → highest specificity subject to sensitivity ≥ target
export function selectThreshold(devRows, { strategy = 'youden', target = 0.9 } = {}) {
  const cands = [...new Set(devRows.map((r) => r.score))].sort((a, b) => a - b);
  if (!cands.length) return null;
  let best = null;
  for (const t of cands) {
    const r = rates(confusion(devRows, t));
    if (r.sensitivity === null || r.specificity === null) continue;
    const j = r.sensitivity + r.specificity - 1;
    if (strategy === 'sensitivity') {
      if (r.sensitivity < target) continue;
      if (!best || r.specificity > best.specificity || (r.specificity === best.specificity && t > best.threshold))
        best = { threshold: t, sensitivity: r.sensitivity, specificity: r.specificity, youden: j };
    } else if (!best || j > best.youden) {
      best = { threshold: t, sensitivity: r.sensitivity, specificity: r.specificity, youden: j };
    }
  }
  return best;
}

const SPLITS = ['train', 'val', 'test'];

// Leakage and integrity checks on a predictions table.
export function checkIntegrity(rows) {
  const issues = [];
  const bySplit = Object.fromEntries(SPLITS.map((s) => [s, rows.filter((r) => r.split === s)]));
  const unknownSplit = rows.filter((r) => !SPLITS.includes(r.split)).length;
  if (unknownSplit) issues.push({ level: 'error', code: 'unknown-split', count: unknownSplit });

  const ids = new Map();
  for (const r of rows) ids.set(r.id, (ids.get(r.id) || 0) + 1);
  const dupIds = [...ids.values()].filter((c) => c > 1).length;
  if (dupIds) issues.push({ level: 'error', code: 'duplicate-id', count: dupIds });

  const missingPatient = rows.filter((r) => r.patient === '' || r.patient == null).length;
  if (missingPatient === rows.length && rows.length) issues.push({ level: 'warn', code: 'no-patient-ids', count: missingPatient });
  else if (missingPatient) issues.push({ level: 'warn', code: 'some-patient-ids-missing', count: missingPatient });

  const patientSplits = new Map();
  for (const r of rows) {
    if (r.patient === '' || r.patient == null) continue;
    if (!patientSplits.has(r.patient)) patientSplits.set(r.patient, new Set());
    patientSplits.get(r.patient).add(r.split);
  }
  const leaking = [...patientSplits.entries()].filter(([, s]) => s.size > 1);
  if (leaking.length) issues.push({ level: 'error', code: 'patient-leakage', count: leaking.length, examples: leaking.slice(0, 5).map(([p]) => p) });

  const badScore = rows.filter((r) => !Number.isFinite(r.score) || r.score < 0 || r.score > 1).length;
  if (badScore) issues.push({ level: 'error', code: 'score-out-of-range', count: badScore });
  const badRef = rows.filter((r) => r.reference !== 0 && r.reference !== 1).length;
  if (badRef) issues.push({ level: 'error', code: 'bad-reference', count: badRef });

  if (!bySplit.test.length) issues.push({ level: 'error', code: 'no-test-split', count: 0 });
  if (!bySplit.val.length && !bySplit.train.length) issues.push({ level: 'error', code: 'no-dev-split', count: 0 });
  else if (!bySplit.val.length) issues.push({ level: 'warn', code: 'threshold-from-train', count: bySplit.train.length });
  for (const s of SPLITS) {
    const part = bySplit[s];
    if (part.length && (!part.some((r) => r.reference === 1) || !part.some((r) => r.reference === 0)))
      issues.push({ level: s === 'test' ? 'error' : 'warn', code: 'single-class-split', split: s, count: part.length });
  }
  return { issues, sizes: Object.fromEntries(SPLITS.map((s) => [s, bySplit[s].length])), blocking: issues.some((i) => i.level === 'error') };
}

// Full held-out evaluation: threshold fixed on val (or train), reported on test.
export function evaluateHeldOut(rows, { strategy = 'youden', target = 0.9 } = {}) {
  const integrity = checkIntegrity(rows);
  if (integrity.blocking) return { ok: false, integrity };
  const dev = rows.filter((r) => r.split === 'val');
  const devSource = dev.length ? 'val' : 'train';
  const devRows = dev.length ? dev : rows.filter((r) => r.split === 'train');
  const sel = selectThreshold(devRows, { strategy, target });
  if (!sel) return { ok: false, integrity, reason: 'no-threshold' };
  const test = rows.filter((r) => r.split === 'test');
  const cm = confusion(test, sel.threshold);
  return {
    ok: true, integrity, strategy, target, devSource, selection: sel,
    threshold: sel.threshold, test, cm, rates: rates(cm), auc: auc(test),
    errors: {
      falseNegatives: test.filter((r) => r.reference === 1 && r.score < sel.threshold).sort((a, b) => a.score - b.score),
      falsePositives: test.filter((r) => r.reference === 0 && r.score >= sel.threshold).sort((a, b) => b.score - a.score),
    },
  };
}

// ---- parsing user-supplied predictions (CSV or JSON) -------------------------------------------
export function parsePredictions(text) {
  const src = String(text).trim();
  if (!src) throw new Error('empty');
  let meta = {};
  let table;
  if (src.startsWith('{') || src.startsWith('[')) {
    const j = JSON.parse(src);
    table = Array.isArray(j) ? j : j.rows;
    meta = Array.isArray(j) ? {} : j.meta || {};
    if (!Array.isArray(table)) throw new Error('no-rows');
  } else {
    const lines = src.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
    const head = splitCsv(lines[0]).map((h) => h.trim().toLowerCase());
    table = lines.slice(1).map((l) => Object.fromEntries(splitCsv(l).map((v, i) => [head[i], v.trim()])));
  }
  const rows = table.map((o, i) => {
    const get = (...keys) => { for (const k of keys) if (o[k] !== undefined) return o[k]; return undefined; };
    const refRaw = get('reference', 'label', 'y', 'truth');
    const patient = get('patient', 'patient_id', 'subject');
    return {
      id: String(get('id', 'image', 'image_id') ?? `row${i + 1}`),
      patient: patient === undefined || patient === null ? '' : String(patient),
      split: String(get('split', 'partition') ?? '').toLowerCase().replace('validation', 'val'),
      reference: refRaw === undefined ? NaN : Number(refRaw),
      score: Number(get('score', 'probability', 'p', 'prediction')),
    };
  });
  return { meta, rows };
}

function splitCsv(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// ---- educational simulator (clearly synthetic) ---------------------------------------------------
// Scores for negatives ~ N(0,1), positives ~ N(d',1), then squashed to (0,1). Nothing here is a model output.
export function simulateScores({ n = 400, prevalence = 0.2, dprime = 1.8, seed = 7 } = {}) {
  const rng = mulberry32(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const reference = rng() < prevalence ? 1 : 0;
    const z = rng.normal() + (reference ? dprime : 0);
    rows.push({ id: `sim-${i + 1}`, reference, score: 1 / (1 + Math.exp(-(z - dprime / 2) * 1.2)) });
  }
  return rows;
}

// Predictive values at a different prevalence, from sensitivity and specificity (Bayes).
export function predictiveValues(sens, spec, prevalence) {
  const tp = sens * prevalence;
  const fn = (1 - sens) * prevalence;
  const fp = (1 - spec) * (1 - prevalence);
  const tn = spec * (1 - prevalence);
  return { ppv: tp + fp === 0 ? null : tp / (tp + fp), npv: tn + fn === 0 ? null : tn / (tn + fn) };
}
