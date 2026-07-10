'use client';

// registry/components/d3/stats/correlation-matrix-v1.tsx
//
// Ported from health-of-americas-zip-codes (web/components/stories/
// CorrelationMatrix.tsx: CorrelationMatrix + ContextHeatmap). The original drew
// a 26x26 Spearman matrix whose hierarchical ordering was precomputed in the
// Python pipeline (average-linkage clustering on 1 - rho with optimal leaf
// ordering). This port keeps that contract for pre-ordered payloads
// (`data.ordered: true`) AND carries a lightweight in-component average-linkage
// ordering so raw, unordered matrices work without a pipeline.
//
// Color roles (Observatory hexes -> theme seams):
//   CORR_RAMP (cool blue -> dark neutral -> warm red) -> scaleFor({ kind: 'diverging' })
//   TOPIC_COLORS (per-topic label hues)               -> colorFor(null, topic, i) cycle
//   diagonal / n-a tiles (two raised dark neutrals)   -> d3.grid at two opacities
// Under the observatory theme the diverging ramp reads cool-negative /
// warm-positive exactly like the source; other themes keep their own diverging
// orientation (flip with the `reverse` prop if a story needs the poles swapped).

import React, { useId, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';

export interface D3CorrelationContext {
  /** Optional heading rendered above the context strip. */
  title?: string;
  keys: string[];
  labels: string[];
  /** What a higher value of each context variable means, e.g. "more poverty". */
  higher?: string[];
  /** [measure][context] correlations, rows in the same order as `ids`. */
  matrix: (number | null)[][];
}

export interface D3CorrelationMatrixData {
  ids: string[];
  labels: string[];
  /** Per-measure topic; labels take a stable categorical color per topic. */
  topics?: string[];
  /** Square correlation matrix in `ids` order; values in [-1, 1], null = n/a. */
  matrix: (number | null)[][];
  /** True when ids/matrix arrive already hierarchically ordered upstream. */
  ordered?: boolean;
  /** Optional measures x demographics strip rendered as a second panel. */
  context?: D3CorrelationContext;
  /** Statistic name for tooltips, e.g. "Spearman ρ". */
  statLabel?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface D3CorrelationMatrixProps {
  data: D3CorrelationMatrixData;
  /** Fixed width; when omitted the chart tracks its container. */
  width?: number;
  /**
   * 'auto' (default): keep the input order when `data.ordered` is set,
   * otherwise cluster in-component. 'given' / 'hierarchical' force one mode.
   */
  order?: 'auto' | 'given' | 'hierarchical';
  /** Flip the diverging ramp so the warm/cool poles swap. */
  reverse?: boolean;
  /** Hide the context strip even when `data.context` is present. */
  showContext?: boolean;
}

interface Hover {
  panel: 'matrix' | 'context';
  x: number;
  y: number;
  text: string;
  sub: string;
}

/**
 * Average-linkage agglomerative clustering on distance 1 - rho, read out as a
 * leaf order. At each merge the two sides are oriented so the closest pair of
 * leaves sits at the junction — a cheap approximation of scipy's
 * optimal_leaf_ordering, which is what the source pipeline used.
 */
function hierarchicalLeafOrder(matrix: (number | null)[][]): number[] {
  const n = matrix.length;
  if (n < 3) return Array.from({ length: n }, (_, i) => i);
  const leafDist = (a: number, b: number): number => 1 - (matrix[a]?.[b] ?? 0);

  let clusters: number[][] = Array.from({ length: n }, (_, i) => [i]);
  const avgDist = (A: number[], B: number[]): number => {
    let sum = 0;
    for (const a of A) for (const b of B) sum += leafDist(a, b);
    return sum / (A.length * B.length);
  };

  while (clusters.length > 1) {
    let bi = 0;
    let bj = 1;
    let best = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dd = avgDist(clusters[i], clusters[j]);
        if (dd < best) {
          best = dd;
          bi = i;
          bj = j;
        }
      }
    }
    const A = clusters[bi];
    const B = clusters[bj];
    const orientations: [number[], number[]][] = [
      [A, B],
      [A, [...B].reverse()],
      [[...A].reverse(), B],
      [[...A].reverse(), [...B].reverse()],
    ];
    let merged = [...A, ...B];
    let bestJunction = Infinity;
    for (const [a, b] of orientations) {
      const dj = leafDist(a[a.length - 1], b[0]);
      if (dj < bestJunction) {
        bestJunction = dj;
        merged = [...a, ...b];
      }
    }
    clusters = clusters.filter((_, k) => k !== bi && k !== bj);
    clusters.push(merged);
  }
  return clusters[0];
}

/**
 * CorrelationMatrixD3 — a hierarchically ordered correlation matrix with
 * topic-colored labels, a diverging-ramp legend, and an optional
 * measures x demographics context strip.
 *
 * The SVG is pure JSX; the only computation is the (optional) in-component
 * leaf ordering. Cell color flows through the theme's diverging ramp.
 */
