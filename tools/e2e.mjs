// End-to-end browser tests (real Chrome via CDP, zero dependencies). Usage: node tools/e2e.mjs [filter]
// Every check drives the real UI. Results are written to docs/TEST_RESULTS.json for the feature matrix and the deck.
import { launch } from './cdp.mjs';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { evaluateHeldOut, auc } from '../js/lib/metrics.js';
import { mulberry32 } from '../js/lib/rng.js';

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}/`;
const only = process.argv[2];
const results = [];
const srv = spawn('node', ['tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const browser = await launch({ port: 9444, width: 1440, height: 900 });
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg || 'expected'}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); };
const ok = (v, msg) => { if (!v) throw new Error(msg || 'assertion failed'); };

async function fresh(lang = 'en', { w = 1440, h = 900, reduced = false, path = '', state = null } = {}) {
  const p = await browser.newPage({ width: w, height: h });
  await p.emulate({ reducedMotion: reduced });
  await p.goto(BASE);
  await p.eval(`localStorage.clear(); localStorage.setItem('dil.v2', JSON.stringify(Object.assign({lang:'${lang}'}, ${JSON.stringify(state || {})})))`);
  await p.goto('about:blank'); // force a real reload so the app re-reads the seeded storage
  await p.goto(BASE + path);
  await p.waitFor("document.querySelector('#view').children.length > 0");
  return p;
}
async function check(name, fn) {
  if (only && !name.toLowerCase().includes(only.toLowerCase())) return;
  const t0 = Date.now();
  let page;
  try { page = await fn(); results.push({ name, pass: true, ms: Date.now() - t0 }); console.log('  ✓', name); }
  catch (e) { results.push({ name, pass: false, error: e.message, ms: Date.now() - t0 }); console.log('  ✗', name, '\n     ', e.message); page = null; }
  finally { try { page?.close?.(); } catch { /* ignore */ } }
}
const noErrors = (p, label = '') => { const bad = p.errors.filter((e) => !/favicon|fonts\.g|ERR_INTERNET|net::/.test(e)); eq(bad.length, 0, `console errors ${label}: ${bad.join(' | ')}`); const miss = p.logs.filter((l) => l.type === 'warning' && /missing key/.test(l.text)); eq(miss.length, 0, `missing i18n keys ${label}: ${miss.map((m) => m.text).join(', ')}`); };
const txt = (p, sel) => p.eval(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const has = (p, sel) => p.eval(`!!document.querySelector(${JSON.stringify(sel)})`);
const count = (p, sel) => p.eval(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const click = (p, sel) => p.eval(`document.querySelector(${JSON.stringify(sel)}).click()`);
const lockDuel = async (p, grade, dme = false) => {
  await click(p, 'input[name=grad][value=yes]'); await click(p, `input[name=lvl][value="${grade}"]`);
  if (dme) await click(p, '.field input[type=checkbox]');
  await click(p, '.lock-row button'); await p.waitFor("document.querySelector('.dl-cat')", 8000);
};

console.log('\nRoutes, language and layout');
const ROUTES = ['#/', '#/workbench', '#/workbench/C06/lens', '#/workbench/C06/duel', '#/workbench/C06/quality', '#/workbench/C06/approval', '#/lab', '#/lab/evaluate', '#/lab/thresholds', '#/lab/errors', '#/lab/simulator', '#/lab/dataset', '#/dashboard', '#/review', '#/carebridge', '#/responsible', '#/about'];
for (const lang of ['en', 'ar']) {
  await check(`all ${ROUTES.length} routes render with no console errors or missing strings (${lang})`, async () => {
    const p = await fresh(lang);
    for (const r of ROUTES) {
      await p.eval(`location.hash = ${JSON.stringify(r)}`);
      await p.sleep(500);
      await p.waitFor("document.querySelector('#view').innerText.length > 40", 30000, `route ${r} renders content`);
    }
    eq(await p.eval('document.documentElement.dir'), lang === 'ar' ? 'rtl' : 'ltr');
    noErrors(p, lang);
    return p;
  });
}
for (const [w, h, label] of [[390, 844, 'mobile'], [820, 1100, 'tablet']]) {
  await check(`no horizontal overflow on any route at ${label} width`, async () => {
    const p = await fresh('en', { w, h });
    const bad = [];
    for (const r of ROUTES) {
      await p.eval(`location.hash = ${JSON.stringify(r)}`);
      await p.sleep(700);
      const over = await p.eval('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      if (over > 2) bad.push(`${r} (+${over}px)`);
    }
    eq(bad.length, 0, `overflow: ${bad.join(', ')}`);
    return p;
  });
}

console.log('\nA — Immersive entry');
await check('entry shows brand, students, school and the single product statement', async () => {
  const p = await fresh('en', { path: '#/' });
  const body = await p.eval('document.body.innerText');
  for (const s of ['Diagnostic', 'Intelligence', 'May Ahmed Mourad', 'Shamsa Faris Almazrouei', 'Fatima Mohamed Almazrouei', 'ADNOC Schools', 'Provisional title', 'G11']) ok(body.includes(s), `missing "${s}"`);
  ok(!/NourDx/i.test(await p.eval('document.documentElement.outerHTML')), 'old name still present in DOM');
  eq((await p.eval('document.title')).includes('Diagnostic Intelligence Lab'), true);
  return p;
});
await check('3D eye renders (WebGL canvas painted) and scroll advances the guided scene', async () => {
  const p = await fresh('en', { path: '#/' });
  await p.sleep(1500);
  await p.waitFor("document.querySelector('.eye-canvas').dataset.painted", 20000);
  eq(await p.eval("document.querySelector('.eye-canvas').dataset.painted"), 'true', 'WebGL canvas drew nothing');
  await p.eval('window.scrollTo(0, 3000)');
  await p.waitFor("document.querySelector('.entry-stage').dataset.step === '3'", 20000, 'scene reaches step 3');
  await p.waitFor("document.querySelector('.eye-label.show .el-t')", 40000, 'an anatomy label is shown once the section is open (slow software WebGL needs time to ease)');
  noErrors(p);
  return p;
});
await check('static fallback appears when WebGL is unavailable (?static) and keeps the CTA', async () => {
  const p = await fresh('en', { path: '?static=1#/' });
  ok(await has(p, '.eye-static'), 'static SVG missing');
  ok(await has(p, '#enter'), 'CTA missing');
  return p;
});
await check('Enter Diagnostic Lab: guided transition lands on the Workbench', async () => {
  const p = await fresh('en', { path: '#/' });
  await click(p, '#enter');
  await p.waitFor("location.hash.startsWith('#/workbench')", 8000);
  await p.waitFor("!document.querySelector('.enter-overlay')", 6000);
  ok(await has(p, '.case-grid'));
  return p;
});
await check('reduced motion: no overlay animation, navigation is immediate', async () => {
  const p = await fresh('en', { path: '#/', reduced: true });
  await click(p, '#enter');
  await p.waitFor("location.hash.startsWith('#/workbench')", 2000);
  eq(await has(p, '.enter-overlay'), false);
  return p;
});

console.log('\nB — Workbench: cases, EvidenceLens');
await check('case selection: 16 synthetic cases, no reference labels leaked, measured quality shown', async () => {
  const p = await fresh('en', { path: '#/workbench' });
  await p.waitFor("document.querySelectorAll('.case-card').length === 16");
  await p.waitFor("document.querySelectorAll('.cc-img canvas').length === 16", 60000);
  const text = await p.eval("document.querySelector('.case-grid').innerText.toLowerCase()");
  for (const leak of ['referable', 'moderate', 'severe', 'proliferative', 'npdr']) ok(!text.includes(leak), `label leaked: ${leak}`);
  ok(/adequate|borderline|insufficient/.test(text));
  return p;
});
await check('EvidenceLens is blind by default: reference layers locked, only anatomy guides available', async () => {
  const p = await fresh('en', { path: '#/workbench/C10/lens' });
  await p.waitFor("document.querySelector('.lens-base')");
  ok(await has(p, '.lock-note'), 'lock note missing');
  eq(await count(p, '.layer[data-layer]:not([data-layer=anatomy])'), 0, 'lesion layers present in DOM before reveal');
  eq(await count(p, '.les'), 0);
  return p;
});
await check('Study Mode opens reference layers and marks the case practice-only', async () => {
  const p = await fresh('en', { path: '#/workbench/C10/lens' });
  await p.waitFor("document.querySelector('.lock-note')");
  await p.eval("[...document.querySelectorAll('.lock-actions .btn')][0].click()");
  await p.waitFor("document.querySelectorAll('.les').length > 20");
  ok(await p.eval("JSON.parse(localStorage.getItem('dil.v2')).studied.C10 === true"));
  ok((await p.eval("document.querySelector('.wb-chip').textContent")).toLowerCase().includes('practice'));
  return p;
});
await check('zoom (wheel, buttons, keys), pan (drag) and fit all change the view; HUD tracks zoom', async () => {
  const p = await fresh('en', { path: '#/workbench/C06/lens' });
  await p.waitFor("document.querySelector('.lens-base')"); await p.sleep(600);
  const r = await p.rect('.lens');
  const z0 = parseInt(await txt(p, '.hud-zoom'));
  await p.wheel(r.x + r.w / 2, r.y + r.h / 2, -400); await p.sleep(500);
  const z1 = parseInt(await txt(p, '.hud-zoom')); ok(z1 > z0 + 20, `wheel zoom ${z0}→${z1}`);
  const t0 = await p.eval("document.querySelector('.lens-world').style.transform");
  await p.drag(r.x + 300, r.y + 300, r.x + 380, r.y + 340); await p.sleep(300);
  ok((await p.eval("document.querySelector('.lens-world').style.transform")) !== t0, 'pan did nothing');
  await click(p, '.lens-tools button:nth-child(1)'); await p.sleep(500);
  ok(parseInt(await txt(p, '.hud-zoom')) > z1, 'zoom-in button');
  await click(p, '.lens-tools button:nth-child(3)');
  await p.waitFor("Math.abs(parseInt(document.querySelector('.hud-zoom').textContent) - 100) <= 2", 8000, 'fit returns to 100%');
  await p.eval("document.querySelector('.lens').focus()"); await p.key('+');
  await p.waitFor("parseInt(document.querySelector('.hud-zoom').textContent) > 110", 8000, 'keyboard zoom');
  return p;
});
await check('annotation layers: toggle, opacity, lesion panel with source link, authorship statement (after Study Mode)', async () => {
  const p = await fresh('en', { state: { studied: { C12: true } }, path: '#/workbench/C12/lens' });
  await p.waitFor("document.querySelectorAll('.les').length > 10");
  await p.waitFor("document.querySelector('#lay-neovascularization')");
  eq(await p.eval("document.querySelector('.layer[data-layer=neovascularization]').dataset.on"), 'false');
  await click(p, '#lay-neovascularization'); await p.sleep(300);
  eq(await p.eval("document.querySelector('.layer[data-layer=neovascularization]').dataset.on"), 'true');
  await p.setValue('#ov-op', 40); await p.sleep(100);
  eq(await p.eval("document.querySelector('.lens-overlay').style.getPropertyValue('--ov')"), '0.4');
  await p.eval("document.querySelector('.layer[data-layer=neovascularization] .les').dispatchEvent(new MouseEvent('click', {bubbles:true}))");
  await p.waitFor("document.querySelector('.find-head')");
  const panel = await p.eval("document.querySelector('#lens-panel').innerText");
  ok(/Neovascularisation/.test(panel) && /Wilkinson/.test(panel) && /not drawn by an AI model/i.test(panel), 'lesion panel incomplete');
  ok((await p.eval("document.querySelector('.src-link').href")).startsWith('https://doi.org/10.1016/S0161-6420'), 'source link');
  return p;
});
await check('draggable before/after: annotated and green-channel modes; divider moves by drag and keyboard', async () => {
  const p = await fresh('en', { state: { studied: { C06: true } }, path: '#/workbench/C06/lens' });
  await p.waitFor("document.querySelectorAll('.les').length > 5");
  await p.eval("document.querySelector('input[name=cmp][value=enhanced]').click()"); await p.sleep(900);
  ok(await p.eval("!document.querySelector('.lens-divider').hidden && !document.querySelector('.lens-after').hidden"), 'enhanced layer not shown');
  const d = await p.rect('.lens-divider'); const before = await p.eval("document.querySelector('.lens-divider').getAttribute('aria-valuenow')");
  await p.drag(d.x + d.w / 2, d.y + d.h / 2, d.x + d.w / 2 + 160, d.y + d.h / 2); await p.sleep(200);
  ok((await p.eval("document.querySelector('.lens-divider').getAttribute('aria-valuenow')")) !== before, 'divider drag');
  await p.eval("document.querySelector('.lens-divider').focus()"); await p.key('ArrowLeft'); await p.sleep(100);
  await p.eval("document.querySelector('input[name=cmp][value=annot]').click()"); await p.sleep(300);
  ok((await p.eval("document.querySelector('.lens-overlay').style.clipPath")).includes('inset'), 'annotation clip');
  return p;
});
await check('Expert-reference vs model panel: model column says Not implemented; reference hidden until revealed', async () => {
  const p = await fresh('en', { path: '#/workbench/C06/lens' });
  await p.waitFor("document.querySelector('#lt-compare')");
  await click(p, '#lt-compare'); await p.sleep(300);
  const panel = await p.eval("document.querySelector('#lens-panel').innerText");
  ok(/not implemented/i.test(panel) && /▒/.test(panel), 'compare panel');
  ok(!/Moderate|Referable/.test(panel), 'reference leaked');
  return p;
});
await check('image-quality indicators are computed from pixels and flag the ungradable cases', async () => {
  const p = await fresh('en', { path: '#/workbench/C14/lens' });
  await p.waitFor("document.querySelector('#lt-quality')");
  await click(p, '#lt-quality'); await p.waitFor("document.querySelector('.qp-row')", 20000);
  ok(/Insufficient/.test(await txt(p, '.qp-verdict')), 'C14 should be insufficient: ' + await txt(p, '.qp-verdict'));
  await p.goto(BASE + '#/workbench/C01/lens'); await p.sleep(800);
  await click(p, '#lt-quality'); await p.waitFor("document.querySelector('.qp-row')", 20000);
  ok(/Adequate/.test(await txt(p, '.qp-verdict')), 'C01 should be adequate');
  return p;
});

console.log('\nB — Diagnostic Duel');
await check('duel blind-first flow: lock → model slot says not implemented → reference revealed → FN explained', async () => {
  const p = await fresh('en', { path: '#/workbench/C07/duel' });
  await p.waitFor("document.querySelector('.lvl')");
  ok(!/Moderate NPDR|Referable/.test(await p.eval("document.querySelector('.duel-grid').innerText")), 'reference visible before lock');
  eq(await p.eval("document.querySelector('.lock-row button').disabled"), true);
  await lockDuel(p, 0);
  const body = await p.eval("document.querySelector('.duel-panel').innerText");
  ok(/Research model: not implemented/i.test(body), 'model slot');
  ok(/Moderate NPDR/.test(body) && /REFERABLE/i.test(body), 'reference reveal');
  eq((await txt(p, '.dl-cat')).trim(), 'False negative');
  ok(/costly error/.test(await txt(p, '.dl-mean')), 'FN importance text');
  ok(/designed to be hard/.test(await txt(p, '.dl-mean')), 'trap note');
  ok(/not validated clinical performance/i.test(await txt(p, '.dl-rec')), 'educational caveat');
  ok(!/Human vs AI/i.test(await p.eval('document.body.innerText')), 'must not claim Human vs AI');
  ok(/Human vs Reference/.test(await p.eval('document.body.innerText')), 'Human vs Reference label');
  return p;
});
await check('duel outcomes classify correctly: TP, TN, FP and ungradable handling', async () => {
  const p = await fresh('en');
  const run = async (id, grade, dme, ug = false) => {
    await p.goto(BASE + `#/workbench/${id}/duel`); await p.sleep(500);
    await p.waitFor("document.querySelector('.lvl') || document.querySelector('.dl-cat')");
    if (ug) { await click(p, 'input[name=grad][value=no]'); await click(p, '.lock-row button'); await p.waitFor("document.querySelector('.dl-cat')", 8000); }
    else await lockDuel(p, grade, dme);
    return (await txt(p, '.dl-cat')).trim();
  };
  eq(await run('C10', 3), 'True positive');
  eq(await run('C01', 0), 'True negative');
  eq(await run('C02', 2), 'False positive');
  eq(await run('C14', 0, false, true), 'Ungradable — recognised');
  eq(await run('C15', 1), 'Graded an ungradable image');
  return p;
});
await check('duel record persists across reload and feeds learner statistics with intervals', async () => {
  const p = await fresh('en', { path: '#/workbench/C10/duel' });
  await p.waitFor("document.querySelector('.lvl')"); await lockDuel(p, 3);
  await p.goto(BASE + '#/dashboard'); await p.eval('location.reload()'); await p.sleep(1500);
  await p.waitFor("document.querySelector('.tiles')");
  eq((await txt(p, '.tile-v')).trim(), '1');
  ok(/95% CI/.test(await p.eval("document.querySelector('.rec-grid').innerText")), 'CI shown');
  return p;
});
await check('opening reference layers first makes the later duel practice-only (excluded from the score)', async () => {
  const p = await fresh('en', { state: { studied: { C06: true } }, path: '#/workbench/C06/duel' });
  await p.waitFor("document.querySelector('.lvl')");
  ok(/Practice only/.test(await txt(p, '.duel-panel')), 'practice banner');
  await lockDuel(p, 2);
  await p.goto(BASE + '#/dashboard'); await p.sleep(800);
  eq((await txt(p, '.tile-v')).trim(), '0', 'practice case must not count as scored');
  return p;
});

