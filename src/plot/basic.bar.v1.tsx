'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

/**
 * BarChart Component
 *
 * A simple, reusable bar chart visualization using Observable Plot.
 * Suitable for time series data, categorical comparisons, and data with confidence intervals.
 *
 * @example
 * ```tsx
 * <BarChart
 *   data={yearlyData}
 *   x="year"
 *   y="value"
 *   errorY={{ lower: "ci_lower", upper: "ci_upper" }}
 *   title="Support Over Time"
 * />
 * ```
 */

export interface BarChartProps {
  /** Data array to visualize */
  data: any[];

  /** Field name for x-axis (typically time or category) */
  x: string;

  /** Field name for y-axis (bar height) */
  y: string;

  /** Optional error bars configuration */
  errorY?: {
    lower: string;
    upper: string;
  };

  /** Chart title */
  title?: string;

  /** Chart subtitle */
  subtitle?: string;

  /** Chart caption */
  caption?: string;

  /** X-axis label */
  xLabel?: string;

  /** Y-axis label */
  yLabel?: string;

  /** Bar fill color */
  fill?: string;

  /** Error bar stroke color */
  errorStroke?: string;

  /** Error bar stroke width */
  errorStrokeWidth?: number;

  /** Chart width in pixels */
  width?: number;

  /** Chart height in pixels */
  height?: number;

  /** Bottom margin in pixels */
  marginBottom?: number;

  /** Rotate x-axis labels (degrees) */
  xTickRotate?: number;

  /** Custom tick formatter for x-axis */
  xTickFormat?: (d: any) => string;

  /** Custom tick values for x-axis */
  xTicks?: any[];

  /** Additional CSS classes */
  className?: string;
}

export function BarChart({
  data,
  x,
  y,
  errorY,
  title,
  subtitle,
  caption,
  xLabel,
  yLabel,
  fill = "#708090",
  errorStroke = "#394E54",
  errorStrokeWidth = 2,
  width = 800,
  height = 400,
  marginBottom = 60,
  xTickRotate = 0,
  xTickFormat,
  xTicks,
  className = ''
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Build marks array
    const marks: any[] = [
      // Main bar chart
      Plot.barY(data, {
        x,
        y,
        fill
      })
    ];

    // Add error bars if provided
    if (errorY) {
      marks.push(
        Plot.ruleX(data, {
          x,
          y1: errorY.lower,
          y2: errorY.upper,
          stroke: errorStroke,
          strokeWidth: errorStrokeWidth
        })
      );
    }

    // Create the plot
    const plot = Plot.plot({
      width,
      height,
      marginBottom,
      title,
      subtitle,
      caption,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        label: xLabel || x,
        tickRotate: xTickRotate,
        tickFormat: xTickFormat,
        tickSize: 5,
        labelOffset: 50,
        ...(xTicks && { ticks: xTicks })
      },
      y: {
        label: yLabel || y,
        grid: true
      },
      marks
    }) as SVGSVGElement;

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, x, y, errorY, title, subtitle, caption, xLabel, yLabel, fill, errorStroke, errorStrokeWidth, width, height, marginBottom, xTickRotate, xTickFormat, xTicks]);

  return (
    <div ref={containerRef} className={className} />
  );
}

export default BarChart;
