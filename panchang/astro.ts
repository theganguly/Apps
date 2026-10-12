/**
 * astro.ts — Panchang astronomical core (TypeScript port of the verified
 * reference engine from the Harilal Panchang build spec).
 * Sun: VSOP87D Earth (0.001°) · Moon: Meeus ch.47 (~10″) · Lahiri ayanamsa.
 * All instants are Julian Days in UT. Display conversion is done elsewhere.
 */

export const D2R = Math.PI / 180.0;
export const IST_HOURS = 5.5;

/** Ayanamsa correction in arc-seconds; +14 reproduces the printed book's minutes. */
export let AYANAMSA_OFFSET_ARCSEC = 0;
export function setAyanamsaOffset(arcsec: number) { AYANAMSA_OFFSET_ARCSEC = arcsec; }

// ---------------------------------------------------------------- time
export function julianDay(y: number, m: number, d: number, hour = 0): number {
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = (y > 1582 || (y === 1582 && (m > 10 || (m === 10 && d >= 15)))) ? 2 - A + Math.floor(A / 4) : 0;
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + hour / 24.0 + B - 1524.5;
}

export function jdFromDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function dateFromJd(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

/** Calendar date (y,m,d) of a JD in a given fixed timezone offset (hours). */
export function jdToLocal(jd: number, tzHours = IST_HOURS): { y: number; m: number; d: number; hour: number; minute: number; second: number } {
  const date = dateFromJd(jd + tzHours / 24);
  return {
    y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate(),
    hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds(),
  };
}

export function deltaT(year: number): number {
  const y = year;
  if (y < -500) { const u = (y - 1820) / 100; return -20 + 32 * u * u; }
  if (y < 500) {
    const u = y / 100;
    return 10583.6 - 1014.41 * u + 33.78311 * u ** 2 - 5.952053 * u ** 3 - 0.1798452 * u ** 4 + 0.022174192 * u ** 5 + 0.0090316521 * u ** 6;
  }
  if (y < 1600) {
    const u = (y - 1000) / 100;
    return 1574.2 - 556.01 * u + 71.23472 * u ** 2 + 0.319781 * u ** 3 - 0.8503463 * u ** 4 - 0.005050998 * u ** 5 + 0.0083572073 * u ** 6;
  }
  if (y < 1700) { const t = y - 1600; return 120 - 0.9808 * t - 0.01532 * t ** 2 + t ** 3 / 7129; }
  if (y < 1800) { const t = y - 1700; return 8.83 + 0.1603 * t - 0.0059285 * t ** 2 + 0.00013336 * t ** 3 - t ** 4 / 1174000; }
  if (y < 1860) {
    const t = y - 1800;
    return 13.72 - 0.332447 * t + 0.0068612 * t ** 2 + 0.0041116 * t ** 3 - 0.00037436 * t ** 4 + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6 + 0.000000000875 * t ** 7;
  }
  if (y < 1900) { const t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174; }
  if (y < 1920) { const t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  if (y < 1941) { const t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3; }
  if (y < 1961) { const t = y - 1950; return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547; }
  if (y < 1986) { const t = y - 1975; return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718; }
  if (y < 2005) { const t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (y < 2050) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t ** 2; }
  if (y < 2150) return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
  const u = (y - 1820) / 100; return -20 + 32 * u * u;
}

export function yearFraction(jd: number): number { return 2000.0 + (jd - 2451545.0) / 365.2425; }
export function jdeFromJd(jd: number): number { return jd + deltaT(yearFraction(jd)) / 86400.0; }

// ---------------------------------------------------------------- Sun
// VSOP87D Earth heliocentric longitude (truncated; Meeus AA2 App. III, 64+34+20+7+3+1 terms) — Spec §4.3.
// Replaces the older ch.25 low-accuracy Sun (≈0.009° off ⇒ ~6 min on a sankranti). No ayanamsa offset is needed.
const L0: Array<[number, number, number]> = [[175347046,0,0],[3341656,4.6692568,6283.07585],[34894,4.6261,12566.1517],[3497,2.7441,5753.3849],[3418,2.8289,3.5231],[3136,3.6277,77713.7715],[2676,4.4181,7860.4194],[2343,6.1352,3930.2097],[1324,0.7425,11506.7698],[1273,2.0371,529.691],[1199,1.1096,1577.3435],[990,5.233,5884.927],[902,2.045,26.298],[857,3.508,398.149],[780,1.179,5223.694],[753,2.533,5507.553],[505,4.583,18849.228],[492,4.205,775.523],[357,2.92,0.067],[317,5.849,11790.629],[284,1.899,796.298],[271,0.315,10977.079],[243,0.345,5486.778],[206,4.806,2544.314],[205,1.869,5573.143],[202,2.458,6069.777],[156,0.833,213.299],[132,3.411,2942.463],[126,1.083,20.775],[115,0.645,0.98],[103,0.636,4694.003],[102,0.976,15720.839],[102,4.267,7.114],[99,6.21,2146.17],[98,0.68,155.42],[86,5.98,161000.69],[85,1.3,6275.96],[85,3.67,71430.7],[80,1.81,17260.15],[79,3.04,12036.46],[75,1.76,5088.63],[74,3.5,3154.69],[74,4.68,801.82],[70,0.83,9437.76],[62,3.98,8827.39],[61,1.82,7084.9],[57,2.78,6286.6],[56,4.39,14143.5],[56,3.47,6279.55],[52,0.19,12139.55],[52,1.33,1748.02],[51,0.28,5856.48],[49,0.49,1194.45],[41,5.37,8429.24],[41,2.4,19651.05],[39,6.17,10447.39],[37,6.04,10213.29],[37,2.57,1059.38],[36,1.71,2352.87],[36,1.78,6812.77],[33,0.59,17789.85],[30,0.44,83996.85],[30,2.74,1349.87],[25,3.16,4690.48]];
const L1: Array<[number, number, number]> = [[628331966747,0,0],[206059,2.678235,6283.07585],[4303,2.6351,12566.1517],[425,1.59,3.523],[119,5.796,26.298],[109,2.966,1577.344],[93,2.59,18849.23],[72,1.14,529.69],[68,1.87,398.15],[67,4.41,5507.55],[59,2.89,5223.69],[56,2.17,155.42],[45,0.4,796.3],[36,0.47,775.52],[29,2.65,7.11],[21,5.34,0.98],[19,1.85,5486.78],[19,4.97,213.3],[17,2.99,6275.96],[16,0.03,2544.31],[16,1.43,2146.17],[15,1.21,10977.08],[12,2.83,1748.02],[12,3.26,5088.63],[12,5.27,1194.45],[12,2.08,4694.0],[11,0.77,553.57],[10,1.3,6286.6],[10,4.24,1349.87],[9,2.7,242.73],[9,5.64,951.72],[8,5.3,2352.87],[6,2.65,9437.76],[6,4.67,4690.48]];
const L2: Array<[number, number, number]> = [[52919,0,0],[8720,1.0721,6283.0758],[309,0.867,12566.152],[27,0.05,3.52],[16,5.19,26.3],[16,3.68,155.42],[10,0.76,18849.23],[9,2.06,77713.77],[7,0.83,775.52],[5,4.66,1577.34],[4,1.03,7.11],[4,3.44,5573.14],[3,5.14,796.3],[3,6.05,5507.55],[3,1.19,242.73],[3,6.12,529.69],[3,0.31,398.15],[3,2.28,553.57],[2,4.38,5223.69],[2,3.75,0.98]];
const L3: Array<[number, number, number]> = [[289,5.844,6283.076],[35,0,0],[17,5.49,12566.15],[3,5.2,155.42],[1,4.72,3.52],[1,5.3,18849.23],[1,5.97,242.73]];
const L4: Array<[number, number, number]> = [[114,3.142,0],[8,4.13,6283.08],[1,3.84,12566.15]];
const L5: Array<[number, number, number]> = [[1,3.14,0]];

/** Geometric Earth heliocentric longitude of date (deg, 0..360). */
export function earthHeliocentricLongitude(jde: number): number {
  const tau = (jde - 2451545.0) / 365250.0;
  let tot = 0;
  [L0, L1, L2, L3, L4, L5].forEach((ser, k) => {
    let s = 0;
    for (const [a, b, c] of ser) s += a * Math.cos(b + c * tau);
    tot += s * Math.pow(tau, k);
  });
  return ((tot / 1e8 / D2R) % 360 + 360) % 360;
}

/** Sun–Earth distance in AU (Meeus ch.25 eccentric-orbit formula; only used for the aberration term). */
function sunDistAu(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
  const C = ((1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)) * D2R;
  return 1.000001018 * (1 - e * e) / (1 + e * Math.cos(M + C));
}

/** Nutation in longitude Δψ (deg), 4-term series (< 0.5″). */
export function nutationLongitude(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  const Om = (125.04452 - 1934.136261 * T) * D2R;
  const L = (280.4665 + 36000.7698 * T) * D2R;
  const Lm = (218.3165 + 481267.8813 * T) * D2R;
  return (-17.20 * Math.sin(Om) - 1.32 * Math.sin(2 * L) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * Om)) / 3600.0;
}

/** Low-accuracy Meeus ch.25 true longitude (kept as an independent cross-check, Spec G6). */
export function sunLongitudeTrueMeanEquinox(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * D2R;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) + 0.000289 * Math.sin(3 * Mr);
  return ((L0 + C) % 360 + 360) % 360;
}

