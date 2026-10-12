/**
 * i18n.ts — UI strings in Gujarati (primary) and English.
 */
import { GU_DIGITS } from './data';

export type Lang = 'gu' | 'en';

export const STR = {
  appName: { gu: 'હરિલાલ પંચાંગ', en: 'Harilal Panchang' },
  appTagline: { gu: 'વિક્રમ સંવત્ પંચાંગ — સચોટ ગણિત', en: 'Vikram Samvat Panchang — computed, not printed' },

  // tabs
  tabToday: { gu: 'આજે', en: 'Today' },
  tabCalendar: { gu: 'કેલેન્ડર', en: 'Calendar' },
  tabMuhurat: { gu: 'ચોઘડિયું', en: 'Choghadiya' },
  tabFestivals: { gu: 'તહેવારો', en: 'Festivals' },
  tabPlanets: { gu: 'ગ્રહો', en: 'Planets' },
  tabKundali: { gu: 'કુંડળી', en: 'Kundali' },

  // panchang labels
  tithi: { gu: 'તિથિ', en: 'Tithi' },
  nakshatra: { gu: 'નક્ષત્ર', en: 'Nakshatra' },
  yoga: { gu: 'યોગ', en: 'Yoga' },
  karan: { gu: 'કરણ', en: 'Karan' },
  vaar: { gu: 'વાર', en: 'Vaar' },
  paksha: { gu: 'પક્ષ', en: 'Paksha' },
  monthAmanta: { gu: 'માસ (અમાન્ત)', en: 'Month (Amanta)' },
  sunrise: { gu: 'સૂર્યોદય', en: 'Sunrise' },
  sunset: { gu: 'સૂર્યાસ્ત', en: 'Sunset' },
  moonrise: { gu: 'ચંદ્રોદય', en: 'Moonrise' },
  moonset: { gu: 'ચંદ્રાસ્ત', en: 'Moonset' },
  moonRashi: { gu: 'ચંદ્ર રાશિ', en: 'Moon sign' },
  sunRashi: { gu: 'સૂર્ય રાશિ', en: 'Sun sign' },
  ritu: { gu: 'ઋતુ', en: 'Ritu' },
  ayana: { gu: 'અયન', en: 'Ayana' },
  until: { gu: 'સુધી', en: 'till' },
  samvat: { gu: 'વિક્રમ સંવત્', en: 'Vikram Samvat' },
  shaka: { gu: 'શાલિવાહન શક', en: 'Shalivahana Shaka' },
  virSamvat: { gu: 'વીર સંવત્', en: 'Vir Samvat' },
  samvatsara: { gu: 'સંવત્સર', en: 'Samvatsara' },

  // muhurat / windows
  choghadiyaDay: { gu: 'દિવસનું ચોઘડિયું', en: 'Day Choghadiya' },
  choghadiyaNight: { gu: 'રાત્રિનું ચોઘડિયું', en: 'Night Choghadiya' },
  hora: { gu: 'હોરા', en: 'Hora' },
  rahukaal: { gu: 'રાહુકાળ', en: 'Rahu Kaal' },
  yamaganda: { gu: 'યમગંડ', en: 'Yamaganda' },
  gulika: { gu: 'ગુલિક કાળ', en: 'Gulika Kaal' },
  abhijit: { gu: 'અભિજિત મુહૂર્ત', en: 'Abhijit Muhurta' },
  brahma: { gu: 'બ્રહ્મ મુહૂર્ત', en: 'Brahma Muhurta' },
  sandhya: { gu: 'સંધ્યા', en: 'Sandhya' },
  pradosh: { gu: 'પ્રદોષ કાળ', en: 'Pradosh Kaal' },
  nishita: { gu: 'નિશીત મુહૂર્ત', en: 'Nishita Muhurta' },
  good: { gu: 'શુભ', en: 'Auspicious' },
  bad: { gu: 'અશુભ', en: 'Inauspicious' },
  now: { gu: 'હમણાં', en: 'Now' },

  // flags
  panchak: { gu: 'પંચક', en: 'Panchak' },
  vinchhudo: { gu: 'વિછુડો', en: 'Vinchhudo' },
  bhadra: { gu: 'ભદ્રા (વિષ્ટિ)', en: 'Bhadra (Vishti)' },
  raviYoga: { gu: 'રવિયોગ', en: 'Ravi Yoga' },
  amritSiddhi: { gu: 'અમૃત સિદ્ધિ યોગ', en: 'Amrit Siddhi Yoga' },
  siddhiYoga: { gu: 'સિદ્ધિ યોગ', en: 'Siddhi Yoga' },
  dagdha: { gu: 'દગ્ધ તિથિ', en: 'Dagdha Tithi' },
  kankach: { gu: 'કંકાચ તિથિ', en: 'Kankach Tithi' },
  vyatipat: { gu: 'વ્યતિપાત યોગ', en: 'Vyatipat Yoga' },
  vaidhriti: { gu: 'વૈધૃતિ યોગ', en: 'Vaidhriti Yoga' },
  dishashool: { gu: 'દિશાશૂળ', en: 'Disha Shool' },
  tithiVriddhi: { gu: 'તિથિ વૃદ્ધિ', en: 'Tithi Vriddhi' },
  tithiKshaya: { gu: 'તિથિ ક્ષય', en: 'Tithi Kshaya' },
  fromTo: { gu: 'થી → સુધી', en: 'from → till' },

  // planets page
  planetPositions: { gu: 'ગ્રહ સ્થિતિ', en: 'Planet positions' },
  ingresses: { gu: 'રાશિ પ્રવેશ (ગોચર)', en: 'Rashi ingresses (Gochar)' },
  retro: { gu: 'વક્રી', en: 'Retrograde' },
  panoti: { gu: 'પનોતી (સાડાસાતી / ઢૈયા)', en: 'Panoti (Sade-Sati / Dhaiya)' },
  panotiNone: { gu: 'હાલ પનોતી નથી', en: 'No panoti at present' },
  bigPanoti: { gu: 'મોટી પનોતી (સાડાસાતી)', en: 'Sade-Sati (7½ yr)' },
  smallPanoti: { gu: 'નાની પનોતી (ઢૈયા)', en: 'Dhaiya (2½ yr)' },
  phase: { gu: 'ચરણ', en: 'Phase' },
  selectRashi: { gu: 'જન્મ રાશિ પસંદ કરો', en: 'Select birth Moon sign' },

  // festivals page
  festivalsOf: { gu: 'નાં તહેવારો-વ્રતો', en: 'festivals & vrats' },
  sankrantiList: { gu: 'સંક્રાંતિ', en: 'Sankrantis' },
  eclipse: { gu: 'ગ્રહણ', en: 'Eclipse' },
  lunarEclipse: { gu: 'ચંદ્ર ગ્રહણ', en: 'Lunar eclipse' },
  solarEclipse: { gu: 'સૂર્ય ગ્રહણ', en: 'Solar eclipse' },
  visibleInIndia: { gu: 'ભારતમાં દેખાય', en: 'visible in India' },
  notVisibleInIndia: { gu: 'ભારતમાં દેખાતું નથી', en: 'not visible in India' },
  sutak: { gu: 'સૂતક', en: 'Sutak' },

  // kundali page
  birthDetails: { gu: 'જન્મ વિગત', en: 'Birth details' },
  birthDate: { gu: 'જન્મ તારીખ', en: 'Birth date' },
  birthTime: { gu: 'જન્મ સમય', en: 'Birth time' },
  birthPlace: { gu: 'જન્મ સ્થળ', en: 'Birth place' },
  lagna: { gu: 'લગ્ન', en: 'Lagna (Ascendant)' },
  navamsa: { gu: 'નવાંશ', en: 'Navamsa' },
  janmaNakshatra: { gu: 'જન્મ નક્ષત્ર', en: 'Birth nakshatra' },
  pada: { gu: 'ચરણ', en: 'Pada' },
  avakahada: { gu: 'અવકહડા ચક્ર', en: 'Avakahada chakra' },
  syllables: { gu: 'નામક્ષર', en: 'Name syllables' },
  yoni: { gu: 'યોનિ', en: 'Yoni' },
  gana: { gu: 'ગણ', en: 'Gana' },
  nadi: { gu: 'નાડી', en: 'Nadi' },
  vimshottari: { gu: 'વિંશોત્તરી મહાદશા', en: 'Vimshottari Mahadasha' },
  dashaBalance: { gu: 'જન્મે દશા બાકી', en: 'Dasha balance at birth' },
  rashiChart: { gu: 'રાશિ ચક્ર (D-1)', en: 'Rashi chart (D-1)' },
  navamsaChart: { gu: 'નવાંશ ચક્ર (D-9)', en: 'Navamsa chart (D-9)' },
  years: { gu: 'વર્ષ', en: 'years' },
  generate: { gu: 'કુંડળી બનાવો', en: 'Cast chart' },

  // settings
  language: { gu: 'ભાષા', en: 'Language' },
  city: { gu: 'શહેર', en: 'City' },
  gujaratiNumerals: { gu: 'ગુજરાતી અંકો', en: 'Gujarati numerals' },

  // misc
  today: { gu: 'આજે', en: 'Today' },
  festivals: { gu: 'તહેવાર-વ્રત', en: 'Festivals' },
  shubhMuhurat: { gu: 'શુભ સમય', en: 'Auspicious times' },
  ashubhMuhurat: { gu: 'અશુભ સમય', en: 'Inauspicious times' },
  prevMonth: { gu: 'અગલો માસ', en: 'Previous month' },
  nextMonth: { gu: 'પછીનો માસ', en: 'Next month' },
  day: { gu: 'દિવસ', en: 'Day' },
  night: { gu: 'રાત્રિ', en: 'Night' },
  allDay: { gu: 'આખો દિવસ', en: 'All day' },
  engineNote: {
    gu: 'બધી ગણતરીઓ ઉપકરણ પર જ ચલાવવામાં આવે છે — મીયસ ખગોળશાસ્ત્ર, લાહિરી અયનાંશ, IST.',
    en: 'All computations run on-device — Meeus astronomy, Lahiri ayanamsa, IST.',
  },

  // ---- new tabs
  tabMuhurtaPlanner: { gu: 'મુહૂર્ત શોધ', en: 'Muhurta Planner' },
  tabSamvat: { gu: 'સંવત', en: 'Samvat' },
  bottomNavLabel: { gu: 'મુખ્ય વિભાગો', en: 'Main sections' },

  // ---- glossary sheet
  whatIs: { gu: 'શું છે', en: 'What it is' },
  howComputed: { gu: 'કેવી રીતે ગણાય છે', en: 'How it works' },
  significance: { gu: 'મહત્ત્વ', en: 'Significance' },
  relatedTerms: { gu: 'સંબંધિત', en: 'Related' },
  close: { gu: 'બંધ કરો', en: 'Close' },
  back: { gu: 'પાછળ', en: 'Back' },
  noEntry: { gu: 'આ શબ્દની માહિતી ઉપલબ્ધ નથી.', en: 'No details available for this term.' },
  tapForMeaning: { gu: 'અર્થ જોવા ટેપ કરો', en: 'Tap for meaning' },
  catPanchang: { gu: 'પંચાંગ', en: 'Panchang' },
  catMuhurat: { gu: 'મુહૂર્ત', en: 'Muhurta' },
  catInauspicious: { gu: 'અશુભ સમય/યોગ', en: 'Inauspicious' },
  catGraha: { gu: 'ગ્રહ', en: 'Graha' },
  catNakshatra: { gu: 'નક્ષત્ર', en: 'Nakshatra' },
  catTithi: { gu: 'તિથિ', en: 'Tithi' },
  catYoga: { gu: 'યોગ', en: 'Yoga' },
  catKaran: { gu: 'કરણ', en: 'Karan' },
  catRashi: { gu: 'રાશિ', en: 'Rashi' },
  catChoghadiya: { gu: 'ચોઘડિયું', en: 'Choghadiya' },
  catHora: { gu: 'હોરા', en: 'Hora' },
  catFestival: { gu: 'તહેવાર પ્રકાર', en: 'Festival type' },
  catEclipse: { gu: 'ગ્રહણ', en: 'Eclipse' },
  catPanoti: { gu: 'પનોતી', en: 'Panoti' },

  // ---- place picker
  place: { gu: 'સ્થળ', en: 'Place' },
  searchPlace: { gu: 'સ્થળ શોધો (ગુજરાતી / English)', en: 'Search place (Gujarati / English)' },
  builtinPlaces: { gu: 'ઉપલબ્ધ શહેરો', en: 'Built-in cities' },
  myPlaces: { gu: 'મારાં સ્થળો', en: 'My places' },
  useMyLocation: { gu: 'મારું સ્થાન વાપરો', en: 'Use my location' },
  locating: { gu: 'સ્થાન શોધાય છે…', en: 'Locating…' },
  geoDenied: { gu: 'સ્થાન મેળવી શકાયું નહીં. અક્ષાંશ-રેખાંશ જાતે લખો.', en: 'Could not get your location. Enter latitude/longitude manually.' },
  geoNeedName: { gu: 'સ્થાન મળ્યું — નીચે નામ લખીને સાચવો.', en: 'Location found — add a name below and save.' },
  latitude: { gu: 'અક્ષાંશ (Lat)', en: 'Latitude' },
  longitude: { gu: 'રેખાંશ (Lon)', en: 'Longitude' },
  placeName: { gu: 'સ્થળનું નામ', en: 'Place name' },
  savePlace: { gu: 'સ્થળ સાચવો', en: 'Save place' },
  updatePlace: { gu: 'ફેરફાર સાચવો', en: 'Save changes' },
  usePlace: { gu: 'આ સ્થળ વાપરો', en: 'Use this place' },
  edit: { gu: 'સુધારો', en: 'Edit' },
  delete: { gu: 'કાઢી નાખો', en: 'Delete' },
  cancel: { gu: 'રદ કરો', en: 'Cancel' },
  confirmDelete: { gu: 'આ સ્થળ કાઢી નાખવું?', en: 'Delete this place?' },
  invalidCoords: { gu: 'અક્ષાંશ −૯૦…૯૦ અને રેખાંશ −૧૮૦…૧૮૦ વચ્ચે હોવો જોઈએ.', en: 'Latitude must be −90…90 and longitude −180…180.' },
  nameRequired: { gu: 'નામ લખો.', en: 'Please enter a name.' },
  mapOffline: { gu: 'ઑફલાઇન નકશો', en: 'Offline map' },
  mapOnline: { gu: 'ઑનલાઇન નકશો (OpenStreetMap)', en: 'Online map (OpenStreetMap)' },
  loadDetailedMap: { gu: 'વિગતવાર નકશો લોડ કરો (ઇન્ટરનેટ જોઈશે)', en: 'Load detailed map (needs internet)' },
  hideDetailedMap: { gu: 'વિગતવાર નકશો બંધ કરો', en: 'Hide detailed map' },
  mapHint: { gu: 'નકશા પર ટેપ કરો અથવા ક્રોસહેર ખેંચો. યોજનાકીય રૂપરેખા — માપ-ચોક્કસ નથી.', en: 'Tap the map or drag the crosshair. Schematic outline — not survey-accurate.' },
  mapIndia: { gu: 'ભારત', en: 'India' },
  mapGujarat: { gu: 'ગુજરાત', en: 'Gujarat' },
  mapOnlineNote: { gu: 'ઇન્ટરનેટ છે કે નહીં તે તપાસાય છે…', en: 'Checking connectivity…' },
  mapTilesFail: { gu: 'નકશા ટાઇલ્સ લોડ ન થઈ — ઑફલાઇન નકશો ચાલુ રાખ્યો.', en: 'Tiles failed to load — staying on the offline map.' },
  istNote: { gu: 'બધા સમય IST (ભારતીય સમય) માં દર્શાવાય છે.', en: 'All times are shown in IST.' },
  selectedPlace: { gu: 'પસંદ કરેલ', en: 'Selected' },
  newPlace: { gu: 'નવું સ્થળ ઉમેરો', en: 'Add a new place' },
  noPlaces: { gu: 'કોઈ સ્થળ મળ્યું નથી.', en: 'No places found.' },

  // ---- settings / tab manager
  settings: { gu: 'સેટિંગ્સ', en: 'Settings' },
  tabsSettings: { gu: 'વિભાગો (ટૅબ)', en: 'Tabs' },
  tabsHint: { gu: 'ટૅબ બતાવો/છુપાવો અને ક્રમ બદલો.', en: 'Show or hide tabs and change their order.' },
  moveUp: { gu: 'ઉપર ખસેડો', en: 'Move up' },
  moveDown: { gu: 'નીચે ખસેડો', en: 'Move down' },
  resetDefaults: { gu: 'મૂળ સ્થિતિ પર પાછા', en: 'Reset to defaults' },
  pluginTab: { gu: 'પ્લગઇન', en: 'plugin' },
  keepOneTab: { gu: 'ઓછામાં ઓછો એક ટૅબ દેખાવો જોઈએ.', en: 'At least one tab must stay visible.' },

  // ---- muhurta planner
  plannerTitle: { gu: 'લગ્ન અને ખાત મુહૂર્ત', en: 'Lagna & Khat Muhurta' },
  wholeSamvatsar: { gu: 'આખું સંવત્સર', en: 'Whole samvatsar' },
  thisMonthOnly: { gu: 'આ માસ', en: 'This month' },
  noMuhurtas: { gu: 'આ ફિલ્ટર માટે કોઈ મુહૂર્ત નથી.', en: 'No muhurtas match these filters.' },
  qBest: { gu: 'ઉત્તમ', en: 'Best' },
  qGood: { gu: 'સારું', en: 'Good' },
  qOk: { gu: 'મધ્યમ', en: 'Okay' },
  kLagna: { gu: 'લગ્ન', en: 'Lagna' },
  kKhat: { gu: 'ખાત', en: 'Khat' },
  kAbhijit: { gu: 'અભિજિત', en: 'Abhijit' },
  kAmrit: { gu: 'અમૃત સિદ્ધિ', en: 'Amrit-siddhi' },
  kSiddhi: { gu: 'સિદ્ધિ', en: 'Siddhi' },
  kRavi: { gu: 'રવિયોગ', en: 'Ravi-yoga' },
  allFilter: { gu: 'બધા', en: 'All' },
  byRashi: { gu: 'લગ્ન રાશિ', en: 'Lagna rashi' },
  byTithi: { gu: 'તિથિ', en: 'Tithi' },
  byNakshatra: { gu: 'નક્ષત્ર', en: 'Nakshatra' },
  addToPlan: { gu: 'યોજનામાં ઉમેરો', en: 'Add to plan' },
  removeFromPlan: { gu: 'યોજનામાંથી કાઢો', en: 'Remove from plan' },
  myPlan: { gu: 'મારી યાદી', en: 'My shortlist' },
  showPlanOnly: { gu: 'ફક્ત મારી યાદી', en: 'Shortlist only' },
  nameInitials: { gu: 'નામાક્ષર', en: 'Name initials' },
  lagnaRashiLbl: { gu: 'લગ્ન રાશિ', en: 'Lagna sign' },
  whyThis: { gu: 'આ કેમ શુભ છે', en: 'Why this is auspicious' },
  computing: { gu: 'ગણતરી ચાલુ છે…', en: 'Computing…' },
  plannerNote: { gu: 'આ સૂચક યાદી છે — મહત્ત્વના કાર્ય માટે વિદ્વાન પંડિતની સલાહ લો.', en: 'This is a guide — consult a learned pandit for important ceremonies.' },
  khatNote: { gu: 'ખાત = પાયો/ખાતમુહૂર્ત (જમીન ખોદવાનું શુભ મુહૂર્ત). ૨૪ મિનિટ (૧ ઘડી) ની વિંડો.', en: 'Khat = foundation / ground-breaking. A 24-minute (1 ghati) window.' },

  // ---- samvat tab
  samvatTitle: { gu: 'વિક્રમ સંવત્સર', en: 'Vikram Samvatsar' },
  gregYear: { gu: 'ઇ.સ. વર્ષ', en: 'Gregorian year' },
  samvatYearSwitch: { gu: 'સંવત્સર', en: 'Samvatsar' },
  lunarMonthsOfYear: { gu: 'ચાંદ્ર માસ', en: 'Lunar months' },
  adhikMonth: { gu: 'અધિક', en: 'Adhik' },
  panchakDays: { gu: 'પંચક', en: 'Panchak' },
  vinchhudoDays: { gu: 'વિછુડો', en: 'Vinchhudo' },
  ekadashiList: { gu: 'એકાદશી', en: 'Ekadashi' },
  purnimaList: { gu: 'પૂર્ણિમા', en: 'Purnima' },
  amasList: { gu: 'અમાવસ્યા', en: 'Amavasya' },
  eclipsesOfYear: { gu: 'આ વર્ષનાં ગ્રહણ', en: 'Eclipses this year' },
  exportText: { gu: 'નિકાસ / પ્રિન્ટ', en: 'Export / print' },
  copiedText: { gu: 'ટેક્સ્ટ કૉપી થયો', en: 'Text copied' },
  downloadText: { gu: 'ટેક્સ્ટ ફાઇલ ડાઉનલોડ', en: 'Download .txt' },
  copyText: { gu: 'કૉપી કરો', en: 'Copy' },
  printPage: { gu: 'પ્રિન્ટ', en: 'Print' },
  noItems: { gu: 'કંઈ નથી.', en: 'None.' },
  fromLbl: { gu: 'થી', en: 'from' },
  toLbl: { gu: 'સુધી', en: 'to' },
  moonInKumbhMeen: { gu: 'ચંદ્ર કુંભ/મીનમાં', en: 'Moon in Kumbh/Meen' },
  moonInVrushchik: { gu: 'ચંદ્ર વૃશ્ચિકમાં', en: 'Moon in Vrushchik' },
  visible: { gu: 'દેખાય', en: 'visible' },
  notVisible: { gu: 'ન દેખાય', en: 'not visible' },
} as const;

export type StrKey = keyof typeof STR;
export const t = (k: StrKey, lang: Lang): string => STR[k][lang];

/** Format digits per language + numerals setting. */
export function fmtDigits(s: string | number, lang: Lang, guNumerals: boolean): string {
  const str = String(s);
  if (lang === 'gu' && guNumerals) return str.replace(/\d/g, (d) => GU_DIGITS[Number(d)]);
  return str;
}

/** "06:51" → "૦૬:૫૧" when Gujarati numerals on. */
export function fmtTime(jd: string, lang: Lang, guNumerals: boolean): string {
  return fmtDigits(jd, lang, guNumerals);
}
