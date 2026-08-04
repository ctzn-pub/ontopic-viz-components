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
import {
  caterpillarData,
  dataPointMetadata,
  dumbbellData,
  forestData,
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
