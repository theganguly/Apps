/**
 * muhurta.ts — auspicious-window finder.
 *
 * For every Hindu day (sunrise → next sunrise) the rising sign is tracked; windows whose
 * lagna is benefic AND whose tithi / nakshatra / yoga / weekday pass the shuddhi rules
 * already present in data.ts become "lagna" muhurtas. On top of those the day-level
 * Abhijit, Amrit-siddhi, Siddhi, Ravi-yoga and Khat (foundation) muhurtas are emitted.
 *
 * Windows that overlap Bhadra are dropped entirely; windows that overlap Rahu Kaal, or fall
 * in Panchak / Vinchhudo, are downgraded to quality 'ok'.
 */
import {
  jdeFromJd, tithiNumber, nakshatraNumber, yogaNumber, moonRashi, karanaNumber, ascendantSidereal, jdToLocal, IST_HOURS,
} from './astro';
import {
  dayPanchang, dayFlags, abhijitMuhurta, eighthPartWindows, lunarMonthsBetween, lunarMonthOfFromMonths,
  type DayPanchang, type DayFlags,
} from './core';
import { julianDay } from './astro';
import {
  SHUBH_NAKSHATRAS, AMRIT_SIDDHI_NAK, SIDDHI_NAK, DAGDHA_TITHI, KANKACH_TITHI, AVAKAHADA, NAKSHATRAS, RASHIS, MONTHS_GU, TITHI_GU, WEEKDAYS,
} from './data';
import { samvatSpan, addDays, daysBetween, type YMD, type YearRange } from './samvat';

export type MuhurtaKind = 'lagna' | 'khat' | 'abhijit' | 'amrit' | 'siddhi' | 'ravi';
export type MuhurtaQuality = 'best' | 'good' | 'ok';

/** Benefic lagnas (1-based rashi numbers): Vrushabh, Mithun, Kark, Simha, Tula, Dhan, Meen. Edit to taste. */
export const BENEFIC_LAGNAS: number[] = [2, 3, 4, 5, 7, 9, 12];
/** Stable benefic signs, preferred for foundation work: Vrushabh, Simha. */
const STABLE_BENEFIC = [2, 5];
/** Nakshatras traditionally used for Khat / Griharambha. */
export const KHAT_NAKSHATRAS = new Set([4, 5, 8, 12, 13, 14, 17, 21, 22, 23, 24, 26, 27]);
const KHAT_TITHIS = new Set([2, 3, 5, 6, 7, 10, 11, 12, 13, 15]);
const KHAT_WEEKDAYS = new Set([1, 3, 4, 5]);
const RIKTA = new Set([4, 9, 14]);
export const KHAT_MINUTES = 24;

export interface LagnaMuhurta {
  id: string;
  jd: number;               // start
  endJd: number;
  lagnaRashi: number;       // 1..12 rising at the start
  kind: MuhurtaKind;
  labelGu: string; labelEn: string;
  quality: MuhurtaQuality;
  tithiEndJd?: number;      // end of the tithi running at the start of the window
  // context
  date: YMD; weekday: number; monthIdx: number; adhik: boolean;
  tithi: number;            // 1..30 at window start
  nakshatra: number;        // 1..27 at window start
  syllables: string[];      // name initials for the nakshatra (AVAKAHADA)
  reasons: Array<{ gu: string; en: string }>;
  caution: Array<{ gu: string; en: string }>;
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => Math.max(a0, b0) < Math.min(a1, b1) - 1e-9;
const minuteId = (jd: number) => Math.round(jd * 1440);
const rn = (r: number) => ({ gu: RASHIS[r - 1].gu, en: RASHIS[r - 1].en.split(' (')[0] });

interface LagnaWin { startJd: number; endJd: number; rashi: number }
/** Split [t0, t1] into rising-sign windows (5-minute scan + bisection). */
export function lagnaWindows(t0: number, t1: number, lat: number, lon: number): LagnaWin[] {
  const rashiAt = (jd: number) => Math.floor(ascendantSidereal(jd, lat, lon) / 30) + 1;
  const step = 5 / 1440;
  const out: LagnaWin[] = [];
  let cur = rashiAt(t0), start = t0;
  for (let t = t0 + step; t < t1 + step; t += step) {
    const tt = Math.min(t, t1);
    const r = rashiAt(tt);
    if (r !== cur) {
      let lo = tt - step, hi = tt;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (rashiAt(mid) === cur) lo = mid; else hi = mid; }
      out.push({ startJd: start, endJd: hi, rashi: cur });
      start = hi; cur = r;
    }
    if (tt >= t1) break;
  }
  out.push({ startJd: start, endJd: t1, rashi: cur });
  return out;
}

