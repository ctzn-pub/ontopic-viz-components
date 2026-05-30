# 05 — Map Engine: MapLibre + PMTiles (Phase 5)

You are working in the `ontopic-viz-components` repo. Docs `00`–`04` established a four-layer
theme system (`tokens` → `semantic` → `themes` → adapters) shared by two engines, **Recharts**
and **Observable Plot**. This doc adds a **third engine** for maps: **MapLibre GL JS + PMTiles**.

Read `00-OVERVIEW.md` through `04-RETROFIT-AND-VERIFY.md` first. This brief assumes
`registry/theme/{tokens,semantic,themes,provider}.ts` and `adapters/{recharts,plot}.ts`
already exist and behave as specified there.

---

## Why a third engine (and where the line is)

The existing geo components (`plot/geo/state-map-v1`, `zip-map-v1`, …) render TopoJSON to SVG
with Observable Plot. That is correct for **low-cardinality, projection-faithful, static**
thematic maps (states, counties — Plot gives a proper Albers USA projection). It does **not**
scale to the fine geographies in this phase: ~240k census block groups, ~33k ZCTAs. TopoJSON
in SVG chokes, and there is no zoom / level-of-detail story.

MapLibre + PMTiles is the engine for **high-cardinality, zoomable, interactive** maps. The
geometry is pre-baked into a single PMTiles archive read over HTTP range requests (no tile
server), and the GPU renders it. The one thing you give up versus the Plot path is projection:
**MapLibre is Web Mercator only.** That is an accepted tradeoff, not a regression. Selection rule:

- few features, static, projection matters, SSR-friendly → **Plot + TopoJSON** (existing)
- many features, interactive, zoomable → **MapLibre + PMTiles** (this doc)

Do **not** migrate the existing Plot geo components. Add alongside them.

---

## What's genuinely new vs. the other two engines

`03-ADAPTERS.md` documents the Recharts/Plot asymmetry: Recharts resolves color per-series
imperatively; Plot takes a `{domain, range}` scale; both pull from `theme.semantic`, so output
matches. MapLibre adds a **third mechanic that is more different than those two are from each
other**:

1. **Color is computed inside a GPU paint expression** that reads feature properties, not
   assigned in JS.
2. **Geometry lives in the tiles; data values live elsewhere** (a survey/health array that
   changes per question). The two must be *joined at runtime* — you never re-bake tiles per
   question.

So this engine introduces two things the theme system doesn't have yet:

- a **continuous color scale** resolver (number → color), because choropleths need it and
  `colorFor`/`colorScale` are categorical-only; and
- a **data-join contract** between an external data array and tile features.

Both are specified below.

---

## Dependencies

```
pnpm add maplibre-gl pmtiles
```

- `maplibre-gl` ships its own stylesheet — import `maplibre-gl/dist/maplibre-gl.css` once
  (in `GeoMap`). Without it the canvas won't size and controls render unstyled.
- Types are bundled with both packages; no `@types/*` needed.
- **Do not** add `react-map-gl`. We wrap MapLibre imperatively with a thin context + layer
  components — this matches the imperative Plot precedent, keeps the copy-in footprint minimal,
  and gives full control over the style for theming. (If a future maintainer prefers a fully
  declarative `<Source>/<Layer>` tree, `react-map-gl/maplibre` is the drop-in alternative, but
  it pins React versions and is out of scope for v1.)

New files this phase:

```
registry/theme/scales.ts                         # continuous scale resolver + compilers (NEW)
registry/theme/adapters/maplibre.ts              # theme → basemap style fragment (NEW)
registry/components/maplibre/geo/map-v1.tsx      # <GeoMap> container + context
registry/components/maplibre/geo/choropleth-v1.tsx  # <ChoroplethLayer>
registry/components/maplibre/geo/legend-v1.tsx   # <MapLegend>
registry/components/maplibre/geo/tooltip-v1.tsx  # <MapTooltip> (hover)
registry/theme/__tests__/maplibre-contract.test.ts  # drift insurance (extends doc 04)
```

`provider.tsx` gains two returns (below). `semantic.ts` is **not** edited; the continuous
layer lives in the new `scales.ts` and imports the ramps from `semantic`.

---

## The data: example PMTiles

These are **boundary** tilesets (not basemaps). Public, range-request readable:

