/* Harilal Panchang — vanilla-JS UI (no React, no Tailwind, no network). */
import { julianDay, jdFromDate } from '../lib/astro';
import {
  dayPanchang, dayFlags, choghadiya, horas, eighthPartWindows, abhijitMuhurta, brahmaMuhurta,
  sandhyaWindows, pradoshWindow, nishita, sankrantisBetween, lunarMonthsBetween, lunarMonthOfFromMonths,
} from '../lib/core';
import { festivalsOfDay } from '../lib/festivals';
import { planetPositions, planetIngresses, planetLongitude, moonriseMoonset } from '../lib/planets';
import { lunarEclipsesBetween, solarEclipsesBetween, solarEclipseVisibleAt, lunarEclipseVisibleAt } from '../lib/eclipse';
import { castKundali, navamsaSign, pavaAt } from '../lib/kundali';
import {
  WEEKDAYS, MONTHS_GU, PAKSHA, NAKSHATRAS, YOGAS, RASHIS, KARANS, TITHI_DEITY_GU, RITUS,
  CHOGHADIYA, AVAKAHADA, TITHI_DEITY_EN, SAMVATSARAS_GU, SAMVATSARAS_EN, GRAHAS,
} from '../lib/data';
import { glossaryEntry, glossaryAll, registerGlossaryEntry, gk } from '../lib/glossary';
import * as Places from '../lib/places';
import { h, icon, cx, setKids } from './dom';
import {
  S, T, L, fd, nm, pad2, ft, ftd, win, dmy, rashiName, rashiShort, grahaName, place, placeName, placeKey,
  istNow, istToday, shiftDate, saveSettings, hooks, registerCache, setPlace, tabLabel, MON_GU, MON_EN,
} from './state';
import { term, openGlossary, rebuildSheet } from './sheet';
import { openPlacePicker } from './placepicker';
import { openSettings } from './settingsui';
import { PlannerView } from './planner';
import { SamvatView } from './samvatview';
import { REGISTRY } from './registry';
import './plugins';

export { istToday };

// ------------------------------------------------------------------ shared widgets
const Sect = (title, right) => h('div', { class: 'sect' }, h('h2', null, h('i'), title), right);
/** Row(label, value, sub, red, gkey) — gkey makes the label a tappable glossary term. */
const Row = (label, value, sub, red, gkey) => h('div', { class: cx('row', red && 'red') }, h('span', { class: 'l' }, gkey ? term(gkey, label) : label), h('span', { class: 'v' }, value, sub ? h('small', null, sub) : null));
const Chip = (txt, tone = 'plain', gkey) => h('span', { class: cx('chip', tone !== 'plain' && tone) }, gkey ? term(gkey, txt) : txt);
const NavBtn = (ic, label, fn) => h('button', { class: 'navbtn', 'aria-label': label, onclick: fn }, icon(ic));

// ------------------------------------------------------------------ data caches (all cleared on place change)
const dayCache = new Map();
registerCache(() => dayCache.clear());
function dayData(y, m, d) {
  const c = place();
  const key = `${y}-${m}-${d}-${c.id}-${placeKey(c)}`;
  if (dayCache.has(key)) return dayCache.get(key);
  const p = dayPanchang(y, m, d, c.lat, c.lon);
  const flags = dayFlags(p);
  const chog = choghadiya(p.sunriseJd, p.sunsetJd, p.nextSunriseJd);
  const horaList = horas(p.sunriseJd, p.sunsetJd, p.nextSunriseJd);
  const eighth = eighthPartWindows(p.sunriseJd, p.sunsetJd);
  const abhijit = abhijitMuhurta(p.sunriseJd, p.sunsetJd);
  const brahma = brahmaMuhurta(p.sunriseJd);
  const mm = moonriseMoonset(y, m, d, c.lat, c.lon);
  const pd = new Date(Date.UTC(y, m - 1, d - 1));
  const prev = dayPanchang(pd.getUTCFullYear(), pd.getUTCMonth() + 1, pd.getUTCDate(), c.lat, c.lon);
  const sandhya = sandhyaWindows(p.sunriseJd, p.sunsetJd, p.nextSunriseJd, prev.sunsetJd);
  const pradosh = pradoshWindow(p.sunsetJd);
  const nishi = nishita(p.sunsetJd, p.nextSunriseJd);
  const sankrantis = sankrantisBetween(julianDay(y, m, d) - 33, julianDay(y, m, d) + 33);
  const fests = festivalsOfDay(p, { sankrantis, lat: c.lat, lon: c.lon });
  const out = { p, flags, chog, horaList, eighth, abhijit, brahma, sandhya, pradosh, nishi, mm, fests };
  if (dayCache.size > 60) dayCache.clear();
  dayCache.set(key, out);
  return out;
}
const isToday = (dt) => { const t0 = istToday(); return t0.y === dt.y && t0.m === dt.m && t0.d === dt.d; };

