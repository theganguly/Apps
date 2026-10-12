/**
 * eclipse.ts — offline eclipse search (replaces astronomy-engine's eclipse functions).
 * Lunar : Moon–shadow-axis separation vs umbra/penumbra radii (Danjon enlargement k = 1.015, Spec §13).
 * Solar : distance of the Moon's shadow axis from Earth's centre vs penumbra/umbra radii;
 *         local visibility from topocentric Sun–Moon separation and Sun altitude.
 * All instants are UT Julian days.
 */
import {
  jdeFromJd, elongation, findCrossing, sunLongitudeNoNutation, gmstDeg, obliquity, D2R,
} from './astro';
import { moonEcliptic, sunDistanceAU, moonAltitude } from './planets';

const AU = 149597870.7, R_E = 6378.137, R_SUN = 695700, R_MOON = 1737.4;
/** Danjon shadow enlargement, calibrated on NASA 2025-03-14 and 2025-09-07 (Spec §13). */
const K_DANJON = 1.015;
const mod360 = (x: number) => ((x % 360) + 360) % 360;

export interface LunarEclipse { jd: number; kind: 'total' | 'partial' | 'penumbral'; umbralMag: number; penumbralMag: number }
export interface SolarEclipse { jd: number; kind: 'total' | 'annular' | 'partial'; gammaEarthRadii: number }

/** Syzygy instants (target 0 = new, 180 = full) in [jdFrom, jdTo]. */
function syzygies(target: 0 | 180, jdFrom: number, jdTo: number): number[] {
  const f = (jd: number) => elongation(jdeFromJd(jd));
  const out: number[] = [];
  let t = jdFrom - 31;
  while (t < jdTo + 31) {
    const c = findCrossing(f, target, t, t + 10);
    if (c !== null) {
      if (c >= jdFrom && c <= jdTo && (out.length === 0 || c - out[out.length - 1] > 20)) out.push(c);
      t = c + 20;
    } else t += 10;
  }
  return out;
}

function minimise(f: (t: number) => number, lo: number, hi: number): number {
  const g = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi, c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < 70; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
  }
  return 0.5 * (a + b);
}

// ----------------------------------------------------------------------------- lunar
function lunarSep(jd: number): { sep: number; distKm: number; R: number } {
  const jde = jdeFromJd(jd);
  const m = moonEcliptic(jde);
  const ls = sunLongitudeNoNutation(jde) + 180;
  const b = m.lat * D2R;
  const cosd = Math.cos(b) * Math.cos((m.lon - ls) * D2R);
  const sep = Math.acos(Math.max(-1, Math.min(1, cosd)));
  return { sep, distKm: m.distKm, R: sunDistanceAU(jde) };
}

export function lunarEclipsesBetween(jdFrom: number, jdTo: number): LunarEclipse[] {
  const out: LunarEclipse[] = [];
  for (const full of syzygies(180, jdFrom - 1, jdTo + 1)) {
    const jde = jdeFromJd(full);
    if (Math.abs(moonEcliptic(jde).lat) > 1.75) continue;           // geometrically impossible
    const tp = minimise((t) => lunarSep(t).sep, full - 0.1, full + 0.1);
    const { sep, distKm, R } = lunarSep(tp);
    const piM = Math.asin(R_E / distKm), piS = (8.794148 / 3600 * D2R) / R, sS = Math.asin(R_SUN / (R * AU));
    const sM = Math.asin(R_MOON / distKm);
    const u = K_DANJON * (piM + piS - sS), p = K_DANJON * (piM + piS + sS);
    const umb = (u + sM - sep) / (2 * sM), pen = (p + sM - sep) / (2 * sM);
    if (pen <= 0) continue;
    if (tp < jdFrom || tp > jdTo) continue;
    out.push({ jd: tp, kind: umb >= 1 ? 'total' : umb > 0 ? 'partial' : 'penumbral', umbralMag: umb, penumbralMag: pen });
  }
  return out;
}

// ----------------------------------------------------------------------------- solar
type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Geocentric ecliptic vectors (km) of Sun and Moon centres. */
function sunMoonVectors(jd: number): { S: V3; M: V3 } {
  const jde = jdeFromJd(jd);
  const m = moonEcliptic(jde);
  const R = sunDistanceAU(jde) * AU;
  const ls = sunLongitudeNoNutation(jde) * D2R;
  const lm = m.lon * D2R, bm = m.lat * D2R;
  return {
    S: [R * Math.cos(ls), R * Math.sin(ls), 0],
    M: [m.distKm * Math.cos(bm) * Math.cos(lm), m.distKm * Math.cos(bm) * Math.sin(lm), m.distKm * Math.sin(bm)],
  };
}

function shadowGeometry(jd: number) {
  const { S, M } = sunMoonVectors(jd);
  const SM = sub(M, S);
  const L = norm(SM);
  const d: V3 = [SM[0] / L, SM[1] / L, SM[2] / L];          // axis direction (Sun → Moon → Earth side)
  const dmin = norm(cross(M, d));                            // distance of Earth's centre from the axis
  const t0 = -dot(M, d);                                     // distance from Moon to the fundamental plane
  const tanF1 = Math.tan(Math.asin((R_SUN + R_MOON) / L));
  const tanF2 = Math.tan(Math.asin((R_SUN - R_MOON) / L));
  return { dmin, t0, tanF1, tanF2 };
}

