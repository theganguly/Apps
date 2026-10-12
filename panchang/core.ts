/**
 * core.ts — day panchang assembly, lunar months, samvat, choghadiya/hora,
 * inauspicious windows. Pure functions over astro.ts + data.ts.
 */
import {
  jdeFromJd, sunriseSunsetJd, limbEnd, tithiNumber, karanaNumber, nakshatraNumber,
  yogaNumber, moonRashi, sunRashi, elongation, findCrossing, nextCrossing, prevCrossing,
  siderealMoon, siderealSun, jdToLocal, julianDay, IST_HOURS, siderealRahu, lahiriAyanamsa,
} from './astro';
import {
  SUN_RASHI_TO_MONTH, TITHI_GU, AMAS, karanaName,
  CHOGHADIYA, HORA_ORDER, WEEKDAY_LORD, RASHIS, SAMVATSARAS_GU,
  AMRIT_SIDDHI_NAK, SIDDHI_NAK, DAGDHA_TITHI, KANKACH_TITHI, DISHA_SHOOL,
} from './data';

export const RAJKOT = { lat: 22.3039, lon: 70.8022 };

// ------------------------------------------------------------ time formatting (fixed IST)
export function fmtIST(jd: number): string {
  const t = jdToLocal(jd, IST_HOURS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(t.hour)}:${pad(t.minute)}`;
}
export function fmtISTDate(jd: number): string {
  const t = jdToLocal(jd, IST_HOURS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(t.d)}-${pad(t.m)}-${t.y}`;
}
/**
 * Time with a date prefix when the instant falls on a different IST civil date than `ref`.
 *   same civil date as ref → "23:27"
 *   different date         → "14-11 03:11"
 * Without `ref` the date is always included.
 */
