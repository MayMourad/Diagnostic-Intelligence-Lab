// Supporting: CareBridge — referral letters generated ONLY from clinician-approved dispositions, with an identifier guard.
import { BRAND } from '../brand.js';
import { register, t, getLang, fmtDate } from '../i18n.js';
import { h, ic, btn, chip, download } from '../ui.js';
import { CASE_IDS, getCase } from '../data/cases.js';
import { state, update, logEvent } from '../store.js';
import { analysis } from '../render.js';
import { scanIdentifiers } from '../lib/privacy.js';
import { gradeLabel } from './shared.js';
import './duel.js';
import './workbench.js';

export const titleKey = 'nav.carebridge';

register({
  en: {
    'cb.kicker': 'Supporting · CareBridge', 'cb.title': 'From approved decision to referral.', 'cb.lede': 'CareBridge drafts a referral letter only after a reviewer has approved a “refer” disposition. It never decides; it carries a human decision forward.',
    'cb.none.t': 'No approved referrals yet', 'cb.none.b': 'Approve a “refer” or “urgent” disposition in the Workbench (stage 05) and it will appear here.', 'cb.none.go': 'Open the Workbench',
    'cb.list': 'Approved referral dispositions', 'cb.pick': 'Choose a case to draft its letter.',
    'cb.to': 'Recipient', 'cb.to.v': 'Ophthalmology — retinal / diabetic eye service', 'cb.urg': 'Urgency', 'cb.urg.refer': 'Non-urgent (routine specialist appointment)', 'cb.urg.urgent': 'Urgent (prompt specialist review)',
    'cb.summary': 'Clinical summary', 'cb.summary.h': 'Clinical content only. Identifiers are blocked.', 'cb.quality': 'Include measured image-quality note',
    'cb.preview': 'Letter preview', 'cb.print': 'Print', 'cb.download': 'Download .txt', 'cb.save': 'Save to my referral list', 'cb.saved': 'Saved.',
    'cb.blocked': 'Possible identifier detected ({kinds}). Remove it to enable printing and download.',
    'cb.check.t': 'What a good referral contains', 'cb.check.1': 'Reason for referral in one sentence', 'cb.check.2': 'Which eye(s), and the findings that matter', 'cb.check.3': 'Urgency and why', 'cb.check.4': 'Image quality, so the receiver knows how far to trust the photograph', 'cb.check.5': 'Who approved the decision — and that a human did', 'cb.check.6': 'Nothing identifying in a free-text field that is not needed',
    'cb.l.banner': 'SYNTHETIC EDUCATIONAL LETTER — not a clinical document, no real patient', 'cb.l.date': 'Date', 'cb.l.to': 'To', 'cb.l.from': 'From (reviewer pseudonym)', 'cb.l.re': 'Re', 'cb.l.re.v': 'Synthetic teaching case {id}, {eye}', 'cb.l.dear': 'Dear colleague,',
    'cb.l.body1': 'I am referring this case for specialist assessment following screening interpretation of a retinal fundus photograph.', 'cb.l.find': 'Screening interpretation', 'cb.l.disp': 'Approved disposition', 'cb.l.sum': 'Clinical summary', 'cb.l.qual': 'Image quality (measured from pixels, prototype heuristics): {level}',
    'cb.l.prov': 'Provenance: interpretation entered by a human reviewer in {app} v{v}. No AI model contributed — none is implemented. The reference grade, where shown to the reviewer, is a teaching label.', 'cb.l.sign': 'Approved by: {who}', 'cb.l.foot': 'Educational prototype by {names}, {school}. Not a medical device.',
    'cb.l.anon': 'reviewer', 'cb.l.nosum': '(no additional summary)',
  },
  ar: {
    'cb.kicker': 'داعم · جسر الرعاية', 'cb.title': 'من القرار المعتمد إلى الإحالة.', 'cb.lede': 'يصيغ «جسر الرعاية» خطاب إحالة فقط بعد أن يعتمد مراجع قرار «إحالة». ولا يقرر أبدًا؛ إنما ينقل قرارًا بشريًا إلى الأمام.',
    'cb.none.t': 'لا إحالات معتمدة بعد', 'cb.none.b': 'اعتمد قرار «إحالة» أو «عاجل» في منصة العمل (المرحلة ٥) وسيظهر هنا.', 'cb.none.go': 'افتح منصة العمل',
    'cb.list': 'قرارات الإحالة المعتمدة', 'cb.pick': 'اختر حالة لصياغة خطابها.',
    'cb.to': 'المستلم', 'cb.to.v': 'طب العيون — خدمة الشبكية / عين السكري', 'cb.urg': 'الاستعجال', 'cb.urg.refer': 'غير عاجل (موعد أخصائي عادي)', 'cb.urg.urgent': 'عاجل (مراجعة أخصائي فورية)',
    'cb.summary': 'الملخص السريري', 'cb.summary.h': 'محتوى سريري فقط. تُمنع المعرّفات.', 'cb.quality': 'ضمّن ملاحظة جودة الصورة المقاسة',
    'cb.preview': 'معاينة الخطاب', 'cb.print': 'طباعة', 'cb.download': 'نزّل ‎.txt', 'cb.save': 'احفظ في قائمة إحالاتي', 'cb.saved': 'تم الحفظ.',
    'cb.blocked': 'يُحتمل وجود معرّف ({kinds}). أزله لتمكين الطباعة والتنزيل.',
    'cb.check.t': 'ما الذي تتضمنه الإحالة الجيدة', 'cb.check.1': 'سبب الإحالة في جملة واحدة', 'cb.check.2': 'أي عين (أو العينين) والموجودات المهمة', 'cb.check.3': 'الاستعجال وسببه', 'cb.check.4': 'جودة الصورة ليعرف المستلم مدى الوثوق بها', 'cb.check.5': 'من اعتمد القرار — وأن إنسانًا فعل', 'cb.check.6': 'لا شيء معرِّفًا في حقل نص حر دون حاجة',
    'cb.l.banner': 'خطاب تعليمي اصطناعي — ليس وثيقة سريرية ولا مريضًا حقيقيًا', 'cb.l.date': 'التاريخ', 'cb.l.to': 'إلى', 'cb.l.from': 'من (اسم المراجع المستعار)', 'cb.l.re': 'الموضوع', 'cb.l.re.v': 'حالة تعليمية اصطناعية {id}، {eye}', 'cb.l.dear': 'الزميل الكريم،',
    'cb.l.body1': 'أحيل هذه الحالة لتقييم أخصائي عقب تفسير فرزي لصورة قاع العين.', 'cb.l.find': 'التفسير الفرزي', 'cb.l.disp': 'القرار المعتمد', 'cb.l.sum': 'الملخص السريري', 'cb.l.qual': 'جودة الصورة (مقاسة من البكسلات بقواعد تقريبية): {level}',
    'cb.l.prov': 'المصدر: أدخل التفسير مراجع بشري في {app} الإصدار {v}. لم يساهم أي نموذج ذكاء اصطناعي — فلا يوجد نموذج منفَّذ. الدرجة المرجعية، حين تُعرض للمراجع، تسمية تعليمية.', 'cb.l.sign': 'اعتمده: {who}', 'cb.l.foot': 'نموذج تعليمي من إعداد {names}، {school}. ليس جهازًا طبيًا.',
    'cb.l.anon': 'مراجع', 'cb.l.nosum': '(لا ملخص إضافي)',
  },
});

