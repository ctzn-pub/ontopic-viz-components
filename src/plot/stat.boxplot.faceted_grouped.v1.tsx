'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface BoxPlotFacetedGroupedProps {
  data: Array<{ facet: string; category: string; group: string; value: number }>;
  facetLabel?: string;      // Label for facet panels
  categoryLabel?: string;   // Label for x-axis categories
  groupLabel?: string;      // Label for groups (colors)
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  colorScheme?: string[];
  className?: string;
  ariaLabel?: string;
}

/**
 * BoxPlotFacetedGrouped - Faceted box plots with side-by-side grouped boxes using official Observable Plot pattern
 *
 * Use cases:
 * - Compare distributions across categories (as faceted panels)
 * - Show side-by-side grouped comparisons within each panel
 * - Regional/demographic comparisons with breakdowns
 * - Multi-factor experimental designs
 *
 * Features:
 * - Faceted panels by category (fx)
 * - Side-by-side grouped boxes within panels (x)
 * - Color-coded by group
 * - Uses official Observable Plot fx + x pattern
 * - Automatic legend
 * - Quartile boxes with median line
 */
export function BoxPlotFacetedGrouped({
  data,
  facetLabel = 'Facet',
  categoryLabel = 'Category',
  groupLabel = 'Group',
  yLabel = 'Value',
  title,
  width = 1200,
  height = 500,
  colorScheme = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3'],
  className = '',
  ariaLabel = 'Faceted and grouped box plot showing distributions across panels with side-by-side groups'
}: BoxPlotFacetedGroupedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Transform data to create compound x-axis keys for side-by-side positioning within facets
    const transformedData = data.map((d) => ({
      ...d,
      compoundCategory: `${d.category}__${d.group}` // Unique key for side-by-side boxes
    }));

    // Get unique values for ordering
    const categories = [...new Set(data.map((d) => d.category))];
    const groups = [...new Set(data.map((d) => d.group))];

    // Create ordered domain for x-axis (same within each facet)
    const xDomain = categories.flatMap(cat =>
      groups.map(grp => `${cat}__${grp}`)
    );

    // Create tick configuration to show label only once per category, positioned towards the right
    const middleGroupIndex = Math.ceil((groups.length - 1) / 2);
    const tickValues = categories.flatMap(cat => `${cat}__${groups[middleGroupIndex]}`); // Position towards right of each category
    const tickFormat = (d: string) => d.split('__')[0];

    // Create faceted plot with compound x-axis for side-by-side boxes
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 50 : 40,
      marginRight: 20,
      marginBottom: 100,
      marginLeft: 60,
      title: title,
      fx: {
        label: facetLabel,       // Facet panels
        padding: 0.1
      },
      x: {
        label: categoryLabel,    // Categories within each panel
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
          x: 'compoundCategory',  // Compound key for side-by-side positioning
          y: 'value',
          fx: 'facet',            // Facet by region/panel dimension
          fill: 'group',
          fillOpacity: 0.4,
          stroke: 'group',
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
  }, [data, facetLabel, categoryLabel, yLabel, groupLabel, title, width, height, colorScheme, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
