// Stage 03 — Diagnostic Duel. With no research model available this is HUMAN vs REFERENCE, never "Human vs AI".
import { register, t, fmtDate, fmtPct, fmtNum } from '../i18n.js';
import { h, ic, btn, chip, reducedMotion, announce, sleep } from '../ui.js';
import { getCase, CASE_IDS } from '../data/cases.js';
import { analysis, full } from '../render.js';
import { Viewer } from './viewer.js';
import { state, recordDuel, derivedReferral, learnerStats, classify } from '../store.js';
import { getModel, gradeLabel, referralOf, ruleTrace, isStudied } from './shared.js';
import { LESION_ORDER } from '../data/references.js';

register({
  en: {
    'duel.kicker': 'Stage 03 — Diagnostic Duel', 'duel.title': 'Read it before you are told.',
    'duel.sub': 'Examine the image, record your screening interpretation, lock it — then see how it compares with the reference. No model exists in this prototype, so this is Human vs Reference.',
    'duel.seat.you': 'You', 'duel.seat.ref': 'Reference', 'duel.seat.model': 'Model', 'duel.vs': 'vs', 'duel.seat.model.n': 'not implemented', 'duel.seat.hidden': 'hidden', 'duel.seat.open': 'open',
    'duel.steps': 'Duel progress', 'duel.step.1': 'Observe', 'duel.step.2': 'Record', 'duel.step.3': 'Lock', 'duel.step.4': 'Model', 'duel.step.5': 'Reference', 'duel.step.6': 'Compare', 'duel.step.7': 'Meaning', 'duel.step.8': 'Record',
    'duel.q.grad': 'Is the image good enough to grade?', 'duel.grad.yes': 'Gradable', 'duel.grad.no': 'Ungradable',
    'duel.q.level': 'Diabetic retinopathy level (ICDR scale)', 'duel.q.dme': 'Suspected macular oedema?', 'duel.dme.d': 'Hard exudates within 1 disc diameter (DD) of the macular centre.',
    'duel.q.conf': 'How confident are you?', 'duel.conf.low': 'Low', 'duel.conf.mid': 'Medium', 'duel.conf.high': 'High',
    'duel.lvl.0': 'No abnormalities.', 'duel.lvl.1': 'Microaneurysms only.', 'duel.lvl.2': 'More than microaneurysms, less than severe.', 'duel.lvl.3': '4-2-1: haemorrhages in 4 quadrants, venous beading in 2, or IRMA in 1.', 'duel.lvl.4': 'New vessels, or pre-retinal / vitreous haemorrhage.',
    'duel.yours': 'Your screening decision', 'duel.lock': 'Lock interpretation — final', 'duel.lock.hint': 'You cannot change it after locking. Reference layers stay hidden until then.',
    'duel.practice': 'Practice only — reference layers were opened in Study Mode before locking, so this case is excluded from your educational score.',
    'duel.locked': 'Interpretation locked', 'duel.locked.at': '{when}',
    'duel.model.t': 'Research model: not implemented', 'duel.model.b': 'No model output exists, so none is revealed. Everything below compares you with the dataset’s reference label.',
    'duel.ref.t': 'Reference label', 'duel.ref.why': 'Why this label — the rule trace', 'duel.ref.src': 'Authored by construction from this case’s lesion list (ICDR scale). It is a teaching reference, not an independent expert panel.',
    'duel.rt.pdr': 'Proliferative signs (new vessels / pre-retinal haemorrhage)', 'duel.rt.hem': 'Haemorrhages ≥ 20 in all four quadrants', 'duel.rt.bead': 'Venous beading in ≥ 2 quadrants', 'duel.rt.irma': 'IRMA in ≥ 1 quadrant', 'duel.rt.nonma': 'Findings beyond microaneurysms', 'duel.rt.ma': 'Microaneurysms', 'duel.rt.dme': 'Exudate within 1 DD of macular centre',
    'duel.rt.ung': 'Reference graders exclude this image: quality is insufficient for any grade.',
    'duel.open.lens': 'Open reference layers in EvidenceLens',
    'duel.cmp.t': 'Agreements and disagreements', 'duel.meaning.k': 'What this outcome means', 'duel.cmp.you': 'You', 'duel.cmp.ref': 'Reference', 'duel.cmp.match': 'Match', 'duel.cmp.differ': 'Differs',
    'duel.row.grad': 'Gradability', 'duel.row.level': 'DR level', 'duel.row.dme': 'Suspected DME', 'duel.row.dec': 'Screening decision',
    'duel.g.yes': 'Gradable', 'duel.g.no': 'Ungradable',
    'duel.cat.TP': 'True positive', 'duel.cat.TN': 'True negative', 'duel.cat.FP': 'False positive', 'duel.cat.FN': 'False negative', 'duel.cat.UG-correct': 'Ungradable — recognised', 'duel.cat.UG-missed': 'Gradable image called ungradable', 'duel.cat.UG-overcall': 'Graded an ungradable image',
    'duel.cat.TP.b': 'You referred a case the reference also marks referable. This is the outcome a screening programme exists to produce.',
    'duel.cat.TN.b': 'You kept a non-referable case on routine follow-up, agreeing with the reference. Correctly reassuring people matters too: it keeps clinics free for those who need them.',
    'duel.cat.FP.b': 'You referred a case the reference marks non-referable. In practice this means an unnecessary specialist visit: cost, worry and queue pressure. It is usually the safer error — but at scale it can overwhelm a service.',
    'duel.cat.FN.b': 'You judged routine a case the reference marks referable. In screening this is the costly error: someone who needs treatment is told they are fine, and sight-threatening disease can progress unseen until the next visit.',
    'duel.cat.UG-correct.b': 'You recognised an image that cannot support a grade. Withholding a result is a safety skill: the correct action is to recapture or examine in person.',
    'duel.cat.UG-missed.b': 'You called a gradable image ungradable. The cost is a repeat photograph or an extra visit — low harm, but it still wastes capacity.',
    'duel.cat.UG-overcall.b': 'You graded an image the reference excludes. A grade from an unreadable image creates false confidence — worse than no grade, because it looks like a result.',
    'duel.hint.fn': 'The reference lists {n} findings ({types}); {far} of them lie more than 3 DD from the macula.',
    'duel.hint.fp.art': 'The bright arc is a camera light reflex, annotated as an artefact. It carries no grading weight.',
    'duel.hint.fp.mild': 'Microaneurysms alone define mild NPDR, which is below the referral threshold.',
    'duel.hint.grade': 'Your DR level was {d} step(s) {dir} the reference.', 'duel.hint.above': 'above', 'duel.hint.below': 'below',
    'duel.hint.trap': 'This case was designed to be hard: {trap}',
    'duel.trap.false-negative': 'sparse or peripheral findings that are easy to under-call.', 'duel.trap.false-positive': 'a look-alike that is easy to over-call.', 'duel.trap.ungradable': 'the image is unreadable.', 'duel.trap.borderline-quality': 'borderline image quality with no disease.',
    'duel.single': 'One case is not a measurement. Your record below is more informative — and still educational.',
    'duel.rec.t': 'Your educational record', 'duel.rec.n': 'Cases scored', 'duel.rec.acc': 'Referral decision correct', 'duel.rec.sens': 'Sensitivity (referable found)', 'duel.rec.spec': 'Specificity (non-referable cleared)', 'duel.rec.exact': 'Exact DR level', 'duel.rec.err': 'Mean level error', 'duel.rec.fn': 'False negatives', 'duel.rec.ug': 'Ungradable recognised', 'duel.rec.practice': 'Practice-only cases',
    'duel.rec.caveat': 'Educational scoring on a small synthetic set. It is not validated clinical performance, says nothing about any model, and does not show that AI improves clinician accuracy.',
    'duel.next': 'Next case', 'duel.alldone': 'You have completed every case.', 'duel.toLab': 'See your errors in the Accuracy Lab', 'duel.review': 'Review quality & uncertainty',
    'duel.loading': 'Preparing image…',
  },
  ar: {
    'duel.kicker': 'المرحلة ٣ — مبارزة التشخيص', 'duel.title': 'اقرأها قبل أن يُقال لك.',
    'duel.sub': 'افحص الصورة، وسجّل تفسيرك الفرزي، ثم اقفله — وبعدها شاهد كيف يقارن بالمرجع. لا يوجد نموذج في هذا النموذج الأولي، لذلك هذه مبارزة «إنسان مقابل مرجع».',
    'duel.seat.you': 'أنت', 'duel.seat.ref': 'المرجع', 'duel.seat.model': 'النموذج', 'duel.vs': 'مقابل', 'duel.seat.model.n': 'غير منفَّذ', 'duel.seat.hidden': 'مخفي', 'duel.seat.open': 'مفتوح',
    'duel.steps': 'تقدم المبارزة', 'duel.step.1': 'لاحظ', 'duel.step.2': 'سجّل', 'duel.step.3': 'اقفل', 'duel.step.4': 'النموذج', 'duel.step.5': 'المرجع', 'duel.step.6': 'قارن', 'duel.step.7': 'المعنى', 'duel.step.8': 'السجل',
    'duel.q.grad': 'هل الصورة جيدة بما يكفي للتدريج؟', 'duel.grad.yes': 'قابلة للتدريج', 'duel.grad.no': 'غير قابلة للتدريج',
    'duel.q.level': 'مستوى اعتلال الشبكية السكري (مقياس ICDR)', 'duel.q.dme': 'اشتباه وذمة بقعية؟', 'duel.dme.d': 'إفرازات صلبة ضمن قطر قرص بصري واحد (DD) من مركز البقعة.',
    'duel.q.conf': 'ما مدى ثقتك؟', 'duel.conf.low': 'منخفضة', 'duel.conf.mid': 'متوسطة', 'duel.conf.high': 'عالية',
    'duel.lvl.0': 'لا شذوذات.', 'duel.lvl.1': 'أمهات دم دقيقة فقط.', 'duel.lvl.2': 'أكثر من الأمهات الدقيقة وأقل من الشديد.', 'duel.lvl.3': '4-2-1: نزوف في ٤ أرباع، أو تخرز وريدي في ٢، أو IRMA في ١.', 'duel.lvl.4': 'أوعية جديدة، أو نزف أمام الشبكية/زجاجي.',
    'duel.yours': 'قرارك الفرزي', 'duel.lock': 'اقفل التفسير — نهائي', 'duel.lock.hint': 'لا يمكنك تغييره بعد القفل. تبقى الطبقات المرجعية مخفية حتى ذلك الحين.',
    'duel.practice': 'تدريب فقط — فُتحت الطبقات المرجعية في وضع الدراسة قبل القفل، لذلك تُستبعد هذه الحالة من درجتك التعليمية.',
    'duel.locked': 'تم قفل التفسير', 'duel.locked.at': '{when}',
    'duel.model.t': 'النموذج البحثي: غير منفَّذ', 'duel.model.b': 'لا توجد مخرجات نموذج فلا يُكشف شيء. كل ما يلي يقارنك بالتسمية المرجعية لمجموعة البيانات.',
    'duel.ref.t': 'التسمية المرجعية', 'duel.ref.why': 'لماذا هذه التسمية — أثر القاعدة', 'duel.ref.src': 'مؤلَّفة بالبناء من قائمة آفات هذه الحالة (مقياس ICDR). هي مرجع تعليمي وليست لجنة خبراء مستقلة.',
    'duel.rt.pdr': 'علامات تكاثرية (أوعية جديدة / نزف أمام الشبكية)', 'duel.rt.hem': 'نزوف ≥ ٢٠ في الأرباع الأربعة جميعها', 'duel.rt.bead': 'تخرز وريدي في ≥ ربعين', 'duel.rt.irma': 'IRMA في ≥ ربع واحد', 'duel.rt.nonma': 'موجودات تتجاوز الأمهات الدقيقة', 'duel.rt.ma': 'أمهات دم دقيقة', 'duel.rt.dme': 'إفراز ضمن 1 DD من مركز البقعة',
    'duel.rt.ung': 'يستبعد المقيّمون المرجعيون هذه الصورة: جودتها غير كافية لأي درجة.',
    'duel.open.lens': 'افتح الطبقات المرجعية في عدسة الأدلة',
    'duel.cmp.t': 'مواضع الاتفاق والاختلاف', 'duel.meaning.k': 'ماذا تعني هذه النتيجة', 'duel.cmp.you': 'أنت', 'duel.cmp.ref': 'المرجع', 'duel.cmp.match': 'متطابق', 'duel.cmp.differ': 'مختلف',
    'duel.row.grad': 'قابلية التدريج', 'duel.row.level': 'مستوى الاعتلال', 'duel.row.dme': 'اشتباه وذمة بقعية', 'duel.row.dec': 'القرار الفرزي',
    'duel.g.yes': 'قابلة للتدريج', 'duel.g.no': 'غير قابلة للتدريج',
    'duel.cat.TP': 'إيجابي حقيقي', 'duel.cat.TN': 'سلبي حقيقي', 'duel.cat.FP': 'إيجابي كاذب', 'duel.cat.FN': 'سلبي كاذب', 'duel.cat.UG-correct': 'غير قابلة للتدريج — تم التعرف عليها', 'duel.cat.UG-missed': 'صورة قابلة للتدريج عُدّت غير قابلة', 'duel.cat.UG-overcall': 'تدريج صورة غير قابلة للتدريج',
    'duel.cat.TP.b': 'أحلتَ حالة يعدّها المرجع مستوجبة للإحالة أيضًا. هذه هي النتيجة التي يوجد برنامج الفرز من أجلها.',
    'duel.cat.TN.b': 'أبقيتَ حالة لا تستوجب الإحالة على المتابعة الدورية، موافقًا المرجع. وطمأنة الناس بصورة صحيحة مهمة أيضًا: فهي تُبقي العيادات متاحة لمن يحتاجها.',
    'duel.cat.FP.b': 'أحلتَ حالة يعدّها المرجع غير مستوجبة للإحالة. عمليًا يعني ذلك زيارة أخصائي بلا داعٍ: كلفة وقلق وضغط على الطوابير. وهو عادةً الخطأ الأكثر أمانًا — لكنه على نطاق واسع قد يُثقل الخدمة.',
    'duel.cat.FN.b': 'عددتَ حالة يعدّها المرجع مستوجبة للإحالة حالةً دورية. في الفرز هذا هو الخطأ المكلف: يُقال لمن يحتاج علاجًا إنه بخير، وقد يتقدم مرض مهدِّد للبصر دون أن يُرى حتى الزيارة التالية.',
    'duel.cat.UG-correct.b': 'تعرّفتَ على صورة لا تدعم درجة. والامتناع عن إعطاء نتيجة مهارة سلامة: الإجراء الصحيح هو إعادة التصوير أو الفحص الحضوري.',
    'duel.cat.UG-missed.b': 'عددتَ صورة قابلة للتدريج غير قابلة. الكلفة صورة مكررة أو زيارة إضافية — ضرر قليل لكنه يهدر الطاقة الاستيعابية.',
    'duel.cat.UG-overcall.b': 'دردجتَ صورة يستبعدها المرجع. والدرجة من صورة غير مقروءة تخلق ثقة زائفة — أسوأ من عدم وجود درجة لأنها تبدو كنتيجة.',
    'duel.hint.fn': 'يسرد المرجع {n} موجودات ({types})؛ منها {far} تبعد أكثر من 3 DD عن البقعة.',
    'duel.hint.fp.art': 'القوس الساطع انعكاس ضوئي من الكاميرا، وُسم كأثر تصوير. لا وزن له في التدريج.',
    'duel.hint.fp.mild': 'الأمهات الدقيقة وحدها تعرّف الاعتلال الخفيف، وهو دون عتبة الإحالة.',
    'duel.hint.grade': 'كان مستواك {dir} المرجع بمقدار {d} درجة.', 'duel.hint.above': 'أعلى من', 'duel.hint.below': 'أدنى من',
    'duel.hint.trap': 'صُممت هذه الحالة لتكون صعبة: {trap}',
    'duel.trap.false-negative': 'موجودات قليلة أو محيطية يسهل التقليل منها.', 'duel.trap.false-positive': 'شبيه يسهل المبالغة فيه.', 'duel.trap.ungradable': 'الصورة غير مقروءة.', 'duel.trap.borderline-quality': 'جودة صورة حدّية دون مرض.',
    'duel.single': 'حالة واحدة ليست قياسًا. سجلك أدناه أكثر دلالة — وما زال تعليميًا.',
    'duel.rec.t': 'سجلك التعليمي', 'duel.rec.n': 'الحالات المحسوبة', 'duel.rec.acc': 'قرار الإحالة الصحيح', 'duel.rec.sens': 'الحساسية (إيجاد المستوجبة للإحالة)', 'duel.rec.spec': 'النوعية (طمأنة غير المستوجبة)', 'duel.rec.exact': 'مستوى الاعتلال الدقيق', 'duel.rec.err': 'متوسط خطأ المستوى', 'duel.rec.fn': 'السلبيات الكاذبة', 'duel.rec.ug': 'التعرف على غير القابلة للتدريج', 'duel.rec.practice': 'حالات التدريب فقط',
    'duel.rec.caveat': 'تقييم تعليمي على مجموعة اصطناعية صغيرة. ليس أداءً سريريًا مُصادَقًا عليه، ولا يقول شيئًا عن أي نموذج، ولا يثبت أن الذكاء الاصطناعي يحسّن دقة الأطباء.',
    'duel.next': 'الحالة التالية', 'duel.alldone': 'أكملتَ كل الحالات.', 'duel.toLab': 'شاهد أخطاءك في مختبر الدقة', 'duel.review': 'راجع الجودة وعدم اليقين',
    'duel.loading': 'جارٍ تجهيز الصورة…',
  },
});

