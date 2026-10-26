// Real screenshots of the finished app (used in the deck and docs). Usage: node tools/shots.mjs [name-filter]
// Every image is a capture of the running application in headless Chrome — nothing is mocked up.
import { launch } from './cdp.mjs';
import { spawn } from 'node:child_process';

const PORT = 4175;
const BASE = `http://127.0.0.1:${PORT}/`;
const only = process.argv[2];
const srv = spawn('node', ['tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await launch({ port: 9555, width: 1600, height: 900 });

const approvedState = {
  studied: { C10: true },
  duels: {},
  review: { C10: { reviewer: 'Reviewer A', interp: { gradable: true, grade: 3, dme: false, notes: '' }, approval: { disposition: 'urgent', rationale: 'Four-quadrant haemorrhages with venous beading and IRMA: severe NPDR on this read.', ts: Date.now() } } },
};

const SHOTS = [
  { name: 'entry-1-eye', path: '#/', wait: 3500 },
  { name: 'entry-2-section', path: '#/', scroll: 2000, settle: 7000 },
  { name: 'entry-3-retina', path: '#/', scroll: 2970, settle: 7000 },
  { name: 'entry-index', path: '#/', scroll: 3900, settle: 1500 },
  { name: 'wb-cases', path: '#/workbench', wait: 9000 },
  { name: 'wb-lens-blind', path: '#/workbench/C10/lens', wait: 5000 },
  { name: 'wb-lens-layers', path: '#/workbench/C10/lens', state: { studied: { C10: true } }, wait: 5000, run: "(()=>{document.querySelectorAll('.lay-row input').forEach(i=>{if(!i.checked)i.click()});return 1})()", after: 1800 },
  { name: 'wb-lens-finding', path: '#/workbench/C12/lens', state: { studied: { C12: true } }, wait: 5000, run: "(()=>{document.querySelectorAll('.lay-row input').forEach(i=>{if(!i.checked)i.click()});document.querySelector('.layer[data-layer=neovascularization] .les').dispatchEvent(new MouseEvent('click',{bubbles:true}));return 1})()", after: 3500 },
  { name: 'wb-lens-compare', path: '#/workbench/C13/lens', state: { studied: { C13: true } }, wait: 5000, run: "(()=>{document.querySelectorAll('.lay-row input').forEach(i=>{if(!i.checked)i.click()});document.querySelector('input[name=cmp][value=annot]').click();return 1})()", after: 1800 },
  { name: 'wb-lens-enhanced', path: '#/workbench/C06/lens', state: { studied: { C06: true } }, wait: 5000, run: "(()=>{document.querySelector('input[name=cmp][value=enhanced]').click();return 1})()", after: 1800 },
  { name: 'wb-duel-form', path: '#/workbench/C07/duel', wait: 5000, run: "(()=>{document.querySelector('input[name=grad][value=yes]').click();document.querySelector('input[name=lvl][value=\"0\"]').click();return 1})()", after: 600, h: 1000 },
  { name: 'wb-duel-reveal', path: '#/workbench/C07/duel', wait: 5000, run: "(()=>{document.querySelector('input[name=grad][value=yes]').click();document.querySelector('input[name=lvl][value=\"0\"]').click();document.querySelector('.lock-row button').click();return 1})()", after: 9000, h: 1000 },
  { name: 'wb-duel-meaning', path: '#/workbench/C07/duel', wait: 5000, run: "(()=>{document.querySelector('input[name=grad][value=yes]').click();document.querySelector('input[name=lvl][value=\"0\"]').click();document.querySelector('.lock-row button').click();return 1})()", after: 9000, scrollTo: '.dl-mean', h: 1000 },
  { name: 'wb-quality', path: '#/workbench/C06/quality', wait: 7000, h: 1000 },
  { name: 'wb-stress-noresult', path: '#/workbench/C06/quality', wait: 7000, run: "(()=>{const i=document.querySelector('#st-blur');i.value=14;i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()", after: 1800, h: 1450 },
  { name: 'wb-approval', path: '#/workbench/C10/approval', state: approvedState, wait: 3000, h: 1000 },
  { name: 'lab-status', path: '#/lab', wait: 2500, h: 1000 },
  { name: 'lab-evaluate-empty', path: '#/lab/evaluate', wait: 2500, h: 1000 },
  { name: 'lab-simulator', path: '#/lab/simulator', wait: 2500, h: 1100 },
  { name: 'lab-dataset', path: '#/lab/dataset', wait: 2500, h: 1100 },
  { name: 'responsible', path: '#/responsible', wait: 2500, h: 1000 },
  { name: 'carebridge', path: '#/carebridge', state: approvedState, wait: 3500, h: 1000 },
  { name: 'dashboard', path: '#/dashboard', state: approvedState, wait: 2500, h: 1000 },
  { name: 'review', path: '#/review', state: approvedState, wait: 2500, h: 1000 },
  { name: 'about', path: '#/about', wait: 2500, h: 1000 },
  { name: 'ar-entry', path: '#/', lang: 'ar', wait: 3500 },
  { name: 'ar-duel', path: '#/workbench/C07/duel', lang: 'ar', wait: 5000, h: 1000 },
  { name: 'ar-lab', path: '#/lab', lang: 'ar', wait: 2500, h: 1000 },
  { name: 'mobile-entry', path: '#/', w: 390, h: 844, wait: 3500 },
  { name: 'mobile-lens', path: '#/workbench/C06/lens', w: 390, h: 844, wait: 5000 },
];

for (const s of SHOTS) {
  if (only && !s.name.includes(only)) continue;
  const w = s.w || 1600; const h = s.h || 900;
  const p = await browser.newPage({ width: w, height: h });
  try {
    await p.goto(BASE);
    await p.eval(`localStorage.clear(); localStorage.setItem('dil.v2', JSON.stringify(Object.assign({lang:'${s.lang || 'en'}'}, ${JSON.stringify(s.state || {})})))`);
    await p.goto('about:blank');
    await p.goto(BASE + s.path);
    await p.sleep(s.wait || 2000);
    if (s.scroll) { await p.eval(`window.scrollTo(0, ${s.scroll})`); await p.sleep(s.settle || 3000); }
    if (s.run) { await p.eval(s.run); await p.sleep(s.after || 1000); }
    if (s.scrollTo) { await p.eval(`document.querySelector('${s.scrollTo}').scrollIntoView({block:'start', behavior:'instant'}); window.scrollBy({top:-110, behavior:'instant'})`); await p.sleep(900); }
    await p.screenshot(`screenshots/${s.name}.png`);
    const bad = p.errors.filter((e) => !/fonts\.g|net::/.test(e));
    console.log(bad.length ? '✗' : '✓', s.name, bad.join(' | '));
  } catch (e) { console.log('✗', s.name, e.message); }
  p.close();
}
browser.close(); srv.kill();
process.exit(0);
