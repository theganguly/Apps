/* Muhurta Planner tab: lagna / khat / abhijit / yoga muhurtas by month or whole samvatsar. */
import { h, icon, cx, setKids } from './dom';
import {
  S, T, L, fd, nm, pad2, rashiShort, place, placeKey, ftd, win, ymdText, MON_GU, MON_EN, hooks, registerCache, loadPlan, savePlan,
} from './state';
import { term, openGlossary } from './sheet';
import { lagnaMuhurtasForMonth, lagnaMuhurtasForSamvat, QUALITY_ORDER } from '../lib/muhurta';
import { samvatSpan } from '../lib/samvat';
import { dayPanchang } from '../lib/core';
import { NAKSHATRAS, TITHI_GU, WEEKDAYS, RASHIS, MONTHS_GU } from '../lib/data';

const cache = new Map();
registerCache(() => cache.clear());
const PAGE = 120;
let shown = PAGE;

const KINDS = [['abhijit', 'kAbhijit'], ['amrit', 'kAmrit'], ['siddhi', 'kSiddhi'], ['ravi', 'kRavi'], ['lagna', 'kLagna'], ['khat', 'kKhat']];
const KIND_TERM = { abhijit: 'abhijit', amrit: 'amritsiddhi', siddhi: 'siddhiyoga', ravi: 'raviyoga', lagna: 'lagnashuddhi', khat: 'khat' };
const QTONE = { best: 'good', good: 'saffron', ok: 'plain' };
const QKEY = { best: 'qBest', good: 'qGood', ok: 'qOk' };
const tp = (t) => (t === 30 ? 30 : t > 15 ? t - 15 : t);

function vikramNow() {
  const p = dayPanchang(S.date.y, S.date.m, S.date.d, place().lat, place().lon);
  return p.vikram;
}
function compute() {
  const pl = place(), P = S.plan;
  if (P.whole) {
    if (!P.vik) P.vik = vikramNow();
    const key = `s${P.vik}|${placeKey(pl)}`;
    if (!cache.has(key)) cache.set(key, lagnaMuhurtasForSamvat(P.vik, pl));
    return cache.get(key);
  }
  const key = `m${P.y}-${P.m}|${placeKey(pl)}`;
  if (!cache.has(key)) cache.set(key, lagnaMuhurtasForMonth(P.y, P.m, pl));
  return cache.get(key);
}

function toEntry(m) {
  const rn = RASHIS[m.lagnaRashi - 1];
  const bul = (arr) => h('ul', { class: 'why' }, arr.map((x) => h('li', null, S.lang === 'gu' ? x.gu : x.en)));
  const when = `${ymdText(m.date)} · ${win(m.jd, m.endJd, m.date)}`;
  return {
    key: `m:${m.id}`, gu: m.labelGu, en: m.labelEn, category: 'muhurat',
    whatGu: `${when} — ઉદય લગ્ન ${rn.gu}.`, whatEn: `${when} — rising sign ${rn.en.split(' (')[0]}.`,
    howGu: 'દરેક દિવસના લગ્ન-કાળ ગણી, તિથિ-નક્ષત્ર-યોગ-વાર શુદ્ધિ તપાસીને; ભદ્રા સાથે ટકરાતા સમય બાકાત, રાહુકાળ/પંચક/વિછુડોમાં દરજ્જો ઘટાડ્યો.',
    howEn: 'The day’s rising-sign windows are computed, then tithi, nakshatra, yoga and weekday are checked; windows touching Bhadra are dropped, and Rahu Kaal / Panchak / Vinchhudo lower the grade.',
    whyGu: '', whyEn: '',
    related: [KIND_TERM[m.kind], `rashi:${m.lagnaRashi}`, `nakshatra:${m.nakshatra}`, `tithi:${m.tithi}`, 'rahukaal'],
    extra: () => h('div', null,
      h('section', { class: 'gsec' }, h('h3', null, T('whyThis')), bul(m.reasons)),
      m.caution.length ? h('section', { class: 'gsec' }, h('h3', { class: 'bad-t' }, '⚠'), bul(m.caution)) : null,
      h('section', { class: 'gsec' }, h('h3', null, T('nameInitials')), h('p', null, `${nm(NAKSHATRAS[m.nakshatra - 1])}: ${m.syllables.join(' · ')}`)),
      m.tithiEndJd ? h('p', { class: 'maphint' }, `${nm(TITHI_GU[tp(m.tithi) - 1] || { gu: 'અમાસ', en: 'Amavasya' })} ${T('until')} ${ftd(m.tithiEndJd, m.date)}`) : null,
      m.kind === 'khat' ? h('p', { class: 'maphint' }, T('khatNote')) : null),
  };
}

