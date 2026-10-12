/* Shared UI state, settings, formatting helpers and cache registry. */
import { jdToLocal, IST_HOURS } from '../lib/astro';
import { fmtISTDateTime, fmtIST } from '../lib/core';
import { t as tr, fmtDigits } from '../lib/i18n';
import { RASHIS, GRAHAS } from '../lib/data';
import { loadPlaces, builtinPlaces, findPlace, placeKey } from '../lib/places';

export const SETTINGS_KEY = 'panchang-settings-v1';
export const PLAN_KEY = 'panchang-plan-v1';
export const MON_GU = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
export const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Late-bound hooks so modules can ask app.js to re-render without importing it (avoids cycles). */
export const hooks = { render: () => {}, go: () => {}, setTab: () => {} };

function loadSettings() {
  const d = { lang: 'gu', placeId: builtinPlaces()[0].id, guNumerals: true };
  try {
    const p = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!p) return d;
    let placeId = typeof p.placeId === 'string' && findPlace(p.placeId) ? p.placeId : null;
    // migrate the pre-places settings shape { cityIdx }
    if (!placeId && typeof p.cityIdx === 'number' && builtinPlaces()[p.cityIdx]) placeId = builtinPlaces()[p.cityIdx].id;
    return { lang: p.lang === 'en' ? 'en' : 'gu', placeId: placeId || d.placeId, guNumerals: p.guNumerals !== false };
  } catch { return d; }
}
export function istNow() { const n = new Date(); return new Date(n.getTime() + (330 + n.getTimezoneOffset()) * 60000); }
export function istToday() { const i = istNow(); return { y: i.getFullYear(), m: i.getMonth() + 1, d: i.getDate() }; }
export function shiftDate(y, m, d, by) { const nd = new Date(Date.UTC(y, m - 1, d + by)); return { y: nd.getUTCFullYear(), m: nd.getUTCMonth() + 1, d: nd.getUTCDate() }; }

const now0 = istToday();
export const S = {
  ...loadSettings(),
  tab: 'today', date: now0,
  cal: { y: now0.y, m: now0.m }, fest: { y: now0.y, m: now0.m },
  natal: 1, showHora: false,
  form: { date: '2000-01-01', time: '12:00', placeId: null }, cast: null, openDasha: null,
  // planner / samvat
  plan: { y: now0.y, m: now0.m, whole: false, kinds: [], rashi: 0, tithi: 0, nak: 0, planOnly: false },
  samvat: { mode: 'samvat', year: null },
};
S.form.placeId = S.placeId;

export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lang: S.lang, placeId: S.placeId, guNumerals: S.guNumerals })); } catch { /* ignore */ }
}

// ---- place
export function place() { return findPlace(S.placeId) || builtinPlaces()[0]; }
export const placeName = (p = place(), lang = S.lang) => (lang === 'gu' ? (p.nameGu || p.nameEn) : (p.nameEn || p.nameGu));
export { placeKey };

// ---- cache registry: any module holding place-dependent data registers a clear() here
const cacheClears = [];
export function registerCache(clear) { cacheClears.push(clear); }
export function bustCaches() { for (const c of cacheClears) { try { c(); } catch { /* ignore */ } } }
export function setPlace(id) {
  if (!findPlace(id)) return;
  S.placeId = id; saveSettings(); bustCaches(); hooks.render();
}

// ---- formatting
export const L = (gu, en) => (S.lang === 'gu' ? gu : en);
export const T = (k) => tr(k, S.lang);
export const fd = (s) => fmtDigits(s, S.lang, S.guNumerals);
export const pad2 = (n) => String(n).padStart(2, '0');
export const nm = (o) => (S.lang === 'gu' ? o.gu : o.en);
export const rashiName = (i) => (S.lang === 'gu' ? RASHIS[i].gu : RASHIS[i].en);
export const rashiShort = (i) => (S.lang === 'gu' ? RASHIS[i].gu : RASHIS[i].en.split(' (')[0]);
export const grahaName = (k) => (S.lang === 'gu' ? GRAHAS[k].gu : GRAHAS[k].en);
export const ft = (jd) => fd(fmtIST(jd));
/** Time that adds "DD-MM" when the instant falls on a different IST civil date than `ref` (default: the viewed day). */
export const ftd = (jd, ref = S.date) => fd(fmtISTDateTime(jd, ref));
export const win = (a, b, ref = S.date) => `${ftd(a, ref)} – ${ftd(b, ref)}`;
export const dmy = (jd) => { const l = jdToLocal(jd, IST_HOURS); return `${fd(pad2(l.d))}-${fd(pad2(l.m))}-${fd(l.y)}`; };
export const ymdText = (x) => `${fd(pad2(x.d))}-${fd(pad2(x.m))}-${fd(x.y)}`;

// ---- plan (shortlist) persistence
export function loadPlan() { try { const a = JSON.parse(localStorage.getItem(PLAN_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }
export function savePlan(a) { try { localStorage.setItem(PLAN_KEY, JSON.stringify(a)); } catch { /* ignore */ } }

/** Display label of a registry tab def (built-in i18n key, or plugin's own strGu/strEn). */
export const tabLabel = (def) => (def.strKey ? T(def.strKey) : (S.lang === 'gu' ? (def.strGu || def.strEn) : (def.strEn || def.strGu)) || def.key);
