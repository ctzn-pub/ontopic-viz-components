'use client';

// registry/components/d3/stats/canvas-scatter-v1.tsx
//
// One unified canvas-scatter primitive, replacing the pattern shared by three
// health-of-americas-zip-codes figures:
//   - ScatterFit   (web/components/stories/OutcomePanels.tsx) — xy cloud +
//     SVG fit/LOESS overlay lines + quadtree hover tooltip
//   - DotMap       (web/components/stories/DotMap.tsx) — dim base pass for
//     unassigned points, categorical/sequential coloring, population-sized dots
//     (its Albers geo projection is intentionally NOT ported; points arrive
//     here already in x/y data space)
//   - PcaBiplot    (web/components/stories/PcaPanels.tsx) — continuous
//     color-by-value with a 5th–95th percentile domain + gradient legend
//
// Canvas draws the (up to ~25k) points; a pure-JSX SVG overlay draws axes,
// grid, and fit lines; d3.quadtree does hover hit-testing; sizing is
// devicePixelRatio-aware. Canvas is opaque to screen readers, so an accessible
// TableFallback summarizes a sample of the points.
//
// Color roles (Observatory hexes -> theme seams):
//   default cool-blue cloud            -> theme.fg (ink-first monochrome default)
//   income/burden ramps                -> scaleFor({ kind: scaleKind }) theme ramp
//   ARCH_COLORS categorical            -> colorFor(colorDomain, category, i)
//   dim base pass / no-data slate      -> d3.muted at low alpha (no-data role)
//   fit-line light ink / gold emphasis -> theme.fg / d3.accent via line `tone`

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { line as d3line } from 'd3-shape';
import { quadtree } from 'd3-quadtree';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';
import { TableFallback, TableFallbackColumn } from '@/viz/utils/table-fallback';

export interface CanvasScatterPoint {
  x: number;
  y: number;
  /** Continuous color value (used when colorMode="value"). */
  v?: number | null;
  /** Category name (used when colorMode="category"). */
  category?: string | null;
  /** Weight for dot radius, e.g. population; radius scales with its sqrt. */
  size?: number;
  /** Tooltip headline, e.g. "ZIP 43210 · OH". */
  label?: string;
}

export interface CanvasScatterLine {
  /** Polyline in data space — a fit line, LOESS curve, or reference line. */
  points: { x: number; y: number }[];
  /** Direct label drawn at the line's end. */
  label?: string;
  /** SVG dash pattern, e.g. "5 4". */
  dash?: string;
  /** Color role: 'fg' (default ink), 'accent', or 'muted'. */
  tone?: 'fg' | 'accent' | 'muted';
}

export interface D3CanvasScatterData {
  points: CanvasScatterPoint[];
  lines?: CanvasScatterLine[];
  xLabel?: string;
  yLabel?: string;
  /** Name of the continuous color value, used in tooltips and the table. */
  vLabel?: string;
  /** End captions for the continuous color legend. */
  colorLegend?: { low: string; high: string };
  /** Display order for the categorical legend; defaults to first appearance. */
  categories?: string[];
  /** Caption for the size encoding, e.g. "Dot size ∝ population". */
  sizeNote?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface D3CanvasScatterProps {
  data: D3CanvasScatterData;
  /** Fixed width; when omitted the chart tracks its container. */
  width?: number;
  height?: number;
  /** What drives point color. Explicit — never inferred from the data. */
  colorMode?: 'none' | 'value' | 'category';
  /** Continuous ramp kind for colorMode="value". */
  scaleKind?: 'sequential' | 'diverging';
  /** Flip the continuous ramp orientation. */
  reverse?: boolean;
  /** Semantic domain for colorMode="category"; null = categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
  /**
   * Continuous color domain override ([min,max], or [min,mid,max] for
   * diverging). Default: 5th–95th percentile of v (symmetric about 0 when
   * diverging), matching the source biplot.
   */
  valueDomain?: number[];
  /** Cap on the accessible table sample. */
  tableSampleSize?: number;
}

interface Hover {
  x: number;
  y: number;
  label: string | null;
  sub: string;
}

const M = { t: 18, r: 18, b: 46, l: 50 } as const;

function fmt(v: number): string {
  if (!Number.isFinite(v)) return '';
  if (Number.isInteger(v)) return new Intl.NumberFormat(undefined).format(v);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: Math.abs(v) < 10 ? 2 : 1 }).format(v);
}

/**
 * CanvasScatterD3 — a canvas point cloud (plain, value-colored, or
 * category-colored) under an SVG overlay of axes and fit lines, with
 * quadtree hover and an accessible table fallback.
 */
