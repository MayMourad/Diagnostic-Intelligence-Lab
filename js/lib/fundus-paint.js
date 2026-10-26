// Canvas painter for the SYNTHETIC teaching illustrations. Draws exactly what the plan (js/lib/fundus.js) contains.
// Not a photograph, not a GAN, not a model output: every pixel is drawn by deterministic code.
import { mulberry32 } from './rng.js';
import { gaussianBlur } from './imageops.js';

const PAL = {
  typical: { c: [224, 120, 68], m: [198, 94, 54], e: [130, 50, 36] },
  pale: { c: [236, 154, 88], m: [212, 122, 70], e: [154, 72, 46] },
  dark: { c: [168, 76, 48], m: [134, 56, 38], e: [82, 32, 24] },
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// Works on the main thread (HTMLCanvasElement) and inside the render worker (OffscreenCanvas).
export function makeCanvas(w, h = w) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return new OffscreenCanvas(w, h);
}

function noiseLayer(size, seed) {
  const rng = mulberry32(seed);
  const cv = makeCanvas(size);
  const x = cv.getContext('2d');
  const id = x.createImageData(size, size);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 90 + rng() * 80;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  return cv;
}

export function paintFundus(plan, S = 1536) {
  const { def, s, disc, macula, vessels, lesions } = plan;
  const im = def.imaging;
  const cv = makeCanvas(S);
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const rng = mulberry32(def.seed ^ 0x9e3779b1);
  const C = S / 2;
  const R = S * 0.5 * 0.96;
  const X = (x) => C + x * R;
  const Y = (y) => C + y * R;
  const U = (r) => r * R;
  const pal = PAL[im.pigment] || PAL.typical;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S, S);
  ctx.save();
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.clip();

  // retinal background
  const g = ctx.createRadialGradient(C - s * R * 0.12, C, 0, C, C, R);
  g.addColorStop(0, rgba(pal.c, 1));
  g.addColorStop(0.55, rgba(pal.m, 1));
  g.addColorStop(1, rgba(pal.e, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // choroidal mottling: two noise octaves, smoothed by up-scaling, blended softly
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(noiseLayer(18, def.seed + 1), 0, 0, S, S);
  ctx.globalAlpha = 0.3;
  ctx.drawImage(noiseLayer(60, def.seed + 2), 0, 0, S, S);
  ctx.restore();

  // macula
  const mg = ctx.createRadialGradient(X(macula.x), Y(macula.y), 0, X(macula.x), Y(macula.y), U(0.13));
  mg.addColorStop(0, 'rgba(78,22,12,0.55)');
  mg.addColorStop(0.45, 'rgba(90,26,14,0.28)');
  mg.addColorStop(1, 'rgba(90,26,14,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(X(macula.x) - U(0.14), Y(macula.y) - U(0.14), U(0.28), U(0.28));

  // vessels (deepest branches first, veins under arteries)
  const order = [...vessels].sort((a, b) => b.depth - a.depth || (a.kind === 'vein' ? -1 : 1));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const strokeV = (pts, color, scale, alpha = 1) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = 1; i < pts.length; i++) {
      ctx.lineWidth = Math.max(1, U(pts[i].w) * scale);
      ctx.beginPath();
      ctx.moveTo(X(pts[i - 1].x), Y(pts[i - 1].y));
      ctx.lineTo(X(pts[i].x), Y(pts[i].y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  const vein = im.pigment === 'dark' ? 'rgb(70,12,10)' : 'rgb(104,20,16)';
  const artery = im.pigment === 'dark' ? 'rgb(112,26,18)' : 'rgb(158,38,26)';
  for (const v of order) {
    strokeV(v.pts, 'rgba(50,8,6,0.4)', 2.0, 0.7);
    strokeV(v.pts, v.kind === 'vein' ? vein : artery, 1.35);
    if (v.kind === 'artery') strokeV(v.pts, 'rgba(226,120,92,0.55)', 0.28);
  }

  // optic disc
  ctx.save();
  ctx.translate(X(disc.x), Y(disc.y));
  ctx.scale(1, disc.ry / disc.rx);
  const dg = ctx.createRadialGradient(0, 0, 0, 0, 0, U(disc.rx) * 1.18);
  dg.addColorStop(0, 'rgba(255,240,196,1)');
  dg.addColorStop(0.5, 'rgba(250,216,150,0.98)');
  dg.addColorStop(0.86, 'rgba(228,164,102,0.92)');
  dg.addColorStop(1, 'rgba(196,110,64,0)');
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.arc(0, 0, U(disc.rx) * 1.18, 0, 7);
  ctx.fill();
  const cg = ctx.createRadialGradient(-s * U(0.008), 0, 0, 0, 0, U(disc.rx) * 0.5);
  cg.addColorStop(0, 'rgba(255,250,226,0.95)');
  cg.addColorStop(1, 'rgba(255,244,210,0)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, U(disc.rx) * 0.5, 0, 7);
  ctx.fill();
  ctx.restore();
  // re-draw trunks over the disc so vessels read as emerging from the cup
  for (const v of vessels.filter((v) => v.main)) strokeV(v.pts.slice(0, 9), v.kind === 'vein' ? vein : artery, 0.9);

  // lesions ---------------------------------------------------------------------------------------
  const blob = (x, y, r, inner, outer, a = 1, sx = 1, rot = 0) => {
    ctx.save();
    ctx.translate(X(x), Y(y));
    ctx.rotate(rot);
    ctx.scale(sx, 1);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, U(r));
    gr.addColorStop(0, rgba(inner, a));
    gr.addColorStop(0.62, rgba(inner, a * 0.82));
    gr.addColorStop(1, rgba(outer, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, U(r), 0, 7);
    ctx.fill();
    ctx.restore();
  };
  const draw = (type) => lesions.filter((l) => l.type === type);

  for (const l of draw('cotton-wool')) {
    blob(l.x, l.y, l.r * 1.9, [236, 214, 186], [236, 214, 186], 0.5, 1.8, l.rot);
    blob(l.x, l.y, l.r * 1.1, [248, 236, 214], [248, 236, 214], 0.55, 1.7, l.rot);
  }
  for (const l of draw('hard-exudate')) {
    blob(l.x, l.y, l.r * 1.7, [250, 232, 138], [236, 208, 100], 0.95);
    blob(l.x, l.y, l.r * 0.8, [255, 250, 200], [255, 250, 200], 0.9);
  }
  for (const l of draw('hemorrhage')) {
    if (l.shape === 'blot') {
      blob(l.x, l.y, l.r, [96, 8, 10], [120, 20, 16], 0.96);
      blob(l.x + l.r * 0.5, l.y - l.r * 0.2, l.r * 0.75, [100, 10, 12], [120, 20, 16], 0.9);
      blob(l.x - l.r * 0.4, l.y + l.r * 0.35, l.r * 0.65, [104, 12, 12], [120, 20, 16], 0.9);
    } else blob(l.x, l.y, l.r * 1.1, [100, 10, 12], [124, 24, 18], 0.96);
  }
  for (const l of draw('ma')) blob(l.x, l.y, l.r * 1.25, [138, 14, 14], [150, 28, 20], 0.97);
  for (const l of draw('preretinal-hemorrhage')) {
    ctx.save();
    ctx.translate(X(l.x), Y(l.y));
    const gr = ctx.createLinearGradient(0, -U(l.ry), 0, U(l.ry));
    gr.addColorStop(0, 'rgba(176,60,40,0.8)');
    gr.addColorStop(0.3, 'rgba(118,12,12,0.96)');
    gr.addColorStop(1, 'rgba(84,6,8,0.98)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(-U(l.r), -U(l.ry) * 0.2);
    ctx.quadraticCurveTo(-U(l.r) * 0.9, U(l.ry) * 1.2, 0, U(l.ry) * 1.05);
    ctx.quadraticCurveTo(U(l.r) * 0.9, U(l.ry) * 1.2, U(l.r), -U(l.ry) * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const l of draw('venous-beading')) {
    const col = im.pigment === 'dark' ? 'rgb(78,10,8)' : 'rgb(112,16,14)';
    ctx.fillStyle = col;
    l.path.forEach((p, i) => {
      if (i % 2) return;
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), U(p.w) * (0.55 + 0.75 * (0.5 + 0.5 * Math.sin(i * 0.9))), 0, 7);
      ctx.fill();
    });
  }
  const lines = (paths, color, w, a = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.2, U(w));
    ctx.globalAlpha = a;
    for (const pts of paths) {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  for (const l of draw('irma')) lines(l.path, 'rgb(150,26,22)', 0.0034, 0.92);
  for (const l of draw('neovascularization')) {
    lines(l.path, 'rgba(70,8,8,0.35)', 0.0058);
    lines(l.path, 'rgb(188,40,32)', 0.0034, 0.95);
  }
  for (const l of draw('artifact')) {
    ctx.save();
    ctx.translate(C, C);
    ctx.rotate(l.angle);
    ctx.shadowColor = 'rgba(210,235,255,0.9)';
    ctx.shadowBlur = U(0.035);
    ctx.strokeStyle = 'rgba(214,236,255,0.5)';
    ctx.lineWidth = U(0.035);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, U(0.7), -0.16, 0.16);
    ctx.stroke();
    ctx.restore();
  }

  // illumination fall-off and vignette
  const ang = rng.range(0, 6.28);
  const ig = ctx.createLinearGradient(C - Math.cos(ang) * R, C - Math.sin(ang) * R, C + Math.cos(ang) * R, C + Math.sin(ang) * R);
  ig.addColorStop(0, 'rgba(0,0,0,0)');
  ig.addColorStop(0.45, 'rgba(0,0,0,0)');
  ig.addColorStop(1, `rgba(0,0,0,${im.illum})`);
  ctx.fillStyle = ig;
  ctx.fillRect(0, 0, S, S);
  const vg = ctx.createRadialGradient(C, C, R * 0.5, C, C, R);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  // capture-condition degradations, applied to pixels
  const img = ctx.getImageData(0, 0, S, S);
  if (im.blur > 0.3) gaussianBlur(img, im.blur * (S / 1536));
  const d = img.data;
  const hz = im.haze;
  const br = im.bright;
  const nz = im.noise * 1.7;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], gg = d[i + 1], b = d[i + 2];
    if (r + gg + b > 0) {
      if (hz) { r += (206 - r) * hz; gg += (196 - gg) * hz; b += (186 - b) * hz; }
      const n = (rng() - 0.5) * nz;
      d[i] = (r * br) + n;
      d[i + 1] = (gg * br) + n;
      d[i + 2] = (b * br) + n;
    }
  }
  ctx.putImageData(img, 0, 0);

  if (im.occlusion) { // lid / lash shadow across the top of the field
    const og = ctx.createLinearGradient(0, C - R, 0, C - R + R * 2 * im.occlusion);
    og.addColorStop(0, 'rgba(6,2,2,1)');
    og.addColorStop(0.8, 'rgba(6,2,2,0.96)');
    og.addColorStop(1, 'rgba(6,2,2,0)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(C, C, R, 0, 7);
    ctx.clip();
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
  }
  // crisp circular field edge
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.rect(0, 0, S, S);
  ctx.arc(C, C, R, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  return cv;
}
