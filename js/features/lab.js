// C — Accuracy Laboratory. Real statistics on held-out predictions YOU supply; a clearly labelled simulator otherwise.
// Real, simulated and learner data are never drawn in the same panel.
import { BRAND } from '../brand.js';
import { register, t, getLang, fmtPct, fmtNum, fmtDate } from '../i18n.js';
import { h, ic, btn, chip, download, csvCell, $ } from '../ui.js';
import { DATASET, CASE_IDS, getCase } from '../data/cases.js';
import { state, learnerStats } from '../store.js';
import { analysis, thumbnail } from '../render.js';
import { confusion, rates, auc, rocPoints, evaluateHeldOut, selectThreshold, parsePredictions, simulateScores, predictiveValues } from '../lib/metrics.js';
import { confusionMatrix, rocChart, histChart, thresholdCurves, rateBars } from './charts.js';
import { navigate } from '../main.js';
import './shared.js';
import './duel.js';
import './workbench.js'; // register shared strings

export const titleKey = 'nav.lab';

register({
  en: {
    'lab.kicker': 'C — Accuracy Laboratory', 'lab.title': 'How accurate is the reading — measured, not claimed.',
    'lab.lede': 'A research workspace for evaluating diagnostic accuracy. It computes exact statistics from held-out predictions you provide, and never mixes them with simulations or with your own Duel record.',
    'lab.legend.real': 'Real held-out predictions (your file)', 'lab.legend.sim': 'Educational simulation (synthetic)', 'lab.legend.learner': 'Your Duel record (educational)',
    'lab.tab.status': 'Evaluation status', 'lab.tab.evaluate': 'Evaluate', 'lab.tab.thresholds': 'Thresholds', 'lab.tab.errors': 'Error cases', 'lab.tab.simulator': 'Simulator', 'lab.tab.dataset': 'Dataset & limits',
    // status
    'st.h': 'No research model has been evaluated.', 'st.b': 'This prototype contains no trained model, no labelled evaluation dataset and no compute environment. No sensitivity, specificity or confusion matrix here is a model result — unless you load a held-out predictions file, in which case the numbers carry that file’s provenance and nothing else.',
    'st.proto': 'Evaluation protocol — status', 'st.step': 'Step', 'st.state': 'State', 'st.note': 'Note',
    'st.s.done': 'Done', 'st.s.spec': 'Specified only', 'st.s.todo': 'Not done',
    'st.p1': 'Task defined', 'st.p1.n': 'Referable DR = ICDR moderate NPDR or worse, or suspected DME; ungradable images handled as a separate outcome.',
    'st.p2': 'Dataset acquired, licence verified', 'st.p2.n': 'No dataset has been downloaded. Candidates are listed under Dataset & limits.',
    'st.p3': 'Patient-level split manifest', 'st.p3.n': 'Cannot exist without a dataset. The Evaluate tab will refuse files where a patient spans partitions.',
    'st.p4': 'Preprocessing documented', 'st.p4.n': 'Specified in docs/EVALUATION_PROTOCOL.md (crop to field, resize, green-channel contrast). Not run.',
    'st.p5': 'Model trained (transfer learning)', 'st.p5.n': 'Not trained. A documented ImageNet-pretrained CNN with a binary head is the specified approach.',
    'st.p6': 'Threshold fixed on validation data only', 'st.p6.n': 'Implemented in the statistics engine (and unit-tested); not exercised on real data.',
    'st.p7': 'Test partition evaluated once', 'st.p7.n': 'The Evaluate tab counts test evaluations so repeated peeking is visible.',
    'st.p8': 'External validation', 'st.p8.n': 'Not done. Required before any claim about generalisation.',
    'st.impl.t': 'What is implemented', 'st.impl.1': 'Confusion matrix, sensitivity, specificity, PPV, NPV, accuracy, AUC and Wilson 95 % intervals — unit-tested against hand-checked tables.',
    'st.impl.2': 'Held-out import with patient-level leakage, duplicate and split checks that block reporting.', 'st.impl.3': 'Threshold selection on validation data only, applied once to the test partition.', 'st.impl.4': 'An educational simulator, labelled as such.',
    'st.prov.t': 'Evaluation provenance', 'st.prov.none': 'No evaluation loaded.', 'st.go.eval': 'Import held-out predictions', 'st.go.sim': 'Open the simulator',
    // evaluate
    'ev.h': 'Evaluate held-out predictions', 'ev.b': 'Load a CSV or JSON file of model scores on images the model never saw in training. The app fixes the threshold on the validation partition and reports the test partition.',
    'ev.drop': 'Drop a .csv or .json file here, or choose one', 'ev.choose': 'Choose file', 'ev.fmt': 'Expected columns', 'ev.fmt.b': 'id, patient_id, split (train | val | test), reference (1 = referable, 0 = not), score (0–1, higher = more likely referable).',
    'ev.template': 'Download blank template', 'ev.meta': 'Provenance you declare', 'ev.meta.model': 'Model (name, architecture, version)', 'ev.meta.data': 'Dataset (name, licence)', 'ev.meta.split': 'How the split was made', 'ev.meta.note': 'Self-reported — this app cannot verify it.',
    'ev.strategy': 'Threshold rule (applied on validation data)', 'ev.s.youden': 'Maximise sensitivity + specificity − 1', 'ev.s.sens': 'Highest specificity with sensitivity ≥ target', 'ev.target': 'Target sensitivity',
    'ev.integrity': 'Integrity checks', 'ev.blocked': 'Reporting blocked. Fix the errors below and reload the file.', 'ev.ok': 'Checks passed.',
    'ev.sizes': 'Partition sizes', 'ev.split.train': 'Train', 'ev.split.val': 'Validation', 'ev.split.test': 'Test', 'ev.prev': 'Referable share',
    'ev.thr': 'Operating threshold', 'ev.thr.b': 'Chosen on {src} data: sensitivity {s}, specificity {p} there. Fixed before the test partition was scored.',
    'ev.result': 'Held-out test result', 'ev.tests': 'Test evaluations this session: {n}', 'ev.export': 'Export provenance record (JSON)', 'ev.clear': 'Clear loaded data',
    'ev.real': 'Real — computed from your uploaded predictions', 'ev.hash': 'SHA-256 of the file',
    'iss.unknown-split': '{n} row(s) have a split that is not train / val / test.', 'iss.duplicate-id': '{n} duplicated image id(s).', 'iss.no-patient-ids': 'No patient ids: patient-level leakage CANNOT be ruled out. Results are image-level only.', 'iss.some-patient-ids-missing': '{n} row(s) lack a patient id.',
    'iss.patient-leakage': '{n} patient(s) appear in more than one partition (e.g. {ex}). This is data leakage — results would be optimistic.', 'iss.score-out-of-range': '{n} score(s) outside 0–1.', 'iss.bad-reference': '{n} reference label(s) are not 0 or 1.',
    'iss.no-test-split': 'There is no test partition.', 'iss.no-dev-split': 'There is no validation or train partition to choose a threshold on.', 'iss.threshold-from-train': 'No validation partition: the threshold was chosen on training data, which is optimistic.', 'iss.single-class-split': 'The {split} partition contains only one class.',
    'ev.err.parse': 'Could not read that file: {why}',
    // thresholds
    'th.h': 'Threshold exploration', 'th.empty': 'Load held-out predictions in the Evaluate tab to explore real thresholds — or use the simulator to learn the principles.', 'th.part': 'Partition shown', 'th.dev': 'Validation (selection)', 'th.test': 'Test (exploration only)',
    'th.warn': 'You are looking at the TEST partition at a threshold you chose by eye. That is exploration, not evaluation: the only reportable test result is the one at the validation-selected threshold.', 'th.value': 'Threshold', 'th.reportable': 'Validation-selected threshold: {v}', 'th.snap': 'Snap to selected', 'th.table': 'Reference thresholds',
    // errors
    'er.h': 'Error-case inspection', 'er.model.t': 'Held-out model errors', 'er.model.none': 'No held-out evaluation loaded, so there are no model errors to inspect. (None are invented.)', 'er.fn': 'False negatives — referable cases the model scored below the threshold', 'er.fp': 'False positives — non-referable cases scored at or above it', 'er.id': 'Image id', 'er.score': 'Score', 'er.patient': 'Patient', 'er.open': 'Open in EvidenceLens', 'er.noimg': 'Image not in this app', 'er.fn.why': 'False negatives are the safety-critical errors: disease sent home as normal.', 'er.fp.why': 'False positives cost specialist time and cause worry; they are the usual price of a sensitive screen.',
    'er.learner.t': 'Your Duel errors (educational)', 'er.learner.none': 'No errors yet — or no completed Duel cases. Complete cases in the Diagnostic Workbench.', 'er.learner.b': 'These compare YOU with the authored reference. They are not model errors.', 'er.you': 'You', 'er.ref': 'Reference',
    // simulator
    'sim.banner': 'EDUCATIONAL SIMULATION', 'sim.banner.b': 'Scores are random draws from two bell curves. This is not a model, not a dataset and not a finding. Use it to see how prevalence, separation, threshold and sample size shape the statistics.',
    'sim.prev': 'Prevalence of referable disease', 'sim.n': 'Number of simulated cases', 'sim.d': 'Separation between classes (d′)', 'sim.thr': 'Decision threshold', 'sim.new': 'Draw a new sample', 'sim.seed': 'Sample #{n}',
    'sim.pv.t': 'Why screening PPV is low', 'sim.pv.b': 'Same sensitivity and specificity, different prevalence. When disease is rare, most positives are false alarms.', 'sim.pv.at': 'At prevalence {p}: PPV {ppv}, NPV {npv}',
    'sim.l1': 'Raising the threshold trades sensitivity for specificity — it never improves both.', 'sim.l2': 'PPV depends on prevalence; sensitivity and specificity do not.', 'sim.l3': 'Small samples give wide intervals: a result from 30 cases says little.',
    'lab.stamp': 'SIMULATION', 'lab.sim.stamp': 'SIMULATION',
    // dataset
    'ds.h': 'Dataset, provenance and limitations', 'ds.teach.t': 'Teaching set in this prototype', 'ds.id': 'Identifier', 'ds.kind': 'Kind', 'ds.size': 'Cases', 'ds.task': 'Task', 'ds.ref': 'Reference standard', 'ds.patient': 'Patient-level grouping', 'ds.comp': 'Composition',
    'ds.kind.v': 'Synthetic teaching illustrations drawn by code — not patient images', 'ds.patient.v': 'Not applicable (no patients)', 'ds.comp.v': '{a} referable · {b} non-referable · {c} ungradable',
    'ds.cand.t': 'Candidate public research datasets', 'ds.cand.b': 'Described as publicly documented; sizes are approximate. Nothing has been downloaded. Check each licence and terms before use.',
    'ds.col.name': 'Dataset', 'ds.col.size': 'Size', 'ds.col.labels': 'Labels', 'ds.col.group': 'Patient grouping', 'ds.col.note': 'Leakage note',
    'ds.aptos': 'APTOS 2019 (Aravind, Kaggle)', 'ds.aptos.s': '≈ 3.7 k labelled images', 'ds.aptos.l': '5-level DR grade', 'ds.aptos.g': 'No patient id published', 'ds.aptos.n': 'Only image-level splits are possible; patient-level leakage cannot be controlled.',
    'ds.eyepacs': 'EyePACS (Kaggle DR 2015)', 'ds.eyepacs.s': '≈ 35 k training images', 'ds.eyepacs.l': '5-level DR grade', 'ds.eyepacs.g': 'Patient and eye in file name', 'ds.eyepacs.n': 'Group by patient (left/right eyes share one patient) before splitting.',
    'ds.mess': 'Messidor-2', 'ds.mess.s': '≈ 1.7 k images, paired eyes', 'ds.mess.l': 'DR grade, DME risk (grades published separately)', 'ds.mess.g': 'Paired images per subject', 'ds.mess.n': 'Keep both eyes of a subject in the same partition.',
    'ds.idrid': 'IDRiD', 'ds.idrid.s': '≈ 0.5 k images', 'ds.idrid.l': 'DR + DME grades; pixel-level lesion masks on a subset', 'ds.idrid.g': 'Not specified for splitting', 'ds.idrid.n': 'Small; useful for lesion-level evaluation, not for a stand-alone accuracy claim.',
    'ds.lim.t': 'Limitations a real model would carry', 'ds.lim.1': 'Domain shift: a model trained on one camera or clinic may fail on another.', 'ds.lim.2': 'Population shift: pigmentation, age and co-morbidity differ between datasets and sites.', 'ds.lim.3': 'Prevalence shift: PPV changes with the screened population even if sensitivity does not.', 'ds.lim.4': 'Reference-label noise: expert graders disagree; the “truth” is itself uncertain.',
    'ds.lim.5': 'Ungradable images: a model must be able to return “no result”; forcing a grade is unsafe.', 'ds.lim.6': 'Automation bias: clinicians may over-trust a displayed score. This must be studied, not assumed away.', 'ds.lim.7': 'Calibration: a score of 0.8 does not mean 80 % unless calibration is checked.', 'ds.lim.8': 'No evidence from this project that AI improves clinician diagnostic accuracy.',
    'ds.prov.t': 'Evaluation provenance of this site', 'ds.prov.b': 'Statistics engine: js/lib/metrics.js · version {v} · unit-tested. Protocol: docs/EVALUATION_PROTOCOL.md. Teaching images: js/lib/fundus.js + fundus-paint.js (deterministic; seeds in js/data/cases.js).',
    'lab.cm': 'Confusion matrix', 'lab.cm.pred.pos': 'Predicted referable', 'lab.cm.pred.neg': 'Predicted non-referable', 'lab.cm.ref.pos': 'Reference: referable', 'lab.cm.ref.neg': 'Reference: non-referable', 'lab.cm.tp': 'true positive', 'lab.cm.fn': 'false negative', 'lab.cm.fp': 'false positive', 'lab.cm.tn': 'true negative',
    'lab.sens': 'Sensitivity', 'lab.spec': 'Specificity', 'lab.ppv': 'PPV', 'lab.npv': 'NPV', 'lab.acc': 'Accuracy', 'lab.bal': 'Balanced accuracy', 'lab.roc': 'ROC curve', 'lab.hist': 'Score distribution', 'lab.tcurve': 'Sensitivity and specificity by threshold',
    'lab.back': 'Back',
  },
  ar: {
    'lab.kicker': 'ج — مختبر الدقة', 'lab.title': 'ما مدى دقة القراءة — مقيسة لا مُدَّعاة.',
    'lab.lede': 'مساحة بحثية لتقييم الدقة التشخيصية. تحسب إحصاءات دقيقة من تنبؤات محجوبة تقدمها أنت، ولا تخلطها أبدًا بالمحاكاة أو بسجل مبارزتك.',
    'lab.legend.real': 'تنبؤات حقيقية محجوبة (ملفك)', 'lab.legend.sim': 'محاكاة تعليمية (اصطناعية)', 'lab.legend.learner': 'سجل مبارزتك (تعليمي)',
    'lab.tab.status': 'حالة التقييم', 'lab.tab.evaluate': 'التقييم', 'lab.tab.thresholds': 'العتبات', 'lab.tab.errors': 'حالات الخطأ', 'lab.tab.simulator': 'المحاكي', 'lab.tab.dataset': 'البيانات والحدود',
    'st.h': 'لم يُقيَّم أي نموذج بحثي.', 'st.b': 'لا يحتوي هذا النموذج الأولي على نموذج مدرَّب ولا مجموعة بيانات تقييم موسومة ولا بيئة حوسبة. لا حساسية ولا نوعية ولا مصفوفة التباس هنا هي نتيجة نموذج — إلا إذا حمّلت ملف تنبؤات محجوبًا، وعندئذ تحمل الأرقام مصدر ذلك الملف وحده.',
    'st.proto': 'بروتوكول التقييم — الحالة', 'st.step': 'الخطوة', 'st.state': 'الحالة', 'st.note': 'ملاحظة',
    'st.s.done': 'تم', 'st.s.spec': 'محدَّد فقط', 'st.s.todo': 'لم يتم',
    'st.p1': 'تعريف المهمة', 'st.p1.n': 'المستوجب للإحالة = اعتلال غير تكاثري متوسط (ICDR) فأشد، أو اشتباه وذمة بقعية؛ وتُعامل الصور غير القابلة للتدريج كنتيجة منفصلة.',
    'st.p2': 'الحصول على مجموعة بيانات والتحقق من الترخيص', 'st.p2.n': 'لم تُنزَّل أي مجموعة بيانات. المرشحة مدرجة في «البيانات والحدود».',
    'st.p3': 'بيان تقسيم على مستوى المريض', 'st.p3.n': 'لا يمكن أن يوجد دون بيانات. سيرفض تبويب التقييم الملفات التي يمتد فيها المريض عبر أجزاء.',
    'st.p4': 'توثيق المعالجة المسبقة', 'st.p4.n': 'محدَّدة في docs/EVALUATION_PROTOCOL.md (قص المجال، تغيير الحجم، تباين القناة الخضراء). لم تُنفَّذ.',
    'st.p5': 'تدريب النموذج (نقل التعلم)', 'st.p5.n': 'لم يُدرَّب. المنهج المحدد شبكة التفافية مدرَّبة مسبقًا على ImageNet برأس ثنائي.',
    'st.p6': 'تثبيت العتبة على بيانات التحقق فقط', 'st.p6.n': 'منفَّذ في محرك الإحصاء (ومختبَر بالوحدات)؛ لم يُستخدم على بيانات حقيقية.',
    'st.p7': 'تقييم جزء الاختبار مرة واحدة', 'st.p7.n': 'يحسب تبويب التقييم عدد مرات تقييم الاختبار ليظهر التلصص المتكرر.',
    'st.p8': 'تحقق خارجي', 'st.p8.n': 'لم يتم. مطلوب قبل أي ادعاء بالتعميم.',
    'st.impl.t': 'ما المنفَّذ فعلًا', 'st.impl.1': 'مصفوفة الالتباس والحساسية والنوعية وPPV وNPV والدقة وAUC وفواصل ويلسون ٩٥٪ — مختبَرة بالوحدات على جداول مراجَعة يدويًا.',
    'st.impl.2': 'استيراد التنبؤات المحجوبة مع فحوص تسرب على مستوى المريض والتكرار والتقسيم تمنع إصدار النتائج.', 'st.impl.3': 'اختيار العتبة على بيانات التحقق فقط وتطبيقها مرة واحدة على جزء الاختبار.', 'st.impl.4': 'محاكٍ تعليمي معنون بوضوح.',
    'st.prov.t': 'مصدر التقييم', 'st.prov.none': 'لم يُحمَّل أي تقييم.', 'st.go.eval': 'استورد تنبؤات محجوبة', 'st.go.sim': 'افتح المحاكي',
    'ev.h': 'تقييم التنبؤات المحجوبة', 'ev.b': 'حمّل ملف CSV أو JSON بدرجات نموذج على صور لم يرها النموذج في التدريب. يثبّت التطبيق العتبة على جزء التحقق ويعرض نتيجة جزء الاختبار.',
    'ev.drop': 'أفلت ملف ‎.csv أو ‎.json هنا، أو اختر ملفًا', 'ev.choose': 'اختر ملفًا', 'ev.fmt': 'الأعمدة المتوقعة', 'ev.fmt.b': 'id, patient_id, split (train | val | test), reference (1 = مستوجب للإحالة، 0 = لا), score (0–1، الأعلى = أرجح استيجابًا للإحالة).',
    'ev.template': 'نزّل قالبًا فارغًا', 'ev.meta': 'المصدر الذي تُقرّ به', 'ev.meta.model': 'النموذج (الاسم، البنية، الإصدار)', 'ev.meta.data': 'مجموعة البيانات (الاسم، الترخيص)', 'ev.meta.split': 'كيف أُجري التقسيم', 'ev.meta.note': 'إقرار ذاتي — لا يستطيع التطبيق التحقق منه.',
    'ev.strategy': 'قاعدة العتبة (على بيانات التحقق)', 'ev.s.youden': 'تعظيم الحساسية + النوعية − ١', 'ev.s.sens': 'أعلى نوعية مع حساسية ≥ الهدف', 'ev.target': 'الحساسية المستهدفة',
    'ev.integrity': 'فحوص السلامة', 'ev.blocked': 'منع إصدار النتائج. أصلح الأخطاء أدناه وأعد تحميل الملف.', 'ev.ok': 'اجتازت الفحوص.',
    'ev.sizes': 'أحجام الأجزاء', 'ev.split.train': 'تدريب', 'ev.split.val': 'تحقق', 'ev.split.test': 'اختبار', 'ev.prev': 'نسبة المستوجب للإحالة',
    'ev.thr': 'عتبة التشغيل', 'ev.thr.b': 'اختيرت على بيانات {src}: حساسية {s} ونوعية {p} فيها. ثُبّتت قبل تقييم جزء الاختبار.',
    'ev.result': 'نتيجة الاختبار المحجوب', 'ev.tests': 'تقييمات الاختبار في هذه الجلسة: {n}', 'ev.export': 'صدّر سجل المصدر (JSON)', 'ev.clear': 'امسح البيانات المحمّلة',
    'ev.real': 'حقيقي — محسوب من التنبؤات التي رفعتها', 'ev.hash': 'SHA-256 للملف',
    'iss.unknown-split': '{n} صف/صفوف بتقسيم ليس train / val / test.', 'iss.duplicate-id': '{n} معرّف صورة مكرر.', 'iss.no-patient-ids': 'لا معرّفات مرضى: لا يمكن استبعاد التسرب على مستوى المريض. النتائج على مستوى الصورة فقط.', 'iss.some-patient-ids-missing': '{n} صف/صفوف بلا معرّف مريض.',
    'iss.patient-leakage': 'يظهر {n} مريض/مرضى في أكثر من جزء (مثل {ex}). هذا تسرب بيانات — ستكون النتائج متفائلة.', 'iss.score-out-of-range': '{n} درجة خارج ٠–١.', 'iss.bad-reference': '{n} تسمية مرجعية ليست ٠ أو ١.',
    'iss.no-test-split': 'لا يوجد جزء اختبار.', 'iss.no-dev-split': 'لا يوجد جزء تحقق أو تدريب لاختيار العتبة.', 'iss.threshold-from-train': 'لا جزء تحقق: اختيرت العتبة على بيانات التدريب وهذا متفائل.', 'iss.single-class-split': 'يحتوي جزء {split} على فئة واحدة فقط.',
    'ev.err.parse': 'تعذرت قراءة الملف: {why}',
    'th.h': 'استكشاف العتبة', 'th.empty': 'حمّل تنبؤات محجوبة في تبويب التقييم لاستكشاف عتبات حقيقية — أو استخدم المحاكي لتعلّم المبادئ.', 'th.part': 'الجزء المعروض', 'th.dev': 'التحقق (للاختيار)', 'th.test': 'الاختبار (للاستكشاف فقط)',
    'th.warn': 'أنت تنظر إلى جزء الاختبار عند عتبة اخترتَها بالعين. هذا استكشاف وليس تقييمًا: النتيجة الوحيدة القابلة للإبلاغ هي عند العتبة المختارة على التحقق.', 'th.value': 'العتبة', 'th.reportable': 'العتبة المختارة على التحقق: {v}', 'th.snap': 'عُد إلى المختارة', 'th.table': 'عتبات مرجعية',
    'er.h': 'فحص حالات الخطأ', 'er.model.t': 'أخطاء النموذج على البيانات المحجوبة', 'er.model.none': 'لم يُحمَّل تقييم محجوب، فلا أخطاء نموذج لفحصها. (ولا شيء منها مُختلَق.)', 'er.fn': 'سلبيات كاذبة — حالات مستوجبة للإحالة سجّل لها النموذج أقل من العتبة', 'er.fp': 'إيجابيات كاذبة — حالات غير مستوجبة سجّل لها عند العتبة أو فوقها', 'er.id': 'معرّف الصورة', 'er.score': 'الدرجة', 'er.patient': 'المريض', 'er.open': 'افتح في عدسة الأدلة', 'er.noimg': 'الصورة ليست في هذا التطبيق', 'er.fn.why': 'السلبيات الكاذبة هي الأخطاء الحرجة للسلامة: مرض يُرسَل للبيت على أنه سليم.', 'er.fp.why': 'الإيجابيات الكاذبة تكلّف وقت الأخصائي وتسبب القلق؛ وهي الثمن المعتاد للفرز الحساس.',
    'er.learner.t': 'أخطاؤك في المبارزة (تعليمية)', 'er.learner.none': 'لا أخطاء بعد — أو لا حالات مبارزة مكتملة. أكمل حالات في منصة العمل التشخيصية.', 'er.learner.b': 'تقارن هذه بينك وبين المرجع المؤلَّف. وليست أخطاء نموذج.', 'er.you': 'أنت', 'er.ref': 'المرجع',
    'sim.banner': 'محاكاة تعليمية', 'sim.banner.b': 'الدرجات سحوبات عشوائية من منحنيين جرسيين. هذا ليس نموذجًا ولا مجموعة بيانات ولا نتيجة. استخدمه لترى كيف تشكّل الشيوع والتباعد والعتبة وحجم العينة الإحصاءات.',
    'sim.prev': 'شيوع المرض المستوجب للإحالة', 'sim.n': 'عدد الحالات المحاكاة', 'sim.d': 'التباعد بين الفئتين (d′)', 'sim.thr': 'عتبة القرار', 'sim.new': 'اسحب عينة جديدة', 'sim.seed': 'العينة رقم {n}',
    'sim.pv.t': 'لماذا تنخفض القيمة التنبؤية الإيجابية في الفرز', 'sim.pv.b': 'الحساسية والنوعية نفسهما بشيوع مختلف. عندما يندر المرض تكون معظم الإيجابيات إنذارات كاذبة.', 'sim.pv.at': 'عند شيوع {p}: PPV ‏{ppv}، NPV ‏{npv}',
    'sim.l1': 'رفع العتبة يبادل الحساسية بالنوعية — ولا يحسّنهما معًا أبدًا.', 'sim.l2': 'تعتمد PPV على الشيوع؛ ولا تعتمد الحساسية والنوعية عليه.', 'sim.l3': 'العينات الصغيرة تعطي فواصل واسعة: نتيجة من ٣٠ حالة تقول القليل.',
    'lab.stamp': 'محاكاة', 'lab.sim.stamp': 'محاكاة',
    'ds.h': 'البيانات والمصدر والحدود', 'ds.teach.t': 'مجموعة التعليم في هذا النموذج الأولي', 'ds.id': 'المعرّف', 'ds.kind': 'النوع', 'ds.size': 'الحالات', 'ds.task': 'المهمة', 'ds.ref': 'المعيار المرجعي', 'ds.patient': 'التجميع على مستوى المريض', 'ds.comp': 'التركيب',
    'ds.kind.v': 'رسوم تعليمية اصطناعية مولَّدة بالشيفرة — ليست صور مرضى', 'ds.patient.v': 'لا ينطبق (لا مرضى)', 'ds.comp.v': '{a} مستوجبة للإحالة · {b} غير مستوجبة · {c} غير قابلة للتدريج',
    'ds.cand.t': 'مجموعات بيانات بحثية عامة مرشحة', 'ds.cand.b': 'موصوفة كما هي موثقة علنًا؛ والأحجام تقريبية. لم يُنزَّل شيء. تحقق من ترخيص وشروط كل منها قبل الاستخدام.',
    'ds.col.name': 'المجموعة', 'ds.col.size': 'الحجم', 'ds.col.labels': 'التسميات', 'ds.col.group': 'تجميع المرضى', 'ds.col.note': 'ملاحظة التسرب',
    'ds.aptos': 'APTOS 2019 (أرافيند، Kaggle)', 'ds.aptos.s': '≈ ٣٫٧ ألف صورة موسومة', 'ds.aptos.l': 'درجة DR من ٥ مستويات', 'ds.aptos.g': 'لا معرّف مريض منشور', 'ds.aptos.n': 'التقسيم على مستوى الصورة فقط ممكن؛ ولا يمكن ضبط التسرب على مستوى المريض.',
    'ds.eyepacs': 'EyePACS (Kaggle DR 2015)', 'ds.eyepacs.s': '≈ ٣٥ ألف صورة تدريب', 'ds.eyepacs.l': 'درجة DR من ٥ مستويات', 'ds.eyepacs.g': 'المريض والعين في اسم الملف', 'ds.eyepacs.n': 'جمّع حسب المريض (العينان اليمنى واليسرى لمريض واحد) قبل التقسيم.',
    'ds.mess': 'Messidor-2', 'ds.mess.s': '≈ ١٫٧ ألف صورة، عينان لكل مريض', 'ds.mess.l': 'درجة DR وخطر الوذمة (الدرجات تُنشر منفصلة)', 'ds.mess.g': 'صور مزدوجة لكل شخص', 'ds.mess.n': 'أبقِ عيني الشخص الواحد في الجزء نفسه.',
    'ds.idrid': 'IDRiD', 'ds.idrid.s': '≈ ٠٫٥ ألف صورة', 'ds.idrid.l': 'درجات DR والوذمة؛ وأقنعة آفات بالبكسل لمجموعة فرعية', 'ds.idrid.g': 'غير محدد للتقسيم', 'ds.idrid.n': 'صغيرة؛ مفيدة لتقييم الآفات وليس لادعاء دقة مستقل.',
    'ds.lim.t': 'حدود سيحملها أي نموذج حقيقي', 'ds.lim.1': 'انزياح النطاق: نموذج مدرَّب على كاميرا أو عيادة قد يفشل على أخرى.', 'ds.lim.2': 'انزياح السكان: التصبغ والعمر والأمراض المصاحبة تختلف بين المجموعات والمواقع.', 'ds.lim.3': 'انزياح الشيوع: تتغير PPV بتغير السكان المفحوصين حتى لو لم تتغير الحساسية.', 'ds.lim.4': 'ضجيج التسميات المرجعية: يختلف الخبراء؛ و«الحقيقة» نفسها غير مؤكدة.',
    'ds.lim.5': 'الصور غير القابلة للتدريج: يجب أن يستطيع النموذج إرجاع «لا نتيجة»؛ وفرض درجة غير آمن.', 'ds.lim.6': 'التحيز للأتمتة: قد يبالغ الأطباء في الثقة بدرجة معروضة. يجب دراسة ذلك لا افتراض زواله.', 'ds.lim.7': 'المعايرة: الدرجة ٠٫٨ لا تعني ٨٠٪ ما لم تُفحص المعايرة.', 'ds.lim.8': 'لا دليل من هذا المشروع على أن الذكاء الاصطناعي يحسّن الدقة التشخيصية للأطباء.',
    'ds.prov.t': 'مصدر التقييم في هذا الموقع', 'ds.prov.b': 'محرك الإحصاء: js/lib/metrics.js · الإصدار {v} · مختبَر بالوحدات. البروتوكول: docs/EVALUATION_PROTOCOL.md. الصور التعليمية: js/lib/fundus.js + fundus-paint.js (حتمية؛ والبذور في js/data/cases.js).',
    'lab.cm': 'مصفوفة الالتباس', 'lab.cm.pred.pos': 'متوقَّع: مستوجب للإحالة', 'lab.cm.pred.neg': 'متوقَّع: غير مستوجب', 'lab.cm.ref.pos': 'المرجع: مستوجب', 'lab.cm.ref.neg': 'المرجع: غير مستوجب', 'lab.cm.tp': 'إيجابي حقيقي', 'lab.cm.fn': 'سلبي كاذب', 'lab.cm.fp': 'إيجابي كاذب', 'lab.cm.tn': 'سلبي حقيقي',
    'lab.sens': 'الحساسية', 'lab.spec': 'النوعية', 'lab.ppv': 'PPV', 'lab.npv': 'NPV', 'lab.acc': 'الدقة', 'lab.bal': 'الدقة المتوازنة', 'lab.roc': 'منحنى ROC', 'lab.hist': 'توزيع الدرجات', 'lab.tcurve': 'الحساسية والنوعية حسب العتبة',
    'lab.back': 'رجوع',
  },
});

