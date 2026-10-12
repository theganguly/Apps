/**
 * glossary.ts — registry of explainable terms (Gujarati + English).
 *
 * Key scheme (stable — used by the UI as data-gkey):
 *   tithi, nakshatra, yoga, karan, vaar, paksha, mas, ritu, ayana, samvatsara, …  generic concept
 *   tithi:1..30        a specific tithi (1–15 Sud, 16–29 Vad 1–14, 30 Amavasya)
 *   nakshatra:1..27    yoga:1..27   rashi:1..12   weekday:0..6 (0 = Sunday)
 *   karan:Bava …       choghadiya:Amrit …   hora:Sun …   graha:Saturn …
 *   festival:major …   eclipse:lunar …      plus windows/flags (rahukaal, panchak, …)
 *
 * To add an entry from a plugin: `window.__panchang.glossary.register({...})`.
 */
import {
  NAKSHATRAS, YOGAS, KARANS, RASHIS, GRAHAS, TITHI_GU, TITHI_DEITY_GU, TITHI_DEITY_EN, WEEKDAYS,
  SHUBH_NAKSHATRAS, AMRIT_SIDDHI_NAK, SIDDHI_NAK, WEEKDAY_LORD, type GrahaKey,
} from './data';
import { STATIC_ENTRIES } from './glossary-static';

export type GlossaryCategory =
  | 'panchang' | 'muhurat' | 'inauspicious' | 'graha' | 'nakshatra' | 'tithi' | 'yoga' | 'karan'
  | 'rashi' | 'choghadiya' | 'hora' | 'festival' | 'eclipse' | 'panoti';

export interface GlossaryEntry {
  key: string;
  gu: string; en: string;
  whatGu: string; whatEn: string;
  howGu: string; howEn: string;
  whyGu?: string; whyEn?: string;
  category: GlossaryCategory;
  related?: string[];
}

// ------------------------------------------------------------------ nakshatras (27)
// [deity gu, deity en, lord key, nature index, nature of group]
const NAK_NATURE = [
  { gu: 'ક્ષિપ્ર (લઘુ)', en: 'Kshipra (swift)', useGu: 'વેપાર, ખરીદી-વેચાણ, વિદ્યા-આરંભ, દવા, યાત્રા અને ઝડપી પરિણામવાળાં કાર્ય', useEn: 'trade, buying and selling, beginning study, medicine, travel and quick-result work' },
  { gu: 'મૃદુ (મૈત્ર)', en: 'Mridu (soft)', useGu: 'કલા-સંગીત, વસ્ત્ર-આભૂષણ, મૈત્રી, વિવાહ અને સૌમ્ય કાર્ય', useEn: 'arts and music, clothes and jewellery, friendship, weddings and gentle undertakings' },
  { gu: 'ધ્રુવ (સ્થિર)', en: 'Dhruva (fixed)', useGu: 'પાયો નાખવો, ગૃહ-નિર્માણ, રાજ્યાભિષેક, વૃક્ષારોપણ, મંદિર — સ્થાયી કાર્ય', useEn: 'foundations, house building, coronation, planting trees, temples — lasting works' },
  { gu: 'ચર (ચલ)', en: 'Chara (movable)', useGu: 'યાત્રા, વાહન ખરીદી, સ્થળાંતર અને ગતિશીલ કાર્ય', useEn: 'travel, vehicle purchase, relocation and dynamic work' },
  { gu: 'ઉગ્ર', en: 'Ugra (fierce)', useGu: 'શુભ કાર્ય માટે ટાળવું; કઠોર, લડાયક કે સાહસિક કાર્ય માટે જ', useEn: 'avoid for auspicious work; suits only harsh, combative or daring tasks' },
  { gu: 'તીક્ષ્ણ (દારુણ)', en: 'Tikshna (sharp)', useGu: 'શુભ કાર્ય માટે ટાળવું; તંત્ર-સાધના, વિવાદ, શત્રુ-નિવારણ જેવાં તીક્ષ્ણ કાર્ય માટે', useEn: 'avoid for auspicious work; suited to sharp tasks such as tantra, disputes and countering enemies' },
  { gu: 'મિશ્ર (સાધારણ)', en: 'Mishra (mixed)', useGu: 'સામાન્ય દૈનિક કાર્ય અને અગ્નિ-સંબંધિત કાર્ય; મુખ્ય શુભ કાર્ય માટે મધ્યમ', useEn: 'ordinary daily work and fire-related tasks; middling for major auspicious events' },
];
// per nakshatra (1..27): deity gu/en, lord, nature index
const NAK_ROWS: Array<[string, string, GrahaKey, number]> = [
  ['અશ્વિની કુમારો', 'Ashwini Kumaras', 'Ketu', 0], ['યમ', 'Yama', 'Venus', 4], ['અગ્નિ', 'Agni', 'Sun', 6],
  ['બ્રહ્મા (પ્રજાપતિ)', 'Brahma (Prajapati)', 'Moon', 2], ['ચંદ્ર (સોમ)', 'Soma (Moon)', 'Mars', 1], ['રુદ્ર', 'Rudra', 'Rahu', 5],
  ['અદિતિ', 'Aditi', 'Jupiter', 3], ['બૃહસ્પતિ', 'Brihaspati', 'Saturn', 0], ['સર્પ (નાગ)', 'Nagas', 'Mercury', 5],
  ['પિતૃ', 'Pitris', 'Ketu', 4], ['ભગ', 'Bhaga', 'Venus', 4], ['અર્યમા', 'Aryaman', 'Sun', 2],
  ['સવિતા (સૂર્ય)', 'Savitar (Sun)', 'Moon', 0], ['ત્વષ્ટા (વિશ્વકર્મા)', 'Tvashta (Vishwakarma)', 'Mars', 1], ['વાયુ', 'Vayu', 'Rahu', 3],
  ['ઇન્દ્રાગ્નિ', 'Indra–Agni', 'Jupiter', 6], ['મિત્ર', 'Mitra', 'Saturn', 1], ['ઇન્દ્ર', 'Indra', 'Mercury', 5],
  ['નિરૃતિ', 'Nirriti', 'Ketu', 5], ['આપ (જળ-દેવતા)', 'Apas (waters)', 'Venus', 4], ['વિશ્વેદેવા', 'Vishvadevas', 'Sun', 2],
  ['વિષ્ણુ', 'Vishnu', 'Moon', 3], ['આઠ વસુ', 'The eight Vasus', 'Mars', 3], ['વરુણ', 'Varuna', 'Rahu', 3],
  ['અજ એકપાદ', 'Aja Ekapada', 'Jupiter', 4], ['અહિર્બુધ્ન્ય', 'Ahirbudhnya', 'Saturn', 2], ['પૂષા', 'Pushan', 'Mercury', 1],
];
const GRAHA_EN: Record<string, string> = { Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn', Rahu: 'Rahu', Ketu: 'Ketu', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto' };

