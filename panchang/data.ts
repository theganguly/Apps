/**
 * data.ts — static name tables (Gujarati / English) from the Harilal Panchang spec.
 */

export const GU_DIGITS = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
export function toGuDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => GU_DIGITS[+d]);
}

export const WEEKDAYS = [
  { gu: 'રવિવાર', guShort: 'રવિ', en: 'Sunday', enShort: 'Sun' },
  { gu: 'સોમવાર', guShort: 'સોમ', en: 'Monday', enShort: 'Mon' },
  { gu: 'મંગળવાર', guShort: 'મંગળ', en: 'Tuesday', enShort: 'Tue' },
  { gu: 'બુધવાર', guShort: 'બુધ', en: 'Wednesday', enShort: 'Wed' },
  { gu: 'ગુરુવાર', guShort: 'ગુરુ', en: 'Thursday', enShort: 'Thu' },
  { gu: 'શુક્રવાર', guShort: 'શુક્ર', en: 'Friday', enShort: 'Fri' },
  { gu: 'શનિવાર', guShort: 'શનિ', en: 'Saturday', enShort: 'Sat' },
];

/** Gujarati lunar months, Kartak first (index 0 = Kartak … 11 = Aaso). */
export const MONTHS_GU = [
  { gu: 'કારતક', en: 'Kartak', vedic: 'ઊર્જ', devi: 'રાધા', devata: 'દામોદર' },
  { gu: 'માગશર', en: 'Magshar', vedic: 'સહસ્', devi: 'વિશાલાક્ષી', devata: 'કેશવ' },
  { gu: 'પોષ', en: 'Posh', vedic: 'સહસ્ય', devi: 'લક્ષ્મી', devata: 'નારાયણ' },
  { gu: 'મહા', en: 'Maha', vedic: 'તપસ્', devi: 'રૂક્મણી', devata: 'માધવ' },
  { gu: 'ફાગણ', en: 'Fagan', vedic: 'તપસ્ય', devi: 'ધાત્રી', devata: 'ગોવિંદ' },
  { gu: 'ચૈત્ર', en: 'Chaitra', vedic: 'મધુ', devi: 'રમા', devata: 'વિષ્ણુ' },
  { gu: 'વૈશાખ', en: 'Vaishakh', vedic: 'માધવ', devi: 'મોહિની', devata: 'મધુસૂદન' },
  { gu: 'જેઠ', en: 'Jeth', vedic: 'શુક્ર', devi: 'પદ્માક્ષી', devata: 'ત્રિવિક્રમ' },
  { gu: 'અષાઢ', en: 'Ashadh', vedic: 'શુચિ', devi: 'કમલા', devata: 'વામન' },
  { gu: 'શ્રાવણ', en: 'Shravan', vedic: 'નભસ', devi: 'કાંતિમતિ', devata: 'શ્રીધર' },
  { gu: 'ભાદરવો', en: 'Bhadarvo', vedic: 'નભસ્ય', devi: 'અપરાજિત', devata: 'ઋષિકેશ' },
  { gu: 'આસો', en: 'Aaso', vedic: 'ઇષ', devi: 'પદ્માવતી', devata: 'પદ્મનાભ' },
];
/** Sun's sidereal rashi at new moon → month index (rashi 0..11 → MONTHS_GU index). */
export const SUN_RASHI_TO_MONTH: Record<number, number> = {
  11: 5, 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 0, 7: 1, 8: 2, 9: 3, 10: 4,
};

export const PAKSHA = { sud: { gu: 'શુક્લ પક્ષ', guShort: 'સુદ', en: 'Shukla' }, vad: { gu: 'કૃષ્ણ પક્ષ', guShort: 'વદ', en: 'Krishna' } };

