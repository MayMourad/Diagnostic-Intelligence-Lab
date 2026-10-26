// Original, dependency-free WebGL model of a human RIGHT eye (schematic proportions, not to scale), cut in an
// axial section. It is an orientation aid — never clinical evidence. Anatomy shown:
//   cornea, iris + pupil, lens, vitreous body (the clear space), sclera, choroid, retina,
//   macula/fovea (at the posterior pole), optic disc (≈ 15–20° nasal to the fovea) and optic nerve.
// World axes: +Z anterior (towards the cornea), +Y superior, +X nasal for this right eye.
// The retinal lining carries a texture painted by the same code as the teaching images (healthy example, no lesions).
import { planCase } from '../lib/fundus.js';
import { paintFundus, makeCanvas } from '../lib/fundus-paint.js';

// ───────── geometry constants (units: globe radius = 1) ─────────
const G = {
  R: 1, tSclera: 0.045, tChoroid: 0.028, tRetina: 0.03,
  corneaC: 0.62, corneaR: 0.58, corneaT: 0.04,
  irisPupil: 0.17, irisRoot: 0.5, irisZ0: 0.895, irisZ1: 0.835,
  lensR: 0.4, lensZ: 0.745, lensFront: 0.155, lensBack: 0.165,
  oraZ: 0.38, discAngle: 0.33, nerveLen: 0.8, nerveR: 0.125,
};
const Rr = G.R - G.tSclera - G.tChoroid - G.tRetina; // retina inner radius
const zLimbus = (1 - G.corneaR * G.corneaR + G.corneaC * G.corneaC) / (2 * G.corneaC);
const aLimbus = Math.acos(-zLimbus); // polar angle (from posterior pole) of the limbus on the sclera sphere
const bLimbus = Math.acos((zLimbus - G.corneaC) / G.corneaR);
const aOra = Math.acos(-G.oraZ / Rr);
const DISC = { x: Rr * Math.sin(G.discAngle), z: -Rr * Math.cos(G.discAngle) };
const NERVE_DIR = (() => { const d = [0.3, 0, -1]; const l = Math.hypot(...d); return d.map((v) => v / l); })();

// Anchors (section plane y = 0) used for labels. Verified against the constants above.
export const ANCHORS = {
  cornea: [G.corneaR * 0.62, 0, G.corneaC + G.corneaR * Math.cos(Math.asin(0.62))],
  iris: [0.34, 0, 0.862],
  lens: [-0.1, 0, G.lensZ],
  vitreous: [0.02, 0, -0.05],
  sclera: [-(G.R - G.tSclera / 2), 0, 0.02],
  retina: [-Rr * Math.sin(0.95), 0, -Rr * Math.cos(0.95)],
  nerve: [DISC.x + NERVE_DIR[0] * 0.5, 0, DISC.z + NERVE_DIR[2] * 0.5],
  macula: [-0.035, 0, -Rr + 0.004],
  disc: [DISC.x, 0, DISC.z],
};

// ───────── mesh builders ─────────
const N_SEG = 72;
function lathe(profile, flip, half) { // profile: [[r,z],...]; half: 'lower' (y<0) | 'upper' (y>0) | 'full'
  const pos = []; const nor = []; const idx = [];
  const ph0 = half === 'upper' ? 0 : half === 'lower' ? Math.PI : 0;
  const ph1 = half === 'full' ? Math.PI * 2 : ph0 + Math.PI;
  const segs = half === 'full' ? N_SEG * 2 : N_SEG;
  const n = profile.length;
  for (let j = 0; j < n; j++) {
    const a = profile[Math.max(0, j - 1)]; const b = profile[Math.min(n - 1, j + 1)];
    let nr = b[1] - a[1]; let nz = -(b[0] - a[0]);
    const l = Math.hypot(nr, nz) || 1; nr /= l; nz /= l;
    if (flip) { nr = -nr; nz = -nz; }
    for (let i = 0; i <= segs; i++) {
      const ph = ph0 + ((ph1 - ph0) * i) / segs;
      const c = Math.cos(ph); const s = Math.sin(ph);
      pos.push(profile[j][0] * c, profile[j][0] * s, profile[j][1]);
      nor.push(nr * c, nr * s, nz);
    }
  }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < segs; i++) {
    const a = j * (segs + 1) + i; const b = a + 1; const c = a + segs + 1; const d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  return { pos, nor, idx };
}
const arc = (cx, cz, R, a0, a1, n, f) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return f(a, R, cx, cz); });
// sphere about origin: polar angle a from the posterior pole
const spherePt = (a, R) => [R * Math.sin(a), -R * Math.cos(a)];
// cornea sphere: angle b from the anterior apex axis
const corneaPt = (b, R) => [R * Math.sin(b), G.corneaC + R * Math.cos(b)];

