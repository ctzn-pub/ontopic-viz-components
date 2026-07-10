'use client';

import React, { useMemo, useState } from 'react';
import { scalePoint, scaleLinear } from 'd3-scale';
import { line as d3line, curveMonotoneX } from 'd3-shape';
import { useVizTheme } from '@/viz/theme/provider';

export interface SmallMultiplePanel {
  label: string;
  /** Ordered points along a shared categorical x-axis. */
  points: { x: string; value: number }[];
  /** Optional italic sub-note under the title (e.g. "▲ rises"). */
  note?: string;
  /** Semantic color key; else the accent. */
  group?: string;
}

export interface SmallMultiplesData {
  panels: SmallMultiplePanel[];
  /** Shared x category order (left → right). Derived from panel 0 if omitted. */
  xOrder?: string[];
  /** Endpoint hint labels under the axis, e.g. "poor" / "rich". */
  leftLabel?: string;
  rightLabel?: string;
  /** Use one shared y-domain across panels (default) or per-panel auto. */
  sharedY?: boolean;
  /** Value suffix on endpoint labels, e.g. "%". */
  unit?: string;
  /** Panels per row (default: all in one row, wraps responsively). */
  columns?: number;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface SmallMultiplesProps {
  data: SmallMultiplesData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * SmallMultiples — a grid of mini line-panels sharing one categorical x-axis, so
 * the same trend can be read across several series at once. Each panel is
 * direct-labeled with its endpoints and an optional rise/fall note. A shared
 * y-domain (default) makes panels visually comparable.
 *
 * Derived from ~15 small-multiples figures across the birth_death data stories
 * (e.g. brfss-rich-vice#c2 — four sign-flip income mini-lines). The example
 * data is that figure's real `D.signflip` payload.
 */
const SmallMultiples: React.FC<SmallMultiplesProps> = ({ data, width = 760, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const [hover, setHover] = useState<{ text: string; x: number; y: number } | null>(null);

  const panels = data.panels ?? [];
  const cols = data.columns ?? Math.min(panels.length, 4);
  const rows = Math.ceil(panels.length / cols);
  const pw = width / cols;
  const ph = pw * 0.92;
  const height = rows * ph;
  const M = { t: 38, r: 22, b: 26, l: 22 };
  const unit = data.unit ?? '';

  const xOrder = data.xOrder ?? panels[0]?.points.map((p) => p.x) ?? [];
  const sharedY = data.sharedY !== false;

  const globalDomain = useMemo<[number, number]>(() => {
    const vals = panels.flatMap((p) => p.points.map((pt) => pt.value));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = (hi - lo) * 0.18 || 2;
    return [lo - pad, hi + pad];
  }, [panels]);

  const lineGen = d3line<{ cx: number; cy: number }>().x((p) => p.cx).y((p) => p.cy).curve(curveMonotoneX);

  return (
    <figure
      className="small-multiples"
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
        aria-label={data.title ?? 'Small multiples'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        {panels.map((panel, pi) => {
          const col = pi % cols;
          const row = Math.floor(pi / cols);
          const ox = col * pw;
          const oy = row * ph;

          const x = scalePoint<string>().domain(xOrder).range([M.l, pw - M.r]).padding(0.4);
          let domain = globalDomain;
          if (!sharedY) {
            const vals = panel.points.map((p) => p.value);
            const lo = Math.min(...vals);
            const hi = Math.max(...vals);
            const pad = (hi - lo) * 0.22 || 2;
            domain = [lo - pad, hi + pad];
          }
          const y = scaleLinear().domain(domain).range([oy + ph - M.b, oy + M.t]);
          const color = panel.group ? colorFor(colorDomain, panel.group) : d3.accent;

          const pts = panel.points
            .filter((p) => x(p.x) != null)
            .map((p) => ({ ...p, cx: ox + (x(p.x) as number), cy: y(p.value) }));
          const first = pts[0];
          const last = pts[pts.length - 1];

          return (
            <g key={pi}>
              {/* baseline */}
              <line x1={ox + M.l} x2={ox + pw - M.r} y1={oy + ph - M.b} y2={oy + ph - M.b} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />
              {/* line */}
              <path d={lineGen(pts) ?? ''} fill="none" stroke={color} strokeWidth={d3.line.focusStrokeWidth} />
              {/* points */}
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.cx}
                  cy={p.cy}
                  r={d3.point.focusR}
                  fill={color}
                  stroke={theme.surface}
                  strokeWidth={d3.line.mutedStrokeWidth}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ text: `${panel.label} · ${p.x}: ${p.value}${unit}`, x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                />
              ))}
              {/* endpoint labels */}
              {first && (
                <text x={first.cx} y={first.cy - 9} textAnchor="start" fontSize={d3.text.annotationSize} fontWeight={600} fill={color}>
                  {first.value}
                  {unit}
                </text>
              )}
              {last && (
                <text x={last.cx} y={last.cy - 9} textAnchor="end" fontSize={d3.text.annotationSize} fontWeight={600} fill={color}>
                  {last.value}
                  {unit}
                </text>
              )}
              {/* panel title + note */}
              <text x={ox + pw / 2} y={oy + 18} textAnchor="middle" fontSize={d3.axis.tickSize} fontWeight={600} fill={theme.fg}>
                {panel.label}
              </text>
              {panel.note && (
                <text x={ox + pw / 2} y={oy + 32} textAnchor="middle" fontSize={d3.text.annotationSize} fontStyle="italic" fill={color}>
                  {panel.note}
                </text>
              )}
              {/* axis endpoint hints (first row of panels only) */}
              {row === rows - 1 && data.leftLabel && (
                <text x={ox + M.l} y={oy + ph - M.b + 15} fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
                  {data.leftLabel}
                </text>
              )}
              {row === rows - 1 && data.rightLabel && (
                <text x={ox + pw - M.r} y={oy + ph - M.b + 15} textAnchor="end" fontSize={d3.text.annotationSize} fill={d3.axis.tickFill}>
                  {data.rightLabel}
                </text>
              )}
            </g>
          );
        })}
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

export default SmallMultiples;
