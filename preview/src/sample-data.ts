import type { ForestPlotData } from '../../registry/components/plot/stats/forest-plot-v1';
import type { D3RidgeData } from '../../registry/components/d3/stats/ridge-v1';
import type { D3SlopegraphData } from '../../registry/components/d3/timeseries/slopegraph-v1';

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