const TABS = ['status', 'evaluate', 'thresholds', 'errors', 'simulator', 'dataset'];

// Session-only state (never persisted — predictions files may be large and sensitive).
const S = { data: null, strategy: 'youden', target: 0.9, meta: { model: '', data: '', split: '' }, testEvals: 0, sim: { prev: 0.2, n: 400, d: 1.8, thr: 0.5, seed: 7, count: 1 }, thPart: 'dev', thr: null };

export function mount(root, params) {
  const tab = TABS.includes(params.tab) ? params.tab : 'status';
  const body = h('div', { class: 'lab-body', id: 'lab-body' });
  const tabs = h('div', { class: 'tabs lab-tabs', role: 'tablist' }, TABS.map((k, i) => h('a', { class: 'tab', role: 'tab', href: `#/lab/${k}`, 'aria-selected': String(k === tab) }, h('span', { class: 'tn' }, `0${i + 1}`), t(`lab.tab.${k}`))));
  const legend = h('div', { class: 'lab-legend' }, h('span', { class: 'prov prov-real' }, t('lab.legend.real')), h('span', { class: 'prov prov-sim' }, t('lab.legend.sim')), h('span', { class: 'prov prov-learner' }, t('lab.legend.learner')));
  root.append(h('div', { class: 'lab' }, h('header', { class: 'lab-head' }, h('p', { class: 'kicker' }, t('lab.kicker')), h('h1', { class: 'h1' }, t('lab.title')), h('p', { class: 'lede' }, t('lab.lede')), legend), tabs, body));
  let dead = false;
  const draw = () => { body.replaceChildren(); ({ status: tabStatus, evaluate: tabEvaluate, thresholds: tabThresholds, errors: tabErrors, simulator: tabSim, dataset: tabDataset })[tab](body, draw); };
  draw();
  return () => { dead = true; void dead; };
}

