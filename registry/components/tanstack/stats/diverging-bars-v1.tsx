'use client';

// TanStack Charts rendering of the diverging (signed) bar chart.
//
// Same data contract as d3/stats/diverging-bars-v1 (the card this folds into):
// `{ rows: [{ label, value, detail? }], reference?, sort? }`. Bars extend right
// for values above the reference and left for values below it, off a rule at
// the reference itself.
//
// COLOR: sign is the meaning here, so the two directions resolve through the
// 'sentiment' domain ('positive' / 'negative') rather than a categorical cycle.
// Direction is also encoded by position — color is never the only cue.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, barX, ruleX } from '@tanstack/charts';
import { scaleLinear, scaleBand } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackDivergingBarRow {
  label: string;
  /** Signed value — positive bars extend right, negative left, from the center. */
  value: number;
  /** Optional tooltip detail line. */
  detail?: string;
}

export interface TanstackDivergingBarsData {
  rows: TanstackDivergingBarRow[];
  /** Center/reference value (default 0). */
  reference?: number;
  xLabel?: string;
  xDomain?: [number, number];
  /** Value suffix, e.g. "%". */
  unit?: string;
  /** Sort by value descending (default keeps data order). */
  sort?: boolean;
  /** Number formatting: signed integer by default. */
  decimals?: number;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface TanstackDivergingBarsProps {
  data: TanstackDivergingBarsData;
  /**
   * Semantic color domain for the two directions. Defaults to 'sentiment',
   * which is what makes above/below the reference read correctly. Never
   * inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  height?: number;
  width?: number;
}

export default function TanstackDivergingBars({
  data,
  colorDomain = 'sentiment',
  height = 360,
  width,
}: TanstackDivergingBarsProps) {
  const { tsq, colorFor } = useVizTheme();
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  const reference = data?.reference ?? 0;
  const unit = data?.unit ?? '';
  const decimals = data?.decimals ?? 0;

  const rows = React.useMemo(() => {
    const clean = (data?.rows ?? []).filter((r) => !Number.isNaN(Number(r.value)));
    return data?.sort ? [...clean].sort((a, b) => b.value - a.value) : clean;
  }, [data]);

  const positive = colorFor(colorDomain, 'positive', 0);
  const negative = colorFor(colorDomain, 'negative', 1);

  const xDomain = React.useMemo(() => {
    if (data?.xDomain) return data.xDomain;
    // Symmetric around the reference so equal magnitudes read as equal bars.
    let span = 0;
    for (const r of rows) span = Math.max(span, Math.abs(r.value - reference));
    span = span || 1;
    return [reference - span, reference + span] as [number, number];
  }, [data, rows, reference]);

  const fmt = React.useCallback(
    (v: number) => `${v.toFixed(decimals)}${unit}`,
    [decimals, unit],
  );

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.wideRightMargin,
        marks: [
          barX(rows, {
            y: (d: TanstackDivergingBarRow) => d.label,
            x1: () => reference,
            x2: (d: TanstackDivergingBarRow) => d.value,
            fill: (d: TanstackDivergingBarRow) => (d.value >= reference ? positive : negative),
          }),
          // The reference line is the chart's spine — drawn over the bars so it
          // stays readable where bars meet it.
          ruleX([reference], { stroke: tsq.axis.stroke, strokeWidth: tsq.line.mutedStrokeWidth }),
        ],
        y: { scale: scaleBand, grid: false },
        x: {
          scale: scaleLinear,
          domain: xDomain,
          grid: tsq.gridVisible,
          // Tick options live under `axis.ticks` — root-level keys are silently
          // ignored (see registry/CURATION.md).
          axis: { ticks: { count: tsq.axis.tickCount, format: fmt } },
        },
      }),
    [rows, reference, positive, negative, xDomain, fmt, tsq],
  );

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: tsq.muted, fontFamily: tsq.fontBody }}>
        No data available to display chart.
      </div>
    );
  }

  return (
    <figure style={{ margin: 0, fontFamily: tsq.fontBody, color: tsq.fg }}>
      {data.title && (
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
          {data.title}
        </h2>
      )}
      {data.subtitle && (
        <p
          style={{
            fontSize: tsq.text.subtitleSize,
            lineHeight: 1.35,
            margin: '0 0 16px 0',
            color: tsq.muted,
          }}
        >
          {data.subtitle}
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
          ariaLabel={data.title ?? 'Diverging bar chart'}
          ariaDescription={
            data.subtitle ??
            `${rows.length} categories, bars diverging from ${fmt(reference)}${data.xLabel ? ` on ${data.xLabel}` : ''}.`
          }
          height={height}
          width={resolvedWidth}
          tabIndex={0}
        />
      </div>

      {data.source && (
        <figcaption style={{ fontSize: tsq.text.sourceSize, color: tsq.muted, marginTop: 12 }}>
          Source: {data.source}
        </figcaption>
      )}
    </figure>
  );
}
