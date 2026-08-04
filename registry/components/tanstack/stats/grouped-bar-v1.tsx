'use client';

// TanStack Charts rendering of the grouped / stacked bar chart.
//
// Same data contract as d3/stats/grouped-bar-v1 (the card this folds into):
// `{ rows: [{ label, values }], series, groups?, mode }`. The D3 version hand-
// rolls the band offsets and the stack accumulation; here both come from the
// engine — one `barY` mark with a `z` series channel and either `group()` or
// `stack()` as its layout. That swap is the whole reason to port this chart.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, barY, group, stack } from '@tanstack/charts';
import { scaleLinear, scaleBand } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackGroupedBarRow {
  /** Category label (x-axis band), e.g. an income bracket. */
  label: string;
  /** Series name → value. */
  values: Record<string, number>;
}

export interface TanstackGroupedBarData {
  rows: TanstackGroupedBarRow[];
  /** Series names, in draw order (also the legend order). */
  series: string[];
  /** Semantic color keys per series (parallel to `series`); else categorical. */
  groups?: string[];
  yLabel?: string;
  yDomain?: [number, number];
  /** Value suffix, e.g. "%". */
  unit?: string;
  /** 'grouped' (side-by-side) | 'stacked'. */
  mode?: 'grouped' | 'stacked';
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface TanstackGroupedBarProps {
  data: TanstackGroupedBarData;
  /**
   * Semantic color domain for group colors. This data conventionally tags
   * groups as 'positive'/'negative', so 'sentiment' is the default; pass
   * 'party' for party-labeled groups or null for the categorical cycle.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  height?: number;
  width?: number;
}

/** One bar, in the long format the engine's band + stack layouts expect. */
interface Bar {
  label: string;
  series: string;
  value: number;
}

export default function TanstackGroupedBar({
  data,
  colorDomain = 'sentiment',
  height = 360,
  width,
}: TanstackGroupedBarProps) {
  const { tsq, colorScale } = useVizTheme();
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  const rows = React.useMemo(() => data?.rows ?? [], [data]);
  const series = React.useMemo(() => data?.series ?? [], [data]);
  const mode = data?.mode ?? 'grouped';
  const unit = data?.unit ?? '';

  // Color keys: explicit `groups` when supplied, else the series names.
  const colorKeys = React.useMemo(
    () => (data?.groups?.length === series.length ? data.groups : series),
    [data, series],
  );
  const scale = React.useMemo(
    () => colorScale(colorDomain, colorKeys),
    [colorScale, colorDomain, colorKeys],
  );
  const colorAt = React.useCallback(
    (i: number) => {
      const key = colorKeys[i];
      const j = scale.domain.indexOf(key);
      return j >= 0 ? scale.range[j] : scale.range[i % scale.range.length];
    },
    [scale, colorKeys],
  );
  const colorBySeries = React.useMemo(() => {
    const m = new Map<string, string>();
    series.forEach((name, i) => m.set(name, colorAt(i)));
    return m;
  }, [series, colorAt]);

  // Wide rows -> long format. One row per (label, series) pair; the engine's
  // `z` channel does the grouping and the stack accumulation.
  const bars = React.useMemo<Bar[]>(() => {
    const out: Bar[] = [];
    for (const row of rows) {
      for (const name of series) {
        const value = Number(row.values?.[name]);
        if (Number.isNaN(value)) continue;
        out.push({ label: row.label, series: name, value });
      }
    }
    return out;
  }, [rows, series]);

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: [
          barY(bars, {
            x: (d: Bar) => d.label,
            y: (d: Bar) => d.value,
            // `z` is the series channel; the layout reads it to place bars
            // side by side or to accumulate them.
            z: (d: Bar) => d.series,
            fill: (d: Bar) => colorBySeries.get(d.series) ?? scale.range[0],
            layout: mode === 'stacked' ? stack() : group(),
          }),
        ],
        x: { scale: scaleBand, grid: false },
        y: {
          scale: scaleLinear,
          ...(data?.yDomain ? { domain: data.yDomain } : {}),
          grid: tsq.gridVisible,
          // Tick options live under `axis.ticks` — root-level keys are silently
          // ignored (see registry/CURATION.md).
          axis: {
            ticks: { count: tsq.axis.tickCount, format: (v: number) => `${v}${unit}` },
          },
        },
      }),
    [bars, colorBySeries, scale, mode, data, unit, tsq],
  );

  if (rows.length === 0 || series.length === 0) {
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
            margin: '0 0 12px 0',
            color: tsq.muted,
          }}
        >
          {data.subtitle}
        </p>
      )}

      {/* Color is the only series cue — the legend is never optional. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          margin: '0 0 12px 0',
          fontSize: tsq.text.annotationSize,
          color: tsq.muted,
        }}
      >
        {series.map((name, i) => (
          <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              aria-hidden
              style={{ width: 10, height: 10, background: colorAt(i), display: 'inline-block' }}
            />
            {name}
          </span>
        ))}
      </div>

      {/* Width sentinel — see registry/components/tanstack/timeseries/line-v1.tsx */}
      <div
        ref={hostRef}
        aria-hidden
        style={{ width: '100%', height: 1, marginBottom: -1, pointerEvents: 'none' }}
      />
      <div style={{ width: '100%' }}>
        <Chart
          definition={definition}
          ariaLabel={data.title ?? `${mode} bar chart`}
          ariaDescription={
            data.subtitle ??
            `${mode === 'stacked' ? 'Stacked' : 'Grouped'} bars comparing ${series.join(', ')} across ${rows.length} categories.`
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
