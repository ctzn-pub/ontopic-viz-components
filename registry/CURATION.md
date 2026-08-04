# Curation Ledger

The machine-readable source of truth is [`curation.json`](./curation.json) — every component
under `registry/components/` has an entry there, enforced by
`registry/__tests__/curation.test.ts`. This file explains the calls.

**Decided 2026-07-09** as part of the library consolidation (curated best-of scope,
one winner per chart archetype). Statuses:

| Status | Meaning | Count |
|---|---|---|
| `core` | Kept; brought to full standard (theme-aware, typed, `.catalog.json` sidecar) | 47 |
| `foundation` | Kept + maintained; not a gallery chart card, so exempt from the sidecar requirement (article/book MDX blocks) | 18 |
| `merged` | Dedupe loser; its `winner` absorbs any unique features. Physically moved to `registry/legacy/` | 17 |
| `parked` | Potentially useful, not in the curated cut; moved to `registry/legacy/` untouched | 34 |
| `retired` | No future; deleted only after the ctzn-pub mirror re-sync confirms no consumers | 0 |

## The core set

- **D3 (4)** and **MapLibre (4)** — the mature exemplars, already theme-aware + sidecar'd.
- **Plot promotions (8)** — the *Picturing American Health* set that survived the archetype
  dedupe (forest plot, marginal effect, paired bars, disparity gradient, state-year heatmap,
  bivariate choropleth, county hexbin, scatter-LOESS).
- **Plot generics (5)** — multiline, correlation heatmap, distribution, US state map,
  world choropleth: fundamental archetypes worth polishing (Phase 6).
- **Recharts (10)** — the flagship `gss/timeseries-line-v1`, the theme-aware generic line
  (`timeseries-metadata-v1`), histogram, economic (recession bands), indexed comparison,
  the 4-component demographic family (fills the `demographic-breakdowns` gallery category),
  and the sortable state bar.
- **Composites (2)** — the BRFSS dashboard and the GSS small-multiples composite.

## Dual pairs — DECIDED 2026-07-09: D3 wins all four

Ridge, PCA biplot, parallel coordinates, and slopegraph each existed twice (D3-as-JSX and
Observable Plot). Compared per the priority order (theme fidelity > typing > capability >
code health), **the D3 version won every pair**:

- **Theme fidelity** — all four D3 versions route chrome through the `d3` adapter with zero
  themeable literals; all four Plot versions skipped `plotBase()`/`mergePlot()` and hardcoded
  fonts, stroke widths, opacities, and margins.
- **Typing** — D3 props are a strict superset in every pair (no `any` on either side).
- **Capability** — D3 adds focus interactivity, keyboard/aria accessibility, live captions,
  and two-pass label collision; the Plot versions are static with no a11y. No Plot version
  had a single feature its D3 twin lacked — nothing needed porting.

Mechanics: each D3 winner **took over the canonical gallery card id** (`ridge`, `pca-biplot`,
`parallel-coordinates`, `slopegraph` — previously on the Plot sidecars, with the D3 files as
`foldInto` variants), so no gallery URL breaks. The Plot twins (+sidecars) moved to
`registry/legacy/plot/`. Sample-data URLs standardized on the canonical
`ontopic-public-data.t3.storage.dev` host (verified 200).

## Already-merged calls (losers → winners)

- The three `timetrend-demo-v1` twins (recharts/generic, recharts/gss, plot/gss) and
  `recharts/gss/abortion-opinion-v1` → **`recharts/gss/timeseries-line-v1`** (the flagship
  covers all of them with `colorDomain`).
- `recharts/generic/timeseries-basic-v1` → **`timeseries-metadata-v1`** (its theme-aware successor).
- `plot/stats/odds-ratio-basic-v1`, `odds-ratio-forest-v1` → **`forest-plot-v1`**.
- `recharts/generic/dual-axis-v1` → **`timeseries-dual-axis-v1`** (duplicate; note the winner
  itself is parked — dual axes are a discouraged form).
- `recharts/brfss/state-bar-v1`, `plot/brfss/state-bar-v1` → **`state-bar-sortable-v1`**.

