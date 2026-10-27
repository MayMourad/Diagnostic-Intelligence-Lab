// Audits and photographs the PUBLISHED prototype (not a local copy).
//   node presentation/source/capture.mjs [base-url]      default: the GitHub Pages deployment
// Writes: presentation/source/audit/*.txt        visible text of every section (evidence of what is really implemented)
//         presentation/source/assets/*           hi-res crops and in-app image exports used on the slides
//         presentation/backup-screenshots/*      ordered full-view screenshots for the live-demo fallback
import { launch } from '../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || 'https://maymourad.github.io/Diagnostic-Intelligence-Lab/').replace(/#.*$/, '').replace(/\/?$/, '/');
const OUT = { audit: resolve(here, 'audit'), assets: resolve(here, 'assets'), backup: resolve(here, '../backup-screenshots') };
Object.values(OUT).forEach((d) => mkdirSync(d, { recursive: true }));
const only = process.argv[3];

const browser = await launch({ port: 9888, width: 1600, height: 900 });
const approved = {
  studied: { C10: true },
  review: { C10: { reviewer: 'Reviewer A', interp: { gradable: true, grade: 3, dme: false, notes: '' }, approval: { disposition: 'urgent', rationale: 'Four-quadrant haemorrhages with venous beading and IRMA: severe NPDR on this read.', ts: Date.now() } }, C12: { reviewer: 'Reviewer A', interp: { gradable: true, grade: 1, dme: false, notes: '' } } },
  duels: {},
};

async function open(hash, { lang = 'en', state = {}, w = 1600, h = 900, dpr = 1, reduced = false } = {}) {
  const p = await browser.newPage({ width: w, height: h, dpr });
  if (reduced) await p.emulate({ reducedMotion: true });
  await p.goto(BASE);
  await p.eval(`localStorage.clear(); localStorage.setItem('dil.v2', JSON.stringify(Object.assign({lang:'${lang}'}, ${JSON.stringify(state)})))`);
  await p.goto('about:blank');
  await p.goto(BASE + hash);
  await p.waitFor("document.querySelector('#view').children.length > 0", 30000);
  return p;
}
const log = (...a) => console.log(...a);

// ── 1 · audit: the visible text of every section of the live app ──────────────────────────────────
const SECTIONS = [
  ['01-entry', '#/'], ['02-workbench-cases', '#/workbench'], ['03-evidencelens', '#/workbench/C06/lens'], ['04-diagnostic-duel', '#/workbench/C06/duel'],
  ['05-quality-uncertainty', '#/workbench/C06/quality'], ['06-clinician-approval', '#/workbench/C06/approval'],
  ['07-lab-status', '#/lab'], ['07-lab-evaluate', '#/lab/evaluate'], ['07-lab-thresholds', '#/lab/thresholds'], ['07-lab-errors', '#/lab/errors'], ['07-lab-simulator', '#/lab/simulator'], ['07-lab-dataset', '#/lab/dataset'],
  ['08-dashboard', '#/dashboard'], ['09-review-queue', '#/review'], ['10-carebridge', '#/carebridge'], ['11-responsible-ai', '#/responsible'], ['12-about-credits', '#/about'],
];
if (!only || only === 'audit') {
  for (const [name, hash] of SECTIONS) {
    const p = await open(hash);
    await p.sleep(hash.includes('lens') || hash.includes('quality') ? 4500 : 2500);
    const text = await p.eval("document.querySelector('#view').innerText");
    const bad = p.errors.filter((e) => !/fonts\.g|net::/.test(e));
    writeFileSync(resolve(OUT.audit, `${name}.txt`), `URL: ${BASE}${hash}\nCaptured: ${new Date().toISOString()}\nConsole errors: ${bad.length}\n\n${text}\n`);
    log(bad.length ? '✗' : '✓', 'audit', name, `${text.length} chars`);
    p.close();
  }
}