| File | Size | Geography | Likely join key* |
|---|---|---|---|
| `NYC_MSA.pmtiles` | 9M | NYC metro (CBSA) | CBSA / GEOID |
| `Health_Zip_converted.pmtiles` | 58M | ZIP / ZCTA, health | ZCTA / ZIP code |
| `us_bg_zoom5.pmtiles` | 7M | US census block groups, **overview (≤ z5)** | `GEOID` (12-digit) |
| `us_bg.pmtiles` | 130M | US census block groups, **full detail** | `GEOID` (12-digit) |

```
https://ontopic-public-data.t3.storage.dev/pmtiles/NYC_MSA.pmtiles
https://ontopic-public-data.t3.storage.dev/pmtiles/Health_Zip_converted.pmtiles
https://ontopic-public-data.t3.storage.dev/pmtiles/us_bg_zoom5.pmtiles
https://ontopic-public-data.t3.storage.dev/pmtiles/us_bg.pmtiles
```

> ⚠️ **First task before writing the join code:** confirm the real **source-layer name** and
> the **join property** in each file. The `*` column above is an assumption, not verified.
> Run, for each URL:
> ```
> pnpm dlx pmtiles show <url>      # or: go install github.com/protomaps/go-pmtiles@latest
> ```
> Read the `vector_layers` block in the printed metadata — note each layer's `id` (the
> `source-layer` you'll reference) and its `fields`. Wire `joinKey` / `promoteId` to the **exact**
> field name. If the join field is non-unique or missing, stop and report it — the whole
> feature-state join depends on a unique, stable id per feature.

**`us_bg` + `us_bg_zoom5` are a deliberate multi-resolution pair.** Serve the 7M overview at
low zooms and the 130M detail above a breakpoint (two sources with `minzoom`/`maxzoom`, see
`<ChoroplethLayer>`). Default the demo to `NYC_MSA` — it loads fast.

---

## Layer 1 — `registry/theme/scales.ts` (continuous color)

The categorical resolver in `semantic.ts` stays as-is. Continuous scales are a separate concern
and reuse the existing ramps (`theme.semantic.sequential` = blueRamp, `.diverging` = rdBu).

**The design that delivers cross-engine consistency:** define a scale once as **shared
anchor stops**, then compile it to each engine. Because the ramps are already 5-color arrays,
every engine does piecewise-linear interpolation over *identical anchors* — which sidesteps the
trap where d3's Lab interpolation and MapLibre's RGB interpolation drift apart. Pin the anchors;
the interpolation method stops mattering.

```ts
// registry/theme/scales.ts
import { SemanticMap } from './semantic';

export type ScaleKind = 'sequential' | 'diverging';
export type ClassMode = 'continuous' | 'quantize'; // quantile/jenks = later extension

export interface ScaleSpec {
  kind: ScaleKind;
  /** sequential: [min,max]; diverging: [min,center,max] (center is the neutral color) */
  domain: number[];
  mode?: ClassMode;   // default 'continuous'
  classes?: number;   // for 'quantize'; default = colors.length
  reverse?: boolean;  // flip the ramp (e.g. rdBu so red=low or red=high as the data needs)
}

export interface ResolvedScale {
  colors: string[];   // anchor colors, theme-resolved, post-reverse
  stops: number[];    // value at each anchor, same length as colors
  nodata: string;     // color for features with no joined value
}

/** Pull anchors from the active theme's semantic ramp and lay them across the domain. */
export function scaleFor(sem: SemanticMap, spec: ScaleSpec): ResolvedScale {
  const ramp = (spec.kind === 'diverging' ? sem.diverging : sem.sequential).slice();
  const colors = spec.reverse ? ramp.reverse() : ramp;

  let stops: number[];
  if (spec.kind === 'diverging') {
    const [min, mid, max] = spec.domain;
    const mid_i = (colors.length - 1) / 2;             // center color sits at `mid`
    stops = colors.map((_, i) =>
      i <= mid_i ? min + (mid - min) * (i / mid_i)
                 : mid + (max - mid) * ((i - mid_i) / (colors.length - 1 - mid_i)));
  } else {
    const [min, max] = spec.domain;
    stops = colors.map((_, i) => min + (max - min) * (i / (colors.length - 1)));
  }
  return { colors, stops, nodata: 'transparent' };
}

/** Compile to a MapLibre paint expression reading a numeric feature-state `value`. */
export function toMaplibreFill(s: ResolvedScale): any {
  const interp: any[] = ['interpolate', ['linear'], ['to-number', ['feature-state', 'value']]];
  s.stops.forEach((stop, i) => interp.push(stop, s.colors[i]));
  // guard: features with no joined value get the nodata color instead of erroring
  return ['case', ['==', ['feature-state', 'value'], null], s.nodata, interp];
}

/** Quantized variant → MapLibre `step` expression (classed choropleth, Tufte-friendly). */
export function toMaplibreStep(s: ResolvedScale): any {
  const expr: any[] = ['step', ['to-number', ['feature-state', 'value']], s.colors[0]];
  for (let i = 1; i < s.colors.length; i++) expr.push(s.stops[i], s.colors[i]);
  return ['case', ['==', ['feature-state', 'value'], null], s.nodata, expr];
}

/** For the React legend (and any SVG engine): same stops as a 0–1 gradient. */
export function toGradientStops(s: ResolvedScale): { offset: number; color: string }[] {
  const span = s.stops[s.stops.length - 1] - s.stops[0] || 1;
  return s.colors.map((color, i) => ({ offset: (s.stops[i] - s.stops[0]) / span, color }));
}
```