## Upstreamed from ctzn-pub — 2026-07-09 (Phase 4)

Nine D3-as-JSX components existed only in ctzn-pub's `viz/components/d3/`. All nine came
upstream as `core`, retrofitted to standard (explicit `colorDomain` prop, size/stroke
literals routed through the d3 adapter, one hex killed, sidecars + fabricated Tigris
sample data): **county-choropleth** (maps), **caterpillar**, **density-curves**,
**diverging-bars**, **dumbbell**, **grouped-bar**, **scatter-cloud**,
**small-multiples-lines**, and **gradient-line** (re-homed from `timeseries/` to `stats/` —
it's a dose-response gradient, not a date series; kept as its own card because its
multi-series + dot-cloud data contract differs from `disparity-gradient`).

**Density archetype gate resolved**: `d3/stats/density-curves-v1` wins (theme-compliant
semantic colors); `plot/stats/density-basic-v1` + `density-overlay-v1` (which used
`scheme:"category10"`) → `merged`. Note the winner takes pre-binned `{x, weight}` data.

Nothing in ctzn-pub imports these yet (verified: no VizResolver/MDX references), so the
upstream + re-home carries no consumer breakage.

## Ported from health-of-americas-zip-codes — 2026-07-09 (Phase 5)

Five novel forms came over from the atlas, retheme'd from its hardcoded dark "Observatory
Ledger" onto the theme system (they now render natively in all 6 themes; under `observatory`
they look like the originals): **strip-ridge** (tail-trimmed ridgeline strip with ramp fill +
benchmark/comparison/subject markers), **score-gauge** (0–100 semicircle, glow filter dropped
per Tufte), **gradient-slopes** (all measures normalized to decile-1 = 1.0 on a log scale,
collision-relaxed labels), **correlation-matrix** (hierarchical ordering computed in-component
for raw matrices; the ContextHeatmap folded in as an optional panel), and **canvas-scatter**
(one canvas+SVG+quadtree primitive covering the atlas's ScatterFit/PcaBiplot/DotMap pattern;
Albers geo mode out of scope — that's the MapLibre engine's job).

Foundation promoted to `registry/utils/`: `useResize`/`useReducedMotion` (hooks.ts) and the
accessible `TableFallback` (`table-fallback.tsx`) — the house a11y pattern for canvas/dense
charts. The atlas's imperative d3-select `Axis` island was **not** ported: registry D3
components render axes as pure JSX per the house pattern, so nothing needs it.

Explicit non-ports: the atlas panels (DisparityGradient, ScatterLoess, RankedDotPlot,
Distribution) already have registry descendants; StorySig is decorative, not chart-library
core; MapChoropleth's feature-state pattern belongs in `maplibre/geo/choropleth-v1`.
A new sidecar category `indicators-and-matrices` covers the gauge/matrix forms — the ctzn-pub
gallery rail needs a matching label at Phase 7.

## Core polish complete — 2026-07-09 (Phase 6)