const kv = (k, v) => h('div', { class: 'kvr' }, h('dt', null, k), h('dd', null, v));

// ── 01 status ─────────────────────────────────────────────────────────────────────────────────────
function tabStatus(body) {
  const steps = [['p1', 'done'], ['p2', 'todo'], ['p3', 'todo'], ['p4', 'spec'], ['p5', 'todo'], ['p6', 'spec'], ['p7', 'spec'], ['p8', 'todo']];
  const glyph = { done: 'check', spec: 'target', todo: 'cross' };
  const ev = S.data?.result;
  body.append(h('div', { class: 'st-hero' },
    h('div', { class: 'st-hero-l' }, h('span', { class: 'prov prov-none' }, t('prov.model')), h('h2', { class: 'h1' }, t('st.h')), h('p', { class: 'lede' }, t('st.b')),
      h('div', { class: 'st-go' }, btn(t('st.go.eval'), { icon: 'arrow', variant: 'solid', on: () => navigate('/lab/evaluate') }), btn(t('st.go.sim'), { icon: 'arrow', variant: 'quiet', on: () => navigate('/lab/simulator') }))),
    h('div', { class: 'st-hero-r panel ticked' }, h('p', { class: 'kicker' }, t('st.prov.t')),
      ev?.ok ? h('dl', { class: 'kvl' }, kv(t('ev.meta.model'), S.meta.model || '—'), kv(t('ev.meta.data'), S.meta.data || '—'), kv('File', S.data.name), kv(t('ev.hash'), h('span', { class: 'mono hash' }, S.data.hash.slice(0, 16) + '…')), kv(t('ev.thr'), fmtNum(ev.threshold, 3))) : h('p', { class: 'small muted' }, t('st.prov.none')))),
    h('section', { class: 'st-proto' }, h('p', { class: 'kicker' }, t('st.proto')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null, t('st.step')), h('th', null, t('st.state')), h('th', null, t('st.note')))),
        h('tbody', null, steps.map(([k, st], i) => h('tr', null, h('td', null, h('span', { class: 'num muted' }, `${i + 1}. `), h('b', null, t(`st.${k}`))), h('td', null, h('span', { class: ['pstate', `ps-${st}`] }, h('span', { class: 'ic', html: '' }), t(`st.s.${st === 'spec' ? 'spec' : st}`))), h('td', { class: 'small' }, t(`st.${k}.n`)))))))),
    h('section', { class: 'st-impl' }, h('p', { class: 'kicker' }, t('st.impl.t')), h('ul', { class: 'impl-list' }, [1, 2, 3, 4].map((n) => h('li', null, ic('check', 14), h('span', null, t(`st.impl.${n}`)))))));
  void glyph;
}

