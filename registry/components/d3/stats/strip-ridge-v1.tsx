'use client';

import React, { useId, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { area, curveBasis } from 'd3-shape';
import { max, sum } from 'd3-array';
import { useVizTheme } from '@/viz/theme/provider';

export interface StripRidgeDistribution {
  /** Histogram bins as [x0, x1, count]. */
  bins: [number, number, number][];
  /** Full extent of the underlying values (fallback domain if trimming degenerates). */
  min: number;
  max: number;
}

export interface StripRidgeMeta {
  label: string;
  /** [min, midpoint, max] — the measure's full value domain. With
   *  scaleKind="diverging" the ramp's neutral center is pinned to domain[1]
   *  at its TRUE position even when the visible strip is asymmetric. */
  domain: [number, number, number];
  /** 'percent' appends a % suffix in the accessible summary. */
  unit?: string;
}

export interface StripRidgeData {
  dist: StripRidgeDistribution;
  /** National / benchmark reference value (dashed rule). */
  benchmark: number;
  /** Tag over the benchmark rule; defaults to "Avg". */
  benchmarkLabel?: string;
  /** Optional group/state comparison value (solid rule). */
  comparison?: number | null;
  comparisonLabel?: string;
  /** The subject's own value (halo rule + dot); null renders "no estimate". */
  subject?: number | null;
  meta: StripRidgeMeta;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface StripRidgeProps {
  data: StripRidgeData;
  width?: number;
  /** 'sequential' lays the theme's burden-style ramp across the visible strip;
   *  'diverging' uses the gap-style ramp with its neutral midpoint at
   *  meta.domain[1]'s true position. */
  scaleKind?: 'sequential' | 'diverging';
  /** Semantic domain for the comparison marker, which carries the
   *  'positive' (better/cool) role. */
  colorDomain?: 'party' | 'sentiment' | null;
}

const H = 56;
const PAD = 6;
const TOP = 11;
const BASE = H - 19;

function formatValue(value: number, unit?: string): string {
  const v = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
  return unit === 'percent' ? `${v}%` : v;
}

function summaryText(data: StripRidgeData): string {
  const { meta, benchmark, comparison, comparisonLabel, subject } = data;
  if (subject == null) return `${meta.label}: no estimate for this place.`;
  const vs = subject < benchmark ? 'below' : subject > benchmark ? 'above' : 'at';
  const cmp =
    comparison != null
      ? ` and the ${comparisonLabel ?? 'comparison'} average of ${formatValue(comparison, meta.unit)}`
      : '';
  return `${meta.label}: ${formatValue(subject, meta.unit)}, ${vs} the benchmark of ${formatValue(benchmark, meta.unit)}${cmp}.`;
}

/**
 * StripRidge — a compact one-row distribution strip: the full distribution as a
 * smoothed ridgeline silhouette filled with the theme's continuous ramp,
 * tail-trimmed to the central ~95% of mass so outliers don't squash the shape,
 * with benchmark, comparison, and subject markers always kept in view.
 *
 * Ported from the health-of-americas-zip-codes atlas (snapshot/StripPlot). The
 * signature detail survives the port: diverging strips place the gradient stops
 * at their true value positions, so the neutral color sits at the measure's
 * midpoint even when the visible domain is asymmetric.
 */
const StripRidge: React.FC<StripRidgeProps> = ({
  data,
  width = 480,
  scaleKind = 'sequential',
  colorDomain = 'sentiment',
}) => {
  const { theme, d3, colorFor, scaleFor } = useVizTheme();
  const gid = useId().replace(/:/g, '');

  const { dist, benchmark, comparison = null, subject = null, meta } = data;
  const innerW = Math.max(10, width - PAD * 2);

  const {
    ridge, gradientStops, dotColor, usX, cmpX, subjX,
  } = useMemo(() => {
    // Trim extreme tails: keep the central ~95% of mass, but always include
    // the benchmark / comparison / subject markers.
    const total = sum(dist.bins, (b) => b[2]) || 1;
    let lo = dist.min;
    let hi = dist.max;
    let acc = 0;
    for (const b of dist.bins) {
      acc += b[2];
      if (acc / total >= 0.025) { lo = b[0]; break; }
    }
    acc = 0;
    for (let i = dist.bins.length - 1; i >= 0; i--) {
      acc += dist.bins[i][2];
      if (acc / total >= 0.025) { hi = dist.bins[i][1]; break; }
    }
    const marks = [benchmark, comparison, subject].filter((v): v is number => v != null);
    lo = Math.min(lo, ...marks);
    hi = Math.max(hi, ...marks);
    if (hi <= lo) { lo = dist.min; hi = dist.max; }

    const x = scaleLinear().domain([lo, hi]).range([PAD, PAD + innerW]).clamp(true);

    // Continuous ramp from the theme. Diverging anchors span the full metric
    // domain so the neutral stop lands at meta.domain[1]'s true position.
    const resolved = scaleFor(
      scaleKind === 'diverging'
        ? { kind: 'diverging', domain: [meta.domain[0], meta.domain[1], meta.domain[2]] }
        : { kind: 'sequential', domain: [lo, hi] },
    );
    const span = hi - lo || 1;
    const gradientStops = resolved.colors.map((color, i) => ({
      color,
      offset: Math.max(0, Math.min(1, (resolved.stops[i] - lo) / span)),
    }));
    const dotColor = scaleLinear<string>()
      .domain([...resolved.stops])
      .range([...resolved.colors])
      .clamp(true);

    // Distribution ridgeline from the histogram bins, smoothed.
    const visBins = dist.bins.filter((b) => (b[0] + b[1]) / 2 >= lo && (b[0] + b[1]) / 2 <= hi);
    const maxCount = (max(visBins, (b) => b[2]) ?? 0) || 1;
    const y = scaleLinear().domain([0, maxCount]).range([BASE, TOP]);
    const pts: [number, number][] = visBins.map((b) => [(b[0] + b[1]) / 2, b[2]]);
    const areaGen = area<[number, number]>()
      .x((p) => x(p[0]))
      .y0(BASE)
      .y1((p) => y(p[1]))
      .curve(curveBasis);
    const ridge = pts.length ? areaGen(pts) ?? '' : '';

    return {
      ridge,
      gradientStops,
      dotColor,
      usX: x(benchmark),
      cmpX: comparison != null ? x(comparison) : null,
      subjX: subject != null ? x(subject) : null,
    };
  }, [dist, benchmark, comparison, subject, meta.domain, innerW, scaleKind, scaleFor]);

  const comparisonColor = colorFor(colorDomain, 'positive');
  const aria = summaryText(data);

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

      <svg
        role="img"
        aria-label={aria}
        viewBox={`0 0 ${width} ${H}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto', overflow: 'visible' }}
      >
        <title>{meta.label}</title>
        <desc>{aria}</desc>
        <defs>
          <linearGradient id={`ramp-${gid}`} x1="0" x2="1" y1="0" y2="0">
            {gradientStops.map((s, i) => (
              <stop key={i} offset={`${s.offset * 100}%`} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        {/* baseline */}
        <line x1={PAD} x2={PAD + innerW} y1={BASE} y2={BASE} stroke={d3.grid} strokeWidth={d3.line.mutedStrokeWidth} shapeRendering="crispEdges" />

        {/* distribution ridgeline, filled with the theme ramp */}
        {ridge && (
          <path
            d={ridge}
            fill={`url(#ramp-${gid})`}
            fillOpacity={0.32}
            stroke={`url(#ramp-${gid})`}
            strokeOpacity={0.5}
            strokeWidth={d3.line.mutedStrokeWidth}
          />
        )}

        {/* benchmark reference */}
        <line x1={usX} x2={usX} y1={TOP - 3} y2={BASE} stroke={d3.muted} strokeWidth={d3.line.strokeWidth} strokeDasharray={d3.gridDasharray ?? '3 3'} />
        <text x={usX} y={TOP - 5} textAnchor="middle" fontSize={d3.text.annotationSize} fontWeight={600} fill={d3.muted}>
          {data.benchmarkLabel ?? 'Avg'}
        </text>

        {/* comparison reference (better/cool role) */}
        {cmpX != null && (
          <>
            <line x1={cmpX} x2={cmpX} y1={TOP - 3} y2={BASE} stroke={comparisonColor} strokeWidth={d3.line.strokeWidth} strokeOpacity={0.8} />
            <text x={cmpX} y={BASE + 12} textAnchor="middle" fontSize={d3.text.annotationSize} fontWeight={600} fill={comparisonColor}>
              {data.comparisonLabel ?? ''}
            </text>
          </>
        )}

        {/* the subject itself: surface-colored halo notch + ramp-colored dot */}
        {subjX != null && subject != null ? (
          <>
            <line x1={subjX} x2={subjX} y1={TOP - 2} y2={BASE} stroke={d3.surface} strokeWidth={d3.line.focusStrokeWidth} />
            <circle cx={subjX} cy={BASE} r={d3.point.focusR} fill={dotColor(subject)} stroke={theme.fg} strokeWidth={d3.line.strokeWidth} />
          </>
        ) : (
          <text x={PAD + innerW / 2} y={BASE - 6} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.muted}>
            no estimate
          </text>
        )}
      </svg>

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>
          {data.source}
        </figcaption>
      )}
    </figure>
  );
};

export default StripRidge;