function snapshot(m) {
  return { id: m.id, placeId: S.placeId, date: m.date, jd: m.jd, endJd: m.endJd, kind: m.kind, labelGu: m.labelGu, labelEn: m.labelEn, lagnaRashi: m.lagnaRashi, quality: m.quality, nakshatra: m.nakshatra, tithi: m.tithi, syllables: m.syllables, weekday: m.weekday };
}

function Row(m, planIds, planRefresh) {
  const inPlan = planIds.has(m.id);
  const planBtn = h('button', {
    class: cx('navbtn sm', inPlan && 'on'), 'aria-pressed': inPlan ? 'true' : 'false',
    'aria-label': inPlan ? T('removeFromPlan') : T('addToPlan'), title: inPlan ? T('removeFromPlan') : T('addToPlan'),
    onclick: (e) => {
      e.stopPropagation();
      const list = loadPlan().filter((x) => x.id !== m.id);
      if (!inPlan) list.push(snapshot(m));
      savePlan(list); planRefresh();
    },
  }, icon(inPlan ? 'check' : 'bookmark'));
  return h('div', { class: 'mrow' },
    h('button', { class: 'mmain', onclick: () => openGlossary(toEntry(m)) },
      h('span', { class: 'mt tnum' }, win(m.jd, m.endJd, m.date)),
      h('span', { class: 'ml' }, S.lang === 'gu' ? m.labelGu : m.labelEn),
      h('span', { class: 'mq' }, h('span', { class: cx('chip', QTONE[m.quality] !== 'plain' && QTONE[m.quality]) }, T(QKEY[m.quality])), ' ',
        h('small', null, `${T('nameInitials')}: ${m.syllables.join(' ')}`))),
    planBtn);
}

function applyFilters(all, planIds) {
  const P = S.plan;
  return all.filter((m) => {
    if (P.kinds.length && !P.kinds.includes(m.kind)) return false;
    if (P.rashi && m.lagnaRashi !== P.rashi) return false;
    if (P.tithi && tp(m.tithi) !== P.tithi) return false;
    if (P.nak && m.nakshatra !== P.nak) return false;
    return true;
  });
}

