'use client';

// TanStack Charts rendering of the grouped multi-series line.
//
// Same data contract as plot/timeseries/multiline-v1 (the card this folds
// into): long-format rows plus x/y/group keys. This is the first tanstack
// component with more than one series, so it is the one that proves semantic
// color resolution works identically here — the group colors come from
// `colorScale`, exactly as the Plot version gets them. Same data in, same
// colors out, on every engine.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, lineY } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackMultiLineRow {
  [key: string]: string | number | Date | null | undefined;
}

export interface TanstackMultiLineProps {
  data: TanstackMultiLineRow[];
  /**
   * Field holding the x value. Accepts a bare year (1994), a date string, or a
   * Date — the axis labels years either way. Default "year".
   */
  xKey?: string;
  /** Field holding the numeric y value. Default "value". */
  yKey?: string;
  /** Field holding the series name. Default "group". */
  groupKey?: string;
  /**
   * Explicit semantic domain for the series colors. Default null resolves to
   * the theme's categorical cycle. Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  title?: string;
  subtitle?: string;
  source?: string;
  /** Value suffix on the y axis, e.g. "%". */
  unit?: string;
  height?: number;
  width?: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * x values arrive as plain years (1994), date strings, or Date objects — the
 * Plot engine accepts all three, so this one must too. Everything is carried as
 * a number internally; `xIsTemporal` below decides how the axis labels it.
 */
function toX(raw: unknown): number {
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  const s = String(raw ?? '').trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? NaN : parsed;
}

/**
 * Epoch milliseconds and bare years are both "numbers", so the axis has to be
 * told which it is holding. Anything past ~year 10000 in ms is a timestamp; a
 * four-digit year never is.
 */
const TEMPORAL_THRESHOLD = 100000;

export default function TanstackMultiLine({
  data,
  xKey = 'year',
  yKey = 'value',
  groupKey = 'group',
  colorDomain = null,
  title,
  subtitle,
  source,
  unit = '',
  height = 360,
  width,
}: TanstackMultiLineProps) {
  const { tsq, colorScale } = useVizTheme();
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  // Long rows -> one ordered point array per series, series in first-seen order
  // so the legend and the draw order agree.
  const series = React.useMemo(() => {
    const bucket = new Map<string, Point[]>();
    for (const row of data ?? []) {
      const name = String(row[groupKey] ?? '');
      const x = toX(row[xKey]);
      const y = Number(row[yKey]);
      if (!name || Number.isNaN(x) || Number.isNaN(y)) continue;
      if (!bucket.has(name)) bucket.set(name, []);
      bucket.get(name)!.push({ x, y });
    }
    return [...bucket.entries()].map(([name, points]) => ({
      name,
      points: points.sort((a, b) => a.x - b.x),
    }));
  }, [data, xKey, yKey, groupKey]);

  const names = React.useMemo(() => series.map((s) => s.name), [series]);
  // One scale for every series — the same call the Plot engine makes.
  const scale = React.useMemo(
    () => colorScale(colorDomain, names),
    [colorScale, colorDomain, names],
  );
  const colorOf = React.useCallback(
    (name: string) => {
      const i = scale.domain.indexOf(name);
      return i >= 0 ? scale.range[i] : scale.range[0];
    },
    [scale],
  );

  // Timestamps and bare years both reach here as numbers; label them differently.
  const xIsTemporal = React.useMemo(
    () => series.some((s) => s.points.some((p) => Math.abs(p.x) > TEMPORAL_THRESHOLD)),
    [series],
  );

  const xTicks = React.useMemo(() => {
    const all = new Set<number>();
    for (const s of series) {
      for (const p of s.points) {
        // On a temporal axis a tick per observation would label the same year
        // repeatedly; snap to year starts instead.
        all.add(xIsTemporal ? Date.UTC(new Date(p.x).getUTCFullYear(), 0, 1) : p.x);
      }
    }
    return [...all].sort((a, b) => a - b);
  }, [series, xIsTemporal]);

  const xFormat = React.useCallback(
    (v: number) =>
      xIsTemporal ? String(new Date(v).getUTCFullYear()) : String(Math.round(v)),
    [xIsTemporal],
  );

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: series.map((s) =>
          lineY(s.points, {
            x: (d: Point) => d.x,
            y: (d: Point) => d.y,
            stroke: colorOf(s.name),
            strokeWidth: tsq.line.strokeWidth,
          }),
        ),
        // Tick options live under `axis.ticks` — root-level keys are silently
        // ignored by this engine (see registry/CURATION.md).
        x: {
          scale: scaleLinear,
          grid: false,
          axis: {
            ticks: { values: xTicks, format: xFormat },
            tickLabels: {
              thin: {
                minGap: 40,
                priority: 'ends',
                keep: xTicks.length ? [xTicks[0], xTicks[xTicks.length - 1]] : [],
              },
            },
          },
        },
        y: {
          scale: scaleLinear,
          grid: tsq.gridVisible,
          axis: { ticks: { count: tsq.axis.tickCount, format: (v: number) => `${v}${unit}` } },
        },
      }),
    [series, colorOf, xTicks, xFormat, unit, tsq],
  );

  if (series.length === 0) {
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
            margin: '0 0 12px 0',
            color: tsq.muted,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Legend: color is the only thing distinguishing the series, so it is
          never optional. */}
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
        {series.map((s) => (
          <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              aria-hidden
              style={{
                width: 10,
                height: 2,
                background: colorOf(s.name),
                display: 'inline-block',
              }}
            />
            {s.name}
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
          ariaLabel={title ?? `${names.join(', ')} over time`}
          ariaDescription={subtitle ?? `Line chart comparing ${names.join(', ')}.`}
          height={height}
          width={resolvedWidth}
          tabIndex={0}
        />
      </div>

      {source && (
        <figcaption style={{ fontSize: tsq.text.sourceSize, color: tsq.muted, marginTop: 12 }}>
          Source: {source}
        </figcaption>
      )}
    </figure>
  );
}
