---
name: ontopic-viz-conventions
description: >-
  House rules for building and editing visualization components in the
  ontopic-viz-components repo (a shadcn-style copy-in registry on Recharts,
  Observable Plot, and MapLibre+PMTiles). Use this skill WHENEVER you create,
  edit, review, or refactor any chart, map, dashboard, or article component in
  this repo; whenever you touch registry/theme/* (tokens, semantic, themes,
  scales, adapters, provider); whenever you are about to write a color, font,
  size, or stroke value; whenever you add a component to the registry; or
  whenever the work involves choropleths, PMTiles, semantic/party colors, dark
  mode, or cross-engine consistency. Use it even when the request doesn't name
  the theme system explicitly — almost every component change in this repo is
  governed by these rules, and skipping them causes color drift and Tufte
  violations that the contract tests will reject.
---

# Ontopic Viz Conventions

This repo is a **copy-in component registry** (shadcn-style): a `viz add` CLI copies chart
components from `registry/` into a consumer app. Components run on three engines — **Recharts**
(declarative React/SVG), **Observable Plot** (imperative options object), and **MapLibre GL JS +
PMTiles** (GPU paint expressions). A four-layer theme system makes all three agree.

Your job whenever you work here: make the change **flow through the theme system**, never around
it. The rules below are load-bearing. Full rationale and worked code live in `design/00`–`05`;
read the specific doc named in each section when you need depth.

---

## The one rule everything else serves

**Never write a color, font, size, or stroke literal in a component.** Ask the resolver.

A hardcoded `stroke="#000000"` or `fontSize: 12` is a seam the theme can't reach — it's the
exact bug this system exists to kill. Every themeable value comes from `useVizTheme()`.

```tsx
// ✗ WRONG — invisible to themes, breaks cross-engine consistency
<Line stroke="#000000" strokeWidth={1.5} />
<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

// ✓ RIGHT — resolved from the active theme
const { rc, colorFor } = useVizTheme();
<Line stroke={colorFor(colorDomain, 'value', 0)} strokeWidth={rc.stroke} />
<CartesianGrid {...rc.grid} />
```

Before finishing any component, grep your diff for `#0`, `#f`, `fontSize:`, `text-gray-`,
`stroke="#`. Any hit that isn't reading from the theme is a defect.

---

## The four layers (each consumes only the one below)

```
tokens.ts     raw named values — palette, sizes, fonts. NO meaning.   (design/01)
   ↓
semantic.ts   meaning → token: party, sentiment, categorical, ramps.  (design/01)
   ↓          + colorFor() / colorScale() resolvers
scales.ts     continuous (number→color) resolver + engine compilers.  (design/05)
   ↓
themes.ts     editorial / newsprint / carbon: neutrals + type +       (design/02)
   ↓          stroke/grid behavior + OPTIONAL semantic overrides
adapters/     recharts.ts · plot.ts · maplibre.ts — engine chrome.     (design/03, 05)
   ↓          generate-css.ts → CSS vars (build artifact, NOT source)
```

Hard constraints:

- **`tokens.ts` carries no meaning.** `blue600` is a blue, not "Democrat."
- **`semantic.ts` is pure data + functions.** No Recharts, Plot, or MapLibre import in it, ever.
- **`themes.ts` is data-only.** No React, no engine code. The provider selects a theme.
- **TS objects are the canonical source.** CSS variables are a *generated* artifact
  (`pnpm theme:css`). Charts read the provider; only shadcn/`article/*` read CSS vars + `.dark`.
- Adapters turn a `Theme` into engine-specific *chrome* (grid, axis, tooltip, type). They do
  **not** resolve semantic color — that's the resolvers' job.

---

## Color: meaningful where meaning exists, consistent where it doesn't

Use `useVizTheme()`, which returns `{ theme, colorFor, colorScale, scaleFor, rc, plotBase, ml }`
already bound to the active theme.

- **Categorical / fixed** (party, sentiment, yes/no): `colorFor(domain, category, index)`.
  Democrat → blue in every theme and engine. Unknown category → stable categorical cycle.
- **Continuous** (choropleth values, ramps): `scaleFor(spec)` → resolved anchor stops, then an
  engine compiler (`toMaplibreFill` / gradient stops). See `design/05`.
- **`colorDomain` is an explicit prop. Never infer it from the data.** Sniffing column names to
  guess "this looks like party data" is how drift starts.

```tsx
// ✓ explicit, stable
interface Props { /* … */ colorDomain?: 'party' | 'sentiment' | null }
// colorDomain={null} + index 0 → categorical[0] → ink → the Tufte default, for free
```

- Keep `Independent` / `Other` in the party map so three-party charts resolve fully.
- A diverging value (e.g. Dem−Rep margin) is a `scaleFor({ kind:'diverging', … })`, not a
  categorical hack. Decide and **document** the `reverse` orientation so red/blue are stable.

---

## Tufte principles (the aesthetic is non-negotiable)

1. **Ink first, color second.** Default series color is near-black on white. A single-series
   chart is monochrome. High data-ink ratio.
2. **Color carries meaning.** If color appears, it distinguishes something the reader must
   tell apart. Decorative color is a smell.
3. **Quiet chrome.** Faint, usually dashed, horizontal gridlines; vertical lines removed; thin
   strokes; muted axis labels; no chart junk; no heavy borders.
4. **Restraint scales.** Reach for greys + one accent before a full categorical ramp. Use the
   categorical cycle only when categories genuinely lack a semantic mapping.

You have latitude on exact hues and per-theme serif/sans choices. You do **not** have latitude to
make the default loud, colorful, or grid-heavy. (`design/00`.)

---

## Engine differences — same source, three mechanics

All three pull color from `theme.semantic`; the *delivery* differs. Match the existing pattern
for the engine you're in:

- **Recharts** — resolve per element, imperatively: `stroke={colorFor(domain, g, i)}`. Spread
  chrome from `rc` (`rc.grid`, `rc.axisTick`, `rc.tooltip`, `rc.titleStyle`). (`design/03`, `04`.)
- **Observable Plot** — hand the engine a scale: `color: colorScale(domain, cats)`. Build options
  with `mergePlot(plotBase(), { … })` — **`marks` concatenate, never overwrite**. (`design/03`.)
- **MapLibre + PMTiles** — color is a GPU **paint expression**; data joins to tiles at runtime
  via **`feature-state`** (`promoteId` = the join key), never a baked `match`. Changing the data
  prop updates feature-state — **do not rebuild the layer**. Register the pmtiles protocol once.
  Client-only: import via `next/dynamic { ssr:false }`. Web Mercator only — do **not** migrate the
  Plot/TopoJSON geo components to it; MapLibre is for high-cardinality, zoomable maps. (`design/05`.)

If you find yourself writing a color literal because "this engine is different," stop — the
resolver output is the same; only where you spread it changes.

---

## Naming & placement

```
registry/components/<engine>/<bucket>/<name>-v<N>.tsx
  engine  = recharts | plot | maplibre | composite | article
  bucket  = generic | geo | <dataset: gss | brfss | ess>
