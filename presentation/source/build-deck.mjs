// Builds presentation/source/spec.json for the Al Dhafra Health Forum deck (12 main slides + 3 appendix), then
// render-deck.ps1 (PowerPoint automation) turns it into an editable .pptx and a matching PDF.
//   node presentation/source/build-deck.mjs
// Every image is a capture/export of the PUBLISHED prototype (see capture.mjs). Nothing is mocked up.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCase } from '../../js/data/cases.js';
import { noteFor, APPENDIX_NOTES } from './script.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const URL_LIVE = 'https://maymourad.github.io/Diagnostic-Intelligence-Lab/';
const rel = (...p) => p.join('/');
const need = (r) => { if (!existsSync(resolve(root, r))) throw new Error(`missing asset ${r} — run capture.mjs / make-qr.mjs`); return r; };
const asset = (n) => need(rel('presentation/source/assets', `${n}.png`));
const dims = (r) => { const b = readFileSync(resolve(root, r)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const quality = JSON.parse(readFileSync(resolve(root, 'presentation/source/assets/quality-demo.json'), 'utf8'));

// ── design tokens (the prototype's own palette) ───────────────────────────────────────────────────
const C = { navy: '0A1A2C', navy2: '12304F', navyLine: '234A73', ivory: 'F7F2E8', paper: 'FCFAF4', ink: '0A1A2C', ink2: '3B4A5C', mute: '67707B', line: 'CFC6B3', teal: '2A665F', tealB: '4A9A92', tealL: '8FD0C8', brick: 'A94632', ochre: '8F6614', blue: '2F6FB7', beige: 'E9DFCC', dim: '9DB1C4' };
const F = { head: 'Georgia', body: 'Calibri', mono: 'Consolas' }; // safe substitutes for Newsreader / Instrument Sans / IBM Plex Mono (ship with Office)
const W = 960; const H = 540; const M = 56;

const run = (t, o = {}) => ({ t, ...o });
const P = (...runs) => ({ runs: runs.map((r) => (typeof r === 'string' ? run(r) : r)) });
const B = (...runs) => ({ ...P(...runs), bullet: true });
const slides = [];
let uid = 0;
const nm = (p) => `${p}-${++uid}`;
const S = (bg) => { const s = { bg, elements: [] }; slides.push(s); return s; };
const el = (s, e) => { s.elements.push(e); return e; };
const text = (s, x, y, w, h, paras, o = {}) => el(s, { type: 'text', name: nm('txt'), x, y, w, h, paras: Array.isArray(paras) ? paras : [P(paras)], font: F.body, size: 16, color: C.ink, ...o });
const rect = (s, x, y, w, h, fill, o = {}) => el(s, { type: 'rect', name: nm('shape'), x, y, w, h, fill, ...o });
const oval = (s, x, y, w, h, o = {}) => el(s, { type: 'ellipse', name: nm('oval'), x, y, w, h, ...o });
const line = (s, x1, y1, x2, y2, color = C.line, weight = 0.75, o = {}) => el(s, { type: 'line', name: nm('rule'), x1, y1, x2, y2, color, weight, ...o });
function pic(s, rel, x, y, w, hmax, alt, o = {}) { return el(s, { type: 'img', name: nm('pic'), path: need(rel), x, y, w, hmax, alt, ...o }); }
const fit = (rel, maxW, maxH) => { const d = dims(rel); const k = Math.min(maxW / d.w, maxH / d.h); return { w: d.w * k, h: d.h * k }; };

const dark = (s) => s.bg === C.navy;
const kicker = (s, t, x = M, y = 32) => text(s, x, y, 760, 16, [P(t.toUpperCase())], { font: F.mono, size: 11, color: dark(s) ? C.tealB : C.teal });
const title = (s, t, w = 760, o = {}) => text(s, M, 54, w, 90, [P(t)], { font: F.head, size: 34, color: dark(s) ? C.ivory : C.ink, lineSpacing: 0.95, ...o });
const cap = (s, x, y, w, t) => text(s, x, y, w, 28, [P(t)], { font: F.mono, size: 10, color: dark(s) ? C.dim : C.mute });
function footer(s, n, speaker, appendix = false) {
  const d = dark(s);
  text(s, M, 514, 700, 14, [P(`DIAGNOSTIC INTELLIGENCE LAB · AL DHAFRA HEALTH FORUM · EDUCATIONAL PROTOTYPE · NOT A MEDICAL DEVICE${appendix ? ' · APPENDIX' : ''}`)], { font: F.mono, size: 10, color: d ? C.dim : C.mute });
  text(s, W - M - 40, 514, 40, 14, [P(appendix ? `A${n}` : String(n).padStart(2, '0'))], { font: F.mono, size: 10, color: d ? C.dim : C.mute, align: 3 });
  void speaker;
}
const tag = (s, x, y, w, label, color, fill) => { rect(s, x, y, w, 20, fill || (dark(s) ? C.navy : C.paper), { line: color }); text(s, x, y + 3, w, 14, [P(label.toUpperCase())], { font: F.mono, size: 10, color, align: 2 }); };
const sp = (s) => s; // speaker is recorded in notes and in SPEAKER_SCRIPT.md

// ═══ 01 · title ═══════════════════════════════════════════════════════════════════════════════════
{
  const s = S(C.navy);
  kicker(s, 'Al Dhafra Health Forum · Accurate Diagnosis — التشخيص الدقيق');
  text(s, M, 78, 470, 250, [P('Diagnostic'), P('Intelligence'), P(run('Lab', { italic: 1, color: C.tealL }))], { font: F.head, size: 62, color: C.ivory, lineSpacing: 0.9 });
  text(s, M, 330, 440, 70, [P('“Before we trust a diagnosis, we must understand how it was reached.”')], { font: F.head, size: 19, color: 'C9CFD6', italic: 1, lineSpacing: 1.05 });
  line(s, M, 408, M + 60, 408, C.tealB, 1);
  text(s, M, 418, 440, 78, [P(run('May Ahmed Mourad', { bold: 1 }), '  ·  Grade 12'), P(run('Shamsa Faris Almazrouei', { bold: 1 }), '  ·  Grade 12'), P(run('Fatima Mohamed Almazrouei', { bold: 1 }), '  ·  Grade 11')], { size: 14, color: C.ivory, spaceAfter: 2 });
  text(s, M, 494, 440, 16, [P('ADNOC Schools — Madinat Zayed')], { font: F.mono, size: 11, color: C.tealL });
  const im = asset('eye-intact'); const f = fit(im, 430, 500);
  pic(s, im, W - 30 - f.w, 20, f.w, 500, 'Original three-dimensional model of a human right eye from the prototype entry page: sclera, cornea and iris in studio lighting on a deep navy background.', { border: C.navyLine });
  cap(s, W - 30 - f.w, 520, f.w, 'FIG. 01 · original WebGL eye · schematic, not to scale');
}

// ═══ 02 · problem ═════════════════════════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '01 · The problem');
  title(s, 'A prediction is not proof.', 500, { size: 40 });
  text(s, M, 128, 360, 140, [P('The challenge is not producing a diagnostic label.'), P(run('It is establishing whether that label can be trusted.', { bold: 1, color: C.ink }))], { size: 17, color: C.ink2, spaceAfter: 10 });
  // hub-and-spoke: what a trustworthy diagnosis depends on (editable shapes)
  const cx = 668; const cy = 232; const R = 122;
  const nodes = [['EVIDENCE', 'What is actually visible'], ['IMAGE QUALITY', 'Blur, light, field'], ['INTERPRETATION', 'Who read it, how'], ['ERRORS', 'Missed · over-referred'], ['UNCERTAINTY', 'Ungradable · borderline'], ['HUMAN OVERSIGHT', 'Who is accountable']];
  nodes.forEach(([a, b], i) => {
    const ang = (-90 + i * 60) * Math.PI / 180;
    const nx = cx + Math.cos(ang) * R; const ny = cy + Math.sin(ang) * R * 0.98;
    line(s, cx + Math.cos(ang) * 46, cy + Math.sin(ang) * 46, nx - Math.cos(ang) * 9, ny - Math.sin(ang) * 9, C.line, 1);
    oval(s, nx - 7, ny - 7, 14, 14, { fill: C.teal });
    const left = Math.cos(ang) < -0.3; const right = Math.cos(ang) > 0.3;
    const tx = right ? nx + 14 : left ? nx - 14 - 150 : nx - 95;
    const ty = Math.sin(ang) < -0.5 ? ny - 40 : Math.sin(ang) > 0.5 ? ny + 12 : ny - 14;
    text(s, tx, ty, left || right ? 150 : 190, 36, [P(run(a, { font: F.mono, size: 11, color: C.teal })), P(run(b, { size: 12, color: C.ink2 }))], { align: right ? 1 : left ? 3 : 2, spaceAfter: 0 });
  });
  oval(s, cx - 46, cy - 46, 92, 92, { fill: C.navy });
  text(s, cx - 42, cy - 22, 84, 46, [P('Can this label be trusted?')], { font: F.head, size: 12, color: C.ivory, align: 2, italic: 1, anchor: 3 });
  // evidence strip with sourced statistics
  line(s, M, 408, W - M, 408, C.line);
  const stat = (x, big, small, src) => { text(s, x, 418, 130, 40, [P(big)], { font: F.head, size: 30, color: C.ink }); text(s, x + 128, 421, 300, 54, [P(run(small, { size: 13, color: C.ink2 })), P(run(src, { font: F.mono, size: 10, color: C.mute }))], { spaceAfter: 2 }); };
  stat(M, '22.3%', 'of adults with diabetes worldwide have diabetic retinopathy (95% CI 19.7–25.0)', 'Teo et al., Ophthalmology 2021 · 59 studies');
  stat(M + 440, '≈ 1.3 M', 'adults (20–79) with diabetes in the UAE in 2024', 'IDF Diabetes Atlas · UAE country report');
  footer(s, 2);
}

// ═══ 03 · research question ═══════════════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '02 · Our research question');
  title(s, 'How accurately is a diagnosis read — and how can we measure that?', 780, { size: 31 });
  const steps = [['Retinal case', 'Workbench · 16 synthetic cases'], ['Evidence inspection', 'EvidenceLens'], ['Human interpretation', 'Diagnostic Duel · lock'], ['Reference comparison', 'Diagnostic Duel · reveal'], ['Reliability evaluation', 'Quality & Uncertainty · Accuracy Lab'], ['Human review', 'Review Queue · Clinician approval']];
  const bw = 130; const gap = 12.4; const x0 = M; const y0 = 190;
  steps.forEach(([a, b], i) => {
    const x = x0 + i * (bw + gap);
    rect(s, x, y0, bw, 96, i === 4 ? C.navy : C.paper, { line: i === 4 ? C.navy : C.line });
    text(s, x + 10, y0 + 10, 28, 24, [P(`0${i + 1}`)], { font: F.mono, size: 11, color: i === 4 ? C.tealB : C.teal });
    text(s, x + 10, y0 + 34, bw - 18, 56, [P(a)], { font: F.head, size: 16, color: i === 4 ? C.ivory : C.ink, lineSpacing: 0.95 });
    if (i < 5) line(s, x + bw + 1, y0 + 48, x + bw + gap - 1, y0 + 48, C.teal, 1.25, { arrow: 1 });
    text(s, x, y0 + 106, bw, 40, [P(b)], { font: F.mono, size: 10, color: C.mute });
  });
  line(s, M, 372, W - M, 372, C.line);
  text(s, M, 384, 380, 18, [P('THE PLATFORM INVESTIGATES')], { font: F.mono, size: 11, color: C.teal });
  const verbs = ['Diagnostic interpretation', 'Evidence inspection', 'Error detection', 'Reliability', 'Accuracy evaluation', 'Accountability'];
  verbs.forEach((v, i) => text(s, M + (i % 3) * 290, 410 + Math.floor(i / 3) * 34, 280, 26, [P(v)], { font: F.head, size: 20, color: C.ink }));
  footer(s, 3);
}

