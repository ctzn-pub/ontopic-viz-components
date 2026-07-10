'use client';

import React, { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

/**
 * Minimal number formatter for the common `[+].<n>f` shapes used here (e.g.
 * "+.2f" → signed, 2 decimals; ".0f" → integer). Avoids the untyped d3-format dep.
 */
function makeFormat(spec: string): (v: number) => string {
  const m = /^(\+)?\.(\d+)f$/.exec(spec);
  const signed = !!m?.[1];
  const decimals = m ? parseInt(m[2], 10) : 2;
  return (v: number) => {
    const s = v.toFixed(decimals);
    return signed && v >= 0 ? `+${s}` : s;
  };
}

export interface CaterpillarRow {
  label: string;
  /** Point estimate (correlation, coefficient, odds ratio…). */
  estimate: number;
  /** CI bounds. */
  lo: number;
  hi: number;
  n?: number;
  /** Optional semantic color key; otherwise colored by sign vs the reference. */
  group?: string;
}

export interface CaterpillarData {
  rows: CaterpillarRow[];
  /** Reference value (0 for correlations/coefficients, 1 for odds ratios). */
  reference?: number;
  xLabel?: string;
  xDomain?: [number, number];
  /** d3-format string for estimate labels + ticks, e.g. "+.2f". */
  numberFormat?: string;
  /** Keep the data order (already sorted) or sort by estimate descending. */
  sort?: boolean;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface CaterpillarProps {
  data: CaterpillarData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * Caterpillar — a sorted column of estimates, each a dot with a CI whisker, on
 * a shared axis with a reference line (0 for correlations, 1 for odds ratios).
 * Rows whose CI clears the reference on the negative side take the negative
 * color, strong positives the accent, the rest a muted tone. Direct-labeled
 * with the estimate.
 *
 * Derived from ~18 caterpillar / coefficient-ladder figures across the
 * birth_death data stories (e.g. civic-gradient#caterpillar — correlations with
 * upward mobility, 90% bootstrap CIs). The example data is that figure's real
 * `D.caterpillar` payload.
 */
const Caterpillar: React.FC<CaterpillarProps> = ({ data, width = 680, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const [hover, setHover] = useState<{ row: CaterpillarRow; x: number; y: number } | null>(null);

  const ref = data.reference ?? 0;
  const fmt = useMemo(() => makeFormat(data.numberFormat ?? '+.2f'), [data.numberFormat]);

  const rows = useMemo(() => {
    const r = [...data.rows];
    if (data.sort) r.sort((a, b) => b.estimate - a.estimate);
    return r;
  }, [data.rows, data.sort]);

  const rowH = 30;
  const M = { t: 16, r: 56, b: 40, l: 200 };
  const height = M.t + rows.length * rowH + M.b;

  const { x, ticks } = useMemo(() => {
    const vals = rows.flatMap((r) => [r.lo, r.hi, r.estimate, ref]);
    const xd = data.xDomain ?? [Math.min(...vals), Math.max(...vals)];
    const x = scaleLinear().domain(xd).range([M.l, width - M.r]).nice();
    return { x, ticks: x.ticks(5) };
  }, [rows, data.xDomain, ref, width]);

  const posColor = colorFor(colorDomain, 'positive');
  const negColor = colorFor(colorDomain, 'negative');
  const colorOf = (r: CaterpillarRow): string => {
    if (r.group) return colorFor(colorDomain, r.group);
    if (r.hi < ref) return negColor;
    if (r.lo > ref) return posColor;
    return d3.muted;
  };

  return (
    <figure
      className="caterpillar"
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
        aria-label={data.title ?? 'Caterpillar / coefficient plot'}
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
            {fmt(t)}
          </text>
        ))}

        {/* rows */}
        {rows.map((r, i) => {
          const cy = M.t + i * rowH + rowH / 2;
          const c = colorOf(r);
          return (
            <g key={i} transform={`translate(0, ${cy})`}>
              <text x={M.l - 12} dy=".32em" textAnchor="end" fontSize={d3.axis.tickSize} fontWeight={i === 0 ? 700 : 400} fill={theme.fg}>
                {r.label}
              </text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={0} y2={0} stroke={c} strokeWidth={d3.line.strokeWidth} />
              <line x1={x(r.lo)} x2={x(r.lo)} y1={-5} y2={5} stroke={c} strokeWidth={d3.line.strokeWidth} />
              <line x1={x(r.hi)} x2={x(r.hi)} y1={-5} y2={5} stroke={c} strokeWidth={d3.line.strokeWidth} />
              <circle
                cx={x(r.estimate)}
                cy={0}
                r={d3.point.focusR}
                fill={c}
                stroke={theme.surface}
                strokeWidth={d3.line.strokeWidth}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({ row: r, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
              />
              <text x={x(r.hi) + 8} dy=".32em" fontSize={d3.text.annotationSize} fontWeight={700} fill={c}>
                {fmt(r.estimate)}
              </text>
            </g>
          );
        })}

        {/* axis label */}
        {data.xLabel && (
          <text x={(M.l + width - M.r) / 2} y={height - 6} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.labelFill}>
            {data.xLabel}
          </text>
        )}
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.x + 12, width - 150),
            top: hover.y + 12,
            pointerEvents: 'none',
            background: theme.fg,
            color: theme.surface,
            padding: '5px 8px',
            borderRadius: 6,
            fontSize: d3.axis.tickSize,
            lineHeight: 1.35,
            zIndex: 10,
          }}
        >
          <strong>{hover.row.label}</strong>
          <br />
          {fmt(hover.row.estimate)} · CI [{fmt(hover.row.lo)}, {fmt(hover.row.hi)}]
          {hover.row.n != null ? (
            <>
              <br />
              <span style={{ opacity: 0.75 }}>n = {hover.row.n.toLocaleString()}</span>
            </>
          ) : null}
        </div>
      )}

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>{data.source}</figcaption>
      )}
    </figure>
  );
};

export default Caterpillar;