// ------------------------------------------------------------------ TODAY
function TodayView() {
  const date = S.date;
  const data = dayData(date.y, date.m, date.d);
  const { p, flags, fests } = data;
  const month = MONTHS_GU[p.monthIdx], wd = WEEKDAYS[p.weekday], pk = PAKSHA[p.paksha];
  const pakshaLbl = S.lang === 'gu' ? pk.guShort : (p.paksha === 'sud' ? 'Sud' : 'Vad');
  const tithiLabel = p.tithiFull === 30
    ? `${nm(month)} ${pakshaLbl} ${L('અમાસ', 'Amavasya')}`
    : `${nm(month)} ${pakshaLbl} ${nm(p.tithiName)}`;
  const prevD = shiftDate(date.y, date.m, date.d, -1), nextD = shiftDate(date.y, date.m, date.d, 1);
  const today = isToday(date);

  const chips = [];
  if (flags.amritSiddhi) chips.push([T('amritSiddhi'), 'good', 'amritsiddhi']);
  if (flags.siddhiYoga) chips.push([T('siddhiYoga'), 'good', 'siddhiyoga']);
  if (flags.raviYoga) chips.push([T('raviYoga'), 'good', 'raviyoga']);
  if (flags.vyatipat) chips.push([T('vyatipat'), 'bad', 'vyatipat']);
  if (flags.vaidhriti) chips.push([T('vaidhriti'), 'bad', 'vaidhriti']);
  if (flags.dagdha) chips.push([T('dagdha'), 'bad', 'dagdha']);
  if (flags.kankach) chips.push([T('kankach'), 'bad', 'kankach']);
  if (flags.panchak) chips.push([T('panchak'), 'bad', 'panchak']);
  if (flags.vinchhudo) chips.push([T('vinchhudo'), 'bad', 'vinchhudo']);
  if (p.tithiVriddhi) chips.push([T('tithiVriddhi'), 'saffron', 'tithivriddhi']);
  if (p.tithiKshaya) chips.push([T('tithiKshaya'), 'saffron', 'tithikshaya']);

  const ayana = p.ayanaGu === 'ઉત્તરાયણ' ? L('ઉત્તરાયણ', 'Uttarayan') : L('દક્ષિણાયન', 'Dakshinayan');
  const y = YOGAS[p.yoga - 1];

  return h('div', { class: 'stack' },
    h('div', { class: 'navrow' },
      NavBtn('left', 'previous day', () => go({ date: prevD })),
      h('button', { class: cx('todaybtn', !today && 'off'), onclick: () => go({ date: istToday() }) }, T('today')),
      NavBtn('right', 'next day', () => go({ date: nextD }))),

    h('div', { class: 'frame-double masthead' },
      h('div', { class: 'd1' }, [term(gk.weekday(p.weekday), nm(wd)), ` · ${fd(pad2(p.d))} ${L(MON_GU[p.m - 1], MON_EN[p.m - 1])} ${fd(p.y)} · ${placeName()}`]),
      h('h1', { class: cx('display', p.weekday === 0 && 'sun') }, tithiLabel),
      p.monthAdhik ? Chip(L('અધિક માસ', 'Adhik month'), 'saffron', 'mas') : null,
      h('div', { class: 'meta' },
        h('span', null, term('samvat', T('samvat')), ` ${fd(p.vikram)}`), h('span', { class: 'sep' }, '|'),
        h('span', null, term('shaka', T('shaka')), ` ${fd(p.shaka)}`), h('span', { class: 'sep' }, '|'),
        h('span', null, term('vir', T('virSamvat')), ` ${fd(p.vir)}`)),
      h('div', { class: 'meta2' },
        term('samvatsara', L('સંવત્સર', 'Samvatsara')), ': ', h('b', null, S.lang === 'gu' ? p.samvatsara : (SAMVATSARAS_EN[SAMVATSARAS_GU.indexOf(p.samvatsara)] || p.samvatsara)),
        h('span', { class: 'sep', style: 'margin:0 8px' }, '|'),
        term('ritu', T('ritu')), `: ${nm(RITUS[p.ritu])} · `, term('ayana', ayana))),

    fests.length ? h('div', { class: 'frame-thin festbox' },
      Sect(T('festivals')),
      h('ul', null, fests.map((f) => h('li', null,
        h('span', { class: cx('nm', f.kind === 'major' && 'major') }, term(`festival:${f.kind}`, nm(f))),
        (f.noteGu || f.noteEn) ? h('span', { class: 'note' }, ` — ${fd((S.lang === 'gu' ? f.noteGu : f.noteEn) ?? '')}`) : null)))) : null,

    h('div', { class: 'frame-thin pad' },
      Sect(L('પંચાંગના પાંચ અંગ', 'Five limbs')),
      Row(T('tithi'), term(gk.tithi(p.tithiFull), S.lang === 'gu' ? `${pk.guShort} ${p.tithiName.formal}` : `${pk.en} ${p.tithiName.en}`),
        `${L('દેવતા', 'Deity')}: ${L(TITHI_DEITY_GU, TITHI_DEITY_EN)[p.tithiFull === 30 ? 15 : (p.tithiFull - 1) % 15]} · ${T('until')} ${ftd(p.tithiEndJd)}`, false, 'tithi'),
      Row(T('nakshatra'), term(gk.nakshatra(p.nakshatra), nm(NAKSHATRAS[p.nakshatra - 1])), `${T('until')} ${ftd(p.nakshatraEndJd)}`, false, 'nakshatra'),
      Row(T('yoga'), term(gk.yoga(p.yoga), nm(y)), `${T('until')} ${ftd(p.yogaEndJd)}${y.bad ? ` · ${L('અશુભ', 'avoid')}` : ''}`, false, 'yoga'),
      Row(T('karan'), p.karanas.map((k, i) => [i ? ' → ' : '', term(gk.karan(k.name), nm(KARANS[k.name]))]), p.karanas.map((k) => `${T('until')} ${ftd(k.endJd)}`).join('  ·  '), false, 'karan'),
      Row(T('vaar'), term(gk.weekday(p.weekday), nm(wd)), null, false, 'vaar'),
      Row(T('monthAmanta'), nm(month), S.lang === 'gu' ? month.vedic : undefined, false, 'mas'),
      Row(T('moonRashi'), term(gk.rashi(p.moonRashi), rashiName(p.moonRashi - 1)), p.moonRashiEndJd ? `${T('until')} ${ftd(p.moonRashiEndJd)}` : undefined, false, 'moonRashi'),
      Row(T('sunRashi'), term(gk.rashi(p.sunRashi), rashiName(p.sunRashi - 1)), null, false, 'sunRashi')),

    h('div', { class: 'suncards' },
      sunCard('sunrise', T('sunrise'), ftd(p.sunriseJd), 'sunrise'),
      sunCard('sunset', T('sunset'), ftd(p.sunsetJd), 'sunset'),
      sunCard('moon', T('moonrise'), data.mm.rise ? ftd(data.mm.rise) : '—', 'moonrise'),
      sunCard('sun', T('moonset'), data.mm.set ? ftd(data.mm.set) : '—', 'moonset')),

    h('div', { class: 'grid2' },
      h('div', { class: 'frame-thin pad', style: 'border-top:3px solid #1e6b3c' },
        Sect(T('shubhMuhurat')),
        Row(T('abhijit'), win(...data.abhijit), null, false, 'abhijit'),
        Row(T('brahma'), win(...data.brahma), null, false, 'brahma'),
        Row(`${T('sandhya')} (${L('પ્રાતઃ', 'morning')})`, win(...data.sandhya.morning), null, false, 'sandhya'),
        Row(`${T('sandhya')} (${L('સાંજ', 'evening')})`, win(...data.sandhya.evening), null, false, 'sandhya'),
        Row(T('pradosh'), win(...data.pradosh), null, false, 'pradosh'),
        Row(T('nishita'), ftd(data.nishi), null, false, 'nishita')),
      h('div', { class: 'frame-thin pad', style: 'border-top:3px solid #b81e2b' },
        Sect(T('ashubhMuhurat')),
        Row(T('rahukaal'), win(...data.eighth.rahukaal), null, true, 'rahukaal'),
        Row(T('yamaganda'), win(...data.eighth.yamaganda), null, true, 'yamaganda'),
        Row(T('gulika'), win(...data.eighth.gulika), null, true, 'gulika'),
        flags.bhadra.length ? Row(T('bhadra'), flags.bhadra.map(([a, b]) => win(a, b)).join(', '), null, true, 'bhadra') : null,
        (flags.panchak || startsToday(flags.panchakStart, p)) ? Row(T('panchak'), `${flags.panchakStart ? ftd(flags.panchakStart) : '…'} → ${flags.panchakEnd ? ftd(flags.panchakEnd) : '…'}`, null, true, 'panchak') : null,
        (flags.vinchhudo || startsToday(flags.vinchhudoStart, p)) ? Row(T('vinchhudo'), `${flags.vinchhudoStart ? ftd(flags.vinchhudoStart) : '…'} → ${flags.vinchhudoEnd ? ftd(flags.vinchhudoEnd) : '…'}`, null, true, 'vinchhudo') : null,
        flags.dishashool ? Row(T('dishashool'), nm(flags.dishashool), null, true, 'dishashool') : null)),

    chips.length ? h('div', { class: 'chips', style: 'padding:0 4px' }, chips.map(([txt, tone, k]) => Chip(txt, tone, k))) : null,
    h('p', { class: 'foot' }, T('engineNote')));
}
/** A window that begins later in this Hindu day (after sunrise) should still be listed. */
const startsToday = (startJd, p) => startJd !== null && startJd > p.sunriseJd && startJd < p.nextSunriseJd;
function sunCard(ic, label, value, gkey) {
  return h('div', { class: 'frame-thin suncard' }, icon(ic), h('div', { style: 'min-width:0' }, h('div', { class: 'k' }, gkey ? term(gkey, label) : label), h('div', { class: 'n' }, value)));
}

