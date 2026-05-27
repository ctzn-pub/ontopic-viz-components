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
          </section>
        </VizThemeProvider>
      ))}
    </div>
  );
}
