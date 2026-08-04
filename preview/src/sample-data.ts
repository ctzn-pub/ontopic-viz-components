import type { ForestPlotData } from '../../registry/components/plot/stats/forest-plot-v1';
import type { D3RidgeData } from '../../registry/components/d3/stats/ridge-v1';
import type { D3SlopegraphData } from '../../registry/components/d3/timeseries/slopegraph-v1';
import type { CaterpillarData } from '../../registry/components/d3/stats/caterpillar-v1';
import type { DumbbellData } from '../../registry/components/d3/stats/dumbbell-v1';

export const timeSeriesData = [
  { year: '2000', value: 41.2, standard_error: 1.1, n_actual: 1250 },
  { year: '2004', value: 44.8, standard_error: 1.0, n_actual: 1318 },
  { year: '2008', value: 47.1, standard_error: 0.9, n_actual: 1402 },
  { year: '2012', value: 49.6, standard_error: 1.2, n_actual: 1367 },
  { year: '2016', value: 52.0, standard_error: 1.0, n_actual: 1491 },
  { year: '2020', value: 55.3, standard_error: 0.8, n_actual: 1588 },
];

export const timeSeriesMetadata = {
  type: 'timeseries',
  title: 'Support over time',
  subtitle: 'Single-series default resolves to ink in the active theme',
  source: { id: 'preview', name: 'Preview sample' },
};

export const dataPointMetadata = [
  { id: 'value', name: 'Support', type: 'percent', value_suffix: '%' },
];

export const partyRows = [
  ['Democrat', [62, 64, 67, 70, 72, 74]],
  ['Republican', [38, 36, 34, 33, 31, 29]],
  ['Independent', [50, 49, 51, 52, 50, 48]],
].flatMap(([party, values]) =>
  (values as number[]).map((value, index) => ({
    year: new Date(2000 + index * 4, 0, 1),
    party: party as string,
    value,
  })),
);

export const forestData: ForestPlotData = {
  outcome: 'self-rated health',
  terms: ['Income', 'Education', 'Smoking'],
  groups: [
    {
      stratum: '18-34',
      estimates: [
        { term: 'Income', or: 0.72, lci: 0.58, uci: 0.91 },
        { term: 'Education', or: 0.81, lci: 0.66, uci: 0.98 },
        { term: 'Smoking', or: 1.38, lci: 1.09, uci: 1.72 },
      ],
    },
    {
      stratum: '35-54',
      estimates: [
        { term: 'Income', or: 0.64, lci: 0.51, uci: 0.79 },
        { term: 'Education', or: 0.76, lci: 0.62, uci: 0.92 },
        { term: 'Smoking', or: 1.52, lci: 1.21, uci: 1.91 },
      ],
    },
    {
      stratum: '55+',
      estimates: [
        { term: 'Income', or: 0.69, lci: 0.55, uci: 0.86 },
        { term: 'Education', or: 0.88, lci: 0.71, uci: 1.08 },
        { term: 'Smoking', or: 1.26, lci: 1.02, uci: 1.56 },
      ],
    },
  ],
};

export const slopeData: D3SlopegraphData = {
  start_year: 2010,
  end_year: 2024,
  value_label: 'Index',
  highlight: ['MI', 'PA'],
  note: 'Hover a line to inspect a state.',
  rows: [
    { state: 'MI', start: 46, end: 61, start_lci: 43, start_uci: 49, end_lci: 58, end_uci: 64 },
    { state: 'PA', start: 53, end: 66, start_lci: 50, start_uci: 56, end_lci: 63, end_uci: 69 },
    { state: 'WI', start: 49, end: 55, start_lci: 46, start_uci: 52, end_lci: 52, end_uci: 58 },
    { state: 'OH', start: 58, end: 54, start_lci: 55, start_uci: 61, end_lci: 51, end_uci: 57 },
    { state: 'AZ', start: 42, end: 57, start_lci: 39, start_uci: 45, end_lci: 54, end_uci: 60 },
    { state: 'GA', start: 50, end: 52, start_lci: 47, start_uci: 53, end_lci: 49, end_uci: 55 },
    { state: 'NC', start: 47, end: 59, start_lci: 44, start_uci: 50, end_lci: 56, end_uci: 62 },
    { state: 'NV', start: 45, end: 51, start_lci: 42, start_uci: 48, end_lci: 48, end_uci: 54 },
  ],
};

export const ridgeData: D3RidgeData = {
  measure: 'county prevalence',
  unit: '%',
  grid_min: 12,
  grid_max: 45,
  regions: [
    {
      region: 'Northeast',
      mean: 24.4,
      median: 24.1,
      values: [18, 20, 22, 23, 24, 24, 25, 26, 27, 28, 30],
    },
    {
      region: 'Midwest',
      mean: 28.1,
      median: 28.4,
      values: [21, 24, 26, 27, 28, 29, 29, 30, 32, 34, 36],
    },
    {
      region: 'South',
      mean: 31.7,
      median: 31.3,
      values: [24, 27, 29, 30, 31, 32, 33, 35, 37, 39, 41],
    },
    {
      region: 'West',
      mean: 25.9,
      median: 25.4,
      values: [16, 19, 21, 24, 25, 26, 27, 29, 30, 32, 34],
    },
  ],
};

