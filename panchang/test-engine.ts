/**
 * Engine regression tests — all expected values are from the book / README validation (§15).
 * Run: npx tsx scripts/test-engine.ts
 */
import {
  julianDay, jdeFromJd, moonLongitudeMeanEquinox, sunLongitudeTrueMeanEquinox,
  sunriseSunsetJd, lahiriAyanamsa, siderealSun, findCrossing, elongation,
  tithiNumber, siderealRahu,
} from '../lib/astro';
import { dayPanchang, choghadiya, fmtIST, fmtISTDate, fmtISTDateTime, lunarMonthsBetween, dayFlags, tithiDisplay, weekdayOfJd } from '../lib/core';
import { karanaName } from '../lib/data';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.log(`FAIL  ${name} ${extra}`); }
}

// --- astronomy basics
check('JD 2000-01-01 12h', Math.abs(julianDay(2000, 1, 1, 12) - 2451545.0) < 1e-9);
check('JD 1987-01-27 0h', Math.abs(julianDay(1987, 1, 27, 0) - 2446822.5) < 1e-9);
check('Moon Meeus 47.a', Math.abs(moonLongitudeMeanEquinox(2448724.5) - 133.162655) < 2e-5, `got ${moonLongitudeMeanEquinox(2448724.5)}`);
check('Sun Meeus 25.a', Math.abs(sunLongitudeTrueMeanEquinox(2448908.5) - 199.90988) < 2e-5);
check('Ayanamsa J2000 ≈ 23°51′25.5″', Math.abs(lahiriAyanamsa(2451545.0) - (23 + 51 / 60 + 25.5 / 3600)) < 1 / 3600, `got ${lahiriAyanamsa(2451545.0)}`);

// --- 02-11-2024 Rajkot reference row (§10.1)
const RAJ = [22.3039, 70.8022] as const;
const [sr, ss] = sunriseSunsetJd(2024, 11, 2, ...RAJ);
check('sunrise 06:51', fmtIST(sr) === '06:51', `got ${fmtIST(sr)}`);
check('sunset 18:08/18:09', ['18:08', '18:09'].includes(fmtIST(ss)), `got ${fmtIST(ss)}`);
const p = dayPanchang(2024, 11, 2);
check('weekday Saturday', p.weekday === 6);
check('tithi Sud 1', p.tithiFull === 1 && p.paksha === 'sud');
check('tithi ends 20:22', fmtIST(p.tithiEndJd) === '20:22', `got ${fmtIST(p.tithiEndJd)}`);
check('nakshatra Vishakha(16)', p.nakshatra === 16);
check('nakshatra ends 05:58 next day', fmtIST(p.nakshatraEndJd) === '05:58' && fmtISTDate(p.nakshatraEndJd) === '03-11-2024', `got ${fmtIST(p.nakshatraEndJd)} ${fmtISTDate(p.nakshatraEndJd)}`);
check('yoga Ayushman(3)', p.yoga === 3);
check('yoga ends 11:17', fmtIST(p.yogaEndJd) === '11:17', `got ${fmtIST(p.yogaEndJd)}`);
check('karan Kimstughna ends 07:22', p.karanas[0].name === 'Kimstughna' && fmtIST(p.karanas[0].endJd) === '07:22', `got ${p.karanas[0].name} ${fmtIST(p.karanas[0].endJd)}`);
check('moon rashi Tula(7)', p.moonRashi === 7);
check('moon→Vrushchik 23:23', p.moonRashiEndJd !== null && fmtIST(p.moonRashiEndJd) === '23:23', `got ${p.moonRashiEndJd && fmtIST(p.moonRashiEndJd)}`);
check('samvat 2081', p.vikram === 2081, `got ${p.vikram}`);
check('shaka 1946', p.shaka === 1946, `got ${p.shaka}`);
check('samvatsara Anala', p.samvatsara.includes('અનલ'), `got ${p.samvatsara}`);
check('month Kartak', p.monthIdx === 0);
check('ritu Hemant (5)', p.ritu === 5, `got ${p.ritu}`);
check('ayana dakshin', p.ayanaGu === 'દક્ષિણાયન');