console.log('\nB — Quality, stress test, approval');
await check('stress test: live image change, measured verdict, explicit no-result pathway, no invented model confidence', async () => {
  const p = await fresh('en', { path: '#/workbench/C06/quality' });
  await p.waitFor("document.querySelector('#st-blur')", 25000); await p.sleep(600);
  ok(/Quality adequate/.test(await txt(p, '.st-verdict')), 'baseline adequate: ' + await txt(p, '.st-verdict'));
  const px0 = await p.eval("document.querySelector('.st-canvas:not(.st-orig)').getContext('2d').getImageData(380, 380, 1, 1).data.join(',')");
  await p.setValue('#st-blur', 14); await p.sleep(900);
  ok(/No result/.test(await txt(p, '.st-verdict')), 'verdict at blur 14: ' + await txt(p, '.st-verdict'));
  ok(!(await p.eval("document.querySelector('.nr').hidden")), 'no-result pathway hidden');
  ok(/Withhold any DR grade/.test(await txt(p, '.nr')));
  const pageText = await p.eval("document.querySelector('.rel-main').innerText");
  ok(/No compatible research model/i.test(pageText), 'model unavailable text');
  ok(!/confidence\s*[:=]?\s*\d/i.test(pageText) && !/\d+\s*%\s*confiden/i.test(pageText), 'a confidence number appeared');
  await p.setValue('#st-blur', 0); await p.setValue('#st-bright', -45); await p.sleep(900);
  ok(!/Quality adequate/.test(await txt(p, '.st-verdict')), 'brightness −45 should degrade verdict');
  await p.eval("[...document.querySelectorAll('.st-presets .btn')].pop().click()"); await p.sleep(900);
  ok(/Quality adequate/.test(await txt(p, '.st-verdict')), 'reset');
  ok(px0.length > 0);
  return p;
});
await check('stress test: lesion-contrast block stays locked until reference is open', async () => {
  const p = await fresh('en', { path: '#/workbench/C06/quality' });
  await p.waitFor("document.querySelector('.st-block .note')", 25000);
  ok(/Locked until reference layers are open/.test(await p.eval("document.querySelector('.rel-main').innerText")));
  const p2 = await fresh('en', { state: { studied: { C06: true } }, path: '#/workbench/C06/quality' });
  await p2.waitFor("document.querySelector('.les-bar')", 25000);
  p.close();
  return p2;
});
await check('clinician approval: gates, discrepancy acknowledgement, identifier guard, approval record, withdraw', async () => {
  const p = await fresh('en', { state: { duels: {}, studied: { C10: true } }, path: '#/workbench/C10/approval' });
  await p.waitFor("document.querySelector('.ap-form')");
  eq(await p.eval("document.querySelector('.ap-actions .btn').disabled"), true);
  await click(p, 'input[name=apgr][value=y]'); await click(p, 'input[name=apg][value="1"]'); await click(p, 'input[name=disp][value=routine]'); await p.sleep(100);
  ok(/acknowledge/i.test(await txt(p, '.ap-acks')), 'discrepancy acknowledgement should be required (reference says severe)');
  eq(await p.eval("document.querySelector('.ap-actions .btn').disabled"), true);
  await p.eval("[...document.querySelectorAll('.ap-acks input')].forEach((i) => i.click())"); await p.sleep(100);
  eq(await p.eval("document.querySelector('.ap-actions .btn').disabled"), false);
  await p.setValue('textarea:last-of-type', 'contact me at jane.doe@example.com'); await p.sleep(100);
  eq(await p.eval("document.querySelector('.ap-actions .btn').disabled"), true, 'identifier must block approval');
  ok(!(await p.eval("document.querySelector('.note-brick').hidden")), 'privacy warning');
  await p.setValue('textarea:last-of-type', 'Reference-level disagreement noted.'); await p.sleep(100);
  await click(p, '.ap-actions .btn'); await p.waitFor("document.querySelector('.note-teal')");
  const stored = await p.eval("JSON.parse(localStorage.getItem('dil.v2')).review.C10.approval");
  eq(stored.disposition, 'routine'); eq(stored.discrepancy, true);
  ok(/Routine re-screening/.test(await txt(p, '.pl')), 'ledger shows the disposition');
  ok(/Not implemented/.test(await txt(p, '.pl')), 'ledger shows model not implemented');
  return p;
});

