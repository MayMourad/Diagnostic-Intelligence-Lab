import test from 'node:test';
import assert from 'node:assert/strict';
import {
  confusion, rates, wilson, auc, rocPoints, selectThreshold, checkIntegrity, evaluateHeldOut,
  parsePredictions, simulateScores, predictiveValues,
} from '../js/lib/metrics.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('confusion matrix and rates on a hand-checked table', () => {
  const rows = [
    { reference: 1, score: 0.9 }, { reference: 1, score: 0.8 }, { reference: 1, score: 0.4 }, { reference: 1, score: 0.2 },
    { reference: 0, score: 0.6 }, { reference: 0, score: 0.3 }, { reference: 0, score: 0.1 }, { reference: 0, score: 0.05 },
    { reference: 0, score: 0.02 }, { reference: 0, score: 0.01 },
  ];
  const cm = confusion(rows, 0.5);
  assert.deepEqual(cm, { tp: 2, fn: 2, fp: 1, tn: 5 });
  const r = rates(cm);
  close(r.sensitivity, 0.5);
  close(r.specificity, 5 / 6);
  close(r.ppv, 2 / 3);
  close(r.npv, 5 / 7);
  close(r.accuracy, 0.7);
  close(r.balancedAccuracy, (0.5 + 5 / 6) / 2);
});

test('threshold is inclusive (score ≥ t is positive)', () => {
  assert.equal(confusion([{ reference: 1, score: 0.5 }], 0.5).tp, 1);
});

test('wilson interval matches known values', () => {
  const w = wilson(8, 10);
  close(w.lo, 0.4902, 5e-4);
  close(w.hi, 0.9433, 5e-4);
  assert.deepEqual(wilson(0, 0), { lo: null, hi: null });
  assert.ok(wilson(0, 10).lo === 0);
});

test('AUC: perfect, inverted, tied and known value', () => {
  assert.equal(auc([{ reference: 1, score: 0.9 }, { reference: 0, score: 0.1 }]), 1);
  assert.equal(auc([{ reference: 1, score: 0.1 }, { reference: 0, score: 0.9 }]), 0);
  assert.equal(auc([{ reference: 1, score: 0.5 }, { reference: 0, score: 0.5 }]), 0.5);
  assert.equal(auc([{ reference: 1, score: 1 }]), null);
  // 3 positives, 3 negatives; concordant pairs = 7 of 9
  const rows = [
    { reference: 1, score: 0.9 }, { reference: 1, score: 0.7 }, { reference: 1, score: 0.35 },
    { reference: 0, score: 0.8 }, { reference: 0, score: 0.3 }, { reference: 0, score: 0.2 },
  ];
  close(auc(rows), 7 / 9);
});

test('ROC points are monotone and end at (1,1)', () => {
  const pts = rocPoints(simulateScores({ n: 300, seed: 3 }));
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].fpr >= pts[i - 1].fpr - 1e-12);
    assert.ok(pts[i].tpr >= pts[i - 1].tpr - 1e-12);
  }
  close(pts.at(-1).fpr, 1);
  close(pts.at(-1).tpr, 1);
});

test('threshold selection: youden and sensitivity-target strategies', () => {
  const dev = [
    { reference: 1, score: 0.9 }, { reference: 1, score: 0.7 }, { reference: 1, score: 0.45 }, { reference: 1, score: 0.3 },
    { reference: 0, score: 0.6 }, { reference: 0, score: 0.4 }, { reference: 0, score: 0.2 }, { reference: 0, score: 0.1 },
  ];
  const y = selectThreshold(dev, { strategy: 'youden' });
  assert.ok(y.youden > 0.4);
  const s = selectThreshold(dev, { strategy: 'sensitivity', target: 1 });
  assert.equal(s.threshold, 0.3);
  assert.equal(s.sensitivity, 1);
  assert.equal(selectThreshold([], {}), null);
});

const mk = (id, patient, split, reference, score) => ({ id, patient, split, reference, score });

test('integrity checks catch patient-level leakage, duplicate ids and missing test split', () => {
  const rows = [
    mk('a', 'p1', 'train', 1, 0.9), mk('b', 'p1', 'test', 1, 0.8), // p1 leaks train→test
    mk('c', 'p2', 'val', 0, 0.1), mk('c', 'p3', 'test', 0, 0.2), // duplicate id
  ];
  const r = checkIntegrity(rows);
  const codes = r.issues.map((i) => i.code);
  assert.ok(codes.includes('patient-leakage'));
  assert.ok(codes.includes('duplicate-id'));
  assert.ok(r.blocking);
  assert.ok(checkIntegrity([mk('a', 'p1', 'train', 1, 0.9), mk('b', 'p2', 'val', 0, 0.1)]).issues.some((i) => i.code === 'no-test-split'));
});

