# Curation Ledger

The machine-readable source of truth is [`curation.json`](./curation.json) — every component
under `registry/components/` has an entry there, enforced by
`registry/__tests__/curation.test.ts`. This file explains the calls.

**Decided 2026-07-09** as part of the library consolidation (curated best-of scope,
one winner per chart archetype). Statuses:

| Status | Meaning | Count |
|---|---|---|
| `core` | Kept; brought to full standard (theme-aware, typed, `.catalog.json` sidecar) | 37 |
| `foundation` | Kept + maintained; not a gallery chart card, so exempt from the sidecar requirement (article/book MDX blocks) | 18 |
| `merged` | Dedupe loser; its `winner` absorbs any unique features. Physically moved to `registry/legacy/` in Phase 3 | 10 |
| `parked` | Potentially useful, not in the curated cut; moved to `registry/legacy/` untouched | 37 |
| `retired` | No future; deleted only after the ctzn-pub mirror re-sync confirms no consumers | 0 |

## The core set

- **D3 (4)** and **MapLibre (4)** — the mature exemplars, already theme-aware + sidecar'd.
- **Plot promotions (12)** — the *Picturing American Health* set (forest plot, marginal effect,
  paired bars, disparity gradient, ridge, PCA biplot, parallel coordinates, slopegraph,
  state-year heatmap, bivariate choropleth, county hexbin, scatter-LOESS).
- **Plot generics (5)** — multiline, correlation heatmap, distribution, US state map,
  world choropleth: fundamental archetypes worth polishing (Phase 6).
- **Recharts (10)** — the flagship `gss/timeseries-line-v1`, the theme-aware generic line
  (`timeseries-metadata-v1`), histogram, economic (recession bands), indexed comparison,
  the 4-component demographic family (fills the `demographic-breakdowns` gallery category),
  and the sortable state bar.
- **Composites (2)** — the BRFSS dashboard and the GSS small-multiples composite.

## Dual pairs — Phase 3 decides

Both sides of these pairs are currently `core`; Phase 3 compares them side-by-side and flips
the loser to `merged`:

- `d3/stats/ridge-v1` vs `plot/stats/ridge-v1`
- `d3/stats/pca-biplot-v1` vs `plot/stats/pca-biplot-v1`
- `d3/stats/parallel-coordinates-v1` vs `plot/stats/parallel-coordinates-v1`
- `d3/timeseries/slopegraph-v1` vs `plot/timeseries/slopegraph-v1`

## Already-merged calls (losers → winners)

- The three `timetrend-demo-v1` twins (recharts/generic, recharts/gss, plot/gss) and
  `recharts/gss/abortion-opinion-v1` → **`recharts/gss/timeseries-line-v1`** (the flagship
  covers all of them with `colorDomain`).
- `recharts/generic/timeseries-basic-v1` → **`timeseries-metadata-v1`** (its theme-aware successor).
- `plot/stats/odds-ratio-basic-v1`, `odds-ratio-forest-v1` → **`forest-plot-v1`**.
- `recharts/generic/dual-axis-v1` → **`timeseries-dual-axis-v1`** (duplicate; note the winner
  itself is parked — dual axes are a discouraged form).
- `recharts/brfss/state-bar-v1`, `plot/brfss/state-bar-v1` → **`state-bar-sortable-v1`**.

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
