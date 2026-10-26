// Custom clinical charts (SVG/DOM, no chart library). One visual language: navy = real data, teal dashed = simulation,
// brick = missed disease (FN), ochre = over-referral (FP). Every chart carries its provenance in the markup.
import { t, fmtPct, fmtNum } from '../i18n.js';
import { h, s } from '../ui.js';
import { confusion, rates, rocPoints } from '../lib/metrics.js';

// 2×2 confusion matrix. Cell area follows the count so a wrong-looking matrix looks wrong.
export function confusionMatrix(cm, prov = 'real') {
  const total = cm.tp + cm.fp + cm.tn + cm.fn || 1;
  const cell = (key, label, n, tone) => {
    const f = Math.sqrt(n / total);
    return h('div', { class: ['cm-cell', `cm-${tone}`], role: 'cell' },
      h('i', { class: 'cm-sq', style: { '--f': String(Math.max(0.04, f)) }, 'aria-hidden': 'true' }),
      h('span', { class: 'cm-n num' }, String(n)), h('span', { class: 'cm-k' }, `${key} · ${label}`), h('span', { class: 'cm-p num' }, fmtPct(n / total, 1)));
  };
  return h('div', { class: ['cm', `cm-${prov}`], role: 'table', 'aria-label': t('lab.cm') },
    h('div', { class: 'cm-corner' }),
    h('div', { class: 'cm-ch', role: 'columnheader' }, t('lab.cm.pred.pos')), h('div', { class: 'cm-ch', role: 'columnheader' }, t('lab.cm.pred.neg')),
    h('div', { class: 'cm-rh', role: 'rowheader' }, t('lab.cm.ref.pos')), cell('TP', t('lab.cm.tp'), cm.tp, 'tp'), cell('FN', t('lab.cm.fn'), cm.fn, 'fn'),
    h('div', { class: 'cm-rh', role: 'rowheader' }, t('lab.cm.ref.neg')), cell('FP', t('lab.cm.fp'), cm.fp, 'fp'), cell('TN', t('lab.cm.tn'), cm.tn, 'tn'));
}

