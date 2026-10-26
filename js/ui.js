// DOM helpers. Text is always inserted as text nodes; `html:` is reserved for trusted static markup (icons, our own SVG).
const SVG_NS = 'http://www.w3.org/2000/svg';

// Native replaceChildren()/append() turn null/undefined/false into the TEXT "null"/"undefined"/"false".
// Conditional children are used everywhere (`cond ? node : null`), so make the two DOM methods skip empty values.
if (typeof Element !== 'undefined' && !Element.prototype.__dilSafe) {
  const skip = (a) => a.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false);
  const rc = Element.prototype.replaceChildren; const ap = Element.prototype.append;
  Element.prototype.replaceChildren = function replaceChildren(...n) { return rc.apply(this, skip(n)); };
  Element.prototype.append = function append(...n) { return ap.apply(this, skip(n)); };
  Element.prototype.__dilSafe = true;
}

function apply(node, attrs) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
    else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) (p.startsWith('--') ? node.style.setProperty(p, val) : (node.style[p] = val));
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'value') node.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden') { if (v) node.setAttribute(k, ''); node[k] = !!v; }
    else node.setAttribute(k, v === true ? '' : v);
  }
}
function append(node, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    node.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export function h(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  apply(n, attrs);
  append(n, kids);
  return n;
}
export function s(tag, attrs, ...kids) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
    else if (k === 'class') n.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
    else n.setAttribute(k, v);
  }
  append(n, kids);
  return n;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); return n; };

const live = () => document.getElementById('live');
export function announce(msg) {
  const l = live();
  if (!l) return;
  l.textContent = '';
  requestAnimationFrame(() => { l.textContent = msg; });
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const P = {
  arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  arrowL: '<path d="M13 8H3M7 4L3 8l4 4"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  minus: '<path d="M3 8h10"/>',
  fit: '<path d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3"/>',
  one: '<path d="M6.5 5.5 8 4.5V12M6 12h4"/>',
  lock: '<rect x="3.5" y="7" width="9" height="6.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
  unlock: '<rect x="3.5" y="7" width="9" height="6.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 4.8-1"/>',
  check: '<path d="M3 8.5 6.5 12 13 4.5"/>',
  cross: '<path d="M4 4l8 8M12 4l-8 8"/>',
  layers: '<path d="M8 2 14 5.5 8 9 2 5.5 8 2Z"/><path d="M2 8.5 8 12l6-3.5"/>',
  compare: '<rect x="2.5" y="3" width="11" height="10"/><path d="M8 3v10"/><path d="M5.5 6.5 4 8l1.5 1.5M10.5 6.5 12 8l-1.5 1.5"/>',
  eye: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2"/>',
  info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.2V11M8 5v.1"/>',
  download: '<path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10"/>',
  print: '<path d="M4.5 6V2.5h7V6M4.5 11.5h-2V6h11v5.5h-2M4.5 9.5h7v4h-7z"/>',
  chevron: '<path d="M4 6l4 4 4-4"/>',
  globe: '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2.5 4 2.5 6S10 12 8 14C6 12 5.5 10 5.5 8S6 4 8 2Z"/>',
  target: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.5"/><path d="M8 1v3M8 12v3M1 8h3M12 8h3"/>',
  flag: '<path d="M4 14V2.5M4 3h8l-1.5 3L12 9H4"/>',
  ruler: '<path d="M2 11 11 2l3 3-9 9-3-3zM5 8l1.5 1.5M7.5 5.5 9 7"/>',
  grid: '<path d="M2.5 2.5h11v11h-11zM8 2.5v11M2.5 8h11"/>',
  reset: '<path d="M3 8a5 5 0 1 0 1.8-3.8M3 2.5v3h3"/>',
  user: '<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/>',
  external: '<path d="M9 3h4v4M13 3 7.5 8.5M12 9.5V13H3V4h3.5"/>',
};
export const icon = (name, size = 16) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
export const ic = (name, size) => h('span', { class: 'ic', html: icon(name, size) });

export function btn(label, { icon: i, variant = 'solid', on, cls, ...attrs } = {}) {
  return h('button', { type: 'button', class: ['btn', `btn-${variant}`, cls], on: on ? { click: on } : undefined, ...attrs },
    h('span', { class: 'btn-label' }, label), i ? ic(i, 14) : null);
}
export const chip = (text, kind = '') => h('span', { class: ['chip', kind && `chip-${kind}`] }, text);

// Wait for the next paint.
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function download(filename, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvCell(v) {
  let s2 = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s2)) s2 = `'${s2}`; // neutralise spreadsheet-formula injection
  return /[",\n]/.test(s2) ? `"${s2.replace(/"/g, '""')}"` : s2;
}
