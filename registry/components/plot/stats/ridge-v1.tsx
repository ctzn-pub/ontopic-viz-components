'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface RidgeRegion {
  region: string;
  /** Raw observations for this group; a KDE is computed from them. */
  values: number[];
  mean: number;
  median: number;
  n_counties?: number;
}

export interface RidgeData {
  regions: RidgeRegion[];
  /** Lower bound of the shared x grid. */
  grid_min?: number;
  /** Upper bound of the shared x grid. */
  grid_max?: number;
  measure?: string;
  unit?: string;
}

export interface RidgeProps {
  data: RidgeData;
  /** "ridge" overlaps rows; "violin" mirrors each density. */
  mode?: 'ridge' | 'violin';
  /** X-axis label. An arrow is appended. */
  xLabel?: string;
  width?: number;
}

// Gaussian KDE on a fixed grid.
function kde(values: number[], grid: number[], bw: number): number[] {
  const n = values.length;
  return grid.map((gx) => {
    let s = 0;
    for (const v of values) {
      const u = (gx - v) / bw;
      s += Math.exp(-0.5 * u * u);
    }
    return s / (n * bw * Math.sqrt(2 * Math.PI));
  });
}

/**
 * Ridge — a small-multiples joyplot of per-group distributions, built from
 * per-group KDEs drawn as overlapping vertically-offset areas (Plot has no
 * built-in ridgeline). One quantity, so it is monochrome ink with a direct label
 * per group and a median rule. Ported from "Picturing American Health" (Ch.2 —
 * county obesity distribution per Census region).
 */
const Ridge: React.FC<RidgeProps> = ({
  data,
  mode = 'ridge',
  xLabel = 'value →',
  width = 720,
}) => {
  const { theme } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const regions = data?.regions ?? [];
    if (regions.length === 0) return;

    const lo = data?.grid_min ?? 10;
    const hi = data?.grid_max ?? 60;
    const grid = Array.from({ length: 120 }, (_, i) => lo + ((hi - lo) * i) / 119);
    const rowH = mode === 'violin' ? 1 : 1.7;

    let maxD = 0;
    const dens = regions.map((r) => {
      const vals = r.values ?? [];
      const sd = Math.sqrt(
        vals.reduce((a, v) => a + (v - r.mean) ** 2, 0) / Math.max(1, vals.length),
      );
      const bw = 1.06 * sd * Math.pow(Math.max(1, vals.length), -0.2) || 1;
      const d = kde(vals, grid, bw);
      maxD = Math.max(maxD, ...d);
      return { region: r.region, median: r.median, d };
    });

    const rowGap = mode === 'violin' ? 1.5 : 1.0;
    const areaRows: {
      region: string;
      row: number;
      x: number;
      y0: number;
      y1: number;
    }[] = [];
    const labels: { region: string; x: number; y: number }[] = [];
    const medians: { region: string; x: number; y0: number; y1: number }[] = [];
    dens.forEach((r, i) => {
      const baseline = i * rowGap;
      for (let j = 0; j < grid.length; j++) {
        areaRows.push({
          region: r.region,
          row: i,
          x: grid[j],
          y0: baseline,
          y1: baseline + (r.d[j] / maxD) * rowH,
        });
      }
      labels.push({ region: r.region, x: lo, y: baseline + 0.12 });
      medians.push({
        region: r.region,
        x: r.median,
        y0: baseline,
        y1: baseline + rowH * 0.9,
      });
    });
    const topY = (dens.length - 1) * rowGap + rowH + 0.4;

    const chart = Plot.plot({
      width,
      height: 60 + dens.length * (mode === 'violin' ? 96 : 64),
      marginLeft: 96,
      marginBottom: 44,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        domain: [lo, hi],
        label: xLabel,
        labelAnchor: 'center',
        grid: theme.gridStyle !== 'none',
      },
      y: { domain: [-0.1, topY], axis: null },
      marks: [
        Plot.areaY(areaRows, {
          x: 'x',
          y1: 'y0',
          y2: 'y1',
          z: 'row',
          fill: theme.muted,
          fillOpacity: 0.78,
          stroke: theme.fg,
          strokeWidth: 0.7,
          curve: 'basis',
        }),
        Plot.ruleX(medians, {
          x: 'x',
          y1: 'y0',
          y2: 'y1',
          stroke: theme.fg,
          strokeWidth: 1.4,
        }),
        Plot.text(labels, {
          x: 'x',
          y: 'y',
          text: 'region',
          textAnchor: 'end',
          dx: -8,
          fontWeight: 600,
          fontSize: 11,
          fill: theme.fg,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, mode, xLabel, width, theme]);

  return <div ref={containerRef} />;
};

export default Ridge;