function tube(p0, dir, len, rad, half, flip) { // cylinder along dir from p0 (in XZ plane, y=0)
  const pos = []; const nor = []; const idx = [];
  const up = [0, 1, 0];
  const side = [dir[1] * up[2] - dir[2] * up[1], dir[2] * up[0] - dir[0] * up[2], dir[0] * up[1] - dir[1] * up[0]]; // dir × up
  const segs = N_SEG / 2; const rings = 2;
  const ph0 = half === 'upper' ? 0 : Math.PI; const ph1 = ph0 + Math.PI;
  for (let r = 0; r <= rings; r++) for (let i = 0; i <= segs; i++) {
    const ph = ph0 + ((ph1 - ph0) * i) / segs;
    const nx = up[0] * Math.sin(ph) + side[0] * Math.cos(ph); const ny = Math.sin(ph); const nz = up[2] * Math.sin(ph) + side[2] * Math.cos(ph);
    const t = (r / rings) * len; const rr = rad * (1 + 0.1 * (r / rings));
    pos.push(p0[0] + dir[0] * t + nx * rr, ny * rr, p0[2] + dir[2] * t + nz * rr);
    nor.push(flip ? -nx : nx, flip ? -ny : ny, flip ? -nz : nz);
  }
  for (let r = 0; r < rings; r++) for (let i = 0; i < segs; i++) { const a = r * (segs + 1) + i; const b = a + 1; const c = a + segs + 1; const d = c + 1; idx.push(a, b, c, b, d, c); }
  return { pos, nor, idx };
}

