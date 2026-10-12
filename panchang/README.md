# Harilal Panchang — offline build

`panchang.html` is the whole app (HTML + CSS + JS in one file). Double-click it; no server, no internet, no Tailwind/React/CDN.

Rebuild from source (needs Node + esbuild, only for rebuilding):
    ./build.sh            # edit path to esbuild inside if needed -> dist/panchang.html

* lib/astro.ts core.ts data.ts festivals.ts i18n.ts kundali.ts — the original app's calculation code (only English label tables added)
* lib/planets.ts  — offline replacement for `astronomy-engine`: planets (JPL/Standish elements), moonrise, moon lat/dist
* lib/eclipse.ts  — offline lunar/solar eclipse search + local visibility
* ui/             — vanilla-JS UI and hand-written CSS
* test/           — the original regression tests (engine, festivals, kundali) + new ones; run with `tsx test/test-engine.ts`

---

## What's new in this version

* **Dates on cross-midnight times.** `fmtISTDateTime(jd, ref)` (lib/core.ts) prints `HH:MM` when the instant is on the same IST civil date as `ref`, otherwise `DD-MM HH:MM`. Every Today/Muhurat time that can roll over uses it (tithi, nakshatra, yoga, karan, Moon-rashi, Panchak, Vinchhudo, Bhadra, moonrise/moonset, sandhya, nishita, night choghadiya/hora). Numerals still go through `fd()`, so ૯ mode works.
* **Glossary.** Every parameter name, tithi, nakshatra, yoga, karan, vaar, graha, rashi, choghadiya slot, hora lord, muhurta window, avakahada field, festival type, eclipse kind and panoti term is a tappable `.term` that opens a sheet (bottom sheet on mobile, modal on desktop) with *What it is / How it works / Significance / Related*. Also available as a `title=` tooltip. Esc / backdrop / × close; focus is trapped; terms open with Enter/Space.
* **Custom places.** Header → place button → search, saved places (edit / delete), manual lat/lon (6 dp), "use my location", and an **offline** schematic India/Gujarat map with a draggable crosshair. "Load detailed map" is an explicit opt-in that pulls OpenStreetMap tiles; the default configuration makes **zero** network requests. Times are always IST.
* **Scrollable bottom navigation** (snap, hidden scrollbar, edge fades, active tab auto-centred, `aria-label`).
* **Muhurta Planner tab** and **Samvat tab** (see below).
* **Tab registry + Settings.** Gear icon → show/hide, reorder (drag or ↑/↓), reset. Persisted in `panchang-tabs-v1`.

### Muhurta Planner (`lib/muhurta.ts`)
Each Hindu day is split into rising-sign (lagna) windows. A window becomes a **lagna muhurta** when the lagna is in `BENEFIC_LAGNAS` (Vrushabh, Mithun, Kark, Simha, Tula, Dhan, Meen — edit the constant to taste) **and** tithi, nakshatra, yoga and weekday pass the shuddhi rules in `data.ts` (`SHUBH_NAKSHATRAS`, `DAGDHA_TITHI`, `KANKACH_TITHI`, Vyatipat/Vaidhriti, Rikta/Amavasya) at the window's start, middle and end. Windows touching Bhadra are dropped; Rahu Kaal, Panchak and Vinchhudo downgrade to *ok*. Also emitted: **Abhijit**, **Amrit-siddhi**, **Siddhi**, **Ravi-yoga** and **Khat**. Tap any row for the exact reasons; ★ adds it to your shortlist (`panchang-plan-v1`).

*Khat* (ખાત) is the foundation / ground-breaking muhurta: a 24-minute (1 ghati) slice inside a clean daytime benefic lagna, on Mon/Wed/Thu/Fri, with a fixed/soft/swift nakshatra, a non-Rikta tithi and no Panchak/Vinchhudo. The nakshatra's name syllables (`AVAKAHADA[nak].syllables`) are shown on every row.

### Samvat tab (`lib/samvat.ts`)
Lunar months of a Vikram samvatsar (or a Gregorian year), Panchak and Vinchhudo blocks (collected from `dayFlags` — nothing re-derived), sankrantis, Ekadashi/Purnima/Amavasya (tithi-kshaya days are listed on the day they begin and tagged), eclipses, and a plain-text export (copy / .txt / print).

> **Vinchhudo = Moon in Vrushchik** (sidereal 210°–240°), exactly as `dayFlags` computes it. **Panchak = Moon in Kumbh/Meen.**

---

## Extending the app

All of this is also reachable at runtime through `window.__panchang` (`state`, `render`, `go`, `setTab`, `registry`, `registerPlugin`, `glossary`, `places`, `h`, `icon`, …).

### Add a tab (built-in)
1. Write a view function that returns an element (see `ui/planner.js`).
2. Add the label to `lib/i18n.ts` (`tabMyThing: { gu: '…', en: '…' }`).
3. Register it in the `BUILTIN` list near the bottom of `ui/app.js`:
   `{ key: 'mything', icon: 'star', strKey: 'tabMyThing', view: MyThingView }`
4. `./build.sh`. It appears in the nav and in Settings automatically. Icons live in `ui/dom.js` (`ICONS`).

