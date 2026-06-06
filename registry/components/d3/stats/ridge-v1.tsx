'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { area, curveBasis } from 'd3-shape';
import { useVizTheme } from '@/viz/theme/provider';

export interface D3RidgeRegion {
  region: string;
  /** Raw observations for this group; a KDE is computed from them. */
  values: number[];
  mean: number;
  median: number;
  n_counties?: number;
}

export interface D3RidgeData {
  regions: D3RidgeRegion[];
  grid_min?: number;
  grid_max?: number;
  measure?: string;
  unit?: string;
  n_counties_total?: number;
}

export interface D3RidgeProps {
  data: D3RidgeData;
  mode?: 'ridge' | 'violin';
  xLabel?: string;
  width?: number;
  /** Region to emphasize on first render. */
  highlightRegion?: string | null;
}

interface DensityRow {
  region: D3RidgeRegion;
  baseline: number;
  points: { x: number; d: number }[];
}

function kde(values: number[], grid: number[], bw: number): number[] {
  const n = values.length || 1;
  return grid.map((gx) => {
    let sum = 0;
    for (const value of values) {
      const u = (gx - value) / bw;
      sum += Math.exp(-0.5 * u * u);
    }
    return sum / (n * bw * Math.sqrt(2 * Math.PI));
  });
}

function stdev(values: number[], mean: number): number {
  if (values.length < 2) return 1;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance) || 1;
}

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

/**
 * RidgeD3 — per-group distributions as ridgelines or compact mirrored violins.
 *
 * D3 owns the KDE paths and scales; React owns focus state. The default is a
 * monochrome distribution field with median rules, using the accent only when a
 * region is highlighted or focused.
 */