// ═══ 04 · why retinal screening ═══════════════════════════════════════════════════════════════════
{
  const c = getCase('C10');
  const disc = c.plan.disc; const macula = c.plan.macula;
  const les = (type) => c.lesions.find((l) => l.type === type);
  const hem = c.lesions.filter((l) => l.type === 'hemorrhage' && l.quadrant === 'IT')[3] || les('hemorrhage');
  const bead = les('venous-beading'); const irma = les('irma');
  const s = S(C.navy);
  kicker(s, '03 · Why retinal screening?');
  const side = 424; const x0 = M; const y0 = 62;
  pic(s, asset('fundus-C10'), x0, y0, side, side, 'Synthetic teaching illustration of a left-eye retinal fundus image with many red haemorrhages and beaded veins, drawn by the prototype code. It is not a patient image.', { crop: { l: 0.02, r: 0.02, t: 0.02, b: 0.02 }, oval: 1 });
  const px = (x, y) => [x0 + ((768 + x * 737) / 1536 - 0.02) / 0.96 * side, y0 + ((768 + y * 737) / 1536 - 0.02) / 0.96 * side];
  const pins = [];
  const pin = (x, y, label) => {
    const [ax, ay] = px(x, y); const n = pins.length + 1; pins.push(label);
    oval(s, ax - 9, ay - 9, 18, 18, { fill: C.tealL, line: C.navy });
    text(s, ax - 9, ay - 9, 18, 18, [P(String(n))], { font: F.mono, size: 10, color: C.navy, align: 2, anchor: 3, bold: 1 });
  };
  pin(disc.x, disc.y, 'OPTIC DISC · nasal to the macula');
  pin(macula.x, macula.y, 'MACULA · FOVEA · sharpest vision');
  if (hem) pin(hem.x, hem.y, 'HAEMORRHAGE · authored reference annotation');
  if (bead) pin(bead.x, bead.y, 'VENOUS BEADING · a severe-grade sign');
  tag(s, x0 + 16, 478, 300, 'Synthetic illustration · not a patient', C.tealL);
  const tx = 520;
  text(s, tx, 60, 380, 120, [P('Retinal imaging gives diagnosis a structured case study.')], { font: F.head, size: 25, color: C.ivory, lineSpacing: 0.98 });
  text(s, tx, 180, 384, 90, [
    B(run('Visible evidence. ', { bold: 1, color: C.ivory }), 'Lesions can be seen, counted, located.'),
    B(run('A clear question. ', { bold: 1, color: C.ivory }), 'Refer — or re-screen.'),
    B(run('Two unequal errors. ', { bold: 1, color: C.ivory }), 'False negative · false positive.'),
  ], { size: 14, color: 'C9CFD6', spaceAfter: 6 });
  text(s, tx, 276, 384, 62, pins.map((l, i) => P(run(`${i + 1}  `, { color: C.tealL, bold: 1 }), run(l, { color: C.dim }))), { font: F.mono, size: 10, spaceAfter: 2 });
  // ICDR scale (editable)
  const lv = [['0', C.tealB], ['1', C.tealB], ['2', C.brick], ['3', C.brick], ['4', C.brick]];
  text(s, tx, 344, 380, 14, [P('ICDR SEVERITY · AUTHORED REFERENCE LABELS')], { font: F.mono, size: 10, color: C.dim });
  lv.forEach(([n, col], i) => { rect(s, tx + i * 76, 362, 70, 28, col); text(s, tx + i * 76, 368, 70, 18, [P(n)], { font: F.head, size: 15, color: 'FFFFFF', align: 2 }); });
  text(s, tx, 396, 150, 14, [P('NON-REFERABLE')], { font: F.mono, size: 10, color: C.tealL });
  text(s, tx + 152, 396, 228, 14, [P('REFERABLE · or suspected DME')], { font: F.mono, size: 10, color: 'E8A090' });
  text(s, tx, 420, 384, 44, [P(run('Retinal screening is the first research use case — not the limit of the platform.', { italic: 1, color: C.ivory }))], { font: F.head, size: 14 });
  text(s, tx, 472, 384, 30, [P('ICDR: Wilkinson et al., Ophthalmology 2003 · ETDRS Report 10, 1991')], { font: F.mono, size: 10, color: C.dim });
  footer(s, 4);
  void irma;
}