/** Tithi display names 1..15 (30 = Amas handled separately). */
export const TITHI_GU = [
  { gu: 'એકમ', formal: 'પ્રતિપદા', en: 'Pratipada' },
  { gu: 'બીજ', formal: 'દ્વિતીયા', en: 'Dvitiya' },
  { gu: 'ત્રીજ', formal: 'તૃતીયા', en: 'Tritiya' },
  { gu: 'ચોથ', formal: 'ચતુર્થી', en: 'Chaturthi' },
  { gu: 'પાંચમ', formal: 'પંચમી', en: 'Panchami' },
  { gu: 'છઠ્ઠ', formal: 'ષષ્ઠી', en: 'Shashthi' },
  { gu: 'સાતમ', formal: 'સપ્તમી', en: 'Saptami' },
  { gu: 'આઠમ', formal: 'અષ્ટમી', en: 'Ashtami' },
  { gu: 'નોમ', formal: 'નવમી', en: 'Navami' },
  { gu: 'દસમ', formal: 'દશમી', en: 'Dashami' },
  { gu: 'અગિયારસ', formal: 'એકાદશી', en: 'Ekadashi' },
  { gu: 'બારસ', formal: 'દ્વાદશી', en: 'Dvadashi' },
  { gu: 'તેરસ', formal: 'ત્રયોદશી', en: 'Trayodashi' },
  { gu: 'ચૌદસ', formal: 'ચતુર્દશી', en: 'Chaturdashi' },
  { gu: 'પૂનમ', formal: 'પૂર્ણિમા', en: 'Purnima' },
];
export const AMAS = { gu: 'અમાસ', formal: 'અમાવસ્યા', en: 'Amavasya' };

/** Tithi deities (§13.9), index 0 = Pratipada … 14 = Purnima, 15 = Amas. */
export const TITHI_DEITY_GU = ['અગ્નિ', 'બ્રહ્મા', 'ગૌરી', 'ગણેશ', 'શેષનાગ', 'કાર્તિકેય', 'સૂર્ય', 'શિવ', 'દુર્ગા', 'કાલ (યમ)', 'વિશ્વેદેવા', 'વિષ્ણુ', 'કામદેવ', 'શિવ', 'ચંદ્ર', 'પિતૃ'];

export const NAKSHATRAS = [
  { gu: 'અશ્વિની', en: 'Ashwini' }, { gu: 'ભરણી', en: 'Bharani' }, { gu: 'કૃતિકા', en: 'Krittika' },
  { gu: 'રોહિણી', en: 'Rohini' }, { gu: 'મૃગશીર્ષ', en: 'Mrigashira' }, { gu: 'આર્દ્રા', en: 'Ardra' },
  { gu: 'પુનર્વસુ', en: 'Punarvasu' }, { gu: 'પુષ્ય', en: 'Pushya' }, { gu: 'આશ્લેષા', en: 'Ashlesha' },
  { gu: 'મઘા', en: 'Magha' }, { gu: 'પૂર્વા ફાલ્ગુની', en: 'Purva Phalguni' }, { gu: 'ઉત્તરા ફાલ્ગુની', en: 'Uttara Phalguni' },
  { gu: 'હસ્ત', en: 'Hasta' }, { gu: 'ચિત્રા', en: 'Chitra' }, { gu: 'સ્વાતિ', en: 'Swati' },
  { gu: 'વિશાખા', en: 'Vishakha' }, { gu: 'અનુરાધા', en: 'Anuradha' }, { gu: 'જ્યેષ્ઠા', en: 'Jyeshtha' },
  { gu: 'મૂળ', en: 'Mula' }, { gu: 'પૂર્વાષાઢા', en: 'Purva Ashadha' }, { gu: 'ઉત્તરાષાઢા', en: 'Uttara Ashadha' },
  { gu: 'શ્રવણ', en: 'Shravana' }, { gu: 'ધનિષ્ઠા', en: 'Dhanishtha' }, { gu: 'શતભિષા', en: 'Shatabhisha' },
  { gu: 'પૂર્વા ભાદ્રપદ', en: 'Purva Bhadrapada' }, { gu: 'ઉત્તરા ભાદ્રપદ', en: 'Uttara Bhadrapada' }, { gu: 'રેવતી', en: 'Revati' },
];

