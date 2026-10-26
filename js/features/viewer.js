// EvidenceLens engine: smooth zoom / pan, layered reference annotations, opacity, draggable before/after comparison.
// The annotation layers are vector overlays drawn from the case's lesion list (authored reference, never model output).
import { h, s, ic, reducedMotion } from '../ui.js';
import { t } from '../i18n.js';
import { LESION_TYPES, LESION_ORDER } from '../data/references.js';
import { DD } from '../lib/fundus.js';
import { greenEnhance } from '../lib/imageops.js';

const W = 1000; // world size in CSS px at scale 1
const HALF = 1 / 0.96; // image spans ±HALF field radii (see fundus-paint: field radius = 0.96 of half-image)
const U = W / (HALF * 2); // CSS px per field-radius unit in world space
const K_MAX = 12;

export class Viewer {
  constructor(host, { lesions = [], plan, annotations = true, onSelect, onView, label = '' } = {}) {
    this.host = host;
    this.lesions = lesions;
    this.plan = plan;
    this.onSelect = onSelect;
    this.onView = onView;
    this.annotations = annotations;
    this.v = { k: 1, tx: 0, ty: 0 };
    this.target = { k: 1, tx: 0, ty: 0 };
    this.fitK = 1;
    this.pointers = new Map();
    this.compare = { mode: 'off', frac: 0.5 };
    this.visible = new Set(['anatomy']);
    this.opacity = 1;
    this.selected = null;
    this.raf = 0;
    this.reduced = reducedMotion();
    this.enhanced = null;

    this.base = h('canvas', { class: 'lens-base', width: 8, height: 8 });
    this.after = h('canvas', { class: 'lens-after', width: 8, height: 8, hidden: true });
    this.overlay = this.buildOverlay();
    this.world = h('div', { class: 'lens-world' }, this.base, this.after, this.overlay);
    this.divider = h('div', { class: 'lens-divider', role: 'slider', tabindex: '0', 'aria-label': t('lens.divider'), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '50', hidden: true },
      h('span', { class: 'ld-grip', html: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7 7 3.5 11 7 15M15 7l3.5 4L15 15"/></svg>' }));
    this.tag = h('div', { class: 'lens-tag', hidden: true });
    this.hud = h('div', { class: 'lens-hud mono', 'aria-hidden': 'true' }, h('span', { class: 'hud-zoom' }, '—'), h('span', { class: 'hud-xy' }, ''));
    this.scale = h('div', { class: 'lens-scale mono', 'aria-hidden': 'true' }, h('i'), h('span', null, '1 DD'));
    this.root = h('div', { class: 'lens', tabindex: '0', role: 'application', 'aria-label': label || t('lens.aria'), dir: 'ltr' }, this.world, this.divider, this.tag, this.hud, this.scale);
    host.append(this.root);

    this.bind();
    this.resizeObs = new ResizeObserver(() => this.layout());
    this.resizeObs.observe(this.root);
    requestAnimationFrame(() => this.layout(true));
  }

  // ── image ──────────────────────────────────────────────────────────────────────────────
  setImage(canvas) {
    this.base.width = canvas.width; this.base.height = canvas.height;
    this.base.getContext('2d').drawImage(canvas, 0, 0);
    this.source = canvas;
    this.enhanced = null;
    if (this.compare.mode === 'enhanced') this.applyCompare();
  }

  // ── overlay ────────────────────────────────────────────────────────────────────────────
  buildOverlay() {
    const svg = s('svg', { class: 'lens-overlay', viewBox: `${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`, width: W, height: W, 'aria-label': t('lens.overlay') });
    const groups = {};
    const mkGroup = (key) => { groups[key] = s('g', { class: 'layer', 'data-layer': key, 'data-on': key === 'anatomy' ? 'true' : 'false' }); svg.append(groups[key]); return groups[key]; };
    // anatomy (orientation geometry, not a finding)
    const an = mkGroup('anatomy');
    if (this.plan) {
      const { disc, macula } = this.plan;
      an.append(
        s('ellipse', { class: 'an-line', cx: disc.x, cy: disc.y, rx: disc.rx, ry: disc.ry }),
        s('circle', { class: 'an-line an-dash', cx: macula.x, cy: macula.y, r: DD }),
        s('path', { class: 'an-line', d: `M${macula.x - 0.025} ${macula.y}H${macula.x + 0.025}M${macula.x} ${macula.y - 0.025}V${macula.y + 0.025}` }),
        s('path', { class: 'an-line an-faint', d: `M-1 ${macula.y}H1M${macula.x} -1V1` }),
        s('text', { class: 'an-text', x: macula.x + DD * 0.74, y: macula.y - DD * 0.74 }, '1 DD'),
        s('text', { class: 'an-text', x: macula.x + 0.03, y: macula.y + 0.045 }, t('lens.macula')),
        s('text', { class: 'an-text', x: disc.x - (this.plan.s > 0 ? -disc.rx - 0.02 : disc.rx + 0.02), y: disc.y + disc.ry + 0.05, 'text-anchor': this.plan.s > 0 ? 'start' : 'end' }, t('lens.disc')),
      );
    }
    if (this.annotations) {
      for (const type of LESION_ORDER) {
        const items = this.lesions.filter((l) => l.type === type);
        if (!items.length) continue;
        const g = mkGroup(type);
        const col = LESION_TYPES[type].color;
        items.forEach((l, i) => {
          const el = s('g', { class: 'les', 'data-id': l.id, tabindex: '-1', role: 'button', 'aria-label': `${t(`les.${type}`)} ${l.id}`, style: `--c:${col};--d:${Math.min(i * 22, 700)}ms` });
          el.append(...this.shapeFor(l, col));
          el.addEventListener('pointerdown', (e) => e.stopPropagation());
          el.addEventListener('click', (e) => { e.stopPropagation(); this.select(l.id); });
          el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.select(l.id); } });
          g.append(el);
        });
      }
    }
    this.groups = groups;
    this.selRing = s('g', { class: 'sel-ring', hidden: true });
    this.selRing.append(s('circle', { class: 'sr-a', r: 0.05 }), s('circle', { class: 'sr-b', r: 0.05 }));
    svg.append(this.selRing);
    return svg;
  }