### Add a plugin tab (no edits to app.js)
```js
// ui/plugins.js — or paste in the console / a <script> before the bundle
window.PanchangPlugins.push({
  key: 'hello', strGu: 'નમસ્તે', strEn: 'Hello', icon: 'star',
  mount(el, ctx) {
    const p = ctx.dayData(ctx.state.date.y, ctx.state.date.m, ctx.state.date.d).p;
    el.append(ctx.h('p', null, ctx.state.lang === 'gu' ? `આજની તિથિ: ${p.tithiName.formal}` : `Tithi #${p.tithiFull}`));
  },
});
```
`PanchangPlugins` is read at boot; pushing later (or calling `__panchang.registerPlugin(def)`) registers the tab live. Remove one with `__panchang.registry.unregisterTab('hello')`. `mount(el, ctx)` runs on every render; call `ctx.render()` after mutating `ctx.state`.

### Registry API (`ui/registry.js`)
`registerTab(def)`, `unregisterTab(key)`, `setTabOrder(keys)`, `hiddenTabs()`, `setHidden(key, bool)`, `resetTabs()`, `orderedTabs()`, `visibleTabs()`, `onChange(fn)`; `REGISTRY.views[key]()` is the view function. Runs in Node too (tests use it).

### Add a glossary entry
Static entries: add to `lib/glossary-static.ts` (or the generators in `lib/glossary.ts`). Both languages are mandatory (`gu`, `en`, `whatGu/En`, `howGu/En`; `whyGu/En` and `related` optional). At runtime: `__panchang.glossary.register({ key, gu, en, whatGu, whatEn, howGu, howEn, category })`. Make any label tappable with `term('your:key', label)` from `ui/sheet.js`, or `<span class="term" data-gkey="your:key" tabindex="0">`. Key scheme: `tithi:1..30`, `nakshatra:1..27`, `yoga:1..27`, `rashi:1..12`, `weekday:0..6`, `karan:Bava`, `choghadiya:Amrit`, `hora:Sun`, `graha:Saturn`, `festival:major`, plus concept keys (`rahukaal`, `panchak`, …).

### Add a place source
`lib/places.ts` is the only place list. `loadPlaces()` = built-ins (wrapping `CITIES`) + user places (`panchang-places-v1`). To add a bundled list, extend `builtinPlaces()`; to import places at runtime: `__panchang.places.addPlace({ id: __panchang.places.newPlaceId(), nameGu, nameEn, lat, lon })`, then `__panchang.places.select(id)`. Anything that caches place-dependent data must call `registerCache(fn)` (ui/state.js) so a place change clears it.

---

## Tests
```
tsx test/test-engine.ts            # engine + fmtISTDateTime rollover regression
tsx test/test-panchak-dates.ts     # VS 2081 Panchak/Vinchhudo/Ekadashi/… vs book anchors
tsx test/test-muhurta.ts           # planner rules and a known shubh date (Guru-Pushya 24-10-2024)
tsx test/test-glossary-places.ts   # glossary coverage + places CRUD
tsx test/test-extensibility.ts     # registry register/reorder/hide/unregister
tsx test/test-spec-corrections.ts   # spec §0.4 corrections (Sun, eclipses, Vaishnava Ekadashi, Sankashti, Pava)
tsx test/test-festivals.ts test/test-kundali.ts test/test-planets.ts
python3 test/ui_test3.py           # browser smoke test (playwright): no console errors, zero external requests
```

---

## Spec-correction update (Harilal_Panchang_Calculation_Spec.md §0.4)

* **Sun = VSOP87D Earth** (`lib/astro.ts`, truncated 64+34+20+7+3+1 terms) + aberration `20.4898″/R` + 4-term nutation (tropical uses only). The old ch.25 Sun was up to 0.009° off (≈ 6 min on a sankranti). **No ayanamsa offset is needed**: Makar Sankranti 14-01-2025 **08:55** (book 08:56), Vrushchik 16-11 07:31, Dhan 15-12 22:11. `AYANAMSA_OFFSET_ARCSEC` stays 0. The ch.25 formula is kept as `sunLongitudeTrueMeanEquinox` for cross-checking.
* **Lunar eclipse visibility** (`lib/eclipse.ts`): Danjon k = 1.015; visibility now tests the Moon's altitude over the whole P1…P4 span (`lunarPenumbralContacts`). 14-03-2025 is **not visible** from Rajkot (Moon below horizon 09:26–15:31); 07-09-2025 is (20:57 → 02:25).
* **Vaishnava Ekadashi** (`lib/festivals.ts`): last civil date on which the Ekadashi is present at arunodaya (sunrise − 96 min); shown only when it differs from the Smarta date → 07-06-2025 (Nirjala) and 22-06-2025 (Yogini).
* **Sankashti Chaturthi fallback**: when the Chaturthi contains no moonrise, the day with the largest overlap of the tithi with [sunrise, moonrise] is used → 10-10-2025. 12/12 months.
* **Pradosh** = Trayodashi present at sunset (unchanged; reproduces Mon 10-02-2025). **Janmashtami** = 16-08-2025 per the book (Ashtami at the midnight opening that date; the Smarta nishitha alternative gives 15-08).
* **Pava** (`pavaAt` in `lib/kundali.ts`, Planets tab): now the Moon's sign **at the instant Saturn entered its current sign**, counted from the natal Moon (previously Saturn's own house was used). Marked `≈` when the Moon changes sign within ±12 h of the computed ingress (Tier-2 ephemeris is only good to ~1 day).
* **Vimshottari**: `KundaliInput.yearDays` (default 365.2425) exposes the dasha year length.
* Known, deliberately unchanged (spec flags them as unresolved): year-entry Delhi lagna 32′ vs the printed 29°35′; Shukra asta end date; planet minutes beyond Tier-2 accuracy (±0.1–0.2°). The app has no asta/combustion feature, so correction #9 has no code to change.
* New test: `tsx test/test-spec-corrections.ts` (reference values from the spec's `verify_all.py`).
