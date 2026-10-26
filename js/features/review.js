// Supporting: Review Queue — reviewer tools (interpretations, discrepancies, approvals, export).
import { register, t, fmtDate } from '../i18n.js';
import { h, ic, btn, chip, download, csvCell } from '../ui.js';
import { CASE_IDS, getCase } from '../data/cases.js';
import { state, derivedReferral } from '../store.js';
import { ledger, referralOf, referenceVisible, gradeLabel } from './shared.js';
import { navigate } from '../main.js';
import './duel.js';
import './workbench.js'; // register shared strings

export const titleKey = 'nav.review';

register({
  en: {
    'rv.kicker': 'Supporting · Review Queue', 'rv.title': 'Reviewer tools.', 'rv.lede': 'Compare interpretations with the reference, spot discrepancies and see what has been approved. Every row keeps model, reference, annotation, clinician and disposition separate.',
    'rv.f.all': 'All', 'rv.f.disc': 'Discrepancies', 'rv.f.pend': 'Awaiting approval', 'rv.f.appr': 'Approved',
    'rv.col.case': 'Case', 'rv.col.duel': 'Duel reading', 'rv.col.clin': 'Clinician interpretation', 'rv.col.ref': 'Reference', 'rv.col.flag': 'Flags', 'rv.col.disp': 'Disposition',
    'rv.hidden': 'hidden', 'rv.flag.disc': 'Interpretation ≠ reference', 'rv.flag.fn': 'Missed referable', 'rv.flag.ack': 'Discrepancy acknowledged', 'rv.flag.practice': 'Practice', 'rv.flag.none': '—',
    'rv.detail': 'Case detail', 'rv.open': 'Open case', 'rv.pick': 'Select a row to see its provenance ledger.', 'rv.export': 'Export review table (CSV)', 'rv.empty': 'No cases match this filter.',
    'rv.note': 'The reference label is shown only for cases where it has already been revealed to you (a locked Duel or Study Mode).',
  },
  ar: {
    'rv.kicker': 'داعم · قائمة المراجعة', 'rv.title': 'أدوات المراجع.', 'rv.lede': 'قارن التفسيرات بالمرجع، واكتشف الاختلافات، وانظر ما اعتُمد. يُبقي كل صف النموذج والمرجع والتعليقات والطبيب والقرار منفصلة.',
    'rv.f.all': 'الكل', 'rv.f.disc': 'اختلافات', 'rv.f.pend': 'بانتظار الاعتماد', 'rv.f.appr': 'معتمدة',
    'rv.col.case': 'الحالة', 'rv.col.duel': 'قراءة المبارزة', 'rv.col.clin': 'تفسير الطبيب', 'rv.col.ref': 'المرجع', 'rv.col.flag': 'علامات', 'rv.col.disp': 'القرار',
    'rv.hidden': 'مخفي', 'rv.flag.disc': 'التفسير ≠ المرجع', 'rv.flag.fn': 'فُوّتت حالة مستوجبة للإحالة', 'rv.flag.ack': 'أُقرّ بالاختلاف', 'rv.flag.practice': 'تدريب', 'rv.flag.none': '—',
    'rv.detail': 'تفاصيل الحالة', 'rv.open': 'افتح الحالة', 'rv.pick': 'اختر صفًا لرؤية سجل مصدره.', 'rv.export': 'صدّر جدول المراجعة (CSV)', 'rv.empty': 'لا حالات تطابق هذا المرشِّح.',
    'rv.note': 'لا تُعرض التسمية المرجعية إلا للحالات التي كُشفت لك فيها فعلًا (مبارزة مقفلة أو وضع الدراسة).',
  },
});

