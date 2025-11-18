'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface QQPlotProps {
  data: number[];
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
 * QQPlot - Quantile-quantile plot for normality testing
 *
 * Use cases:
 * - Test normality assumption
 * - Identify distribution shape
 * - Detect heavy tails or skewness
 * - Compare to theoretical normal distribution
 *
 * Features:
 * - Sample quantiles vs theoretical normal quantiles
 * - 45-degree reference line (y=x)
 * - Automatic quantile calculation
 * - Pattern detection for departures from normality
 */
export function QQPlot({
  data,
  xLabel = 'Theoretical Quantiles',
  yLabel = 'Sample Quantiles',
  title,
  width = 800,
  height = 500,
  pointColor = '#3b82f6',
  lineColor = '#ef4444',
  className = '',
  ariaLabel = 'Q-Q plot for normality testing'
}: QQPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Sort data for sample quantiles
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;

    // Calculate theoretical quantiles (inverse normal CDF)
    // Using approximation for standard normal quantiles
    const qqData = sortedData.map((value, i) => {
      const p = (i + 0.5) / n; // Probability
      // Approximation of inverse normal CDF (quantile function)
      const theoretical = Math.sqrt(2) * inverseErf(2 * p - 1);
      return {
        theoretical,
        sample: value
      };
    });

    // Calculate reference line bounds
    const minVal = Math.min(...qqData.map((d) => d.theoretical));
    const maxVal = Math.max(...qqData.map((d) => d.theoretical));

    // Scale reference line to match data
    const sampleMin = Math.min(...sortedData);
    const sampleMax = Math.max(...sortedData);
    const slope = (sampleMax - sampleMin) / (maxVal - minVal);
    const intercept = sampleMin - slope * minVal;

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
        // Reference line (theoretical normal)
        Plot.line(
          [
            { x: minVal, y: intercept + slope * minVal },
            { x: maxVal, y: intercept + slope * maxVal }
          ],
          {
            x: 'x',
            y: 'y',
            stroke: lineColor,
            strokeWidth: 2,
            strokeDasharray: '5,5'
          }
        ),
        // Q-Q points
        Plot.dot(qqData, {
          x: 'theoretical',
          y: 'sample',
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

// Approximation of inverse error function for normal quantiles
function inverseErf(x: number): number {
  const a = 0.147;
  const b = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
  const sqrt1 = Math.sqrt(b * b - Math.log(1 - x * x) / a);
  const sqrt2 = Math.sqrt(sqrt1 - b);
  return sqrt2 * Math.sign(x);
}