export function mount(root) {
  const approved = CASE_IDS.filter((id) => { const a = state().review[id]?.approval; return a && ['refer', 'urgent'].includes(a.disposition); });
  const page = h('div', { class: 'page' }, h('header', { class: 'page-head' }, h('p', { class: 'kicker' }, t('cb.kicker')), h('h1', { class: 'h1' }, t('cb.title')), h('p', { class: 'lede' }, t('cb.lede'))));
  root.append(page);
  if (!approved.length) {
    page.append(h('div', { class: 'panel ticked cb-empty' }, h('h2', { class: 'h2' }, t('cb.none.t')), h('p', { class: 'prose' }, t('cb.none.b')), h('a', { class: 'btn btn-solid', href: '#/workbench' }, h('span', { class: 'btn-label' }, t('cb.none.go')), ic('arrow', 14))), checklist());
    return;
  }
  let sel = approved[0];
  const st = { summary: '', quality: true };
  const picker = h('div', { class: 'cb-pick', role: 'radiogroup', 'aria-label': t('cb.list') }, approved.map((id) => h('label', null, h('input', { type: 'radio', name: 'cbcase', value: id, checked: id === sel, on: { change: () => { sel = id; st.summary = ''; draw(); } } }), h('span', null, `${id} · ${getCase(id).eye}`))));
  const form = h('div', { class: 'cb-form' }); const preview = h('div', { class: 'cb-preview' });
  page.append(h('div', { class: 'cb-grid' }, h('div', { class: 'cb-left' }, h('p', { class: 'kicker' }, t('cb.list')), picker, form, checklist()), preview));
  let qualityLevel = '—';
  function letterText() {
    const c = getCase(sel); const rev = state().review[sel]; const a = rev.approval; const i = rev.interp;
    const names = BRAND.students.map((s) => (getLang() === 'ar' ? s.nameAr : s.name)).join('، ');
    const lines = [t('cb.l.banner'), '',
      `${t('cb.l.date')}: ${fmtDate(a.ts)}`, `${t('cb.l.to')}: ${t('cb.to.v')}`, `${t('cb.l.from')}: ${rev.reviewer || t('cb.l.anon')}`, `${t('cb.l.re')}: ${t('cb.l.re.v', { id: sel, eye: t(`case.eye.${c.eye}`) })}`, '',
      t('cb.l.dear'), '', t('cb.l.body1'), '',
      `${t('cb.l.find')}: ${i.gradable ? `${gradeLabel(i.grade)}${i.dme ? ' · DME' : ''}` : t('decision.ungradable')}`, `${t('cb.l.disp')}: ${t(`disp.${a.disposition}`)} — ${t(`cb.urg.${a.disposition}`)}`];
    if (st.quality) lines.push(t('cb.l.qual', { level: qualityLevel }));
    lines.push('', `${t('cb.l.sum')}:`, st.summary.trim() || a.rationale || t('cb.l.nosum'), '', t('cb.l.prov', { app: BRAND.name, v: BRAND.version }), '', t('cb.l.sign', { who: rev.reviewer || t('cb.l.anon') }), '', t('cb.l.foot', { names, school: getLang() === 'ar' ? BRAND.schoolAr : BRAND.school }));
    return lines;
  }
  function draw() {
    analysis(sel).then(({ quality }) => { qualityLevel = t(`q.level.${quality.assessment.level}`); paint(); });
    paint();
  }
  function paint() {
    const rev = state().review[sel]; const a = rev.approval;
    const found = scanIdentifiers(st.summary);
    const msg = h('div', { class: 'note note-brick', hidden: !found.length }, ic('lock'), h('span', null, t('cb.blocked', { kinds: [...new Set(found.map((f) => f.kind))].join(', ') })));
    const ta = h('textarea', { rows: 4, value: st.summary, 'aria-describedby': 'cb-sum-h', on: { input: (e) => { st.summary = e.target.value; paint2(); } } });
    form.replaceChildren(
      h('dl', { class: 'kvl' }, h('div', { class: 'kvr' }, h('dt', null, t('cb.to')), h('dd', null, t('cb.to.v'))), h('div', { class: 'kvr' }, h('dt', null, t('cb.urg')), h('dd', null, t(`cb.urg.${a.disposition}`)))),
      h('div', { class: 'field' }, h('label', null, t('cb.summary')), ta, h('span', { class: 'small muted', id: 'cb-sum-h' }, t('cb.summary.h'))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.quality, on: { change: (e) => { st.quality = e.target.checked; paint2(); } } }), h('span', { class: 'box', html: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' }), h('span', null, t('cb.quality'))),
      msg, h('div', { class: 'row-actions' },
        btn(t('cb.print'), { icon: 'print', variant: 'solid', disabled: !!found.length, on: () => window.print() }), btn(t('cb.download'), { icon: 'download', variant: 'quiet', disabled: !!found.length, on: () => download(`referral-${sel}.txt`, letterText().join('\n')) }),
        btn(t('cb.save'), { variant: 'quiet', disabled: !!found.length, on: (e) => { update((s) => { s.referrals.push({ caseId: sel, ts: Date.now(), disposition: a.disposition }); }); logEvent('referral', sel, a.disposition); e.currentTarget.querySelector('.btn-label').textContent = t('cb.saved'); } })));
    paint2();
    function paint2() {
      const f2 = scanIdentifiers(st.summary);
      msg.hidden = !f2.length; if (f2.length) msg.replaceChildren(ic('lock'), h('span', null, t('cb.blocked', { kinds: [...new Set(f2.map((f) => f.kind))].join(', ') })));
      form.querySelectorAll('.row-actions .btn').forEach((b, k) => { if (k < 3) b.disabled = !!f2.length; });
      const L = letterText();
      preview.replaceChildren(h('p', { class: 'kicker no-print' }, t('cb.preview')), h('article', { class: 'letter', dir: getLang() === 'ar' ? 'rtl' : 'ltr' }, h('p', { class: 'letter-banner' }, L[0]), ...L.slice(1).map((ln) => (ln === '' ? h('br') : h('p', null, ln)))));
    }
  }
  draw();
  function checklist() {
    return h('section', { class: 'cb-check panel' }, h('p', { class: 'kicker' }, t('cb.check.t')), h('ol', null, [1, 2, 3, 4, 5, 6].map((n) => h('li', { class: 'small' }, t(`cb.check.${n}`)))));
  }
}