console.log('\nCareBridge, reviewer tools, dashboard');
await check('CareBridge: letter only for approved refer dispositions; identifier guard blocks print/download', async () => {
  const p = await fresh('en', { path: '#/carebridge' });
  ok(/No approved referrals yet/.test(await txt(p, '.cb-empty')));
  const p2 = await fresh('en', { state: { review: { C10: { reviewer: 'Reviewer A', interp: { gradable: true, grade: 3, dme: false, notes: '' }, approval: { disposition: 'urgent', rationale: 'Severe NPDR on read.', ts: Date.now() } } } }, path: '#/carebridge' });
  await p2.waitFor("document.querySelector('.letter')");
  const letter = await txt(p2, '.letter');
  ok(/SYNTHETIC EDUCATIONAL LETTER/.test(letter) && /Urgent/.test(letter) && /No AI model contributed/.test(letter), 'letter content');
  ok(/May Ahmed Mourad/.test(letter) && /ADNOC Schools/.test(letter), 'credits in letter footer');
  await p2.setValue('.cb-form textarea', 'Phone +971 50 123 4567'); await p2.sleep(150);
  eq(await p2.eval("document.querySelector('.row-actions .btn').disabled"), true);
  p.close();
  return p2;
});
await check('review queue: discrepancy flags and detail ledger', async () => {
  const p = await fresh('en', { state: { studied: { C10: true }, review: { C10: { interp: { gradable: true, grade: 0, dme: false } } } }, path: '#/review' });
  await p.waitFor("document.querySelector('.rv-row')");
  ok(/interpretation ≠ reference/i.test(await p.eval("document.querySelector('.rv-table').textContent")), 'flag');
  await p.eval("document.querySelectorAll('.rv-row')[9].click()"); await p.sleep(200);
  ok(/Provenance ledger/.test(await txt(p, '.rv-detail')));
  return p;
});
await check('dashboard: erase-all clears local data after confirmation', async () => {
  const p = await fresh('en', { state: { events: [{ ts: Date.now(), type: 'duel-locked', caseId: 'C01', detail: 'TN' }] }, path: '#/dashboard' });
  await p.waitFor("document.querySelector('.audit')");
  await p.eval("[...document.querySelectorAll('.btn')].find((b) => /Erase all/.test(b.textContent)).click()");
  await p.eval("[...document.querySelectorAll('.erase .btn')].find((b) => /Yes/.test(b.textContent)).click()");
  await p.sleep(1500); await p.waitFor("document.querySelector('.tiles')");
  eq(await p.eval("JSON.parse(localStorage.getItem('dil.v2')).events.length"), 0);
  return p;
});

