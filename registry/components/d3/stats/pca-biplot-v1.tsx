'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

export interface D3PCAScore {
  x: number;
  y: number;
}

export interface D3PCALoading {
  label: string;
  x: number;
  y: number;
}

export interface D3PCABiplotData {
  /** Observation scores. */
  points: D3PCAScore[];
  /** Variable loadings, drawn as vectors from the origin. */
  arrows: D3PCALoading[];
  /** Variance explained by PC1, shown in the x-axis label. */
  pc1_var?: number | string;
  /** Variance explained by PC2, shown in the y-axis label. */
  pc2_var?: number | string;
  note?: string;
}

export interface D3PCABiplotProps {
  data: D3PCABiplotData;
  width?: number;
  height?: number;
  /** Optional vector labels to emphasize on first render. */
  highlightLabels?: string[];
  /** Maximum label length before truncation. */
  maxLabelLength?: number;
}

const EMPTY_LABELS: string[] = [];

interface VectorLabel {
  label: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'end';
}

function radius98(points: D3PCAScore[]): number {
  const radii = points.map((p) => Math.hypot(p.x, p.y)).sort((a, b) => a - b);
  return radii[Math.floor(radii.length * 0.98)] || Math.max(0.001, ...radii);
}

function trimLabel(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, Math.max(1, max - 3))}...` : label;
}

function formatPct(value: number | string | undefined): string {
  return value == null || value === '' ? '' : ` (${value}%)`;
}

function collideLabels(labels: VectorLabel[], minGap: number, yMin: number, yMax: number) {
  for (const side of ['start', 'end'] as const) {
    const sideLabels = labels.filter((label) => label.anchor === side).sort((a, b) => a.labelY - b.labelY);
    for (let i = 1; i < sideLabels.length; i++) {
      if (sideLabels[i].labelY - sideLabels[i - 1].labelY < minGap) {
        sideLabels[i].labelY = sideLabels[i - 1].labelY + minGap;
      }
    }
    for (let i = sideLabels.length - 1; i >= 0; i--) {
      if (sideLabels[i].labelY > yMax) sideLabels[i].labelY = yMax;
      if (i > 0 && sideLabels[i].labelY - sideLabels[i - 1].labelY < minGap) {
        sideLabels[i - 1].labelY = sideLabels[i].labelY - minGap;
      }
    }
    for (const label of sideLabels) label.labelY = Math.max(yMin, Math.min(yMax, label.labelY));
  }
}

/**
 * PCABiplotD3 — observation scores as a restrained point cloud with loading
 * vectors that can be focused and read directly.
 *
 * D3 owns the linear scales; React renders the SVG and interaction states.
 * Vector color is a semantic role distinction from the active theme, while the
 * score cloud remains quiet context.
 */
const PCABiplotD3: React.FC<D3PCABiplotProps> = ({
  data,
  width = 760,
  height = 540,
  highlightLabels = EMPTY_LABELS,
  maxLabelLength,
}) => {
  const { theme, colorFor, d3 } = useVizTheme();
  const markerBase = useId().replace(/:/g, '');
  const [focusedLabel, setFocusedLabel] = useState<string | null>(highlightLabels[0] ?? null);

  useEffect(() => {
    setFocusedLabel(highlightLabels[0] ?? null);
  }, [highlightLabels]);

  const rawPoints = data?.points ?? [];
  const rawArrows = data?.arrows ?? [];
  const labelLimit = maxLabelLength ?? d3.label.maxChars;
  const margin = d3.wideRightMargin;
  const chartWidth = Math.max(width, margin.left + margin.right + 1);
  const chartHeight = Math.max(height, margin.top + margin.bottom + 1);
  const innerLeft = margin.left;
  const innerRight = chartWidth - margin.right;
  const innerTop = margin.top;
  const innerBottom = chartHeight - margin.bottom;
  const vectorColor = colorFor('sentiment', 'negative');

  const scaled = useMemo(() => {
    if (rawPoints.length === 0 && rawArrows.length === 0) {
      return { points: [] as D3PCAScore[], arrows: [] as D3PCALoading[] };
    }
    const arrowMax = Math.max(0.001, ...rawArrows.map((a) => Math.hypot(a.x, a.y)));
    const pointHi = rawPoints.length ? radius98(rawPoints) : 1;
    const k = (arrowMax * 0.85) / pointHi;
    return {
      points: rawPoints.map((p) => ({ x: p.x * k, y: p.y * k })),
      arrows: rawArrows,
    };
  }, [rawPoints, rawArrows]);

  const extents = useMemo(() => {
    const xs = [
      ...scaled.points.map((p) => p.x),
      ...scaled.arrows.flatMap((a) => [a.x, a.x * 1.24]),
      0,
    ];
    const ys = [
      ...scaled.points.map((p) => p.y),
      ...scaled.arrows.flatMap((a) => [a.y, a.y * 1.24]),
      0,
    ];
    const xAbs = Math.max(0.001, Math.abs(Math.min(...xs)), Math.abs(Math.max(...xs)));
    const yAbs = Math.max(0.001, Math.abs(Math.min(...ys)), Math.abs(Math.max(...ys)));
    return { x: [-xAbs, xAbs] as [number, number], y: [-yAbs, yAbs] as [number, number] };
  }, [scaled]);

  const xScale = useMemo(
    () => scaleLinear().domain(extents.x).nice().range([innerLeft, innerRight]),
    [extents.x, innerLeft, innerRight],
  );
  const yScale = useMemo(
    () => scaleLinear().domain(extents.y).nice().range([innerBottom, innerTop]),
    [extents.y, innerBottom, innerTop],
  );

  const vectorLabels = useMemo(() => {
    const labels = scaled.arrows.map((arrow) => {
      const sx = xScale(arrow.x);
      const sy = yScale(arrow.y);
      return {
        label: arrow.label,
        x: sx,
        y: sy,
        labelX: xScale(arrow.x * 1.2),
        labelY: yScale(arrow.y * 1.2),
        anchor: arrow.x >= 0 ? 'start' : 'end',
      } satisfies VectorLabel;
    });
    collideLabels(labels, d3.label.minGap, innerTop, innerBottom);
    return labels;
  }, [scaled.arrows, xScale, yScale, d3.label.minGap, innerTop, innerBottom]);

  const focusedVector = focusedLabel
    ? vectorLabels.find((label) => label.label === focusedLabel) ?? null
    : null;
  const highlightSet = new Set(highlightLabels);
  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);
  const markerId = `${markerBase}-pca-arrow`;
  const ariaLabel = `D3 PCA biplot with ${scaled.points.length} scores and ${scaled.arrows.length} loading vectors.`;

  if (scaled.points.length === 0 && scaled.arrows.length === 0) return null;

  return (
    <figure style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody }}>
      <svg
        role="img"
        aria-label={ariaLabel}
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ display: 'block', maxWidth: '100%', height: 'auto', background: d3.surface }}
        onMouseLeave={() => setFocusedLabel(highlightLabels[0] ?? null)}
      >
        <title>PCA biplot</title>
        <desc>{ariaLabel}</desc>
        <defs>
          <marker
            id={markerId}
            markerWidth={7}
            markerHeight={7}
            refX={6}
            refY={3.5}
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" fill={vectorColor} />
          </marker>
        </defs>

        {d3.gridVisible
          ? yTicks.map((tick) => (
              <line
                key={`y-${tick}`}
                x1={innerLeft}
                x2={innerRight}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke={d3.grid}
                strokeDasharray={d3.gridDasharray}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
            ))
          : null}
        {d3.gridVertical
          ? xTicks.map((tick) => (
              <line
                key={`x-${tick}`}
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={innerTop}
                y2={innerBottom}
                stroke={d3.grid}
                strokeDasharray={d3.gridDasharray}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
            ))
          : null}

        <line x1={innerLeft} x2={innerRight} y1={yScale(0)} y2={yScale(0)} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />
        <line x1={xScale(0)} x2={xScale(0)} y1={innerTop} y2={innerBottom} stroke={d3.axis.stroke} strokeWidth={d3.line.mutedStrokeWidth} />

        {scaled.points.map((point, i) => (
          <circle
            key={i}
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r={d3.point.r}
            fill={d3.muted}
            fillOpacity={focusedLabel ? 0.16 : 0.28}
          />
        ))}

        {scaled.arrows.map((arrow) => {
          const active = focusedLabel === arrow.label || highlightSet.has(arrow.label);
          return (
            <line
              key={arrow.label}
              x1={xScale(0)}
              y1={yScale(0)}
              x2={xScale(arrow.x)}
              y2={yScale(arrow.y)}
              stroke={vectorColor}
              strokeWidth={active ? d3.line.focusStrokeWidth : d3.line.strokeWidth}
              strokeOpacity={focusedLabel && !active ? d3.line.mutedOpacity : d3.line.focusOpacity}
              markerEnd={`url(#${markerId})`}
            />
          );
        })}

        {vectorLabels.map((label) => {
          const active = focusedLabel === label.label || highlightSet.has(label.label);
          return (
            <g key={label.label}>
              <line
                x1={label.x}
                y1={label.y}
                x2={label.labelX + (label.anchor === 'start' ? -d3.label.leaderOffset : d3.label.leaderOffset)}
                y2={label.labelY}
                stroke={vectorColor}
                strokeOpacity={active ? d3.line.focusOpacity : d3.line.opacity}
                strokeWidth={d3.line.mutedStrokeWidth}
              />
              <text
                x={label.labelX}
                y={label.labelY}
                dy="0.32em"
                textAnchor={label.anchor}
                fill={vectorColor}
                fillOpacity={focusedLabel && !active ? d3.line.opacity : d3.line.focusOpacity}
                fontFamily={d3.fontBody}
                fontSize={d3.text.annotationSize}
                fontWeight={active ? 700 : 600}
              >
                {trimLabel(label.label, labelLimit)}
                <title>{label.label}</title>
              </text>
              <circle
                cx={label.x}
                cy={label.y}
                r={d3.point.focusR}
                fill={d3.hitStroke}
                stroke={d3.hitStroke}
                strokeWidth={d3.hitStrokeWidth}
                pointerEvents="all"
                tabIndex={0}
                role="button"
                aria-label={`Focus loading vector ${label.label}`}
                onMouseEnter={() => setFocusedLabel(label.label)}
                onFocus={() => setFocusedLabel(label.label)}
                onClick={() => setFocusedLabel(label.label)}
                onBlur={() => setFocusedLabel(highlightLabels[0] ?? null)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}

        <text x={(innerLeft + innerRight) / 2} y={chartHeight - d3.label.gap} textAnchor="middle" fill={d3.axis.labelFill} fontFamily={d3.fontBody} fontSize={d3.axis.labelSize}>
          PC1{formatPct(data?.pc1_var)}
        </text>
        <text
          x={d3.label.gap}
          y={(innerTop + innerBottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${d3.label.gap} ${(innerTop + innerBottom) / 2})`}
          fill={d3.axis.labelFill}
          fontFamily={d3.fontBody}
          fontSize={d3.axis.labelSize}
        >
          PC2{formatPct(data?.pc2_var)}
        </text>
      </svg>
      <figcaption aria-live="polite" style={{ color: d3.muted, fontFamily: d3.fontBody, marginTop: d3.label.gap }}>
        {focusedVector
          ? `${focusedVector.label}: loading vector highlighted.`
          : data.note ?? `${scaled.points.length} observations and ${scaled.arrows.length} variable loadings.`}
      </figcaption>
    </figure>
  );
};

export default PCABiplotD3;
