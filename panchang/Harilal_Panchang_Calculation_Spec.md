# Harilal-style Gujarati Panchang — Machine Calculation Specification

**Purpose.** Everything needed to regenerate, from nothing but a date range and a place, the data printed in the *Harilal Printing Press Panchang (Vikram Samvat 2081)* — and for any other Samvat/place — by code. Every rule in the uploaded `Panchang_README.md` that is *computable* is specified here, implemented in a pure-Python reference engine (stdlib only), and cross-checked by an executable suite (`verify_all.py`, **81 checks, 81 pass**). Where the old document was wrong, ambiguous or incomplete this file says so explicitly (§0.4).

> **How an AI/code consumer should use this file:** (1) read §0–§3; (2) implement or import the code listed in §18 (it is the *normative* definition of every table and series); (3) run `python verify_all.py` — if anything fails, your environment (Python version, float behaviour, time-zone handling) differs and the output must not be trusted; (4) generate with `pk_build.build_samvat(year, place)`.

---

## 0. Status, honesty and scope

### 0.1 Status legend (used in every section)
| Tag | Meaning |
|-----|---------|
| **[T]** | Implemented **and** checked against an independent reference (published astronomy, NASA, or the printed book). Check id given as `A1…G12`. |
| **[I]** | Implemented, internally consistent (invariants hold), not comparable with any printed value. |
| **[R]** | Rule text only (no code); follows the printed book or standard texts. |
| **[D]** | Not derivable — a *data table that must be keyed from the printed page* (schema given in §15.2). |

### 0.2 Accuracy tiers (what "perfect" can mean)
| Tier | Quantities | Method | Measured accuracy |
|------|-----------|--------|-------------------|
| **1** | Sun, Moon, Rahu/Ketu(mean), tithi/nakshatra/yoga/karan/rashi *end times*, sunrise/sunset, moonrise, sankranti, ritu/ayana, new/full moons, all muhurat windows, all vrat & festival dates, lunar eclipse circumstances, local solar eclipse | VSOP87D-Earth + AA2 ch.47 Moon + Lahiri | Sun 0.001° (equinoxes ±20 s of USNO); Moon exact to AA2 example (1e-6°); limb end-times ±30 s; **every printed Rajkot value I could test agrees to the printed minute** |
| **2** | Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto: positions, retro/direct stations, asta, ingress dates | JPL/Standish Keplerian elements 1800-2050 | ±0.1–0.2° (Jupiter/Saturn worst). Ingress/stations good to ±1 day; **not good to the minute**. |
| **Plug-in** | Printed daily planet table (pp. 40-51) to the minute; Saturn-ingress minute for *Pava*; Jupiter/Saturn ingress minute | Swiss Ephemeris / JPL DE | Replace `sidereal_planet()` (one function, §4.7) — nothing else changes. |

> **There is no honest way to *guarantee* digit-for-digit identity with a printed book for Tier 2 using only the stdlib.** Tier 1 is complete and verified. For Tier 2 the interface is fixed so a better ephemeris can be dropped in without touching any rule.

### 0.3 What is NOT derivable from astronomy (must be keyed from the printed pages) — **[D]**
Taken from the old document's own §15.3 list and confirmed by my own attempt to derive them:
Din-dasha day counts (p.1) · Ashtottari nakshatra grouping (p.38) · ghat-chakra cells (p.38) · panchaparva/small chakra patterns Khat/Dwar/Mobh/Hal/Koop (pp.32-33) · asta exceptions list (p.35) · Gorakh-ank & Dishakaal row (p.39) · rajyoga/nishphal combination table (p.76) · lagna-sarani numbers (p.78) · rashi-milan table, sutak relationship table, Jain yantras (p.79) · guna-milan plate numbers (last plate; the *standard* Ashtakoota tables are implemented in `pk_tables.py` and flagged as variants) · Chaitri-dunaiya rows (p.25; rule never stated in the source) · numerology/essay/forecast text (pp. 3-20, 40-51, 76-80) · mantra/shloka text.
Their JSON schemas are in §15.2. **Nothing in this list can be "calculated"; a code generator must read it from the book or a licensed copy.**

