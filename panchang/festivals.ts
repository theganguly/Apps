/**
 * festivals.ts — rule-based festival / vrat engine (README §8).
 * Every festival carries a rule saying at which part of the day its tithi must
 * be present. Nothing is hard-coded to the printed book: dates emerge from the
 * engine; the book's dates are regression tests.
 */
import { jdeFromJd, tithiNumber, jdToLocal, IST_HOURS, julianDay, limbEnd, prevCrossing, elongation, sunriseSunsetJd } from './astro';
import { EKADASHI_NAMES, EKADASHI_EN, RASHIS } from './data';
import type { DayPanchang, Sankranti } from './core';
import { moonriseMoonset } from './planets';

export type FestivalKind = 'major' | 'vrat' | 'jayanti' | 'solar' | 'national' | 'purnima' | 'recurring' | 'eclipse';

export interface Festival {
  gu: string;
  en: string;
  kind: FestivalKind;
  noteGu?: string;
  noteEn?: string;
}

const F = (gu: string, en: string, kind: FestivalKind, noteGu?: string, noteEn?: string): Festival =>
  ({ gu, en, kind, noteGu, noteEn });

// ------------------------------------------------------------ udaya-tithi rule table
// key: `${monthIdx}-${paksha}-${tithi}`  (monthIdx 0=Kartak … 11=Aaso; tithi 1..15)
const UDAYA: Record<string, Festival[]> = {
  // Kartak
  '0-sud-1': [F('નૂતન વર્ષ (વિક્રમ સંવત્ આરંભ)', 'Nutan Varsh — New Year', 'major'), F('ચોપડાં પૂજન', 'Chopda Pujan', 'major')],
  '0-sud-2': [F('ભાઈ બીજ (યમ દ્વિતિયા)', 'Bhai Bij (Yama Dwitiya)', 'major')],
  '0-sud-5': [F('લાભ પંચમ (સૌભાગ્ય પંચમી)', 'Labh Pancham', 'major')],
  '0-sud-12': [F('તુલસી વિવાહ', 'Tulsi Vivah', 'major')],
  // Magshar
  // Posh
  // Maha
  // Fagan
  '4-sud-14': [F('હોલિકા દહન', 'Holika Dahan', 'major')],
  '4-sud-15': [F('ધુળેટી · હોળી (હુતાશની પૂનમ)', 'Dhuleti · Holi', 'major')],
  // Chaitra
  '5-sud-1': [F('ગુડી પડવો · ચેતીચંદ · ચૈત્રી નવરાત્રી આરંભ', 'Gudi Padwa · Cheti Chand · Navratri begins', 'major')],
  '5-sud-3': [F('મત્સ્ય જયંતિ', 'Matsya Jayanti', 'jayanti')],
  '5-sud-9': [F('રામ નવમી', 'Ram Navami', 'major'), F('સ્વામિનારાયણ જયંતિ', 'Swaminarayan Jayanti', 'jayanti')],
  '5-sud-13': [F('મહાવીર જન્મ કલ્યાણક', 'Mahavir Janma Kalyanak', 'jayanti')],
  // Vaishakh
  '6-sud-3': [F('અક્ષય તૃતિયા (અખાત્રીજ)', 'Akshaya Tritiya', 'major'), F('પરશુરામ જયંતિ', 'Parashuram Jayanti', 'jayanti')],
  '6-sud-14': [F('નૃસિંહ જયંતિ', 'Narasimha Jayanti', 'jayanti')],
  // Jeth
  '7-sud-10': [F('ગંગા દશેરા', 'Ganga Dashera', 'major')],
  // Ashadh
  '8-sud-2': [F('જગન્નાથ રથયાત્રા', 'Jagannath Rath Yatra', 'major')],
  // Shravan
  '9-sud-6': [F('કલ્કિ જયંતિ', 'Kalki Jayanti', 'jayanti')],
  '9-sud-15': [F('રક્ષાબંધન · બળેવ · નાળિયેરી પૂનમ', 'Raksha Bandhan · Balev', 'major')],
  // Bhadarvo
  '10-sud-3': [F('વરાહ જયંતિ', 'Varaha Jayanti', 'jayanti')],
  '10-sud-4': [F('ગણેશ ચતુર્થી', 'Ganesh Chaturthi', 'major')],
  '10-sud-12': [F('વામન જયંતિ', 'Vamana Jayanti', 'jayanti')],
  '10-vad-30': [F('સર્વ પિતૃ અમાવસ્યા', 'Sarva Pitru Amavasya', 'major')],
  // Aaso
  '11-sud-1': [F('શરદ નવરાત્રી આરંભ (ઘટસ્થાપના)', 'Sharad Navratri begins (Ghatasthapana)', 'major')],
  '11-sud-8': [F('મહાષ્ટમી (અન્નપૂર્ણા)', 'Maha Ashtami', 'major')],
  '11-sud-9': [F('મહાનવમી (આયુધ પૂજા)', 'Maha Navami', 'major')],
  '11-sud-10': [F('વિજયા દશમી (દશેરા)', 'Vijaya Dashami (Dussehra)', 'major')],
};

