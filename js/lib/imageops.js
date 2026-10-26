// Pixel operations on ImageData-shaped objects ({data: Uint8ClampedArray RGBA, width, height}).
// No DOM: used by the stress test, the quality indicators and the unit tests. Deterministic.

// Three successive box blurs approximate a Gaussian of the given sigma (px).
export function gaussianBlur(img, sigma) {
  if (sigma <= 0.3) return img;
  const { width: w, height: h } = img;
  const boxes = boxesForGauss(sigma, 3);
  let src = img.data;
  let dst = new Uint8ClampedArray(src.length);
  for (const b of boxes) {
    boxPass(src, dst, w, h, (b - 1) / 2, true);
    boxPass(dst, src, w, h, (b - 1) / 2, false);
  }
  return img;
}

function boxesForGauss(sigma, n) {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  return Array.from({ length: n }, (_, i) => (i < m ? wl : wu));
}

// One separable box pass of radius r over RGB (alpha untouched), edge-clamped.
function boxPass(src, dst, w, h, r, horizontal) {
  r = Math.max(0, Math.round(r));
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const stride = horizontal ? 4 : w * 4;
  const lineStride = horizontal ? w * 4 : 4;
  const norm = 1 / (2 * r + 1);
  for (let c = 0; c < 3; c++) {
    for (let l = 0; l < lines; l++) {
      const base = l * lineStride + c;
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += src[base + Math.min(len - 1, Math.max(0, k)) * stride];
      for (let i = 0; i < len; i++) {
        dst[base + i * stride] = acc * norm;
        const add = Math.min(len - 1, i + r + 1);
        const sub = Math.max(0, i - r);
        acc += src[base + add * stride] - src[base + sub * stride];
      }
    }
  }
  for (let i = 3; i < dst.length; i += 4) dst[i] = src[i];
}

// brightness: additive offset in % of full scale (−50…+50); contrast: multiplier in % (50…200); 100 = unchanged.
export function adjust(img, { brightness = 0, contrast = 100 } = {}) {
  const lut = new Uint8ClampedArray(256);
  const c = contrast / 100;
  const b = (brightness / 100) * 255;
  for (let v = 0; v < 256; v++) lut[v] = (v - 128) * c + 128 + b;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]];
    d[i + 1] = lut[d[i + 1]];
    d[i + 2] = lut[d[i + 2]];
  }
  return img;
}

export function cloneImage(img) {
  return { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height };
}

// Green-channel contrast stretch (a common retinal preprocessing view): green carries the highest
// lesion/vessel contrast in fundus photographs. Returns a new grayscale-as-RGBA image.
export function greenEnhance(img, mask = true) {
  const { data, width: w, height: h } = img;
  const out = { data: new Uint8ClampedArray(data.length), width: w, height: h };
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.48;
  const hist = new Uint32Array(256);
  let n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (mask && (x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
      hist[data[(y * w + x) * 4 + 1]]++;
      n++;
    }
  const pct = (p) => { let a = 0; for (let v = 0; v < 256; v++) { a += hist[v]; if (a >= p * n) return v; } return 255; };
  const lo = pct(0.02);
  const hi = Math.max(lo + 1, pct(0.995));
  for (let i = 0; i < data.length; i += 4) {
    const g = Math.max(0, Math.min(255, ((data[i + 1] - lo) / (hi - lo)) * 255));
    out.data[i] = out.data[i + 1] = out.data[i + 2] = g;
    out.data[i + 3] = 255;
  }
  return out;
}

// Down-sample by averaging into a smaller ImageData-shaped object.
export function downscale(img, size) {
  const { width: w, height: h, data } = img;
  const out = { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) };
  const fx = w / size;
  const fy = h / size;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, c = 0;
      const x0 = Math.floor(x * fx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * fx));
      const y0 = Math.floor(y * fy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * fy));
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * w + xx) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; c++;
        }
      const o = (y * size + x) * 4;
      out.data[o] = r / c; out.data[o + 1] = g / c; out.data[o + 2] = b / c; out.data[o + 3] = 255;
    }
  return out;
}