/** Apparent Sun, mean equinox of date, no nutation (sidereal use; nutation cancels against the mean ayanamsa). */
export function sunLongitudeNoNutation(jde: number): number {
  return ((earthHeliocentricLongitude(jde) + 180 - 20.4898 / 3600.0 / sunDistAu(jde)) % 360 + 360) % 360;
}

/** Apparent Sun referred to the TRUE equinox of date (tropical use: ritu/ayana, RA/Dec, rise/set). */
export function sunLongitudeApparent(jde: number): number {
  return ((sunLongitudeNoNutation(jde) + nutationLongitude(jde)) % 360 + 360) % 360;
}

// ---------------------------------------------------------------- Moon (ch. 47)
// D, M, M', F, coefficient (1e-6 deg)
const _LR: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116],
  [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758],
  [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720], [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036], [2, 0, 2, 0, 3994],
  [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048],
  [2, 0, 1, -2, -1773], [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110], [3, 0, -1, 0, -892],
  [2, 1, 1, 0, -810], [4, -1, -2, 0, 759], [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537], [4, -1, 0, 0, 520], [1, 0, -2, 0, -487],
  [2, 1, 0, -2, -399], [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340], [4, 0, -3, 0, 330],
  [2, -1, 2, 0, 327], [0, 2, 1, 0, -323], [1, 1, -1, 0, 299], [2, 0, 3, 0, 294], [2, 0, -1, -2, 0],
];