Every `core` component now meets the full standard: theme-aware (zero color/font/size
literals — the preview's theme-review queue went 40 → 0), typed (no `any`), sidecar'd with
reachable Tigris sample data. Notable calls:

- The **flagship** `recharts/gss/timeseries-line-v1` lost its hardcoded CATEGORICAL_COLORS
  (theme cycle now) and its `any` casts; `demographicGroups`/`demographic` became optional
  (derived from `dataPointMetadata`) so a data-only gallery render works. Sidecar id
  `gss-time-trend`.
- The **demographic trio** (line/bar/dot) share one contract → `demographic-line` is the
  card, bar/dot fold in as variants. `demographic-breakdown` has a different envelope and
  stays its own card.
- `plot/stats/distribution-v1` dropped a dead `@/lib/duckdb` import (module never existed
  here) and is now purely data-prop driven.
- `plot/wb/world-map-v1` was promoted to core with `world-choropleth` (it's the engine the
  choropleth wraps; folds into that card). Both geo maps runtime-fetch their TopoJSON from
  unpkg (overridable by prop).
- `plot/stats/correlation-heatmap-v1` → merged; the ported `d3/stats/correlation-matrix-v1`
  wins the correlation archetype.
- **REQUIRES_SIDECAR is now derived from this ledger's core set** (catalog-sidecar.test.ts)
  — promoting a component to core makes its sidecar mandatory in the same change.
- All merged/parked components physically moved to `registry/legacy/`; the active tree is
  exactly core + foundation. `docs/INVENTORY.md` is generated
  (`node scripts/generate-inventory.mjs`) — never hand-edit it.

## TanStack Charts — a fifth engine (Phase 8, in progress)

`registry/components/tanstack/*` renders with [TanStack Charts](https://tanstack.com/charts)
via `registry/theme/adapters/tanstack.ts`. These are **variants, not new archetypes**: each
one `foldInto`s the card its existing counterpart already owns (`variantLabel: "TanStack"`),
so the one-winner-per-archetype rule is untouched — a reader picks an engine, not a chart.

What the engine buys: a declarative mark grammar (a CI band is a real `areaY`, not a bespoke
error-bar shape) and keyboard focus + per-point a11y from the engine rather than hand-built
hit targets.

### REACT 19 REQUIRED — read before installing

`@tanstack/react-charts` peers on React ^19. **Every other engine here still supports React
18.** Both TanStack packages are declared **optional** peer dependencies, so React-18
consumers of the other four engines are unaffected — but `viz add tanstack/...` into a
React-18 app will not work. See `docs/SETUP.md`.

### Known engine gaps

- **Gridline style is boolean.** TanStack's axis takes `grid?: boolean` and owns the
  gridline rendering, so `theme.gridStyle`'s `dashed`/`dotted` variants **cannot** be
  honored the way they are on Recharts/Plot/D3 — the grid is always solid at the engine's
  own alpha. The adapter still exposes `gridDasharray` for components that draw their own
  `ruleY` gridlines. Accepted deliberately: sparser grid, solid style.
- **Axis options are loosely typed and fail SILENTLY.** A misplaced key is accepted by
  `tsc` and ignored at render. The canonical trap:

  ```ts
  x: { axis: { tickFormat: fmt } }          // ignored — compiles, does nothing
  x: { axis: { ticks: { format: fmt } } }   // the real path
  ```

  The first form renders years as `1,995` and silently drops a `%` suffix. **Never trust
  `tsc` on this engine — verify against rendered output.** That is what
  `registry/theme/__tests__/tanstack-contract.test.ts` exists for: it renders DOM-free via
  `createChartScene` + `renderChartSvg` and asserts on extracted `<text>` nodes. Assert on
  text nodes, *not* raw SVG substrings — naive `svg.includes(...)` checks were verified to
  report "no bug" on visibly bugged output.

## Parked highlights (and how to un-park)

- **The whole WB family** (7 recharts + 5 ui + 1 composite + 2 table + 3 plot) — built on a
  Tailwind `dark:` mechanism incompatible with the 5-theme provider. Parking it dissolves the
  theme fork without a rewrite. Un-parking means retrofitting onto `useVizTheme()`.
- **Density/diverging bars** — gated on Phase 4, which upstreams ctzn-pub's
  `d3/stats/density-curves-v1` and `diverging-bars-v1`; one winner per archetype then.
- **`plot/stats/odds-ratio-dotplot-v1`** — revisit in Phase 5 against the health-of-americas
  RankedDotPlot improvements.
- **`plot/geo/europe-map-v1`** — revive with a sidecar when a WVS/ESS article needs it.

Un-parking a component = set its status to `core`, retrofit it to the conventions
(no literals, `colorDomain` prop, sidecar), and move it back out of `registry/legacy/`.

## Mechanics

- Phase 1 (this ledger) only *records* status — no files move.
- Phase 3 physically `git mv`s `merged` + `parked` components to `registry/legacy/<same subpath>`,
  sets `foldInto` on merged losers' sidecars where they exist, and updates `REQUIRES_SIDECAR`.
- Nothing is deleted until after the Phase 7 ctzn-pub re-sync confirms no consumers
  (`components/Gallery/VizResolver.tsx`, MDX `<Figure>` usages).
