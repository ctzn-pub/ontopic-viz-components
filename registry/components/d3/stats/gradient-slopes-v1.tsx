'use client';

import React, { useMemo, useState } from 'react';
import { scaleLinear, scaleLog } from 'd3-scale';
import { line as d3line } from 'd3-shape';
import { extent } from 'd3-array';
import { useVizTheme } from '@/viz/theme/provider';
import { useResize } from '@/viz/utils/hooks';
import { TableFallback } from '@/viz/utils/table-fallback';

export interface GradientSlopeMeasure {
  /** Short label drawn at the line's right edge. */
  label: string;
  /** One value per decile; index 0 = decile 1, the normalization reference. */
  values: number[];
  /** Optional group key (e.g. a topic); measures sharing a group share a color. */
  group?: string;
}

export interface GradientSlopesData {
  measures: GradientSlopeMeasure[];
  /** Unit suffix for tooltips and the data table, e.g. "%". */
  unit?: string;
  xLabel?: string;
  /** Annotation on the 1.0× reference line. */
  baselineLabel?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface GradientSlopesProps {
  data: GradientSlopesData;
  /** Overrides the measured container width. */
  width?: number;
  /** Semantic color domain for measure groups; unknown groups fall back to the
   *  theme's categorical cycle (stable per group). */
  colorDomain?: 'party' | 'sentiment' | null;
}

const CHART_H = 480;
const M = { t: 16, r: 168, b: 36, l: 52 };

/**
 * GradientSlopes — every measure's decile gradient on one chart, normalized so
 * decile 1 = 1.0 on a log scale. The slope IS the inequality: a line ending at
 * 2.5× means the top decile carries 2.5 times the burden of the bottom one.
 * Right-edge labels are collision-relaxed; hovering a line or its label
 * highlights that measure and dims the rest.
 *
 * Ported from the health-of-americas-zip-codes atlas (stories/GradientSlopes).
 */
const GradientSlopes: React.FC<GradientSlopesProps> = ({
  data,
  width: widthProp,
  colorDomain = 'sentiment',
}) => {
  const { theme, d3, colorFor } = useVizTheme();
  const [resizeRef, measured] = useResize<HTMLDivElement>();
  // React 18's ref prop type doesn't accept RefObject<T | null>; the narrowing is safe.
  const ref = resizeRef as React.RefObject<HTMLDivElement>;
  const [focus, setFocus] = useState<string | null>(null);

  const width = widthProp ?? measured;
  const h = CHART_H;

  const { series, labels, x, y, xTicks, yTicks, nDeciles } = useMemo(() => {
    const usable = data.measures.filter(
      (m) => m.values.length >= 2 && m.values[0] != null && m.values[0] !== 0,
    );
    // Stable color per group: first-appearance order into the resolver's index.
    const groupOrder: string[] = [];
    for (const m of usable) {
      const key = m.group ?? m.label;
      if (!groupOrder.includes(key)) groupOrder.push(key);
    }
    const series = usable.map((m) => {
      const key = m.group ?? m.label;
      const rels = m.values.map((v) => v / m.values[0]);
      return {
        id: m.label,
        label: m.label,
        values: m.values,
        rels,
        last: rels[rels.length - 1],
        color: colorFor(colorDomain, key, groupOrder.indexOf(key)),
      };
    });

    const nDeciles = Math.max(2, ...series.map((s) => s.rels.length));
    const [yLo, yHi] = extent(series.flatMap((s) => s.rels));
    const x = scaleLinear().domain([1, nDeciles]).range([M.l, width - M.r]);
    const y = scaleLog()
      .domain([Math.min(0.8, yLo ?? 0.8), yHi ?? 2])
      .range([h - M.b, M.t])
      .nice();

    // Right-edge labels with simple collision relaxation.
    const minGap = d3.label.minGap;
    const labels = series
      .map((s) => ({ id: s.id, label: s.label, color: s.color, rel: s.last, y: y(s.last) }))
      .sort((a, b) => a.y - b.y);
    for (let pass = 0; pass < 24; pass++) {
      for (let i = 1; i < labels.length; i++) {
        if (labels[i].y - labels[i - 1].y < minGap) labels[i].y = labels[i - 1].y + minGap;
      }
    }

    const xTicks = Array.from({ length: nDeciles }, (_, i) => i + 1);
    return { series, labels, x, y, xTicks, yTicks: y.ticks(6), nDeciles };
  }, [data.measures, width, h, colorFor, colorDomain, d3.label.minGap]);

  if (width === 0) return <div ref={ref} style={{ minHeight: h }} />;

  const lineGen = d3line<number>().x((_, i) => x(i + 1)).y((v) => y(v));
  const unit = data.unit ?? '';
  const fmt = (v: number) => `${v}${unit}`;
  const aria =
    data.title ?? `Relative change across ${nDeciles} deciles for ${series.length} measures`;

  return (
    <div ref={ref}>
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
          width={width}
          height={h}
          viewBox={`0 0 ${width} ${h}`}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
          onMouseLeave={() => setFocus(null)}
        >
          <title>{data.title ?? 'Decile gradient slopes'}</title>
          <desc>{aria}</desc>

          {/* 1.0× reference line */}
          <line
            x1={M.l}
            x2={width - M.r}
            y1={y(1)}
            y2={y(1)}
            stroke={d3.muted}
            strokeWidth={d3.line.mutedStrokeWidth}
            strokeDasharray={d3.gridDasharray ?? '4 3'}
          />
          <text x={M.l + 4} y={y(1) - 5} fontSize={d3.text.annotationSize} fill={d3.muted}>
            {data.baselineLabel ?? 'decile 1 = 1.0×'}
          </text>

          {/* one line per measure */}
          {series.map((s) => {
            const dim = focus != null && focus !== s.id;
            return (
              <path
                key={s.id}
                d={lineGen(s.rels) ?? undefined}
                fill="none"
                stroke={s.color}
                strokeWidth={focus === s.id ? d3.line.focusStrokeWidth : d3.line.strokeWidth}
                opacity={dim ? 0.14 : 0.85}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setFocus(s.id)}
                onMouseLeave={() => setFocus(null)}
              >
                <title>
                  {`${s.label}: ${s.last.toFixed(2)}× in the top decile (${fmt(s.values[0])} → ${fmt(s.values[s.values.length - 1])})`}
                </title>
              </path>
            );
          })}

          {/* collision-relaxed right-edge labels */}
          {labels.map((l) => {
            const dim = focus != null && focus !== l.id;
            return (
              <text
                key={l.id}
                x={width - M.r + 8}
                y={l.y + 3.5}
                fontSize={d3.text.annotationSize}
                fill={l.color}
                opacity={dim ? 0.25 : 1}
                fontWeight={focus === l.id ? 700 : 400}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setFocus(l.id)}
                onMouseLeave={() => setFocus(null)}
              >
                {l.label} {l.rel.toFixed(1)}×
              </text>
            );
          })}

