'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface FacetedPlotProps {
  data: any[];
  x: string;
  y: string;
  facetX?: string;
  facetY?: string;
  mark?: 'dot' | 'line' | 'bar' | 'area';
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  sharedScales?: boolean;
  color?: string;
  groupBy?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * FacetedPlot - Small multiples for comparative analysis
 *
 * Use cases:
 * - Compare trends across groups
 * - Panel data visualization
 * - A/B test results by segment
 * - Diagnostic plots
 * - Comparative time series
 *
 * Features:
 * - X, Y, or X×Y faceting
 * - Shared or independent scales
 * - Multiple mark types (dot, line, bar, area)
 * - Automatic layout and spacing
 * - Performance optimization with sampling
 */
export function FacetedPlot({
  data,
  x,
  y,
  facetX,
  facetY,
  mark = 'dot',
  xLabel,
  yLabel,
  title,
  width = 900,
  height = 600,
  sharedScales = true,
  color = '#3b82f6',
  groupBy,
  className = '',
  ariaLabel = 'Faceted plot showing comparative analysis across groups'
}: FacetedPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Sample data within facets if too large
    let plotData = data;
    if (!facetX && !facetY) {
      // No faceting, just sample overall
      if (data.length > 10000) {
        const sampleRate = 10000 / data.length;
        plotData = data.filter(() => Math.random() < sampleRate);
      }
    } else {
      // With faceting, sample within each facet
      const facetKey = facetX || facetY;
      if (facetKey) {
        const groups = Array.from(new Set(data.map(d => d[facetKey])));
        const maxPerGroup = Math.floor(10000 / groups.length);

        plotData = [];
        groups.forEach(group => {
          let groupData = data.filter(d => d[facetKey] === group);
          if (groupData.length > maxPerGroup) {
            const sampleRate = maxPerGroup / groupData.length;
            groupData = groupData.filter(() => Math.random() < sampleRate);
          }
          plotData.push(...groupData);
        });
      }
    }

    // Build marks based on mark type
    let marks: any[] = [];

    const baseOptions: any = {
      x,
      y,
      ...(facetX && { fx: facetX }),
      ...(facetY && { fy: facetY })
    };

    if (groupBy) {
      baseOptions.stroke = groupBy;
      baseOptions.fill = groupBy;
    } else {
      if (mark === 'line' || mark === 'area') {
        baseOptions.stroke = color;
      } else {
        baseOptions.fill = color;
      }
    }

    switch (mark) {
      case 'dot':
        marks.push(
          Plot.dot(plotData, {
            ...baseOptions,
            r: 3,
            fillOpacity: 0.6
          })
        );
        break;

      case 'line':
        marks.push(
          Plot.line(plotData, {
            ...baseOptions,
            strokeWidth: 2,
            ...(groupBy && { z: groupBy })
          })
        );
        break;

      case 'bar':
        marks.push(
          Plot.barY(plotData, {
            ...baseOptions
          })
        );
        break;

      case 'area':
        marks.push(
          Plot.areaY(plotData, {
            ...baseOptions,
            fillOpacity: 0.5,
            ...(groupBy && { z: groupBy })
          })
        );
        break;
    }

    // Create plot with facets
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 50 : 30,
      marginRight: 20,
      marginBottom: 50,
      marginLeft: 60,
      title: title,
      x: {
        label: xLabel || x,
        grid: true
      },
      y: {
        label: yLabel || y,
        grid: true
      },
      ...(facetX && {
        fx: {
          label: facetX,
          ...(sharedScales ? {} : { domain: undefined })
        }
      }),
      ...(facetY && {
        fy: {
          label: facetY,
          ...(sharedScales ? {} : { domain: undefined })
        }
      }),
      marks
    }) as SVGSVGElement;

    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', ariaLabel);

    containerRef.current.appendChild(plot);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, x, y, facetX, facetY, mark, xLabel, yLabel, title, width, height, sharedScales, color, groupBy, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
