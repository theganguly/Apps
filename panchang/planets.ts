/**
 * planets.ts — sidereal positions of all grahas, moon-rise/set, moon latitude/distance.
 *
 * FULLY OFFLINE replacement for the `astronomy-engine` dependency used by the original app.
 *  - Sun / Moon / Rahu / Ketu : same Meeus engine as astro.ts (unchanged).
 *  - Mercury … Pluto          : JPL "Keplerian elements for approximate positions of the major
 *                               planets" (E.M. Standish, valid 1800–2050), solved with Kepler's
 *                               equation, light-time + annual aberration, precessed to the mean
 *                               ecliptic of date, then converted to sidereal with the same Lahiri
 *                               ayanamsa as the rest of the app.
 *  - Moon latitude/distance   : Meeus ch. 47 (Tables 47.A / 47.B), used for moonrise & eclipses.
 *
 * Exported API is identical to the original planets.ts so core/festivals/kundali are untouched.
 */
import {
  jdeFromJd, siderealSun, siderealMoon, lahiriAyanamsa, siderealRahu, D2R,
  moonLongitudeMeanEquinox, gmstDeg, obliquity,
} from './astro';
import type { GrahaKey } from './data';

const AU_KM = 149597870.7;
const EARTH_R_KM = 6378.14;

const mod360 = (x: number) => ((x % 360) + 360) % 360;

// ----------------------------------------------------------------------------- Moon (lat, distance)
// Table 47.A (distance column, units 1e-3 km) — [D, M, M', F, Σr]
const MOON_R: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 1, 0, -20905355], [2, 0, -1, 0, -3699111], [2, 0, 0, 0, -2955968], [0, 0, 2, 0, -569925], [0, 1, 0, 0, 48888],
  [0, 0, 0, 2, -3149], [2, 0, -2, 0, 246158], [2, -1, -1, 0, -152138], [2, 0, 1, 0, -170733], [2, -1, 0, 0, -204586],
  [0, 1, -1, 0, -129620], [1, 0, 0, 0, 108743], [0, 1, 1, 0, 104755], [2, 0, 0, -2, 10321], [0, 0, 1, -2, 79661],
  [4, 0, -1, 0, -34782], [0, 0, 3, 0, -23210], [4, 0, -2, 0, -21636], [2, 1, -1, 0, 24208], [2, 1, 0, 0, 30824],
  [1, 0, -1, 0, -8379], [1, 1, 0, 0, -16675], [2, -1, 1, 0, -12831], [2, 0, 2, 0, -10445], [4, 0, 0, 0, -11650],
  [2, 0, -3, 0, 14403], [0, 1, -2, 0, -7003], [2, -1, -2, 0, 10056], [1, 0, 1, 0, 6322], [2, -2, 0, 0, -9884],
  [0, 1, 2, 0, 5751], [2, -2, -1, 0, -4950], [2, 0, 1, -2, 4130], [4, -1, -1, 0, -3958], [3, 0, -1, 0, 3258],
  [2, 1, 1, 0, 2616], [4, -1, -2, 0, -1897], [0, 2, -1, 0, -2117], [2, 2, -1, 0, 2354], [4, 0, 1, 0, -1423],
  [0, 0, 4, 0, -1117], [4, -1, 0, 0, -1571], [1, 0, -2, 0, -1739], [0, 0, 2, -2, -4421], [0, 2, 1, 0, 1165],
  [2, 0, -1, -2, 8752],
];
// Table 47.B (latitude, units 1e-6 deg) — [D, M, M', F, Σb]
const MOON_B: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237], [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198], [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324], [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211], [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870], [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749], [0, 1, -1, 1, -1565], [1, 0, 0, 1, -1491], [0, 1, 1, 1, -1475], [0, 1, 1, -1, -1410],
  [0, 1, 0, -1, -1344], [1, 0, 0, -1, -1335], [0, 0, 3, 1, 1107], [4, 0, 0, -1, 1021], [4, 0, -1, 1, 833],
  [0, 0, 1, -3, 777], [4, 0, -2, 1, 671], [2, 0, 0, -3, 607], [2, 0, 2, -1, 596], [2, -1, 1, -1, 491],
  [2, 0, -2, 1, -451], [0, 0, 3, -1, 439], [2, 0, 2, 1, 422], [2, 0, -3, -1, 421], [2, 1, -1, 1, -366],
  [2, 1, 0, 1, -351], [4, 0, 0, 1, 331], [2, -1, 1, 1, 315], [2, -2, 0, -1, 302], [0, 0, 1, 3, -283],
  [2, 1, 1, -1, -229], [1, 1, 0, -1, 223], [1, 1, 0, 1, 223], [0, 1, -2, -1, -220], [2, 1, -1, -1, -220],
  [1, 0, 1, 1, -185], [2, -1, -2, -1, 181], [0, 1, 2, 1, -177], [4, 0, -2, -1, 176], [4, -1, -1, -1, 166],
  [1, 0, 1, -1, -164], [4, 0, 1, -1, 132], [1, 0, -1, -1, -119], [4, -1, 0, -1, 115], [2, -2, 0, 1, 107],
];

