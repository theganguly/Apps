/* Samvat tab: months of the year, Panchak / Vinchhudo blocks, sankrantis, tithi lists, eclipses, text export. */
import { h, icon, cx } from './dom';
import { S, T, L, fd, nm, place, placeName, placeKey, ft, ftd, dmy, ymdText, hooks, registerCache, rashiShort } from './state';
import { term, openSheet } from './sheet';
import { samvatSpan, gregorianSpan, buildYearReport, reportToText } from '../lib/samvat';
import { dayPanchang, fmtISTDateTime } from '../lib/core';
import { MONTHS_GU, WEEKDAYS } from '../lib/data';
import { jdToLocal, IST_HOURS } from '../lib/astro';

const cache = new Map();
registerCache(() => cache.clear());

function report() {
  const pl = place(), V = S.samvat;
  if (V.mode === 'samvat' && !V.year) V.year = dayPanchang(S.date.y, S.date.m, S.date.d, pl.lat, pl.lon).vikram;
  if (V.mode === 'greg' && !V.cy) V.cy = S.date.y;
  const key = `${V.mode}${V.mode === 'samvat' ? V.year : V.cy}|${placeKey(pl)}`;
  if (!cache.has(key)) {
    const range = V.mode === 'samvat' ? samvatSpan(V.year, pl.lat, pl.lon) : gregorianSpan(V.cy, pl.lat, pl.lon);
    cache.set(key, buildYearReport(range, pl.lat, pl.lon));
  }
  return cache.get(key);
}

const eclName = (e) => {
  const k = { total: L('પૂર્ણ', 'total'), partial: L('આંશિક', 'partial'), penumbral: L('ઉપચ્છાયા', 'penumbral'), annular: L('વલયાકાર', 'annular') }[e.kind] || e.kind;
  return `${e.type === 'lunar' ? T('lunarEclipse') : T('solarEclipse')} (${k})`;
};

