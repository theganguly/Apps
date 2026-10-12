/**
 * samvat.ts — whole-year views: lunar months, Panchak / Vinchhudo blocks, sankrantis,
 * Ekadashi / Purnima / Amavasya lists and eclipses.
 *
 * Panchak and Vinchhudo are NOT re-derived here: every day is run through dayPanchang()
 * + dayFlags() and the blocks are collected from those flags (start/end instants come
 * from dayFlags itself).
 */
import { julianDay, jdToLocal, IST_HOURS } from './astro';
import {
  dayPanchang, dayFlags, lunarMonthsBetween, lunarMonthOfFromMonths, sankrantisBetween,
  fmtISTDateTime, fmtISTDate, type LunarMonth, type DayPanchang, type DayFlags, type Sankranti,
} from './core';
import { lunarEclipsesBetween, solarEclipsesBetween, lunarEclipseVisibleAt, solarEclipseVisibleAt } from './eclipse';
import { MONTHS_GU, EKADASHI_NAMES, EKADASHI_EN, RASHIS } from './data';
import { fmtDigits, type Lang } from './i18n';

export interface YMD { y: number; m: number; d: number }
export interface LatLon { lat: number; lon: number }

export const ymdKey = (x: YMD) => `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
export const addDays = (x: YMD, by: number): YMD => {
  const d = new Date(Date.UTC(x.y, x.m - 1, x.d + by));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
};
export const daysBetween = (a: YMD, b: YMD) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);

export interface YearRange {
  kind: 'samvat' | 'gregorian';
  label: number;            // vikram year or CE year
  start: YMD; end: YMD;     // inclusive civil dates
  months: LunarMonth[];     // lunar months overlapping the range (includes adhik)
}

/** Vikram samvatsar (Kartak Sud 1 → Aaso Amavasya) for a Vikram year, at a place. */
export function samvatSpan(vikram: number, lat: number, lon: number): YearRange {
  const ce = vikram - 57;
  const all = lunarMonthsBetween(julianDay(ce, 9, 1), julianDay(ce + 1, 12, 20), lat, lon);
  const kartaks = all.filter((mo) => mo.index === 0 && !mo.adhik);
  const first = kartaks.find((mo) => mo.startDate.y === ce);
  const next = kartaks.find((mo) => mo.startDate.y === ce + 1);
  if (!first) throw new Error(`cannot locate Kartak Sud 1 of VS ${vikram}`);
  const start = first.startDate;
  const end = next ? addDays(next.startDate, -1) : addDays(start, 353);
  const months = all.filter((mo) => mo.startJd >= first.startJd - 1e-6 && (!next || mo.startJd < next.startJd - 1e-6));
  return { kind: 'samvat', label: vikram, start, end, months };
}

export function gregorianSpan(year: number, lat: number, lon: number): YearRange {
  const months = lunarMonthsBetween(julianDay(year, 1, 1), julianDay(year, 12, 31), lat, lon);
  return { kind: 'gregorian', label: year, start: { y: year, m: 1, d: 1 }, end: { y: year, m: 12, d: 31 }, months };
}

export interface RangeDay { ymd: YMD; p: DayPanchang; flags: DayFlags }
/** Iterate the days of a range computing dayPanchang + dayFlags once per day. */
export function* eachDay(range: YearRange, lat: number, lon: number): Generator<RangeDay> {
  const n = daysBetween(range.start, range.end);
  for (let i = 0; i <= n; i++) {
    const ymd = addDays(range.start, i);
    const lm = lunarMonthOfFromMonths(ymd.y, ymd.m, ymd.d, range.months, lat, lon);
    const p = dayPanchang(ymd.y, ymd.m, ymd.d, lat, lon, lm);
    yield { ymd, p, flags: dayFlags(p) };
  }
}

export interface MoonBlock { startJd: number; endJd: number; firstDay: YMD; lastDay: YMD }
export interface TithiDay { ymd: YMD; monthIdx: number; adhik: boolean; paksha: 'sud' | 'vad'; nameGu: string; nameEn: string; vriddhi: boolean; kshaya?: boolean }
export interface EclipseRow { jd: number; type: 'lunar' | 'solar'; kind: string; visible: boolean }

export interface YearReport {
  range: YearRange;
  panchak: MoonBlock[];
  vinchhudo: MoonBlock[];
  sankrantis: Sankranti[];
  ekadashis: TithiDay[];
  purnimas: TithiDay[];
  amavasyas: TithiDay[];
  eclipses: EclipseRow[];
}

export function eclipsesBetween(jdFrom: number, jdTo: number, lat: number, lon: number): EclipseRow[] {
  const out: EclipseRow[] = [];
  for (const e of lunarEclipsesBetween(jdFrom, jdTo)) out.push({ jd: e.jd, type: 'lunar', kind: e.kind, visible: lunarEclipseVisibleAt(e.jd, lat, lon) });
  for (const e of solarEclipsesBetween(jdFrom, jdTo)) out.push({ jd: e.jd, type: 'solar', kind: e.kind, visible: solarEclipseVisibleAt(e.jd, lat, lon) });
  return out.sort((a, b) => a.jd - b.jd);
}

export function buildYearReport(range: YearRange, lat: number, lon: number): YearReport {
  const panchak = new Map<number, MoonBlock>();
  const vinch = new Map<number, MoonBlock>();
  const ekadashis: TithiDay[] = [], purnimas: TithiDay[] = [], amavasyas: TithiDay[] = [];
  const touch = (map: Map<number, MoonBlock>, s: number | null, e: number | null, day: YMD) => {
    if (s === null || e === null) return;
    const k = Math.round(s * 1440);
    const b = map.get(k);
    if (b) b.lastDay = day; else map.set(k, { startJd: s, endJd: e, firstDay: day, lastDay: day });
  };
  let prevTithi = -1;
  let prev: { ymd: YMD; monthIdx: number; adhik: boolean; paksha: 'sud' | 'vad' } | null = null;
  const addTithi = (lost: number, base: Omit<TithiDay, 'nameGu' | 'nameEn'>) => {
    if (lost === 11 || lost === 26) {
      const side = lost === 11 ? 0 : 1;
      // in an adhik month the Ekadashis are Padmini (Sud) and Parama (Vad)
      const gu = base.adhik ? (side === 0 ? 'પદ્મિની' : 'પરમ') : EKADASHI_NAMES[base.monthIdx][side];
      const en = base.adhik ? (side === 0 ? 'Padmini' : 'Parama') : EKADASHI_EN[base.monthIdx][side];
      ekadashis.push({ ...base, nameGu: `${gu} એકાદશી`, nameEn: `${en} Ekadashi` });
    } else if (lost === 15) purnimas.push({ ...base, nameGu: `${MONTHS_GU[base.monthIdx].gu} પૂર્ણિમા`, nameEn: `${MONTHS_GU[base.monthIdx].en} Purnima` });
    else if (lost === 30) amavasyas.push({ ...base, nameGu: `${MONTHS_GU[base.monthIdx].gu} અમાવસ્યા`, nameEn: `${MONTHS_GU[base.monthIdx].en} Amavasya` });
  };
  for (const { ymd, p, flags } of eachDay(range, lat, lon)) {
    if (flags.panchak) touch(panchak, flags.panchakStart, flags.panchakEnd, ymd);
    if (flags.vinchhudo) touch(vinch, flags.vinchhudoStart, flags.vinchhudoEnd, ymd);
    const vriddhi = p.tithiFull === prevTithi;
    // tithi kshaya: a tithi that began and ended between two sunrises — listed on the day it begins
    if (p.tithiKshaya && prev) {
      const lost = p.tithiFull === 1 ? 30 : p.tithiFull - 1;
      addTithi(lost, { ymd: prev.ymd, monthIdx: prev.monthIdx, adhik: prev.adhik, paksha: prev.paksha, vriddhi: false, kshaya: true });
    }
    prevTithi = p.tithiFull;
    prev = { ymd, monthIdx: p.monthIdx, adhik: p.monthAdhik, paksha: p.paksha };
    if (vriddhi) continue;
    const base = { ymd, monthIdx: p.monthIdx, adhik: p.monthAdhik, paksha: p.paksha, vriddhi };
    if (p.tithi === 11) addTithi(p.paksha === 'sud' ? 11 : 26, base);
    else if (p.tithiFull === 15) addTithi(15, base);
    else if (p.tithiFull === 30) addTithi(30, base);
  }
  for (const l of [ekadashis, purnimas, amavasyas]) l.sort((a, b) => ymdKey(a.ymd).localeCompare(ymdKey(b.ymd)));
  const jdFrom = julianDay(range.start.y, range.start.m, range.start.d) - IST_HOURS / 24;
  const jdTo = julianDay(range.end.y, range.end.m, range.end.d) + 1 - IST_HOURS / 24;
  return {
    range,
    panchak: [...panchak.values()].sort((a, b) => a.startJd - b.startJd),
    vinchhudo: [...vinch.values()].sort((a, b) => a.startJd - b.startJd),
    sankrantis: sankrantisBetween(jdFrom, jdTo),
    ekadashis, purnimas, amavasyas,
    eclipses: eclipsesBetween(jdFrom, jdTo, lat, lon),
  };
}

// ------------------------------------------------------------------ plain-text export
const ECL_KIND_GU: Record<string, string> = { total: 'પૂર્ણ', partial: 'આંશિક', penumbral: 'ઉપચ્છાયા', annular: 'વલયાકાર' };

export function reportToText(rep: YearReport, lang: Lang, guNumerals: boolean, placeName: string): string {
  const fd = (s: string | number) => fmtDigits(s, lang, guNumerals);
  const L = (gu: string, en: string) => (lang === 'gu' ? gu : en);
  const ymdDisp = (x: YMD) => fd(`${String(x.d).padStart(2, '0')}-${String(x.m).padStart(2, '0')}-${x.y}`);
  const dt = (jd: number) => fd(`${fmtISTDate(jd)} ${fmtISTDateTime(jd).slice(6)}`);
  const lines: string[] = [];
  const title = rep.range.kind === 'samvat'
    ? `${L('વિક્રમ સંવત્', 'Vikram Samvat')} ${fd(rep.range.label)}`
    : `${L('ઇ.સ.', 'CE')} ${fd(rep.range.label)}`;
  lines.push(`${L('હરિલાલ પંચાંગ', 'Harilal Panchang')} — ${title}`);
  lines.push(`${L('સ્થળ', 'Place')}: ${placeName}  (${L('સમય IST', 'times IST')})`);
  lines.push(`${ymdDisp(rep.range.start)} → ${ymdDisp(rep.range.end)}`);
  lines.push('');
  lines.push(`== ${L('ચાંદ્ર માસ', 'Lunar months')} ==`);
  for (const mo of rep.range.months) {
    lines.push(`${L(MONTHS_GU[mo.index].gu, MONTHS_GU[mo.index].en)}${mo.adhik ? L(' (અધિક)', ' (Adhik)') : ''}: ${ymdDisp(mo.startDate)} → ${ymdDisp(mo.endDate)}`);
  }
  const block = (head: string, list: MoonBlock[]) => {
    lines.push(''); lines.push(`== ${head} ==`);
    if (!list.length) lines.push(L('કંઈ નથી.', 'None.'));
    for (const b of list) lines.push(`${dt(b.startJd)}  →  ${dt(b.endJd)}`);
  };
  block(L('પંચક', 'Panchak'), rep.panchak);
  block(L('વિછુડો', 'Vinchhudo'), rep.vinchhudo);
  lines.push(''); lines.push(`== ${L('સંક્રાંતિ', 'Sankrantis')} ==`);
  for (const s of rep.sankrantis) lines.push(`${L(RASHIS[s.rashiIdx].gu, RASHIS[s.rashiIdx].en.split(' (')[0])}: ${dt(s.jd)}`);
  const days = (head: string, list: TithiDay[]) => {
    lines.push(''); lines.push(`== ${head} ==`);
    for (const d of list) lines.push(`${ymdDisp(d.ymd)}  ${L(d.nameGu, d.nameEn)}${d.adhik ? L(' (અધિક)', ' (Adhik)') : ''}${d.kshaya ? L(' (તિથિ ક્ષય)', ' (tithi kshaya)') : ''}`);
  };
  days(L('એકાદશી', 'Ekadashi'), rep.ekadashis);
  days(L('પૂર્ણિમા', 'Purnima'), rep.purnimas);
  days(L('અમાવસ્યા', 'Amavasya'), rep.amavasyas);
  lines.push(''); lines.push(`== ${L('ગ્રહણ', 'Eclipses')} ==`);
  if (!rep.eclipses.length) lines.push(L('કંઈ નથી.', 'None.'));
  for (const e of rep.eclipses) {
    const k = lang === 'gu' ? ECL_KIND_GU[e.kind] ?? e.kind : e.kind;
    lines.push(`${dt(e.jd)}  ${e.type === 'lunar' ? L('ચંદ્ર ગ્રહણ', 'Lunar eclipse') : L('સૂર્ય ગ્રહણ', 'Solar eclipse')} (${k}) — ${e.visible ? L('ભારતમાં/સ્થળે દેખાય', 'visible here') : L('દેખાતું નથી', 'not visible here')}`);
  }
  lines.push('');
  lines.push(L('ગણતરી ઉપકરણ પર — મીયસ ખગોળશાસ્ત્ર, લાહિરી અયનાંશ.', 'Computed on-device — Meeus astronomy, Lahiri ayanamsa.'));
  return lines.join('\n');
}

export { jdToLocal };
