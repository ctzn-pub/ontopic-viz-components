'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface BoxPlotFacetedProps {
  data: Array<{ category: string; facet: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
  facetLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  facetColumns?: number;
  fillColor?: string;
  strokeColor?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * BoxPlotFaceted - Faceted box plots for comparing distributions across categories and panels
 *
 * Use cases:
 * - Compare distributions across multiple panels
 * - Panel data visualization
 * - Multi-group experimental designs with faceting
 * - Regional or temporal comparisons
 *
 * Features:
 * - X-axis faceting for small multiples
 * - Quartile boxes with median line
 * - Whiskers and outlier points
 * - Customizable panel layout
 */
export function BoxPlotFaceted({
  data,
  xLabel = 'Category',
  yLabel = 'Value',
  facetLabel = 'Facet',
  title,
  width = 1000,
  height = 600,
  facetColumns = 2,
  fillColor = '#4682b4',
  strokeColor = '#2c5f8d',
  className = '',
  ariaLabel = 'Faceted box plot showing distributions across panels'
}: BoxPlotFacetedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 50 : 40,
      marginRight: 20,
      marginBottom: 100,
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
      fx: {
        label: facetLabel
      },
      facet: {
        data: data,
        x: 'facet',
        marginRight: 20
      },
      marks: [
        Plot.boxY(data, {
          x: 'category',
          y: 'value',
          fx: 'facet',
          fill: fillColor,
          fillOpacity: 0.4,
          stroke: strokeColor,
          strokeWidth: 1.5,
          r: 3
        }),
        Plot.frame()
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
  }, [data, xLabel, yLabel, facetLabel, title, width, height, facetColumns, fillColor, strokeColor, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