// ------------------------------------------------------------------ CALENDAR
const calCache = new Map();
registerCache(() => calCache.clear());
function calCells(vm) {
  const c = place();
  const key = `${vm.y}-${vm.m}-${placeKey(c)}`;
  if (calCache.has(key)) return calCache.get(key);
  const first = new Date(Date.UTC(vm.y, vm.m - 1, 1));
  const dim = new Date(Date.UTC(vm.y, vm.m, 0)).getUTCDate();
  const months = lunarMonthsBetween(julianDay(vm.y, vm.m - 1, 1), julianDay(vm.y, vm.m + 1, 1), c.lat, c.lon);
  const sank = sankrantisBetween(julianDay(vm.y, vm.m - 1, 1), julianDay(vm.y, vm.m + 1, 1));
  const out = { start: first.getUTCDay(), days: [] };
  for (let d = 1; d <= dim; d++) {
    const lm = lunarMonthOfFromMonths(vm.y, vm.m, d, months, c.lat, c.lon);
    const p = dayPanchang(vm.y, vm.m, d, c.lat, c.lon, lm);
    const fests = festivalsOfDay(p, { sankrantis: sank, lat: c.lat, lon: c.lon });
    out.days.push({ d, wd: p.weekday, tithiFull: p.tithiFull, paksha: p.paksha, tithi: p.tithi, fests, panchak: p.moonRashi >= 11, monthIdx: p.monthIdx });
  }
  if (calCache.size > 12) calCache.clear();
  calCache.set(key, out);
  return out;
}
function monthMove(which, by) {
  const vm = S[which];
  const nd = new Date(Date.UTC(vm.y, vm.m - 1 + by, 1));
  S[which] = { y: nd.getUTCFullYear(), m: nd.getUTCMonth() + 1 };
  render();
}
function CalendarView() {
  const vm = S.cal;
  const { start, days } = calCells(vm);
  const nowI = istNow();
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(h('div', { class: 'cell empty' }));
  days.forEach((c, idx) => {
    const major = c.fests.find((f) => f.kind === 'major');
    const any = c.fests[0];
    const fest = major || any;
    const tithiShort = c.tithiFull === 30 ? L('અમાસ', 'Amas') : `${c.paksha === 'sud' ? L('સુ', 'S') : L('વ', 'K')} ${fd(c.tithi)}`;
    const today = nowI.getFullYear() === vm.y && nowI.getMonth() + 1 === vm.m && nowI.getDate() === c.d;
    const col = (start + idx) % 7;
    cells.push(h('button', { class: cx('cell', c.panchak && 'pk', today && 'td'), onclick: () => go({ tab: 'today', date: { y: vm.y, m: vm.m, d: c.d } }) },
      h('div', { class: 'top' },
        h('span', { class: cx('dn', c.wd === 0 && 'sun', today && 'today') }, fd(pad2(c.d))),
        h('span', { class: 'tt' }, tithiShort)),
      fest ? h('div', { class: cx('fe', !!major && 'major') }, nm(fest)) : null,
      (c.d === 1 || col === 0) ? h('div', { class: 'mn' }, nm(MONTHS_GU[c.monthIdx])) : null));
  });
  return h('div', null,
    h('div', { class: 'navrow', style: 'margin-bottom:12px' },
      NavBtn('left', T('prevMonth'), () => monthMove('cal', -1)),
      h('h2', { class: 'display cal-title' }, `${L(MON_GU[vm.m - 1], MON_EN[vm.m - 1])} ${fd(vm.y)}`),
      NavBtn('right', T('nextMonth'), () => monthMove('cal', 1))),
    h('div', { class: 'frame-thin', style: 'overflow:hidden' },
      h('div', { class: 'cal-head' }, WEEKDAYS.map((w, i) => h('div', { class: i === 0 ? 's' : '' }, S.lang === 'gu' ? w.guShort : w.en.slice(0, 3)))),
      h('div', { class: 'cal-grid' }, cells)),
    h('p', { class: 'legend' }, term('festival:major', L('લાલ = મુખ્ય તહેવાર', 'Red = major festival')), ' · ', L('રવિવાર લાલ', 'Sundays in red'), ' · ', term('panchak', L('ઝાંખો રંગ = પંચક', 'pale cells = Panchak'))));
}