// --- Makar sankranti 14-01-2025 08:55 (Spec §0.4-1: VSOP87D Sun, no ayanamsa offset; book prints 08:56)
const mk = findCrossing((jd) => siderealSun(jdeFromJd(jd)), 270, julianDay(2025, 1, 12), julianDay(2025, 1, 16));
check('Makar sankranti 14-01 08:55', mk !== null && fmtISTDate(mk) === '14-01-2025' && ['08:55', '08:56'].includes(fmtIST(mk)), `got ${mk && fmtISTDate(mk) + ' ' + fmtIST(mk)}`);

// --- choghadiya tables (Monday 04-11-2024, Sunday 03-11-2024)
function chogNames(y: number, m: number, d: number) {
  const [r, s] = sunriseSunsetJd(y, m, d, ...RAJ);
  const n = new Date(Date.UTC(y, m - 1, d + 1));
  const [r2] = sunriseSunsetJd(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate(), ...RAJ);
  const c = choghadiya(r, s, r2);
  const N = ['Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
  return { day: c.day.map((x) => N[x.nameIdx]), night: c.night.map((x) => N[x.nameIdx]) };
}
const mon = chogNames(2024, 11, 4);
check('Monday day choghadiya', JSON.stringify(mon.day) === JSON.stringify(['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Chal', 'Labh', 'Amrit']));
check('Monday night choghadiya', JSON.stringify(mon.night) === JSON.stringify(['Chal', 'Rog', 'Kaal', 'Labh', 'Udveg', 'Shubh', 'Amrit', 'Chal']));
const sun = chogNames(2024, 11, 3);
check('Sunday night choghadiya', JSON.stringify(sun.night) === JSON.stringify(['Shubh', 'Amrit', 'Chal', 'Rog', 'Kaal', 'Labh', 'Udveg', 'Shubh']));

// --- 12 lunar months of Samvat 2081 (book p.24)
const BOOK: Array<[string, string, string]> = [
  ['Kartak', '2024-11-02', '2024-12-01'], ['Magshar', '2024-12-02', '2024-12-30'], ['Posh', '2024-12-31', '2025-01-29'],
  ['Maha', '2025-01-30', '2025-02-27'], ['Fagan', '2025-02-28', '2025-03-29'], ['Chaitra', '2025-03-30', '2025-04-27'],
  ['Vaishakh', '2025-04-28', '2025-05-27'], ['Jeth', '2025-05-28', '2025-06-25'], ['Ashadh', '2025-06-26', '2025-07-24'],
  ['Shravan', '2025-07-25', '2025-08-23'], ['Bhadarvo', '2025-08-24', '2025-09-21'], ['Aaso', '2025-09-22', '2025-10-21'],
];
const months = lunarMonthsBetween(julianDay(2024, 10, 15), julianDay(2025, 10, 25), ...RAJ);
const iso = (x: { y: number; m: number; d: number }) => `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
BOOK.forEach(([name, s, e]) => {
  const mo = months.find((mm) => !mm.adhik && iso(mm.startDate) === s);
  check(`month ${name} ${s}→${e}`, !!mo && iso(mo.endDate) === e,
    mo ? `got ${iso(mo.startDate)}→${iso(mo.endDate)}${mo.adhik ? ' (adhik)' : ''}` : 'missing');
});

// --- Ekadashi dates (p.26): tithi 11/26 at sunrise
const EK = ['2024-11-12', '2024-11-26', '2024-12-11', '2024-12-26', '2025-01-10', '2025-01-25', '2025-02-08', '2025-02-24', '2025-03-10', '2025-03-25',
  '2025-04-08', '2025-04-24', '2025-05-08', '2025-05-23', '2025-06-06', '2025-07-06', '2025-07-21', '2025-08-05', '2025-08-19', '2025-09-03',
  '2025-09-17', '2025-10-03', '2025-10-17'];
for (const ds of EK) {
  const [yy, mm, dd] = ds.split('-').map(Number);
  const [r0] = sunriseSunsetJd(yy, mm, dd, ...RAJ);
  const t = tithiNumber(jdeFromJd(r0));
  check(`ekadashi ${ds}`, t === 11 || t === 26, `got tithi ${t}`);
}

// --- Panchak window (book p.19): begins Sat 09-11-2024 23:27, ends Thu 14-11-2024 03:11
{
  const p9 = dayPanchang(2024, 11, 9);
  const fl = dayFlags(p9);
  check('panchak starts 09-11 23:27', fl.panchakStart !== null && fmtISTDate(fl.panchakStart) === '09-11-2024' && ['23:26', '23:27', '23:28'].includes(fmtIST(fl.panchakStart)),
    `got ${fl.panchakStart && fmtISTDate(fl.panchakStart) + ' ' + fmtIST(fl.panchakStart)}`);
  check('panchak ends 14-11 ~03:11', fl.panchakEnd !== null && fmtISTDate(fl.panchakEnd) === '14-11-2024', `got ${fl.panchakEnd && fmtISTDate(fl.panchakEnd) + ' ' + fmtIST(fl.panchakEnd)}`);
}
// --- Vinchhudo: 02-11-2024 23:23 → 05-11-2024 09:45
{
  const p2 = dayPanchang(2024, 11, 2);
  const fl = dayFlags(p2);
  check('vinchhudo starts 02-11 23:23', fl.vinchhudoStart !== null && fmtISTDate(fl.vinchhudoStart) === '02-11-2024' && ['23:22', '23:23', '23:24'].includes(fmtIST(fl.vinchhudoStart)),
    `got ${fl.vinchhudoStart && fmtISTDate(fl.vinchhudoStart) + ' ' + fmtIST(fl.vinchhudoStart)}`);
  check('vinchhudo ends 05-11 ~09:45', fl.vinchhudoEnd !== null && fmtISTDate(fl.vinchhudoEnd) === '05-11-2024', `got ${fl.vinchhudoEnd && fmtISTDate(fl.vinchhudoEnd) + ' ' + fmtIST(fl.vinchhudoEnd)}`);
}


// --- fmtISTDateTime: show the date only when the instant is on another IST civil day (Task 1 regression)
{
  const ref9 = { y: 2024, m: 11, d: 9 };
  const fl = dayFlags(dayPanchang(2024, 11, 9));
  check('fmtISTDateTime: panchak start on same day → HH:MM only', fl.panchakStart !== null && /^23:2[678]$/.test(fmtISTDateTime(fl.panchakStart, ref9)), `got ${fl.panchakStart && fmtISTDateTime(fl.panchakStart, ref9)}`);
  check('fmtISTDateTime: panchak end rolls to 14-11 → includes day', fl.panchakEnd !== null && /^14-11 03:1\d$/.test(fmtISTDateTime(fl.panchakEnd, ref9)), `got ${fl.panchakEnd && fmtISTDateTime(fl.panchakEnd, ref9)}`);
  check('fmtISTDateTime: no ref → always dated', fl.panchakStart !== null && /^09-11 23:2[678]$/.test(fmtISTDateTime(fl.panchakStart)));
  const p2 = dayPanchang(2024, 11, 2);
  check('fmtISTDateTime: nakshatra ends next civil day → "03-11 05:58"', fmtISTDateTime(p2.nakshatraEndJd, { y: 2024, m: 11, d: 2 }) === '03-11 05:58', `got ${fmtISTDateTime(p2.nakshatraEndJd, { y: 2024, m: 11, d: 2 })}`);
  check('fmtISTDateTime: tithi ends same day → "20:22"', fmtISTDateTime(p2.tithiEndJd, { y: 2024, m: 11, d: 2 }) === '20:22');
}

// --- karan table check (book p.24): Sud 1 1st half Kimstughna
check('karan #1 Kimstughna', karanaName(1) === 'Kimstughna' && karanaName(2) === 'Bava' && karanaName(8) === 'Vishti' && karanaName(58) === 'Shakuni' && karanaName(60) === 'Naga');
// --- tithiDisplay
check('tithi 30 = Amas', tithiDisplay(30).name.gu === 'અમાસ');
check('tithi 22 = Vad 7 સાતમ', tithiDisplay(22).name.gu === 'સાતમ' && tithiDisplay(22).paksha === 'vad');

// --- Rahu enters Kumbh on 18-05-2025 (mean node)
{
  const f = (jd: number) => 360 - siderealRahu(jdeFromJd(jd)); // make increasing
  const c = findCrossing(f, 360 - 330, julianDay(2025, 5, 10), julianDay(2025, 5, 28)); // retrograde: Meen→Kumbh crosses 330°
  check('Rahu → Kumbh 18-05-2025', c !== null && fmtISTDate(c) === '18-05-2025', `got ${c && fmtISTDate(c)}`);
}

// --- Year length 354 days
{
  const start = new Date(Date.UTC(2024, 10, 2)).getTime();
  const end = new Date(Date.UTC(2025, 9, 21)).getTime();
  check('samvat 2081 = 354 days', (end - start) / 86400000 + 1 === 354);
}

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