function nakshatraEntries(): GlossaryEntry[] {
  return NAK_ROWS.map(([dGu, dEn, lord, nat], i) => {
    const n = i + 1, nk = NAKSHATRAS[i], nature = NAK_NATURE[nat];
    const shubh = SHUBH_NAKSHATRAS.has(n);
    const start = (i * 360 / 27), end = ((i + 1) * 360 / 27);
    const deg = (x: number) => `${Math.floor(x)}°${String(Math.round((x % 1) * 60)).padStart(2, '0')}′`;
    return {
      key: `nakshatra:${n}`, gu: nk.gu, en: nk.en, category: 'nakshatra' as const,
      whatGu: `ક્રમાંક ${n} નું નક્ષત્ર — દેવતા: ${dGu}, સ્વામી ગ્રહ: ${GRAHAS[lord].gu}, પ્રકૃતિ: ${nature.gu}.`,
      whatEn: `Nakshatra no. ${n} — deity: ${dEn}, ruling planet: ${GRAHA_EN[lord]}, nature: ${nature.en}.`,
      howGu: `રાશિચક્રમાં નિરયન ${deg(start)} થી ${deg(end)} સુધીનો ભાગ; ચંદ્ર અહીં હોય ત્યારે આ નક્ષત્ર. વિંશોત્તરી દશા અહીંથી ${GRAHAS[lord].gu} ની ગણાય.`,
      howEn: `Spans sidereal ${deg(start)} to ${deg(end)}; the nakshatra is current while the Moon is here. Its Vimshottari dasha lord is ${GRAHA_EN[lord]}.`,
      whyGu: `${shubh ? 'શુભ કાર્ય માટેના ૧૬ ઉત્તમ નક્ષત્રોમાંનું એક. ' : 'શુભ મુહૂર્ત માટેની મુખ્ય યાદીમાં નથી. '}અનુકૂળ: ${nature.useGu}.`,
      whyEn: `${shubh ? 'One of the 16 nakshatras best for auspicious work. ' : 'Not among the 16 principal muhurta nakshatras. '}Suited to: ${nature.useEn}.`,
      related: ['nakshatra', `graha:${lord}`, 'avakahada'],
    };
  });
}