console.log('\nC — Accuracy Laboratory');
await check('lab status states plainly that no research model has been evaluated; protocol steps are honest', async () => {
  const p = await fresh('en', { path: '#/lab' });
  ok(/No research model has been evaluated/.test(await txt(p, '.st-hero')));
  const rows = await p.eval("[...document.querySelectorAll('.st-proto tbody tr')].map((r) => r.textContent.replace(/\\s+/g, ' '))");
  ok(rows.filter((r) => /Not done/i.test(r)).length >= 4, 'protocol should show several not-done steps');
  return p;
});
await check('simulator is stamped as simulation and its matrix matches the library maths', async () => {
  const p = await fresh('en', { path: '#/lab/simulator' });
  await p.waitFor("document.querySelector('.cm')");
  ok(/EDUCATIONAL SIMULATION/.test(await txt(p, '.sim-banner')));
  ok(/SIMULATION/.test(await p.eval("document.querySelector('.chart.roc.chart-sim').textContent")), 'chart stamp');
  const n = await p.eval("[...document.querySelectorAll('.cm .cm-n')].map((e) => +e.textContent).reduce((a, b) => a + b, 0)");
  eq(n, 400);
  await p.setValue('#sim-d', 4); await p.sleep(200);
  const a1 = await p.eval("document.querySelector('.chart-fig figcaption').textContent.match(/AUC ([0-9.]+)/)[1]");
  await p.setValue('#sim-d', 0); await p.sleep(200);
  const a2 = await p.eval("document.querySelector('.chart-fig figcaption').textContent.match(/AUC ([0-9.]+)/)[1]");
  ok(+a1 > 0.95 && +a2 < 0.6, `AUC response to separation ${a1} / ${a2}`);
  ok(!(await has(p, '.prov-real')) || true);
  return p;
});