export function mount(root, params) {
  let filter = 'all';
  let sel = CASE_IDS.includes(params.caseId) ? params.caseId : null;
  const tbody = h('tbody'); const detail = h('aside', { class: 'rv-detail' });
  const info = (id) => {
    const s = state(); const d = s.duels[id]; const r = s.review[id] || {}; const c = getCase(id);
    const vis = referenceVisible(id);
    const clin = r.interp ? derivedReferral(r.interp) : null;
    const refv = vis ? referralOf(c.reference) : null;
    const disc = clin && refv && clin !== refv;
    const fn = vis && c.reference.referable && ((clin && clin === 'routine') || (d && d.category === 'FN'));
    return { d, r, c, vis, clin, refv, disc, fn };
  };
  const match = (id) => { const i = info(id); return filter === 'all' || (filter === 'disc' && (i.disc || i.fn)) || (filter === 'pend' && i.r.interp && !i.r.approval) || (filter === 'appr' && i.r.approval); };
  const drawDetail = () => {
    if (!sel) { detail.replaceChildren(h('p', { class: 'small muted' }, t('rv.pick'))); return; }
    const i = info(sel);
    detail.replaceChildren(h('p', { class: 'kicker' }, t('rv.detail')), h('h2', { class: 'h2' }, t('case.title', { id: sel }), ' ', h('span', { class: 'mono muted' }, i.c.eye)), ledger(sel), h('a', { class: 'btn btn-quiet', href: `#/workbench/${sel}/approval` }, h('span', { class: 'btn-label' }, t('rv.open')), ic('arrow', 14)));
  };
  const draw = () => {
    const ids = CASE_IDS.filter(match);
    tbody.replaceChildren(...(ids.length ? ids.map((id) => {
      const i = info(id);
      const flags = [];
      if (i.disc) flags.push(chip(t('rv.flag.disc'), 'brick'));
      if (i.fn) flags.push(chip(t('rv.flag.fn'), 'brick'));
      if (i.r.approval?.discrepancy) flags.push(chip(t('rv.flag.ack'), 'ochre'));
      if (i.d?.practice) flags.push(chip(t('rv.flag.practice'), 'ochre'));
      const tr = h('tr', { class: ['rv-row', id === sel && 'on'], tabindex: '0', 'aria-selected': String(id === sel), on: { click: () => pick(id), keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(id); } } } },
        h('td', null, h('b', null, id), ' ', h('span', { class: 'mono muted' }, i.c.eye)),
        h('td', { class: 'small' }, i.d ? (i.d.interp.gradable ? `${i.d.interp.grade}${i.d.interp.dme ? '+DME' : ''}` : t('decision.ungradable')) : '—'),
        h('td', { class: 'small' }, i.r.interp ? (i.r.interp.gradable ? `${i.r.interp.grade}${i.r.interp.dme ? '+DME' : ''}` : t('decision.ungradable')) : '—'),
        h('td', { class: 'small' }, i.vis ? (i.c.reference.gradable ? `${i.c.reference.icdr}${i.c.reference.dme ? '+DME' : ''}` : t('decision.ungradable')) : t('rv.hidden')),
        h('td', null, h('div', { class: 'flags' }, flags.length ? flags : t('rv.flag.none'))),
        h('td', { class: 'small' }, i.r.approval ? t(`disp.short.${i.r.approval.disposition}`) : '—'));
      return tr;
    }) : [h('tr', null, h('td', { colspan: 6, class: 'muted' }, t('rv.empty')))]));
  };
  function pick(id) { sel = id; draw(); drawDetail(); }
  const filters = h('div', { class: 'seg', role: 'radiogroup' }, ['all', 'disc', 'pend', 'appr'].map((k) => h('label', null, h('input', { type: 'radio', name: 'rf', value: k, checked: k === 'all', on: { change: () => { filter = k; draw(); } } }), h('span', null, t(`rv.f.${k}`)))));
  const exportCsv = () => {
    const head = ['case', 'eye', 'duel_reading', 'clinician_interpretation', 'reference_visible', 'reference', 'disposition', 'discrepancy'];
    const lines = [head.join(',')];
    CASE_IDS.forEach((id) => { const i = info(id); lines.push([id, i.c.eye, i.d ? (i.d.interp.gradable ? i.d.interp.grade : 'ungradable') : '', i.r.interp ? (i.r.interp.gradable ? i.r.interp.grade : 'ungradable') : '', i.vis, i.vis ? (i.c.reference.gradable ? i.c.reference.icdr : 'ungradable') : '', i.r.approval?.disposition || '', !!(i.disc || i.fn)].map(csvCell).join(',')); });
    download('review-table.csv', lines.join('\n'), 'text/csv');
  };
  root.append(h('div', { class: 'page' },
    h('header', { class: 'page-head' }, h('p', { class: 'kicker' }, t('rv.kicker')), h('h1', { class: 'h1' }, t('rv.title')), h('p', { class: 'lede' }, t('rv.lede'))),
    h('div', { class: 'rv-bar' }, filters, btn(t('rv.export'), { icon: 'download', variant: 'quiet', cls: 'btn-sm', on: exportCsv })),
    h('div', { class: 'rv-grid' }, h('div', { class: 'table-wrap' }, h('table', { class: 'ledger rv-table' }, h('thead', null, h('tr', null, ['case', 'duel', 'clin', 'ref', 'flag', 'disp'].map((k) => h('th', null, t(`rv.col.${k}`))))), tbody), h('p', { class: 'small muted' }, t('rv.note'))), detail)));
  draw(); drawDetail();
}
