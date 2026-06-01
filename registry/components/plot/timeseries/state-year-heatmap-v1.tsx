'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface HeatmapCell {
  state: string;
  year: number;
  /** Value encoded by color (may be null for a gap). */
  pct: number | null;
}

export interface StateYearHeatmapData {
  cells: HeatmapCell[];
  years?: number[];
  /** Row order (otherwise derived from the cells). */
  states_order?: string[];
  value_label?: string;
  /** Year to mark with a caution seam (e.g. a methodology break). */
  break_year?: number | null;
  break_note?: string;
  measure?: string;
}

export interface StateYearHeatmapProps {
  data: StateYearHeatmapData;
  width?: number;
}

/**
 * StateYearHeatmap — a state × year value matrix where color encodes a magnitude.
 *
 * Color is the encoding channel here, so it uses the theme's sequential ramp
 * (resolved via scaleFor), not greyscale. An optional caution seam marks a
 * methodology break (e.g. the 2020 BRFSS change). Ported from "Picturing American
 * Health" (Ch.5).
 */
const StateYearHeatmap: React.FC<StateYearHeatmapProps> = ({
  data,
  width = 720,
}) => {
  const { theme, scaleFor, colorFor } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cells = data?.cells ?? [];
    if (cells.length === 0) return;

    const years = data?.years ?? [...new Set(cells.map((c) => c.year))].sort();
    const statesOrder =
      data?.states_order ?? [...new Set(cells.map((c) => c.state))];
    const valueLabel = data?.value_label ?? 'Age-adjusted prevalence (%)';
    const breakYear = data?.break_year ?? null;
    const cautionColor = colorFor('sentiment', 'negative');

    const vals = cells
      .map((c) => c.pct)
      .filter((v): v is number => v != null);
    const domain: [number, number] = vals.length
      ? [Math.min(...vals), Math.max(...vals)]
      : [0, 1];

    // theme sequential ramp -> Plot linear color scale (no scheme literal)
    const ramp = scaleFor({ kind: 'sequential', domain });

    const chart = Plot.plot({
      width,
      height: 60 + statesOrder.length * 15,
      marginLeft: 44,
      marginTop: 36,
      marginBottom: 36,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: { domain: years, label: null, tickFormat: (d) => `${d}`, tickRotate: -45 },
      y: { domain: statesOrder, label: null, tickSize: 0 },
      color: {
        type: 'linear',
        domain: ramp.stops,
        range: ramp.colors,
        legend: true,
        label: valueLabel,
      },
      marks: [
        Plot.cell(cells, {
          x: 'year',
          y: 'state',
          fill: 'pct',
          inset: 0.5,
          tip: true,
          title: (d) => `${d.state} ${d.year}: ${d.pct}%`,
        }),
        ...(breakYear
          ? [
              Plot.ruleX([breakYear - 0.5], {
                stroke: cautionColor,
                strokeWidth: 1.5,
                strokeDasharray: '3,2',
              }),
              Plot.text([{ x: breakYear - 0.5, y: statesOrder[0] }], {
                x: (d) => d.x,
                text: () => data?.break_note ?? `${breakYear} method change`,
                frameAnchor: 'top',
                dy: -22,
                fill: cautionColor,
                fontSize: 10,
                fontWeight: 600,
              }),
            ]
          : []),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, width, theme, scaleFor, colorFor]);

  return <div ref={containerRef} />;
};

export default StateYearHeatmap;
