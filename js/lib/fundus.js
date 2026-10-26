// Teaching-set planner: turns an authored case definition into vessel geometry and a lesion list.
// Pure and deterministic (no DOM). The lesion list is BOTH what the painter draws into the image AND the
// reference annotation layer — so the annotations are exact by construction and are never model output.
// Coordinates: field circle radius = 1, origin = image centre, +x right, +y down.
import { mulberry32 } from './rng.js';

export const DD = 0.17; // optic-disc diameter in field-radius units; distances are reported in "disc diameters" (DD)

export const quadrantOf = (x, y, s) => (y < 0 ? 'S' : 'I') + (x * s > 0 ? 'N' : 'T'); // S/I = superior/inferior, N/T = nasal/temporal
export const QUADRANTS = ['ST', 'SN', 'IT', 'IN'];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function bezier(p0, c, p1, n, rng, wobble) {
  const pts = [];
  const ph = rng.range(0, 6.28);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x;
    const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y;
    const dx = 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x);
    const dy = 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y);
    const L = Math.hypot(dx, dy) || 1;
    const w = Math.sin(t * 9 + ph) * wobble * Math.sin(Math.PI * t);
    pts.push({ x: x - (dy / L) * w, y: y + (dx / L) * w });
  }
  return pts;
}

function withWidth(pts, w0, taper) {
  return pts.map((p, i) => ({ ...p, w: w0 * (1 - taper * (i / (pts.length - 1))) }));
}

function buildVessels(rng, s, disc) {
  const arcades = [
    { q: 'ST', end: { x: -s * 0.86, y: -0.42 }, ctl: { x: s * 0.3, y: -0.84 } },
    { q: 'IT', end: { x: -s * 0.86, y: 0.5 }, ctl: { x: s * 0.3, y: 0.86 } },
    { q: 'SN', end: { x: s * 0.82, y: -0.4 }, ctl: { x: s * 0.46, y: -0.5 } },
    { q: 'IN', end: { x: s * 0.82, y: 0.42 }, ctl: { x: s * 0.46, y: 0.52 } },
  ];
  const vessels = [];
  const grow = (start, heading, len, w, kind, depth, q) => {
    const pts = [];
    let p = { ...start };
    let h = heading;
    const step = 0.012;
    const n = Math.round(len / step);
    for (let i = 0; i < n; i++) {
      pts.push({ ...p, w: w * (1 - 0.55 * (i / n)) });
      h += rng.range(-0.09, 0.09);
      p = { x: p.x + Math.cos(h) * step, y: p.y + Math.sin(h) * step };
      if (Math.hypot(p.x, p.y) > 0.9) break;
    }
    if (pts.length < 6) return;
    vessels.push({ kind, depth, q, pts });
    if (depth < 2) {
      const k = depth === 0 ? rng.int(2, 3) : rng.int(0, 2);
      for (let b = 0; b < k; b++) {
        const at = pts[Math.floor(rng.range(0.3, 0.8) * (pts.length - 1))];
        const side = rng.pick([-1, 1]);
        grow(at, h + side * rng.range(0.5, 1.0), len * rng.range(0.4, 0.65), w * 0.55, kind, depth + 1, q);
      }
    }
  };
  for (const a of arcades) {
    for (const kind of ['vein', 'artery']) {
      const off = kind === 'vein' ? 0.022 : -0.012;
      const sgn = a.q[0] === 'S' ? -1 : 1;
      const end = { x: a.end.x, y: a.end.y + sgn * off * 1.3 };
      const ctl = { x: a.ctl.x, y: a.ctl.y + sgn * off };
      const start = { x: disc.x, y: disc.y + (kind === 'vein' ? 0.012 : -0.012) * sgn * -1 };
      const pts = withWidth(bezier(start, ctl, end, 70, rng, 0.012), kind === 'vein' ? 0.0125 : 0.0085, 0.55);
      vessels.push({ kind, depth: 0, q: a.q, main: true, pts });
      // branches grown off the main trunk
      const nb = rng.int(3, 4);
      for (let b = 0; b < nb; b++) {
        const i = Math.floor(rng.range(0.22, 0.8) * (pts.length - 2));
        const a0 = pts[i];
        const a1 = pts[i + 1];
        const hd = Math.atan2(a1.y - a0.y, a1.x - a0.x) + rng.pick([-1, 1]) * rng.range(0.55, 1.05);
        grow(a0, hd, rng.range(0.16, 0.32), a0.w * 0.6, kind, 1, a.q);
      }
    }
  }
  return vessels;
}

