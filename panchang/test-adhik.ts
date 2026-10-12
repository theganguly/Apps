/** Adhik masa: naming, placement and festival handling. */
import { lunarMonthsBetween, dayPanchang, sankrantisBetween } from '../lib/core';
import { festivalsOfDay } from '../lib/festivals';
import { samvatSpan, ymdKey, addDays, buildYearReport } from '../lib/samvat';
import { julianDay } from '../lib/astro';
import { MONTHS_GU } from '../lib/data';

let failures = 0;
const check = (n: string, c: boolean, x = '') => { if (c) console.log(`  ok  ${n}`); else { failures++; console.log(`FAIL  ${n} ${x}`); } };
const P = { lat: 22.3039, lon: 70.8022 };
const JETH = 7, SHRAVAN = 9;

// ---- VS 2082 has Adhik Jeth (17 May – 15 Jun 2026), followed by Nij Jeth
const r = samvatSpan(2082, P.lat, P.lon);
const adh = r.months.filter((m) => m.adhik);
check('VS 2082 has 13 lunar months, exactly one adhik', r.months.length === 13 && adh.length === 1, `${r.months.length}/${adh.length}`);
check('the adhik month is named Jeth', adh[0]?.index === JETH, adh[0] ? MONTHS_GU[adh[0].index].en : 'none');
check('Adhik Jeth runs 2026-05-17 → 2026-06-15', ymdKey(adh[0].startDate) === '2026-05-17' && ymdKey(adh[0].endDate) === '2026-06-15');
const i = r.months.indexOf(adh[0]);
check('Adhik Jeth is followed by Nij Jeth (2026-06-16 → 2026-07-14)', r.months[i + 1].index === JETH && !r.months[i + 1].adhik && ymdKey(r.months[i + 1].startDate) === '2026-06-16' && ymdKey(r.months[i + 1].endDate) === '2026-07-14');
check('Adhik Jeth is preceded by Vaishakh, Nij Jeth followed by Ashadh', r.months[i - 1].index === 6 && r.months[i + 2].index === 8);
check('month names run in order across the year (adhik repeats its name)', r.months.map((m) => m.index).join() === '0,1,2,3,4,5,6,7,7,8,9,10,11');
{
  const p = dayPanchang(2026, 6, 1, P.lat, P.lon);
  check('Today-style lookup 2026-06-01 → Jeth, monthAdhik true', p.monthIdx === JETH && p.monthAdhik);
  const q = dayPanchang(2026, 6, 20, P.lat, P.lon);
  check('2026-06-20 → Jeth, not adhik', q.monthIdx === JETH && !q.monthAdhik);
}
// ---- earlier adhik: Shravan 2023 (18 Jul – 16 Aug)
{
  const ms = lunarMonthsBetween(julianDay(2023, 6, 1), julianDay(2023, 10, 1), P.lat, P.lon);
  const a = ms.find((m) => m.adhik);
  check('2023 adhik month is Shravan, 18-07 → 16-08', !!a && a.index === SHRAVAN && ymdKey(a.startDate) === '2023-07-18' && ymdKey(a.endDate) === '2023-08-16');
}
// ---- years without adhik are unaffected (VS 2081: 12 months, none adhik)
check('VS 2081 has no adhik month', !samvatSpan(2081, P.lat, P.lon).months.some((m) => m.adhik));

// ---- Samvat-tab report agrees
{
  const rep = buildYearReport(r, P.lat, P.lon);
  const ek = rep.ekadashis.filter((d) => d.adhik).map((d) => d.nameEn);
  check('year report: adhik-month Ekadashis are Padmini + Parama', ek.some((n) => /Padmini/.test(n)) && ek.some((n) => /Parama/.test(n)), ek.join());
  check('year report: 26 Ekadashis-ish (13 months) and Purnima/Amavasya ×13', rep.purnimas.length === 13 && rep.amavasyas.length === 13, `${rep.purnimas.length}/${rep.amavasyas.length}`);
}

// ---- festivals
const names = (y: number, m: number, d: number) => {
  const p = dayPanchang(y, m, d, P.lat, P.lon);
  const sk = sankrantisBetween(julianDay(y, m, d) - 33, julianDay(y, m, d) + 33);
  return festivalsOfDay(p, { sankrantis: sk, lat: P.lat, lon: P.lon }).map((f) => f.en);
};
const range = (from: { y: number; m: number; d: number }, n: number) => Array.from({ length: n }, (_, k) => { const d = addDays(from, k); return { d, f: names(d.y, d.m, d.d) }; });
const adhikDays = range({ y: 2026, m: 5, d: 17 }, 30), nijDays = range({ y: 2026, m: 6, d: 16 }, 29);
const all = (days: typeof adhikDays) => days.flatMap((x) => x.f);
check('Padmini Ekadashi listed in Adhik Jeth (Sud 11)', all(adhikDays).includes('Padmini Ekadashi'));
check('Parama Ekadashi on 2026-06-11 (Vad 11)', names(2026, 6, 11).includes('Parama Ekadashi'));
check('no Jeth-specific festivals leak into the adhik month', !all(adhikDays).some((f) => /Nirjala|Ganga Dashera|Vat Purnima|Yogini/.test(f)));
check('Nirjala Ekadashi 2026-06-25 and Vat Purnima 2026-06-29 fall in Nij Jeth', names(2026, 6, 25).includes('Nirjala Ekadashi') && names(2026, 6, 29).includes('Vat Purnima'));
check('Ganga Dashera 2026-06-24 in Nij Jeth', names(2026, 6, 24).includes('Ganga Dashera'));
check('generic vrats continue in adhik month (Pradosh, Masik Shivratri, Sankashti)', all(adhikDays).some((f) => /Pradosh/.test(f)) && all(adhikDays).includes('Masik Shivratri') && all(adhikDays).some((f) => /Sankashti/.test(f)));
check('adhik Purnima is a plain Purnima (no month-specific name)', all(adhikDays).includes('Purnima') && !all(adhikDays).some((f) => /Vat Purnima|Jeth/.test(f)));
// Adhik Shravan 2023 must not produce Janmashtami / Raksha-bandhan-type festivals before the Nij month
{
  const a = range({ y: 2023, m: 7, d: 18 }, 30).flatMap((x) => x.f);
  check('Adhik Shravan 2023: no Janmashtami / month festivals', !a.some((f) => /Janmashtami|Rakshabandhan|Raksha/.test(f)));
  check('Adhik Shravan 2023: Padmini Ekadashi present', a.includes('Padmini Ekadashi'));
}
console.log(failures === 0 ? '\nADHIK TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
