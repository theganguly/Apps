import { planetPositions, planetIngresses, moonriseMoonset } from '../lib/planets';
import { julianDay, jdToLocal, IST_HOURS } from '../lib/astro';
import { RASHIS, GRAHAS, type GrahaKey } from '../lib/data';

const rashiName = (r1: number) => `${RASHIS[r1 - 1].en}(idx${r1 - 1})`;

// Book year-start positions (02-11-2024, VS 2081), rashi indices 0-based:
// Jupiter in Vrushabh(1), Saturn in Kumbh(10), Rahu in Meen(11), Ketu in Kanya(5),
// Mars in Kark(3), Sun in Tula(6). planetPositions returns 1-based rashi.
const jd = julianDay(2024, 11, 2, 12);
console.log('--- Planet sidereal positions on 02-11-2024 (noon IST) ---');
const keys = Object.keys(GRAHAS) as GrahaKey[];
const poss = planetPositions(jd, keys);
const expected: Partial<Record<GrahaKey, number>> = {
  Jupiter: 2, Saturn: 11, Rahu: 12, Ketu: 6, Mars: 4, Sun: 7,
};
let ok = true;
for (const p of poss) {
  const exp = expected[p.key];
  const pass = exp === undefined ? '' : p.rashi === exp ? 'OK' : `MISMATCH(exp ${rashiName(exp)})`;
  if (pass.startsWith('MISMATCH')) ok = false;
  console.log(
    `${GRAHAS[p.key].en.padEnd(8)} ${rashiName(p.rashi).padEnd(22)} ${p.deg}°${String(p.min).padStart(2, '0')}' ${p.retro ? 'R' : ' '} ${pass}`,
  );
}

// Mars ingresses Nov-2024..Jun-2025 — should include entry into Simha (Leo)
const ing = planetIngresses('Mars', julianDay(2024, 11, 2, 0), julianDay(2025, 6, 1, 0));
console.log(`\nMars ingresses Nov-24..Jun-25: ${ing.length}`);
for (const g of ing.slice(0, 6)) {
  const d = jdToLocal(g.jd, IST_HOURS);
  console.log(`  -> ${RASHIS[g.rashiIdx].en + " (idx" + g.rashiIdx + ")"} on ${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`);
}

// Moonrise/moonset for Rajkot on 02-11-2024 (Amavasya — moonrise near sunrise ~06:51)
const mm = moonriseMoonset(2024, 11, 2, 22.3039, 70.8022);
const fmt = (j: number | null) => {
  if (j == null) return '  --  ';
  const l = jdToLocal(j, IST_HOURS);
  return `${String(l.hour).padStart(2, '0')}:${String(l.minute).padStart(2, '0')}`;
};
console.log(`\nMoonrise Rajkot 02-11-2024: ${fmt(mm.rise)} (expect ~06:45-06:55)`);
console.log(`Moonset  Rajkot 02-11-2024: ${fmt(mm.set)} (expect ~17:50-18:20)`);

// Sharad Purnima 16-10-2024: moonrise near sunset ~18:15
const mm2 = moonriseMoonset(2024, 10, 16, 22.3039, 70.8022);
console.log(`Moonrise Rajkot 16-10-2024 (Purnima): ${fmt(mm2.rise)} (expect ~18:00-18:40)`);

console.log(ok ? '\nPLANET TESTS PASSED' : '\nPLANET TESTS FAILED');
