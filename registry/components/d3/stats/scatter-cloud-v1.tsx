'use client';

import React, { useId, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3line, curveMonotoneX } from 'd3-shape';
import { useVizTheme } from '@/viz/theme/provider';

export interface ScatterPoint {
  x: number;
  y: number;
  /** Optional label shown in the tooltip. */
  label?: string;
  /**
   * Optional semantic class for color. If omitted, points are colored by the
   * reference line when one is set (above = positive accent, below = negative),
   * else a single muted ink.
   */
  group?: string;
}

export interface ScatterAnnotation {
  x: number;
  y: number;
  text: string;
  /** 'positive' | 'negative' | 'muted' — picks a theme color. */
  tone?: 'positive' | 'negative' | 'muted';
}

export interface ScatterCloudData {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  /** Axis domains; auto-fit from the data when omitted. */
  xDomain?: [number, number];
  yDomain?: [number, number];
  /** Draw a y = x style reference/parity line across the domain. */
  parityLine?: boolean;
  /** Overlay a binned-mean summary line: pre-computed {x, value} points. */
  binnedLine?: { x: number; value: number }[];
  /** Quadrant / corner annotations (e.g. "beat the model" / "fell short"). */
  annotations?: ScatterAnnotation[];
  /** Optional R² (or any) note shown bottom-right. */
  note?: string;
  /** Tick format prefix, e.g. "p" for percentiles → "p40". */
  tickPrefix?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface ScatterCloudProps {
  data: ScatterCloudData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * ScatterCloud — a point cloud with axes/gridlines, an optional parity (y=x)
 * reference line, condition-colored points, corner annotations, and a hover
 * tooltip. Points above the parity line take the positive accent, below the
 * negative — or use each point's explicit `group`.
 *
 * Derived from ~50 scatter figures across the birth_death data stories
 * (e.g. beat-the-model#scatter — predicted vs actual mobility, 4,000 tracts).
 * The example data is that figure's real `D.scatter` payload.
 */
const ScatterCloud: React.FC<ScatterCloudProps> = ({ data, width = 640, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const clipId = useId();
  const [hover, setHover] = useState<{ p: ScatterPoint; cx: number; cy: number } | null>(null);

  const height = width; // square — scatters read best 1:1
  const M = { t: 18, r: 18, b: 44, l: 46 };

  const { x, y, pts, ticks, refLine, binnedPath, posColor, negColor } = useMemo(() => {
    const points = data.points ?? [];
    const xd = data.xDomain ?? extent(points.map((p) => p.x));
    const yd = data.yDomain ?? extent(points.map((p) => p.y));
    const x = scaleLinear().domain(xd).range([M.l, width - M.r]).nice();
    const y = scaleLinear().domain(yd).range([height - M.b, M.t]).nice();

    const posColor = colorFor(colorDomain, 'positive');
    const negColor = colorFor(colorDomain, 'negative');

    const pts = points.map((p) => ({
      p,
      cx: x(p.x),
      cy: y(p.y),
      fill:
        p.group != null
          ? colorFor(colorDomain, p.group)
          : data.parityLine
            ? p.y > p.x
              ? posColor
              : negColor
            : d3.muted,
    }));

    const ticks = x.ticks(5);
    const lo = Math.max(x.domain()[0], y.domain()[0]);
    const hi = Math.min(x.domain()[1], y.domain()[1]);
    const refLine = data.parityLine
      ? { x1: x(lo), y1: y(lo), x2: x(hi), y2: y(hi) }
      : null;

    const binnedPath =
      data.binnedLine && data.binnedLine.length
        ? d3line<{ x: number; value: number }>()
            .x((d) => x(d.x))
            .y((d) => y(d.value))
            .curve(curveMonotoneX)(data.binnedLine) ?? ''
        : '';

    return { x, y, pts, ticks, refLine, binnedPath, posColor, negColor };
  }, [data, width, height, d3.accent, d3.muted, colorFor, colorDomain]);

  const toneColor = (t?: string) =>
    t === 'positive' ? posColor : t === 'negative' ? negColor : theme.muted;
  const tk = (v: number) => `${data.tickPrefix ?? ''}${v}`;

  return (
    <figure
      className="scatter-cloud"
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
        aria-label={data.title ?? 'Scatter plot'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines + ticks */}
        {ticks.map((t) => (
          <g key={`gx${t}`}>
            {d3.gridVisible ? (
              <line
                x1={x(t)}
                x2={x(t)}
                y1={M.t}
                y2={height - M.b}
                stroke={d3.grid}
                strokeDasharray={d3.gridDasharray}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
            ) : null}
            <text x={x(t)} y={height - M.b + 18} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
              {tk(t)}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <g key={`gy${t}`}>
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
              {tk(t)}
            </text>
          </g>
        ))}

        {/* parity / reference line */}
        {refLine && (
          <line
            x1={refLine.x1}
            y1={refLine.y1}
            x2={refLine.x2}
            y2={refLine.y2}
            stroke={theme.fg}
            strokeDasharray="5,4"
            opacity={0.5}
          />
        )}

        {/* binned-mean summary line, drawn over the cloud */}
        {binnedPath && <path d={binnedPath} fill="none" stroke={theme.fg} strokeWidth={d3.line.focusStrokeWidth} />}

        {/* point cloud */}
        <clipPath id={clipId}>
          <rect x={M.l} y={M.t} width={width - M.l - M.r} height={height - M.t - M.b} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {pts.map((d, i) => (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={d3.point.r}
              fill={d.fill}
              opacity={0.18}
              onMouseMove={() => setHover({ p: d.p, cx: d.cx, cy: d.cy })}
            />
          ))}
        </g>

        {/* annotations */}
        {(data.annotations ?? []).map((a, i) => (
          <text
            key={i}
            x={x(a.x)}
            y={y(a.y)}
            fontSize={d3.axis.tickSize}
            fontWeight={600}
            fill={toneColor(a.tone)}
          >
            {a.text}
          </text>
        ))}

        {/* axis titles */}
        {data.xLabel && (
          <text x={(M.l + width - M.r) / 2} y={height - 8} textAnchor="middle" fontSize={d3.axis.tickSize} fill={d3.axis.labelFill}>
            {data.xLabel}
          </text>
        )}
        {data.yLabel && (
          <text transform={`translate(13, ${(M.t + height - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={d3.axis.tickSize} fill={d3.axis.labelFill}>
            {data.yLabel}
          </text>
        )}

        {/* note (e.g. R²) */}
        {data.note && (
          <text x={width - M.r} y={M.t + 12} textAnchor="end" fontSize={d3.text.annotationSize} fontStyle="italic" fill={theme.muted}>
            {data.note}
          </text>
        )}

        {/* hover marker */}
        {hover && <circle cx={hover.cx} cy={hover.cy} r={d3.point.focusR} fill="none" stroke={theme.fg} strokeWidth={d3.line.strokeWidth} />}
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.cx + 12, width - 130),
            top: hover.cy + 12,
            pointerEvents: 'none',
            background: theme.fg,
            color: theme.surface,
            padding: '5px 8px',
            borderRadius: 6,
            fontSize: d3.axis.tickSize,
            zIndex: 10,
          }}
        >
          {hover.p.label ? (
            <>
              <strong>{hover.p.label}</strong>
              <br />
            </>
          ) : null}
          {fmt(hover.p.x)}, {fmt(hover.p.y)}
        </div>
      )}

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>{data.source}</figcaption>
      )}
    </figure>
  );
};

function extent(vals: number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of vals) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return isFinite(lo) ? [lo, hi] : [0, 1];
}
function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export default ScatterCloud;