// Polygon (in the y=0 section plane) from a list of [x,z]; triangulated by fan (all our polygons are convex-ish strips) or by strip.
function strip(outer, inner) { // two polylines of equal length → quad strip
  const pos = []; const nor = []; const idx = [];
  for (let i = 0; i < outer.length; i++) { pos.push(outer[i][0], 0, outer[i][1], inner[i][0], 0, inner[i][1]); nor.push(0, 1, 0, 0, 1, 0); }
  for (let i = 0; i < outer.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  return { pos, nor, idx };
}
function poly(points) { // triangle fan around centroid
  const cx = points.reduce((t, p) => t + p[0], 0) / points.length; const cz = points.reduce((t, p) => t + p[1], 0) / points.length;
  const pos = [cx, 0, cz]; const nor = [0, 1, 0]; const idx = [];
  points.forEach((p) => { pos.push(p[0], 0, p[1]); nor.push(0, 1, 0); });
  for (let i = 0; i < points.length; i++) idx.push(0, 1 + i, 1 + ((i + 1) % points.length));
  return { pos, nor, idx };
}
const mirrorX = (pts) => pts.map(([x, z]) => [-x, z]);
function sectionBand(profileOuter, profileInner) { // both sides of the axis
  const a = strip(profileOuter, profileInner); const b = strip(mirrorX(profileOuter), mirrorX(profileInner));
  const off = a.pos.length / 3;
  return { pos: [...a.pos, ...b.pos], nor: [...a.nor, ...b.nor], idx: [...a.idx, ...b.idx.map((i) => i + off)] };
}

function buildScene() {
  const parts = []; // { name, mesh, mat, group }
  const add = (name, mesh, mat, group = 'static') => parts.push({ name, mesh, mat, group });
  const scl = arc(0, 0, G.R, 0, aLimbus, 64, (a, R) => spherePt(a, R));
  const sclIn = arc(0, 0, G.R - G.tSclera, 0, aLimbus, 64, (a, R) => spherePt(a, R));
  const corO = arc(0, 0, G.corneaR, bLimbus, 0, 24, (b, R) => corneaPt(b, R));
  const corI = arc(0, 0, G.corneaR - G.corneaT, Math.asin(0.485 / (G.corneaR - G.corneaT)), 0, 24, (b, R) => corneaPt(b, R));
  const retIn = arc(0, 0, Rr, 0, aOra, 60, (a, R) => spherePt(a, R));
  const retOut = arc(0, 0, Rr + G.tRetina, 0, aOra, 60, (a, R) => spherePt(a, R));
  const choOut = arc(0, 0, Rr + G.tRetina + G.tChoroid, 0, aOra, 60, (a, R) => spherePt(a, R));
  const iris = Array.from({ length: 12 }, (_, k) => [G.irisPupil + ((G.irisRoot - G.irisPupil) * k) / 11, G.irisZ0 + ((G.irisZ1 - G.irisZ0) * k) / 11]);
  const lensFront = arc(0, 0, 1, 0, Math.PI / 2, 24, (u) => [G.lensR * Math.sin(u), G.lensZ + G.lensFront * Math.cos(u)]);
  const lensBack = arc(0, 0, 1, Math.PI / 2, Math.PI, 24, (u) => [G.lensR * Math.sin(u), G.lensZ + G.lensBack * Math.cos(u)]);
  const lens = [...lensFront, ...lensBack.slice(1)];

  for (const half of ['lower', 'upper']) {
    const g = half === 'upper' ? 'upper' : 'lower';
    add(`sclera-${half}`, lathe(scl, false, half), 'sclera', g);
    add(`cornea-o-${half}`, lathe(corO, true, half), 'glass', g);
    add(`cornea-i-${half}`, lathe(corI, false, half), 'glassIn', g);
    add(`retina-${half}`, lathe(retIn, true, half), 'retina', g);
    add(`iris-${half}`, lathe(iris, false, half), 'iris', g);
    add(`lens-${half}`, lathe(lens, false, half), 'lens', g);
    add(`nerve-${half}`, tube([DISC.x - NERVE_DIR[0] * 0.04, 0, DISC.z - NERVE_DIR[2] * 0.04], NERVE_DIR, G.nerveLen, G.nerveR, half, false), 'nerve', g);
  }
  // cut faces (lower half stays; they sit in the y=0 plane)
  add('cap-sclera', sectionBand(scl, sclIn), 'capSclera', 'cap');
  add('cap-choroid', sectionBand(choOut, retOut), 'capChoroid', 'cap');
  add('cap-retina', sectionBand(retOut, retIn), 'capRetina', 'cap');
  add('cap-cornea', sectionBand(corO, corI.length === corO.length ? corI : corI), 'capCornea', 'cap');
  // ciliary body wedge + iris section + lens section + nerve section
  const aj = aLimbus; const ci = (a, R) => spherePt(a, R);
  const wedge = [ci(aOra, Rr + G.tRetina), ci(aOra, G.R - G.tSclera), ci(aj - 0.02, G.R - G.tSclera), [G.irisRoot, G.irisZ1 - 0.01], [0.43, 0.72], [G.lensR + 0.02, 0.66]];
  const wedge2 = [ci(aOra, Rr + G.tRetina), ci(aOra, G.R - G.tSclera), ci(aj - 0.02, G.R - G.tSclera), [G.irisRoot, G.irisZ1 - 0.01], [0.43, 0.72], [G.lensR + 0.04, 0.64]];
  const cw = poly(wedge2); const cw2 = poly(mirrorX(wedge2));
  add('cap-ciliary', { pos: [...cw.pos, ...cw2.pos], nor: [...cw.nor, ...cw2.nor], idx: [...cw.idx, ...cw2.idx.map((i) => i + cw.pos.length / 3)] }, 'capCiliary', 'cap');
  void wedge;
  const irisSec = (sgn) => poly([[sgn * G.irisPupil, G.irisZ0], [sgn * G.irisRoot, G.irisZ1], [sgn * G.irisRoot, G.irisZ1 - 0.02], [sgn * G.irisPupil, G.irisZ0 - 0.022]]);
  const i1 = irisSec(1); const i2 = irisSec(-1);
  add('cap-iris', { pos: [...i1.pos, ...i2.pos], nor: [...i1.nor, ...i2.nor], idx: [...i1.idx, ...i2.idx.map((i) => i + i1.pos.length / 3)] }, 'capIris', 'cap');
  add('cap-lens', poly([...lens, ...mirrorX(lens).reverse()]), 'capLens', 'cap');
  const nv0 = [DISC.x - NERVE_DIR[0] * 0.04, DISC.z - NERVE_DIR[2] * 0.04];
  const nrm = [NERVE_DIR[2], -NERVE_DIR[0]]; // in-plane normal
  const nerveQuad = (w) => [[nv0[0] + nrm[0] * w, nv0[1] + nrm[1] * w], [nv0[0] - nrm[0] * w, nv0[1] - nrm[1] * w], [nv0[0] - nrm[0] * w * 1.1 + NERVE_DIR[0] * G.nerveLen, nv0[1] - nrm[1] * w * 1.1 + NERVE_DIR[2] * G.nerveLen], [nv0[0] + nrm[0] * w * 1.1 + NERVE_DIR[0] * G.nerveLen, nv0[1] + nrm[1] * w * 1.1 + NERVE_DIR[2] * G.nerveLen]];
  add('cap-nerve-sheath', poly(nerveQuad(G.nerveR)), 'capSclera', 'cap');
  add('cap-nerve-core', poly(nerveQuad(G.nerveR * 0.62)), 'capNerve', 'cap2');
  return parts;
}

// ───────── materials ─────────
// kind: 0 plain, 1 retina texture, 2 iris, 3 flat section face. rgb in 0..1.
const MATS = {
  sclera: { c: [0.93, 0.9, 0.82], a: 1, spec: 0.12, rough: 0.5, kind: 0, back: [0.55, 0.42, 0.34] },
  glass: { c: [0.82, 0.9, 0.95], a: 0.2, spec: 1, rough: 0.12, kind: 0, fres: 1 },
  glassIn: { c: [0.82, 0.9, 0.95], a: 0.1, spec: 0.5, rough: 0.2, kind: 0, fres: 1 },
  retina: { c: [0.78, 0.38, 0.24], a: 1, spec: 0.1, rough: 0.55, kind: 1 },
  iris: { c: [0.3, 0.46, 0.55], a: 1, spec: 0.15, rough: 0.5, kind: 2 },
  lens: { c: [0.97, 0.92, 0.76], a: 0.3, spec: 0.8, rough: 0.2, kind: 0, fres: 1 },
  nerve: { c: [0.9, 0.86, 0.78], a: 1, spec: 0.1, rough: 0.55, kind: 0 },
  capSclera: { c: [0.9, 0.86, 0.76], a: 1, spec: 0, rough: 1, kind: 3 },
  capChoroid: { c: [0.2, 0.13, 0.1], a: 1, spec: 0, rough: 1, kind: 3 },
  capRetina: { c: [0.3, 0.62, 0.58], a: 1, spec: 0, rough: 1, kind: 3 },
  capCornea: { c: [0.82, 0.92, 0.96], a: 0.55, spec: 0, rough: 1, kind: 3 },
  capCiliary: { c: [0.45, 0.36, 0.3], a: 1, spec: 0, rough: 1, kind: 3 },
  capIris: { c: [0.2, 0.32, 0.4], a: 1, spec: 0, rough: 1, kind: 3 },
  capLens: { c: [0.96, 0.9, 0.7], a: 0.55, spec: 0, rough: 1, kind: 3 },
  capNerve: { c: [0.78, 0.7, 0.58], a: 1, spec: 0, rough: 1, kind: 3 },
};

const VS = `
attribute vec3 aPos; attribute vec3 aNor;
uniform mat4 uVP; uniform vec3 uOff;
varying vec3 vN; varying vec3 vP; varying vec3 vObj;
void main(){ vec3 p = aPos + uOff; vObj = aPos; vP = p; vN = aNor; gl_Position = uVP * vec4(p, 1.0); }`;
const FS = `
precision mediump float;
varying vec3 vN; varying vec3 vP; varying vec3 vObj;
uniform vec3 uCam; uniform vec3 uColor; uniform float uAlpha; uniform float uSpec; uniform float uRough; uniform float uFres;
uniform int uKind; uniform sampler2D uTex; uniform float uTexAmt; uniform vec3 uBack;
uniform vec3 uBg; uniform float uFog;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(uCam - vP);
  if (dot(n, v) < 0.0) n = -n;
  vec3 col = uColor;
  if (uKind == 1) {
    float R = length(vObj); float a = acos(clamp(-vObj.z / R, -1.0, 1.0)); float ph = atan(vObj.y, vObj.x);
    float rho = a / 0.786;
    vec2 uv = vec2(0.5 + 0.5 * rho * cos(ph), 0.5 - 0.5 * rho * sin(ph));
    vec3 per = vec3(0.50, 0.21, 0.14);
    float m = smoothstep(1.0, 0.86, rho);
    vec3 tex = texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb;
    col = mix(per, tex, m * uTexAmt);
    float ora = smoothstep(0.0, 1.0, (a - 1.75) / 0.4); col = mix(col, vec3(0.3,0.12,0.09), ora);
  }
  if (uKind == 2) {
    float r = length(vObj.xy); float ang = atan(vObj.y, vObj.x);
    float fib = 0.5 + 0.5 * sin(ang * 90.0 + hash(vec2(floor(ang * 14.0), 1.0)) * 6.0);
    float t = smoothstep(0.17, 0.5, r);
    col = mix(vec3(0.16, 0.30, 0.38), vec3(0.42, 0.58, 0.64), fib * 0.7 + 0.15 * t);
    col *= 0.7 + 0.5 * smoothstep(0.17, 0.2, r);
    col = mix(col, vec3(0.1, 0.18, 0.22), smoothstep(0.42, 0.5, r) * 0.6);
  }
  if (uKind == 3) { // section face: flat, evenly lit with a fine paper grain
    float g = hash(floor(vP.xz * 420.0)) * 0.04;
    gl_FragColor = vec4((col + g) * uAlpha, uAlpha); return;
  }
  vec3 key = normalize(vec3(-0.45, 0.85, 0.55)); vec3 fill = normalize(vec3(0.7, 0.2, 0.5)); vec3 rim = normalize(vec3(0.3, 0.4, -0.9));
  float dk = clamp(dot(n, key) * 0.5 + 0.5, 0.0, 1.0); dk = dk * dk;
  float df = clamp(dot(n, fill) * 0.5 + 0.5, 0.0, 1.0);
  vec3 amb = mix(vec3(0.16, 0.16, 0.2), vec3(0.42, 0.45, 0.5), n.y * 0.5 + 0.5);
  vec3 lit = col * (amb * 0.9 + vec3(1.0, 0.95, 0.88) * dk * 0.95 + vec3(0.55, 0.65, 0.8) * df * 0.22);
  float nv = clamp(dot(n, v), 0.0, 1.0);
  vec3 h = normalize(key + v); float sp = pow(max(dot(n, h), 0.0), mix(120.0, 14.0, uRough)) * uSpec;
  float fr = pow(1.0 - nv, 3.0);
  lit += vec3(1.0, 0.98, 0.94) * sp * 0.9;
  lit += vec3(0.55, 0.7, 0.9) * pow(max(dot(n, rim), 0.0), 1.5) * 0.18 * (1.0 - float(uKind == 1));
  float al = uAlpha;
  if (uFres > 0.5) { al = clamp(uAlpha + fr * 0.55 + sp * 0.5, 0.0, 1.0); lit += vec3(0.7, 0.85, 0.95) * fr * 0.4; }
  if (uKind == 1) { lit *= 0.82 + 0.3 * pow(nv, 0.6); }
  float d = length(uCam - vP);
  lit = mix(lit, uBg, clamp((d - 4.0) * uFog, 0.0, 0.6));
  gl_FragColor = vec4(lit * al, al);
}`;

// ───────── tiny mat4 ─────────
const mat = {
  persp(f, a, n, fr) { const t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, (2 * fr * n) / (n - fr), 0]; },
  look(e, c, u) {
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; let l = Math.hypot(...z); z = z.map((v) => v / l);
    let x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; l = Math.hypot(...x); x = x.map((v) => v / l);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  },
  mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]; return o; },
};

