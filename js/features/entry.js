// A — Immersive Entry: pinned scroll-linked anatomical scene → guided transition into the Workbench.
import { BRAND } from '../brand.js';
import { register, t, getLang, has } from '../i18n.js';
import { h, s, $, ic, btn, reducedMotion, sleep } from '../ui.js';
import { createEye, eyeSectionSVG, ANCHORS } from './eye3d.js';
import { analysis } from '../render.js';
import { navigate } from '../main.js';

export const titleKey = 'nav.entry';

register({
  en: {
    'entry.kicker': 'A — Immersive entry · Student research prototype',
    'entry.t1': 'Diagnostic', 'entry.t2': 'Intelligence', 'entry.t3': 'Lab',
    'entry.lede': 'A research workbench for testing how accurately a diagnosis is read — starting with referable diabetic retinopathy in retinal fundus images.',
    'entry.enter': 'Enter Diagnostic Lab', 'entry.lab': 'Go to Accuracy Laboratory', 'entry.skip': 'Skip intro',
    'entry.prov': 'Provisional title — a final name has not been chosen.',
    'entry.s1.k': '01 — The eye', 'entry.s1.t': 'Light enters here.',
    'entry.s1.b': 'A human right eye, drawn schematically and not to scale. Move the pointer to turn it; scroll to look inside.',
    'entry.s2.k': '02 — A section through the globe', 'entry.s2.t': 'Cornea, pupil, lens — then the retina.',
    'entry.s2.b': 'Light passes the cornea, pupil and lens, crosses the clear vitreous body and falls on the retina, the light-sensitive lining at the back.',
    'entry.s3.k': '03 — The retina', 'entry.s3.t': 'Where measurement begins.',
    'entry.s3.b': 'A fundus photograph is a picture of this lining. Reading it correctly is the diagnostic problem this lab measures, case by case, against an expert reference.',
    'entry.note': 'Schematic anatomy · not to scale · an orientation aid, not clinical evidence',
    'entry.note.3d': 'Original WebGL model · right eye, axial section · nasal side right',
    'entry.credits': 'Student project', 'entry.rail': 'Scene progress',
    'eye.cornea': 'Cornea', 'eye.iris': 'Iris & pupil', 'eye.lens': 'Lens', 'eye.vitreous': 'Vitreous body', 'eye.sclera': 'Sclera', 'eye.retina': 'Retina', 'eye.nerve': 'Optic nerve',
    'eye.macula': 'Macula · fovea', 'eye.disc': 'Optic disc',
    'eye.macula.d': 'Centre of sharpest vision', 'eye.disc.d': 'Where the optic nerve leaves the eye',
    'entry.idx.k': 'Three environments, one question', 'entry.idx.h': 'How accurate is the reading?',
    'entry.A': 'Immersive Entry', 'entry.A.b': 'This page: one anatomical scene that leads into the retina.',
    'entry.B': 'Diagnostic Workbench', 'entry.B.b': 'Case selection → EvidenceLens → Diagnostic Duel → quality & uncertainty → clinician approval.',
    'entry.C': 'Accuracy Laboratory', 'entry.C.b': 'Confusion matrix, sensitivity and specificity, threshold exploration, error analysis and research limits.',
    'entry.open': 'Open',
    'ledger.k': 'Implementation ledger', 'ledger.h': 'What is real here — and what is not',
    'ledger.item': 'Capability', 'ledger.status': 'Status', 'ledger.detail': 'Detail',
    'ledger.model': 'Research inference model', 'ledger.model.s': 'Not implemented', 'ledger.model.d': 'No trained weights, dataset or compute are present. Nothing on screen is a model prediction.',
    'ledger.cases': 'Cases', 'ledger.cases.s': 'Synthetic', 'ledger.cases.d': '16 teaching illustrations drawn by code, with authored reference labels derived from their own lesion lists.',
    'ledger.duel': 'Diagnostic Duel', 'ledger.duel.s': 'Human vs Reference', 'ledger.duel.d': 'Your reading is compared with the reference label. It is educational scoring, not validated clinical performance.',
    'ledger.lab': 'Accuracy Laboratory', 'ledger.lab.s': 'Ready for real data', 'ledger.lab.d': 'Exact statistics on a held-out predictions file you supply; clearly labelled simulator otherwise.',
    'ledger.eye': '3D eye', 'ledger.eye.s': 'Schematic', 'ledger.eye.d': 'Original lightweight WebGL scene with a static fallback. Not evidence.',
    'ledger.status.na': 'Not implemented',
  },
  ar: {
    'entry.kicker': 'أ — المدخل التفاعلي · نموذج بحثي طلابي',
    'entry.t1': 'مختبر', 'entry.t2': 'الذكاء', 'entry.t3': 'التشخيصي',
    'entry.lede': 'منصة بحثية لاختبار مدى دقة قراءة التشخيص — نبدأ باعتلال الشبكية السكري المُحال من صور قاع العين.',
    'entry.enter': 'ادخل المختبر التشخيصي', 'entry.lab': 'انتقل إلى مختبر الدقة', 'entry.skip': 'تخطَّ المقدمة',
    'entry.prov': 'العنوان مؤقت — لم يُختر الاسم النهائي بعد.',
    'entry.s1.k': '١ — العين', 'entry.s1.t': 'من هنا يدخل الضوء.',
    'entry.s1.b': 'عين يمنى بشرية مرسومة تخطيطيًا وليست بالمقياس. حرّك المؤشر لتدويرها ومرّر للنظر إلى الداخل.',
    'entry.s2.k': '٢ — مقطع عبر مقلة العين', 'entry.s2.t': 'القرنية والحدقة والعدسة — ثم الشبكية.',
    'entry.s2.b': 'يمر الضوء عبر القرنية والحدقة والعدسة، ثم الجسم الزجاجي الصافي، ويسقط على الشبكية وهي البطانة الحساسة للضوء في الخلف.',
    'entry.s3.k': '٣ — الشبكية', 'entry.s3.t': 'من هنا يبدأ القياس.',
    'entry.s3.b': 'صورة قاع العين هي صورة لهذه البطانة. وقراءتها بصورة صحيحة هي المشكلة التشخيصية التي يقيسها هذا المختبر حالةً بحالة مقابل مرجع الخبراء.',
    'entry.note': 'تشريح تخطيطي · ليس بالمقياس · وسيلة توجيه وليس دليلًا سريريًا',
    'entry.note.3d': 'نموذج WebGL أصلي · عين يمنى، مقطع محوري · الجهة الأنفية إلى اليمين',
    'entry.credits': 'مشروع طلابي', 'entry.rail': 'تقدم المشهد',
    'eye.cornea': 'القرنية', 'eye.iris': 'القزحية والحدقة', 'eye.lens': 'العدسة', 'eye.vitreous': 'الجسم الزجاجي', 'eye.sclera': 'الصلبة', 'eye.retina': 'الشبكية', 'eye.nerve': 'العصب البصري',
    'eye.macula': 'البقعة · النُّقرة', 'eye.disc': 'القرص البصري',
    'eye.macula.d': 'مركز أحدّ إبصار', 'eye.disc.d': 'موضع خروج العصب البصري من العين',
    'entry.idx.k': 'ثلاث بيئات وسؤال واحد', 'entry.idx.h': 'ما مدى دقة القراءة؟',
    'entry.A': 'المدخل التفاعلي', 'entry.A.b': 'هذه الصفحة: مشهد تشريحي واحد يقود إلى الشبكية.',
    'entry.B': 'منصة العمل التشخيصية', 'entry.B.b': 'اختيار الحالة ← عدسة الأدلة ← مبارزة التشخيص ← الجودة وعدم اليقين ← اعتماد الطبيب.',
    'entry.C': 'مختبر الدقة', 'entry.C.b': 'مصفوفة الالتباس والحساسية والنوعية واستكشاف العتبة وتحليل الأخطاء وحدود البحث.',
    'entry.open': 'افتح',
    'ledger.k': 'سجل التنفيذ', 'ledger.h': 'ما الحقيقي هنا — وما ليس كذلك',
    'ledger.item': 'القدرة', 'ledger.status': 'الحالة', 'ledger.detail': 'التفاصيل',
    'ledger.model': 'نموذج الاستدلال البحثي', 'ledger.model.s': 'غير منفَّذ', 'ledger.model.d': 'لا توجد أوزان مدرَّبة ولا مجموعة بيانات ولا قدرة حوسبة. لا شيء على الشاشة هو تنبؤ من نموذج.',
    'ledger.cases': 'الحالات', 'ledger.cases.s': 'اصطناعية', 'ledger.cases.d': '١٦ رسمًا تعليميًا مولَّدًا بالشيفرة، وتسميات مرجعية مؤلَّفة مشتقة من قوائم آفاتها.',
    'ledger.duel': 'مبارزة التشخيص', 'ledger.duel.s': 'إنسان مقابل مرجع', 'ledger.duel.d': 'تُقارن قراءتك بالتسمية المرجعية. إنه تقييم تعليمي وليس أداءً سريريًا مُصادَقًا عليه.',
    'ledger.lab': 'مختبر الدقة', 'ledger.lab.s': 'جاهز لبيانات حقيقية', 'ledger.lab.d': 'إحصاءات دقيقة على ملف تنبؤات محجوب تقدمه أنت؛ ومحاكٍ معنون بوضوح خلاف ذلك.',
    'ledger.eye': 'العين ثلاثية الأبعاد', 'ledger.eye.s': 'تخطيطية', 'ledger.eye.d': 'مشهد WebGL أصلي خفيف مع بديل ثابت. ليس دليلًا.',
    'ledger.status.na': 'غير منفَّذ',
  },
});

