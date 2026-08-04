'use client';

// TanStack Charts rendering of the FRED-style economic indicator line.
//
// Same data contract as recharts/generic/timeseries-economic-v1 (the card this
// folds into): a FRED series envelope with string-valued observations. The
// parsing and percent-change math are carried over verbatim — this is a
// re-render, not a re-derivation.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, lineY } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackEconomicSeries {
  id: string;
  title: string;
  short_title?: string | null;
  units: string;
  observations: Array<{ date: string; value: string }>;
}

export interface TanstackEconomicProps {
  data: TanstackEconomicSeries;
  /**
   * Explicit semantic domain for the series color. Default null resolves to the
   * theme's categorical cycle at index 0 — the ink default. Never inferred.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  height?: number;
  width?: number;
}

interface Point {
  t: number;
  value: number;
  date: string;
}

export default function TanstackEconomic({
  data,
  colorDomain = null,
  height = 360,
  width,
}: TanstackEconomicProps) {
  const { tsq, colorFor } = useVizTheme();
  // Measure a sibling sentinel, not the chart's own subtree — see the note on
  // the sentinel div below.
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  const rows = React.useMemo<Point[]>(() => {
    return (data?.observations ?? [])
      .map((o) => {
        const value = parseFloat(o.value);
        const t = Date.parse(o.date);
        return Number.isNaN(value) || Number.isNaN(t) ? null : { t, value, date: o.date };
      })
      .filter((d): d is Point => d !== null)
      .sort((a, b) => a.t - b.t);
  }, [data]);

  const stroke = colorFor(colorDomain, 'value', 0);

  // Year boundaries make the only meaningful ticks on a long daily/monthly
  // series; the engine thins them when they collide.
  const yearTicks = React.useMemo(() => {
    if (rows.length === 0) return [];
    const seen = new Set<number>();
    const out: number[] = [];
    for (const r of rows) {
      const y = new Date(r.t).getUTCFullYear();
      if (!seen.has(y)) {
        seen.add(y);
        out.push(Date.UTC(y, 0, 1));
      }
    }
    return out;
  }, [rows]);

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: [
          lineY(rows, {
            x: (d: Point) => d.t,
            y: (d: Point) => d.value,
            stroke,
            strokeWidth: tsq.line.strokeWidth,
          }),
        ],
        // Tick options live under `axis.ticks` — anything at the axis root is
        // silently ignored by this engine (see registry/CURATION.md).
        x: {
          scale: scaleLinear,
          grid: false,
          axis: {
            ticks: {
              values: yearTicks,
              format: (v: number) => String(new Date(v).getUTCFullYear()),
            },
            tickLabels: { thin: { minGap: 44, priority: 'ends' } },
          },
        },
        y: {
          scale: scaleLinear,
          grid: tsq.gridVisible,
          axis: {
            ticks: {
              count: tsq.axis.tickCount,
              format: (v: number) => v.toLocaleString('en-US'),
            },
          },
        },
      }),
    [rows, stroke, yearTicks, tsq],
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
        {data.short_title || data.title}
      </h2>
      <p style={{ fontSize: tsq.text.subtitleSize, margin: '0 0 16px 0', color: tsq.muted }}>
        {data.units}
      </p>

      {/*
        Width sentinel: an empty sibling the chart never renders into, so the
        measurement can't be propped open by the SVG it produces. TanStack skips
        its own ResizeObserver whenever an explicit `width` is supplied.
      */}
      <div
        ref={hostRef}
        aria-hidden
        style={{ width: '100%', height: 1, marginBottom: -1, pointerEvents: 'none' }}
      />
      <div style={{ width: '100%' }}>
        <Chart
          definition={definition}
          ariaLabel={data.short_title || data.title}
          ariaDescription={`${data.title} (${data.units}), ${rows[0].date} to ${rows[rows.length - 1].date}.`}
          height={height}
          width={resolvedWidth}
          tabIndex={0}
        />
      </div>
    </figure>
  );
}