// ------------------------------------------------------------------ tithis (30)
const TITHI_LINES: Array<[string, string]> = [
  ['નવી શરૂઆત અને અગ્નિ-ઉપાસનાની તિથિ; કારતક સુદ એકમે નૂતન વર્ષ. નંદા તિથિ.', 'A tithi of fresh starts and fire worship; Kartak Sud 1 is the New Year. A Nanda tithi.'],
  ['બ્રહ્મા-પૂજન, નિર્માણ, વિવાહ અને સંસ્કાર માટે અનુકૂળ. ભદ્રા તિથિ; ભાઈબીજ આ તિથિએ.', 'Favourable for building, weddings and sacraments; a Bhadra tithi. Bhai Bij falls on it.'],
  ['ગૌરી-પૂજા અને વિજયદાયી તિથિ — અક્ષય તૃતિયા, હરિતાલિકા. જયા તિથિ.', 'Gauri worship and victory — Akshaya Tritiya, Hartalika. A Jaya tithi.'],
  ['ગણેશ-ઉપાસના — સુદ ચોથ વિનાયક, વદ ચોથ સંકષ્ટી. રિક્તા તિથિ; નવાં શુભ કાર્ય ટાળાય.', 'Ganesha’s tithi — Vinayaka on Sud, Sankashti on Vad. A Rikta tithi; avoid new auspicious starts.'],
  ['નાગ-પૂજા, વિદ્યા અને ઔષધ માટે શુભ — વસંત પંચમી, લાભ પંચમી. પૂર્ણા તિથિ.', 'Good for nag worship, learning and medicine — Vasant Panchami, Labh Pancham. A Purna tithi.'],
  ['કાર્તિકેય-ઉપાસના અને સૂર્ય-ષષ્ઠી; સ્થિર, સામાન્ય કાર્ય માટે ઠીક. નંદા તિથિ.', 'Kartikeya worship and Surya Shashthi; fine for steady, ordinary work. A Nanda tithi.'],
  ['સૂર્ય-ઉપાસના, યાત્રા અને વાહન માટે અનુકૂળ — રથ સપ્તમી. ભદ્રા તિથિ.', 'Good for Surya worship, travel and vehicles — Ratha Saptami. A Bhadra tithi.'],
  ['દુર્ગા-શિવ ઉપાસના — કાલાષ્ટમી, જન્માષ્ટમી; સામાન્ય શુભ કાર્યમાં મધ્યમ. જયા તિથિ.', 'Durga/Shiva worship — Kalashtami, Janmashtami; middling for general auspicious work. A Jaya tithi.'],
  ['શક્તિ-ઉપાસના — રામ નવમી, નવરાત્રી; શુભ આરંભ માટે ટાળાય. રિક્તા તિથિ.', 'Shakti worship — Ram Navami, Navratri; avoided for fresh starts. A Rikta tithi.'],
  ['વિજયાદશમી જેવી વિજયદાયી તિથિ; મોટા ભાગનાં કાર્ય માટે અનુકૂળ. પૂર્ણા તિથિ.', 'A victory tithi as on Vijayadashami; good for most work. A Purna tithi.'],
  ['વિષ્ણુ-ઉપવાસની તિથિ — વર્ષની ૨૪ એકાદશી; ભોજન અને અનાજ ત્યાગનું વ્રત. નંદા તિથિ.', 'The fasting tithi of Vishnu — the year’s 24 Ekadashis; abstaining from grain. A Nanda tithi.'],
  ['વિષ્ણુ-પૂજા અને એકાદશીનું પારણું; દાન-પુણ્ય માટે શુભ. ભદ્રા તિથિ.', 'Vishnu worship and Ekadashi parana; good for charity. A Bhadra tithi.'],
  ['શિવ-પ્રદોષ વ્રતની તિથિ, ધનતેરસ; શુભ સંસ્કાર માટે સારી. જયા તિથિ.', 'The Pradosh Vrat tithi of Shiva, and Dhanteras; good for ceremonies. A Jaya tithi.'],
  ['શિવરાત્રિ અને નરક ચતુર્દશી; શુભ કાર્ય માટે ટાળાય. રિક્તા તિથિ.', 'Shivaratri and Narak Chaturdashi; avoided for auspicious starts. A Rikta tithi.'],
  ['પૂર્ણ ચંદ્ર — સત્યનારાયણ કથા, ગુરુ પૂર્ણિમા, શરદ પૂર્ણિમા જેવાં પર્વ; બધાં શુભ કાર્ય માટે ઉત્તમ. પૂર્ણા તિથિ.', 'Full moon — Satyanarayan katha, Guru Purnima, Sharad Purnima; excellent for all auspicious work. A Purna tithi.'],
];
function tithiEntries(): GlossaryEntry[] {
  const out: GlossaryEntry[] = [];
  for (let t = 1; t <= 30; t++) {
    const n = t <= 15 ? t : t - 15;
    const isAmas = t === 30;
    const sud = t <= 15;
    const nm = TITHI_GU[(isAmas ? 15 : n) - 1] ?? TITHI_GU[14];
    const nameGu = isAmas ? 'વદ અમાસ' : `${sud ? 'સુદ' : 'વદ'} ${nm.gu}`;
    const nameEn = isAmas ? 'Amavasya (new moon)' : `${sud ? 'Sud' : 'Vad'} ${nm.en}`;
    const deity = isAmas ? 15 : n - 1;
    const line = isAmas
      ? ['અમાવસ્યા — પિતૃ તર્પણ, શ્રાદ્ધ અને દાનની તિથિ; નવાં શુભ કાર્ય ટાળાય (દિવાળીની લક્ષ્મી-પૂજા અપવાદ).', 'New moon — for pitru tarpan, shraddha and charity; avoid fresh auspicious starts (Diwali Lakshmi puja is the exception).']
      : TITHI_LINES[n - 1];
    out.push({
      key: `tithi:${t}`, gu: nameGu, en: nameEn, category: 'tithi',
      whatGu: `${sud ? 'શુક્લ' : 'કૃષ્ણ'} પક્ષની ${isAmas ? 'છેલ્લી' : `${n}મી`} તિથિ (તિથિ ક્રમાંક ${t}/૩૦). અધિષ્ઠાતા દેવતા: ${TITHI_DEITY_GU[deity]}.`,
      whatEn: `Tithi ${t} of 30, number ${isAmas ? '15 (last)' : n} of the ${sud ? 'Shukla' : 'Krishna'} paksha. Presiding deity: ${TITHI_DEITY_EN[deity]}.`,
      howGu: `સૂર્ય–ચંદ્રનું અંતર ${(t - 1) * 12}° થી ${t * 12}° ની વચ્ચે હોય ત્યારે આ તિથિ ચાલે; સૂર્યોદયે જે તિથિ ચાલતી હોય તે તે દિવસની તિથિ.`,
      howEn: `Runs while the Sun–Moon elongation is between ${(t - 1) * 12}° and ${t * 12}°; the one running at sunrise names the day.`,
      whyGu: line[0], whyEn: line[1],
      related: ['tithi', 'paksha', ...(isAmas ? ['sutak'] : [])],
    });
  }
  return out;
}