// ── 02 evaluate ───────────────────────────────────────────────────────────────────────────────────
const sha256 = async (buf) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');

function tabEvaluate(body, redraw) {
  const err = h('p', { class: 'small', role: 'alert', style: { color: 'var(--brick)' } });
  const input = h('input', { type: 'file', id: 'ev-file', accept: '.csv,.json,.txt,text/csv,application/json', class: 'sr-only', on: { change: (e) => e.target.files[0] && load(e.target.files[0]) } });
  const drop = h('label', { class: 'dropzone', for: 'ev-file' }, ic('download', 22), h('span', null, t('ev.drop')), h('span', { class: 'btn btn-sm' }, h('span', { class: 'btn-label' }, t('ev.choose'))));
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => e.dataTransfer.files[0] && load(e.dataTransfer.files[0]));

  async function load(file) {
    err.textContent = '';
    try {
      const buf = await file.arrayBuffer();
      const text = new TextDecoder().decode(buf);
      const parsed = parsePredictions(text);
      if (parsed.meta.model && !S.meta.model) S.meta.model = String(parsed.meta.model);
      if (parsed.meta.dataset && !S.meta.data) S.meta.data = String(parsed.meta.dataset);
      if (parsed.meta.split_method && !S.meta.split) S.meta.split = String(parsed.meta.split_method);
      S.data = { name: file.name, rows: parsed.rows, hash: await sha256(buf), loadedAt: Date.now() };
      S.testEvals = 0; S.thr = null;
      runEval();
      redraw();
    } catch (e) { err.textContent = t('ev.err.parse', { why: e.message }); }
  }
  function runEval() {
    if (!S.data) return;
    S.data.result = evaluateHeldOut(S.data.rows, { strategy: S.strategy, target: S.target });
    if (S.data.result.ok) S.testEvals++;
  }

  const field = (key, label) => h('div', { class: 'field' }, h('label', { for: `meta-${key}` }, label), h('input', { type: 'text', id: `meta-${key}`, value: S.meta[key], maxlength: 120, autocomplete: 'off', on: { input: (e) => { S.meta[key] = e.target.value; } } }));
  const stratSel = h('select', { id: 'strat', on: { change: (e) => { S.strategy = e.target.value; tgt.hidden = S.strategy !== 'sensitivity'; if (S.data) { runEval(); redraw(); } } } }, h('option', { value: 'youden', selected: S.strategy === 'youden' }, t('ev.s.youden')), h('option', { value: 'sensitivity', selected: S.strategy === 'sensitivity' }, t('ev.s.sens')));
  const tgtIn = h('input', { type: 'range', id: 'tgt', min: 0.8, max: 0.99, step: 0.01, value: S.target, on: { input: (e) => { S.target = Number(e.target.value); out.textContent = fmtPct(S.target); }, change: () => { if (S.data) { runEval(); redraw(); } } } });
  const out = h('output', { class: 'num' }, fmtPct(S.target));
  const tgt = h('div', { class: 'field', hidden: S.strategy !== 'sensitivity' }, h('label', { for: 'tgt' }, t('ev.target'), ' ', out), tgtIn);

  const left = h('div', { class: 'ev-left' },
    h('h2', { class: 'h2' }, t('ev.h')), h('p', { class: 'prose' }, t('ev.b')), drop, input, err,
    h('div', { class: 'note' }, ic('info'), h('div', null, h('b', null, t('ev.fmt')), h('p', { class: 'small' }, t('ev.fmt.b')), btn(t('ev.template'), { variant: 'quiet', cls: 'btn-sm', icon: 'download', on: () => download('predictions-template.csv', 'id,patient_id,split,reference,score\nexample-001,patient-A,train,1,0.91\nexample-002,patient-B,val,0,0.12\nexample-003,patient-C,test,1,0.77\n', 'text/csv') }))),
    h('fieldset', { class: 'ev-meta' }, h('legend', { class: 'kicker' }, t('ev.meta')), field('model', t('ev.meta.model')), field('data', t('ev.meta.data')), field('split', t('ev.meta.split')), h('p', { class: 'small muted' }, t('ev.meta.note'))),
    h('div', { class: 'field' }, h('label', { for: 'strat' }, t('ev.strategy')), stratSel), tgt);

  const right = h('div', { class: 'ev-right' });
  body.append(h('div', { class: 'ev-grid' }, left, right));
  if (!S.data) { right.append(h('div', { class: 'empty panel' }, h('span', { class: 'prov prov-none' }, t('lab.legend.real')), h('p', { class: 'small muted' }, t('st.prov.none')))); return; }
  const r = S.data.result;
  right.append(h('div', { class: 'ev-file' }, h('span', { class: 'prov prov-real' }, t('ev.real')), h('b', null, S.data.name), h('span', { class: 'small muted num' }, `${S.data.rows.length} rows · SHA-256 ${S.data.hash.slice(0, 12)}…`), btn(t('ev.clear'), { variant: 'quiet', cls: 'btn-sm', on: () => { S.data = null; redraw(); } })));
  right.append(integrityBlock(r.integrity));
  if (!r.ok) { right.append(h('div', { class: 'note note-brick' }, ic('lock'), h('span', null, t('ev.blocked')))); return; }
  const sz = (sp) => { const rr = S.data.rows.filter((x) => x.split === sp); return [rr.length, rr.length ? rr.filter((x) => x.reference === 1).length / rr.length : null]; };
  right.append(h('div', { class: 'panel ticked ev-sizes' }, h('p', { class: 'kicker' }, t('ev.sizes')),
    h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null), h('th', null, 'n'), h('th', null, t('ev.prev')))), h('tbody', null, ['train', 'val', 'test'].map((sp) => { const [n, p] = sz(sp); return h('tr', null, h('td', null, t(`ev.split.${sp}`)), h('td', { class: 'num' }, String(n)), h('td', { class: 'num' }, fmtPct(p, 1))); })))),
    h('div', { class: 'panel ticked' }, h('p', { class: 'kicker' }, t('ev.thr')), h('p', { class: 'ev-thr num' }, fmtNum(r.threshold, 4)), h('p', { class: 'small' }, t('ev.thr.b', { src: r.devSource, s: fmtPct(r.selection.sensitivity, 1), p: fmtPct(r.selection.specificity, 1) }))));
  right.append(h('section', { class: 'ev-result panel ticked', 'data-prov': 'real' }, h('header', { class: 'ev-result-h' }, h('span', { class: 'prov prov-real' }, t('ev.result')), h('span', { class: 'small muted' }, t('ev.tests', { n: S.testEvals }))),
    h('div', { class: 'res-grid' }, confusionMatrix(r.cm, 'real'), rateBars(r.rates, 'real')),
    h('div', { class: 'res-grid' }, rocChart(rocPoints(r.test), r.rates, { prov: 'real', auc: r.auc, label: t('lab.roc') }), histChart(r.test, r.threshold, { prov: 'real' })),
    h('div', { class: 'res-actions' }, btn(t('ev.export'), { icon: 'download', variant: 'quiet', on: () => exportProvenance(r) }))));
}

