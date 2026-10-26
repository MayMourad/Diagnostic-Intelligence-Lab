import { launch } from './cdp.mjs';
import { spawn } from 'node:child_process';

const srv = spawn('node', ['tools/serve.mjs', '4173'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const b = await launch({ width: 1600, height: 1200 });
try {
  const p = await b.newPage({ width: 1600, height: 1200 });
  await p.goto('http://127.0.0.1:4173/tools/sheet.html');
  await p.waitFor("document.title.startsWith('done')", 60000);
  console.log(JSON.stringify(await p.eval('window.__out')));
  console.log('errors', p.errors);
  await p.screenshot(process.argv[2] || 'screenshots/_sheet.png', { fullPage: true });
} finally { b.close(); srv.kill(); }
process.exit(0);