const CanvasScatterD3: React.FC<D3CanvasScatterProps> = ({
  data,
  width,
  height = 430,
  colorMode = 'none',
  scaleKind = 'sequential',
  reverse = false,
  colorDomain = null,
  valueDomain,
  tableSampleSize = 50,
}) => {
  const { theme, d3, colorFor, scaleFor } = useVizTheme();
  const gradId = `${useId().replace(/:/g, '')}-v-ramp`;
  const [resizeRef, measured] = useResize<HTMLDivElement>();
  // React 18 types want a non-nullable RefObject on intrinsic elements
  const ref = resizeRef as React.RefObject<HTMLDivElement>;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const pts = data.points ?? [];
  const w = width ?? measured;
  const h = height;

  const scales = useMemo(() => {
    if (w === 0 || pts.length === 0) return null;
    let xLo = Infinity;
    let xHi = -Infinity;
    let yLo = Infinity;
    let yHi = -Infinity;
    for (const p of pts) {
      if (p.x < xLo) xLo = p.x;
      if (p.x > xHi) xHi = p.x;
      if (p.y < yLo) yLo = p.y;
      if (p.y > yHi) yHi = p.y;
    }
    const sx = scaleLinear().domain([xLo, xHi]).nice().range([M.l, w - M.r]);
    const sy = scaleLinear().domain([yLo, yHi]).nice().range([h - M.b, M.t]);
    const quad = quadtree<number>()
      .x((i) => sx(pts[i].x))
      .y((i) => sy(pts[i].y))
      .addAll(pts.map((_, i) => i));
    return { sx, sy, quad };
  }, [pts, w, h]);

  // Continuous ramp: theme anchor stops laid across a percentile-trimmed
  // domain (the source biplot pinned income color to the 5th–95th pct).
  const vInfo = useMemo(() => {
    if (colorMode !== 'value') return null;
    const vs = pts
      .map((p) => p.v)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      .sort((a, b) => a - b);
    if (vs.length === 0) return null;
    const q = (p: number) => vs[Math.min(vs.length - 1, Math.round(p * (vs.length - 1)))];
    let domain: number[];
    if (valueDomain && valueDomain.length >= 2) {
      domain =
        scaleKind === 'diverging' && valueDomain.length === 2
          ? [valueDomain[0], (valueDomain[0] + valueDomain[1]) / 2, valueDomain[1]]
          : valueDomain;
    } else if (scaleKind === 'diverging') {
      const m = Math.max(Math.abs(q(0.05)), Math.abs(q(0.95))) || 1;
      domain = [-m, 0, m];
    } else {
      domain = [q(0.05), q(0.95)];
    }
    const resolved = scaleFor({ kind: scaleKind, domain, reverse });
    const color = scaleLinear<string>().domain([...resolved.stops]).range([...resolved.colors]).clamp(true);
    return { resolved, color };
  }, [pts, colorMode, scaleKind, reverse, valueDomain, scaleFor]);

  const categories = useMemo(() => {
    if (colorMode !== 'category') return [] as string[];
    if (data.categories?.length) return data.categories;
    const seen: string[] = [];
    for (const p of pts) if (p.category != null && !seen.includes(p.category)) seen.push(p.category);
    return seen;
  }, [colorMode, data.categories, pts]);

  const catIndex = useMemo(() => {
    const m = new Map<string, number>();
    categories.forEach((c, i) => m.set(c, i));
    return m;
  }, [categories]);

  const sizeScale = useMemo(() => {
    let maxS = 0;
    for (const p of pts) if (p.size != null && p.size > maxS) maxS = p.size;
    if (maxS <= 0) return null;
    // token-derived radius band; with dot.sm = 2 this is the source's 0.7–2.6px
    return scaleSqrt().domain([0, maxS]).range([d3.point.r * 0.35, d3.point.r * 1.3]).clamp(true);
  }, [pts, d3.point.r]);

  const hasUncolored =
    colorMode !== 'none' &&
    pts.some((p) =>
      colorMode === 'value' ? p.v == null || !Number.isFinite(p.v) : p.category == null,
    );

  // ── imperative canvas draw; every color resolved from the active theme, so
  //    the effect re-runs (and repaints) on theme change ──────────────────────
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !scales || w === 0) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const rDefault = d3.point.r * 0.5;
    const rOf = (p: CanvasScatterPoint) =>
      sizeScale && p.size != null ? sizeScale(p.size) : rDefault;
    const fillOf = (p: CanvasScatterPoint): string | null => {
      if (colorMode === 'value') {
        return p.v != null && Number.isFinite(p.v) && vInfo ? vInfo.color(p.v) : null;
      }
      if (colorMode === 'category') {
        return p.category != null
          ? colorFor(colorDomain, p.category, catIndex.get(p.category) ?? 0)
          : null;
      }
      return theme.fg;
    };

    // dim base pass: points without a color value/category stay visible as
    // quiet context (DotMap's "too few measures to assign" layer)
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = d3.muted;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (fillOf(p) != null) continue;
      ctx.beginPath();
      ctx.arc(scales.sx(p.x), scales.sy(p.y), rOf(p), 0, Math.PI * 2);
      ctx.fill();
    }
    // colored pass on top
    ctx.globalAlpha = 0.62;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const fill = fillOf(p);
      if (fill == null) continue;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(scales.sx(p.x), scales.sy(p.y), rOf(p), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [pts, scales, w, h, vInfo, catIndex, colorMode, colorDomain, colorFor, sizeScale, theme.fg, d3.muted, d3.point.r]);

  if (pts.length === 0) return null;

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!scales) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const i = scales.quad.find(px, py, 9);
    if (i == null) {
      setHover(null);
      return;
    }
    const p = pts[i];
    const sub = [
      `${data.xLabel ?? 'x'}: ${fmt(p.x)}`,
      `${data.yLabel ?? 'y'}: ${fmt(p.y)}`,
      ...(p.v != null && Number.isFinite(p.v) ? [`${data.vLabel ?? 'value'}: ${fmt(p.v)}`] : []),
      ...(p.category != null ? [p.category] : []),
    ].join(' · ');
    setHover({ x: px, y: py, label: p.label ?? null, sub });
  };

  const toneColor = (tone?: CanvasScatterLine['tone']): string =>
    tone === 'accent' ? d3.accent : tone === 'muted' ? d3.muted : theme.fg;
  const lineGen = scales
    ? d3line<{ x: number; y: number }>().x((p) => scales.sx(p.x)).y((p) => scales.sy(p.y))
    : null;
  const xTicks = scales ? scales.sx.ticks(6) : [];
  const yTicks = scales ? scales.sy.ticks(6) : [];
  const vSpan = vInfo
    ? vInfo.resolved.stops[vInfo.resolved.stops.length - 1] - vInfo.resolved.stops[0] || 1
    : 1;
  const ariaLabel =
    data.title ?? `Scatter plot of ${pts.length.toLocaleString()} points`;

  const tableColumns: TableFallbackColumn[] = [
    { key: 'label', label: 'Point' },
    { key: 'x', label: data.xLabel ?? 'x', numeric: true },
    { key: 'y', label: data.yLabel ?? 'y', numeric: true },
    ...(colorMode === 'value'
      ? [{ key: 'v', label: data.vLabel ?? 'value', numeric: true }]
      : []),
    ...(colorMode === 'category' ? [{ key: 'category', label: 'Category' }] : []),
  ];
  const step = Math.max(1, Math.ceil(pts.length / tableSampleSize));
  const tableRows: Record<string, unknown>[] = [];
  for (let i = 0; i < pts.length && tableRows.length < tableSampleSize; i += step) {
    const p = pts[i];
    tableRows.push({
      label: p.label ?? `#${i + 1}`,
      x: fmt(p.x),
      y: fmt(p.y),
      v: p.v != null && Number.isFinite(p.v) ? fmt(p.v) : '',
      category: p.category ?? '',
    });
  }

  return (
    <figure style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody }}>
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

      <div ref={ref} style={{ position: 'relative' }}>
        {w === 0 || !scales ? (
          <div style={{ minHeight: h }} />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={ariaLabel}
              style={{ width: w, height: h, display: 'block' }}
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            />
            <svg
              width={w}
              height={h}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              aria-hidden="true"
            >
              {/* quiet grid */}
              {d3.gridVisible
                ? yTicks.map((t) => (
                    <line
                      key={`gy${t}`}
                      x1={M.l}
                      x2={w - M.r}
                      y1={scales.sy(t)}
                      y2={scales.sy(t)}
                      stroke={d3.grid}
                      strokeDasharray={d3.gridDasharray}
                      strokeWidth={d3.line.mutedStrokeWidth}
                    />
                  ))
                : null}
              {d3.gridVertical
                ? xTicks.map((t) => (
                    <line
                      key={`gx${t}`}
                      x1={scales.sx(t)}
                      x2={scales.sx(t)}
                      y1={M.t}
                      y2={h - M.b}
                      stroke={d3.grid}
                      strokeDasharray={d3.gridDasharray}
                      strokeWidth={d3.line.mutedStrokeWidth}
                    />
                  ))
                : null}

              {/* overlay fit / LOESS / reference lines */}
              {(data.lines ?? []).map((l, li) =>
                l.points.length > 1 && lineGen ? (
                  <g key={l.label ?? li}>
                    <path
                      d={lineGen(l.points) ?? undefined}
                      fill="none"
                      stroke={toneColor(l.tone)}
                      strokeWidth={d3.line.strokeWidth}
                      strokeDasharray={l.dash}
                      opacity={0.9}
                    />
                    {l.label && (
                      <text
                        x={scales.sx(l.points[l.points.length - 1].x) - 4}
                        y={scales.sy(l.points[l.points.length - 1].y) - 6}
                        textAnchor="end"
                        fontSize={d3.text.annotationSize}
                        fill={toneColor(l.tone)}
                      >
                        {l.label}
                      </text>
                    )}
                  </g>
                ) : null,
              )}

              {/* axes */}
              <line x1={M.l} x2={w - M.r} y1={h - M.b} y2={h - M.b} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />
              <line x1={M.l} x2={M.l} y1={M.t} y2={h - M.b} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />
              {xTicks.map((t) => (
                <g key={`tx${t}`}>
                  <line x1={scales.sx(t)} x2={scales.sx(t)} y1={h - M.b} y2={h - M.b + 5} stroke={d3.axis.tickStroke} strokeWidth={d3.line.mutedStrokeWidth} />
                  <text x={scales.sx(t)} y={h - M.b + 6 + d3.axis.tickSize} textAnchor="middle" fontSize={d3.axis.tickSize} fill={d3.axis.tickFill}>
                    {fmt(t)}
                  </text>
                </g>
              ))}
              {yTicks.map((t) => (
                <g key={`ty${t}`}>
                  <line x1={M.l - 5} x2={M.l} y1={scales.sy(t)} y2={scales.sy(t)} stroke={d3.axis.tickStroke} strokeWidth={d3.line.mutedStrokeWidth} />
                  <text x={M.l - 8} y={scales.sy(t)} dy="0.32em" textAnchor="end" fontSize={d3.axis.tickSize} fill={d3.axis.tickFill}>
                    {fmt(t)}
                  </text>
                </g>
              ))}
              {data.xLabel && (
                <text x={(M.l + w - M.r) / 2} y={h - 6} textAnchor="middle" fontSize={d3.axis.labelSize} fill={d3.axis.labelFill}>
                  {data.xLabel}
                </text>
              )}
              {data.yLabel && (
                <text
                  transform={`translate(14, ${(M.t + h - M.b) / 2}) rotate(-90)`}
                  textAnchor="middle"
                  fontSize={d3.axis.labelSize}
                  fill={d3.axis.labelFill}
                >
                  {data.yLabel}
                </text>
              )}
            </svg>

            {hover && (
              <div
                style={{
                  position: 'absolute',
                  left: Math.min(hover.x + 12, w - 230),
                  top: hover.y + 10,
                  pointerEvents: 'none',
                  background: theme.fg,
                  color: theme.surface,
                  padding: '5px 8px',
                  borderRadius: 6,
                  fontSize: d3.axis.tickSize,
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {hover.label && (
                  <>
                    <strong>{hover.label}</strong>
                    <br />
                  </>
                )}
                {hover.sub}
              </div>
            )}
          </>
        )}
      </div>

      {/* legend row */}
      {(vInfo || categories.length > 0 || data.sizeNote) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 8,
            fontSize: d3.text.annotationSize,
            color: d3.muted,
          }}
        >
          {colorMode === 'value' && vInfo && (
            <>
              {data.colorLegend && <span>{data.colorLegend.low}</span>}
              <svg width={120} height={10} aria-hidden="true">
                <defs>
                  <linearGradient id={gradId} x1="0" x2="1">
                    {vInfo.resolved.stops.map((s, i) => (
                      <stop
                        key={i}
                        offset={`${((s - vInfo.resolved.stops[0]) / vSpan) * 100}%`}
                        stopColor={vInfo.resolved.colors[i]}
                      />
                    ))}
                  </linearGradient>
                </defs>
                <rect width={120} height={10} rx={2} fill={`url(#${gradId})`} stroke={d3.border} strokeWidth={d3.line.mutedStrokeWidth} />
              </svg>
              {data.colorLegend && <span>{data.colorLegend.high}</span>}
            </>
          )}
          {colorMode === 'category' &&
            categories.map((c, i) => (
              <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: theme.fg }}>
                <i
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colorFor(colorDomain, c, i),
                    display: 'inline-block',
                  }}
                />
                {c}
              </span>
            ))}
          {hasUncolored && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i
                style={{ width: 8, height: 8, borderRadius: '50%', background: d3.muted, display: 'inline-block', opacity: 0.5 }}
              />
              no value
            </span>
          )}
          {data.sizeNote && <span style={{ marginLeft: 'auto' }}>{data.sizeNote}</span>}
        </div>
      )}

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>
          {data.source}
        </figcaption>
      )}

      <TableFallback
        caption={`Sample of ${tableRows.length} of ${pts.length.toLocaleString()} points shown in the scatter plot${data.title ? ` "${data.title}"` : ''}.`}
        columns={tableColumns}
        rows={tableRows}
        label={`Show data table (${tableRows.length}-point sample)`}
      />
    </figure>
  );
};

export default CanvasScatterD3;
