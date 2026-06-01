'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface ParallelGroup {
  label: string;
  /** Each line is one observation's values, in axis order. */
  lines?: number[][];
  /** Alternate shape: array of { values } objects. */
  values?: { values: number[] }[];
}

export interface ParallelCoordinatesData {
  /** Axis names, in display order. */
  axes: string[];
  groups: ParallelGroup[];
  note?: string;
}

export interface ParallelCoordinatesProps {
  data: ParallelCoordinatesData;
  /**
   * Explicit semantic domain for group colors. Default null uses the theme's
   * categorical cycle. Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  /** Y-axis label. */
  yLabel?: string;
  width?: number;
  height?: number;
}

/**
 * ParallelCoordinates — many standardized axes, one line per observation, colored
 * by group. Built by melting each observation's values into (axis, value) and
 * drawing a line per observation via the z channel.
 *
 * Group colors resolve from the active theme (categorical by default). Ported
 * from "Picturing American Health" (Ch.10 — high vs. low PC1 counties).
 */
const ParallelCoordinates: React.FC<ParallelCoordinatesProps> = ({
  data,
  colorDomain = null,
  yLabel = 'standardized value',
  width = 720,
  height = 360,
}) => {
  const { theme, colorScale } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const axes = data?.axes ?? [];
    const groups = data?.groups ?? [];
    if (axes.length === 0 || groups.length === 0) return;

    const rows: { id: number; group: string; axis: string; value: number }[] = [];
    let id = 0;
    for (const g of groups) {
      for (const line of g.lines ?? g.values ?? []) {
        const cid = id++;
        axes.forEach((ax, i) =>
          rows.push({
            id: cid,
            group: g.label,
            axis: ax,
            value: Array.isArray(line) ? line[i] : line.values[i],
          }),
        );
      }
    }
    const groupLabels = groups.map((g) => g.label);

    const chart = Plot.plot({
      width,
      height,
      marginLeft: 30,
      marginBottom: 80,
      marginTop: 20,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: { domain: axes, label: null, tickRotate: -45, tickSize: 0 },
      y: { label: yLabel, grid: theme.gridStyle !== 'none' },
      color: { ...colorScale(colorDomain, groupLabels), legend: true },
      marks: [
        Plot.line(rows, {
          x: 'axis',
          y: 'value',
          z: 'id',
          stroke: 'group',
          strokeWidth: 0.5,
          strokeOpacity: 0.3,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, colorDomain, yLabel, width, height, theme, colorScale]);

  return <div ref={containerRef} />;
};

export default ParallelCoordinates;