export const YOGAS = [
  { gu: 'વિષ્કુંભ', en: 'Vishkambha', bad: 'first 3 ghati' }, { gu: 'પ્રીતિ', en: 'Priti' }, { gu: 'આયુષ્માન', en: 'Ayushman' },
  { gu: 'સૌભાગ્ય', en: 'Saubhagya' }, { gu: 'શોભન', en: 'Shobhana' }, { gu: 'અતિગંડ', en: 'Atiganda', bad: 'first 6 ghati' },
  { gu: 'સુકર્મા', en: 'Sukarma' }, { gu: 'ધૃતિ', en: 'Dhriti' }, { gu: 'શૂલ', en: 'Shula', bad: 'first 5 ghati' },
  { gu: 'ગંડ', en: 'Ganda', bad: 'first 6 ghati' }, { gu: 'વૃદ્ધિ', en: 'Vriddhi' }, { gu: 'ધ્રુવ', en: 'Dhruva' },
  { gu: 'વ્યાઘાત', en: 'Vyaghata', bad: 'first 9 ghati' }, { gu: 'હર્ષણ', en: 'Harshana' }, { gu: 'વજ્ર', en: 'Vajra', bad: 'first 9 ghati' },
  { gu: 'સિદ્ધિ', en: 'Siddhi' }, { gu: 'વ્યતિપાત', en: 'Vyatipata', bad: 'full' }, { gu: 'વરીયાન', en: 'Variyan' },
  { gu: 'પરિઘ', en: 'Parigha', bad: 'first half' }, { gu: 'શિવ', en: 'Shiva' }, { gu: 'સિદ્ધ', en: 'Siddha' },
  { gu: 'સાધ્ય', en: 'Sadhya' }, { gu: 'શુભ', en: 'Shubha' }, { gu: 'શુક્લ', en: 'Shukla' },
  { gu: 'બ્રહ્મા', en: 'Brahma' }, { gu: 'ઐન્દ્ર', en: 'Aindra' }, { gu: 'વૈધૃતિ', en: 'Vaidhriti', bad: 'full' },
];

export const KARANS: Record<string, { gu: string; en: string; good: boolean }> = {
  Kimstughna: { gu: 'કિંસ્તુઘ્ન', en: 'Kimstughna', good: false },
  Bava: { gu: 'બવ', en: 'Bava', good: true },
  Balava: { gu: 'બાલવ', en: 'Balava', good: true },
  Kaulava: { gu: 'કૌલવ', en: 'Kaulava', good: true },
  Taitila: { gu: 'તૈતિલ', en: 'Taitila', good: true },
  Gara: { gu: 'ગર', en: 'Gara', good: true },
  Vanija: { gu: 'વણિજ', en: 'Vanija', good: true },
  Vishti: { gu: 'વિષ્ટિ (ભદ્રા)', en: 'Vishti (Bhadra)', good: false },
  Shakuni: { gu: 'શકુનિ', en: 'Shakuni', good: false },
  Chatushpada: { gu: 'ચતુષ્પાદ', en: 'Chatushpada', good: false },
  Naga: { gu: 'નાગ', en: 'Naga', good: false },
};
export const KARANA_MOVABLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
export function karanaName(n: number): string { // n = 1..60
  if (n === 1) return 'Kimstughna';
  if (n >= 58) return ['Shakuni', 'Chatushpada', 'Naga'][n - 58];
  return KARANA_MOVABLE[(n - 2) % 7];
}

