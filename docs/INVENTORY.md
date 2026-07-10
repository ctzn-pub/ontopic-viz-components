# Component Inventory

> GENERATED — do not edit. `node scripts/generate-inventory.mjs` regenerates this
> from `registry/curation.json` + the `.catalog.json` sidecars.
> Rationale for every curation call: [registry/CURATION.md](../registry/CURATION.md).

## Core components (47)

Publishable chart cards: theme-aware, typed, sidecar’d. Grouped by gallery category.

### demographic-breakdowns

| id | component | engine | description |
|---|---|---|---|
| brfss-dashboard | `composite/brfss/brfss-dashboard-v1` | composite | A tabbed dashboard for one BRFSS health measure broken down by demographic axis — age, education, income, race/ethnicity — with a one-click toggle between dot, line, and bar renderings of the same levels. |
| demographic-bar → folds into demographic-line | `recharts/generic/demographic-bar-v1` | recharts | The same tabbed demographic explorer drawn with bars instead of a line. |
| demographic-breakdown | `recharts/generic/demographic-breakdown-v1` | recharts | A single demographic break-out with 95% confidence intervals and a built-in toggle that cycles the same data through dot, line, and bar forms. |
| demographic-dot → folds into demographic-line | `recharts/generic/demographic-dot-v1` | recharts | The same tabbed demographic explorer drawn as a dot plot. |
| demographic-line | `recharts/generic/demographic-line-v1` | recharts | A tabbed demographic profile of one indicator: switch between age, education, income, race/ethnicity, and gender break-outs, each drawn as a line with 95% confidence-interval whiskers. |
| diverging-bars | `d3/stats/diverging-bars-v1` | d3 | Ranked horizontal bars extending left or right of a reference line — winners and losers around a baseline, direct-labeled. |
| dumbbell | `d3/stats/dumbbell-v1` | d3 | One row per category with a connector between two endpoint dots — the visual gap between two series (men vs women, then vs now), with value labels and an optional ratio note. |
| grouped-bar | `d3/stats/grouped-bar-v1` | d3 | Multi-series bars grouped side-by-side or stacked within category bands, with a legend and tooltips. |
| paired-bars | `plot/stats/paired-bars-v1` | plot | Two measures per group drawn back to back around a center axis, so a reader can compare both quantities row by row. |
| small-multiples-lines | `d3/stats/small-multiples-v1` | d3 | A grid of mini line panels over one shared ordered x-axis (e.g. |
| state-bar-sortable | `recharts/brfss/state-bar-sortable-v1` | recharts | All fifty states ranked on one indicator as horizontal bars, with search, ascending/descending sort, and an expand toggle that reveals every state label. |

### distributions

| id | component | engine | description |
|---|---|---|---|
| density-curves | `d3/stats/density-curves-v1` | d3 | Overlaid, normalized density curves with peak labels and optional baseline mean markers. |
| distribution | `plot/stats/distribution-v1` | plot | A histogram of one numeric field, drawn as a binned area with an outline and an optional dashed benchmark rule (a national average, a policy threshold). |
| histogram | `recharts/generic/histogram-v1` | recharts | A binned frequency histogram of one continuous variable, with automatic square-root binning and optional mean and median reference lines. |
| parallel-coordinates | `d3/stats/parallel-coordinates-v1` | d3 | Many standardized axes side by side with one thin line per observation, colored by group. |
| pca-biplot | `d3/stats/pca-biplot-v1` | d3 | A principal-component biplot: observation scores as a quiet cloud plus variable loadings as labeled, focusable arrows with collision-managed leader labels. |
| ridge | `d3/stats/ridge-v1` | d3 | A ridgeline chart of per-group distributions with an optional mirrored violin mode, median rules, and direct labels. |
| strip-ridge | `d3/stats/strip-ridge-v1` | d3 | A compact one-row distribution strip: the whole distribution as a smoothed ridgeline silhouette filled with a continuous ramp, tail-trimmed to the central 95% of mass, with benchmark, comparison, and subject markers always kept in view. |

### indicators-and-matrices

| id | component | engine | description |
|---|---|---|---|
| correlation-matrix | `d3/stats/correlation-matrix-v1` | d3 | A square correlation matrix ordered by hierarchical clustering so correlated blocks sit together, with topic-colored labels and a diverging-ramp legend. |
| score-gauge | `d3/stats/score-gauge-v1` | d3 | A 0-100 composite score as a semicircular gauge with an end knob, the arc colored from worse to better through the theme's sentiment roles. |

### maps

| id | component | engine | description |
|---|---|---|---|
| bivariate-choropleth | `plot/geo/bivariate-choropleth-v1` | plot | A county map shaded by the crossing of two tercile variables on a 3×3 bivariate palette, so two patterns (e.g. |
| county-choropleth | `d3/geo/county-choropleth-v1` | d3 | A US county choropleth rendered as inline SVG from a caller-supplied TopoJSON, with theme diverging or sequential ramps, state borders, and a hover tooltip. |
| county-hexbin | `plot/geo/county-hexbin-v1` | plot | A county map that snaps every county to a hexagon lattice and colors each hex by the mean of the counties it absorbs, removing the area bias of a standard choropleth while keeping the spatial pattern. |
| nyc-choropleth | `maplibre/geo/map-v1` | maplibre | MapLibre + PMTiles choropleth at ZCTA (ZIP-code) resolution across the NYC metro. |
| nyc-choropleth-layer → folds into nyc-choropleth | `maplibre/geo/choropleth-v1` | maplibre | Headless layer that joins a { [joinKey]: value } map to tile features via MapLibre's feature-state mechanism and paints a compiled scale expression. |
| nyc-choropleth-legend → folds into nyc-choropleth | `maplibre/geo/legend-v1` | maplibre | Themed gradient legend for MapLibre choropleths. |
| nyc-choropleth-tooltip → folds into nyc-choropleth | `maplibre/geo/tooltip-v1` | maplibre | Themed hover panel positioned by screen coordinates supplied from a parent layer's onHover callback. |
| state-map | `plot/geo/state-map-v1` | plot | A US state choropleth with quantile color bins, hover tooltips, and an optional national-average headline number above the map. |
| world-choropleth | `plot/wb/world-choropleth-v1` | plot | A world map choropleth for per-country indicator values (life expectancy, GDP per capita, HDI), keyed by ISO3 country code, with quantile bins, hover tooltips, and an optional highlighted focal country. |
| world-map → folds into world-choropleth | `plot/wb/world-map-v1` | plot | The Plot rendering engine under the world choropleth: quantile-bucketed country fills over the world-atlas TopoJSON with focal-country highlighting and centroid tooltips. |

### regression-and-effects

| id | component | engine | description |
|---|---|---|---|
| canvas-scatter | `d3/stats/canvas-scatter-v1` | d3 | A canvas-rendered point cloud built for tens of thousands of points, with SVG axes and fit or LOESS overlay lines, quadtree hover, weight-sized dots, and continuous or categorical point coloring. |
| caterpillar | `d3/stats/caterpillar-v1` | d3 | A sorted column of point estimates with confidence-interval whiskers against a reference line. |
| disparity-gradient | `plot/stats/disparity-gradient-v1` | plot | An outcome traced across an ordered gradient (e.g. |
| forest-plot | `plot/stats/forest-plot-v1` | plot | Odds ratios for several predictors compared across strata, faceted by term and colored by stratum, on a log axis with an OR = 1 reference. |
| gradient-line | `d3/stats/gradient-line-v1` | d3 | One or more outcomes traced across an ordered social gradient (deprivation, income percentile) with a CI ribbon, a faint dot cloud showing the underlying dispersion, and directional endpoint labels. |
| gradient-slopes | `d3/stats/gradient-slopes-v1` | d3 | Every measure's decile gradient on one chart, normalized so the reference decile equals 1.0 on a log scale - the slope IS the inequality, and a line ending at 2.5x means the top decile carries 2.5 times the burden of the bottom one. |
| marginal-effect | `plot/stats/marginal-effect-v1` | plot | Predicted probability of an outcome across an ordered set of brackets, with a confidence-interval ribbon. |
| scatter-cloud | `d3/stats/scatter-cloud-v1` | d3 | A point cloud with an optional y=x parity line, a binned-mean summary line, and quadrant annotations. |
| scatter-loess | `plot/health/scatter-loess-v1` | plot | A scatterplot with population-sized points colored by a continuous value, overlaid with a precomputed LOESS summary line. |

### time-series

| id | component | engine | description |
|---|---|---|---|
| gss-small-multiples | `composite/gss/timeseries-small-multiples-v1` | composite | One survey trend viewed several ways: a grid of compact GSS time-trend panels, each splitting the same outcome by a different demographic axis (party, age, education, church attendance), on one shared y-scale with a single title and source line. |
| gss-time-trend | `recharts/gss/timeseries-line-v1` | recharts | The canonical survey time-trend chart: demographic group lines across GSS survey years, with presidential-term bands, a 95% confidence-interval toggle, and identity-coded party colors. |
| multiline | `plot/timeseries/multiline-v1` | plot | A multi-series time-series line chart with pointer tooltips and an optional slider that rebases every series to a chosen date = 100. |
| slopegraph | `d3/timeseries/slopegraph-v1` | d3 | Each series' value at two time points joined by a single line, with endpoint confidence intervals, automatic top-mover labeling with collision-managed endpoint labels, and per-series focus. |
| state-year-heatmap | `plot/timeseries/state-year-heatmap-v1` | plot | A state-by-year value matrix where color encodes a magnitude, revealing levels and trends across many series at once. |
| timeseries-economic | `recharts/generic/timeseries-economic-v1` | recharts | A monthly economic-indicator line with NBER recession shading and a brush for zooming into a date range. |
| timeseries-index | `recharts/generic/timeseries-index-v1` | recharts | Two series rebased to zero percent at the start of the visible window so their growth compares directly, with recession shading, time-range presets, and a brush. |
| timeseries-line | `recharts/generic/timeseries-metadata-v1` | recharts | A single-indicator annual trend line with optional 95% confidence-interval error bars and a metadata-driven title, subtitle, and source block. |

## Foundation (18)

Kept + maintained; not gallery chart cards (article/book MDX building blocks).

- `article/Annotation`
- `article/Callout`
- `article/DataTable`
- `article/DropCap`
- `article/Figure`
- `article/index`
- `article/KeyNumber`
- `article/PullQuote`
- `article/Quote`
- `article/SectionDivider`
- `article/SideNote`
- `article/SmallMultiples`
- `article/StaticChartV1`
- `article/Step`
- `article/TabSet`
- `book/book-toc`
- `book/BookHome`
- `book/BookShell`

## Legacy (51)

Merged (dedupe losers) and parked components live under `registry/legacy/` —
see [registry/CURATION.md](../registry/CURATION.md) for each call and how to un-park.