// ───────── scroll path ─────────
// Each key: progress p → camera + state. Interpolated with smoothstep. roll rotates the view so the cornea points left.
const KEYS = [
  { p: 0.0, yaw: -0.62, pitch: 0.2, dist: 5.4, tx: 0.0, ty: 0, tz: 0.15, roll: 0, lift: 0, cap: 0, tex: 0 },
  { p: 0.3, yaw: -0.4, pitch: 0.42, dist: 5.2, tx: 0.0, ty: 0, tz: 0.1, roll: 0, lift: 0, cap: 0, tex: 0 },
  { p: 0.58, yaw: 0.0, pitch: 1.3, dist: 5.9, tx: 0.0, ty: 0, tz: -0.05, roll: -Math.PI / 2, lift: 1, cap: 1, tex: 1 },
  { p: 0.78, yaw: 0.0, pitch: 1.3, dist: 5.9, tx: 0.0, ty: 0, tz: -0.05, roll: -Math.PI / 2, lift: 1, cap: 1, tex: 1 },
  { p: 1.0, yaw: 0.04, pitch: 1.05, dist: 2.9, tx: 0.2, ty: -0.12, tz: -0.95, roll: -Math.PI / 2, lift: 1, cap: 1, tex: 1 },
];
const sm = (t) => t * t * (3 - 2 * t);
function sample(p) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i]; const b = KEYS[i + 1];
  const t = sm(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
  const o = {};
  for (const k of Object.keys(a)) if (k !== 'p') o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

// ───────── renderer ─────────
export function createEye(canvas, { reduced = false, onFrame } = {}) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return null;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('[eye3d] shader failure → static fallback', e); return null; }
  gl.useProgram(prog);
  const loc = (n) => gl.getUniformLocation(prog, n);
  const U = Object.fromEntries(['uVP', 'uOff', 'uCam', 'uColor', 'uAlpha', 'uSpec', 'uRough', 'uFres', 'uKind', 'uTex', 'uTexAmt', 'uBack', 'uBg', 'uFog'].map((n) => [n, loc(n)]));
  const aPos = gl.getAttribLocation(prog, 'aPos'); const aNor = gl.getAttribLocation(prog, 'aNor');

  const parts = buildScene().map((p) => {
    const mk = (data, T) => { const b = gl.createBuffer(); gl.bindBuffer(T, b); gl.bufferData(T, data, gl.STATIC_DRAW); return b; };
    return { ...p, pb: mk(new Float32Array(p.mesh.pos), gl.ARRAY_BUFFER), nb: mk(new Float32Array(p.mesh.nor), gl.ARRAY_BUFFER), ib: mk(new Uint16Array(p.mesh.idx), gl.ELEMENT_ARRAY_BUFFER), count: p.mesh.idx.length };
  });
  // Uint16 overflow guard: the largest mesh must stay below 65 536 vertices.
  const tex = gl.createTexture();
  const fundusTex = makeCanvas(1024);
  {
    const healthy = planCase({ seed: 777, eye: 'OD', findings: {}, imaging: { blur: 0.6, bright: 1.08, haze: 0, occlusion: 0, noise: 1.5, pigment: 'typical', illum: 0.05 } });
    const painted = paintFundus(healthy, 1024);
    fundusTex.getContext('2d').drawImage(painted, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fundusTex);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  const st = { frames: 0, p: 0, target: 0, pointer: [0, 0], ptrS: [0, 0], t0: performance.now(), running: false, raf: 0, dirty: true, spin: !reduced, view: sample(0), onFrame };
  const bg = [0.039, 0.102, 0.173];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr)); const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; st.dirty = true; }
  }

  function draw(now) {
    resize();
    const time = (now - st.t0) / 1000;
    // ease scroll progress (critically damped feel)
    const dp = st.target - st.p;
    if (Math.abs(dp) > 0.0004) { st.p += dp * (reduced ? 1 : 0.075); st.dirty = true; } else st.p = st.target;
    st.ptrS[0] += (st.pointer[0] - st.ptrS[0]) * 0.06; st.ptrS[1] += (st.pointer[1] - st.ptrS[1]) * 0.06;
    const v = sample(st.p);
    st.view = v;
    const drift = st.spin ? Math.sin(time * 0.35) * 0.12 : 0;
    const yaw = v.yaw + drift + st.ptrS[0] * 0.22; const pitch = Math.min(1.42, Math.max(-0.2, v.pitch + st.ptrS[1] * 0.12));
    const eye = [v.tx + v.dist * Math.sin(yaw) * Math.cos(pitch), v.ty + v.dist * Math.sin(pitch), v.tz + v.dist * Math.cos(yaw) * Math.cos(pitch)];
    const c = [v.tx, v.ty, v.tz];
    const fwd = [c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]]; const fl = Math.hypot(...fwd); fwd.forEach((_, i) => (fwd[i] /= fl));
    const cr = Math.cos(v.roll); const sr = Math.sin(v.roll);
    // rotate the world-up around the forward axis by roll (Rodrigues, up ⟂ fwd approximated)
    const up0 = [0, 1, 0]; const dotUF = up0[0] * fwd[0] + up0[1] * fwd[1] + up0[2] * fwd[2];
    const upP = [up0[0] - fwd[0] * dotUF, up0[1] - fwd[1] * dotUF, up0[2] - fwd[2] * dotUF]; const ul = Math.hypot(...upP) || 1; upP.forEach((_, i) => (upP[i] /= ul));
    const rightV = [fwd[1] * upP[2] - fwd[2] * upP[1], fwd[2] * upP[0] - fwd[0] * upP[2], fwd[0] * upP[1] - fwd[1] * upP[0]];
    const up = upP.map((u0, i) => u0 * cr + rightV[i] * sr);
    const aspect = canvas.width / canvas.height;
    const fov = aspect < 0.8 ? 0.62 : 0.5;
    const proj = mat.persp(fov, aspect, 0.1, 30);
    const view = mat.look(eye, c, up);
    const vp = mat.mul(proj, view);
    // shift the scene right in NDC so the globe sits beside the copy while the canvas spans the full viewport
    const shift = (canvas.clientWidth > 900 ? 0.3 : 0) * (document.documentElement.dir === 'rtl' ? -1 : 1); // never mirror the anatomy in RTL
    vp[0] += shift * vp[3]; vp[4] += shift * vp[7]; vp[8] += shift * vp[11]; vp[12] += shift * vp[15];
    st.vp = vp; st.eye = eye;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniformMatrix4fv(U.uVP, false, new Float32Array(vp)); gl.uniform3fv(U.uCam, eye);
    gl.uniform3fv(U.uBg, bg); gl.uniform1f(U.uFog, 0.12);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uTex, 0);

    const lift = v.lift;
    const drawPart = (p, alphaMul, off) => {
      const m = MATS[p.mat];
      gl.uniform3fv(U.uColor, m.c); gl.uniform1f(U.uAlpha, m.a * alphaMul); gl.uniform1f(U.uSpec, m.spec); gl.uniform1f(U.uRough, m.rough);
      gl.uniform1f(U.uFres, m.fres || 0); gl.uniform1i(U.uKind, m.kind); gl.uniform1f(U.uTexAmt, 1); gl.uniform3fv(U.uOff, off);
      gl.bindBuffer(gl.ARRAY_BUFFER, p.pb); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, p.nb); gl.enableVertexAttribArray(aNor); gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ib);
      gl.drawElements(gl.TRIANGLES, p.count, gl.UNSIGNED_SHORT, 0);
    };
    const opaque = (p) => MATS[p.mat].a >= 0.99 && !MATS[p.mat].fres && p.group !== 'cap' && p.group !== 'cap2';
    gl.disable(gl.CULL_FACE);
    // 1 opaque lower half
    gl.depthMask(true);
    parts.filter((p) => p.group === 'lower' && opaque(p)).forEach((p) => drawPart(p, 1, [0, 0, 0]));
    // 2 section faces (fade in with lift)
    if (v.cap > 0.01) { gl.depthMask(true); parts.filter((p) => p.group === 'cap' || p.group === 'cap2').forEach((p) => drawPart(p, Math.min(1, v.cap * 1.6), [0, p.group === 'cap2' ? 0.0016 : 0.0006, 0])); }
    // 3 upper half (opaque parts) lifting away and fading
    const upAlpha = 1 - sm(Math.min(1, lift * 1.15));
    if (upAlpha > 0.01) {
      const off = [0, lift * 0.9, 0];
      gl.depthMask(true);
      parts.filter((p) => p.group === 'upper' && opaque(p)).forEach((p) => drawPart(p, upAlpha, off));
    }
    // 4 translucent parts (lens, cornea) — lower first, then upper
    gl.depthMask(false);
    parts.filter((p) => p.group === 'lower' && !opaque(p)).forEach((p) => drawPart(p, 1, [0, 0, 0]));
    if (upAlpha > 0.01) parts.filter((p) => p.group === 'upper' && !opaque(p)).forEach((p) => drawPart(p, upAlpha, [0, lift * 0.9, 0]));
    gl.depthMask(true);
    if (st.onFrame) st.onFrame(st);
    st.dirty = false;
    if (++st.frames === 6) { // self-check: a context that draws nothing (broken driver) should fall back to the static view
      const px = new Uint8Array(4 * canvas.width); // one full-width row through the middle
      gl.readPixels(0, Math.floor(canvas.height / 2), canvas.width, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let painted = false;
      for (let i = 3; i < px.length; i += 4) if (px[i] > 0) painted = true;
      canvas.dataset.painted = String(painted);
      if (!painted && st.onBlank) st.onBlank();
    }
  }

  function loop(now) {
    if (!st.running) return;
    if (st.spin || st.dirty || Math.abs(st.target - st.p) > 0.0004 || Math.hypot(st.pointer[0] - st.ptrS[0], st.pointer[1] - st.ptrS[1]) > 0.002) draw(now);
    st.raf = requestAnimationFrame(loop);
  }
  const api = {
    start() { if (st.running) return; st.running = true; st.dirty = true; st.raf = requestAnimationFrame(loop); },
    stop() { st.running = false; cancelAnimationFrame(st.raf); },
    setProgress(p) { st.target = Math.min(1, Math.max(0, p)); },
    setPointer(x, y) { st.pointer = [x, y]; },
    setSpin(on) { st.spin = on && !reduced; },
    jump(p) { st.target = st.p = p; st.dirty = true; },
    redraw() { st.dirty = true; if (!st.running) draw(performance.now()); },
    get progress() { return st.p; },
    get lift() { return st.view.lift; },
    project(a) { // object-space [x,y,z] → CSS pixels relative to the canvas, plus whether it is inside the clip volume
      if (!st.vp) return null;
      const off = st.view.lift > 0.5 ? 0 : 0;
      const m = st.vp; const [x, y, z] = a;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12]; const cy = m[1] * x + m[5] * y + m[9] * z + m[13]; const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      void off;
      if (cw <= 0) return null;
      return { x: ((cx / cw) * 0.5 + 0.5) * canvas.clientWidth, y: (1 - ((cy / cw) * 0.5 + 0.5)) * canvas.clientHeight };
    },
    destroy() { api.stop(); parts.forEach((p) => { gl.deleteBuffer(p.pb); gl.deleteBuffer(p.nb); gl.deleteBuffer(p.ib); }); gl.deleteTexture(tex); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
    onBlank(f) { st.onBlank = f; },
    onLost(f) { canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); f(); }); },
  };
  return api;
}

