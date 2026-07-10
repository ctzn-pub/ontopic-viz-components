'use client';

import React, { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3line, area as d3area, curveBasis } from 'd3-shape';
import { useVizTheme } from '@/viz/theme/provider';

export interface DensityGroup {
  label: string;
  /** Binned counts (or raw densities) — {x, weight}. Normalized to a density. */
  bins: { x: number; weight: number }[];
  /** Optional mean marker on the baseline. */
  mean?: number;
  /** Semantic color key; else categorical by index. */
  group?: string;
}

export interface DensityCurvesData {
  groups: DensityGroup[];
  xLabel?: string;
  xDomain?: [number, number];
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface DensityCurvesProps {
  data: DensityCurvesData;
  width?: number;
  /** Semantic color domain for group colors. These charts' data conventionally
   *  tags groups as 'positive'/'negative', so 'sentiment' is the default;
   *  pass 'party' for party-labeled groups or null for the categorical cycle. */
  colorDomain?: 'party' | 'sentiment' | null;
}

/**
 * DensityCurves — overlaid kernel-ish density curves for comparing the shape of
 * a distribution across a handful of groups (e.g. p25 vs p75 outcomes). Each
 * group is a filled area + line, peak-labeled, with an optional mean marker on
 * the baseline. Counts are normalized to densities so groups of different sizes
 * are comparable.
 *
 * Derived from ~11 ridgeline / density figures across the birth_death data
 * stories (e.g. born-rich-premium#ridges — poor- vs rich-raised outcome
 * densities). The example data is that figure's real `D.dist` payload.
 */
const DensityCurves: React.FC<DensityCurvesProps> = ({ data, width = 720, colorDomain = 'sentiment' }) => {
  const { theme, d3, colorFor } = useVizTheme();
  const height = Math.round(width * 0.5);
  const M = { t: 30, r: 24, b: 40, l: 24 };

  const { x, series, baseY } = useMemo(() => {
    const groups = data.groups ?? [];
    const allX = groups.flatMap((g) => g.bins.map((b) => b.x));
    const xd = data.xDomain ?? [Math.min(...allX), Math.max(...allX)];
    const x = scaleLinear().domain(xd).range([M.l, width - M.r]);

    let ymax = 0;
    const normalized = groups.map((g, i) => {
      const tot = g.bins.reduce((s, b) => s + b.weight, 0) || 1;
      const pts = [...g.bins].sort((a, b) => a.x - b.x).map((b) => ({ x: b.x, y: b.weight / tot }));
      ymax = Math.max(ymax, ...pts.map((p) => p.y));
      return {
        label: g.label,
        mean: g.mean,
        color: g.group ? colorFor(colorDomain, g.group) : colorFor(null, g.label, i),
        pts,
      };
    });
    const baseY = height - M.b;
    const y = scaleLinear().domain([0, ymax * 1.1]).range([baseY, M.t]);

    const lineGen = d3line<{ x: number; y: number }>().x((p) => x(p.x)).y((p) => y(p.y)).curve(curveBasis);
    const areaGen = d3area<{ x: number; y: number }>().x((p) => x(p.x)).y0(baseY).y1((p) => y(p.y)).curve(curveBasis);

    const series = normalized.map((s) => {
      const peak = s.pts.reduce((a, b) => (b.y > a.y ? b : a), s.pts[0] ?? { x: 0, y: 0 });
      return {
        ...s,
        linePath: lineGen(s.pts) ?? '',
        areaPath: areaGen(s.pts) ?? '',
        peak: { x: x(peak.x), y: y(peak.y) },
        meanX: s.mean != null ? x(s.mean) : null,
      };
    });
    return { x, series, baseY };
  }, [data, width, height, colorFor, colorDomain]);

  return (
    <figure
      className="density-curves"
      style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody }}
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
        aria-label={data.title ?? 'Density comparison'}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto' }}
      >
        {/* baseline */}
        <line x1={M.l} x2={width - M.r} y1={baseY} y2={baseY} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />

        {/* areas then lines */}
        {series.map((s, i) => (
          <path key={`a${i}`} d={s.areaPath} fill={s.color} opacity={0.13} />
        ))}
        {series.map((s, i) => (
          <path key={`l${i}`} d={s.linePath} fill="none" stroke={s.color} strokeWidth={d3.line.focusStrokeWidth} />
        ))}

        {/* mean markers */}
        {series.map((s, i) =>
          s.meanX != null ? (
            <circle key={`m${i}`} cx={s.meanX} cy={baseY} r={d3.point.focusR} fill={theme.accent} stroke={theme.fg} strokeWidth={d3.line.strokeWidth} />
          ) : null
        )}

        {/* peak labels */}
        {series.map((s, i) => (
          <text
            key={`p${i}`}
            x={s.peak.x}
            y={s.peak.y - 10}
            textAnchor="middle"
            fontSize={d3.axis.tickSize}
            fontWeight={700}
            fill={s.color}
            paintOrder="stroke"
            stroke={theme.surface}
            strokeWidth={4}
          >
            {s.label}
            {s.mean != null ? ` · mean ${s.mean}` : ''}
          </text>
        ))}

        {/* x label */}
        {data.xLabel && (
          <text x={(M.l + width - M.r) / 2} y={height - 8} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.axis.labelFill}>
            {data.xLabel}
          </text>
        )}
      </svg>

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>{data.source}</figcaption>
      )}
    </figure>
  );
};

export default DensityCurves;
