'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface DisparityPoint {
  /** Position along the gradient axis (e.g. decile 1–10). */
  decile: number;
  /** Outcome value (%). */
  pct: number;
  /** Optional lower CI bound. */
  lci?: number;
  /** Optional upper CI bound. */
  uci?: number;
}

export interface DisparitySeries {
  label: string;
  points: DisparityPoint[];
  /** Ignored for color (color comes from the theme); kept for data parity. */
  color?: string;
}

export interface DisparityGradientData {
  series: DisparitySeries[];
  /** Default x-axis index name (e.g. "decile"). */
  index?: string;
  outcome?: string;
}

export interface DisparityGradientProps {
  data: DisparityGradientData;
  /** X-axis label (overrides data.index). An arrow is appended. */
  indexLabel?: string;
  /** Y-axis label. An arrow is appended. */
  yLabel?: string;
  /**
   * Explicit semantic domain for series colors. Default null uses the theme's
   * categorical cycle. Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  width?: number;
  height?: number;
}

/**
 * DisparityGradient — an outcome across an ordered deprivation/exposure gradient,
 * one or more series, each with an optional 95% CI ribbon and an end label.
 *
 * Series are colored from the active theme (categorical by default). Ported from
 * "Picturing American Health" (Ch.8 — outcome by ADI decile).
 */
const DisparityGradient: React.FC<DisparityGradientProps> = ({
  data,
  indexLabel,
  yLabel = 'prevalence (%)',
  colorDomain = null,
  width = 720,
  height = 360,
}) => {
  const { theme, colorScale } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const series = data?.series ?? [];
    if (series.length === 0) return;

    const rows = series.flatMap((s) =>
      s.points.map((p) => ({ series: s.label, ...p })),
    );
    const last = series.map((s) => {
      const sp = [...s.points].sort((a, b) => a.decile - b.decile);
      const tail = sp[sp.length - 1];
      return { series: s.label, decile: tail.decile, pct: tail.pct };
    });
    const hasCI = rows.every((r) => r.lci != null && r.uci != null);
    const labels = series.map((s) => s.label);
    const xLabel = indexLabel ?? data?.index ?? 'decile';

    const chart = Plot.plot({
      width,
      height,
      marginLeft: 48,
      marginRight: 120,
      marginBottom: 40,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        label: `${xLabel} →`,
        labelAnchor: 'center',
        domain: [1, 10],
        ticks: 10,
      },
      y: { label: `${yLabel} →`, grid: theme.gridStyle !== 'none' },
      color: { ...colorScale(colorDomain, labels), legend: labels.length > 1 },
      marks: [
        ...(hasCI
          ? [
              Plot.areaY(rows, {
                x: 'decile',
                y1: 'lci',
                y2: 'uci',
                fill: 'series',
                fillOpacity: 0.15,
              }),
            ]
          : []),
        Plot.line(rows, {
          x: 'decile',
          y: 'pct',
          stroke: 'series',
          strokeWidth: 2.4,
          tip: true,
        }),
        Plot.dot(rows, { x: 'decile', y: 'pct', fill: 'series', r: 3 }),
        Plot.text(last, {
          x: 'decile',
          y: 'pct',
          text: 'series',
          fill: 'series',
          dx: 8,
          textAnchor: 'start',
          fontWeight: 600,
          fontSize: 11,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, indexLabel, yLabel, colorDomain, width, height, theme, colorScale]);

  return <div ref={containerRef} />;
};

export default DisparityGradient;
