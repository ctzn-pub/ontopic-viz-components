import type { ReactNode } from 'react';
import { KeyNumber } from '../../registry/components/article/KeyNumber';
import Caterpillar from '../../registry/components/d3/stats/caterpillar-v1';
import GradientSlopes from '../../registry/components/d3/stats/gradient-slopes-v1';
import type { GradientSlopesData } from '../../registry/components/d3/stats/gradient-slopes-v1';
import ScoreGauge from '../../registry/components/d3/stats/score-gauge-v1';
import type { ScoreGaugeData } from '../../registry/components/d3/stats/score-gauge-v1';
import StripRidge from '../../registry/components/d3/stats/strip-ridge-v1';
import type { StripRidgeData } from '../../registry/components/d3/stats/strip-ridge-v1';
import gradientSlopesJson from './data/d3-gradient-slopes.json';
import scoreGaugeJson from './data/d3-score-gauge.json';
import stripRidgeJson from './data/d3-strip-ridge.json';

const gradientSlopesData = gradientSlopesJson as unknown as GradientSlopesData;
const scoreGaugeData = scoreGaugeJson as unknown as ScoreGaugeData;
const stripRidgeData = stripRidgeJson as unknown as StripRidgeData;
import Dumbbell from '../../registry/components/d3/stats/dumbbell-v1';
import SlopegraphD3 from '../../registry/components/d3/timeseries/slopegraph-v1';
import ForestPlot from '../../registry/components/plot/stats/forest-plot-v1';
import Ridge from '../../registry/components/d3/stats/ridge-v1';
import MultiLine from '../../registry/components/plot/timeseries/multiline-v1';
import TimeSeriesChart from '../../registry/components/recharts/generic/timeseries-metadata-v1';
import TanstackTimeSeriesLine from '../../registry/components/tanstack/timeseries/line-v1';
import TanstackEconomic from '../../registry/components/tanstack/timeseries/economic-v1';
import TanstackIndexChart from '../../registry/components/tanstack/timeseries/index-v1';
import TanstackMultiLine from '../../registry/components/tanstack/timeseries/multiline-v1';
import TanstackGroupedBar from '../../registry/components/tanstack/stats/grouped-bar-v1';
import TanstackDivergingBars from '../../registry/components/tanstack/stats/diverging-bars-v1';
import TanstackHistogram from '../../registry/components/tanstack/stats/histogram-v1';
import {
  caterpillarData,
  dataPointMetadata,
  divergingBarsData,
  dumbbellData,
  forestData,
  fredSeries,
  fredSeriesWages,
  groupedBarData,
  histogramRows,
  partyRows,
  ridgeData,
  slopeData,
  timeSeriesData,
  timeSeriesMetadata,
} from './sample-data';

export interface LiveExample {
  path: string;
  title: string;
  description: string;
  span?: 'wide' | 'standard';
  render: () => ReactNode;
}

