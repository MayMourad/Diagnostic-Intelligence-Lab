// Shell: top bar, status bar, footer, hash router, language switching.
import { BRAND, markSVG } from './brand.js';
import { register, t, getLang, setLang, onLang } from './i18n.js';
import { state, update } from './store.js';
import { h, $, clear, ic, announce } from './ui.js';
import { analysis } from './render.js';
import { CASE_IDS } from './data/cases.js';
import './data/references.js';

register({
  en: {
    'nav.entry': 'Entry', 'nav.workbench': 'Workbench', 'nav.lab': 'Accuracy Lab', 'nav.more': 'More',
    'nav.dashboard': 'Dashboard', 'nav.dashboard.d': 'Your local progress and audit trail',
    'nav.review': 'Review Queue', 'nav.review.d': 'Reviewer tools: interpretations, discrepancies, approvals',
    'nav.carebridge': 'CareBridge', 'nav.carebridge.d': 'Referral letters from approved dispositions',
    'nav.responsible': 'Responsible AI', 'nav.responsible.d': 'Intended use, limits and safeguards',
    'nav.about': 'About & credits', 'nav.about.d': 'Team, method, sources, how to rename',
    'brand.sub': 'Student research prototype',
    'sb.prototype': 'Educational prototype · synthetic images', 'sb.model': 'Research model: not implemented', 'sb.local': 'Data stays in this browser', 'sb.device': 'Not a medical device',
    'foot.credits': 'Student project', 'foot.disclaimer': 'Educational prototype. Not a medical device, not clinical advice. All images are synthetic teaching illustrations; no patient data is used or stored. The project title is provisional.',
    'foot.privacy': 'Privacy', 'foot.privacy.body': 'No accounts, no analytics, no uploads. Records stay in this browser’s local storage and can be erased from the Dashboard. The only external request is the typeface stylesheet.',
    'skip': 'Skip to content', 'lang.switch': 'العربية', 'lang.aria': 'Switch language to Arabic',
    'page.notfound': 'Page not found', 'page.notfound.b': 'That address does not exist in this prototype.', 'page.home': 'Back to entry',
  },
  ar: {
    'nav.entry': 'المدخل', 'nav.workbench': 'منصة العمل', 'nav.lab': 'مختبر الدقة', 'nav.more': 'المزيد',
    'nav.dashboard': 'لوحة المتابعة', 'nav.dashboard.d': 'تقدمك المحلي وسجل التدقيق',
    'nav.review': 'قائمة المراجعة', 'nav.review.d': 'أدوات المراجع: التفسيرات والاختلافات والاعتمادات',
    'nav.carebridge': 'جسر الرعاية', 'nav.carebridge.d': 'خطابات إحالة من القرارات المعتمدة',
    'nav.responsible': 'الذكاء الاصطناعي المسؤول', 'nav.responsible.d': 'الاستخدام المقصود والحدود والضمانات',
    'nav.about': 'حول المشروع والفريق', 'nav.about.d': 'الفريق والمنهجية والمصادر وتغيير الاسم',
    'brand.sub': 'نموذج بحثي طلابي',
    'sb.prototype': 'نموذج تعليمي · صور اصطناعية', 'sb.model': 'النموذج البحثي: غير منفَّذ', 'sb.local': 'تبقى البيانات في هذا المتصفح', 'sb.device': 'ليس جهازًا طبيًا',
    'foot.credits': 'مشروع طلابي', 'foot.disclaimer': 'نموذج تعليمي. ليس جهازًا طبيًا ولا نصيحة سريرية. جميع الصور رسومات تعليمية اصطناعية؛ لا تُستخدم بيانات مرضى ولا تُخزَّن. عنوان المشروع مؤقت.',
    'foot.privacy': 'الخصوصية', 'foot.privacy.body': 'لا حسابات ولا تحليلات ولا رفع ملفات. تبقى السجلات في التخزين المحلي لهذا المتصفح ويمكن مسحها من لوحة المتابعة. الطلب الخارجي الوحيد هو ملف الخطوط.',
    'skip': 'تخطَّ إلى المحتوى', 'lang.switch': 'English', 'lang.aria': 'التبديل إلى اللغة الإنجليزية',
    'page.notfound': 'الصفحة غير موجودة', 'page.notfound.b': 'هذا العنوان غير موجود في هذا النموذج.', 'page.home': 'العودة إلى المدخل',
  },
});

// ───────── routes (lazy-loaded) ─────────
const ROUTES = [
  { re: /^\/?$/, env: 'entry', load: () => import('./features/entry.js') },
  { re: /^\/workbench(?:\/([^/]+))?(?:\/([^/]+))?$/, env: 'workbench', load: () => import('./features/workbench.js'), keys: ['caseId', 'stage'] },
  { re: /^\/lab(?:\/([^/]+))?$/, env: 'lab', load: () => import('./features/lab.js'), keys: ['tab'] },
  { re: /^\/dashboard$/, env: 'support', load: () => import('./features/dashboard.js') },
  { re: /^\/review(?:\/([^/]+))?$/, env: 'support', load: () => import('./features/review.js'), keys: ['caseId'] },
  { re: /^\/carebridge$/, env: 'support', load: () => import('./features/carebridge.js') },
  { re: /^\/responsible$/, env: 'support', load: () => import('./features/responsible.js') },
  { re: /^\/about$/, env: 'support', load: () => import('./features/about.js') },
];

let cleanup = null;
let current = { path: '/', env: 'entry' };
let navToken = 0;

export function navigate(path) { if (location.hash.slice(1) === path) route(); else location.hash = path; }
export const currentPath = () => current.path;

