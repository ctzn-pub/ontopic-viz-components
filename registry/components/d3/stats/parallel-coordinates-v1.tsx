'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { scaleLinear, scalePoint } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import { useVizTheme } from '@/viz/theme/provider';

export interface D3ParallelGroup {
  label: string;
  /** Each line is one observation's values, in axis order. */
  lines?: number[][];
  /** Alternate shape: array of { values } objects. */
  values?: { values: number[] }[];
}

export interface D3ParallelCoordinatesData {
  /** Axis names, in display order. */
  axes: string[];
  groups: D3ParallelGroup[];
  note?: string;
}

export interface D3ParallelCoordinatesProps {
  data: D3ParallelCoordinatesData;
  /**
   * Explicit semantic domain for group colors. Default null uses the theme's
   * categorical cycle. Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  /** Optional group to emphasize on first render. */
  highlightGroup?: string | null;
  /** Shared numeric y-domain. Defaults to a symmetric domain around zero. */
  yDomain?: [number, number];
  yLabel?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  maxLabelLength?: number;
}

interface SeriesLine {
  id: string;
  group: string;
  index: number;
  values: number[];
  points: PathPoint[];
}

interface PathPoint {
  axis: string;
  value: number;
  x: number;
  y: number;
}

function groupLines(group: D3ParallelGroup): number[][] {
  if (group.lines) return group.lines;
  return group.values?.map((d) => d.values) ?? [];
}

