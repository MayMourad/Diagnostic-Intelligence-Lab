// DIL-TS v0 — the authored teaching set (16 synthetic cases).
// These are SYNTHETIC teaching illustrations rendered by js/lib/fundus-paint.js. They are not patient images,
// not drawn from any research dataset, and carry no dataset-expert grades. `reference` is the label that
// the authored lesions imply under the ICDR scale; tests/cases.test.mjs re-derives it from the lesion list.
// To use a real dataset later, add a loader that returns the same shape (see docs/EVALUATION_PROTOCOL.md).
import { planCase } from '../lib/fundus.js';

const q = (o) => ({ blur: 0.8, bright: 1, haze: 0, occlusion: 0, noise: 3, pigment: 'typical', illum: 0.15, ...o });

export const DATASET = {
  id: 'DIL-TS-v0',
  name: 'Diagnostic Intelligence Lab teaching set v0',
  kind: 'synthetic-teaching-illustrations',
  size: 16,
  task: 'Referable diabetic retinopathy (ICDR ≥ moderate NPDR, or suspected DME)',
  referenceStandard: 'Authored by construction from the lesion list under the ICDR 5-level scale; not an independent expert panel',
  patientLevel: false,
};

export const CASE_DEFS = [
  { id: 'C01', seed: 1101, eye: 'OD', icdr: 0, dme: false, imaging: q({}), findings: {}, trap: null },
  { id: 'C02', seed: 1202, eye: 'OS', icdr: 0, dme: false, imaging: q({ illum: 0.25 }), findings: { reflex: true }, trap: 'false-positive' },
  { id: 'C03', seed: 1303, eye: 'OD', icdr: 0, dme: false, imaging: q({ pigment: 'dark' }), findings: {}, trap: null },
  { id: 'C04', seed: 1404, eye: 'OS', icdr: 1, dme: false, imaging: q({}), findings: { ma: { n: 4 } }, trap: null },
  { id: 'C05', seed: 1505, eye: 'OD', icdr: 1, dme: false, imaging: q({ pigment: 'pale' }), findings: { ma: { n: 6, rMax: 0.5 } }, trap: 'false-positive' },
  { id: 'C06', seed: 1606, eye: 'OS', icdr: 2, dme: false, imaging: q({}), findings: { ma: { n: 11 }, hem: { n: 6 }, exudates: 1 }, trap: null },
  { id: 'C07', seed: 1707, eye: 'OD', icdr: 2, dme: false, imaging: q({ blur: 1.6 }), findings: { ma: { n: 4, rMin: 0.45, rMax: 0.7 }, hem: { n: 2, rMin: 0.5, rMax: 0.75, blot: 0 } }, trap: 'false-negative' },
  { id: 'C08', seed: 1808, eye: 'OS', icdr: 2, dme: true, imaging: q({}), findings: { ma: { n: 7 }, hem: { n: 3 }, dme: true }, trap: null },
  { id: 'C09', seed: 1909, eye: 'OD', icdr: 2, dme: false, imaging: q({ pigment: 'dark', illum: 0.3 }), findings: { ma: { n: 9 }, hem: { n: 5 }, exudates: 2, cws: 2 }, trap: null },
  { id: 'C10', seed: 2010, eye: 'OS', icdr: 3, dme: false, imaging: q({}), findings: { ma: { n: 12 }, hemPerQuadrant: 22, beading: ['ST', 'IT'], irma: ['IN'], cws: 2 }, trap: null },
  { id: 'C11', seed: 2111, eye: 'OD', icdr: 3, dme: false, imaging: q({ pigment: 'pale' }), findings: { ma: { n: 10 }, hem: { n: 10 }, beading: ['ST', 'SN', 'IT'], irma: ['IT', 'SN'] }, trap: 'false-negative' },
  { id: 'C12', seed: 2212, eye: 'OD', icdr: 4, dme: false, imaging: q({}), findings: { ma: { n: 10 }, hem: { n: 14 }, beading: ['IT', 'ST'], nvd: true, exudates: 1 }, trap: null },
  { id: 'C13', seed: 2313, eye: 'OS', icdr: 4, dme: false, imaging: q({ illum: 0.3 }), findings: { ma: { n: 9 }, hem: { n: 9 }, nve: 'IT', preretinal: 'ST', exudates: 1 }, trap: null },
  { id: 'C14', seed: 2414, eye: 'OD', icdr: null, dme: false, ungradable: true, imaging: q({ blur: 13, bright: 0.72, haze: 0.38, noise: 5 }), findings: {}, trap: 'ungradable' },
  { id: 'C15', seed: 2515, eye: 'OS', icdr: null, dme: false, ungradable: true, imaging: q({ blur: 3, bright: 0.38, occlusion: 0.34, illum: 0.45 }), findings: {}, trap: 'ungradable' },
  { id: 'C16', seed: 2616, eye: 'OS', icdr: 0, dme: false, imaging: q({ blur: 3.4, bright: 0.78, illum: 0.4 }), findings: {}, trap: 'borderline-quality' },
];

const cache = new Map();

// Case = definition + deterministic plan + authored reference label.
export function getCase(id) {
  if (!cache.has(id)) {
    const def = CASE_DEFS.find((c) => c.id === id);
    if (!def) return null;
    const plan = planCase(def);
    cache.set(id, {
      id,
      eye: def.eye,
      seed: def.seed,
      ungradable: !!def.ungradable,
      trap: def.trap,
      imaging: def.imaging,
      plan,
      lesions: plan.lesions,
      reference: def.ungradable
        ? { gradable: false, icdr: null, dme: null, referable: null }
        : { gradable: true, icdr: def.icdr, dme: def.dme, referable: def.icdr >= 2 || def.dme },
    });
  }
  return cache.get(id);
}

export const CASE_IDS = CASE_DEFS.map((c) => c.id);
export const allCases = () => CASE_IDS.map(getCase);
