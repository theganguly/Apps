/**
 * kundali.ts — birth chart: lagna, planet positions, navamsa, avakahada,
 * vimshottari dasha (README §12, §13.1). Whole-sign houses (Gujarati style).
 */
import { jdeFromJd, ascendantSidereal, siderealMoon, NAK_SPAN, julianDay, jdToLocal, IST_HOURS } from './astro';
import { NAKSHATRAS, RASHIS, VIM_LORDS, VIM_YEARS, AVAKAHADA, GRAHAS, type GrahaKey } from './data';
import { planetPositions, planetIngresses, planetLongitude, type PlanetPos } from './planets';

export interface KundaliInput {
  y: number; m: number; d: number; hour: number; minute: number; lat: number; lon: number;
  /** Length of a dasha year in days (Spec §0.4-8). Default 365.2425; the printed book implies a slightly shorter basis. */
  yearDays?: number;
}

export interface Kundali {
  jd: number;
  lagnaLon: number;        // sidereal ascendant longitude
  lagnaRashi: number;      // 1..12
  lagnaDeg: number; lagnaMin: number;
  lagnaNavamsa: number;    // navamsa sign 1..12 of lagna
  moonLon: number;
  moonRashi: number;
  nakshatra: number;       // 1..27
  pada: number;            // 1..4
  planets: PlanetPos[];    // 9 grahas (Sun..Ketu)
  navamsaSigns: Record<string, number>; // graha key -> navamsa rashi 1..12
  avakahada: { syllables: string[]; yoni: string; gana: string; nadi: string };
  dashas: Dasha[];
}

export interface Dasha {
  lord: GrahaKey;
  startJd: number; endJd: number;
  startDate: string; endDate: string; // DD-MM-YYYY IST
  antars: Array<{ lord: GrahaKey; startJd: number; endJd: number; startDate: string; endDate: string }>;
}

export const DEFAULT_DASHA_YEAR = 365.2425; // Spec §14 / `vimshottari(year_days=365.2425)` — Gregorian basis

/** Navamsa sign (1..12) of a sidereal longitude. */
export function navamsaSign(lon: number): number {
  const rashi = Math.floor(lon / 30);          // 0..11
  const navIdx = Math.floor((lon % 30) / (30 / 9)); // 0..8
  const nature = rashi % 3;                     // 0 movable, 1 fixed, 2 dual
  const start = nature === 0 ? rashi : nature === 1 ? (rashi + 8) % 12 : (rashi + 4) % 12;
  return ((start + navIdx) % 12) + 1;
}