// ═══ 05 · EvidenceLens ════════════════════════════════════════════════════════════════════════════
{
  const s = S(C.navy);
  kicker(s, '04 · EvidenceLens — See beyond the image');
  title(s, 'Evidence first. Answer later.', 600, { size: 30 });
  const im = asset('lens-annotated'); const f = fit(im, 640, 392);
  const ix = M; const iy = 102;
  pic(s, im, ix, iy, f.w, 392, 'Screenshot of EvidenceLens showing a synthetic retinal image with coloured reference annotation layers, anatomical guides, and the layer panel with opacity and comparison controls.', { border: C.navyLine, crop: { l: 0, r: 0, t: 0.012, b: 0 } });
  cap(s, ix, iy + f.h + 6, f.w, 'LIVE APPLICATION · EvidenceLens · synthetic case C10 opened in Study Mode');
  const rx = ix + f.w + 26; const rw = W - M - rx;
  const items = [['ZOOM · PAN · NATIVE RES.', 'Wheel, pinch or keys; zoom level shown'], ['ANATOMY GUIDES', 'Disc outline · 1-DD macular zone · quadrants'], ['LAYERS + OPACITY', 'Annotation layers revealed one at a time'], ['GREEN-CHANNEL COMPARISON', 'Draggable plain | enhanced divider']];
  items.forEach(([a, b], i) => {
    const y = 108 + i * 52;
    line(s, rx, y, rx + 12, y, C.tealB, 1); text(s, rx + 18, y - 7, rw - 18, 46, [P(run(a, { font: F.mono, size: 10, color: C.tealL })), P(run(b, { size: 12.5, color: 'C9CFD6' }))], { spaceAfter: 1 });
  });
  const bl = asset('lens-blind'); const bd = dims(bl);
  rect(s, rx, 326, rw, 150, C.navy2, { line: C.navyLine });
  text(s, rx + 12, 334, rw - 24, 16, [P('BLIND-FIRST SAFEGUARD')], { font: F.mono, size: 10, color: 'E8A090' });
  text(s, rx + 12, 352, rw - 24, 120, [P(run('Reference annotations stay locked until the interpretation is locked.', { size: 14, color: C.ivory })), P(run('Reduces anchoring in the educational reading. Early access = Study Mode = practice only.', { size: 12, color: C.dim }))], { spaceAfter: 5 });
  void bl; void bd;
  footer(s, 5);
}

