// Supporting: About & credits — team, provisional title, method, sources, and how to rename.
import { BRAND, markSVG } from '../brand.js';
import { register, t, getLang } from '../i18n.js';
import { h, ic } from '../ui.js';
import { SOURCES } from '../data/references.js';

export const titleKey = 'nav.about';

register({
  en: {
    'ab.kicker': 'Supporting · About & credits', 'ab.title': 'A student research prototype.',
    'ab.lede': 'Built by three high-school students (Grades 11 and 12) to ask a simple question seriously: when a diagnosis is read from an image, how accurately — and how would we know?',
    'ab.team': 'Team', 'ab.school': 'School', 'ab.school.note': 'ADNOC Schools — Madinat Zayed is the students’ school. This is a student project; no endorsement by ADNOC or ADNOC Schools is implied and no ADNOC branding is used.',
    'ab.title.t': 'Provisional title', 'ab.title.b': '“{name}” is a temporary project title. The platform is deliberately not named after one specialty so it can grow beyond retinal screening; the first research task is referable diabetic retinopathy.',
    'ab.rename.t': 'How to rename it', 'ab.rename.b': 'The name, school and student list live in one file, js/brand.js. The mark is a generic reticle-and-scale symbol with no text, so a new name needs no layout changes.',
    'ab.method.t': 'Method in one paragraph', 'ab.method.b': 'Sixteen synthetic fundus illustrations are generated deterministically from authored lesion lists. Each reference label is derived from its lesion list under the ICDR scale and re-checked by an automated test. Visitors read cases blind, lock an interpretation, then see the reference. Accuracy statistics are exact and unit-tested; they can be computed on held-out predictions the user supplies, and otherwise only an explicitly labelled simulator is shown.',
    'ab.src.t': 'Sources', 'ab.src.more': 'ETDRS and ICDR define the grading criteria used for the reference rules. Links were checked on 26 October 2026; please verify before citing.',
    'ab.fonts.t': 'Typefaces', 'ab.fonts.b': 'Newsreader, Instrument Sans, IBM Plex Mono, IBM Plex Sans Arabic and Noto Naskh Arabic, loaded from Google Fonts under the SIL Open Font License. This is the only external request the app makes.',
    'ab.a11y.t': 'Accessibility', 'ab.a11y.b': 'Keyboard-operable viewer (+ − 0 arrows), visible focus, reduced-motion support, text alternatives, RTL layout. Not yet audited by an accessibility specialist.',
    'ab.3d.t': 'The 3D eye', 'ab.3d.b': 'An original lightweight WebGL model written for this project (no third-party scene or library), with a static SVG fallback. Anatomy shown: cornea, iris, pupil, lens, vitreous body, sclera, choroid, retina, macula/fovea, optic disc and optic nerve; the optic disc sits nasal to the macula. It is an orientation aid, not clinical evidence, and not to scale.',
  },
  ar: {
    'ab.kicker': 'داعم · حول المشروع والفريق', 'ab.title': 'نموذج بحثي طلابي.',
    'ab.lede': 'أعدّه ثلاثة من طلبة الصفين الحادي عشر والثاني عشر ليطرحوا سؤالًا بسيطًا بجدية: حين يُقرأ تشخيص من صورة، فبأي دقة — وكيف سنعرف؟',
    'ab.team': 'الفريق', 'ab.school': 'المدرسة', 'ab.school.note': 'مدارس أدنوك — مدينة زايد هي مدرسة الطلبة. هذا مشروع طلابي؛ ولا يُقصد منه أي تأييد من أدنوك أو مدارس أدنوك ولا تُستخدم أي علامة تجارية لأدنوك.',
    'ab.title.t': 'العنوان المؤقت', 'ab.title.b': '«{name}» عنوان مؤقت للمشروع. لم تُسمَّ المنصة عمدًا باسم تخصص واحد لتنمو أبعد من فحص الشبكية؛ والمهمة البحثية الأولى هي اعتلال الشبكية السكري المستوجب للإحالة.',
    'ab.rename.t': 'كيف تغيّر الاسم', 'ab.rename.b': 'يعيش الاسم والمدرسة وقائمة الطلبة في ملف واحد هو js/brand.js. والشعار رمز عام من شبكة تصويب ومقياس بلا نص، فلا يحتاج الاسم الجديد إلى تغيير التخطيط.',
    'ab.method.t': 'المنهج في فقرة', 'ab.method.b': 'تُولَّد ست عشرة رسمة اصطناعية لقاع العين بصورة حتمية من قوائم آفات مؤلَّفة. وتُشتق كل تسمية مرجعية من قائمة آفاتها وفق مقياس ICDR ويعيد اختبار آلي التحقق منها. يقرأ الزوار الحالات بالعمى ثم يقفلون تفسيرًا ثم يرون المرجع. والإحصاءات دقيقة ومختبَرة بالوحدات؛ ويمكن حسابها على تنبؤات محجوبة يقدمها المستخدم، وإلا فلا يُعرض سوى محاكٍ معنون بوضوح.',
    'ab.src.t': 'المصادر', 'ab.src.more': 'يحدد ETDRS وICDR معايير التدريج المستخدمة في قواعد المرجع. روجعت الروابط في ٢٦ أكتوبر ٢٠٢٦؛ يُرجى التحقق قبل الاقتباس.',
    'ab.fonts.t': 'الخطوط', 'ab.fonts.b': 'Newsreader وInstrument Sans وIBM Plex Mono وIBM Plex Sans Arabic وNoto Naskh Arabic، تُحمَّل من Google Fonts بترخيص SIL Open Font. وهذا هو الطلب الخارجي الوحيد الذي يجريه التطبيق.',
    'ab.a11y.t': 'إمكانية الوصول', 'ab.a11y.b': 'عارض يعمل بلوحة المفاتيح (+ − 0 والأسهم)، وتركيز مرئي، ودعم تقليل الحركة، وبدائل نصية، وتخطيط من اليمين إلى اليسار. لم يدققه بعد أخصائي إمكانية وصول.',
    'ab.3d.t': 'العين ثلاثية الأبعاد', 'ab.3d.b': 'نموذج WebGL أصلي خفيف كُتب لهذا المشروع (دون مشهد أو مكتبة من طرف ثالث) مع بديل SVG ثابت. التشريح المعروض: القرنية والقزحية والحدقة والعدسة والجسم الزجاجي والصلبة والمشيمية والشبكية والبقعة/النُّقرة والقرص البصري والعصب البصري؛ ويقع القرص البصري إلى الجهة الأنفية من البقعة. هو وسيلة توجيه وليس دليلًا سريريًا وليس بالمقياس.',
  },
});