export const liveExamples: LiveExample[] = [
  {
    path: 'registry/components/recharts/generic/timeseries-metadata-v1.tsx',
    title: 'Recharts time series',
    description: 'Single-series line chart with confidence intervals and themed chrome.',
    span: 'wide',
    render: () => (
      <TimeSeriesChart
        data={timeSeriesData}
        metadata={timeSeriesMetadata}
        dataPointMetadata={dataPointMetadata}
      />
    ),
  },
  {
    path: 'registry/components/tanstack/timeseries/line-v1.tsx',
    title: 'TanStack time series',
    description: 'Same data as the Recharts card above, rendered with TanStack Charts.',
    span: 'wide',
    render: () => (
      <TanstackTimeSeriesLine
        data={timeSeriesData}
        metadata={timeSeriesMetadata}
        dataPointMetadata={dataPointMetadata}
      />
    ),
  },
  {
    path: 'registry/components/tanstack/timeseries/multiline-v1.tsx',
    title: 'TanStack party multiline',
    description:
      'The same party rows as the Plot card below — the semantic colors must match exactly.',
    span: 'wide',
    render: () => (
      <TanstackMultiLine
        data={partyRows}
        xKey="year"
        yKey="value"
        groupKey="party"
        colorDomain="party"
        title="Approval by party"
        subtitle="Semantic party colors, resolved through the same scale the Plot engine uses."
        unit="%"
      />
    ),
  },
  {
    path: 'registry/components/tanstack/timeseries/economic-v1.tsx',
    title: 'TanStack economic indicator',
    description: 'A FRED-style series with year-boundary ticks and locale-formatted values.',
    span: 'wide',
    render: () => <TanstackEconomic data={fredSeries} />,
  },
  {
    path: 'registry/components/tanstack/timeseries/index-v1.tsx',
    title: 'TanStack indexed comparison',
    description:
      'Two series in different units, re-based to percent change from their first observation.',
    span: 'wide',
    render: () => (
      <TanstackIndexChart
        series1={fredSeries}
        series2={fredSeriesWages}
        title="Prices versus wages"
        source="Illustrative sample data"
      />
    ),
  },
  {
    path: 'registry/components/tanstack/stats/grouped-bar-v1.tsx',
    title: 'TanStack grouped bars',
    description: 'Band placement and stacking come from the engine, not hand-rolled offsets.',
    span: 'wide',
    render: () => <TanstackGroupedBar data={groupedBarData} colorDomain={null} />,
  },
  {
    path: 'registry/components/tanstack/stats/diverging-bars-v1.tsx',
    title: 'TanStack diverging bars',
    description: 'Signed values either side of a reference rule; direction is position and color.',
    render: () => <TanstackDivergingBars data={divergingBarsData} />,
  },
  {
    path: 'registry/components/tanstack/stats/histogram-v1.tsx',
    title: 'TanStack histogram',
    description: 'Binned by the engine transform, with a dashed benchmark rule.',
    render: () => (
      <TanstackHistogram
        data={histogramRows}
        valueKey="value"
        bins={24}
        benchmark={38}
        benchmarkLabel="Dashed rule marks the national average."
        title="Distribution of county rates"
        subtitle="Five hundred counties, binned by the chart engine."
        unit="%"
        source="Illustrative sample data"
      />
    ),
  },
  {
    path: 'registry/components/plot/timeseries/multiline-v1.tsx',
    title: 'Plot party multiline',
    description: 'Observable Plot chart using the party semantic color domain.',
    span: 'wide',
    render: () => (
      <MultiLine
        data={partyRows}
        xKey="year"
        yKey="value"
        groupKey="party"
        colorDomain="party"
        title="Approval by party"
        subtitle="The same semantic colors should match the Recharts engine."
        yFormat="percent"
        showIndexSlider={false}
        width={620}
        height={360}
      />
    ),
  },
  {
    path: 'registry/components/d3/timeseries/slopegraph-v1.tsx',
    title: 'D3 slopegraph',
    description: 'SVG slopegraph with focus states and theme-driven D3 adapter values.',
    render: () => <SlopegraphD3 data={slopeData} width={560} height={360} />,
  },
  {
    path: 'registry/components/plot/stats/forest-plot-v1.tsx',
    title: 'Plot forest plot',
    description: 'Odds ratios across strata with a shared categorical scale.',
    render: () => <ForestPlot data={forestData} width={560} />,
  },
  {
    path: 'registry/components/d3/stats/ridge-v1.tsx',
    title: 'D3 ridge',
    description: 'Ridgeline distributions with region focus, driven by the D3 theme adapter.',
    render: () => <Ridge data={ridgeData} width={560} xLabel="prevalence (%) ->" />,
  },
  {
    path: 'registry/components/d3/stats/caterpillar-v1.tsx',
    title: 'D3 caterpillar',
    description: 'Sorted estimates with CI whiskers — upstreamed from ctzn-pub, adapter-themed.',
    render: () => <Caterpillar data={caterpillarData} width={560} />,
  },
  {
    path: 'registry/components/d3/stats/dumbbell-v1.tsx',
    title: 'D3 dumbbell',
    description: 'Two-endpoint gap rows — upstreamed from ctzn-pub, adapter-themed.',
    render: () => <Dumbbell data={dumbbellData} width={560} />,
  },
  {
    path: 'registry/components/d3/stats/strip-ridge-v1.tsx',
    title: 'Strip ridge (health atlas)',
    description: 'Tail-trimmed distribution strip with ramp fill and benchmark markers.',
    render: () => <StripRidge data={stripRidgeData} width={560} />,
  },
  {
    path: 'registry/components/d3/stats/score-gauge-v1.tsx',
    title: 'Score gauge (health atlas)',
    description: 'Semicircular 0-100 gauge on the sentiment continuum.',
    render: () => <ScoreGauge data={scoreGaugeData} width={260} />,
  },
  {
    path: 'registry/components/d3/stats/gradient-slopes-v1.tsx',
    title: 'Gradient slopes (health atlas)',
    description: 'All measures normalized to decile 1 on a log scale — slope = inequality.',
    span: 'wide',
    render: () => <GradientSlopes data={gradientSlopesData} width={620} />,
  },
  {
    path: 'registry/components/article/KeyNumber.tsx',
    title: 'Article key number',
    description: 'Editorial article primitive for a single number and short caption.',
    render: () => (
      <KeyNumber
        value="55.3"
        unit="%"
        label="Sample support estimate used to test article typography in the preview shell."
        change="+14.1 since 2000"
      />
    ),
  },
];

export const livePaths = new Set(liveExamples.map((example) => example.path));