export function fmtISTDateTime(jd: number, ref?: { y: number; m: number; d: number }): string {
  const t = jdToLocal(jd, IST_HOURS);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(t.hour)}:${pad(t.minute)}`;
  if (ref && t.y === ref.y && t.m === ref.m && t.d === ref.d) return hm;
  return `${pad(t.d)}-${pad(t.m)} ${hm}`;
}
export function weekdayOfJd(jd: number): number { // 0 = Sunday, of the IST civil date
  const t = jdToLocal(jd, IST_HOURS);
  return new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay();
}

// ------------------------------------------------------------ lunar months (amānta)
/** All new-moon JDs (UT) in [jdFrom, jdTo]. */
export function newMoonsBetween(jdFrom: number, jdTo: number): number[] {
  const out: number[] = [];
  let t = jdFrom - 31;
  const f = (jd: number) => elongation(jdeFromJd(jd));
  while (t < jdTo + 31) {
    const c = findCrossing(f, 0, t, t + 10);
    if (c !== null) {
      if (c >= jdFrom - 1 && c <= jdTo && (out.length === 0 || c - out[out.length - 1] > 20)) out.push(c);
      t = c + 20;
    } else t += 10;
  }
  return out;
}

export interface LunarMonth {
  index: number;          // 0 = Kartak … 11 = Aaso
  adhik: boolean;
  startJd: number;        // new moon instant
  endJd: number;          // next new moon instant
  /** first civil date (IST) whose sunrise is after startJd */
  startDate: { y: number; m: number; d: number };
  /** last civil date (IST) whose sunrise is before endJd */
  endDate: { y: number; m: number; d: number };
}

function firstSunriseAfter(jd: number, lat: number, lon: number): { y: number; m: number; d: number } {
  let t: { y: number; m: number; d: number } = jdToLocal(jd, IST_HOURS);
  for (let i = 0; i < 4; i++) {
    const [sr] = sunriseSunsetJd(t.y, t.m, t.d, lat, lon);
    if (sr > jd) return t;
    const next = new Date(Date.UTC(t.y, t.m - 1, t.d + 1));
    t = { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate() };
  }
  return t;
}

/** Build lunar months overlapping [jdFrom, jdTo] for a place. */
export function lunarMonthsBetween(jdFrom: number, jdTo: number, lat: number, lon: number): LunarMonth[] {
  const nms = newMoonsBetween(jdFrom - 40, jdTo + 45);
  const months: LunarMonth[] = [];
  for (let i = 0; i < nms.length - 1; i++) {
    const a = nms[i], b = nms[i + 1];
    if (b < jdFrom - 5 || a > jdTo + 5) continue;
    const rA = Math.floor(siderealSun(jdeFromJd(a)) / 30);   // sun rashi 0..11 at new moon
    const rB = Math.floor(siderealSun(jdeFromJd(b)) / 30);
    const adhik = rA === rB;
    // Name: month containing the sankranti out of rashi rA. An adhik lunation has no sankranti and takes the
    // name of the FOLLOWING (nija) month; the Sun is still in rashi rA throughout, so that is the same lookup.
    // (Adhik Jeth 2026 = Sun in Vrushabh at both new moons → Jeth, followed by Nija Jeth.)
    const idx = SUN_RASHI_TO_MONTH[rA];
    const startDate = firstSunriseAfter(a, lat, lon);
    const endLocal = jdToLocal(b, IST_HOURS);
    // last civil date whose sunrise < b: day before the first sunrise after b
    const fsb = firstSunriseAfter(b, lat, lon);
    const prev = new Date(Date.UTC(fsb.y, fsb.m - 1, fsb.d - 1));
    months.push({
      index: idx, adhik, startJd: a, endJd: b, startDate,
      endDate: { y: prev.getUTCFullYear(), m: prev.getUTCMonth() + 1, d: prev.getUTCDate() },
    });
    void endLocal;
  }
  return months;
}

/** Lunar month (with paksha & tithi at sunrise) for a civil date. */
export function lunarMonthOf(y: number, m: number, d: number, lat: number, lon: number): { month: LunarMonth; tithi: number } {
  const jd = julianDay(y, m, d);
  const months = lunarMonthsBetween(jd - 35, jd + 35, lat, lon);
  return lunarMonthOfFromMonths(y, m, d, months, lat, lon);
}

/** Same as lunarMonthOf but takes a precomputed month list (fast for grids). */
export function lunarMonthOfFromMonths(y: number, m: number, d: number, months: LunarMonth[], lat: number, lon: number): { month: LunarMonth; tithi: number } {
  const [sr] = sunriseSunsetJd(y, m, d, lat, lon);
  const tithi = tithiNumber(jdeFromJd(sr));
  for (const mo of months) {
    const s = Date.UTC(mo.startDate.y, mo.startDate.m - 1, mo.startDate.d);
    const e = Date.UTC(mo.endDate.y, mo.endDate.m - 1, mo.endDate.d);
    const cur = Date.UTC(y, m - 1, d);
    if (cur >= s && cur <= e) return { month: mo, tithi };
  }
  // fallback: closest
  return { month: months[0], tithi };
}

// ------------------------------------------------------------ samvat / era
export function samvatInfo(monthIdx: number, ceYear: number): { vikram: number; shaka: number; vir: number; samvatsara: string } {
  // VS = CE + 57 from Kartak Sud 1 → Dec 31 ; CE + 56 otherwise (months Maha..Aaso fall in Jan–Oct)
  const vikram = monthIdx <= 2 ? ceYear + 57 : ceYear + 56; // Kartak(0),Magshar(1),Posh(2)
  // Shaka = CE − 78 from Chaitra Sud 1 → Dec 31 ; CE − 79 otherwise
  const shaka = (monthIdx >= 5 && monthIdx <= 11) ? ceYear - 78 : (monthIdx <= 2 ? ceYear - 78 : ceYear - 79);
  const samvatsara = SAMVATSARAS_GU[((vikram + 9) % 60 + 60) % 60 === 0 ? 59 : ((vikram + 9) % 60) - 1];
  return { vikram, shaka, vir: vikram + 470, samvatsara };
}

// ------------------------------------------------------------ ritu / ayana (tropical sun)
export function rituAyana(jd: number): { ritu: number; ayanaGu: string } {
  const jde = jdeFromJd(jd);
  const tropLon = (siderealSun(jde) + lahiriAyanamsa(jde)) % 360; // tropical longitude of Sun
  const ritu = Math.floor(((tropLon - 270 + 360) % 360) / 60) % 6; // 0=Shishir(270-330) … (§5.8)
  const ayanaGu = (tropLon >= 270 || tropLon < 90) ? 'ઉત્તરાયણ' : 'દક્ષિણાયન';
  return { ritu, ayanaGu };
}

// ------------------------------------------------------------ day panchang
export interface KaranSpan { name: string; endJd: number }
export interface DayPanchang {
  y: number; m: number; d: number;
  weekday: number;
  sunriseJd: number; sunsetJd: number; nextSunriseJd: number;
  paksha: 'sud' | 'vad';
  tithi: number;          // 1..15 within paksha, 30 = Amas (vad 15)
  tithiFull: number;      // 1..30
  tithiName: { gu: string; formal: string; en: string };
  tithiEndJd: number;
  nakshatra: number;      // 1..27
  nakshatraEndJd: number;
  yoga: number;           // 1..27
  yogaEndJd: number;
  karanas: KaranSpan[];   // karans during this hindu day
  moonRashi: number;      // 1..12 at sunrise
  moonRashiEndJd: number | null;
  sunRashi: number;
  sunNakshatra: number;
  vikram: number; shaka: number; vir: number; samvatsara: string;
  monthIdx: number; monthAdhik: boolean;
  ritu: number; ayanaGu: string;
  tithiVriddhi: boolean; tithiKshaya: boolean;
}

export function tithiDisplay(tithiFull: number) {
  if (tithiFull === 30) return { n: 30, name: AMAS, paksha: 'vad' as const };
  const paksha = tithiFull <= 15 ? 'sud' as const : 'vad' as const;
  const n = tithiFull <= 15 ? tithiFull : tithiFull - 15;
  return { n, name: TITHI_GU[n - 1], paksha };
}

export function dayPanchang(y: number, m: number, d: number, lat = RAJKOT.lat, lon = RAJKOT.lon, lmHint?: { month: LunarMonth; tithi: number }): DayPanchang {
  const [sr, ss] = sunriseSunsetJd(y, m, d, lat, lon);
  const nd = new Date(Date.UTC(y, m - 1, d + 1));
  const [sr2] = sunriseSunsetJd(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate(), lat, lon);
  const jde = jdeFromJd(sr);
  const tFull = tithiNumber(jde);
  const td = tithiDisplay(tFull);
  const kEnd = limbEnd(karanaNumber, sr);
  const karanas: KaranSpan[] = [{ name: karanaName(karanaNumber(jde)), endJd: kEnd }];
  if (kEnd < sr2 - 1 / 1440) {
    karanas.push({ name: karanaName(karanaNumber(jdeFromJd(kEnd + 1 / 2880))), endJd: limbEnd(karanaNumber, kEnd + 1 / 2880) });
  }
  const mrEnd = limbEnd(moonRashi, sr);
  const lm = lmHint ?? lunarMonthOf(y, m, d, lat, lon);
  const sv = samvatInfo(lm.month.index, y);
  const { ritu, ayanaGu } = rituAyana(sr);
  // vriddhi/kshaya: compare with previous day's sunrise tithi
  const pd = new Date(Date.UTC(y, m - 1, d - 1));
  const [psr] = sunriseSunsetJd(pd.getUTCFullYear(), pd.getUTCMonth() + 1, pd.getUTCDate(), lat, lon);
  const pt = tithiNumber(jdeFromJd(psr));
  const tithiVriddhi = pt === tFull;
  const tithiKshaya = ((tFull - pt + 30) % 30) === 2;

  return {
    y, m, d,
    weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
    sunriseJd: sr, sunsetJd: ss, nextSunriseJd: sr2,
    paksha: td.paksha, tithi: td.n, tithiFull: tFull,
    tithiName: td.name, tithiEndJd: limbEnd(tithiNumber, sr),
    nakshatra: nakshatraNumber(jde), nakshatraEndJd: limbEnd(nakshatraNumber, sr),
    yoga: yogaNumber(jde), yogaEndJd: limbEnd(yogaNumber, sr),
    karanas,
    moonRashi: moonRashi(jde), moonRashiEndJd: mrEnd < sr2 ? mrEnd : null,
    sunRashi: sunRashi(jde), sunNakshatra: Math.floor(siderealSun(jde) / (360 / 27)) + 1,
    vikram: sv.vikram, shaka: sv.shaka, vir: sv.vir, samvatsara: sv.samvatsara,
    monthIdx: lm.month.index, monthAdhik: lm.month.adhik,
    ritu, ayanaGu, tithiVriddhi, tithiKshaya,
  };
}

// ------------------------------------------------------------ choghadiya / hora / windows
export interface Slot { nameIdx: number; startJd: number; endJd: number; good: boolean }
export function choghadiya(sunriseJd: number, sunsetJd: number, nextSunriseJd: number): { day: Slot[]; night: Slot[] } {
  const wd = weekdayOfJd(sunriseJd);
  const sDay = (3 * wd) % 7;
  const mk = (t0: number, t1: number, s0: number, inc: number): Slot[] => {
    const step = (t1 - t0) / 8;
    const arr: Slot[] = [];
    for (let i = 0; i < 8; i++) {
      const idx = (s0 + inc * i) % 7;
      arr.push({ nameIdx: idx, startJd: t0 + step * i, endJd: t0 + step * (i + 1), good: CHOGHADIYA[idx].good });
    }
    return arr;
  };
  return { day: mk(sunriseJd, sunsetJd, sDay, 1), night: mk(sunsetJd, nextSunriseJd, sDay + 5, 5) };
}

export interface HoraSlot { lord: string; startJd: number; endJd: number; good: boolean }
export function horas(sunriseJd: number, sunsetJd: number, nextSunriseJd: number): HoraSlot[] {
  const wd = weekdayOfJd(sunriseJd);
  const first = HORA_ORDER.indexOf(WEEKDAY_LORD[wd]);
  const res: HoraSlot[] = [];
  for (let n = 0; n < 24; n++) {
    let t0: number, t1: number;
    if (n < 12) { t0 = sunriseJd + (sunsetJd - sunriseJd) / 12 * n; t1 = sunriseJd + (sunsetJd - sunriseJd) / 12 * (n + 1); }
    else { const k = n - 12; t0 = sunsetJd + (nextSunriseJd - sunsetJd) / 12 * k; t1 = sunsetJd + (nextSunriseJd - sunsetJd) / 12 * (k + 1); }
    res.push({ lord: HORA_ORDER[(first + n) % 7], startJd: t0, endJd: t1, good: ['Moon', 'Mercury', 'Jupiter', 'Venus'].includes(HORA_ORDER[(first + n) % 7]) });
  }
  return res;
}

const RAHU_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];
export function eighthPartWindows(sunriseJd: number, sunsetJd: number) {
  const wd = weekdayOfJd(sunriseJd);
  const step = (sunsetJd - sunriseJd) / 8;
  const w = (p: number): [number, number] => [sunriseJd + step * (p - 1), sunriseJd + step * p];
  return { rahukaal: w(RAHU_PART[wd]), yamaganda: w(YAMA_PART[wd]), gulika: w(GULIKA_PART[wd]) };
}

export function abhijitMuhurta(sunriseJd: number, sunsetJd: number): [number, number] {
  const step = (sunsetJd - sunriseJd) / 15;
  return [sunriseJd + step * 7, sunriseJd + step * 8];
}
export function brahmaMuhurta(sunriseJd: number): [number, number] {
  // 2 muhurtas before sunrise → 1 muhurta before (1 muhurta = 48 min)
  return [sunriseJd - 96 / 1440, sunriseJd - 48 / 1440];
}
export function sandhyaWindows(sunriseJd: number, sunsetJd: number, nextSunriseJd: number, prevSunsetJd: number) {
  const nightLen = nextSunriseJd - sunsetJd;
  const prevNight = sunriseJd - prevSunsetJd;
  return {
    morning: [sunriseJd - prevNight / 10, sunriseJd] as [number, number],
    evening: [sunsetJd, sunsetJd + nightLen / 10] as [number, number],
  };
}
export function pradoshWindow(sunsetJd: number): [number, number] {
  return [sunsetJd, sunsetJd + (2 * 60 + 24) / 1440];
}
export function nishita(sunsetJd: number, nextSunriseJd: number): number {
  return sunsetJd + (nextSunriseJd - sunsetJd) / 2;
}

// ------------------------------------------------------------ special flags for a day
export interface DayFlags {
  panchak: boolean; vinchhudo: boolean;
  panchakStart: number | null; panchakEnd: number | null;
  vinchhudoStart: number | null; vinchhudoEnd: number | null;
  bhadra: [number, number][];
  raviYoga: boolean; amritSiddhi: boolean; siddhiYoga: boolean;
  dagdha: boolean; kankach: boolean;
  vyatipat: boolean; vaidhriti: boolean;
  dishashool: { gu: string; en: string } | null;
  moonDir: string;
}

export function dayFlags(p: DayPanchang): DayFlags {
  const { sunriseJd: sr, sunsetJd: ss, nextSunriseJd: sr2 } = p;
  const mr = p.moonRashi;
  const panchakNow = mr >= 11; // Kumbh(11), Meen(12)
  const vinchhudoNow = mr === 8;
  // find panchak/vinchhudo boundaries near the day
  const f = (jd: number) => siderealMoon(jdeFromJd(jd));
  const panchakStart = panchakNow ? prevCrossing(f, 300, sr, 6, 2) : nextCrossing(f, 300, sr, 8, 2);
  const panchakEnd = panchakStart ? nextCrossing(f, 0, panchakStart, 8, 2) : null;
  const vinchhudoStart = vinchhudoNow ? prevCrossing(f, 210, sr, 4, 2) : nextCrossing(f, 210, sr, 8, 2);
  const vinchhudoEnd = vinchhudoStart ? nextCrossing(f, 240, vinchhudoStart, 5, 2) : null;
  // Bhadra (Vishti karan) windows overlapping the hindu day
  const bhadra: [number, number][] = [];
  for (const k of p.karanas) {
    if (k.name === 'Vishti') {
      const startOf = limbEnd(karanaNumber, sr - 1); // fallback
      void startOf;
      const ks = kStartBefore(k.endJd);
      bhadra.push([Math.max(ks, sr), Math.min(k.endJd, sr2)]);
    }
  }
  const wd = p.weekday;
  const nak = p.nakshatra;
  const sunNak = p.sunNakshatra;
  const raviCount = ((nak - sunNak) % 27 + 27) % 27 + 1;
  const raviYoga = [4, 6, 9, 10, 13, 20].includes(raviCount);
  const amritSiddhi = AMRIT_SIDDHI_NAK[wd] === nak;
  const siddhiYoga = SIDDHI_NAK[wd] === nak;
  const dagdha = DAGDHA_TITHI[wd] === p.tithi;
  const kankach = KANKACH_TITHI[wd] === p.tithi;
  const vyatipat = p.yoga === 17;
  const vaidhriti = p.yoga === 27;
  const moonDir = RASHIS[mr - 1].dir;
  void ss;
  return {
    panchak: panchakNow, vinchhudo: vinchhudoNow,
    panchakStart, panchakEnd, vinchhudoStart, vinchhudoEnd,
    bhadra, raviYoga, amritSiddhi, siddhiYoga, dagdha, kankach, vyatipat, vaidhriti,
    dishashool: DISHA_SHOOL[wd].dir, moonDir,
  };
}

/** Start instant of the karan that ends at endJd (search back up to ~1 day). */
function kStartBefore(endJd: number): number {
  let t = endJd - 1 / 48;
  let guard = 0;
  const cur = karanaNumber(jdeFromJd(endJd - 1 / 2880));
  while (karanaNumber(jdeFromJd(t)) === cur) { t -= 1 / 48; if (++guard > 100) break; }
  return t + 1 / 48;
}

// ------------------------------------------------------------ sankrantis
export interface Sankranti { rashiIdx: number; jd: number }
export function sankrantisBetween(jdFrom: number, jdTo: number): Sankranti[] {
  const out: Sankranti[] = [];
  const f = (jd: number) => siderealSun(jdeFromJd(jd));
  let t = jdFrom;
  while (t < jdTo) {
    const rNow = Math.floor(f(t) / 30);
    const target = ((rNow + 1) % 12) * 30;
    const c = findCrossing(f, target, t, t + 32);
    if (!c) break;
    if (c <= jdTo) out.push({ rashiIdx: (rNow + 1) % 12, jd: c });
    t = c + 25;
  }
  return out;
}

/** Rahu ingress list for a range (mean node, retrograde ~19.3°/yr). */
export function rahuIngresses(jdFrom: number, jdTo: number): Sankranti[] {
  const out: Sankranti[] = [];
  const f = (jd: number) => siderealRahu(jdeFromJd(jd)); // decreasing
  let t = jdFrom;
  while (t < jdTo) {
    const rNow = Math.floor(f(t) / 30);
    const target = rNow * 30; // crossing downward into previous sign
    const g = (jd: number) => 360 - f(jd); // make increasing
    const c = findCrossing(g, 360 - target, t, t + 650);
    if (!c) break;
    if (c <= jdTo) out.push({ rashiIdx: (rNow + 11) % 12, jd: c });
    t = c + 400;
  }
  return out;
}
