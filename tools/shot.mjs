// Usage: node tools/shot.mjs "#/path" out.png [scrollY] [width] [height] [lang] [waitMs] [js]
import { launch } from './cdp.mjs';
import { spawn } from 'node:child_process';
const [hash = '#/', out = 'screenshots/_shot.png', scrollY = '0', w = '1440', h = '900', lang = 'en', wait = '1500', js = ''] = process.argv.slice(2);
const srv = spawn('node', ['tools/serve.mjs', '4173'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 500));
const b = await launch({ width: +w, height: +h });
try {
  const p = await b.newPage({ width: +w, height: +h });
  await p.goto('http://127.0.0.1:4173/');
  await p.eval(`localStorage.setItem('dil.v2', JSON.stringify({lang:'${lang}'}))`);
  await p.goto('http://127.0.0.1:4173/' + hash);
  await p.sleep(+wait);
  if (+scrollY) { await p.eval(`window.scrollTo(0, ${+scrollY})`); await p.sleep(+(process.env.SCROLL_WAIT || 4500)); }
  if (js) { const r = await p.eval(js); if (r !== undefined) console.log('js →', JSON.stringify(r)); await p.sleep(+(process.env.JS_WAIT || 700)); }
  await p.screenshot(out);
  console.log('errors:', JSON.stringify(p.errors));
  console.log('warnings:', JSON.stringify(p.logs.filter((l) => l.type === 'warning').map((l) => l.text).slice(0, 5)));
} finally { b.close(); srv.kill(); }
process.exit(0);
