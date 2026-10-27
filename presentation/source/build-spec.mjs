// Builds presentation/spec.json (the 12-slide deck) from real screenshots and real test results, then PowerPoint renders it.
// Usage: node presentation/build-spec.mjs && ./presentation/render-deck.ps1 -SpecPath presentation/spec.json -Out presentation/Diagnostic-Intelligence-Lab.pptx -PngDir presentation/render   (Windows + PowerPoint)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Image paths are written repo-relative (screenshots/<name>.png); render-deck.ps1 resolves them against the repo root.
const shot = (n) => { const rel = `screenshots/${n}.png`; if (!existsSync(resolve(root, rel))) throw new Error(`missing screenshot ${n}`); return rel; };
const png = (rel) => { const b = readFileSync(resolve(root, rel)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const tests = existsSync(resolve(root, 'docs/TEST_RESULTS.json')) ? JSON.parse(readFileSync(resolve(root, 'docs/TEST_RESULTS.json'), 'utf8')) : { total: 0, passed: 0 };

const C = { navy: '0A1A2C', navy2: '12304F', ivory: 'F7F2E8', paper: 'FCFAF4', ink: '0A1A2C', ink2: '3B4A5C', mute: '67707B', line: 'CFC6B3', teal: '2A665F', tealB: '4A9A92', brick: 'A94632', ochre: '8F6614', blue: '2F6FB7', beige: 'E9DFCC' };
const F = { head: 'Georgia', body: 'Calibri', mono: 'Consolas' };

const run = (t, o = {}) => ({ t, ...o });
const P = (...runs) => ({ runs: runs.map((r) => (typeof r === 'string' ? run(r) : r)) });
const B = (...runs) => ({ ...P(...runs), bullet: true });
let slides = [];
const S = (bg, notes) => { const s = { bg, elements: [], notes }; slides.push(s); return s; };
const el = (s, e) => { s.elements.push(e); return e; };
let uid = 0;
const nm = (p) => `${p}-${++uid}`;
const text = (s, x, y, w, h, paras, o = {}) => el(s, { type: 'text', name: nm('txt'), x, y, w, h, paras: Array.isArray(paras) ? paras : [P(paras)], font: F.body, size: 16, color: C.ink, ...o });
const rect = (s, x, y, w, h, fill, o = {}) => el(s, { type: 'rect', name: nm('shape'), x, y, w, h, fill, ...o });
const line = (s, x1, y1, x2, y2, color = C.line, weight = 0.75, o = {}) => el(s, { type: 'line', name: nm('rule'), x1, y1, x2, y2, color, weight, ...o });
function pic(s, file, x, y, w, hmax, alt, o = {}) {
  const p = shot(file);
  return el(s, { type: 'img', name: nm('pic'), path: p, x, y, w, hmax, alt, border: C.line, ...o });
}
const kicker = (s, t, dark = false) => text(s, 48, 36, 700, 16, [P(run(t.toUpperCase()))], { font: F.mono, size: 11, color: dark ? C.tealB : C.teal });
const title = (s, t, w = 560, o = {}) => text(s, 48, 58, w, 84, [P(t)], { font: F.head, size: 32, color: C.ink, lineSpacing: 0.95, ...o });
const caption = (s, x, y, w, t, dark = false) => text(s, x, y, w, 28, [P(t)], { font: F.mono, size: 10, color: dark ? '9DB1C4' : C.mute });
function footer(s, n, dark = false) {
  text(s, 48, 512, 760, 14, [P('DIAGNOSTIC INTELLIGENCE LAB (PROVISIONAL TITLE) · EDUCATIONAL PROTOTYPE · SYNTHETIC IMAGES · NO RESEARCH MODEL IMPLEMENTED')], { font: F.mono, size: 10, color: dark ? '9DB1C4' : C.mute });
  text(s, 880, 512, 32, 14, [P(String(n).padStart(2, '0'))], { font: F.mono, size: 10, color: dark ? '9DB1C4' : C.mute, align: 3 });
}
const chip = (s, x, y, w, label, color) => {
  rect(s, x, y, w, 20, C.paper, { line: color });
  text(s, x, y + 3, w, 14, [P(label.toUpperCase())], { font: F.mono, size: 10, color, align: 2 });
};

// ───── 01 title ─────
{
  const s = S(C.navy, 'Opening. This is a student research prototype by May Ahmed Mourad, Shamsa Faris Almazrouei and Fatima Mohamed Almazrouei (Grade 12, ADNOC Schools - Madinat Zayed). The name is provisional. The question we ask is not "can AI diagnose?" but "how accurately is a diagnosis read, and how would we know?" The eye on the right is our own 3D model - a schematic, not clinical evidence.');
  text(s, 48, 54, 600, 16, [P('STUDENT RESEARCH PROTOTYPE · ADNOC SCHOOLS — MADINAT ZAYED')], { font: F.mono, size: 11, color: C.tealB });
  text(s, 48, 96, 470, 230, [P('Diagnostic'), P('Intelligence'), P(run('Lab', { italic: 1, color: '8FD0C8' }))], { font: F.head, size: 58, color: C.ivory, lineSpacing: 0.92 });
  text(s, 48, 334, 440, 60, [P('How accurately is a diagnosis read — and how would we know?')], { font: F.head, size: 20, color: 'C9CFD6', italic: 1 });
  text(s, 48, 410, 440, 76, [P('May Ahmed Mourad · G12'), P('Shamsa Faris Almazrouei · G12'), P('Fatima Mohamed Almazrouei · G12')], { size: 14, color: C.ivory, lineSpacing: 1.05, spaceAfter: 2 });
  text(s, 48, 488, 440, 16, [P('Provisional project title · a final brand has not been chosen')], { font: F.mono, size: 10, color: '9DB1C4' });
  pic(s, 'entry-2-section', 480, 150, 432, 245, 'Screenshot of the prototype entry page: an original 3D model of a human right eye, cut in section, showing the lens, vitreous body and retina.', { border: '234A73' });
  caption(s, 480, 402, 432, 'Screenshot · original WebGL eye, schematic and not to scale', true);
}

// ───── 02 the diagnostic problem ─────
{
  const s = S(C.ivory, 'The problem. Diabetic retinopathy can damage sight before symptoms appear, so screening programmes photograph the retina and a reader decides: refer, or re-screen. That decision rests on small signs and on whether the image can be read at all. Two errors matter and they are not equal: a false negative sends disease home; a false positive causes an unnecessary referral. The screenshot is our viewer with the answer deliberately hidden.');
  kicker(s, '01 · The diagnostic problem');
  title(s, 'A photograph is only as useful as its reading.', 420);
  text(s, 48, 168, 392, 230, [
    B(run('Screening asks one question per image: ', { bold: 1 }), 'refer, or re-screen?'),
    B('The answer rests on small signs — a few microaneurysms, a haemorrhage near the edge — and on whether the image can be read at all.'),
    B('Readers disagree, and cases near a boundary are where errors cluster.'),
  ], { size: 16, color: C.ink2, spaceAfter: 9 });
  pic(s, 'wb-lens-blind', 470, 40, 442, 252, 'Screenshot of the EvidenceLens viewer showing a synthetic retinal image with no annotations: reference labels are hidden until the reader locks an interpretation.', {});
  caption(s, 470, 296, 442, 'Screenshot · the viewer in blind mode: labels and annotations are locked');
  rect(s, 470, 340, 215, 150, C.paper, { line: C.brick });
  text(s, 482, 350, 192, 130, [P(run('FALSE NEGATIVE', { font: F.mono, size: 10, color: C.brick })), P(run('Disease sent home as normal.', { font: F.head, size: 17 })), P(run('The costly error: treatment is delayed and sight-threatening disease can progress unseen.', { size: 13, color: C.ink2 }))], { size: 14, spaceAfter: 4 });
  rect(s, 697, 340, 215, 150, C.paper, { line: C.ochre });
  text(s, 709, 350, 192, 130, [P(run('FALSE POSITIVE', { font: F.mono, size: 10, color: C.ochre })), P(run('A needless referral.', { font: F.head, size: 17 })), P(run('Cost, worry and queue pressure — usually the safer error, but at scale it can overwhelm a service.', { size: 13, color: C.ink2 }))], { size: 14, spaceAfter: 4 });
  footer(s, 2);
}

// ───── 03 hypothesis ─────
{
  const s = S(C.ivory, 'The research hypothesis in three parts, each tagged honestly. H1 we demonstrate educationally: a reading can be scored against a reference. H2 is specified and the statistics engine is built and unit-tested, but no model has been evaluated. H3, whether an AI aid improves clinician accuracy, is future work and needs a controlled reader study - we make no such claim.');
  kicker(s, '02 · Research hypothesis');
  title(s, 'Reading accuracy can be measured — case by case.', 864, { size: 30 });
  const card = (x, n, tag, tagColor, head, body) => {
    rect(s, x, 158, 272, 320, C.paper, { line: C.line });
    text(s, x + 18, 172, 80, 50, [P(n)], { font: F.head, size: 40, color: C.teal, italic: 1 });
    chip(s, x + 18, 232, tag.length * 7.2 + 24, tag, tagColor);
    text(s, x + 18, 266, 236, 60, [P(head)], { font: F.head, size: 18, color: C.ink });
    text(s, x + 18, 338, 238, 134, [P(body)], { size: 14, color: C.ink2 });
  };
  card(48, 'H1', 'Demonstrated · educational', C.teal, 'Readings can be scored against a reference.', 'On a defined set, each human reading is compared with a reference label: sensitivity, specificity — and where the errors cluster.');
  card(344, 'H2', 'Specified · engine built', C.ochre, 'The same protocol can test any AI aid, honestly.', 'Patient-level split, threshold fixed on validation data only, one test pass. No model has been evaluated yet.');
  card(640, 'H3', 'Future · not claimed', C.brick, 'Does an AI aid improve clinicians?', 'That needs a controlled reader study. This project makes no such claim and the app says so.');
  footer(s, 3);
}

// ───── 04 reference standards ─────
{
  const s = S(C.ivory, 'Expert reference standards. We use the ICDR five-level scale (Wilkinson et al., Ophthalmology 2003). Referable means moderate NPDR or worse, or suspected macular oedema. The 4-2-1 rule defines severe disease. Important honesty point: in this prototype the reference label is authored from each case\'s own lesion list and re-derived by an automated test - it is a teaching reference, not an independent expert panel. A real study needs several graders and adjudication.');
  kicker(s, '03 · Expert reference standards');
  title(s, 'What counts as the truth?', 560);
  const lv = [['0', 'None', C.tealB], ['1', 'Mild', C.tealB], ['2', 'Moderate', C.brick], ['3', 'Severe', C.brick], ['4', 'Proliferative', C.brick]];
  lv.forEach(([n, name, col], i) => {
    const x = 48 + i * 82;
    rect(s, x, 128, 76, 54, col);
    text(s, x + 8, 132, 60, 28, [P(n)], { font: F.head, size: 24, color: 'FFFFFF' });
    text(s, x + 8, 162, 66, 16, [P(name)], { size: 11, color: 'FFFFFF' });
  });
  text(s, 48, 188, 160, 16, [P('NON-REFERABLE')], { font: F.mono, size: 10, color: C.teal });
  text(s, 212, 188, 246, 16, [P('REFERABLE · or suspected DME')], { font: F.mono, size: 10, color: C.brick });
  text(s, 48, 218, 410, 262, [
    B(run('ICDR scale, 5 levels. ', { bold: 1 }), 'Referable = moderate NPDR or worse, or suspected macular oedema.'),
    B(run('4-2-1 rule ', { bold: 1 }), 'for severe: haemorrhages in 4 quadrants, venous beading in 2, or IRMA in 1.'),
    B(run('Here the reference is authored ', { bold: 1 }), 'from each case’s lesion list and re-derived by an automated test — a teaching reference, not an expert panel.'),
    B('A real study needs several graders, adjudication, and disclosed disagreement.'),
  ], { size: 15, color: C.ink2, spaceAfter: 7 });
  pic(s, 'wb-lens-finding', 480, 120, 432, 243, 'Screenshot of the EvidenceLens finding panel for a neovascularisation annotation, with its description, location, grading relevance and a link to the ICDR source.');
  caption(s, 480, 366, 432, 'Screenshot · every annotation links to its grading source and states who authored it');
  text(s, 480, 402, 432, 80, [P(run('Source: ', { font: F.mono, size: 10, color: C.mute }), run('Wilkinson CP et al., Ophthalmology 2003;110(9):1677–82 · ETDRS Report 10 (1991).', { size: 12, color: C.ink2 }))], {});
  footer(s, 4);
}

// ───── 05 duel ─────
{
  const s = S(C.ivory, 'The Diagnostic Duel. The reader sees an image with no label, records an interpretation, locks it, and only then sees what the reference says. Because no model exists, the duel is Human vs Reference and is never labelled Human vs AI. The score is educational - a small synthetic set, not validated clinical performance - and it does not show that AI improves clinicians. If a reader opens the reference first, that case becomes practice-only and is excluded from the score.');
  kicker(s, '04 · Diagnostic Duel');
  title(s, 'Read it before you are told.', 560);
  const steps = ['Observe', 'Record', 'Lock', 'Model', 'Reference', 'Compare', 'Meaning', 'Record'];
  steps.forEach((t, i) => {
    const x = 48 + i * 108;
    rect(s, x, 128, 100, 6, i < 3 ? C.ink : i === 3 ? 'B8B1A0' : C.teal);
    text(s, x, 140, 100, 28, [P(`${i + 1} ${t}`)], { font: F.mono, size: 10, color: i === 3 ? C.mute : C.ink });
  });
  text(s, 48, 196, 380, 290, [
    B(run('Human vs Reference. ', { bold: 1 }), 'No model exists, so the model seat says “not implemented” — never “Human vs AI”.'),
    B(run('Locked first. ', { bold: 1 }), 'Opening reference layers earlier makes a case practice-only.'),
    B(run('Why it matters. ', { bold: 1 }), 'A false negative is explained as the costly error; a false positive as a trade-off.'),
    B(run('Educational score ', { bold: 1 }), 'with 95% intervals — not validated clinical performance.'),
  ], { size: 15, color: C.ink2, spaceAfter: 8 });
  pic(s, 'wb-duel-reveal', 450, 184, 462, 300, 'Screenshot of the Diagnostic Duel after locking an interpretation: the reader’s answer, the reference label and a model seat reading not implemented.');
  caption(s, 450, 488, 462, 'Screenshot · a locked reading beside the reference; model seat: not implemented');
  footer(s, 5);
}

// ───── 06 EvidenceLens ─────
{
  const s = S(C.ivory, 'EvidenceLens. A retinal viewer with smooth zoom and pan, layered reference annotations that reveal one layer at a time, an opacity control, a draggable before/after comparison, lesion information panels with source links, image-quality indicators measured from the pixels, and a side-by-side of reference versus model output where the model column reads not implemented. The annotations are drawn from the same lesion list that generated the synthetic image - never produced by an AI model - and we say so in the interface.');
  kicker(s, '05 · EvidenceLens');
  title(s, 'Every annotation has an author and a source.', 400, { size: 27 });
  text(s, 48, 176, 390, 310, [
    B('Zoom, pan, fit and native resolution; keyboard operable.'),
    B('Layered reference annotations, revealed one layer at a time, with an opacity control.'),
    B('Draggable before / after: plain | annotated, and colour | green-channel enhanced.'),
    B('Lesion panels with location in disc diameters, grading relevance and source links.'),
    B('Image-quality indicators measured from pixels — not authored.'),
    B(run('Reference vs model side by side; the model column reads “not implemented”.', { bold: 1 })),
  ], { size: 15, color: C.ink2, spaceAfter: 7 });
  pic(s, 'wb-lens-compare', 470, 52, 440, 248, 'Screenshot of the draggable before and after comparison: the left half is the plain retinal image and the right half shows reference annotations over it.');
  caption(s, 470, 300, 440, 'Screenshot · draggable divider: plain | annotated');
  pic(s, 'wb-lens-enhanced', 470, 336, 300, 152, 'Screenshot of the green-channel enhanced comparison view of a retinal image, a standard preprocessing display.', { crop: { l: 0.02, r: 0.3, t: 0.35, b: 0.02 } });
  caption(s, 782, 340, 130, 'Screenshot · colour | green-channel enhanced');
  footer(s, 6);
}

// ───── 07 accuracy lab ─────
{
  const s = S(C.ivory, 'The Accuracy Laboratory. Confusion matrix, sensitivity and specificity with Wilson intervals, threshold exploration, error-case inspection and research limits. The statistics are exact and unit-tested. Three provenance treatments can never be confused: real held-out predictions in solid navy, educational simulation in dashed teal with a stamp, and the learner\'s own duel record in ochre. What you see in the screenshot is the simulator - stamped SIMULATION - not a research result.');
  kicker(s, '06 · Accuracy Laboratory');
  title(s, 'Measured, not claimed.', 420);
  pic(s, 'lab-simulator', 48, 120, 470, 330, 'Screenshot of the Accuracy Laboratory simulator: a dashed banner reading educational simulation, a confusion matrix, sensitivity and specificity bars with intervals, and charts stamped simulation.');
  caption(s, 48, 456, 470, 'Screenshot · the simulator — stamped SIMULATION; not a research result');
  text(s, 548, 128, 364, 210, [
    B('Confusion matrix, sensitivity, specificity, PPV, NPV, AUC, 95% intervals.'),
    B('Threshold chosen on validation data only; test partition counted so repeated peeking shows.'),
    B('Held-out file import refuses patient-level leakage.'),
    B('Error cases listed with image ids.'),
  ], { size: 15, color: C.ink2, spaceAfter: 7 });
  const prov = [['REAL', 'Held-out predictions you supply', C.blue, false], ['SIMULATED', 'Educational, synthetic, stamped', C.teal, true], ['LEARNER', 'Your duel record, educational', C.ochre, false]];
  prov.forEach(([k, d, col, dash], i) => {
    const y = 352 + i * 44;
    rect(s, 548, y, 364, 36, C.paper, dash ? { line: col, dash: 1 } : { line: col });
    text(s, 560, y + 5, 90, 14, [P(k)], { font: F.mono, size: 10, color: col });
    text(s, 650, y + 9, 256, 18, [P(d)], { size: 13, color: C.ink2 });
  });
  footer(s, 7);
}

// ───── 08 false negatives & uncertainty ─────
{
  const s = S(C.ivory, 'False negatives and diagnostic uncertainty. On the left, what the Duel says after a false negative: the costly error, the consequence, and a hint drawn from the reference lesion list. On the right, the Reliability Stress Test: blur, brightness and contrast change the image in real time and the quality indicators are measured from the pixels. When the image becomes unsuitable the app gives no result and shows a recapture pathway. It never invents a model confidence - there is no model.');
  kicker(s, '07 · False negatives and diagnostic uncertainty');
  title(s, 'The costly error is the quiet one.', 520);
  const m = png(shot('wb-duel-meaning'));
  pic(s, 'wb-duel-meaning', 48, 136, 330, 260, 'Screenshot of the duel outcome panel explaining a false negative: the costly error in screening, with details from the reference lesion list and an educational record.', { crop: { l: 0.69, r: 0, t: 0.1, b: 0.5 } });
  caption(s, 48, 400, 330, 'Screenshot · duel outcome after a false negative');
  pic(s, 'wb-stress-noresult', 400, 126, 512, 322, 'Screenshot of the Reliability Stress Test with the transformed image heavily blurred, quality gauges flagging sharpness as insufficient, and a no-result verdict.', { crop: { l: 0, r: 0, t: 0.215, b: 0.02 } });
  caption(s, 400, 450, 512, 'Screenshot · blur σ = 14: measured quality “insufficient” → no result, no confidence value');
  text(s, 48, 436, 340, 66, [P(run('Uncertainty is shown, not hidden: ', { bold: 1 }), 'measured quality, a no-result pathway, and a register of what limits confidence.')], { size: 14, color: C.ink2 });
  void m;
  footer(s, 8);
}

// ───── 09 actual model evaluation ─────
{
  const s = S(C.ivory, 'Actual research-model evaluation. The honest answer: there is none. This machine has no Python environment, no GPU and no licensed research dataset, and training a toy model on sixteen synthetic drawings would be meaningless. So the protocol is specified in full, the statistics engine is implemented and tested, and the Laboratory will compute real results the moment a held-out predictions file is supplied. Until then every empty state says not implemented.');
  kicker(s, '08 · Actual research-model evaluation');
  title(s, 'No model has been evaluated — and the app says so.', 864, { size: 30 });
  const rows = [['Task defined (referable DR)', 'Done', C.teal], ['Dataset acquired, licence verified', 'Not done', C.brick], ['Patient-level split manifest', 'Not done', C.brick], ['Preprocessing documented', 'Specified only', C.ochre], ['Model trained (transfer learning)', 'Not done', C.brick], ['Threshold fixed on validation only', 'Specified · engine built', C.ochre], ['Test partition evaluated once', 'Specified · engine built', C.ochre], ['External validation', 'Not done', C.brick]];
  rows.forEach(([r, st, col], i) => {
    const y = 160 + i * 31;
    line(s, 48, y, 520, y);
    text(s, 48, y + 7, 270, 18, [P(`${i + 1}. ${r}`)], { size: 13, color: C.ink });
    text(s, 330, y + 8, 190, 16, [P(st.toUpperCase())], { font: F.mono, size: 10, color: col });
  });
  line(s, 48, 160 + 8 * 31, 520, 160 + 8 * 31);
  pic(s, 'lab-status', 548, 130, 364, 230, 'Screenshot of the Accuracy Laboratory status page stating that no research model has been evaluated.');
  caption(s, 548, 364, 364, 'Screenshot · the Laboratory’s status page');
  rect(s, 548, 396, 364, 98, C.paper, { line: C.teal });
  text(s, 562, 404, 340, 84, [P(run('WHAT WOULD CHANGE THIS', { font: F.mono, size: 10, color: C.teal })), P(run('A licensed dataset, a patient-level split, a trained baseline and one pre-registered test pass.', { size: 14, color: C.ink2 }))], { spaceAfter: 4 });
  footer(s, 9);
}

// ───── 10 responsible integration ─────
{
  const s = S(C.ivory, 'Responsible clinical integration. Before any clinical use there is a path: retrospective validation on a locally representative, patient-split dataset; silent prospective evaluation; an assisted-reading study that measures accuracy, time and automation bias; and regulated deployment with monitoring. This prototype stops before step one. Inside the prototype the safeguards are a human in the loop, a blind-first duel, five-way provenance, no fabrication, a no-result pathway, leakage control and privacy by design. The ledger on the right shows the five things we never merge.');
  kicker(s, '09 · Responsible clinical integration');
  title(s, 'A path with stops — and this prototype stops first.', 700, { size: 30 });
  const path = ['Retrospective validation', 'Silent prospective run', 'Assisted-reading study', 'Regulated deployment + monitoring'];
  path.forEach((t, i) => {
    const x = 48 + i * 218;
    rect(s, x, 150, 208, 62, i === 0 ? C.paper : C.paper, { line: i === 0 ? C.brick : C.line });
    text(s, x + 12, 158, 40, 30, [P(`0${i + 1}`)], { font: F.head, size: 22, color: C.teal, italic: 1 });
    text(s, x + 52, 160, 150, 46, [P(t)], { size: 13, color: C.ink });
  });
  text(s, 48, 218, 600, 18, [P('This prototype stops before step 1.')], { font: F.mono, size: 10, color: C.brick });
  text(s, 48, 252, 440, 236, [
    B(run('Human in the loop: ', { bold: 1 }), 'a person chooses and approves every disposition.'),
    B(run('Five-way provenance: ', { bold: 1 }), 'model, reference, annotations, clinician, disposition — never merged.'),
    B(run('No fabrication: ', { bold: 1 }), 'no invented confidence, no simulated scanning.'),
    B(run('No-result pathway and leakage control; ', { bold: 1 }), 'privacy by design, identifiers blocked.'),
  ], { size: 14, color: C.ink2, spaceAfter: 7 });
  pic(s, 'wb-approval', 510, 250, 402, 240, 'Screenshot of the clinician approval page with the provenance ledger listing five separate items: model prediction not implemented, reference label, reference annotations, clinician interpretation and final disposition.', { crop: { l: 0.545, r: 0.0, t: 0.31, b: 0.27 } });
  caption(s, 510, 492, 402, 'Screenshot · the provenance ledger');
  footer(s, 10);
}

// ───── 11 implemented / simulated / future ─────
{
  const passed = tests.passed; const total = tests.total;
  const s = S(C.ivory, `Feature status, in three columns. Implemented means working and tested. Simulated means a clearly labelled educational stand-in. Future means not built. Test results: ${total} browser tests in real Chrome (${passed} passing) plus unit tests for the statistics engine, ICDR reference consistency, bilingual parity and the identifier scanner.`);
  kicker(s, '10 · Implemented, simulated, future');
  title(s, 'What is real, what is a stand-in, what is not built.', 700, { size: 30 });
  const col = (x, head, color, items) => {
    rect(s, x, 138, 280, 4, color);
    text(s, x, 150, 280, 20, [P(head.toUpperCase())], { font: F.mono, size: 11, color });
    text(s, x, 178, 280, 270, items.map((i) => B(i)), { size: 14, color: C.ink2, spaceAfter: 6 });
  };
  col(48, 'Implemented', C.teal, ['3D eye, guided entry, static fallback', 'EvidenceLens: zoom, layers, compare', 'Diagnostic Duel (Human vs Reference)', 'Quality indicators, stress test, no-result path', 'Metrics engine, leakage-safe import', 'Clinician approval, CareBridge, privacy guard', 'English and Arabic (RTL)']);
  col(340, 'Simulated · educational', C.ochre, ['Statistics simulator (stamped)', 'Synthetic teaching images', 'Authored reference labels (ICDR-derived)', 'Duel score — educational, not validated']);
  col(632, 'Future · not built', C.brick, ['Trained research model', 'Real-dataset evaluation', 'Patient-level split, external validation', 'Reader study of AI assistance', 'Clinical Arabic proof-reading', 'Accessibility audit']);
  rect(s, 48, 452, 864, 44, C.paper, { line: C.teal });
  text(s, 62, 463, 840, 24, [P(run('TESTS  ', { font: F.mono, size: 11, color: C.teal }), run(`${passed} of ${total} browser tests passing in real Chrome · 31 unit tests passing · results in docs/TEST_RESULTS.json`, { size: 14 }))], { size: 14, color: C.ink });
  footer(s, 11);
}

// ───── 12 next + credits ─────
{
  const s = S(C.navy, 'Next steps and credits. The next scientific step is to obtain a licensed dataset and run the specified protocol - training a baseline, fixing the threshold on validation data and spending the test partition once - and only then think about a reader study. Thank the team and the school. Sources: ICDR and ETDRS grading criteria.');
  text(s, 48, 36, 600, 16, [P('11 · NEXT STEPS AND CREDITS')], { font: F.mono, size: 11, color: C.tealB });
  text(s, 48, 58, 520, 84, [P('The next step is data, not decoration.')], { font: F.head, size: 32, color: C.ivory, lineSpacing: 0.95 });
  const next = ['Secure a licensed dataset (APTOS, EyePACS, Messidor-2 or IDRiD) and record its terms', 'Build a patient-level split manifest and remove near-duplicates', 'Train a documented transfer-learning baseline with an abstain output', 'Fix the threshold on validation data; spend the test partition once', 'Only then: a controlled reader study of AI assistance'];
  next.forEach((t, i) => {
    const y = 168 + i * 56;
    text(s, 48, y, 40, 30, [P(`0${i + 1}`)], { font: F.head, size: 24, color: C.tealB, italic: 1 });
    text(s, 96, y + 2, 430, 50, [P(t)], { size: 15, color: C.ivory });
    line(s, 48, y + 50, 526, y + 50, '234A73');
  });
  pic(s, 'ar-entry', 570, 40, 342, 192, 'Screenshot of the prototype entry page in Arabic, laid out right to left.', { border: '234A73' });
  caption(s, 570, 236, 342, 'Screenshot · Arabic (RTL) — same caveats in both languages', true);
  text(s, 570, 284, 342, 200, [
    P(run('MAY AHMED MOURAD · G12', { font: F.mono, size: 11, color: C.ivory })),
    P(run('SHAMSA FARIS ALMAZROUEI · G12', { font: F.mono, size: 11, color: C.ivory })),
    P(run('FATIMA MOHAMED ALMAZROUEI · G12', { font: F.mono, size: 11, color: C.ivory })),
    P(run('ADNOC Schools — Madinat Zayed', { size: 14, color: 'C9CFD6' })),
    P(run('A student project. No endorsement by ADNOC or ADNOC Schools is implied. Not a medical device.', { size: 12, color: '9DB1C4' })),
  ], { spaceAfter: 6 });
  text(s, 48, 462, 480, 40, [P(run('Sources: ', { font: F.mono, size: 10, color: '9DB1C4' }), run('Wilkinson et al., Ophthalmology 2003 (ICDR) · ETDRS Report 10, 1991', { size: 12, color: 'C9CFD6' }))], {});
  footer(s, 12, true);
}

writeFileSync(resolve(root, 'presentation/spec.json'), JSON.stringify({ width: 960, height: 540, slides }, null, 1));
console.log(`spec: ${slides.length} slides, tests ${tests.passed}/${tests.total}`);
