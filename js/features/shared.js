// Shared pieces used by the Workbench, Review Queue, CareBridge and Dashboard:
// reveal state, model availability, and the five-way provenance ledger.
import { register, t, fmtDate } from '../i18n.js';
import { h, chip } from '../ui.js';
import { state, update, logEvent, derivedReferral } from '../store.js';
import { getCase, DATASET } from '../data/cases.js';
import { deriveReference } from '../lib/fundus.js';

register({
  en: {
    'prov.model': 'Model-generated prediction', 'prov.reference': 'Expert reference label', 'prov.annotations': 'Reference lesion annotations', 'prov.clinician': 'Clinician interpretation', 'prov.disposition': 'Final clinician-approved disposition',
    'prov.model.v': 'Not implemented — no prediction exists', 'prov.model.src': 'No trained weights, dataset or compute are present. Nothing here is simulated.',
    'prov.reference.src': 'Teaching set DIL-TS v0 · authored from the case’s own lesion list under the ICDR scale · not an independent expert panel',
    'prov.annotations.src': 'Drawn by code from the same lesion list that generated the image · never produced by an AI model',
    'prov.clinician.src': 'Entered by the reviewer in the approval step (simulated clinician role)',
    'prov.disposition.src': 'Recorded only when a reviewer approves; may differ from every other row',
    'prov.hidden': 'Hidden until you lock an interpretation (or enter Study Mode)', 'prov.notrecorded': 'Not recorded', 'prov.pending': 'Pending approval',
    'prov.annotations.v': '{n} annotated findings · {m} types', 'prov.ref.ungradable': 'Ungradable image — no DR grade assigned',
    'prov.ref.v': '{grade} · {ref} · DME {dme}', 'ref.referable': 'Referable', 'ref.nonreferable': 'Non-referable', 'yes': 'yes', 'no': 'no',
    'prov.ledger.title': 'Provenance ledger', 'prov.ledger.sub': 'Five different things that are easy to confuse. Each has its own source.',
    'disp.routine': 'Routine re-screening (12 months)', 'disp.refer': 'Refer to ophthalmology — non-urgent', 'disp.urgent': 'Refer to ophthalmology — urgent', 'disp.recapture': 'Recapture image / in-person examination',
    'disp.short.routine': 'Routine', 'disp.short.refer': 'Refer', 'disp.short.urgent': 'Urgent', 'disp.short.recapture': 'Recapture',
    'decision.refer': 'Refer', 'decision.routine': 'Routine', 'decision.ungradable': 'Ungradable', 'decision.na': '—',
    'model.none.t': 'Research model: not implemented', 'model.none.b': 'There is no trained model, evaluation dataset or compute environment in this prototype, so no prediction is shown anywhere. The Diagnostic Duel is therefore a Human vs Reference exercise.',
    'case.eye.OD': 'Right eye (OD)', 'case.eye.OS': 'Left eye (OS)', 'case.title': 'Case {id}',
    'tier.synthetic': 'Synthetic teaching image',
  },
  ar: {
    'prov.model': 'تنبؤ مولَّد من نموذج', 'prov.reference': 'التسمية المرجعية للخبراء', 'prov.annotations': 'التعليقات المرجعية على الآفات', 'prov.clinician': 'تفسير الطبيب', 'prov.disposition': 'القرار النهائي المعتمد من الطبيب',
    'prov.model.v': 'غير منفَّذ — لا يوجد تنبؤ', 'prov.model.src': 'لا توجد أوزان مدرَّبة ولا مجموعة بيانات ولا قدرة حوسبة. لا شيء هنا محاكى.',
    'prov.reference.src': 'مجموعة التعليم DIL-TS v0 · مؤلَّفة من قائمة آفات الحالة نفسها وفق مقياس ICDR · ليست لجنة خبراء مستقلة',
    'prov.annotations.src': 'مرسومة بالشيفرة من قائمة الآفات نفسها التي ولّدت الصورة · لم ينتجها نموذج ذكاء اصطناعي قط',
    'prov.clinician.src': 'يدخلها المراجع في خطوة الاعتماد (دور طبيب محاكى)',
    'prov.disposition.src': 'تُسجَّل فقط عند اعتماد المراجع؛ وقد تختلف عن كل الصفوف الأخرى',
    'prov.hidden': 'مخفية حتى تقفل تفسيرك (أو تدخل وضع الدراسة)', 'prov.notrecorded': 'غير مسجَّل', 'prov.pending': 'بانتظار الاعتماد',
    'prov.annotations.v': '{n} موجودة موسومة · {m} أنواع', 'prov.ref.ungradable': 'صورة غير قابلة للتدريج — لا تُمنح درجة',
    'prov.ref.v': '{grade} · {ref} · وذمة بقعية: {dme}', 'ref.referable': 'يستوجب الإحالة', 'ref.nonreferable': 'لا يستوجب الإحالة', 'yes': 'نعم', 'no': 'لا',
    'prov.ledger.title': 'سجل المصدر', 'prov.ledger.sub': 'خمسة أشياء مختلفة يسهل الخلط بينها. لكلٍّ منها مصدرها.',
    'disp.routine': 'فحص دوري عادي (١٢ شهرًا)', 'disp.refer': 'إحالة إلى طب العيون — غير عاجلة', 'disp.urgent': 'إحالة إلى طب العيون — عاجلة', 'disp.recapture': 'إعادة التصوير / فحص حضوري',
    'disp.short.routine': 'دوري', 'disp.short.refer': 'إحالة', 'disp.short.urgent': 'عاجل', 'disp.short.recapture': 'إعادة التصوير',
    'decision.refer': 'إحالة', 'decision.routine': 'دوري', 'decision.ungradable': 'غير قابل للتدريج', 'decision.na': '—',
    'model.none.t': 'النموذج البحثي: غير منفَّذ', 'model.none.b': 'لا يوجد في هذا النموذج الأولي نموذج مدرَّب أو مجموعة بيانات تقييم أو بيئة حوسبة، لذلك لا يظهر أي تنبؤ في أي مكان. وعليه فإن مبارزة التشخيص تمرين «إنسان مقابل مرجع».',
    'case.eye.OD': 'العين اليمنى (OD)', 'case.eye.OS': 'العين اليسرى (OS)', 'case.title': 'الحالة {id}',
    'tier.synthetic': 'صورة تعليمية اصطناعية',
  },
});

