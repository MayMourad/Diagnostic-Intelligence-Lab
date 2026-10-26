// Off-main-thread renderer: paints a teaching case and (optionally) measures its quality.
// Messages in:  { id, caseId, size, quality }   Messages out: { id, bitmap, quality }
import { getCase } from '../data/cases.js';
import { paintFundus } from './fundus-paint.js';
import { measureQuality, assessQuality } from './quality.js';

self.onmessage = (e) => {
  const { id, caseId, size, quality } = e.data;
  try {
    const c = getCase(caseId);
    const cv = paintFundus(c.plan, size);
    let q = null;
    if (quality) {
      const img = cv.getContext('2d').getImageData(0, 0, size, size);
      const metrics = measureQuality(img);
      q = { metrics, assessment: assessQuality(metrics) };
    }
    const bitmap = cv.transferToImageBitmap ? cv.transferToImageBitmap() : null;
    self.postMessage({ id, bitmap, quality: q }, bitmap ? [bitmap] : []);
  } catch (err) {
    self.postMessage({ id, error: String(err && err.stack ? err.stack : err) });
  }
};
