// Stage 02 — EvidenceLens: zoomable retinal viewer with layered reference annotations and an inspector.
import { register, t } from '../i18n.js';
import { h, ic, btn, chip } from '../ui.js';
import { getCase, DATASET } from '../data/cases.js';
import { analysis, full } from '../render.js';
import { Viewer } from './viewer.js';
import { LESION_TYPES, LESION_ORDER, SOURCES } from '../data/references.js';
import { referenceVisible, enterStudyMode, refSummary, ledger, getModel, gradeLabel } from './shared.js';
import { qualityPanel } from './reliability.js';
import { logEvent } from '../store.js';

register({
  en: {
    'lens.aria': 'Retinal image viewer. Scroll to zoom, drag to pan, plus and minus keys to zoom, zero to fit.',
    'lens.tools': 'Viewer tools', 'lens.zoomIn': 'Zoom in', 'lens.zoomOut': 'Zoom out', 'lens.fit': 'Fit to view', 'lens.actual': 'Native resolution', 'lens.divider': 'Comparison divider',
    'lens.overlay': 'Reference annotation overlay', 'lens.macula': 'MACULA', 'lens.disc': 'DISC',
    'lens.tab.layers': 'Layers', 'lens.tab.finding': 'Finding', 'lens.tab.quality': 'Quality', 'lens.tab.compare': 'Reference vs model',
    'lens.layers.anatomy': 'Anatomy guides', 'lens.layers.anatomy.d': 'Optic disc outline, macular centre, 1 disc-diameter (DD) macular zone, quadrant axes. Orientation only.',
    'lens.layers.ref': 'Reference annotation layers', 'lens.opacity': 'Overlay opacity',
    'lens.compare': 'Draggable comparison', 'lens.compare.off': 'Off', 'lens.compare.annot': 'Plain | annotated', 'lens.compare.enh': 'Colour | green-channel enhanced',
    'lens.enh.note': 'Green-channel contrast stretch: a standard preprocessing view. It changes display only; nothing is annotated by it.',
    'lens.locked.t': 'Reference layers are locked', 'lens.locked.b': 'To keep the Diagnostic Duel honest, annotations and the reference label stay hidden until you lock an interpretation. You can open them now in Study Mode — that case then counts as practice only.',
    'lens.study': 'Enter Study Mode (practice only)', 'lens.study.on': 'Study Mode — this case is practice only',
    'lens.duel': 'Go to Diagnostic Duel',
    'lens.show': 'Show', 'lens.hide': 'Hide', 'lens.count': '{n}',
    'lens.hint': 'Scroll or pinch to zoom · drag to pan · +/− keys · 0 to fit · click an annotation for details',
    'find.none': 'Select an annotation on the image, or pick one below.', 'find.where': 'Location', 'find.quadrant': 'Quadrant', 'find.zone': 'Zone', 'find.dd': 'Distance from macular centre', 'find.rel': 'Grading relevance',
    'find.q.ST': 'superior-temporal', 'find.q.SN': 'superior-nasal', 'find.q.IT': 'inferior-temporal', 'find.q.IN': 'inferior-nasal',
    'find.z.macular': 'macular (≤ 1 DD)', 'find.z.perimacular': 'peri-macular (1–3 DD)', 'find.z.peripheral': 'peripheral (> 3 DD)',
    'find.rel.0': 'Not a grading feature.', 'find.rel.1': 'Defines mild NPDR when it is the only finding.', 'find.rel.2': 'Moves a case to at least moderate NPDR.', 'find.rel.3': 'Meets a 4-2-1 criterion for severe NPDR.', 'find.rel.4': 'Marks proliferative DR.',
    'find.src': 'Reference authorship: authored by construction from this case’s lesion list — not drawn by an AI model, not from an expert panel.',
    'find.list': 'All findings',
    'cmp.title': 'Expert reference vs model output', 'cmp.sub': 'Side by side, never merged.',
    'cmp.ref': 'Expert reference (teaching set)', 'cmp.model': 'Research model', 'cmp.label': 'Label', 'cmp.grade': 'DR level', 'cmp.dme': 'Suspected DME', 'cmp.refer': 'Referable', 'cmp.n': 'Annotated findings',
    'cmp.model.none': 'Not implemented',
    'lens.loading': 'Rendering full-resolution image…',
    'lens.synthetic': 'Synthetic teaching illustration · {id}',
  },
  ar: {
    'lens.aria': 'عارض صورة الشبكية. مرّر للتكبير، اسحب للتحريك، مفتاحا زائد وناقص للتكبير، وصفر للملاءمة.',
    'lens.tools': 'أدوات العارض', 'lens.zoomIn': 'تكبير', 'lens.zoomOut': 'تصغير', 'lens.fit': 'ملاءمة العرض', 'lens.actual': 'الدقة الأصلية', 'lens.divider': 'فاصل المقارنة',
    'lens.overlay': 'طبقة التعليقات المرجعية', 'lens.macula': 'البقعة', 'lens.disc': 'القرص',
    'lens.tab.layers': 'الطبقات', 'lens.tab.finding': 'الموجود', 'lens.tab.quality': 'الجودة', 'lens.tab.compare': 'المرجع مقابل النموذج',
    'lens.layers.anatomy': 'مرشدات التشريح', 'lens.layers.anatomy.d': 'حدود القرص البصري ومركز البقعة ومنطقة البقعة بقطر قرص واحد (DD) ومحاور الأرباع. للتوجيه فقط.',
    'lens.layers.ref': 'طبقات التعليقات المرجعية', 'lens.opacity': 'شفافية الطبقة',
    'lens.compare': 'مقارنة قابلة للسحب', 'lens.compare.off': 'إيقاف', 'lens.compare.annot': 'عادية | موسومة', 'lens.compare.enh': 'ملوّنة | معزَّزة بالقناة الخضراء',
    'lens.enh.note': 'تمديد تباين القناة الخضراء: عرض معالجة مسبقة معياري. يغيّر العرض فقط ولا يضع أي تعليقات.',
    'lens.locked.t': 'الطبقات المرجعية مقفلة', 'lens.locked.b': 'للحفاظ على نزاهة مبارزة التشخيص تبقى التعليقات والتسمية المرجعية مخفية حتى تقفل تفسيرًا. يمكنك فتحها الآن في وضع الدراسة — وعندئذ تُحتسب الحالة تدريبًا فقط.',
    'lens.study': 'ادخل وضع الدراسة (تدريب فقط)', 'lens.study.on': 'وضع الدراسة — هذه الحالة للتدريب فقط',
    'lens.duel': 'اذهب إلى مبارزة التشخيص',
    'lens.show': 'إظهار', 'lens.hide': 'إخفاء', 'lens.count': '{n}',
    'lens.hint': 'مرّر أو اقرص للتكبير · اسحب للتحريك · مفتاحا +/− · ٠ للملاءمة · انقر تعليقًا لتفاصيله',
    'find.none': 'اختر تعليقًا على الصورة أو من القائمة أدناه.', 'find.where': 'الموقع', 'find.quadrant': 'الربع', 'find.zone': 'المنطقة', 'find.dd': 'البعد عن مركز البقعة', 'find.rel': 'الصلة بالتدريج',
    'find.q.ST': 'علوي-صدغي', 'find.q.SN': 'علوي-أنفي', 'find.q.IT': 'سفلي-صدغي', 'find.q.IN': 'سفلي-أنفي',
    'find.z.macular': 'بقعي (≤ 1 DD)', 'find.z.perimacular': 'حول البقعة (1–3 DD)', 'find.z.peripheral': 'محيطي (> 3 DD)',
    'find.rel.0': 'ليس من سمات التدريج.', 'find.rel.1': 'يعرّف الاعتلال الخفيف عندما يكون الموجود الوحيد.', 'find.rel.2': 'ينقل الحالة إلى المتوسط على الأقل.', 'find.rel.3': 'يحقق أحد معايير 4-2-1 للمستوى الشديد.', 'find.rel.4': 'يدل على الاعتلال التكاثري.',
    'find.src': 'مصدر المرجع: مؤلَّف بالبناء من قائمة آفات هذه الحالة — لم يرسمه نموذج ذكاء اصطناعي ولم تضعه لجنة خبراء.',
    'find.list': 'كل الموجودات',
    'cmp.title': 'مرجع الخبراء مقابل مخرجات النموذج', 'cmp.sub': 'جنبًا إلى جنب، دون دمج.',
    'cmp.ref': 'مرجع الخبراء (مجموعة التعليم)', 'cmp.model': 'النموذج البحثي', 'cmp.label': 'التسمية', 'cmp.grade': 'مستوى الاعتلال', 'cmp.dme': 'اشتباه وذمة بقعية', 'cmp.refer': 'يستوجب الإحالة', 'cmp.n': 'الموجودات الموسومة',
    'cmp.model.none': 'غير منفَّذ',
    'lens.loading': 'جارٍ تصيير الصورة بدقة كاملة…',
    'lens.synthetic': 'رسمة تعليمية اصطناعية · {id}',
  },
});