function trimLabel(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, Math.max(1, max - 3))}...` : label;
}

function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    signDisplay: value === 0 ? 'auto' : 'exceptZero',
  }).format(value);
}

/**
 * ParallelCoordinatesD3 — multivariate observations as one line per row across
 * ordered axes, with accessible group focus and per-line keyboard/mouse focus.
 *
 * D3 owns the scales and SVG path generation; React owns state and rendering.
 * Group colors resolve from the active theme (categorical by default). Built for
 * the "Picturing American Health" PCA high/low county sample, but reusable for
 * standardized multivariate comparison data.
 */
const ParallelCoordinatesD3: React.FC<D3ParallelCoordinatesProps> = ({
  data,
  colorDomain = null,
  highlightGroup = null,
  yDomain,
  yLabel = 'standardized value',
  width = 760,
  height = 430,
  showLegend = true,
  maxLabelLength,
}) => {
  const { theme, colorScale, d3 } = useVizTheme();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(highlightGroup);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGroup(highlightGroup);
  }, [highlightGroup]);

  const axes = data?.axes ?? [];
  const groups = data?.groups ?? [];
  const labelLimit = maxLabelLength ?? d3.label.maxChars;
  const groupLabels = useMemo(() => groups.map((g) => g.label), [groups]);

  const colorByGroup = useMemo(() => {
    const scale = colorScale(colorDomain, groupLabels);
    return new Map(scale.domain.map((label, i) => [label, scale.range[i]]));
  }, [colorDomain, colorScale, groupLabels]);

  const margin = d3.margin;
  const chartWidth = Math.max(width, margin.left + margin.right + 1);
  const chartHeight = Math.max(height, margin.top + margin.bottom + 1);
  const innerLeft = margin.left;
  const innerRight = chartWidth - margin.right;
  const innerTop = margin.top;
  const innerBottom = chartHeight - margin.bottom;

  const xScale = useMemo(
    () =>
      scalePoint<string>()
        .domain(axes)
        .range([innerLeft, innerRight])
        .padding(0.35),
    [axes, innerLeft, innerRight],
  );

  const rawRows = useMemo<SeriesLine[]>(() => {
    let rowIndex = 0;
    const rows: SeriesLine[] = [];
    for (const group of groups) {
      for (const values of groupLines(group)) {
        const cleanValues = axes.map((_, i) => Number(values[i])).filter(Number.isFinite);
        if (cleanValues.length !== axes.length) continue;
        const index = rowIndex++;
        rows.push({
          id: `${group.label}-${index}`,
          group: group.label,
          index,
          values: cleanValues,
          points: [],
        });
      }
    }
    return rows;
  }, [axes, groups]);

  const computedDomain = useMemo<[number, number]>(() => {
    if (yDomain) return yDomain;
    let maxAbs = 1;
    for (const row of rawRows) {
      for (const value of row.values) maxAbs = Math.max(maxAbs, Math.abs(value));
    }
    return [-maxAbs, maxAbs];
  }, [rawRows, yDomain]);

  const yScale = useMemo(
    () => scaleLinear().domain(computedDomain).nice().range([innerBottom, innerTop]),
    [computedDomain, innerBottom, innerTop],
  );

  const rows = useMemo<SeriesLine[]>(
    () =>
      rawRows.map((row) => ({
        ...row,
        points: axes.map((axis, i) => ({
          axis,
          value: row.values[i],
          x: xScale(axis) ?? innerLeft,
          y: yScale(row.values[i]),
        })),
      })),
    [axes, rawRows, xScale, yScale, innerLeft],
  );

  const pathFor = useMemo(
    () =>
      line<PathPoint>()
        .x((p) => p.x)
        .y((p) => p.y)
        .defined((p) => Number.isFinite(p.value))
        .curve(curveMonotoneX),
    [],
  );

  const focusedRow = rows.find((row) => row.id === focusedId) ?? null;
  const yTicks = yScale.ticks(5);

  const focusSummary = focusedRow
    ? [...focusedRow.points]
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 3)
        .map((p) => `${trimLabel(p.axis, labelLimit)} ${formatValue(p.value)}`)
        .join(', ')
    : null;

  const ariaLabel = `D3 parallel coordinates chart with ${axes.length} axes, ${rows.length} observations, and ${groups.length} groups.`;

  function lineOpacity(row: SeriesLine): number {
    const groupMuted = selectedGroup != null && row.group !== selectedGroup;
    const lineMuted = focusedId != null && row.id !== focusedId;
    if (row.id === focusedId) return d3.line.focusOpacity;
    if (groupMuted || lineMuted) return d3.line.mutedOpacity;
    return d3.line.opacity;
  }

  function lineWidth(row: SeriesLine): number {
    return row.id === focusedId ? d3.line.focusStrokeWidth : d3.line.mutedStrokeWidth;
  }

  if (axes.length === 0 || groups.length === 0 || rows.length === 0) {
    return null;
  }

  return (
    <figure
      style={{
        margin: 0,
        color: theme.fg,
        fontFamily: theme.fontBody,
      }}
    >
      {showLegend ? (
        <div
          aria-label="Group filter"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: d3.control.gap,
            marginBottom: d3.control.marginBottom,
          }}
        >
          <button
            type="button"
            aria-pressed={selectedGroup === null}
            onClick={() => setSelectedGroup(null)}
            style={{
              border: `${d3.stroke}px solid ${selectedGroup === null ? d3.fg : d3.border}`,
              background: d3.surface,
              color: selectedGroup === null ? d3.fg : d3.muted,
              fontFamily: d3.fontBody,
              padding: d3.control.padding,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {groupLabels.map((label) => {
            const active = selectedGroup === label;
            const color = colorByGroup.get(label) ?? d3.fg;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedGroup(active ? null : label)}
                style={{
                  border: `${d3.stroke}px solid ${active ? color : d3.border}`,
                  background: d3.surface,
                  color: active ? color : d3.muted,
                  fontFamily: d3.fontBody,
                  padding: d3.control.padding,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <svg
        role="img"
        aria-label={ariaLabel}
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          background: d3.surface,
          overflow: 'visible',
        }}
        onMouseLeave={() => setFocusedId(null)}
      >
        <title>Parallel coordinates</title>
        <desc>{ariaLabel}</desc>

        {d3.gridVisible
          ? yTicks.map((tick) => {
              const y = yScale(tick);
              return (
                <g key={tick}>
                  <line
                    x1={innerLeft}
                    x2={innerRight}
                    y1={y}
                    y2={y}
                    stroke={d3.grid}
                    strokeDasharray={d3.gridDasharray}
                    strokeWidth={d3.line.mutedStrokeWidth}
                  />
                  <text
                    x={innerLeft - 8}
                    y={y}
                    dy="0.32em"
                    textAnchor="end"
                    fill={d3.axis.tickFill}
                    fontFamily={d3.fontBody}
                    fontSize={d3.axis.tickSize}
                  >
                    {formatValue(tick)}
                  </text>
                </g>
              );
            })
          : null}

        <text
          x={innerLeft - 36}
          y={(innerTop + innerBottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${innerLeft - 36} ${(innerTop + innerBottom) / 2})`}
          fill={d3.axis.labelFill}
          fontFamily={d3.fontBody}
          fontSize={d3.axis.labelSize}
        >
          {yLabel}
        </text>

        {axes.map((axis) => {
          const x = xScale(axis) ?? innerLeft;
          return (
            <g key={axis}>
              <line
                x1={x}
                x2={x}
                y1={innerTop}
                y2={innerBottom}
                stroke={d3.axis.stroke}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
              <text
                x={x}
                y={innerBottom + 18}
                transform={`rotate(-55 ${x} ${innerBottom + 18})`}
                textAnchor="end"
                fill={d3.axis.labelFill}
                fontFamily={d3.fontBody}
                fontSize={d3.axis.labelSize}
              >
                {trimLabel(axis, labelLimit)}
                <title>{axis}</title>
              </text>
            </g>
          );
        })}

        {rows.map((row) => {
          const path = pathFor(row.points) ?? '';
          const color = colorByGroup.get(row.group) ?? d3.fg;
          return (
            <path
              key={row.id}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={lineWidth(row)}
              strokeOpacity={lineOpacity(row)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {rows.map((row) => {
          const path = pathFor(row.points) ?? '';
          return (
            <path
              key={`${row.id}-hit`}
              d={path}
              fill="none"
              stroke={d3.hitStroke}
              strokeWidth={d3.hitStrokeWidth}
              pointerEvents="stroke"
              tabIndex={0}
              aria-label={`${row.group} observation ${row.index + 1}`}
              onMouseEnter={() => setFocusedId(row.id)}
              onFocus={() => setFocusedId(row.id)}
              onClick={() => setFocusedId(row.id)}
              onBlur={() => setFocusedId(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}

        {focusedRow
          ? focusedRow.points.map((point) => (
              <circle
                key={`${focusedRow.id}-${point.axis}`}
                cx={point.x}
                cy={point.y}
                r={d3.point.focusR}
                fill={colorByGroup.get(focusedRow.group) ?? d3.fg}
                stroke={d3.surface}
                strokeWidth={d3.stroke}
              >
                <title>{`${point.axis}: ${formatValue(point.value)}`}</title>
              </circle>
            ))
          : null}
      </svg>

      <figcaption
        aria-live="polite"
        style={{
          color: d3.muted,
          fontFamily: d3.fontBody,
          marginTop: 8,
        }}
      >
        {focusedRow
          ? `${focusedRow.group} observation ${focusedRow.index + 1}: ${focusSummary}`
          : data.note ?? `${rows.length} observations across ${axes.length} standardized axes.`}
      </figcaption>
    </figure>
  );
};

export default ParallelCoordinatesD3;