interface MomentState {
  tithi: number; tithiInPaksha: number; nak: number; yoga: number; moonSign: number; vishti: boolean;
}
function stateAt(jd: number): MomentState {
  const jde = jdeFromJd(jd);
  const t = tithiNumber(jde);
  return {
    tithi: t, tithiInPaksha: t === 30 ? 30 : (t > 15 ? t - 15 : t), nak: nakshatraNumber(jde), yoga: yogaNumber(jde),
    moonSign: moonRashi(jde), vishti: karanaNumber(jde) >= 2 && karanaNumber(jde) <= 57 && ((karanaNumber(jde) - 2) % 7) === 6,
  };
}

/** Tithi-end helper: when the tithi running at `jd` ends (≤ 30 h ahead). */
function tithiEndAfter(jd: number): number {
  const t0 = tithiNumber(jdeFromJd(jd));
  let lo = jd, hi = jd + 1.2;
  if (tithiNumber(jdeFromJd(hi)) === t0) hi = jd + 1.6;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (tithiNumber(jdeFromJd(mid)) === t0) lo = mid; else hi = mid; }
  return hi;
}

interface Verdict { ok: boolean; reasons: Array<{ gu: string; en: string }>; caution: Array<{ gu: string; en: string }>; demote: boolean }
/** Panchang shuddhi at a moment for a Hindu day with weekday `wd`. */
function shuddhi(st: MomentState, wd: number): Verdict {
  const reasons: Array<{ gu: string; en: string }> = [];
  const caution: Array<{ gu: string; en: string }> = [];
  let ok = true, demote = false;
  const nk = NAKSHATRAS[st.nak - 1];
  if (SHUBH_NAKSHATRAS.has(st.nak)) reasons.push({ gu: `નક્ષત્ર ${nk.gu} શુભ ૧૬ નક્ષત્રોમાંનું એક છે.`, en: `Nakshatra ${nk.en} is one of the 16 auspicious nakshatras.` });
  else { ok = false; }
  const tn = st.tithiInPaksha, tName = tn === 30 ? { gu: 'અમાસ', en: 'Amavasya' } : TITHI_GU[tn - 1];
  if (tn === 30 || RIKTA.has(tn)) ok = false;
  else reasons.push({ gu: `તિથિ ${tName.gu} રિક્તા કે અમાસ નથી.`, en: `Tithi ${tName.en} is neither Rikta nor Amavasya.` });
  if (DAGDHA_TITHI[wd] === tn) ok = false; else if (KANKACH_TITHI[wd] === tn) ok = false;
  else reasons.push({ gu: `${WEEKDAYS[wd].gu} સાથે દગ્ધ/કંકાચ તિથિનો દોષ નથી.`, en: `No Dagdha/Kankach tithi clash with ${WEEKDAYS[wd].en}.` });
  if (st.yoga === 17 || st.yoga === 27) ok = false; else reasons.push({ gu: 'વ્યતિપાત/વૈધૃતિ યોગ નથી.', en: 'Not Vyatipat/Vaidhriti yoga.' });
  if (st.moonSign >= 11) { demote = true; caution.push({ gu: 'ચંદ્ર કુંભ/મીનમાં — પંચક ચાલે છે.', en: 'Moon in Kumbh/Meen — Panchak is running.' }); }
  if (st.moonSign === 8) { demote = true; caution.push({ gu: 'ચંદ્ર વૃશ્ચિકમાં — વિછુડો ચાલે છે.', en: 'Moon in Vrushchik — Vinchhudo is running.' }); }
  return { ok, reasons, caution, demote };
}

