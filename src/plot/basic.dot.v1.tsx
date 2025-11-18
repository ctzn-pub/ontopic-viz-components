'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

/**
 * DotPlot Component
 *
 * A simple, reusable dot plot visualization using Observable Plot.
 * Suitable for comparing values across categories or groups.
 *
 * @example
 * ```tsx
 * <DotPlot
 *   data={wages}
 *   x="median_wage"
 *   y="gender"
 *   fill="gender"
 *   title="Wage Distribution by Gender"
 * />
 * ```
 */

export interface DotPlotProps {
  /** Data array to visualize */
  data: any[];

  /** Field name for x-axis (horizontal position) */
  x: string;

  /** Field name for y-axis (vertical position/category) */
  y: string;

  /** Optional field name for color encoding */
  fill?: string;

  /** Chart title */
  title?: string;

  /** Chart subtitle */
  subtitle?: string;

  /** X-axis label */
  xLabel?: string;

  /** Y-axis label */
  yLabel?: string;

  /** Dot radius in pixels */
  radius?: number;

  /** Dot fill opacity (0-1) */
  fillOpacity?: number;

  /** Chart width in pixels */
  width?: number;

  /** Chart height in pixels */
  height?: number;

  /** Left margin in pixels (for y-axis labels) */
  marginLeft?: number;

  /** Custom color scheme */
  colorScheme?: string[] | Record<string, string>;

  /** Optional format function for tooltips */
  tipFormat?: (d: any) => string;

  /** Additional CSS classes */
  className?: string;
}

export function DotPlot({
  data,
  x,
  y,
  fill,
  title,
  subtitle,
  xLabel,
  yLabel,
  radius = 4,
  fillOpacity = 0.7,
  width = 700,
  height = 300,
  marginLeft = 80,
  colorScheme,
  tipFormat,
  className = ''
}: DotPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Build color configuration
    let colorConfig: any = fill ? { legend: true } : undefined;

    if (fill && colorScheme) {
      if (Array.isArray(colorScheme)) {
        colorConfig = { ...colorConfig, range: colorScheme };
      } else {
        // Extract domain and range from color scheme object
        colorConfig = {
          ...colorConfig,
          domain: Object.keys(colorScheme),
          range: Object.values(colorScheme)
        };
      }
    }

    // Create the plot
    const plot = Plot.plot({
      title,
      subtitle,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        label: xLabel || x,
        grid: true
      },
      y: {
        label: yLabel || y
      },
      color: colorConfig,
      marks: [
        Plot.dot(data, {
          x,
          y,
          fill: fill || "currentColor",
          stroke: "white",
          strokeWidth: 1,
          r: radius,
          fillOpacity,
          title: tipFormat || (d => `${d[y]}: ${d[x]}`),
          tip: true
        }),
        Plot.ruleX([0])
      ],
      width,
      height,
      marginLeft
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, x, y, fill, title, subtitle, xLabel, yLabel, radius, fillOpacity, width, height, marginLeft, colorScheme, tipFormat]);

  return (
    <div ref={containerRef} className={className} />
  );
}

export default DotPlot;