// ── 2 · in-app image exports (drawn by the app's own code on the live site) ───────────────────────
const dataUrl = (p, expr) => p.eval(`(async () => { ${expr} })()`);
const savePng = (path, url) => writeFileSync(path, Buffer.from(url.split(',')[1], 'base64'));
if (!only || only === 'exports') {
  const p = await open('#/', { reduced: true });
  await p.sleep(1500);
  for (const id of ['C01', 'C06', 'C07', 'C10', 'C12', 'C14']) {
    const url = await dataUrl(p, `const R = await import('./js/render.js'); const c = await R.full('${id}'); return c.toDataURL('image/png');`);
    savePng(resolve(OUT.assets, `fundus-${id}.png`), url);
    log('✓ export', id);
  }
  // Degradation pipeline = the stress-test code (gaussian blur / brightness / contrast on pixels), applied at full resolution
  const variants = { 'C06-blur7': 'O.gaussianBlur(id, 14);', 'C06-dark': 'O.adjust(id, { brightness: -38, contrast: 90 });', 'C06-blur14': 'O.gaussianBlur(id, 28);' };
  for (const [name, op] of Object.entries(variants)) {
    const url = await dataUrl(p, `const R = await import('./js/render.js'); const O = await import('./js/lib/imageops.js'); const c = await R.full('C06'); const id = c.getContext('2d').getImageData(0, 0, c.width, c.height); ${op} const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d').putImageData(id, 0, 0); return o.toDataURL('image/png');`);
    savePng(resolve(OUT.assets, `fundus-${name}.png`), url);
    log('✓ export', name);
  }
  // Measured quality indicators for original vs degraded (same functions the app uses; 768-px analysis render)
  const q = await dataUrl(p, `const R = await import('./js/render.js'); const O = await import('./js/lib/imageops.js'); const Q = await import('./js/lib/quality.js');
    const px = await R.analysisPixels('C06');
    const mk = (op) => { const w = { data: new Uint8ClampedArray(px.data), width: px.width, height: px.height }; op(w); const m = Q.measureQuality(w); return { metrics: m, level: Q.assessQuality(m).level }; };
    return JSON.stringify({ case: 'C06', original: mk(() => {}), blur7: mk((w) => O.gaussianBlur(w, 7)), blur14: mk((w) => O.gaussianBlur(w, 14)), dark: mk((w) => O.adjust(w, { brightness: -38, contrast: 90 })) });`);
  writeFileSync(resolve(OUT.assets, 'quality-demo.json'), JSON.stringify(JSON.parse(q), null, 2));
  log('✓ export quality-demo.json');
  p.close();
}

