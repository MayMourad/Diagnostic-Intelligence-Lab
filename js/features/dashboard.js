// Supporting: Dashboard (local progress + audit trail + privacy controls).
import { register, t, fmtDate, fmtPct, fmtNum } from '../i18n.js';
import { h, ic, btn, chip, download } from '../ui.js';
import { CASE_IDS, getCase } from '../data/cases.js';
import { state, learnerStats, resetAll } from '../store.js';
import './shared.js';
import './duel.js';
import './workbench.js'; // register shared strings

export const titleKey = 'nav.dashboard';

register({
  en: {
    'db.kicker': 'Supporting · Dashboard', 'db.title': 'Your work in this browser.', 'db.lede': 'Everything here is computed from records stored locally on this device. There are no patients, no server and no shared data.',
    'db.t.attempted': 'Duels locked', 'db.t.practice': 'Practice-only', 'db.t.approved': 'Approved dispositions', 'db.t.referrals': 'Referral letters saved', 'db.t.of': 'of {n} cases',
    'db.perf': 'Educational performance', 'db.perf.caveat': 'Educational scoring on a small synthetic set — not validated clinical performance.',
    'db.cases': 'Case ledger', 'db.col.case': 'Case', 'db.col.duel': 'Duel', 'db.col.interp': 'Your duel reading', 'db.col.approval': 'Disposition', 'db.none': '—',
    'db.audit': 'Audit trail', 'db.audit.b': 'Newest first. Local only.', 'db.audit.none': 'No events yet.',
    'ev.duel-locked': 'Duel locked', 'ev.study-mode': 'Study Mode opened', 'ev.layers-open': 'Reference layers opened', 'ev.approved': 'Disposition approved', 'ev.withdrawn': 'Approval withdrawn', 'ev.no-result': 'No-result pathway used', 'ev.referral': 'Referral letter saved',
    'db.priv': 'Privacy & data', 'db.priv.b': 'Records live in this browser’s local storage. Nothing is uploaded. You can export or erase them.', 'db.export': 'Export my records (JSON)', 'db.erase': 'Erase all local data', 'db.erase.confirm': 'Erase everything? This cannot be undone.', 'db.erase.yes': 'Yes, erase', 'db.erase.no': 'Cancel', 'db.erased': 'All local data erased.',
    'db.go': 'Open Workbench',
  },
  ar: {
    'db.kicker': 'داعم · لوحة المتابعة', 'db.title': 'عملك في هذا المتصفح.', 'db.lede': 'كل ما هنا محسوب من سجلات مخزنة محليًا على هذا الجهاز. لا مرضى ولا خادم ولا بيانات مشتركة.',
    'db.t.attempted': 'مبارزات مقفلة', 'db.t.practice': 'للتدريب فقط', 'db.t.approved': 'قرارات معتمدة', 'db.t.referrals': 'خطابات إحالة محفوظة', 'db.t.of': 'من {n} حالة',
    'db.perf': 'الأداء التعليمي', 'db.perf.caveat': 'تقييم تعليمي على مجموعة اصطناعية صغيرة — وليس أداءً سريريًا مُصادَقًا عليه.',
    'db.cases': 'سجل الحالات', 'db.col.case': 'الحالة', 'db.col.duel': 'المبارزة', 'db.col.interp': 'قراءتك في المبارزة', 'db.col.approval': 'القرار', 'db.none': '—',
    'db.audit': 'سجل التدقيق', 'db.audit.b': 'الأحدث أولًا. محلي فقط.', 'db.audit.none': 'لا أحداث بعد.',
    'ev.duel-locked': 'قُفلت مبارزة', 'ev.study-mode': 'فُتح وضع الدراسة', 'ev.layers-open': 'فُتحت الطبقات المرجعية', 'ev.approved': 'اعتُمد قرار', 'ev.withdrawn': 'سُحب اعتماد', 'ev.no-result': 'استُخدم مسار «لا نتيجة»', 'ev.referral': 'حُفظ خطاب إحالة',
    'db.priv': 'الخصوصية والبيانات', 'db.priv.b': 'تعيش السجلات في التخزين المحلي لهذا المتصفح. لا شيء يُرفع. يمكنك تصديرها أو مسحها.', 'db.export': 'صدّر سجلاتي (JSON)', 'db.erase': 'امسح كل البيانات المحلية', 'db.erase.confirm': 'مسح كل شيء؟ لا يمكن التراجع.', 'db.erase.yes': 'نعم، امسح', 'db.erase.no': 'إلغاء', 'db.erased': 'تم مسح كل البيانات المحلية.',
    'db.go': 'افتح منصة العمل',
  },
});