```

Examples: `recharts/generic/timeseries-economic-v1.tsx`,
`plot/geo/state-map-v1.tsx`, `maplibre/geo/choropleth-v1.tsx`.

- `generic` = reusable across datasets; dataset buckets only for dataset-specific logic.
- Theme code lives in `registry/theme/`; shadcn primitives in `registry/ui/`; shared helpers in
  `registry/utils/`; types in `registry/types/`.
- `article/*` components are framework-agnostic MDX building blocks; keep them CSS-var driven so
  they react to `.dark`.

---

## New / edited component checklist

- [ ] No themeable literal anywhere (grep `#0 #f fontSize: text-gray- stroke="#`).
- [ ] Color via `colorFor` / `colorScale` / `scaleFor`; chrome via `rc` / `plotBase` / `ml`.
- [ ] `colorDomain` (or scale `kind`) is an explicit prop, defaulting to `null`/sequential —
      never inferred from data.
- [ ] Renders correctly with **no provider** (defaults to `editorial`).
- [ ] Looks right in all three themes — single-series is ink in `editorial`, warm charcoal in
      `newsprint`, light in `carbon`.
- [ ] Data handling (parsing, CI math, formatters) left untouched when only re-theming.
- [ ] MapLibre work: feature-state join, no layer rebuild on data change, `dynamic ssr:false`,
      never color-encoding alone, legend always visible, aria summary on the container.
- [ ] Contract test still passes; if you added a semantic domain or engine path, extend it.

---

## Verify (drift insurance)

- **Contract test** (`registry/theme/__tests__/`): every theme resolves every semantic domain in
  every engine path; an unknown category falls back to `categorical[0]` and never throws; the
  MapLibre fill's anchor colors equal the theme ramp. Run it; if you changed the theme surface,
  update it. (`design/04`, `05`.)
- **Side-by-side demo page** (`app/_theme-demo/`): the same dataset through each engine, looped
  over all three themes. Eyeball that Democrat is the same blue across engines within a theme and
  that the basemap matches the theme. Add a panel here for any new component.

---

## When unsure, read the canonical doc

This skill is the summary; these are the source of truth:

- `design/00-OVERVIEW.md` — architecture + aesthetic intent
- `design/01-TOKENS-AND-SEMANTIC.md` — tokens, the resolver, the fallback
- `design/02-THEMES.md` — the three themes + override merge
- `design/03-ADAPTERS.md` — provider + Recharts/Plot adapters
- `design/04-RETROFIT-AND-VERIFY.md` — reference migration, contract test, demo page
- `design/05-MAP-ENGINE.md` — MapLibre+PMTiles, continuous scales, the join contract