  shapeFor(l) {
    const col = LESION_TYPES[l.type].color;
    const out = [];
    if (l.path) {
      const paths = Array.isArray(l.path[0]) ? l.path : [l.path];
      paths.forEach((pts) => out.push(s('polyline', { class: 'les-path', points: pts.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(' '), stroke: col })));
      out.push(s('circle', { class: 'les-ring les-dot', cx: l.x, cy: l.y, r: l.r + 0.012, stroke: col }));
    } else if (l.type === 'preretinal-hemorrhage') {
      out.push(s('ellipse', { class: 'les-ring', cx: l.x, cy: l.y + 0.01, rx: l.r + 0.014, ry: (l.ry || l.r) + 0.02, stroke: col }));
    } else if (l.type === 'artifact') {
      out.push(s('circle', { class: 'les-ring les-dot', cx: Math.cos(l.angle) * 0.7, cy: Math.sin(l.angle) * 0.7, r: l.r, stroke: col }));
    } else {
      const r = Math.max(l.r * 1.8, 0.013);
      out.push(s('circle', { class: 'les-ring', cx: l.x, cy: l.y, r, stroke: col }));
      if (l.type === 'ma') out.push(s('path', { class: 'les-tick', d: `M${l.x - r - 0.012} ${l.y}h0.008M${l.x + r + 0.004} ${l.y}h0.008M${l.x} ${l.y - r - 0.012}v0.008M${l.x} ${l.y + r + 0.004}v0.008`, stroke: col }));
    }
    out.push(s('circle', { class: 'les-hit', cx: l.x, cy: l.y, r: Math.max(l.r * 2.2, 0.026) })); // generous pointer target
    return out;
  }