export function solarEclipsesBetween(jdFrom: number, jdTo: number): SolarEclipse[] {
  const out: SolarEclipse[] = [];
  for (const nm of syzygies(0, jdFrom - 1, jdTo + 1)) {
    if (Math.abs(moonEcliptic(jdeFromJd(nm)).lat) > 1.85) continue;
    const tp = minimise((t) => shadowGeometry(t).dmin, nm - 0.12, nm + 0.12);
    const g = shadowGeometry(tp);
    const rp = R_MOON + g.t0 * g.tanF1;                      // penumbra radius at fundamental plane
    if (g.dmin >= R_E + rp) continue;                        // no eclipse anywhere on Earth
    const ruCentre = R_MOON - g.t0 * g.tanF2;                // umbra radius at plane through Earth's centre
    let kind: SolarEclipse['kind'] = 'partial';
    if (g.dmin < R_E + Math.abs(ruCentre) * 0.9) {
      if (g.dmin < R_E) {
        const zs = g.t0 - Math.sqrt(R_E * R_E - g.dmin * g.dmin);   // nearest surface point along the axis
        kind = R_MOON - zs * g.tanF2 > 0 ? 'total' : 'annular';
      } else kind = ruCentre > 0 ? 'total' : 'annular';
    }
    if (tp < jdFrom || tp > jdTo) continue;
    out.push({ jd: tp, kind, gammaEarthRadii: g.dmin / R_E });
  }
  return out;
}

/** Is any phase of the eclipse (peak at `jdPeak`) visible, with the Sun above the horizon, from (lat, lon east)? */
export function solarEclipseVisibleAt(jdPeak: number, lat: number, lon: number): boolean {
  const phi = lat * D2R;
  const e2 = 0.00669437999;
  const N = R_E / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  for (let t = jdPeak - 0.25; t <= jdPeak + 0.25; t += 3 / 1440) {
    const th = (gmstDeg(t) + lon) * D2R;
    const obs: V3 = [N * Math.cos(phi) * Math.cos(th), N * Math.cos(phi) * Math.sin(th), N * (1 - e2) * Math.sin(phi)];
    const up: V3 = [Math.cos(phi) * Math.cos(th), Math.cos(phi) * Math.sin(th), Math.sin(phi)];
    const { S, M } = sunMoonVectors(t);
    const eps = obliquity(jdeFromJd(t)) * D2R;
    const toEq = (v: V3): V3 => [v[0], v[1] * Math.cos(eps) - v[2] * Math.sin(eps), v[1] * Math.sin(eps) + v[2] * Math.cos(eps)];
    const s = sub(toEq(S), obs), m = sub(toEq(M), obs);
    const ds = norm(s), dm = norm(m);
    const sep = Math.atan2(norm(cross(s, m)), dot(s, m));
    if (sep < Math.asin(R_SUN / ds) + Math.asin(R_MOON / dm) && dot(s, up) / ds > Math.sin(-0.5 * D2R)) return true;
  }
  return false;
}

/** Penumbral first/last contact (P1, P4) of the lunar eclipse whose greatest phase is `jdPeak`. Roots of sep = k(πm+πs+ss) + sm. */
export function lunarPenumbralContacts(jdPeak: number): { p1: number; p4: number } {
  const f = (t: number) => {
    const { sep, distKm, R } = lunarSep(t);
    const piM = Math.asin(R_E / distKm), piS = (8.794148 / 3600 * D2R) / R, sS = Math.asin(R_SUN / (R * AU));
    const sM = Math.asin(R_MOON / distKm);
    return sep - (K_DANJON * (piM + piS + sS) + sM);
  };
  const root = (a: number, b: number) => { // f(a) < 0 < f(b) or reverse; bisect
    let lo = a, hi = b; const flo = f(lo) < 0;
    for (let i = 0; i < 50; i++) { const mid = 0.5 * (lo + hi); if ((f(mid) < 0) === flo) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  };
  const w = 0.2; // days — penumbral half-duration is < 0.17 d
  const p1 = f(jdPeak - w) > 0 ? root(jdPeak - w, jdPeak) : jdPeak - w;
  const p4 = f(jdPeak + w) > 0 ? root(jdPeak, jdPeak + w) : jdPeak + w;
  return { p1, p4 };
}

/** Is the Moon above the rise/set threshold at ANY instant between first and last penumbral contact? (Spec §13) */
export function lunarEclipseVisibleAt(jdPeak: number, lat: number, lon: number): boolean {
  const { p1, p4 } = lunarPenumbralContacts(jdPeak);
  for (let t = p1; t <= p4 + 1e-9; t += 5 / 1440) if (moonAltitude(t, lat, lon) > 0.12) return true;
  return false;
}

export { mod360 };
