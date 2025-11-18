'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { mean, median } from 'd3-array';

export interface HistogramPlotProps {
  data: number[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  bins?: number;
  showMean?: boolean;
  showMedian?: boolean;
  fillColor?: string;
  meanColor?: string;
  medianColor?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * HistogramPlot - Distribution histogram with statistical reference lines
 *
 * Use cases:
 * - Explore data distributions
 * - Identify shape, center, and spread
 * - Detect skewness and outliers
 * - Compare to theoretical distributions
 *
 * Features:
 * - Adjustable bin count
 * - Optional mean line (dashed red)
 * - Optional median line (dashed blue)
 * - Automatic bin sizing
 */
export function HistogramPlot({
  data,
  xLabel = 'Value',
  yLabel = 'Frequency',
  title,
  width = 800,
  height = 500,
  bins = 20,
  showMean = true,
  showMedian = false,
  fillColor = '#3b82f6',
  meanColor = '#ef4444',
  medianColor = '#f97316',
  className = '',
  ariaLabel = 'Histogram showing data distribution'
}: HistogramPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    const meanValue = mean(data);
    const medianValue = median(data);

    const marks: any[] = [
      // Histogram
      Plot.rectY(
        data,
        Plot.binX(
          { y: 'count' },
          {
            x: (d) => d,
            thresholds: bins,
            fill: fillColor,
            fillOpacity: 0.7,
            stroke: '#666',
            strokeWidth: 1
          }
        )
      )
    ];

    // Add mean line
    if (showMean && meanValue !== undefined) {
      marks.push(
        Plot.ruleX([meanValue], {
          stroke: meanColor,
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }),
        Plot.text([{ x: meanValue, y: 0 }], {
          x: 'x',
          y: 'y',
          text: () => [`Mean: ${meanValue.toFixed(2)}`],
          dy: -10,
          fill: meanColor,
          fontSize: 12
        })
      );
    }

    // Add median line
    if (showMedian && medianValue !== undefined) {
      marks.push(
        Plot.ruleX([medianValue], {
          stroke: medianColor,
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }),
        Plot.text([{ x: medianValue, y: 0 }], {
          x: 'x',
          y: 'y',
          text: () => [`Median: ${medianValue.toFixed(2)}`],
          dy: -25,
          fill: medianColor,
          fontSize: 12
        })
      );
    }

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 40 : 30,
      marginRight: 20,
      marginBottom: 60,
      marginLeft: 60,
      title: title,
      x: {
        label: xLabel
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
  }, [data, xLabel, yLabel, title, width, height, bins, showMean, showMedian, fillColor, meanColor, medianColor, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