// ---- lesion construction ---------------------------------------------------------------------------
class Builder {
  constructor(rng, s, disc, macula, vessels) {
    Object.assign(this, { rng, s, disc, macula, vessels });
    this.lesions = [];
  }
  point(quadrant, rMin = 0.1, rMax = 0.86, bias = 0.8) {
    const { rng, s, disc } = this;
    for (let k = 0; k < 400; k++) {
      const r = Math.pow(rng(), bias) * (rMax - rMin) + rMin;
      const a = rng.range(0, Math.PI / 2);
      let x = Math.cos(a) * r;
      let y = Math.sin(a) * r;
      const q = quadrant || rng.pick(QUADRANTS);
      x = q[1] === 'N' ? x * s : -x * s;
      y = q[0] === 'S' ? -y : y;
      if (dist({ x, y }, disc) < DD * 0.8) continue;
      if (Math.hypot(x, y) > rMax) continue;
      return { x, y };
    }
    return { x: 0.3, y: 0.3 };
  }
  add(type, o) {
    const id = `${type.slice(0, 2).toUpperCase()}${String(this.lesions.filter((l) => l.type === type).length + 1).padStart(2, '0')}`;
    const q = quadrantOf(o.x, o.y, this.s);
    const dm = dist(o, this.macula);
    const zone = dm <= DD ? 'macular' : dm <= DD * 3 ? 'perimacular' : 'peripheral';
    const l = { id, type, quadrant: q, zone, ddFromMacula: +(dm / DD).toFixed(2), ...o };
    this.lesions.push(l);
    return l;
  }
  ma(n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const p = this.point(opts.quadrant, opts.rMin ?? 0.12, opts.rMax ?? 0.6, 0.9);
      this.add('ma', { ...p, r: this.rng.range(0.0048, 0.0075) });
    }
  }
  hem(n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const p = this.point(opts.quadrant, opts.rMin ?? 0.14, opts.rMax ?? 0.82, 0.85);
      const blot = this.rng() < (opts.blot ?? 0.35);
      this.add('hemorrhage', { ...p, r: blot ? this.rng.range(0.012, 0.024) : this.rng.range(0.0075, 0.0115), shape: blot ? 'blot' : 'dot' });
    }
  }
  exudates(clusters, opts = {}) {
    for (let c = 0; c < clusters; c++) {
      let centre;
      for (let k = 0; k < 200; k++) {
        centre = this.point(opts.quadrant, 0.1, 0.62, 0.9);
        if (dist(centre, this.macula) > DD * 1.25) break; // keep non-DME clusters clear of the 1-DD macular zone
      }
      const n = this.rng.int(5, 9);
      for (let i = 0; i < n; i++) {
        const a = this.rng.range(0, 6.28);
        const d = this.rng.range(0, 0.04);
        this.add('hard-exudate', { x: centre.x + Math.cos(a) * d, y: centre.y + Math.sin(a) * d, r: this.rng.range(0.0035, 0.0075) });
      }
    }
  }
  circinate() { // exudate ring around a leaking focus within 1 DD of the macular centre → suspected DME
    const { rng, macula, s } = this;
    const c = { x: macula.x - s * 0.03, y: macula.y - 0.045 };
    const R = 0.075;
    const n = rng.int(11, 15);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + rng.range(-0.2, 0.2);
      const d = R * rng.range(0.85, 1.15);
      this.add('hard-exudate', { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, r: rng.range(0.0045, 0.0085), dme: true });
    }
    this.add('ma', { x: c.x, y: c.y, r: 0.006 });
  }
  cws(n) {
    for (let i = 0; i < n; i++) {
      const p = this.point(null, 0.22, 0.65, 1);
      this.add('cotton-wool', { ...p, r: this.rng.range(0.028, 0.046), rot: this.rng.range(0, 3.1) });
    }
  }
  beading(quadrants) {
    for (const q of quadrants) {
      const v = this.vessels.find((x) => x.main && x.kind === 'vein' && x.q === q);
      const a = Math.floor(v.pts.length * 0.3);
      const b = Math.floor(v.pts.length * 0.62);
      const path = v.pts.slice(a, b);
      const cx = path.reduce((t, p) => t + p.x, 0) / path.length;
      const cy = path.reduce((t, p) => t + p.y, 0) / path.length;
      this.add('venous-beading', { x: cx, y: cy, r: Math.max(...path.map((p) => Math.hypot(p.x - cx, p.y - cy))) + 0.015, path: path.map((p) => ({ x: p.x, y: p.y, w: p.w })) });
    }
  }
  irma(quadrants) {
    for (const q of quadrants) {
      const c = this.point(q, 0.32, 0.6, 1);
      const path = [];
      for (let k = 0; k < 2; k++) {
        const pts = [];
        let p = { x: c.x + this.rng.range(-0.02, 0.02), y: c.y + this.rng.range(-0.02, 0.02) };
        let h = this.rng.range(0, 6.28);
        for (let i = 0; i < 16; i++) {
          pts.push({ ...p });
          h += this.rng.range(-0.9, 0.9);
          p = { x: p.x + Math.cos(h) * 0.009, y: p.y + Math.sin(h) * 0.009 };
        }
        path.push(pts);
      }
      this.add('irma', { x: c.x, y: c.y, r: 0.05, path });
    }
  }
  nvd() {
    const { disc, rng } = this;
    const loops = [];
    for (let k = 0; k < 7; k++) {
      const a0 = rng.range(0, 6.28);
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const a = a0 + Math.sin(t * 14 + k) * 0.35;
        const rr = 0.045 + t * 0.12;
        pts.push({ x: disc.x + Math.cos(a) * rr, y: disc.y + Math.sin(a) * rr });
      }
      loops.push(pts);
    }
    this.add('neovascularization', { x: disc.x, y: disc.y, r: 0.19, site: 'disc', path: loops });
  }
  nve(q) {
    const c = this.point(q, 0.42, 0.62, 1);
    const loops = [];
    for (let k = 0; k < 6; k++) {
      const pts = [];
      let p = { x: c.x + this.rng.range(-0.02, 0.02), y: c.y + this.rng.range(-0.02, 0.02) };
      let h = this.rng.range(0, 6.28);
      for (let i = 0; i < 22; i++) {
        pts.push({ ...p });
        h += Math.sin(i * 0.9 + k) * 0.55;
        p = { x: p.x + Math.cos(h) * 0.0085, y: p.y + Math.sin(h) * 0.0085 };
      }
      loops.push(pts);
    }
    this.add('neovascularization', { x: c.x, y: c.y, r: 0.1, site: 'elsewhere', path: loops });
  }
  preretinal(q) {
    const c = this.point(q, 0.3, 0.45, 1);
    this.add('preretinal-hemorrhage', { ...c, r: 0.055, ry: 0.04 });
  }
  reflex() {
    const a = this.rng.range(0, 6.28);
    this.add('artifact', { x: Math.cos(a) * 0.68, y: Math.sin(a) * 0.68, r: 0.1, kind: 'light-reflex', angle: a });
  }
}

