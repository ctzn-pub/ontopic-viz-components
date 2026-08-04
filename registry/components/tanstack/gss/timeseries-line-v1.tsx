'use client';

// TanStack Charts rendering of the flagship GSS survey time trend.
//
// Same data envelope as recharts/gss/timeseries-line-v1 (the card this folds
// into): `{ metadata, dataPoints, dataPointMetadata }`, with demographic
// columns riding along on each point. Like the Recharts flagship, the series
// list is derived from the payload's own dataPointMetadata when it isn't
// passed explicitly, so a data-only gallery render works with no wiring.
//
// SCOPE: this is the chart, not the app chrome. The Recharts flagship also
// carries presidential reference bands, a CI toggle, and compact/embedded
// layout modes that exist to serve specific ctzn.pub surfaces; those stay
// there. Porting them here would duplicate product decisions, not rendering.
//
// REQUIRES REACT 19 — see registry/CURATION.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, lineY } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackGssDataPoint {
  year: string | number | null;
  value: number | null;
  ci_lower?: number | null;
  ci_upper?: number | null;
  n_actual?: number | null;
  standard_error?: number | null;
  /** Demographic columns (e.g. PolParty: "Democrat") ride along untyped. */
  [key: string]: unknown;
}

export interface TanstackGssMetadataItem {
  id: string;
  categories?: string[];
  value_prefix?: string | object;
  value_suffix?: string | object;
  [key: string]: unknown;
}

export interface TanstackGssData {
  metadata: {
    title: string;
    subtitle?: string;
    question?: string;
    source?: { name: string; id?: string };
    observations?: number;
    [key: string]: unknown;
  };
  dataPoints: TanstackGssDataPoint[];
  dataPointMetadata: TanstackGssMetadataItem[];
}

export interface TanstackGssTimeSeriesProps {
  data: TanstackGssData;
  /**
   * Demographic groups to draw as series (e.g. ["Democrat", "Republican"]).
   * Derived from dataPointMetadata when omitted.
   */
  demographicGroups?: string[];
  /**
   * The dataPoints field holding the group label (e.g. "PolParty"). Derived
   * from dataPointMetadata when omitted.
   */
  demographic?: string;
  /**
   * Explicit semantic domain for the series colors. Party-labeled GSS splits
   * should pass 'party'; default null uses the theme's categorical cycle.
   * Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  height?: number;
  width?: number;
}

interface Point {
  year: number;
  value: number;
}

export default function TanstackGssTimeSeries({
  data,
  demographicGroups,
  demographic,
  colorDomain = null,
  height = 380,
  width,
}: TanstackGssTimeSeriesProps) {
  const { tsq, colorScale, colorFor } = useVizTheme();
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  const points = React.useMemo(() => data?.dataPoints ?? [], [data]);
  const meta = React.useMemo(() => data?.dataPointMetadata ?? [], [data]);

  // Fall back to the payload's own metadata: the first non-"value" entry that
  // lists categories describes the demographic split. Explicit props win.
  const derived = React.useMemo(
    () => meta.find((m) => m.id !== 'value' && Array.isArray(m.categories) && m.categories.length > 0),
    [meta],
  );
  const groupField = demographic ?? derived?.id ?? null;
  const groups = React.useMemo(
    () => demographicGroups ?? (derived?.categories as string[] | undefined) ?? [],
    [demographicGroups, derived],
  );

  const suffix = React.useMemo(() => {
    const s = meta.find((m) => m.id === 'value')?.value_suffix;
    return typeof s === 'string' ? s : '%';
  }, [meta]);

  /** Ordered points for one series (or the whole payload when ungrouped). */
  const seriesOf = React.useCallback(
    (group: string | null): Point[] =>
      points
        .filter((p) => (group == null || !groupField ? true : String(p[groupField]) === group))
        .map((p) => {
          const year = typeof p.year === 'number' ? p.year : parseInt(String(p.year ?? ''), 10);
          const value = typeof p.value === 'number' ? p.value : NaN;
          return Number.isNaN(year) || Number.isNaN(value) ? null : { year, value };
        })
        .filter((p): p is Point => p !== null)
        .sort((a, b) => a.year - b.year),
    [points, groupField],
  );

  const series = React.useMemo(() => {
    if (groupField && groups.length > 0) {
      return groups
        .map((name) => ({ name, points: seriesOf(name) }))
        .filter((s) => s.points.length > 0);
    }
    const all = seriesOf(null);
    return all.length > 0 ? [{ name: 'Overall', points: all }] : [];
  }, [groupField, groups, seriesOf]);

  const names = React.useMemo(() => series.map((s) => s.name), [series]);
  const scale = React.useMemo(
    () => colorScale(colorDomain, names),
    [colorScale, colorDomain, names],
  );
  const colorOf = React.useCallback(
    (name: string, i: number) => {
      // Single ungrouped series: ink, the Tufte default.
      if (names.length === 1) return colorFor(colorDomain, name, 0);
      const j = scale.domain.indexOf(name);
      return j >= 0 ? scale.range[j] : scale.range[i % scale.range.length];
    },
    [scale, names, colorFor, colorDomain],
  );

  const tickYears = React.useMemo(() => {
    const all = new Set<number>();
    for (const s of series) for (const p of s.points) all.add(p.year);
    return [...all].sort((a, b) => a - b);
  }, [series]);

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: series.map((s, i) =>
          lineY(s.points, {
            x: (d: Point) => d.year,
            y: (d: Point) => d.value,
            stroke: colorOf(s.name, i),
            strokeWidth: tsq.line.strokeWidth,
          }),
        ),
        // Tick options live under `axis.ticks` — root-level keys are silently
        // ignored (see registry/CURATION.md).
        x: {
          scale: scaleLinear,
          grid: false,
          axis: {
            ticks: { values: tickYears, format: (v: number) => String(Math.round(v)) },
            tickLabels: {
              thin: {
                minGap: 40,
                priority: 'ends',
                keep: tickYears.length ? [tickYears[0], tickYears[tickYears.length - 1]] : [],
              },
            },
          },
        },
        y: {
          scale: scaleLinear,
          grid: tsq.gridVisible,
          axis: {
            ticks: { count: tsq.axis.tickCount, format: (v: number) => `${v}${suffix}` },
          },
        },
      }),
    [series, colorOf, tickYears, suffix, tsq],
  );

  if (series.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: tsq.muted, fontFamily: tsq.fontBody }}>
        No data available to display chart.
      </div>
    );
  }

  const { title, subtitle, question, source, observations } = data.metadata;

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

      {series.length > 1 && (
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
          {series.map((s, i) => (
            <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 2,
                  background: colorOf(s.name, i),
                  display: 'inline-block',
                }}
              />
              {s.name}
            </span>
          ))}
        </div>
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
          ariaLabel={title || 'GSS time trend'}
          ariaDescription={
            question ||
            subtitle ||
            `Survey trend for ${names.join(', ')} from ${tickYears[0]} to ${tickYears[tickYears.length - 1]}.`
          }
          height={height}
          width={resolvedWidth}
          tabIndex={0}
        />
      </div>

      {question && (
        <p
          style={{
            fontSize: tsq.text.annotationSize,
            color: tsq.muted,
            margin: '10px 0 0 0',
            fontStyle: 'italic',
          }}
        >
          {question}
        </p>
      )}
      {source?.name && (
        <figcaption style={{ fontSize: tsq.text.sourceSize, color: tsq.muted, marginTop: 12 }}>
          Source: {source.name}
          {observations ? ` (${observations.toLocaleString()} observations)` : ''}
        </figcaption>
      )}
    </figure>
  );
}
