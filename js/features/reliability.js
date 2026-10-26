// Quality & uncertainty review + Reliability Stress Test.
// Everything measured here comes from real pixels. There is no model, so no model response is ever shown.
import { register, t, fmtPct, fmtNum, getLang } from '../i18n.js';
import { h, s, btn, chip, ic } from '../ui.js';
import { getCase } from '../data/cases.js';
import { analysis, analysisPixels } from '../render.js';
import { gaussianBlur, adjust } from '../lib/imageops.js';
import { measureQuality, assessQuality, lesionConspicuity, BANDS } from '../lib/quality.js';
import { referenceVisible, getModel, ruleTrace } from './shared.js';
import { state, update, logEvent } from '../store.js';
import { LESION_TYPES } from '../data/references.js';

register({
  en: {
    'q.title': 'Image quality — measured from pixels', 'q.sub': 'Prototype heuristics tuned on the 16 teaching images. They are not validated gradability criteria.',
    'q.sharpness': 'Sharpness', 'q.brightness': 'Brightness', 'q.contrast': 'Contrast', 'q.evenness': 'Illumination evenness', 'q.coverage': 'Field coverage',
    'q.sharpness.d': 'RMS Laplacian of the green channel (focus)', 'q.brightness.d': 'Mean luminance inside the field, 0–255', 'q.contrast.d': 'Standard deviation of luminance', 'q.evenness.d': '1 = equal light across the four quadrants', 'q.coverage.d': 'Share of the field that is not black',
    'q.level.adequate': 'Adequate', 'q.level.borderline': 'Borderline', 'q.level.insufficient': 'Insufficient',
    'q.verdict.adequate': 'Quality adequate by prototype heuristics', 'q.verdict.borderline': 'Borderline quality — read with caution and consider recapture',
    'q.verdict.insufficient': 'No result — image unsuitable for screening',
    'q.reasons': 'Flagged: {list}',
    'nr.title': 'No-result pathway', 'nr.b': 'When an image is too poor to read, the correct output is no grade at all. Do not guess.',
    'nr.s1': 'Withhold any DR grade and any referral decision from this image.', 'nr.s2': 'Recapture the image (clean lens, dilate if appropriate, re-centre, refocus).', 'nr.s3': 'If recapture fails, arrange an in-person examination.', 'nr.s4': 'Document why the image was unsuitable.',
    'nr.use': 'Record “recapture / in-person” as my draft disposition', 'nr.used': 'Draft disposition recorded — finish it in Clinician Approval.',
    'st.title': 'Reliability Stress Test', 'st.sub': 'Degrade this image and watch what changes. Only pixel effects are shown — no model confidence is invented.',
    'st.blur': 'Blur (σ px)', 'st.bright': 'Brightness', 'st.contrast': 'Contrast', 'st.reset': 'Reset', 'st.preset.defocus': 'Defocus', 'st.preset.dark': 'Under-exposed', 'st.preset.washed': 'Washed-out',
    'st.orig': 'Original', 'st.live': 'Transformed (live)',
    'st.model.t': 'Model response to the transformed image', 'st.model.none': 'Not available. No compatible research model is loaded, so none is run and nothing is estimated. Showing a confidence value here would be fabrication.',
    'st.lesion.t': 'Lesion-region contrast retained', 'st.lesion.b': 'Mean difference between each annotated region and its surroundings, relative to the original image. It measures pixels, not human or model performance.',
    'st.lesion.locked': 'Locked until reference layers are open (lock an interpretation in the Duel, or enter Study Mode).',
    'st.lesion.none': 'No annotated findings on this image.',
    'unc.title': 'Uncertainty register', 'unc.sub': 'What limits confidence in this one case.',
    'unc.q.borderline': 'Measured image quality is borderline ({list}). Small findings may be hidden.', 'unc.q.insufficient': 'Measured image quality is insufficient ({list}). The correct output may be no result.',
    'unc.single': 'One image of one eye, with no clinical history, no second field, no OCT. Real screening uses more.',
    'unc.synthetic': 'This is a synthetic teaching illustration. Real fundus photographs vary in ways that are not represented here (camera, pigmentation, media opacity, co-existing disease).',
    'unc.ref': 'The reference label is one authored standard. Inter-grader variability — a real source of uncertainty — is not quantified for this teaching set.',
    'unc.sparse': 'The reference grade rests on few findings ({n}). A grader who misses one or two could reasonably change category.',
    'unc.periph': 'Most findings lie more than 3 disc diameters from the macula, where attention often drops.',
    'unc.dme': 'Suspected macular oedema is inferred from exudates near the macular centre; a photograph cannot show retinal thickness.',
    'unc.artifact': 'An imaging artefact is present. It must be recognised and ignored, not graded.',
    'unc.not.t': 'What this review does not tell you', 'unc.not.1': 'It does not say what a model would predict — there is no model.', 'unc.not.2': 'It does not validate any clinical threshold.', 'unc.not.3': 'It does not replace a clinician’s decision.',
  },
  ar: {
    'q.title': 'جودة الصورة — مقاسة من البكسلات', 'q.sub': 'قواعد تقريبية للنموذج الأولي مضبوطة على الصور التعليمية الست عشرة. ليست معايير صلاحية للتدريج مُصادَقًا عليها.',
    'q.sharpness': 'الحدة', 'q.brightness': 'السطوع', 'q.contrast': 'التباين', 'q.evenness': 'تجانس الإضاءة', 'q.coverage': 'تغطية المجال',
    'q.sharpness.d': 'الجذر التربيعي لمتوسط لابلاس للقناة الخضراء (التركيز)', 'q.brightness.d': 'متوسط اللمعان داخل المجال من ٠ إلى ٢٥٥', 'q.contrast.d': 'الانحراف المعياري للّمعان', 'q.evenness.d': '١ = ضوء متساوٍ في الأرباع الأربعة', 'q.coverage.d': 'نسبة المجال غير الأسود',
    'q.level.adequate': 'كافية', 'q.level.borderline': 'حدّية', 'q.level.insufficient': 'غير كافية',
    'q.verdict.adequate': 'الجودة كافية وفق القواعد التقريبية للنموذج', 'q.verdict.borderline': 'جودة حدّية — اقرأ بحذر وفكّر في إعادة التصوير',
    'q.verdict.insufficient': 'لا نتيجة — الصورة غير صالحة للفحص',
    'q.reasons': 'العلامات: {list}',
    'nr.title': 'مسار «لا نتيجة»', 'nr.b': 'عندما تكون الصورة أسوأ من أن تُقرأ، فالمخرج الصحيح هو عدم إعطاء أي درجة. لا تخمّن.',
    'nr.s1': 'امنع أي درجة اعتلال شبكية وأي قرار إحالة بناءً على هذه الصورة.', 'nr.s2': 'أعد تصوير الصورة (عدسة نظيفة، توسيع الحدقة عند الاقتضاء، إعادة التمركز والتركيز).', 'nr.s3': 'إن فشلت الإعادة فرتّب فحصًا حضوريًا.', 'nr.s4': 'دوّن سبب عدم صلاحية الصورة.',
    'nr.use': 'سجّل «إعادة التصوير / فحص حضوري» كقرار مسوّدة', 'nr.used': 'سُجّل قرار المسوّدة — أكمله في اعتماد الطبيب.',
    'st.title': 'اختبار تحمّل الموثوقية', 'st.sub': 'أفسد هذه الصورة وراقب ما يتغير. تُعرض تأثيرات البكسلات فقط — ولا تُختلق ثقة نموذج.',
    'st.blur': 'التمويه (σ بكسل)', 'st.bright': 'السطوع', 'st.contrast': 'التباين', 'st.reset': 'إعادة ضبط', 'st.preset.defocus': 'فقدان التركيز', 'st.preset.dark': 'تعريض ناقص', 'st.preset.washed': 'باهتة',
    'st.orig': 'الأصل', 'st.live': 'المعدَّلة (مباشر)',
    'st.model.t': 'استجابة النموذج للصورة المعدَّلة', 'st.model.none': 'غير متاحة. لا يوجد نموذج بحثي متوافق، فلا يُشغَّل شيء ولا يُقدَّر شيء. وعرض قيمة ثقة هنا سيكون اختلاقًا.',
    'st.lesion.t': 'تباين مناطق الآفات المتبقي', 'st.lesion.b': 'متوسط الفرق بين كل منطقة موسومة ومحيطها نسبةً إلى الصورة الأصلية. يقيس البكسلات وليس أداء الإنسان أو النموذج.',
    'st.lesion.locked': 'مقفلة حتى تُفتح الطبقات المرجعية (اقفل تفسيرًا في المبارزة أو ادخل وضع الدراسة).',
    'st.lesion.none': 'لا موجودات موسومة في هذه الصورة.',
    'unc.title': 'سجل عدم اليقين', 'unc.sub': 'ما يحدّ من الثقة في هذه الحالة الواحدة.',
    'unc.q.borderline': 'جودة الصورة المقاسة حدّية ({list}). قد تختفي الموجودات الصغيرة.', 'unc.q.insufficient': 'جودة الصورة المقاسة غير كافية ({list}). قد يكون المخرج الصحيح هو «لا نتيجة».',
    'unc.single': 'صورة واحدة لعين واحدة، بلا تاريخ سريري ولا مجال ثانٍ ولا OCT. والفحص الحقيقي يستخدم أكثر من ذلك.',
    'unc.synthetic': 'هذه رسمة تعليمية اصطناعية. وصور قاع العين الحقيقية تتباين بطرق غير ممثَّلة هنا (الكاميرا، التصبغ، عتامة الوسائط، الأمراض المصاحبة).',
    'unc.ref': 'التسمية المرجعية معيار مؤلَّف واحد. أما التباين بين المقيّمين — وهو مصدر حقيقي لعدم اليقين — فلم يُقَس لهذه المجموعة.',
    'unc.sparse': 'تستند الدرجة المرجعية إلى موجودات قليلة ({n}). ومقيّم يفوّت واحدة أو اثنتين قد يغيّر الفئة بصورة معقولة.',
    'unc.periph': 'معظم الموجودات تبعد أكثر من ٣ أقطار قرص بصري عن البقعة، حيث يقل الانتباه عادةً.',
    'unc.dme': 'اشتباه الوذمة البقعية مستنتج من إفرازات قرب مركز البقعة؛ والصورة لا تُظهر سماكة الشبكية.',
    'unc.artifact': 'يوجد أثر تصوير. يجب التعرف عليه وتجاهله لا تدريجه.',
    'unc.not.t': 'ما لا تخبرك به هذه المراجعة', 'unc.not.1': 'لا تقول ما الذي سيتنبأ به نموذج — فلا يوجد نموذج.', 'unc.not.2': 'لا تُصادق على أي عتبة سريرية.', 'unc.not.3': 'لا تحل محل قرار الطبيب.',
  },
});

