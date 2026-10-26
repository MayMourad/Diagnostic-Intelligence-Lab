import test from 'node:test';
import assert from 'node:assert/strict';
import { allCases, CASE_IDS, DATASET } from '../js/data/cases.js';
import { deriveReference, planCase, DD } from '../js/lib/fundus.js';

test('teaching set has the declared size and unique ids', () => {
  assert.equal(CASE_IDS.length, DATASET.size);
  assert.equal(new Set(CASE_IDS).size, CASE_IDS.length);
});

test('every authored reference label is re-derived exactly from its own lesion list (ICDR + 4-2-1 rule)', () => {
  for (const c of allCases()) {
    if (c.ungradable) {
      assert.equal(c.lesions.length, 0, `${c.id} ungradable images carry no reference lesions`);
      continue;
    }
    const d = deriveReference(c.lesions);
    assert.equal(d.grade, c.reference.icdr, `${c.id} grade`);
    assert.equal(d.dme, c.reference.dme, `${c.id} dme`);
    assert.equal(d.referable, c.reference.referable, `${c.id} referable`);
  }
});

test('severe NPDR cases satisfy at least one 4-2-1 criterion and no PDR sign', () => {
  for (const c of allCases().filter((x) => x.reference.icdr === 3)) {
    const d = deriveReference(c.lesions);
    assert.ok(Object.values(d.rule421).some(Boolean), c.id);
    assert.equal(d.pdr, false, c.id);
  }
});

test('non-DME cases keep every hard exudate outside 1 DD of the macular centre', () => {
  for (const c of allCases().filter((x) => x.reference.icdr !== null && !x.reference.dme)) {
    for (const l of c.lesions.filter((x) => x.type === 'hard-exudate')) assert.ok(l.ddFromMacula > 1, `${c.id} ${l.id}`);
  }
});

test('the set mixes classes: referable, non-referable, ungradable and designed error traps', () => {
  const cs = allCases();
  assert.ok(cs.filter((c) => c.reference.referable === true).length >= 6);
  assert.ok(cs.filter((c) => c.reference.referable === false).length >= 6);
  assert.ok(cs.filter((c) => !c.reference.gradable).length >= 2);
  assert.ok(cs.some((c) => c.trap === 'false-negative'));
  assert.ok(cs.some((c) => c.trap === 'false-positive'));
});

test('planning is deterministic and lesions stay inside the field and away from the disc', () => {
  const a = planCase({ ...allCases()[5].plan.def });
  const b = planCase({ ...allCases()[5].plan.def });
  assert.deepEqual(a.lesions, b.lesions);
  for (const c of allCases()) {
    for (const l of c.lesions) {
      assert.ok(Math.hypot(l.x, l.y) < 0.99, `${c.id} ${l.id} inside field`);
      if (l.type !== 'neovascularization' && l.type !== 'artifact')
        assert.ok(Math.hypot(l.x - c.plan.disc.x, l.y - c.plan.disc.y) > DD * 0.5, `${c.id} ${l.id} off disc`);
    }
  }
});

test('optic disc is nasal: right eye disc on image right, left eye on image left', () => {
  for (const c of allCases()) assert.ok(c.eye === 'OD' ? c.plan.disc.x > 0 : c.plan.disc.x < 0, c.id);
});
