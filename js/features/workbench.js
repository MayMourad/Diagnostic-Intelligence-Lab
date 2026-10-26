// B — Diagnostic Workbench: case selection → EvidenceLens → Diagnostic Duel → quality & uncertainty → clinician approval.
import { register, t, fmtDate } from '../i18n.js';
import { h, ic, btn, chip, $ } from '../ui.js';
import { CASE_IDS, getCase } from '../data/cases.js';
import { analysis, thumbnail } from '../render.js';
import { state, update, logEvent, derivedReferral } from '../store.js';
import { navigate } from '../main.js';
import { lensStage } from './lens.js';
import { duelStage } from './duel.js';
import { reliabilityStage } from './reliability.js';
import { ledger, referenceVisible, referralOf, gradeLabel, hasDuel, isStudied } from './shared.js';
import { scanIdentifiers } from '../lib/privacy.js';

export const titleKey = 'nav.workbench';

register({
  en: {
    'wb.kicker': 'B — Diagnostic Workbench',
    'wb.stage.cases': 'Case selection', 'wb.stage.lens': 'EvidenceLens', 'wb.stage.duel': 'Diagnostic Duel', 'wb.stage.quality': 'Quality & uncertainty', 'wb.stage.approval': 'Clinician approval',
    'wb.stage.cases.s': 'Pick a case. Labels stay hidden.', 'wb.stage.lens.s': 'Zoom, layers, compare', 'wb.stage.duel.s': 'Read, lock, reveal', 'wb.stage.quality.s': 'Measured quality, stress test', 'wb.stage.approval.s': 'Interpret, approve, refer',
    'wb.stages': 'Workbench stages', 'wb.case': 'Case', 'wb.prev': 'Previous case', 'wb.next': 'Next case', 'wb.switch': 'Switch case',
    'cs.title': 'Sixteen cases. No labels.', 'cs.lede': 'Each case is a synthetic retinal illustration. Choose one and read it before anything about it is revealed. Reference labels and annotations unlock only after you lock an interpretation.',
    'cs.filter.all': 'All', 'cs.filter.new': 'Not attempted', 'cs.filter.done': 'Attempted', 'cs.filter.err': 'My errors',
    'cs.start': 'Start the next unattempted case', 'cs.none': 'No cases match this filter.',
    'cs.unseen': 'Unseen', 'cs.locked': 'Locked', 'cs.practice': 'Practice', 'cs.approved': 'Approved', 'cs.q': 'Measured quality',
    'cs.note': 'Thumbnails show the measured image quality (from pixels) — not a diagnosis.',
    'ap.title': 'Clinician approval', 'ap.lede': 'You are playing the clinician. Record an interpretation, choose a disposition and approve it. Nothing here is a medical record; the case is synthetic.',
    'ap.reviewer': 'Reviewer (pseudonym only)', 'ap.reviewer.h': 'Use a pseudonym or role — never a real patient or staff identity.',
    'ap.interp': 'Clinician interpretation', 'ap.copy': 'Copy from my locked Duel reading', 'ap.notes': 'Interpretation notes (optional)', 'ap.notes.h': 'Clinical reasoning only. Identifiers are blocked.',
    'ap.disp': 'Disposition', 'ap.rationale': 'Rationale', 'ap.rationale.h': 'Why this disposition? Identifiers are blocked.',
    'ap.ack.ref': 'I acknowledge that my interpretation differs from the reference label.', 'ap.ack.disp': 'I acknowledge that this disposition differs from my own interpretation.',
    'ap.approve': 'Approve disposition', 'ap.withdraw': 'Withdraw approval', 'ap.approved': 'Disposition approved', 'ap.draft': 'Draft from the stress test: recapture / in-person.',
    'ap.need.interp': 'Record an interpretation first.', 'ap.need.disp': 'Choose a disposition.', 'ap.need.ack': 'Tick the acknowledgement(s) to continue.', 'ap.privacy': 'Possible identifier detected ({kinds}). Remove it before approving.',
    'ap.referral': 'Create a referral letter in CareBridge', 'ap.note.model': 'There is no model suggestion to accept or override. The disposition is yours.',
    'ap.guide': 'Illustrative ICDR-linked management — not clinical guidance; follow your local pathway: none/mild → re-screen in about 12 months; moderate → re-screen sooner or refer; severe/proliferative or macular oedema → refer promptly.',
    'ap.saved.interp': 'Interpretation saved',
    'ap.hold': 'The reference label for this case is still hidden. That is fine: a clinician decides without it.',
  },
  ar: {
    'wb.kicker': 'ب — منصة العمل التشخيصية',
    'wb.stage.cases': 'اختيار الحالة', 'wb.stage.lens': 'عدسة الأدلة', 'wb.stage.duel': 'مبارزة التشخيص', 'wb.stage.quality': 'الجودة وعدم اليقين', 'wb.stage.approval': 'اعتماد الطبيب',
    'wb.stage.cases.s': 'اختر حالة. تبقى التسميات مخفية.', 'wb.stage.lens.s': 'تكبير وطبقات ومقارنة', 'wb.stage.duel.s': 'اقرأ، اقفل، اكشف', 'wb.stage.quality.s': 'جودة مقاسة واختبار تحمّل', 'wb.stage.approval.s': 'فسّر، اعتمد، أحِل',
    'wb.stages': 'مراحل منصة العمل', 'wb.case': 'الحالة', 'wb.prev': 'الحالة السابقة', 'wb.next': 'الحالة التالية', 'wb.switch': 'تبديل الحالة',
    'cs.title': 'ست عشرة حالة. بلا تسميات.', 'cs.lede': 'كل حالة رسمة شبكية اصطناعية. اختر واحدة واقرأها قبل كشف أي شيء عنها. لا تُفتح التسميات المرجعية والتعليقات إلا بعد قفل تفسيرك.',
    'cs.filter.all': 'الكل', 'cs.filter.new': 'لم تُحاوَل', 'cs.filter.done': 'حوولت', 'cs.filter.err': 'أخطائي',
    'cs.start': 'ابدأ بأول حالة لم تُحاوَل', 'cs.none': 'لا حالات تطابق هذا المرشِّح.',
    'cs.unseen': 'غير مرئية', 'cs.locked': 'مقفلة', 'cs.practice': 'تدريب', 'cs.approved': 'معتمدة', 'cs.q': 'الجودة المقاسة',
    'cs.note': 'تعرض المصغّرات جودة الصورة المقاسة (من البكسلات) — وليس تشخيصًا.',
    'ap.title': 'اعتماد الطبيب', 'ap.lede': 'أنت تؤدي دور الطبيب. سجّل تفسيرًا، واختر قرارًا، واعتمده. لا شيء هنا سجل طبي؛ والحالة اصطناعية.',
    'ap.reviewer': 'المراجع (اسم مستعار فقط)', 'ap.reviewer.h': 'استخدم اسمًا مستعارًا أو صفة — لا هوية مريض أو موظف حقيقية أبدًا.',
    'ap.interp': 'تفسير الطبيب', 'ap.copy': 'انسخ من قراءتي المقفلة في المبارزة', 'ap.notes': 'ملاحظات التفسير (اختياري)', 'ap.notes.h': 'استدلال سريري فقط. تُمنع المعرّفات.',
    'ap.disp': 'القرار', 'ap.rationale': 'المبرر', 'ap.rationale.h': 'لماذا هذا القرار؟ تُمنع المعرّفات.',
    'ap.ack.ref': 'أقرّ بأن تفسيري يختلف عن التسمية المرجعية.', 'ap.ack.disp': 'أقرّ بأن هذا القرار يختلف عن تفسيري.',
    'ap.approve': 'اعتمد القرار', 'ap.withdraw': 'سحب الاعتماد', 'ap.approved': 'تم اعتماد القرار', 'ap.draft': 'مسوّدة من اختبار التحمّل: إعادة التصوير / فحص حضوري.',
    'ap.need.interp': 'سجّل تفسيرًا أولًا.', 'ap.need.disp': 'اختر قرارًا.', 'ap.need.ack': 'علّم الإقرار (الإقرارات) للمتابعة.', 'ap.privacy': 'يُحتمل وجود معرّف ({kinds}). أزله قبل الاعتماد.',
    'ap.referral': 'أنشئ خطاب إحالة في جسر الرعاية', 'ap.note.model': 'لا يوجد اقتراح نموذج لقبوله أو تجاوزه. القرار قرارك.',
    'ap.guide': 'إدارة توضيحية مرتبطة بـ ICDR — وليست إرشادًا سريريًا؛ اتبع مسارك المحلي: لا اعتلال/خفيف ← فحص بعد نحو ١٢ شهرًا؛ متوسط ← فحص أبكر أو إحالة؛ شديد/تكاثري أو وذمة بقعية ← إحالة عاجلة.',
    'ap.saved.interp': 'تم حفظ التفسير',
    'ap.hold': 'التسمية المرجعية لهذه الحالة ما زالت مخفية. لا بأس: الطبيب يقرر بدونها.',
  },
});