// ------------------------------------------------------------------ MUHURAT
function MuhuratView() {
  const date = S.date;
  const data = dayData(date.y, date.m, date.d);
  const { chog, horaList } = data;
  const nowJd = jdFromDate(new Date());
  const today = isToday(date);
  const slotRow = (s, i) => {
    const c = CHOGHADIYA[s.nameIdx];
    const isNow = today && nowJd >= s.startJd && nowJd < s.endJd;
    return h('tr', { class: isNow ? 'now' : '' },
      h('td', { class: 'tnum', style: 'width:32px;color:#5c5142' }, fd(i + 1)),
      h('td', { class: c.good ? 'good-t' : 'bad-t', style: 'font-weight:500' }, term(gk.chog(c.key), nm(c)), isNow ? h('span', { class: 'nowtag' }, T('now')) : null),
      h('td', { class: 'tnum', style: 'white-space:nowrap' }, win(s.startJd, s.endJd, date)),
      h('td', { class: 'r' }, h('span', { class: cx('dot', c.good ? 'g' : 'b') })));
  };
  return h('div', { class: 'stack' },
    h('div', { class: 'navrow' },
      NavBtn('left', 'previous day', () => go({ date: shiftDate(date.y, date.m, date.d, -1) })),
      h('div', { class: 'mhead' },
        h('div', { class: 'display' }, `${fd(pad2(date.d))}-${fd(pad2(date.m))}-${fd(date.y)}`),
        h('button', { class: 'linkbtn', onclick: () => go({ tab: 'today', date }) }, L('આ દિવસનું પંચાંગ જુઓ →', 'View this day’s panchang →'))),
      NavBtn('right', 'next day', () => go({ date: shiftDate(date.y, date.m, date.d, 1) }))),
    h('div', { class: 'grid2' },
      h('div', { class: 'frame-thin pad-sm' }, Sect(term('choghadiya', T('choghadiyaDay'))), h('table', { class: 'ruled' }, h('tbody', null, chog.day.map(slotRow)))),
      h('div', { class: 'frame-thin pad-sm' }, Sect(term('choghadiya', T('choghadiyaNight'))), h('table', { class: 'ruled' }, h('tbody', null, chog.night.map(slotRow))))),
    h('div', { class: 'frame-thin pad' },
      Row(T('rahukaal'), win(...data.eighth.rahukaal), null, true, 'rahukaal'),
      Row(T('yamaganda'), win(...data.eighth.yamaganda), null, true, 'yamaganda'),
      Row(T('gulika'), win(...data.eighth.gulika), null, true, 'gulika'),
      Row(T('abhijit'), win(...data.abhijit), null, false, 'abhijit'),
      Row(T('brahma'), win(...data.brahma), null, false, 'brahma')),
    h('div', { class: 'frame-thin pad' },
      Sect([term('hora', T('hora')), ` (${L('૨૪ હોરા', '24 horas')})`],
        h('button', { class: 'linkbtn', onclick: () => { S.showHora = !S.showHora; render(); } }, S.showHora ? L('છુપાવો', 'Hide') : L('બતાવો', 'Show'))),
      S.showHora ? h('div', { class: 'horagrid' }, horaList.map((x) => {
        const isNow = today && nowJd >= x.startJd && nowJd < x.endJd;
        return h('div', { class: cx('horai', isNow && 'now') }, h('b', { class: x.good ? 'g' : '' }, term(gk.hora(x.lord), grahaName(x.lord))), h('span', null, win(x.startJd, x.endJd, date)));
      })) : null,
      h('p', { style: 'font-size:11.5px;color:#5c5142;margin-top:8px' }, L('લીલું = શુભ · લાલ = અશુભ. ચંદ્ર, ગુરુ, શુક્ર, બુધની હોરા શુભ.', 'Green = auspicious · red = inauspicious. Moon, Jupiter, Venus, Mercury horas are auspicious.'))));
}

