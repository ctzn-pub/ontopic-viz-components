'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface ResidualPlotProps {
  data: Array<{ x: number; y: number }>;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  pointColor?: string;
  lineColor?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * ResidualPlot - Diagnostic plot for regression residuals
 *
 * Use cases:
 * - Check regression assumptions
 * - Identify heteroscedasticity
 * - Detect non-linear patterns
 * - Find outliers and influential points
 *
 * Features:
 * - Residuals vs fitted values
 * - Zero reference line
 * - Automatic residual calculation
 * - Pattern detection
 */
export function ResidualPlot({
  data,
  xLabel = 'Fitted Values',
  yLabel = 'Residuals',
  title,
  width = 800,
  height = 500,
  pointColor = '#3b82f6',
  lineColor = '#ef4444',
  className = '',
  ariaLabel = 'Residual plot for regression diagnostics'
}: ResidualPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Calculate simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate residuals
    const residualData = data.map((d) => {
      const fitted = intercept + slope * d.x;
      const residual = d.y - fitted;
      return { fitted, residual };
    });

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 60,
      marginLeft: 60,
      title: title,
      x: {
        label: xLabel,
        grid: true
      },
      y: {
        label: yLabel,
        grid: true
      },
      marks: [
        // Zero reference line
        Plot.ruleY([0], {
          stroke: lineColor,
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }),
        // Residual points
        Plot.dot(residualData, {
          x: 'fitted',
          y: 'residual',
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
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
  }, [data, xLabel, yLabel, title, width, height, pointColor, lineColor, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