### 0.4 Corrections / changes relative to the uploaded `Panchang_README.md` (all verified by code)
| # | Old statement | Finding | Evidence |
|---|---------------|---------|----------|
| 1 | Sun accurate only to 0.01°, needs "+14″ ayanamsa" to match book | Replaced by VSOP87D Earth. **No offset needed** (default `AYANAMSA_OFFSET_ARCSEC = 0`). Makar Sankranti = 14-01-2025 **08:55:33** (book 08:56), Ardra pravesh 22-06 **06:19** (book ≈06:19), equinoxes within 20 s of USNO. | A4, C7, C9 |
| 2 | Lunar eclipse 14-03-2025 "visible in India" | **Not visible**: Moon is below the horizon at Rajkot from first penumbral contact 09:26 to 15:31 IST (greatest 12:28, daytime). Only 07-09-2025 is visible ⇒ sutak applies only to it. *(Verify against the printed p.28.)* | A11 |
| 3 | Pradosh = "tithi at sunset" described, but the old engine code used overlap | Final rule: Trayodashi (13/28) **present at sunset**; fallback to largest overlap with Pradosh-kaal. Reproduces *all* printed Shani/Som/Bhom/Bhanu Pradosh dates incl. Mon 10-02-2025 (overlap rule would give 09-02). | E4 |
| 4 | Vaishnava Ekadashi rule not stated | **Last** civil date on which the Ekadashi is present at *arunodaya* (sunrise − 96 min); fallback Smarta. Yields exactly the two printed dual dates (06/07-06, 21/22-06) and no others. | E1, E2 |
| 5 | Janmashtami | Book/Gujarat prints **16-08-2025** = Ashtami at sunrise (*udaya*). The Smarta *nishitha* rule gives 15-08. Engine uses `udaya` for the book edition; `nishitha` is the documented alternative. | E11 |
| 6 | Sankashti Chaturthi (moonrise rule) | Rule fails in months where Chaturthi is present at no moonrise (Oct 2025). Added fallback: largest overlap of the tithi with [sunrise, that day's moonrise] ⇒ **10-10-2025** (Karva-Chauth day). 12/12 months now produced. | E12 |
| 7 | Year-entry Delhi lagna: engine 29°12′ vs book 29°35′ "23′ off, cause not isolated" | With the accurate Sun/Moon it is 29°03′ (**32′** off). The book value cannot be reproduced from the stated inputs (time 18:17 IST, Delhi 28.61 N 77.21 E, Lahiri). Likely the book uses a different place/time/ayanamsa for that chart. **Unresolved — flagged, not fixed.** | F4 (houses pass; degree does not) |
| 8 | Vimshottari "ends 22-01-2031" | Engine 24-01-2031 with year = 365.2425 d (balance 6.23 y). Printed value implies balance 6.22 y / different year length. Parameter `year_days` exposed. | F6 (tolerance) |
| 9 | Shukra asta 18-03 → 23-03 | Engine (orb 8° when retrograde) 18-03 → 28-03; 23-03 is the *inferior conjunction*, not the end of asta. The printed "23" may be a misreading. **Flagged.** Guru asta: engine 09-06 → 10-07, book 11-06 → ≈09-07 ✓ (within 2 days). | E14 |
| 10 | Pava at Saturn ingress "reproduces all 10 cases" | Not re-testable with Tier-2: my Saturn→Kumbh ingress (17-01-2023) is 05:05 IST vs the true evening ingress, which moves the Moon across a sign. Code returns `uncertain-use-Tier1-ephemeris` when the Moon changes sign within ±12 h of the computed ingress. | `pava_with_confidence` |

---

## 1. Files and how to run
| File | Role | Lines |
|------|------|------:|
| `pk_astro.py` | time, ΔT, Sun (VSOP87D), Moon (AA2 47), nodes, Lahiri ayanamsa, planets (Tier 2), sunrise/sunset/moonrise, ascendant, **robust root-finder** | 524 |
| `pk_tables.py` | every constant table (names GU/EN, yoga/karan/tithi data, weekday tables, avakahada, yoni, dasha years, …), all nakshatra tables written **by name** (index typos impossible) | 252 |
| `pk_cal.py` | limbs, segments, lunations, adhik/kshaya, eras, sankranti, ritu/ayana, Easter/Hijri/Parsi, day record | 369 |
| `pk_eclipse.py` | lunar & local solar eclipse circumstances, visibility, sutak | 142 |
| `pk_rules.py` | muhurat windows, yogas, kumuhurta, festival/vrat engine, gochar/panoti/pava, kundali, dashas, guna-milan | 509 |
| `pk_build.py` | assembles one printed row / a whole Samvat with events | 120 |
| `verify_all.py` | 81 executable cross-checks | 274 |

Requirements: CPython ≥ 3.9, no third-party packages. Whole Samvat ≈ 26 s; one day ≈ 0.07 s.
```bash
python verify_all.py            # must print "81 checks, 81 passed, 0 failed"
python -c "import pk_build as b; b.write_json(b.build_samvat(2024), 'samvat2081.json')"
```

---

## 2. Normative conventions
1. **Angles** degrees, normalised to [0,360) with `norm360`; differences with `wrap180` ∈ [−180,180). Never subtract raw angles.
2. **Time**: all astronomy in **JD(UT)**; ΔT only when evaluating `jde = jd + ΔT/86400` for the ephemeris. Output times are fixed-offset local (`Place.tz`, hours east; IST = 5.5). For DST places pass the offset valid on the date.
3. **Indices**: rashi 0..11 (Mesh=0); nakshatra 0..26 (Ashwini=0); weekday 0..6 (Sunday=0); yoga 0..26; tithi 1..30 (Sud 1 = 1 … Sud 15 = 15 Purnima, Vad 1 = 16 … Vad 30 = 30 Amavasya); karana 1..60; month 0..11 in **Kartikadi** order (Kartak=0).
4. **Sidereal = Lahiri**: `λ_sid = λ_apparent(mean equinox of date, no nutation) − A_mean(t)`; nutation cancels against the mean ayanamsa exactly as Swiss `SIDM_LAHIRI` does. **Tropical** quantities (ritu, ayana, equinox, RA/Dec for rise/set) use the **true** equinox (nutation added).
5. **Hindu day**: from sunrise to next sunrise. "Value at sunrise" is evaluated at `sunrise + 1 s`. Weekday of a Hindu day = weekday of the civil date of its sunrise.
6. **Sunrise/sunset**: upper limb, geometric altitude `h0 = −0.8333°` (34′ refraction + 16′ semi-diameter) at sea level; observer elevation lowers `h0` by `1.76′·√h[m]`. Moonrise/set threshold `h0 = 0.7275·π − 0.5667°` (π = horizontal parallax).
7. **Time notation of the book "ક.મિ."**: `H.MM` where H counts hours from **midnight of the civil date of the row**, may exceed 24 (30.52 = 06:52 next day). Minutes are **truncated** (20:22:51 → `20.22`) — `MINUTE_ROUNDING = "floor"`.
8. **Ghati-pal**: 1 ghati = 24 min, 1 pal = 24 s; ghati = minutes/24; **clock → ghati: ×2.5** (hours.fraction × 2.5).
9. **Boundary rule**: a limb number is `floor(angle/unit)`; the boundary instant belongs to the *new* limb. End times are roots of a monotone angle (see §4.9), never interpolations.
10. **Failure contract (§17)**: functions return `None`/flags for "no event"; they never raise for astronomical reasons and never loop unboundedly.

---

## 3. The pipeline (the only order that works)

```
INPUT: Place(lat, lon_east, tz, elevation), date range, config
S1  JD/ΔT                       → §4.1-4.2
S2  Sun(t), Moon(t), ayanamsa   → §4.3-4.6      (pure functions of jde)
S3  generic solver              → §4.9           (everything below is solve_crossing(f, target, t0, t1))
S4  sunrise/sunset per civil day→ §4.8           ⇒ Hindu-day bounds [sr_d, sr_{d+1}]
S5  limbs at sunrise + end times + all segments in the Hindu day → §5
S6  new moons → lunations → month names, adhik/kshaya → §6
S7  eras (VS, Shaka, Vir, Samvatsara), Hindu date of each civil date → §6.3-6.5
S8  solar events: sankranti, ritu/ayana, Sun-nakshatra entries, Makar punya-kaal → §7
S9  daily windows: chaughadiya, hora, rahu/yama/gulika, abhijit, brahma, godhuli … → §8
S10 yogas/flags per day → §9 ; kumuhurta periods → §10
S11 vrat & festival engine (needs S5, S6, moonrise) → §11
S12 planets, stations, asta, gochar/panoti/pava → §12
S13 eclipses & sutak → §13
S14 kundali/dasha/matching on request → §14
OUTPUT: rows (§15.1) + event list
```

---

## 4. Astronomy — normative formulas

### 4.1 Julian Day **[T A3]**
`A = ⌊y/100⌋, B = 2 − A + ⌊A/4⌋` (Gregorian, on/after 1582-10-15; else `B=0`); for `m ≤ 2: y−=1, m+=12`.
`JD = ⌊365.25(y+4716)⌋ + ⌊30.6001(m+1)⌋ + d + h/24 + B − 1524.5`.
Vectors: 2000-01-01 12h → 2451545.0 ; 1987-01-27 0h → 2446822.5 ; 1957-10-04 19.4333h → 2436116.31.
Inverse (AA2 ch.7) = `cal_from_jd`. Weekday of civil date: `(JDN+1) mod 7` with `JDN=⌊JD_noon+0.5⌋`; Python: `(date.weekday()+1) % 7`.
`local_midnight_jd(y,m,d,tz) = JD(y,m,d,0h) − tz/24`.

### 4.2 ΔT **[I]** Espenak–Meeus polynomials (code `delta_t`). 2005-2050: `62.92 + 0.32217t + 0.005589t²` (t = year−2000). Error in 2024-26 ≈ 4 s (⇒ ≤ 4 s on a tithi end). Optional override: IERS value.

### 4.3 Sun **[T A2, A4, G6]**
Earth heliocentric longitude `L = (Σ_k τ^k Σ A·cos(B + Cτ))·10⁻⁸ rad`, `τ = (JDE−2451545)/365250`, series `L0…L5` (64+34+20+7+3+1 terms, table `_L0.._L5` in code).
`λ_geom = L + 180°`. Aberration `−20.4898″/R`, `R` from `1.000001018(1−e²)/(1+e cos ν)`.
`λ_app,mean = λ_geom − 20.4898″/R` (sidereal use) ; `λ_app,true = λ_app,mean + Δψ` (tropical use). Nutation Δψ = `−17.20″ sin Ω − 1.32″ sin 2L − 0.23″ sin 2L′ + 0.21″ sin 2Ω` (±0.5″).
Vectors: JDE 2448908.5 → `L = 19.907372°` (AA2 25.b, exact). Equinox/solstice instants within ±20 s of USNO (2024-03-20 03:06, 2024-12-21 09:21, 2025-03-20 09:01, 2025-06-21 02:42, 2025-09-22 18:19 UT).
Independent cross-check: low-accuracy AA2 ch.25 Sun agrees within 0.012° over 100 random epochs 1950-2100 (**G6**).

### 4.4 Moon **[T A1]**
AA2 ch.47: arguments `L′, D, M, M′, F, A1, A2, A3, E` (polynomials in T); 60 longitude terms `Σl` (+ `3958 sin A1 + 1962 sin(L′−F) + 318 sin A2`), 60 latitude terms `Σb` (+ `−2235 sin L′ + 382 sin A3 + 175 sin(A1−F) + 175 sin(A1+F) + 127 sin(L′−M′) − 115 sin(L′+M′)`), distance terms `Σr`; every term with `M` multiplied by `E^|m|`.
`λ = L′ + Σl/10⁶`, `β = Σb/10⁶`, `Δ = 385000.56 + Σr/1000 km`. Result is geocentric, mean equinox of date.
Vector (AA2 47.a): JDE 2448724.5 → **133.162655°, −3.229126°, 368409.7 km** (all three reproduced to the printed digit).

### 4.5 Nodes **[T F2]**
Mean node `Ω = 125.0445479 − 1934.1362891T + 0.0020754T² + T³/467441 − T⁴/60616000` (tropical). Rahu = `Ω − A`, Ketu = Rahu+180°. Optional true node: add `−1.4979 sin 2(D−F) − 0.1500 sin M − 0.1226 sin 2D + 0.1176 sin 2F − 0.0801 sin 2(M′−F)`. **Default mean** (reproduces the printed 18-05-2025 19:33 Kumbh ingress; the book's day table may be true-node — [D]).

### 4.6 Lahiri ayanamsa **[T A5, A6]**
`A(t) = 23.250182778 − 0.004658035 + (p(T) − p(T0))/3600`, `p(T) = 5029.0966T + 1.11113T² − 0.000006T³ (arcsec)`, `T0 = (2435553.5−2451545)/36525` (1956-03-21 0h). Plus user `AYANAMSA_OFFSET_ARCSEC` (default 0; **+14″ ⇒ +5.5 min on a sankranti, G8**).
Vectors: J2000 → 23°51′25.5″ ; 2024-11-02 → 24°12′14.6″ ; 2025-01-14 → 24°12′24.7″ ; rate 50.29″/yr.

### 4.7 Planets (Tier 2) **[T F1-F3]**
Standish elements `(a,e,I,L,ϖ,Ω)` + rates for the 9 bodies (table `_STD`). `M = wrap180(L−ϖ)`, solve Kepler `E − e sinE = M` by Newton (≤50 it., tol 1e-12), `ω = ϖ−Ω`, rotate with `ω,I,Ω` to J2000 ecliptic. Geocentric = planet − EMB, light-time iteration ×3, precession to date `+p(T)/3600`, aberration `−20.49552″·cos(λ☉−λ)/cos β`. Sidereal = `λ − A(t)`. Speed = central difference ±0.25 d; retrograde ⇔ speed < 0.
Interface for plug-in: `sidereal_planet(name, jde) → degrees` — **replace this single function** with `swe.calc_ut(...)−swe.get_ayanamsa_ut(...)` to reach minute-level planetary tables.
Checks: J2000 geocentric Mercury 271.894, Venus 241.570, Mars 327.968, Uranus 314.794, Neptune 303.185, Pluto 251.448 (all agree with almanac values to 0.01°); Saturn→Meen 29-03-2025, Jupiter→Kark 18-10-2025, Saturn R 13-07 / D 28-11-2025, Jupiter D 04-02-2025, mean-Rahu→Kumbh 18-05-2025 19:33 (**F1-F3 pass**). Known weakness: Jupiter 0.10°, Saturn 0.16° at J2000.

### 4.8 Sunrise / sunset / moonrise **[T B1, G7]**
`solar_altitude(t) = asin(sin φ sin δ + cos φ cos δ cos H)`, `H = GMST(t) + λ_E − α`, `α,δ` from apparent λ☉ (true equinox) and true obliquity `ε`.
`GMST = 280.46061837 + 360.98564736629(JD−2451545) + 0.000387933T² − T³/38710000`.
**Algorithm `horizon_events`:** scan the civil day `[local_midnight, +1 d]` in 10-min steps for sign changes of `alt − h0`, bisect each bracket 60 times. Rising ⇔ altitude increases. Returns zero, one or two events — so polar day/night and moonless days are handled without special cases.
Vector: Rajkot (22.3039 N, 70.8022 E, IST) 2024-11-02 → **06:51:34 / 18:08:50**; solved altitude equals −0.8333° to < 1e-6° (G7).
Ascendant (tropical) `atan2(cos θ, −(sin θ cos ε + tan φ sin ε))`, `θ = GMST + λ_E` (RAMC); MC `atan2(sin θ, cos θ cos ε)`; sidereal = − `A`. Sunrise lagna ≈ Sun's longitude (checked: 195.07° vs 195.91°).

### 4.9 THE event solver (guarantees termination) **[T G1]**
```
solve_crossing(f, target, t_lo, t_hi, scan = 1/24 d, tol = 1e-8 d):
    g(t) = wrap180(f(t) − target)            # f is an INCREASING angle (elongation, Moon, Sun, Sun+Moon)
    walk t from t_lo in steps `scan`; find first step with g(a) < 0 ≤ g(b) and (g(b)−g(a)) < 180
    bisect that bracket ≤ 80 times → return midpoint
    return None if t_hi reached                # never raises, never loops forever
```
Scan 1 h is safe because the fastest quantity (elongation, ≤ 15.4°/d ⇒ 0.64°/h) can never skip a 6° boundary. Maximum span per limb: tithi 2.0 d, karana 1.3 d, nakshatra 1.6 d, yoga 1.6 d, Moon-rashi 3.6 d, Sun-rashi 33 d. For decreasing angles (Rahu, retrograde planets) solve on `(−angle) mod 360`.
Invariant tests (G1): 240 random days 1950-2100 × 6 places → segments ordered, contiguous, last end = next sunrise, elongation at every interior tithi end is a multiple of 12° to 1e-4°.

---

## 5. The five limbs (પંચાંગ) **[T B1-B5, D4]**

| Limb | Angle | Unit | Number | Names |
|------|-------|------|--------|-------|
| Tithi | `D = norm360(λ☾ − λ☉)` (apparent Sun, mean equinox) | 12° | `⌊D/12⌋+1` ∈ 1..30 | `TITHI_EN/GU`; 1-15 Sud, 16-30 Vad (30 = Amavasya) |
| Karana | same `D` | 6° | `k=⌊D/6⌋+1` ∈ 1..60 | `k=1` Kimstughna; `k=58` Shakuni; `59` Chatushpada; `60` Naga; else `KARANA_MOVABLE[(k−2) mod 7]` = Bava, Balava, Kaulava, Taitila, Gara, Vanija, **Vishti(=Bhadra)** |
| Yoga | `norm360(λ☉_sid + λ☾_sid)` | 360/27 | `⌊·⌋+1` ∈ 1..27 | `YOGA_EN/GU` (Vishkambha … Vaidhriti; **Vyatipata #17 & Vaidhriti #27 inauspicious**) |
| Nakshatra | `λ☾_sid` | 360/27 = 13°20′ | `⌊·⌋+1` ∈ 1..27 | `NAK_EN/GU`; **pada** = `⌊(λ mod 13.333)/3.3333⌋+1` |
| Moon rashi | `λ☾_sid` | 30° | `⌊λ/30⌋+1` | `RASHI_*` |
| Vaar | JDN | — | `(JDN+1) mod 7` | Sun..Sat |

**End time of the limb in progress at `t`**: `solve_crossing(angle, ((n+1)·unit) mod 360, t, t+span)` where `n=⌊angle(t)/unit⌋`. **Start**: same with target `n·unit` over `[t−span, t]`.
**Segments in a Hindu day**: repeat from `sunrise+1 s` to `next_sunrise`; the last segment is clipped at next sunrise (printed as the next-day clock, e.g. `30.52`).
**Abhijit nakshatra** (sidereal Moon 276°40′ → 280°53′20″, span **253′20″**, matches printed "૨૫૩ કલા ૨૦ વિકલા") — a 28th, partial nakshatra between U.Ashadha and Shravana; **[T D5]** span only.
**Kshaya / vriddhi tithi** **[I]** (`tithi_flags_for_range`): from consecutive sunrise tithis `t_i, t_{i+1}`: `Δ=(t_{i+1}−t_i) mod 30`; `Δ=0` ⇒ *vriddhi* (same tithi on 2 sunrises → printed "n/n"); `Δ≥2` ⇒ *kshaya* of tithis `t_i+1 … t_i+Δ−1` (they begin and end inside one Hindu day). Samvat 2081 contains both.
**Reference row (Rajkot, Sat 02-11-2024)** — printed `ક.મિ.` strings reproduced by `build_row`:
`sunrise 6.51 · sunset 18.08 · Tithi Sud-1 ends 20.22 then Sud-2 to 30.52 · Vishakha ends 29.58 then Anuradha · Ayushman ends 11.17 then Saubhagya · Kimstughna ends 7.22, Bava ends 20.22, Balava · Moon Tula until 23.23 then Vrushchik (⇒ Vinchhudo begins 23.23)`.

---

## 6. Months, adhik/kshaya, eras

### 6.1 Lunation (amānta) **[T C1-C3, C6]**
1. New moons: roots of elongation = 0°: guess `jd − D/12.1908`, refine with `solve_crossing(…, ±2 d)` (always brackets).
2. Lunation `i` = `[N_i, N_{i+1})`. `r_i = ⌊λ☉_sid(N_i)/30⌋`.
3. **Month name** = `MONTH_OF_SUN_RASHI[r_i]`: Meen→Chaitra, Mesh→Vaishakh, Vrushabh→Jeth, Mithun→Ashadh, Kark→Shravan, Simh→Bhadarvo, Kanya→Aaso, Tula→Kartak, Vrushchik→Magshar, Dhan→Posh, Makar→Maha, Kumbh→Fagan.
4. **Adhik** ⇔ `r_i == r_{i+1}` (no sankranti inside); its name is that of the **following nija month** (same `r`). **Kshaya** ⇔ `(r_{i+1}−r_i) mod 12 == 2` (rare: reported in G4 for 1900-2100; handle by flagging, no automatic renaming).
5. `borderline=True` if the Sun is within 0.2° (~5 h) of a rashi boundary at either new moon — the one situation where school differences and Tier-1 noise can flip adhik/nija; consumers must surface it.
6. **Civil mapping (sunrise rule)**: first civil day of a lunation = first date whose sunrise is **after** `N_i`; last = day before the first day of the next. Samvat 2081: 12 months, **354 days**, dates exactly as printed p.24: Kartak 02-11→01-12, Magshar 02-12→30-12, Posh 31-12→29-01, Maha 30-01→27-02, Fagan 28-02→29-03, Chaitra 30-03→27-04, Vaishakh 28-04→27-05, Jeth 28-05→25-06, Ashadh 26-06→24-07, Shravan 25-07→23-08, Bhadarvo 24-08→21-09, Aaso 22-09→21-10.
Sanity over 1900-2100 (G3-G5): 2400 lunations 29.27–29.84 d; adhik count within 68-78; Samvat lengths ∈ {354,355,383,384,385}. **Adhik Jeth 2026: 17-05 → 15-06 (C5).**

### 6.2 Hindu date of a civil date **[T]** `hindu_date`: tithi at `sunrise+1 s` → paksha/number; lunation of `new_moon_on_or_before(sunrise)`; month name with `Adhik` prefix. Printed paksha numbering: Sud 1-15, Vad 1-14, then **30** (Amavasya).

### 6.3 Eras **[T C4]**
| Era | Rule |
|-----|------|
| Vikram Samvat (Gujarat, Kartikadi) | `VS = Y+57` from **Kartak Sud 1** (first civil date of the nija lunation with `r_i = Tula`) to the day before the next one; `Y+56` before it. 2081 = 02-11-2024 … 21-10-2025. |
| Vikram (Chaitradi, North) | same with Chaitra Sud 1 (`system="chaitradi"`) |
| Shaka | `Y−78` from Chaitra Sud 1 (Gudi Padwa) else `Y−79`; 1947 begins 30-03-2025 |
| Vir (Mahavir) Samvat | `VS + 470` (2551 → 2081; changes at Kartak Sud 1) |
| Samvatsara (60-year) | `i = (VS+9) mod 60 (0→60)` → `SAMVATSARA[i]`. **Book prints 2081 = Anala/Nala (#50)**. North Indian lists name 2081 "Kalayukta"; Shaka-based `(Shaka+12) mod 60` gives Krodhi. **Config `samvatsara_offset`; regional — [D] confirm with the book's page.** |
| Indian national (Saka civil) | rule only **[R]**: Chaitra 1 = 22 March (21 March if the Gregorian year is leap); months 30/31 days; year = Shaka |
| Bengali (solar) / Malabar-Kollam / Simhastha | **[R]**: year changes at Mesh / Kanya (Kollam) / Simha sankranti; Bengali San = CE−593 from Mesh sankranti, Kollam = CE−824 from Simha sankranti |
| Gregorian leap | `y%4==0 and (y%100!=0 or y%400==0)` **[T C14]** |
| Christian | Easter (AA2 ch.8 Gregorian computus) **[T C11]**: 2025-04-20; Good Friday = −2 d |
| Hijri (tabular civil) | 30-year cycle, leap years {2,5,7,10,13,16,18,21,24,26,29}, epoch JDN 1948440 **[T C12]** 1 Muharram 1447 = 27-06-2025. Real (sighted) dates can differ ±1 day — **[D]** use the printed date when it differs |
| Parsi (Shahenshahi) | 365-day year, no leap day, anchor **1 Farvardin 1395 = 15-08-2025** (book Pateti/Navroz); month = `idx//30`, Roj = `idx%30`; days 360-364 are the five Gatha days **[T C13]**. Fasli/Kadmi variants [R]. |
| Gujarati date converter | combine §6.2 + §6.3 + `hijri_tabular` + `parsi_date` |

---

## 7. Solar events **[T C7-C10]**
* **Sankranti** `sankrantis(a,b)`: Sun sidereal crosses `30k°` (solve with 33-day span). Samvat 2081 (IST): Vrushchik 16-11, Dhan 15-12, **Makar 14-01-2025 08:55**, Kumbh 12-02, Meen 14-03, Mesh 14-04, Vrushabh 15-05, Mithun 15-06, Kark 16-07, Simh 17-08, Kanya 17-09, Tula 17-10 (dates checked C8).
* **Makar Sankranti punya-kaal**: from the sankranti to sunset if it occurs in daytime (printed to 18:23); if the sankranti is at night, the next morning — [R] school rule. **Daan list by rashi group** `SANKRANTI_DAAN`.
* **Ritu/ayana** (tropical true-equinox Sun): Shishir 270-330, Vasant 330-30, Grishma 30-90, Varsha 90-150, Sharad 150-210, Hemant 210-270. Ayana: Uttarayan 270→90, Dakshinayan 90→270. Gol: Uttara-gol Sun in 0-180 trop. Events (IST): Uttarayan 21-12-2024, Vasant 18-02-2025 (book 18/19), 20-03 equinox, Grishma 20-04, Dakshinayan 21-06, Varsha entry as printed, 22-09 equinox (C10).
* **Sun-nakshatra entries (rain table)** `sun_nakshatra_entries`: sidereal Sun crossing `k·13°20′`. Samvat 2081 (IST): **Ardra 22-06-2025 06:19, Punarvasu 06-07 05:48** (C9). Vahan/rain/crop meanings [D]. Rule for the printed *Hindu day*: the entry belongs to the Hindu day (sunrise-to-sunrise) containing it — i.e. before sunrise ⇒ previous civil date.
* **Dhanarka** = Sun in Dhan (sidereal 240-270); **Meenarka** = Sun in Meen (330-360).

---

## 8. Daily windows (JD inputs `rise, set, next_rise`; weekday 0=Sun) **[T D1-D5]**
| Item | Formula |
|------|---------|
| **Chaughadiya** | cycle `C=[Udveg, Chal, Labh, Amrit, Kaal, Shubh, Rog]`. Day: `[rise,set]/8`, slot *i* = `C[(3·wd + i) mod 7]`. Night: `[set,next_rise]/8`, slot *i* = `C[(3·wd + 5 + 5i) mod 7]`. Good = Shubh, Amrit, Labh, Chal. Verified for 7 weekdays × 16 slots; Monday-day = Amrit,Kaal,Shubh,Rog,Udveg,Chal,Labh,Amrit; Sunday-night = Shubh,Amrit,Chal,Rog,Kaal,Labh,Udveg,Shubh. |
| **Hora** | 12 day + 12 night equal parts; order Saturn→Jupiter→Mars→Sun→Venus→Mercury→Moon (cyclic); first hora of the day = weekday lord (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn). Good: Moon, Mercury, Jupiter, Venus. Hora 13 = night's first. |
| **Rahu / Yama / Gulika** | day `[rise,set]` split in 8; part numbers by weekday (Sun..Sat): Rahu `8,2,7,5,6,4,3`; Yamaganda `5,4,3,2,1,7,6`; Gulika `7,6,5,4,3,2,1`. With 06:00-18:00 base (`fixed_6_to_18`) all 21 printed windows reproduced (Rahu Sun 16:30-18:00 … Sat 09:00-10:30). |
| **Abhijit muhurta** | 8th of the 15 daytime muhurtas: `[rise + 7d/15, rise + 8d/15]`, `d = set−rise`. (Not valid on Wednesday per tradition; Wed Abhijit is [R] "avoid"). |
| **Brahma muhurta** | `[rise − 96 min, rise − 48 min]` |
| **Pratah/Madhyahna/Aparahna** | day in 5 parts: madhyahna = 3rd `[rise+0.4d, rise+0.6d]`; aparahna = 4th `[+0.6d, +0.8d]` |
| **Godhuli** | `[set−12 min, set+12 min]` |
| **Sandhya** | evening `[set, set+night/10]`, morning `[next_rise − night/10, next_rise]` |
| **Pradosh kaal** | `[set, set+2 h 24 min]` |
| **Nishitha / madhyaratri** | `set + night/2 ± 24 min` |
| **Dinman / Ratriman** | day/night lengths in hours |
| **Disha-shool** | weekday → avoid direction: Mon,Sat E; Thu S; Wed,Tue N… per `DISHA_SHOOL` (Sun,Fri W) |
| **Chandra disha / Moon-rashi direction** | by Moon rashi: Mesh,Simh,Dhan E; Vrushabh,Kanya,Makar S; Mithun,Tula,Kumbh W; Kark,Vrushchik,Meen N *(standard; [R])* |
| **Moonrise / moonset** | `moonrise_moonset_jd` (§4.8); Chandra-darshan = first visibility ≈ Sud 2 moonrise after sunset |

---

## 9. Yogas and day flags (`weekday_flags`, `ravi_yoga`, `agni_chakra`, `ahuti_chakra`, `tara_bal`, `chandra_bal`, `vishti_windows`) **[T E13; tables by name]**
Tables are in `pk_tables.py`, written by **nakshatra name** (so they are index-safe) and compared with the printed lists.
| Flag | Rule |
|------|------|
| **Kankach (Krakacha)** | `tithi_in_paksha + (weekday+1) = 13` ⇒ weekday list `[12,11,10,9,8,7,6]` |
| **Dagdha** | tithi by weekday `[12,11,5,3,6,8,9]` |
| **Vajramusal / Yamghant / Utpat / Mrityu / Kaal / Rakshas** | Moon's nakshatra equals the weekday entry (tables `*_NAK`; e.g. Vajramusal = Bharani, Chitra, U.Ashadha, Dhanishtha, U.Phalguni, Jyeshtha, Revati) — **inauspicious** |
| **Amrit-siddhi** | Sun Hasta · Mon Mrigashira · Tue Ashwini · Wed Anuradha · Thu Pushya · Fri Revati · Sat Rohini — **auspicious** |
| **Siddhi** | Sun Mula · Mon Shravana · Tue U.Bhadrapada · Wed Krittika · Thu Punarvasu · Fri P.Phalguni · Sat Swati |
| **Sarvartha-siddhi** | standard weekday→nakshatra sets (`SARVARTHA_SIDDHI`) |
| **Jvalamukhi** | tithi 1 Mula · 5 Bharani · 8 Krittika · 9 Rohini · 10 Ashlesha (inauspicious) |
| **Tripushkar** | tithi ∈ {2,7,12} ∧ weekday ∈ {Sun,Tue,Sat} ∧ nakshatra ∈ {Krittika, Punarvasu, U.Phalguni, Vishakha, U.Ashadha, P.Bhadrapada} |
| **Ravi-yoga** | count nakshatras inclusive from the **Sun's** nakshatra to the Moon's; ∈ {4,6,9,10,13,20} |
| **Guru-Pushya / Ravi-Pushya / Shani-Rohini / Bhom-Ashwini** | windows where Moon∈nakshatra on that weekday, clipped to the Hindu day `[sunrise, next_sunrise]` — **[T E6, E7]** Gurupushya 21-11-2024 07:03-15:35, 24-07-2025, 21-08-2025; Ravipushya 09-03 23:55→, 06-04 06:34→, 04-05 06:12-12:53 |
| **Bhadra (Vishti)** | karana segments with `(k−2) mod 7 = 6`; loka by Moon rashi: Kark,Simh,Kumbh,Meen = **earth (harmful)**; Mesh,Vrushabh,Mithun,Vrushchik = heaven; Kanya,Tula,Dhan,Makar = nether |
| **Panchak** | Moon sidereal in Kumbh+Meen (300°→360°); kind by weekday of start: Sun *Rog*, Mon *Raj*, Tue *Agni*, Fri *Chor*, Sat *Mrityu*, Wed/Thu none **[T E8: 09-11-2024 23:27 → 14-11 03:11]** |
| **Vinchhudo** | Moon in Vrushchik (210°→240°) **[T E8: 02-11 23:23 → 05-11 09:45]** |
| **Gandmool** | Moon in Ashwini, Ashlesha, Magha, Jyeshtha, Mula, Revati; **gandanta** = within `orb`(0.8°) of 0°,120°,240° sidereal |
| **Agni-chakra** | `n=(tithi_1_30 + (wd+1) + 1) mod 4`: 0,3 ⇒ earth (homa OK); 1 ⇒ sky; 2 ⇒ patala |
| **Ahuti-chakra** | count Sun-nak→day-nak inclusive; mouth = order `[Sun,Mercury,Venus,Saturn,Moon,Mars,Jupiter,Rahu,Ketu][⌊(c−1)/3⌋ mod 9]`; good = Mercury, Venus, Moon, Jupiter |
| **Tara-bal** | count janma-nak→day-nak inclusive, `r=c mod 9`: 1 Janma, 2 Sampat, **3 Vipat**, 4 Kshema, **5 Pratyari**, 6 Sadhaka, **7 Vadha**, 8 Maitra, 0 Param-maitra; bad = 3,5,7 |
| **Chandra-bal** | house of Moon from janma-rashi ∈ {1,3,6,7,10,11} good |
| **Nakshatra classes** | 16 shubh / 11 ashubh; 15 marriage nakshatras; 14 Sun-sanjna / 13 Moon-sanjna (+Abhijit); gender (14 male, 10 female, 3 neuter) — tables in `pk_tables.py` |
| **Yoga avoid-first-ghati** | `YOGA_AVOID_FIRST_GHATI` {Vishkambha 3, Atiganda 6, Shula 5, Ganda 6, Vyaghata 9, Vajra 9}, `YOGA_AVOID_FIRST_HALF` {Parigha} **[D: confirm against p.34]** |

---

## 10. Kumuhurta periods **[T E8-E10, G12]**
| Period | Rule |
|--------|------|
| Dhanarka | Sun in Dhan → ends at Makar sankranti (14-01-2025 08:55) |
| Meenarka | Sun in Meen (14-03-2025 18:50 → 14-04) |
| **Holashtak** | from the **start of Fagan Sud 8** (06-03-2025 10:51) to the **end of Fagan Sud 15** (14-03 12:24) |
| Chaturmas | Ashadh Sud 11 (Devshayani; 06-07-2025) → Kartak Sud 11 (Prabodhini; engine 02-11-2025 by the sunrise rule; **Smarta schools may print 01-11** [D]) |
| Pitru-paksha | Bhadarvo Vad 1 → Vad 30: **08-09 → 21-09-2025** |
| Adhik masa | `lunation.adhik` (2026: Jeth 17-05→15-06) |
| Guru/Shukra asta | `combustion_windows`: elongation < orb (Moon 12°, Mars 17°, Mercury 14°/12° retro, **Jupiter 11°, Venus 10°/8° retro**, Saturn 15°). Tier-2: Guru 09-06→10-07-2025 (book 11-06→≈09-07), Shukra 18-03→28-03-2025 |
| Vinchhudo / Panchak / Bhadra / Gandmool | §9 |
| Kharmas | = Dhanarka |
| Chaitri-dunaiya | **[D]** rule not stated in the source |

---

## 11. Vrat & festival engine (§ `pk_rules.py`) **[T E1-E12]**
**Resolver primitives** (all take a tithi interval `seg=(start,end)` and return a civil date):
| Rule | Definition |
|------|-----------|
| `udaya` | first civil date whose **sunrise** lies inside `seg` (vriddhi ⇒ first); if none (kshaya) ⇒ date on which the tithi starts |
| `madhyahna` / `aparahna` / `pradosh` / `nishitha` / `sandhya` | date with the **largest overlap** of `seg` with that window (ties ⇒ earlier) |
| `sunset` | first date whose sunset lies in `seg` |
| `moonrise` | first date whose moonrise lies in `seg`; fallback overlap with `[sunrise, that day's moonrise]` |
| `arunodaya` | sunrise − 96 min |

**Vrats**
| Vrat | Rule | Result |
|------|------|--------|
| **Ekadashi (Smarta)** | tithi 11/26 with `udaya` | 24/24 dates equal the book (E1) |
| **Ekadashi (Vaishnava)** | **last** date on which the tithi is present at arunodaya | differs only on 07-06 (Nirjala) and 22-06 (Yogini) (E2) |
| **Vrat-ni-Poonam** | tithi 15 present at moonrise | 12/12; Purnima ends 16-11 02:58 … 07-10 09:17 (E3) |
| **Pradosh** | tithi 13/28 present at **sunset** (fallback max overlap with 18:40-21:04) ; name by weekday (Som/Bhom/Shani/Bhanu pradosh) | 24 in the year; all printed dates incl. Mon 10-02-2025 (E4) |
| **Sankashti Chaturthi** | tithi 19 at moonrise (+fallback) ; moonrise time printed | 12/12; first 18-11-2024 20:19 (E12) |
| **Amavasya types** | Amavasya (tithi 30) overlaps any part of the Hindu day; weekday of that Hindu day ⇒ Somvati/Mangalvari/Budhvari/Shanivari | lists equal p.25 (E5) |
| **Masik Shivratri** | tithi 29 at nishitha |
| **Chopda-kharid / Diwali muhurat** | the day windows of §8 for the festival date (Dussehra 02-10, Ahoi Ashtami/Chopda kharid 14-10 (Vad 8), Dhanteras 18-10, Kali-Chaudas 19-10, Diwali 20-10, Nutan Varsh 22-10-2025, Bhai-Bij 23-10, Labh Pancham 26-10) |

**Festivals `FESTIVALS` = (name, month, tithi 1..30, rule)** — all 24 dates equal p.29 (E11): Nutan Varsh (Kartak 1 udaya) · Bhai Bij (Kartak 2 aparahna) · Labh Pancham (Kartak 5) · Dev Diwali (Kartak 15 pradosh) · Datta Jayanti (Magshar 15 pradosh) · Vasant Panchami (Maha 5) · Maha Shivratri (Maha Vad 14 = tithi 29, nishitha) · Holika Dahan (Fagan 15 pradosh) · Gudi Padwa (Chaitra 1) · Ram Navami (Chaitra 9 madhyahna) · Hanuman Jayanti (Chaitra 15) · Akshaya Tritiya (Vaishakh 3) · Buddha Purnima (Vaishakh 15 pradosh) · Rath Yatra (Ashadh 2) · Guru Purnima (Ashadh 15) · Raksha Bandhan (Shravan 15 udaya) · Janmashtami (Shravan Vad 8 = 23, **udaya**; Smarta alt. nishitha) · Ganesh Chaturthi (Bhadarvo 4 madhyahna) · Navratri (Aaso 1) · Dussehra (Aaso 10 aparahna) · Sharad Purnima (Aaso 15 pradosh) · Dhanteras (Aaso Vad 13 = 28 pradosh) · Kali Chaudas (29 nishitha) · Diwali (30 pradosh).
Further dated rules **[T H1]** `dashavatar_dates` (table `DASHAVATAR`, book p.38; time-of-day → rule: aparahna, sandhya, madhyahna, madhyaratri→nishitha): Dashavatar jayantis (Matsya Chaitra S3, Kurma Vaishakh S15, Varaha Bhadarvo S3, Narsimha Vaishakh S14, Vamana Bhadarvo S12, Parashuram Vaishakh S3, Ram Chaitra S9, Krishna Shravan V8 *(Madhyaratri ⇒ 15-08-2025; the p.29 Janmashtami entry uses udaya ⇒ 16-08 — the book itself uses two rules)*, Buddha **Aaso** S10 *(as printed)*, Kalki Shravan S6) — engine 2081: Matsya 31-03, Ram 06-04, Parashuram 30-04, Narsimha 10-05, Kurma 12-05, Kalki 30-07, Krishna 15-08, Varaha 25-08, Vamana 04-09, Buddha 01-10-2025 · Recurring monthly observances `MONTHLY_OBSERVANCES` (Sud 2 Chandra-darshan, Sud 4 Vinayak Chauth, Sud 8 Durgashtami, Sud/Vad 11 Ekadashi, Sud 15 Poonam, Vad 4 Sankat Chauth, Vad 8 Kalashtami, Vad 13 Pradosh, Vad 14 Masik Shivratri, Vad 30 Darsh Shraddha) · Hijri/Parsi/Christian/Jain/Pushtimarg/BAPS festival lists are **[D]** (tradition-specific dates). Sutak and snan-daan Purnima: `Jeth` vrat 10-06, snan 11-06.
**Holika Dahan Bhadra rule [R]**: Purnima at pradosh *after* Bhadra ends; if Bhadra spans the whole pradosh, use the Bhadra-mukha exclusion — date reported = the date whose pradosh contains Purnima (13-03-2025).

---

## 12. Planets, gochar, panoti, pava, aavak-javak

**Positions** `sidereal_planet(name, jde)` (Sun/Moon Tier 1, others Tier 2). Daily table = evaluate at the printed clock (book: 05:30 IST) for `Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, Uranus(હર્ષલ), Neptune, Pluto`; print sign + degrees + minutes; `R` if speed < 0 (Rahu/Ketu always retrograde in the mean-node model).
Reference (02-11-2024 05:30 IST, Tier-2): Mars Kark 5°02′, Mercury Vrushchik 4°40′, Jupiter Vrushabh 26°09′ R, Venus Vrushchik 24°06′, Saturn Kumbh 18°43′ R, Rahu Meen 10°28′ R, Uranus Vrushabh 1°40′ R, Neptune Meen 3°16′ R, Pluto Makar 5°31′ — the **signs equal the book's opening sentence**; minutes are Tier-2.
**Ingress** = `solve_crossing(sidereal_planet, 30k)` (decreasing for retrograde: use negated angle). **Station** = sign change of `planet_speed` on a 6-hour grid. **Asta** = §10.
**Gochar house** `h = (transit_rashi − natal_moon_rashi) mod 12 + 1`. Favourable from natal Moon: Jupiter {2,5,7,9,11}, Saturn {3,6,11}, Rahu {3,6,11}; **vedha** points: Jupiter 2↔12, 5↔4, 7↔3, 9↔10, 11↔8; Saturn 3↔12, 6↔9, 11↔5 (`VEDHA`). Printed table = this formula for 12 natal signs × (Saturn, Jupiter, Rahu) **[T F7]**.
**Panoti (Sade-sati / Dhaiya)** `panoti_phase`: Saturn in 12th/1st/2nd from natal Moon = **Mothi** (head/chest/feet); 4th and 8th = **Nani** (Kantak / Ashtam).
**Pava (metal)** `pava`: Moon's sign **at the instant Saturn enters the sign**, counted from natal Moon: {1,6,11} Gold · {2,5,9} Silver · {3,7,10} Copper · {4,8,12} Iron **[T F8 rule; ingress instant needs Tier-1 ephemeris — `pava_with_confidence` flags `uncertain-use-Tier1-ephemeris` when the Moon changes sign within ±12 h]**.
**Aavak-Javak** (p.18): `result = (aavak + javak − 1) mod 8` → 1 Labh, 2 Sukh, 6 Sanman, 7 Vijay, 3 Klesh, 4 Rog, 5 Lokapavad, 0 Nuksani. The 12×2 digit table `AAVAK_JAVAK` was **compared programmatically with the source (12/12 rows equal, printed results equal the rule)**; its printed digits remain "medium confidence" [D] until checked against the page.
**Planet strengths / nature** `pk_tables`: exaltation/debilitation degrees, own signs, mooltrikona, natural friends/enemies, benefics/malefics, special aspects (Mars 4,8; Jupiter 5,9; Saturn 3,10; all 7th), digbala houses, combustion orbs, house classes (kendra/trikona/dusthana/upachaya/maraka).

---

## 13. Eclipses and sutak (`pk_eclipse.py`) **[T A7-A12]**
* **Candidates**: every full moon (elongation 180°) / new moon (0°) from `full_moons/new_moons`.
* **Lunar** (geocentric shadow geometry): `sep = hypot(wrap180(λ☾−(λ☉+180))·cos β, β)`; `π☾=asin(6378.14/Δ)`, `π☉=8.794″/R`, `s☉=959.63″/R`, `s☾=0.272481π☾`; umbra radius `k(π☾+π☉−s☉)`, penumbra `k(π☾+π☉+s☉)` with **k = 1.015 (Danjon enlargement calibrated on NASA 2025-03-14 and 2025-09-07)**; magnitudes `(ρ+s☾−sep)/(2s☾)`. Contacts P1,U1,U2,max,U3,U4,P4 = roots of `sep = ρ ± s☾` around the ternary-search minimum. Result vs NASA: magnitudes 1.1791 (1.1804) and 1.3635 (1.3622); contacts of 07-09-2025 within **0.9 min**. **Type**: total if `um ≥ 1`, partial `0<um<1`, else penumbral.
* **Visibility at a place** `lunar_eclipse_visible`: Moon altitude above the rise/set threshold at any contact. Samvat 2081: **14-03-2025 not visible (Moon below horizon; correction §0.4-2), 07-09-2025 visible 20:57 → 02:25 IST, totality 23:00-00:23** ⇒ sutak applies only to the latter.
* **Solar, local** (`solar_eclipse_local`): topocentric RA/Dec of Sun and Moon (Meeus ch.40 parallax with `ρ sin φ′, ρ cos φ′`), minimise separation, `mag=(s☉+s☾−sep)/(2s☉)`, contacts at `sep = s☉+s☾`; visible if the Sun is above −0.83° at max or a contact. Checks: Dallas 2024-04-08 total at 18:42 UT (**A8**); **29-03-2025 and 21-09-2025 return `None` at Rajkot (A9)** — agrees with the book (no sutak).
* **Sutak**: solar **12 h**, lunar **9 h** before first contact (P1) until the end (P4/C4); applies only where visible (`sutak_window`). Eclipse-day rules (food, japa, temple, pregnancy) [D] text on the printed page.
* Limits: contacts ±1 min, magnitude ±0.002 (lunar) / ±0.02 (solar); annularity/total path computation is out of scope (needs Besselian elements).

---

## 14. Kundali, dashas, matching (`pk_rules.py`)
| Item | Rule / function |
|------|-----------------|
| **Chart** `chart(jd, lat, lon)` | sidereal Sun…Saturn, Rahu, Ketu, Uranus/Neptune/Pluto, Lagna, MC; **whole-sign houses**: `house = (rashi − lagna_rashi) mod 12 + 1`; pada, nakshatra, navamsha, vargottama, retrograde flag **[T F4, F5]** (year-entry chart 01-11-2024 18:17 Delhi: Sun/Moon 7th, Mars 4th, Mercury/Venus 8th, Jupiter 2nd R, Saturn 11th, Rahu 12th, Ketu 6th — equal to the printed chart; Moon Tula 15°23′ Swati pada 3) |
| **Bhava-chalit** | equal-house from MC or Sripati: cusps by MC/Asc trisection — **[R]**; whole-sign is the printed form |
| **Navamsha** | `start = rashi + {movable 0, fixed 8, dual 4}`; `navamsha = (start + ⌊(deg mod 30)/(30/9)⌋) mod 12` ⇔ for nakshatra *n*, pada *k*: `(4n + k) mod 12` (0-based) **[T F9: all 108 padas]** |
| **Other vargas** (D2…D60) | `varga` formulas standard (Hora, Drekkana, Chaturthamsha, Saptamsha, Dashamsha, Dwadashamsha, Shodashamsha, Shashtiamsha) **[R]** |
| **Dignity** `dignity` | exalted / debilitated / own (tables `EXALT, DEBIL, OWN`) |
| **Avastha** `avastha` | 5 states by 6° bands: Balya, Kumara, Yuva, Vriddha, Mrita; reversed in even-numbered signs |
| **Friendship** | natural (`NATURAL_FRIENDS/ENEMIES`) + temporary (2,3,4,10,11,12 from the planet) ⇒ `panchadha` (adhi-mitra … adhi-shatru) |
| **Aspects** `aspects` | houses seen: 7th for all + special |
| **Combustion** | orb table (§10) |
| **Yogas** `yogas` | Gajakesari, Budha-Aditya, Chandra-Mangala, five Mahapurusha (Ruchaka, Bhadra, Hamsa, Malavya, Shasha), Kemadruma, Sunapha, Anapha, Kaal-sarpa, Mangal-dosha (from Lagna; Moon/Venus variants [R]) |
| **Vimshottari** `vimshottari(moon_lon, birth_jd, levels, year_days=365.2425)` | lord of nakshatra *n* = `VIM_LORDS[n mod 9]` (Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury; years 7,20,6,10,7,18,16,19,17 = 120); **balance** = `(1 − fraction_elapsed)·years`; antar = `maha·antar_years/120` in the same order starting from the maha lord; levels 1-3 **[T F6]**: Rahu balance 6.23 y, Jupiter, Saturn, Mercury end 2031/2047/2066/2083 |
| **Ashtottari** | 108-y lords (Sun 6, Moon 15, Mars 8, Mercury 17, Saturn 10, Jupiter 19, Rahu 12, Venus 21) in `ASHTOTTARI_YEARS`; **nakshatra→lord grouping is [D] (p.38)** |
| **Name syllable** `name_syllable` | `AVAKAHADA[nak].syllables[pada−1]`, 108 syllables (table compared with source: **27/27 rows equal**) + Abhijit row |
| **Varga (name letters)** | `VARGA` 8 groups (Garuda, Billi, Simha, Kutra, Sarpa, Undar, Hiran, Gheta) and enemy pairs `VARGA_ENEMY` |
| **Guna-milan** `guna_milan(bride_moon, groom_moon)` | Ashtakoota 36 = varna 1 + vashya 2 + tara 3 + yoni 4 + graha-maitri 5 + gana 6 + bhakoot 7 + nadi 8. Tables: varna rank Vipra>Kshatriya>Vaishya>Shudra, vashya matrix, tara (count both ways, bad = 3,5,7), yoni 14×14 symmetric matrix (**checked symmetric, diagonal 4, seven enemy pairs 0**), graha-maitri from rashi lords (5/4/3/1/0.5/0), gana matrix (**most-cited variant; regional variants differ — configurable `gana_table`**), bhakoot {1/7,3/11,4/10 → 7; 2/12,5/9,6/8 → 0}, nadi (3-nadi zig-zag equals printed column; same nadi → 0). Same-position check = 28 (**G10**). The printed last-plate numbers are **[D]** |
| **Nadi-4 (chaturparva)** | `NADI4` partition of 27 nakshatras (+Abhijit with Tarjani) |
| **Rashi attributes** | lord, movable/fixed/dual, element, direction, varna, colour `RASHI_COLOUR_GU`, gem `RASHI_GEM` |
| **Graha daan / japa** | `GRAHA_DAAN` (metal, upadhatu, gem, grain, animal, rasa, colour, cloth, flower, japa count) — japa count of Jupiter/ Saturn are flagged in the source [D] |
| **Mool / Gandanta / Gandmool birth** | §9 |
| **Tara/Chandra bal for a native** | §9 |
| **Sade-sati / panoti timeline** | Saturn ingress/egress instants (Tier-2) + `panoti_phase` |
Not covered (data-only [D]): Ghat-chakra, Gorakh-ank, rajyoga table, lagna-sarani, Khat/Dwar/Mobh/Hal/Koop chakras, Din-dasha, dream interpretation, numerology, sutak table.

---

## 15. Interfaces

### 15.1 Output of `build_row` (one printed day) — JSON schema (excerpt of a real row)
```json
{
 "date": "2024-11-02", "weekday": 6, "weekday_gu": "શનિ",
 "sunrise": "6.51", "sunset": "18.08",
 "month": "Kartak", "month_gu": "કારતક", "paksha": "Sud", "tithi": 1, "tithi_in_paksha": 1,
 "tithi_end": "20.22",
 "tithi_segments": [[1, "20.22"], [2, "30.52"]],
 "nakshatra": [["Vishakha", "29.58"], ["Anuradha", "30.52"]],
 "yoga": [["Ayushman", "11.17"], ["Saubhagya", "30.52"]],
 "karan": [["Kimstughna", "7.22"], ["Bava", "20.22"], ["Balava", "30.52"]],
 "moon_rashi": [["Tula", "23.23"], ["Vrushchik", "30.52"]],
 "sun_rashi": "Tula",
 "flags": ["Vinchhudo"], "agni_chakra": "sky", "ahuti": ["Sun", false],
 "events": ["Nutan Varsh (Kartak Sud 1)", "Tropical Sun … ", "Vinchhudo begins 23:23"]
}
```
`build_samvat(2024)` → `{place, start:"2024-11-02", end:"2025-10-21", days:354, vikram_samvat:2081, shaka:1946, samvatsara, rows:[…354…]}`; events per day: Ekadashi (Smarta/Vaishnava), Vrat-ni-Poonam, Pradosh (weekday), Sankashti (+moonrise), Amavasya types, Pushya/Rohini/Ashwini combos with windows, sankranti with minute, tropical-Sun events, festivals, Panchak/Vinchhudo starts.

### 15.2 Data that must be keyed (schemas)
```json
{"din_dasha": {"<moon_rashi 0-11>": [{"planet": "Sun", "days": 0}]},
 "ashtottari_groups": {"Sun": ["Ardra", "..."], "Moon": ["..."]},
 "ghat_chakra": {"<rashi>": {"nakshatra": 0, "tithi": 0, "vaar": 0, "yoga": 0, "karan": 0}},
 "small_chakras": {"khat": {"<remainder>": "<posture>"}, "dwar": {}, "mobh": {}, "hal": {}, "koop": {}},
 "asta_exceptions": [], "gorakh_ank": {}, "dishakaal": {}, "rajyoga_table": [], "lagna_sarani": {},
 "rashi_milan": [[0]], "sutak_relations": {"<relation>": {"days": 0}}, "guna_milan_plate": {},
 "chaitri_dunaiya": [{"date": "", "note": ""}], "festival_lists": {"hijri": [], "parsi": [], "jain": [], "pushtimarg": [], "baps": []},
 "text": {"rashi_bhavishya": {}, "shlokas": {}, "essays": {}}}
```
Each value must be read from the printed page; the engine never invents them.

---

## 16. Cross-check matrix (executed output of `verify_all.py`)
Legend: **A** published astronomy · **B** reference row · **C** calendar · **D** muhurat tables · **E** vrats/yogas/festivals · **F** planets/kundali · **G** invariants & robustness (random 1950-2100, 6 places, polar) · **H** dashavatar.
```
PASS  A1 Moon AA2 ex.47.a lon/lat/dist  | 133.162655 -3.229126 368409.7
PASS  A2 Earth VSOP87 L (AA2 ex.25.b = 19.907372)
PASS  A3 Julian Day 2000-01-01 12h / 1987-01-27 / 1957-10-04 19:26
PASS  A4 equinox/solstice 0 deg 2025-03-20 UT (NASA/USNO 09:01)  | 09:01
PASS  A4 equinox/solstice 90 deg 2025-06-21 UT (NASA/USNO 02:42)  | 02:42
PASS  A4 equinox/solstice 180 deg 2025-09-22 UT (NASA/USNO 18:19)  | 18:19
PASS  A4 equinox/solstice 270 deg 2024-12-21 UT (NASA/USNO 09:21)  | 09:20
PASS  A4 equinox/solstice 0 deg 2024-03-20 UT (NASA/USNO 03:06)  | 03:06
PASS  A5 Lahiri ayanamsa J2000 = 23d51'25.5"  | 23.857092
PASS  A6 precession rate 50.29"/yr (ayanamsa 2050 - 2000)
PASS  A7 lunar eclipse 2025-03-14 umbral magnitude (NASA 1.1804)  | 1.1791 total=total
PASS  A7 lunar eclipse 2025-09-07 umbral magnitude (NASA 1.3622)  | 1.3635 total=total
PASS  A8 solar eclipse Dallas 2024-04-08 total, max 18:42 UT
PASS  A9 solar eclipse 29-03-2025 16:27 NOT visible at Rajkot (book: no sutak)
PASS  A9 solar eclipse 22-09-2025 01:23 NOT visible at Rajkot (book: no sutak)
PASS  A10 exactly two lunar eclipses in Samvat 2081 (14-03-2025 total, 07-09-2025 total)
PASS  A11 14-03-2025 lunar eclipse NOT visible at Rajkot (Moon below horizon, daytime) => no sutak; 07-09-2025 visible => sutak
PASS  A12 lunar eclipse 07-09-2025 contacts within 1.2 min of NASA (P1 20:57 U1 21:57 U2 23:00 max 23:41 U3 00:23 U4 01:26 P4 02:25 IST)  | {'P1': 0.24, 'U1': -0.18, 'U2': 0.46, 'greatest': 0.62, 'U3': -0.2, 'U4': 0.46, 'P4': 0.91}
PASS  B1 sunrise 06:51 / sunset 18:08 Rajkot 2-Nov-2024  | 06:51 18:08
PASS  B2 tithi 1 (Sud) ends 20:22 (book 20.22)
PASS  B3 nakshatra Vishakha(16) ends 3-Nov 05:58
PASS  B4 yoga Ayushman(3) ends 11:17; karan Kimstughna ends 07:22; Moon enters Vrushchik 23:23
PASS  B5 weekday Saturday
PASS  C1 twelve lunation date-ranges equal book p.24 table
PASS  C2 month names Kartak..Aaso, none adhik/kshaya
PASS  C3 Samvat 2081 length 354 days
PASS  C4 VS/Shaka/Vir/samvatsara
PASS  C5 Adhik Jeth 2026: 17-05-2026 .. 15-06-2026  | 2026-05-17..2026-06-15
PASS  C6 year-entry new moon 01-11-2024 18:17 IST
PASS  C7 Makar sankranti 14-01-2025 08:55-08:56 (book 08:56) ; punya-kaal to sunset 18:23  | 08:55
PASS  C8 12 sankrantis, dates 16-11,15-12,14-01,12-02,14-03,14-04,15-05,15-06,16-07,17-08,17-09,17-10
PASS  C9 Ardra pravesh 22-06-2025 ~06:19 ; Punarvasu 06-07 05:48 (Hindu date 05-07)
PASS  C10 ayana/ritu dates (21-12, 18/19-02, 20-03, 20-04, 21-06, 23-08, 22-09, 23-10)
PASS  C11 Easter 2025-04-20 ; Good Friday 18-04
PASS  C12 Hijri tabular 1 Muharram 1447 = 27-06-2025 (book ~27-06)
PASS  C13 Parsi Pateti/Navroz 15-08-2025 = 1 Farvardin 1395
PASS  C14 Gregorian leap rule
PASS  D1 chaughadiya day/night Monday & Sunday-night rows equal printed table
PASS  D2 Rahukaal/Yamaganda/Gulika 21 windows equal printed table (06-18 base)
PASS  D3 hora: Sunday day order Sun,Ven,Mer,Moon,Sat,Jup,Mars,Sun... ; hora 13 = Jupiter
PASS  D4 karana table: 60 half-tithis, names (Sud1 first half Kimstughna, Vad14 2nd half Shakuni, Vad30 Chatushpada/Naga)
PASS  D5 abhijit nakshatra span = 253'20" = 4d13'20"
PASS  E1 24 Ekadashi (Smarta) dates equal book p.26
PASS  E2 Vaishnava differs only on 07-06 and 22-06 (as printed)
PASS  E3 12 Purnima vrat days; Purnima end times 16-11 02:58 .. 07-10 09:17 (engine values of source)
PASS  E4 all printed Pradosh dates (Shani/Som/Bhom/Bhanu) present  | 24 pradosh in year
PASS  E5 Somvati/Mangalvari/Budhvari/Shanivari Amavasya lists equal book p.25
PASS  E6 Gurupushya 21-11-2024 07:03-15:35, 24-07-2025, 21-08-2025
PASS  E7 Ravipushya 09-03 23:55 / 06-04 06:34 / 04-05 06:12-12:53
PASS  E8 first Panchak 09-11-2024 23:27 -> 14-11 03:11 ; first Vinchhudo 02-11 23:23 -> 05-11 09:45
PASS  E9 Dhanarka ends 14-01-2025 (08:55) ; Meenarka 14-03 18:50 -> 14-04 03:21
PASS  E10 Holashtak 06-03-2025 10:51 -> Purnima end 14-03 12:24
PASS  E11 24 festival dates (rule engine) equal book p.29  | []
PASS  E12 12 Sankashti Chaturthi; Kartak Vad 4 = 18-11-2024
PASS  E13 Ravi-yoga rule (Moon 4th from Sun nakshatra)
PASS  E14 Guru asta window ~ book 11-06 .. ~09-07 (engine +-3 d)  | 09-06-2025 17:30 .. 10-07-2025 05:30
PASS  F1 Saturn -> Meen 29-03-2025 ; Jupiter -> Mithun 14/15-05-2025 ; Jupiter -> Kark 18-10-2025 (Tier-2: +-1 day)
PASS  F2 mean Rahu -> Kumbh 18-05-2025 (19:33)
PASS  F3 Saturn retro 13-07-2025, direct 28-11-2025 ; Jupiter direct 04-02-2025
PASS  F4 year-entry chart houses: Sun/Moon 7th (Tula), Mars 4th (Kark), Mer/Ven 8th (Vrushchik), Jup 2nd (retro), Sat 11th, Rahu 12th, Ketu 6th
PASS  F5 Moon at year entry: Tula 15d23', Swati pada 3
PASS  F6 Vimshottari balance Rahu 6.2y, then Jupiter/Saturn/Mercury (book 6.22y; ends 2031/2047/2066/2083)
PASS  F7 gochar table cell: Mesh natal, Saturn Meen = 12th; Jupiter Mithun = 3rd; Meen natal Saturn Kumbh = 12th
PASS  F8 pava rule (Moon sign from natal): 1,6,11 gold ; 2,5,9 silver ; 3,7,10 copper ; 4,8,12 iron
PASS  F9 navamsha: 0->Mesh, 33->Makar, 61->Tula ; nakshatra-pada navamsha = (4(n-1)+k-1) mod 12
PASS  F10 aavak-javak rule example Mesh Kartak-Fagan (8,14) -> 5 Lokapavad
PASS  G1 240 random days 1950-2100 x 6 places: segments ordered/contiguous, boundaries exact, no exception  | 240 ok []
PASS  G2 polar day (Tromso 21-Jun) does not raise; falls back to 06:00 and flags it
PASS  G3 2400 lunations 1900-2100: length 29.27..29.84 d  | 29.274..29.830 n=2475
PASS  G4 adhik months 1900-2100 plausible (7 per 19 yr => ~73)  | adhik=76 kshaya=2 ['1963-11', '1983-01']
PASS  G5 Samvat lengths in {354,355,383,384,385}
PASS  G6 VSOP87 Sun vs low-accuracy Sun agree < 0.012 deg (independent algorithms)  | max 0.00855
PASS  G7 solar altitude at computed sunrise/sunset equals -0.8333 deg to 1e-6  | 1.53e-07
PASS  G8 ayanamsa offset: +14 arcsec delays Makar sankranti by 5.4-5.8 min (Sun 2.46 arcsec/min)  | 5.50 min
PASS  G12 Devshayani Ekadashi 06-07-2025 ; Pitru-paksha 08-09 .. 21-09-2025
PASS  G9 tables: 27 nakshatra/yoga/avakahada, nadi zig-zag == printed column, yoni matrix symmetric, gana 9/9/9
PASS  G10 guna-milan same Moon position scores 28 (nadi dosha 0) ; max possible 36
PASS  G11 printed-row builder reproduces ક.મિ. strings 20.22 / 29.58 / 11.17 / 7.22 / 23.23
PASS  G13 Tier-2 validity guard: 2025 valid, 1700 and 2100 not
PASS  G14 borderline flag: absent on reference row 02-11-2024; present on 19-01-2025 (tithi & karana end within 3 min of sunrise)
PASS  H1 Dashavatar jayantis resolved for all 10 avatars inside Samvat 2081 (Matsya = Chaitra Sud 3 = 31-03-2025 (Gangaur); Krishna = Madhyaratri rule = 15-08)  | {'Matsya': '2025-03-31', 'Kurma': '2025-05-12', 'Varaha': '2025-08-25', 'Narsimha': '2025-05-10', 'Vamana': '2025-09-04', 'Parashuram': '2025-04-30', 'Ram': '2025-04-06', 'Krishna': '2025-08-15', 'Buddha': '2025-10-01', 'Kalki': '2025-07-30'}

81 checks, 81 passed, 0 failed, 34 s
```
**Independent redundancy built into the design** (each quantity is computed two ways or against an invariant):
* Sun: VSOP87D vs AA2 low-accuracy series (G6); equinoxes vs USNO (A4).
* Moon: AA2 example to 1e-6° (A1) and elongation at every tithi end equals 12k° (G1).
* Sunrise: altitude re-evaluated at the solved instant = h0 (G7); printed Rajkot row (B1).
* Calendar: months/dates vs p.24 (C1), Samvat length (C3, G5), lunation length bounds (G3), adhik frequency (G4).
* Tables: nadi zig-zag formula vs printed column (G9), yoni matrix symmetry, 27/27 avakahada & 12/12 aavak rows vs source, every nakshatra table written by name.
* Vrats: 24 Ekadashi vs 24 printed; Pradosh/Amavasya/Pushya lists vs printed lists.

---

## 17. "Never fails" contract (design rules every implementation must keep)
1. **Never use a root-finder without a bracket.** All events go through `solve_crossing` (scan + bisection ≤ 80 steps). It returns `None`, never raises, never loops unboundedly. Newton is used only for Kepler's equation with an iteration cap.
2. **Never compare raw angles.** Always `wrap180(f − target)`; reject sign changes with jump ≥ 180° (wrap artefacts).
3. **Scan step ≤ the fastest angular rate × step < the smallest boundary spacing** (1 h × 0.64°/h ≪ 6°). Do not enlarge `scan` for convenience.
4. **Sunrise** is searched on the *civil day in the place's own time zone*; missing events (polar) return `None` and the Hindu day falls back to 06:00 local with `flag="no_sunrise_fallback_06:00"`; windows that need a sunset (chaughadiya, hora, Rahu…) must be skipped when `sunset is None` (the builder surfaces the flag). **[T G2]**
5. **New-moon bracket**: ±2 d around `jd − D/12.1908`; verified for 2400 lunations (G3).
6. **Evaluate "value at sunrise" at sunrise + 1 s** and compute end times from the boundary implied by *that* number — otherwise a boundary exactly at sunrise yields an inconsistent (number, end) pair.
7. **Borderline surfacing**: report `borderline` when a new moon is within 0.2° of a rashi edge (adhik/kshaya may flip) and warn when a tithi/nakshatra/yoga/karan/rashi end is within 3 min of sunrise (printed digit can differ by one) — implemented in `build_row` (**G14**).
   *Samvat 2081 (Rajkot) has exactly **7 borderline days** (limb ends within 3 min of a sunrise; flagged `BORDERLINE:*` by `build_row`): 19-01-2025 (tithi & karan), 14-02-2025 (yoga), 19-07-2025 (Moon rashi), 17-08-2025 (karan), 07-09-2025 (yoga), 17-09-2025 (nakshatra), 01-10-2025 (karan). On these days the printed minute, or which limb is "at sunrise", can legitimately differ between publishers (sunrise convention, ΔT, ±1 s). Verify those 7 against the printed page.*
8. **Tier honesty**: planets are Tier 2 — never print Tier-2 values to the minute without the plug-in ephemeris.
9. **Time zone**: fixed offset per call; for places with DST pass the right offset per date. Python `datetime` is used only for formatting; astronomy uses JD.
10. **Valid range**: Gregorian dates 1583-9999 for formatting; astronomy tested 1900-2100; Standish planets valid 1800-2050 (outside: accuracy degrades — warn); ΔT polynomials for any year.
11. **Determinism**: no randomness, no network, no locale dependence (`verify_all.py` seeds its only RNG).
12. **Regression gate**: ship nothing unless `verify_all.py` prints `81 checks, 81 passed`.

**Extending to another place/year**: `Place("Name", lat, lon_east, tz_hours, elevation_m)` → `build_samvat(Gregorian year of its Kartak Sud 1, place)`. Sunrise/sunset times will differ with place; muhurat windows, tithi *instants*, sankranti instants are place-independent (UT). Vaar-of-Hindu-day, which civil date a tithi falls on, vrat dates and festival dates **are** place-dependent — checked for Rajkot only.

---

## 18. Source code (NORMATIVE — every table and series above is defined by these listings)
The files are listed in dependency order. Copy each into its own file with exactly the stated name. `verify_all.py` is last.

### 18.1 `pk_astro.py` (524 lines)
```python
"""
pk_astro.py -- astronomy core for a Gujarati/Hindu panchang  (pure Python 3.9+, no dependencies)

Sources
  Time/JD ........ Meeus, Astronomical Algorithms 2e (AA2) ch.7
  Delta-T ........ Espenak & Meeus polynomials (NASA)
  Sun ............ VSOP87D Earth, truncated (AA2 App.III), nutation 4-term, aberration
  Moon ........... AA2 ch.47 (60 lon + 60 lat terms, distance terms)
  Ayanamsa ....... Lahiri/Chitrapaksha: 23d15'00.658" (true) on 1956-03-21 0h, IAU1976 precession
  Planets ........ Standish (JPL) Keplerian elements 1800-2050 (arc-minute accuracy; Tier-2)
  Rise/set ....... altitude root finding, scan + bisection (never relies on a first guess)
All angles degrees unless a name ends in _rad.  All times are Julian Day (UT) unless a name ends in _tt.
"""
import math
from datetime import datetime, timedelta, timezone

D2R = math.pi / 180.0
R2D = 180.0 / math.pi
IST = timezone(timedelta(hours=5.5))
UTC = timezone.utc
J2000 = 2451545.0

# ------------------------------------------------------------------ time
def julian_day(y, m, d, hour=0.0):
    """Calendar date (Gregorian on/after 1582-10-15, Julian before) -> JD. d may carry a fraction. hour in hours."""
    if m <= 2:
        y -= 1
        m += 12
    A = y // 100
    if (y, m, int(d)) >= (1582, 10, 15) or y > 1582:
        B = 2 - A + A // 4
    else:
        B = 0
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + hour / 24.0 + B - 1524.5

def cal_from_jd(jd):
    """JD -> (year, month, day, hour_fraction_of_day_as_float) using AA2 ch.7 (Gregorian or Julian automatically)."""
    z = math.floor(jd + 0.5)
    f = jd + 0.5 - z
    if z < 2299161:
        a = z
    else:
        al = math.floor((z - 1867216.25) / 36524.25)
        a = z + 1 + al - math.floor(al / 4)
    b = a + 1524
    c = math.floor((b - 122.1) / 365.25)
    d = math.floor(365.25 * c)
    e = math.floor((b - d) / 30.6001)
    day = b - d - math.floor(30.6001 * e)
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    return int(year), int(month), int(day), f

def jd_to_datetime(jd, tz=IST):
    """JD(UT) -> aware datetime (rounded to the nearest millisecond). Valid for Gregorian dates (year >= 1583)."""
    y, m, d, f = cal_from_jd(jd)
    base = datetime(y, m, d, tzinfo=UTC)
    return (base + timedelta(milliseconds=round(f * 86400000.0))).astimezone(tz)

def datetime_to_jd(dt):
    dt = dt.astimezone(UTC)
    return julian_day(dt.year, dt.month, dt.day,
                      dt.hour + dt.minute / 60.0 + dt.second / 3600.0 + dt.microsecond / 3.6e9)

def local_midnight_jd(y, m, d, tz_hours):
    """JD(UT) of local civil midnight that starts date y-m-d in a zone with fixed offset tz_hours."""
    return julian_day(y, m, d, 0.0) - tz_hours / 24.0

def weekday_from_jd(jd_local_midnight_plus_something):
    """0=Sunday ... 6=Saturday for the *civil* day containing the given JD (pass a JD of local noon to be safe)."""
    return int(math.floor(jd_local_midnight_plus_something + 1.5)) % 7

def delta_t(year):
    """TT-UT seconds (Espenak & Meeus 2006 polynomials)."""
    y = year
    if y < -500:
        u = (y - 1820) / 100
        return -20 + 32 * u * u
    if y < 500:
        u = y / 100
        return (10583.6 - 1014.41 * u + 33.78311 * u**2 - 5.952053 * u**3 - 0.1798452 * u**4
                + 0.022174192 * u**5 + 0.0090316521 * u**6)
    if y < 1600:
        u = (y - 1000) / 100
        return (1574.2 - 556.01 * u + 71.23472 * u**2 + 0.319781 * u**3 - 0.8503463 * u**4
                - 0.005050998 * u**5 + 0.0083572073 * u**6)
    if y < 1700:
        t = y - 1600
        return 120 - 0.9808 * t - 0.01532 * t**2 + t**3 / 7129
    if y < 1800:
        t = y - 1700
        return 8.83 + 0.1603 * t - 0.0059285 * t**2 + 0.00013336 * t**3 - t**4 / 1174000
    if y < 1860:
        t = y - 1800
        return (13.72 - 0.332447 * t + 0.0068612 * t**2 + 0.0041116 * t**3 - 0.00037436 * t**4
                + 0.0000121272 * t**5 - 0.0000001699 * t**6 + 0.000000000875 * t**7)
    if y < 1900:
        t = y - 1860
        return 7.62 + 0.5737 * t - 0.251754 * t**2 + 0.01680668 * t**3 - 0.0004473624 * t**4 + t**5 / 233174
    if y < 1920:
        t = y - 1900
        return -2.79 + 1.494119 * t - 0.0598939 * t**2 + 0.0061966 * t**3 - 0.000197 * t**4
    if y < 1941:
        t = y - 1920
        return 21.20 + 0.84493 * t - 0.076100 * t**2 + 0.0020936 * t**3
    if y < 1961:
        t = y - 1950
        return 29.07 + 0.407 * t - t**2 / 233 + t**3 / 2547
    if y < 1986:
        t = y - 1975
        return 45.45 + 1.067 * t - t**2 / 260 - t**3 / 718
    if y < 2005:
        t = y - 2000
        return 63.86 + 0.3345 * t - 0.060374 * t**2 + 0.0017275 * t**3 + 0.000651814 * t**4 + 0.00002373599 * t**5
    if y < 2050:
        t = y - 2000
        return 62.92 + 0.32217 * t + 0.005589 * t**2
    if y < 2150:
        return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y)
    u = (y - 1820) / 100
    return -20 + 32 * u * u

def jde_from_jd(jd):
    year = 2000.0 + (jd - J2000) / 365.2425
    return jd + delta_t(year) / 86400.0

def norm360(x):
    return x % 360.0

def wrap180(x):
    return (x + 180.0) % 360.0 - 180.0

# ------------------------------------------------------------------ Sun  (VSOP87D Earth, truncated; AA2 Appendix III)
_L0 = [(175347046, 0, 0), (3341656, 4.6692568, 6283.07585), (34894, 4.6261, 12566.1517), (3497, 2.7441, 5753.3849),
       (3418, 2.8289, 3.5231), (3136, 3.6277, 77713.7715), (2676, 4.4181, 7860.4194), (2343, 6.1352, 3930.2097),
       (1324, 0.7425, 11506.7698), (1273, 2.0371, 529.691), (1199, 1.1096, 1577.3435), (990, 5.233, 5884.927),
       (902, 2.045, 26.298), (857, 3.508, 398.149), (780, 1.179, 5223.694), (753, 2.533, 5507.553),
       (505, 4.583, 18849.228), (492, 4.205, 775.523), (357, 2.92, 0.067), (317, 5.849, 11790.629),
       (284, 1.899, 796.298), (271, 0.315, 10977.079), (243, 0.345, 5486.778), (206, 4.806, 2544.314),
       (205, 1.869, 5573.143), (202, 2.458, 6069.777), (156, 0.833, 213.299), (132, 3.411, 2942.463),
       (126, 1.083, 20.775), (115, 0.645, 0.98), (103, 0.636, 4694.003), (102, 0.976, 15720.839),
       (102, 4.267, 7.114), (99, 6.21, 2146.17), (98, 0.68, 155.42), (86, 5.98, 161000.69),
       (85, 1.3, 6275.96), (85, 3.67, 71430.7), (80, 1.81, 17260.15), (79, 3.04, 12036.46),
       (75, 1.76, 5088.63), (74, 3.5, 3154.69), (74, 4.68, 801.82), (70, 0.83, 9437.76),
       (62, 3.98, 8827.39), (61, 1.82, 7084.9), (57, 2.78, 6286.6), (56, 4.39, 14143.5),
       (56, 3.47, 6279.55), (52, 0.19, 12139.55), (52, 1.33, 1748.02), (51, 0.28, 5856.48),
       (49, 0.49, 1194.45), (41, 5.37, 8429.24), (41, 2.4, 19651.05), (39, 6.17, 10447.39),
       (37, 6.04, 10213.29), (37, 2.57, 1059.38), (36, 1.71, 2352.87), (36, 1.78, 6812.77),
       (33, 0.59, 17789.85), (30, 0.44, 83996.85), (30, 2.74, 1349.87), (25, 3.16, 4690.48)]
_L1 = [(628331966747, 0, 0), (206059, 2.678235, 6283.07585), (4303, 2.6351, 12566.1517), (425, 1.59, 3.523),
       (119, 5.796, 26.298), (109, 2.966, 1577.344), (93, 2.59, 18849.23), (72, 1.14, 529.69), (68, 1.87, 398.15),
       (67, 4.41, 5507.55), (59, 2.89, 5223.69), (56, 2.17, 155.42), (45, 0.4, 796.3), (36, 0.47, 775.52),
       (29, 2.65, 7.11), (21, 5.34, 0.98), (19, 1.85, 5486.78), (19, 4.97, 213.3), (17, 2.99, 6275.96),
       (16, 0.03, 2544.31), (16, 1.43, 2146.17), (15, 1.21, 10977.08), (12, 2.83, 1748.02), (12, 3.26, 5088.63),
       (12, 5.27, 1194.45), (12, 2.08, 4694.0), (11, 0.77, 553.57), (10, 1.3, 6286.6), (10, 4.24, 1349.87),
       (9, 2.7, 242.73), (9, 5.64, 951.72), (8, 5.3, 2352.87), (6, 2.65, 9437.76), (6, 4.67, 4690.48)]
_L2 = [(52919, 0, 0), (8720, 1.0721, 6283.0758), (309, 0.867, 12566.152), (27, 0.05, 3.52), (16, 5.19, 26.3),
       (16, 3.68, 155.42), (10, 0.76, 18849.23), (9, 2.06, 77713.77), (7, 0.83, 775.52), (5, 4.66, 1577.34),
       (4, 1.03, 7.11), (4, 3.44, 5573.14), (3, 5.14, 796.3), (3, 6.05, 5507.55), (3, 1.19, 242.73),
       (3, 6.12, 529.69), (3, 0.31, 398.15), (3, 2.28, 553.57), (2, 4.38, 5223.69), (2, 3.75, 0.98)]
_L3 = [(289, 5.844, 6283.076), (35, 0, 0), (17, 5.49, 12566.15), (3, 5.2, 155.42), (1, 4.72, 3.52),
       (1, 5.3, 18849.23), (1, 5.97, 242.73)]
_L4 = [(114, 3.142, 0), (8, 4.13, 6283.08), (1, 3.84, 12566.15)]
_L5 = [(1, 3.14, 0)]

def earth_heliocentric_longitude(jde):
    """VSOP87D Earth heliocentric ecliptic longitude of date (degrees, 0..360), geometric."""
    tau = (jde - J2000) / 365250.0
    tot = 0.0
    for k, series in enumerate((_L0, _L1, _L2, _L3, _L4, _L5)):
        s = 0.0
        for A, B, C in series:
            s += A * math.cos(B + C * tau)
        tot += s * tau**k
    return norm360(tot / 1e8 * R2D)

def sun_distance_au(jde):
    T = (jde - J2000) / 36525.0
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
    M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R
    C = ((1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(M) + (0.019993 - 0.000101 * T) * math.sin(2 * M)
         + 0.000289 * math.sin(3 * M)) * D2R
    nu = M + C
    return 1.000001018 * (1 - e * e) / (1 + e * math.cos(nu))

def nutation_longitude(jde):
    """Delta-psi in degrees, 4-term series (error < 0.5 arcsec)."""
    T = (jde - J2000) / 36525.0
    Om = (125.04452 - 1934.136261 * T) * D2R
    L = (280.4665 + 36000.7698 * T) * D2R
    Lm = (218.3165 + 481267.8813 * T) * D2R
    dpsi = (-17.20 * math.sin(Om) - 1.32 * math.sin(2 * L) - 0.23 * math.sin(2 * Lm) + 0.21 * math.sin(2 * Om))
    return dpsi / 3600.0

def mean_obliquity(jde):
    T = (jde - J2000) / 36525.0
    return 23.439291111 - 0.0130041667 * T - 1.64e-7 * T * T + 5.04e-7 * T**3

def true_obliquity(jde):
    T = (jde - J2000) / 36525.0
    Om = (125.04452 - 1934.136261 * T) * D2R
    L = (280.4665 + 36000.7698 * T) * D2R
    Lm = (218.3165 + 481267.8813 * T) * D2R
    deps = (9.20 * math.cos(Om) + 0.57 * math.cos(2 * L) + 0.10 * math.cos(2 * Lm) - 0.09 * math.cos(2 * Om))
    return mean_obliquity(jde) + deps / 3600.0

def sun_true_longitude_geometric(jde):
    """Geometric geocentric Sun longitude, mean equinox of date, no nutation, no aberration (= L_earth + 180)."""
    return norm360(earth_heliocentric_longitude(jde) + 180.0)

def sun_longitude_apparent_mean_equinox(jde):
    """Apparent Sun (aberration included) referred to the MEAN equinox of date -- used for sidereal work
       (nutation cancels against the mean ayanamsa, exactly as Swiss Ephemeris SIDM_LAHIRI does)."""
    return norm360(sun_true_longitude_geometric(jde) - 20.4898 / 3600.0 / sun_distance_au(jde))

def sun_longitude_apparent(jde):
    """Apparent Sun referred to the TRUE equinox of date (adds nutation) -- used for ritu/ayana/equinox and RA/Dec."""
    return norm360(sun_longitude_apparent_mean_equinox(jde) + nutation_longitude(jde))

# ------------------------------------------------------------------ Moon (AA2 ch.47)
# (D, M, M', F, sum_l[1e-6 deg], sum_r[1e-3 km])
_MOON_LR = [
(0,0,1,0,6288774,-20905355),(2,0,-1,0,1274027,-3699111),(2,0,0,0,658314,-2955968),(0,0,2,0,213618,-569925),
(0,1,0,0,-185116,48888),(0,0,0,2,-114332,-3149),(2,0,-2,0,58793,246158),(2,-1,-1,0,57066,-152138),
(2,0,1,0,53322,-170733),(2,-1,0,0,45758,-204586),(0,1,-1,0,-40923,-129620),(1,0,0,0,-34720,108743),
(0,1,1,0,-30383,104755),(2,0,0,-2,15327,10321),(0,0,1,2,-12528,0),(0,0,1,-2,10980,79661),
(4,0,-1,0,10675,-34782),(0,0,3,0,10034,-23210),(4,0,-2,0,8548,-21636),(2,1,-1,0,-7888,24208),
(2,1,0,0,-6766,30824),(1,0,-1,0,-5163,-8379),(1,1,0,0,4987,-16675),(2,-1,1,0,4036,-12831),
(2,0,2,0,3994,-10445),(4,0,0,0,3861,-11650),(2,0,-3,0,3665,14403),(0,1,-2,0,-2689,-7003),
(2,0,-1,2,-2602,0),(2,-1,-2,0,2390,10056),(1,0,1,0,-2348,6322),(2,-2,0,0,2236,-9884),
(0,1,2,0,-2120,5751),(0,2,0,0,-2069,0),(2,-2,-1,0,2048,-4950),(2,0,1,-2,-1773,4130),
(2,0,0,2,-1595,0),(4,-1,-1,0,1215,-3958),(0,0,2,2,-1110,0),(3,0,-1,0,-892,3258),
(2,1,1,0,-810,2616),(4,-1,-2,0,759,-1897),(0,2,-1,0,-713,-2117),(2,2,-1,0,-700,2354),
(2,1,-2,0,691,0),(2,-1,0,-2,596,0),(4,0,1,0,549,-1423),(0,0,4,0,537,-1117),
(4,-1,0,0,520,-1571),(1,0,-2,0,-487,-1739),(2,1,0,-2,-399,0),(0,0,2,-2,-381,-4421),
(1,1,1,0,351,0),(3,0,-2,0,-340,0),(4,0,-3,0,330,0),(2,-1,2,0,327,0),
(0,2,1,0,-323,1165),(1,1,-1,0,299,0),(2,0,3,0,294,0),(2,0,-1,-2,0,8752)]
# (D, M, M', F, sum_b[1e-6 deg])
_MOON_B = [
(0,0,0,1,5128122),(0,0,1,1,280602),(0,0,1,-1,277693),(2,0,0,-1,173237),(2,0,-1,1,55413),(2,0,-1,-1,46271),
(2,0,0,1,32573),(0,0,2,1,17198),(2,0,1,-1,9266),(0,0,2,-1,8822),(2,-1,0,-1,8216),(2,0,-2,-1,4324),
(2,0,1,1,4200),(2,1,0,-1,-3359),(2,-1,-1,1,2463),(2,-1,0,1,2211),(2,-1,-1,-1,2065),(0,1,-1,-1,-1870),
(4,0,-1,-1,1828),(0,1,0,1,-1794),(0,0,0,3,-1749),(0,1,-1,1,-1565),(1,0,0,1,-1491),(0,1,1,1,-1475),
(0,1,1,-1,-1410),(0,1,0,-1,-1344),(1,0,0,-1,-1335),(0,0,3,1,1107),(4,0,0,-1,1021),(4,0,-1,1,833),
(0,0,1,-3,777),(4,0,-2,1,671),(2,0,0,-3,607),(2,0,2,-1,596),(2,-1,1,-1,491),(2,0,-2,1,-451),
(0,0,3,-1,439),(2,0,2,1,422),(2,0,-3,-1,421),(2,1,-1,1,-366),(2,1,0,1,-351),(4,0,0,1,331),
(2,-1,1,1,315),(2,-2,0,-1,302),(0,0,1,3,-283),(2,1,1,-1,-229),(1,1,0,-1,223),(1,1,0,1,223),
(0,1,-2,-1,-220),(2,1,-1,-1,-220),(1,0,1,1,-185),(2,-1,-2,-1,181),(0,1,2,1,-177),(4,0,-2,-1,176),
(4,-1,-1,-1,166),(1,0,1,-1,-164),(4,0,1,-1,132),(1,0,-1,-1,-119),(4,-1,0,-1,115),(2,-2,0,1,107)]

def _moon_args(jde):
    T = (jde - J2000) / 36525.0
    Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T**2 + T**3 / 538841 - T**4 / 65194000
    D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T**2 + T**3 / 545868 - T**4 / 113065000
    M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T**2 + T**3 / 24490000
    Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T**2 + T**3 / 69699 - T**4 / 14712000
    F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T**2 - T**3 / 3526000 + T**4 / 863310000
    A1 = 119.75 + 131.849 * T
    A2 = 53.09 + 479264.290 * T
    A3 = 313.45 + 481266.484 * T
    E = 1 - 0.002516 * T - 0.0000074 * T * T
    return T, Lp, D, M, Mp, F, A1, A2, A3, E

def moon_ecliptic(jde):
    """Geocentric (lon deg mean-equinox-of-date no nutation, lat deg, distance km)."""
    T, Lp, D, M, Mp, F, A1, A2, A3, E = _moon_args(jde)
    sl = sr = 0.0
    for d, m, mp, f, cl, cr in _MOON_LR:
        arg = (d * D + m * M + mp * Mp + f * F) * D2R
        ef = E ** abs(m)
        sl += cl * ef * math.sin(arg)
        sr += cr * ef * math.cos(arg)
    sl += 3958 * math.sin(A1 * D2R) + 1962 * math.sin((Lp - F) * D2R) + 318 * math.sin(A2 * D2R)
    sb = 0.0
    for d, m, mp, f, cb in _MOON_B:
        arg = (d * D + m * M + mp * Mp + f * F) * D2R
        sb += cb * (E ** abs(m)) * math.sin(arg)
    sb += (-2235 * math.sin(Lp * D2R) + 382 * math.sin(A3 * D2R) + 175 * math.sin((A1 - F) * D2R)
           + 175 * math.sin((A1 + F) * D2R) + 127 * math.sin((Lp - Mp) * D2R) - 115 * math.sin((Lp + Mp) * D2R))
    return norm360(Lp + sl / 1e6), sb / 1e6, 385000.56 + sr / 1000.0

def moon_longitude(jde):
    return moon_ecliptic(jde)[0]

# ------------------------------------------------------------------ nodes
def mean_node_tropical(jde):
    T = (jde - J2000) / 36525.0
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T**3 / 467441 - T**4 / 60616000)

def true_node_tropical(jde):
    """Mean node + main periodic terms (AA2 ch.47) -- optional 'true Rahu'."""
    T, Lp, D, M, Mp, F, *_ = _moon_args(jde)
    corr = (-1.4979 * math.sin(2 * (D - F) * D2R) - 0.1500 * math.sin(M * D2R) - 0.1226 * math.sin(2 * D * D2R)
            + 0.1176 * math.sin(2 * F * D2R) - 0.0801 * math.sin(2 * (Mp - F) * D2R))
    return norm360(mean_node_tropical(jde) + corr)

# ------------------------------------------------------------------ ayanamsa
AYANAMSA_OFFSET_ARCSEC = 0.0   # user setting; >0 delays every sidereal event
_T0_AY = (2435553.5 - J2000) / 36525.0
_A0_AY = 23.250182778 - 0.004658035   # mean value at 1956-03-21 0h (true 23:15:00.658 minus nutation)

def _pA(T):
    return 5029.0966 * T + 1.11113 * T * T - 0.000006 * T**3   # arcsec, IAU 1976

def lahiri_ayanamsa(jde):
    """Mean Lahiri ayanamsa in degrees (identical to Swiss Ephemeris SIDM_LAHIRI mean value)."""
    T = (jde - J2000) / 36525.0
    return _A0_AY + (_pA(T) - _pA(_T0_AY)) / 3600.0 + AYANAMSA_OFFSET_ARCSEC / 3600.0

def sidereal_sun(jde):
    return norm360(sun_longitude_apparent_mean_equinox(jde) - lahiri_ayanamsa(jde))

def sidereal_moon(jde):
    return norm360(moon_longitude(jde) - lahiri_ayanamsa(jde))

def sidereal_rahu(jde, true_node=False):
    n = true_node_tropical(jde) if true_node else mean_node_tropical(jde)
    return norm360(n - lahiri_ayanamsa(jde))

def sidereal_ketu(jde, true_node=False):
    return norm360(sidereal_rahu(jde, true_node) + 180.0)

def elongation(jde):
    """Moon - Sun (apparent, mean equinox) in degrees 0..360. Tithi = floor(D/12)+1."""
    return norm360(moon_longitude(jde) - sun_longitude_apparent_mean_equinox(jde))

# ------------------------------------------------------------------ planets (Standish, JPL, valid 1800-2050)
#            a, a', e, e', I, I', L, L', varpi, varpi', Omega, Omega'
_STD = {
 "Mercury": (0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081),
 "Venus":   (0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418),
 "EMB":     (1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0.0, 0.0),
 "Mars":    (1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343),
 "Jupiter": (5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106),
 "Saturn":  (9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794),
 "Uranus":  (19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589),
 "Neptune": (30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664),
 "Pluto":   (39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482),
}

def _helio_xyz(name, jde):
    a0, a1, e0, e1, i0, i1, L0, L1, w0, w1, n0, n1 = _STD[name]
    T = (jde - J2000) / 36525.0
    a, e, I = a0 + a1 * T, e0 + e1 * T, (i0 + i1 * T) * D2R
    L, wbar, Om = L0 + L1 * T, w0 + w1 * T, (n0 + n1 * T)
    om = (wbar - Om) * D2R
    M = wrap180(L - wbar) * D2R
    E = M + e * math.sin(M)
    for _ in range(50):                      # Newton, converges for e<0.25 in <8 iterations
        dE = (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
        E -= dE
        if abs(dE) < 1e-12:
            break
    xp = a * (math.cos(E) - e)
    yp = a * math.sqrt(1 - e * e) * math.sin(E)
    co, so, cO, sO, cI, sI = math.cos(om), math.sin(om), math.cos(Om * D2R), math.sin(Om * D2R), math.cos(I), math.sin(I)
    x = (co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp
    y = (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp
    z = (so * sI) * xp + (co * sI) * yp
    return x, y, z

def planet_geocentric(name, jde):
    """-> (lon_of_date_tropical deg [mean equinox], lat deg, distance AU). Light-time + aberration applied. Tier-2 accuracy."""
    ex, ey, ez = _helio_xyz("EMB", jde)
    tau = 0.0
    for _ in range(3):
        px, py, pz = _helio_xyz(name, jde - tau)
        dx, dy, dz = px - ex, py - ey, pz - ez
        dist = math.sqrt(dx * dx + dy * dy + dz * dz)
        tau = 0.0057755183 * dist
    lon2000 = norm360(math.atan2(dy, dx) * R2D)
    lat = math.asin(dz / dist) * R2D
    T = (jde - J2000) / 36525.0
    lon = lon2000 + _pA(T) / 3600.0                      # precess along the ecliptic to the mean equinox of date
    lam_sun = sun_true_longitude_geometric(jde)
    lon -= 20.49552 / 3600.0 * math.cos((lam_sun - lon) * D2R) / math.cos(lat * D2R)   # annual aberration
    return norm360(lon), lat, dist

def sidereal_planet(name, jde):
    if name == "Sun":
        return sidereal_sun(jde)
    if name == "Moon":
        return sidereal_moon(jde)
    if name == "Rahu":
        return sidereal_rahu(jde)
    if name == "Ketu":
        return sidereal_ketu(jde)
    return norm360(planet_geocentric(name, jde)[0] - lahiri_ayanamsa(jde))

TIER2_VALID_YEARS = (1800, 2050)     # Standish elements; outside this range planet accuracy degrades (warn, do not fail)

def tier2_valid(jd_ut):
    y = 2000.0 + (jd_ut - J2000) / 365.2425
    return TIER2_VALID_YEARS[0] <= y <= TIER2_VALID_YEARS[1]

def planet_speed(name, jde, h=0.25):
    """deg/day, central difference."""
    return wrap180(sidereal_planet(name, jde + h) - sidereal_planet(name, jde - h)) / (2 * h)

# ------------------------------------------------------------------ sidereal time, RA/Dec, rise/set
def gmst_deg(jd_ut):
    T = (jd_ut - J2000) / 36525.0
    return norm360(280.46061837 + 360.98564736629 * (jd_ut - J2000) + 0.000387933 * T * T - T**3 / 38710000)

def ecl_to_equ(lon, lat, eps):
    l, b, e = lon * D2R, lat * D2R, eps * D2R
    ra = math.atan2(math.sin(l) * math.cos(e) - math.tan(b) * math.sin(e), math.cos(l))
    dec = math.asin(math.sin(b) * math.cos(e) + math.cos(b) * math.sin(e) * math.sin(l))
    return norm360(ra * R2D), dec * R2D

def sun_ra_dec(jd_ut):
    jde = jde_from_jd(jd_ut)
    return ecl_to_equ(sun_longitude_apparent(jde), 0.0, true_obliquity(jde))

def moon_ra_dec(jd_ut):
    jde = jde_from_jd(jd_ut)
    lon, lat, dist = moon_ecliptic(jde)
    lon = norm360(lon + nutation_longitude(jde))
    ra, dec = ecl_to_equ(lon, lat, true_obliquity(jde))
    return ra, dec, dist

def altitude(ra, dec, jd_ut, lat, lon_east):
    H = (gmst_deg(jd_ut) + lon_east - ra) * D2R
    phi, d = lat * D2R, dec * D2R
    return math.asin(max(-1.0, min(1.0, math.sin(phi) * math.sin(d) + math.cos(phi) * math.cos(d) * math.cos(H)))) * R2D

def sun_altitude(jd_ut, lat, lon_east):
    ra, dec = sun_ra_dec(jd_ut)
    return altitude(ra, dec, jd_ut, lat, lon_east)

H0_SUN_UPPER_LIMB = -0.8333      # 34' refraction + 16' semi-diameter
H0_SUN_CENTRE = -0.5667

def _bisect_sign_change(f, a, b, iters=60):
    fa = f(a)
    for _ in range(iters):
        m = 0.5 * (a + b)
        fm = f(m)
        if (fa < 0) == (fm < 0):
            a, fa = m, fm
        else:
            b = m
    return 0.5 * (a + b)

def horizon_events(fn_alt, jd_start, jd_end, h0, step=1.0 / 144.0):
    """Scan [jd_start, jd_end] for crossings of altitude fn_alt(jd) == h0. Returns [(jd, 'rise'|'set'), ...]."""
    out = []
    t = jd_start
    prev = fn_alt(t) - h0
    while t < jd_end:
        t2 = min(t + step, jd_end)
        cur = fn_alt(t2) - h0
        if (prev < 0) != (cur < 0):
            tt = _bisect_sign_change(lambda x: fn_alt(x) - h0, t, t2)
            out.append((tt, "rise" if cur > prev else "set"))
        t, prev = t2, cur
    return out

def sunrise_sunset_jd(y, m, d, lat, lon_east, tz_hours=5.5, h0=H0_SUN_UPPER_LIMB, elevation_m=0.0):
    """(sunrise_jd, sunset_jd) of the CIVIL date y-m-d in zone tz_hours.  None for a missing event (polar day/night).
       elevation_m lowers the horizon by dip = 1.76' * sqrt(h)."""
    h = h0 - (1.76 / 60.0) * math.sqrt(max(elevation_m, 0.0))
    t0 = local_midnight_jd(y, m, d, tz_hours)
    ev = horizon_events(lambda t: sun_altitude(t, lat, lon_east), t0, t0 + 1.0, h)
    rise = next((t for t, k in ev if k == "rise"), None)
    sset = next((t for t, k in ev if k == "set"), None)
    return rise, sset

def moon_altitude_rel(jd_ut, lat, lon_east):
    """Moon altitude minus the rise/set threshold h0 = 0.7275*parallax - 0.5667 deg (AA2 ch.15). Zero = moonrise/moonset."""
    ra, dec, dist = moon_ra_dec(jd_ut)
    par = math.asin(6378.14 / dist) * R2D
    return altitude(ra, dec, jd_ut, lat, lon_east) - (0.7275 * par - 0.5667)

def moonrise_moonset_jd(y, m, d, lat, lon_east, tz_hours=5.5):
    """[(jd, 'rise'|'set')] of the Moon inside the civil date (0, 1 or 2 events of each kind)."""
    t0 = local_midnight_jd(y, m, d, tz_hours)
    return horizon_events(lambda t: moon_altitude_rel(t, lat, lon_east), t0, t0 + 1.0, 0.0, step=1.0 / 96.0)

# ------------------------------------------------------------------ ascendant / MC
def ascendant_tropical(jd_ut, lat, lon_east):
    jde = jde_from_jd(jd_ut)
    ramc = norm360(gmst_deg(jd_ut) + lon_east) * D2R
    eps = mean_obliquity(jde) * D2R
    phi = lat * D2R
    asc = math.atan2(math.cos(ramc), -(math.sin(ramc) * math.cos(eps) + math.tan(phi) * math.sin(eps)))
    return norm360(asc * R2D)

def midheaven_tropical(jd_ut, lon_east):
    jde = jde_from_jd(jd_ut)
    ramc = norm360(gmst_deg(jd_ut) + lon_east) * D2R
    eps = mean_obliquity(jde) * D2R
    return norm360(math.atan2(math.sin(ramc), math.cos(ramc) * math.cos(eps)) * R2D)

def ascendant_sidereal(jd_ut, lat, lon_east):
    return norm360(ascendant_tropical(jd_ut, lat, lon_east) - lahiri_ayanamsa(jde_from_jd(jd_ut)))

def midheaven_sidereal(jd_ut, lon_east):
    return norm360(midheaven_tropical(jd_ut, lon_east) - lahiri_ayanamsa(jde_from_jd(jd_ut)))

# ------------------------------------------------------------------ generic robust event solver
def solve_crossing(f_deg, target_deg, t_lo, t_hi, scan=1.0 / 24.0, tol=1e-8):
    """First JD in [t_lo, t_hi] where the *increasing* angle function f_deg(jd) reaches target_deg (mod 360).
       Method: scan in `scan`-day steps for the sign change of wrap180(f - target) from <0 to >=0, then bisection.
       Returns None if no crossing (never raises, never loops forever)."""
    g = lambda t: wrap180(f_deg(t) - target_deg)
    a = t_lo
    ga = g(a)
    while a < t_hi:
        b = min(a + scan, t_hi)
        gb = g(b)
        if ga < 0 <= gb and (gb - ga) < 180.0:       # true up-crossing, not a 180->-180 wrap
            lo, hi = a, b
            for _ in range(80):
                mid = 0.5 * (lo + hi)
                if g(mid) < 0:
                    lo = mid
                else:
                    hi = mid
                if hi - lo < tol:
                    break
            return 0.5 * (lo + hi)
        a, ga = b, gb
    return None
```

### 18.2 `pk_tables.py` (252 lines)
```python
"""
pk_tables.py -- constant tables (names in Gujarati + English, classical tables).  Pure data, no logic.
Index conventions:  rashi 0..11 (Mesh=0) | nakshatra 0..26 (Ashwini=0) | weekday 0..6 (Sunday=0)
                    tithi 1..30 | yoga 0..26 | karana 1..60 | month 0..11 in Kartikadi order (Kartak=0)
"""
WEEKDAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
WEEKDAY_GU = ["રવિ", "સોમ", "મંગળ", "બુધ", "ગુરૂ", "શુક્ર", "શનિ"]
WEEKDAY_LORD = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

RASHI_EN = ["Mesh", "Vrushabh", "Mithun", "Kark", "Simh", "Kanya", "Tula", "Vrushchik", "Dhan", "Makar", "Kumbh", "Meen"]
RASHI_GU = ["મેષ", "વૃષભ", "મિથુન", "કર્ક", "સિંહ", "કન્યા", "તુલા", "વૃશ્ચિક", "ધન", "મકર", "કુંભ", "મીન"]
RASHI_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"]
RASHI_NATURE = ["movable", "fixed", "dual"] * 4              # Mesh movable, Vrushabh fixed, Mithun dual ...
RASHI_ELEMENT = ["fire", "earth", "air", "water"] * 3
RASHI_DIRECTION = ["E", "S", "W", "N"] * 3                   # Mesh E, Vrushabh S, Mithun W, Kark N ...
RASHI_VARNA = ["Kshatriya", "Vaishya", "Shudra", "Vipra"] * 3

NAK_EN = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
          "P.Phalguni", "U.Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "P.Ashadha",
          "U.Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "P.Bhadrapada", "U.Bhadrapada", "Revati"]
NAK_GU = ["અશ્વિની", "ભરણી", "કૃતિકા", "રોહિણી", "મૃગશીર્ષ", "આર્દ્રા", "પુનર્વસુ", "પુષ્ય", "આશ્લેષા", "મઘા",
          "પૂર્વા ફાલ્ગુની", "ઉત્તરા ફાલ્ગુની", "હસ્ત", "ચિત્રા", "સ્વાતિ", "વિશાખા", "અનુરાધા", "જ્યેષ્ઠા", "મૂળ", "પૂર્વાષાઢા",
          "ઉત્તરાષાઢા", "શ્રવણ", "ધનિષ્ઠા", "શતભિષા", "પૂર્વા ભાદ્રપદ", "ઉત્તરા ભાદ્રપદ", "રેવતી"]
def N(*names):
    """nakshatra names (as in NAK_EN) -> list of indices. Tables below are written by NAME so index typos are impossible."""
    return [NAK_EN.index(n) for n in names]

VIM_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]   # nakshatra i -> VIM_LORDS[i % 9]
VIM_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}
ASHTOTTARI_YEARS = {"Sun": 6, "Moon": 15, "Mars": 8, "Mercury": 17, "Saturn": 10, "Jupiter": 19, "Rahu": 12, "Venus": 21}
ABHIJIT_START, ABHIJIT_END = 276 + 40 / 60.0, 280 + 53 / 60.0 + 20 / 3600.0      # sidereal degrees

NAK_SHUBH = set(N("Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya", "U.Phalguni", "Hasta", "Chitra", "Swati", "Anuradha",
                  "U.Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "U.Bhadrapada", "Revati"))                 # 16 shubh (book p.37)
NAK_ASHUBH = set(range(27)) - NAK_SHUBH                                                                          # 11
NAK_MARRIAGE = set(N("Ashwini", "Rohini", "Mrigashira", "Magha", "U.Phalguni", "Hasta", "Chitra", "Swati", "Anuradha", "Mula",
                     "U.Ashadha", "Shravana", "Dhanishtha", "U.Bhadrapada", "Revati"))                           # 15 (book p.32)
NAK_GENDER_FEMALE = set(N("Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "P.Phalguni", "U.Phalguni", "Hasta", "Chitra", "Swati"))
NAK_GENDER_NEUTER = set(N("Vishakha", "Anuradha", "Jyeshtha"))
NAK_SANJNA_SUN = set(N("Rohini", "Mrigashira", "P.Phalguni", "U.Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
                       "Jyeshtha", "Mula", "Dhanishtha", "Shatabhisha", "U.Bhadrapada"))                         # book p.21 (14)
NAK_SANJNA_MOON = set(range(27)) - NAK_SANJNA_SUN                                                                # 13 (+Abhijit = 14)
NAK_GANDMOOL = set(N("Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Mula", "Revati"))

YOGA_EN = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda",
           "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
           "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Aindra", "Vaidhriti"]
YOGA_GU = ["વિષ્કુંભ", "પ્રીતિ", "આયુષ્માન", "સૌભાગ્ય", "શોભન", "અતિગંડ", "સુકર્મા", "ધૃતિ", "શૂલ", "ગંડ", "વૃદ્ધિ", "ધ્રુવ",
           "વ્યાઘાત", "હર્ષણ", "વજ્ર", "સિદ્ધિ", "વ્યતિપાત", "વરીયાન", "પરિઘ", "શિવ", "સિદ્ધ", "સાધ્ય", "શુભ", "શુક્લ",
           "બ્રહ્મા", "ઐન્દ્ર", "વૈધૃતિ"]
YOGA_BAD_FULL = {16, 26}                      # Vyatipata (17th), Vaidhriti (27th): index 16, 26
# yoga index -> (fraction-of-yoga to avoid at the start) from book p.34 (ghati rule): Vishkambha 3/60 ... see README 7.1
YOGA_AVOID_FIRST_GHATI = {0: 3, 5: 6, 8: 5, 9: 6, 12: 9, 14: 9}                          # ghati out of 60 of a nominal day
YOGA_AVOID_FIRST_HALF = {18}                                                             # Parigha

KARANA_MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"]
KARANA_MOVABLE_GU = ["બવ", "બાલવ", "કૌલવ", "તૈતિલ", "ગર", "વણિજ", "વિષ્ટિ"]
KARANA_FIXED = {1: ("Kimstughna", "કિંસ્તુઘ્ન"), 58: ("Shakuni", "શકુનિ"), 59: ("Chatushpada", "ચતુષ્પાદ"), 60: ("Naga", "નાગ")}
KARANA_GOOD = {"Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija"}

TITHI_EN = ["Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
            "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima"]
TITHI_GU = ["એકમ", "બીજ", "ત્રીજ", "ચોથ", "પાંચમ", "છઠ્ઠ", "સાતમ", "આઠમ", "નોમ", "દસમ", "અગિયારસ", "બારસ", "તેરસ", "ચૌદસ", "પૂનમ"]
TITHI_DEITY = ["Agni", "Brahma", "Gauri", "Ganesha", "Shesha-Naga", "Kartikeya", "Surya", "Shiva", "Durga", "Kaal(Yama)",
               "Vishvedeva", "Vishnu", "Kamadeva", "Shiva", "Chandra"]      # tithi 15 = Chandra ; 30 = Pitru
TITHI_RIKTA = {4, 9, 14}                                                       # in either paksha
TITHI_GOOD_MUHURAT = {2, 3, 5, 7, 10, 11, 13}

# months in Kartikadi order (index 0 = Kartak).  Month named by sidereal Sun rashi at the new moon that starts it.
MONTH_EN = ["Kartak", "Magshar", "Posh", "Maha", "Fagan", "Chaitra", "Vaishakh", "Jeth", "Ashadh", "Shravan", "Bhadarvo", "Aaso"]
MONTH_GU = ["કારતક", "માગશર", "પોષ", "મહા", "ફાગણ", "ચૈત્ર", "વૈશાખ", "જેઠ", "અષાઢ", "શ્રાવણ", "ભાદરવો", "આસો"]
# Sun rashi (0..11) at the starting new moon  ->  index into MONTH_EN
MONTH_OF_SUN_RASHI = {6: 0, 7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 5: 11}
MONTH_VEDIC = ["Urja", "Sahas", "Sahasya", "Tapas", "Tapasya", "Madhu", "Madhava", "Shukra", "Shuchi", "Nabhas", "Nabhasya", "Isha"]
MONTH_DEVI = ["Radha", "Vishalakshi", "Lakshmi", "Rukmini", "Dhatri", "Rama", "Mohini", "Padmakshi", "Kamala", "Kantimati", "Aparajita", "Padmavati"]
MONTH_DEVATA = ["Damodar", "Keshav", "Narayan", "Madhav", "Govind", "Vishnu", "Madhusudan", "Trivikram", "Vaman", "Shridhar", "Hrishikesh", "Padmanabh"]

RITU = ["Shishir", "Vasant", "Grishma", "Varsha", "Sharad", "Hemant"]       # tropical Sun 270-330, 330-30, 30-90, 90-150, 150-210, 210-270
RITU_GU = ["શિશિર", "વસંત", "ગ્રીષ્મ", "વર્ષા", "શરદ", "હેમંત"]

PLANETS_GU = {"Sun": "સૂર્ય", "Moon": "ચંદ્ર", "Mars": "મંગળ", "Mercury": "બુધ", "Jupiter": "ગુરૂ", "Venus": "શુક્ર", "Saturn": "શનિ",
              "Rahu": "રાહુ", "Ketu": "કેતુ", "Uranus": "હર્ષલ", "Neptune": "નેપ્ચ્યુન", "Pluto": "પ્લૂટો"}

# ---- chaughadiya
CHOG_CYCLE = ["Udveg", "Chal", "Labh", "Amrit", "Kaal", "Shubh", "Rog"]
CHOG_GU = {"Udveg": "ઉદ્વેગ", "Chal": "ચલ", "Labh": "લાભ", "Amrit": "અમૃત", "Kaal": "કાળ", "Shubh": "શુભ", "Rog": "રોગ"}
CHOG_GOOD = {"Shubh", "Amrit", "Labh", "Chal"}
HORA_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]      # Chaldean, descending orbital period
HORA_GOOD = {"Moon", "Mercury", "Jupiter", "Venus"}
# 8-part windows (part numbers 1..8 of daytime), index = weekday (Sun=0)
RAHU_PART = [8, 2, 7, 5, 6, 4, 3]
YAMA_PART = [5, 4, 3, 2, 1, 7, 6]
GULIKA_PART = [7, 6, 5, 4, 3, 2, 1]

# ---- weekday tables of auspicious / inauspicious combos (book pp.33,39), index = weekday (Sun=0), values nakshatra index
KANKACH_TITHI = [12, 11, 10, 9, 8, 7, 6]
DAGDHA_TITHI = [12, 11, 5, 3, 6, 8, 9]
VAJRAMUSAL_NAK = N("Bharani", "Chitra", "U.Ashadha", "Dhanishtha", "U.Phalguni", "Jyeshtha", "Revati")
YAMGHANT_NAK = N("Magha", "Vishakha", "Ardra", "Mula", "Krittika", "Rohini", "Hasta")
UTPAT_NAK = N("Vishakha", "P.Ashadha", "Dhanishtha", "Revati", "Rohini", "Pushya", "U.Phalguni")
MRITYU_NAK = N("Anuradha", "U.Ashadha", "Shatabhisha", "Ashwini", "Mrigashira", "Ashlesha", "Hasta")
KAAL_NAK = N("Bharani", "Ardra", "Magha", "Chitra", "Jyeshtha", "Ashwini", "P.Bhadrapada")
RAKSHAS_NAK = N("Shatabhisha", "Ashwini", "Mrigashira", "Ashlesha", "Hasta", "Anuradha", "U.Ashadha")
AMRITSIDDHI_NAK = N("Hasta", "Mrigashira", "Ashwini", "Anuradha", "Pushya", "Revati", "Rohini")
SIDDHI_NAK = N("Mula", "Shravana", "U.Bhadrapada", "Krittika", "Punarvasu", "P.Phalguni", "Swati")
SARVARTHA_SIDDHI = {   # standard table (not tabulated in the book); weekday -> nakshatra set
    0: set(N("Hasta", "Mula", "U.Phalguni", "U.Ashadha", "U.Bhadrapada", "Ashwini", "Pushya")),
    1: set(N("Rohini", "Mrigashira", "Pushya", "Anuradha", "Shravana")),
    2: set(N("Ashwini", "Krittika", "U.Bhadrapada", "Ashlesha")),
    3: set(N("Rohini", "Anuradha", "Hasta", "Krittika", "Mrigashira")),
    4: set(N("Revati", "Anuradha", "Ashwini", "Punarvasu", "Pushya")),
    5: set(N("Revati", "Anuradha", "Ashwini", "Punarvasu", "Shravana")),
    6: set(N("Rohini", "Swati", "Shravana"))}
JVALAMUKHI = {1: NAK_EN.index("Mula"), 5: NAK_EN.index("Bharani"), 8: NAK_EN.index("Krittika"), 9: NAK_EN.index("Rohini"), 10: NAK_EN.index("Ashlesha")}
TRIPUSHKAR_TITHI = {2, 7, 12}
TRIPUSHKAR_WEEKDAY = {0, 2, 6}                    # Sun, Tue, Sat
TRIPUSHKAR_NAK = set(N("Krittika", "Punarvasu", "U.Phalguni", "Vishakha", "U.Ashadha", "P.Bhadrapada"))
RAVI_YOGA_COUNTS = {4, 6, 9, 10, 13, 20}          # Moon nakshatra counted from Sun's nakshatra (inclusive)
DISHA_SHOOL = {1: "E", 6: "E", 0: "W", 5: "W", 2: "N", 3: "N", 4: "S"}      # weekday -> direction to avoid
RASHI_TRAVEL_DIRECTION = ["E", "S", "W", "N"] * 3

# ---- ahuti chakra order
AHUTI_ORDER = ["Sun", "Mercury", "Venus", "Saturn", "Moon", "Mars", "Jupiter", "Rahu", "Ketu"]
AHUTI_GOOD = {"Mercury", "Venus", "Moon", "Jupiter"}

# ---- exaltation / debilitation / friendship (Parashari)
EXALT = {"Sun": (0, 10), "Moon": (1, 3), "Mars": (9, 28), "Mercury": (5, 15), "Jupiter": (3, 5), "Venus": (11, 27), "Saturn": (6, 20), "Rahu": (2, 15)}
DEBIL = {"Sun": (6, 10), "Moon": (7, 3), "Mars": (3, 28), "Mercury": (11, 15), "Jupiter": (9, 5), "Venus": (5, 27), "Saturn": (0, 20), "Rahu": (8, 15)}
OWN = {"Sun": [4], "Moon": [3], "Mars": [0, 7], "Mercury": [2, 5], "Jupiter": [8, 11], "Venus": [1, 6], "Saturn": [9, 10]}
MOOLTRIKONA = {"Sun": 4, "Moon": 1, "Mars": 0, "Mercury": 5, "Jupiter": 8, "Venus": 6, "Saturn": 10}
NATURAL_FRIENDS = {"Sun": ("Moon", "Mars", "Jupiter"), "Moon": ("Sun", "Mercury"), "Mars": ("Sun", "Moon", "Jupiter"),
                   "Mercury": ("Sun", "Venus"), "Jupiter": ("Sun", "Moon", "Mars"), "Venus": ("Mercury", "Saturn"),
                   "Saturn": ("Mercury", "Venus")}
NATURAL_ENEMIES = {"Sun": ("Venus", "Saturn"), "Moon": (), "Mars": ("Mercury",), "Mercury": ("Moon",),
                   "Jupiter": ("Mercury", "Venus"), "Venus": ("Sun", "Moon"), "Saturn": ("Sun", "Moon", "Mars")}
BENEFICS = {"Moon", "Mercury", "Jupiter", "Venus"}
MALEFICS = {"Sun", "Mars", "Saturn", "Rahu", "Ketu"}
SPECIAL_ASPECTS = {"Mars": (4, 8), "Jupiter": (5, 9), "Saturn": (3, 10)}                 # plus the 7th for every planet
COMBUST_ORB = {"Moon": 12, "Mars": 17, "Mercury": 14, "Mercury_retro": 12, "Jupiter": 11, "Venus": 10, "Venus_retro": 8, "Saturn": 15}
DIGBALA_HOUSE = {"Jupiter": 1, "Mercury": 1, "Sun": 10, "Mars": 10, "Saturn": 7, "Moon": 4, "Venus": 4}

HOUSE_NATURE = {"kendra": {1, 4, 7, 10}, "trikona": {1, 5, 9}, "dusthana": {6, 8, 12}, "upachaya": {3, 6, 10, 11}, "maraka": {2, 7}}

# ---- avakahada chakra (book p.37): nakshatra -> (syllables[4], yoni, gana, yunja, nadi3)
_AV = [
 ("ચુ ચે ચો લા", "Horse", "Deva", "Purva", "Adi"), ("લી લુ લે લો", "Elephant", "Manushya", "Purva", "Madhya"),
 ("આ ઈ ઉ એ", "Sheep", "Rakshasa", "Purva", "Antya"), ("ઓ વા વી વુ", "Serpent", "Manushya", "Purva", "Antya"),
 ("વે વો કા કી", "Serpent", "Deva", "Purva", "Madhya"), ("કુ ઘ ઙ છ", "Dog", "Manushya", "Madhya", "Adi"),
 ("કે કો હા હી", "Cat", "Deva", "Madhya", "Adi"), ("હુ હે હો ડા", "Sheep", "Deva", "Madhya", "Madhya"),
 ("ડી ડુ ડે ડો", "Cat", "Rakshasa", "Madhya", "Antya"), ("મા મી મુ મે", "Rat", "Rakshasa", "Madhya", "Antya"),
 ("મો ટા ટી ટુ", "Rat", "Manushya", "Madhya", "Madhya"), ("ટે ટો પા પી", "Cow", "Manushya", "Madhya", "Adi"),
 ("પુ ષ ણ ઠ", "Buffalo", "Deva", "Madhya", "Adi"), ("પે પો રા રી", "Tiger", "Rakshasa", "Madhya", "Madhya"),
 ("રુ રે રો તા", "Buffalo", "Deva", "Madhya", "Antya"), ("તિ તુ તે તો", "Tiger", "Rakshasa", "Madhya", "Antya"),
 ("ના ની નુ ને", "Deer", "Deva", "Madhya", "Madhya"), ("નો યા યી યુ", "Deer", "Rakshasa", "Antya", "Adi"),
 ("યે યો ભા ભી", "Dog", "Rakshasa", "Antya", "Adi"), ("ભુ ધા ફા ઢા", "Monkey", "Manushya", "Antya", "Madhya"),
 ("ભે ભો જા જી", "Mongoose", "Manushya", "Antya", "Antya"), ("ખી ખુ ખે ખો", "Monkey", "Deva", "Antya", "Antya"),
 ("ગા ગી ગુ ગે", "Lion", "Rakshasa", "Antya", "Madhya"), ("ગો સા સી સુ", "Horse", "Rakshasa", "Antya", "Adi"),
 ("સે સો દા દી", "Lion", "Manushya", "Antya", "Adi"), ("દુ શ ઝ થ", "Cow", "Manushya", "Antya", "Madhya"),
 ("દે દો ચા ચી", "Elephant", "Deva", "Purva", "Antya")]
AVAKAHADA = [dict(syllables=s.split(), yoni=y, gana=g, yunja=yj, nadi=n) for s, y, g, yj, n in _AV]
ABHIJIT_AVAKAHADA = dict(syllables="જા જે જો ખ".split(), yoni="Mongoose", gana="Manushya", yunja=None, nadi="Antya")

def nadi3(nak_index):
    """3-nadi zig-zag: groups of three, direction alternates (Adi,Madhya,Antya | Antya,Madhya,Adi | ...). Equals AVAKAHADA[i]['nadi']."""
    g, k = divmod(nak_index, 3)
    order = ["Adi", "Madhya", "Antya"]
    return order[k] if g % 2 == 0 else order[2 - k]

NADI4 = {"Kanishtha": set(N("Krittika", "Magha", "P.Phalguni", "Jyeshtha", "Mula", "P.Bhadrapada", "U.Bhadrapada")),
         "Anamika": set(N("Rohini", "Ashlesha", "U.Phalguni", "Anuradha", "P.Ashadha", "Shatabhisha", "Revati")),
         "Madhyama": set(N("Mrigashira", "Pushya", "Hasta", "Vishakha", "U.Ashadha", "Dhanishtha", "Ashwini")),
         "Tarjani": set(N("Ardra", "Punarvasu", "Chitra", "Swati", "Shravana", "Bharani"))}      # + Abhijit (book p.36 chaturparva)

YONI_NAMES = ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"]
YONI_MATRIX = [   # symmetric, 0 = sworn enemies (Horse-Buffalo, Elephant-Lion, Sheep-Monkey, Serpent-Mongoose, Dog-Deer, Cat-Rat, Cow-Tiger)
 [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1], [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
 [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
 [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
 [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
 [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]]

# Vashya classes by rashi (Dhan first half Manava/second half Chatushpada, Makar first half Chatushpada/second half Jalachara)
VASHYA_CLASSES = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"]
VASHYA_OF_RASHI = ["Chatushpada", "Chatushpada", "Manava", "Jalachara", "Vanachara", "Manava", "Manava", "Keeta",
                   "Manava|Chatushpada", "Chatushpada|Jalachara", "Manava", "Jalachara"]
VASHYA_SCORE = {   # [groom][bride]
 "Chatushpada": {"Chatushpada": 2, "Manava": 1, "Jalachara": 1, "Vanachara": 0.5, "Keeta": 1},
 "Manava":      {"Chatushpada": 1, "Manava": 2, "Jalachara": 0.5, "Vanachara": 0, "Keeta": 1},
 "Jalachara":   {"Chatushpada": 1, "Manava": 0.5, "Jalachara": 2, "Vanachara": 1, "Keeta": 1},
 "Vanachara":   {"Chatushpada": 0, "Manava": 0, "Jalachara": 0, "Vanachara": 2, "Keeta": 0},
 "Keeta":       {"Chatushpada": 1, "Manava": 1, "Jalachara": 1, "Vanachara": 0, "Keeta": 2}}
GANA_SCORE = {   # [bride][groom] -- most-cited table; regional variants differ (config)
 "Deva":      {"Deva": 6, "Manushya": 6, "Rakshasa": 1},
 "Manushya":  {"Deva": 5, "Manushya": 6, "Rakshasa": 0},
 "Rakshasa":  {"Deva": 1, "Manushya": 0, "Rakshasa": 6}}
VARNA_RANK = {"Vipra": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1}

# ---- name-letter varga (book p.37)
VARGA = {"Garuda": "અ ઇ ઉ એ ઓ", "Billi(Cat)": "ક ખ ગ ઘ", "Simha(Lion)": "ચ છ જ ઝ", "Kutra(Dog)": "ટ ઠ ડ ઢ",
         "Sarpa(Serpent)": "ત થ દ ધ ન", "Undar(Rat)": "પ ફ બ ભ મ", "Hiran(Deer)": "ય ર લ વ", "Gheta(Sheep)": "શ ષ સ હ"}
VARGA_ENEMY = {"Garuda": "Sarpa(Serpent)", "Sarpa(Serpent)": "Garuda", "Billi(Cat)": "Undar(Rat)", "Undar(Rat)": "Billi(Cat)",
               "Simha(Lion)": "Hiran(Deer)", "Hiran(Deer)": "Simha(Lion)", "Kutra(Dog)": "Gheta(Sheep)", "Gheta(Sheep)": "Kutra(Dog)"}

# ---- colours / gems by rashi (book p.39)
RASHI_COLOUR_GU = ["લાલ", "ફિક્કો બ્લુ", "પીળો", "લીલો", "નારંગી", "ફિક્કો કાળો", "ક્રીમ / સફેદ", "તેજ લાલ", "પીળો", "કાળાશ પડતો", "આસમાની", "તેજ સફેદ"]
RASHI_GEM = ["Coral", "Diamond", "Emerald", "Pearl", "Ruby", "Emerald", "Diamond", "Coral", "Yellow sapphire", "Blue sapphire", "Blue sapphire", "Yellow sapphire"]

# ---- aavak/javak table (book p.18; digits as read -- verify) : rashi -> ((aavak,javak) Kartak-Fagan, (aavak,javak) Chaitra-Aaso)
AAVAK_JAVAK = [((8, 14), (2, 14)), ((2, 8), (11, 5)), ((5, 5), (14, 2)), ((14, 2), (8, 2)), ((2, 11), (11, 11)), ((5, 5), (14, 2)),
               ((2, 8), (11, 5)), ((8, 14), (2, 14)), ((11, 5), (5, 5)), ((14, 14), (8, 14)), ((14, 14), (8, 14)), ((11, 5), (5, 5))]
AAVAK_RESULT = {1: "Labh", 2: "Sukh", 6: "Sanman", 7: "Vijay", 3: "Klesh", 4: "Rog", 5: "Lokapavad", 0: "Nuksani"}

# ---- Makar-sankranti daan by rashi group (book p.28)
SANKRANTI_DAAN = {(0, 4, 8): "Black til, steel utensils, black cloth", (1, 6, 9): "Wheat, jaggery, red cloth, red til, copper vessel",
                  (2, 7, 11): "Ghee, sugar, white til, white/printed cloth, silver", (3, 5, 10): "Chana dal, yellow cloth, brass vessel"}

# ---- graha daan/japa (book p.36): metal, upadhatu, gem, grain, animal, rasa, colour, cloth, flower, japa count
GRAHA_DAAN = {
 "Sun": ("Gold", "Copper", "Ruby", "Wheat", "Red cow", "Jaggery", "Copper-red", "Red", "Red karan", 7000),
 "Moon": ("Gold", "Silver", "Pearl", "Rice", "White bull", "Ghee", "White", "White", "White", 11000),
 "Mars": ("Gold", "Copper", "Coral", "Masoor", "Red bull", "Jaggery", "Red", "Red", "Red karan", 10000),
 "Mercury": ("Gold", "Bronze", "Emerald", "Mung", "Elephant", "Ghee", "Green", "Green", "All flowers", 4000),
 "Jupiter": ("Gold", "Bronze", "Yellow sapphire", "Chana", "Horse", "Sugar", "Yellow", "Yellow", "Yellow", 19000),
 "Venus": ("Gold", "Silver", "Diamond", "Rice", "White horse", "Ghee", "Shining", "Printed", "White", 16000),
 "Saturn": ("Gold", "Iron", "Blue sapphire", "Urad", "Buffalo", "Oil", "Black", "Black", "Black", 23000),
 "Rahu": ("Gold", "Lead", "Gomed", "Til", "Horse", "Oil", "-", "Black", "Black", 18000),
 "Ketu": ("Gold", "Sharp iron", "Cat's eye", "Til", "Goat", "Oil", "-", "Black", "Black", 17000)}

# ---- Vimshottari balance helper (1 ghati of mahadasha = years*6 days, book p.38)

# ---- dashavatar (tithi rules, book p.38):  name -> (month index Kartikadi, paksha 'S'/'K', tithi in paksha, time of day)
DASHAVATAR = {"Matsya": (5, "S", 3, "aparahna"), "Kurma": (6, "S", 15, "sandhya"), "Varaha": (10, "S", 3, "aparahna"),
              "Narsimha": (6, "S", 14, "sandhya"), "Vamana": (10, "S", 12, "madhyahna"), "Parashuram": (6, "S", 3, "madhyahna"),
              "Ram": (5, "S", 9, "madhyahna"), "Krishna": (9, "K", 8, "madhyaratri"), "Buddha": (11, "S", 10, "sandhya"),
              "Kalki": (9, "S", 6, "sandhya")}

# ---- 60-year samvatsara cycle (index 1..60); Gujarati/Vikram default as printed in book: 2081 = 50 (Anala/Nala)
SAMVATSARA = ["Prabhava", "Vibhava", "Shukla", "Pramoda", "Prajapati", "Angira", "Shrimukha", "Bhava", "Yuva", "Dhatri",
              "Ishvara", "Bahudhanya", "Pramathi", "Vikrama", "Vrisha", "Chitrabhanu", "Subhanu", "Tarana", "Parthiva", "Vyaya",
              "Sarvajit", "Sarvadhari", "Virodhi", "Vikruti", "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukhi",
              "Hevilambi", "Vilambi", "Vikari", "Sharvari", "Plava", "Shubhakrit", "Shobhakrit", "Krodhi", "Vishvavasu", "Parabhava",
              "Plavanga", "Kilaka", "Saumya", "Sadharana", "Virodhikrit", "Paridhavi", "Pramadi", "Ananda", "Rakshasa", "Nala(Anala)",
              "Pingala", "Kalayukta", "Siddharthi", "Raudra", "Durmati", "Dundubhi", "Rudhirodgari", "Raktakshi", "Krodhana", "Akshaya"]

# ---- Parsi (Shahenshahi)
PARSI_MONTHS = ["Farvardin", "Ardibehesht", "Khordad", "Tir", "Amardad", "Shehrevar", "Meher", "Avan", "Adar", "Dae", "Bahman", "Aspandard"]
PARSI_ROJ = ["Hormuzd", "Bahman", "Ardibehesht", "Shehrevar", "Aspandard", "Khordad", "Amardad", "Dae-pa-Adar", "Adar", "Avan",
             "Khorshed", "Mohor", "Tir", "Gosh", "Dae-pa-Meher", "Meher", "Srosh", "Rashne", "Fravardin", "Behram",
             "Ram", "Govad", "Dae-pa-Din", "Din", "Ashishvangh", "Ashtad", "Asman", "Zamyad", "Mahraspand", "Anaran"]
PARSI_GATHA = ["Ahunavaiti", "Ushtavaiti", "Spentamainyu", "Vohukhshathra", "Vahishtoishti"]
HIJRI_MONTHS = ["Muharram", "Safar", "Rabi-ul-Awwal", "Rabi-ul-Akhir", "Jumada-ul-Awwal", "Jumada-ul-Akhir", "Rajab", "Shaban",
                "Ramzan", "Shawwal", "Zil-Qada", "Zil-Hijja"]
```

### 18.3 `pk_cal.py` (369 lines)
```python
"""
pk_cal.py -- panchang limbs, lunations (amanta), months, eras, sankranti, ritu, other calendars, day record.
Depends on pk_astro, pk_tables.
"""
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pk_astro import *
import pk_tables as T

NAK_SPAN = 360.0 / 27.0
RAJKOT = None  # set below after Place is defined

@dataclass(frozen=True)
class Place:
    name: str
    lat: float
    lon: float            # east positive
    tz: float = 5.5       # hours east of UTC (fixed offset; for DST places pass the offset valid on that date)
    elevation: float = 0.0

RAJKOT = Place("Rajkot", 22.3039, 70.8022, 5.5)
DELHI = Place("Delhi", 28.6139, 77.2090, 5.5)

# ------------------------------------------------------------------ limb angle functions (argument: JD UT)
def _jde(jd):
    return jde_from_jd(jd)

def ang_tithi(jd):   return elongation(_jde(jd))
def ang_nak(jd):     return sidereal_moon(_jde(jd))
def ang_yoga(jd):    return norm360(sidereal_sun(_jde(jd)) + sidereal_moon(_jde(jd)))
def ang_moonrashi(jd): return sidereal_moon(_jde(jd))
def ang_sunrashi(jd):  return sidereal_sun(_jde(jd))

LIMB = {  # kind -> (angle fn, unit degrees, max span days of one segment, first number)
    "tithi": (ang_tithi, 12.0, 2.0, 1),
    "karana": (ang_tithi, 6.0, 1.3, 1),
    "nakshatra": (ang_nak, NAK_SPAN, 1.6, 1),
    "yoga": (ang_yoga, NAK_SPAN, 1.6, 1),
    "moonrashi": (ang_moonrashi, 30.0, 3.6, 1),
    "sunrashi": (ang_sunrashi, 30.0, 33.0, 1)}

def limb_number(kind, jd):
    f, unit, _, first = LIMB[kind]
    n = int(f(jd) // unit) + first
    return n

def limb_end(kind, jd):
    """First instant strictly after jd when the limb number of `kind` changes (JD UT)."""
    f, unit, span, first = LIMB[kind]
    a = f(jd)
    n = int(a // unit)
    target = ((n + 1) * unit) % 360.0
    return solve_crossing(f, target, jd, jd + span)

def limb_start(kind, jd):
    """Instant at which the current limb (at jd) began."""
    f, unit, span, first = LIMB[kind]
    a = f(jd)
    n = int(a // unit)
    target = (n * unit) % 360.0
    return solve_crossing(f, target, jd - span, jd + 1e-9)

def limb_segments(kind, jd_a, jd_b):
    """List of (number, start_jd, end_jd) clipped to [jd_a, jd_b]. number = limb number (tithi 1..30, karana 1..60,
       nakshatra/yoga 1..27, moonrashi 1..12)."""
    out = []
    t = jd_a
    guard = 0
    while t < jd_b and guard < int((jd_b - jd_a) * 4) + 20:
        guard += 1
        n = limb_number(kind, t)
        e = limb_end(kind, t)
        if e is None:                       # cannot happen for Sun/Moon (monotonic) -- defensive
            out.append((n, t, jd_b)); break
        out.append((n, t, min(e, jd_b)))
        t = e + 1e-7
    return out

def karana_name(n, lang="en"):
    if n in T.KARANA_FIXED:
        return T.KARANA_FIXED[n][0 if lang == "en" else 1]
    i = (n - 2) % 7
    return (T.KARANA_MOVABLE if lang == "en" else T.KARANA_MOVABLE_GU)[i]

def tithi_label(t):
    """1..30 -> (paksha 'Sud'|'Vad', number in paksha 1..15 [30 printed as 30]), name."""
    if t <= 15:
        return "Sud", t
    return "Vad", (t - 15 if t != 30 else 30)

def pada_of(sid_lon):
    return int((sid_lon % NAK_SPAN) // (NAK_SPAN / 4)) + 1

def rashi_deg_min(lon):
    r = int(lon // 30); d = lon - 30 * r
    return r, int(d), int((d % 1) * 60)

# ------------------------------------------------------------------ sunrise on a civil date
def sunrise_sunset(d, place):
    """d: datetime.date. -> (rise_jd, set_jd) in JD UT; None where the event does not occur."""
    return sunrise_sunset_jd(d.year, d.month, d.day, place.lat, place.lon, place.tz, elevation_m=place.elevation)

def hindu_day_bounds(d, place):
    """(sunrise of d, sunrise of d+1). Falls back to 06:00 local if no sunrise (polar) and flags it."""
    flag = None
    r0, _ = sunrise_sunset(d, place)
    r1, _ = sunrise_sunset(d + timedelta(days=1), place)
    if r0 is None:
        r0 = local_midnight_jd(d.year, d.month, d.day, place.tz) + 0.25; flag = "no_sunrise_fallback_06:00"
    if r1 is None:
        dd = d + timedelta(days=1)
        r1 = local_midnight_jd(dd.year, dd.month, dd.day, place.tz) + 0.25; flag = "no_sunrise_fallback_06:00"
    return r0, r1, flag

# ------------------------------------------------------------------ lunations (amanta)
_NM_CACHE = {}

def new_moon_near(jd_guess):
    key = round(jd_guess, 2)
    if key in _NM_CACHE:
        return _NM_CACHE[key]
    r = solve_crossing(ang_tithi, 0.0, jd_guess - 2.0, jd_guess + 2.0, scan=1.0 / 24.0)
    if r is None:
        raise RuntimeError("new moon not bracketed near %f" % jd_guess)
    _NM_CACHE[key] = r
    return r

def new_moon_on_or_before(jd):
    """Last new moon <= jd (JD UT)."""
    age_days = ang_tithi(jd) / 12.1908          # mean elongation rate deg/day
    est = jd - age_days
    nm = new_moon_near(est)
    if nm > jd + 1e-9:
        nm = new_moon_near(est - 29.53)
    return nm

def next_new_moon(nm):
    return new_moon_near(nm + 29.53)

def lunation_info(nm_start):
    nm_end = next_new_moon(nm_start)
    r0 = int(ang_sunrashi(nm_start) // 30)
    r1 = int(ang_sunrashi(nm_end) // 30)
    adhik = (r0 == r1)
    kshaya = ((r1 - r0) % 12 == 2)
    mi = T.MONTH_OF_SUN_RASHI[r0]
    # distance (deg) of the Sun from a rashi boundary at either new moon: warn when < 0.2 deg (~5 h)
    def edge(jd):
        x = ang_sunrashi(jd) % 30
        return min(x, 30 - x)
    return dict(start=nm_start, end=nm_end, rashi_start=r0, rashi_end=r1, month_index=mi, month_en=T.MONTH_EN[mi],
                month_gu=T.MONTH_GU[mi], adhik=adhik, kshaya=kshaya,
                borderline=(min(edge(nm_start), edge(nm_end)) < 0.2))

def first_civil_day(nm, place):
    """First civil date whose sunrise is after the new moon nm."""
    d = jd_to_datetime(nm, IST).date() - timedelta(days=2)
    for _ in range(6):
        r, _ = sunrise_sunset(d, place)
        if r is not None and r > nm:
            return d
        d += timedelta(days=1)
    raise RuntimeError("first_civil_day failed")

def lunation_dates(info, place):
    """(first_date, last_date, n_days) of a lunation under the sunrise rule."""
    a = first_civil_day(info["start"], place)
    b = first_civil_day(info["end"], place) - timedelta(days=1)
    return a, b, (b - a).days + 1

def lunations_between(jd_a, jd_b):
    out = []
    nm = new_moon_on_or_before(jd_a)
    while nm < jd_b:
        info = lunation_info(nm)
        out.append(info)
        nm = info["end"]
    return out

# ------------------------------------------------------------------ eras
def kartak_start(year, place):
    """Civil date of Kartak Sud 1 (nija Kartak) that falls in Gregorian `year`."""
    jd0 = julian_day(year, 9, 20)
    for info in lunations_between(jd0, jd0 + 90):
        if info["rashi_start"] == 6 and not info["adhik"]:
            return first_civil_day(info["start"], place)
    raise RuntimeError("Kartak not found")

def chaitra_start(year, place):
    """Civil date of Chaitra Sud 1 (nija Chaitra) in Gregorian `year` (Shaka new year / Gudi Padwa)."""
    jd0 = julian_day(year, 2, 20)
    for info in lunations_between(jd0, jd0 + 70):
        if info["rashi_start"] == 11 and not info["adhik"]:
            return first_civil_day(info["start"], place)
    raise RuntimeError("Chaitra not found")

def vikram_samvat(d, place, system="kartikadi"):
    if system == "kartikadi":
        return d.year + 57 if d >= kartak_start(d.year, place) else d.year + 56
    return d.year + 57 if d >= chaitra_start(d.year, place) else d.year + 56

def shaka_year(d, place):
    return d.year - 78 if d >= chaitra_start(d.year, place) else d.year - 79

def vir_samvat(vs_kartikadi):
    return vs_kartikadi + 470

def samvatsara_name(vs, offset=9):
    i = (vs + offset) % 60
    return T.SAMVATSARA[(i if i else 60) - 1]

def samvatsara_name_shaka(shaka):
    i = (shaka + 12) % 60
    return T.SAMVATSARA[(i if i else 60) - 1]

# ------------------------------------------------------------------ Hindu date of a civil date
def hindu_date(d, place):
    r0, r1, flag = hindu_day_bounds(d, place)
    t = limb_number("tithi", r0 + 1.0 / 86400)               # instant just after sunrise
    nm = new_moon_on_or_before(r0)
    info = lunation_info(nm)
    p, n = tithi_label(t)
    return dict(sunrise=r0, next_sunrise=r1, tithi=t, paksha=p, tithi_in_paksha=n, lunation=info,
                month_en=info["month_en"], month_gu=info["month_gu"], adhik=info["adhik"], flag=flag)

# ------------------------------------------------------------------ solar events
def sankrantis(jd_a, jd_b):
    """[(rashi_entered 0..11, jd)] for sidereal Sun ingresses inside [jd_a, jd_b]."""
    out = []
    t = jd_a
    while t < jd_b:
        n = int(ang_sunrashi(t) // 30)
        tgt = ((n + 1) * 30.0) % 360.0
        e = solve_crossing(ang_sunrashi, tgt, t, t + 33.0)
        if e is None or e > jd_b:
            break
        out.append(((n + 1) % 12, e))
        t = e + 1e-6
    return out

def sun_nakshatra_entries(jd_a, jd_b):
    out = []
    t = jd_a
    while t < jd_b:
        n = int(ang_sunrashi(t) // NAK_SPAN)
        e = solve_crossing(ang_sunrashi, ((n + 1) * NAK_SPAN) % 360.0, t, t + 20.0)
        if e is None or e > jd_b:
            break
        out.append(((n + 1) % 27, e))
        t = e + 1e-6
    return out

def tropical_sun(jd):
    return sun_longitude_apparent(_jde(jd))

def ritu_ayana_events(jd_a, jd_b):
    """Tropical-Sun events: every 30 deg multiple that is a ritu/ayana/equinox boundary: 0,30,90,150,180,210,270,330."""
    wanted = [0, 30, 90, 150, 180, 210, 270, 330]
    out = []
    for tgt in wanted:
        t = jd_a
        while True:
            e = solve_crossing(tropical_sun, float(tgt), t, jd_b, scan=0.25)
            if e is None:
                break
            out.append((tgt, e)); t = e + 30
    return sorted(out, key=lambda x: x[1])

def ritu_of(jd):
    return int(((tropical_sun(jd) - 270.0) % 360.0) // 60.0)         # index into T.RITU

def ayana_of(jd):
    L = tropical_sun(jd)
    return "Uttarayan" if (L >= 270.0 or L < 90.0) else "Dakshinayan"

# ------------------------------------------------------------------ chronology helpers
def gregorian_leap(y):
    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)

def easter(year):
    """Gregorian Easter Sunday (AA2 ch.8)."""
    a = year % 19; b = year // 100; c = year % 100; d = b // 4; e = b % 4
    f = (b + 8) // 25; g = (b - f + 1) // 3; h = (19 * a + b - d - g + 15) % 30
    i = c // 4; k = c % 4; l = (32 + 2 * e + 2 * i - h - k) % 7; m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31; day = (h + l - 7 * m + 114) % 31 + 1
    return date(year, month, day)

def hijri_tabular(d):
    """Tabular civil Hijri date (30-year cycle, leap years 2,5,7,10,13,16,18,21,24,26,29). Real dates may differ by +-1 (moon sighting)."""
    jdn = int(math.floor(julian_day(d.year, d.month, d.day, 12.0) + 0.5))
    days = jdn - 1948440
    cyc, rem = divmod(days, 10631)
    leap = {2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29}
    y = 1
    while True:
        ln = 355 if y in leap else 354
        if rem < ln:
            break
        rem -= ln; y += 1
    year = cyc * 30 + y
    mlen = [30, 29] * 6
    if y in leap: mlen[11] = 30
    m = 0
    while rem >= mlen[m]:
        rem -= mlen[m]; m += 1
    return year, m + 1, rem + 1

PARSI_ANCHOR = date(2025, 8, 15)       # 1 Farvardin 1395 YZ (Shahenshahi) -- book p.29 (Pateti/Navroz 15-08-2025). No leap days.
PARSI_ANCHOR_YEAR = 1395

def parsi_date(d):
    n = (d - PARSI_ANCHOR).days
    yr = PARSI_ANCHOR_YEAR + n // 365
    idx = n % 365
    roj = idx % 30
    if idx < 360:
        return yr, T.PARSI_MONTHS[idx // 30], T.PARSI_ROJ[roj], idx // 30 + 1, roj + 1
    return yr, "Gatha", T.PARSI_GATHA[idx - 360], 13, idx - 360 + 1

def ghati_pal(minutes_since_sunrise):
    gh = minutes_since_sunrise / 24.0
    g = int(gh); p = int((gh - g) * 60)
    return g, p

def ghati_pal_from_hhmm(hours_minutes):
    """book rule p.39: hours.minutes (as h + m/60) x 2.5 -> ghati-pal"""
    return hours_minutes * 2.5

def kalmi(dt_local, day_start_date):
    """Book clock `ક.મિ.`: hours.minutes counted from midnight of the sunrise-date, >24 allowed. Returns 'HH.MM' string."""
    delta = dt_local - datetime(day_start_date.year, day_start_date.month, day_start_date.day, tzinfo=dt_local.tzinfo)
    mins = int(round(delta.total_seconds() / 60.0))
    return "%d.%02d" % (mins // 60, mins % 60)

# ------------------------------------------------------------------ one printed row
def day_record(d, place=RAJKOT):
    """All limbs at sunrise with end times + every segment that touches the Hindu day [sunrise, next sunrise]."""
    r0, r1, flag = hindu_day_bounds(d, place)
    rise, sset = sunrise_sunset(d, place)
    t0 = r0 + 1.0 / 86400
    rec = dict(date=d, weekday=(d.weekday() + 1) % 7, sunrise=r0, sunset=sset, next_sunrise=r1, flag=flag)
    for kind in ("tithi", "karana", "nakshatra", "yoga", "moonrashi"):
        rec[kind + "_segments"] = limb_segments(kind, t0, r1)
    t, _, _ = rec["tithi_segments"][0]
    rec["tithi"] = t
    rec["tithi_end"] = rec["tithi_segments"][0][2]
    rec["nakshatra"] = rec["nakshatra_segments"][0][0]
    rec["yoga"] = rec["yoga_segments"][0][0]
    rec["karana"] = rec["karana_segments"][0][0]
    rec["moon_rashi"] = rec["moonrashi_segments"][0][0]
    rec["sun_sid"] = ang_sunrashi(r0)
    rec["moon_sid"] = ang_nak(r0)
    return rec

def tithi_flags_for_range(d0, n_days, place=RAJKOT):
    """Detect kshaya / vriddhi from consecutive sunrise tithis. Returns list of (date, tithi_at_sunrise, flag)."""
    prev = None; out = []
    for i in range(n_days + 1):
        d = d0 + timedelta(days=i)
        r0, _, _ = hindu_day_bounds(d, place)
        t = limb_number("tithi", r0 + 1.0 / 86400)
        flag = ""
        if prev is not None:
            diff = (t - prev) % 30
            if diff == 0: flag = "vriddhi"
            elif diff >= 2: flag = "kshaya:" + ",".join(str(((prev + k - 1) % 30) + 1) for k in range(1, diff))
        out.append((d, t, flag)); prev = t
    return out
```

### 18.4 `pk_eclipse.py` (142 lines)
```python
"""
pk_eclipse.py -- eclipse detection and circumstances (geometric method, Tier-2: contacts +-2 min, magnitude +-0.02)
Lunar: global (geocentric shadow geometry, Danjon enlargement).  Solar: LOCAL topocentric (Meeus ch.40 parallax).
"""
import math
from pk_astro import *
from pk_cal import ang_tithi, solve_crossing

SHADOW_ENLARGE = 1.015

def _lunar_geom(jd):
    jde = jde_from_jd(jd)
    lon, lat, dist = moon_ecliptic(jde)
    sun = sun_longitude_apparent_mean_equinox(jde)
    R = sun_distance_au(jde)
    dl = wrap180(lon - (sun + 180.0)) * math.cos(lat * D2R)
    sep = math.hypot(dl, lat)
    pm = math.asin(6378.14 / dist) * R2D
    ps = 8.794 / 3600.0 / R
    ss = 959.63 / 3600.0 / R
    sm = 0.272481 * pm
    return sep, SHADOW_ENLARGE * (pm + ps - ss), SHADOW_ENLARGE * (pm + ps + ss), sm

def full_moons(jd_a, jd_b):
    out = []
    t = jd_a
    while t < jd_b:
        e = solve_crossing(ang_tithi, 180.0, t, t + 31.0, scan=0.25)
        if e is None or e > jd_b: break
        out.append(e); t = e + 20.0
    return out

def new_moons(jd_a, jd_b):
    out = []
    t = jd_a
    while t < jd_b:
        e = solve_crossing(ang_tithi, 0.0, t, t + 31.0, scan=0.25)
        if e is None or e > jd_b: break
        out.append(e); t = e + 20.0
    return out

def _min_sep(f, jd, half=0.25):
    a, b = jd - half, jd + half
    for _ in range(60):                         # ternary search (unimodal near eclipse)
        m1, m2 = a + (b - a) / 3, b - (b - a) / 3
        if f(m1) < f(m2): b = m2
        else: a = m1
    return 0.5 * (a + b)

def _cross_down_up(f, level, t_min, half):
    """contact before and after t_min where f(t) == level (f decreasing then increasing)."""
    def bis(a, b, rising):
        for _ in range(60):
            m = 0.5 * (a + b)
            if (f(m) > level) == rising: b = m      # rising side: f>level means we are past the contact
            else: a = m
        return 0.5 * (a + b)
    c1 = bis(t_min - half, t_min, False)
    c2 = bis(t_min, t_min + half, True)
    return c1, c2

def lunar_eclipse(jd_full):
    """-> None or dict(type, umbral_mag, penumbral_mag, greatest, P1,U1,U2,U3,U4,P4) (JD UT; missing contacts None)."""
    sep = lambda t: _lunar_geom(t)[0]
    tg = _min_sep(sep, jd_full)
    s, ru, rp, sm = _lunar_geom(tg)
    pen_mag = (rp + sm - s) / (2 * sm)
    if pen_mag <= 0: return None
    um = (ru + sm - s) / (2 * sm)
    half = 0.2
    c = {"greatest": tg}
    def contact(level_fn):
        g = lambda t: _lunar_geom(t)[0] - level_fn(t)
        return _cross_down_up(g, 0.0, tg, half)
    c["P1"], c["P4"] = contact(lambda t: _lunar_geom(t)[2] + _lunar_geom(t)[3])
    if um > 0:
        c["U1"], c["U4"] = contact(lambda t: _lunar_geom(t)[1] + _lunar_geom(t)[3])
        if um >= 1.0:
            c["U2"], c["U3"] = contact(lambda t: _lunar_geom(t)[1] - _lunar_geom(t)[3])
    typ = "total" if um >= 1 else ("partial" if um > 0 else "penumbral")
    c.update(type=typ, umbral_mag=um, penumbral_mag=pen_mag)
    return c

def _topo_sun_moon(jd, lat, lon_east, elev=0.0):
    jde = jde_from_jd(jd)
    # Sun
    ra_s, de_s = sun_ra_dec(jd)
    R = sun_distance_au(jde)
    # Moon geocentric
    ra_m, de_m, dist = moon_ra_dec(jd)
    phi = lat * D2R
    u = math.atan(0.99664719 * math.tan(phi))
    rs = 0.99664719 * math.sin(u) + elev / 6378140.0 * math.sin(phi)
    rc = math.cos(u) + elev / 6378140.0 * math.cos(phi)
    lst = (gmst_deg(jd) + lon_east) % 360.0
    def parallax(ra, de, dist_km):
        sp = 6378.14 / dist_km
        H = (lst - ra) * D2R; d = de * D2R
        dra = math.atan2(-rc * sp * math.sin(H), math.cos(d) - rc * sp * math.cos(H))
        d2 = math.atan2((math.sin(d) - rs * sp) * math.cos(dra), math.cos(d) - rc * sp * math.cos(H))
        return ra + dra * R2D, d2 * R2D
    ra_s2, de_s2 = parallax(ra_s, de_s, R * 149597870.7)
    ra_m2, de_m2 = parallax(ra_m, de_m, dist)
    # separation
    a1, d1, a2, d2 = ra_s2 * D2R, de_s2 * D2R, ra_m2 * D2R, de_m2 * D2R
    c = math.sin(d1) * math.sin(d2) + math.cos(d1) * math.cos(d2) * math.cos(a1 - a2)
    sep = math.acos(max(-1, min(1, c))) * R2D
    ss = 959.63 / 3600.0 / R
    alt_m = altitude(ra_m2, de_m2, jd, lat, lon_east)
    sm = 0.272481 * math.asin(6378.14 / dist) * R2D * (1 + math.sin(max(alt_m, 0) * D2R) * 6378.14 / dist)
    alt_s = altitude(ra_s2, de_s2, jd, lat, lon_east)
    return sep, ss, sm, alt_s

def solar_eclipse_local(jd_new, lat, lon_east, elev=0.0):
    """Local circumstances: dict(visible, magnitude, obscuration, greatest, C1, C4, sun_alt) or None if no overlap at any time."""
    f = lambda t: _topo_sun_moon(t, lat, lon_east, elev)[0]
    # global quick reject using geocentric latitude
    lon, la, dist = moon_ecliptic(jde_from_jd(jd_new))
    if abs(la) > 1.7: return None
    tg = _min_sep(f, jd_new, half=0.3)
    sep, ss, sm, alt = _topo_sun_moon(tg, lat, lon_east, elev)
    if sep >= ss + sm: return None
    mag = (ss + sm - sep) / (2 * ss)
    g = lambda t: _topo_sun_moon(t, lat, lon_east, elev)[0] - (_topo_sun_moon(t, lat, lon_east, elev)[1] + _topo_sun_moon(t, lat, lon_east, elev)[2])
    c1, c4 = _cross_down_up(g, 0.0, tg, 0.15)
    alt1 = _topo_sun_moon(c1, lat, lon_east, elev)[3]; alt4 = _topo_sun_moon(c4, lat, lon_east, elev)[3]
    visible = (alt > -0.8333) or (alt4 > -0.8333) or (alt1 > -0.8333)
    r = ss / sm if sm else 1
    return dict(visible=visible, magnitude=mag, greatest=tg, C1=c1, C4=c4, sun_alt_at_max=alt,
                central=(sep < abs(sm - ss)), total=(sep < sm - ss), annular=(sep < ss - sm))

def sutak_window(first_contact_jd, last_contact_jd, kind):
    """Sutak: solar 12 h before first contact; lunar 9 h before; ends at last contact."""
    h = 12.0 if kind == "solar" else 9.0
    return first_contact_jd - h / 24.0, last_contact_jd

def lunar_eclipse_visible(e, place):
    """Visibility at `place`: Moon above the horizon (altitude > -0.5667-ish rise threshold) at any contact/greatest. -> (visible_any, visible_greatest)"""
    from pk_astro import moon_altitude_rel
    times = [e[k] for k in ("P1", "U1", "U2", "greatest", "U3", "U4", "P4") if k in e]
    up = [moon_altitude_rel(t, place.lat, place.lon) > 0 for t in times]
    return any(up), moon_altitude_rel(e["greatest"], place.lat, place.lon) > 0
```

### 18.5 `pk_rules.py` (509 lines)
```python
"""
pk_rules.py -- muhurat windows, yogas/flags, kumuhurta, vrat/festival rule engine, panoti/gochar, kundali, dashas, guna-milan.
Depends on pk_astro, pk_cal, pk_tables.  Every function is deterministic and total (returns None/[] instead of raising for 'no event').
"""
import math
from datetime import date, timedelta
from pk_astro import *
from pk_cal import *
import pk_tables as T

# =================================================================== daily windows
def _slots(t0, t1, n):
    s = (t1 - t0) / n
    return [(t0 + s * i, t0 + s * (i + 1)) for i in range(n)]

def chaughadiya(rise, sset, next_rise, weekday):
    """JD inputs. weekday 0=Sun. -> {'day':[(name,a,b,good)*8], 'night':[...]}  (book p.front, verified 112 cells)."""
    s_day = (3 * weekday) % 7
    out = {}
    for key, (a, b, s0, inc) in {"day": (rise, sset, s_day, 1), "night": (sset, next_rise, s_day + 5, 5)}.items():
        out[key] = [(T.CHOG_CYCLE[(s0 + inc * i) % 7], x, y, T.CHOG_CYCLE[(s0 + inc * i) % 7] in T.CHOG_GOOD)
                    for i, (x, y) in enumerate(_slots(a, b, 8))]
    return out

def horas(rise, sset, next_rise, weekday):
    first = T.HORA_ORDER.index(T.WEEKDAY_LORD[weekday])
    res = []
    for n, (x, y) in enumerate(_slots(rise, sset, 12) + _slots(sset, next_rise, 12)):
        lord = T.HORA_ORDER[(first + n) % 7]
        res.append((lord, x, y, lord in T.HORA_GOOD))
    return res

def eighth_windows(rise, sset, weekday, fixed_6_to_18=False):
    a, b = (0.25, 0.75) if fixed_6_to_18 else (rise, sset)
    step = (b - a) / 8
    w = lambda p: (a + step * (p - 1), a + step * p)
    return {"rahukaal": w(T.RAHU_PART[weekday]), "yamaganda": w(T.YAMA_PART[weekday]), "gulika": w(T.GULIKA_PART[weekday])}

def day_windows(rise, sset, next_rise, prev_set=None):
    day, night = sset - rise, next_rise - sset
    muh = day / 15.0
    return dict(
        brahma_muhurta=(rise - 2 * 0.0333333333, rise - 0.0333333333),           # 96 min .. 48 min before sunrise (muhurta = 48 min)
        abhijit=(rise + 7 * muh, rise + 8 * muh),
        madhyahna=(rise + 0.4 * day, rise + 0.6 * day), aparahna=(rise + 0.6 * day, rise + 0.8 * day),
        godhuli=(sset - 12 / 1440.0, sset + 12 / 1440.0),
        sandhya_evening=(sset, sset + night / 10.0), sandhya_morning=(next_rise - night / 10.0, next_rise),
        pradosh=(sset, sset + 2.4 / 24.0), nishita=(sset + night / 2 - 24 / 1440.0, sset + night / 2 + 24 / 1440.0),
        madhyaratri=sset + night / 2, dinman_hours=day * 24, ratriman_hours=night * 24)

# =================================================================== flags for a day record
def vishti_windows(rec):
    return [(a, b) for n, a, b in rec["karana_segments"] if n not in T.KARANA_FIXED and (n - 2) % 7 == 6]

def bhadra_loka(moon_rashi_idx):
    if moon_rashi_idx in (3, 4, 10, 11): return "earth"      # Kark Simh Kumbh Meen
    if moon_rashi_idx in (0, 1, 2, 7): return "heaven"
    return "nether"

def ravi_yoga(sun_nak_idx, moon_nak_idx):
    return ((moon_nak_idx - sun_nak_idx) % 27) + 1 in T.RAVI_YOGA_COUNTS

def agni_chakra(tithi_1_30, weekday):
    n = (tithi_1_30 + (weekday + 1) + 1) % 4
    return {0: "earth", 3: "earth", 1: "sky", 2: "patala"}[n]

def ahuti_chakra(sun_nak_idx, day_nak_idx):
    cnt = ((day_nak_idx - sun_nak_idx) % 27) + 1
    g = T.AHUTI_ORDER[((cnt - 1) // 3) % 9]
    return g, g in T.AHUTI_GOOD

def weekday_flags(weekday, tithi_in_paksha, nak_idx):
    """Named weekday/nakshatra/tithi combinations from book pp.33,39 (+ standard Sarvartha-siddhi, Tripushkar, Jvalamukhi)."""
    f = []
    if tithi_in_paksha == T.KANKACH_TITHI[weekday]: f.append("Kankach")
    if tithi_in_paksha == T.DAGDHA_TITHI[weekday]: f.append("Dagdha")
    for name, tab in (("Vajramusal", T.VAJRAMUSAL_NAK), ("Yamghant", T.YAMGHANT_NAK), ("Utpat", T.UTPAT_NAK),
                      ("Mrityu", T.MRITYU_NAK), ("Kaal", T.KAAL_NAK), ("Rakshas", T.RAKSHAS_NAK)):
        if tab[weekday] == nak_idx: f.append(name)
    if T.AMRITSIDDHI_NAK[weekday] == nak_idx: f.append("AmritSiddhi")
    if T.SIDDHI_NAK[weekday] == nak_idx: f.append("Siddhi")
    if nak_idx in T.SARVARTHA_SIDDHI[weekday]: f.append("SarvarthaSiddhi")
    if T.JVALAMUKHI.get(tithi_in_paksha) == nak_idx: f.append("Jvalamukhi")
    if tithi_in_paksha in T.TRIPUSHKAR_TITHI and weekday in T.TRIPUSHKAR_WEEKDAY and nak_idx in T.TRIPUSHKAR_NAK: f.append("Tripushkar")
    return f

def tara_bal(janma_nak, day_nak):
    c = ((day_nak - janma_nak) % 27) + 1
    r = c % 9
    names = {1: "Janma", 2: "Sampat", 3: "Vipat", 4: "Kshema", 5: "Pratyari", 6: "Sadhaka", 7: "Vadha", 8: "Maitra", 0: "Param-maitra"}
    return names[r], r not in (3, 5, 7)

def chandra_bal(janma_rashi, moon_rashi):
    h = ((moon_rashi - janma_rashi) % 12) + 1
    return h, h in (1, 3, 6, 7, 10, 11)

def abhijit_nakshatra_active(sid_moon_lon):
    return T.ABHIJIT_START <= sid_moon_lon < T.ABHIJIT_END

def gandanta(sid_lon, orb_deg=0.8):
    for b in (0.0, 120.0, 240.0):
        if abs(wrap180(sid_lon - b)) <= orb_deg: return True
    return False

# =================================================================== long periods
def _moon_sign_windows(jd_a, jd_b, start_deg, end_deg):
    """windows during which sidereal Moon is in [start_deg, end_deg) (end 360 == 0)."""
    out = []
    t = jd_a
    while t < jd_b:
        s = solve_crossing(ang_nak, start_deg % 360.0, t, jd_b + 40)
        if s is None or s > jd_b + 40: break
        e = solve_crossing(ang_nak, end_deg % 360.0, s, s + 12)
        out.append((s, e)); t = e + 0.01
    return [w for w in out if w[0] < jd_b and w[1] > jd_a]

def panchak_windows(jd_a, jd_b):      # Moon in Kumbh+Meen (sidereal 300..360)
    return _moon_sign_windows(jd_a, jd_b, 300.0, 360.0)

def vinchhudo_windows(jd_a, jd_b):    # Moon in Vrushchik (210..240)
    return _moon_sign_windows(jd_a, jd_b, 210.0, 240.0)

def panchak_kind(start_jd, tz=5.5):
    wd = (jd_to_datetime(start_jd, IST).date().weekday() + 1) % 7
    return {0: "Rog", 1: "Raj", 2: "Agni", 5: "Chor", 6: "Mrityu"}.get(wd, "none(Wed/Thu)")

def dhanarka(jd_a, jd_b):    return _sun_sign_windows(jd_a, jd_b, 8)
def meenarka(jd_a, jd_b):    return _sun_sign_windows(jd_a, jd_b, 11)
def _sun_sign_windows(jd_a, jd_b, rashi):
    out = []
    t = jd_a - 35
    while t < jd_b:
        s = solve_crossing(ang_sunrashi, rashi * 30.0, t, t + 370.0, scan=0.5)
        if s is None: break
        e = solve_crossing(ang_sunrashi, ((rashi + 1) * 30.0) % 360.0, s, s + 33)
        if e > jd_a and s < jd_b: out.append((s, e))
        t = e + 1
    return out

def combustion_windows(planet, jd_a, jd_b, step=0.25):
    """Asta windows from elongation < orb (retro orb smaller for Mercury/Venus). Tier-2 planets."""
    out, cur = [], None
    t = jd_a
    while t <= jd_b:
        jde = jde_from_jd(t)
        el = abs(wrap180(sidereal_planet(planet, jde) - sidereal_sun(jde)))
        retro = planet_speed(planet, jde) < 0
        orb = T.COMBUST_ORB.get(planet + "_retro", T.COMBUST_ORB[planet]) if retro else T.COMBUST_ORB[planet]
        if el < orb and cur is None: cur = t
        if el >= orb and cur is not None: out.append((cur, t)); cur = None
        t += step
    if cur is not None: out.append((cur, jd_b))
    return out

# =================================================================== tithi -> civil day resolution (festival engine)
def _dt(jd, place): return jd_to_datetime(jd, IST if place.tz == 5.5 else timezone(timedelta(hours=place.tz)))

def civil_dates_around(jd_a, jd_b, place):
    d0 = _dt(jd_a, place).date() - timedelta(days=1)
    d1 = _dt(jd_b, place).date() + timedelta(days=1)
    d = d0
    while d <= d1:
        yield d
        d += timedelta(days=1)

def tithi_interval(tithi_1_30, lun):
    """(start_jd, end_jd) of tithi n inside a lunation (always exists exactly once)."""
    D0 = (tithi_1_30 - 1) * 12.0
    a = solve_crossing(ang_tithi, D0 % 360.0, lun["start"] - 0.5, lun["end"] + 0.5, scan=0.25) if tithi_1_30 != 1 else lun["start"]
    b = solve_crossing(ang_tithi, (D0 + 12.0) % 360.0, a, a + 2.0) if tithi_1_30 != 30 else lun["end"]
    return a, b

def day_for_window(seg, window_fn, place):
    """Civil date on which the tithi interval `seg` overlaps window_fn(date)->(a,b) the most (ties -> earlier)."""
    best, bd = 0.0, None
    for d in civil_dates_around(seg[0], seg[1], place):
        w = window_fn(d)
        if w is None: continue
        ov = min(seg[1], w[1]) - max(seg[0], w[0])
        if ov > best + 1e-9: best, bd = ov, d
    return bd

def _sr_ss(d, place):
    r, s = sunrise_sunset(d, place); r2, _ = sunrise_sunset(d + timedelta(days=1), place)
    return r, s, r2

def day_for_rule(seg, rule, place):
    """rule in udaya|madhyahna|aparahna|pradosh|nishitha|sandhya|moonrise|any"""
    if rule == "udaya":                                   # tithi present at sunrise; if none -> day it begins; vriddhi -> first
        for d in civil_dates_around(seg[0], seg[1], place):
            r, _, _ = _sr_ss(d, place)
            if seg[0] <= r < seg[1]: return d
        d = _dt(seg[0], place).date()
        return d
    def win(d):
        r, s, r2 = _sr_ss(d, place)
        if r is None or s is None: return None
        w = day_windows(r, s, r2)
        return {"madhyahna": w["madhyahna"], "aparahna": w["aparahna"], "pradosh": w["pradosh"], "nishitha": w["nishita"],
                "sandhya": w["sandhya_evening"], "any": (r, r2)}.get(rule)
    if rule == "moonrise":
        for d in civil_dates_around(seg[0], seg[1], place):
            for t, k in moonrise_moonset_jd(d.year, d.month, d.day, place.lat, place.lon, place.tz):
                if k == "rise" and seg[0] <= t < seg[1]: return d
        # FALLBACK (tithi present at no moonrise): date with the largest overlap of [sunrise, moonrise-of-that-day]
        def wmr(d):
            r, s, r2 = _sr_ss(d, place)
            mr = [t for t, k in moonrise_moonset_jd(d.year, d.month, d.day, place.lat, place.lon, place.tz) if k == "rise"]
            return None if r is None else (r, mr[0] if mr else s + 1.0 / 24)
        return day_for_window(seg, wmr, place)
    return day_for_window(seg, win, place)

def lunation_by_month(month_index, jd_hint, place, nija=True):
    """The (non-adhik) lunation named month_index (0=Kartak) whose start is nearest after jd_hint-200 ... use jd_hint = Gregorian mid-year of Kartak."""
    for info in lunations_between(jd_hint, jd_hint + 400):
        if info["month_index"] == month_index and (not info["adhik"] if nija else info["adhik"]):
            return info
    return None

def festival_date(month_index, tithi_1_30, rule, jd_hint, place):
    lun = lunation_by_month(month_index, jd_hint, place)
    if lun is None: return None
    seg = tithi_interval(tithi_1_30, lun)
    return day_for_rule(seg, rule, place), seg

# (name, month_index Kartikadi, tithi 1..30, rule)  -- rules per book p.29 + traditional practice
FESTIVALS = [
 ("Nutan Varsh (Kartak Sud 1)", 0, 1, "udaya"), ("Bhai Bij", 0, 2, "aparahna"), ("Labh Pancham", 0, 5, "udaya"),
 ("Dev Diwali / Kartik Poonam", 0, 15, "pradosh"), ("Datta Jayanti", 1, 15, "pradosh"),
 ("Vasant Panchami", 3, 5, "udaya"), ("Maha Shivratri", 3, 29, "nishitha"), ("Holika Dahan", 4, 15, "pradosh"),
 ("Gudi Padwa / Chaitra Sud 1", 5, 1, "udaya"), ("Ram Navami", 5, 9, "madhyahna"), ("Hanuman Jayanti", 5, 15, "udaya"),
 ("Akshaya Tritiya", 6, 3, "udaya"), ("Buddha Purnima", 6, 15, "pradosh"), ("Rath Yatra", 8, 2, "udaya"),
 ("Guru Purnima", 8, 15, "udaya"), ("Raksha Bandhan", 9, 15, "udaya"), ("Janmashtami", 9, 23, "udaya"),
 ("Ganesh Chaturthi", 10, 4, "madhyahna"), ("Navratri begins", 11, 1, "udaya"), ("Dussehra", 11, 10, "aparahna"),
 ("Sharad Purnima", 11, 15, "pradosh"), ("Dhanteras", 11, 28, "pradosh"), ("Kali Chaudas", 11, 29, "nishitha"),
 ("Diwali (Amavasya)", 11, 30, "pradosh")]

# ---- Ekadashi: Smarta + Vaishnava
def ekadashi_list(jd_a, jd_b, place):
    """[(tithi 11|26, smarta_date, vaishnava_date, start_jd, end_jd)].
       Smarta  = first civil date whose SUNRISE tithi is the ekadashi; if none (kshaya) the date on which it begins.
       Vaishnava = LAST civil date on which the ekadashi is present at ARUNODAYA (sunrise - 96 min); falls back to Smarta."""
    out = []
    for n, a, b in limb_segments("tithi", jd_a, jd_b):
        if n not in (11, 26): continue
        sm = day_for_rule((a, b), "udaya", place)
        va = None
        for d in civil_dates_around(a, b, place):
            r, _, _ = _sr_ss(d, place)
            if r is not None and a <= r - 96 / 1440.0 < b: va = d
        out.append((n, sm, va or sm, a, b))
    return out

def vrat_purnima(jd_a, jd_b, place):
    """Purnima vrat date = civil date on which tithi 15 is present at moonrise (fallback: at sunset+30 min)."""
    out = []
    for n, a, b in limb_segments("tithi", jd_a, jd_b):
        if n != 15: continue
        d = day_for_rule((a, b), "moonrise", place) or day_for_rule((a, b), "pradosh", place)
        out.append((d, a, b))
    return out

def day_for_sunset(seg, place):
    """first civil date on which the tithi interval contains the SUNSET instant; None if it contains no sunset."""
    for d in civil_dates_around(seg[0], seg[1], place):
        _, s = sunrise_sunset(d, place)
        if s is not None and seg[0] <= s < seg[1]: return d
    return None

def pradosh_vrat(jd_a, jd_b, place):
    """Trayodashi (13 | 28) present at SUNSET (book rule); if it contains no sunset, the date with the largest overlap with Pradosh Kaal."""
    out = []
    for n, a, b in limb_segments("tithi", jd_a, jd_b):
        if n in (13, 28):
            d = day_for_sunset((a, b), place) or day_for_rule((a, b), "pradosh", place)
            if d: out.append(((d.weekday() + 1) % 7, d, a, b))
    return out

def sankashti(jd_a, jd_b, place):
    out = []
    for n, a, b in limb_segments("tithi", jd_a, jd_b):
        if n == 19:
            d = day_for_rule((a, b), "moonrise", place)
            if d:
                rise = [t for t, k in moonrise_moonset_jd(d.year, d.month, d.day, place.lat, place.lon, place.tz) if k == "rise"]
                out.append((d, rise[0] if rise else None))
    return out

def amavasya_days(jd_a, jd_b, place):
    """book rule: Amavasya overlaps any part of the Hindu day [sunrise, next sunrise). -> [(weekday-of-that-day, date)]"""
    out = []
    for n, a, b in limb_segments("tithi", jd_a, jd_b):
        if n != 30: continue
        for d in civil_dates_around(a, b, place):
            r, _, r2 = _sr_ss(d, place)
            if r is not None and min(b, r2) - max(a, r) > 1e-9:
                out.append(((d.weekday() + 1) % 7, d))
    return out

def nakshatra_weekday_windows(nak_idx, weekday, jd_a, jd_b, place):
    """Windows (inside the Hindu day, sunrise->sunrise) where the Moon is in nak_idx on `weekday` -- Gurupushya, Ravipushya, Shani-Rohini, Bhom-Ashwini."""
    out = []
    for n, a, b in limb_segments("nakshatra", jd_a, jd_b):
        if n - 1 != nak_idx: continue
        for d in civil_dates_around(a, b, place):
            if (d.weekday() + 1) % 7 != weekday: continue
            r, _, r2 = _sr_ss(d, place)
            lo, hi = max(a, r), min(b, r2)
            if hi - lo > 1e-9: out.append((d, lo, hi))
    return out

# =================================================================== gochar / panoti
def gochar_house(transit_rashi, natal_moon_rashi):
    return (transit_rashi - natal_moon_rashi) % 12 + 1

GOCHAR_GOOD = {"Jupiter": {2, 5, 7, 9, 11}, "Saturn": {3, 6, 11}, "Rahu": {3, 6, 11}}
VEDHA = {"Jupiter": {2: 12, 5: 4, 7: 3, 9: 10, 11: 8}, "Saturn": {3: 12, 6: 9, 11: 5}}

def panoti_phase(saturn_rashi, natal_moon_rashi):
    h = gochar_house(saturn_rashi, natal_moon_rashi)
    return {12: "Mothi-1 (head)", 1: "Mothi-2 (chest)", 2: "Mothi-3 (feet)", 4: "Nani (Kantak 4th)", 8: "Nani (Ashtam 8th)"}.get(h)

def pava(moon_rashi_at_saturn_ingress, natal_moon_rashi):
    c = gochar_house(moon_rashi_at_saturn_ingress, natal_moon_rashi)
    for metal, s in (("Gold", {1, 6, 11}), ("Silver", {2, 5, 9}), ("Copper", {3, 7, 10}), ("Iron", {4, 8, 12})):
        if c in s: return metal, c

def pava_with_confidence(saturn_ingress_jd, natal_moon_rashi, tier2=True):
    """Pava from the Moon sign at Saturn's ingress. With Tier-2 planets (+-12 h) the answer is flagged 'uncertain' if the Moon changes sign within +-12 h."""
    m = lambda t: int(sidereal_moon(jde_from_jd(t)) // 30)
    base = pava(m(saturn_ingress_jd), natal_moon_rashi)
    unc = tier2 and (m(saturn_ingress_jd - 0.5) != m(saturn_ingress_jd + 0.5))
    return base, ("uncertain-use-Tier1-ephemeris" if unc else "ok")

def aavak_javak_result(aavak, javak):
    return T.AAVAK_RESULT[(aavak + javak - 1) % 8]

# =================================================================== kundali
GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]

def navamsha_sign(lon):
    lon %= 360.0
    r = int(lon // 30); k = int((lon % 30) // (30.0 / 9))
    start = r + {0: 0, 1: 8, 2: 4}[r % 3]
    return (start + k) % 12

def nak_pada(lon):
    lon %= 360.0
    n = int(lon // NAK_SPAN)
    return n, int((lon % NAK_SPAN) // (NAK_SPAN / 4)) + 1

def chart(jd_ut, lat, lon_east, include_outer=True):
    jde = jde_from_jd(jd_ut)
    pos = {g: sidereal_planet(g, jde) for g in GRAHAS}
    if include_outer:
        for g in ("Uranus", "Neptune", "Pluto"): pos[g] = sidereal_planet(g, jde)
    asc = ascendant_sidereal(jd_ut, lat, lon_east)
    asc_r = int(asc // 30)
    ch = dict(jd=jd_ut, asc=asc, asc_rashi=asc_r, mc=midheaven_sidereal(jd_ut, lon_east), planets={})
    for g, l in pos.items():
        r = int(l // 30)
        ch["planets"][g] = dict(lon=l, rashi=r, deg=l - 30 * r, house=(r - asc_r) % 12 + 1, nak=nak_pada(l)[0], pada=nak_pada(l)[1],
                                navamsha=navamsha_sign(l), vargottama=(navamsha_sign(l) == r),
                                retro=(g not in ("Sun", "Moon", "Rahu", "Ketu") and planet_speed(g, jde) < 0) or g in ("Rahu", "Ketu"))
    return ch

def dignity(planet, lon):
    r = int(lon // 30)
    if planet in T.EXALT and T.EXALT[planet][0] == r: return "exalted"
    if planet in T.DEBIL and T.DEBIL[planet][0] == r: return "debilitated"
    if r in T.OWN.get(planet, []): return "own"
    return None

def avastha(lon):
    r = int(lon // 30); d = lon % 30
    idx = int(d // 6)
    names = ["Balya", "Kumara", "Yuva", "Vriddha", "Mrita"]
    return names[idx] if r % 2 == 0 else names[4 - idx]          # odd signs (Mesh=0 index even) forward; even signs reversed

def friendship(a, b):
    """natural relation of a toward b."""
    if b in T.NATURAL_FRIENDS.get(a, ()): return "friend"
    if b in T.NATURAL_ENEMIES.get(a, ()): return "enemy"
    return "neutral"

def panchadha(a, b, house_of_b_from_a):
    nat = friendship(a, b)
    temp = "friend" if house_of_b_from_a in (2, 3, 4, 10, 11, 12) else "enemy"
    table = {("friend", "friend"): "adhi-mitra", ("friend", "enemy"): "neutral", ("neutral", "friend"): "friend",
             ("neutral", "enemy"): "enemy", ("enemy", "friend"): "neutral", ("enemy", "enemy"): "adhi-shatru"}
    return table[(nat, temp)]

def aspects(planet, house):
    """houses fully aspected by `planet` standing in `house` (1..12)."""
    ks = (7,) + T.SPECIAL_ASPECTS.get(planet, ())
    return [((house - 1 + k - 1) % 12) + 1 for k in ks]

def yogas(ch):
    P = ch["planets"]; out = []
    h = lambda g: P[g]["house"]
    r = lambda g: P[g]["rashi"]
    if (h("Jupiter") - h("Moon")) % 12 in (0, 3, 6, 9): out.append("Gajakesari")
    if r("Sun") == r("Mercury"): out.append("Budha-Aditya")
    if r("Moon") == r("Mars"): out.append("Chandra-Mangala")
    for g, name in (("Mars", "Ruchaka"), ("Mercury", "Bhadra"), ("Jupiter", "Hamsa"), ("Venus", "Malavya"), ("Saturn", "Shasha")):
        if dignity(g, P[g]["lon"]) in ("own", "exalted") and h(g) in (1, 4, 7, 10): out.append("Mahapurusha-" + name)
    others = [g for g in ("Mars", "Mercury", "Jupiter", "Venus", "Saturn")]
    if not any(((r(g) - r("Moon")) % 12) in (0, 1, 11) for g in others): out.append("Kemadruma")
    if any(((r(g) - r("Moon")) % 12) == 1 for g in others): out.append("Sunapha")
    if any(((r(g) - r("Moon")) % 12) == 11 for g in others): out.append("Anapha")
    ra, ke = P["Rahu"]["lon"], P["Ketu"]["lon"]
    arc = lambda x: (x - ra) % 360.0
    sev = [P[g]["lon"] for g in ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")]
    if all(arc(x) < 180 for x in sev) or all(arc(x) > 180 for x in sev): out.append("Kaal-sarpa")
    if h("Mars") in (1, 4, 7, 8, 12): out.append("Mangal-dosha(from Lagna)")
    return out

def vimshottari(moon_sid_lon, birth_jd, levels=2, year_days=365.2425):
    """Mahadasha list with antardasha (levels>=2) and pratyantar (levels>=3). Balance by elapsed fraction of the nakshatra."""
    n = int((moon_sid_lon % 360) // NAK_SPAN)
    frac = ((moon_sid_lon % 360) % NAK_SPAN) / NAK_SPAN
    first = T.VIM_LORDS[n % 9]
    order = [T.VIM_LORDS[(n % 9 + i) % 9] for i in range(9)]
    def sub(lord, start, dur, lvl):
        res, t = [], start
        for j in range(9):
            sl = T.VIM_LORDS[(T.VIM_LORDS.index(lord) + j) % 9]
            d = dur * T.VIM_YEARS[sl] / 120.0
            e = dict(lord=sl, start=t, end=t + d)
            if lvl > 1: e["sub"] = sub(sl, t, d, lvl - 1)
            res.append(e); t += d
        return res
    out, t = [], birth_jd
    for i, lord in enumerate(order):
        full = T.VIM_YEARS[lord] * year_days
        dur = full * (1 - frac) if i == 0 else full
        entry = dict(lord=lord, start=t, end=t + dur, years=dur / year_days)
        if levels >= 2:
            if i == 0:   # antardashas run from the (virtual) start of the mahadasha; keep those ending after birth
                virt = t - full * frac
                entry["antar"] = [a for a in sub(lord, virt, full, levels - 1) if a["end"] > t]
            else:
                entry["antar"] = sub(lord, t, full, levels - 1)
        out.append(entry); t += dur
    return out

ASHTOTTARI_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Saturn", "Jupiter", "Rahu", "Venus"]   # 108 y; nakshatra grouping must be keyed from book p.38

def guna_milan(bride_moon_lon, groom_moon_lon, gana_table=None):
    """Ashtakoota 36. Inputs: sidereal Moon longitudes. Returns (total, breakdown). Standard tables (tables in pk_tables, variants configurable)."""
    gt = gana_table or T.GANA_SCORE
    bn, gn = nak_pada(bride_moon_lon)[0], nak_pada(groom_moon_lon)[0]
    br, gr = int(bride_moon_lon // 30) % 12, int(groom_moon_lon // 30) % 12
    b = {}
    b["varna"] = 1 if T.VARNA_RANK[T.RASHI_VARNA[gr]] >= T.VARNA_RANK[T.RASHI_VARNA[br]] else 0
    def vclass(r, lon):
        v = T.VASHYA_OF_RASHI[r]
        if "|" in v:
            a, c = v.split("|"); return a if (lon % 30) < 15 else c
        return v
    b["vashya"] = T.VASHYA_SCORE[vclass(gr, groom_moon_lon)][vclass(br, bride_moon_lon)]
    t1 = (((gn - bn) % 27) + 1) % 9; t2 = (((bn - gn) % 27) + 1) % 9
    g1, g2 = t1 not in (3, 5, 7), t2 not in (3, 5, 7)
    b["tara"] = 3.0 if (g1 and g2) else (1.5 if (g1 or g2) else 0.0)
    b["yoni"] = T.YONI_MATRIX[T.YONI_NAMES.index(T.AVAKAHADA[bn]["yoni"])][T.YONI_NAMES.index(T.AVAKAHADA[gn]["yoni"])]
    la, lb = T.RASHI_LORD[br], T.RASHI_LORD[gr]
    if la == lb: b["graha_maitri"] = 5
    else:
        rel = sorted([friendship(la, lb), friendship(lb, la)])
        b["graha_maitri"] = {("friend", "friend"): 5, ("friend", "neutral"): 4, ("neutral", "neutral"): 3, ("enemy", "friend"): 1,
                             ("enemy", "neutral"): 0.5, ("enemy", "enemy"): 0}[tuple(rel)]
    b["gana"] = gt[T.AVAKAHADA[bn]["gana"]][T.AVAKAHADA[gn]["gana"]]
    d = (br - gr) % 12 + 1
    b["bhakoot"] = 7 if d in (1, 7, 3, 11, 4, 10) else 0
    b["nadi"] = 0 if T.AVAKAHADA[bn]["nadi"] == T.AVAKAHADA[gn]["nadi"] else 8
    return sum(b.values()), b

def name_syllable(moon_sid_lon):
    n, p = nak_pada(moon_sid_lon)
    return T.AVAKAHADA[n]["syllables"][p - 1]

# =================================================================== Chaturmas, Pitru-paksha
def chaturmas(jd_hint, place):
    """(Devshayani Ekadashi date, Prabodhini Ekadashi date) = Smarta Ekadashi of Ashadh Sud 11 and the following Kartak Sud 11.
       jd_hint: any JD between Chaitra and Ashadh of the year."""
    a = lunation_by_month(8, jd_hint, place); k = lunation_by_month(0, a["start"], place)
    ds = day_for_rule(tithi_interval(11, a), "udaya", place); pb = day_for_rule(tithi_interval(11, k), "udaya", place)
    return ds, pb

def pitru_paksha(jd_hint, place):
    """(first date, last date): Bhadarvo Vad 1 (tithi 16) -> Vad 30 (Sarva-pitri Amavasya) by udaya rule."""
    b = lunation_by_month(10, jd_hint, place)
    return day_for_rule(tithi_interval(16, b), "udaya", place), day_for_rule(tithi_interval(30, b), "udaya", place)


# =================================================================== Dashavatar jayantis & recurring monthly observances (book p.38)
_TOD_RULE = {"aparahna": "aparahna", "sandhya": "sandhya", "madhyahna": "madhyahna", "madhyaratri": "nishitha"}

def dashavatar_dates(jd_hint, place):
    """{avatar: civil date} for the Samvat that starts at/after jd_hint (a date inside Kartak)."""
    out = {}
    for name, (mi, paksha, t, tod) in T.DASHAVATAR.items():
        n = t if paksha == "S" else 15 + t
        r = festival_date(mi, n, _TOD_RULE[tod], jd_hint, place)
        out[name] = r[0] if r else None
    return out

MONTHLY_OBSERVANCES = {2: "Chandra darshan", 4: "Vinayak Chauth", 8: "Durgashtami", 11: "Ekadashi", 15: "Poonam / Mukutotsav",
                       19: "Sankat Chauth", 23: "Kalashtami", 26: "Ekadashi", 28: "Pradosh", 29: "Masik Shivratri", 30: "Darsh Shraddha (Amavasya)"}
```

### 18.6 `pk_build.py` (120 lines)
```python
"""
pk_build.py -- assemble the printed-panchang data (monthly pages pp.52-75 style) for any Samvat / place.
    rows = build_samvat(2024, RAJKOT)          # Kartak Sud 1 of Gregorian year 2024 -> day before Kartak Sud 1 of 2025
    write_json(rows, "samvat2081.json")
Pure Python; ~0.05 s per day.
"""
import json
from datetime import date, timedelta
from pk_rules import *

MINUTE_ROUNDING = "floor"      # book convention reproduced: 20:22:51 prints as 20.22

def kalmi_str(jd, day_date, place, rounding=MINUTE_ROUNDING):
    dt = jd_to_datetime(jd, timezone(timedelta(hours=place.tz)))
    base = datetime(day_date.year, day_date.month, day_date.day, tzinfo=dt.tzinfo)
    secs = (dt - base).total_seconds()
    mins = int(secs // 60) if rounding == "floor" else int(round(secs / 60.0))
    return "%d.%02d" % (mins // 60, mins % 60)

def _seg_str(segs, names, d, place, last_open=True):
    """[(name, end 'ક.મિ.')...] ; last segment end is the next sunrise -> printed as '30.00'-like value (kept numeric)."""
    out = []
    for n, a, b in segs:
        out.append((names(n), kalmi_str(b, d, place)))
    return out

def build_row(d, place=RAJKOT, events=None):
    rec = day_record(d, place)
    wd = rec["weekday"]
    r, s, r2 = rec["sunrise"], rec["sunset"], rec["next_sunrise"]
    hd = hindu_date(d, place)
    t = rec["tithi"]
    paksha, tip = tithi_label(t)
    row = dict(
        date=str(d), weekday=wd, weekday_gu=T.WEEKDAY_GU[wd], sunrise=kalmi_str(r, d, place), sunset=kalmi_str(s, d, place) if s else None,
        month=("Adhik " if hd["adhik"] else "") + hd["month_en"], month_gu=hd["month_gu"], paksha=paksha, tithi=t, tithi_in_paksha=tip,
        tithi_end=kalmi_str(rec["tithi_end"], d, place),
        tithi_segments=[(n, kalmi_str(b, d, place)) for n, a, b in rec["tithi_segments"]],
        nakshatra=[(T.NAK_EN[n - 1], kalmi_str(b, d, place)) for n, a, b in rec["nakshatra_segments"]],
        yoga=[(T.YOGA_EN[n - 1], kalmi_str(b, d, place)) for n, a, b in rec["yoga_segments"]],
        karan=[(karana_name(n), kalmi_str(b, d, place)) for n, a, b in rec["karana_segments"]],
        moon_rashi=[(T.RASHI_EN[n - 1], kalmi_str(b, d, place)) for n, a, b in rec["moonrashi_segments"]],
        sun_rashi=T.RASHI_EN[int(rec["sun_sid"] // 30)])
    flags = []
    sun_nak = int(rec["sun_sid"] // NAK_SPAN)
    for n, a, b in rec["nakshatra_segments"]:
        ni = n - 1
        if ravi_yoga(sun_nak, ni): flags.append("RaviYoga@" + T.NAK_EN[ni])
        for fl in weekday_flags(wd, tip if t != 30 else 15, ni):
            flags.append("%s@%s" % (fl, T.NAK_EN[ni]))
    for a, b in vishti_windows(rec):
        mr = limb_number("moonrashi", (a + b) / 2) - 1
        flags.append("Bhadra %s-%s (%s)" % (kalmi_str(a, d, place), kalmi_str(b, d, place), bhadra_loka(mr)))
    for n, a, b in rec["moonrashi_segments"]:
        if n - 1 in (10, 11): flags.append("Panchak(Moon %s)" % T.RASHI_EN[n - 1])
        if n - 1 == 7: flags.append("Vinchhudo")
    if rec["flag"]: flags.append(rec["flag"])
    for kind in ("tithi", "karana", "nakshatra", "yoga", "moonrashi"):          # borderline: a limb ends within 3 min of a sunrise
        for n, a_, b_ in rec[kind + "_segments"]:
            for ref in (r, r2):
                if abs(b_ - ref) * 1440.0 < 3.0 and abs(b_ - ref) > 1e-9:
                    flags.append("BORDERLINE:%s-end-within-3min-of-sunrise" % kind)
    row["flags"] = flags
    row["agni_chakra"] = agni_chakra(t, wd)
    row["ahuti"] = ahuti_chakra(sun_nak, rec["nakshatra"] - 1)
    if events:
        row["events"] = events.get(d, [])
    return row

def collect_events(jd_a, jd_b, place, month_hint_jd):
    """Dated annotations for [jd_a, jd_b]."""
    ev = {}
    def add(d, text):
        if d is not None: ev.setdefault(d, []).append(text)
    for n, sm, va, a, b in ekadashi_list(jd_a, jd_b, place):
        add(sm, "Ekadashi (Smarta)")
        if va != sm: add(va, "Ekadashi (Vaishnava)")
    for d, a, b in vrat_purnima(jd_a, jd_b, place): add(d, "Vrat-ni-Poonam")
    for wd, d, a, b in pradosh_vrat(jd_a, jd_b, place): add(d, "Pradosh (%s)" % T.WEEKDAY_EN[wd])
    for d, mr in sankashti(jd_a, jd_b, place): add(d, "Sankashti Chaturthi (moonrise %s)" % (kalmi_str(mr, d, place) if mr else "?"))
    for wd, d in amavasya_days(jd_a, jd_b, place):
        if wd in (1, 2, 3, 6): add(d, "%s Amavasya" % T.WEEKDAY_EN[wd])
    for nak, wd, nm in ((7, 4, "Guru-Pushyamrit"), (7, 0, "Ravi-Pushyamrit"), (3, 6, "Shani-Rohini AmritSiddhi"), (0, 2, "Bhom-Ashwini Siddhi")):
        for d, a, b in nakshatra_weekday_windows(nak, wd, jd_a, jd_b, place):
            add(d, "%s %s-%s" % (nm, kalmi_str(a, d, place), kalmi_str(b, d, place)))
    for rashi, jd in sankrantis(jd_a, jd_b):
        d = jd_to_datetime(jd, IST).date()
        add(d, "Sankranti: Sun -> %s at %s" % (T.RASHI_EN[rashi], jd_to_datetime(jd, IST).strftime("%H:%M")))
    for tgt, jd in ritu_ayana_events(jd_a, jd_b):
        d0, d1, _ = hindu_day_bounds(jd_to_datetime(jd, IST).date(), place)
        d = jd_to_datetime(jd, IST).date() if jd >= d0 else jd_to_datetime(jd, IST).date() - timedelta(days=1)
        add(d, "Tropical Sun %d deg at %s" % (tgt, jd_to_datetime(jd, IST).strftime("%d-%m %H:%M")))
    for name, mi, t, rule in FESTIVALS:
        for info in lunations_between(jd_a - 2, jd_b + 2):
            if info["month_index"] == mi and not info["adhik"]:
                seg = tithi_interval(t, info); dd = day_for_rule(seg, rule, place)
                if dd is not None: add(dd, name)
    for a, b in panchak_windows(jd_a, jd_b): add(jd_to_datetime(a, IST).date(), "Panchak begins %s" % jd_to_datetime(a, IST).strftime("%H:%M"))
    for a, b in vinchhudo_windows(jd_a, jd_b): add(jd_to_datetime(a, IST).date(), "Vinchhudo begins %s" % jd_to_datetime(a, IST).strftime("%H:%M"))
    return ev

def build_samvat(gregorian_year_of_kartak, place=RAJKOT):
    d0 = kartak_start(gregorian_year_of_kartak, place)
    d1 = kartak_start(gregorian_year_of_kartak + 1, place) - timedelta(days=1)
    jd_a, jd_b = local_midnight_jd(d0.year, d0.month, d0.day, place.tz), local_midnight_jd(d1.year, d1.month, d1.day, place.tz) + 1
    ev = collect_events(jd_a, jd_b, place, jd_a)
    rows, d = [], d0
    while d <= d1:
        rows.append(build_row(d, place, ev)); d += timedelta(days=1)
    return dict(place=place.name, start=str(d0), end=str(d1), days=len(rows), vikram_samvat=d0.year + 57,
                shaka=shaka_year(d0, place), samvatsara=samvatsara_name(d0.year + 57), rows=rows)

def write_json(obj, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1, default=str)

if __name__ == "__main__":
    s = build_samvat(2024)
    print(s["start"], s["end"], s["days"], s["vikram_samvat"], s["shaka"], s["samvatsara"])
    write_json(s, "samvat2081.json")
```

### 18.7 `verify_all.py` (274 lines)
```python
"""
verify_all.py -- executable cross-check suite.  `python verify_all.py` prints one line per check and a final summary.
Exit code 0 only if every check passes.  Reference values come from (a) published astronomy (Meeus, NASA), (b) the printed
Harilal Samvat-2081 panchang as transcribed in the source README.
"""
import math, random, sys, time
from datetime import date, timedelta
from pk_rules import *
from pk_eclipse import *
import pk_build

RESULTS = []
def check(name, ok, detail=""):
    RESULTS.append((name, bool(ok)))
    print(("PASS  " if ok else "FAIL  ") + name + ("  | " + detail if detail else ""))

f = lambda jd, tz=IST: jd_to_datetime(jd, tz).strftime("%d-%m-%Y %H:%M")
hm = lambda jd: jd_to_datetime(jd, IST).strftime("%H:%M")
P = RAJKOT
A, B = julian_day(2024, 11, 1), julian_day(2025, 10, 25)
t0 = time.time()

# ---------------------------------------------------------------- A. astronomy vs published
lon, lat, dist = moon_ecliptic(2448724.5)
check("A1 Moon AA2 ex.47.a lon/lat/dist", abs(lon - 133.162655) < 2e-6 and abs(lat + 3.229126) < 2e-6 and abs(dist - 368409.7) < 0.1, "%.6f %.6f %.1f" % (lon, lat, dist))
check("A2 Earth VSOP87 L (AA2 ex.25.b = 19.907372)", abs(earth_heliocentric_longitude(2448908.5) - 19.907372) < 2e-6)
check("A3 Julian Day 2000-01-01 12h / 1987-01-27 / 1957-10-04 19:26", julian_day(2000, 1, 1, 12) == 2451545.0 and julian_day(1987, 1, 27) == 2446822.5
      and abs(julian_day(1957, 10, 4, 19 + 26 / 60.0) - 2436116.31) < 1e-3)
eq = {}
for tgt, (y, m, d), exp in ((0, (2025, 3, 20), "09:01"), (90, (2025, 6, 21), "02:42"), (180, (2025, 9, 22), "18:19"), (270, (2024, 12, 21), "09:21"), (0, (2024, 3, 20), "03:06")):
    t = solve_crossing(lambda j: sun_longitude_apparent(jde_from_jd(j)), tgt, julian_day(y, m, d) - 2, julian_day(y, m, d) + 3, scan=1 / 48.0)
    got = jd_to_datetime(t, UTC).strftime("%H:%M")
    gm = int(got[:2]) * 60 + int(got[3:]); em = int(exp[:2]) * 60 + int(exp[3:])
    check("A4 equinox/solstice %d deg %d-%02d-%02d UT (NASA/USNO %s)" % (tgt, y, m, d, exp), abs(gm - em) <= 1, got)
a2000 = lahiri_ayanamsa(2451545.0)
check("A5 Lahiri ayanamsa J2000 = 23d51'25.5\"", abs(a2000 - (23 + 51 / 60.0 + 25.5 / 3600.0)) < 0.2 / 3600.0, "%.6f" % a2000)
check("A6 precession rate 50.29\"/yr (ayanamsa 2050 - 2000)", abs((lahiri_ayanamsa(jde_from_jd(julian_day(2050, 1, 1))) - lahiri_ayanamsa(jde_from_jd(julian_day(2000, 1, 1)))) * 3600 / 50 - 50.29) < 0.05)
for nm_, exp_mag, tol in (("2025-03-14", 1.1804, 0.004), ("2025-09-07", 1.3622, 0.004)):
    y, m, d = map(int, nm_.split("-"))
    fm = full_moons(julian_day(y, m, d) - 2, julian_day(y, m, d) + 2)[0]; e = lunar_eclipse(fm)
    check("A7 lunar eclipse %s umbral magnitude (NASA %.4f)" % (nm_, exp_mag), e and abs(e["umbral_mag"] - exp_mag) < tol, "%.4f total=%s" % (e["umbral_mag"], e["type"]))
r = solar_eclipse_local(new_moons(julian_day(2024, 4, 1), julian_day(2024, 4, 15))[0], 32.7767, -96.797)
check("A8 solar eclipse Dallas 2024-04-08 total, max 18:42 UT", r["total"] and abs(r["greatest"] - julian_day(2024, 4, 8, 18 + 42 / 60.0)) < 3 / 1440.0)
for nm in new_moons(julian_day(2025, 3, 20), julian_day(2025, 10, 1)):
    if abs(nm - julian_day(2025, 3, 29, 10.95)) < 1 or abs(nm - julian_day(2025, 9, 21, 19.9)) < 1:
        check("A9 solar eclipse %s NOT visible at Rajkot (book: no sutak)" % f(nm), solar_eclipse_local(nm, P.lat, P.lon) is None)
_le = {}
for fm in full_moons(julian_day(2024, 11, 1), julian_day(2025, 10, 25)):
    e = lunar_eclipse(fm)
    if e: _le[jd_to_datetime(fm, IST).strftime("%Y-%m-%d")] = e
check("A10 exactly two lunar eclipses in Samvat 2081 (14-03-2025 total, 07-09-2025 total)", sorted(_le) == ["2025-03-14", "2025-09-07"])
check("A11 14-03-2025 lunar eclipse NOT visible at Rajkot (Moon below horizon, daytime) => no sutak; 07-09-2025 visible => sutak",
      lunar_eclipse_visible(_le["2025-03-14"], P) == (False, False) and lunar_eclipse_visible(_le["2025-09-07"], P) == (True, True))
_exp = {"P1": (20, 57), "U1": (21, 57), "U2": (23, 0), "greatest": (23, 41), "U3": (24, 23), "U4": (25, 26), "P4": (26, 25)}   # NASA, IST minutes-of-day (>24h = next day)
def _mins(k):
    dt = jd_to_datetime(_le["2025-09-07"][k], IST); base = jd_to_datetime(_le["2025-09-07"]["P1"], IST).replace(hour=0, minute=0, second=0, microsecond=0)
    return (dt - base).total_seconds() / 60.0
check("A12 lunar eclipse 07-09-2025 contacts within 1.2 min of NASA (P1 20:57 U1 21:57 U2 23:00 max 23:41 U3 00:23 U4 01:26 P4 02:25 IST)",
      all(abs(_mins(k) - (h * 60 + m)) <= 1.2 for k, (h, m) in _exp.items()), str({k: round(_mins(k) - (h * 60 + m), 2) for k, (h, m) in _exp.items()}))

# ---------------------------------------------------------------- B. reference row 2 Nov 2024 (Rajkot)
rec = day_record(date(2024, 11, 2), P)
check("B1 sunrise 06:51 / sunset 18:08 Rajkot 2-Nov-2024", hm(rec["sunrise"]) == "06:51" and hm(rec["sunset"]) == "18:08", hm(rec["sunrise"]) + " " + hm(rec["sunset"]))
check("B2 tithi 1 (Sud) ends 20:22 (book 20.22)", rec["tithi"] == 1 and hm(rec["tithi_end"]) == "20:22")
check("B3 nakshatra Vishakha(16) ends 3-Nov 05:58", rec["nakshatra"] == 16 and f(rec["nakshatra_segments"][0][2]) == "03-11-2024 05:58")
check("B4 yoga Ayushman(3) ends 11:17; karan Kimstughna ends 07:22; Moon enters Vrushchik 23:23",
      rec["yoga"] == 3 and hm(rec["yoga_segments"][0][2]) == "11:17" and hm(rec["karana_segments"][0][2]) == "07:22" and hm(rec["moonrashi_segments"][0][2]) == "23:23")
check("B5 weekday Saturday", rec["weekday"] == 6)

# ---------------------------------------------------------------- C. calendar
BOOK_M = "2024-11-02/2024-12-01 2024-12-02/2024-12-30 2024-12-31/2025-01-29 2025-01-30/2025-02-27 2025-02-28/2025-03-29 2025-03-30/2025-04-27 2025-04-28/2025-05-27 2025-05-28/2025-06-25 2025-06-26/2025-07-24 2025-07-25/2025-08-23 2025-08-24/2025-09-21 2025-09-22/2025-10-21".split()
L = lunations_between(julian_day(2024, 11, 2), julian_day(2025, 10, 22))[:12]
dd = [lunation_dates(i, P) for i in L]
check("C1 twelve lunation date-ranges equal book p.24 table", ["%s/%s" % (a, b) for a, b, n in dd] == BOOK_M)
check("C2 month names Kartak..Aaso, none adhik/kshaya", [i["month_en"] for i in L] == T.MONTH_EN and not any(i["adhik"] or i["kshaya"] for i in L))
check("C3 Samvat 2081 length 354 days", sum(n for a, b, n in dd) == 354)
check("C4 VS/Shaka/Vir/samvatsara", vikram_samvat(date(2024, 11, 2), P) == 2081 and vikram_samvat(date(2025, 10, 22), P) == 2082 and shaka_year(date(2025, 3, 30), P) == 1947
      and shaka_year(date(2024, 11, 2), P) == 1946 and vir_samvat(2081) == 2551 and samvatsara_name(2081) == "Nala(Anala)")
ad = [i for i in lunations_between(julian_day(2026, 3, 1), julian_day(2026, 8, 1)) if i["adhik"]]
a_, b_, n_ = lunation_dates(ad[0], P)
check("C5 Adhik Jeth 2026: 17-05-2026 .. 15-06-2026", str(a_) == "2026-05-17" and str(b_) == "2026-06-15", "%s..%s" % (a_, b_))
nmk = new_moon_near(julian_day(2024, 11, 1, 12.0))
check("C6 year-entry new moon 01-11-2024 18:17 IST", f(nmk) == "01-11-2024 18:17")
sk = {T.RASHI_EN[r]: jd for r, jd in sankrantis(A, B)}
check("C7 Makar sankranti 14-01-2025 08:55-08:56 (book 08:56) ; punya-kaal to sunset 18:23", hm(sk["Makar"]) in ("08:55", "08:56") and hm(sunrise_sunset(date(2025, 1, 14), P)[1]) == "18:23", hm(sk["Makar"]))
check("C8 12 sankrantis, dates 16-11,15-12,14-01,12-02,14-03,14-04,15-05,15-06,16-07,17-08,17-09,17-10",
      [jd_to_datetime(j, IST).strftime("%d-%m") for r, j in sankrantis(A, B)] == "16-11 15-12 14-01 12-02 14-03 14-04 15-05 15-06 16-07 17-08 17-09 17-10".split())
rn = {T.NAK_EN[n]: jd for n, jd in sun_nakshatra_entries(julian_day(2025, 6, 1), julian_day(2025, 10, 30))}
check("C9 Ardra pravesh 22-06-2025 ~06:19 ; Punarvasu 06-07 05:48 (Hindu date 05-07)", f(rn["Ardra"]) == "22-06-2025 06:19" and f(rn["Punarvasu"]) == "06-07-2025 05:48")
ra = {t: jd for t, jd in ritu_ayana_events(julian_day(2024, 11, 1), julian_day(2025, 10, 25))}
check("C10 ayana/ritu dates (21-12, 18/19-02, 20-03, 20-04, 21-06, 23-08, 22-09, 23-10)",
      [jd_to_datetime(ra[k], IST).strftime("%d-%m") for k in (270, 330, 0, 30, 90, 150, 180, 210)] == "21-12 18-02 20-03 20-04 21-06 23-08 22-09 23-10".split())
check("C11 Easter 2025-04-20 ; Good Friday 18-04", easter(2025) == date(2025, 4, 20))
check("C12 Hijri tabular 1 Muharram 1447 = 27-06-2025 (book ~27-06)", hijri_tabular(date(2025, 6, 27)) == (1447, 1, 1))
check("C13 Parsi Pateti/Navroz 15-08-2025 = 1 Farvardin 1395", parsi_date(date(2025, 8, 15))[:2] == (1395, "Farvardin"))
check("C14 Gregorian leap rule", gregorian_leap(2000) and not gregorian_leap(1900) and gregorian_leap(2024) and not gregorian_leap(2025))

# ---------------------------------------------------------------- D. muhurat tables
ok = True
for wd in range(7):
    c = chaughadiya(0.0, 0.5, 1.0, wd)
    ok &= [x[0] for x in c["day"]][0] == ["Udveg", "Amrit", "Rog", "Labh", "Shubh", "Chal", "Kaal"][wd]
    ok &= len(c["day"]) == 8 and len(c["night"]) == 8
mon = chaughadiya(0.0, 0.5, 1.0, 1); sun = chaughadiya(0.0, 0.5, 1.0, 0)
check("D1 chaughadiya day/night Monday & Sunday-night rows equal printed table",
      ok and [x[0] for x in mon["day"]] == ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Chal", "Labh", "Amrit"]
      and [x[0] for x in mon["night"]] == ["Chal", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Chal"]
      and [x[0] for x in sun["night"]] == ["Shubh", "Amrit", "Chal", "Rog", "Kaal", "Labh", "Udveg", "Shubh"])
EXP_RAHU = {0: (16.5, 18), 1: (7.5, 9), 2: (15, 16.5), 3: (12, 13.5), 4: (13.5, 15), 5: (10.5, 12), 6: (9, 10.5)}
EXP_YAMA = {0: (12, 13.5), 1: (10.5, 12), 2: (9, 10.5), 3: (7.5, 9), 4: (6, 7.5), 5: (15, 16.5), 6: (13.5, 15)}
EXP_GUL = {0: (15, 16.5), 1: (13.5, 15), 2: (12, 13.5), 3: (10.5, 12), 4: (9, 10.5), 5: (7.5, 9), 6: (6, 7.5)}
ok = True
for wd in range(7):
    w = eighth_windows(0, 0, wd, True)
    for k, E in (("rahukaal", EXP_RAHU), ("yamaganda", EXP_YAMA), ("gulika", EXP_GUL)):
        ok &= abs(w[k][0] * 24 - E[wd][0]) < 1e-9 and abs(w[k][1] * 24 - E[wd][1]) < 1e-9
check("D2 Rahukaal/Yamaganda/Gulika 21 windows equal printed table (06-18 base)", ok)
h = horas(0.0, 0.5, 1.0, 0)
check("D3 hora: Sunday day order Sun,Ven,Mer,Moon,Sat,Jup,Mars,Sun... ; hora 13 = Jupiter", [x[0] for x in h[:8]] == ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars", "Sun"] and h[12][0] == "Jupiter")
check("D4 karana table: 60 half-tithis, names (Sud1 first half Kimstughna, Vad14 2nd half Shakuni, Vad30 Chatushpada/Naga)",
      karana_name(1) == "Kimstughna" and karana_name(58) == "Shakuni" and karana_name(59) == "Chatushpada" and karana_name(60) == "Naga" and karana_name(2) == "Bava" and karana_name(57) == "Vishti")
check("D5 abhijit nakshatra span = 253'20\" = 4d13'20\"", abs((T.ABHIJIT_END - T.ABHIJIT_START) * 60 - 253.3333333) < 1e-6)

# ---------------------------------------------------------------- E. vrats / yogas
ek = ekadashi_list(A, B, P)
BOOK_EK = "2024-11-12 2024-11-26 2024-12-11 2024-12-26 2025-01-10 2025-01-25 2025-02-08 2025-02-24 2025-03-10 2025-03-25 2025-04-08 2025-04-24 2025-05-08 2025-05-23 2025-06-06 2025-06-21 2025-07-06 2025-07-21 2025-08-05 2025-08-19 2025-09-03 2025-09-17 2025-10-03 2025-10-17".split()
check("E1 24 Ekadashi (Smarta) dates equal book p.26", [str(e[1]) for e in ek] == BOOK_EK)
check("E2 Vaishnava differs only on 07-06 and 22-06 (as printed)", [(str(e[1]), str(e[2])) for e in ek if e[1] != e[2]] == [("2025-06-06", "2025-06-07"), ("2025-06-21", "2025-06-22")])
pu = vrat_purnima(A, B, P)
check("E3 12 Purnima vrat days; Purnima end times 16-11 02:58 .. 07-10 09:17 (engine values of source)", len(pu) == 12 and f(pu[0][2]) == "16-11-2024 02:58" and f(pu[-1][2]) == "07-10-2025 09:17")
pr = pradosh_vrat(A, B, P)
want = {6: "2024-12-28 2025-01-11 2025-05-24 2025-10-04 2025-10-18", 1: "2025-01-27 2025-02-10 2025-06-23", 2: "2025-02-25 2025-03-11 2025-07-08 2025-07-22", 0: "2025-06-08"}
check("E4 all printed Pradosh dates (Shani/Som/Bhom/Bhanu) present", all(all(x in [str(d) for w, d, a, b in pr if w == wd] for x in ds.split()) for wd, ds in want.items()), "%d pradosh in year" % len(pr))
am = amavasya_days(A, B, P)
exp_am = {1: "2024-12-30 2025-05-26 2025-10-20", 2: "2025-01-28 2025-05-27 2025-06-24 2025-10-21", 3: "2025-01-29 2025-06-25 2025-07-23", 6: "2024-11-30 2025-03-29 2025-04-26 2025-08-23 2025-09-20"}
check("E5 Somvati/Mangalvari/Budhvari/Shanivari Amavasya lists equal book p.25", all([str(d) for w, d in am if w == wd] == ds.split() for wd, ds in exp_am.items()))
gp = nakshatra_weekday_windows(7, 4, A, B, P); rp = nakshatra_weekday_windows(7, 0, A, B, P)
check("E6 Gurupushya 21-11-2024 07:03-15:35, 24-07-2025, 21-08-2025", [str(x[0]) for x in gp] == ["2024-11-21", "2025-07-24", "2025-08-21"] and hm(gp[0][1]) == "07:03" and hm(gp[0][2]) == "15:35")
check("E7 Ravipushya 09-03 23:55 / 06-04 06:34 / 04-05 06:12-12:53", [str(x[0]) for x in rp] == ["2025-03-09", "2025-04-06", "2025-05-04"] and hm(rp[0][1]) == "23:55" and hm(rp[1][1]) == "06:34" and hm(rp[2][1]) == "06:12" and hm(rp[2][2]) == "12:53")
pk = panchak_windows(A, A + 30)[0]; vn = vinchhudo_windows(A, A + 10)[0]
check("E8 first Panchak 09-11-2024 23:27 -> 14-11 03:11 ; first Vinchhudo 02-11 23:23 -> 05-11 09:45",
      f(pk[0]) == "09-11-2024 23:27" and f(pk[1]) == "14-11-2024 03:11" and f(vn[0]) == "02-11-2024 23:23" and f(vn[1]) == "05-11-2024 09:45")
dh = dhanarka(A, B)[0]; mn = meenarka(A, B)[0]
check("E9 Dhanarka ends 14-01-2025 (08:55) ; Meenarka 14-03 18:50 -> 14-04 03:21", f(dh[1]) == "14-01-2025 08:55" and f(mn[0]) == "14-03-2025 18:50")
fag = [i for i in lunations_between(A, B) if i["month_en"] == "Fagan"][0]
check("E10 Holashtak 06-03-2025 10:51 -> Purnima end 14-03 12:24", f(tithi_interval(8, fag)[0]) == "06-03-2025 10:51" and f(tithi_interval(15, fag)[1]) == "14-03-2025 12:24")
BK = {"Nutan Varsh (Kartak Sud 1)": "2024-11-02", "Bhai Bij": "2024-11-03", "Labh Pancham": "2024-11-06", "Dev Diwali / Kartik Poonam": "2024-11-15", "Datta Jayanti": "2024-12-14", "Vasant Panchami": "2025-02-02", "Maha Shivratri": "2025-02-26",
      "Holika Dahan": "2025-03-13", "Gudi Padwa / Chaitra Sud 1": "2025-03-30", "Ram Navami": "2025-04-06", "Hanuman Jayanti": "2025-04-12", "Akshaya Tritiya": "2025-04-30", "Buddha Purnima": "2025-05-12", "Rath Yatra": "2025-06-27",
      "Guru Purnima": "2025-07-10", "Raksha Bandhan": "2025-08-09", "Janmashtami": "2025-08-16", "Ganesh Chaturthi": "2025-08-27", "Navratri begins": "2025-09-22", "Dussehra": "2025-10-02", "Sharad Purnima": "2025-10-06",
      "Dhanteras": "2025-10-18", "Kali Chaudas": "2025-10-19", "Diwali (Amavasya)": "2025-10-20"}
bad = []
for name, mi, t, rule in FESTIVALS:
    d, seg = festival_date(mi, t, rule, julian_day(2024, 11, 2), P)
    if str(d) != BK[name]: bad.append((name, str(d), BK[name]))
check("E11 24 festival dates (rule engine) equal book p.29", not bad, str(bad))
sk_ = sankashti(A, B, P)
check("E12 12 Sankashti Chaturthi; Kartak Vad 4 = 18-11-2024", len(sk_) == 12 and str(sk_[0][0]) == "2024-11-18")
check("E13 Ravi-yoga rule (Moon 4th from Sun nakshatra)", ravi_yoga(0, 3) and not ravi_yoga(0, 4))
ju = combustion_windows("Jupiter", julian_day(2025, 5, 1), julian_day(2025, 8, 1))
check("E14 Guru asta window ~ book 11-06 .. ~09-07 (engine +-3 d)", len(ju) == 1 and abs(ju[0][0] - julian_day(2025, 6, 11)) < 3 and abs(ju[0][1] - julian_day(2025, 7, 9)) < 3, "%s .. %s" % (f(ju[0][0]), f(ju[0][1])))

# ---------------------------------------------------------------- F. planets / gochar
def ing(p, deg, a, b): return solve_crossing(lambda j: sidereal_planet(p, jde_from_jd(j)), deg, julian_day(*a), julian_day(*b), scan=0.5)
check("F1 Saturn -> Meen 29-03-2025 ; Jupiter -> Mithun 14/15-05-2025 ; Jupiter -> Kark 18-10-2025 (Tier-2: +-1 day)",
      f(ing("Saturn", 330, (2025, 3, 20), (2025, 4, 10)))[:10] == "29-03-2025" and f(ing("Jupiter", 60, (2025, 5, 1), (2025, 5, 30)))[:5] in ("14-05", "15-05") and f(ing("Jupiter", 90, (2025, 10, 1), (2025, 10, 30)))[:10] == "18-10-2025")
rk = solve_crossing(lambda j: (-sidereal_rahu(jde_from_jd(j))) % 360, (-330.0) % 360, julian_day(2025, 5, 1), julian_day(2025, 6, 1), scan=0.5)
check("F2 mean Rahu -> Kumbh 18-05-2025 (19:33)", f(rk) == "18-05-2025 19:33")
def stations(p, a, b):
    out, prev, t = [], None, julian_day(*a)
    while t < julian_day(*b):
        s = planet_speed(p, jde_from_jd(t))
        if prev is not None and (s < 0) != (prev < 0): out.append((f(t)[:10], "R" if s < 0 else "D"))
        prev, t = s, t + 0.25
    return out
check("F3 Saturn retro 13-07-2025, direct 28-11-2025 ; Jupiter direct 04-02-2025", stations("Saturn", (2025, 6, 1), (2025, 12, 31)) == [("13-07-2025", "R"), ("28-11-2025", "D")] and stations("Jupiter", (2024, 12, 1), (2025, 3, 1)) == [("04-02-2025", "D")])
ch = chart(nmk, DELHI.lat, DELHI.lon)
pp = ch["planets"]
check("F4 year-entry chart houses: Sun/Moon 7th (Tula), Mars 4th (Kark), Mer/Ven 8th (Vrushchik), Jup 2nd (retro), Sat 11th, Rahu 12th, Ketu 6th",
      (pp["Sun"]["house"], pp["Moon"]["house"], pp["Mars"]["house"], pp["Mercury"]["house"], pp["Venus"]["house"], pp["Jupiter"]["house"], pp["Saturn"]["house"], pp["Rahu"]["house"], pp["Ketu"]["house"]) == (7, 7, 4, 8, 8, 2, 11, 12, 6)
      and pp["Jupiter"]["retro"] and ch["asc_rashi"] == 0)
check("F5 Moon at year entry: Tula 15d23', Swati pada 3", int(pp["Moon"]["deg"]) == 15 and int((pp["Moon"]["deg"] % 1) * 60) == 23 and T.NAK_EN[pp["Moon"]["nak"]] == "Swati" and pp["Moon"]["pada"] == 3)
vd = vimshottari(pp["Moon"]["lon"], nmk)
check("F6 Vimshottari balance Rahu 6.2y, then Jupiter/Saturn/Mercury (book 6.22y; ends 2031/2047/2066/2083)", abs(vd[0]["years"] - 6.22) < 0.03 and [x["lord"] for x in vd[:4]] == ["Rahu", "Jupiter", "Saturn", "Mercury"] and f(vd[3]["end"])[6:10] == "2083")
check("F7 gochar table cell: Mesh natal, Saturn Meen = 12th; Jupiter Mithun = 3rd; Meen natal Saturn Kumbh = 12th", gochar_house(11, 0) == 12 and gochar_house(2, 0) == 3 and gochar_house(10, 11) == 12)
check("F8 pava rule (Moon sign from natal): 1,6,11 gold ; 2,5,9 silver ; 3,7,10 copper ; 4,8,12 iron", pava(0, 0)[0] == "Gold" and pava(1, 0)[0] == "Silver" and pava(2, 0)[0] == "Copper" and pava(3, 0)[0] == "Iron")
check("F9 navamsha: 0->Mesh, 33->Makar, 61->Tula ; nakshatra-pada navamsha = (4(n-1)+k-1) mod 12", navamsha_sign(0) == 0 and navamsha_sign(33) == 9 and navamsha_sign(61) == 6
      and all(navamsha_sign(NAK_SPAN * n + (NAK_SPAN / 4) * k + 0.01) == (4 * n + k) % 12 for n in range(27) for k in range(4)))
check("F10 aavak-javak rule example Mesh Kartak-Fagan (8,14) -> 5 Lokapavad", aavak_javak_result(8, 14) == "Lokapavad")

# ---------------------------------------------------------------- G. invariants & robustness (the 'never fail' part)
random.seed(7)
fails = []; n_ok = 0
places = [RAJKOT, DELHI, Place("London", 51.5074, -0.1278, 0.0), Place("Sydney", -33.8688, 151.2093, 10.0), Place("NewYork", 40.7128, -74.006, -5.0),
          Place("Mumbai", 19.076, 72.8777, 5.5)]
for i in range(240):
    pl = places[i % len(places)]
    d = date(1950, 1, 1) + timedelta(days=random.randint(0, 365 * 150))
    try:
        rec = day_record(d, pl)
        segs = rec["tithi_segments"]
        assert segs[0][1] <= rec["sunrise"] + 2e-5 and abs(segs[-1][2] - rec["next_sunrise"]) < 1e-6
        for kind in ("tithi", "karana", "nakshatra", "yoga", "moonrashi"):
            ss = rec[kind + "_segments"]
            assert all(ss[k][2] <= ss[k + 1][1] + 1e-6 for k in range(len(ss) - 1))          # ordered, no overlap
            assert all(b > a for n, a, b in ss)
        # elongation at tithi end is a multiple of 12 (to 1e-5 deg) unless clipped by next sunrise
        e = rec["tithi_segments"][0][2]
        if e < rec["next_sunrise"] - 1e-6:
            assert abs(wrap180(ang_tithi(e) - 12 * round(ang_tithi(e) / 12))) < 1e-4
        assert 1 <= rec["tithi"] <= 30 and 1 <= rec["nakshatra"] <= 27 and 1 <= rec["yoga"] <= 27 and 1 <= rec["karana"] <= 60
        n_ok += 1
    except Exception as ex:
        fails.append((str(d), pl.name, repr(ex)))
check("G1 240 random days 1950-2100 x 6 places: segments ordered/contiguous, boundaries exact, no exception", not fails, "%d ok %s" % (n_ok, fails[:3]))
pol = Place("Tromso", 69.6492, 18.9553, 1.0)
try:
    rr = day_record(date(2025, 6, 21), pol); pol_ok = rr["flag"] == "no_sunrise_fallback_06:00"
except Exception as ex:
    pol_ok = False
check("G2 polar day (Tromso 21-Jun) does not raise; falls back to 06:00 and flags it", pol_ok)
L2 = lunations_between(julian_day(1900, 1, 1), julian_day(2100, 1, 1))
lens = [i["end"] - i["start"] for i in L2]
check("G3 2400 lunations 1900-2100: length 29.27..29.84 d", min(lens) > 29.2 and max(lens) < 29.9, "%.3f..%.3f n=%d" % (min(lens), max(lens), len(L2)))
ad = [i for i in L2 if i["adhik"]]; ks = [i for i in L2 if i["kshaya"]]
check("G4 adhik months 1900-2100 plausible (7 per 19 yr => ~73)", 68 <= len(ad) <= 78, "adhik=%d kshaya=%d %s" % (len(ad), len(ks), [jd_to_datetime(i['start'], IST).strftime('%Y-%m') for i in ks]))
ok = True
for y in (1950, 2000, 2024, 2025, 2026, 2050):
    n = (kartak_start(y + 1, P) - kartak_start(y, P)).days
    ok &= n in (354, 355, 383, 384, 385)
check("G5 Samvat lengths in {354,355,383,384,385}", ok)
# independent Sun cross-check: VSOP vs low-accuracy Meeus ch.25 formula within 0.01 deg over 100 random epochs
mx = 0
for _ in range(100):
    jde = julian_day(1950, 1, 1) + random.random() * 365 * 150
    T_ = (jde - J2000) / 36525.0
    L0 = 280.46646 + 36000.76983 * T_ + 0.0003032 * T_ * T_; M = (357.52911 + 35999.05029 * T_ - 0.0001537 * T_ * T_) * D2R
    C = (1.914602 - 0.004817 * T_ - 0.000014 * T_ * T_) * math.sin(M) + (0.019993 - 0.000101 * T_) * math.sin(2 * M) + 0.000289 * math.sin(3 * M)
    mx = max(mx, abs(wrap180(sun_true_longitude_geometric(jde) - (L0 + C))))
check("G6 VSOP87 Sun vs low-accuracy Sun agree < 0.012 deg (independent algorithms)", mx < 0.012, "max %.5f" % mx)
# sunrise self-consistency: altitude at computed sunrise equals h0
mxe = 0
for i in range(60):
    pl = places[i % len(places)]; d = date(2000, 1, 1) + timedelta(days=random.randint(0, 9000))
    r, s = sunrise_sunset(d, pl)
    if r and s:
        mxe = max(mxe, abs(sun_altitude(r, pl.lat, pl.lon) - H0_SUN_UPPER_LIMB), abs(sun_altitude(s, pl.lat, pl.lon) - H0_SUN_UPPER_LIMB))
check("G7 solar altitude at computed sunrise/sunset equals -0.8333 deg to 1e-6", mxe < 1e-6, "%.2e" % mxe)
import pk_astro
_t0 = sankrantis(julian_day(2025, 1, 10), julian_day(2025, 1, 20))[0][1]
pk_astro.AYANAMSA_OFFSET_ARCSEC = 14.0
_t1 = sankrantis(julian_day(2025, 1, 10), julian_day(2025, 1, 20))[0][1]
pk_astro.AYANAMSA_OFFSET_ARCSEC = 0.0
check("G8 ayanamsa offset: +14 arcsec delays Makar sankranti by 5.4-5.8 min (Sun 2.46 arcsec/min)", 5.4 < (_t1 - _t0) * 1440 < 5.8, "%.2f min" % ((_t1 - _t0) * 1440))
_ds, _pb = chaturmas(julian_day(2025, 4, 15), P); _pp = pitru_paksha(julian_day(2025, 4, 15), P)
check("G12 Devshayani Ekadashi 06-07-2025 ; Pitru-paksha 08-09 .. 21-09-2025", str(_ds) == "2025-07-06" and (str(_pp[0]), str(_pp[1])) == ("2025-09-08", "2025-09-21"))
check("G9 tables: 27 nakshatra/yoga/avakahada, nadi zig-zag == printed column, yoni matrix symmetric, gana 9/9/9",
      len(T.AVAKAHADA) == 27 and all(T.nadi3(i) == T.AVAKAHADA[i]["nadi"] for i in range(27)) and all(T.YONI_MATRIX[i][j] == T.YONI_MATRIX[j][i] for i in range(14) for j in range(14)))
tot, b = guna_milan(0.5, 0.5)
check("G10 guna-milan same Moon position scores 28 (nadi dosha 0) ; max possible 36", tot == 28.0 and sum([1, 2, 3, 4, 5, 6, 7, 8]) == 36)
row = pk_build.build_row(date(2024, 11, 2), P)
check("G11 printed-row builder reproduces ક.મિ. strings 20.22 / 29.58 / 11.17 / 7.22 / 23.23", row["tithi_end"] == "20.22" and row["nakshatra"][0][1] == "29.58" and row["yoga"][0][1] == "11.17" and row["karan"][0][1] == "7.22" and row["moon_rashi"][0][1] == "23.23")

import pk_astro as _pa
check("G13 Tier-2 validity guard: 2025 valid, 1700 and 2100 not", _pa.tier2_valid(julian_day(2025, 1, 1)) and not _pa.tier2_valid(julian_day(1700, 1, 1)) and not _pa.tier2_valid(julian_day(2100, 1, 1)))
_rowtest = pk_build.build_row(date(2024, 11, 2), P); _rowb = pk_build.build_row(date(2025, 1, 19), P)
check("G14 borderline flag: absent on reference row 02-11-2024; present on 19-01-2025 (tithi & karana end within 3 min of sunrise)",
      not any(f.startswith("BORDERLINE") for f in _rowtest["flags"]) and "BORDERLINE:tithi-end-within-3min-of-sunrise" in _rowb["flags"])
dv = dashavatar_dates(julian_day(2024, 11, 2), P)
check("H1 Dashavatar jayantis resolved for all 10 avatars inside Samvat 2081 (Matsya = Chaitra Sud 3 = 31-03-2025 (Gangaur); Krishna = Madhyaratri rule = 15-08)",
      all(d is not None and date(2024, 11, 2) <= d <= date(2025, 10, 21) for d in dv.values()) and str(dv["Matsya"]) == "2025-03-31" and str(dv["Krishna"]) == "2025-08-15" and len(dv) == 10, str({k: str(x) for k, x in dv.items()}))

n_fail = sum(1 for _, ok in RESULTS if not ok)
print("\n%d checks, %d passed, %d failed, %.0f s" % (len(RESULTS), len(RESULTS) - n_fail, n_fail, time.time() - t0))
sys.exit(1 if n_fail else 0)
```

---
## 19. Quick answer sheet for implementers
1. Compute `Sun`, `Moon`, `Lahiri` (§4) → everything else is a root of one of four angles: elongation, Sun, Moon, Sun+Moon.
2. Sunrise by altitude root-finding on the civil day; Hindu day = sunrise→sunrise.
3. Limb at sunrise = `floor(angle/unit)`; end = `solve_crossing`.
4. Month = Sun's sidereal rashi at the starting new moon; adhik ⇔ same rashi at both ends.
5. Vrat/festival date = one of {udaya, madhyahna, aparahna, pradosh, sunset, nishitha, moonrise, arunodaya} applied to the tithi interval (§11).
6. Every printed table that is not a formula of 1-5 is data (§0.3, §15.2) — key it, don't derive it.
7. Run `verify_all.py`. 81/81 or do not ship.
