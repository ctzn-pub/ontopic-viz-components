'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface SwarmPlotProps {
  data: Array<{ category: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  dotRadius?: number;
  dotOpacity?: number;
  colorScheme?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * SwarmPlot - Bee swarm plot with dodge positioning
 *
 * Use cases:
 * - Show distribution of individual observations by category
 * - Reveal patterns in categorical data
 * - Compare distributions across groups
 * - Alternative to violin or box plots showing every data point
 *
 * Features:
 * - Dodge transform prevents overlap
 * - Color-coded by category
 * - Customizable dot size and opacity
 * - Automatic legend
 */
export function SwarmPlot({
  data,
  xLabel = 'Category',
  yLabel = 'Value',
  title,
  width = 800,
  height = 500,
  dotRadius = 4,
  dotOpacity = 0.7,
  colorScheme,
  className = '',
  ariaLabel = 'Swarm plot showing distribution by category'
}: SwarmPlotProps) {
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
        // Swarm plot using dodge transform
        Plot.dot(
          data,
          Plot.dodgeX('middle', {
            x: 'category',
            y: 'value',
            fill: 'category',
            fillOpacity: dotOpacity,
            r: dotRadius,
            stroke: '#666',
            strokeWidth: 0.5
          })
        )
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
  }, [data, xLabel, yLabel, title, width, height, dotRadius, dotOpacity, colorScheme, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