// ------------------------------------------------------------------ FESTIVALS
const KIND_ORDER = ['major', 'vrat', 'purnima', 'jayanti', 'solar', 'national', 'recurring'];
function festDays(vm) {
  const c = place();
  const dim = new Date(Date.UTC(vm.y, vm.m, 0)).getUTCDate();
  const months = lunarMonthsBetween(julianDay(vm.y, vm.m - 1, 1), julianDay(vm.y, vm.m + 1, 1), c.lat, c.lon);
  const sank = sankrantisBetween(julianDay(vm.y, vm.m - 1, 1), julianDay(vm.y, vm.m + 1, 1));
  const out = [];
  for (let d = 1; d <= dim; d++) {
    const lm = lunarMonthOfFromMonths(vm.y, vm.m, d, months, c.lat, c.lon);
    const p = dayPanchang(vm.y, vm.m, d, c.lat, c.lon, lm);
    const fests = festivalsOfDay(p, { sankrantis: sank, lat: c.lat, lon: c.lon })
      .filter((f) => f.kind !== 'recurring')
      .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    if (fests.length) out.push({ d, wd: p.weekday, fests });
  }
  return out;
}
const festCache = new Map();
registerCache(() => festCache.clear());
function festData(vm) {
  const c = place();
  const key = `${vm.y}-${vm.m}-${placeKey(c)}`;
  if (festCache.has(key)) return festCache.get(key);
  const days = festDays(vm);
  const sank = sankrantisBetween(julianDay(vm.y, vm.m - 6, 1), julianDay(vm.y, vm.m + 7, 1));
  const jdFrom = Date.UTC(vm.y, vm.m - 5, 1) / 86400000 + 2440587.5;
  const jdTo = Date.UTC(vm.y, vm.m + 8, 1) / 86400000 + 2440587.5;
  const ecl = [];
  for (const e of lunarEclipsesBetween(jdFrom, jdTo).slice(0, 4)) {
    ecl.push({ jd: e.jd, gkey: 'eclipse:lunar', gu: `ચંદ્ર ગ્રહણ (${e.kind === 'total' ? 'પૂર્ણ' : e.kind === 'partial' ? 'આંશિક' : 'ઉપચ્છાયા'})`, en: `Lunar eclipse (${e.kind})`, visible: lunarEclipseVisibleAt(e.jd, c.lat, c.lon) });
  }
  for (const e of solarEclipsesBetween(jdFrom, jdTo).slice(0, 4)) {
    ecl.push({ jd: e.jd, gkey: 'eclipse:solar', gu: `સૂર્ય ગ્રહણ (${e.kind === 'total' ? 'પૂર્ણ' : e.kind === 'annular' ? 'વલયાકાર' : 'આંશિક'})`, en: `Solar eclipse (${e.kind})`, visible: solarEclipseVisibleAt(e.jd, c.lat, c.lon) });
  }
  ecl.sort((a, b) => a.jd - b.jd);
  const out = { days, sank, ecl };
  if (festCache.size > 8) festCache.clear();
  festCache.set(key, out);
  return out;
}
function FestivalsView() {
  const vm = S.fest;
  const { days, sank, ecl } = festData(vm);
  return h('div', { class: 'stack' },
    h('div', { class: 'navrow' },
      NavBtn('left', T('prevMonth'), () => monthMove('fest', -1)),
      h('h2', { class: 'display fest-title' }, `${L(MON_GU[vm.m - 1], MON_EN[vm.m - 1])} ${fd(vm.y)} ${T('festivalsOf')}`),
      NavBtn('right', T('nextMonth'), () => monthMove('fest', 1))),
    h('div', { class: 'frame-thin', style: 'overflow:hidden' },
      days.length === 0 ? h('p', { class: 'empty-note' }, L('આ માસમાં કોઈ મુખ્ય તહેવાર નથી.', 'No major festivals this month.')) : null,
      days.map((day) => h('div', { class: 'dayrow' },
        h('div', { class: 'dd' }, h('b', { class: day.wd === 0 ? 'sun' : '' }, fd(pad2(day.d))), h('span', null, S.lang === 'gu' ? WEEKDAYS[day.wd].guShort : WEEKDAYS[day.wd].enShort)),
        h('div', { class: 'ff' }, day.fests.map((f) => h('div', null,
          h('span', { class: f.kind === 'major' ? 'major' : f.kind === 'vrat' ? 'vrat' : 'other' }, term(`festival:${f.kind}`, nm(f))),
          (f.noteGu || f.noteEn) ? h('small', null, ` — ${fd((S.lang === 'gu' ? f.noteGu : f.noteEn) ?? '')}`) : null)))))),
    h('div', { class: 'frame-thin pad' },
      Sect(term('sankranti', T('sankrantiList'))),
      h('div', { class: 'two' }, sank.map((s) => h('div', { class: 'sk' },
        h('span', null, term(gk.rashi(s.rashiIdx + 1), rashiName(s.rashiIdx)), ' ', term('sankranti', L('સંક્રાંતિ', 'Sankranti'))),
        h('span', null, `${dmy(s.jd)} · ${ft(s.jd)}`))))),
    h('div', { class: 'frame-thin pad' },
      Sect(term('eclipse', T('eclipse'))),
      ecl.map((e) => h('div', { class: 'ecl' },
        h('div', { class: 'a' }, h('b', null, term(e.gkey, nm(e))), h('span', null, dmy(e.jd))),
        h('div', { class: 'b' }, `${L('ગ્રહણ મધ્ય', 'peak')} ${ftd(e.jd, null)} IST`,
          e.visible === true ? h('span', { class: 'good-t' }, ` · ${T('visibleInIndia')}`) : null,
          e.visible === false ? h('span', null, ` · ${T('notVisibleInIndia')}`) : null)))));
}

