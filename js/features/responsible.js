// Supporting: Responsible AI — intended use, limits, safeguards, and the path to responsible clinical integration.
import { register, t } from '../i18n.js';
import { h, ic } from '../ui.js';

export const titleKey = 'nav.responsible';

register({
  en: {
    'ra.kicker': 'Supporting · Responsible AI', 'ra.title': 'What this is for — and what it must never be used for.',
    'ra.lede': 'A diagnostic tool is judged by its worst errors, not its best demo. This page states the intended use, the limits, the safeguards built into this prototype, and the evidence that would be needed before any clinical integration.',
    'ra.use.t': 'Intended use', 'ra.use.b': 'Education and research method demonstration by students: how to read retinal images for referable diabetic retinopathy, how diagnostic accuracy is measured, and why errors matter.',
    'ra.not.t': 'Not intended for', 'ra.not.1': 'Diagnosing, screening or advising any real person.', 'ra.not.2': 'Use with real patient images or identifiers — upload is deliberately absent.', 'ra.not.3': 'Claiming that AI improves clinician accuracy: this project provides no such evidence.', 'ra.not.4': 'Any regulatory, clinical-governance or commercial purpose.',
    'ra.status.t': 'Honest status', 'ra.status.1': 'Research model', 'ra.status.1.v': 'Not implemented', 'ra.status.2': 'Evaluation on real held-out data', 'ra.status.2.v': 'Not performed — engine ready for a file you supply', 'ra.status.3': 'Case images', 'ra.status.3.v': 'Synthetic teaching illustrations', 'ra.status.4': 'Reference labels', 'ra.status.4.v': 'Authored from each case’s lesion list (ICDR); not an expert panel', 'ra.status.5': 'Duel score', 'ra.status.5.v': 'Educational only; not validated performance',
    'ra.safe.t': 'Safeguards built in', 'ra.safe.1': 'Human in the loop: the disposition is chosen and approved by a person; nothing is auto-decided.', 'ra.safe.2': 'Blind-first Duel: your reading is locked before any reference is shown, and practice-only cases are excluded from your score.', 'ra.safe.3': 'Five-way provenance: model output, reference label, reference annotations, clinician interpretation and final disposition are never merged.',
    'ra.safe.4': 'No fabrication: no invented model confidence, no simulated scanning animation, no pre-baked performance numbers; empty states say “not implemented”.', 'ra.safe.5': 'No-result pathway: unsuitable images produce no grade and a recapture / in-person action.', 'ra.safe.6': 'Leakage control: held-out files are refused when a patient spans partitions; thresholds are chosen on validation data only.',
    'ra.safe.7': 'Privacy by design: no accounts, analytics or uploads; local-only records; identifier scanning on every free-text field that can leave the page.', 'ra.safe.8': 'Bilingual clarity: Arabic and English carry the same caveats. The Arabic text has not yet been proof-read by a clinical translator.',
    'ra.risk.t': 'Risks and how this prototype addresses them', 'ra.risk.col.r': 'Risk', 'ra.risk.col.m': 'Mitigation here', 'ra.risk.col.g': 'What would still be needed',
    'ra.r1': 'False negatives', 'ra.r1.m': 'Duel highlights FN consequences; the Lab reports FN counts and lists them.', 'ra.r1.g': 'Prospective sensitivity target with confidence intervals; safety-net re-screening.',
    'ra.r2': 'Automation bias', 'ra.r2.m': 'No score is ever shown to anchor the reader; Duel is blind first.', 'ra.r2.g': 'A controlled reader study — not assumed.',
    'ra.r3': 'Dataset and population bias', 'ra.r3.m': 'Dataset page lists pigmentation, camera and prevalence shift; fundus pigmentation varies in the teaching set.', 'ra.r3.g': 'Subgroup performance on representative local data.',
    'ra.r4': 'Over-claiming', 'ra.r4.m': 'Provenance chips on every number; simulator stamped “simulation”.', 'ra.r4.g': 'Independent review of every public claim.',
    'ra.r5': 'Privacy', 'ra.r5.m': 'Local-only; identifier scanner; synthetic cases.', 'ra.r5.g': 'Health-data law compliance, governance and security review before any real data.',
    'ra.r6': 'Poor image quality', 'ra.r6.m': 'Measured quality indicators and a no-result pathway.', 'ra.r6.g': 'Validated gradability criteria and a trained model that can abstain.',
    'ra.path.t': 'Responsible clinical integration — the path', 'ra.path.1': 'Retrospective validation on a locally representative, patient-split dataset with a pre-registered threshold.', 'ra.path.2': 'Silent prospective evaluation: the model runs, no one sees it, errors are logged.', 'ra.path.3': 'Assisted reading in a controlled study with clinicians, measuring accuracy, time and automation bias.', 'ra.path.4': 'Regulated deployment with monitoring for drift, subgroup performance and incident review.',
    'ra.path.note': 'This prototype stops before step 1.',
  },
  ar: {
    'ra.kicker': 'داعم · الذكاء الاصطناعي المسؤول', 'ra.title': 'لماذا وُجد هذا — وما يجب ألا يُستخدم له أبدًا.',
    'ra.lede': 'تُقاس الأداة التشخيصية بأسوأ أخطائها لا بأفضل عروضها. تعرض هذه الصفحة الاستخدام المقصود والحدود والضمانات المبنية في هذا النموذج والأدلة اللازمة قبل أي دمج سريري.',
    'ra.use.t': 'الاستخدام المقصود', 'ra.use.b': 'التعليم وعرض المنهج البحثي من الطلبة: كيف تُقرأ صور الشبكية لاعتلال الشبكية السكري المستوجب للإحالة، وكيف تُقاس الدقة التشخيصية، ولماذا تهم الأخطاء.',
    'ra.not.t': 'غير مقصود للاستخدام في', 'ra.not.1': 'تشخيص أي شخص حقيقي أو فرزه أو إسداء النصح له.', 'ra.not.2': 'الاستخدام مع صور مرضى حقيقية أو معرّفات — وقد غاب الرفع عمدًا.', 'ra.not.3': 'الادعاء بأن الذكاء الاصطناعي يحسّن دقة الأطباء: لا يقدم هذا المشروع أي دليل على ذلك.', 'ra.not.4': 'أي غرض تنظيمي أو حوكمة سريرية أو تجاري.',
    'ra.status.t': 'الحالة بصدق', 'ra.status.1': 'النموذج البحثي', 'ra.status.1.v': 'غير منفَّذ', 'ra.status.2': 'التقييم على بيانات حقيقية محجوبة', 'ra.status.2.v': 'لم يُجرَ — والمحرك جاهز لملف تقدمه أنت', 'ra.status.3': 'صور الحالات', 'ra.status.3.v': 'رسوم تعليمية اصطناعية', 'ra.status.4': 'التسميات المرجعية', 'ra.status.4.v': 'مؤلَّفة من قائمة آفات كل حالة (ICDR)؛ وليست لجنة خبراء', 'ra.status.5': 'درجة المبارزة', 'ra.status.5.v': 'تعليمية فقط؛ وليست أداءً مُصادَقًا عليه',
    'ra.safe.t': 'الضمانات المبنية', 'ra.safe.1': 'الإنسان في الحلقة: يختار شخص القرار ويعتمده؛ ولا شيء يُقرَّر آليًا.', 'ra.safe.2': 'مبارزة بالعمى أولًا: تُقفل قراءتك قبل إظهار أي مرجع، وتُستبعد حالات التدريب من درجتك.', 'ra.safe.3': 'مصدر خماسي: لا تُدمج أبدًا مخرجات النموذج والتسمية المرجعية والتعليقات المرجعية وتفسير الطبيب والقرار النهائي.',
    'ra.safe.4': 'لا اختلاق: لا ثقة نموذج مُخترعة ولا رسوم فحص محاكاة ولا أرقام أداء جاهزة؛ والحالات الفارغة تقول «غير منفَّذ».', 'ra.safe.5': 'مسار «لا نتيجة»: الصور غير الصالحة لا تنتج درجة بل إجراء إعادة تصوير / فحص حضوري.', 'ra.safe.6': 'ضبط التسرب: تُرفض الملفات المحجوبة عندما يمتد مريض عبر أجزاء؛ وتُختار العتبات على بيانات التحقق فقط.',
    'ra.safe.7': 'الخصوصية بالتصميم: لا حسابات ولا تحليلات ولا رفع؛ سجلات محلية فقط؛ وفحص معرّفات في كل حقل نص حر يمكن أن يغادر الصفحة.', 'ra.safe.8': 'وضوح ثنائي اللغة: تحمل العربية والإنجليزية التحفظات نفسها. ولم يُدقَّق النص العربي بعد من مترجم سريري.',
    'ra.risk.t': 'المخاطر وكيف يعالجها هذا النموذج', 'ra.risk.col.r': 'الخطر', 'ra.risk.col.m': 'المعالجة هنا', 'ra.risk.col.g': 'ما سيظل لازمًا',
    'ra.r1': 'السلبيات الكاذبة', 'ra.r1.m': 'تُبرز المبارزة عواقب السلبيات الكاذبة؛ ويبلغ المختبر عن أعدادها ويسردها.', 'ra.r1.g': 'هدف حساسية استباقي مع فواصل ثقة؛ وإعادة فرز كشبكة أمان.',
    'ra.r2': 'التحيز للأتمتة', 'ra.r2.m': 'لا تُعرض أي درجة لترسيخ رأي القارئ؛ والمبارزة بالعمى أولًا.', 'ra.r2.g': 'دراسة قراء مضبوطة — لا تُفترض.',
    'ra.r3': 'تحيز البيانات والسكان', 'ra.r3.m': 'تسرد صفحة البيانات انزياح التصبغ والكاميرا والشيوع؛ ويتفاوت تصبغ قاع العين في المجموعة التعليمية.', 'ra.r3.g': 'أداء المجموعات الفرعية على بيانات محلية ممثِّلة.',
    'ra.r4': 'المبالغة في الادعاء', 'ra.r4.m': 'شارات مصدر على كل رقم؛ والمحاكي مختوم «محاكاة».', 'ra.r4.g': 'مراجعة مستقلة لكل ادعاء عام.',
    'ra.r5': 'الخصوصية', 'ra.r5.m': 'محلي فقط؛ ماسح معرّفات؛ حالات اصطناعية.', 'ra.r5.g': 'الامتثال لقانون البيانات الصحية والحوكمة والمراجعة الأمنية قبل أي بيانات حقيقية.',
    'ra.r6': 'رداءة جودة الصورة', 'ra.r6.m': 'مؤشرات جودة مقاسة ومسار «لا نتيجة».', 'ra.r6.g': 'معايير صلاحية مُصادَقة ونموذج مدرَّب يستطيع الامتناع.',
    'ra.path.t': 'الدمج السريري المسؤول — المسار', 'ra.path.1': 'تحقق راجع على مجموعة بيانات محلية ممثِّلة مقسَّمة على مستوى المريض بعتبة مسجَّلة مسبقًا.', 'ra.path.2': 'تقييم استباقي صامت: يعمل النموذج ولا يراه أحد وتُسجَّل الأخطاء.', 'ra.path.3': 'قراءة مدعومة في دراسة مضبوطة مع الأطباء تقيس الدقة والزمن والتحيز للأتمتة.', 'ra.path.4': 'نشر منظَّم مع مراقبة للانجراف وأداء المجموعات الفرعية ومراجعة الحوادث.',
    'ra.path.note': 'يتوقف هذا النموذج قبل الخطوة ١.',
  },
});