export function moonLongitudeMeanEquinox(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T ** 2 + T ** 3 / 538841 - T ** 4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T ** 2 + T ** 3 / 545868 - T ** 4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T ** 2 + T ** 3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T ** 2 + T ** 3 / 69699 - T ** 4 / 14712000;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T ** 2 - T ** 3 / 3526000 + T ** 4 / 863310000;
  const A1 = 119.75 + 131.849 * T;
  const A2 = 53.09 + 479264.290 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  let s = 0;
  for (const [d, m, mp, f, c] of _LR) {
    const arg = (d * D + m * M + mp * Mp + f * F) * D2R;
    s += c * Math.pow(E, Math.abs(m)) * Math.sin(arg);
  }
  s += 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((Lp - F) * D2R) + 318 * Math.sin(A2 * D2R);
  return ((Lp + s / 1e6) % 360 + 360) % 360;
}

// ---------------------------------------------------------------- ayanamsa (Lahiri, mean)
function precessionPA(T: number): number { return 5029.0966 * T + 1.11113 * T * T - 0.000006 * T ** 3; }
const _T0 = (2435553.5 - 2451545.0) / 36525.0;   // 1956-03-21 0h
const _A0 = 23.250182778 - 0.004658035;          // mean Lahiri at _T0

export function lahiriAyanamsa(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  return _A0 + (precessionPA(T) - precessionPA(_T0)) / 3600.0 + AYANAMSA_OFFSET_ARCSEC / 3600.0;
}

export function siderealSun(jde: number): number { return ((sunLongitudeNoNutation(jde) - lahiriAyanamsa(jde)) % 360 + 360) % 360; }
export function siderealMoon(jde: number): number { return ((moonLongitudeMeanEquinox(jde) - lahiriAyanamsa(jde)) % 360 + 360) % 360; }
export function elongation(jde: number): number { return ((moonLongitudeMeanEquinox(jde) - sunLongitudeNoNutation(jde)) % 360 + 360) % 360; }

// ---------------------------------------------------------------- limb numbers
export const NAK_SPAN = 360 / 27;
export function tithiNumber(jde: number): number { return Math.floor(elongation(jde) / 12) + 1; }        // 1..30
export function karanaNumber(jde: number): number { return Math.floor(elongation(jde) / 6) + 1; }         // 1..60
export function nakshatraNumber(jde: number): number { return Math.floor(siderealMoon(jde) / NAK_SPAN) + 1; } // 1..27
export function yogaNumber(jde: number): number { return Math.floor((((siderealSun(jde) + siderealMoon(jde)) % 360 + 360) % 360) / NAK_SPAN) + 1; }
export function moonRashi(jde: number): number { return Math.floor(siderealMoon(jde) / 30) + 1; }
export function sunRashi(jde: number): number { return Math.floor(siderealSun(jde) / 30) + 1; }

