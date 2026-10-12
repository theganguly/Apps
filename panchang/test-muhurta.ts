import { muhurtasForDay, lagnaMuhurtasForMonth, lagnaMuhurtasForSamvat, lagnaWindows, BENEFIC_LAGNAS, KHAT_MINUTES, KHAT_NAKSHATRAS } from '../lib/muhurta';
import { dayPanchang, dayFlags } from '../lib/core';
import { samvatSpan } from '../lib/samvat';
import { SHUBH_NAKSHATRAS } from '../lib/data';

let failures = 0;
const check = (n: string, c: boolean, x = '') => { if (c) console.log(`  ok  ${n}`); else { failures++; console.log(`FAIL  ${n} ${x}`); } };
const P = { lat: 22.3039, lon: 70.8022 };

// ---- known shubh date: Guru-Pushya, Thursday 24-10-2024 (Pushya at sunrise) → Amrit-siddhi, graded best
{
  const day = muhurtasForDay(2024, 10, 24, P);
  const am = day.find((m) => m.kind === 'amrit');
  check('24-10-2024 (Guru-Pushya) has an Amrit-siddhi muhurta', !!am);
  check('…graded best, nakshatra Pushya (8), weekday Thursday', !!am && am.quality === 'best' && am.nakshatra === 8 && am.weekday === 4);
  check('…explains why (reasons present)', !!am && am.reasons.length >= 1 && /Amrit-siddhi/.test(am.reasons[0].en));
  check('…name initials exposed from AVAKAHADA', !!am && am.syllables.length === 4);
}
// ---- Ravi-yoga / Siddhi detection consistent with dayFlags
{
  let n = 0, bad = 0;
  for (let d = 1; d <= 28; d++) {
    const p = dayPanchang(2024, 11, d, P.lat, P.lon), fl = dayFlags(p);
    const ms = muhurtasForDay(2024, 11, d, P, p, fl);
    n++;
    if (fl.raviYoga !== ms.some((m) => m.kind === 'ravi')) bad++;
    if (fl.amritSiddhi !== ms.some((m) => m.kind === 'amrit')) bad++;
    if (fl.siddhiYoga !== ms.some((m) => m.kind === 'siddhi')) bad++;
  }
  check('day-level yoga muhurtas agree with dayFlags (Nov 2024)', bad === 0, `${bad} mismatches in ${n} days`);
}
// ---- lagna windows partition the Hindu day and rise in zodiac order
{
  const p = dayPanchang(2024, 11, 14, P.lat, P.lon);
  const w = lagnaWindows(p.sunriseJd, p.nextSunriseJd, P.lat, P.lon);
  const total = w.reduce((s, x) => s + (x.endJd - x.startJd), 0);
  check('lagna windows tile sunrise→next sunrise exactly', Math.abs(total - (p.nextSunriseJd - p.sunriseJd)) < 1e-9);
  check('~12 windows in a day, each 1–3 h', w.length >= 12 && w.length <= 14 && w.slice(1, -1).every((x) => (x.endJd - x.startJd) * 24 > 1 && (x.endJd - x.startJd) * 24 < 3), `${w.length}`);
  check('rashis advance 1→12 cyclically', w.every((x, i) => i === 0 || x.rashi === (w[i - 1].rashi % 12) + 1));
}
// ---- invariants over a month and the whole samvatsar
const month = lagnaMuhurtasForMonth(2024, 11, P);
check('Nov 2024 yields muhurtas of several kinds', new Set(month.map((m) => m.kind)).size >= 4, [...new Set(month.map((m) => m.kind))].join());
check('lagna windows only in benefic rashis', month.filter((m) => m.kind === 'lagna').every((m) => BENEFIC_LAGNAS.includes(m.lagnaRashi)));
check('lagna windows only on shubh nakshatras', month.filter((m) => m.kind === 'lagna').every((m) => SHUBH_NAKSHATRAS.has(m.nakshatra)));
check('no lagna window on Amavasya or Rikta tithis (4/9/14 of either paksha)', month.filter((m) => m.kind === 'lagna').every((m) => ![4, 9, 14, 19, 24, 29, 30].includes(m.tithi)));
{
  let overlap = 0;
  for (const m of month) {
    const p = dayPanchang(m.date.y, m.date.m, m.date.d, P.lat, P.lon), fl = dayFlags(p);
    if (m.kind === 'lagna' || m.kind === 'abhijit' || m.kind === 'khat') for (const [a, b] of fl.bhadra) if (Math.max(a, m.jd) < Math.min(b, m.endJd) - 1e-9) overlap++;
  }
  check('no lagna/abhijit/khat window overlaps Bhadra', overlap === 0, `${overlap}`);
}
{
  const kh = month.filter((m) => m.kind === 'khat');
  check('khat windows are exactly 24 minutes', kh.every((m) => Math.abs((m.endJd - m.jd) * 1440 - KHAT_MINUTES) < 0.01));
  check('khat only on Mon/Wed/Thu/Fri with khat nakshatras', kh.every((m) => [1, 3, 4, 5].includes(m.weekday) && KHAT_NAKSHATRAS.has(m.nakshatra)));
  check('khat quality graded best/good only', kh.every((m) => m.quality !== 'ok'));
}
check('every muhurta carries ids, labels in gu+en, reasons', month.every((m) => m.id && m.labelGu && m.labelEn && m.reasons.length > 0));
check('ids are unique', new Set(month.map((m) => m.id)).size === month.length);
{
  const t = Date.now();
  const all = lagnaMuhurtasForSamvat(2081, P, samvatSpan(2081, P.lat, P.lon));
  const dt = Date.now() - t;
  check('whole VS 2081 yields >500 muhurtas in <8 s', all.length > 500 && dt < 8000, `${all.length} in ${dt} ms`);
  const monthly = lagnaMuhurtasForMonth(2024, 11, P).map((m) => m.id);
  const fromYear = new Set(all.map((m) => m.id));
  const missing = monthly.filter((id) => !fromYear.has(id) && !id.includes(':20241101:')); // 1 Nov precedes Kartak Sud 1
  check('month results are a subset of the samvatsar results', missing.length === 0, missing.slice(0, 3).join());
}
// samvatMonthIdx filter: Kartak (0) only
{
  const kar = lagnaMuhurtasForMonth(2024, 11, P, 0);
  check('samvatMonthIdx filter keeps only Kartak days', kar.length > 0 && kar.every((m) => m.monthIdx === 0));
}
console.log(failures === 0 ? '\nMUHURTA TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