// ═══ 06 · diagnostic duel ═════════════════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '05 · Diagnostic Duel');
  title(s, 'Read. Lock. Reveal.', 520, { size: 40 });
  rect(s, 560, 62, W - M - 560, 44, C.paper, { line: C.brick });
  text(s, 570, 67, W - M - 580, 36, [P(run('EDUCATIONAL HUMAN-VERSUS-REFERENCE COMPARISON. ', { bold: 1, color: C.brick }), run('No trained diagnostic AI model is involved.', { color: C.ink2 }))], { font: F.mono, size: 10, anchor: 3 });
  const cols = [['READ', 'duel-read', '1 Observe  ·  2 Gradability  ·  3 Confidence  ·  4 Interpret', { l: 0.705, r: 0, t: 0.27, b: 0.3 }], ['LOCK', 'duel-read', '5 Lock — final, no edits', { l: 0.705, r: 0, t: 0.76, b: 0.015 }], ['REVEAL', 'duel-reveal', '6 Reference  ·  7 Discrepancies', { l: 0.705, r: 0, t: 0.02, b: 0.716 }]];
  const cw = 270; const gap = 27;
  cols.forEach(([h, a, steps, crop], i) => {
    const x = M + i * (cw + gap);
    text(s, x, 122, cw, 28, [P(h)], { font: F.head, size: 24, color: i === 2 ? C.brick : C.ink });
    const d = dims(asset(a));
    // the right-hand duel panel of the capture: a different region of it for each beat of Read / Lock / Reveal
    const pw = d.w * (1 - crop.l - crop.r); const ph = d.h * (1 - crop.t - crop.b); const k = Math.min(cw / pw, 280 / ph);
    pic(s, asset(a), x + (cw - pw * k) / 2, 156 + (280 - ph * k) / 2, pw * k, ph * k, `Screenshot of the Diagnostic Duel panel in its ${h.toLowerCase()} state.`, { crop, border: C.line });
    text(s, x, 444, cw, 30, [P(steps)], { font: F.mono, size: 10, color: C.teal });
    if (i < 2) line(s, x + cw + 4, 296, x + cw + gap - 4, 296, C.teal, 1.25, { arrow: 1 });
  });
  text(s, M, 478, 860, 24, [P(run('The interpretation comes first. ', { bold: 1, color: C.ink }), run('The reference comes afterward.', { color: C.ink2 }))], { font: F.head, size: 17 });
  footer(s, 6);
}