// ------------------------------------------------------------------ PLANETS
const SHOW = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SLOW = ['Jupiter', 'Saturn', 'Rahu'];
const PHASE_GU = ['', 'માથે (પહેલું ચરણ)', 'છાતીએ (બીજું ચરણ)', 'પગે (ત્રીજું ચરણ)'];
const PAVA_TXT = { gold: ['સોનું', 'Gold', false], silver: ['રૂપું', 'Silver', true], copper: ['તાંબુ', 'Copper', true], iron: ['લોઢું', 'Iron', false] };
let ingCache = null;
function PlanetsView() {
  const nowJd = jdFromDate(new Date());
  const positions = planetPositions(nowJd, SHOW);
  if (!ingCache) {
    const n = istNow();
    const from = julianDay(n.getFullYear(), n.getMonth() + 1, n.getDate()) - 200, to = from + 500;
    ingCache = SLOW.map((k) => ({ key: k, list: planetIngresses(k, from, to).filter((g) => g.jd >= nowJd - 60 && g.jd <= nowJd + 400) }));
  }
  const natal = S.natal;
  const satRashi = Math.floor(planetLongitude('Saturn', nowJd) / 30) + 1;
  const offset = (((satRashi - natal) % 12) + 12) % 12 + 1;
  let kind = null, phase = 0;
  if (offset === 12) { kind = 'big'; phase = 1; } else if (offset === 1) { kind = 'big'; phase = 2; } else if (offset === 2) { kind = 'big'; phase = 3; }
  else if (offset === 4 || offset === 8) kind = 'small';
  // Pava (Spec §12): Moon's sign at the instant Saturn entered its current sign, counted from the natal Moon.
  const pavaR = kind !== null ? pavaAt(natal, nowJd) : null;
  const pava = pavaR ? PAVA_TXT[pavaR.metal] : null;

  return h('div', { class: 'stack' },
    h('div', { class: 'frame-thin pad' },
      Sect(T('planetPositions')),
      h('table', { class: 'ruled' },
        h('thead', null, h('tr', null, h('th', null, L('ગ્રહ', 'Planet')), h('th', null, L('રાશિ', 'Sign')), h('th', { class: 'r' }, L('અંશ', 'Degree')))),
        h('tbody', null, positions.map((pl) => h('tr', null,
          h('td', { style: 'font-weight:500' }, term(gk.graha(pl.key), grahaName(pl.key))),
          h('td', null, term(gk.rashi(pl.rashi), rashiName(pl.rashi - 1))),
          h('td', { class: 'r tnum' }, `${fd(pl.deg)}°${fd(pad2(pl.min))}′ `, pl.retro ? h('span', { class: 'bad-t', style: 'font-weight:600' }, '(', term('retro', T('retro')), ')') : null)))))),
    h('div', { class: 'frame-thin pad' },
      Sect(term('gochar', T('ingresses'))),
      ingCache.map(({ key, list }) => h('div', { class: 'ing-block' },
        h('div', { class: 'ingh' }, term(gk.graha(key), grahaName(key))),
        list.map((g) => h('div', { class: cx('ingrow', g.jd < nowJd && 'past') }, h('span', null, '→ ', term(gk.rashi(g.rashiIdx + 1), rashiName(g.rashiIdx))), h('span', null, dmy(g.jd)))))) ),
    h('div', { class: 'frame-thin pad-3' },
      Sect(term('panoti', T('panoti'))),
      h('label', { class: 'lbl' }, T('selectRashi')),
      h('div', { class: 'rbtns' }, RASHIS.map((r, i) => h('button', { class: cx('rbtn', natal === i + 1 && 'on'), onclick: () => { S.natal = i + 1; render(); } }, rashiShort(i)))),
      h('div', { class: 'panoti-txt' },
        h('div', null, `${L('શનિ હાલ', 'Saturn now')}: `, h('b', null, rashiName(satRashi - 1)), ' · ', `${L('જન્મ રાશિથી', 'from birth sign')} `, h('b', null, fd(offset)),
          S.lang === 'gu' ? 'માં' : (['st', 'nd', 'rd'][offset - 1] || 'th')),
        kind === null ? h('div', { class: 'good-t', style: 'font-weight:600;margin-top:4px' }, T('panotiNone'))
          : h('div', { style: 'margin-top:4px' },
            h('span', { style: `font-weight:600;color:${kind === 'big' ? '#b81e2b' : '#e07b24'}` }, term(kind === 'big' ? 'sadesati' : 'dhaiya', kind === 'big' ? T('bigPanoti') : T('smallPanoti'))),
            kind === 'big' ? h('span', null, ' — ', term('panotiphase', S.lang === 'gu' ? PHASE_GU[phase] : `phase ${phase}`)) : null,
            pava ? h('span', { class: pava[2] ? 'good-t' : 'bad-t', style: 'margin-left:8px' }, [term('pava', L('પાયો', 'pava')), `: ${S.lang === 'gu' ? pava[0] : pava[1]}`, pavaR && !pavaR.confident ? h('span', { class: 'bad-t', title: L('શનિના પ્રવેશ સમયે ચંદ્ર રાશિ બદલે છે — અંદાજ', 'Moon changes sign within ±12 h of Saturn’s ingress — approximate'), style: 'margin-left:4px' }, '≈') : null]) : null))));
}

