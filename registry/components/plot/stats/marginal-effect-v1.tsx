'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface MarginalEffectRow {
  /** Bracket label along the x-axis (ordered as given). */
  income: string;
  /** Point estimate (predicted probability, %). */
  pct: number;
  /** Lower CI bound (%). */
  lci: number;
  /** Upper CI bound (%). */
  uci: number;
  /** When true, drawn as a hollow point (e.g. income non-response group). */
  is_missing?: boolean;
}

export interface MarginalEffectData {
  rows: MarginalEffectRow[];
  /** Optional outcome description (unused for drawing; carried for parity). */
  outcome?: string;
  note?: string;
}

export interface MarginalEffectProps {
  data: MarginalEffectData;
  /** X-axis label, an arrow is appended. */
  xLabel?: string;
  /** Y-axis label, an arrow is appended. */
  yLabel?: string;
  width?: number;
  height?: number;
}

/**
 * MarginalEffect — predicted probability by an ordered bracket, with a CI ribbon.
 *
 * A single-quantity figure: it draws one estimate, so it is monochrome ink (the
 * active theme's foreground) rather than colored. The non-response group, if
 * present, is a hollow point. Ported from the "Picturing American Health" book
 * (Ch.11 climax — marginal effect of income on good self-rated health).
 */
const MarginalEffect: React.FC<MarginalEffectProps> = ({
  data,
  xLabel = 'Household income bracket',
  yLabel = 'Predicted probability of good health (%)',
  width = 720,
  height = 340,
}) => {
  const { theme } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = data?.rows ?? [];
    if (rows.length === 0) return;

    const solid = rows.filter((r) => !r.is_missing);
    const order = rows.map((r) => r.income);
    const yMin = Math.min(...rows.map((r) => r.lci)) - 2;

    const chart = Plot.plot({
      width,
      height,
      marginLeft: 56,
      marginBottom: 48,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        domain: order,
        label: `${xLabel} →`,
        labelAnchor: 'center',
        tickRotate: -20,
      },
      y: {
        label: `${yLabel} →`,
        grid: theme.gridStyle !== 'none',
        domain: [yMin, 100],
      },
      marks: [
        Plot.areaY(solid, {
          x: 'income',
          y1: 'lci',
          y2: 'uci',
          fill: theme.fg,
          fillOpacity: 0.12,
        }),
        Plot.line(solid, {
          x: 'income',
          y: 'pct',
          stroke: theme.fg,
          strokeWidth: 2.6,
        }),
        Plot.dot(rows, {
          x: 'income',
          y: 'pct',
          fill: (d) => (d.is_missing ? theme.surface : theme.fg),
          stroke: theme.fg,
          r: 4,
          tip: true,
          title: (d) => `${d.income}: ${d.pct}%`,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, xLabel, yLabel, width, height, theme]);

  return <div ref={containerRef} />;
};

export default MarginalEffect;
