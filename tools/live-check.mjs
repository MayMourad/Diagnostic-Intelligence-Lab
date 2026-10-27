// Smoke test against a deployed URL: node tools/live-check.mjs https://maymourad.github.io/Diagnostic-Intelligence-Lab/
import { launch } from './cdp.mjs';
const base = process.argv[2];
if (!base) { console.error('usage: node tools/live-check.mjs <base-url>'); process.exit(2); }
const b = await launch({ port: 9777, width: 1440, height: 900 });
let ok = true;
const say = (pass, msg) => { if (!pass) ok = false; console.log(pass ? '  ✓' : '  ✗', msg); };
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.goto(base);
  await p.waitFor("document.querySelector('.entry-title')", 30000);
  await p.waitFor("document.querySelector('.eye-canvas').dataset.painted", 30000);
  say((await p.eval("document.querySelector('.eye-canvas').dataset.painted")) === 'true', 'entry page renders and the 3D eye paints');
  await p.eval("location.hash = '#/workbench'");
  await p.waitFor("document.querySelectorAll('.cc-img canvas').length === 16", 90000);
  say(true, 'workbench: 16 case thumbnails rendered by the image worker');
  await p.eval("location.hash = '#/lab/simulator'");
  await p.waitFor("document.querySelector('.cm')", 20000);
  say(/EDUCATIONAL SIMULATION/.test(await p.eval("document.querySelector('.sim-banner').textContent")), 'accuracy lab simulator is stamped');
  const bad = p.errors.filter((e) => !/fonts\.g|net::/.test(e));
  say(bad.length === 0, `no console errors${bad.length ? ': ' + bad.join(' | ') : ''}`);
} finally { b.close(); }
process.exit(ok ? 0 : 1);