const PRADOSH_NAMES: Array<{ gu: string; en: string }> = [
  { gu: 'ભાનુ પ્રદોષ', en: 'Bhanu Pradosh' }, { gu: 'સોમ પ્રદોષ', en: 'Som Pradosh' },
  { gu: 'ભૌમ પ્રદોષ', en: 'Bhaum Pradosh' }, { gu: 'સૌમ્ય પ્રદોષ', en: 'Saumya Pradosh' },
  { gu: 'ગુરુ પ્રદોષ', en: 'Guru Pradosh' }, { gu: 'ભૃગુ પ્રદોષ', en: 'Bhrigu Pradosh' },
  { gu: 'શનિ (મંદ) પ્રદોષ', en: 'Shani Pradosh' },
];

const AMASYA_WEEKDAY: Record<number, { gu: string; en: string }> = {
  1: { gu: 'સોમવારી અમાસ', en: 'Somavati Amavasya' },
  2: { gu: 'ભૌમવતી અમાસ', en: 'Bhaumvati Amavasya' },
  6: { gu: 'શનિવારી અમાસ', en: 'Shanishchari Amavasya' },
};

/** Fixed-date (Gregorian) observances. key: `${m}-${d}` */
const FIXED: Record<string, Festival[]> = {
  '1-1': [F('અંગ્રેજી નવું વર્ષ', 'New Year Day', 'national')],
  '1-26': [F('પ્રજાસત્તાક દિન', 'Republic Day', 'national')],
  '4-14': [F('ડૉ. આંબેડકર જયંતિ', 'Ambedkar Jayanti', 'national')],
  '6-21': [F('આંતરરાષ્ટ્રીય યોગા દિવસ', 'International Yoga Day', 'national')],
  '8-15': [F('સ્વતંત્રતા દિન', 'Independence Day', 'national')],
  '9-5': [F('શિક્ષક દિન', "Teachers' Day", 'national')],
  '10-2': [F('ગાંધી જયંતિ', 'Gandhi Jayanti', 'national')],
  '11-14': [F('બાળ દિવસ', "Children's Day", 'national')],
  '12-25': [F('નાતાલ (ખ્રિસ્તમસ)', 'Christmas', 'national')],
};

/** Gregorian Easter (Computus). */
export function easterDates(y: number): { goodFriday: Date; easter: Date } {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const mm = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * mm + 114) / 31), day = ((h + l - 7 * mm + 114) % 31) + 1;
  const easter = new Date(Date.UTC(y, month - 1, day));
  const goodFriday = new Date(easter.getTime() - 2 * 86400000);
  return { goodFriday, easter };
}

export interface FestExtras {
  /** sankrantis precomputed for the surrounding range */
  sankrantis: Sankranti[];
  lat: number; lon: number;
  /** include moonrise note for Sankashti (one ephemeris call, slower) */
  withMoonrise?: boolean;
}

