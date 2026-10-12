/**
 * Panchak / Vinchhudo / tithi lists for VS 2081 (Rajkot), built through dayPanchang + dayFlags.
 * Book-verified anchors (printed Harilal panchang, also asserted in test-engine.ts):
 *   Panchak   09-11-2024 23:27 → 14-11-2024 03:11
 *   Vinchhudo 02-11-2024 23:23 → 05-11-2024 09:45
 * Ekadashi dates are the 23 book dates already used in test-engine.ts.
 */
import { samvatSpan, buildYearReport, ymdKey } from '../lib/samvat';
import { fmtISTDateTime, fmtISTDate, fmtIST } from '../lib/core';
import { siderealMoon, jdeFromJd } from '../lib/astro';

let failures = 0;
const check = (n: string, c: boolean, x = '') => { if (c) console.log(`  ok  ${n}`); else { failures++; console.log(`FAIL  ${n} ${x}`); } };
const P = { lat: 22.3039, lon: 70.8022 };
const range = samvatSpan(2081, P.lat, P.lon);
const rep = buildYearReport(range, P.lat, P.lon);

check('VS 2081 starts 2024-11-02, ends 2025-10-21', ymdKey(range.start) === '2024-11-02' && ymdKey(range.end) === '2025-10-21');
check('12 lunar months in VS 2081 (no adhik)', range.months.length === 12, `got ${range.months.length}`);

// ---- book anchors
const pk = rep.panchak.find((b) => fmtISTDate(b.startJd) === '09-11-2024');
check('panchak block 09-11 23:27 → 14-11 03:11 exists', !!pk && ['23:26', '23:27', '23:28'].includes(fmtIST(pk.startJd)) && fmtISTDate(pk.endJd) === '14-11-2024' && ['03:10', '03:11', '03:12'].includes(fmtIST(pk.endJd)),
  pk ? `${fmtISTDateTime(pk.startJd)} → ${fmtISTDateTime(pk.endJd)}` : 'missing');
const vn = rep.vinchhudo.find((b) => fmtISTDate(b.startJd) === '02-11-2024');
check('vinchhudo block 02-11 23:23 → 05-11 09:45 exists', !!vn && ['23:22', '23:23', '23:24'].includes(fmtIST(vn.startJd)) && fmtISTDate(vn.endJd) === '05-11-2024' && ['09:44', '09:45', '09:46'].includes(fmtIST(vn.endJd)));

// ---- structural: each block is a genuine Moon-in-sign window (sidereal Moon 300–360° / 210–240°)
const moon = (jd: number) => siderealMoon(jdeFromJd(jd));
const within = (b: { startJd: number; endJd: number }, lo: number, hi: number) => {
  const mid = moon((b.startJd + b.endJd) / 2), a = moon(b.startJd + 0.01), z = moon(b.endJd - 0.01);
  return mid >= lo && mid <= hi && a >= lo - 0.5 && a <= hi && z >= lo && z <= hi + 0.5;
};
check('every panchak block has Moon in Kumbh/Meen', rep.panchak.every((b) => within(b, 300, 360)));
check('every vinchhudo block has Moon in Vrushchik', rep.vinchhudo.every((b) => within(b, 210, 240)));
check('panchak blocks last 4–5.3 days', rep.panchak.every((b) => b.endJd - b.startJd > 4 && b.endJd - b.startJd < 5.3));
check('vinchhudo blocks last 1.8–2.7 days', rep.vinchhudo.every((b) => b.endJd - b.startJd > 1.8 && b.endJd - b.startJd < 2.7));
check('13 panchak and 13 vinchhudo blocks (354 d ≈ 13 sidereal months)', rep.panchak.length === 13 && rep.vinchhudo.length === 13, `${rep.panchak.length}/${rep.vinchhudo.length}`);
check('blocks are in order with no duplicates', rep.panchak.every((b, i) => i === 0 || b.startJd - rep.panchak[i - 1].startJd > 25));

// ---- Ekadashi: the 23 book dates must all be present
const EK = ['2024-11-12', '2024-11-26', '2024-12-11', '2024-12-26', '2025-01-10', '2025-01-25', '2025-02-08', '2025-02-24', '2025-03-10', '2025-03-25',
  '2025-04-08', '2025-04-24', '2025-05-08', '2025-05-23', '2025-06-06', '2025-07-06', '2025-07-21', '2025-08-05', '2025-08-19', '2025-09-03',
  '2025-09-17', '2025-10-03', '2025-10-17'];
const have = new Set(rep.ekadashis.map((d) => ymdKey(d.ymd)));
check('all 23 book Ekadashi dates present', EK.every((d) => have.has(d)), EK.filter((d) => !have.has(d)).join(','));
check('24 Ekadashis (23 udaya + 1 tithi-kshaya)', rep.ekadashis.length === 24 && rep.ekadashis.filter((d) => d.kshaya).length === 1, `${rep.ekadashis.length}`);
check('12 Purnimas and 12 Amavasyas', rep.purnimas.length === 12 && rep.amavasyas.length === 12, `${rep.purnimas.length}/${rep.amavasyas.length}`);
check('Maha Amavasya (tithi kshaya) listed on 2025-02-27', rep.amavasyas.some((d) => ymdKey(d.ymd) === '2025-02-27' && d.kshaya));
check('Diwali Amavasya listed 2025-10-21', rep.amavasyas.some((d) => ymdKey(d.ymd) === '2025-10-21'));
check('12 sankrantis incl. Makar on 14-01-2025', rep.sankrantis.length === 12 && rep.sankrantis.some((s) => s.rashiIdx === 9 && fmtISTDate(s.jd) === '14-01-2025'));
check('eclipses of VS 2081 found', rep.eclipses.length >= 3, `${rep.eclipses.length}`);

console.log(failures === 0 ? '\nPANCHAK/SAMVAT TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
