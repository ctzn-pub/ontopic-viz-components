'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface SlopegraphRow {
  /** Series label (e.g. a state abbreviation). */
  state: string;
  /** Value at the start period. */
  start: number;
  /** Value at the end period. */
  end: number;
  start_lci?: number;
  start_uci?: number;
  end_lci?: number;
  end_uci?: number;
}

export interface SlopegraphData {
  rows: SlopegraphRow[];
  start_year?: number;
  end_year?: number;
  value_label?: string;
  /** Series to spotlight with the theme accent + a label. */
  highlight?: string[];
  measure?: string;
}

export interface SlopegraphProps {
  data: SlopegraphData;
  width?: number;
  height?: number;
}

/**
 * Slopegraph — each series' value at two periods, one line apiece.
 *
 * A monochrome field (muted ink) with ONE theme accent for the highlighted series
 * the prose names; faint endpoint CIs keep near-crossings from being over-read.
 * Highlights movement, not a leaderboard. Ported from "Picturing American Health"
 * (Ch.5).
 */
const Slopegraph: React.FC<SlopegraphProps> = ({
  data,
  width = 560,
  height = 460,
}) => {
  const { theme } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = data?.rows ?? [];
    if (rows.length === 0) return;

    const startYear = data?.start_year ?? 0;
    const endYear = data?.end_year ?? 1;
    const valueLabel = data?.value_label ?? 'Age-adjusted prevalence (%)';
    const highlight = new Set(data?.highlight ?? []);

    const long: {
      state: string;
      year: number;
      pct: number;
      hot: boolean;
      lci?: number;
      uci?: number;
    }[] = [];
    for (const r of rows) {
      const hot = highlight.has(r.state);
      long.push({
        state: r.state,
        year: startYear,
        pct: r.start,
        hot,
        lci: r.start_lci,
        uci: r.start_uci,
      });
      long.push({
        state: r.state,
        year: endYear,
        pct: r.end,
        hot,
        lci: r.end_lci,
        uci: r.end_uci,
      });
    }
    const labels = rows
      .filter((r) => highlight.has(r.state))
      .map((r) => ({ state: r.state, year: endYear, pct: r.end }));

    const chart = Plot.plot({
      width,
      height,
      marginLeft: 40,
      marginRight: 64,
      marginBottom: 36,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        domain: [startYear, endYear],
        label: null,
        tickFormat: (d) => `${d}`,
        ticks: [startYear, endYear],
      },
      y: { label: `${valueLabel} →`, grid: theme.gridStyle !== 'none' },
      marks: [
        Plot.ruleX(long, {
          x: 'year',
          y1: 'lci',
          y2: 'uci',
          stroke: theme.grid,
          strokeWidth: 1.5,
        }),
        Plot.line(long, {
          x: 'year',
          y: 'pct',
          z: 'state',
          stroke: (d) => (d.hot ? theme.accent : theme.muted),
          strokeWidth: (d) => (d.hot ? 2.4 : 1),
          strokeOpacity: (d) => (d.hot ? 1 : 0.45),
        }),
        Plot.dot(long, {
          x: 'year',
          y: 'pct',
          z: 'state',
          r: 2,
          fill: (d) => (d.hot ? theme.accent : theme.muted),
          fillOpacity: (d) => (d.hot ? 1 : 0.45),
        }),
        Plot.text(labels, {
          x: 'year',
          y: 'pct',
          text: 'state',
          dx: 10,
          textAnchor: 'start',
          fill: theme.accent,
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
  }, [data, width, height, theme]);

  return <div ref={containerRef} />;
};

export default Slopegraph;