const tithiAt = (jd: number) => tithiNumber(jdeFromJd(jd));

/** Purnima festivals decided by tithi-15 at moonrise (≈ sunset) — README §8.2 "વ્રતની પૂનમ".
 *  (Fagan Holi & Shravan Raksha Bandhan are udaya-ruled and stay in the UDAYA table.) */
const PURNIMA_SUNSET: Record<number, Festival[]> = {
  0: [F('કાર્તિકી પૂનમ · દેવ દિવાળી', 'Kartik Purnima · Dev Diwali', 'major'), F('ગુરુ નાનક જયંતિ', 'Guru Nanak Jayanti', 'jayanti')],
  1: [F('દત્ત જયંતિ (માગશરી પૂનમ)', 'Datta Jayanti', 'major')],
  2: [F('પોષી પૂનમ · માઘ સ્નાન આરંભ', 'Poshi Purnima · Magha snan begins', 'major')],
  3: [F('માઘી પૂનમ', 'Maghi Purnima', 'purnima')],
  5: [F('હનુમાન જયંતિ (ચૈત્રી પૂનમ)', 'Hanuman Jayanti', 'major')],
  6: [F('બુદ્ધ પૂર્ણિમા (વૈશાખી પૂનમ)', 'Buddha Purnima', 'major'), F('કૂર્મ જયંતિ', 'Kurma Jayanti', 'jayanti')],
  7: [F('વટ પૂર્ણિમા (જેઠી પૂનમ)', 'Vat Purnima', 'purnima')],
  8: [F('ગુરુ પૂર્ણિમા (વ્યાસ પૂજા)', 'Guru Purnima', 'major')],
  11: [F('શરદ પૂર્ણિમા', 'Sharad Purnima', 'major')],
};


/** Spec §0.4-6 / §11: Sankashti fallback. When the Chaturthi (tithi 19) contains no moonrise at all (e.g. Oct 2025),
 *  the civil day with the largest overlap of the tithi with [sunrise, that day's moonrise] is chosen.
 *  Returns the moonrise of `p`'s day if `p` is that day, else null. */
function sankashtiFallbackRise(p: DayPanchang, ex: FestExtras): number | null {
  const probes = [p.sunriseJd + 1 / 1440, (p.sunriseJd + p.sunsetJd) / 2, p.nextSunriseJd - 1 / 1440];
  const probe = probes.find((t) => tithiAt(t) === 19);
  if (probe === undefined) return null;
  const a = prevCrossing((jd) => elongation(jdeFromJd(jd)), 216, probe, 3);
  if (a === null) return null;
  const b = limbEnd(tithiNumber, probe);
  const days = [-1, 0, 1].map((k) => { const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + k)); return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), k }; });
  let best = -1, bestOv = 0, bestRise: number | null = null;
  for (const dd of days) {
    const mr = moonriseMoonset(dd.y, dd.m, dd.d, ex.lat, ex.lon).rise;
    const [sr] = sunriseSunsetJd(dd.y, dd.m, dd.d, ex.lat, ex.lon);
    if (mr !== null && mr >= a && mr < b) return null;          // a moonrise lies inside the tithi: the normal rule applies
    if (mr === null) continue;
    const ov = Math.min(b, mr) - Math.max(a, sr);
    if (ov > bestOv + 1e-9) { bestOv = ov; best = dd.k; bestRise = mr; }
  }
  return best === 0 ? bestRise : null;
}

/** Spec §0.4-4: Vaishnava Ekadashi = LAST civil date on which the Ekadashi is present at arunodaya (sunrise − 96 min).
 *  True when `p` is that date and it differs from the Smarta (udaya) date. */
function isVaishnavaOnlyDay(p: DayPanchang): boolean {
  const E = (t: number) => t === 11 || t === 26;
  const arun = tithiAt(p.sunriseJd - 96 / 1440);
  if (!E(arun)) return false;
  if (tithiAt(p.nextSunriseJd - 96 / 1440) === arun) return false;      // not the last such date
  const smartaToday = p.tithiFull === arun && tithiAt(p.sunriseJd - 1 + 1 / 1440) !== arun;
  return !smartaToday;
}