export function SamvatView() {
  const V = S.samvat;
  let rep;
  try { rep = report(); } catch (err) { console.error(err); return h('p', { class: 'empty-note' }, 'Error: ' + err.message); }
  const r = rep.range;
  const title = V.mode === 'samvat' ? `${T('samvatTitle')} ${fd(r.label)}` : `${T('gregYear')} ${fd(r.label)}`;
  const step = (by) => { if (V.mode === 'samvat') V.year += by; else V.cy += by; hooks.render(); };
  const blocks = (list, flagKey) => (list.length ? list.map((b) => h('div', { class: 'sk' },
    h('span', null, ftd(b.startJd, null)), h('span', null, '→ ', ftd(b.endJd, null)))) : h('p', { class: 'empty-note', style: 'padding:4px 0' }, T('noItems')));
  const dayList = (list) => (list.length ? h('div', { class: 'two' }, list.map((d) => h('div', { class: 'sk' },
    h('span', null, S.lang === 'gu' ? d.nameGu : d.nameEn, d.adhik ? h('small', null, ` (${T('adhikMonth')})`) : null, d.kshaya ? h('small', null, ` (${L('ક્ષય', 'kshaya')})`) : null),
    h('span', null, `${ymdText(d.ymd)} ${nm(WEEKDAYS[new Date(Date.UTC(d.ymd.y, d.ymd.m - 1, d.ymd.d)).getUTCDay()]).slice(0, 3)}`)))) : h('p', { class: 'empty-note' }, T('noItems')));

  const exportSheet = () => {
    const text = () => reportToText(rep, S.lang, S.guNumerals, placeName());
    openSheet({
      title: () => T('exportText'), wide: true,
      build: () => {
        const ta = h('textarea', { class: 'inp expta', readonly: true, rows: 14, 'aria-label': T('exportText') }); ta.value = text();
        const msg = h('span', { class: 'good-t', role: 'status' });
        return [ta, h('div', { class: 'chips', style: 'margin-top:10px' },
          h('button', { class: 'castbtn', style: 'margin:0', onclick: async () => { try { await navigator.clipboard.writeText(ta.value); } catch { ta.select(); document.execCommand('copy'); } msg.textContent = T('copiedText'); } }, T('copyText')),
          h('button', { class: 'castbtn', style: 'margin:0', onclick: () => {
            const a = h('a', { href: URL.createObjectURL(new Blob([ta.value], { type: 'text/plain;charset=utf-8' })), download: `panchang-${V.mode === 'samvat' ? 'VS' : 'CE'}${r.label}.txt` });
            document.body.append(a); a.click(); a.remove();
          } }, T('downloadText')),
          h('button', { class: 'castbtn', style: 'margin:0', onclick: () => window.print() }, T('printPage')), msg)];
      },
    });
  };

  return h('div', { class: 'stack samvat-view' },
    h('div', { class: 'navrow' },
      h('button', { class: 'navbtn', 'aria-label': T('prevMonth'), onclick: () => step(-1) }, icon('left')),
      h('h2', { class: 'display cal-title' }, title),
      h('button', { class: 'navbtn', 'aria-label': T('nextMonth'), onclick: () => step(1) }, icon('right'))),
    h('div', { class: 'chips', style: 'justify-content:center' },
      h('button', { class: cx('chip tgl', V.mode === 'samvat' && 'on'), 'aria-pressed': V.mode === 'samvat' ? 'true' : 'false', onclick: () => { V.mode = 'samvat'; V.year = null; hooks.render(); } }, T('samvatYearSwitch')),
      h('button', { class: cx('chip tgl', V.mode === 'greg' && 'on'), 'aria-pressed': V.mode === 'greg' ? 'true' : 'false', onclick: () => { V.mode = 'greg'; V.cy = S.date.y; hooks.render(); } }, T('gregYear')),
      h('button', { class: 'chip tgl', onclick: exportSheet }, T('exportText'))),
    h('p', { class: 'maphint', style: 'text-align:center' }, `${ymdText(r.start)} → ${ymdText(r.end)} · ${placeName()}`),

    h('div', { class: 'frame-thin pad' },
      h('div', { class: 'sect' }, h('h2', null, h('i'), term('mas', T('lunarMonthsOfYear')))),
      h('div', { class: 'two' }, r.months.map((mo) => h('div', { class: 'sk' },
        h('span', null, nm(MONTHS_GU[mo.index]), mo.adhik ? h('b', { class: 'adhik' }, ` ${T('adhikMonth')}`) : null),
        h('span', null, `${ymdText(mo.startDate)} → ${ymdText(mo.endDate)}`))))),

    h('div', { class: 'frame-thin pad' },
      h('div', { class: 'sect' }, h('h2', null, h('i'), term('panchak', T('panchakDays')), ` (${fd(rep.panchak.length)})`)),
      h('p', { class: 'maphint', style: 'margin:0 0 4px' }, T('moonInKumbhMeen')), blocks(rep.panchak)),
    h('div', { class: 'frame-thin pad' },
      h('div', { class: 'sect' }, h('h2', null, h('i'), term('vinchhudo', T('vinchhudoDays')), ` (${fd(rep.vinchhudo.length)})`)),
      h('p', { class: 'maphint', style: 'margin:0 0 4px' }, T('moonInVrushchik')), blocks(rep.vinchhudo)),
    h('div', { class: 'frame-thin pad' },
      h('div', { class: 'sect' }, h('h2', null, h('i'), term('sankranti', T('sankrantiList')))),
      h('div', { class: 'two' }, rep.sankrantis.map((s) => h('div', { class: 'sk' }, h('span', null, term(`rashi:${s.rashiIdx + 1}`, rashiShort(s.rashiIdx)), ` ${L('સંક્રાંતિ', 'Sankranti')}`), h('span', null, ftd(s.jd, null)))))),
    h('div', { class: 'frame-thin pad' }, h('div', { class: 'sect' }, h('h2', null, h('i'), term('tithi:11', T('ekadashiList')), ` (${fd(rep.ekadashis.length)})`)), dayList(rep.ekadashis)),
    h('div', { class: 'frame-thin pad' }, h('div', { class: 'sect' }, h('h2', null, h('i'), term('tithi:15', T('purnimaList')), ` (${fd(rep.purnimas.length)})`)), dayList(rep.purnimas)),
    h('div', { class: 'frame-thin pad' }, h('div', { class: 'sect' }, h('h2', null, h('i'), term('tithi:30', T('amasList')), ` (${fd(rep.amavasyas.length)})`)), dayList(rep.amavasyas)),
    h('div', { class: 'frame-thin pad' },
      h('div', { class: 'sect' }, h('h2', null, h('i'), term('eclipse', T('eclipsesOfYear')))),
      rep.eclipses.length ? rep.eclipses.map((e) => h('div', { class: 'ecl' },
        h('div', { class: 'a' }, h('b', null, term(`eclipse:${e.type}`, eclName(e))), h('span', null, ftd(e.jd, null))),
        h('div', { class: 'b' }, e.visible ? h('span', { class: 'good-t' }, T('visible')) : T('notVisible')))) : h('p', { class: 'empty-note', style: 'padding:4px 0' }, T('noItems'))),
    h('p', { class: 'foot' }, T('engineNote')));
}
