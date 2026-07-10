'use client';

import React, { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

export interface DumbbellRow {
  label: string;
  left: number;
  right: number;
  /** Optional middle annotation (e.g. "1.9×" ratio, or the gap). */
  note?: string;
}

export interface DumbbellData {
  rows: DumbbellRow[];
  /** Endpoint series names (for the legend + tooltips). */
  leftName?: string;
  rightName?: string;
  /** Semantic color keys for each endpoint; default to two categorical tones. */
  leftGroup?: string;
  rightGroup?: string;
  xLabel?: string;
  xDomain?: [number, number];
  /** Unit suffix on value labels, e.g. "%". */
  unit?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface DumbbellProps {
  data: DumbbellData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * Dumbbell — one row per category, each a connector between two endpoint dots
 * (e.g. female vs male, p25 vs p75), with value labels and an optional middle
 * annotation (the gap or ratio). The connector length IS the gap, read top to
 * bottom in the data's order. A small two-item legend names the endpoints.
 *
 * Derived from ~14 dumbbell / slope-row figures across the birth_death data
 * stories (e.g. brfss-rich-vice#c6 — male–female binge-drinking gap by income).
 * The example data is that figure's real `D.gap_rows` payload.
 */
const Dumbbell: React.FC<DumbbellProps> = ({ data, width = 680, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const [hover, setHover] = useState<{ text: string; x: number; y: number } | null>(null);

  const rows = data.rows ?? [];
  const rowH = 34;
  const M = { t: 30, r: 30, b: 34, l: 150 };
  const height = M.t + rows.length * rowH + M.b;

  const leftColor = colorFor(colorDomain, data.leftGroup ?? 'negative');
  const rightColor = colorFor(colorDomain, data.rightGroup ?? 'positive');
  const unit = data.unit ?? '';

  const { x, ticks } = useMemo(() => {
    const vals = rows.flatMap((r) => [r.left, r.right]);
    const xd = data.xDomain ?? [Math.min(0, ...vals), Math.max(...vals)];
    const x = scaleLinear().domain(xd).range([M.l, width - M.r]).nice();
    return { x, ticks: x.ticks(6) };
  }, [rows, data.xDomain, width]);

  return (
    <figure
      className="dumbbell"
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
        aria-label={data.title ?? 'Dumbbell chart'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines + ticks */}
        {ticks.map((t) => (
          <g key={t}>
            {d3.gridVisible ? (
              <line
                x1={x(t)}
                x2={x(t)}
                y1={M.t - 8}
                y2={height - M.b}
                stroke={d3.grid}
                strokeDasharray={d3.gridDasharray}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
            ) : null}
            <text x={x(t)} y={M.t - 14} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
              {t}
              {unit}
            </text>
          </g>
        ))}

        {/* rows */}
        {rows.map((r, i) => {
          const cy = M.t + i * rowH + rowH / 2;
          const lx = x(r.left);
          const rx = x(r.right);
          return (
            <g key={i} transform={`translate(0, ${cy})`}>
              <text x={M.l - 12} dy=".32em" textAnchor="end" fontSize={d3.axis.tickSize} fill={theme.fg}>
                {r.label}
              </text>
              <line x1={lx} x2={rx} y1={0} y2={0} stroke={d3.grid} strokeWidth={d3.line.focusStrokeWidth} />
              <circle
                cx={lx}
                cy={0}
                r={d3.point.focusR}
                fill={leftColor}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({ text: `${data.leftName ?? 'Left'} · ${r.label}: ${r.left}${unit}`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
              />
              <circle
                cx={rx}
                cy={0}
                r={d3.point.focusR}
                fill={rightColor}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({ text: `${data.rightName ?? 'Right'} · ${r.label}: ${r.right}${unit}`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
              />
              <text x={Math.min(lx, rx) - 11} dy=".32em" textAnchor="end" fontSize={d3.text.annotationSize} fontWeight={600} fill={lx <= rx ? leftColor : rightColor}>
                {Math.min(r.left, r.right)}{unit}
              </text>
              <text x={Math.max(lx, rx) + 11} dy=".32em" fontSize={d3.text.annotationSize} fontWeight={600} fill={lx <= rx ? rightColor : leftColor}>
                {Math.max(r.left, r.right)}{unit}
              </text>
              {r.note && (
                <text x={(lx + rx) / 2} y={-13} textAnchor="middle" fontSize={d3.text.annotationSize} fontStyle="italic" fill={theme.muted}>
                  {r.note}
                </text>
              )}
            </g>
          );
        })}

        {/* legend */}
        <g transform={`translate(${M.l}, ${height - 12})`}>
          {[
            [data.leftName ?? 'Left', leftColor],
            [data.rightName ?? 'Right', rightColor],
          ].map(([name, color], i) => (
            <g key={i} transform={`translate(${i * 100}, 0)`}>
              <circle cx={0} cy={0} r={d3.point.focusR} fill={color as string} />
              <text x={12} y={3.5} fontSize={d3.text.annotationSize} fill={theme.muted}>
                {name as string}
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

export default Dumbbell;