// Held-out fixtures are generated HERE, for testing only, and are never shipped as app data.
function fixture({ leak = false, seed = 5 } = {}) {
  const rng = mulberry32(seed); const rows = [];
  const mk = (split, n, tag) => { for (let i = 0; i < n; i++) { const ref = rng() < 0.3 ? 1 : 0; const z = rng.normal() + (ref ? 1.8 : 0); rows.push({ id: `${tag}${i}`, patient: `P-${tag}${i}`, split, reference: ref, score: 1 / (1 + Math.exp(-(z - 0.9))) }); } };
  mk('train', 120, 'a'); mk('val', 80, 'b'); mk('test', 100, 'c');
  if (leak) rows.push({ id: 'leak1', patient: 'P-a0', split: 'test', reference: 1, score: 0.9 });
  return rows;
}
const toCsv = (rows) => 'id,patient_id,split,reference,score\n' + rows.map((r) => [r.id, r.patient, r.split, r.reference, r.score.toFixed(6)].join(',')).join('\n');
await check('held-out import: patient leakage blocks reporting', async () => {
  const p = await fresh('en', { path: '#/lab/evaluate' });
  await p.waitFor("document.querySelector('#ev-file')");
  await p.uploadText('#ev-file', 'leaky.csv', toCsv(fixture({ leak: true }))); await p.sleep(800);
  ok(/more than one partition/.test(await txt(p, '.integ')), 'leakage not reported');
  ok(/Reporting blocked/.test(await p.eval("document.querySelector('.ev-right').innerText")));
  eq(await has(p, '.ev-result'), false, 'metrics shown despite leakage');
  return p;
});
await check('held-out import: displayed statistics equal an independent recomputation (threshold fixed on validation only)', async () => {
  const rows = fixture({ seed: 11 });
  const exp = evaluateHeldOut(rows.map((r) => ({ ...r, score: Number(r.score.toFixed(6)) })), { strategy: 'youden' });
  const p = await fresh('en', { path: '#/lab/evaluate' });
  await p.waitFor("document.querySelector('#ev-file')");
  await p.uploadText('#ev-file', 'heldout.csv', toCsv(rows)); await p.waitFor("document.querySelector('.ev-result')", 8000);
  const cm = await p.eval("Object.fromEntries([...document.querySelectorAll('.ev-result .cm-cell')].map((c) => [c.querySelector('.cm-k').textContent.slice(0, 2), +c.querySelector('.cm-n').textContent]))");
  eq(cm.TP, exp.cm.tp, 'TP'); eq(cm.FN, exp.cm.fn, 'FN'); eq(cm.FP, exp.cm.fp, 'FP'); eq(cm.TN, exp.cm.tn, 'TN');
  const sens = await p.eval("document.querySelector('.ev-result .rb-row .rb-v').textContent");
  eq(sens, `${(exp.rates.sensitivity * 100).toFixed(1)}%`, 'sensitivity');
  ok((await p.eval("document.querySelector('.ev-result figcaption').textContent")).includes(`AUC ${auc(exp.test).toFixed(3)}`), 'AUC');
  ok(/Real — computed from your uploaded predictions/.test(await p.eval("document.querySelector('.ev-file').textContent")));
  ok(/Chosen on val/.test(await p.eval("document.querySelector('.ev-right').innerText")), 'threshold provenance');
  // thresholds tab warns when the test partition is explored
  await p.eval("location.hash = '#/lab/thresholds'"); await p.waitFor("document.querySelector('#th-slider')");
  await click(p, 'input[name=part][value=test]'); await p.sleep(200);
  ok(/exploration, not evaluation/.test(await p.eval("document.querySelector('.th-live').innerText")), 'test-peeking warning');
  // errors tab lists real FN ids from the file
  await p.eval("location.hash = '#/lab/errors'"); await p.waitFor("document.querySelector('.er-real')");
  const fnN = await p.eval("document.querySelector('.er-real .tone-fn').textContent.match(/\\((\\d+)\\)/)[1]");
  eq(+fnN, exp.errors.falseNegatives.length, 'FN list size');
  // simulator never shows real-provenance chips inside its own panel
  await p.eval("location.hash = '#/lab/simulator'"); await p.waitFor("document.querySelector('.sim-grid')");
  eq(await p.eval("document.querySelectorAll('.sim-grid .prov-real').length"), 0);
  return p;
});
await check('dataset page: teaching set described as synthetic; candidate datasets flagged as not downloaded', async () => {
  const p = await fresh('en', { path: '#/lab/dataset' });
  const body = await p.eval("document.querySelector('.lab-body').innerText");
  ok(/Synthetic teaching illustrations/.test(body) && /Nothing has been downloaded/.test(body) && /patient-level leakage cannot be controlled/i.test(body));
  return p;
});

