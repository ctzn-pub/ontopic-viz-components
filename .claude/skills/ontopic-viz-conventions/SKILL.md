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
  mode, or cross-engine consistency. ALSO use this skill whenever you add a new
  component (or edit an existing one's catalog/sample data) because every
  component must ship a `.catalog.json` sidecar — without it the auto-publish
  workflow refuses to publish your work to the public gallery
  (https://ctzn-pub.vercel.app/viz/<id>) and the registry's contract test
  fails the build. Use it even when the request doesn't name the theme system
  explicitly — almost every component change in this repo is governed by
  these rules, and skipping them causes color drift and Tufte violations that
  the contract tests will reject.
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

## Catalog sidecar (required for every component)

Every component file ships with a `.catalog.json` sidecar at the same path. The
sidecar is what the downstream gallery site (`ctzn-pub`) reads to publish your
work — without it, your component lands on disk but never appears in the
public gallery. **No exceptions: missing sidecar = the auto-publish workflow
skips your component, and the contract test in `registry/__tests__/` fails
the build.**

```
registry/components/recharts/gss/timeseries-line-v1.tsx
registry/components/recharts/gss/timeseries-line-v1.catalog.json
```

The sidecar tells the gallery:
- **What to call it** (name, description, tags) — editorial framing the
  gallery can't infer from a `.tsx` file
- **What data to render the preview with** (a fetchable URL + a transform
  function name) — without this, the detail page says "Live preview not
  yet wired"
- **How to group it** (`foldInto` an existing card, or stand alone) — without
  this, every new component spawns a new card and near-duplicates pile up

### Schema

```json
{
  "id": "gss-time-trend",
  "name": "GSS Time Trend",
  "category": "time-series",
  "subcategory": "gss",
  "tags": ["gss", "survey", "time-series", "trend"],
  "description": "The canonical survey-data time-series line chart. Used throughout The Great Sorting. Supports demographic splits, a 95% CI toggle, presidential-term reference areas, identity-coded colors.",
  "sample_data": {
    "url": "https://ontopic-public-data.t3.storage.dev/sample-data/abortion-by-party.json",
    "transform": "passthrough"
  },
  "dependencies": ["recharts", "lucide-react"],

  "foldInto": null,
  "variantLabel": null
}
```

Required fields: `id`, `name`, `category`, `tags`, `description`, `sample_data`.
Optional fields: `subcategory`, `dependencies`, `foldInto`, `variantLabel`.

### Field rules

**`id`** — URL slug. Lowercase, hyphen-separated. The gallery URL will be
exactly `https://ctzn-pub.vercel.app/viz/<id>`. So `id: "gss-time-trend"`
publishes at `https://ctzn-pub.vercel.app/viz/gss-time-trend`. Pick a stable
id; renaming breaks bookmarks.

**`category`** — one of: `time-series`, `maps`, `distributions`,
`demographic-breakdowns`, `regression-and-effects`. The gallery's left rail
groups cards by this. Do NOT invent new categories without coordinating with
ctzn-pub — the rail's labels are hand-curated.

**`tags`** — 3–6 short strings, lowercase. Used for search and on-card chips.
Don't duplicate `category` or framework names — those are already inferred.

**`description`** — one to three sentences of editorial prose. What question
does this chart answer? When would a reader pick this over a related chart?
Don't list props or describe the implementation; the gallery shows code
separately. **No Markdown.**

**`sample_data.url`** — a publicly-readable URL the gallery can fetch at
build time to populate the preview. Two options:
- Tigris: `https://ontopic-public-data.t3.storage.dev/sample-data/<filename>`
  (preferred — uploads via the gss-charts / formalize-dataset skills)
- Any other public HTTPS URL the gallery's build server can reach

The URL must exist BEFORE you commit. The CI lint pings it; a 404 fails the
build. If you're adding a chart that needs data that doesn't exist yet,
push the data first.

**`sample_data.transform`** — name of a transform function the gallery
runs over the fetched payload before passing it to the component. Most
charts take the data as-is and should use `"passthrough"`. For charts that
need shape massaging (e.g. flattening a `dataPoints` array out of a GSS
envelope), pick from the existing transforms in
`ctzn-pub/lib/viz-preview-manifest.ts` (e.g. `"gss-envelope-flatten"`) OR
add a new one in a follow-up PR to that file and reference it here. Custom
transforms always live in the gallery, not the registry — keep transforms
out of component files.

**`foldInto`** — if your component is a new variant of an existing gallery
card, set this to that card's `id`. Otherwise leave it `null`. To see the
existing card ids, run `npx ontopic-viz catalog list` (or read
`https://ctzn-pub.vercel.app/api/catalog/ids.json` — a manifest the gallery
publishes for exactly this reason). If `foldInto` is set, also set
`variantLabel` to the short label the gallery will show in the variants list
(e.g. `"Indexed flavor"`, `"With confidence intervals"`).

**`dependencies`** — npm packages the component imports. Display-only on the
gallery's metadata sidebar; doesn't affect installation (that's CLI-driven).

### Why this lives in the registry, not in ctzn-pub

The sidecar is **the editorial signal** for a component, and the only person
who knows it at write-time is the component author. Asking the gallery
maintainer to write it after the fact is the failure mode this exists to
prevent: components land, sit unpublished for weeks, and when someone
finally writes the metadata they guess at it.

The skill enforces this. The contract test enforces it. The auto-publish
workflow refuses to publish without it. If you're tempted to skip the
sidecar "for now," stop — there is no "for now," there's "publish or don't
publish."

### Where your component will appear

When you push a component + sidecar to `ontopic-viz-components/main`:

1. The registry's GitHub Action validates the sidecar (schema + URL reachable)
2. ctzn-pub's auto-publish workflow opens a PR copying the component + writing
   the catalog/manifest entries
3. The PR auto-merges if all checks pass (no human gate for valid sidecars)
4. Vercel deploys
5. **Your component goes live at `https://ctzn-pub.vercel.app/viz/<id>`**

The registry Action's final log line echoes the URL so you don't have to
remember it — check your commit's GitHub Actions tab.

---

## New / edited component checklist

- [ ] No themeable literal anywhere (grep `#0 #f fontSize: text-gray- stroke="#`).
- [ ] Color via `colorFor` / `colorScale` / `scaleFor`; chrome via `rc` / `plotBase` / `ml`.
- [ ] `colorDomain` (or scale `kind`) is an explicit prop, defaulting to `null`/sequential —
      never inferred from data.
- [ ] Renders correctly with **no provider** (defaults to `editorial`).
- [ ] Looks right in all five themes — `editorial` / `times` / `ft` / `economist` / `bloomberg`.
- [ ] Data handling (parsing, CI math, formatters) left untouched when only re-theming.
- [ ] MapLibre work: feature-state join, no layer rebuild on data change, `dynamic ssr:false`,
      never color-encoding alone, legend always visible, aria summary on the container.
- [ ] **`.catalog.json` sidecar exists** at the component's path (see "Catalog sidecar" above).
- [ ] **Sample data URL is reachable** — `curl -fI <url>` returns 200, BEFORE you commit.
- [ ] If folding into an existing card, `foldInto` is set; otherwise it stays `null`.
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