// ------------------------------------------------------------------ KUNDALI
const EN_SHORT = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const HOUSE_NUM = { 1: [50, 14], 2: [25, 4.5], 3: [6, 21], 4: [14, 46], 5: [6, 79], 6: [25, 95.5], 7: [50, 86], 8: [75, 95.5], 9: [94, 79], 10: [86, 46], 11: [94, 21], 12: [75, 4.5] };
const HOUSE_PL = { 1: [50, 26], 2: [27, 13], 3: [13, 27], 4: [27, 50], 5: [13, 73], 6: [27, 87], 7: [50, 74], 8: [73, 87], 9: [87, 73], 10: [73, 50], 11: [87, 27], 12: [73, 13] };
function chartSvg(lagnaRashi, planets) {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('role', 'img');
  const el = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; s.append(e); return e; };
  el('rect', { x: 1, y: 1, width: 98, height: 98, fill: '#fbf7ec', stroke: '#221a12', 'stroke-width': 1.1 });
  el('line', { x1: 1, y1: 1, x2: 99, y2: 99, stroke: '#221a12', 'stroke-width': 0.5 });
  el('line', { x1: 99, y1: 1, x2: 1, y2: 99, stroke: '#221a12', 'stroke-width': 0.5 });
  el('polygon', { points: '50,1 99,50 50,99 1,50', fill: 'none', stroke: '#221a12', 'stroke-width': 0.5 });
  const rashiOfHouse = (hh) => ((lagnaRashi + hh - 2) % 12) + 1;
  for (const [hh, [x, y]] of Object.entries(HOUSE_NUM)) {
    el('text', { x, y, 'text-anchor': 'middle', 'font-size': 5, fill: '#5c5142', 'font-weight': rashiOfHouse(+hh) === lagnaRashi ? 700 : 400 }, fd(rashiOfHouse(+hh)));
  }
  const byHouse = {};
  for (const pl of planets) { const hh = ((pl.rashi - lagnaRashi) + 12) % 12 + 1; (byHouse[hh] ||= []).push(pl); }
  for (const [hh, list] of Object.entries(byHouse)) {
    const [x, y] = HOUSE_PL[hh];
    el('text', { x, y, 'text-anchor': 'middle', 'font-size': 4.6, 'font-weight': 600, fill: '#b81e2b' }, list.map((pl) => (S.lang === 'gu' ? GRAHAS[pl.key].guShort : EN_SHORT[pl.key]) + (pl.retro ? '*' : '')).join(' '));
  }
  return s;
}
function doCast() {
  const [y, m, d] = S.form.date.split('-').map(Number);
  const [hour, minute] = S.form.time.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hour)) return;
  const c = Places.findPlace(S.form.placeId) || place();
  S.cast = castKundali({ y, m, d, hour, minute, lat: c.lat, lon: c.lon });
  S.openDasha = null;
  render();
}
function KundaliView() {
  const cast = S.cast;
  const nowJd = jdFromDate(new Date());
  const parts = [
    h('div', { class: 'frame-thin pad-3' },
      Sect(T('birthDetails')),
      h('div', { class: 'form3' },
        h('div', null, h('label', { class: 'lbl' }, T('birthDate')),
          h('input', { type: 'date', class: 'inp', value: S.form.date, min: '1925-01-01', max: '2100-12-31', oninput: (e) => { S.form.date = e.target.value; } })),
        h('div', null, h('label', { class: 'lbl' }, `${T('birthTime')} (IST)`),
          h('input', { type: 'time', class: 'inp', value: S.form.time, oninput: (e) => { S.form.time = e.target.value; } })),
        h('div', null, h('label', { class: 'lbl' }, T('birthPlace')),
          h('select', { class: 'inp', onchange: (e) => { S.form.placeId = e.target.value; } },
            Places.loadPlaces().map((c) => h('option', { value: c.id, selected: c.id === S.form.placeId }, placeName(c)))))),
      h('button', { class: 'castbtn', onclick: doCast }, T('generate'))),
  ];
  if (cast) {
    const curIdx = cast.dashas.findIndex((dd) => nowJd >= dd.startJd && nowJd < dd.endJd);
    const chartPl = cast.planets.map((p) => ({ key: p.key, rashi: p.rashi, retro: p.retro }));
    const navPl = cast.planets.map((p) => ({ key: p.key, rashi: navamsaSign(p.lon), retro: false }));
    parts.push(
      h('div', { class: 'frame-thin pad' },
        Sect(T('lagna')),
        Row(T('lagna'), [term(gk.rashi(cast.lagnaRashi), rashiName(cast.lagnaRashi - 1)), ` ${fd(cast.lagnaDeg)}°${fd(pad2(cast.lagnaMin))}′`], null, false, 'lagna'),
        Row(T('moonRashi'), term(gk.rashi(cast.moonRashi), rashiName(cast.moonRashi - 1)), null, false, 'moonRashi'),
        Row(T('janmaNakshatra'), [term(gk.nakshatra(cast.nakshatra), nm(NAKSHATRAS[cast.nakshatra - 1])), ` — ${T('pada')} ${fd(cast.pada)}`], null, false, 'nakshatra'),
        Row(`${T('navamsa')} (Moon)`, rashiName(navamsaSign(cast.moonLon) - 1), null, false, 'navamsa')),
      h('div', { class: 'grid2 grid2s' },
        h('div', { class: 'frame-thin pad-sm chartbox' }, Sect(T('rashiChart')), chartSvg(cast.lagnaRashi, chartPl)),
        h('div', { class: 'frame-thin pad-sm chartbox' }, Sect(T('navamsaChart')), chartSvg(cast.lagnaNavamsa, navPl))),
      h('div', { class: 'frame-thin pad' },
        Sect(T('planetPositions')),
        h('table', { class: 'ruled' },
          h('thead', null, h('tr', null, h('th', null, L('ગ્રહ', 'Planet')), h('th', null, L('રાશિ', 'Sign')), h('th', { class: 'r' }, L('અંશ', 'Degree')), h('th', { class: 'r' }, T('navamsa')))),
          h('tbody', null, cast.planets.filter((p) => SHOW.includes(p.key)).map((p) => h('tr', null,
            h('td', { style: 'font-weight:500' }, term(gk.graha(p.key), grahaName(p.key))),
            h('td', null, term(gk.rashi(p.rashi), rashiName(p.rashi - 1))),
            h('td', { class: 'r tnum' }, `${fd(p.deg)}°${fd(pad2(p.min))}′`, p.retro ? h('span', { class: 'bad-t' }, '*') : null),
            h('td', { class: 'r' }, rashiShort(cast.navamsaSigns[p.key] - 1))))))),
      h('div', { class: 'frame-thin pad-3' },
        Sect(term('avakahada', T('avakahada'))),
        h('div', { class: 'chips' },
          h('span', { class: 'chip saffron' }, term('syllables', T('syllables')), `: ${cast.avakahada.syllables.join(', ')}`),
          h('span', { class: 'chip' }, term('yoni', T('yoni')), `: ${nm(AVAKAHADA[cast.nakshatra - 1].yoni)}`), h('span', { class: 'chip' }, term('gana', T('gana')), `: ${nm(AVAKAHADA[cast.nakshatra - 1].gana)}`), h('span', { class: 'chip' }, term('nadi', T('nadi')), `: ${nm(AVAKAHADA[cast.nakshatra - 1].nadi)}`))),
      h('div', { class: 'frame-thin pad' },
        Sect(term('vimshottari', T('vimshottari'))),
        cast.dashas.map((dd, i) => {
          const cur = i === curIdx, open = S.openDasha === i;
          return h('div', { class: cx('dasha', cur && 'cur') },
            h('button', { onclick: () => { S.openDasha = open ? null : i; render(); } },
              h('b', null, grahaName(dd.lord), cur ? h('span', { class: 'nowtag' }, T('now')) : null),
              h('span', { class: 'dt' }, `${fd(dd.startDate)} → ${fd(dd.endDate)}`)),
            open ? h('div', { class: 'antars' }, dd.antars.map((a) => {
              const aNow = cur && nowJd >= a.startJd && nowJd < a.endJd;
              return h('div', { class: cx('antar', aNow && 'now') }, h('span', null, grahaName(a.lord)), h('span', null, `${fd(a.startDate)} → ${fd(a.endDate)}`));
            })) : null);
        })));
  }
  return h('div', { class: 'stack' }, parts);
}

// ------------------------------------------------------------------ shell
function go(nav) {
  if (nav.date) S.date = nav.date;
  const tabChanged = nav.tab && nav.tab !== S.tab;
  if (nav.tab) S.tab = nav.tab;
  render(tabChanged || !!nav.date);
}
function setTab(k) { S.tab = k; render(true); }
hooks.render = (...a) => render(...a); hooks.go = go; hooks.setTab = setTab;

