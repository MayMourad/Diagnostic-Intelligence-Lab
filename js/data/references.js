// Lesion taxonomy and source-linked references. The descriptions paraphrase the ICDR clinical scale and
// ETDRS-derived definitions; every lesion in the UI links to the source that defines the grading criterion.
// (Source details were checked against PubMed / the publisher record on 2026-10-26.)
import { register } from '../i18n.js';

export const SOURCES = {
  icdr: {
    id: 'icdr',
    cite: 'Wilkinson CP, et al. Proposed international clinical diabetic retinopathy and diabetic macular edema disease severity scales. Ophthalmology 2003;110(9):1677–82.',
    url: 'https://doi.org/10.1016/S0161-6420(03)00475-5',
    short: 'ICDR 2003',
  },
  etdrs: {
    id: 'etdrs',
    cite: 'Early Treatment Diabetic Retinopathy Study Research Group. Grading diabetic retinopathy from stereoscopic color fundus photographs — an extension of the modified Airlie House classification (ETDRS Report 10). Ophthalmology 1991.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2062513/',
    short: 'ETDRS Report 10',
  },
};

// color = annotation stroke on the dark viewer; relevance = which grading rule the finding feeds.
export const LESION_TYPES = {
  ma: { color: '#F2C36B', source: 'icdr', grade: 1 },
  hemorrhage: { color: '#F08A7A', source: 'icdr', grade: 2 },
  'hard-exudate': { color: '#F5E27A', source: 'icdr', grade: 2 },
  'cotton-wool': { color: '#E9EEF5', source: 'icdr', grade: 2 },
  'venous-beading': { color: '#8EC3F0', source: 'etdrs', grade: 3 },
  irma: { color: '#C9A6F0', source: 'etdrs', grade: 3 },
  neovascularization: { color: '#FF9FB1', source: 'icdr', grade: 4 },
  'preretinal-hemorrhage': { color: '#FF7F66', source: 'icdr', grade: 4 },
  artifact: { color: '#9FB3C8', source: 'icdr', grade: null },
};
export const LESION_ORDER = Object.keys(LESION_TYPES);

register({
  en: {
    'les.ma': 'Microaneurysm',
    'les.hemorrhage': 'Intraretinal haemorrhage',
    'les.hard-exudate': 'Hard exudate',
    'les.cotton-wool': 'Cotton-wool spot',
    'les.venous-beading': 'Venous beading',
    'les.irma': 'IRMA',
    'les.neovascularization': 'Neovascularisation',
    'les.preretinal-hemorrhage': 'Pre-retinal haemorrhage',
    'les.artifact': 'Imaging artefact (not pathology)',
    'les.ma.desc': 'Tiny round capillary outpouching; the earliest visible sign. Microaneurysms alone define mild NPDR.',
    'les.hemorrhage.desc': 'Dot or blot of blood within the retina. Haemorrhages or exudates beyond microaneurysms alone move a case to at least moderate NPDR.',
    'les.hard-exudate.desc': 'Yellow-white lipid deposits from leaking vessels. Exudates within 1 disc diameter of the macular centre indicate suspected macular oedema and make a case referable.',
    'les.cotton-wool.desc': 'Pale, feathery patch of nerve-fibre-layer ischaemia. Counts toward moderate NPDR; it is not by itself a severe sign.',
    'les.venous-beading.desc': 'Irregular, sausage-like calibre change of a vein. Definite beading in two or more quadrants meets the 4-2-1 severe criterion.',
    'les.irma.desc': 'Intraretinal microvascular abnormality: tortuous intraretinal shunt vessels. Prominent IRMA in one or more quadrants meets the 4-2-1 severe criterion.',
    'les.neovascularization.desc': 'New vessels growing from the disc (NVD) or elsewhere (NVE). Marks proliferative DR, the most sight-threatening level.',
    'les.preretinal-hemorrhage.desc': 'Blood between the retina and the vitreous, often boat-shaped with a flat upper level. A proliferative-stage sign.',
    'les.artifact.desc': 'A bright reflection caused by the camera optics. It is annotated so you can learn to ignore it; it contributes nothing to grading.',
    'src.label': 'Source',
    'src.open': 'Open source',
    'gradeName.0': 'No apparent retinopathy',
    'gradeName.1': 'Mild NPDR',
    'gradeName.2': 'Moderate NPDR',
    'gradeName.3': 'Severe NPDR',
    'gradeName.4': 'Proliferative DR',
  },
  ar: {
    'les.ma': 'أم دم دقيقة (تمدد وعائي)',
    'les.hemorrhage': 'نزف داخل الشبكية',
    'les.hard-exudate': 'إفرازات صلبة',
    'les.cotton-wool': 'بقعة قطنية',
    'les.venous-beading': 'تخرز وريدي',
    'les.irma': 'شذوذات وعائية دقيقة داخل الشبكية (IRMA)',
    'les.neovascularization': 'أوعية دموية جديدة',
    'les.preretinal-hemorrhage': 'نزف أمام الشبكية',
    'les.artifact': 'أثر تصوير (ليس مرضًا)',
    'les.ma.desc': 'انتفاخ صغير ودائري في شعيرة دموية؛ أول علامة مرئية. وجود الأمهات الدموية الدقيقة وحدها يعرّف اعتلال الشبكية السكري غير التكاثري الخفيف.',
    'les.hemorrhage.desc': 'نقطة أو بقعة دم داخل الشبكية. وجود نزوف أو إفرازات تتجاوز الأمهات الدموية الدقيقة وحدها ينقل الحالة إلى المتوسط على الأقل.',
    'les.hard-exudate.desc': 'رواسب دهنية صفراء-بيضاء ناتجة عن تسرب الأوعية. وجودها ضمن قطر قرص بصري واحد من مركز البقعة يشير إلى اشتباه وذمة بقعية ويجعل الحالة محالة للتقييم.',
    'les.cotton-wool.desc': 'بقعة شاحبة ريشية ناتجة عن نقص التروية في طبقة ألياف العصب. تُحتسب ضمن المستوى المتوسط ولا تدل وحدها على الشدة الشديدة.',
    'les.venous-beading.desc': 'تغير غير منتظم في قطر الوريد يشبه حبات السبحة. التخرز الواضح في ربعين أو أكثر يحقق معيار 4-2-1 للمستوى الشديد.',
    'les.irma.desc': 'شذوذات وعائية دقيقة داخل الشبكية: أوعية التفافية ملتوية. وجودها البارز في ربع واحد أو أكثر يحقق معيار 4-2-1 للمستوى الشديد.',
    'les.neovascularization.desc': 'أوعية جديدة تنمو من القرص البصري أو من مكان آخر. تدل على المرحلة التكاثرية، وهي الأخطر على البصر.',
    'les.preretinal-hemorrhage.desc': 'دم بين الشبكية والجسم الزجاجي، غالبًا على شكل قارب بمستوى علوي مسطح. علامة على المرحلة التكاثرية.',
    'les.artifact.desc': 'انعكاس ساطع ناتج عن بصريات الكاميرا. يُعلَّم ليتعلم المستخدم تجاهله؛ ولا يدخل في التدريج.',
    'src.label': 'المصدر',
    'src.open': 'فتح المصدر',
    'gradeName.0': 'لا اعتلال شبكية ظاهر',
    'gradeName.1': 'اعتلال غير تكاثري خفيف',
    'gradeName.2': 'اعتلال غير تكاثري متوسط',
    'gradeName.3': 'اعتلال غير تكاثري شديد',
    'gradeName.4': 'اعتلال تكاثري',
  },
});