// ═══ 07 · reliability ═════════════════════════════════════════════════════════════════════════════
{
  const o = quality.original.metrics; const b7 = quality.blur7.metrics; const dk = quality.washed.metrics;
  const f1 = (v) => v.toFixed(2);
  const lvl = (x) => ({ adequate: 'ADEQUATE', borderline: 'BORDERLINE', insufficient: 'INSUFFICIENT' }[x]);
  const s = S(C.navy);
  kicker(s, '06 · Quality & Uncertainty — Reliability under pressure');
  title(s, 'Judge the evidence before the interpretation.', 700, { size: 29 });
  const imgs = [['fundus-C06', 'ORIGINAL', o, quality.original.level], ['fundus-C06-blur7', 'BLUR σ = 7 px', b7, quality.blur7.level], ['fundus-C06-washed', 'WASHED-OUT PRESET', dk, quality.washed.level]];
  const isz = 214; const gx = 18;
  imgs.forEach(([a, lab, m, lv], i) => {
    const x = M + i * (isz + gx);
    pic(s, asset(a), x, 112, isz, isz, `Synthetic retinal image: ${lab.toLowerCase()}.`, { crop: { l: 0.02, r: 0.02, t: 0.02, b: 0.02 }, oval: 1 });
    text(s, x, 332, isz, 16, [P(lab)], { font: F.mono, size: 10, color: C.tealL, align: 2 });
    void m; void lv;
  });
  // measured indicators (from the application, not authored)
  const tx = M; const ty = 362;
  const rows = [['', 'ORIGINAL', 'BLUR σ 7', 'WASHED-OUT'], ['Sharpness', f1(o.sharpness), f1(b7.sharpness), f1(dk.sharpness)], ['Brightness', f1(o.brightness), f1(b7.brightness), f1(dk.brightness)], ['Contrast', f1(o.contrast), f1(b7.contrast), f1(dk.contrast)], ['Verdict', lvl(quality.original.level), lvl(quality.blur7.level), lvl(quality.washed.level)]];
  rows.forEach((r, i) => {
    const y = ty + i * 25;
    line(s, tx, y, tx + 690, y, C.navyLine, i === 0 ? 1 : 0.5);
    r.forEach((c, j) => text(s, tx + (j === 0 ? 0 : 150 + (j - 1) * 180), y + 5, 170, 18, [P(c)], { font: j === 0 || i === 0 ? F.mono : F.mono, size: 10, color: i === 0 ? C.dim : j === 0 ? C.dim : i === 4 ? (c === 'ADEQUATE' ? C.tealL : c === 'BORDERLINE' ? 'E8C070' : 'E8A090') : C.ivory }));
  });
  const rx = 770;
  text(s, rx, 112, W - M - rx, 340, [
    P(run('MEASURED FROM PIXELS', { font: F.mono, size: 10, color: C.tealL })),
    P(run('Sharpness · brightness · contrast · evenness · field coverage', { size: 13, color: 'C9CFD6' })),
    P(run('NO INVENTED CONFIDENCE', { font: F.mono, size: 10, color: 'E8A090' })),
    P(run('No model, so no model response to degradation is shown.', { size: 13, color: 'C9CFD6' })),
    P(run('NO-RESULT PATHWAY', { font: F.mono, size: 10, color: C.tealL })),
    P(run('Insufficient quality → no grade → recapture.', { size: 13, color: 'C9CFD6' })),
    P(run('HEURISTICS', { font: F.mono, size: 10, color: C.dim })),
    P(run('Tuned on 16 teaching images; not clinically validated.', { size: 13, color: C.dim })),
  ], { spaceAfter: 5 });
  cap(s, M, 488, 700, 'Values: the prototype’s own quality functions on case C06 (768 px analysis render), recorded by capture.mjs');
  footer(s, 7);
}

// ═══ 08 · accuracy lab ════════════════════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '07 · Accuracy Laboratory — The technical centrepiece');
  title(s, 'Measured, not claimed.', 520, { size: 42 });
  // editable confusion-matrix diagram (symbols only — no invented numbers)
  const mx = M + 52; const my = 160; const cw = 120; const chh = 96;
  text(s, mx, my - 32, cw * 2, 14, [P('PREDICTED')], { font: F.mono, size: 10, color: C.mute, align: 2 });
  text(s, mx, my - 18, cw, 14, [P('Referable')], { font: F.mono, size: 10, color: C.ink2, align: 2 });
  text(s, mx + cw, my - 18, cw, 14, [P('Non-referable')], { font: F.mono, size: 10, color: C.ink2, align: 2 });
  text(s, M - 4, my + chh - 20, 52, 14, [P('REFERENCE')], { font: F.mono, size: 10, color: C.mute });
  text(s, M - 4, my + 14, 52, 28, [P('Referable')], { font: F.mono, size: 10, color: C.ink2 });
  text(s, M - 4, my + chh + 14, 52, 28, [P('Non-ref.')], { font: F.mono, size: 10, color: C.ink2 });
  const cell = (cx2, cy2, sym, word, fill, line2, col) => { rect(s, cx2, cy2, cw - 4, chh - 4, fill, { line: line2 }); text(s, cx2 + 12, cy2 + 10, cw - 28, 40, [P(sym)], { font: F.head, size: 34, color: col }); text(s, cx2 + 12, cy2 + 56, cw - 28, 28, [P(word.toUpperCase())], { font: F.mono, size: 10, color: col }); };
  cell(mx, my, 'TP', 'true positive', 'DDEBE8', C.teal, C.teal);
  cell(mx + cw, my, 'FN', 'false negative · missed', 'F0D9D2', C.brick, C.brick);
  cell(mx, my + chh, 'FP', 'false positive · over-referral', 'F1E4C4', C.ochre, C.ochre);
  cell(mx + cw, my + chh, 'TN', 'true negative', 'DDE6F0', C.blue, C.blue);
  text(s, M, 360, 300, 28, [P('DIAGRAM — NOT A RESULT. NO MODEL HAS BEEN EVALUATED.')], { font: F.mono, size: 10, color: C.brick });
  // what it computes
  const cx = 366;
  text(s, cx, 128, 270, 14, [P('THE LABORATORY COMPUTES')], { font: F.mono, size: 10, color: C.teal });
  const chips = ['Sensitivity', 'Specificity', 'PPV · NPV', 'Accuracy', 'ROC · AUC', 'Wilson 95% CI', 'Threshold analysis', 'Error cases'];
  chips.forEach((c, i) => { const x = cx + (i % 2) * 130; const y = 150 + Math.floor(i / 2) * 36; rect(s, x, y, 124, 28, C.paper, { line: C.line }); text(s, x + 8, y + 6, 112, 18, [P(c)], { font: F.mono, size: 10, color: C.ink }); });
  text(s, cx, 306, 256, 14, [P('AND IT PROTECTS THE EVALUATION')], { font: F.mono, size: 10, color: C.teal });
  text(s, cx, 324, 262, 120, [B('Patient-level leakage refused'), B('Threshold chosen on validation only'), B('Test evaluated once · counted'), B('Provenance: file SHA-256 + declared metadata')], { size: 13, color: C.ink2, spaceAfter: 3 });
  // honest application state
  const im = asset('lab-status'); const f = fit(im, 244, 300);
  pic(s, im, W - M - f.w, 128, f.w, 300, 'Screenshot of the Accuracy Laboratory status page: No research model has been evaluated.', { border: C.line });
  cap(s, W - M - f.w, 128 + f.h + 6, f.w, 'LIVE APPLICATION · actual state: no research model evaluated');
  rect(s, M, 450, W - 2 * M, 50, C.navy);
  text(s, M + 16, 452, W - 2 * M - 32, 46, [P('“The platform does not ask users to believe an accuracy claim. It establishes how that claim should be tested.”')], { font: F.head, size: 16, color: C.ivory, italic: 1, anchor: 3 });
  footer(s, 8);
}

