'use client';

// Side-by-side theme demo — the fastest way to SEE cross-engine consistency
// and a strong regression guard. Renders the SAME data through a Recharts
// chart and a Plot chart, looped over every built-in theme. Eyeball check:
//   - the single-series chart is ink in `editorial`, warm charcoal in
//     `newsprint`, light in `carbon`/`blueprint`;
//   - "Democrat" lines are the SAME blue in the Recharts and Plot panels of a
//     given theme (because both pull from the same theme.semantic).
//
// This file targets a consumer app. Drop it at e.g. `app/_theme-demo/page.tsx`
// after `viz add`-ing the components below and `cp -r registry/theme viz/theme`.

import { VizThemeProvider } from '@/viz/theme/provider';
import { themes } from '@/viz/theme/themes';
import TimeSeriesChart from '@/viz/components/recharts/generic/timeseries-metadata-v1';
import TimeTrendDemoChart from '@/viz/components/recharts/gss/timeseries-line-v1';
import MultiLine from '@/viz/components/plot/timeseries/multiline-v1';

// Map engine (engine #3). CLIENT-ONLY: maplibre-gl touches `window` at import,
// so in a Next.js app / MDX these MUST be imported via `next/dynamic { ssr:false }`
// with a sized skeleton (see design/05-MAP-ENGINE.md). This template already runs
// in a client context, so — like the chart panels above — it imports them directly.
import { useEffect, useState } from 'react';
import GeoMap, { useGeoMap } from '@/viz/components/maplibre/geo/map-v1';
import ChoroplethLayer, {
  type ChoroplethLayerProps,
} from '@/viz/components/maplibre/geo/choropleth-v1';
import MapLegend from '@/viz/components/maplibre/geo/legend-v1';
import MapTooltip from '@/viz/components/maplibre/geo/tooltip-v1';
import type { ScaleSpec } from '@/viz/theme/scales';

// --- shared demo data ------------------------------------------------------

const singleSeries = [
  { year: '2000', value: 41.2, standard_error: 1.1 },
  { year: '2004', value: 44.8, standard_error: 1.0 },
  { year: '2008', value: 47.1, standard_error: 0.9 },
  { year: '2012', value: 49.6, standard_error: 1.2 },
  { year: '2016', value: 52.0, standard_error: 1.0 },
  { year: '2020', value: 55.3, standard_error: 0.8 },
];

const singleMeta = {
  type: 'timeseries',
  title: 'Support over time',
  subtitle: 'A single-series chart — monochrome by default (the Tufte default)',
  source: { id: 'demo', name: 'Demo dataset' },
};

const singleDpMeta = [
  { id: 'value', name: 'Support', type: 'percent', value_suffix: '%' },
];

// Multi-series party data, shared by the Recharts and Plot panels.
const parties = ['Democrat', 'Republican', 'Independent'];
const partyRows: { year: number; PolParty: string; value: number }[] = [];
[
  ['Democrat', [62, 64, 67, 70, 72, 74]],
  ['Republican', [38, 36, 34, 33, 31, 29]],
  ['Independent', [50, 49, 51, 52, 50, 48]],
].forEach(([party, vals]) => {
  (vals as number[]).forEach((v, i) =>
    partyRows.push({ year: 2000 + i * 4, PolParty: party as string, value: v }),
  );
});

const rechartsMulti = {
  metadata: { title: 'Approval by party', subtitle: 'Recharts engine', source: { name: 'Demo' } },
  dataPoints: partyRows.map((r) => ({ ...r, year: String(r.year) })),
  dataPointMetadata: [{ id: 'value', value_suffix: '%' }],
};

// --- map demo --------------------------------------------------------------
// Real NYC metro tileset (~9MB, range-request readable). Confirmed via
// `pmtiles show`: source-layer is "zipcode_demographics" and the join field is
// "geoid" (ZCTA) — NOT the brief's assumed CBSA/GEOID. Wire to the exact names.
const NYC_PMTILES = 'https://ontopic-public-data.t3.storage.dev/pmtiles/NYC_MSA.pmtiles';
const NYC_LAYER = 'zipcode_demographics';
const NYC_JOIN = 'geoid';

// Domains are FIXED (not auto-derived) so the legend ticks and the GPU fill
// agree — deriving the domain from data on one side only would desync them.
const INCOME_SCALE: ScaleSpec = { kind: 'sequential', domain: [30000, 180000] };
// This demographic tileset has no party field; the diverging legend below shows
// the rdBu ramp a margin map (e.g. Dem−Rep points) uses, eyeballable per theme.
const MARGIN_SCALE: ScaleSpec = { kind: 'diverging', domain: [-30, 0, 30] };