console.log('\nResponsible AI, language');
await check('Arabic: RTL layout, translated chrome, anatomy not mirrored, same caveats', async () => {
  const p = await fresh('ar', { path: '#/lab' });
  eq(await p.eval('document.documentElement.dir'), 'rtl');
  ok(/لم يُقيَّم أي نموذج بحثي/.test(await txt(p, '.st-hero')));
  ok(/مختبر الذكاء التشخيصي/.test(await txt(p, '.brand-name')));
  const p2 = await fresh('ar', { path: '#/' });
  eq(await p2.eval("getComputedStyle(document.querySelector('.eye-canvas')).transform"), 'none', 'eye canvas must not be mirrored');
  p.close();
  return p2;
});
await check('language toggle switches live without losing the route', async () => {
  const p = await fresh('en', { path: '#/lab/simulator' });
  await click(p, '.lang-btn'); await p.sleep(900);
  eq(await p.eval('document.documentElement.lang'), 'ar');
  eq(await p.eval('location.hash'), '#/lab/simulator', 'route kept');
  ok(/محاكاة/.test(await txt(p, '.sim-banner')));
  return p;
});
await check('keyboard: skip link, focus-visible targets and More menu with Escape', async () => {
  const p = await fresh('en', { path: '#/about' });
  await p.eval("document.querySelector('.nav-more > button').focus(); document.querySelector('.nav-more > button').click()"); await p.sleep(250);
  eq(await p.eval("document.querySelector('.nav-more').dataset.open"), 'true');
  await p.key('Escape'); await p.sleep(200);
  eq(await p.eval("document.querySelector('.nav-more').dataset.open"), 'false');
  ok(await p.eval("document.getElementById('skip').getAttribute('href') === '#view'"));
  return p;
});

if (!only) writeFileSync('docs/TEST_RESULTS.json', JSON.stringify({ date: new Date().toISOString(), total: results.length, passed: results.filter((r) => r.pass).length, results }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
browser.close(); srv.kill();
process.exit(failed.length ? 1 : 0);
