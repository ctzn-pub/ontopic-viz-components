'use client';

// TanStack Charts rendering of the indexed two-series comparison.
//
// Same data contract as recharts/generic/timeseries-index-v1 (the card this
// folds into): two FRED-style series envelopes. Both are re-based to their
// first in-window observation and plotted as percent change from that base,
// which is what makes series in different units comparable. A rule at 0 marks
// the common baseline.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, lineY, ruleY } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackIndexSeries {
  id: string;
  title: string;
  units?: string;
  observations: Array<{ date: string; value: string }>;
}

export interface TanstackIndexProps {
  series1: TanstackIndexSeries;
  series2: TanstackIndexSeries;
  /**
   * Explicit semantic domain for the two series colors. Default null resolves
   * to the theme's categorical cycle (ink first, then grey) — the restrained
   * default for a two-line comparison. Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  title?: string;
  subtitle?: string;
  source?: string;
  height?: number;
  width?: number;
}

interface Point {
  t: number;
  value: number;
}

/** Parse to sorted numeric points, then re-base to percent change from the first. */
function toIndexed(series: TanstackIndexSeries): Point[] {
  const parsed = (series?.observations ?? [])
    .map((o) => {
      const value = parseFloat(o.value);
      const t = Date.parse(o.date);
      return Number.isNaN(value) || Number.isNaN(t) ? null : { t, value };
    })
    .filter((p): p is Point => p !== null)
    .sort((a, b) => a.t - b.t);

  if (parsed.length === 0) return [];
  const base = parsed[0].value;
  // A zero base makes percent change undefined — leave the series unindexed
  // rather than emitting Infinity.
  if (!Number.isFinite(base) || base === 0) return parsed;
  return parsed.map((p) => ({ t: p.t, value: ((p.value - base) / base) * 100 }));
}

/**
 * Tick precision chosen ONCE from the full plotted span, so every label on the
 * axis carries the same number of decimals.
 *
 * Rounding to whole percent looks right on a wide series but collapses a narrow
 * one into duplicate ticks ("0% | 0% | +1% | +1%"); picking decimals per tick
 * instead gives a ragged axis ("0.00% | +5.0% | +10%"). Deriving it from the
 * span once avoids both.
 */
function makePercentFormat(points: Point[]): (v: number) => string {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    if (p.value < lo) lo = p.value;
    if (p.value > hi) hi = p.value;
  }
  const span = Number.isFinite(hi - lo) ? hi - lo : 0;
  const decimals = span >= 10 ? 0 : span >= 2 ? 1 : 2;
  return (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

export default function TanstackIndexChart({
  series1,
  series2,
  colorDomain = null,
  title,
  subtitle,
  source,
  height = 380,
  width,
}: TanstackIndexProps) {
  const { tsq, colorScale } = useVizTheme();
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  const a = React.useMemo(() => toIndexed(series1), [series1]);
  const b = React.useMemo(() => toIndexed(series2), [series2]);

  const names = React.useMemo(
    () => [series1?.title ?? 'Series 1', series2?.title ?? 'Series 2'],
    [series1, series2],
  );
  const scale = React.useMemo(
    () => colorScale(colorDomain, names),
    [colorScale, colorDomain, names],
  );

  const percentFormat = React.useMemo(() => makePercentFormat([...a, ...b]), [a, b]);

  const yearTicks = React.useMemo(() => {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const p of [...a, ...b].sort((x, y) => x.t - y.t)) {
      const y = new Date(p.t).getUTCFullYear();
      if (!seen.has(y)) {
        seen.add(y);
        out.push(Date.UTC(y, 0, 1));
      }
    }
    return out;
  }, [a, b]);

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: [
          // The shared baseline every series is measured against.
          ruleY([0], { stroke: tsq.axis.stroke, strokeWidth: tsq.line.mutedStrokeWidth }),
          lineY(a, {
            x: (d: Point) => d.t,
            y: (d: Point) => d.value,
            stroke: scale.range[0],
            strokeWidth: tsq.line.strokeWidth,
          }),
          lineY(b, {
            x: (d: Point) => d.t,
            y: (d: Point) => d.value,
            stroke: scale.range[1] ?? scale.range[0],
            strokeWidth: tsq.line.strokeWidth,
          }),
        ],
        // Tick options live under `axis.ticks` — root-level keys are silently
        // ignored (see registry/CURATION.md).
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
              // Signed, because the whole point is movement away from the base.
              format: percentFormat,
            },
          },
        },
      }),
    [a, b, scale, yearTicks, tsq],
  );

  if (a.length === 0 && b.length === 0) {
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
      <p
        style={{
          fontSize: tsq.text.subtitleSize,
          lineHeight: 1.35,
          margin: '0 0 12px 0',
          color: tsq.muted,
        }}
      >
        {subtitle ?? 'Percent change from the first observation in the window.'}
      </p>

      {/* Color is the only thing separating the two series. */}
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
        {names.map((name, i) => (
          <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              aria-hidden
              style={{
                width: 10,
                height: 2,
                background: scale.range[i] ?? scale.range[0],
                display: 'inline-block',
              }}
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
          ariaLabel={title ?? `${names[0]} versus ${names[1]}, indexed`}
          ariaDescription={
            subtitle ?? `${names[0]} and ${names[1]} as percent change from their first observation.`
          }
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