export interface PlaceLL { lat: number; lon: number }

/** Shuddhi must hold at the start, middle and end of a window, so whatever the UI shows (start values) is valid. */
function shuddhiSpan(a: number, b: number, wd: number): Verdict {
  const mid = shuddhi(stateAt((a + b) / 2), wd);
  if (!mid.ok) return mid;
  const edges = [shuddhi(stateAt(a + 1e-6), wd), shuddhi(stateAt(b - 1e-6), wd)];
  if (edges.some((e) => !e.ok)) return { ...mid, ok: false };
  const caution = [...mid.caution];
  for (const e of edges) for (const c of e.caution) if (!caution.some((x) => x.en === c.en)) caution.push(c);
  return { ...mid, caution, demote: mid.demote || edges.some((e) => e.demote) };
}

/** All muhurtas of one civil date. `p`/`flags` may be passed in to avoid recomputation. */
export function muhurtasForDay(y: number, m: number, d: number, place: PlaceLL, pIn?: DayPanchang, flIn?: DayFlags): LagnaMuhurta[] {
  const p = pIn ?? dayPanchang(y, m, d, place.lat, place.lon);
  const flags = flIn ?? dayFlags(p);
  const sr = p.sunriseJd, ss = p.sunsetJd, sr2 = p.nextSunriseJd;
  const { rahukaal, yamaganda, gulika } = eighthPartWindows(sr, ss);
  const [ab0, ab1] = abhijitMuhurta(sr, ss);
  const wd = p.weekday;
  const date: YMD = { y, m, d };
  const ctx = (jd: number) => {
    const st = stateAt(jd);
    return { st, syll: AVAKAHADA[st.nak - 1].syllables as unknown as string[], tithiEnd: tithiEndAfter(jd) };
  };
  const mkId = (kind: MuhurtaKind, jd: number) => `${kind}:${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}:${minuteId(jd)}`;
  const base = (kind: MuhurtaKind, jd: number, endJd: number, rashi: number, label: { gu: string; en: string }, quality: MuhurtaQuality,
    reasons: LagnaMuhurta['reasons'], caution: LagnaMuhurta['caution']): LagnaMuhurta => {
    const c = ctx(jd);
    return {
      id: mkId(kind, jd), jd, endJd, lagnaRashi: rashi, kind, labelGu: label.gu, labelEn: label.en, quality,
      tithiEndJd: c.tithiEnd, date, weekday: wd, monthIdx: p.monthIdx, adhik: p.monthAdhik,
      tithi: c.st.tithi, nakshatra: c.st.nak, syllables: c.syll, reasons, caution,
    };
  };
  const out: LagnaMuhurta[] = [];
  const wins = lagnaWindows(sr, sr2, place.lat, place.lon);
  const bhadraHit = (a: number, b: number) => flags.bhadra.some(([x, z]) => overlaps(a, b, x, z));
  const rashiAtStart = (jd: number) => wins.find((w) => jd >= w.startJd - 1e-9 && jd < w.endJd + 1e-9)?.rashi ?? wins[0].rashi;

  // ---- lagna windows
  for (const w of wins) {
    if (!BENEFIC_LAGNAS.includes(w.rashi)) continue;
    const a = Math.max(w.startJd, sr), b = Math.min(w.endJd, sr2);
    if ((b - a) * 1440 < 10) continue;
    if (bhadraHit(a, b)) continue;
    const v = shuddhiSpan(a, b, wd);
    if (!v.ok) continue;
    const reasons = [{ gu: `લગ્ન ${rn(w.rashi).gu} શુભ લગ્નોમાંનું એક છે.`, en: `Lagna ${rn(w.rashi).en} is one of the benefic lagnas.` }, ...v.reasons];
    const caution = [...v.caution];
    const inRahu = overlaps(a, b, rahukaal[0], rahukaal[1]);
    if (inRahu) caution.push({ gu: 'આ સમય રાહુકાળ સાથે ટકરાય છે.', en: 'Overlaps Rahu Kaal.' });
    const dayYoga = flags.amritSiddhi || flags.siddhiYoga || flags.raviYoga;
    const inAbhijit = overlaps(a, b, ab0, ab1);
    let q: MuhurtaQuality = 'good';
    if ((dayYoga || inAbhijit) && !inRahu && !v.demote) q = 'best';
    if (inRahu || v.demote) q = 'ok';
    if (dayYoga) reasons.push({ gu: `દિવસે ${[flags.amritSiddhi && 'અમૃત સિદ્ધિ', flags.siddhiYoga && 'સિદ્ધિ', flags.raviYoga && 'રવિ'].filter(Boolean).join('/')} યોગ છે.`, en: `The day carries ${[flags.amritSiddhi && 'Amrit-siddhi', flags.siddhiYoga && 'Siddhi', flags.raviYoga && 'Ravi'].filter(Boolean).join('/')} yoga.` });
    if (inAbhijit) reasons.push({ gu: 'અભિજિત મુહૂર્ત સાથે મળે છે.', en: 'Coincides with Abhijit Muhurta.' });
    out.push(base('lagna', a, b, w.rashi, { gu: `${rn(w.rashi).gu} લગ્ન`, en: `${rn(w.rashi).en} lagna` }, q, reasons, caution));
  }

  // ---- Abhijit
  if (wd !== 3 && !bhadraHit(ab0, ab1)) {
    const v = shuddhiSpan(ab0, ab1, wd);
    if (v.ok) {
      const caution = [...v.caution];
      out.push(base('abhijit', ab0, ab1, rashiAtStart(ab0), { gu: 'અભિજિત મુહૂર્ત', en: 'Abhijit Muhurta' }, v.demote ? 'ok' : 'best',
        [{ gu: 'દિવસના ૧૫ મુહૂર્તમાંનું ૮મું (મધ્યાહ્ન) — દોષનાશક.', en: 'The 8th of the day’s 15 muhurtas (midday) — neutralises doshas.' }, ...v.reasons], caution));
    }
  }

  // ---- day-level weekday–nakshatra / Ravi yogas (valid while the sunrise nakshatra lasts)
  const yEnd = Math.min(p.nakshatraEndJd, sr2);
  const yogaDay = (kind: MuhurtaKind, on: boolean, label: { gu: string; en: string }, q: MuhurtaQuality, why: { gu: string; en: string }) => {
    if (!on) return;
    const demote = flags.vyatipat || flags.vaidhriti || flags.panchak || flags.vinchhudo;
    const caution: LagnaMuhurta['caution'] = [];
    if (flags.vyatipat || flags.vaidhriti) caution.push({ gu: 'સવારે વ્યતિપાત/વૈધૃતિ યોગ ચાલે છે.', en: 'Vyatipat/Vaidhriti yoga runs at sunrise.' });
    if (flags.panchak) caution.push({ gu: 'ચંદ્ર કુંભ/મીનમાં — પંચક.', en: 'Moon in Kumbh/Meen — Panchak.' });
    if (flags.vinchhudo) caution.push({ gu: 'ચંદ્ર વૃશ્ચિકમાં — વિછુડો.', en: 'Moon in Vrushchik — Vinchhudo.' });
    out.push(base(kind, sr, yEnd, rashiAtStart(sr), label, demote ? 'ok' : q, [why], caution));
  };
  const nk = NAKSHATRAS[p.nakshatra - 1];
  yogaDay('amrit', flags.amritSiddhi, { gu: 'અમૃત સિદ્ધિ યોગ', en: 'Amrit-siddhi yoga' }, 'best',
    { gu: `${WEEKDAYS[wd].gu} + ${nk.gu} નક્ષત્ર = અમૃત સિદ્ધિ યોગ (${NAKSHATRAS[AMRIT_SIDDHI_NAK[wd] - 1].gu}).`, en: `${WEEKDAYS[wd].en} + ${nk.en} nakshatra = Amrit-siddhi yoga.` });
  yogaDay('siddhi', flags.siddhiYoga, { gu: 'સિદ્ધિ યોગ', en: 'Siddhi yoga' }, 'good',
    { gu: `${WEEKDAYS[wd].gu} + ${nk.gu} નક્ષત્ર = સિદ્ધિ યોગ (${NAKSHATRAS[SIDDHI_NAK[wd] - 1].gu}).`, en: `${WEEKDAYS[wd].en} + ${nk.en} nakshatra = Siddhi yoga.` });
  yogaDay('ravi', flags.raviYoga, { gu: 'રવિયોગ', en: 'Ravi yoga' }, 'good',
    { gu: `${nk.gu} સૂર્ય નક્ષત્રથી ૪/૬/૯/૧૦/૧૩/૨૦મું છે.`, en: `${nk.en} is the 4th/6th/9th/10th/13th/20th from the Sun’s nakshatra.` });

  // ---- Khat (foundation) — a 24-minute ghati inside the best clean daytime benefic lagna
  {
    const mid = (sr + ss) / 2;
    const st = stateAt(mid);
    const tn = st.tithiInPaksha;
    const dayOk = KHAT_WEEKDAYS.has(wd) && KHAT_NAKSHATRAS.has(st.nak) && KHAT_TITHIS.has(tn)
      && DAGDHA_TITHI[wd] !== tn && KANKACH_TITHI[wd] !== tn && st.yoga !== 17 && st.yoga !== 27 && st.moonSign < 11 && st.moonSign !== 8;
    if (dayOk) {
      let best: { a: number; b: number; r: number } | null = null;
      for (const w of wins) {
        if (!BENEFIC_LAGNAS.includes(w.rashi)) continue;
        let a = Math.max(w.startJd, sr), b = Math.min(w.endJd, ss);
        if ((b - a) * 1440 < KHAT_MINUTES + 6) continue;
        if (overlaps(a, b, rahukaal[0], rahukaal[1]) || overlaps(a, b, yamaganda[0], yamaganda[1]) || overlaps(a, b, gulika[0], gulika[1]) || bhadraHit(a, b)) {
          // trim away the bad parts by clipping to the largest clean gap
          const bad = [rahukaal, yamaganda, gulika, ...flags.bhadra].sort((x, y) => x[0] - y[0]);
          let cur = a, bestGap: [number, number] = [0, 0];
          for (const [x, z] of bad) { if (z <= cur || x >= b) continue; if (x - cur > bestGap[1] - bestGap[0]) bestGap = [cur, x]; cur = Math.max(cur, z); }
          if (b - cur > bestGap[1] - bestGap[0]) bestGap = [cur, b];
          [a, b] = bestGap;
          if ((b - a) * 1440 < KHAT_MINUTES + 6) continue;
        }
        const len = b - a;
        if (!best || len > best.b - best.a) best = { a, b, r: w.rashi };
      }
      if (best) {
        const c0 = (best.a + best.b) / 2 - (KHAT_MINUTES / 2) / 1440;
        const nk2 = NAKSHATRAS[st.nak - 1];
        const q: MuhurtaQuality = STABLE_BENEFIC.includes(best.r) ? 'best' : 'good';
        out.push(base('khat', c0, c0 + KHAT_MINUTES / 1440, best.r, { gu: `ખાત મુહૂર્ત (${rn(best.r).gu} લગ્ન)`, en: `Khat Muhurta (${rn(best.r).en} lagna)` }, q, [
          { gu: `${WEEKDAYS[wd].gu} ખાતમુહૂર્ત માટે અનુકૂળ વાર છે.`, en: `${WEEKDAYS[wd].en} is a favourable weekday for ground-breaking.` },
          { gu: `નક્ષત્ર ${nk2.gu} સ્થિર/મૃદુ/ક્ષિપ્ર ગણનું છે.`, en: `Nakshatra ${nk2.en} is of the fixed/soft/swift group.` },
          { gu: 'તિથિ રિક્તા, અષ્ટમી, પ્રતિપદા, અમાસ નથી; દગ્ધ/કંકાચ/વ્યતિપાત/વૈધૃતિ નથી.', en: 'Tithi is not Rikta, Ashtami, Pratipada or Amavasya; no Dagdha/Kankach/Vyatipat/Vaidhriti.' },
          { gu: 'પંચક-વિછુડો નથી; રાહુકાળ, યમગંડ, ગુલિક અને ભદ્રાથી મુક્ત ૨૪ મિનિટ (૧ ઘડી).', en: 'No Panchak/Vinchhudo; a 24-minute (1 ghati) window free of Rahu Kaal, Yamaganda, Gulika and Bhadra.' },
          ...(q === 'best' ? [{ gu: `${rn(best.r).gu} સ્થિર શુભ લગ્ન — પાયા માટે ઉત્તમ.`, en: `${rn(best.r).en} is a fixed benefic lagna — ideal for foundations.` }] : []),
        ], []));
      }
    }
  }
  return out.sort((a, b) => a.jd - b.jd);
}

