'use client';

// TanStack Charts rendering of the canonical survey time-series line.
//
// Same data contract as recharts/generic/timeseries-metadata-v1 (the card this
// folds into) so a consumer can swap the import and nothing else. What the
// TanStack version buys:
//   - keyboard focus + point-level a11y from the engine (`ariaLabel` is a
//     REQUIRED prop; onFocusChange gives us focus state without hand-rolling
//     hit-rects the way the D3 components do)
//   - a declarative mark grammar, so the CI ribbon is `areaY` rather than a
//     bespoke <ErrorBar> shape
//
// REQUIRES REACT 19 — @tanstack/react-charts' peer. Every other engine in this
// registry still supports React 18; see docs/SETUP.md before installing.

import * as React from 'react';
import { Chart } from '@tanstack/react-charts';
import { defineChart, lineY } from '@tanstack/charts';
import { areaY } from '@tanstack/charts/area';
import { dot } from '@tanstack/charts/dot';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface TanstackTimeSeriesPoint {
  year: string | number;
  value: number;
  ci_lower?: number | null;
  ci_upper?: number | null;
  standard_error?: number | null;
  n_actual?: number | null;
}

export interface TanstackTimeSeriesMetadata {
  title?: string;
  subtitle?: string;
  question?: string;
  source?: { id?: string; name?: string };
  observations?: number;
}

export interface TanstackTimeSeriesData {
  data: TanstackTimeSeriesPoint[];
  metadata?: TanstackTimeSeriesMetadata;
  dataPointMetadata?: { id: string; value_prefix?: unknown; value_suffix?: unknown }[];
}

export interface TanstackTimeSeriesLineProps extends TanstackTimeSeriesData {
  /**
   * Explicit semantic domain for the series color. Default null resolves to the
   * theme's categorical cycle at index 0 — the ink default. Never inferred.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  /** Series label, used for the semantic color lookup and the aria label. */
  seriesName?: string;
  /** Show the 95% CI ribbon when ci_lower/ci_upper (or standard_error) exist. */
  showCI?: boolean;
  height?: number;
  width?: number;
}

/** 95% CI from explicit bounds, else from the standard error. */
function ciBounds(d: TanstackTimeSeriesPoint): { lo: number; hi: number } | null {
  if (d.ci_lower != null && d.ci_upper != null) return { lo: d.ci_lower, hi: d.ci_upper };
  if (typeof d.standard_error === 'number' && !Number.isNaN(d.standard_error)) {
    return { lo: d.value - 1.96 * d.standard_error, hi: d.value + 1.96 * d.standard_error };
  }
  return null;
}