export function rocChart(points, op, { prov = 'real', auc = null, label = '' } = {}) {
  const S = 300; const P = 34;
  const X = (v) => P + v * (S - P - 10); const Y = (v) => S - P - v * (S - P - 10);
  const svg = s('svg', { class: ['chart', 'roc', `chart-${prov}`], viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': `${t('lab.roc')} ${auc !== null ? `AUC ${fmtNum(auc, 3)}` : ''}` });
  for (let i = 0; i <= 4; i++) { const v = i / 4; svg.append(s('path', { class: 'ax-grid', d: `M${X(0)} ${Y(v)}H${X(1)}M${X(v)} ${Y(0)}V${Y(1)}` })); svg.append(s('text', { class: 'ax-t', x: X(0) - 6, y: Y(v) + 3, 'text-anchor': 'end' }, fmtNum(v, 1)), s('text', { class: 'ax-t', x: X(v), y: Y(0) + 14, 'text-anchor': 'middle' }, fmtNum(v, 1))); }
  svg.append(s('path', { class: 'ax-diag', d: `M${X(0)} ${Y(0)}L${X(1)} ${Y(1)}` }));
  svg.append(s('path', { class: 'roc-line', d: points.map((p, i) => `${i ? 'L' : 'M'}${X(p.fpr).toFixed(1)} ${Y(p.tpr).toFixed(1)}`).join('') }));
  if (op) svg.append(s('circle', { class: 'roc-op', cx: X(1 - op.specificity), cy: Y(op.sensitivity), r: 5 }), s('circle', { class: 'roc-op-ring', cx: X(1 - op.specificity), cy: Y(op.sensitivity), r: 10 }));
  svg.append(s('text', { class: 'ax-l', x: X(0.5), y: S - 4, 'text-anchor': 'middle' }, `1 − ${t('lab.spec')}`), s('text', { class: 'ax-l', x: 10, y: Y(0.5), transform: `rotate(-90 10 ${Y(0.5)})`, 'text-anchor': 'middle' }, t('lab.sens')));
  if (prov === 'sim') svg.append(s('text', { class: 'chart-stamp', x: X(0.5), y: Y(0.5), 'text-anchor': 'middle', transform: `rotate(-24 ${X(0.5)} ${Y(0.5)})` }, t('lab.sim.stamp')));
  return h('figure', { class: 'chart-fig' }, svg, h('figcaption', { class: 'fig' }, h('b', null, 'ROC'), label || t('lab.roc'), auc !== null ? h('span', { class: 'num' }, ` · AUC ${fmtNum(auc, 3)}`) : null));
}

export function histChart(rows, threshold, { prov = 'real', label = '' } = {}) {
  const W = 360; const Hh = 150; const B = 20;
  const bins = Array.from({ length: B }, () => [0, 0]);
  rows.forEach((r) => { bins[Math.min(B - 1, Math.floor(r.score * B))][r.reference]++; });
  const max = Math.max(1, ...bins.flat());
  const bw = (W - 20) / B;
  const svg = s('svg', { class: ['chart', 'hist', `chart-${prov}`], viewBox: `0 0 ${W} ${Hh + 26}`, role: 'img', 'aria-label': t('lab.hist') });
  bins.forEach(([neg, pos], i) => {
    const x = 10 + i * bw;
    svg.append(s('rect', { class: 'h-neg', x, y: Hh - (neg / max) * Hh, width: bw - 1, height: (neg / max) * Hh }), s('rect', { class: 'h-pos', x, y: Hh - (pos / max) * Hh, width: bw - 1, height: (pos / max) * Hh }));
  });
  const tx = 10 + threshold * (W - 20);
  svg.append(s('path', { class: 'h-thr', d: `M${tx} 0V${Hh}` }), s('path', { class: 'ax-base', d: `M10 ${Hh}H${W - 10}` }));
  [0, 0.5, 1].forEach((v) => svg.append(s('text', { class: 'ax-t', x: 10 + v * (W - 20), y: Hh + 14, 'text-anchor': v === 0 ? 'start' : v === 1 ? 'end' : 'middle' }, fmtNum(v, 1))));
  if (prov === 'sim') svg.append(s('text', { class: 'chart-stamp', x: W / 2, y: Hh / 2, 'text-anchor': 'middle' }, t('lab.sim.stamp')));
  return h('figure', { class: 'chart-fig' }, svg, h('figcaption', { class: 'fig' }, h('b', null, 'DIST'), label || t('lab.hist'), h('span', { class: 'legend' }, h('i', { class: 'lg-neg' }), t('lab.cm.ref.neg'), h('i', { class: 'lg-pos' }), t('lab.cm.ref.pos'))));
}

// Sensitivity & specificity as functions of the threshold.
export function thresholdCurves(rows, threshold, { prov = 'real' } = {}) {
  const W = 360; const Hh = 160;
  const svg = s('svg', { class: ['chart', 'tcurve', `chart-${prov}`], viewBox: `0 0 ${W} ${Hh + 26}`, role: 'img', 'aria-label': t('lab.tcurve') });
  const pts = Array.from({ length: 101 }, (_, i) => { const th = i / 100; const r = rates(confusion(rows, th)); return [th, r.sensitivity ?? 0, r.specificity ?? 0]; });
  const path = (k) => pts.map((p, i) => `${i ? 'L' : 'M'}${(10 + p[0] * (W - 20)).toFixed(1)} ${(Hh - p[k] * Hh).toFixed(1)}`).join('');
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => svg.append(s('path', { class: 'ax-grid', d: `M10 ${Hh - v * Hh}H${W - 10}` })));
  svg.append(s('path', { class: 'tc-sens', d: path(1) }), s('path', { class: 'tc-spec', d: path(2) }), s('path', { class: 'h-thr', d: `M${10 + threshold * (W - 20)} 0V${Hh}` }));
  [0, 0.5, 1].forEach((v) => svg.append(s('text', { class: 'ax-t', x: 10 + v * (W - 20), y: Hh + 14, 'text-anchor': v === 0 ? 'start' : v === 1 ? 'end' : 'middle' }, fmtNum(v, 1))));
  if (prov === 'sim') svg.append(s('text', { class: 'chart-stamp', x: W / 2, y: Hh / 2, 'text-anchor': 'middle' }, t('lab.sim.stamp')));
  return h('figure', { class: 'chart-fig' }, svg, h('figcaption', { class: 'fig' }, h('b', null, 'THR'), h('span', { class: 'legend' }, h('i', { class: 'lg-sens' }), t('lab.sens'), h('i', { class: 'lg-spec' }), t('lab.spec'))));
}

// Rates with 95 % Wilson intervals drawn as whiskers.
export function rateBars(r, prov = 'real') {
  const row = (key, v, ci, n) => {
    const W = 220;
    const svg = s('svg', { class: ['rate-svg', `chart-${prov}`], viewBox: `0 0 ${W} 22`, 'aria-hidden': 'true' });
    svg.append(s('path', { class: 'ax-grid', d: `M0 11H${W}` }));
    if (v !== null) {
      svg.append(s('rect', { class: 'rb-bar', x: 0, y: 6, width: v * W, height: 10 }));
      if (ci && ci.lo !== null) svg.append(s('path', { class: 'rb-ci', d: `M${ci.lo * W} 11H${ci.hi * W}M${ci.lo * W} 6V16M${ci.hi * W} 6V16` }));
    }
    return h('div', { class: 'rb-row' }, h('span', { class: 'rb-l' }, t(`lab.${key}`)), svg, h('b', { class: 'num rb-v' }, fmtPct(v, 1)), h('span', { class: 'small muted num rb-ci-t' }, ci && ci.lo !== null ? `${fmtPct(ci.lo, 1)}–${fmtPct(ci.hi, 1)}` : '', n !== undefined ? ` · n=${n}` : ''));
  };
  return h('div', { class: ['rates', `rates-${prov}`] },
    row('sens', r.sensitivity, r.sensitivityCI, r.pos), row('spec', r.specificity, r.specificityCI, r.neg),
    row('ppv', r.ppv), row('npv', r.npv), row('acc', r.accuracy), row('bal', r.balancedAccuracy));
}
