// registry/theme/adapters/plot.ts
//
// Observable Plot is configured by ONE options object. This adapter produces a
// base you deep-merge with chart-specific options. The one piece of real
// logic: `marks` must CONCATENATE, not overwrite — otherwise a base grid mark
// would clobber the chart's own marks (or vice versa).
//
// Color *resolution* is not done here; a Plot chart passes
// `color: colorScale(domain, categories)` from the hook (provider.tsx), which
// pulls from the same `theme.semantic` Recharts uses. Same data, same output.

import { Theme } from '../themes';

export interface PlotOptions {
  style?: Record<string, unknown>;
  x?: Record<string, unknown>;
  y?: Record<string, unknown>;
  color?: Record<string, unknown>;
  marks?: unknown[];
  [key: string]: unknown;
}

export function plotBase(theme: Theme): PlotOptions {
  return {
    style: {
      fontFamily: theme.fontBody,
      color: theme.fg,
      background: 'transparent',
    },
    x: { tickSize: 4 },
    y: { grid: theme.gridStyle !== 'none', tickSize: 0 },
  };
}

/** Deep-ish merge: concatenates `marks`, shallow-merges scale/style objects. */
export function mergePlot(base: PlotOptions, chart: PlotOptions): PlotOptions {
  return {
    ...base,
    ...chart,
    style: { ...base.style, ...chart.style },
    x: { ...base.x, ...chart.x },
    y: { ...base.y, ...chart.y },
    color: { ...base.color, ...chart.color },
    marks: [...(base.marks ?? []), ...(chart.marks ?? [])],
  };
}