          {/* bottom axis */}
          <line x1={M.l} x2={width - M.r} y1={h - M.b} y2={h - M.b} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} shapeRendering="crispEdges" />
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line x1={x(t)} x2={x(t)} y1={h - M.b} y2={h - M.b + d3.label.gap - 2} stroke={d3.axis.tickStroke} strokeWidth={d3.line.mutedStrokeWidth} shapeRendering="crispEdges" />
              <text x={x(t)} y={h - M.b + d3.label.gap + d3.axis.tickSize - 2} textAnchor="middle" fontSize={d3.axis.tickSize} fill={d3.axis.tickFill}>
                {t}
              </text>
            </g>
          ))}

          {/* left axis */}
          <line x1={M.l} x2={M.l} y1={M.t} y2={h - M.b} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} shapeRendering="crispEdges" />
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={M.l - d3.label.gap + 2} x2={M.l} y1={y(t)} y2={y(t)} stroke={d3.axis.tickStroke} strokeWidth={d3.line.mutedStrokeWidth} shapeRendering="crispEdges" />
              <text x={M.l - d3.label.gap} y={y(t)} dy=".32em" textAnchor="end" fontSize={d3.axis.tickSize} fill={d3.axis.tickFill}>
                {`${t.toFixed(1)}×`}
              </text>
            </g>
          ))}

          {data.xLabel && (
            <text x={(M.l + width - M.r) / 2} y={h - 4} textAnchor="middle" fontSize={d3.axis.labelSize} fill={d3.axis.labelFill}>
              {data.xLabel}
            </text>
          )}
        </svg>

        <TableFallback
          caption={`Relative burden in the top vs bottom decile for ${series.length} measures`}
          columns={[
            { key: 'label', label: 'Measure' },
            { key: 'd1', label: 'Decile 1', numeric: true },
            { key: 'dN', label: `Decile ${nDeciles}`, numeric: true },
            { key: 'rel', label: 'Ratio', numeric: true },
          ]}
          rows={series.map((s) => ({
            label: s.label,
            d1: fmt(s.values[0]),
            dN: fmt(s.values[s.values.length - 1]),
            rel: `${s.last.toFixed(2)}×`,
          }))}
        />

        {data.source && (
          <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>
            {data.source}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

export default GradientSlopes;
