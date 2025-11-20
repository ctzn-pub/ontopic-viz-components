'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface BoxPlotGroupedProps {
  data: Array<{ category: string; group: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
  groupLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  colorScheme?: string[];
  className?: string;
  ariaLabel?: string;
}

/**
 * BoxPlotGrouped - Grouped box plots for comparing distributions across categories and groups
 *
 * Use cases:
 * - Compare distributions across multiple groups within categories
 * - Reveal patterns in grouped categorical data
 * - Show quartiles, median, and outliers by group
 * - Multi-factor experimental designs
 *
 * Features:
 * - Color-coded by group
 * - Automatic legend
 * - Quartile boxes with median line
 * - Whiskers and outlier points
 * - Customizable color scheme
 */
export function BoxPlotGrouped({
  data,
  xLabel = 'Category',
  yLabel = 'Value',
  groupLabel = 'Group',
  title,
  width = 800,
  height = 500,
  colorScheme = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'],
  className = '',
  ariaLabel = 'Grouped box plot showing distributions by category and group'
}: BoxPlotGroupedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Transform data to create compound x-axis keys for side-by-side positioning
    const transformedData = data.map((d) => ({
      ...d,
      compoundCategory: `${d.category}__${d.group}` // Use separator for unique key
    }));

    // Get unique categories and groups for ordering
    const categories = [...new Set(data.map((d) => d.category))];
    const groups = [...new Set(data.map((d) => d.group))];

    // Create ordered domain for x-axis
    const xDomain = categories.flatMap(cat =>
      groups.map(grp => `${cat}__${grp}`)
    );

    // Create tick configuration to show label only once per category, positioned towards the right
    const middleGroupIndex = Math.ceil((groups.length - 1) / 2);
    const tickValues = categories.flatMap(cat => `${cat}__${groups[middleGroupIndex]}`); // Position towards right of each category
    const tickFormat = (d: string) => d.split('__')[0];

    // Create plot with compound x-axis for side-by-side boxes
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 120,
      marginBottom: 100,
      marginLeft: 60,
      title: title,
      x: {
        label: xLabel,
        domain: xDomain,
        ticks: tickValues,
        tickFormat,
        tickSize: 0  // Remove tick marks
      },
      y: {
        label: yLabel,
        grid: true
      },
      color: {
        legend: true,
        label: groupLabel,
        domain: [...new Set(data.map((d) => d.group))],
        range: colorScheme
      },
      marks: [
        Plot.boxY(transformedData, {
          x: 'compoundCategory',
          y: 'value',
          fill: 'group',
          fillOpacity: 0.4,
          stroke: 'group',
          strokeWidth: 1.5,
          r: 3
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
  }, [data, xLabel, yLabel, groupLabel, title, width, height, colorScheme, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