test('missing patient ids are a warning, not silent', () => {
  const rows = [mk('a', '', 'val', 1, 0.9), mk('b', '', 'val', 0, 0.1), mk('c', '', 'test', 1, 0.9), mk('d', '', 'test', 0, 0.1)];
  assert.ok(checkIntegrity(rows).issues.some((i) => i.code === 'no-patient-ids' && i.level === 'warn'));
});

test('held-out evaluation fixes the threshold on validation only and applies it to test', () => {
  const rows = [];
  // validation: perfectly separable at 0.5 → threshold chosen near 0.5-ish boundary
  for (let i = 0; i < 20; i++) rows.push(mk(`v${i}`, `pv${i}`, 'val', i < 10 ? 1 : 0, i < 10 ? 0.6 + i * 0.03 : 0.1 + i * 0.01));
  // test: includes one false negative and one false positive relative to that threshold
  const t = [[1, 0.9], [1, 0.8], [1, 0.7], [1, 0.2], [0, 0.1], [0, 0.15], [0, 0.65], [0, 0.05]];
  t.forEach(([y, s], i) => rows.push(mk(`t${i}`, `pt${i}`, 'test', y, s)));
  const ev = evaluateHeldOut(rows);
  assert.ok(ev.ok);
  assert.equal(ev.devSource, 'val');
  assert.equal(ev.cm.tp + ev.cm.fn, 4);
  assert.equal(ev.errors.falseNegatives.length, ev.cm.fn);
  assert.equal(ev.errors.falsePositives.length, ev.cm.fp);
  assert.equal(ev.cm.fn, 1);
  assert.equal(ev.cm.fp, 1);
  // changing test labels must not move the threshold
  const rows2 = rows.map((r) => (r.split === 'test' ? { ...r, reference: 1 - r.reference } : r));
  assert.equal(evaluateHeldOut(rows2).threshold, ev.threshold);
});

test('evaluation refuses to report when integrity fails', () => {
  const ev = evaluateHeldOut([mk('a', 'p', 'train', 1, 0.9), mk('b', 'p', 'test', 0, 0.1)]);
  assert.equal(ev.ok, false);
});

test('parsePredictions reads CSV and JSON, normalising split names', () => {
  const csv = 'id,patient_id,split,reference,score\nimg1,p1,validation,1,0.91\n"img,2",p2,TEST,0,0.12\n';
  const { rows } = parsePredictions(csv);
  assert.equal(rows[0].split, 'val');
  assert.equal(rows[1].id, 'img,2');
  assert.equal(rows[1].split, 'test');
  assert.equal(rows[1].score, 0.12);
  const j = parsePredictions(JSON.stringify({ meta: { model: 'x' }, rows: [{ id: 1, patient: 'a', split: 'test', reference: 1, score: 0.5 }] }));
  assert.equal(j.meta.model, 'x');
  assert.equal(j.rows[0].reference, 1);
  assert.throws(() => parsePredictions('   '));
});

test('simulator is deterministic and respects prevalence roughly', () => {
  const a = simulateScores({ n: 2000, prevalence: 0.3, dprime: 2, seed: 11 });
  const b = simulateScores({ n: 2000, prevalence: 0.3, dprime: 2, seed: 11 });
  assert.deepEqual(a, b);
  const prev = a.filter((r) => r.reference === 1).length / a.length;
  assert.ok(Math.abs(prev - 0.3) < 0.04);
  // higher separation → higher AUC
  assert.ok(auc(simulateScores({ n: 2000, dprime: 3, seed: 2 })) > auc(simulateScores({ n: 2000, dprime: 1, seed: 2 })));
});

test('predictive values follow Bayes: same test, lower prevalence → lower PPV', () => {
  const hi = predictiveValues(0.9, 0.9, 0.3);
  const lo = predictiveValues(0.9, 0.9, 0.05);
  assert.ok(lo.ppv < hi.ppv);
  assert.ok(lo.npv > hi.npv);
  close(hi.ppv, (0.9 * 0.3) / (0.9 * 0.3 + 0.1 * 0.7));
});