export function mount(root) {
  const ar = getLang() === 'ar';
  const sec = (k, ...kids) => h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t(k)), ...kids);
  root.append(h('div', { class: 'page about' },
    h('header', { class: 'page-head' }, h('div', { class: 'about-mark', html: markSVG(64) }), h('p', { class: 'kicker' }, t('ab.kicker')), h('h1', { class: 'h1' }, t('ab.title')), h('p', { class: 'lede' }, t('ab.lede'))),
    h('div', { class: 'ra-two' },
      sec('ab.team', h('ul', { class: 'team' }, BRAND.students.map((s) => h('li', null, h('b', { class: 'team-n' }, ar ? s.nameAr : s.name), h('span', { class: 'chip' }, s.grade))))),
      sec('ab.school', h('p', { class: 'team-s' }, ar ? BRAND.schoolAr : BRAND.school), h('p', { class: 'small muted' }, t('ab.school.note')))),
    sec('ab.title.t', h('p', { class: 'prose' }, t('ab.title.b', { name: ar ? BRAND.nameAr : BRAND.name }))),
    sec('ab.rename.t', h('p', { class: 'prose' }, t('ab.rename.b'))),
    sec('ab.method.t', h('p', { class: 'prose' }, t('ab.method.b'))),
    sec('ab.3d.t', h('p', { class: 'prose' }, t('ab.3d.b'))),
    sec('ab.src.t', h('ul', { class: 'srcs' }, Object.values(SOURCES).map((s) => h('li', null, h('span', null, s.cite), h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.short, ic('external', 12))))), h('p', { class: 'small muted' }, t('ab.src.more'))),
    h('div', { class: 'ra-two' }, sec('ab.fonts.t', h('p', { class: 'prose' }, t('ab.fonts.b'))), sec('ab.a11y.t', h('p', { class: 'prose' }, t('ab.a11y.b'))))));
}