const STAGES = ['cases', 'lens', 'duel', 'quality', 'approval'];
const DISPS = ['routine', 'refer', 'urgent', 'recapture'];

export function mount(root, params) {
  const caseId = CASE_IDS.includes(params.caseId) ? params.caseId : undefined;
  const stage = caseId ? (STAGES.includes(params.stage) && params.stage !== 'cases' ? params.stage : 'lens') : 'cases';
  const body = h('section', { class: 'wb-body', id: 'wb-body' });
  let child = null;
  const go = (id, st) => navigate(id ? `/workbench/${id}/${st}` : '/workbench');

  const stageNav = h('nav', { class: 'wb-stages', 'aria-label': t('wb.stages') }, STAGES.map((k, i) => {
    const disabled = k !== 'cases' && !caseId;
    return h('a', { href: disabled ? null : (k === 'cases' ? '#/workbench' : `#/workbench/${caseId}/${k}`), 'aria-current': k === stage ? 'step' : null, 'aria-disabled': disabled ? 'true' : null, class: ['ws', disabled && 'off'] },
      h('span', { class: 'ws-n' }, `0${i + 1}`), h('span', { class: 'ws-t' }, h('b', null, t(`wb.stage.${k}`)), h('small', null, t(`wb.stage.${k}.s`))));
  }));

  const stateChip = (id) => (hasDuel(id) ? chip(t('cs.locked'), 'teal') : isStudied(id) ? chip(t('cs.practice'), 'ochre') : chip(t('cs.unseen')));
  const idx = caseId ? CASE_IDS.indexOf(caseId) : -1;
  const switcher = caseId ? h('div', { class: 'wb-case' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('wb.prev'), title: t('wb.prev'), on: { click: () => go(CASE_IDS[(idx + CASE_IDS.length - 1) % CASE_IDS.length], stage) } }, h('span', { html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10 3 5 8l5 5"/></svg>' })),
    h('label', { class: 'wb-sel' }, h('span', { class: 'sr-only' }, t('wb.switch')), h('select', { on: { change: (e) => go(e.target.value, stage) } }, CASE_IDS.map((id) => h('option', { value: id, selected: id === caseId }, `${t('case.title', { id })} · ${getCase(id).eye}`)))),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('wb.next'), title: t('wb.next'), on: { click: () => go(CASE_IDS[(idx + 1) % CASE_IDS.length], stage) } }, h('span', { html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="m6 3 5 5-5 5"/></svg>' })),
    h('span', { class: 'wb-chip' }, stateChip(caseId))) : null;

  const head = h('header', { class: 'wb-head' }, h('div', null, h('p', { class: 'kicker' }, t('wb.kicker')), h('h1', { class: 'h1 wb-h' }, caseId ? t(`wb.stage.${stage}`) : t('cs.title'))), switcher);
  root.append(h('div', { class: 'wb' }, head, stageNav, body));

  const nav = (st) => go(caseId, st);
  const rerender = (opts = {}) => { child?.(); child = null; body.replaceChildren(); const wc = $('.wb-chip', root); if (wc && caseId) wc.replaceChildren(stateChip(caseId)); draw(opts); };

  function draw(opts = {}) {
    if (stage === 'cases') child = casesStage(body);
    else if (stage === 'lens') child = lensStage(body, caseId, { onNav: nav, rerender });
    else if (stage === 'duel') {
      const d = duelStage(body, caseId, { onNav: nav, onCase: (id, st) => go(id, st), rerender });
      d.start(!!opts.animate);
      child = () => d.destroy();
    } else if (stage === 'quality') child = reliabilityStage(body, caseId);
    else child = approvalStage(body, caseId, { rerender, onNav: nav });
  }
  draw();
  return () => child?.();
}

// ── 01 case selection ─────────────────────────────────────────────────────────────────────────────
function casesStage(host) {
  let filter = 'all';
  let dead = false;
  const grid = h('div', { class: 'case-grid', role: 'list' });
  const catOf = (id) => state().duels[id]?.category;
  const next = CASE_IDS.find((id) => !state().duels[id]);
  const filters = ['all', 'new', 'done', 'err'].map((k) => h('label', null, h('input', { type: 'radio', name: 'cf', value: k, checked: k === 'all', on: { change: () => { filter = k; paint(); } } }), h('span', null, t(`cs.filter.${k}`))));
  host.append(
    h('div', { class: 'cs-intro' }, h('p', { class: 'lede' }, t('cs.lede')), h('div', { class: 'cs-actions' }, next ? btn(t('cs.start'), { icon: 'arrow', variant: 'solid', on: () => navigate(`/workbench/${next}/duel`) }) : null, h('div', { class: 'seg', role: 'radiogroup' }, filters)), h('p', { class: 'small muted' }, t('cs.note'))),
    grid);
  const cards = new Map();
  function card(id) {
    const c = getCase(id);
    const cv = h('div', { class: 'cc-img skeleton' });
    const q = h('span', { class: 'chip' }, '…');
    const el = h('a', { class: 'case-card', href: `#/workbench/${id}/lens`, role: 'listitem', 'aria-label': `${t('case.title', { id })}, ${c.eye}` },
      cv, h('div', { class: 'cc-meta' }, h('b', { class: 'cc-id' }, id), h('span', { class: 'mono' }, c.eye), q), h('div', { class: 'cc-state' }));
    analysis(id).then(({ canvas, quality }) => {
      if (dead) return;
      const th = thumbnail(canvas, 300);
      th.setAttribute('role', 'img'); th.setAttribute('aria-label', `${t('case.title', { id })} — ${t('tier.synthetic')}`);
      cv.classList.remove('skeleton'); cv.replaceChildren(th);
      q.textContent = t(`q.level.${quality.assessment.level}`);
      q.className = `chip chip-${quality.assessment.level === 'adequate' ? 'teal' : quality.assessment.level === 'borderline' ? 'ochre' : 'brick'}`;
      q.title = t('cs.q');
    });
    cards.set(id, el);
    return el;
  }
  function paint() {
    const ids = CASE_IDS.filter((id) => (filter === 'all') || (filter === 'new' && !state().duels[id]) || (filter === 'done' && state().duels[id]) || (filter === 'err' && ['FN', 'FP', 'UG-missed', 'UG-overcall'].includes(catOf(id))));
    grid.replaceChildren(...(ids.length ? ids.map((id) => {
      const el = cards.get(id) || card(id);
      const st = el.querySelector('.cc-state');
      const rev = state().review[id];
      st.replaceChildren(...[
        hasDuel(id) ? chip(`${t('cs.locked')} · ${t(`duel.cat.${catOf(id)}`)}`, ['FN', 'UG-overcall'].includes(catOf(id)) ? 'brick' : 'teal') : isStudied(id) ? chip(t('cs.practice'), 'ochre') : chip(t('cs.unseen')),
        rev?.approval ? chip(t('cs.approved'), 'blue') : null].filter(Boolean));
      return el;
    }) : [h('p', { class: 'muted' }, t('cs.none'))]));
  }
  paint();
  return () => { dead = true; };
}

// ── 05 clinician approval ───────────────────────────────────────────────────────────────────────────
function approvalStage(host, caseId, { rerender }) {
  const c = getCase(caseId);
  const rev = () => state().review[caseId] || {};
  const approved = rev().approval;
  const st = { reviewer: rev().reviewer || '', gradable: rev().interp?.gradable ?? null, grade: rev().interp?.grade ?? null, dme: rev().interp?.dme ?? false, notes: rev().interp?.notes || '', disp: approved?.disposition || rev().draftDisposition || null, rationale: approved?.rationale || '', ackRef: false, ackDisp: false };
  const locked = !!approved;
  const msg = h('p', { class: 'ap-msg small', role: 'alert' });
  const approveBtn = btn(t('ap.approve'), { icon: 'check', variant: 'solid', on: approve, disabled: locked });
  const privacyBox = h('div', { class: 'note note-brick', hidden: true });
  const ackBox = h('div', { class: 'ap-acks' });
  const interpOK = () => st.gradable === false || (st.gradable === true && st.grade !== null);
  const interpObj = () => ({ gradable: st.gradable, grade: st.gradable ? st.grade : null, dme: st.gradable ? st.dme : null, notes: st.notes });

  function needsAcks() {
    const acks = [];
    if (!interpOK() || !st.disp) return acks;
    const i = interpObj();
    if (referenceVisible(caseId) && derivedReferral(i) !== referralOf(c.reference)) acks.push('ref');
    const expected = derivedReferral(i);
    const dispRef = st.disp === 'routine' ? 'routine' : st.disp === 'recapture' ? 'ungradable' : 'refer';
    if (dispRef !== expected) acks.push('disp');
    return acks;
  }
  function refresh() {
    const found = [...scanIdentifiers(st.notes), ...scanIdentifiers(st.rationale), ...scanIdentifiers(st.reviewer)];
    privacyBox.hidden = !found.length;
    if (found.length) privacyBox.replaceChildren(ic('lock'), h('span', null, t('ap.privacy', { kinds: [...new Set(found.map((f) => f.kind))].join(', ') })));
    const acks = needsAcks();
    ackBox.replaceChildren(...acks.map((k) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: k === 'ref' ? st.ackRef : st.ackDisp, disabled: locked, on: { change: (e) => { k === 'ref' ? (st.ackRef = e.target.checked) : (st.ackDisp = e.target.checked); refresh(); } } }), h('span', { class: 'box', html: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' }), h('span', null, t(`ap.ack.${k}`)))));
    const ready = interpOK() && st.disp && !found.length && acks.every((k) => (k === 'ref' ? st.ackRef : st.ackDisp));
    approveBtn.disabled = locked || !ready; approveBtn.toggleAttribute('disabled', locked || !ready);
    msg.textContent = locked ? '' : !interpOK() ? t('ap.need.interp') : !st.disp ? t('ap.need.disp') : found.length ? '' : acks.length && !ready ? t('ap.need.ack') : '';
  }
  function approve() {
    const ts = Date.now();
    update((s) => { s.review[caseId] = { ...(s.review[caseId] || {}), reviewer: st.reviewer.trim(), interp: interpObj(), approval: { disposition: st.disp, rationale: st.rationale.trim(), ts, discrepancy: needsAcks().length > 0 } }; });
    logEvent('approved', caseId, st.disp);
    rerender();
  }
  const radioRow = (name, value, label, checked, on, disabled) => h('label', null, h('input', { type: 'radio', name, value: String(value), checked, disabled, on: { change: on } }), h('span', null, label));
  const gradeInputs = h('div', { class: 'ap-grade', hidden: st.gradable !== true },
    h('div', { class: 'seg seg-wrap', role: 'radiogroup', 'aria-label': t('duel.q.level') }, [0, 1, 2, 3, 4].map((g) => radioRow('apg', g, `${g} · ${t(`gradeName.${g}`)}`, st.grade === g, () => { st.grade = g; refresh(); }, locked))),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.dme, disabled: locked, on: { change: (e) => { st.dme = e.target.checked; refresh(); } } }), h('span', { class: 'box', html: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' }), h('span', null, t('duel.q.dme'))));
  const notes = h('textarea', { rows: 3, value: st.notes, disabled: locked, 'aria-describedby': 'ap-notes-h', on: { input: (e) => { st.notes = e.target.value; refresh(); } } });
  const rationale = h('textarea', { rows: 3, value: st.rationale, disabled: locked, 'aria-describedby': 'ap-rat-h', on: { input: (e) => { st.rationale = e.target.value; refresh(); } } });
  const reviewer = h('input', { type: 'text', value: st.reviewer, disabled: locked, maxlength: 40, autocomplete: 'off', 'aria-describedby': 'ap-rev-h', on: { input: (e) => { st.reviewer = e.target.value; refresh(); } } });
  const copyBtn = hasDuel(caseId) && !locked ? btn(t('ap.copy'), { variant: 'quiet', cls: 'btn-sm', icon: 'arrow', on: () => { const i = state().duels[caseId].interp; st.gradable = i.gradable; st.grade = i.grade; st.dme = !!i.dme; rerenderForm(); } }) : null;
  const gradSeg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': t('duel.q.grad') }, radioRow('apgr', 'y', t('duel.grad.yes'), st.gradable === true, () => { st.gradable = true; gradeInputs.hidden = false; refresh(); }, locked), radioRow('apgr', 'n', t('duel.grad.no'), st.gradable === false, () => { st.gradable = false; st.grade = null; gradeInputs.hidden = true; refresh(); }, locked));
  const dispSeg = h('div', { class: 'disp-list', role: 'radiogroup', 'aria-label': t('ap.disp') }, DISPS.map((d) => h('label', { class: 'disp' }, h('input', { type: 'radio', name: 'disp', value: d, checked: st.disp === d, disabled: locked, on: { change: () => { st.disp = d; refresh(); } } }), h('span', null, h('b', null, t(`disp.${d}`))))));
  function rerenderForm() { rerender(); update((s) => { s.review[caseId] = { ...(s.review[caseId] || {}), interp: interpObj(), reviewer: st.reviewer }; }); }

  const form = h('div', { class: 'ap-form' },
    h('p', { class: 'lede' }, t('ap.lede')),
    rev().draftDisposition && !locked ? h('div', { class: 'note note-warn' }, ic('flag'), h('span', null, t('ap.draft'))) : null,
    !referenceVisible(caseId) ? h('div', { class: 'note' }, ic('info'), h('span', null, t('ap.hold'))) : null,
    h('div', { class: 'field' }, h('label', null, t('ap.reviewer')), reviewer, h('span', { class: 'small muted', id: 'ap-rev-h' }, t('ap.reviewer.h'))),
    h('fieldset', { class: 'field ap-set' }, h('legend', { class: 'lbl' }, t('ap.interp')), copyBtn, gradSeg, gradeInputs),
    h('div', { class: 'field' }, h('label', null, t('ap.notes')), notes, h('span', { class: 'small muted', id: 'ap-notes-h' }, t('ap.notes.h'))),
    h('fieldset', { class: 'field ap-set' }, h('legend', { class: 'lbl' }, t('ap.disp')), dispSeg, h('p', { class: 'small muted' }, t('ap.guide'))),
    h('div', { class: 'field' }, h('label', null, t('ap.rationale')), rationale, h('span', { class: 'small muted', id: 'ap-rat-h' }, t('ap.rationale.h'))),
    privacyBox, ackBox,
    h('div', { class: 'note' }, ic('info'), h('span', null, t('ap.note.model'))),
    h('div', { class: 'ap-actions' }, approveBtn, locked ? btn(t('ap.withdraw'), { variant: 'quiet', on: () => { update((s) => { const r = s.review[caseId]; delete r.approval; }); logEvent('withdrawn', caseId); rerender(); } }) : null,
      locked && ['refer', 'urgent'].includes(approved.disposition) ? h('a', { class: 'btn btn-solid', href: '#/carebridge' }, h('span', { class: 'btn-label' }, t('ap.referral')), ic('arrow', 14)) : null), msg,
    approved ? h('div', { class: 'note note-teal' }, ic('check'), h('span', null, `${t('ap.approved')} · ${t(`disp.${approved.disposition}`)} · ${fmtDate(approved.ts)}`)) : null);
  host.append(h('div', { class: 'ap-grid' }, form, h('aside', { class: 'ap-side' }, ledger(caseId))));
  refresh();
  return () => {};
}