export function festivalsOfDay(p: DayPanchang, ex: FestExtras): Festival[] {
  const out: Festival[] = [];
  // Adhik (extra) month: month-specific festivals belong to the Nij month, so they are suppressed here;
  // Ekadashis become Padmini (Sud) / Parama (Vad); generic vrats (Pradosh, Sankashti, Masik Shivratri,
  // Purnima, Amavasya) carry on.
  const adhik = p.monthAdhik;
  const key = `${p.monthIdx}-${p.paksha}-${p.tithi}`;
  const ud = adhik ? undefined : UDAYA[key];
  const ekName = (side: 0 | 1) => (adhik
    ? { gu: side === 0 ? 'પદ્મિની' : 'પરમ', en: side === 0 ? 'Padmini' : 'Parama' }
    : { gu: EKADASHI_NAMES[p.monthIdx][side], en: EKADASHI_EN[p.monthIdx][side] });
  if (ud) out.push(...ud);

  const tSr2 = tithiAt(p.nextSunriseJd - 1 / 1440);   // tithi just before next sunrise
  const tSs = tithiAt(p.sunsetJd);                     // tithi at sunset
  const tMidday = tithiAt((p.sunriseJd + p.sunsetJd) / 2);
  const tPradosh = tithiAt(p.sunsetJd + (2 * 60 + 24) / 1440); // sunset + 2h24m
  const tNishi = tithiAt(p.sunsetJd + (p.nextSunriseJd - p.sunsetJd) / 2);
  const tMidStart = tithiAt(julianDay(p.y, p.m, p.d) - IST_HOURS / 24); // tithi at 00:00 IST of this date

  // ---- Navratri day numbering
  if (!adhik && p.monthIdx === 11 && p.paksha === 'sud' && p.tithi >= 2 && p.tithi <= 7)
    out.push(F(`નવરાત્રી — દિવસ ${p.tithi}`, `Navratri day ${p.tithi}`, 'recurring'));
  if (!adhik && p.monthIdx === 5 && p.paksha === 'sud' && p.tithi >= 2 && p.tithi <= 8)
    out.push(F(`ચૈત્રી નવરાત્રી — દિવસ ${p.tithi}`, `Chaitra Navratri day ${p.tithi}`, 'recurring'));

  // ---- Shraddha paksha (Bhadarvo vad 1..14)
  if (!adhik && p.monthIdx === 10 && p.paksha === 'vad' && p.tithi <= 14)
    out.push(F(`શ્રાદ્ધ પક્ષ — ${p.tithiName.formal}`, `Shraddha paksha — ${p.tithiName.en}`, 'recurring'));

  // ---- Ekadashi (udaya)
  if (p.tithi === 11) {
    const e = ekName(p.paksha === 'sud' ? 0 : 1);
    out.push(F(`${e.gu} એકાદશી`, `${e.en} Ekadashi`, 'vrat'));
  }
  // Ekadashi kshaya: tithi 11/26 begins after sunrise and ends before next sunrise
  if (p.paksha === 'sud' && p.tithi === 10 && tSr2 >= 12) {
    const e = ekName(0);
    out.push(F(`${e.gu} એકાદશી (સ્માર્ત)`, `${e.en} Ekadashi (Smarta)`, 'vrat', 'તિથિ ક્ષય', 'Tithi kshaya'));
  }
  if (p.paksha === 'vad' && p.tithi === 10 && tSr2 >= 27) {
    const e = ekName(1);
    out.push(F(`${e.gu} એકાદશી (સ્માર્ત)`, `${e.en} Ekadashi (Smarta)`, 'vrat', 'તિથિ ક્ષય', 'Tithi kshaya'));
  }

  // ---- Ekadashi (Vaishnava): last date present at arunodaya, when it differs from the Smarta date
  if (isVaishnavaOnlyDay(p)) {
    const e = ekName(tithiAt(p.sunriseJd - 96 / 1440) === 11 ? 0 : 1);
    out.push(F(`${e.gu} એકાદશી (વૈષ્ણવ)`, `${e.en} Ekadashi (Vaishnava)`, 'vrat', 'અરુણોદય વ્યાપિની', 'Present at arunodaya'));
  }

  // ---- Pradosh: trayodashi at sunset
  if (tSs === 13 || tSs === 28) {
    const nm = PRADOSH_NAMES[p.weekday];
    out.push(F(nm.gu, nm.en, 'vrat'));
  }

  // ---- Masik Shivratri (udaya vad 14; Maha handled by nishita below)
  if (p.paksha === 'vad' && p.tithi === 14 && p.monthIdx !== 3)
    out.push(F('માસિક શિવરાત્રિ', 'Masik Shivratri', 'vrat'));

  // ---- Maha Shivratri: nishita of this night's midnight; Janmashtami: ashtami at
  //      the midnight that opens this civil date (reproduces the book's dates).
  if (!adhik && p.monthIdx === 3 && tNishi === 29) out.push(F('મહા શિવરાત્રિ', 'Maha Shivratri', 'major'));
  if (!adhik && p.monthIdx === 9 && tMidStart === 23) out.push(F('શ્રીકૃષ્ણ જન્માષ્ટમી', 'Shri Krishna Janmashtami', 'major'));

  // ---- Vasant Panchami: panchami at madhyahna (first such day only)
  if (!adhik && p.monthIdx === 3 && p.paksha === 'sud' && tMidday === 5 && tithiAt(p.sunriseJd - 1) !== 5)
    out.push(F('વસંત પંચમી (સરસ્વતી પૂજા)', 'Vasant Panchami', 'major'));

  // ---- Diwali cluster: pradosh rule in Aaso vad
  if (!adhik && p.monthIdx === 11 && p.paksha === 'vad') {
    if (tPradosh === 28) out.push(F('ધનતેરસ · ધનવંતરી જયંતિ', 'Dhanteras · Dhanvantari Jayanti', 'major'));
    if (tPradosh === 29) out.push(F('કાળી ચૌદશ (નરક ચતુર્દશી)', 'Kali Chaudas (Narak Chaturdashi)', 'major'));
    if (tPradosh === 30) out.push(F('દિવાળી · લક્ષ્મી-શારદા પૂજન', 'Diwali · Lakshmi Puja', 'major'));
  }

  // ---- Sankashti Chaturthi: chaturthi (19) present at moonrise.
  //      Moonrise is computed only on candidate days (vad 3/4 near sunset).
  if (p.paksha === 'vad' && (tSs === 18 || tSs === 19 || p.tithi === 4)) {
    const mm = moonriseMoonset(p.y, p.m, p.d, ex.lat, ex.lon);
    if (mm.rise && tithiAt(mm.rise) === 19) {
      const t = jdToLocal(mm.rise, IST_HOURS);
      const pad = (n: number) => String(n).padStart(2, '0');
      const tm = `${pad(t.hour)}:${pad(t.minute)}`;
      const nm = p.weekday === 2 ? 'અંગારકી સંકષ્ટ ચતુર્થી' : 'સંકષ્ટ ચતુર્થી';
      const nmEn = p.weekday === 2 ? 'Angarki Sankashti Chaturthi' : 'Sankashti Chaturthi';
      out.push(F(nm, nmEn, 'vrat', `ચંદ્રોદય ${tm}`, `Moonrise ${tm}`));
    } else {
      const fr = sankashtiFallbackRise(p, ex);
      if (fr !== null) {
        const t = jdToLocal(fr, IST_HOURS);
        const pad = (n: number) => String(n).padStart(2, '0');
        const tm = `${pad(t.hour)}:${pad(t.minute)}`;
        const nm = p.weekday === 2 ? 'અંગારકી સંકષ્ટ ચતુર્થી' : 'સંકષ્ટ ચતુર્થી';
        const nmEn = p.weekday === 2 ? 'Angarki Sankashti Chaturthi' : 'Sankashti Chaturthi';
        out.push(F(nm, nmEn, 'vrat', `ચંદ્રોદય ${tm} (ચતુર્થી ચંદ્રોદય વિના)`, `Moonrise ${tm} (Chaturthi has no moonrise)`));
      }
    }
  }

  // ---- other monthly recurring
  if (p.paksha === 'sud' && p.tithi === 4) out.push(F('વિનાયક ચૌથ', 'Vinayak Chauth', 'recurring'));
  if (p.paksha === 'sud' && p.tithi === 8) out.push(F('દુર્ગાષ્ટમી', 'Durgashtami', 'recurring'));
  if (p.paksha === 'vad' && p.tithi === 8) out.push(F('કાલાષ્ટમી', 'Kalashtami', 'recurring'));
  if (p.paksha === 'sud' && p.tithi === 2) out.push(F('ચંદ્ર દર્શન', 'Chandra Darshan', 'recurring'));

  // ---- Purnima festivals (moonrise/sunset rule — "વ્રતની પૂનમ")
  if (tSs === 15) {
    const pf = adhik ? undefined : PURNIMA_SUNSET[p.monthIdx];
    if (pf) out.push(...pf);
    else if (adhik || p.monthIdx !== 4) out.push(F('પૂનમ', 'Purnima', 'purnima')); // Fagan handled by Holi
  }

  // ---- Amavasya (darsh) + weekday amas (overlap of the hindu day)
  if (p.tithiFull === 30) {
    if (!ud) out.push(F('અમાસ · દર્શ શ્રાદ્ધ', 'Amavasya · Darsh Shraddha', 'recurring'));
    const wk = AMASYA_WEEKDAY[p.weekday];
    if (wk) out.push(F(wk.gu, wk.en, 'vrat'));
  } else if (tSr2 === 30 && p.weekday in AMASYA_WEEKDAY) {
    const wk = AMASYA_WEEKDAY[p.weekday];
    if (wk) out.push(F(wk.gu, wk.en, 'vrat'));
  }

  // ---- Sankranti (solar ingress) on this civil date
  for (const s of ex.sankrantis) {
    const t = jdToLocal(s.jd, IST_HOURS);
    if (t.y === p.y && t.m === p.m && t.d === p.d) {
      const r = RASHIS[s.rashiIdx];
      const pad = (n: number) => String(n).padStart(2, '0');
      const tm = `${pad(t.hour)}:${pad(t.minute)}`;
      if (s.rashiIdx === 9) out.push(F('મકર સંક્રાંતિ · ઉત્તરાયણ', 'Makar Sankranti · Uttarayan', 'major', `સંક્રાંતિ ${tm}`, `Sankranti ${tm}`));
      else out.push(F(`${r.gu} સંક્રાંતિ`, `${r.en.split(' (')[0]} Sankranti`, 'solar', `સંક્રાંતિ ${tm}`, `Sankranti ${tm}`));
    }
  }

  // ---- Guru/Ravi pushya
  if (p.nakshatra === 8 && p.weekday === 4) out.push(F('ગુરુપુષ્યામૃત યોગ', 'Guru Pushyamrit Yoga', 'vrat'));
  if (p.nakshatra === 8 && p.weekday === 0) out.push(F('રવિપુષ્ય યોગ', 'Ravi Pushya Yoga', 'vrat'));

  // ---- fixed-date national / Christian
  const fk = `${p.m}-${p.d}`;
  if (FIXED[fk]) out.push(...FIXED[fk]);
  const { goodFriday, easter } = easterDates(p.y);
  const sameDay = (dt: Date) => dt.getUTCFullYear() === p.y && dt.getUTCMonth() + 1 === p.m && dt.getUTCDate() === p.d;
  if (sameDay(goodFriday)) out.push(F('ગુડ ફ્રાઈડે', 'Good Friday', 'national'));
  if (sameDay(easter)) out.push(F('ઈસ્ટર', 'Easter', 'national'));

  return out;
}