function integrityBlock(integ) {
  const msg = (i) => t(`iss.${i.code}`, { n: i.count, ex: (i.examples || []).join(', '), split: i.split ? t(`ev.split.${i.split}`) : '' });
  return h('div', { class: 'panel integ' }, h('p', { class: 'kicker' }, t('ev.integrity')),
    integ.issues.length ? h('ul', { class: 'integ-list' }, integ.issues.map((i) => h('li', { class: `iss-${i.level}` }, h('b', null, i.level === 'error' ? '✕' : '!'), h('span', null, msg(i))))) : h('p', { class: 'small' }, ic('check', 14), ' ', t('ev.ok')));
}

function exportProvenance(r) {
  const rec = {
    app: `${BRAND.name} ${BRAND.version}`, created: new Date().toISOString(), kind: 'held-out-evaluation-provenance',
    file: { name: S.data.name, rows: S.data.rows.length, sha256: S.data.hash },
    declared: { ...S.meta, note: 'self-reported; not verified by this application' },
    threshold: { value: r.threshold, rule: S.strategy, target: S.strategy === 'sensitivity' ? S.target : null, selectedOn: r.devSource },
    partitions: r.integrity.sizes, integrityIssues: r.integrity.issues,
    test: { confusion: r.cm, sensitivity: r.rates.sensitivity, specificity: r.rates.specificity, ppv: r.rates.ppv, npv: r.rates.npv, accuracy: r.rates.accuracy, auc: r.auc, sensitivityCI95: r.rates.sensitivityCI, specificityCI95: r.rates.specificityCI },
    testEvaluationsThisSession: S.testEvals,
  };
  download('evaluation-provenance.json', JSON.stringify(rec, null, 2), 'application/json');
}

