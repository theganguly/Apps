/**
 * REGISTRY — tabs and views. Built-in tabs, glossary-driven plugins and user settings all go through here.
 *
 * tab def: { key, strKey?, strGu?, strEn?, icon, view: () => HTMLElement, order?, hidden?, custom? }
 *   - strKey: a key of lib/i18n STR (built-in tabs)       - strGu/strEn: literal labels (plugins)
 * Persistence (localStorage "panchang-tabs-v1"): { order: [keys], hidden: [keys] }.
 * Runs in Node too (tests): falls back to in-memory storage when localStorage is missing.
 */
export const TABS_KEY = 'panchang-tabs-v1';

let mem = null;
function store() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } }
function load() {
  const st = store();
  const empty = { order: [], hidden: [] };
  if (!st) return mem || empty;
  try {
    const p = JSON.parse(st.getItem(TABS_KEY) || 'null');
    return p && Array.isArray(p.order) && Array.isArray(p.hidden) ? p : empty;
  } catch { return empty; }
}
function save(p) {
  mem = p;
  const st = store();
  if (st) { try { st.setItem(TABS_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
}

export const REGISTRY = {
  tabs: [],        // all registered defs, in registration order
  views: {},       // key -> () => HTMLElement
  listeners: [],

  onChange(fn) { this.listeners.push(fn); },
  _emit() { for (const f of this.listeners) { try { f(); } catch (e) { console.error(e); } } },

  registerTab(def) {
    if (!def || !def.key || typeof def.view !== 'function') throw new Error('registerTab: need { key, view }');
    const nextOrder = this.tabs.reduce((m, t) => Math.max(m, t.order ?? 0), 0) + 10;
    const full = { icon: 'puzzle', custom: false, hidden: false, ...def, order: def.order ?? nextOrder };
    const i = this.tabs.findIndex((t) => t.key === def.key);
    if (i >= 0) this.tabs[i] = full; else this.tabs.push(full);
    this.views[def.key] = def.view;
    this._emit();
    return full;
  },
  unregisterTab(key) {
    const i = this.tabs.findIndex((t) => t.key === key);
    if (i < 0) return false;
    this.tabs.splice(i, 1);
    delete this.views[key];
    this._emit();
    return true;
  },
  /** User-chosen order (persisted). Unknown keys are ignored; tabs not listed keep default order after the listed ones. */
  setTabOrder(keys) {
    const p = load();
    p.order = [...new Set(keys)];
    save(p); this._emit();
  },
  hiddenTabs() { return [...load().hidden]; },
  setHidden(key, hidden) {
    const p = load();
    const s = new Set(p.hidden);
    if (hidden) {
      // never hide the last visible tab
      const visible = this.orderedTabs().filter((t) => !s.has(t.key) && t.key !== key);
      if (!visible.length) return false;
      s.add(key);
    } else s.delete(key);
    p.hidden = [...s]; save(p); this._emit();
    return true;
  },
  resetTabs() { save({ order: [], hidden: [] }); this._emit(); },

  /** All tabs in effective order (user order first, then default `order` field). */
  orderedTabs() {
    const p = load();
    const idx = new Map(p.order.map((k, i) => [k, i]));
    return [...this.tabs].sort((a, b) => {
      const ia = idx.has(a.key) ? idx.get(a.key) : 1e6 + (a.order ?? 0);
      const ib = idx.has(b.key) ? idx.get(b.key) : 1e6 + (b.order ?? 0);
      return ia - ib;
    });
  },
  /** Tabs to show in the navigation. */
  visibleTabs() {
    const hid = new Set(load().hidden);
    const v = this.orderedTabs().filter((t) => !hid.has(t.key));
    return v.length ? v : this.orderedTabs().slice(0, 1);
  },
};
