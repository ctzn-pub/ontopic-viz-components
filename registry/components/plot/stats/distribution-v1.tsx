'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';
import { mergePlot } from '@/viz/theme/adapters/plot';

export interface DistributionRow {
  [key: string]: string | number | null | undefined;
}

export interface DistributionProps {
  /** Rows to histogram. Each row carries the numeric field named by `valueKey`. */
  data: DistributionRow[];
  /** Field on each row holding the numeric value. Default: "value". */
  valueKey?: string;
  /**
   * Optional vertical benchmark rule (e.g. a national-average threshold).
   * Rendered dashed in the theme accent. Default: none.
   */
  benchmark?: number | null;
  title?: string;
  subtitle?: string;
  caption?: string;
  /** X-axis label. */
  xLabel?: string;
  width?: number;
  height?: number;
}

/**
 * Distribution — histogram of a numeric field (binned area + outline) with an
 * optional dashed benchmark rule.
 *
 * Monochrome by design: the binned area and its outline render in the theme's
 * ink; the only color is the accent on the benchmark rule, where it carries
 * meaning. All chrome resolves from the active theme via plotBase/mergePlot.
 */
const Distribution: React.FC<DistributionProps> = ({
  data,
  valueKey = 'value',
  benchmark = null,
  title,
  subtitle,
  caption,
  xLabel = 'Value',
  width = 600,
  height = 400,
}) => {
  const { theme, plotBase } = useVizTheme();
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const rows = (data ?? []).filter(
      (d) => typeof d[valueKey] === 'number' && !Number.isNaN(d[valueKey] as number),
    );
    if (rows.length === 0) return;

    const options = mergePlot(plotBase(), {
      title,
      subtitle,
      caption,
      width,
      height,
      x: { label: xLabel },
      y: { label: 'Count' },
      marks: [
        Plot.areaY(
          rows,
          Plot.binX<Plot.AreaYOptions>(
            { y: 'count', filter: null },
            { x: valueKey, fill: theme.fg, fillOpacity: 0.15 },
          ),
        ),
        Plot.lineY(
          rows,
          Plot.binX<Plot.LineYOptions>(
            { y: 'count', filter: null },
            { x: valueKey, stroke: theme.fg, strokeWidth: theme.stroke, tip: true },
          ),
        ),
        Plot.ruleY([0], { stroke: theme.muted }),
        ...(benchmark != null
          ? [Plot.ruleX([benchmark], { stroke: theme.accent, strokeDasharray: '3 3' })]
          : []),
      ],
    });

    const chart = Plot.plot(options as Plot.PlotOptions);
    chartRef.current.innerHTML = '';
    chartRef.current.append(chart);

    return () => chart.remove();
  }, [data, valueKey, benchmark, title, subtitle, caption, xLabel, width, height, theme, plotBase]);

  return <div ref={chartRef} className="flex justify-center" />;
};

export default Distribution;