  setLayers(visible, opacity) {
    if (visible) {
      this.visible = new Set(visible);
      Object.entries(this.groups).forEach(([k, g]) => g.setAttribute('data-on', String(this.visible.has(k))));
    }
    if (opacity !== undefined) { this.opacity = opacity; this.overlay.style.setProperty('--ov', String(opacity)); }
    this.root.querySelectorAll('.les').forEach((el) => { el.tabIndex = this.visible.has(el.parentNode.dataset.layer) ? 0 : -1; });
  }

  select(id) {
    this.selected = id;
    this.root.querySelectorAll('.les.sel').forEach((n) => n.classList.remove('sel'));
    const l = this.lesions.find((x) => x.id === id);
    if (!l) { this.selRing.setAttribute('hidden', ''); this.tag.hidden = true; this.onSelect?.(null); return; }
    if (!this.visible.has(l.type)) this.setLayers([...this.visible, l.type]);
    const node = this.root.querySelector(`.les[data-id="${id}"]`);
    node?.classList.add('sel');
    const cx = l.type === 'artifact' ? Math.cos(l.angle) * 0.7 : l.x; const cy = l.type === 'artifact' ? Math.sin(l.angle) * 0.7 : l.y;
    this.selRing.removeAttribute('hidden');
    this.selRing.querySelectorAll('circle').forEach((c) => { c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', Math.max(l.r * 2.8, 0.045)); });
    this.focusOn(cx, cy, Math.max(this.v.k, this.fitK * 3));
    this.onSelect?.(l);
    this.updateTag();
  }

  // ── compare ─────────────────────────────────────────────────────────────────────────────
  setCompare(mode) {
    this.compare.mode = mode;
    this.applyCompare();
  }
  applyCompare() {
    const { mode, frac } = this.compare;
    this.divider.hidden = mode === 'off';
    this.after.hidden = mode !== 'enhanced';
    this.overlay.style.clipPath = mode === 'annot' ? `inset(0 0 0 ${frac * 100}%)` : '';
    this.root.dataset.compare = mode;
    if (mode === 'enhanced' && this.source) {
      if (!this.enhanced) {
        const c = this.source;
        const img = c.getContext('2d').getImageData(0, 0, c.width, c.height);
        const out = greenEnhance(img);
        this.after.width = c.width; this.after.height = c.height;
        this.after.getContext('2d').putImageData(new ImageData(out.data, out.width, out.height), 0, 0);
        this.enhanced = true;
      }
      this.after.style.clipPath = `inset(0 0 0 ${frac * 100}%)`;
    }
    this.positionDivider();
  }
  setFrac(f) {
    this.compare.frac = Math.min(1, Math.max(0, f));
    const pct = this.compare.frac * 100;
    if (this.compare.mode === 'annot') this.overlay.style.clipPath = `inset(0 0 0 ${pct}%)`;
    if (this.compare.mode === 'enhanced') this.after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    this.divider.setAttribute('aria-valuenow', String(Math.round(pct)));
    this.positionDivider();
  }
  positionDivider() {
    const x = this.v.tx + this.v.k * W * this.compare.frac;
    this.divider.style.transform = `translateX(${x}px)`;
  }

  // ── view transform ──────────────────────────────────────────────────────────────────────
  layout(first) {
    const r = this.root.getBoundingClientRect();
    if (!r.width) return;
    this.rect = r;
    const k0 = Math.min(r.width, r.height) / W * 0.98;
    const wasFit = Math.abs(this.v.k - this.fitK) < 1e-3 || first;
    this.fitK = k0;
    if (wasFit) this.fit(true);
    else this.apply();
  }
  fit(instant) {
    const r = this.rect || this.root.getBoundingClientRect();
    const k = this.fitK;
    this.setTarget({ k, tx: (r.width - W * k) / 2, ty: (r.height - W * k) / 2 }, instant);
  }
  actual() { this.zoomAt(this.rect.width / 2, this.rect.height / 2, Math.max(this.fitK * 1.0, 1536 / W), false); }
  setTarget(t2, instant) {
    this.target = this.clampView(t2);
    if (instant || this.reduced) { this.v = { ...this.target }; this.apply(); } else this.kick();
  }
  clampView({ k, tx, ty }) {
    const r = this.rect;
    k = Math.min(this.fitK * K_MAX, Math.max(this.fitK * 0.8, k));
    const pad = 0.25 * W * k;
    tx = Math.min(r.width - pad, Math.max(pad - W * k, tx));
    ty = Math.min(r.height - pad, Math.max(pad - W * k, ty));
    return { k, tx, ty };
  }
  zoomAt(px, py, k, instant) {
    const cur = this.target;
    const kk = Math.min(this.fitK * K_MAX, Math.max(this.fitK * 0.8, k));
    const wx = (px - cur.tx) / cur.k; const wy = (py - cur.ty) / cur.k;
    this.setTarget({ k: kk, tx: px - wx * kk, ty: py - wy * kk }, instant);
  }
  zoomBy(f) { const r = this.rect; this.zoomAt(r.width / 2, r.height / 2, this.target.k * f); }
  panBy(dx, dy) { this.setTarget({ ...this.target, tx: this.target.tx + dx, ty: this.target.ty + dy }); }
  focusOn(ux, uy, k) {
    const r = this.rect; const wx = (ux + HALF) * U; const wy = (uy + HALF) * U;
    this.setTarget({ k, tx: r.width / 2 - wx * k, ty: r.height / 2 - wy * k });
  }
  kick() { if (!this.raf) this.raf = requestAnimationFrame(() => this.tick()); }
  tick() {
    this.raf = 0;
    const a = 0.22; const T = this.target; const V = this.v;
    V.k += (T.k - V.k) * a; V.tx += (T.tx - V.tx) * a; V.ty += (T.ty - V.ty) * a;
    const done = Math.abs(T.k - V.k) < T.k * 0.0008 && Math.abs(T.tx - V.tx) < 0.3 && Math.abs(T.ty - V.ty) < 0.3;
    if (done) this.v = { ...T };
    this.apply();
    if (!done) this.kick();
  }
  apply() {
    const { k, tx, ty } = this.v;
    this.world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${k})`;
    this.overlay.style.setProperty('--ts', (12.5 / (k * U)).toFixed(5)); // constant on-screen label size
    this.overlay.style.setProperty('--ls', (1 / k).toFixed(4));
    this.hud.firstChild.textContent = `${Math.round((k / this.fitK) * 100)}%`;
    this.scale.firstChild.style.width = `${DD * U * k}px`;
    this.positionDivider();
    this.updateTag();
    this.onView?.(this.v, this.fitK);
  }
  updateTag() {
    if (!this.selected) return;
    const l = this.lesions.find((x) => x.id === this.selected);
    if (!l) return;
    const cx = l.type === 'artifact' ? Math.cos(l.angle) * 0.7 : l.x; const cy = l.type === 'artifact' ? Math.sin(l.angle) * 0.7 : l.y;
    const x = this.v.tx + (cx + HALF) * U * this.v.k; const y = this.v.ty + (cy + HALF) * U * this.v.k;
    this.tag.hidden = false;
    this.tag.style.transform = `translate(${x + 18}px, ${y - 34}px)`;
    this.tag.textContent = `${l.id} · ${t(`les.${l.type}`)}`;
  }

  // ── input ───────────────────────────────────────────────────────────────────────────────
  bind() {
    const root = this.root;
    root.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = root.getBoundingClientRect();
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
      this.zoomAt(e.clientX - r.left, e.clientY - r.top, this.target.k * f);
    }, { passive: false });
    root.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.lens-divider')) return;
      root.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragMoved = false;
      root.classList.add('grabbing');
    });
    root.addEventListener('pointermove', (e) => {
      const r = root.getBoundingClientRect();
      const wx = ((e.clientX - r.left - this.v.tx) / this.v.k) / U - HALF; const wy = ((e.clientY - r.top - this.v.ty) / this.v.k) / U - HALF;
      if (this.plan && Math.hypot(wx, wy) < 1) this.hud.lastChild.textContent = `Δ ${(((wx - this.plan.macula.x) / DD)).toFixed(2)}, ${(((wy - this.plan.macula.y) / DD)).toFixed(2)} DD`;
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      if (this.pointers.size === 1) {
        const dx = e.clientX - p.x; const dy = e.clientY - p.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) this.dragMoved = true;
        this.target = this.clampView({ ...this.target, tx: this.target.tx + dx, ty: this.target.ty + dy });
        this.v = { ...this.target }; this.apply();
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const before = Math.hypot(a.x - b.x, a.y - b.y);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a2, b2] = [...this.pointers.values()];
        const after = Math.hypot(a2.x - b2.x, a2.y - b2.y);
        if (before > 0) this.zoomAt((a2.x + b2.x) / 2 - r.left, (a2.y + b2.y) / 2 - r.top, this.target.k * (after / before), true);
        return;
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const up = (e) => { this.pointers.delete(e.pointerId); if (!this.pointers.size) root.classList.remove('grabbing'); };
    root.addEventListener('pointerup', (e) => { if (!this.dragMoved && this.selected && !e.target.closest('.les')) this.select(null); up(e); });
    root.addEventListener('pointercancel', up);
    root.addEventListener('dblclick', (e) => { if (e.target.closest('.les')) return; const r = root.getBoundingClientRect(); this.zoomAt(e.clientX - r.left, e.clientY - r.top, this.target.k * 2.2); });
    root.addEventListener('keydown', (e) => {
      if (e.target.closest('.lens-divider')) return;
      const step = 60;
      const map = { '+': () => this.zoomBy(1.3), '=': () => this.zoomBy(1.3), '-': () => this.zoomBy(1 / 1.3), '_': () => this.zoomBy(1 / 1.3), '0': () => this.fit(), f: () => this.fit(), Home: () => this.fit(), ArrowLeft: () => this.panBy(step, 0), ArrowRight: () => this.panBy(-step, 0), ArrowUp: () => this.panBy(0, step), ArrowDown: () => this.panBy(0, -step), Escape: () => this.select(null) };
      if (map[e.key] && e.target === root) { e.preventDefault(); map[e.key](); }
    });
    // divider
    const moveDivider = (clientX) => { const r = root.getBoundingClientRect(); this.setFrac((clientX - r.left - this.v.tx) / (this.v.k * W)); };
    this.divider.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.divider.setPointerCapture(e.pointerId); this.dividerDrag = true; });
    this.divider.addEventListener('pointermove', (e) => { if (this.dividerDrag) moveDivider(e.clientX); });
    this.divider.addEventListener('pointerup', () => { this.dividerDrag = false; });
    this.divider.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: -0.02, ArrowRight: 0.02, Home: -1, End: 1 }[e.key];
      if (d !== undefined) { e.preventDefault(); this.setFrac(Math.abs(d) === 1 ? (d < 0 ? 0 : 1) : this.compare.frac + d); }
    });
  }

  destroy() { cancelAnimationFrame(this.raf); this.resizeObs.disconnect(); this.root.remove(); }
}

export const lensToolbar = (viewer, { compareModes = true, onCompare } = {}) => {
  const b = (iconName, label, fn, extra) => h('button', { type: 'button', class: 'icon-btn', title: label, 'aria-label': label, on: { click: fn }, ...extra, html: undefined }, ic(iconName, 16));
  return h('div', { class: 'lens-tools', role: 'toolbar', 'aria-label': t('lens.tools') },
    b('plus', t('lens.zoomIn'), () => viewer.zoomBy(1.4)), b('minus', t('lens.zoomOut'), () => viewer.zoomBy(1 / 1.4)), b('fit', t('lens.fit'), () => viewer.fit()), b('one', t('lens.actual'), () => viewer.actual()));
};