export default function TanstackTimeSeriesLine({
  data,
  metadata,
  dataPointMetadata,
  colorDomain = null,
  seriesName = 'Overall',
  showCI = true,
  height = 360,
  width,
}: TanstackTimeSeriesLineProps) {
  const { tsq, colorFor } = useVizTheme();
  // Measure the available width ourselves. TanStack derives its width from
  // `options.width ?? container.getBoundingClientRect().width` and disables its
  // own ResizeObserver whenever a `width` is supplied, so measuring a sibling
  // sentinel (below) — rather than anything inside the chart's own subtree —
  // keeps the rendered width from feeding back in as the next input. This also
  // makes resize behaviour identical across every engine in this registry.
  // An explicit `width` prop still wins.
  const [hostRef, measuredWidth] = useResize<HTMLDivElement>();
  const resolvedWidth = width ?? (measuredWidth > 0 ? measuredWidth : undefined);

  const rows = React.useMemo(
    () =>
      (data ?? [])
        .map((d) => {
          const year = typeof d.year === 'number' ? d.year : parseInt(String(d.year), 10);
          return Number.isNaN(year) ? null : { ...d, year };
        })
        .filter((d): d is TanstackTimeSeriesPoint & { year: number } => d !== null)
        .sort((a, b) => a.year - b.year),
    [data]
  );

  const withCI = React.useMemo(
    () =>
      rows
        .map((d) => {
          const b = ciBounds(d);
          return b ? { year: d.year, lo: b.lo, hi: b.hi } : null;
        })
        .filter((d): d is { year: number; lo: number; hi: number } => d !== null),
    [rows]
  );

  // The survey years themselves are the meaningful tick candidates. TanStack
  // thins them if they collide (see `tickLabels.thin` below) — no need to
  // pre-decimate here, which would fight its collision logic.
  const tickYears = React.useMemo(() => rows.map((d) => d.year), [rows]);

  const stroke = colorFor(colorDomain, seriesName, 0);
  const suffix =
    (dataPointMetadata?.find((m) => m.id === 'value')?.value_suffix as string | undefined) ?? '%';

  const definition = React.useMemo(
    () =>
      defineChart({
        theme: tsq.chartTheme,
        margin: tsq.margin,
        marks: [
          // CI ribbon first so the line paints over it.
          ...(showCI && withCI.length > 0
            ? [
                areaY(withCI, {
                  x: (d: { year: number }) => d.year,
                  y1: (d: { lo: number }) => d.lo,
                  y2: (d: { hi: number }) => d.hi,
                  fill: stroke,
                  fillOpacity: 0.12,
                }),
              ]
            : []),
          lineY(rows, {
            x: (d: TanstackTimeSeriesPoint & { year: number }) => d.year,
            y: (d: TanstackTimeSeriesPoint) => d.value,
            stroke,
            strokeWidth: tsq.line.strokeWidth,
          }),
          dot(rows, {
            x: (d: TanstackTimeSeriesPoint & { year: number }) => d.year,
            y: (d: TanstackTimeSeriesPoint) => d.value,
            fill: tsq.surface,
            stroke,
            r: tsq.point.r,
          }),
        ],
        // Tick formatting lives under `axis.ticks.format` — a bare `tickFormat`
        // at the axis root is silently ignored (the options object is loosely
        // typed, so tsc won't catch the typo; verified against the rendered
        // labels instead).
        x: {
          scale: scaleLinear,
          grid: false,
          axis: {
            ticks: {
              // Survey years are the meaningful candidates — a generic tick
              // `count` makes TanStack pick round numbers (2010, 2015…) that
              // aren't in the data at all.
              values: tickYears,
              // Years are plain integers, never 1,995-style grouped numbers.
              format: (v: number) => String(Math.round(v)),
            },
            // Let the engine drop labels only when they'd actually collide,
            // and never drop the first/last observation.
            tickLabels: {
              thin: {
                // A 4-digit year is ~28px at our tick size; 40 leaves a clear
                // gutter without the engine's conservative default dropping
                // every interior label.
                minGap: 40,
                priority: 'ends',
                keep: [tickYears[0], tickYears[tickYears.length - 1]],
              },
            },
          },
        },
        y: {
          scale: scaleLinear,
          grid: tsq.gridVisible,
          axis: {
            ticks: {
              count: tsq.axis.tickCount,
              format: (v: number) => `${v}${suffix}`,
            },
          },
        },
      }),
    [rows, withCI, showCI, stroke, suffix, tickYears, tsq]
  );

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: tsq.muted, fontFamily: tsq.fontBody }}>
        No data available to display chart.
      </div>
    );
  }

  const title = metadata?.title;
  const subtitle = metadata?.subtitle;

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

      {/*
        TanStack sizes itself from its container via ResizeObserver, but that
        observer is skipped entirely when a `width` prop is passed, and it can
        latch onto a collapsed box if the host's own CSS makes the container's
        width depend on the child (e.g. an `overflow: auto` wrapper). A plain
        block wrapper with an explicit 100% width gives it something stable to
        measure, so the chart tracks the real available width.
      */}
      {/*
        Width sentinel: an empty sibling the chart never renders into, so the
        measurement can't be propped open by the SVG it produces.
      */}
      <div
        ref={hostRef}
        aria-hidden
        style={{
          width: '100%',
          // 1px rather than 0, pulled back out of flow by the negative margin:
          // a zero-size box is the case most likely to be skipped by a
          // ResizeObserver, and it costs no layout either way.
          height: 1,
          marginBottom: -1,
          pointerEvents: 'none',
        }}
      />
      <div style={{ width: '100%' }}>
      <Chart
        definition={definition}
        ariaLabel={title ?? `${seriesName} over time`}
        ariaDescription={
          subtitle ??
          `Line chart of ${seriesName} from ${rows[0].year} to ${rows[rows.length - 1].year}.`
        }
        height={height}
        width={resolvedWidth}
        tabIndex={0}
      />
      </div>

      {metadata?.source?.name && (
        <figcaption
          style={{ fontSize: tsq.text.sourceSize, color: tsq.muted, marginTop: 12 }}
        >
          Source: {metadata.source.name}
          {metadata.observations
            ? ` (${metadata.observations.toLocaleString()} observations)`
            : ''}
        </figcaption>
      )}
    </figure>
  );
}