// ------------------------------------------------------------------ yogas (27)
const YOGA_LINES: Array<[string, string]> = [
  ['વિષ્કુંભ — અવરોધ/સ્તંભ. પ્રથમ ૩ ઘડી અશુભ.', 'Vishkambha — obstruction, a pillar. Avoid the first 3 ghatis.'],
  ['પ્રીતિ — સ્નેહ અને સુખ આપનાર; શુભ.', 'Priti — love and pleasure; auspicious.'],
  ['આયુષ્માન — દીર્ઘાયુ આપનાર; શુભ.', 'Ayushman — grants longevity; auspicious.'],
  ['સૌભાગ્ય — સદ્ભાગ્ય અને સમૃદ્ધિ; શુભ.', 'Saubhagya — good fortune and prosperity; auspicious.'],
  ['શોભન — તેજ અને શોભા; શુભ.', 'Shobhana — splendour and grace; auspicious.'],
  ['અતિગંડ — મોટો અવરોધ. પ્રથમ ૬ ઘડી અશુભ.', 'Atiganda — a great obstacle. Avoid the first 6 ghatis.'],
  ['સુકર્મા — સારાં કર્મ; શુભ કાર્ય માટે સારો.', 'Sukarma — good deeds; favourable for auspicious work.'],
  ['ધૃતિ — ધીરજ-સંતોષ; શુભ.', 'Dhriti — steadiness and contentment; auspicious.'],
  ['શૂલ — શૂળ/પીડા. પ્રથમ ૫ ઘડી અશુભ.', 'Shula — a spear, pain. Avoid the first 5 ghatis.'],
  ['ગંડ — ગાંઠ/અવરોધ. પ્રથમ ૬ ઘડી અશુભ.', 'Ganda — a knot, hindrance. Avoid the first 6 ghatis.'],
  ['વૃદ્ધિ — વૃદ્ધિ અને વિકાસ; શુભ.', 'Vriddhi — growth and increase; auspicious.'],
  ['ધ્રુવ — સ્થિર-ટકાઉ; સ્થાયી કાર્ય માટે શુભ.', 'Dhruva — fixed and lasting; good for permanent undertakings.'],
  ['વ્યાઘાત — પ્રહાર/આઘાત. પ્રથમ ૯ ઘડી અશુભ.', 'Vyaghata — a blow, violence. Avoid the first 9 ghatis.'],
  ['હર્ષણ — હર્ષ-આનંદ; શુભ.', 'Harshana — joy and delight; auspicious.'],
  ['વજ્ર — વજ્ર/વીજળી. પ્રથમ ૯ ઘડી અશુભ.', 'Vajra — the thunderbolt. Avoid the first 9 ghatis.'],
  ['સિદ્ધિ — સફળતા આપનાર; શુભ.', 'Siddhi — gives success; auspicious.'],
  ['વ્યતિપાત — આપત્તિ; આખો અશુભ.', 'Vyatipata — calamity; wholly inauspicious.'],
  ['વરીયાન — સુખ-સગવડ; સારો.', 'Variyan — comfort and ease; favourable.'],
  ['પરિઘ — અવરોધ/આગળો. પ્રથમ અર્ધો ભાગ અશુભ.', 'Parigha — a barrier. Avoid the first half.'],
  ['શિવ — કલ્યાણકારી; શુભ.', 'Shiva — benevolent; auspicious.'],
  ['સિદ્ધ — કાર્યસિદ્ધિ; શુભ.', 'Siddha — accomplishment; auspicious.'],
  ['સાધ્ય — સાધી શકાય તેવું; કાર્યસાધક શુભ.', 'Sadhya — attainable; helps tasks succeed.'],
  ['શુભ — નામ પ્રમાણે શુભ.', 'Shubha — auspicious as the name says.'],
  ['શુક્લ — શુદ્ધ, ઉજ્જવળ; શુભ.', 'Shukla — pure and bright; auspicious.'],
  ['બ્રહ્મા — જ્ઞાન-શાંતિ; શુભ.', 'Brahma — knowledge and peace; auspicious.'],
  ['ઐન્દ્ર — ઇન્દ્ર સમાન બળ-સામર્થ્ય; શુભ.', 'Aindra — Indra-like strength and authority; auspicious.'],
  ['વૈધૃતિ — વિખવાદ; આખો અશુભ.', 'Vaidhriti — discord; wholly inauspicious.'],
];
function yogaEntries(): GlossaryEntry[] {
  return YOGAS.map((y, i) => {
    const n = i + 1, bad = !!y.bad;
    const a = (i * 360 / 27), b = ((i + 1) * 360 / 27);
    const fmt = (x: number) => `${Math.floor(x)}°${String(Math.round((x % 1) * 60)).padStart(2, '0')}′`;
    return {
      key: `yoga:${n}`, gu: y.gu, en: y.en, category: 'yoga' as const,
      whatGu: `ક્રમાંક ${n} નો યોગ. ${YOGA_LINES[i][0]}`, whatEn: `Yoga no. ${n}. ${YOGA_LINES[i][1]}`,
      howGu: `નિરયન સૂર્ય + ચંદ્ર રેખાંશનો સરવાળો ${fmt(a)} થી ${fmt(b)} વચ્ચે હોય ત્યારે.`, howEn: `Active while the sum of sidereal Sun and Moon longitudes is between ${fmt(a)} and ${fmt(b)}.`,
      whyGu: bad ? 'અશુભ યોગ — મહત્ત્વનાં શુભ કાર્ય આ ભાગમાં ટાળવાં.' : 'સામાન્ય રીતે શુભ યોગ; શુભ કાર્ય માટે અનુકૂળ.',
      whyEn: bad ? 'An inauspicious yoga — avoid important auspicious work in the flagged part.' : 'A generally favourable yoga; suitable for auspicious work.',
      related: ['yoga', ...(n === 17 ? ['vyatipat'] : n === 27 ? ['vaidhriti'] : [])],
    };
  });
}

