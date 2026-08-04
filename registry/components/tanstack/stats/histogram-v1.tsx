'use client';

// TanStack Charts rendering of the value-distribution histogram.
//
// Same data contract as plot/stats/distribution-v1 (the card this folds into):
// a row array plus the name of the numeric field to bin, with an optional
// benchmark rule. The binning is the engine's `binX` transform rather than
// hand-rolled bucket maths — the reason this chart is worth porting.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, barY, binX, ruleX } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackHistogramRow {
  [key: string]: string | number | null | undefined;
}

export interface TanstackHistogramProps {
  /** Rows to histogram. Each row carries the numeric field named by `valueKey`. */
  data: TanstackHistogramRow[];
  /** Field on each row holding the numeric value. Default "value". */
  valueKey?: string;
  /** Bin count hint passed to the engine's binning transform. Default 20. */
  bins?: number;
  /**
   * Optional vertical benchmark rule (e.g. a national average). Drawn in the
   * theme accent. Default: none.
   */
  benchmark?: number | null;
  benchmarkLabel?: string;
  /**
   * Explicit semantic domain for the bar fill. Default null resolves to the
   * theme's categorical cycle at index 0 — the ink default. Never inferred.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  title?: string;
  subtitle?: string;
  source?: string;
  /** Value suffix on the x axis, e.g. "%". */
  unit?: string;
  height?: number;
  width?: number;
}

export default function TanstackHistogram({
  data,
  valueKey = 'value',
  bins = 20,
  benchmark = null,
  benchmarkLabel,
  colorDomain = null,
  title,
  subtitle,
  source,
  unit = '',
  height = 360,
  width,
}: TanstackHistogramProps) {
  const { tsq, colorFor } = useVizTheme();
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  // Normalize to a plain numeric field so the bin transform gets a clean
  // column. binX takes a STRING accessor — a function accessor type-checks and
  // silently yields zero bins (see registry/CURATION.md).
  const values = React.useMemo(
    () =>
      (data ?? [])
        .map((row) => Number(row?.[valueKey]))
        .filter((v) => Number.isFinite(v))
        .map((v) => ({ v })),
    [data, valueKey],
  );

  const binned = React.useMemo(
    () => (values.length > 0 ? binX(values, { value: 'v', thresholds: bins }) : []),
    [values, bins],
  );

  const fill = colorFor(colorDomain, 'value', 0);

  // The y axis counts observations, so its ticks must be whole numbers. On a
  // small sample the engine's default density otherwise emits "0.2", "0.4" —
  // fractions of an observation, which don't mean anything. Cap the tick count
  // at the number of whole values available and drop any non-integer tick.
  const maxCount = React.useMemo(
    () => binned.reduce((m: number, b: { value: number }) => Math.max(m, b.value), 0),
    [binned],
  );
  const countTicks = Math.max(2, Math.min(tsq.axis.tickCount, maxCount + 1));

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: [
          // binX emits { x, x1, x2, value } — x1/x2 are the bin edges, so bars
          // butt up against each other the way a histogram's should.
          barY(binned, {
            x1: (d: { x1: number }) => d.x1,
            x2: (d: { x2: number }) => d.x2,
            y: (d: { value: number }) => d.value,
            fill,
          }),
          ...(benchmark != null && Number.isFinite(benchmark)
            ? [
                ruleX([benchmark], {
                  stroke: tsq.accent,
                  strokeWidth: tsq.line.mutedStrokeWidth,
                  strokeDasharray: tsq.gridDasharray ?? '3 3',
                }),
              ]
            : []),
        ],
        x: {
          scale: scaleLinear,
          grid: false,
          // Tick options live under `axis.ticks` — root-level keys are silently
          // ignored (see registry/CURATION.md).
          axis: {
            ticks: { count: tsq.axis.tickCount, format: (v: number) => `${v}${unit}` },
          },
        },
        y: {
          scale: scaleLinear,
          grid: tsq.gridVisible,
          axis: {
            ticks: {
              count: countTicks,
              format: (v: number) => (Number.isInteger(v) ? String(v) : ''),
            },
          },
        },
      }),
    [binned, fill, benchmark, unit, countTicks, tsq],
  );

  if (binned.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: tsq.muted, fontFamily: tsq.fontBody }}>
        No data available to display chart.
      </div>
    );
  }

  return (
    <figure style={{ margin: 0, fontFamily: tsq.fontBody, color: tsq.fg }}>
      {title && (
        <h2
          style={{
            fontFamily: tsq.fontTitle,
            fontSize: tsq.text.titleSize,
            fontWeight: 700,
            lineHeight: 1.15,
            margin: '0 0 6px 0',
            color: tsq.fg,
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          style={{
            fontSize: tsq.text.subtitleSize,
            lineHeight: 1.35,
            margin: '0 0 16px 0',
            color: tsq.muted,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Width sentinel — see registry/components/tanstack/timeseries/line-v1.tsx */}
      <div
        ref={hostRef}
        aria-hidden
        style={{ width: '100%', height: 1, marginBottom: -1, pointerEvents: 'none' }}
      />
      <div style={{ width: '100%' }}>
        <Chart
          definition={definition}
          ariaLabel={title ?? 'Distribution histogram'}
          ariaDescription={
            subtitle ??
            `Histogram of ${values.length} values in ${binned.length} bins${
              benchmark != null ? `, with a benchmark at ${benchmark}${unit}` : ''
            }.`
          }
          height={height}
          width={resolvedWidth}
          tabIndex={0}
        />
      </div>

      {benchmark != null && benchmarkLabel && (
        <p style={{ fontSize: tsq.text.annotationSize, color: tsq.muted, margin: '8px 0 0 0' }}>
          {benchmarkLabel}
        </p>
      )}
      {source && (
        <figcaption style={{ fontSize: tsq.text.sourceSize, color: tsq.muted, marginTop: 12 }}>
          Source: {source}
        </figcaption>
      )}
    </figure>
  );
}