// ═══ 09 · human oversight & CareBridge ═══════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '08 · Human oversight and CareBridge');
  title(s, 'The decision stays human.', 560, { size: 38 });
  const steps = ['Interpretation', 'Review', 'Approval', 'Conditional referral draft'];
  steps.forEach((a, i) => {
    const x = M + i * 212; const last = i === 3;
    rect(s, x, 128, 198, 44, last ? C.teal : C.paper, { line: last ? C.teal : C.line });
    text(s, x + 12, 128, 30, 44, [P(`0${i + 1}`)], { font: F.mono, size: 10, color: last ? C.tealL : C.teal, anchor: 3 });
    text(s, x + 40, 128, 152, 44, [P(a)], { font: F.head, size: 16, color: last ? 'FFFFFF' : C.ink, anchor: 3 });
    if (i < 3) line(s, x + 199, 150, x + 211, 150, C.teal, 1.25, { arrow: 1 });
  });
  const a = asset('review'); const fa = fit(a, 410, 250);
  const b = asset('carebridge'); const fb = fit(b, 410, 250);
  pic(s, a, M, 190, fa.w, 250, 'Screenshot of the Review Queue showing cases, interpretations, discrepancy flags and the provenance ledger.', { border: C.line });
  pic(s, b, M + 438, 190, fb.w, 250, 'Screenshot of CareBridge showing a synthetic referral letter drafted from an approved disposition.', { border: C.line });
  cap(s, M, 190 + fa.h + 6, 410, 'LIVE APPLICATION · Review Queue · discrepancy flags (sample records)');
  cap(s, M + 438, 190 + fb.h + 6, 410, 'LIVE APPLICATION · CareBridge · drafted only after approval');
  text(s, M, 476, 860, 28, [P(run('It drafts a referral only after an eligible disposition is approved. ', { color: C.ink }), run('It does not decide urgency or treatment.', { color: C.brick, bold: 1 }))], { font: F.head, size: 15 });
  footer(s, 9);
}

// ═══ 10 · responsible AI ═════════════════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '09 · Responsible AI by design');
  title(s, 'Safeguards that are already built.', 700, { size: 34 });
  const cols = [['SAFETY', C.brick, ['Synthetic cases only', 'No real patient uploads', 'No fabricated AI predictions', 'Image-quality awareness']], ['TRANSPARENCY', C.teal, ['Blind-first interpretation', 'Defined, attributed reference labels', 'Evaluation provenance recorded', 'Limitations stated on the page', 'English and Arabic interface']], ['ACCOUNTABILITY', C.blue, ['Human approval of every disposition', 'Records stay in local browser storage', 'Leakage checks protect evaluation', 'Review workflows', 'References, interpretations and decisions kept separate']]];
  cols.forEach(([h, col, items], i) => {
    const x = M + i * 288; const w = 264;
    rect(s, x, 138, w, 3, col);
    text(s, x, 152, w, 26, [P(h)], { font: F.mono, size: 13, color: col });
    text(s, x, 186, w, 40, [P(`0${i + 1}`)], { font: F.head, size: 30, color: C.line, italic: 1 });
    text(s, x, 232, w, 220, items.map((t) => B(t)), { size: 15, color: C.ink2, spaceAfter: 8 });
  });
  rect(s, M, 458, W - 2 * M, 38, C.paper, { line: C.brick });
  text(s, M + 14, 458, W - 2 * M - 28, 38, [P(run('NOT CLINICALLY APPROVED · NOT A MEDICAL DEVICE · NOT FOR REAL PATIENT CARE', { bold: 1 }))], { font: F.mono, size: 11, color: C.brick, anchor: 3 });
  footer(s, 10);
}