const STEPS = 8;

export function duelStage(host, caseId, { onNav, onCase, rerender }) {
  const c = getCase(caseId);
  const rec = state().duels[caseId];
  const reduced = reducedMotion();
  let viewer; let dead = false;
  const timers = [];

  // arena header
  const seat = (cls, label, value, sub) => h('div', { class: ['seat', cls] }, h('span', { class: 'kicker' }, label), h('b', { class: 'seat-v' }, value), sub ? h('span', { class: 'small muted' }, sub) : null);
  const seats = { you: h('b', { class: 'seat-v' }, rec ? decisionText(rec.interp) : '—'), ref: h('b', { class: 'seat-v' }, '—') };
  const arena = h('div', { class: 'arena', role: 'group', 'aria-label': `${t('duel.seat.you')} ${t('duel.vs')} ${t('duel.seat.ref')}` },
    h('div', { class: 'seat seat-you' }, h('span', { class: 'kicker' }, t('duel.seat.you')), seats.you),
    h('div', { class: 'seat-vs' }, h('i'), h('span', null, t('duel.vs')), h('i')),
    h('div', { class: 'seat seat-ref' }, h('span', { class: 'kicker' }, t('duel.seat.ref')), seats.ref),
    h('div', { class: 'seat seat-model', 'aria-label': `${t('duel.seat.model')}: ${t('duel.seat.model.n')}` }, h('span', { class: 'kicker' }, t('duel.seat.model')), h('b', { class: 'seat-v' }, t('duel.seat.model.n'))));

  const stepEls = Array.from({ length: STEPS }, (_, i) => h('li', { class: 'ds' }, h('i'), h('span', { class: 'sr-only' }, t(`duel.step.${i + 1}`))));
  const stepCap = h('p', { class: 'kicker duel-step-cap', 'aria-live': 'polite' });
  const stepper = h('div', { class: 'duel-stepper' }, h('ol', { class: 'duel-steps', 'aria-label': t('duel.steps') }, stepEls), stepCap);
  const setStep = (n) => { stepEls.forEach((el, i) => { el.classList.toggle('done', i + 1 < n); el.classList.toggle('on', i + 1 === n); }); stepCap.textContent = `‎${n} / ${STEPS}‎ — ${t(`duel.step.${n}`)}`;  };

  const hostEl = h('div', { class: 'lens-host duel-lens' }, h('div', { class: 'lens-loading mono' }, h('i', { class: 'spin' }), t('duel.loading')));
  const toolbar = h('div', { class: 'lens-tools', role: 'toolbar', 'aria-label': t('lens.tools') },
    ...[['plus', 'lens.zoomIn', () => viewer?.zoomBy(1.4)], ['minus', 'lens.zoomOut', () => viewer?.zoomBy(1 / 1.4)], ['fit', 'lens.fit', () => viewer?.fit()], ['one', 'lens.actual', () => viewer?.actual()]]
      .map(([i, k, fn]) => h('button', { type: 'button', class: 'icon-btn', title: t(k), 'aria-label': t(k), on: { click: fn } }, ic(i, 16))));
  const left = h('div', { class: 'lens-col' }, hostEl, toolbar, h('p', { class: 'small muted lens-hint' }, t('lens.hint')));
  const right = h('div', { class: 'duel-panel' });
  const side = h('div', { class: 'duel-side' }, h('header', { class: 'duel-head' }, h('p', { class: 'kicker' }, t('duel.kicker')), h('h2', { class: 'h2' }, t('duel.title')), h('p', { class: 'small' }, t('duel.sub'))), arena, stepper, right);
  host.append(h('div', { class: 'duel-grid' }, left, side));

  analysis(caseId).then(({ canvas }) => {
    if (dead) return;
    hostEl.replaceChildren();
    viewer = new Viewer(hostEl, { annotations: false, plan: undefined, lesions: [], label: t('lens.aria') });
    viewer.setImage(canvas);
    full(caseId).then((big) => { if (!dead && viewer) viewer.setImage(big); });
  });

  function decisionText(i) { return i.gradable ? `${t(`decision.${derivedReferral(i)}`)} · ${i.grade}${i.dme ? ' + DME' : ''}` : t('decision.ungradable'); }

  // ── form (before lock) ──
  function form() {
    setStep(1);
    const st = { gradable: null, grade: null, dme: false, confidence: 'mid' };
    const lockBtn = btn(t('duel.lock'), { icon: 'lock', variant: 'solid', disabled: true, on: lock });
    const yours = h('output', { class: 'yours', 'aria-live': 'polite' }, '—');
    const refresh = () => {
      const ok = st.gradable === false || (st.gradable === true && st.grade !== null);
      lockBtn.disabled = !ok; lockBtn.toggleAttribute('disabled', !ok);
      yours.textContent = st.gradable === null ? '—' : st.gradable ? (st.grade === null ? '—' : t(`decision.${derivedReferral(st)}`)) : t('decision.ungradable');
      if (ok) setStep(2); else setStep(1);
      seats.you.textContent = yours.textContent;
      lvlWrap.hidden = st.gradable !== true; dmeWrap.hidden = st.gradable !== true;
    };
    const radio = (name, value, label, onChange, attrs = {}) => h('label', null, h('input', { type: 'radio', name, value: String(value), on: { change: onChange }, ...attrs }), h('span', null, label));
    const gradSeg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': t('duel.q.grad') }, radio('grad', 'yes', t('duel.grad.yes'), () => { st.gradable = true; refresh(); }), radio('grad', 'no', t('duel.grad.no'), () => { st.gradable = false; st.grade = null; refresh(); }));
    const lvlWrap = h('fieldset', { class: 'field lvl-set', hidden: true }, h('legend', { class: 'lbl' }, t('duel.q.level')),
      h('div', { class: 'lvl-cards' }, [0, 1, 2, 3, 4].map((g) => h('label', { class: 'lvl' }, h('input', { type: 'radio', name: 'lvl', value: String(g), on: { change: () => { st.grade = g; refresh(); } } }), h('span', { class: 'lvl-c' }, h('b', { class: 'lvl-n' }, g), h('span', { class: 'lvl-t' }, t(`gradeName.${g}`)), h('span', { class: 'small muted' }, t(`duel.lvl.${g}`)))))));
    const dmeWrap = h('div', { class: 'field', hidden: true }, h('span', { class: 'lbl' }, t('duel.q.dme')),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', on: { change: (e) => { st.dme = e.target.checked; refresh(); } } }), h('span', { class: 'box', html: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' }), h('span', null, t('duel.dme.d'))));
    const confSeg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': t('duel.q.conf') }, ['low', 'mid', 'high'].map((k) => radio('conf', k, t(`duel.conf.${k}`), () => { st.confidence = k; }, k === 'mid' ? { checked: true } : {})));
    right.replaceChildren(
      isStudied(caseId) ? h('div', { class: 'note note-warn' }, ic('info'), h('span', null, t('duel.practice'))) : null,
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, t('duel.q.grad')), gradSeg), lvlWrap, dmeWrap,
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, t('duel.q.conf')), confSeg),
      h('div', { class: 'yours-row' }, h('span', { class: 'lbl' }, t('duel.yours')), yours),
      h('div', { class: 'lock-row' }, lockBtn, h('p', { class: 'small muted' }, t('duel.lock.hint'))));
    function lock() {
      if (lockBtn.disabled) return;
      const interp = { gradable: st.gradable, grade: st.gradable ? st.grade : null, dme: st.gradable ? st.dme : null, confidence: st.confidence };
      recordDuel(caseId, interp, c.reference);
      rerender({ animate: true });
    }
    refresh();
  }

  // ── reveal (after lock) ──
  function revealed(r, animate) {
    const seq = [];
    const block = (cls, ...kids) => { const b = h('section', { class: ['dl-block', cls] }, ...kids); seq.push(b); return b; };
    const ref = c.reference;
    const lockedAt = block('dl-lock', h('div', { class: 'dl-stamp' }, ic('lock', 18), h('div', null, h('b', null, t('duel.locked')), h('span', { class: 'small muted' }, fmtDate(r.ts)))),
      h('p', { class: 'dl-you' }, `${t('duel.seat.you')}: `, h('b', null, decisionText(r.interp)), ` · ${t(`duel.conf.${r.interp.confidence}`)}`), r.practice ? h('div', { class: 'note note-warn' }, ic('info'), h('span', null, t('duel.practice'))) : null);
    block('dl-model', h('div', { class: 'dl-ghost' }, h('span', { class: 'prov prov-none' }, t('duel.model.t')), h('p', { class: 'small' }, t('duel.model.b'))));
    // reference
    const trace = ruleTrace(c);
    const yn = (v) => h('span', { class: ['yn', v ? 'y' : 'n'] }, t(v ? 'yes' : 'no'));
    const refBlock = block('dl-ref', h('p', { class: 'kicker' }, t('duel.ref.t')),
      h('h3', { class: 'h2 dl-label' }, ref.gradable ? `${gradeLabel(ref.icdr)}` : t('decision.ungradable')),
      ref.gradable ? h('p', { class: 'dl-refer' }, h('span', { class: ['chip', ref.referable ? 'chip-brick' : 'chip-teal'] }, t(ref.referable ? 'ref.referable' : 'ref.nonreferable')), ref.dme ? h('span', { class: 'chip chip-ochre' }, 'DME') : null) : h('p', { class: 'small' }, t('duel.rt.ung')),
      ref.gradable ? h('details', { class: 'trace' }, h('summary', null, t('duel.ref.why')), h('ul', null,
        h('li', null, t('duel.rt.pdr'), yn(trace.pdr)), h('li', null, t('duel.rt.hem'), yn(trace.rule421.hemorrhages4Quadrants)), h('li', null, t('duel.rt.bead'), yn(trace.rule421.beading2Quadrants)), h('li', null, t('duel.rt.irma'), yn(trace.rule421.irma1Quadrant)),
        h('li', null, t('duel.rt.nonma'), yn(['hemorrhage', 'hard-exudate', 'cotton-wool', 'venous-beading', 'irma'].some((k) => trace.counts[k]))), h('li', null, t('duel.rt.ma'), h('span', { class: 'num' }, String(trace.counts.ma || 0))), h('li', null, t('duel.rt.dme'), yn(trace.dme)))) : null,
      h('p', { class: 'small muted' }, t('duel.ref.src')),
      btn(t('duel.open.lens'), { icon: 'arrow', variant: 'quiet', cls: 'btn-sm', on: () => onNav('lens') }));
    // comparison
    const mRow = (k, you, refv, match) => h('tr', null, h('th', { scope: 'row' }, t(`duel.row.${k}`)), h('td', null, you), h('td', null, refv), h('td', { class: ['cmp-m', match ? 'ok' : 'bad'] }, h('span', { class: 'cmp-glyph', html: match ? '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' : '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8"/></svg>' }), t(match ? 'duel.cmp.match' : 'duel.cmp.differ')));
    const i = r.interp;
    const rows = [mRow('grad', t(i.gradable ? 'duel.g.yes' : 'duel.g.no'), t(ref.gradable ? 'duel.g.yes' : 'duel.g.no'), i.gradable === ref.gradable)];
    if (ref.gradable && i.gradable) rows.push(mRow('level', gradeLabel(i.grade), gradeLabel(ref.icdr), i.grade === ref.icdr), mRow('dme', t(i.dme ? 'yes' : 'no'), t(ref.dme ? 'yes' : 'no'), i.dme === ref.dme));
    rows.push(mRow('dec', t(`decision.${derivedReferral(i)}`), t(`decision.${referralOf(ref)}`), derivedReferral(i) === referralOf(ref)));
    block('dl-cmp', h('p', { class: 'kicker' }, t('duel.cmp.t')), h('div', { class: 'table-wrap' }, h('table', { class: 'ledger cmp-t' }, h('thead', null, h('tr', null, h('th', null), h('th', null, t('duel.cmp.you')), h('th', null, t('duel.cmp.ref')), h('th', null))), h('tbody', null, rows))));
    // meaning
    const cat = r.category;
    const hints = [];
    if (cat === 'FN') { const L = c.lesions.filter((l) => l.type !== 'artifact'); const types = [...new Set(L.map((l) => t(`les.${l.type}`)))].join(', '); hints.push(t('duel.hint.fn', { n: L.length, types, far: L.filter((l) => l.ddFromMacula > 3).length })); }
    if (cat === 'FP') { if (c.lesions.some((l) => l.type === 'artifact')) hints.push(t('duel.hint.fp.art')); else if (ref.icdr === 1) hints.push(t('duel.hint.fp.mild')); }
    if (r.gradeError > 0) hints.push(t('duel.hint.grade', { d: r.gradeError, dir: t(i.grade > ref.icdr ? 'duel.hint.above' : 'duel.hint.below') }));
    if (c.trap) hints.push(t('duel.hint.trap', { trap: t(`duel.trap.${c.trap}`) }));
    const bad = ['FN', 'UG-overcall'].includes(cat); const mid = ['FP', 'UG-missed'].includes(cat);
    block('dl-mean', h('p', { class: 'kicker' }, t('duel.meaning.k')), h('h3', { class: ['h2', 'dl-cat', bad ? 'bad' : mid ? 'mid' : 'ok'] }, t(`duel.cat.${cat}`)), h('p', null, t(`duel.cat.${cat}.b`)), hints.length ? h('ul', { class: 'hints' }, hints.map((x) => h('li', { class: 'small' }, x))) : null, h('p', { class: 'small muted' }, t('duel.single')));
    // record
    const stat = learnerStats();
    const kv = (k, v, sub) => h('div', { class: 'rk' }, h('span', { class: 'kicker' }, t(`duel.rec.${k}`)), h('b', { class: 'num rk-v' }, v), sub ? h('span', { class: 'small muted num' }, sub) : null);
    const ci = (x) => (x.lo === null ? '' : `95% CI ${fmtPct(x.lo)}–${fmtPct(x.hi)}`);
    const nextId = CASE_IDS.find((id) => !state().duels[id] && id !== caseId) || null;
    block('dl-rec', h('p', { class: 'kicker' }, t('duel.rec.t')), h('span', { class: 'prov prov-learner' }, 'Educational'),
      h('div', { class: 'rec-grid' }, kv('n', String(stat.n), stat.practice ? `${t('duel.rec.practice')}: ${stat.practice}` : ''), kv('acc', fmtPct(stat.referralAccuracy)), kv('sens', fmtPct(stat.sensitivity), `n=${stat.counts.TP + stat.counts.FN} ${ci(stat.sensCI)}`), kv('spec', fmtPct(stat.specificity), `n=${stat.counts.TN + stat.counts.FP} ${ci(stat.specCI)}`),
        kv('exact', fmtPct(stat.exactGrade)), kv('err', stat.meanGradeError === null ? '—' : fmtNum(stat.meanGradeError, 2)), kv('fn', String(stat.counts.FN)), kv('ug', fmtPct(stat.ungradableRecognised))),
      h('div', { class: 'note' }, ic('info'), h('span', null, t('duel.rec.caveat'))),
      h('div', { class: 'dl-actions' }, nextId ? btn(t('duel.next'), { icon: 'arrow', variant: 'solid', on: () => onCase(nextId, 'duel') }) : h('p', { class: 'small' }, t('duel.alldone')),
        btn(t('duel.review'), { icon: 'arrow', variant: 'quiet', on: () => onNav('quality') }), h('a', { class: 'btn btn-quiet', href: '#/lab/errors' }, h('span', { class: 'btn-label' }, t('duel.toLab')), ic('arrow', 14))));

    right.replaceChildren(...seq);
    seats.you.textContent = decisionText(r.interp);
    const refSeat = () => { seats.ref.textContent = ref.gradable ? `${t(`decision.${referralOf(ref)}`)} · ${ref.icdr}${ref.dme ? ' + DME' : ''}` : t('decision.ungradable'); };
    if (!animate || reduced) { seq.forEach((b) => b.classList.add('in')); refSeat(); setStep(8); return; }
    // staged reveal: one layer at a time
    seq.forEach((b) => b.classList.remove('in'));
    const delays = [0, 750, 1550, 2700, 3500, 4300];
    seq.forEach((b, k) => timers.push(setTimeout(() => {
      if (dead) return;
      b.classList.add('in'); setStep(Math.min(8, 3 + k));
      if (k === 2) refSeat();
      if (k === 0) announce(t('duel.locked'));
    }, delays[k])));
    timers.push(setTimeout(() => setStep(8), 4400));
  }

  return {
    start(animate) { rec ? revealed(rec, animate) : form(); },
    destroy() { dead = true; timers.forEach(clearTimeout); viewer?.destroy(); },
  };
}