export function planCase(def) {
  const rng = mulberry32(def.seed);
  const s = def.eye === 'OD' ? 1 : -1;
  const disc = { x: 0.42 * s, y: -0.03, rx: DD * 0.46, ry: DD * 0.52 };
  const macula = { x: 0, y: 0.03, r: 0.1 };
  const vessels = buildVessels(rng, s, disc);
  const b = new Builder(rng, s, disc, macula, vessels);
  const f = def.findings || {};
  if (!def.ungradable) {
    if (f.ma) b.ma(f.ma.n, f.ma);
    if (f.hem) b.hem(f.hem.n, f.hem);
    if (f.hemPerQuadrant) for (const q of QUADRANTS) b.hem(f.hemPerQuadrant, { quadrant: q, blot: 0.4 });
    if (f.exudates) b.exudates(f.exudates);
    if (f.dme) b.circinate();
    if (f.cws) b.cws(f.cws);
    if (f.beading) b.beading(f.beading);
    if (f.irma) b.irma(f.irma);
    if (f.nvd) b.nvd();
    if (f.nve) b.nve(f.nve);
    if (f.preretinal) b.preretinal(f.preretinal);
    if (f.reflex) b.reflex();
  }
  return { def, s, disc, macula, vessels, lesions: b.lesions };
}

// ---- reference rules ------------------------------------------------------------------------------
// Independent re-derivation of the reference grade from a lesion list, using the ICDR clinical scale
// (Wilkinson et al. 2003) and the 4-2-1 severity rule. Used by tests to prove every authored label is
// consistent with its own annotations, and shown in the UI as the rule that produced the reference label.
export function deriveReference(lesions) {
  const L = lesions.filter((l) => l.type !== 'artifact');
  const has = (t) => L.some((l) => l.type === t);
  const count = (t, q) => L.filter((l) => l.type === t && (!q || l.quadrant === q)).length;
  const hemPerQuadrant = Object.fromEntries(QUADRANTS.map((q) => [q, count('hemorrhage', q)]));
  const beadingQuadrants = new Set(L.filter((l) => l.type === 'venous-beading').map((l) => l.quadrant)).size;
  const irmaQuadrants = new Set(L.filter((l) => l.type === 'irma').map((l) => l.quadrant)).size;
  const rule421 = {
    hemorrhages4Quadrants: QUADRANTS.every((q) => hemPerQuadrant[q] >= 20),
    beading2Quadrants: beadingQuadrants >= 2,
    irma1Quadrant: irmaQuadrants >= 1,
  };
  const pdr = has('neovascularization') || has('preretinal-hemorrhage');
  const severe = rule421.hemorrhages4Quadrants || rule421.beading2Quadrants || rule421.irma1Quadrant;
  const nonMA = L.some((l) => ['hemorrhage', 'hard-exudate', 'cotton-wool', 'venous-beading', 'irma'].includes(l.type));
  const dme = L.some((l) => l.type === 'hard-exudate' && l.ddFromMacula <= 1);
  const grade = pdr ? 4 : severe ? 3 : nonMA ? 2 : has('ma') ? 1 : 0;
  return { grade, dme, referable: grade >= 2 || dme, rule421, hemPerQuadrant, pdr };
}

export const GRADE_NAMES = {
  0: 'No apparent retinopathy',
  1: 'Mild non-proliferative DR',
  2: 'Moderate non-proliferative DR',
  3: 'Severe non-proliferative DR',
  4: 'Proliferative DR',
};
