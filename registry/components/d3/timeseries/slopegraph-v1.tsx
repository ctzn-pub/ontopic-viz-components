'use client';

import React, { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

export interface D3SlopegraphRow {
  /** Series label, e.g. state abbreviation. */
  state: string;
  start: number;
  end: number;
  start_lci?: number;
  start_uci?: number;
  end_lci?: number;
  end_uci?: number;
}

export interface D3SlopegraphData {
  rows: D3SlopegraphRow[];
  start_year?: number;
  end_year?: number;
  value_label?: string;
  /** Series to spotlight with the theme accent. */
  highlight?: string[];
  measure?: string;
  note?: string;
}

export interface D3SlopegraphProps {
  data: D3SlopegraphData;
  /** Override highlighted series; defaults to data.highlight. */
  highlight?: string[];
  /** Number of largest absolute movers to label alongside highlighted rows. */
  topMoverCount?: number;
  yDomain?: [number, number];
  width?: number;
  height?: number;
}

interface LabelRow {
  state: string;
  x: number;
  y: number;
  labelY: number;
  value: number;
  delta: number;
}

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function collideLabels(labels: LabelRow[], minGap: number, yMin: number, yMax: number) {
  labels.sort((a, b) => a.labelY - b.labelY);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].labelY - labels[i - 1].labelY < minGap) {
      labels[i].labelY = labels[i - 1].labelY + minGap;
    }
  }
  for (let i = labels.length - 1; i >= 0; i--) {
    if (labels[i].labelY > yMax) labels[i].labelY = yMax;
    if (i > 0 && labels[i].labelY - labels[i - 1].labelY < minGap) {
      labels[i - 1].labelY = labels[i].labelY - minGap;
    }
  }
  for (const label of labels) label.labelY = Math.max(yMin, Math.min(yMax, label.labelY));
}

/**
 * SlopegraphD3 — two-period movement for many series, with readable endpoint
 * labels, confidence intervals, and direct focus.
 *
 * D3 owns the y scale; React renders the SVG and interaction states. The default
 * field is monochrome, with a single theme accent reserved for highlighted
 * states and user focus.
 */