export const RASHIS = [
  { gu: 'મેષ', en: 'Mesha (Aries)', lord: 'મંગળ', element: 'અગ્નિ', dir: 'પૂર્વ', color: 'લાલ', gem: 'પરવાળું', nature: 'ચર' },
  { gu: 'વૃષભ', en: 'Vrushabh (Taurus)', lord: 'શુક્ર', element: 'ભૂમિ', dir: 'દક્ષિણ', color: 'ફિક્કો બ્લુ', gem: 'હીરો', nature: 'સ્થિર' },
  { gu: 'મિથુન', en: 'Mithun (Gemini)', lord: 'બુધ', element: 'વાયુ', dir: 'પશ્ચિમ', color: 'પીળો', gem: 'પાનું', nature: 'દ્વિસ્વભાવ' },
  { gu: 'કર્ક', en: 'Kark (Cancer)', lord: 'ચંદ્ર', element: 'વારિ', dir: 'ઉત્તર', color: 'લીલો', gem: 'મોતી', nature: 'ચર' },
  { gu: 'સિંહ', en: 'Simha (Leo)', lord: 'સૂર્ય', element: 'અગ્નિ', dir: 'પૂર્વ', color: 'નારંગી', gem: 'માણેક', nature: 'સ્થિર' },
  { gu: 'કન્યા', en: 'Kanya (Virgo)', lord: 'બુધ', element: 'ભૂમિ', dir: 'દક્ષિણ', color: 'ફિક્કો કાળો', gem: 'પાનું', nature: 'દ્વિસ્વભાવ' },
  { gu: 'તુલા', en: 'Tula (Libra)', lord: 'શુક્ર', element: 'વાયુ', dir: 'પશ્ચિમ', color: 'ક્રીમ / સફેદ', gem: 'હીરો', nature: 'ચર' },
  { gu: 'વૃશ્ચિક', en: 'Vrushchik (Scorpio)', lord: 'મંગળ', element: 'વારિ', dir: 'ઉત્તર', color: 'તેજ લાલ', gem: 'પરવાળું', nature: 'સ્થિર' },
  { gu: 'ધન', en: 'Dhan (Sagittarius)', lord: 'ગુરુ', element: 'અગ્નિ', dir: 'પૂર્વ', color: 'પીળો', gem: 'પોખરાજ', nature: 'દ્વિસ્વભાવ' },
  { gu: 'મકર', en: 'Makar (Capricorn)', lord: 'શનિ', element: 'ભૂમિ', dir: 'દક્ષિણ', color: 'કાળાશ પડતો', gem: 'નીલમ', nature: 'ચર' },
  { gu: 'કુંભ', en: 'Kumbh (Aquarius)', lord: 'શનિ', element: 'વાયુ', dir: 'પશ્ચિમ', color: 'આસમાની', gem: 'નીલમ', nature: 'સ્થિર' },
  { gu: 'મીન', en: 'Meen (Pisces)', lord: 'ગુરુ', element: 'વારિ', dir: 'ઉત્તર', color: 'તેજ સફેદ', gem: 'પોખરાજ', nature: 'દ્વિસ્વભાવ' },
];

export const CHOGHADIYA = [
  { key: 'Udveg', gu: 'ઉદ્વેગ', en: 'Udveg', good: false },
  { key: 'Chal', gu: 'ચલ', en: 'Chal', good: true },
  { key: 'Labh', gu: 'લાભ', en: 'Labh', good: true },
  { key: 'Amrit', gu: 'અમૃત', en: 'Amrit', good: true },
  { key: 'Kaal', gu: 'કાળ', en: 'Kaal', good: false },
  { key: 'Shubh', gu: 'શુભ', en: 'Shubh', good: true },
  { key: 'Rog', gu: 'રોગ', en: 'Rog', good: false },
];

export const GRAHAS = {
  Sun: { gu: 'સૂર્ય', guShort: 'સૂ', en: 'Sun', goodHora: false },
  Moon: { gu: 'ચંદ્ર', guShort: 'ચં', en: 'Moon', goodHora: true },
  Mars: { gu: 'મંગળ', guShort: 'મં', en: 'Mars', goodHora: false },
  Mercury: { gu: 'બુધ', guShort: 'બુ', en: 'Mercury', goodHora: true },
  Jupiter: { gu: 'ગુરુ', guShort: 'ગુ', en: 'Jupiter', goodHora: true },
  Venus: { gu: 'શુક્ર', guShort: 'શુ', en: 'Venus', goodHora: true },
  Saturn: { gu: 'શનિ', guShort: 'શ', en: 'Saturn', goodHora: false },
  Rahu: { gu: 'રાહુ', guShort: 'રા', en: 'Rahu', goodHora: false },
  Ketu: { gu: 'કેતુ', guShort: 'કે', en: 'Ketu', goodHora: false },
  Uranus: { gu: 'હર્ષલ', guShort: 'હ', en: 'Uranus', goodHora: false },
  Neptune: { gu: 'નેપ્ચ્યુન', guShort: 'ને', en: 'Neptune', goodHora: false },
  Pluto: { gu: 'પ્લૂટો', guShort: 'પ્લુ', en: 'Pluto', goodHora: false },
} as const;
export type GrahaKey = keyof typeof GRAHAS;

