/**
 * Regression tests for the corrections listed in Harilal_Panchang_Calculation_Spec.md §0.4.
 * Reference values come from the spec's Python engine (verify_all.py checks A2, A4, A11, C7, C9, E1-E4, E12).
 */
import { julianDay, sunLongitudeNoNutation, sunLongitudeTrueMeanEquinox, earthHeliocentricLongitude, jdeFromJd, IST_HOURS, jdToLocal } from '../lib/astro';
import { dayPanchang, sankrantisBetween, fmtISTDateTime } from '../lib/core';
import { festivalsOfDay } from '../lib/festivals';
import { lunarEclipsesBetween, lunarPenumbralContacts, lunarEclipseVisibleAt } from '../lib/eclipse';
import { castKundali, pavaMetalOf } from '../lib/kundali';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) fails++; };
const LAT = 22.3039, LON = 70.8022;

// #1 Sun = VSOP87D, no ayanamsa offset
ok(Math.abs(earthHeliocentricLongitude(2448908.5) - 19.907372) < 2e-6, 'A2 VSOP87 Earth L at JDE 2448908.5 = 19.907372° (AA2 ex. 25.b)');
let worst = 0;
for (let i = 0; i < 100; i++) { const jde = 2433282 + i * 540.7; let d = Math.abs(((sunLongitudeNoNutation(jde) - sunLongitudeTrueMeanEquinox(jde) + 540) % 360) - 180); worst = Math.max(worst, d); }
ok(worst < 0.015, `G6 VSOP vs low-accuracy ch.25 Sun within 0.015° over 100 epochs (max ${worst.toFixed(4)}°)`);
const sk = sankrantisBetween(julianDay(2024, 11, 1), julianDay(2025, 10, 25));
const byR = (r: number) => fmtISTDateTime(sk.find((s) => s.rashiIdx === r)!.jd);
ok(byR(9) === '14-01 08:55', `C7 Makar sankranti 14-01-2025 08:55 (got ${byR(9)})`);
ok(byR(7) === '16-11 07:31' && byR(8) === '15-12 22:11', `Vrushchik 16-11 07:31 / Dhan 15-12 22:11 (got ${byR(7)} / ${byR(8)})`);

// #2 lunar eclipses + visibility
const ecl = lunarEclipsesBetween(julianDay(2025, 3, 1), julianDay(2025, 10, 1));
ok(ecl.length === 2, 'two lunar eclipses in VS 2081 after Mar-2025');
ok(Math.abs(ecl[0].umbralMag - 1.1804) < 0.004 && Math.abs(ecl[1].umbralMag - 1.3622) < 0.004, `umbral magnitudes vs NASA (${ecl[0].umbralMag.toFixed(4)}, ${ecl[1].umbralMag.toFixed(4)})`);
const c0 = lunarPenumbralContacts(ecl[0].jd), c1 = lunarPenumbralContacts(ecl[1].jd);
ok(fmtISTDateTime(c0.p1) === '14-03 09:26' && fmtISTDateTime(c0.p4) === '14-03 15:31', 'P1/P4 14-03-2025 = 09:26 / 15:31');
ok(fmtISTDateTime(c1.p1) === '07-09 20:57' && fmtISTDateTime(c1.p4) === '08-09 02:25', 'P1/P4 07-09-2025 = 20:57 / 02:25');
ok(!lunarEclipseVisibleAt(ecl[0].jd, LAT, LON), '14-03-2025 lunar eclipse NOT visible at Rajkot (§0.4-2)');
ok(lunarEclipseVisibleAt(ecl[1].jd, LAT, LON), '07-09-2025 lunar eclipse visible at Rajkot');

// #4 / #6 / #3 vrat engine over the whole Samvat
const start = julianDay(2024, 11, 1);
const days: Record<string, string[]> = {};
for (let i = 0; i < 358; i++) {
  const t = jdToLocal(start + i + 0.5, IST_HOURS);
  const p = dayPanchang(t.y, t.m, t.d, LAT, LON);
  const key = `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;
  days[key] = festivalsOfDay(p, { sankrantis: sk, lat: LAT, lon: LON }).map((f) => f.en);
}
const dates = (re: RegExp) => Object.keys(days).filter((k) => days[k].some((n) => re.test(n)));
ok(JSON.stringify(dates(/Vaishnava/)) === JSON.stringify(['2025-06-07', '2025-06-22']), 'E2 Vaishnava Ekadashi differs only on 07-06 and 22-06: ' + dates(/Vaishnava/).join(','));
ok(dates(/Sankashti/).length === 12 && dates(/Sankashti/).includes('2025-10-10') && dates(/Sankashti/)[0] === '2024-11-18', `E12 12 Sankashti incl. fallback 10-10-2025 (got ${dates(/Sankashti/).length})`);
const prad = dates(/Pradosh/);
ok(prad.length === 24 && prad.includes('2025-02-10') && !prad.includes('2025-02-09'), `E4 24 Pradosh incl. Mon 10-02-2025 (got ${prad.length})`);
ok(dates(/Janmashtami/).join() === '2025-08-16', 'E11 Janmashtami (udaya / book) = 16-08-2025: ' + dates(/Janmashtami/).join());

// #8 dasha year length is a parameter
const k1 = castKundali({ y: 1990, m: 5, d: 17, hour: 10, minute: 30, lat: LAT, lon: LON });
const k2 = castKundali({ y: 1990, m: 5, d: 17, hour: 10, minute: 30, lat: LAT, lon: LON, yearDays: 360 });
ok(k1.dashas[1].startJd >= k2.dashas[1].startJd, 'yearDays shortens dasha spans');
ok(k1.dashas[8].endJd > k2.dashas[8].endJd, 'default 365.2425 vs 360: later dasha ends differ');

// #10 pava rule table
ok(pavaMetalOf(1, 1).metal === 'gold' && pavaMetalOf(2, 1).metal === 'silver' && pavaMetalOf(3, 1).metal === 'copper' && pavaMetalOf(4, 1).metal === 'iron', 'pava metals: houses 1 gold, 2 silver, 3 copper, 4 iron');
ok(['gold','silver','copper','iron'].every((m, i) => [[1,6,11],[2,5,9],[3,7,10],[4,8,12]][i].every((h) => pavaMetalOf(h, 1).metal === m)) , 'pava sets {1,6,11} gold {2,5,9} silver {3,7,10} copper {4,8,12} iron');
console.log(fails ? `\n${fails} FAILED` : '\nSPEC CORRECTION TESTS PASSED');
process.exit(fails ? 1 : 0);
