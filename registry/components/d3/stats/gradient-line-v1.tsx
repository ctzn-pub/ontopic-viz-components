'use client';

import React, { useId, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3line, area as d3area, curveBasis } from 'd3-shape';
import { useVizTheme } from '@/viz/theme/provider';

export interface GradientPoint {
  /** Position along the ordered gradient (e.g. deprivation percentile 1–100). */
  x: number;
  value: number;
  /** Optional CI / IQR ribbon bounds. */
  lo?: number;
  hi?: number;
}

export interface GradientSeries {
  label: string;
  points: GradientPoint[];
  /** Semantic color key ('positive'|'negative'|...) or omit for the accent. */
  group?: string;
}

export interface GradientLineData {
  series: GradientSeries[];
  /** Faint background dot cloud {x, y}. */
  cloud?: { x: number; y: number }[];
  xLabel?: string;
  yLabel?: string;
  /** Directional endpoint hints, e.g. "← least deprived" / "most deprived →". */
  leftLabel?: string;
  rightLabel?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface GradientLineProps {
  data: GradientLineData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * GradientLine — one or more outcomes traced across an ordered gradient
 * (deprivation deciles, income percentiles…), each with an optional CI/IQR
 * ribbon, a faint background dot cloud, directional endpoint labels, and an
 * end-of-line label. Colors come from the theme; the gradient axis reads
 * left-to-right as the social ordering.
 *
 * Derived from ~22 gradient-line figures across the birth_death data stories
 * (e.g. the-gradient#master — life expectancy vs ADI percentile, IQR band).
 * The example data is that figure's real `D.le` + `D.cloud` payload.
 */
const GradientLine: React.FC<GradientLineProps> = ({ data, width = 720, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const clipId = useId();
  const [hover, setHover] = useState<{ x: number; y: number; sx: number; sy: number; label: string } | null>(null);

  const height = Math.round(width * 0.6);
  const M = { t: 22, r: 28, b: 46, l: 46 };

  const { x, y, series, cloudPts, yTicks, xTicks } = useMemo(() => {
    const allPts = data.series.flatMap((s) => s.points);
    const xd =
      data.xDomain ?? [Math.min(...allPts.map((p) => p.x)), Math.max(...allPts.map((p) => p.x))];
    const ys = allPts.flatMap((p) => [p.value, p.lo ?? p.value, p.hi ?? p.value]);
    const yd = data.yDomain ?? [Math.min(...ys), Math.max(...ys)];
    const x = scaleLinear().domain(xd).range([M.l, width - M.r]);
    const y = scaleLinear().domain(yd).range([height - M.b, M.t]).nice();

    const lineGen = d3line<GradientPoint>().x((p) => x(p.x)).y((p) => y(p.value)).curve(curveBasis);
    const areaGen = d3area<GradientPoint>()
      .x((p) => x(p.x))
      .y0((p) => y(p.lo ?? p.value))
      .y1((p) => y(p.hi ?? p.value))
      .curve(curveBasis);

    const series = data.series.map((s, i) => {
      const color = s.group ? colorFor(colorDomain, s.group) : i === 0 ? theme.fg : d3.accent;
      const hasBand = s.points.some((p) => p.lo != null && p.hi != null);
      const last = s.points[s.points.length - 1];
      return {
        label: s.label,
        color,
        linePath: lineGen(s.points) ?? '',
        areaPath: hasBand ? areaGen(s.points) ?? '' : '',
        end: last ? { x: x(last.x), y: y(last.value) } : null,
        points: s.points,
      };
    });

    const cloudPts = (data.cloud ?? []).map((c) => ({ cx: x(Math.max(xd[0], c.x)), cy: y(c.y) }));

    return { x, y, series, cloudPts, yTicks: y.ticks(6), xTicks: x.ticks(6) };
  }, [data, width, height, theme.fg, d3.accent, colorFor, colorDomain]);

  return (
    <figure
      className="gradient-line"
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
        aria-label={data.title ?? 'Gradient line chart'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* y gridlines + ticks */}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
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
            </text>
          </g>
        ))}
        {/* x ticks */}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={x(t)} y={height - M.b + 18} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
            {t}
          </text>
        ))}

        {/* dot cloud */}
        <clipPath id={clipId}>
          <rect x={M.l} y={M.t} width={width - M.l - M.r} height={height - M.t - M.b} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {cloudPts.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={d3.point.r} fill={d3.muted} opacity={0.14} />
          ))}
          {/* ribbons under lines */}
          {series.map((s, i) =>
            s.areaPath ? <path key={`a${i}`} d={s.areaPath} fill={s.color} opacity={0.1} /> : null
          )}
          {/* lines */}
          {series.map((s, i) => (
            <path key={`l${i}`} d={s.linePath} fill="none" stroke={s.color} strokeWidth={d3.line.focusStrokeWidth} />
          ))}
        </g>

        {/* end labels */}
        {series.map((s, i) =>
          s.end ? (
            <text
              key={`e${i}`}
              x={Math.min(s.end.x + 6, width - 4)}
              y={s.end.y}
              dy=".32em"
              textAnchor="end"
              fontSize={d3.text.annotationSize}
              fontWeight={700}
              fill={s.color}
            >
              {s.label}
            </text>
          ) : null
        )}

        {/* directional + axis labels */}
        {data.leftLabel && (
          <text x={M.l} y={height - 8} fontSize={d3.text.annotationSize} fontWeight={600} fill={colorFor(colorDomain, 'positive')}>
            {data.leftLabel}
          </text>
        )}
        {data.rightLabel && (
          <text x={width - M.r} y={height - 8} textAnchor="end" fontSize={d3.text.annotationSize} fontWeight={600} fill={colorFor(colorDomain, 'negative')}>
            {data.rightLabel}
          </text>
        )}
        {data.xLabel && (
          <text x={(M.l + width - M.r) / 2} y={height - 8} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.labelFill}>
            {data.xLabel}
          </text>
        )}
        {data.yLabel && (
          <text x={M.l - 8} y={M.t - 8} textAnchor="end" fontSize={d3.text.annotationSize} fontWeight={600} fill={d3.axis.labelFill}>
            {data.yLabel}
          </text>
        )}

        {/* hover guide */}
        {hover && (
          <g>
            <line x1={hover.sx} x2={hover.sx} y1={M.t} y2={height - M.b} stroke={theme.muted} strokeDasharray="3,3" opacity={0.5} strokeWidth={d3.line.mutedStrokeWidth} />
            <circle cx={hover.sx} cy={hover.sy} r={d3.point.focusR} fill="none" stroke={theme.fg} strokeWidth={d3.line.strokeWidth} />
          </g>
        )}

        {/* invisible hover hit-area over the first series */}
        <rect
          x={M.l}
          y={M.t}
          width={width - M.l - M.r}
          height={height - M.t - M.b}
          fill="transparent"
          onMouseMove={(e) => {
            const svg = e.currentTarget.ownerSVGElement as SVGSVGElement;
            const rect = svg.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * width;
            const xv = x.invert(px);
            const s0 = series[0];
            if (!s0) return;
            const near = s0.points.reduce((a, b) => (Math.abs(b.x - xv) < Math.abs(a.x - xv) ? b : a));
            setHover({ x: near.x, y: near.value, sx: x(near.x), sy: y(near.value), label: s0.label });
          }}
        />
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.sx + 12, width - 120),
            top: hover.sy - 10,
            pointerEvents: 'none',
            background: theme.fg,
            color: theme.surface,
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: d3.axis.tickSize,
            zIndex: 10,
          }}
        >
          {Math.round(hover.x)} · <strong>{hover.y.toFixed(1)}</strong>
        </div>
      )}

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>{data.source}</figcaption>
      )}
    </figure>
  );
};

export default GradientLine;
