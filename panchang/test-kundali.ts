// Verify vs README §12.9 worked example:
// 01-11-2024 18:17:40 IST: Moon = Tula 15°23' → Swati pada 3, Rahu balance 6.22y
// → Rahu ends 22-01-2031, Jupiter → 22-01-2047, Saturn → 22-01-2066, Mercury → 22-01-2083
// Navamsa of that Moon: Kumbh. Ascendant (Delhi): Mesh 29° → Krittika pada 1, navamsa Dhan.
import { castKundali, navamsaSign } from '../lib/kundali';
import { NAKSHATRAS, RASHIS } from '../lib/data';

const k = castKundali({ y: 2024, m: 11, d: 1, hour: 18, minute: 17, lat: 28.6139, lon: 77.2090 }); // Delhi
console.log('lagna:', RASHIS[k.lagnaRashi - 1].gu, `${k.lagnaDeg}°${k.lagnaMin}'`, 'navamsa:', RASHIS[k.lagnaNavamsa - 1].gu);
console.log('moon rashi:', RASHIS[k.moonRashi - 1].gu, 'nak:', NAKSHATRAS[k.nakshatra - 1].gu, 'pada', k.pada);
console.log('moon navamsa:', RASHIS[navamsaSign(k.moonLon) - 1].gu);
for (const d of k.dashas.slice(0, 4)) console.log(`dasha ${d.lord}: ${d.startDate} → ${d.endDate}`);

let ok = true;
const expect = (cond: boolean, msg: string) => { console.log((cond ? 'ok  ' : 'FAIL') + ' ' + msg); if (!cond) ok = false; };
expect(k.nakshatra === 15 && k.pada === 3, 'Swati pada 3');
expect(navamsaSign(k.moonLon) === 11, 'moon navamsa Kumbh');
expect(k.lagnaRashi === 1, 'lagna Mesh (Delhi)');
expect(k.lagnaNavamsa === 9, 'lagna navamsa Dhan');
expect(k.dashas[0].lord === 'Rahu' && Math.abs(new Date(k.dashas[0].endDate.split('-').reverse().join('-')).getTime() - new Date('2031-01-22').getTime()) < 5*86400000, `Rahu → ${k.dashas[0].endDate} (book 22-01-2031, ±5d from book's rounded balance)`);
expect(k.dashas[1].lord === 'Jupiter' && Math.abs(new Date(k.dashas[1].endDate.split('-').reverse().join('-')).getTime() - new Date('2047-01-22').getTime()) < 5*86400000, `Jupiter → ${k.dashas[1].endDate} (book 22-01-2047 ±5d)`);
expect(k.dashas[2].lord === 'Saturn' && Math.abs(new Date(k.dashas[2].endDate.split('-').reverse().join('-')).getTime() - new Date('2066-01-22').getTime()) < 5*86400000, `Saturn → ${k.dashas[2].endDate} (book 22-01-2066 ±5d)`);
expect(k.dashas[3].lord === 'Mercury' && Math.abs(new Date(k.dashas[3].endDate.split('-').reverse().join('-')).getTime() - new Date('2083-01-22').getTime()) < 5*86400000, `Mercury → ${k.dashas[3].endDate} (book 22-01-2083 ±5d)`);
console.log(ok ? 'KUNDALI TESTS PASSED' : 'KUNDALI TESTS FAILED');