const RidgeD3: React.FC<D3RidgeProps> = ({
  data,
  mode = 'ridge',
  xLabel,
  width = 760,
  highlightRegion = null,
}) => {
  const { theme, d3 } = useVizTheme();
  const [focusedRegion, setFocusedRegion] = useState<string | null>(highlightRegion);

  useEffect(() => {
    setFocusedRegion(highlightRegion);
  }, [highlightRegion]);

  const regions = data?.regions ?? [];
  const margin = d3.compactMargin;
  const rowGap = mode === 'violin' ? d3.distribution.violinRowGap : d3.distribution.rowGap;
  const rowHeight = mode === 'violin' ? d3.distribution.violinHeight : d3.distribution.rowHeight;
  const chartWidth = Math.max(width, margin.left + margin.right + 1);
  const chartHeight = Math.max(
    margin.top + margin.bottom + rowHeight + 1,
    margin.top + margin.bottom + Math.max(1, regions.length - 1) * rowGap + rowHeight + 1,
  );
  const innerLeft = margin.left + 58;
  const innerRight = chartWidth - margin.right;
  const innerTop = margin.top + rowHeight;
  const innerBottom = chartHeight - margin.bottom;
  const allValues = regions.flatMap((region) => region.values);
  const lo = data?.grid_min ?? (allValues.length ? Math.min(...allValues) : 0);
  const hi = data?.grid_max ?? (allValues.length ? Math.max(...allValues) : 1);
  const xScale = useMemo(
    () => scaleLinear().domain([lo, hi]).nice().range([innerLeft, innerRight]),
    [lo, hi, innerLeft, innerRight],
  );

  const densityRows = useMemo(() => {
    const grid = Array.from(
      { length: d3.distribution.gridPoints },
      (_, i) => lo + ((hi - lo) * i) / Math.max(1, d3.distribution.gridPoints - 1),
    );
    let maxD = 0;
    const computed = regions.map((region, index) => {
      const sd = stdev(region.values, region.mean);
      const bw = 1.06 * sd * Math.pow(Math.max(1, region.values.length), -0.2) || 1;
      const density = kde(region.values, grid, bw);
      maxD = Math.max(maxD, ...density);
      return {
        region,
        baseline: innerTop + index * rowGap,
        points: grid.map((x, i) => ({ x, d: density[i] })),
      } satisfies DensityRow;
    });
    return { rows: computed, maxD: maxD || 1 };
  }, [regions, lo, hi, d3.distribution.gridPoints, innerTop, rowGap]);

  const areaPath = useMemo(
    () =>
      area<{ x: number; d: number }>()
        .x((point) => xScale(point.x))
        .curve(curveBasis),
    [xScale],
  );

  const xTicks = xScale.ticks(6);
  const focused = focusedRegion ? regions.find((region) => region.region === focusedRegion) ?? null : null;
  const ariaLabel = `D3 ${mode} distribution chart with ${regions.length} regions.`;

  function fillFor(region: string): string {
    return region === focusedRegion || region === highlightRegion ? d3.accent : d3.muted;
  }

  function opacityFor(region: string): number {
    if (region === focusedRegion) return 0.9;
    if (region === highlightRegion) return 0.72;
    return focusedRegion ? 0.24 : 0.58;
  }

  if (regions.length === 0) return null;

  return (
    <figure style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody }}>
      <svg
        role="img"
        aria-label={ariaLabel}
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ display: 'block', maxWidth: '100%', height: 'auto', background: d3.surface }}
        onMouseLeave={() => setFocusedRegion(highlightRegion)}
      >
        <title>{mode === 'violin' ? 'Violin distributions' : 'Ridgeline distributions'}</title>
        <desc>{ariaLabel}</desc>

        {d3.gridVisible
          ? xTicks.map((tick) => (
              <line
                key={tick}
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={margin.top}
                y2={innerBottom}
                stroke={d3.grid}
                strokeDasharray={d3.gridDasharray}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
            ))
          : null}

        {densityRows.rows.map((row) => {
          const active = row.region.region === focusedRegion || row.region.region === highlightRegion;
          const path = areaPath
            .y0((point) =>
              mode === 'violin'
                ? row.baseline + (point.d / densityRows.maxD) * rowHeight
                : row.baseline,
            )
            .y1((point) => row.baseline - (point.d / densityRows.maxD) * rowHeight)(row.points);
          return (
            <g key={row.region.region}>
              <line
                x1={innerLeft}
                x2={innerRight}
                y1={row.baseline}
                y2={row.baseline}
                stroke={d3.grid}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
              <path
                d={path ?? ''}
                fill={fillFor(row.region.region)}
                fillOpacity={opacityFor(row.region.region)}
                stroke={active ? d3.accent : d3.fg}
                strokeOpacity={active ? d3.line.focusOpacity : 0.62}
                strokeWidth={active ? d3.line.strokeWidth : d3.line.mutedStrokeWidth}
              />
              <line
                x1={xScale(row.region.median)}
                x2={xScale(row.region.median)}
                y1={mode === 'violin' ? row.baseline - rowHeight : row.baseline}
                y2={mode === 'violin' ? row.baseline + rowHeight : row.baseline - rowHeight}
                stroke={active ? d3.accent : d3.fg}
                strokeOpacity={active ? d3.line.focusOpacity : d3.line.opacity}
                strokeWidth={d3.line.strokeWidth}
              />
              <text
                x={innerLeft - d3.label.gap}
                y={row.baseline}
                dy="0.32em"
                textAnchor="end"
                fill={active ? d3.accent : d3.fg}
                fontFamily={d3.fontBody}
                fontSize={d3.axis.labelSize}
                fontWeight={active ? 700 : 500}
              >
                {row.region.region}
              </text>
              <rect
                x={innerLeft}
                y={row.baseline - rowHeight - d3.label.gap}
                width={innerRight - innerLeft}
                height={mode === 'violin' ? rowHeight * 2 + d3.label.gap * 2 : rowHeight + d3.label.gap * 2}
                fill={d3.hitStroke}
                pointerEvents="all"
                tabIndex={0}
                role="button"
                aria-label={`${row.region.region}: median ${formatValue(row.region.median)}, mean ${formatValue(row.region.mean)}`}
                onMouseEnter={() => setFocusedRegion(row.region.region)}
                onFocus={() => setFocusedRegion(row.region.region)}
                onClick={() => setFocusedRegion(row.region.region)}
                onBlur={() => setFocusedRegion(highlightRegion)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}

        <line x1={innerLeft} x2={innerRight} y1={innerBottom} y2={innerBottom} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />
        {xTicks.map((tick) => (
          <g key={`tick-${tick}`}>
            <line x1={xScale(tick)} x2={xScale(tick)} y1={innerBottom} y2={innerBottom + d3.label.gap} stroke={d3.axis.tickStroke} strokeWidth={d3.line.mutedStrokeWidth} />
            <text x={xScale(tick)} y={innerBottom + d3.label.gap + d3.axis.tickSize} textAnchor="middle" fill={d3.axis.tickFill} fontFamily={d3.fontBody} fontSize={d3.axis.tickSize}>
              {formatValue(tick)}
            </text>
          </g>
        ))}
        <text x={(innerLeft + innerRight) / 2} y={chartHeight - d3.label.gap} textAnchor="middle" fill={d3.axis.labelFill} fontFamily={d3.fontBody} fontSize={d3.axis.labelSize}>
          {xLabel ?? data?.measure ?? 'value'}
        </text>
      </svg>
      <figcaption aria-live="polite" style={{ color: d3.muted, fontFamily: d3.fontBody, marginTop: d3.label.gap }}>
        {focused
          ? `${focused.region}: median ${formatValue(focused.median)}, mean ${formatValue(focused.mean)}${focused.n_counties ? `, n=${focused.n_counties}` : ''}.`
          : `${regions.length} regional distributions${data?.unit ? ` by ${data.unit}` : ''}. Median rules are drawn inside each ridge.`}
      </figcaption>
    </figure>
  );
};

export default RidgeD3;