export function mount(root) {
  const s = state();
  const stat = learnerStats();
  const tile = (k, v, sub) => h('div', { class: 'tile' }, h('span', { class: 'kicker' }, t(`db.t.${k}`)), h('b', { class: 'tile-v num' }, v), sub ? h('span', { class: 'small muted' }, sub) : null);
  const approved = Object.values(s.review).filter((r) => r.approval).length;
  const ci = (x) => (x.lo === null ? '' : `95% CI ${fmtPct(x.lo)}–${fmtPct(x.hi)}`);
  const rec = (label, v, sub) => h('div', { class: 'rk' }, h('span', { class: 'kicker' }, label), h('b', { class: 'num rk-v' }, v), sub ? h('span', { class: 'small muted num' }, sub) : null);

  const rows = CASE_IDS.map((id) => {
    const c = getCase(id); const d = s.duels[id]; const r = s.review[id];
    return h('tr', null, h('td', null, h('a', { href: `#/workbench/${id}/lens` }, h('b', null, id)), ' ', h('span', { class: 'mono muted' }, c.eye)),
      h('td', null, d ? chip(`${t(`duel.cat.${d.category}`)}${d.practice ? ' · ' + t('cs.practice') : ''}`, ['FN', 'UG-overcall'].includes(d.category) ? 'brick' : 'teal') : h('span', { class: 'muted' }, t('db.none'))),
      h('td', { class: 'small' }, d ? (d.interp.gradable ? `${d.interp.grade}${d.interp.dme ? ' + DME' : ''} → ${t(`decision.${d.interp.grade >= 2 || d.interp.dme ? 'refer' : 'routine'}`)}` : t('decision.ungradable')) : t('db.none')),
      h('td', { class: 'small' }, r?.approval ? t(`disp.short.${r.approval.disposition}`) : t('db.none')));
  });
  const events = [...s.events].reverse().slice(0, 30);
  const confirm = h('div', { class: 'erase', hidden: true }, h('p', { class: 'small', role: 'alert' }, t('db.erase.confirm')),
    btn(t('db.erase.yes'), { variant: 'solid', cls: 'btn-sm', on: () => { resetAll(); root.querySelector('.db-msg').textContent = t('db.erased'); setTimeout(() => location.reload(), 500); } }), btn(t('db.erase.no'), { variant: 'quiet', cls: 'btn-sm', on: () => { confirm.hidden = true; } }));

  root.append(h('div', { class: 'page' },
    h('header', { class: 'page-head' }, h('p', { class: 'kicker' }, t('db.kicker')), h('h1', { class: 'h1' }, t('db.title')), h('p', { class: 'lede' }, t('db.lede'))),
    h('div', { class: 'tiles' }, tile('attempted', `${Object.values(s.duels).filter((d) => !d.practice).length}`, t('db.t.of', { n: CASE_IDS.length })), tile('practice', String(stat.practice)), tile('approved', String(approved)), tile('referrals', String(s.referrals.length))),
    h('section', { class: 'sec' }, h('div', { class: 'sec-h' }, h('h2', { class: 'h2' }, t('db.perf')), h('span', { class: 'prov prov-learner' }, 'Educational')),
      h('div', { class: 'rec-grid rec-wide' }, rec(t('duel.rec.n'), String(stat.n)), rec(t('duel.rec.acc'), fmtPct(stat.referralAccuracy)), rec(t('duel.rec.sens'), fmtPct(stat.sensitivity), `n=${stat.counts.TP + stat.counts.FN} ${ci(stat.sensCI)}`), rec(t('duel.rec.spec'), fmtPct(stat.specificity), `n=${stat.counts.TN + stat.counts.FP} ${ci(stat.specCI)}`), rec(t('duel.rec.exact'), fmtPct(stat.exactGrade)), rec(t('duel.rec.fn'), String(stat.counts.FN))),
      h('div', { class: 'note' }, ic('info'), h('span', null, t('db.perf.caveat')))),
    h('section', { class: 'sec' }, h('h2', { class: 'h2' }, t('db.cases')), h('div', { class: 'table-wrap' }, h('table', { class: 'ledger' }, h('thead', null, h('tr', null, h('th', null, t('db.col.case')), h('th', null, t('db.col.duel')), h('th', null, t('db.col.interp')), h('th', null, t('db.col.approval')))), h('tbody', null, rows))),
      h('a', { class: 'btn', href: '#/workbench' }, h('span', { class: 'btn-label' }, t('db.go')), ic('arrow', 14))),
    h('section', { class: 'sec two' }, h('div', null, h('h2', { class: 'h2' }, t('db.audit')), h('p', { class: 'small muted' }, t('db.audit.b')),
      events.length ? h('ul', { class: 'audit' }, events.map((e) => h('li', null, h('span', { class: 'mono muted' }, fmtDate(e.ts)), h('b', null, t(`ev.${e.type}`)), h('span', { class: 'mono' }, e.caseId || ''), h('span', { class: 'small muted' }, e.detail)))) : h('p', { class: 'small muted' }, t('db.audit.none'))),
      h('div', null, h('h2', { class: 'h2' }, t('db.priv')), h('p', { class: 'prose' }, t('db.priv.b')), h('div', { class: 'row-actions' },
        btn(t('db.export'), { icon: 'download', variant: 'quiet', on: () => download('dil-records.json', JSON.stringify({ exported: new Date().toISOString(), note: 'Synthetic teaching cases only. No patient data.', ...state() }, null, 2), 'application/json') }),
        btn(t('db.erase'), { variant: 'quiet', on: () => { confirm.hidden = false; } })), confirm, h('p', { class: 'small db-msg', role: 'status' })))));
}