// ── 03 thresholds ─────────────────────────────────────────────────────────────────────────────────
function tabThresholds(body) {
  const r = S.data?.result;
  body.append(h('h2', { class: 'h2' }, t('th.h')));
  if (!r?.ok) { body.append(h('div', { class: 'empty panel' }, h('p', null, t('th.empty')), h('a', { class: 'btn', href: '#/lab/evaluate' }, h('span', { class: 'btn-label' }, t('lab.tab.evaluate')), ic('arrow', 14)), h('a', { class: 'btn btn-quiet', href: '#/lab/simulator' }, h('span', { class: 'btn-label' }, t('lab.tab.simulator')), ic('arrow', 14)))); return; }
  const dev = S.data.rows.filter((x) => x.split === r.devSource);
  const test = r.test;
  const thr = S.thr ?? r.threshold;
  const wrap = h('div', { class: 'th-grid' });
  const part = h('div', { class: 'seg' }, ['dev', 'test'].map((k) => h('label', null, h('input', { type: 'radio', name: 'part', value: k, checked: S.thPart === k, on: { change: () => { S.thPart = k; paint(); } } }), h('span', null, t(`th.${k}`)))));
  const slider = h('input', { type: 'range', id: 'th-slider', min: 0, max: 1, step: 0.005, value: thr, 'aria-label': t('th.value'), on: { input: (e) => { S.thr = Number(e.target.value); paint(); } } });
  const live = h('div', { class: 'th-live' });
  body.append(h('div', { class: 'th-controls' }, h('div', { class: 'field' }, h('span', { class: 'lbl' }, t('th.part')), part), h('div', { class: 'field th-sl' }, h('label', { for: 'th-slider' }, t('th.value'), ' ', h('output', { class: 'num', id: 'th-out' }, fmtNum(thr, 3))), slider), btn(t('th.snap'), { variant: 'quiet', cls: 'btn-sm', icon: 'reset', on: () => { S.thr = null; slider.value = r.threshold; paint(); } }), h('span', { class: 'chip chip-blue' }, t('th.reportable', { v: fmtNum(r.threshold, 3) }))), live, wrap);
  function paint() {
    const th = S.thr ?? r.threshold;
    $('#th-out').textContent = fmtNum(th, 3);
    const rows = S.thPart === 'dev' ? dev : test;
    const cm = confusion(rows, th); const rt = rates(cm);
    live.replaceChildren(S.thPart === 'test' ? h('div', { class: 'note note-warn' }, ic('info'), h('span', null, t('th.warn'))) : null);
    wrap.replaceChildren(confusionMatrix(cm, 'real'), rateBars(rt, 'real'), rocChart(rocPoints(rows), rt, { prov: 'real', auc: auc(rows) }), thresholdCurves(rows, th, { prov: 'real' }), histChart(rows, th, { prov: 'real' }),
      h('div', { class: 'panel' }, h('p', { class: 'kicker' }, t('th.table')), h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null, t('th.value')), h('th', null, t('lab.sens')), h('th', null, t('lab.spec')), h('th', null, 'FN'), h('th', null, 'FP'))),
        h('tbody', null, [0.1, 0.25, 0.5, 0.75, 0.9].map((x) => { const c2 = confusion(rows, x); const r2 = rates(c2); return h('tr', null, h('td', { class: 'num' }, x.toFixed(2)), h('td', { class: 'num' }, fmtPct(r2.sensitivity, 1)), h('td', { class: 'num' }, fmtPct(r2.specificity, 1)), h('td', { class: 'num' }, String(c2.fn)), h('td', { class: 'num' }, String(c2.fp))); })))));
  }
  paint();
}