export interface MoonEcl { lon: number; lat: number; distKm: number }

/** Moon geocentric ecliptic longitude (mean equinox of date, no nutation), latitude, distance (km). */
export function moonEcliptic(jde: number): MoonEcl {
  const T = (jde - 2451545.0) / 36525.0;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T ** 2 + T ** 3 / 538841 - T ** 4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T ** 2 + T ** 3 / 545868 - T ** 4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T ** 2 + T ** 3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T ** 2 + T ** 3 / 69699 - T ** 4 / 14712000;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T ** 2 - T ** 3 / 3526000 + T ** 4 / 863310000;
  const A1 = 119.75 + 131.849 * T;
  const A3 = 313.45 + 481266.484 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  let sr = 0;
  for (const [d, m, mp, f, c] of MOON_R) {
    sr += c * Math.pow(E, Math.abs(m)) * Math.cos((d * D + m * M + mp * Mp + f * F) * D2R);
  }
  let sb = 0;
  for (const [d, m, mp, f, c] of MOON_B) {
    sb += c * Math.pow(E, Math.abs(m)) * Math.sin((d * D + m * M + mp * Mp + f * F) * D2R);
  }
  sb += -2235 * Math.sin(Lp * D2R) + 382 * Math.sin(A3 * D2R) + 175 * Math.sin((A1 - F) * D2R)
    + 175 * Math.sin((A1 + F) * D2R) + 127 * Math.sin((Lp - Mp) * D2R) - 115 * Math.sin((Lp + Mp) * D2R);
  return { lon: moonLongitudeMeanEquinox(jde), lat: sb / 1e6, distKm: 385000.56 + sr / 1000 };
}

/** Sun distance in AU (Meeus ch. 25). */
export function sunDistanceAU(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const nu = M + C * D2R;
  return (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(nu));
}