// ── model availability ───────────────────────────────────────────────────────────────────────────
// The research model slot. It is deliberately empty: `getModel()` returns null, so every consumer renders the
// "not implemented" state. A real adapter (e.g. ONNX Runtime Web + a registered weights file) would be returned here.
export const getModel = () => null;
export const modelAvailable = () => getModel() !== null;

// ── reveal state ─────────────────────────────────────────────────────────────────────────────────
export const hasDuel = (id) => !!state().duels[id];
export const isStudied = (id) => !!state().studied[id];
export const referenceVisible = (id) => hasDuel(id) || isStudied(id);

// Opening reference layers before locking an interpretation makes the case practice-only.
export function enterStudyMode(id) {
  if (hasDuel(id) || isStudied(id)) return;
  update((s) => { s.studied[id] = true; });
  logEvent('study-mode', id, 'reference layers opened before a locked interpretation');
}

export const gradeLabel = (g) => (g === null || g === undefined ? '—' : `${g} · ${t(`gradeName.${g}`)}`);
export const referralOf = (ref) => (!ref.gradable ? 'ungradable' : ref.referable ? 'refer' : 'routine');

// Describe the reference label as text.
export function refSummary(c) {
  const r = c.reference;
  if (!r.gradable) return t('prov.ref.ungradable');
  return t('prov.ref.v', { grade: gradeLabel(r.icdr), ref: t(r.referable ? 'ref.referable' : 'ref.nonreferable'), dme: t(r.dme ? 'yes' : 'no') });
}

// Facts derived from the lesion list (used for explanations and the rule trace).
export function ruleTrace(c) {
  if (!c.reference.gradable) return [];
  const d = deriveReference(c.lesions);
  return { ...d, counts: c.lesions.reduce((a, l) => { a[l.type] = (a[l.type] || 0) + 1; return a; }, {}) };
}

// ── ledger component ─────────────────────────────────────────────────────────────────────────────
export function ledger(caseId, { compact = false } = {}) {
  const c = getCase(caseId);
  const vis = referenceVisible(caseId);
  const rev = state().review[caseId] || {};
  const row = (key, kind, value, src, tone) => h('div', { class: ['pl-row', `pl-${kind}`] },
    h('div', { class: 'pl-k' }, h('span', { class: ['prov', `prov-${kind}`] }, t(`prov.${key}`))),
    h('div', { class: 'pl-v' }, h('span', { class: ['pl-val', tone] }, value), compact ? null : h('span', { class: 'pl-src small muted' }, src)));
  const types = new Set(c.lesions.map((l) => l.type));
  const interp = rev.interp;
  return h('section', { class: 'pl ticked', 'aria-label': t('prov.ledger.title') },
    compact ? null : h('header', { class: 'pl-head' }, h('p', { class: 'kicker' }, t('prov.ledger.title')), h('p', { class: 'small muted' }, t('prov.ledger.sub'))),
    row('model', 'none', t('prov.model.v'), t('prov.model.src'), 'is-none'),
    row('reference', 'real', vis ? refSummary(c) : t('prov.hidden'), t('prov.reference.src'), vis ? '' : 'is-hidden'),
    row('annotations', 'real', vis ? (c.reference.gradable ? t('prov.annotations.v', { n: c.lesions.length, m: types.size }) : '—') : t('prov.hidden'), t('prov.annotations.src'), vis ? '' : 'is-hidden'),
    row('clinician', 'learner', interp ? (interp.gradable ? `${gradeLabel(interp.grade)} · DME ${t(interp.dme ? 'yes' : 'no')} → ${t(`decision.${derivedReferral(interp)}`)}` : t('decision.ungradable')) : t('prov.notrecorded'), t('prov.clinician.src'), interp ? '' : 'is-none'),
    row('disposition', 'learner', rev.approval ? `${t(`disp.${rev.approval.disposition}`)} · ${fmtDate(rev.approval.ts)}` : t('prov.pending'), t('prov.disposition.src'), rev.approval ? 'is-approved' : 'is-none'));
}

export const eyeChip = (c) => chip(c.eye, 'blue');
export { DATASET };