const LABELS = [
  { key: 'cornea', step: 2 }, { key: 'iris', step: 2 }, { key: 'lens', step: 2 }, { key: 'vitreous', step: 2 }, { key: 'sclera', step: 2 }, { key: 'retina', step: 2 }, { key: 'nerve', step: 2 },
  { key: 'macula', step: 3 }, { key: 'disc', step: 3 }, { key: 'retina', step: 3, id: 'retina3', anchor: 'retina' },
];

export function mount(root) {
  const reduced = reducedMotion();
  const lang = getLang();
  const stage = h('div', { class: 'entry-stage', dataset: { step: '1' } });
  const canvas = h('canvas', { class: 'eye-canvas', 'aria-hidden': 'true' });
  const holder = h('div', { class: 'eye-holder' }, canvas);
  const leaders = s('svg', { class: 'eye-leaders', 'aria-hidden': 'true' });
  const labelEls = LABELS.map((l) => h('div', { class: 'eye-label', dataset: { step: String(l.step) }, id: l.id ? `lab-${l.id}` : `lab-${l.key}` },
    h('span', { class: 'el-n' }), h('span', { class: 'el-t' }, t(`eye.${l.key}`)), has(`eye.${l.key}.d`) ? h('span', { class: 'el-d' }, t(`eye.${l.key}.d`)) : null));
  const lines = LABELS.map(() => s('path', { class: 'leader' }));
  const dots = LABELS.map(() => s('circle', { class: 'leader-dot', r: 2.6 }));
  leaders.append(...lines, ...dots);

  const copy = h('div', { class: 'entry-copy' },
    h('p', { class: 'kicker' }, t('entry.kicker')),
    h('h1', { class: 'display entry-title', 'aria-label': `${t('entry.t1')} ${t('entry.t2')} ${t('entry.t3')}` },
      h('span', { class: 'ln' }, t('entry.t1')), h('span', { class: 'ln' }, t('entry.t2')), h('span', { class: 'ln' }, h('em', null, t('entry.t3')))),
    h('p', { class: 'lede' }, t('entry.lede')),
    h('div', { class: 'entry-cta' },
      btn(t('entry.enter'), { icon: 'arrow', variant: 'solid', id: 'enter', on: () => enter() }),
      h('a', { class: 'btn btn-quiet', href: '#/lab' }, h('span', { class: 'btn-label' }, t('entry.lab')), ic('arrow', 14))),
    h('p', { class: 'entry-prov mono' }, t('entry.prov')));

  const steps = [1, 2, 3].map((n) => h('div', { class: 'entry-step', dataset: { n: String(n) }, 'aria-hidden': n === 1 ? 'false' : 'true' },
    h('p', { class: 'kicker' }, t(`entry.s${n}.k`)), h('h2', { class: 'h1' }, t(`entry.s${n}.t`)), h('p', { class: 'lede' }, t(`entry.s${n}.b`))));
  const stepWrap = h('div', { class: 'entry-steps' }, steps);

  const rail = h('ol', { class: 'entry-rail', 'aria-label': t('entry.rail') }, [1, 2, 3].map((n) => h('li', { dataset: { n: String(n) } }, h('span', null, `0${n}`))));
  const credits = h('div', { class: 'entry-credits' },
    h('span', { class: 'kicker' }, t('entry.credits')),
    BRAND.students.map((st) => h('span', { class: 'cr-line' }, lang === 'ar' ? st.nameAr : st.name, h('span', { class: 'cr-g' }, st.grade))),
    h('span', { class: 'cr-line cr-school' }, lang === 'ar' ? BRAND.schoolAr : BRAND.school));
  const note = h('p', { class: 'entry-note mono' }, t('entry.note'));
  const hint = h('div', { class: 'entry-hint', 'aria-hidden': 'true' }, h('span', { class: 'kicker' }, 'Scroll'), h('i'));

  stage.append(holder, leaders, ...labelEls, copy, stepWrap, rail, credits, note, hint);
  const track = h('section', { class: 'entry-track', 'aria-label': `${BRAND.name} — introduction` }, stage);

  // ── index of environments + honest ledger ──
  const envRow = (letter, name, body, href) => h('a', { class: 'env-row', href }, h('span', { class: 'env-l' }, letter), h('span', { class: 'env-b' }, h('b', { class: 'h2' }, name), h('span', { class: 'small' }, body)), h('span', { class: 'env-go' }, t('entry.open'), ic('arrow', 14)));
  const ledgerRow = (k, status, na) => h('tr', null, h('td', null, h('b', null, t(`ledger.${k}`))), h('td', null, h('span', { class: ['chip', na ? 'chip-brick' : 'chip-teal'] }, t(`ledger.${k}.s`))), h('td', { class: 'small' }, t(`ledger.${k}.d`)));
  const index = h('section', { class: 'entry-index' },
    h('div', { class: 'ei-head' }, h('p', { class: 'kicker' }, t('entry.idx.k')), h('h2', { class: 'h1' }, t('entry.idx.h'))),
    h('div', { class: 'ei-envs' }, envRow('A', t('entry.A'), t('entry.A.b'), '#/'), envRow('B', t('entry.B'), t('entry.B.b'), '#/workbench'), envRow('C', t('entry.C'), t('entry.C.b'), '#/lab')),
    h('div', { class: 'ei-ledger' }, h('p', { class: 'kicker' }, t('ledger.k')), h('h2', { class: 'h2' }, t('ledger.h')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null, t('ledger.item')), h('th', null, t('ledger.status')), h('th', null, t('ledger.detail')))),
        h('tbody', null, ledgerRow('model', 0, true), ledgerRow('cases'), ledgerRow('duel'), ledgerRow('lab'), ledgerRow('eye'))))));
  root.append(track, index);

  // ── 3D scene (with static fallback) ──
  let eye = null;
  let fallback = false;
  const useFallback = () => {
    fallback = true;
    holder.replaceChildren(h('div', { class: 'eye-static-wrap', html: eyeSectionSVG({ labels: true }) }));
    leaders.style.display = 'none';
    labelEls.forEach((l) => { l.style.display = 'none'; });
    note.textContent = t('entry.note') + ' · static view';
  };
  if (new URLSearchParams(location.search).has('static')) useFallback();
  else {
    try { eye = createEye(canvas, { reduced, onFrame: layout }); } catch (e) { console.warn(e); eye = null; }
    if (!eye) useFallback();
    else { eye.onLost(useFallback); eye.onBlank(useFallback); note.textContent = t('entry.note.3d'); }
  }

  // ── scroll mapping ──
  let step = 1;
  const stepAt = (p) => (p < 0.22 ? 1 : p < 0.74 ? 2 : 3);
  const snap = [0.0, 0.7, 1.0];
  function onScroll() {
    const r = track.getBoundingClientRect();
    const total = track.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    const st = stepAt(p);
    stage.style.setProperty('--p', p.toFixed(4));
    document.getElementById('topbar').classList.toggle('solid', r.bottom < window.innerHeight * 0.6); // legible bar over the ivory index
    if (st !== step) { step = st; stage.dataset.step = String(st); steps.forEach((el, i) => el.setAttribute('aria-hidden', String(i + 1 !== st))); rail.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i + 1 <= st)); }
    if (eye) eye.setProgress(reduced ? snap[st - 1] : p);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  rail.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i === 0));
  onScroll();

  const onMove = (e) => { if (!eye || reduced) return; const r = stage.getBoundingClientRect(); eye.setPointer(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2); };
  stage.addEventListener('pointermove', onMove);

  // pause rendering when off-screen / tab hidden
  const io = new IntersectionObserver(([en]) => { if (!eye) return; en.isIntersecting && !document.hidden ? eye.start() : eye.stop(); });
  io.observe(stage);
  const onVis = () => { if (!eye) return; document.hidden ? eye.stop() : eye.start(); };
  document.addEventListener('visibilitychange', onVis);
  if (eye) eye.start();

  // ── label layout: leaders to two columns, de-overlapped ──
  function layout() {
    if (!eye || fallback) return;
    const W = canvas.clientWidth; const Hh = canvas.clientHeight;
    const cr = canvas.getBoundingClientRect(); const sr = stage.getBoundingClientRect();
    const ox = cr.left - sr.left; const oy = cr.top - sr.top;
    const mobile = window.innerWidth < 760;
    const placed = LABELS.map((l, i) => {
      const a = ANCHORS[l.anchor || l.key];
      const pr = a && eye.project(a);
      const on = l.step === step && eye.lift > 0.97 && pr && pr.x > 0 && pr.x < W && pr.y > 0 && pr.y < Hh;
      return { i, l, pr, on };
    });
    const left = placed.filter((p) => p.on && p.pr.x < W / 2).sort((a, b) => a.pr.y - b.pr.y);
    const right = placed.filter((p) => p.on && p.pr.x >= W / 2).sort((a, b) => a.pr.y - b.pr.y);
    // desktop: the left column sits just left of the globe (right-aligned text) so it never runs under the copy block
    const colX = (side) => (side === 'l' ? ox + W * (mobile ? 0.04 : 0.385) : ox + W * (mobile ? 0.96 : 0.98));
    const flow = (arr, side) => {
      let y = -1e9;
      arr.forEach((p, k) => {
        // step 3 stacks the labels at the top of their column so leaders never run over the optic nerve
        y = step === 3 ? oy + Hh * 0.14 + k * (mobile ? 54 : 66) : Math.max(p.pr.y + oy - (mobile ? 6 : 10), y + (mobile ? 34 : 46));
        p.ty = y; p.side = side;
      });
    };
    flow(left, 'l'); flow(right, 'r');
    placed.forEach((p) => {
      const el = labelEls[p.i]; const ln = lines[p.i]; const dt = dots[p.i];
      el.classList.toggle('show', p.on); ln.classList.toggle('show', p.on); dt.classList.toggle('show', p.on);
      if (!p.on) return;
      const ax = p.pr.x + ox; const ay = p.pr.y + oy;
      const cx = colX(p.side);
      el.style.top = `${p.ty}px`;
      el.dataset.side = p.side;
      if (p.side === 'l' && !mobile) { el.style.right = `${sr.width - cx}px`; el.style.left = 'auto'; el.style.textAlign = 'end'; } else if (p.side === 'l') { el.style.left = `${cx}px`; el.style.right = 'auto'; el.style.textAlign = 'start'; } else { el.style.right = `${sr.width - cx}px`; el.style.left = 'auto'; el.style.textAlign = 'end'; }
      const ex = p.side === 'l' ? (mobile ? cx + 78 : cx + 12) : cx - (mobile ? 78 : 118);
      ln.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} L${(ex + (p.side === 'l' ? (mobile ? 14 : 10) : -14)).toFixed(1)} ${(p.ty + 10).toFixed(1)} L${ex.toFixed(1)} ${(p.ty + 10).toFixed(1)}`);
      dt.setAttribute('cx', ax.toFixed(1)); dt.setAttribute('cy', ay.toFixed(1));
    });
    leaders.setAttribute('width', sr.width); leaders.setAttribute('height', sr.height);
    // numbering follows visual order
    let n = 0; placed.filter((p) => p.on).sort((a, b) => a.ty - b.ty).forEach((p) => { labelEls[p.i].querySelector('.el-n').textContent = String(++n).padStart(2, '0'); });
  }

  // ── guided transition: dive into the retina, iris-open into the Workbench ──
  let entering = false;
  async function enter() {
    if (entering) return;
    entering = true;
    if (reduced) { navigate('/workbench'); return; }
    stage.classList.add('entering');
    document.documentElement.style.overflow = 'hidden';
    if (eye) { eye.setSpin(false); eye.setProgress(1); }
    const overlay = h('div', { class: 'enter-overlay', 'aria-hidden': 'true' });
    const cv = h('canvas', { width: 768, height: 768 });
    overlay.append(cv, h('div', { class: 'eo-caption mono' }, `${t('nav.workbench')} →`));
    document.body.append(overlay);
    analysis('C01').then(({ canvas: src }) => cv.getContext('2d').drawImage(src, 0, 0));
    const r = holder.getBoundingClientRect();
    overlay.style.setProperty('--cx', `${r.left + r.width / 2}px`);
    overlay.style.setProperty('--cy', `${r.top + r.height / 2}px`);
    await sleep(520);
    overlay.classList.add('open');
    await sleep(980);
    navigate('/workbench');
    await sleep(60);
    overlay.classList.add('done');
    document.documentElement.style.overflow = '';
    await sleep(520);
    overlay.remove();
  }

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    document.removeEventListener('visibilitychange', onVis);
    io.disconnect();
    if (eye) eye.destroy();
    document.documentElement.style.overflow = '';
    document.getElementById('topbar')?.classList.remove('solid');
  };
}
