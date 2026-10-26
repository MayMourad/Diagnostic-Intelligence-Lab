// Minimal Chrome DevTools Protocol driver (zero dependencies; Node ≥ 22 has a global WebSocket).
// Used by tools/e2e.mjs for browser tests and by tools/shots.mjs for real screenshots of the finished app.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);

export async function launch({ port = 9333, width = 1440, height = 900, extraArgs = [] } = {}) {
  const { existsSync } = await import('node:fs');
  const exe = CHROME.find((p) => existsSync(p));
  if (!exe) throw new Error('No Chrome/Edge found');
  const dir = mkdtempSync(join(tmpdir(), 'dil-chrome-'));
  const proc = spawn(exe, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
    '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--force-device-scale-factor=1', ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), ...extraArgs, 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) break; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  const browser = {
    port, proc,
    async newPage(opts = {}) {
      const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
      const page = await Page.connect(t.webSocketDebuggerUrl, opts);
      return page;
    },
    close() { try { proc.kill(); } catch { /* ignore */ } },
  };
  return browser;
}

class Page {
  static async connect(url, { width = 1440, height = 900, dpr = 1, mobile = false } = {}) {
    const p = new Page();
    p.ws = new WebSocket(url);
    await new Promise((res, rej) => { p.ws.onopen = res; p.ws.onerror = rej; });
    p.id = 0; p.pending = new Map(); p.errors = []; p.logs = []; p.listeners = [];
    p.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && p.pending.has(m.id)) { const { res, rej } = p.pending.get(m.id); p.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); return; }
      if (m.method === 'Runtime.exceptionThrown') p.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled') {
        const text = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
        p.logs.push({ type: m.params.type, text });
        if (m.params.type === 'error') p.errors.push('console.error: ' + text);
      }
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') p.errors.push(`log: ${m.params.entry.text} ${m.params.entry.url || ''}`);
      p.listeners.forEach((f) => f(m));
    };
    await p.send('Page.enable'); await p.send('Runtime.enable'); await p.send('Log.enable');
    await p.setViewport(width, height, dpr, mobile);
    return p;
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  async setViewport(width, height, dpr = 1, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
  }
  async emulate({ reducedMotion, colorScheme } = {}) {
    const features = [];
    if (reducedMotion !== undefined) features.push({ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' });
    if (colorScheme) features.push({ name: 'prefers-color-scheme', value: colorScheme });
    await this.send('Emulation.setEmulatedMedia', { features });
  }
  async goto(url, { wait = 'load' } = {}) {
    const loaded = new Promise((res) => { const f = (m) => { if (m.method === 'Page.loadEventFired') { this.listeners = this.listeners.filter((x) => x !== f); res(); } }; this.listeners.push(f); });
    await this.send('Page.navigate', { url });
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))]); // external font CSS may stall the load event offline
    if (wait === 'idle') await this.sleep(400);
  }
  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async waitFor(expr, timeout = 15000, label = expr) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { if (await this.eval(`!!(${expr})`)) return true; } catch { /* page navigating */ }
      await this.sleep(100);
    }
    throw new Error(`waitFor timeout: ${label}`);
  }
  async rect(sel) {
    return this.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center',inline:'center'}); const r = e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })()`);
  }
  async mouse(type, x, y, extra = {}) {
    await this.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mouseReleased' ? 0 : 1, ...extra });
  }
  async click(sel, { dx = 0, dy = 0 } = {}) {
    const r = await this.rect(sel);
    if (!r) throw new Error(`click: no element ${sel}`);
    const x = r.x + r.w / 2 + dx, y = r.y + r.h / 2 + dy;
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await this.mouse('mousePressed', x, y); await this.mouse('mouseReleased', x, y);
    await this.sleep(60);
  }
  async clickAt(x, y) { await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await this.mouse('mousePressed', x, y); await this.mouse('mouseReleased', x, y); await this.sleep(60); }
  async hover(sel) { const r = await this.rect(sel); await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x + r.w / 2, y: r.y + r.h / 2 }); await this.sleep(80); }
  async drag(x0, y0, x1, y1, steps = 8) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0 });
    await this.mouse('mousePressed', x0, y0);
    for (let i = 1; i <= steps; i++) await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps, buttons: 1, button: 'left' });
    await this.mouse('mouseReleased', x1, y1);
    await this.sleep(60);
  }
  async wheel(x, y, deltaY) { await this.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY }); await this.sleep(80); }
  async type(sel, text) { await this.click(sel); await this.send('Input.insertText', { text }); await this.sleep(40); }
  async setValue(sel, value) {
    await this.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const proto = Object.getPrototypeOf(e); const set = Object.getOwnPropertyDescriptor(proto, 'value').set; set.call(e, ${JSON.stringify(String(value))}); e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    await this.sleep(40);
  }
  async key(key, { modifiers = 0 } = {}) {
    const map = { Enter: 13, Escape: 27, Tab: 9, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ' ': 32, '+': 187, '-': 189, '0': 48 };
    const code = map[key] ?? key.toUpperCase().charCodeAt(0);
    const base = { key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers };
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base, text: key.length === 1 ? key : undefined });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    await this.sleep(60);
  }
  async screenshot(path, { clip, selector, fullPage = false } = {}) {
    let c = clip;
    if (selector) { const r = await this.rect(selector); c = { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 }; }
    const params = { format: 'png', captureBeyondViewport: fullPage };
    if (c) params.clip = { scale: 1, ...c };
    const { data } = await this.send('Page.captureScreenshot', params);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(data, 'base64'));
    return path;
  }
  async uploadText(selector, name, text) { // set a file input from in-memory text
    await this.eval(`(() => { const i = document.querySelector(${JSON.stringify(selector)}); const dt = new DataTransfer(); dt.items.add(new File([${JSON.stringify(text)}], ${JSON.stringify(name)}, {type:'text/plain'})); i.files = dt.files; i.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    await this.sleep(150);
  }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
}