export function lensStage(host, caseId, { onNav, rerender }) {
  const c = getCase(caseId);
  const vis = referenceVisible(caseId);
  let viewer; let dead = false;
  const state = { layers: new Set(['anatomy']), opacity: 1, tab: 'layers', selected: null };

  const stage = h('div', { class: 'lens-stage' });
  const hostEl = h('div', { class: 'lens-host' });
  const loading = h('div', { class: 'lens-loading mono' }, h('i', { class: 'spin' }), t('lens.loading'));
  const toolbar = h('div', { class: 'lens-tools', role: 'toolbar', 'aria-label': t('lens.tools') },
    ...[['plus', 'lens.zoomIn', () => viewer.zoomBy(1.4)], ['minus', 'lens.zoomOut', () => viewer.zoomBy(1 / 1.4)], ['fit', 'lens.fit', () => viewer.fit()], ['one', 'lens.actual', () => viewer.actual()]]
      .map(([i, k, fn]) => h('button', { type: 'button', class: 'icon-btn', title: t(k), 'aria-label': t(k), on: { click: fn } }, ic(i, 16))));
  const cap = h('div', { class: 'lens-cap fig' }, h('b', null, `FIG. ${caseId.slice(1)}`), t('lens.synthetic', { id: caseId }), ' · ', t(`case.eye.${c.eye}`));
  const left = h('div', { class: 'lens-col' }, hostEl, toolbar, cap, h('p', { class: 'small muted lens-hint' }, t('lens.hint')));

  const tabs = ['layers', 'finding', 'quality', 'compare'];
  const tabBtns = tabs.map((k, i) => h('button', { type: 'button', role: 'tab', class: 'tab', id: `lt-${k}`, 'aria-selected': String(k === state.tab), 'aria-controls': 'lens-panel', on: { click: () => setTab(k) } }, h('span', { class: 'tn' }, `0${i + 1}`), t(`lens.tab.${k}`)));
  const tabBar = h('div', { class: 'tabs', role: 'tablist' }, tabBtns);
  const panel = h('div', { class: 'lens-panel', id: 'lens-panel', role: 'tabpanel' });
  const right = h('aside', { class: 'inspector panel ticked' }, tabBar, panel);
  stage.append(left, right);
  host.append(stage);
  hostEl.append(loading);

  function setTab(k) { state.tab = k; tabBtns.forEach((b, i) => b.setAttribute('aria-selected', String(tabs[i] === k))); drawPanel(); }

  // ── panels ──
  function layerRow(key, label, count, desc, color, locked) {
    const on = state.layers.has(key);
    const id = `lay-${key}`;
    return h('label', { class: ['lay-row', locked && 'is-locked'], for: id },
      h('input', { type: 'checkbox', id, checked: on, disabled: locked, on: { change: (e) => { e.target.checked ? state.layers.add(key) : state.layers.delete(key); viewer.setLayers(state.layers); } } }),
      h('span', { class: 'lay-sw', style: { '--c': color } }), h('span', { class: 'lay-t' }, h('b', null, label), desc ? h('span', { class: 'small muted' }, desc) : null), count !== null ? h('span', { class: 'num lay-n' }, count) : null);
  }
  function panelLayers() {
    const types = LESION_ORDER.filter((tp) => c.lesions.some((l) => l.type === tp));
    const body = [layerRow('anatomy', t('lens.layers.anatomy'), null, t('lens.layers.anatomy.d'), '#9FB3C8', false)];
    if (!vis) {
      body.push(h('div', { class: 'note note-warn lock-note' }, ic('lock'), h('div', null, h('b', null, t('lens.locked.t')), h('p', { class: 'small' }, t('lens.locked.b')), h('div', { class: 'lock-actions' },
        btn(t('lens.study'), { variant: 'solid', cls: 'btn-sm', on: () => { enterStudyMode(caseId); logEvent('layers-open', caseId, 'study mode'); rerender(); } }),
        btn(t('lens.duel'), { variant: 'quiet', cls: 'btn-sm', icon: 'arrow', on: () => onNav('duel') })))));
    } else {
      body.push(h('p', { class: 'kicker lay-h' }, t('lens.layers.ref')));
      if (!c.reference.gradable) body.push(h('p', { class: 'small muted' }, t('prov.ref.ungradable')));
      types.forEach((tp) => body.push(layerRow(tp, t(`les.${tp}`), c.lesions.filter((l) => l.type === tp).length, null, LESION_TYPES[tp].color, false)));
      body.push(h('div', { class: 'lay-quick' }, btn(t('lens.show'), { variant: 'quiet', cls: 'btn-sm', on: () => { types.forEach((tp) => state.layers.add(tp)); viewer.setLayers(state.layers); drawPanel(); } }), btn(t('lens.hide'), { variant: 'quiet', cls: 'btn-sm', on: () => { types.forEach((tp) => state.layers.delete(tp)); viewer.setLayers(state.layers); drawPanel(); } })));
    }
    const op = h('input', { type: 'range', id: 'ov-op', min: 0, max: 100, value: state.opacity * 100, on: { input: (e) => { state.opacity = e.target.value / 100; viewer.setLayers(undefined, state.opacity); } } });
    body.push(h('div', { class: 'field' }, h('label', { for: 'ov-op' }, t('lens.opacity')), op));
    const mode = (v, label, disabled) => h('label', null, h('input', { type: 'radio', name: 'cmp', value: v, checked: viewer.compare.mode === v, disabled, on: { change: () => viewer.setCompare(v) } }), h('span', null, label));
    body.push(h('div', { class: 'field' }, h('span', { class: 'lbl' }, t('lens.compare')), h('div', { class: 'seg seg-wrap', role: 'radiogroup' }, mode('off', t('lens.compare.off')), mode('annot', t('lens.compare.annot'), !vis), mode('enhanced', t('lens.compare.enh')))), h('p', { class: 'small muted' }, t('lens.enh.note')));
    panel.replaceChildren(...body);
  }
  function panelFinding() {
    const l = c.lesions.find((x) => x.id === state.selected);
    if (!vis) { panel.replaceChildren(h('div', { class: 'note note-warn' }, ic('lock'), h('span', null, t('lens.locked.b')))); return; }
    const out = [];
    if (l) {
      const tp = LESION_TYPES[l.type]; const src = SOURCES[tp.source];
      out.push(h('div', { class: 'find-head' }, h('span', { class: 'lay-sw', style: { '--c': tp.color } }), h('div', null, h('p', { class: 'kicker' }, l.id), h('h3', { class: 'h3' }, t(`les.${l.type}`)))),
        h('p', { class: 'small' }, t(`les.${l.type}.desc`)),
        h('dl', { class: 'kv' }, h('dt', null, t('find.quadrant')), h('dd', null, t(`find.q.${l.quadrant}`)), h('dt', null, t('find.zone')), h('dd', null, t(`find.z.${l.zone}`)), h('dt', null, t('find.dd')), h('dd', { class: 'num' }, `${l.ddFromMacula} DD`), h('dt', null, t('find.rel')), h('dd', null, t(`find.rel.${tp.grade ?? 0}`))),
        h('div', { class: 'src-card' }, h('p', { class: 'kicker' }, t('src.label')), h('p', { class: 'small' }, src.cite), h('a', { href: src.url, target: '_blank', rel: 'noopener noreferrer', class: 'src-link' }, t('src.open'), ic('external', 12)), h('p', { class: 'small muted' }, t('find.src'))));
    } else out.push(h('p', { class: 'small muted' }, t('find.none')));
    out.push(h('p', { class: 'kicker lay-h' }, t('find.list')));
    out.push(h('ul', { class: 'find-list' }, c.lesions.map((x) => h('li', null, h('button', { type: 'button', class: ['fl', x.id === state.selected && 'on'], on: { click: () => viewer.select(x.id) } }, h('span', { class: 'lay-sw', style: { '--c': LESION_TYPES[x.type].color } }), h('span', null, `${x.id} · ${t(`les.${x.type}`)}`), h('span', { class: 'num muted' }, `${x.ddFromMacula} DD`))))));
    panel.replaceChildren(...out);
  }
  async function panelQuality() {
    panel.replaceChildren(h('div', { class: 'skeleton', style: { height: '200px' } }));
    const a = await analysis(caseId);
    if (!dead && state.tab === 'quality') panel.replaceChildren(qualityPanel(a.quality));
  }
  function panelCompare() {
    const row = (k, ref, model) => h('tr', null, h('th', { scope: 'row' }, t(`cmp.${k}`)), h('td', null, ref), h('td', { class: 'is-none' }, model));
    const r = c.reference;
    const refVals = vis
      ? { label: refSummary(c), grade: r.gradable ? gradeLabel(r.icdr) : '—', dme: r.gradable ? t(r.dme ? 'yes' : 'no') : '—', refer: r.gradable ? t(r.referable ? 'ref.referable' : 'ref.nonreferable') : '—', n: String(c.lesions.length) }
      : { label: '▒▒▒▒', grade: '▒▒', dme: '▒▒', refer: '▒▒▒', n: '▒▒' };
    panel.replaceChildren(h('p', { class: 'kicker' }, t('cmp.title')), h('p', { class: 'small muted' }, t('cmp.sub')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'ledger cmp' }, h('thead', null, h('tr', null, h('th', null), h('th', null, h('span', { class: 'prov prov-real' }, t('cmp.ref'))), h('th', null, h('span', { class: 'prov prov-none' }, t('cmp.model'))))),
        h('tbody', null, row('label', refVals.label, t('cmp.model.none')), row('grade', refVals.grade, '—'), row('dme', refVals.dme, '—'), row('refer', refVals.refer, '—'), row('n', refVals.n, '—')))),
      h('div', { class: 'note' }, ic('info'), h('span', null, t('model.none.b'))),
      ledger(caseId, { compact: true }));
  }
  function drawPanel() { ({ layers: panelLayers, finding: panelFinding, quality: panelQuality, compare: panelCompare })[state.tab](); }

  // ── viewer boot: instant 768 preview, then swap to the 1536 render ──
  analysis(caseId).then(({ canvas }) => {
    if (dead) return;
    loading.remove();
    viewer = new Viewer(hostEl, {
      lesions: vis ? c.lesions : [], plan: c.plan, annotations: vis,
      label: t('lens.aria'),
      onSelect: (l) => { state.selected = l ? l.id : null; if (l) setTab('finding'); else if (state.tab === 'finding') drawPanel(); },
    });
    viewer.setImage(canvas);
    viewer.setLayers(state.layers, state.opacity);
    drawPanel();
    full(caseId).then((big) => { if (!dead && viewer) viewer.setImage(big); });
  });
  drawPanel = drawPanel; // (hoisted function reference kept for clarity)
  return () => { dead = true; viewer?.destroy(); };
}
