import { glossaryAll, glossaryEntry, registerGlossaryEntry } from '../lib/glossary';
import { NAKSHATRAS, YOGAS, RASHIS, KARANS, CHOGHADIYA, GRAHAS } from '../lib/data';
import { loadPlaces, builtinPlaces, addPlace, updatePlace, deletePlace, validCoords, searchPlaces, newPlaceId, isBuiltin, placeKey } from '../lib/places';
import { STR } from '../lib/i18n';

let failures = 0;
const check = (n: string, c: boolean, x = '') => { if (c) console.log(`  ok  ${n}`); else { failures++; console.log(`FAIL  ${n} ${x}`); } };

// ---------------- glossary
const all = glossaryAll();
const count = (pre: string) => all.filter((e) => e.key.startsWith(pre)).length;
check('27 nakshatras', count('nakshatra:') === 27);
check('30 tithis', count('tithi:') === 30);
check('27 yogas', count('yoga:') === 27);
check('12 rashis', count('rashi:') === 12);
check('11 karans', count('karan:') === Object.keys(KARANS).length && count('karan:') === 11);
check('every graha in data.ts (9 classical + 3 outer) has an entry', count('graha:') === Object.keys(GRAHAS).length && Object.keys(GRAHAS).every((k) => glossaryEntry(`graha:${k}`)));
check('7 choghadiya slots', ['Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'].every((k) => glossaryEntry(`choghadiya:${k}`)));
check('every CHOGHADIYA key has an entry', CHOGHADIYA.every((c: any) => glossaryEntry(`choghadiya:${c.key}`)));
check('7 hora lords', ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].every((k) => glossaryEntry(`hora:${k}`)));
check('7 weekdays', count('weekday:') === 7);
const required = ['tithi', 'nakshatra', 'yoga', 'karan', 'vaar', 'paksha', 'mas', 'ritu', 'ayana', 'samvatsara', 'rahukaal', 'yamaganda', 'gulika', 'abhijit', 'brahma', 'sandhya', 'pradosh', 'nishita',
  'panchak', 'vinchhudo', 'bhadra', 'raviyoga', 'amritsiddhi', 'siddhiyoga', 'dagdha', 'kankach', 'vyatipat', 'vaidhriti', 'dishashool', 'tithivriddhi', 'tithikshaya',
  'sadesati', 'dhaiya', 'panoti', 'pava', 'avakahada', 'eclipse', 'eclipse:lunar', 'eclipse:solar', 'sunrise', 'sunset', 'moonrise', 'moonset', 'lagna', 'retro',
  'festival:major', 'festival:vrat', 'festival:jayanti', 'festival:solar', 'festival:recurring', 'festival:purnima', 'festival:national'];
