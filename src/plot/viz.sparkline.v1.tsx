'use client';

import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

/**
 * Sparkline Component (viz.sparkline.v1)
 *
 * Compact inline trend visualization for dashboards, tables, and mobile displays.
 * Supports line, area, and bar variants with optional min/max indicators.
 *
 * @example
 * ```tsx
 * <Sparkline
 *   data={[1, 5, 3, 8, 4, 9, 2]}
 *   variant="line"
 *   showMinMax={true}
 *   positiveColor="#22c55e"
 *   negativeColor="#ef4444"
 * />
 * ```
 */

export interface SparklineProps {
  data: number[];
  variant?: 'line' | 'area' | 'bar';
  width?: number;
  height?: number;
  showMinMax?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
  className?: string;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  variant = 'line',
  width = 200,
  height = 50,
  showMinMax = false,
  positiveColor = '#22c55e',
  negativeColor = '#ef4444',
  neutralColor = '#6b7280',
  className = '',
  ariaLabel = 'Sparkline chart'
}: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Create indexed data for plotting
    const indexedData = data.map((value, index) => ({ index, value }));

    // Determine color based on trend
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    let color = neutralColor;

    if (lastValue > firstValue) {
      color = positiveColor;
    } else if (lastValue < firstValue) {
      color = negativeColor;
    }

    // Build marks array
    const marks: any[] = [];

    // Main sparkline mark
    if (variant === 'line') {
      marks.push(
        Plot.lineY(indexedData, {
          x: 'index',
          y: 'value',
          stroke: color,
          strokeWidth: 2
        })
      );
    } else if (variant === 'area') {
      marks.push(
        Plot.areaY(indexedData, {
          x: 'index',
          y: 'value',
          fill: color,
          fillOpacity: 0.3,
          curve: 'catmull-rom'
        }),
        Plot.lineY(indexedData, {
          x: 'index',
          y: 'value',
          stroke: color,
          strokeWidth: 1.5,
          curve: 'catmull-rom'
        })
      );
    } else if (variant === 'bar') {
      marks.push(
        Plot.barY(indexedData, {
          x: 'index',
          y: 'value',
          fill: color,
          fillOpacity: 0.8
        })
      );
    }

    // Add min/max dots if requested
    if (showMinMax) {
      const minValue = Math.min(...data);
      const maxValue = Math.max(...data);
      const minIndex = data.indexOf(minValue);
      const maxIndex = data.indexOf(maxValue);

      marks.push(
        Plot.dot([{ index: minIndex, value: minValue }], {
          x: 'index',
          y: 'value',
          fill: negativeColor,
          r: 3,
          stroke: 'white',
          strokeWidth: 1
        }),
        Plot.dot([{ index: maxIndex, value: maxValue }], {
          x: 'index',
          y: 'value',
          fill: positiveColor,
          r: 3,
          stroke: 'white',
          strokeWidth: 1
        })
      );
    }

    // Create plot with minimal styling (no axes, no labels)
    const plot = Plot.plot({
      width,
      height,
      marginTop: 5,
      marginRight: 5,
      marginBottom: 5,
      marginLeft: 5,
      x: {
        axis: null
      },
      y: {
        axis: null
      },
      marks
    }) as SVGSVGElement;

    // Add ARIA label for accessibility
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', ariaLabel);

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, variant, width, height, showMinMax, positiveColor, negativeColor, neutralColor, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
