'use client';

import React, { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

export interface DivergingBarRow {
  label: string;
  /** Signed value — positive bars extend right, negative left, from the center. */
  value: number;
  /** Optional tooltip detail line. */
  detail?: string;
}

export interface DivergingBarsData {
  rows: DivergingBarRow[];
  /** Center/reference value (default 0). */
  reference?: number;
  xLabel?: string;
  xDomain?: [number, number];
  /** Value suffix, e.g. "%". */
  unit?: string;
  /** Sort by value descending (default keeps data order). */
  sort?: boolean;
  /** Number formatting: signed integer by default. */
  decimals?: number;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface DivergingBarsProps {
  data: DivergingBarsData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * DivergingBars — ranked horizontal bars extending left (negative, red) or right
 * (positive, green) from a center reference line, each labeled and direct-valued.
 * Reads as winners-vs-losers around a baseline (e.g. county birth-rate change).
 *
 * Derived from the diverging-bar figures across the birth_death data stories
 * (e.g. vanishing-cradle#ranks, flat-line#delta). The example data is a real
 * county birth-change payload.
 */
const DivergingBars: React.FC<DivergingBarsProps> = ({ data, width = 680, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const [hover, setHover] = useState<{ text: string; x: number; y: number } | null>(null);

  const ref = data.reference ?? 0;
  const unit = data.unit ?? '';
  const decimals = data.decimals ?? 0;
  const fmt = (v: number) => `${v >= ref ? '+' : ''}${(v - 0).toFixed(decimals)}${unit}`;

  const rows = useMemo(() => {
    const r = [...data.rows];
    if (data.sort) r.sort((a, b) => b.value - a.value);
    return r;
  }, [data.rows, data.sort]);

  const rowH = 24;
  const M = { t: 14, r: 50, b: 34, l: 150 };
  const height = M.t + rows.length * rowH + M.b;

  const posColor = colorFor(colorDomain, 'positive');
  const negColor = colorFor(colorDomain, 'negative');

  const { x, ticks } = useMemo(() => {
    const vals = rows.map((r) => r.value);
    const lo = Math.min(ref, ...vals);
    const hi = Math.max(ref, ...vals);
    const xd = data.xDomain ?? [lo * 1.05, hi * 1.05];
    const x = scaleLinear().domain(xd).range([M.l, width - M.r]).nice();
    return { x, ticks: x.ticks(6) };
  }, [rows, data.xDomain, ref, width]);

  return (
    <figure
      className="diverging-bars"
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
        aria-label={data.title ?? 'Diverging bar chart'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines + reference */}
        {ticks.map((t) =>
          d3.gridVisible || t === ref ? (
            <line
              key={t}
              x1={x(t)}
              x2={x(t)}
              y1={M.t - 4}
              y2={height - M.b}
              stroke={t === ref ? theme.muted : d3.grid}
              strokeDasharray={t === ref ? undefined : d3.gridDasharray}
              strokeWidth={t === ref ? d3.line.strokeWidth : d3.line.mutedStrokeWidth}
            />
          ) : null
        )}
        {ticks.map((t) => (
          <text key={`t${t}`} x={x(t)} y={height - M.b + 16} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
            {t > ref ? '+' : ''}
            {t}
            {unit}
          </text>
        ))}

        {/* bars */}
        {rows.map((r, i) => {
          const yy = M.t + i * rowH;
          const pos = r.value >= ref;
          const color = pos ? posColor : negColor;
          const bx = pos ? x(ref) : x(r.value);
          const bw = Math.abs(x(r.value) - x(ref));
          return (
            <g key={i}>
              <rect
                x={bx}
                y={yy + 2}
                width={bw}
                height={rowH - 5}
                fill={color}
                opacity={0.85}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    text: r.detail ? `${r.label} — ${r.detail}` : `${r.label}: ${fmt(r.value)}`,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
              />
              <text x={M.l - 8} y={yy + rowH / 2} dy=".32em" textAnchor="end" fontSize={d3.text.annotationSize} fill={theme.fg}>
                {r.label}
              </text>
              <text
                x={pos ? x(r.value) + 5 : x(r.value) - 5}
                y={yy + rowH / 2}
                dy=".32em"
                textAnchor={pos ? 'start' : 'end'}
                fontSize={d3.text.annotationSize}
                fontWeight={600}
                fill={color}
              >
                {fmt(r.value)}
              </text>
            </g>
          );
        })}

        {data.xLabel && (
          <text x={(M.l + width - M.r) / 2} y={height - 4} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.labelFill}>
            {data.xLabel}
          </text>
        )}
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.x + 12, width - 180),
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

export default DivergingBars;
