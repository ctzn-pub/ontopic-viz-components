'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

/**
 * BoxPlot Component
 *
 * A box plot visualization using Observable Plot for showing distributions
 * and identifying outliers across categories.
 *
 * @example
 * ```tsx
 * <BoxPlot
 *   data={[
 *     { category: 'Group A', value: 10 },
 *     { category: 'Group A', value: 15 },
 *     { category: 'Group B', value: 20 }
 *   ]}
 *   x="category"
 *   y="value"
 * />
 * ```
 */

export interface BoxPlotProps {
  /**
   * Data array - should be in "long" format with one row per observation.
   * Each row should have a category field and a value field.
   */
  data: any[];

  /** Field name for x-axis (categories) */
  x: string;

  /** Field name for y-axis (values) */
  y: string;

  /** Chart title */
  title?: string;

  /** X-axis label */
  xLabel?: string;

  /** Y-axis label */
  yLabel?: string;

  /** Box fill color */
  fill?: string;

  /** Box fill opacity (0-1) */
  fillOpacity?: number;

  /** Box stroke color */
  stroke?: string;

  /** Box stroke width */
  strokeWidth?: number;

  /** Outlier dot radius */
  outlierRadius?: number;

  /** Chart width in pixels */
  width?: number;

  /** Chart height in pixels */
  height?: number;

  /** Left margin for y-axis labels */
  marginLeft?: number;

  /** Bottom margin for x-axis labels */
  marginBottom?: number;

  /** Rotate x-axis labels (degrees) */
  xTickRotate?: number;

  /** Additional CSS classes */
  className?: string;
}

export function BoxPlot({
  data,
  x,
  y,
  title,
  xLabel,
  yLabel,
  fill = "#4682b4",
  fillOpacity = 0.4,
  stroke = "#2c5f8d",
  strokeWidth = 1.5,
  outlierRadius = 3,
  width = 800,
  height = 500,
  marginLeft = 60,
  marginBottom = 100,
  xTickRotate = -45,
  className = ''
}: BoxPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Create the plot
    const plot = Plot.plot({
      width,
      height,
      marginLeft,
      marginBottom,
      title,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        label: xLabel || x,
        tickRotate: xTickRotate
      },
      y: {
        label: yLabel || y,
        grid: true
      },
      marks: [
        // Box plot with Observable Plot's built-in boxY mark
        Plot.boxY(data, {
          x,
          y,
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          r: outlierRadius  // Outlier dot radius
        })
      ]
    }) as SVGSVGElement;

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, x, y, title, xLabel, yLabel, fill, fillOpacity, stroke, strokeWidth, outlierRadius, width, height, marginLeft, marginBottom, xTickRotate]);

  return (
    <div ref={containerRef} className={className} />
  );
}

export default BoxPlot;