// ------------------------------------------------------------------ karans (11)
const KARAN_LINES: Record<string, [string, string, string, string]> = {
  Bava: ['સ્થિર અને શુભ કાર્ય; ચર કરણ ક્રમ ૧', 'steady, auspicious work; movable karan #1', 'ચર કરણ — પૂજા, ગૃહકાર્ય, સંસ્કાર માટે શુભ.', 'A movable karan — good for worship, domestic work and sacraments.'],
  Balava: ['ધર્મ-કર્મ; ચર કરણ ક્રમ ૨', 'religious acts; movable karan #2', 'ચર કરણ — ધાર્મિક વિધિ અને શુભ કાર્ય માટે શુભ.', 'A movable karan — good for rites and auspicious work.'],
  Kaulava: ['મૈત્રી-સંબંધ; ચર કરણ ક્રમ ૩', 'friendship and bonds; movable karan #3', 'ચર કરણ — મૈત્રી, સંબંધ-જોડાણ માટે શુભ.', 'A movable karan — good for friendships and forming bonds.'],
  Taitila: ['સૌમ્ય/સૌભાગ્ય; ચર કરણ ક્રમ ૪', 'gentle, fortunate; movable karan #4', 'ચર કરણ — સૌમ્ય અને માંગલિક કાર્ય માટે શુભ.', 'A movable karan — good for gentle and auspicious tasks.'],
  Gara: ['ખેતી-ઘરકામ; ચર કરણ ક્રમ ૫', 'farming and household; movable karan #5', 'ચર કરણ — ખેતી, ઘર-સંબંધિત કાર્ય માટે સારું.', 'A movable karan — good for farming and home-related work.'],
  Vanija: ['વેપાર-વાણિજ્ય; ચર કરણ ક્રમ ૬', 'trade; movable karan #6', 'ચર કરણ — વેપાર, ખરીદી-વેચાણ માટે શુભ.', 'A movable karan — good for business, buying and selling.'],
  Vishti: ['ભદ્રા; ચર કરણ ક્રમ ૭', 'Bhadra; movable karan #7', 'અશુભ કરણ — શુભ કાર્ય ટાળવાં; શત્રુ-નાશ/વિવાદ જેવાં ઉગ્ર કાર્ય જ ચાલે.', 'An inauspicious karan — avoid auspicious tasks; only harsh tasks such as countering enemies are suited.'],
  Shakuni: ['સ્થિર કરણ; કૃષ્ણ ચતુર્દશીના બીજા અર્ધમાં', 'fixed karan; second half of Krishna Chaturdashi', 'સ્થિર કરણ — શુભ કાર્ય ટાળવાં; ઔષધ-મંત્ર સાધના માટે ચાલે.', 'A fixed karan — avoid auspicious work; fine for medicine and mantra practice.'],
  Chatushpada: ['સ્થિર કરણ; અમાસના પહેલા અર્ધમાં', 'fixed karan; first half of Amavasya', 'સ્થિર કરણ — શુભ કાર્ય ટાળવાં; પિતૃ-પશુ-સંબંધિત કાર્ય માટે.', 'A fixed karan — avoid auspicious work; used for ancestral and cattle-related rites.'],
  Naga: ['સ્થિર કરણ; અમાસના બીજા અર્ધમાં', 'fixed karan; second half of Amavasya', 'સ્થિર કરણ — શુભ કાર્ય ટાળવાં.', 'A fixed karan — avoid auspicious work.'],
  Kimstughna: ['સ્થિર કરણ; સુદ એકમના પહેલા અર્ધમાં', 'fixed karan; first half of Sud Pratipada', 'સ્થિર કરણ — આ એપ તેને શુભ કાર્ય માટે ટાળવા યોગ્ય ગણે છે.', 'A fixed karan — the app flags it as one to avoid for auspicious work.'],
};
function karanEntries(): GlossaryEntry[] {
  return Object.entries(KARANS).map(([k, v]) => {
    const l = KARAN_LINES[k];
    return {
      key: `karan:${k}`, gu: v.gu, en: v.en, category: 'karan' as const,
      whatGu: `${l[0]}.`, whatEn: `${l[1][0].toUpperCase()}${l[1].slice(1)}.`,
      howGu: 'તિથિનો અડધો ભાગ (૬° નું સૂર્ય-ચંદ્ર અંતર); તિથિ દીઠ બે કરણ.', howEn: 'Half a tithi (6° of Sun–Moon elongation); two karans per tithi.',
      whyGu: l[2], whyEn: l[3],
      related: ['karan', ...(k === 'Vishti' ? ['bhadra'] : [])],
    };
  });
}

