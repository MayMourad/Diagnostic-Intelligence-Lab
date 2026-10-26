// Image-quality indicators MEASURED from pixels (not authored). Pure; works on ImageData-shaped input.
// The adequacy bands are PROTOTYPE HEURISTICS tuned on the 16 teaching images — they are not validated
// gradability criteria and must not be used on real images.
import { downscale, gaussianBlur } from './imageops.js';

const WORK = 384;

export function measureQuality(img) {
  const s = gaussianBlur(downscale(img, WORK), 1.1); // light pre-smoothing so sensor/grain noise does not masquerade as focus
  const { data, width: w } = s;
  const cx = w / 2;
  const R = w * 0.46;
  const lum = new Float32Array(w * w);
  const inMask = new Uint8Array(w * w);
  let maskN = 0;
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      lum[i] = data[i * 4 + 1] * 0.7 + data[i * 4] * 0.2 + data[i * 4 + 2] * 0.1; // green-weighted luminance
      if ((x - cx) ** 2 + (y - cx) ** 2 <= R * R) { inMask[i] = 1; maskN++; }
    }
  let sum = 0, sum2 = 0, visible = 0;
  const qs = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; // sum, count
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!inMask[i]) continue;
      const v = lum[i];
      sum += v; sum2 += v * v;
      if (v > 22) visible++;
      const q = (y < cx ? 0 : 2) + (x < cx ? 0 : 1);
      qs[q][0] += v; qs[q][1]++;
    }
  const mean = sum / maskN;
  const std = Math.sqrt(Math.max(0, sum2 / maskN - mean * mean));
  const qm = qs.map((q) => q[0] / Math.max(1, q[1]));
  const evenness = 1 - (Math.max(...qm) - Math.min(...qm)) / Math.max(1, mean * 2);
  // Variance of the Laplacian over the central 80 % of the field → focus measure.
  let lapSum = 0, lapSum2 = 0, lapN = 0;
  const inner = R * 0.8;
  for (let y = 1; y < w - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      if ((x - cx) ** 2 + (y - cx) ** 2 > inner * inner) continue;
      const i = y * w + x;
      const l = lum[i - 1] + lum[i + 1] + lum[i - w] + lum[i + w] - 4 * lum[i];
      lapSum += l; lapSum2 += l * l; lapN++;
    }
  const lapVar = lapSum2 / lapN - (lapSum / lapN) ** 2;
  const sharp = Math.sqrt(Math.max(0, lapVar));
  return {
    sharpness: sharp, // RMS Laplacian (higher = more detail)
    brightness: mean, // 0-255 mean luminance inside the field
    contrast: std,
    evenness, // 1 = even illumination across quadrants
    coverage: visible / maskN, // share of the field that is not black
  };
}

// Heuristic bands. Order: reasons are reported so the UI can say *why*.
export const BANDS = {
  sharpness: { insufficient: 1.3, borderline: 2.2 },
  brightness: { low: [30, 44], high: [190, 215] }, // [insufficient, borderline] below/above
  contrast: { insufficient: 12, borderline: 18 },
  coverage: { insufficient: 0.6, borderline: 0.8 },
  evenness: { insufficient: 0.55, borderline: 0.72 },
};

export function assessQuality(m) {
  const reasons = [];
  const flag = (key, level) => reasons.push({ key, level });
  const lo = (v, b, key) => { if (v < b.insufficient) flag(key, 'insufficient'); else if (v < b.borderline) flag(key, 'borderline'); };
  lo(m.sharpness, BANDS.sharpness, 'sharpness');
  lo(m.contrast, BANDS.contrast, 'contrast');
  lo(m.coverage, BANDS.coverage, 'coverage');
  lo(m.evenness, BANDS.evenness, 'evenness');
  if (m.brightness < BANDS.brightness.low[0] || m.brightness > BANDS.brightness.high[1]) flag('brightness', 'insufficient');
  else if (m.brightness < BANDS.brightness.low[1] || m.brightness > BANDS.brightness.high[0]) flag('brightness', 'borderline');
  const level = reasons.some((r) => r.level === 'insufficient') ? 'insufficient' : reasons.length ? 'borderline' : 'adequate';
  return { level, reasons };
}

// How visible is an annotated lesion? Mean green-channel difference between the lesion disc and a surrounding ring.
export function lesionConspicuity(img, lesions, S = img.width) {
  const R = S * 0.5 * 0.96;
  const c = S / 2;
  const g = (x, y) => img.data[((y | 0) * img.width + (x | 0)) * 4 + 1];
  return lesions
    .filter((l) => ['ma', 'hemorrhage', 'hard-exudate', 'cotton-wool', 'preretinal-hemorrhage'].includes(l.type))
    .map((l) => {
      const px = c + l.x * R, py = c + l.y * R, pr = Math.max(2, l.r * R);
      let inS = 0, inN = 0, outS = 0, outN = 0;
      const ext = Math.ceil(pr * 2.6);
      for (let dy = -ext; dy <= ext; dy++)
        for (let dx = -ext; dx <= ext; dx++) {
          const x = px + dx, y = py + dy;
          if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
          const d = Math.hypot(dx, dy);
          if (d <= pr * 0.8) { inS += g(x, y); inN++; }
          else if (d >= pr * 1.6 && d <= pr * 2.6) { outS += g(x, y); outN++; }
        }
      return { id: l.id, type: l.type, contrast: inN && outN ? Math.abs(inS / inN - outS / outN) : 0 };
    });
}