// ------------------------------------------------------------------ ranges
function monthsFor(y: number, m: number, place: PlaceLL) {
  return lunarMonthsBetween(julianDay(y, m - 1, 1), julianDay(y, m + 1, 1), place.lat, place.lon);
}

/** Muhurtas for a Gregorian month; optionally restricted to one Gujarati lunar month index (0 = Kartak … 11 = Aaso). */
export function lagnaMuhurtasForMonth(y: number, m: number, place: PlaceLL, samvatMonthIdx?: number): LagnaMuhurta[] {
  const months = monthsFor(y, m, place);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: LagnaMuhurta[] = [];
  for (let d = 1; d <= dim; d++) {
    const lm = lunarMonthOfFromMonths(y, m, d, months, place.lat, place.lon);
    if (samvatMonthIdx !== undefined && lm.month.index !== samvatMonthIdx) continue;
    const p = dayPanchang(y, m, d, place.lat, place.lon, lm);
    out.push(...muhurtasForDay(y, m, d, place, p, dayFlags(p)));
  }
  return out;
}

/** Muhurtas for a whole Vikram samvatsar. */
export function lagnaMuhurtasForSamvat(vikramYear: number, place: PlaceLL, range?: YearRange): LagnaMuhurta[] {
  const r = range ?? samvatSpan(vikramYear, place.lat, place.lon);
  const n = daysBetween(r.start, r.end);
  const out: LagnaMuhurta[] = [];
  for (let i = 0; i <= n; i++) {
    const ymd = addDays(r.start, i);
    const lm = lunarMonthOfFromMonths(ymd.y, ymd.m, ymd.d, r.months, place.lat, place.lon);
    const p = dayPanchang(ymd.y, ymd.m, ymd.d, place.lat, place.lon, lm);
    out.push(...muhurtasForDay(ymd.y, ymd.m, ymd.d, place, p, dayFlags(p)));
  }
  return out;
}

export const QUALITY_ORDER: Record<MuhurtaQuality, number> = { best: 0, good: 1, ok: 2 };
export const monthName = (idx: number) => MONTHS_GU[idx];
export { jdToLocal, IST_HOURS };