// ------------------------------------------------------------------ grahas (9)
const GRAHA_INFO: Record<string, { gu: [string, string, string]; en: [string, string, string] }> = {
  Sun: {
    gu: ['આત્મા, પિતા, સત્તા, આરોગ્ય અને પ્રતિષ્ઠાનો કારક.', 'રવિવારનો સ્વામી; એક રાશિમાં ~૧ માસ રહે; કદી વક્રી થતો નથી.', 'સૂર્યોપાસના, અર્ઘ્ય, આદિત્ય હૃદય; સરકારી કામ અને આરોગ્ય-આરંભ માટે રવિવાર/સૂર્ય હોરા.'],
    en: ['Significator of the soul, father, authority, health and status.', 'Lord of Sunday; stays about a month in a sign; never retrograde.', 'Surya worship, arghya, Aditya Hridayam; Sunday/Sun hora suit government work and health beginnings.'],
  },
  Moon: {
    gu: ['મન, માતા, લાગણી અને પ્રજાનો કારક.', 'સોમવારનો સ્વામી; એક રાશિમાં ~૨¼ દિવસ; તિથિ, નક્ષત્ર, પંચક-વિછુડો તેની ગતિથી.', 'ચંદ્ર બળવાન હોય ત્યારે (સુદ પક્ષ) માનસિક શાંતિ અને શુભ કાર્ય અનુકૂળ; શિવ-ઉપાસના.'],
    en: ['Significator of the mind, mother, emotions and the public.', 'Lord of Monday; ~2¼ days per sign; tithi, nakshatra, Panchak and Vinchhudo all come from its motion.', 'A strong (waxing) Moon favours calm and auspicious acts; Shiva worship.'],
  },
  Mars: {
    gu: ['શક્તિ, સાહસ, ભૂમિ, ભાઈ અને શસ્ત્રનો કારક.', 'મંગળવારનો સ્વામી; એક રાશિમાં ~૪૫ દિવસ.', 'હનુમાન-ઉપાસના; જમીન, સ્પર્ધા માટે બળ; લગ્ન-સંબંધિત મંગળ દોષ કુંડળીમાં જોવાય.'],
    en: ['Significator of energy, courage, land, brothers and weapons.', 'Lord of Tuesday; ~45 days per sign.', 'Hanuman worship; strength for land and contests; “Mangal dosha” is checked in horoscope matching.'],
  },
  Mercury: {
    gu: ['બુદ્ધિ, વાણી, વેપાર, ગણિત અને લેખનનો કારક.', 'બુધવારનો સ્વામી; એક રાશિમાં ~૧ માસ; વર્ષમાં ૩-૪ વાર વક્રી.', 'ગણેશ-ઉપાસના; બુધ હોરા વેપાર, કરાર, વિદ્યા માટે; વક્રી સમયે સમીક્ષા, નવા કરાર ટાળવાની પ્રથા.'],
    en: ['Significator of intellect, speech, trade, mathematics and writing.', 'Lord of Wednesday; ~1 month per sign; retrograde 3–4 times a year.', 'Ganesha worship; Mercury hora for trade, contracts and study; many avoid new contracts when it is retrograde.'],
  },
  Jupiter: {
    gu: ['જ્ઞાન, ધર્મ, સંતાન, ગુરુ અને ધનનો કારક; સૌથી શુભ ગ્રહ.', 'ગુરુવારનો સ્વામી; એક રાશિમાં ~૧૩ માસ; વર્ષે ~૪ માસ વક્રી.', 'વિવાહ-ગુરુ બળ; ગુરુ અસ્ત/વક્રી સમયે લગ્ન ટાળવાની પરંપરા; વિષ્ણુ-બૃહસ્પતિ પૂજા.'],
    en: ['Significator of wisdom, dharma, children, the guru and wealth; the great benefic.', 'Lord of Thursday; ~13 months per sign; retrograde ~4 months a year.', 'Jupiter’s strength is needed for weddings; many avoid marriages when it is combust or retrograde; Vishnu/Brihaspati worship.'],
  },
  Venus: {
    gu: ['પ્રેમ, લગ્નજીવન, કલા, સુખ-સગવડ અને વાહનનો કારક.', 'શુક્રવારનો સ્વામી; એક રાશિમાં ~૧ માસ; ~૪૦ દિવસ વક્રી.', 'લક્ષ્મી/શુક્ર પૂજા; લગ્ન અને ખરીદી માટે શુક્ર બળવાન જોઈએ — અસ્ત સમયે (શુક્ર અસ્ત) લગ્ન વર્જ્ય.'],
    en: ['Significator of love, marriage, arts, comforts and vehicles.', 'Lord of Friday; ~1 month per sign; retrograde ~40 days.', 'Lakshmi/Shukra worship; Venus must be strong for weddings and purchases — marriages are avoided when it is combust.'],
  },
  Saturn: {
    gu: ['કર્મ, શિસ્ત, વિલંબ, શ્રમ અને ન્યાયનો કારક.', 'શનિવારનો સ્વામી; એક રાશિમાં ~૨½ વર્ષ; વર્ષે ~૪½ માસ વક્રી.', 'શનિ-હનુમાન ઉપાસના, તેલ-દાન; સાડાસાતી-ઢૈયા શનિના ગોચરથી.'],
    en: ['Significator of karma, discipline, delay, labour and justice.', 'Lord of Saturday; ~2½ years per sign; retrograde ~4½ months a year.', 'Shani/Hanuman worship and oil charity; Sade-Sati and Dhaiya arise from its transit.'],
  },
  Rahu: {
    gu: ['છાયા-ગ્રહ (ચંદ્રનો ઉત્તર નોડ); મોહ, વિદેશ, અચાનક ફેરફારનો કારક.', 'આ એપ મધ્યમ નોડ ગણે છે — હંમેશા વક્રી, ~૧૮ માસ એક રાશિમાં, ચક્ર ~૧૮.૬ વર્ષ.', 'રાહુકાળ તેનું દૈનિક રૂપ; ગ્રહણ રાહુ-કેતુ અક્ષ પર થાય; દુર્ગા/શિવ ઉપાસના.'],
    en: ['A shadow planet (the Moon’s north node); signifies obsession, foreign matters and sudden change.', 'The app uses the mean node — always retrograde, ~18 months per sign, a ~18.6-year cycle.', 'Rahu Kaal is its daily window; eclipses occur on the Rahu–Ketu axis; Durga/Shiva worship.'],
  },
  Uranus: {
    gu: ['આધુનિક (અતિ-શનિ) ગ્રહ — પરંપરાગત નવ ગ્રહોમાં નથી; અચાનક ફેરફાર, નવીનતા અને ટેકનોલોજી સાથે જોડાય છે.', 'એક રાશિમાં ~૭ વર્ષ; સૂર્ય પ્રદક્ષિણા ~૮૪ વર્ષ; વક્રી ગતિ વર્ષે ~૫ માસ.', 'શાસ્ત્રીય મુહૂર્તમાં ગણાતો નથી; પંચાંગમાં માત્ર જાણકારી માટે ગોચર દર્શાવાય.'],
    en: ['A modern outer planet — not one of the classical nine grahas; associated with sudden change, innovation and technology.', '~7 years per sign; ~84-year orbit; retrograde ~5 months a year.', 'Not used in classical muhurta; shown for information only.'],
  },
  Neptune: {
    gu: ['આધુનિક બાહ્ય ગ્રહ — પરંપરાગત નવ ગ્રહોમાં નથી; કલ્પના, આધ્યાત્મિકતા અને ભ્રમ સાથે જોડાય છે.', 'એક રાશિમાં ~૧૪ વર્ષ; સૂર્ય પ્રદક્ષિણા ~૧૬૫ વર્ષ.', 'શાસ્ત્રીય મુહૂર્તમાં ગણાતો નથી; માત્ર જાણકારી માટે.'],
    en: ['A modern outer planet — not one of the classical nine grahas; associated with imagination, spirituality and illusion.', '~14 years per sign; ~165-year orbit.', 'Not used in classical muhurta; shown for information only.'],
  },
  Pluto: {
    gu: ['આધુનિક બાહ્ય (વામન) ગ્રહ — પરંપરાગત નવ ગ્રહોમાં નથી; પરિવર્તન, સત્તા-સંઘર્ષ અને પુનર્જન્મ સાથે જોડાય છે.', 'એક રાશિમાં ~૧૨–૩૦ વર્ષ (અનિયમિત કક્ષા); સૂર્ય પ્રદક્ષિણા ~૨૪૮ વર્ષ.', 'શાસ્ત્રીય મુહૂર્તમાં ગણાતો નથી; માત્ર જાણકારી માટે.'],
    en: ['A modern outer (dwarf) planet — not one of the classical nine grahas; associated with transformation, power struggles and rebirth.', '~12–30 years per sign (eccentric orbit); ~248-year orbit.', 'Not used in classical muhurta; shown for information only.'],
  },
  Ketu: {
    gu: ['છાયા-ગ્રહ (ચંદ્રનો દક્ષિણ નોડ); વૈરાગ્ય, મોક્ષ, તંત્રનો કારક.', 'હંમેશા રાહુથી ૧૮૦° સામે; વક્રી ગતિ.', 'ગણેશ-ઉપાસના; વિંશોત્તરીમાં કેતુ દશા ૭ વર્ષ.'],
    en: ['A shadow planet (the Moon’s south node); signifies detachment, moksha and the occult.', 'Always 180° opposite Rahu; retrograde motion.', 'Ganesha worship; Ketu’s dasha lasts 7 years in Vimshottari.'],
  },
};
function grahaEntries(): GlossaryEntry[] {
  return Object.keys(GRAHA_INFO).map((k) => {
    const g = GRAHAS[k as GrahaKey], info = GRAHA_INFO[k];
    return {
      key: `graha:${k}`, gu: g.gu, en: g.en, category: 'graha' as const,
      whatGu: info.gu[0], whatEn: info.en[0], howGu: info.gu[1], howEn: info.en[1], whyGu: info.gu[2], whyEn: info.en[2],
      related: ['retro', ...(k === 'Saturn' ? ['panoti'] : []), ...(k === 'Moon' ? ['moonRashi'] : []), ...(k === 'Rahu' ? ['rahukaal'] : [])],
    };
  });
}

