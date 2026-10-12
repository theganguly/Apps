/**
 * places.ts — built-in cities plus user-saved places (localStorage, key panchang-places-v1).
 * Pure module: touches localStorage only inside try/catch, and falls back to memory
 * when storage is unavailable (private mode, Node tests).
 */
import { CITIES } from './data';

export interface Place { id: string; nameGu: string; nameEn: string; lat: number; lon: number; tzHours?: number }

export const PLACES_KEY = 'panchang-places-v1';
export const BUILTIN_PREFIX = 'b-';

let memory: Place[] | null = null;
const storage = (): Storage | null => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };

export function builtinPlaces(): Place[] {
  return CITIES.map((c) => ({
    id: BUILTIN_PREFIX + c.name.en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    nameGu: c.name.gu, nameEn: c.name.en, lat: c.lat, lon: c.lon, tzHours: 5.5,
  }));
}
export const isBuiltin = (id: string) => id.startsWith(BUILTIN_PREFIX);

/** Validate a lat/lon pair. */
export function validCoords(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

function readUser(): Place[] {
  const st = storage();
  if (!st) return memory ?? [];
  try {
    const raw = JSON.parse(st.getItem(PLACES_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((p) => p && typeof p.id === 'string' && validCoords(+p.lat, +p.lon))
      .map((p) => ({ id: p.id, nameGu: String(p.nameGu ?? p.nameEn ?? ''), nameEn: String(p.nameEn ?? p.nameGu ?? ''), lat: +p.lat, lon: +p.lon, tzHours: typeof p.tzHours === 'number' ? p.tzHours : undefined }));
  } catch { return []; }
}
function writeUser(list: Place[]): void {
  memory = list;
  const st = storage();
  if (!st) return;
  try { st.setItem(PLACES_KEY, JSON.stringify(list)); } catch { /* quota / private mode — memory copy still works */ }
}

export function userPlaces(): Place[] { return readUser(); }
export function loadPlaces(): Place[] { return [...builtinPlaces(), ...readUser()]; }
export function findPlace(id: string): Place | undefined { return loadPlaces().find((p) => p.id === id); }

export function newPlaceId(): string { return `u-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`; }

export function addPlace(p: Place): void {
  if (!validCoords(p.lat, p.lon)) throw new Error('invalid coordinates');
  const list = readUser().filter((x) => x.id !== p.id);
  list.push({ ...p, lat: round6(p.lat), lon: round6(p.lon) });
  writeUser(list);
}
export function updatePlace(id: string, patch: Partial<Omit<Place, 'id'>>): void {
  if (isBuiltin(id)) throw new Error('built-in places are read-only');
  const list = readUser();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;
  const next = { ...list[i], ...patch };
  if (!validCoords(next.lat, next.lon)) throw new Error('invalid coordinates');
  next.lat = round6(next.lat); next.lon = round6(next.lon);
  list[i] = next;
  writeUser(list);
}
export function deletePlace(id: string): void {
  if (isBuiltin(id)) return;
  writeUser(readUser().filter((x) => x.id !== id));
}

/** Stable cache key: places with identical coordinates share computed days. */
export const placeKey = (p: { lat: number; lon: number }) => `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;

/** Case-insensitive match against Gujarati or English name. */
export function searchPlaces(list: Place[], q: string): Place[] {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  return list.filter((p) => p.nameGu.toLowerCase().includes(s) || p.nameEn.toLowerCase().includes(s));
}