// ── 3 · screenshots ───────────────────────────────────────────────────────────────────────────────
const ALLLAYERS = "document.querySelectorAll('.lay-row input').forEach((i) => { if (!i.checked) i.click(); });";
const DUEL_READ = "document.querySelector('input[name=grad][value=yes]').click(); document.querySelector('input[name=lvl][value=\"0\"]').click();";
const SHOTS = [
  // hi-res crops for the slides (dir: assets)
  { dir: 'assets', name: 'eye-intact', hash: '#/', dpr: 2, wait: 5000, reduced: false, clip: { x: 640, y: 40, width: 700, height: 780 } },
  { dir: 'assets', name: 'eye-section', hash: '#/', dpr: 2, scroll: 2100, settle: 9000, clip: { x: 500, y: 90, width: 1100, height: 720 } },
  { dir: 'assets', name: 'eye-retina', hash: '#/', dpr: 2, scroll: 3000, settle: 9000, clip: { x: 0, y: 0, width: 1600, height: 900 } },
  { dir: 'assets', name: 'lens-blind', hash: '#/workbench/C06/lens', h: 1300, dpr: 1.5, wait: 6000, clip: '.lens-stage' },
  { dir: 'assets', name: 'lens-annotated', hash: '#/workbench/C10/lens', state: { studied: { C10: true } }, h: 1300, dpr: 1.5, wait: 6000, run: ALLLAYERS, after: 2500, clip: '.lens-stage' },
  { dir: 'assets', name: 'lens-finding', hash: '#/workbench/C12/lens', state: { studied: { C12: true } }, h: 1300, dpr: 1.5, wait: 6000, run: `${ALLLAYERS} document.querySelector('.layer[data-layer=neovascularization] .les').dispatchEvent(new MouseEvent('click',{bubbles:true}));`, after: 4500, clip: '.lens-stage' },
  { dir: 'assets', name: 'lens-compare', hash: '#/workbench/C13/lens', state: { studied: { C13: true } }, h: 1300, dpr: 1.5, wait: 6000, run: `${ALLLAYERS} document.querySelector('input[name=cmp][value=annot]').click();`, after: 2500, clip: '.lens-host' },
  { dir: 'assets', name: 'lens-green', hash: '#/workbench/C06/lens', state: { studied: { C06: true } }, h: 1300, dpr: 1.5, wait: 6000, run: "document.querySelector('input[name=cmp][value=enhanced]').click();", after: 3000, clip: '.lens-host' },
  { dir: 'assets', name: 'duel-read', hash: '#/workbench/C07/duel', h: 1500, dpr: 1.5, wait: 6000, run: DUEL_READ, after: 800, clip: '.duel-grid' },
  { dir: 'assets', name: 'duel-lock', hash: '#/workbench/C07/duel', h: 1500, dpr: 1.5, wait: 6000, run: `${DUEL_READ} document.querySelector('.lock-row button').click();`, after: 1100, clip: '.duel-grid' },
  { dir: 'assets', name: 'duel-reveal', hash: '#/workbench/C07/duel', h: 2400, dpr: 1.5, wait: 6000, run: `${DUEL_READ} document.querySelector('.lock-row button').click();`, after: 10000, clip: '.duel-grid' },
  { dir: 'assets', name: 'quality-original', hash: '#/workbench/C06/quality', h: 1500, dpr: 1.5, wait: 8000, clip: '.rel-grid' },
  { dir: 'assets', name: 'quality-blur7', hash: '#/workbench/C06/quality', h: 1500, dpr: 1.5, wait: 8000, run: "const i = document.querySelector('#st-blur'); i.value = 7; i.dispatchEvent(new Event('input', {bubbles:true}));", after: 2500, clip: '.rel-grid' },
  { dir: 'assets', name: 'quality-noresult', hash: '#/workbench/C06/quality', h: 1700, dpr: 1.5, wait: 8000, run: "const i = document.querySelector('#st-blur'); i.value = 14; i.dispatchEvent(new Event('input', {bubbles:true}));", after: 2500, clip: '.rel-grid' },
  { dir: 'assets', name: 'approval', hash: '#/workbench/C10/approval', state: approved, h: 1500, dpr: 1.5, wait: 3500, clip: '.ap-grid' },
  { dir: 'assets', name: 'review', hash: '#/review', state: approved, h: 1300, dpr: 1.5, wait: 3500, run: "document.querySelectorAll('.rv-row')[9].click();", after: 800, clip: '.rv-grid' },
  { dir: 'assets', name: 'carebridge', hash: '#/carebridge', state: approved, h: 1500, dpr: 1.5, wait: 4500, clip: '.cb-grid' },
  { dir: 'assets', name: 'lab-status', hash: '#/lab', h: 1500, dpr: 1.5, wait: 3500, clip: '.lab' },
  { dir: 'assets', name: 'lab-simulator', hash: '#/lab/simulator', h: 2000, dpr: 1.5, wait: 3500, clip: '.lab-body' },
  { dir: 'assets', name: 'lab-integrity', hash: '#/lab/evaluate', h: 1500, dpr: 1.5, wait: 3000, run: `const rows = ['id,patient_id,split,reference,score']; for (let i = 0; i < 24; i++) rows.push('a' + i + ',P' + i + ',train,' + (i % 3 === 0 ? 1 : 0) + ',' + (0.2 + (i % 5) * 0.12).toFixed(3)); for (let i = 0; i < 12; i++) rows.push('b' + i + ',Q' + i + ',val,' + (i % 3 === 0 ? 1 : 0) + ',' + (0.25 + (i % 4) * 0.15).toFixed(3)); for (let i = 0; i < 12; i++) rows.push('c' + i + ',' + (i === 0 ? 'P0' : 'R' + i) + ',test,' + (i % 3 === 0 ? 1 : 0) + ',' + (0.3 + (i % 4) * 0.12).toFixed(3)); const dt = new DataTransfer(); dt.items.add(new File([rows.join('\\n')], 'synthetic-leaky-test-file.csv', {type: 'text/csv'})); const f = document.querySelector('#ev-file'); f.files = dt.files; f.dispatchEvent(new Event('change', {bubbles: true}));`, after: 2500, clip: '.ev-grid' },
  { dir: 'assets', name: 'responsible', hash: '#/responsible', h: 1700, dpr: 1.5, wait: 3000, clip: '.page' },
  { dir: 'assets', name: 'about', hash: '#/about', h: 1500, dpr: 1.5, wait: 3000, clip: '.page' },
  { dir: 'assets', name: 'dashboard', hash: '#/dashboard', state: approved, h: 1500, dpr: 1.5, wait: 3000, clip: '.page' },
  // ordered full-view fallbacks for the live demonstration (dir: backup)
  { dir: 'backup', name: '01-entry', hash: '#/', wait: 5000 },
  { dir: 'backup', name: '02-workbench-case-selection', hash: '#/workbench', wait: 10000 },
  { dir: 'backup', name: '03-evidencelens-blind-first', hash: '#/workbench/C06/lens', wait: 6500 },
  { dir: 'backup', name: '04-evidencelens-layers-after-study-mode', hash: '#/workbench/C10/lens', state: { studied: { C10: true } }, wait: 6500, run: ALLLAYERS, after: 2500 },
  { dir: 'backup', name: '05-duel-read', hash: '#/workbench/C07/duel', wait: 6000, run: DUEL_READ, after: 800, h: 1000 },
  { dir: 'backup', name: '06-duel-reveal', hash: '#/workbench/C07/duel', wait: 6000, run: `${DUEL_READ} document.querySelector('.lock-row button').click();`, after: 10000, h: 1000 },
  { dir: 'backup', name: '07-quality-original', hash: '#/workbench/C06/quality', wait: 8000, h: 1000 },
  { dir: 'backup', name: '08-quality-blur', hash: '#/workbench/C06/quality', wait: 8000, run: "const i = document.querySelector('#st-blur'); i.value = 7; i.dispatchEvent(new Event('input', {bubbles:true}));", after: 2500, h: 1000 },
  { dir: 'backup', name: '09-accuracy-lab-status', hash: '#/lab', wait: 3500, h: 1000 },
  { dir: 'backup', name: '10-accuracy-lab-simulator', hash: '#/lab/simulator', wait: 3500, h: 1000 },
  { dir: 'backup', name: '11-accuracy-lab-evaluate', hash: '#/lab/evaluate', wait: 3000, h: 1000 },
  { dir: 'backup', name: '12-clinician-approval', hash: '#/workbench/C10/approval', state: approved, wait: 3500, h: 1000 },
  { dir: 'backup', name: '13-review-queue', hash: '#/review', state: approved, wait: 3500, h: 1000 },
  { dir: 'backup', name: '14-carebridge', hash: '#/carebridge', state: approved, wait: 4500, h: 1000 },
  { dir: 'backup', name: '15-responsible-ai', hash: '#/responsible', wait: 3000, h: 1000 },
  { dir: 'backup', name: '16-about-credits', hash: '#/about', wait: 3000, h: 1000 },
];

if (!only || only === 'shots' || SHOTS.some((s) => s.name === only)) {
  for (const s of SHOTS) {
    if (only && only !== 'shots' && s.name !== only) continue;
    const p = await open(s.hash, { state: s.state || {}, w: s.w || 1600, h: s.h || 900, dpr: s.dpr || 1, reduced: s.reduced });
    try {
      await p.sleep(s.wait || 2500);
      if (s.scroll) { await p.eval(`window.scrollTo(0, ${s.scroll})`); await p.sleep(s.settle || 4000); }
      if (s.run) { await p.eval(`(() => { ${s.run} })()`); await p.sleep(s.after || 1000); }
      const file = resolve(OUT[s.dir], `${s.name}.png`);
      await p.screenshot(file, s.clip ? (typeof s.clip === 'string' ? { selector: s.clip } : { clip: s.clip }) : {});
      const bad = p.errors.filter((e) => !/fonts\.g|net::/.test(e));
      log(bad.length ? '✗' : '✓', 'shot', s.dir, s.name, bad.join(' | '));
    } catch (e) { log('✗ shot', s.name, e.message); }
    p.close();
  }
}
browser.close();
process.exit(0);
