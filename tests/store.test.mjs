import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, derivedReferral, recordDuel, learnerStats, state, resetAll } from '../js/store.js';

const ref = (icdr, dme = false) => ({ gradable: true, icdr, dme, referable: icdr >= 2 || dme });
const UG = { gradable: false, icdr: null, dme: null, referable: null };
const I = (grade, dme = false) => ({ gradable: true, grade, dme });
const U = { gradable: false, grade: null, dme: null };

test('referral decision follows ICDR ≥ 2 or suspected DME', () => {
  assert.equal(derivedReferral(I(1)), 'routine');
  assert.equal(derivedReferral(I(1, true)), 'refer');
  assert.equal(derivedReferral(I(2)), 'refer');
  assert.equal(derivedReferral(U), 'ungradable');
});

test('outcome classification: TP, TN, FP, FN and the three ungradable outcomes', () => {
  assert.equal(classify(I(3), ref(3)), 'TP');
  assert.equal(classify(I(0), ref(0)), 'TN');
  assert.equal(classify(I(2), ref(1)), 'FP');
  assert.equal(classify(I(1), ref(2)), 'FN');
  assert.equal(classify(I(1, true), ref(1)), 'FP'); // suspected DME makes it a referral decision
  assert.equal(classify(U, UG), 'UG-correct');
  assert.equal(classify(I(2), UG), 'UG-overcall');
  assert.equal(classify(U, ref(2)), 'UG-missed');
});

test('learner statistics exclude practice-only cases and report intervals', () => {
  resetAll();
  recordDuel('C10', I(3), ref(3));
  recordDuel('C01', I(0), ref(0));
  recordDuel('C07', I(0), ref(2)); // FN
  state().studied.C06 = true; // reference opened first
  recordDuel('C06', I(2), ref(2)); // practice
  const s = learnerStats();
  assert.equal(s.n, 3);
  assert.equal(s.practice, 1);
  assert.equal(s.counts.FN, 1);
  assert.equal(s.sensitivity, 0.5);
  assert.equal(s.specificity, 1);
  assert.ok(s.sensCI.lo < 0.5 && s.sensCI.hi > 0.5);
  resetAll();
});
