'use client';

import React, { useMemo, useState } from 'react';
import { scaleLinear, scaleBand } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

export interface GroupedBarRow {
  /** Category label (x-axis band), e.g. an income bracket. */
  label: string;
  /** Series name → value. */
  values: Record<string, number>;
}

export interface GroupedBarData {
  rows: GroupedBarRow[];
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

export interface GroupedBarProps {
  data: GroupedBarData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * GroupedBar — bars grouped (side-by-side) or stacked within each category band,
 * one series per color, with a y-grid, a legend, and hover tooltips. Series,
 * colors, mode, domain, and unit are props.
 *
 * Derived from ~35 bar / grouped-bar figures across the birth_death data stories
 * (e.g. brfss-steeper-slope#gen, body-starting-line#chart1). The example data is
 * a real income × sex obesity-gradient payload.
 */
const GroupedBar: React.FC<GroupedBarProps> = ({ data, width = 720, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const [hover, setHover] = useState<{ text: string; x: number; y: number } | null>(null);

  const rows = data.rows ?? [];
  const series = data.series ?? [];
  const stacked = data.mode === 'stacked';
  const unit = data.unit ?? '';
  const height = Math.round(width * 0.56);
  const M = { t: 18, r: 18, b: 52, l: 46 };

  const colorOf = (s: string, i: number) =>
    data.groups?.[i] ? colorFor(colorDomain, data.groups[i]) : colorFor(null, s, i);

  const { x, xInner, y, yTicks } = useMemo(() => {
    const x = scaleBand().domain(rows.map((r) => r.label)).range([M.l, width - M.r]).padding(0.2);
    const xInner = scaleBand().domain(series).range([0, x.bandwidth()]).padding(0.08);
    const maxVal = stacked
      ? Math.max(...rows.map((r) => series.reduce((s, k) => s + (r.values[k] ?? 0), 0)))
      : Math.max(...rows.flatMap((r) => series.map((k) => r.values[k] ?? 0)));
    const yd = data.yDomain ?? [0, maxVal * 1.08];
    const y = scaleLinear().domain(yd).range([height - M.b, M.t]).nice();
    return { x, xInner, y, yTicks: y.ticks(5) };
  }, [rows, series, stacked, data.yDomain, width, height]);

  return (
    <figure
      className="grouped-bar"
      style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody, position: 'relative' }}
    >
      {data.title && (
        <h2 style={{ fontFamily: theme.fontTitle, fontSize: d3.text.titleSize, fontWeight: 700, margin: '0 0 2px' }}>
          {data.title}
        </h2>
      )}
      {data.subtitle && (
        <h3 style={{ fontSize: d3.text.subtitleSize, fontWeight: 400, color: theme.muted, margin: '0 0 10px' }}>
          {data.subtitle}
        </h3>
      )}

      <svg
        role="img"
        aria-label={data.title ?? 'Grouped bar chart'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* y grid + ticks */}
        {yTicks.map((t) => (
          <g key={t}>
            {d3.gridVisible ? (
              <line
                x1={M.l}
                x2={width - M.r}
                y1={y(t)}
                y2={y(t)}
                stroke={d3.grid}
                strokeDasharray={d3.gridDasharray}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
            ) : null}
            <text x={M.l - 8} y={y(t)} dy=".32em" textAnchor="end" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
              {t}
              {unit}
            </text>
          </g>
        ))}

        {/* bars */}
        {rows.map((r, ri) => {
          let stackTop = 0;
          return (
            <g key={ri} transform={`translate(${x(r.label) ?? 0}, 0)`}>
              {series.map((s, si) => {
                const v = r.values[s] ?? 0;
                const color = colorOf(s, si);
                let bx: number;
                let bw: number;
                let by: number;
                let bh: number;
                if (stacked) {
                  bx = 0;
                  bw = x.bandwidth();
                  by = y(stackTop + v);
                  bh = y(stackTop) - y(stackTop + v);
                  stackTop += v;
                } else {
                  bx = xInner(s) ?? 0;
                  bw = xInner.bandwidth();
                  by = y(v);
                  bh = y(0) - y(v);
                }
                return (
                  <rect
                    key={si}
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    fill={color}
                    opacity={0.85}
                    onMouseMove={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({ text: `${r.label} · ${s}: ${v}${unit}`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                  />
                );
              })}
              {/* category label */}
              <text x={x.bandwidth() / 2} y={height - M.b + 16} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
                {r.label}
              </text>
            </g>
          );
        })}

        {/* y label */}
        {data.yLabel && (
          <text x={M.l - 8} y={M.t - 6} textAnchor="end" fontSize={d3.text.annotationSize} fontWeight={600} fill={d3.axis.labelFill}>
            {data.yLabel}
          </text>
        )}

        {/* legend */}
        <g transform={`translate(${M.l}, ${height - 14})`}>
          {series.map((s, i) => (
            <g key={s} transform={`translate(${i * 110}, 0)`}>
              <rect x={0} y={-9} width={11} height={11} rx={2} fill={colorOf(s, i)} />
              <text x={16} y={0} fontSize={d3.text.annotationSize} fill={theme.muted}>
                {s}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.x + 12, width - 160),
            top: hover.y + 12,
            pointerEvents: 'none',
            background: theme.fg,
            color: theme.surface,
            padding: '5px 8px',
            borderRadius: 6,
            fontSize: d3.axis.tickSize,
            zIndex: 10,
          }}
        >
          {hover.text}
        </div>
      )}

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>{data.source}</figcaption>
      )}
    </figure>
  );
};

export default GroupedBar;