// ------------------------------------------------------------------ rashis (12)
const ELEMENT_EN: Record<string, string> = { 'અગ્નિ': 'Fire', 'ભૂમિ': 'Earth', 'વાયુ': 'Air', 'વારિ': 'Water' };
const NATURE_EN: Record<string, string> = { 'ચર': 'Movable (Chara)', 'સ્થિર': 'Fixed (Sthira)', 'દ્વિસ્વભાવ': 'Dual (Dvisvabhava)' };
const LORD_EN: Record<string, string> = { 'મંગળ': 'Mars', 'શુક્ર': 'Venus', 'બુધ': 'Mercury', 'ચંદ્ર': 'Moon', 'સૂર્ય': 'Sun', 'ગુરુ': 'Jupiter', 'શનિ': 'Saturn' };
const DIR_EN: Record<string, string> = { 'પૂર્વ': 'East', 'દક્ષિણ': 'South', 'પશ્ચિમ': 'West', 'ઉત્તર': 'North' };
const BODY: Array<[string, string]> = [
  ['માથું', 'head'], ['મુખ અને ગળું', 'face and throat'], ['ખભા અને હાથ', 'shoulders and arms'], ['છાતી', 'chest'],
  ['હૃદય અને ઉપલું પેટ', 'heart and upper abdomen'], ['કમર અને પેટ', 'waist and digestive tract'], ['નીચલું પેટ અને કિડની', 'lower abdomen and kidneys'],
  ['ગુપ્ત અંગો', 'reproductive organs'], ['જાંઘ', 'thighs'], ['ઘૂંટણ', 'knees'], ['પિંડી અને પગની નળી', 'calves and shins'], ['પગ', 'feet'],
];
function rashiEntries(): GlossaryEntry[] {
  return RASHIS.map((r, i) => {
    const n = i + 1;
    return {
      key: `rashi:${n}`, gu: r.gu, en: r.en, category: 'rashi' as const,
      whatGu: `રાશિ ક્રમાંક ${n} — સ્વામી: ${r.lord}, તત્ત્વ: ${r.element}, પ્રકૃતિ: ${r.nature}, દિશા: ${r.dir}, શરીરનો ભાગ: ${BODY[i][0]}.`,
      whatEn: `Sign no. ${n} — ruler: ${LORD_EN[r.lord]}, element: ${ELEMENT_EN[r.element]}, quality: ${NATURE_EN[r.nature]}, direction: ${DIR_EN[r.dir]}, body part: ${BODY[i][1]}.`,
      howGu: `નિરયન રાશિચક્રનો ${(i * 30)}° થી ${(n * 30)}° નો ભાગ; ચંદ્ર/સૂર્ય/ગ્રહ આ કોણમાં હોય ત્યારે તે રાશિમાં ગણાય. સૂર્યનો પ્રવેશ = સંક્રાંતિ.`,
      howEn: `The ${i * 30}°–${n * 30}° arc of the sidereal zodiac; a body in that arc is “in” the sign. The Sun’s entry is a sankranti.`,
      whyGu: `રત્ન: ${r.gem}, શુભ રંગ: ${r.color}. ${r.nature === 'ચર' ? 'ચર રાશિ — નવી શરૂઆત અને ગતિશીલ કાર્ય.' : r.nature === 'સ્થિર' ? 'સ્થિર રાશિ — સ્થાયી કાર્ય.' : 'દ્વિસ્વભાવ — મિશ્ર ફળ, ફેરફાર-સ્વીકાર.'}${n === 11 || n === 12 ? ' ચંદ્ર અહીં હોય ત્યારે પંચક.' : n === 8 ? ' ચંદ્ર અહીં હોય ત્યારે વિછુડો.' : ''}`,
      whyEn: `Gem: ${r.gem}, colour: ${r.color}. ${r.nature === 'ચર' ? 'A movable sign — beginnings and dynamic action.' : r.nature === 'સ્થિર' ? 'A fixed sign — lasting undertakings.' : 'A dual sign — mixed results, adaptability.'}${n === 11 || n === 12 ? ' Panchak when the Moon is here.' : n === 8 ? ' Vinchhudo when the Moon is here.' : ''}`,
      related: ['moonRashi', `graha:${LORD_EN[r.lord]}`, ...(n === 11 || n === 12 ? ['panchak'] : n === 8 ? ['vinchhudo'] : [])],
    };
  });
}