**The political case is a diverging scale, for free.** A Dem−Rep margin is
`{ kind:'diverging', domain:[-30, 0, 30] }` over `rdBu` — same semantic intent as the
categorical `party` lookup, continuous form. Decide `reverse` so blue/red land on the party
you intend, and document it (don't leave it to chance).

---

## Layer 2 — `registry/theme/adapters/maplibre.ts` (the basemap chrome)

Analogous to `rcTheme`/`plotBase`: turn a `Theme` into the non-semantic map chrome. These are
*boundary* tilesets, so the "basemap" is minimal — background fill, hairline boundaries, and
(optional) labels. That minimalism **is** the Tufte aesthetic: the choropleth is the map; there
are no roads/POIs to suppress.

```ts
// registry/theme/adapters/maplibre.ts
import { Theme } from '../themes';

export function mlTheme(theme: Theme) {
  return {
    background: theme.surface,                 // map root background
    boundary:  { color: theme.border, width: theme.mode === 'dark' ? 0.6 : 0.5 }, // hairline
    boundaryHover: { color: theme.fg, width: 1.25 },
    label:    { color: theme.muted, halo: theme.surface, font: theme.fontBody, size: 11 },
    showLabels: false,                         // default off — opt-in per map
  };
}
export type MlTheme = ReturnType<typeof mlTheme>;
```

Notes:
- **Labels need glyphs.** MapLibre renders text from a `glyphs` URL in the style, and these
  boundary tilesets don't carry one. Keep `showLabels: false` for v1; if a map opts in, it must
  supply a `glyphs` endpoint (e.g. a self-hosted PBF range). Don't hardcode a third-party glyph
  server.
- A neutral land/water context layer is **out of scope for v1**. Background color + fills +
  boundaries is enough and stays on-aesthetic.
- `carbon` (dark) gets a dark background and a slightly thicker, lighter boundary — already
  handled via `theme.mode`.

---

## Provider wiring

Extend `useVizTheme()` (doc 03) with the two new returns. Keep the no-provider default working.

```tsx
// in registry/theme/provider.tsx — add to the useMemo return:
ml: mlTheme(theme),                                            // ★ maplibre chrome bundle
scaleFor: (spec: ScaleSpec) => scaleFor(theme.semantic, spec), // ★ continuous resolver, bound
```

```tsx
import { mlTheme } from './adapters/maplibre';
import { scaleFor, ScaleSpec } from './scales';
```

---

## Layer 3 — `<GeoMap>` (`maplibre/geo/map-v1.tsx`)

Container + a React context that hands child layers the `maplibre.Map` instance once it's
`load`-ed. Registers the PMTiles protocol once. Client-only.

Key requirements:

1. **Register the protocol once, module-level guarded** — `maplibre.addProtocol('pmtiles', …)`
   must run a single time per page, not per mount:
   ```ts
   import maplibregl from 'maplibre-gl';
   import { Protocol } from 'pmtiles';
   let _registered = false;
   function ensurePmtiles() {
     if (_registered) return;
     const p = new Protocol();
     maplibregl.addProtocol('pmtiles', p.tile);
     _registered = true;
   }
   ```
2. **Theme the root style** from `mlTheme` — `style: { version: 8, sources: {}, layers: [
   { id:'bg', type:'background', paint:{ 'background-color': ml.background } } ], glyphs: … }`.
   Sources/layers for data are added by child layer components, not here.
3. **Context** exposes `{ map, loaded }`. Children call a `useGeoMap()` hook and no-op until
   `loaded`.
4. **Cleanup**: `map.remove()` on unmount; guard against React 18 StrictMode double-mount.
5. **Controls**: add `NavigationControl` minimally (zoom only, no compass clutter) — Tufte.
6. Props: `{ initialViewState?, maxBounds?, interactive?, children, className, ariaLabel }`.
   Default `interactive` true; expose `ariaLabel` (see Accessibility).

```tsx
// shape only — fill in per the requirements above
'use client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useVizTheme } from '@/viz/theme/provider';

const GeoMapCtx = createContext<{ map: maplibregl.Map | null; loaded: boolean }>(
  { map: null, loaded: false });
export const useGeoMap = () => useContext(GeoMapCtx);
// … provider implementation …
```

---

## Layer 4 — `<ChoroplethLayer>` (`maplibre/geo/choropleth-v1.tsx`) — the core

Headless: renders nothing itself, adds a source + a fill layer to the map from context, and
**joins external data via `feature-state`**. This is the most important component in the phase.

### Props

```ts
interface ChoroplethLayerProps {
  url: string;                 // pmtiles:// URL of the archive
  sourceLayer: string;         // vector_layers[].id from `pmtiles show`
  joinKey: string;             // feature property that matches your data keys (e.g. 'GEOID')
  data: Record<string, number>;// { [joinKeyValue]: value }  — the survey/health values
  scale: ScaleSpec;            // from scales.ts (sequential | diverging)
  classed?: boolean;           // step vs continuous fill (default false = continuous)
  beforeId?: string;           // insert below this layer id (e.g. labels)
  minzoom?: number; maxzoom?: number; // for the multi-resolution pair
  onHover?: (id: string | null, value: number | null) => void;
}
```

### Join strategy — `feature-state`, not a giant `match`

For 240k features a baked `match` expression is enormous and rebuilds on every data change.
Use `feature-state`:

1. Add the source with **`promoteId`** so each feature's id *is* the join key:
   ```ts
   map.addSource(sourceId, { type:'vector', url, promoteId:{ [sourceLayer]: joinKey } });
   ```
2. Add the fill layer; its `fill-color` paint is the compiled scale expression
   (`toMaplibreFill` / `toMaplibreStep`) reading `['feature-state','value']`.
3. Push values with `setFeatureState` keyed by id — **after the source loads** and **after the
   tiles for the current viewport exist** (set on `sourcedata` once `isSourceLoaded`, and
   re-apply on `data`/move if needed; MapLibre only retains state for loaded tiles):
   ```ts
   for (const [id, value] of Object.entries(data))
     map.setFeatureState({ source: sourceId, sourceLayer, id }, { value });
   ```
4. On `data` prop change, diff and `setFeatureState`/`removeFeatureState` — do **not** rebuild
   the layer. This is what makes "new survey question" cheap.

### No-data, hover, cleanup

- Features with no entry in `data` have no `value` feature-state → the `['case', … null …]`
  guard paints them `nodata` (transparent). Good default; offer a faint hatch as an option later.
- **Hover** via a second `hover` feature-state + a thin outline line layer that reads
  `['feature-state','hover']`; update on `mousemove`/`mouseleave` using `queryRenderedFeatures`.
  Fire `onHover(id, value)` so `<MapTooltip>` can render in React (themed), not in MapLibre.
- **Cleanup**: remove layers then source on unmount / prop change; guard StrictMode.

### Multi-resolution

Render two `<ChoroplethLayer>`s for the block-group pair: `us_bg_zoom5` with `maxzoom={6}` and
`us_bg` with `minzoom={6}`, same `joinKey`/`data`/`scale`. Or expose a single component that
accepts `overviewUrl`/`detailUrl` + a breakpoint — your call; document whichever you pick.

---

## Layer 5 — `<MapLegend>` and `<MapTooltip>`

Both are **themed React components** (not MapLibre-native) so they share the token system and
read the *same* `ResolvedScale`.

- `<MapLegend>`: continuous → a CSS `linear-gradient` from `toGradientStops` with min/mid/max
  ticks; classed → discrete swatches with bin edges. For diverging, mark the center value. Pull
  type/colors from `useVizTheme()` chrome so it matches `editorial`/`newsprint`/`carbon`.
- `<MapTooltip>`: positioned from `onHover` coordinates; shows the feature label (if available)
  and formatted value. Styled with the same surface/border/fg as the Recharts tooltip
  (`rc.tooltip`) for cross-engine visual consistency.

---

## SSR / MDX

MapLibre touches `window` and must not run on the server. In the Next.js app and in
`article/*` MDX usage, import map components with `next/dynamic` and `{ ssr: false }` (the repo
already does this for `PcaPlot`). Render a sized skeleton placeholder so layout doesn't jump.

---

## Accessibility (do not skip)

- **Never encode by color alone.** Pair the choropleth with the legend always visible, and make
  hover/focus reveal the exact value. Consider an optional data-table fallback (reuse
  `article/DataTable`) for the composite.
- Set a meaningful `aria-label`/`role="img"` summary on the map container describing what it
  shows; the raw canvas is not screen-reader legible.
- Respect `prefers-reduced-motion` — disable fly-to easing when set.
- Verify legend text and boundary strokes meet contrast in all three themes (especially
  `carbon`).
- Do not trap keyboard focus in the canvas; provide visible focus styles on interactive controls.

---

## Verify — drift insurance (extends doc 04)

Add `registry/theme/__tests__/maplibre-contract.test.ts`:

```ts
import { themes } from '../themes';
import { scaleFor, toMaplibreFill } from '../scales';

test('every theme produces a sequential + diverging fill whose anchors are the theme ramp', () => {
  for (const theme of Object.values(themes)) {
    const seq = scaleFor(theme.semantic, { kind: 'sequential', domain: [0, 100] });
    expect(seq.colors).toEqual([...theme.semantic.sequential]);   // no drift from the ramp
    const expr = toMaplibreFill(seq);
    expect(expr[0]).toBe('case');                                 // null guard present
    // every color literal in the expression is a theme ramp color
    const used = JSON.stringify(expr).match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    used.forEach((c) => expect([...theme.semantic.sequential, ...theme.semantic.diverging,
      'transparent'].map(String)).toContain(c));

    const div = scaleFor(theme.semantic, { kind: 'diverging', domain: [-30, 0, 30] });
    expect(div.colors).toEqual([...theme.semantic.diverging]);
  }
});
```

Then extend the **side-by-side demo page** (`app/_theme-demo/page.tsx` from doc 04): add a map
panel (default `NYC_MSA`) inside each theme's `<VizThemeProvider>`. Eyeball that the sequential
ramp and the diverging party-margin scale read correctly and that the basemap matches the theme
(ink hairlines on white for `editorial`, warm on paper for `newsprint`, light-on-dark for
`carbon`).

---

## Acceptance checklist

- [ ] `pmtiles show` run on all four URLs; real `sourceLayer` + join field recorded; brief's
      assumed keys corrected if wrong.
- [ ] `scales.ts` exists: `scaleFor`, `toMaplibreFill`, `toMaplibreStep`, `toGradientStops`.
- [ ] `adapters/maplibre.ts` exists; `useVizTheme()` returns `ml` and `scaleFor`; no-provider
      default still renders.
- [ ] PMTiles protocol registered exactly once; `<GeoMap>` themes its background from `ml`.
- [ ] `<ChoroplethLayer>` joins via `promoteId` + `setFeatureState`; changing the `data` prop
      updates colors **without** rebuilding the layer; no-data features paint `nodata`.
- [ ] Block-group pair renders the 7M overview at low zoom and 130M detail on zoom-in.
- [ ] `<MapLegend>` + `<MapTooltip>` are themed React and share the resolved scale; tooltip
      matches the Recharts tooltip styling.
- [ ] Map components import via `next/dynamic { ssr:false }`; sized skeleton; no `window` on server.
- [ ] Accessibility checklist satisfied (legend always visible, aria summary, reduced-motion,
      contrast in all themes).
- [ ] `maplibre-contract.test.ts` passes; demo page shows a map panel per theme.
- [ ] `THEME-AUTHORING.md` updated: how a new theme defines its basemap chrome + ramps.

---

## Notes / judgment calls left to you

- **Classed vs continuous default.** Tufte-leaning analysts often prefer classed (quantize)
  choropleths for readability; continuous is smoother but harder to read precisely. v1 ships
  both; pick `continuous` as the *default* but make `classed` a one-prop switch. Quantile/Jenks
  classing is a clean later extension to `scales.ts`.
- **Diverging orientation** (`reverse`) for party margin: decide and document so it's stable
  across every map.
- **Value formatting** (percent, per-capita, raw counts) belongs to the data layer, not the
  scale — keep `scaleFor` purely numeric.