export const HORA_ORDER: GrahaKey[] = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
export const WEEKDAY_LORD: GrahaKey[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Sun=0

export const RITUS = [
  { gu: 'શિશિર', en: 'Shishir' }, { gu: 'વસંત', en: 'Vasant' }, { gu: 'ગ્રીષ્મ', en: 'Grishma' },
  { gu: 'વર્ષા', en: 'Varsha' }, { gu: 'શરદ', en: 'Sharad' }, { gu: 'હેમંત', en: 'Hemant' },
];

export const SAMVATSARAS_GU = [
  'પ્રભવ', 'વિભવ', 'શુક્લ', 'પ્રમોદ', 'પ્રજાપતિ', 'અંગિરા', 'શ્રીમુખ', 'ભવ', 'યુવ', 'ધાત્રી',
  'ઈશ્વર', 'બહુધાન્ય', 'પ્રમાથી', 'વિક્રમ', 'વૃષ', 'ચિત્રભાનુ', 'સુભાનુ', 'તારણ', 'પાર્થિવ', 'વ્યય',
  'સર્વજિત્', 'સર્વધારી', 'વિરોધી', 'વિકૃતિ', 'ખર', 'નંદન', 'વિજય', 'જય', 'મન્મથ', 'દુર્મુખી',
  'હેવિલંબી', 'વિલંબી', 'વિકારી', 'શાર્વરી', 'પ્લવ', 'શુભકૃત્', 'શોભકૃત્', 'ક્રોધી', 'વિશ્વાવસુ', 'પરાભવ',
  'પ્લવંગ', 'કીલક', 'સૌમ્ય', 'સાધારણ', 'વિરોધકૃત્', 'પરિધાવી', 'પ્રમાદી', 'આનંદ', 'રાક્ષસ', 'અનલ (નલ)',
  'પિંગલ', 'કાલયુક્ત', 'સિદ્ધાર્થી', 'રૌદ્રી', 'દુર્મતિ', 'દુંદુભિ', 'રુધિરોદ્ગારી', 'રક્તાક્ષી', 'ક્રોધન', 'અક્ષય',
];

/** Ekadashi names per Gujarati month (Kartak..Aaso), [sud, vad] (§8.2). */
export const EKADASHI_NAMES: Array<[string, string]> = [
  ['પ્રબોધિની', 'ઉત્પત્તિ'], ['મોક્ષદા', 'સફલા'], ['પુત્રદા', 'ષટ્તિલા'], ['જયા', 'વિજયા'],
  ['આમલકી', 'પાપમોચની'], ['કામદા', 'વરૂથિની'], ['મોહિની', 'અપરા'], ['નિર્જળા', 'યોગિની'],
  ['દેવશયની', 'કામિકા'], ['પવિત્રા (પુત્રદા)', 'અજા'], ['પરિવર્તિની (જલઝીલણી)', 'ઇન્દિરા'], ['પાંશાકુશા', 'રમા'],
];

/** Amrit-siddhi / Siddhi weekday→nakshatra (1-based nakshatra numbers) (§7.2). */
export const AMRIT_SIDDHI_NAK = [13, 5, 1, 17, 8, 27, 4];   // Sun..Sat: Hasta, Mrigashira, Ashwini, Anuradha, Pushya, Revati, Rohini
export const SIDDHI_NAK = [19, 22, 26, 3, 7, 11, 15];        // Sun..Sat: Mula, Shravana, U.Bhadra, Krittika, Punarvasu, P.Phalguni, Swati
export const DAGDHA_TITHI = [12, 11, 5, 3, 6, 8, 9];         // Sun..Sat
export const KANKACH_TITHI = [12, 11, 10, 9, 8, 7, 6];

/** Disha-shool: direction to avoid per weekday (Sun..Sat). */
export const DISHA_SHOOL: Array<{ dir: { gu: string; en: string } | null }> = [
  { dir: { gu: 'પશ્ચિમ', en: 'West' } }, { dir: { gu: 'પૂર્વ', en: 'East' } }, { dir: { gu: 'ઉત્તર', en: 'North' } },
  { dir: { gu: 'ઉત્તર', en: 'North' } }, { dir: { gu: 'દક્ષિણ', en: 'South' } }, { dir: { gu: 'પશ્ચિમ', en: 'West' } },
  { dir: { gu: 'પૂર્વ', en: 'East' } },
];

/** Avakahada (§13.1): syllables per pada + yoni/gana/nadi per nakshatra (1-based). */
export const AVAKAHADA: Array<{ syllables: [string, string, string, string]; yoni: { gu: string; en: string }; gana: { gu: string; en: string }; nadi: { gu: string; en: string } }> = [
  { syllables: ['ચુ', 'ચે', 'ચો', 'લા'], yoni: { gu: 'અશ્વ', en: 'Horse' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['લી', 'લુ', 'લે', 'લો'], yoni: { gu: 'ગજ', en: 'Elephant' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['આ', 'ઈ', 'ઉ', 'એ'], yoni: { gu: 'મેષ', en: 'Sheep' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['ઓ', 'વા', 'વી', 'વુ'], yoni: { gu: 'સર્પ', en: 'Serpent' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['વે', 'વો', 'કા', 'કી'], yoni: { gu: 'સર્પ', en: 'Serpent' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['કુ', 'ઘ', 'ઙ', 'છ'], yoni: { gu: 'શ્વાન', en: 'Dog' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['કે', 'કો', 'હા', 'હી'], yoni: { gu: 'માર્જાર', en: 'Cat' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['હુ', 'હે', 'હો', 'ડા'], yoni: { gu: 'મેષ', en: 'Sheep' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['ડી', 'ડુ', 'ડે', 'ડો'], yoni: { gu: 'માર્જાર', en: 'Cat' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['મા', 'મી', 'મુ', 'મે'], yoni: { gu: 'મૂષક', en: 'Rat' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['મો', 'ટા', 'ટી', 'ટુ'], yoni: { gu: 'મૂષક', en: 'Rat' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['ટે', 'ટો', 'પા', 'પી'], yoni: { gu: 'ગૌ', en: 'Cow' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['પુ', 'ષ', 'ણ', 'ઠ'], yoni: { gu: 'મહિષી', en: 'Buffalo' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['પે', 'પો', 'રા', 'રી'], yoni: { gu: 'વ્યાઘ્ર', en: 'Tiger' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['રુ', 'રે', 'રો', 'તા'], yoni: { gu: 'મહિષી', en: 'Buffalo' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['તિ', 'તુ', 'તે', 'તો'], yoni: { gu: 'વ્યાઘ્ર', en: 'Tiger' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['ના', 'ની', 'નુ', 'ને'], yoni: { gu: 'મૃગ', en: 'Deer' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['નો', 'યા', 'યી', 'યુ'], yoni: { gu: 'મૃગ', en: 'Deer' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['યે', 'યો', 'ભા', 'ભી'], yoni: { gu: 'શ્વાન', en: 'Dog' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['ભુ', 'ધા', 'ફા', 'ઢા'], yoni: { gu: 'વાનર', en: 'Monkey' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['ભે', 'ભો', 'જા', 'જી'], yoni: { gu: 'નકુલ', en: 'Mongoose' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['ખી', 'ખુ', 'ખે', 'ખો'], yoni: { gu: 'વાનર', en: 'Monkey' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
  { syllables: ['ગા', 'ગી', 'ગુ', 'ગે'], yoni: { gu: 'સિંહ', en: 'Lion' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['ગો', 'સા', 'સી', 'સુ'], yoni: { gu: 'અશ્વ', en: 'Horse' }, gana: { gu: 'રાક્ષસ', en: 'Rakshasa' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['સે', 'સો', 'દા', 'દી'], yoni: { gu: 'સિંહ', en: 'Lion' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'આદ્ય', en: 'Aadya' } },
  { syllables: ['દુ', 'શ', 'ઝ', 'થ'], yoni: { gu: 'ગૌ', en: 'Cow' }, gana: { gu: 'મનુષ્ય', en: 'Manushya' }, nadi: { gu: 'મધ્ય', en: 'Madhya' } },
  { syllables: ['દે', 'દો', 'ચા', 'ચી'], yoni: { gu: 'ગજ', en: 'Elephant' }, gana: { gu: 'દેવ', en: 'Deva' }, nadi: { gu: 'અંત્ય', en: 'Antya' } },
];

/** Vimshottari dasha lords & years (§12.9). */
export const VIM_LORDS: GrahaKey[] = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
export const VIM_YEARS: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

/** 16 shubh nakshatras for muhurat (§9.1), 1-based set. */
export const SHUBH_NAKSHATRAS = new Set([1, 4, 5, 7, 8, 12, 13, 14, 15, 17, 21, 22, 23, 24, 26, 27]);

export interface City { name: { gu: string; en: string }; lat: number; lon: number }
export const CITIES: City[] = [
  { name: { gu: 'રાજકોટ', en: 'Rajkot' }, lat: 22.3039, lon: 70.8022 },
  { name: { gu: 'અમદાવાદ', en: 'Ahmedabad' }, lat: 23.0225, lon: 72.5714 },
  { name: { gu: 'સુરત', en: 'Surat' }, lat: 21.1702, lon: 72.8311 },
  { name: { gu: 'વડોદરા', en: 'Vadodara' }, lat: 22.3072, lon: 73.1812 },
  { name: { gu: 'ભાવનગર', en: 'Bhavnagar' }, lat: 21.7645, lon: 72.1519 },
  { name: { gu: 'જામનગર', en: 'Jamnagar' }, lat: 22.4707, lon: 70.0577 },
  { name: { gu: 'જુનાગઢ', en: 'Junagadh' }, lat: 21.5222, lon: 70.4579 },
  { name: { gu: 'ગાંધીનગર', en: 'Gandhinagar' }, lat: 23.2233, lon: 72.6500 },
  { name: { gu: 'ભુજ', en: 'Bhuj' }, lat: 23.2420, lon: 69.6669 },
  { name: { gu: 'મહેસાણા', en: 'Mehsana' }, lat: 23.5880, lon: 72.3693 },
  { name: { gu: 'આણંદ', en: 'Anand' }, lat: 22.5645, lon: 72.9289 },
  { name: { gu: 'નાથદ્વારા', en: 'Nathdwara' }, lat: 24.9333, lon: 73.8167 },
  { name: { gu: 'સોમનાથ', en: 'Somnath' }, lat: 20.8880, lon: 70.4013 },
  { name: { gu: 'દ્વારકા', en: 'Dwarka' }, lat: 22.2442, lon: 68.9685 },
  { name: { gu: 'અંબાજી', en: 'Ambaji' }, lat: 24.3280, lon: 72.8500 },
  { name: { gu: 'ઉજ્જૈન', en: 'Ujjain' }, lat: 23.1765, lon: 75.7885 },
  { name: { gu: 'મુંબઈ', en: 'Mumbai' }, lat: 19.0760, lon: 72.8777 },
  { name: { gu: 'દિલ્હી', en: 'Delhi' }, lat: 28.6139, lon: 77.2090 },
  { name: { gu: 'જયપુર', en: 'Jaipur' }, lat: 26.9124, lon: 75.7873 },
  { name: { gu: 'ઇન્દોર', en: 'Indore' }, lat: 22.7196, lon: 75.8577 },
];

/** English labels (added for the English UI mode). */
export const TITHI_DEITY_EN = ['Agni', 'Brahma', 'Gauri', 'Ganesha', 'Shesha Naga', 'Kartikeya', 'Surya', 'Shiva', 'Durga', 'Kaal (Yama)', 'Vishvedeva', 'Vishnu', 'Kamadeva', 'Shiva', 'Chandra', 'Pitru'];
export const SAMVATSARAS_EN = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angira', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatri',
  'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Subhanu', 'Tarana', 'Parthiva', 'Vyaya',
  'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikruti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi',
  'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
  'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadi', 'Ananda', 'Rakshasa', 'Anala (Nala)',
  'Pingala', 'Kalayukta', 'Siddharthi', 'Raudra', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
];
export const EKADASHI_EN: Array<[string, string]> = [
  ['Prabodhini', 'Utpatti'], ['Mokshada', 'Saphala'], ['Putrada', 'Shattila'], ['Jaya', 'Vijaya'],
  ['Amalaki', 'Papmochani'], ['Kamada', 'Varuthini'], ['Mohini', 'Apara'], ['Nirjala', 'Yogini'],
  ['Devshayani', 'Kamika'], ['Pavitra (Putrada)', 'Aja'], ['Parivartini (Jalzilani)', 'Indira'], ['Papankusha', 'Rama'],
];
