'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { mean, deviation } from 'd3-array';

export interface PointPlotProps {
  data: Array<{ category: string; values: number[] }>;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  confidenceLevel?: number;
  showLine?: boolean;
  pointColor?: string;
  lineColor?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * PointPlot - Point estimates with confidence intervals
 *
 * Use cases:
 * - Show means with uncertainty across categories
 * - Compare group averages with statistical confidence
 * - Visualize experimental results with error bars
 * - Meta-analysis of effect sizes
 *
 * Features:
 * - Calculates means and CIs from raw values
 * - 95% confidence intervals by default
 * - Error bars with caps
 * - Connected line through means
 * - Customizable confidence level
 */
export function PointPlot({
  data,
  xLabel = 'Category',
  yLabel = 'Mean Value',
  title,
  width = 800,
  height = 500,
  confidenceLevel = 0.95,
  showLine = true,
  pointColor = '#3b82f6',
  lineColor = '#3b82f6',
  className = '',
  ariaLabel = 'Point plot showing means with confidence intervals'
}: PointPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Calculate means and CIs
    const zScore = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.95 ? 1.96 : 1.645;

    const summaryData = data.map((item) => {
      const avg = mean(item.values) || 0;
      const std = deviation(item.values) || 0;
      const n = item.values.length;
      const se = std / Math.sqrt(n);
      const ci = zScore * se;

      return {
        category: item.category,
        mean: avg,
        lower: avg - ci,
        upper: avg + ci,
        n
      };
    });

    const marks: any[] = [];

    // Error bars (CI)
    marks.push(
      Plot.ruleY(summaryData, {
        x: 'category',
        y1: 'lower',
        y2: 'upper',
        stroke: '#666',
        strokeWidth: 2
      })
    );

    // Caps on error bars
    marks.push(
      Plot.tickX(summaryData, {
        x: 'category',
        y: 'lower',
        stroke: '#666',
        strokeWidth: 2
      }),
      Plot.tickX(summaryData, {
        x: 'category',
        y: 'upper',
        stroke: '#666',
        strokeWidth: 2
      })
    );

    // Mean points
    marks.push(
      Plot.dot(summaryData, {
        x: 'category',
        y: 'mean',
        fill: pointColor,
        r: 6,
        stroke: '#000',
        strokeWidth: 2
      })
    );

    // Connect means
    if (showLine) {
      marks.push(
        Plot.line(summaryData, {
          x: 'category',
          y: 'mean',
          stroke: lineColor,
          strokeWidth: 2
        })
      );
    }

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
  }, [data, xLabel, yLabel, title, width, height, confidenceLevel, showLine, pointColor, lineColor, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