export function PlannerView() {
  const P = S.plan;
  const planBox = h('div', { class: 'frame-thin pad-3' });
  const listBox = h('div', { class: 'frame-thin' });
  const planIds = () => new Set(loadPlan().map((x) => x.id));

  function drawPlan() {
    const plan = loadPlan().sort((a, b) => a.jd - b.jd);
    setKids(planBox,
      h('div', { class: 'sect' }, h('h2', null, h('i'), `${T('myPlan')} (${fd(plan.length)})`),
        h('button', { class: cx('linkbtn'), onclick: () => { P.planOnly = !P.planOnly; hooks.render(); } }, P.planOnly ? T('allFilter') : T('showPlanOnly'))),
      plan.length ? h('div', { class: 'planlist' }, plan.map((x) => h('div', { class: 'planitem' },
        h('button', { class: 'mmain', onclick: () => openGlossary(planEntry(x)) },
          h('span', { class: 'mt' }, `${ymdText(x.date)} · ${win(x.jd, x.endJd, x.date)}`), h('span', { class: 'ml' }, S.lang === 'gu' ? x.labelGu : x.labelEn)),
        h('button', { class: 'navbtn sm', 'aria-label': T('removeFromPlan'), onclick: () => { savePlan(loadPlan().filter((y) => y.id !== x.id)); drawPlan(); drawList(); } }, icon('x'))))) : h('p', { class: 'empty-note', style: 'padding:4px 0' }, T('noItems')));
  }
  function planEntry(x) {
    return { key: `m:${x.id}`, gu: x.labelGu, en: x.labelEn, category: 'muhurat',
      whatGu: `${ymdText(x.date)} · ${win(x.jd, x.endJd, x.date)}`, whatEn: `${ymdText(x.date)} · ${win(x.jd, x.endJd, x.date)}`,
      howGu: 'તમારી શોર્ટલિસ્ટમાંથી સાચવેલું.', howEn: 'Saved in your shortlist.',
      related: [KIND_TERM[x.kind], `rashi:${x.lagnaRashi}`, `nakshatra:${x.nakshatra}`],
      extra: () => h('p', null, `${T('nameInitials')}: ${(x.syllables || []).join(' · ')}`) };
  }
  function drawList() {
    let all;
    try { all = P.planOnly ? loadPlan().map((x) => ({ ...x, caution: [], reasons: [] })) : compute(); } catch (err) { console.error(err); all = []; }
    const ids = planIds();
    const items = applyFilters(all, ids).sort((a, b) => a.jd - b.jd || QUALITY_ORDER[a.quality] - QUALITY_ORDER[b.quality]);
    if (!items.length) { setKids(listBox, h('p', { class: 'empty-note' }, T('noMuhurtas'))); return; }
    const out = []; let lastKey = '', n = 0;
    for (const m of items) {
      if (n++ >= shown) break;
      const k = `${m.date.y}-${m.date.m}-${m.date.d}`;
      if (k !== lastKey) {
        lastKey = k;
        const tn = tp(m.tithi);
        out.push(h('div', { class: 'mdate' },
          h('b', { class: m.weekday === 0 ? 'sun' : '' }, ymdText(m.date)),
          h('span', null, term(`weekday:${m.weekday}`, nm(WEEKDAYS[m.weekday]))),
          h('span', null, term(`tithi:${m.tithi}`, tn === 30 ? L('અમાસ', 'Amavasya') : `${m.tithi <= 15 ? L('સુદ', 'Sud') : L('વદ', 'Vad')} ${nm(TITHI_GU[tn - 1])}`)),
          h('span', null, term(`nakshatra:${m.nakshatra}`, nm(NAKSHATRAS[m.nakshatra - 1])))));
      }
      out.push(Row(m, ids, () => { drawPlan(); drawList(); }));
    }
    if (items.length > shown) out.push(h('button', { class: 'castbtn', style: 'margin:10px auto;display:block;width:auto;padding:0 1.5rem', onclick: () => { shown += PAGE; drawList(); } }, `${T('allFilter')} (${fd(items.length - shown)}+)`));
    setKids(listBox, out);
  }

  // ---- header
  const title = P.whole
    ? `${T('samvatTitle')} ${fd(P.vik || vikramNow())}`
    : `${L(MON_GU[P.m - 1], MON_EN[P.m - 1])} ${fd(P.y)}`;
  const step = (by) => {
    shown = PAGE;
    if (P.whole) { P.vik = (P.vik || vikramNow()) + by; }
    else { const nd = new Date(Date.UTC(P.y, P.m - 1 + by, 1)); P.y = nd.getUTCFullYear(); P.m = nd.getUTCMonth() + 1; }
    hooks.render();
  };
  const toggleKind = (k) => { P.kinds = P.kinds.includes(k) ? P.kinds.filter((x) => x !== k) : [...P.kinds, k]; shown = PAGE; hooks.render(); };
  const sel = (label, value, options, onChange) => h('label', { class: 'fsel' }, h('span', null, label),
    h('select', { class: 'inp', onchange: (e) => { onChange(Number(e.target.value)); shown = PAGE; hooks.render(); } },
      h('option', { value: 0, selected: value === 0 }, T('allFilter')), options.map(([v, t]) => h('option', { value: v, selected: v === value }, t))));

  drawPlan(); drawList();
  return h('div', { class: 'stack' },
    h('div', { class: 'navrow' },
      h('button', { class: 'navbtn', 'aria-label': T('prevMonth'), onclick: () => step(-1) }, icon('left')),
      h('h2', { class: 'display cal-title' }, title),
      h('button', { class: 'navbtn', 'aria-label': T('nextMonth'), onclick: () => step(1) }, icon('right'))),
    h('div', { class: 'chips', style: 'justify-content:center' },
      h('button', { class: cx('chip tgl', !P.whole && 'on'), 'aria-pressed': !P.whole ? 'true' : 'false', onclick: () => { P.whole = false; shown = PAGE; hooks.render(); } }, T('thisMonthOnly')),
      h('button', { class: cx('chip tgl', P.whole && 'on'), 'aria-pressed': P.whole ? 'true' : 'false', onclick: () => { P.whole = true; P.vik = P.vik || vikramNow(); shown = PAGE; hooks.render(); } }, T('wholeSamvatsar'))),
    h('div', { class: 'frame-thin pad-3' },
      h('div', { class: 'chips' }, KINDS.map(([k, sk]) => h('button', { class: cx('chip tgl', P.kinds.includes(k) && 'on'), 'aria-pressed': P.kinds.includes(k) ? 'true' : 'false', onclick: () => toggleKind(k) }, T(sk)))),
      h('div', { class: 'fgrid' },
        sel(T('byRashi'), P.rashi, RASHIS.map((r, i) => [i + 1, rashiShort(i)]), (v) => { P.rashi = v; }),
        sel(T('byTithi'), P.tithi, TITHI_GU.map((t, i) => [i + 1, nm(t)]), (v) => { P.tithi = v; }),
        sel(T('byNakshatra'), P.nak, NAKSHATRAS.map((n, i) => [i + 1, nm(n)]), (v) => { P.nak = v; }))),
    planBox, listBox,
    h('p', { class: 'foot' }, T('plannerNote')));
}