// ═══ 11 · roadmap ════════════════════════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, '10 · From prototype to clinical research');
  title(s, 'The next step is not deployment.', 780, { size: 34 });
  text(s, M, 94, 700, 32, [P(run('It is rigorous validation.', { italic: 1, color: C.teal }))], { font: F.head, size: 24 });
  const ph = [
    ['TODAY', 'Prototype', ['16 synthetic cases', 'Evidence inspection', 'Interpretation workflow', 'Evaluation engine', 'Human review'], true],
    ['PHASE 1', 'Representative data', ['Licensed retinal dataset', 'Patient-separated train / validation / test'], false],
    ['PHASE 2', 'Research model', ['Train and evaluate', 'Document architecture, training, limits'], false],
    ['PHASE 3', 'External validation', ['External dataset', 'Subgroups · calibration', 'Quality robustness · errors'], false],
    ['PHASE 4', 'Clinician-supervised research', ['Performance · workflow', 'Automation bias', 'Human–AI collaboration'], false],
    ['PHASE 5', 'Prospective evaluation', ['Prospective studies', 'Governance · security', 'Regulatory requirements'], false],
  ];
  const w = 135; const gap = 6; const y = 150;
  line(s, M, y + 22, W - M, y + 22, C.line, 1.5);
  ph.forEach(([k, h, items, done], i) => {
    const x = M + i * (w + gap);
    oval(s, x, y + 14, 16, 16, done ? { fill: C.teal } : { fill: C.ivory, line: C.mute });
    text(s, x, y - 6, w, 14, [P(k)], { font: F.mono, size: 10, color: done ? C.teal : C.mute });
    rect(s, x, y + 44, w, 276, done ? C.navy : C.paper, { line: done ? C.navy : C.line, ...(done ? {} : { dash: 1 }) });
    text(s, x + 10, y + 54, w - 18, 60, [P(h)], { font: F.head, size: 16, color: done ? C.ivory : C.ink, lineSpacing: 0.95 });
    text(s, x + 10, y + 118, w - 18, 196, items.map((t) => B(t)), { size: 12.5, color: done ? 'C9CFD6' : C.ink2, spaceAfter: 6 });
  });
  text(s, M, 478, 860, 20, [P(run('Solid = implemented in the published prototype.  Dashed = future research, not built.', { font: F.mono, size: 10, color: C.mute }))], {});
  footer(s, 11);
}

// ═══ 12 · closing ════════════════════════════════════════════════════════════════════════════════
{
  const s = S(C.navy);
  kicker(s, '11 · Intelligence requires evidence');
  text(s, M, 62, 560, 250, [P('“The future of diagnostic AI should not be judged by how confidently it predicts — but by how reliably its accuracy can be demonstrated.”')], { font: F.head, size: 29, color: C.ivory, italic: 1, lineSpacing: 1.0 });
  const pills = ['Transparent evidence', 'Measurable accuracy', 'Responsible development', 'Human oversight'];
  pills.forEach((p, i) => { const x = M + (i % 2) * 190; const y = 322 + Math.floor(i / 2) * 32; rect(s, x, y, 180, 24, C.navy2, { line: C.navyLine }); text(s, x, y + 5, 180, 16, [P(p.toUpperCase())], { font: F.mono, size: 10, color: C.tealL, align: 2 }); });
  text(s, M, 400, 520, 100, [
    P(run('Diagnostic Intelligence Lab', { font: F.head, size: 18, color: C.ivory })),
    P(run('May Ahmed Mourad (G12) · Shamsa Faris Almazrouei (G12) · Fatima Mohamed Almazrouei (G11)', { size: 12, color: 'C9CFD6' })),
    P(run('ADNOC Schools — Madinat Zayed · Al Dhafra Health Forum · Accurate Diagnosis — التشخيص الدقيق', { size: 12, color: 'C9CFD6' })),
  ], { spaceAfter: 3 });
  const qr = asset('qr-live-prototype');
  rect(s, 690, 70, 214, 232, 'FFFFFF');
  pic(s, qr, 702, 82, 190, 190, 'QR code linking to the live Diagnostic Intelligence Lab prototype at maymourad.github.io/Diagnostic-Intelligence-Lab.', {});
  text(s, 690, 272, 214, 24, [P('SCAN · LIVE PROTOTYPE')], { font: F.mono, size: 10, color: C.ink, align: 2 });
  text(s, 604, 316, 300, 20, [P(run('maymourad.github.io/', { color: C.tealL }), run('Diagnostic-Intelligence-Lab', { color: C.ivory, bold: 1 }))], { font: F.mono, size: 11, link: URL_LIVE, align: 3 });
  text(s, 604, 342, 300, 30, [P('Open source · MIT · github.com/MayMourad/Diagnostic-Intelligence-Lab')], { font: F.mono, size: 10, color: C.dim, align: 3 });
  footer(s, 12);
}

// ═══ Appendix A · evaluation mathematics ═════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, 'Appendix A · Diagnostic evaluation mathematics', M, 32);
  title(s, 'Four counts. Everything else follows.', 760, { size: 32 });
  const defs = [['Sensitivity', 'TP ÷ (TP + FN)', 'Of the truly referable, the share found. Misses are FN.'], ['Specificity', 'TN ÷ (TN + FP)', 'Of the truly non-referable, the share correctly cleared.'], ['PPV', 'TP ÷ (TP + FP)', 'When it says “refer”, how often it is right — depends on prevalence.'], ['NPV', 'TN ÷ (TN + FN)', 'When it says “routine”, how often it is right — depends on prevalence.'], ['Accuracy', '(TP + TN) ÷ all', 'Overall agreement; can hide a poor sensitivity when disease is rare.'], ['Wilson 95% CI', 'p̂ ± z·√(p̂(1−p̂)/n + z²/4n²) ÷ (1+z²/n)', 'Interval for a proportion; wide when n is small.']];
  defs.forEach(([a, f, d], i) => {
    const x = M + (i % 2) * 436; const y = 128 + Math.floor(i / 2) * 78;
    line(s, x, y, x + 408, y, C.line);
    text(s, x, y + 6, 120, 20, [P(a)], { font: F.head, size: 16, color: C.ink });
    text(s, x + 124, y + 7, 284, 18, [P(f)], { font: F.mono, size: 10.5, color: C.teal });
    text(s, x + 124, y + 28, 286, 46, [P(d)], { size: 12.5, color: C.ink2 });
  });
  const im = asset('lab-simulator'); const f = fit(im, 420, 160);
  text(s, M, 366, 420, 70, [P(run('THRESHOLD TRADE-OFF', { font: F.mono, size: 10, color: C.teal })), P(run('Raising the decision threshold trades sensitivity for specificity — it never improves both. The simulator at right is stamped SIMULATION and uses random scores, not a model.', { size: 13, color: C.ink2 }))], { spaceAfter: 3 });
  pic(s, im, M + 436, 366, 408, 128, 'Simulator view of the Accuracy Laboratory, stamped as an educational simulation, showing threshold controls and confusion matrix.', { border: C.line, crop: { l: 0, r: 0, t: 0, b: 0.55 } });
  void f;
  footer(s, 1, null, true);
}

