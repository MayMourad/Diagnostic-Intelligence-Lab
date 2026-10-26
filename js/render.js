// Image service: renders teaching cases in a module worker (falls back to the main thread), caches results.
//   analysis(caseId) → { canvas (768²), quality }   used for thumbnails, quality indicators and the stress test
//   full(caseId)     → canvas (1536²)               used by the zoomable viewer
import { getCase } from './data/cases.js';
import { paintFundus, makeCanvas } from './lib/fundus-paint.js';
import { measureQuality, assessQuality } from './lib/quality.js';

export const ANALYSIS_SIZE = 768;
export const FULL_SIZE = 1536;

let worker = null;
let workerBroken = false;
let seq = 0;
const waiting = new Map();
const cache = new Map();

function getWorker() {
  if (worker || workerBroken) return worker;
  try {
    worker = new Worker(new URL('./lib/render-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const w = waiting.get(e.data.id);
      if (!w) return;
      waiting.delete(e.data.id);
      e.data.error ? w.rej(new Error(e.data.error)) : w.res(e.data);
    };
    worker.onerror = () => { workerBroken = true; worker = null; waiting.forEach((w) => w.rej(new Error('worker failed'))); waiting.clear(); };
  } catch { workerBroken = true; worker = null; }
  return worker;
}

function viaMainThread(caseId, size, withQuality) {
  return new Promise((resolve) => setTimeout(() => {
    const cv = paintFundus(getCase(caseId).plan, size);
    let quality = null;
    if (withQuality) {
      const metrics = measureQuality(cv.getContext('2d').getImageData(0, 0, size, size));
      quality = { metrics, assessment: assessQuality(metrics) };
    }
    resolve({ canvas: cv, quality });
  }, 0));
}

function render(caseId, size, withQuality) {
  const w = getWorker();
  if (!w) return viaMainThread(caseId, size, withQuality);
  const id = ++seq;
  return new Promise((res, rej) => {
    waiting.set(id, { res, rej });
    w.postMessage({ id, caseId, size, quality: withQuality });
  }).then(({ bitmap, quality }) => {
    const cv = makeCanvas(size);
    cv.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return { canvas: cv, quality };
  }).catch(() => viaMainThread(caseId, size, withQuality));
}

const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

export const analysis = (caseId) => once(`a:${caseId}`, () => render(caseId, ANALYSIS_SIZE, true));
export const full = (caseId) => once(`f:${caseId}`, () => render(caseId, FULL_SIZE, false).then((r) => r.canvas));

export function thumbnail(canvas, size = 240) {
  const t = makeCanvas(size);
  const x = t.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(canvas, 0, 0, size, size);
  return t;
}

// ImageData of the analysis render (copied: callers mutate it).
export async function analysisPixels(caseId) {
  const { canvas } = await analysis(caseId);
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
}

export const workerActive = () => !!worker;