const CorrelationMatrixD3: React.FC<D3CorrelationMatrixProps> = ({
  data,
  width,
  order = 'auto',
  reverse = false,
  showContext = true,
}) => {
  const { theme, d3, colorFor, scaleFor } = useVizTheme();
  const gradId = `${useId().replace(/:/g, '')}-corr-ramp`;
  const [resizeRef, measured] = useResize<HTMLDivElement>();
  // React 18 types want a non-nullable RefObject on intrinsic elements
  const ref = resizeRef as React.RefObject<HTMLDivElement>;
  const [hover, setHover] = useState<Hover | null>(null);
  const w = width ?? measured;

  const view = useMemo(() => {
    const n = data.ids?.length ?? 0;
    const identity = Array.from({ length: n }, (_, i) => i);
    const useGiven = order === 'given' || (order === 'auto' && data.ordered === true);
    const perm = useGiven || n < 3 ? identity : hierarchicalLeafOrder(data.matrix);
    const topicsIn = data.topics;
    const contextIn = data.context;
    return {
      n,
      ids: perm.map((i) => data.ids[i]),
      labels: perm.map((i) => data.labels?.[i] ?? data.ids[i]),
      topics: topicsIn ? perm.map((i) => topicsIn[i]) : null,
      matrix: perm.map((i) => perm.map((j) => data.matrix[i]?.[j] ?? null)),
      contextMatrix: contextIn ? perm.map((i) => contextIn.matrix[i] ?? []) : null,
    };
  }, [data, order]);

  // Diverging ramp over [-1, 1] from the active theme; anchor stops are shared
  // with every other engine so the matrix and a choropleth of the same values
  // could never disagree.
  const ramp = useMemo(
    () => scaleFor({ kind: 'diverging', domain: [-1, 0, 1], reverse }),
    [scaleFor, reverse],
  );
  const corrColor = useMemo(
    () => scaleLinear<string>().domain([...ramp.stops]).range([...ramp.colors]).clamp(true),
    [ramp],
  );

  // Topic -> stable index into the categorical cycle, by first appearance in
  // the ORIGINAL data order so reordering never reshuffles topic colors.
  const topicIndex = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of data.topics ?? []) if (!m.has(t)) m.set(t, m.size);
    return m;
  }, [data.topics]);
  const topicColor = (topic: string | null | undefined): string =>
    topic == null ? d3.muted : colorFor(null, topic, topicIndex.get(topic) ?? 0);

  const stat = data.statLabel ?? 'r';
  const n = view.n;
  const labelW = 128;
  const labelH = 118;
  const context = showContext ? data.context ?? null : null;

  if (n === 0) return null;
  if (w === 0) {
    return (
      <figure style={{ margin: 0 }}>
        <div ref={ref} style={{ minHeight: 420 }} />
      </figure>
    );
  }

  // ── main matrix geometry (source: cell 8..22px from container width) ──────
  const cell = Math.max(8, Math.min(22, (w - labelW - 8) / n));
  const mW = labelW + cell * n + 8;
  const mH = labelH + cell * n + 8;

  // ── context strip geometry ─────────────────────────────────────────────────
  const nC = context?.keys.length ?? 0;
  const ctxLabelH = 104;
  const ctxCell = nC > 0 ? Math.max(14, Math.min(34, (w - labelW - 8) / nC)) : 0;
  const ctxRowH = Math.max(11, Math.min(16, ctxCell * 0.62));
  const ctxW = labelW + ctxCell * nC + 8;
  const ctxH = ctxLabelH + ctxRowH * n + 8;

  const tooltip = (hv: Hover) => (
    <div
      style={{
        position: 'absolute',
        left: Math.min(hv.x + 12, w - 210),
        top: hv.y - 44,
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
      <strong>{hv.text}</strong>
      <br />
      {hv.sub}
    </div>
  );

  const span = ramp.stops[ramp.stops.length - 1] - ramp.stops[0] || 1;

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
        <svg
          width={mW}
          height={mH}
          role="img"
          aria-label={`Correlation matrix of ${n} measures`}
          style={{ display: 'block', maxWidth: '100%' }}
        >
          <title>Correlation matrix</title>
          <desc>{`${n} by ${n} matrix of pairwise correlations, ordered so correlated blocks sit together.`}</desc>
          {/* column labels (rotated) */}
          {view.labels.map((lab, j) => (
            <text
              key={`c${j}`}
              x={labelW + j * cell + cell / 2}
              y={labelH - 6}
              transform={`rotate(-52 ${labelW + j * cell + cell / 2} ${labelH - 6})`}
              textAnchor="start"
              fontSize={d3.text.annotationSize}
              fill={topicColor(view.topics?.[j])}
            >
              {lab}
            </text>
          ))}
          {/* row labels */}
          {view.labels.map((lab, i) => (
            <text
              key={`r${i}`}
              x={labelW - 8}
              y={labelH + i * cell + cell / 2 + 3.5}
              textAnchor="end"
              fontSize={d3.text.annotationSize}
              fill={topicColor(view.topics?.[i])}
            >
              {lab}
            </text>
          ))}
          {view.matrix.map((row, i) =>
            row.map((v, j) => (
              <rect
                key={`${i}-${j}`}
                x={labelW + j * cell}
                y={labelH + i * cell}
                width={Math.max(1, cell - 1)}
                height={Math.max(1, cell - 1)}
                rx={1.5}
                fill={i === j || v == null ? d3.grid : corrColor(v)}
                opacity={i === j ? 0.85 : v == null ? 0.45 : 1}
                onMouseEnter={() =>
                  i !== j &&
                  setHover({
                    panel: 'matrix',
                    x: labelW + j * cell + cell / 2,
                    y: labelH + i * cell,
                    text: `${view.labels[i]} × ${view.labels[j]}`,
                    sub: v == null ? 'n/a' : `${stat} = ${v.toFixed(2)}`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
            )),
          )}
        </svg>
        {hover?.panel === 'matrix' && tooltip(hover)}

        {/* legend: diverging ramp + topic chips */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <svg width={170} height={28} aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0" x2="1">
                {ramp.stops.map((s, i) => (
                  <stop key={i} offset={`${((s - ramp.stops[0]) / span) * 100}%`} stopColor={ramp.colors[i]} />
                ))}
              </linearGradient>
            </defs>
            <rect x={0} y={4} width={170} height={10} rx={2} fill={`url(#${gradId})`} stroke={d3.border} strokeWidth={d3.line.mutedStrokeWidth} />
            <text x={0} y={26} fontSize={d3.text.annotationSize} fill={d3.muted}>
              −1
            </text>
            <text x={85} y={26} fontSize={d3.text.annotationSize} fill={d3.muted} textAnchor="middle">
              0
            </text>
            <text x={170} y={26} fontSize={d3.text.annotationSize} fill={d3.muted} textAnchor="end">
              +1
            </text>
          </svg>
          {[...topicIndex.keys()].map((t) => (
            <span
              key={t}
              style={{ fontSize: d3.text.annotationSize, color: d3.muted, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <i
                style={{ width: 8, height: 8, borderRadius: '50%', background: topicColor(t), display: 'inline-block' }}
              />
              {t}
            </span>
          ))}
        </div>

        {/* optional measures x demographics strip */}
        {context && view.contextMatrix && (
          <div style={{ position: 'relative', marginTop: 18 }}>
            {context.title && (
              <h4 style={{ fontSize: d3.text.subtitleSize, fontWeight: 600, color: theme.fg, margin: '0 0 6px' }}>
                {context.title}
              </h4>
            )}
            <svg
              width={ctxW}
              height={ctxH}
              role="img"
              aria-label={`Correlation of each measure with ${nC} context variables`}
              style={{ display: 'block', maxWidth: '100%' }}
            >
              <title>{context.title ?? 'Context correlations'}</title>
              <desc>{`Correlation of each of the ${n} measures with ${nC} demographic context variables.`}</desc>
              {context.labels.map((lab, j) => (
                <text
                  key={`c${j}`}
                  x={labelW + j * ctxCell + ctxCell / 2}
                  y={ctxLabelH - 6}
                  transform={`rotate(-44 ${labelW + j * ctxCell + ctxCell / 2} ${ctxLabelH - 6})`}
                  textAnchor="start"
                  fontSize={d3.text.annotationSize}
                  fill={d3.muted}
                >
                  {lab}
                </text>
              ))}
              {view.labels.map((lab, i) => (
                <text
                  key={`r${i}`}
                  x={labelW - 8}
                  y={ctxLabelH + i * ctxRowH + ctxRowH / 2 + 3.5}
                  textAnchor="end"
                  fontSize={d3.text.annotationSize}
                  fill={topicColor(view.topics?.[i])}
                >
                  {lab}
                </text>
              ))}
              {view.contextMatrix.map((row, i) =>
                row.map((v, j) => (
                  <rect
                    key={`${i}-${j}`}
                    x={labelW + j * ctxCell}
                    y={ctxLabelH + i * ctxRowH}
                    width={Math.max(1, ctxCell - 1.5)}
                    height={Math.max(1, ctxRowH - 1.5)}
                    rx={1.5}
                    fill={v == null ? d3.grid : corrColor(v)}
                    opacity={v == null ? 0.45 : 1}
                    onMouseEnter={() =>
                      setHover({
                        panel: 'context',
                        x: labelW + j * ctxCell,
                        y: ctxLabelH + i * ctxRowH,
                        text: `${view.labels[i]} × ${context.labels[j]}`,
                        sub:
                          v == null
                            ? 'n/a'
                            : `${stat} = ${v.toFixed(2)}${context.higher?.[j] ? ` (higher = ${context.higher[j]})` : ''}`,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                )),
              )}
            </svg>
            {hover?.panel === 'context' && tooltip(hover)}
          </div>
        )}
      </div>

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>
          {data.source}
        </figcaption>
      )}
    </figure>
  );
};

export default CorrelationMatrixD3;
