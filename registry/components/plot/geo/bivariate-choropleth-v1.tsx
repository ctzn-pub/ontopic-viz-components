'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { feature } from 'topojson-client';
import { useVizTheme } from '@/viz/theme/provider';

/**
 * The 3×3 bivariate palette (CVD-aware purple-pink-teal). A genuine bivariate
 * scheme is not a single magnitude ramp, so it is a fixed, well-tested grid
 * rather than something derived from the theme's sequential/diverging ramps.
 * Indexed as GRID[yTercile][xTercile]; bottom-left (GRID[0][0]) = low/low.
 *
 * Exported so the map and its legend read ONE source of truth (the book version
 * duplicated this grid across two files, which drifted).
 */
export const BIVARIATE_GRID: string[][] = [
  ['#e8e8e8', '#b8d6be', '#73c0a8'],
  ['#dfb0d6', '#a5add3', '#5698b9'],
  ['#be64ac', '#8c62aa', '#3b4994'],
];

export interface BivariateClass {
  /** x tercile, 0–2. */
  x: 0 | 1 | 2;
  /** y tercile, 0–2. */
  y: 0 | 1 | 2;
}

export interface BivariateChoroplethData {
  /** TopoJSON with a `counties` object (GEOID on feature.properties). */
  topology: unknown;
  /** Per-county tercile classes keyed by GEOID string. */
  classes: Record<string, BivariateClass>;
  outcome?: string;
  index?: string;
}

export interface BivariateChoroplethProps {
  data: BivariateChoroplethData;
  /** Override the 3×3 palette (GRID[y][x]). */
  grid?: string[][];
  width?: number;
  height?: number;
}

/**
 * BivariateLegend — the 3×3 swatch grid that decodes a bivariate choropleth.
 * Reading convention: bottom-left = low/low, top-right = high/high. Reads the
 * same BIVARIATE_GRID as the map; text color comes from the theme.
 */
export function BivariateLegend({
  xLabel = 'x',
  yLabel = 'y',
  size = 54,
  grid = BIVARIATE_GRID,
}: {
  xLabel?: string;
  yLabel?: string;
  size?: number;
  grid?: string[][];
}) {
  const { theme } = useVizTheme();
  const cell = size / 3;
  const labelGap = 12;
  const W = size + 56;
  const H = size + labelGap + 4;
  return (
    <svg
      role="img"
      aria-label={`Bivariate color legend, 3×3 grid; x: ${xLabel} (left to right), y: ${yLabel} (bottom to top).`}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      {grid.map((row, ri) =>
        row.map((fill, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cell}
            y={(2 - ri) * cell}
            width={cell - 1}
            height={cell - 1}
            fill={fill}
          />
        )),
      )}
      <text x={0} y={size + labelGap} textAnchor="start" fontSize={9} fill={theme.fg}>
        {xLabel} →
      </text>
      <text
        x={-size}
        y={size + 9}
        transform="rotate(-90)"
        textAnchor="start"
        fontSize={9}
        fill={theme.fg}
      >
        {yLabel} →
      </text>
    </svg>
  );
}

/**
 * BivariateChoropleth — a county map shaded by an ADI tercile × outcome tercile
 * crossing on a 3×3 bivariate palette. Each county's fill is its {x,y} class;
 * counties with no class get the theme's neutral grid color. Pair it with
 * <BivariateLegend /> to decode the corners. Ported from "Picturing American
 * Health" (Ch.8).
 */
const BivariateChoropleth: React.FC<BivariateChoroplethProps> = ({
  data,
  grid = BIVARIATE_GRID,
  width = 720,
  height = 470,
}) => {
  const { theme } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const topo = data?.topology as
      | { objects: { counties: unknown } }
      | undefined;
    const classes = data?.classes ?? {};
    if (!topo) return;

    const fc = feature(topo as never, topo.objects.counties as never) as {
      features: { properties: Record<string, unknown> }[];
    };
    for (const f of fc.features) {
      const id = String(f.properties?.GEOID ?? '');
      const c = classes[id];
      f.properties.__fill = c ? grid[c.y][c.x] : theme.grid;
    }

    const chart = Plot.plot({
      width,
      height,
      projection: 'albers-usa',
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      marks: [
        Plot.geo(fc as never, {
          fill: (d) => d.properties.__fill,
          stroke: theme.surface,
          strokeWidth: 0.25,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, grid, width, height, theme]);

  return <div ref={containerRef} />;
};

export default BivariateChoropleth;