// ---- tab registry: built-ins
const BUILTIN = [
  { key: 'today', icon: 'sun', strKey: 'tabToday', view: TodayView },
  { key: 'calendar', icon: 'cal', strKey: 'tabCalendar', view: CalendarView },
  { key: 'muhurat', icon: 'clock', strKey: 'tabMuhurat', view: MuhuratView },
  { key: 'festivals', icon: 'party', strKey: 'tabFestivals', view: FestivalsView },
  { key: 'planets', icon: 'orbit', strKey: 'tabPlanets', view: PlanetsView },
  { key: 'kundali', icon: 'star', strKey: 'tabKundali', view: KundaliView },
  { key: 'muhurtaPlanner', icon: 'gem', strKey: 'tabMuhurtaPlanner', view: PlannerView },
  { key: 'samvat', icon: 'grid', strKey: 'tabSamvat', view: SamvatView },
];
BUILTIN.forEach((t, i) => REGISTRY.registerTab({ ...t, order: (i + 1) * 10 }));
export const TABS = REGISTRY.tabs;   // live array — reflects registerTab / unregisterTab

// ---- plugins
function registerPlugin(p) {
  if (!p || !p.key || typeof p.mount !== 'function') { console.warn('invalid panchang plugin', p); return; }
  REGISTRY.registerTab({
    key: p.key, strGu: p.strGu, strEn: p.strEn, icon: p.icon || 'puzzle', order: p.order, custom: true,
    view: () => {
      const el = h('div', { class: 'stack plugin-view' });
      try { p.mount(el, window.__panchang); } catch (err) { console.error(err); el.textContent = 'Plugin error: ' + (err && err.message); }
      return el;
    },
  });
}

// ---- header / nav
const btnLabel = (def) => tabLabel(def);
function TabButtons(tabs) { return tabs.map((x) => h('button', { class: S.tab === x.key ? 'on' : '', 'aria-current': S.tab === x.key ? 'page' : null, onclick: () => setTab(x.key) }, icon(x.icon), h('span', null, btnLabel(x)))); }

function Header(tabs) {
  return h('header', { class: 'hdr' }, h('div', { class: 'wrap' },
    h('div', { class: 'hdr-row' },
      h('div', { class: 'hdr-l' }, h('h1', { class: 'display' }, T('appName')), h('p', { class: 'tag' }, T('appTagline'))),
      h('div', { class: 'hdr-r' },
        h('button', { class: 'btn-place', 'aria-label': `${T('place')}: ${placeName()}`, title: T('place'), onclick: openPlacePicker }, icon('pin'), h('span', null, placeName())),
        h('button', { class: cx('btn-sq', S.guNumerals && 'on'), 'aria-label': T('gujaratiNumerals'), title: T('gujaratiNumerals'), onclick: () => { S.guNumerals = !S.guNumerals; saveSettings(); render(); rebuildSheet(); } }, '૯'),
        h('button', { class: 'btn-lang', 'aria-label': T('language'), onclick: () => { S.lang = S.lang === 'gu' ? 'en' : 'gu'; document.documentElement.lang = S.lang; saveSettings(); render(); rebuildSheet(); } }, icon('lang'), S.lang === 'gu' ? 'EN' : 'ગુ'),
        h('button', { class: 'btn-sq', 'aria-label': T('settings'), title: T('settings'), onclick: openSettings }, icon('gear')))),
    h('nav', { class: 'topnav', 'aria-label': T('bottomNavLabel') }, TabButtons(tabs))));
}
function BottomNav(tabs) {
  const strip = h('div', { class: 'botnav-grid', role: 'region', 'aria-label': T('bottomNavLabel'), tabindex: '0' }, TabButtons(tabs));
  const nav = h('nav', { class: 'botnav', 'aria-label': T('bottomNavLabel') }, strip);
  const fade = () => { nav.classList.toggle('more', strip.scrollWidth > strip.clientWidth + 2 && strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2); nav.classList.toggle('less', strip.scrollLeft > 2); };
  strip.addEventListener('scroll', fade, { passive: true });
  nav._after = () => {
    const on = strip.querySelector('.on');
    if (on) { const left = on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2; strip.scrollLeft = Math.max(0, left); }   // centre the active tab without moving the page
    fade();
  };
  return nav;
}

export function render(toTop = false) {
  const root = document.getElementById('app');
  const y = window.scrollY;
  const tabs = REGISTRY.visibleTabs();
  if (!tabs.some((t) => t.key === S.tab)) S.tab = tabs[0].key;
  let content;
  try { content = REGISTRY.views[S.tab](); } catch (err) { console.error(err); content = h('p', { class: 'empty-note' }, 'Error: ' + (err && err.message)); }
  const bn = BottomNav(tabs);
  setKids(root, Header(tabs), h('main', null, content), bn);
  bn._after();
  // keep the active top-nav tab visible too (desktop)
  const topOn = root.querySelector('.topnav .on');
  if (topOn) { const tn = topOn.parentElement; tn.scrollLeft = Math.max(0, topOn.offsetLeft - (tn.clientWidth - topOn.offsetWidth) / 2); }
  window.scrollTo(0, toTop ? 0 : y);
}
REGISTRY.onChange(() => { if (document.getElementById('app')?.firstChild) render(); });

// ---- public surface for plugins / debugging
window.__panchang = {
  state: S, render, go, setTab, registry: REGISTRY, registerPlugin, h, icon, T, L, fd, nm, place, dayData,
  glossary: { entry: glossaryEntry, all: glossaryAll, register: registerGlossaryEntry, open: openGlossary },
  places: { ...Places, select: setPlace, openPicker: openPlacePicker },
};

// ---- boot
document.documentElement.lang = S.lang;
{
  const list = window.PanchangPlugins || (window.PanchangPlugins = []);
  list.forEach(registerPlugin);
  list.push = function push(...ps) { const n = Array.prototype.push.apply(this, ps); ps.forEach(registerPlugin); return n; };
}
render();