export function mount(root) {
  const li = (arr) => h('ul', { class: 'check-list' }, arr.map((x) => h('li', null, ic('check', 14), h('span', null, x))));
  const cross = (arr) => h('ul', { class: 'check-list x' }, arr.map((x) => h('li', null, ic('cross', 14), h('span', null, x))));
  root.append(h('div', { class: 'page ra' },
    h('header', { class: 'page-head' }, h('p', { class: 'kicker' }, t('ra.kicker')), h('h1', { class: 'h1' }, t('ra.title')), h('p', { class: 'lede' }, t('ra.lede'))),
    h('div', { class: 'ra-two' },
      h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('ra.use.t')), h('p', { class: 'prose' }, t('ra.use.b'))),
      h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('ra.not.t')), cross([1, 2, 3, 4].map((n) => t(`ra.not.${n}`))))),
    h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('ra.status.t')), h('dl', { class: 'status-dl' }, [1, 2, 3, 4, 5].flatMap((n) => [h('dt', null, t(`ra.status.${n}`)), h('dd', null, h('span', { class: ['chip', n === 1 || n === 2 ? 'chip-brick' : 'chip-teal'] }, t(`ra.status.${n}.v`)))]))),
    h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('ra.safe.t')), li([1, 2, 3, 4, 5, 6, 7, 8].map((n) => t(`ra.safe.${n}`)))),
    h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('ra.risk.t')), h('div', { class: 'table-wrap' }, h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null, t('ra.risk.col.r')), h('th', null, t('ra.risk.col.m')), h('th', null, t('ra.risk.col.g')))),
      h('tbody', null, [1, 2, 3, 4, 5, 6].map((n) => h('tr', null, h('td', null, h('b', null, t(`ra.r${n}`))), h('td', { class: 'small' }, t(`ra.r${n}.m`)), h('td', { class: 'small' }, t(`ra.r${n}.g`)))))))),
    h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('ra.path.t')), h('ol', { class: 'path-list' }, [1, 2, 3, 4].map((n) => h('li', null, h('span', { class: 'pn' }, `0${n}`), h('span', null, t(`ra.path.${n}`))))), h('p', { class: 'note note-warn' }, ic('flag'), h('b', null, t('ra.path.note'))))));
}