const SlopegraphD3: React.FC<D3SlopegraphProps> = ({
  data,
  highlight,
  topMoverCount = 6,
  yDomain,
  width = 680,
  height = 460,
}) => {
  const { theme, d3 } = useVizTheme();
  const [focusedState, setFocusedState] = useState<string | null>(null);

  const rows = data?.rows ?? [];
  const highlightSet = useMemo(() => new Set(highlight ?? data?.highlight ?? []), [highlight, data]);
  const margin = d3.wideRightMargin;
  const chartWidth = Math.max(width, margin.left + margin.right + 1);
  const chartHeight = Math.max(height, margin.top + margin.bottom + 1);
  const innerLeft = margin.left;
  const innerRight = chartWidth - margin.right;
  const innerTop = margin.top;
  const innerBottom = chartHeight - margin.bottom;
  const startYear = data?.start_year ?? 0;
  const endYear = data?.end_year ?? 1;
  const valueLabel = data?.value_label ?? data?.measure ?? 'value';

  const computedDomain = useMemo<[number, number]>(() => {
    if (yDomain) return yDomain;
    const values = rows.flatMap((row) => [
      row.start_lci ?? row.start,
      row.start_uci ?? row.start,
      row.end_lci ?? row.end,
      row.end_uci ?? row.end,
    ]);
    if (values.length === 0) return [0, 1];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = Math.max(1, (hi - lo) * 0.08);
    return [lo - pad, hi + pad];
  }, [rows, yDomain]);

  const yScale = useMemo(
    () => scaleLinear().domain(computedDomain).nice().range([innerBottom, innerTop]),
    [computedDomain, innerBottom, innerTop],
  );

  const labels = useMemo(() => {
    const byMovement = [...rows]
      .sort((a, b) => Math.abs(b.end - b.start) - Math.abs(a.end - a.start))
      .slice(0, topMoverCount)
      .map((row) => row.state);
    const labelStates = new Set([...byMovement, ...highlightSet]);
    if (focusedState) labelStates.add(focusedState);
    const out = rows
      .filter((row) => labelStates.has(row.state))
      .map((row) => ({
        state: row.state,
        x: innerRight,
        y: yScale(row.end),
        labelY: yScale(row.end),
        value: row.end,
        delta: row.end - row.start,
      }));
    collideLabels(out, d3.label.minGap, innerTop, innerBottom);
    return out;
  }, [rows, topMoverCount, highlightSet, focusedState, innerRight, yScale, d3.label.minGap, innerTop, innerBottom]);

  const yTicks = yScale.ticks(5);
  const ariaLabel = `D3 slopegraph comparing ${rows.length} series between ${startYear} and ${endYear}.`;

  function isActive(row: D3SlopegraphRow): boolean {
    return row.state === focusedState || highlightSet.has(row.state);
  }

  function strokeFor(row: D3SlopegraphRow): string {
    return isActive(row) ? d3.accent : d3.muted;
  }

  function opacityFor(row: D3SlopegraphRow): number {
    if (row.state === focusedState) return d3.line.focusOpacity;
    if (highlightSet.has(row.state)) return 0.82;
    return focusedState ? d3.line.mutedOpacity : 0.34;
  }

  if (rows.length === 0) return null;

  return (
    <figure style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody }}>
      <svg
        role="img"
        aria-label={ariaLabel}
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ display: 'block', maxWidth: '100%', height: 'auto', background: d3.surface }}
        onMouseLeave={() => setFocusedState(null)}
      >
        <title>Slopegraph</title>
        <desc>{ariaLabel}</desc>

        {d3.gridVisible
          ? yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={innerLeft}
                  x2={innerRight}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  stroke={d3.grid}
                  strokeDasharray={d3.gridDasharray}
                  strokeWidth={d3.line.mutedStrokeWidth}
                />
                <text
                  x={innerLeft - d3.label.gap}
                  y={yScale(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  fill={d3.axis.tickFill}
                  fontFamily={d3.fontBody}
                  fontSize={d3.axis.tickSize}
                >
                  {formatValue(tick)}
                </text>
              </g>
            ))
          : null}

        <text x={innerLeft} y={innerTop - d3.label.gap} textAnchor="middle" fill={d3.axis.labelFill} fontFamily={d3.fontBody} fontSize={d3.axis.labelSize}>
          {startYear}
        </text>
        <text x={innerRight} y={innerTop - d3.label.gap} textAnchor="middle" fill={d3.axis.labelFill} fontFamily={d3.fontBody} fontSize={d3.axis.labelSize}>
          {endYear}
        </text>
        <text
          x={d3.label.gap}
          y={(innerTop + innerBottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${d3.label.gap} ${(innerTop + innerBottom) / 2})`}
          fill={d3.axis.labelFill}
          fontFamily={d3.fontBody}
          fontSize={d3.axis.labelSize}
        >
          {valueLabel}
        </text>

        {rows.map((row) => {
          const active = isActive(row);
          const stroke = strokeFor(row);
          const yStart = yScale(row.start);
          const yEnd = yScale(row.end);
          return (
            <g key={row.state}>
              {row.start_lci != null && row.start_uci != null ? (
                <line
                  x1={innerLeft}
                  x2={innerLeft}
                  y1={yScale(row.start_lci)}
                  y2={yScale(row.start_uci)}
                  stroke={stroke}
                  strokeOpacity={active ? d3.line.opacity : d3.line.mutedOpacity}
                  strokeWidth={d3.line.mutedStrokeWidth}
                />
              ) : null}
              {row.end_lci != null && row.end_uci != null ? (
                <line
                  x1={innerRight}
                  x2={innerRight}
                  y1={yScale(row.end_lci)}
                  y2={yScale(row.end_uci)}
                  stroke={stroke}
                  strokeOpacity={active ? d3.line.opacity : d3.line.mutedOpacity}
                  strokeWidth={d3.line.mutedStrokeWidth}
                />
              ) : null}
              <line
                x1={innerLeft}
                x2={innerRight}
                y1={yStart}
                y2={yEnd}
                stroke={stroke}
                strokeOpacity={opacityFor(row)}
                strokeWidth={active ? d3.line.focusStrokeWidth : d3.line.mutedStrokeWidth}
                strokeLinecap="round"
              />
              <circle cx={innerLeft} cy={yStart} r={active ? d3.point.focusR : d3.point.r} fill={stroke} fillOpacity={opacityFor(row)} />
              <circle cx={innerRight} cy={yEnd} r={active ? d3.point.focusR : d3.point.r} fill={stroke} fillOpacity={opacityFor(row)} />
              <line
                x1={innerLeft}
                x2={innerRight}
                y1={yStart}
                y2={yEnd}
                stroke={d3.hitStroke}
                strokeWidth={d3.hitStrokeWidth}
                pointerEvents="stroke"
                tabIndex={0}
                role="button"
                aria-label={`${row.state}: ${formatValue(row.start)} in ${startYear}, ${formatValue(row.end)} in ${endYear}`}
                onMouseEnter={() => setFocusedState(row.state)}
                onFocus={() => setFocusedState(row.state)}
                onClick={() => setFocusedState(row.state)}
                onBlur={() => setFocusedState(null)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}

        {labels.map((label) => {
          const active = label.state === focusedState || highlightSet.has(label.state);
          return (
            <g key={label.state}>
              <line
                x1={label.x}
                x2={label.x + d3.label.gap}
                y1={label.y}
                y2={label.labelY}
                stroke={active ? d3.accent : d3.muted}
                strokeOpacity={active ? d3.line.focusOpacity : d3.line.opacity}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
              <text
                x={label.x + d3.label.gap + d3.label.leaderOffset}
                y={label.labelY}
                dy="0.32em"
                fill={active ? d3.accent : d3.muted}
                fontFamily={d3.fontBody}
                fontSize={d3.text.annotationSize}
                fontWeight={active ? 700 : 500}
              >
                {label.state} {formatValue(label.value)}
                <title>{`${label.state}: ${formatValue(label.value)}, change ${formatValue(label.delta)}`}</title>
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption aria-live="polite" style={{ color: d3.muted, fontFamily: d3.fontBody, marginTop: d3.label.gap }}>
        {focusedState
          ? `${focusedState} focused.`
          : data.note ?? `${rows.length} series compared between ${startYear} and ${endYear}.`}
      </figcaption>
    </figure>
  );
};

export default SlopegraphD3;