// ───────── static fallback (same anatomy, hand-built section drawing) ─────────
export function eyeSectionSVG({ labels = true } = {}) {
  const S = 100; // 1 unit → 100 px; section plane: x → vertical (nasal up), z → horizontal (anterior left)
  const X = (z) => 360 - z * S * 1.5; const Y = (x) => 250 - x * S * 1.5;
  const P = (pts) => pts.map(([x, z], i) => `${i ? 'L' : 'M'}${X(z).toFixed(1)} ${Y(x).toFixed(1)}`).join('');
  const both = (fn) => [fn(1), fn(-1)];
  const scl = arc(0, 0, G.R, 0, aLimbus, 80, (a, R) => spherePt(a, R));
  const cor = arc(0, 0, G.corneaR, bLimbus, 0, 30, (b, R) => corneaPt(b, R));
  const retina = arc(0, 0, Rr, 0, aOra, 70, (a, R) => spherePt(a, R));
  const m = (pts) => pts.map(([x, z]) => [-x, z]);
  const lensF = arc(0, 0, 1, 0, Math.PI / 2, 20, (u) => [G.lensR * Math.sin(u), G.lensZ + G.lensFront * Math.cos(u)]);
  const lensB = arc(0, 0, 1, Math.PI / 2, Math.PI, 20, (u) => [G.lensR * Math.sin(u), G.lensZ + G.lensBack * Math.cos(u)]);
  const lens = [...lensF, ...lensB.slice(1)];
  const nerve0 = [DISC.x, DISC.z];
  const nerveEnd = [DISC.x + NERVE_DIR[0] * G.nerveLen, DISC.z + NERVE_DIR[2] * G.nerveLen];
  const stroke = 'stroke="#F7F2E8" stroke-width="1.2" fill="none" stroke-linejoin="round" stroke-linecap="round"';
  const lab = (key, pt, dx, dy) => (labels ? `<g class="fb-label"><circle cx="${X(pt[2])}" cy="${Y(pt[0])}" r="2.5" fill="#4A9A92"/><path d="M${X(pt[2])} ${Y(pt[0])}l${dx} ${dy}" stroke="#8FD0C8" stroke-width=".8"/><text x="${X(pt[2]) + dx + (dx > 0 ? 6 : -6)}" y="${Y(pt[0]) + dy + 4}" text-anchor="${dx > 0 ? 'start' : 'end'}" fill="#F7F2E8" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="1.2">${key}</text></g>` : '');
  return `<svg viewBox="0 0 720 500" role="img" aria-label="Schematic axial section of a human right eye" xmlns="http://www.w3.org/2000/svg" class="eye-static">
    <defs><radialGradient id="vit" cx="45%" cy="50%" r="60%"><stop offset="0" stop-color="#173556"/><stop offset="1" stop-color="#0f2540"/></radialGradient></defs>
    <path d="${P([...scl, ...cor.slice(1), ...m(cor).reverse(), ...m(scl).reverse()])}Z" fill="url(#vit)" ${stroke}/>
    <path d="${P(retina)}" stroke="#4A9A92" stroke-width="3" fill="none"/><path d="${P(m(retina))}" stroke="#4A9A92" stroke-width="3" fill="none"/>
    <path d="${P(lens)}Z${P(m(lens))}Z" fill="rgba(233,223,204,.18)" ${stroke}/>
    ${both((s) => `<path d="${P([[s * G.irisPupil, G.irisZ0], [s * G.irisRoot, G.irisZ1]])}" stroke="#C6D9EE" stroke-width="3" fill="none"/>`).join('')}
    <path d="${P([[nerve0[0] - 0.12, nerve0[1]], [nerveEnd[0] - 0.12, nerveEnd[1]]])}M${X(nerveEnd[1])} ${Y(nerveEnd[0] + 0.12)}L${X(nerve0[1])} ${Y(nerve0[0] + 0.12)}" ${stroke}/>
    <circle cx="${X(-Rr)}" cy="${Y(-0.035)}" r="3.5" fill="#E9DFCC"/><circle cx="${X(DISC.z)}" cy="${Y(DISC.x)}" r="4" fill="#F7F2E8"/>
    ${lab('CORNEA', ANCHORS.cornea, -40, -50)}${lab('IRIS', ANCHORS.iris, -20, -70)}${lab('LENS', [ANCHORS.lens[0] + 0.1, 0, G.lensZ], -10, -110)}${lab('VITREOUS', ANCHORS.vitreous, 50, -100)}${lab('SCLERA', ANCHORS.sclera, 0, -50)}${lab('RETINA', ANCHORS.retina, 40, 70)}${lab('MACULA', ANCHORS.macula, 70, 70)}${lab('OPTIC DISC', ANCHORS.disc, 80, -30)}${lab('OPTIC NERVE', ANCHORS.nerve, 60, -30)}
  </svg>`;
}