// ═══ Appendix B · dataset integrity ══════════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, 'Appendix B · Dataset integrity', M, 32);
  title(s, 'A good result on bad data is a bad result.', 780, { size: 31 });
  const flow = [['Held-out file', 'id · patient · split · reference · score'], ['Integrity checks', 'leakage · duplicates · class balance'], ['Threshold', 'validation data only'], ['Test, once', 'evaluations are counted'], ['Provenance', 'SHA-256 · declared metadata']];
  flow.forEach(([a, b], i) => {
    const x = M + i * 170;
    rect(s, x, 126, 158, 62, i === 1 ? C.navy : C.paper, { line: i === 1 ? C.navy : C.line });
    text(s, x + 10, 132, 138, 20, [P(a)], { font: F.head, size: 15, color: i === 1 ? C.ivory : C.ink });
    text(s, x + 10, 154, 138, 30, [P(b)], { font: F.mono, size: 10, color: i === 1 ? C.tealL : C.mute });
    if (i < 4) line(s, x + 159, 157, x + 169, 157, C.teal, 1.25, { arrow: 1 });
  });
  text(s, M, 204, 400, 190, [
    B(run('Patient-level leakage: ', { bold: 1 }), 'one patient, one partition.'),
    B(run('Separation: ', { bold: 1 }), 'train fits, validation selects, test reports once.'),
    B(run('Provenance: ', { bold: 1 }), 'who made the model, on what data — declared, hashed.'),
    B(run('External validation: ', { bold: 1 }), 'a different site or camera.'),
    B(run('Reproducibility: ', { bold: 1 }), 'fixed seeds, unit-tested engine, CI.'),
  ], { size: 14, color: C.ink2, spaceAfter: 7 });
  const im = asset('lab-integrity'); const f = fit(im, 408, 290);
  pic(s, im, M + 440, 204, f.w, 290, 'Screenshot of the Accuracy Laboratory refusing a synthetic predictions file because one patient appears in more than one partition.', { border: C.line });
  cap(s, M + 440, 204 + f.h + 4, 420, 'LIVE APPLICATION · synthetic test file with a deliberate leak → reporting blocked');
  footer(s, 2, null, true);
}

// ═══ Appendix C · status & limitations ═══════════════════════════════════════════════════════════
{
  const s = S(C.ivory);
  kicker(s, 'Appendix C · Current status and limitations', M, 32);
  title(s, 'Exactly what exists — and what does not.', 780, { size: 31 });
  const cols = [
    ['IMPLEMENTED', C.teal, ['Entry, Workbench, EvidenceLens', 'Diagnostic Duel · quality and stress test', 'Clinician approval · review · CareBridge', 'English and Arabic interface']],
    ['SYNTHETIC · EDUCATIONAL', C.ochre, ['16 retinal teaching illustrations', 'Authored lesions → ICDR-derived labels', 'Statistics simulator (stamped)', 'Educational duel score']],
    ['EVALUATION INFRASTRUCTURE', C.blue, ['Confusion matrix, sens/spec, PPV/NPV, AUC, Wilson CI', 'Held-out import · leakage checks', 'Validation-only thresholds', '31 unit + 35 browser tests · CI']],
    ['NOT IMPLEMENTED', C.brick, ['Any trained diagnostic model', 'Real-dataset evaluation', 'Validated sensitivity / specificity', 'Evidence of improved clinician accuracy']],
  ];
  cols.forEach(([h, col, items], i) => {
    const x = M + i * 212;
    rect(s, x, 128, 198, 3, col);
    text(s, x, 138, 198, 30, [P(h)], { font: F.mono, size: 11, color: col });
    text(s, x, 172, 198, 190, items.map((t) => B(t)), { size: 13, color: C.ink2, spaceAfter: 6 });
  });
  rect(s, M, 372, W - 2 * M, 126, C.paper, { line: C.line });
  text(s, M + 16, 380, 380, 110, [P(run('REQUIRED BEFORE ANY CLINICAL USE', { font: F.mono, size: 10, color: C.teal })), B('Licensed data and ethics approval'), B('External and prospective validation'), B('Clinician-supervised research'), B('Governance, security, regulatory review')], { size: 13, color: C.ink2, spaceAfter: 3 });
  text(s, M + 440, 380, 400, 110, [P(run('WHY IT IS NOT A MEDICAL DEVICE', { font: F.mono, size: 10, color: C.brick })), B('No validated performance claim'), B('Synthetic cases only; no patient data'), B('Never produces a diagnosis or treatment advice'), B('Every decision is a human’s')], { size: 13, color: C.ink2, spaceAfter: 3 });
  footer(s, 3, null, true);
}

// speaker notes come from script.mjs (the same text that is printed in SPEAKER_SCRIPT.md)
slides.forEach((s, i) => { s.notes = i < 12 ? noteFor(i + 1) : APPENDIX_NOTES[i - 12]; });
writeFileSync(resolve(root, 'presentation/source/spec.json'), JSON.stringify({ width: W, height: H, slides }, null, 1));
console.log(`spec: ${slides.length} slides`);