const DOMAIN = { sharpness: [0, 5], brightness: [0, 255], contrast: [0, 50], evenness: [0, 1], coverage: [0, 1] };
function zonesFor(key) {
  const b = BANDS[key];
  const [d0, d1] = DOMAIN[key];
  if (key === 'brightness') return [[d0, b.low[0], 'insufficient'], [b.low[0], b.low[1], 'borderline'], [b.low[1], b.high[0], 'adequate'], [b.high[0], b.high[1], 'borderline'], [b.high[1], d1, 'insufficient']];
  return [[d0, b.insufficient, 'insufficient'], [b.insufficient, b.borderline, 'borderline'], [b.borderline, d1, 'adequate']];
}

function gauge(key, value) {
  const [d0, d1] = DOMAIN[key];
  const W = 240; const x = (v) => ((Math.min(d1, Math.max(d0, v)) - d0) / (d1 - d0)) * W;
  const svg = s('svg', { class: 'gauge', viewBox: `0 0 ${W} 22`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  zonesFor(key).forEach(([a, b, lvl]) => svg.append(s('rect', { x: x(a), y: 8, width: Math.max(0, x(b) - x(a)), height: 6, class: `gz gz-${lvl}` })));
  svg.append(s('path', { class: 'gm', d: `M${x(value)} 2V20` }), s('path', { class: 'gm-cap', d: `M${x(value) - 4} 2h8` }));
  return svg;
}

const levelOf = (assessment, key) => assessment.reasons.find((r) => r.key === key)?.level || 'adequate';
const fmtMetric = (key, v) => (key === 'evenness' || key === 'coverage' ? fmtNum(v, 2) : key === 'brightness' ? fmtNum(v, 0) : fmtNum(v, 1));

export function qualityPanel(q, { title = true } = {}) {
  const { metrics, assessment } = q;
  return h('section', { class: 'qp' },
    title ? h('header', null, h('p', { class: 'kicker' }, t('q.title')), h('p', { class: 'small muted' }, t('q.sub'))) : null,
    h('div', { class: ['qp-verdict', `lv-${assessment.level}`] }, h('b', null, t(`q.level.${assessment.level}`)), assessment.reasons.length ? h('span', { class: 'small' }, t('q.reasons', { list: assessment.reasons.map((r) => t(`q.${r.key}`)).join(', ') })) : null),
    ...Object.keys(DOMAIN).map((k) => h('div', { class: ['qp-row', `lv-${levelOf(assessment, k)}`] },
      h('div', { class: 'qp-l' }, h('b', null, t(`q.${k}`)), h('span', { class: 'small muted' }, t(`q.${k}.d`))),
      h('div', { class: 'qp-g' }, gauge(k, metrics[k])),
      h('div', { class: 'qp-v num' }, fmtMetric(k, metrics[k])))));
}

export function uncertaintyList(caseId, q) {
  const c = getCase(caseId);
  const items = [];
  if (q && q.assessment.level !== 'adequate') items.push([q.assessment.level === 'insufficient' ? 'brick' : 'ochre', t(`unc.q.${q.assessment.level}`, { list: q.assessment.reasons.map((r) => t(`q.${r.key}`)).join(', ') })]);
  if (referenceVisible(caseId) && c.reference.gradable) {
    const L = c.lesions.filter((l) => l.type !== 'artifact');
    if (c.reference.icdr === 2 && L.length <= 10) items.push(['ochre', t('unc.sparse', { n: L.length })]);
    const far = L.filter((l) => l.ddFromMacula > 3).length;
    if (L.length && far / L.length > 0.7) items.push(['ochre', t('unc.periph')]);
    if (c.reference.dme) items.push(['ochre', t('unc.dme')]);
    if (c.lesions.some((l) => l.type === 'artifact')) items.push(['ochre', t('unc.artifact')]);
  }
  items.push(['ink', t('unc.single')], ['ink', t('unc.synthetic')], ['ink', t('unc.ref')]);
  return h('section', { class: 'unc' },
    h('header', null, h('p', { class: 'kicker' }, t('unc.title')), h('p', { class: 'small muted' }, t('unc.sub'))),
    h('ul', { class: 'unc-list' }, items.map(([tone, text]) => h('li', { class: `unc-${tone}` }, h('i'), h('span', null, text)))),
    h('div', { class: 'unc-not' }, h('p', { class: 'kicker' }, t('unc.not.t')), h('ul', null, [1, 2, 3].map((n) => h('li', { class: 'small' }, t(`unc.not.${n}`))))));
}

// ── full stage ────────────────────────────────────────────────────────────────────────────────────
export function reliabilityStage(host, caseId) {
  const c = getCase(caseId);
  const left = h('div', { class: 'rel-main' });
  const right = h('aside', { class: 'rel-side' });
  host.append(h('div', { class: 'rel-grid' }, left, right));
  let dead = false;

  const loading = h('div', { class: 'skeleton', style: { height: '320px' } });
  left.append(loading);
  analysis(caseId).then(async ({ canvas, quality }) => {
    if (dead) return;
    loading.remove();
    const base = await analysisPixels(caseId);
    const SIZE = base.width;

    // controls
    const sl = (id, label, min, max, step, val, fmt) => {
      const out = h('output', { class: 'num', for: id }, fmt(val));
      const input = h('input', { type: 'range', id, min, max, step, value: val });
      return { out, input, wrap: h('div', { class: 'field st-ctl' }, h('label', { for: id }, label, ' ', out), input) };
    };
    const blur = sl('st-blur', t('st.blur'), 0, 14, 0.5, 0, (v) => Number(v).toFixed(1));
    const bright = sl('st-bright', t('st.bright'), -50, 50, 1, 0, (v) => `${v > 0 ? '+' : ''}${v}%`);
    const contrast = sl('st-contrast', t('st.contrast'), 50, 200, 5, 100, (v) => `${v}%`);
    const set = (b, br, co) => { blur.input.value = b; bright.input.value = br; contrast.input.value = co; update2(); };
    const shown = h('canvas', { width: SIZE, height: SIZE, class: 'st-canvas', role: 'img', 'aria-label': t('st.live') });
    const orig = h('canvas', { width: SIZE, height: SIZE, class: 'st-canvas st-orig', role: 'img', 'aria-label': t('st.orig') });
    orig.getContext('2d').drawImage(canvas, 0, 0);
    const verdict = h('div', { class: 'st-verdict' });
    const nrBox = h('div', { class: 'nr', hidden: true });
    const qHost = h('div', { class: 'st-q' });
    const lesHost = h('div', { class: 'st-les' });
    const sx = shown.getContext('2d');

    const baseConsp = referenceVisible(caseId) ? lesionConspicuity(base, c.lesions, SIZE) : null;
    let rafId = 0; let metricTimer = 0;
    function render() {
      rafId = 0;
      const work = { data: new Uint8ClampedArray(base.data), width: base.width, height: base.height };
      const sig = Number(blur.input.value);
      if (sig > 0) gaussianBlur(work, sig * (SIZE / 768) * 1);
      adjust(work, { brightness: Number(bright.input.value), contrast: Number(contrast.input.value) });
      sx.putImageData(new ImageData(work.data, SIZE, SIZE), 0, 0);
      clearTimeout(metricTimer);
      metricTimer = setTimeout(() => metrics(work), 90);
    }
    function metrics(work) {
      const m = measureQuality(work); const a = assessQuality(m);
      const q2 = { metrics: m, assessment: a };
      qHost.replaceChildren(qualityPanel(q2, { title: false }));
      verdict.className = `st-verdict lv-${a.level}`;
      verdict.replaceChildren(h('b', null, t(`q.verdict.${a.level}`)), a.reasons.length ? h('span', { class: 'small' }, t('q.reasons', { list: a.reasons.map((r) => t(`q.${r.key}`)).join(', ') })) : null);
      nrBox.hidden = a.level !== 'insufficient';
      if (a.level === 'insufficient' && !nrBox.firstChild) {
        const used = state().review[caseId]?.draftDisposition === 'recapture';
        const note = h('p', { class: 'small', 'aria-live': 'polite' }, used ? t('nr.used') : '');
        nrBox.append(h('p', { class: 'kicker' }, t('nr.title')), h('p', null, t('nr.b')), h('ol', { class: 'nr-steps' }, [1, 2, 3, 4].map((n) => h('li', null, t(`nr.s${n}`)))),
          btn(t('nr.use'), { icon: 'arrow', variant: 'solid', on: () => { update((st) => { st.review[caseId] = { ...(st.review[caseId] || {}), draftDisposition: 'recapture' }; }); logEvent('no-result', caseId, 'draft disposition: recapture'); note.textContent = t('nr.used'); } }), note);
      }
      if (baseConsp) {
        const cur = lesionConspicuity(work, c.lesions, SIZE);
        const byType = {};
        cur.forEach((x, i) => { const o = baseConsp[i].contrast || 0.0001; (byType[x.type] ||= []).push({ o: baseConsp[i].contrast, c: x.contrast }); });
        const rows = Object.entries(byType).map(([type, arr]) => { const o = arr.reduce((a, v) => a + v.o, 0) / arr.length; const cc = arr.reduce((a, v) => a + v.c, 0) / arr.length; return [type, o > 0 ? Math.min(1.5, cc / o) : 0]; });
        lesHost.replaceChildren(...(rows.length ? rows.map(([type, r]) => h('div', { class: 'les-bar' }, h('span', { class: 'lb-n' }, h('i', { style: { background: LESION_TYPES[type].color } }), t(`les.${type}`)), h('span', { class: 'lb-t' }, h('i', { style: { width: `${Math.min(100, r * 100)}%` } })), h('span', { class: 'num lb-v' }, fmtPct(r)))) : [h('p', { class: 'small muted' }, t('st.lesion.none'))]));
      }
    }
    function update2() {
      blur.out.textContent = Number(blur.input.value).toFixed(1);
      bright.out.textContent = `${bright.input.value > 0 ? '+' : ''}${bright.input.value}%`;
      contrast.out.textContent = `${contrast.input.value}%`;
      if (!rafId) rafId = requestAnimationFrame(render);
    }
    [blur, bright, contrast].forEach((x) => x.input.addEventListener('input', update2));

    left.append(
      h('header', { class: 'rel-head' }, h('p', { class: 'kicker' }, t('st.title')), h('p', { class: 'small muted' }, t('st.sub'))),
      h('div', { class: 'st-stage' },
        h('figure', null, h('div', { class: 'st-frame' }, orig), h('figcaption', { class: 'fig' }, h('b', null, 'A'), t('st.orig'))),
        h('figure', null, h('div', { class: 'st-frame' }, shown), h('figcaption', { class: 'fig' }, h('b', null, 'B'), t('st.live')))),
      h('div', { class: 'st-controls' }, blur.wrap, bright.wrap, contrast.wrap,
        h('div', { class: 'st-presets' },
          btn(t('st.preset.defocus'), { variant: 'quiet', cls: 'btn-sm', on: () => set(7, 0, 100) }), btn(t('st.preset.dark'), { variant: 'quiet', cls: 'btn-sm', on: () => set(0, -38, 90) }),
          btn(t('st.preset.washed'), { variant: 'quiet', cls: 'btn-sm', on: () => set(1, 28, 55) }), btn(t('st.reset'), { variant: 'quiet', cls: 'btn-sm', icon: 'reset', on: () => set(0, 0, 100) }))),
      verdict, nrBox,
      h('div', { class: 'st-two' },
        h('section', { class: 'st-block' }, h('p', { class: 'kicker' }, t('st.model.t')),
          getModel() ? null : h('div', { class: 'note note-warn' }, ic('info'), h('span', null, t('st.model.none')))),
        h('section', { class: 'st-block' }, h('p', { class: 'kicker' }, t('st.lesion.t')), h('p', { class: 'small muted' }, t('st.lesion.b')),
          baseConsp ? lesHost : h('div', { class: 'note' }, ic('lock'), h('span', null, t('st.lesion.locked'))))));
    right.append(h('section', { class: 'panel ticked' }, h('div', { class: 'st-q-wrap' }, h('p', { class: 'kicker' }, t('q.title')), h('p', { class: 'small muted' }, t('q.sub')), qHost)), h('section', { class: 'panel ticked' }, uncertaintyList(caseId, quality)));
    shown.getContext('2d').drawImage(canvas, 0, 0);
    metrics({ data: base.data, width: base.width, height: base.height });
  });
  return () => { dead = true; };
}