// ── 04 errors ─────────────────────────────────────────────────────────────────────────────────────
function tabErrors(body) {
  body.append(h('h2', { class: 'h2' }, t('er.h')));
  const r = S.data?.result;
  const modelSec = h('section', { class: 'er-sec er-real' }, h('div', { class: 'er-h' }, h('span', { class: 'prov prov-real' }, t('er.model.t'))));
  if (!r?.ok) modelSec.append(h('p', { class: 'small muted' }, t('er.model.none')));
  else {
    const list = (title, why, items, tone) => h('div', { class: 'er-col' }, h('h3', { class: ['h3', `tone-${tone}`] }, `${title} (${items.length})`), h('p', { class: 'small muted' }, why),
      h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null, t('er.id')), h('th', null, t('er.patient')), h('th', null, t('er.score')), h('th', null))), h('tbody', null, items.slice(0, 50).map((x) => h('tr', null, h('td', { class: 'mono' }, x.id), h('td', { class: 'mono' }, x.patient || '—'), h('td', { class: 'num' }, fmtNum(x.score, 3)), h('td', null, CASE_IDS.includes(x.id) ? h('a', { href: `#/workbench/${x.id}/lens` }, t('er.open')) : h('span', { class: 'small muted' }, t('er.noimg'))))))));
    modelSec.append(h('div', { class: 'er-cols' }, list(t('er.fn'), t('er.fn.why'), r.errors.falseNegatives, 'fn'), list(t('er.fp'), t('er.fp.why'), r.errors.falsePositives, 'fp')));
  }
  const learner = Object.values(state().duels).filter((d) => ['FN', 'FP', 'UG-missed', 'UG-overcall'].includes(d.category));
  const lsec = h('section', { class: 'er-sec er-learner' }, h('div', { class: 'er-h' }, h('span', { class: 'prov prov-learner' }, t('er.learner.t'))), h('p', { class: 'small muted' }, t('er.learner.b')));
  if (!learner.length) lsec.append(h('p', { class: 'small muted' }, t('er.learner.none')));
  else {
    const grid = h('div', { class: 'er-cards' });
    learner.forEach((d) => {
      const c = getCase(d.caseId);
      const cv = h('div', { class: 'cc-img skeleton' });
      analysis(d.caseId).then(({ canvas }) => { cv.classList.remove('skeleton'); cv.replaceChildren(thumbnail(canvas, 260)); });
      grid.append(h('a', { class: 'case-card', href: `#/workbench/${d.caseId}/lens` }, cv, h('div', { class: 'cc-meta' }, h('b', { class: 'cc-id' }, d.caseId), h('span', { class: 'mono' }, c.eye)), h('div', { class: 'cc-state' }, chip(t(`duel.cat.${d.category}`), d.category === 'FN' || d.category === 'UG-overcall' ? 'brick' : 'ochre')), h('p', { class: 'small er-vs' }, `${t('er.you')}: ${d.interp.gradable ? `${d.interp.grade}${d.interp.dme ? '+DME' : ''}` : t('decision.ungradable')} · ${t('er.ref')}: ${c.reference.gradable ? `${c.reference.icdr}${c.reference.dme ? '+DME' : ''}` : t('decision.ungradable')}`)));
    });
    lsec.append(grid);
  }
  body.append(modelSec, lsec);
}

