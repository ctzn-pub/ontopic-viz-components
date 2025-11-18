'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface StripPlotProps {
  data: Array<{ category: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  dotRadius?: number;
  dotOpacity?: number;
  jitterWidth?: number;
  colorScheme?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * StripPlot - Categorical strip plot with jittered points
 *
 * Use cases:
 * - Show all individual observations by category
 * - Reveal patterns and outliers in categorical data
 * - Compare distributions with transparency
 * - Simple alternative to violin or box plots
 *
 * Features:
 * - Manual jitter to prevent overlap
 * - Color-coded by category
 * - Customizable jitter width
 * - Automatic legend
 */
export function StripPlot({
  data,
  xLabel = 'Category',
  yLabel = 'Value',
  title,
  width = 800,
  height = 500,
  dotRadius = 4,
  dotOpacity = 0.6,
  jitterWidth = 60,
  colorScheme,
  className = '',
  ariaLabel = 'Strip plot showing distribution by category'
}: StripPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 80,
      marginLeft: 60,
      title: title,
      x: {
        label: xLabel,
        tickRotate: -45
      },
      y: {
        label: yLabel,
        grid: true
      },
      color: {
        legend: true,
        ...(colorScheme && { scheme: colorScheme })
      },
      marks: [
        // Strip plot with jitter
        Plot.dot(data, {
          x: 'category',
          y: 'value',
          fill: 'category',
          fillOpacity: dotOpacity,
          r: dotRadius,
          dx: () => (Math.random() - 0.5) * jitterWidth
        })
      ]
    }) as SVGSVGElement;

    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', ariaLabel);

    containerRef.current.appendChild(plot);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, xLabel, yLabel, title, width, height, dotRadius, dotOpacity, jitterWidth, colorScheme, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