async function route() {
  const token = ++navToken;
  const path = location.hash.slice(1) || '/';
  const rt = ROUTES.map((r) => ({ r, m: path.match(r.re) })).find((x) => x.m);
  const view = $('#view');
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  const env = rt ? rt.r.env : 'support';
  current = { path, env };
  document.body.dataset.env = env;
  renderChrome();
  clear(view);
  let page;
  if (!rt) {
    page = { default: (root) => root.append(h('div', { class: 'page' }, h('h1', { class: 'h1' }, t('page.notfound')), h('p', { class: 'prose' }, t('page.notfound.b')), h('p', null, h('a', { href: '#/' }, t('page.home'))))) };
    page.mount = page.default;
  } else {
    try { page = await rt.r.load(); } catch (e) { console.error(e); view.append(h('div', { class: 'page' }, h('p', null, String(e)))); return; }
  }
  if (token !== navToken) return;
  const params = {};
  if (rt && rt.r.keys) rt.r.keys.forEach((k, i) => { params[k] = rt.m[i + 1] ? decodeURIComponent(rt.m[i + 1]) : undefined; });
  const root = h('div', { class: 'view-enter', style: { display: 'contents' } });
  view.append(root);
  cleanup = page.mount(root, params) || null;
  document.title = `${t(page.titleKey || 'nav.entry')} — ${getLang() === 'ar' ? BRAND.nameAr : BRAND.name}`;
  if (!location.hash.includes('noscroll')) window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
  announce(document.title);
}

// ───────── chrome ─────────
function renderChrome() {
  const { path, env } = current;
  const link = (href, key, tag) => h('a', { href: `#${href}`, 'aria-current': path === href || (href !== '/' && path.startsWith(href)) ? 'page' : null },
    h('span', { class: 'nav-label-long' }, t(key)), tag ? h('span', { class: 'env-tag' }, tag) : null);
  const more = [['/dashboard', 'dashboard', '04'], ['/review', 'review', '05'], ['/carebridge', 'carebridge', '06'], ['/responsible', 'responsible', '07'], ['/about', 'about', '08']];
  const moreWrap = h('div', { class: 'nav-more', dataset: { open: 'false' } });
  const moreBtn = h('button', { type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', on: { click: () => toggleMore() } }, t('nav.more'), ic('chevron', 12));
  const menu = h('div', { class: 'menu', role: 'menu' },
    more.map(([href, k, n]) => h('a', { href: `#${href}`, role: 'menuitem', on: { click: () => toggleMore(false) } }, h('span', { class: 'mi' }, n), h('b', null, t(`nav.${k}`)), h('span', { class: 'd' }, t(`nav.${k}.d`)))));
  function toggleMore(force) {
    const open = force ?? moreWrap.dataset.open !== 'true';
    moreWrap.dataset.open = String(open);
    moreBtn.setAttribute('aria-expanded', String(open));
  }
  moreWrap.append(moreBtn, menu);
  moreWrap.addEventListener('focusout', (e) => { if (!moreWrap.contains(e.relatedTarget)) toggleMore(false); });
  moreWrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { toggleMore(false); moreBtn.focus(); } });
  document.addEventListener('click', (e) => { if (!moreWrap.contains(e.target)) toggleMore(false); });

  const bar = $('#topbar');
  clear(bar).append(
    h('a', { class: 'brand', href: '#/', 'aria-label': getLang() === 'ar' ? BRAND.nameAr : BRAND.name },
      h('span', { html: markSVG(30) }),
      h('span', { class: 'brand-text' }, h('span', { class: 'brand-name' }, getLang() === 'ar' ? BRAND.nameAr : BRAND.name), h('span', { class: 'brand-sub' }, t('brand.sub')))),
    h('nav', { class: 'nav', 'aria-label': 'Primary' }, link('/', 'nav.entry', 'A'), link('/workbench', 'nav.workbench', 'B'), link('/lab', 'nav.lab', 'C'), moreWrap,
      h('button', { type: 'button', class: 'lang-btn', lang: getLang() === 'ar' ? 'en' : 'ar', 'aria-label': t('lang.aria'), on: { click: () => { const n = getLang() === 'ar' ? 'en' : 'ar'; update((s) => { s.lang = n; }); setLang(n); } } }, ic('globe', 14), t('lang.switch'))));

  clear($('#statusbar')).append(
    h('span', { class: 'sb' }, h('i', { class: 'dot warn' }), t('sb.prototype')),
    h('span', { class: 'sb' }, h('i', { class: 'dot off' }), t('sb.model')),
    h('span', { class: 'sb' }, h('i', { class: 'dot' }), t('sb.local')),
    h('span', { class: 'sb sb-r' }, t('sb.device')));
  clear($('#foot')).append(
    h('div', null, h('b', null, t('foot.credits')), h('br'), BRAND.students.map((s) => h('div', null, `${getLang() === 'ar' ? s.nameAr : s.name} · ${s.grade}`)), h('div', null, getLang() === 'ar' ? BRAND.schoolAr : BRAND.school)),
    h('div', null, h('b', null, t('foot.privacy')), h('p', null, t('foot.privacy.body'))),
    h('div', null, h('p', null, t('foot.disclaimer'))));
  $('#skip').textContent = t('skip');
}

// ───────── boot ─────────
function boot() {
  const s = state();
  const initial = (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  setLang(s.lang || initial);
  window.addEventListener('hashchange', route);
  onLang(() => route());
  route();
  // warm the image cache in the background once the first view is up (thumbnails and quality indicators)
  const warm = () => CASE_IDS.reduce((p, id) => p.then(() => analysis(id)), Promise.resolve());
  (window.requestIdleCallback || ((f) => setTimeout(f, 600)))(warm);
}
boot();
