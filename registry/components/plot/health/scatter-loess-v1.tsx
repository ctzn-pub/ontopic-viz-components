'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface ScatterLoessPoint {
  x: number;
  y: number;
  /** Population (or weight) — encoded by point radius. */
  pop: number;
  /** Continuous value encoded by the sequential color ramp. */
  adi: number;
}

export interface ScatterLoessData {
  points: ScatterLoessPoint[];
  /** Precomputed LOESS curve (x, y). */
  loess?: { x: number; y: number }[];
  x_label?: string;
  y_label?: string;
  color_label?: string;
  size_label?: string;
}

export interface ScatterLoessProps {
  data: ScatterLoessData;
  /** Domain for the sequential color ramp. */
  colorDomain?: [number, number];
  width?: number;
  height?: number;
}

/**
 * ScatterLoess — population-sized points colored by a continuous value, with a
 * precomputed LOESS summary line.
 *
 * Color encodes one quantity, so it uses the theme's single-hue sequential ramp
 * (resolved via scaleFor) — not a rainbow — and the LOESS line is the theme
 * foreground so it reads as the summary, not a category. Ported from "Picturing
 * American Health" (Ch.1 opener / Ch.3 signature).
 */
const ScatterLoess: React.FC<ScatterLoessProps> = ({
  data,
  colorDomain = [0, 100],
  width = 720,
  height = 460,
}) => {
  const { theme, scaleFor } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const points = data?.points ?? [];
    const loess = data?.loess ?? [];
    if (points.length === 0) return;

    const ramp = scaleFor({ kind: 'sequential', domain: colorDomain });
    const maxPop = Math.max(...points.map((p) => p.pop || 0));

    const chart = Plot.plot({
      width,
      height,
      marginLeft: 52,
      marginBottom: 46,
      marginRight: 24,
      grid: theme.gridStyle !== 'none',
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        label: data?.x_label ?? 'x →',
        labelAnchor: 'center',
        percent: false,
      },
      y: { label: data?.y_label ?? 'y →', labelAnchor: 'center' },
      r: { range: [1.2, 14], domain: [0, maxPop] },
      color: {
        type: 'linear',
        domain: ramp.stops,
        range: ramp.colors,
        legend: true,
        label: data?.color_label ?? 'value',
      },
      marks: [
        Plot.dot(points, {
          x: 'x',
          y: 'y',
          r: 'pop',
          fill: 'adi',
          fillOpacity: 0.55,
          stroke: theme.muted,
          strokeWidth: 0.2,
          tip: true,
          title: (p) =>
            `${data?.color_label ?? 'value'} ${p.adi}\npop ${p.pop.toLocaleString()}\n${p.x}, ${p.y}`,
        }),
        ...(loess.length
          ? [
              Plot.line(loess, {
                x: 'x',
                y: 'y',
                stroke: theme.fg,
                strokeWidth: 2.5,
                curve: 'basis',
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
  }, [data, colorDomain, width, height, theme, scaleFor]);

  return <div ref={containerRef} />;
};

export default ScatterLoess;