const fmtUSD = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n.toFixed(0)}`);

// Demo glue only: lift a numeric tile PROPERTY into the { [geoid]: value } map
// that <ChoroplethLayer> joins via feature-state, so the demo paints real data
// with no external file. A real app passes its own survey/health values instead
// — the choropleth never reads values out of the tiles itself.
function NycIncomeLayer({ onHover }: { onHover: ChoroplethLayerProps['onHover'] }) {
  const { map, loaded } = useGeoMap();
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!map || !loaded) return;
    const SRC = 'nyc__src'; // <ChoroplethLayer id="nyc"> creates `${id}__src`
    const collect = () => {
      const feats = map.querySourceFeatures(SRC, { sourceLayer: NYC_LAYER });
      if (!feats.length) return;
      const next: Record<string, number> = {};
      for (const f of feats) {
        const key = f.properties?.[NYC_JOIN];
        const val = Number(f.properties?.median_income);
        if (key != null && Number.isFinite(val)) next[String(key)] = val;
      }
      setData((prev) => ({ ...prev, ...next }));
    };
    map.on('idle', collect);
    collect();
    return () => {
      map.off('idle', collect);
    };
  }, [map, loaded]);

  return (
    <ChoroplethLayer
      id="nyc"
      url={NYC_PMTILES}
      sourceLayer={NYC_LAYER}
      joinKey={NYC_JOIN}
      data={data}
      scale={INCOME_SCALE}
      onHover={onHover}
    />
  );
}

// One self-contained, themed choropleth: GPU fill + always-visible legend +
// React hover tooltip, all reading the active theme. Dropped inside each theme's
// provider below so the basemap chrome + ramp can be eyeballed per theme.
function MapPanel() {
  const [hover, setHover] = useState<{
    label?: string;
    value: number | null;
    x: number;
    y: number;
  } | null>(null);

  return (
    <GeoMap ariaLabel="NYC metro median household income by ZCTA" height={340}>
      <NycIncomeLayer
        onHover={(id, value, point) =>
          setHover(point ? { label: id ? `ZCTA ${id}` : undefined, value, ...point } : null)
        }
      />
      <div
        style={{ position: 'absolute', left: 8, bottom: 8, zIndex: 1, display: 'grid', gap: 6 }}
      >
        <MapLegend scale={INCOME_SCALE} title="Median household income" format={fmtUSD} />
        <MapLegend scale={MARGIN_SCALE} title="Diverging ramp (e.g. D−R margin)" />
      </div>
      <MapTooltip
        visible={!!hover}
        x={hover?.x ?? 0}
        y={hover?.y ?? 0}
        label={hover?.label}
        value={hover?.value ?? null}
        format={fmtUSD}
      />
    </GeoMap>
  );
}

// --- page ------------------------------------------------------------------

export default function ThemeDemo() {
  return (
    <div className="grid gap-16 p-8">
      {(Object.keys(themes) as (keyof typeof themes)[]).map((name) => (
        <VizThemeProvider key={name} theme={name}>
          <section data-viz-theme={name} className="grid gap-6">
            <h3 className="text-lg font-bold uppercase tracking-wide">{name}</h3>

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm opacity-70">Single-series (Recharts) — no domain</p>
                <TimeSeriesChart
                  data={singleSeries}
                  metadata={singleMeta}
                  dataPointMetadata={singleDpMeta}
                />
              </div>

              <div>
                <p className="mb-2 text-sm opacity-70">Multi-series party (Plot)</p>
                <MultiLine
                  data={partyRows}
                  xKey="year"
                  yKey="value"
                  groupKey="PolParty"
                  colorDomain="party"
                  title="Approval by party"
                  subtitle="Plot engine"
                  yFormat="percent"
                  showIndexSlider={false}
                  width={520}
                  height={320}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm opacity-70">Multi-series party (Recharts)</p>
              <TimeTrendDemoChart
                data={rechartsMulti}
                demographicGroups={parties}
                demographic="PolParty"
                colorDomain="party"
              />
            </div>

            <div>
              <p className="mb-2 text-sm opacity-70">
                Choropleth (MapLibre) — NYC metro, themed basemap + ramp
              </p>
              <MapPanel />
            </div>
          </section>
        </VizThemeProvider>
      ))}
    </div>
  );
}