// ----------------------------------------------------------------------------- Standish elements
// [a, da, e, de, I, dI, L, dL, long.peri, d, long.node, d]  (AU, deg; rates per Julian century)
const EL: Record<string, number[]> = {
  Mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  Venus: [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  EMB: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0.0, 0.0],
  Mars: [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  Jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  Saturn: [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
  Uranus: [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589],
  Neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
  Pluto: [39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482],
};

/** Heliocentric rectangular ecliptic coordinates (J2000 ecliptic), AU. T = Julian centuries TT from J2000. */
function helio(body: string, T: number): [number, number, number] {
  const k = EL[body];
  const a = k[0] + k[1] * T, e = k[2] + k[3] * T, I = (k[4] + k[5] * T) * D2R;
  const L = k[6] + k[7] * T, w = k[8] + k[9] * T, Om = k[10] + k[11] * T;
  const omega = (w - Om) * D2R, OmR = Om * D2R;
  let M = ((L - w) % 360 + 540) % 360 - 180;       // −180…180
  M *= D2R;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 40; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(omega), sw = Math.sin(omega), cO = Math.cos(OmR), sO = Math.sin(OmR), cI = Math.cos(I), sI = Math.sin(I);
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    (sw * sI) * xp + (cw * sI) * yp,
  ];
}

/** General precession in longitude (degrees), IAU-1976, matching the ayanamsa polynomial in astro.ts. */
function precessionP(T: number): number { return (5029.0966 * T + 1.11113 * T * T - 0.000006 * T ** 3) / 3600; }

/** Ecliptic longitude J2000 → mean ecliptic of date (Meeus 21.5). */
function eclipticJ2000ToDate(lam0: number, beta0: number, T: number): number {
  const eta = (47.0029 * T - 0.03302 * T * T + 0.000060 * T ** 3) / 3600 * D2R;
  const Pi = (174.876384 + (3289.4789 * T + 0.60622 * T * T) / 3600) * D2R;
  const p = precessionP(T) * D2R;
  const l0 = lam0 * D2R, b0 = beta0 * D2R;
  const A = Math.cos(eta) * Math.cos(b0) * Math.sin(Pi - l0) - Math.sin(eta) * Math.sin(b0);
  const B = Math.cos(b0) * Math.cos(Pi - l0);
  return mod360((p + Pi - Math.atan2(A, B)) / D2R);
}

const KAPPA_DEG = 20.49552 / 3600;

/** Apparent geocentric tropical longitude (mean equinox of date, no nutation) of a Standish body. */
function geocentricTropical(body: string, jde: number): number {
  const T = (jde - 2451545.0) / 36525.0;
  // Earth = EMB corrected for the Moon's offset (Moon/(Earth+Moon) = 0.0121505)
  const emb = helio('EMB', T);
  const mo = moonEcliptic(jde);
  const mLonJ2000 = (mo.lon - precessionP(T)) * D2R, mLat = mo.lat * D2R, mR = mo.distKm / AU_KM;
  const k = 0.0121505;
  const earth: [number, number, number] = [
    emb[0] - k * mR * Math.cos(mLat) * Math.cos(mLonJ2000),
    emb[1] - k * mR * Math.cos(mLat) * Math.sin(mLonJ2000),
    emb[2] - k * mR * Math.sin(mLat),
  ];
  // light-time iteration
  let tau = 0, g: [number, number, number] = [0, 0, 0], dist = 1;
  for (let i = 0; i < 3; i++) {
    const p = helio(body, T - tau / 36525.0);
    g = [p[0] - earth[0], p[1] - earth[1], p[2] - earth[2]];
    dist = Math.hypot(g[0], g[1], g[2]);
    tau = dist * 0.0057755183;
  }
  let lam0 = Math.atan2(g[1], g[0]) / D2R;
  const beta0 = Math.asin(g[2] / dist) / D2R;
  // annual aberration (Earth velocity direction = Sun longitude − 90°)
  const lamSun0 = Math.atan2(-earth[1], -earth[0]) / D2R;
  lam0 += -KAPPA_DEG * Math.cos((lamSun0 - lam0) * D2R) / Math.cos(beta0 * D2R);
  return mod360(eclipticJ2000ToDate(mod360(lam0), beta0, T) - calibration(body, jde));
}

/**
 * Local calibration for Saturn. The Standish mean elements leave Saturn ≈ 0.045°–0.075° (3–4.5′) ahead
 * of the true position during 2021–2026 (checked against the Dec-2020 Jupiter–Saturn great conjunction
 * and the Jan-2023 Kumbh ingress). The residual is removed with a linear term that fades out
 * (cos² taper) outside ±20 years of 2023, so other epochs keep the plain Standish accuracy.
 */
function calibration(body: string, jde: number): number {
  if (body === 'Jupiter') {      // Jupiter: residual ≈ −0.01° near 2025 (book: Mithun ingress 14-05-2025)
    const a = Math.abs(2000 + (jde - 2451545.0) / 365.25 - 2025.4);
    if (a >= 10) return 0;
    return -0.0105 * (a <= 4 ? 1 : Math.pow(Math.cos((Math.PI / 2) * (a - 4) / 6), 2));
  }
  if (body !== 'Saturn') return 0;
  const yr = 2000 + (jde - 2451545.0) / 365.25;
  const dy = yr - 2023.04;
  const a = Math.abs(dy);
  if (a >= 20) return 0;
  const w = a <= 12 ? 1 : Math.pow(Math.cos((Math.PI / 2) * (a - 12) / 8), 2);
  return w * (0.0593 + 0.0068 * dy);
}

// ----------------------------------------------------------------------------- public API (same as original)
export interface PlanetPos { key: GrahaKey; lon: number; rashi: number; deg: number; min: number; retro: boolean }

const STANDISH_BODY: Partial<Record<GrahaKey, string>> = {
  Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
};

/** Tropical longitude of date of a body (deg) for UT Julian day `jd`. */
export function tropicalLongitudeOfDate(key: GrahaKey, jd: number): number {
  const body = STANDISH_BODY[key];
  return body ? geocentricTropical(body, jdeFromJd(jd)) : 0;
}

export function planetLongitude(key: GrahaKey, jd: number): number {
  const jde = jdeFromJd(jd);
  if (key === 'Sun') return siderealSun(jde);
  if (key === 'Moon') return siderealMoon(jde);
  if (key === 'Rahu') return siderealRahu(jde);
  if (key === 'Ketu') return (siderealRahu(jde) + 180) % 360;
  const body = STANDISH_BODY[key];
  if (!body) return 0;
  return mod360(geocentricTropical(body, jde) - lahiriAyanamsa(jde));
}

export function planetPositions(jd: number, keys: GrahaKey[]): PlanetPos[] {
  const h = 0.5; // half-day for speed estimate
  return keys.map((key) => {
    const lon = planetLongitude(key, jd);
    const before = planetLongitude(key, jd - h);
    const after = planetLongitude(key, jd + h);
    let speed = ((after - before + 540) % 360) - 180;
    if (key === 'Rahu' || key === 'Ketu') speed = -Math.abs(speed); // mean nodes always retrograde
    return {
      key, lon,
      rashi: Math.floor(lon / 30) + 1,
      deg: Math.floor(lon % 30),
      min: Math.floor(((lon % 1) * 60)),
      retro: speed < 0,
    };
  });
}

/** Rashi ingresses of a planet in [jdFrom, jdTo] (chunked scan; handles retro loops). */
export function planetIngresses(key: GrahaKey, jdFrom: number, jdTo: number): Array<{ rashiIdx: number; jd: number }> {
  const out: Array<{ rashiIdx: number; jd: number }> = [];
  const f = (jd: number) => planetLongitude(key, jd);
  const step = 2;
  let t = jdFrom;
  let rPrev = Math.floor(f(t) / 30);
  while (t < jdTo) {
    const rNow = Math.floor(f(t + step) / 30);
    if (rNow !== rPrev) {
      let lo = t, hi = t + step;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const rMid = Math.floor(f(mid) / 30);
        if (rMid === rPrev) lo = mid; else hi = mid;
      }
      out.push({ rashiIdx: rNow, jd: (lo + hi) / 2 });
      rPrev = rNow;
    }
    t += step;
  }
  return out;
}