export const caterpillarData: CaterpillarData = {
  rows: [
    { label: 'Social capital index', estimate: 0.42, lo: 0.31, hi: 0.53, n: 3089 },
    { label: 'Two-parent households', estimate: 0.38, lo: 0.29, hi: 0.47, n: 3089 },
    { label: 'School quality', estimate: 0.27, lo: 0.16, hi: 0.38, n: 2814 },
    { label: 'Job growth', estimate: 0.12, lo: 0.01, hi: 0.23, n: 3089 },
    { label: 'Rent burden', estimate: -0.09, lo: -0.2, hi: 0.02, n: 3089 },
    { label: 'Long commutes', estimate: -0.24, lo: -0.34, hi: -0.14, n: 3089 },
    { label: 'Income segregation', estimate: -0.31, lo: -0.41, hi: -0.21, n: 2955 },
    { label: 'Violent crime', estimate: -0.37, lo: -0.48, hi: -0.26, n: 2790 },
  ],
  reference: 0,
  xLabel: 'correlation with upward mobility',
  numberFormat: '+.2f',
  sort: true,
  title: 'What predicts upward mobility',
  subtitle: 'County-level correlates (illustrative preview data)',
  source: 'Preview sample',
};

export const dumbbellData: DumbbellData = {
  rows: [
    { label: 'No HS diploma', left: 21.6, right: 30.7, note: '1.4x' },
    { label: 'HS graduate', left: 19.7, right: 27.1, note: '1.4x' },
    { label: 'Some college', left: 16.5, right: 18.9, note: '1.1x' },
    { label: "Bachelor's+", left: 5.6, right: 7.4, note: '1.3x' },
  ],
  leftName: 'Women',
  rightName: 'Men',
  leftGroup: 'positive',
  rightGroup: 'negative',
  xLabel: 'current smokers',
  unit: '%',
  title: 'The education gradient in smoking',
  subtitle: 'Current smoking by education and sex (illustrative preview data)',
  source: 'Preview sample',
};

// ── TanStack engine samples (Phase 8) ────────────────────────────────────────

/** FRED-style envelope: a single indicator with string-valued observations. */
export const fredSeries = {
  id: 'CPIAUCSL',
  title: 'Consumer Price Index for All Urban Consumers',
  short_title: 'Consumer Price Index',
  units: 'Index 1982-1984=100',
  observations: Array.from({ length: 40 }, (_, i) => {
    const year = 2015 + Math.floor(i / 4);
    const month = (i % 4) * 3;
    return {
      date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      value: (237 + i * 2.4 + Math.sin(i / 3) * 1.5).toFixed(1),
    };
  }),
};

/** A second FRED-style series in different units, for the indexed comparison. */
export const fredSeriesWages = {
  id: 'CES0500000003',
  title: 'Average Hourly Earnings, Private',
  short_title: 'Average Hourly Earnings',
  units: 'Dollars per hour',
  observations: Array.from({ length: 40 }, (_, i) => {
    const year = 2015 + Math.floor(i / 4);
    const month = (i % 4) * 3;
    return {
      date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      value: (24.7 + i * 0.19 + Math.cos(i / 4) * 0.08).toFixed(2),
    };
  }),
};

export const groupedBarData = {
  rows: [
    { label: 'Under $30k', values: { 'No degree': 61, 'Some college': 44, 'Bachelor+': 29 } },
    { label: '$30-75k', values: { 'No degree': 52, 'Some college': 41, 'Bachelor+': 27 } },
    { label: '$75-150k', values: { 'No degree': 43, 'Some college': 35, 'Bachelor+': 24 } },
    { label: 'Over $150k', values: { 'No degree': 34, 'Some college': 28, 'Bachelor+': 19 } },
  ],
  series: ['No degree', 'Some college', 'Bachelor+'],
  unit: '%',
  mode: 'grouped' as const,
  title: 'Economic pessimism by income and education',
  subtitle: 'Share saying the next generation will be worse off.',
  source: 'Illustrative sample data',
};

export const divergingBarsData = {
  rows: [
    { label: 'Northeast', value: 12.4 },
    { label: 'Pacific', value: 8.1 },
    { label: 'Mountain', value: 2.3 },
    { label: 'Midwest', value: -4.6 },
    { label: 'South', value: -11.2 },
  ],
  reference: 0,
  unit: '%',
  decimals: 1,
  sort: true,
  title: 'Deviation from the national average',
  subtitle: 'Percentage points above or below the all-region mean.',
  source: 'Illustrative sample data',
};

/** ~500 county-like values with a long right tail, for the histogram. */
export const histogramRows = Array.from({ length: 500 }, (_, i) => {
  const a = Math.sin(i * 2.399) * 0.5 + 0.5;
  const b = Math.sin(i * 5.117) * 0.5 + 0.5;
  return { value: Number((22 + (a + b) * 9 + Math.pow(a, 3) * 14).toFixed(2)) };
});