// ── 05 simulator ──────────────────────────────────────────────────────────────────────────────────
function tabSim(body) {
  const sim = S.sim;
  const out = h('div', { class: 'sim-out' });
  const ctl = (id, label, min, max, step, key, fmt) => { const o = h('output', { class: 'num' }, fmt(sim[key])); return h('div', { class: 'field' }, h('label', { for: id }, label, ' ', o), h('input', { type: 'range', id, min, max, step, value: sim[key], on: { input: (e) => { sim[key] = Number(e.target.value); o.textContent = fmt(sim[key]); paint(); } } })); };
  body.append(h('div', { class: 'sim-banner' }, h('b', { class: 'sim-b' }, t('sim.banner')), h('p', { class: 'small' }, t('sim.banner.b'))),
    h('div', { class: 'sim-grid', 'data-prov': 'sim' }, h('div', { class: 'sim-ctl panel' },
      ctl('sim-prev', t('sim.prev'), 0.01, 0.6, 0.01, 'prev', (v) => fmtPct(v)), ctl('sim-n', t('sim.n'), 50, 5000, 50, 'n', (v) => String(v)), ctl('sim-d', t('sim.d'), 0, 4, 0.1, 'd', (v) => v.toFixed(1)), ctl('sim-thr', t('sim.thr'), 0.02, 0.98, 0.01, 'thr', (v) => v.toFixed(2)),
      btn(t('sim.new'), { variant: 'quiet', icon: 'reset', on: () => { sim.seed = Math.floor(Math.random() * 1e6); sim.count++; paint(); } }), h('p', { class: 'small muted', id: 'sim-seed' }), h('ul', { class: 'sim-lessons' }, [1, 2, 3].map((n) => h('li', { class: 'small' }, t(`sim.l${n}`))))), out));
  function paint() {
    $('#sim-seed').textContent = t('sim.seed', { n: sim.count });
    const rows = simulateScores({ n: sim.n, prevalence: sim.prev, dprime: sim.d, seed: sim.seed });
    const cm = confusion(rows, sim.thr); const rt = rates(cm); const a = auc(rows);
    const pvAt = (p) => predictiveValues(rt.sensitivity ?? 0, rt.specificity ?? 0, p);
    out.replaceChildren(
      h('div', { class: 'res-grid' }, confusionMatrix(cm, 'sim'), rateBars(rt, 'sim')),
      h('div', { class: 'res-grid' }, rocChart(rocPoints(rows), rt, { prov: 'sim', auc: a }), histChart(rows, sim.thr, { prov: 'sim' })),
      h('div', { class: 'panel sim-pv' }, h('p', { class: 'kicker' }, t('sim.pv.t')), h('p', { class: 'small' }, t('sim.pv.b')),
        h('div', { class: 'pv-rows' }, [0.01, 0.05, 0.1, 0.2, 0.4].map((p) => { const v = pvAt(p); return h('div', { class: 'pv-row' }, h('span', { class: 'num pv-p' }, fmtPct(p)), h('span', { class: 'pv-bar' }, h('i', { style: { width: `${(v.ppv ?? 0) * 100}%` } })), h('span', { class: 'small num' }, t('sim.pv.at', { p: fmtPct(p), ppv: fmtPct(v.ppv, 1), npv: fmtPct(v.npv, 1) }))); }))));
  }
  paint();
}

// ── 06 dataset & limits ───────────────────────────────────────────────────────────────────────────
function tabDataset(body) {
  const cs = CASE_IDS.map(getCase);
  const a = cs.filter((c) => c.reference.referable === true).length; const b = cs.filter((c) => c.reference.referable === false).length; const u = cs.filter((c) => !c.reference.gradable).length;
  const cand = [['aptos'], ['eyepacs'], ['mess'], ['idrid']];
  body.append(h('h2', { class: 'h2' }, t('ds.h')),
    h('section', { class: 'panel ticked ds-teach' }, h('p', { class: 'kicker' }, t('ds.teach.t')), h('dl', { class: 'kvl' },
      kv(t('ds.id'), h('span', { class: 'mono' }, DATASET.id)), kv(t('ds.kind'), t('ds.kind.v')), kv(t('ds.size'), String(DATASET.size)), kv(t('ds.task'), DATASET.task), kv(t('ds.ref'), DATASET.referenceStandard), kv(t('ds.patient'), t('ds.patient.v')), kv(t('ds.comp'), t('ds.comp.v', { a, b, c: u })))),
    h('section', { class: 'ds-cand' }, h('p', { class: 'kicker' }, t('ds.cand.t')), h('p', { class: 'small muted' }, t('ds.cand.b')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'ledger' }, h('thead', null, h('tr', null, ['name', 'size', 'labels', 'group', 'note'].map((k) => h('th', null, t(`ds.col.${k}`))))),
        h('tbody', null, cand.map(([k]) => h('tr', null, h('td', null, h('b', null, t(`ds.${k}`))), h('td', { class: 'small' }, t(`ds.${k}.s`)), h('td', { class: 'small' }, t(`ds.${k}.l`)), h('td', { class: 'small' }, t(`ds.${k}.g`)), h('td', { class: 'small' }, t(`ds.${k}.n`)))))))),
    h('section', { class: 'ds-lim' }, h('p', { class: 'kicker' }, t('ds.lim.t')), h('ol', { class: 'lim-list' }, [1, 2, 3, 4, 5, 6, 7, 8].map((n) => h('li', null, t(`ds.lim.${n}`))))),
    h('section', { class: 'note' }, ic('info'), h('div', null, h('b', null, t('ds.prov.t')), h('p', { class: 'small' }, t('ds.prov.b', { v: BRAND.version })))));
}
