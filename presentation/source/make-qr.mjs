// Generates presentation/source/assets/qr-live-prototype.png and PROVES it decodes to the exact URL.
// Dev-only dependencies are NOT in the repo:  mkdir qrt && cd qrt && npm i qrcode jsqr pngjs
//   QR_TOOLS=/path/to/qrt/node_modules node presentation/source/make-qr.mjs
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const toolsDir = process.env.QR_TOOLS || resolve(here, '../../node_modules');
const req = createRequire(resolve(toolsDir, 'x.js'));
const QRCode = req('qrcode'); const jsQR = req('jsqr'); const { PNG } = req('pngjs');

const URL_LIVE = 'https://maymourad.github.io/Diagnostic-Intelligence-Lab/';
const out = resolve(here, 'assets/qr-live-prototype.png');
mkdirSync(dirname(out), { recursive: true });
const buf = await QRCode.toBuffer(URL_LIVE, { errorCorrectionLevel: 'M', margin: 4, scale: 16, color: { dark: '#0A1A2C', light: '#FFFFFF' } });
writeFileSync(out, buf);
const img = PNG.sync.read(buf);
const dec = jsQR(new Uint8ClampedArray(img.data), img.width, img.height);
if (!dec || dec.data !== URL_LIVE) { console.error('QR VERIFICATION FAILED', dec && dec.data); process.exit(1); }
console.log(`QR ok: ${img.width}×${img.height}px decodes to ${dec.data}`);