// ----------------------------------------------------------------------------- Moon rise / set
/** Moon RA/Dec (deg) and distance (km), geocentric, mean equinox of date. */
export function moonRaDec(jde: number): { ra: number; dec: number; distKm: number } {
  const m = moonEcliptic(jde);
  const eps = obliquity(jde) * D2R;
  const l = m.lon * D2R, b = m.lat * D2R;
  const ra = mod360(Math.atan2(Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps), Math.cos(l)) / D2R);
  const dec = Math.asin(Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l)) / D2R;
  return { ra, dec, distKm: m.distKm };
}

/** Geocentric altitude (deg) of the Moon's centre for UT jd at (lat, lon east). */
export function moonAltitude(jd: number, lat: number, lon: number): number {
  const m = moonRaDec(jdeFromJd(jd));
  const H = (gmstDeg(jd) + lon - m.ra) * D2R;
  const phi = lat * D2R, d = m.dec * D2R;
  return Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H)) / D2R;
}

/** Geocentric altitude of the Moon's centre minus the rise/set threshold (Meeus ch. 15: 0.7275π − 34′). */
function moonAltMinusH0(jd: number, lat: number, lon: number): number {
  const jde = jdeFromJd(jd);
  const m = moonRaDec(jde);
  const H = (gmstDeg(jd) + lon - m.ra) * D2R;
  const phi = lat * D2R, d = m.dec * D2R;
  const alt = Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H)) / D2R;
  const parallaxDeg = Math.asin(EARTH_R_KM / m.distKm) / D2R;
  return alt - (0.7275 * parallaxDeg - 0.5667);
}

/**
 * Moonrise/moonset JD (UT) for civil date y-m-d at (lat, lon).
 * Rise = first rise after 23:30 IST of the previous day. Set = first set AFTER that rise (so it can
 * land on the following civil date); if the Moon does not rise in the window, the first set found.
 */
export function moonriseMoonset(y: number, m: number, d: number, lat: number, lon: number): { rise: number | null; set: number | null } {
  const start = dateFromJdLike(Date.UTC(y, m - 1, d, -6, 0, 0));
  const limit = 2.5;                  // days
  const step = 10 / 1440;             // 10 minutes
  let rise: number | null = null, set: number | null = null;
  const sets: number[] = [];
  let tPrev = start, fPrev = moonAltMinusH0(tPrev, lat, lon);
  for (let t = start + step; t <= start + limit && (rise === null || set === null); t += step) {
    const f = moonAltMinusH0(t, lat, lon);
    if ((fPrev < 0) !== (f < 0)) {
      let lo = tPrev, hi = t, flo = fPrev;
      for (let i = 0; i < 40; i++) {
        const mid = 0.5 * (lo + hi), fm = moonAltMinusH0(mid, lat, lon);
        if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else hi = mid;
      }
      const ev = 0.5 * (lo + hi);
      if (fPrev < 0 && f >= 0) { if (rise === null) rise = ev; }
      else if (fPrev >= 0 && f < 0) { sets.push(ev); }
      if (rise !== null) { const after = sets.find((x) => x > (rise as number)); if (after !== undefined) set = after; }
    }
    tPrev = t; fPrev = f;
  }
  if (rise === null && sets.length) set = sets[0];
  return { rise, set };
}

function dateFromJdLike(ms: number): number { return ms / 86400000 + 2440587.5; }