/** Find JD where monotonic f (mod period) crosses target in [lo,hi]; null if not bracketed. */
export function findCrossing(f: (jd: number) => number, target: number, jdLo: number, jdHi: number, period = 360.0, tol = 1e-7): number | null {
  const g = (jd: number) => ((f(jd) - target + period / 2) % period + period) % period - period / 2;
  let lo = jdLo, hi = jdHi;
  const glo = g(lo), ghi = g(hi);
  if (!(glo <= 0 && 0 <= ghi)) return null;
  while (hi - lo > tol) {
    const mid = 0.5 * (lo + hi);
    if (g(mid) <= 0) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** First crossing of target after jdFrom, scanning in chunks so the ±period/2 wrap never breaks the bracket. */
export function nextCrossing(f: (jd: number) => number, target: number, jdFrom: number, maxDays: number, chunkDays = 5): number | null {
  let t = jdFrom;
  while (t < jdFrom + maxDays) {
    const c = findCrossing(f, target, t, Math.min(t + chunkDays, jdFrom + maxDays));
    if (c !== null) return c;
    t += chunkDays;
  }
  return null;
}

/** Last crossing of target before jdFrom (chunked scan backwards). */
export function prevCrossing(f: (jd: number) => number, target: number, jdFrom: number, maxDays: number, chunkDays = 5): number | null {
  let t = jdFrom;
  while (t > jdFrom - maxDays) {
    const c = findCrossing(f, target, Math.max(t - chunkDays, jdFrom - maxDays), t);
    if (c !== null) return c;
    t -= chunkDays;
  }
  return null;
}

/** First JD > jdStart at which integer-valued fnum changes (30-min coarse step + bisection). */
export function limbEnd(fnum: (jde: number) => number, jdStart: number, step = 1 / 48): number {
  const cur = fnum(jdeFromJd(jdStart));
  let t = jdStart;
  let guard = 0;
  while (fnum(jdeFromJd(t)) === cur) { t += step; if (++guard > 400) break; }
  let lo = t - step, hi = t;
  for (let i = 0; i < 50; i++) {
    const mid = 0.5 * (lo + hi);
    if (fnum(jdeFromJd(mid)) === cur) lo = mid; else hi = mid;
  }
  return hi;
}

// ---------------------------------------------------------------- rise / set
export function gmstDeg(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return ((280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T ** 3 / 38710000) % 360 + 360) % 360;
}

export function sunRaDec(jde: number): [number, number] {
  const T = (jde - 2451545.0) / 36525.0;
  const lam = sunLongitudeApparent(jde) * D2R;
  const eps = (23.439291 - 0.0130042 * T) * D2R + 0.00256 * D2R * Math.cos((125.04 - 1934.136 * T) * D2R);
  const ra = ((Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam))) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  return [ra / D2R, dec / D2R];
}

export function sunAltitude(jd: number, lat: number, lon: number): number {
  const jde = jdeFromJd(jd);
  const [ra, dec] = sunRaDec(jde);
  const H = (gmstDeg(jd) + lon - ra) * D2R;
  const phi = lat * D2R, d = dec * D2R;
  return Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H)) / D2R;
}

export const H0_SUN = -0.8333; // upper limb + standard refraction 34'

/** Sunrise & sunset JDs (UT) for local civil date y-m-d at (lat, lon). */
export function sunriseSunsetJd(y: number, m: number, d: number, lat: number, lon: number, h0 = H0_SUN): [number, number] {
  const noon = julianDay(y, m, d, 12.0) - lon / 360.0;
  const bis = (a0: number, b0: number): number => {
    let a = a0, b = b0;
    let fa = sunAltitude(a, lat, lon) - h0;
    for (let i = 0; i < 60; i++) {
      const mid = 0.5 * (a + b);
      const fm = sunAltitude(mid, lat, lon) - h0;
      if ((fa < 0) === (fm < 0)) { a = mid; fa = fm; } else { b = mid; }
    }
    return 0.5 * (a + b);
  };
  return [bis(noon - 0.5, noon), bis(noon, noon + 0.5)];
}

// ---------------------------------------------------------------- Rahu / Ketu (mean node)
export function meanNodeTropical(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  return ((125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000) % 360 + 360) % 360;
}
export function siderealRahu(jde: number): number { return ((meanNodeTropical(jde) - lahiriAyanamsa(jde)) % 360 + 360) % 360; }
export function siderealKetu(jde: number): number { return (siderealRahu(jde) + 180.0) % 360; }

// ---------------------------------------------------------------- ascendant
export function obliquity(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T ** 3;
}

export function ascendantTropical(jd: number, lat: number, lon: number): number {
  const ramc = ((gmstDeg(jd) + lon) % 360) * D2R;
  const eps = obliquity(jdeFromJd(jd)) * D2R;
  const phi = lat * D2R;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return ((asc / D2R) % 360 + 360) % 360;
}

export function ascendantSidereal(jd: number, lat: number, lon: number): number {
  return ((ascendantTropical(jd, lat, lon) - lahiriAyanamsa(jdeFromJd(jd))) % 360 + 360) % 360;
}
