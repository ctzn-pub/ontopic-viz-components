'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface ForestEstimate {
  term: string;
  /** Odds ratio (point estimate). */
  or: number;
  /** Lower CI bound. */
  lci: number;
  /** Upper CI bound. */
  uci: number;
}

export interface ForestGroup {
  /** Stratum label (e.g. an age band). */
  stratum: string;
  estimates: ForestEstimate[];
  n?: number;
}

export interface ForestPlotData {
  groups: ForestGroup[];
  /** Optional explicit term order (otherwise derived from the data). */
  terms?: string[];
  outcome?: string;
}

export interface ForestPlotProps {
  data: ForestPlotData;
  /**
   * Explicit semantic domain for stratum colors. Default null uses the theme's
   * categorical cycle. Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  width?: number;
}

/**
 * ForestPlot — odds ratios for a few predictors across strata, faceted by term,
 * colored by stratum, on a log x-axis with an OR = 1 reference rule.
 *
 * Stratum colors resolve from the active theme (categorical by default). Ported
 * from "Picturing American Health" (Ch.11 — model refit within each age group).
 */
const ForestPlot: React.FC<ForestPlotProps> = ({
  data,
  colorDomain = null,
  width = 720,
}) => {
  const { theme, colorScale } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const groups = data?.groups ?? [];
    if (groups.length === 0) return;

    const rows: {
      stratum: string;
      term: string;
      or: number;
      lci: number;
      uci: number;
    }[] = [];
    for (const g of groups)
      for (const e of g.estimates)
        rows.push({
          stratum: g.stratum,
          term: e.term,
          or: e.or,
          lci: e.lci,
          uci: e.uci,
        });
    const terms = data?.terms ?? [...new Set(rows.map((r) => r.term))];
    const strata = groups.map((g) => g.stratum);

    const chart = Plot.plot({
      width,
      height: 80 + terms.length * 90,
      marginLeft: 24,
      marginRight: 16,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      fy: { domain: terms, label: null },
      x: {
        type: 'log',
        label: 'Odds ratio (log) →',
        labelAnchor: 'center',
        grid: theme.gridStyle !== 'none',
      },
      y: { domain: strata, label: null },
      color: { ...colorScale(colorDomain, strata), legend: true },
      marks: [
        Plot.ruleX([1], { stroke: theme.muted, strokeDasharray: '3 3' }),
        Plot.ruleY(rows, {
          fy: 'term',
          y: 'stratum',
          x1: 'lci',
          x2: 'uci',
          stroke: 'stratum',
          strokeWidth: 2,
          strokeOpacity: 0.6,
        }),
        Plot.dot(rows, {
          fy: 'term',
          y: 'stratum',
          x: 'or',
          fill: 'stratum',
          r: 3.5,
          tip: true,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, colorDomain, width, theme, colorScale]);

  return <div ref={containerRef} />;
};

export default ForestPlot;