const fmtDate = (jd: number) => {
  const t = jdToLocal(jd, IST_HOURS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(t.d)}-${p(t.m)}-${t.y}`;
};

export function castKundali(inp: KundaliInput): Kundali {
  const jd = julianDay(inp.y, inp.m, inp.d, inp.hour + inp.minute / 60 - IST_HOURS); // store UT jd
  const jde = jdeFromJd(jd);
  const lagnaLon = ascendantSidereal(jd, inp.lat, inp.lon);
  const moonLon = siderealMoon(jde);
  const nak = Math.floor(moonLon / NAK_SPAN) + 1;
  const pada = Math.floor((moonLon % NAK_SPAN) / (NAK_SPAN / 4)) + 1;

  const planetKeys: GrahaKey[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planets = planetPositions(jd, planetKeys);
  const navamsaSigns: Record<string, number> = {};
  for (const pl of planets) navamsaSigns[pl.key] = navamsaSign(pl.lon);

  // ---- vimshottari
  const DASHA_YEAR = inp.yearDays ?? DEFAULT_DASHA_YEAR;
  const frac = (moonLon % NAK_SPAN) / NAK_SPAN;
  const startLordIdx = (nak - 1) % 9;
  const dashas: Dasha[] = [];
  let cursor = jd;
  for (let i = 0; i < 9; i++) {
    const lord = VIM_LORDS[(startLordIdx + i) % 9];
    const fullYears = VIM_YEARS[lord];
    const years = i === 0 ? fullYears * (1 - frac) : fullYears;
    const startJd = cursor;
    const endJd = cursor + years * DASHA_YEAR;
    // antardashas within this mahadasha
    const antars: Dasha['antars'] = [];
    let ac = startJd;
    const lordIdx9 = VIM_LORDS.indexOf(lord);
    for (let j = 0; j < 9; j++) {
      const alord = VIM_LORDS[(lordIdx9 + j) % 9];
      const aYears = (fullYears * VIM_YEARS[alord]) / 120;
      const aEnd = ac + aYears * DASHA_YEAR;
      antars.push({ lord: alord, startJd: ac, endJd: aEnd, startDate: fmtDate(ac), endDate: fmtDate(aEnd) });
      ac = aEnd;
    }
    // fix rounding: last antar ends at mahadasha end
    antars[8].endJd = endJd; antars[8].endDate = fmtDate(endJd);
    dashas.push({ lord, startJd, endJd, startDate: fmtDate(startJd), endDate: fmtDate(endJd), antars });
    cursor = endJd;
  }

  const av = AVAKAHADA[nak - 1];
  return {
    jd, lagnaLon,
    lagnaRashi: Math.floor(lagnaLon / 30) + 1,
    lagnaDeg: Math.floor(lagnaLon % 30), lagnaMin: Math.floor((lagnaLon % 1) * 60),
    lagnaNavamsa: navamsaSign(lagnaLon),
    moonLon,
    moonRashi: Math.floor(moonLon / 30) + 1,
    nakshatra: nak, pada,
    planets, navamsaSigns,
    avakahada: {
      syllables: [...av.syllables],
      yoni: av.yoni.gu, gana: av.gana.gu, nadi: av.nadi.gu,
    },
    dashas,
  };
}

export { NAKSHATRAS, RASHIS, GRAHAS };

// ---------------------------------------------------------------- Pava (Spec §12, §0.4-10)
export type PavaMetal = 'gold' | 'silver' | 'copper' | 'iron';
const PAVA_BY_HOUSE: PavaMetal[] = ['gold', 'silver', 'copper', 'iron', 'silver', 'gold', 'copper', 'iron', 'silver', 'copper', 'gold', 'iron'];
/** House (1..12) of the Moon's sign at Saturn's ingress, counted from the natal Moon sign → metal.
 *  {1,6,11} gold · {2,5,9} silver · {3,7,10} copper · {4,8,12} iron. */
export function pavaMetalOf(moonRashiAtIngress: number, natalMoonRashi: number): { house: number; metal: PavaMetal } {
  const house = (((moonRashiAtIngress - natalMoonRashi) % 12) + 12) % 12 + 1;
  return { house, metal: PAVA_BY_HOUSE[house - 1] };
}
export interface PavaResult { house: number; metal: PavaMetal; ingressJd: number; moonRashi: number; confident: boolean }
/** Pava for a person whose natal Moon is in `natalMoonRashi` (1..12), valid at `jd`: uses the Moon's sign at the instant
 *  Saturn last entered its current sign. `confident` is false when the Moon changes sign within ±12 h of the (Tier-2,
 *  ±1 day) computed ingress — the spec's `uncertain-use-Tier1-ephemeris` flag. */
export function pavaAt(natalMoonRashi: number, jd: number): PavaResult | null {
  const cur = Math.floor(planetLongitude('Saturn', jd) / 30);
  const ings = planetIngresses('Saturn', jd - 11000, jd).filter((g) => g.rashiIdx === cur);
  const ing = ings[ings.length - 1];
  if (!ing) return null;
  const sign = (t: number) => Math.floor(siderealMoon(jdeFromJd(t)) / 30) + 1;
  const m0 = sign(ing.jd);
  let confident = true;
  for (let dh = -12; dh <= 12; dh += 1) if (sign(ing.jd + dh / 24) !== m0) { confident = false; break; }
  return { ...pavaMetalOf(m0, natalMoonRashi), ingressJd: ing.jd, moonRashi: m0, confident };
}