// ------------------------------------------------------------------ weekdays (7)
const WD_NOTE: Array<[string, string]> = [
  ['સૂર્ય-પૂજા, આરોગ્ય-આરંભ, સરકારી કામ; રંગ: લાલ/કેસરી.', 'Sun worship, health beginnings, government work; colour: red/saffron.'],
  ['શિવ-પૂજા, માનસિક શાંતિ, પ્રવાસ-આરંભ; રંગ: સફેદ.', 'Shiva worship, mental calm, starting journeys; colour: white.'],
  ['હનુમાન-પૂજા, જમીન-મિલકત, સાહસિક કાર્ય; રંગ: લાલ.', 'Hanuman worship, property, bold undertakings; colour: red.'],
  ['ગણેશ/વિષ્ણુ પૂજા, વેપાર, ભણતર, હિસાબ; રંગ: લીલો.', 'Ganesha/Vishnu worship, trade, study, accounts; colour: green.'],
  ['ગુરુ-બૃહસ્પતિ પૂજા, વિવાહ-વાટાઘાટ, શુભ કાર્ય; રંગ: પીળો.', 'Guru/Brihaspati worship, wedding talks, auspicious work; colour: yellow.'],
  ['લક્ષ્મી-પૂજા, કલા, ખરીદી, લગ્ન-સંબંધી કાર્ય; રંગ: સફેદ/ગુલાબી.', 'Lakshmi worship, arts, shopping, marriage matters; colour: white/pink.'],
  ['શનિ-હનુમાન પૂજા, શ્રમ-કાર્ય, દાન; રંગ: કાળો/ભૂરો. નવાં શુભ કાર્ય ઓછાં.', 'Shani/Hanuman worship, labour, charity; colour: black/dark blue. Fewer new auspicious starts.'],
];
function weekdayEntries(): GlossaryEntry[] {
  return WEEKDAYS.map((w, i) => ({
    key: `weekday:${i}`, gu: w.gu, en: w.en, category: 'panchang' as const,
    whatGu: `સ્વામી ગ્રહ: ${GRAHAS[WEEKDAY_LORD[i]].gu}. ${WD_NOTE[i][0]}`, whatEn: `Ruling planet: ${GRAHA_EN[WEEKDAY_LORD[i]]}. ${WD_NOTE[i][1]}`,
    howGu: 'સૂર્યોદયથી આગામી સૂર્યોદય સુધી આ વાર ચાલે; ચોઘડિયું, હોરા અને રાહુકાળ આ વાર પરથી.', howEn: 'The vaar runs from sunrise to the next sunrise; choghadiya, hora and Rahu Kaal all follow it.',
    whyGu: `અમૃત સિદ્ધિ યોગ: ${NAKSHATRAS[AMRIT_SIDDHI_NAK[i] - 1].gu} નક્ષત્ર સાથે; સિદ્ધિ યોગ: ${NAKSHATRAS[SIDDHI_NAK[i] - 1].gu} સાથે.`,
    whyEn: `Amrit Siddhi yoga with ${NAKSHATRAS[AMRIT_SIDDHI_NAK[i] - 1].en}; Siddhi yoga with ${NAKSHATRAS[SIDDHI_NAK[i] - 1].en}.`,
    related: ['vaar', `graha:${WEEKDAY_LORD[i]}`, 'rahukaal', 'choghadiya'],
  }));
}

// ------------------------------------------------------------------ registry
let REG: Map<string, GlossaryEntry> | null = null;
const EXTRA: GlossaryEntry[] = [];
function build(): Map<string, GlossaryEntry> {
  const m = new Map<string, GlossaryEntry>();
  for (const list of [STATIC_ENTRIES, nakshatraEntries(), tithiEntries(), yogaEntries(), karanEntries(), grahaEntries(), rashiEntries(), weekdayEntries(), EXTRA]) {
    for (const e of list) m.set(e.key, e);
  }
  return m;
}
export function glossaryEntry(key: string): GlossaryEntry | undefined {
  if (!REG) REG = build();
  return REG.get(key);
}
export function glossaryAll(): GlossaryEntry[] {
  if (!REG) REG = build();
  return [...REG.values()];
}
/** Add or replace an entry at runtime (plugins). */
export function registerGlossaryEntry(e: GlossaryEntry): void {
  EXTRA.push(e);
  if (REG) REG.set(e.key, e);
}

/** Keys convenience used by the UI so the mapping from computed values → glossary keys lives in one place. */
export const gk = {
  tithi: (tithiFull: number) => `tithi:${tithiFull}`,
  nakshatra: (n: number) => `nakshatra:${n}`,
  yoga: (n: number) => `yoga:${n}`,
  karan: (name: string) => `karan:${name}`,
  rashi: (n1: number) => `rashi:${n1}`,
  weekday: (wd: number) => `weekday:${wd}`,
  graha: (k: string) => `graha:${k}`,
  chog: (k: string) => `choghadiya:${k}`,
  hora: (k: string) => `hora:${k}`,
};