check('all required concept keys exist', required.every((k) => glossaryEntry(k)), required.filter((k) => !glossaryEntry(k)).join());
const empty = all.filter((e) => !(e.gu && e.en && e.whatGu && e.whatEn && e.howGu && e.howEn));
check('every entry has Gujarati and English name/what/how', empty.length === 0, empty.map((e) => e.key).join());
check('Gujarati text is Gujarati (not accidental English)', all.every((e) => /[઀-૿]/.test(e.whatGu)), all.filter((e) => !/[઀-૿]/.test(e.whatGu)).map((e) => e.key).join());
check('English text is not accidentally Gujarati', all.every((e) => !/[઀-૿]/.test(e.whatEn)), all.filter((e) => /[઀-૿]/.test(e.whatEn)).map((e) => e.key).join());
const dangling = all.flatMap((e) => (e.related || []).filter((r) => !glossaryEntry(r)).map((r) => `${e.key}→${r}`));
check('every related link resolves', dangling.length === 0, dangling.join());
check('keys are unique', new Set(all.map((e) => e.key)).size === all.length);
check('nakshatra entries carry deity, lord and a significance line', NAKSHATRAS.every((_, i) => { const e = glossaryEntry(`nakshatra:${i + 1}`)!; return /દેવતા/.test(e.whatGu) && /deity/.test(e.whatEn) && !!e.whyGu && !!e.whyEn; }));
check('inauspicious yogas are marked in whyEn', YOGAS.every((y: any, i: number) => (y.bad ? /inauspicious/ : /favourable/).test(glossaryEntry(`yoga:${i + 1}`)!.whyEn)));
check('rashi entries mention lord, element, nature, body part', RASHIS.every((_, i) => /ruler/.test(glossaryEntry(`rashi:${i + 1}`)!.whatEn) && /body part/.test(glossaryEntry(`rashi:${i + 1}`)!.whatEn)));
check('Vinchhudo entry says Vrushchik (matches dayFlags)', /Vrushchik/.test(glossaryEntry('vinchhudo')!.whatEn));
registerGlossaryEntry({ key: 'plugin:x', gu: 'એક્સ', en: 'X', whatGu: 'એ', whatEn: 'a', howGu: 'બી', howEn: 'b', category: 'panchang' });
check('plugins can register glossary entries', glossaryEntry('plugin:x')?.en === 'X');
const needed = ['whatIs', 'howComputed', 'significance', 'relatedTerms', 'close'];
check('sheet i18n keys present with gu+en', needed.every((k) => (STR as any)[k]?.gu && (STR as any)[k]?.en));
{
  const bad = Object.entries(STR).filter(([, v]: any) => !v.gu || !v.en).map(([k]) => k);
  check('every STR key has gu and en', bad.length === 0, bad.join());
}

// ---------------- places (memory fallback: no localStorage in Node)
check('builtins wrap CITIES with stable ids', builtinPlaces().length > 5 && builtinPlaces().every((p) => p.id.startsWith('b-')) && new Set(builtinPlaces().map((p) => p.id)).size === builtinPlaces().length);
const id = newPlaceId();
addPlace({ id, nameGu: 'મારું ગામ', nameEn: 'My Village', lat: 21.123456789, lon: 72.5 });
check('addPlace appends to loadPlaces (rounded to 6 dp)', loadPlaces().some((p) => p.id === id && p.lat === 21.123457));
updatePlace(id, { nameEn: 'Renamed', lon: 73 });
check('updatePlace patches', loadPlaces().find((p) => p.id === id)?.nameEn === 'Renamed' && loadPlaces().find((p) => p.id === id)?.lon === 73);
let threw = false; try { updatePlace(id, { lat: 120 }); } catch { threw = true; }
check('updatePlace rejects invalid coordinates', threw);
threw = false; try { addPlace({ id: 'bad', nameGu: 'x', nameEn: 'x', lat: 0, lon: 181 }); } catch { threw = true; }
check('addPlace rejects invalid coordinates', threw);
threw = false; try { updatePlace(builtinPlaces()[0].id, { nameEn: 'x' }); } catch { threw = true; }
check('built-ins are read-only', threw && isBuiltin(builtinPlaces()[0].id));
check('validCoords bounds', validCoords(90, 180) && validCoords(-90, -180) && !validCoords(90.1, 0) && !validCoords(0, -180.1) && !validCoords(NaN, 0));
check('searchPlaces matches Gujarati and English', searchPlaces(loadPlaces(), 'રાજકોટ').length >= 1 && searchPlaces(loadPlaces(), 'rajkot').length >= 1 && searchPlaces(loadPlaces(), 'renamed').length === 1);
check('placeKey differs for different coordinates', placeKey({ lat: 22.3, lon: 70.8 }) !== placeKey({ lat: 22.3001, lon: 70.8 }));
deletePlace(id);
check('deletePlace removes', !loadPlaces().some((p) => p.id === id));
deletePlace(builtinPlaces()[0].id);
check('deletePlace ignores built-ins', loadPlaces().length === builtinPlaces().length);

console.log(failures === 0 ? '\nGLOSSARY/PLACES TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
