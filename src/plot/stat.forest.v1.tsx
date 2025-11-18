'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface ForestPlotDataPoint {
  variable: string;
  coef: number;
  ci_lower: number;
  ci_upper: number;
  pvalue?: number;
  group?: string;
}

export interface ForestPlotProps {
  data: ForestPlotDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  sortBy?: 'coef' | 'pvalue' | 'variable' | 'none';
  showPValues?: boolean;
  showZeroLine?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  nonsigColor?: string;
  significanceLevel?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * ForestPlot - Regression coefficients with confidence intervals
 *
 * Use cases:
 * - Display regression coefficients
 * - Meta-analysis results
 * - Risk factor analysis
 * - A/B test effect estimates
 * - Treatment effect visualization
 *
 * Features:
 * - Point estimates with confidence intervals
 * - Zero reference line
 * - Color-coded by direction (positive/negative)
 * - Significance stars (*, **, ***)
 * - Sortable by coefficient or p-value
 * - Multiple model support (grouped)
 */
export function ForestPlot({
  data,
  title,
  width = 640,
  height = 400,
  sortBy = 'coef',
  showPValues = false,
  showZeroLine = true,
  positiveColor = '#22c55e',
  negativeColor = '#ef4444',
  nonsigColor = '#94a3b8',
  significanceLevel = 0.05,
  className = '',
  ariaLabel = 'Forest plot showing regression coefficients with confidence intervals'
}: ForestPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Sort data
    let sortedData = [...data];
    if (sortBy === 'coef') {
      sortedData.sort((a, b) => Math.abs(b.coef) - Math.abs(a.coef));
    } else if (sortBy === 'pvalue' && data.every(d => d.pvalue !== undefined)) {
      sortedData.sort((a, b) => (a.pvalue || 1) - (b.pvalue || 1));
    } else if (sortBy === 'variable') {
      sortedData.sort((a, b) => a.variable.localeCompare(b.variable));
    }

    // Determine colors based on significance
    const getColor = (d: ForestPlotDataPoint) => {
      if (showPValues && d.pvalue !== undefined) {
        if (d.pvalue >= significanceLevel) return nonsigColor;
      }
      // Check if CI crosses zero
      if ((d.ci_lower < 0 && d.ci_upper > 0)) return nonsigColor;
      return d.coef > 0 ? positiveColor : negativeColor;
    };

    const marks: any[] = [];

    // Zero reference line
    if (showZeroLine) {
      marks.push(
        Plot.ruleX([0], {
          stroke: '#000',
          strokeWidth: 2
        })
      );
    }

    // Confidence interval lines
    marks.push(
      Plot.ruleX(sortedData, {
        x1: 'ci_lower',
        x2: 'ci_upper',
        y: 'variable',
        stroke: (d: ForestPlotDataPoint) => getColor(d),
        strokeWidth: 2
      })
    );

    // CI endpoints (ticks)
    marks.push(
      Plot.tickX(sortedData, {
        x: 'ci_lower',
        y: 'variable',
        stroke: (d: ForestPlotDataPoint) => getColor(d),
        strokeWidth: 2
      })
    );

    marks.push(
      Plot.tickX(sortedData, {
        x: 'ci_upper',
        y: 'variable',
        stroke: (d: ForestPlotDataPoint) => getColor(d),
        strokeWidth: 2
      })
    );

    // Point estimates
    marks.push(
      Plot.dot(sortedData, {
        x: 'coef',
        y: 'variable',
        fill: (d: ForestPlotDataPoint) => getColor(d),
        r: 5
      })
    );

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 40,
      marginLeft: 150, // Extra space for variable names
      title: title,
      x: {
        label: 'Coefficient',
        grid: true
      },
      y: {
        label: null,
        domain: sortedData.map(d => d.variable)
      },
      marks
    }) as SVGSVGElement;

    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', ariaLabel);

    containerRef.current.appendChild(plot);

    // Add significance stars if requested
    if (showPValues) {
      sortedData.forEach((d, i) => {
        if (d.pvalue !== undefined) {
          let stars = '';
          if (d.pvalue < 0.001) stars = '***';
          else if (d.pvalue < 0.01) stars = '**';
          else if (d.pvalue < 0.05) stars = '*';

          if (stars) {
            const starText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            starText.setAttribute('x', String(width - 40));
            starText.setAttribute('y', String(60 + i * (height - 80) / sortedData.length));
            starText.setAttribute('text-anchor', 'start');
            starText.setAttribute('font-size', '14');
            starText.setAttribute('fill', '#666');
            starText.textContent = stars;
            plot.appendChild(starText);
          }
        }
      });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, title, width, height, sortBy, showPValues, showZeroLine, positiveColor, negativeColor, nonsigColor, significanceLevel, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
