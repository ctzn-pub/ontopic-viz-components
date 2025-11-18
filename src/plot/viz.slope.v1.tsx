'use client';

import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

/**
 * SlopeChart Component (viz.slope.v1)
 *
 * Shows change between two time points using connecting lines.
 * Perfect for before/after comparisons, ranking changes, and treatment effects.
 *
 * @example
 * ```tsx
 * <SlopeChart
 *   data={[
 *     { label: 'Product A', before: 45, after: 68 },
 *     { label: 'Product B', before: 72, after: 58 }
 *   ]}
 *   beforeKey="before"
 *   afterKey="after"
 *   labelKey="label"
 * />
 * ```
 */

export interface SlopeChartProps {
  data: any[];
  beforeKey: string;
  afterKey: string;
  labelKey: string;
  beforeLabel?: string;
  afterLabel?: string;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  increaseColor?: string;
  decreaseColor?: string;
  noChangeColor?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  dotSize?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  className?: string;
}

export function SlopeChart({
  data,
  beforeKey,
  afterKey,
  labelKey,
  beforeLabel = 'Before',
  afterLabel = 'After',
  width = 800,
  height = 500,
  marginLeft = 100,
  marginRight = 100,
  marginTop = 40,
  marginBottom = 40,
  increaseColor = '#22c55e',
  decreaseColor = '#ef4444',
  noChangeColor = '#6b7280',
  title,
  subtitle,
  caption,
  dotSize = 4,
  strokeWidth = 2,
  showLabels = true,
  className = ''
}: SlopeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Transform data into long format for plotting
    const longData: any[] = [];
    data.forEach(d => {
      longData.push(
        { [labelKey]: d[labelKey], time: beforeLabel, value: d[beforeKey], change: d[afterKey] - d[beforeKey] },
        { [labelKey]: d[labelKey], time: afterLabel, value: d[afterKey], change: d[afterKey] - d[beforeKey] }
      );
    });

    // Function to determine color based on change
    const getColor = (change: number) => {
      if (change > 0) return increaseColor;
      if (change < 0) return decreaseColor;
      return noChangeColor;
    };

    // Build marks array
    const marks: any[] = [];

    // Slope lines connecting before and after
    marks.push(
      Plot.line(longData, {
        x: 'time',
        y: 'value',
        z: labelKey,
        stroke: d => getColor(d.change),
        strokeWidth,
        title: d => `${d[labelKey]}: ${d.change > 0 ? '+' : ''}${d.change.toFixed(1)}`
      })
    );

    // Dots at endpoints
    marks.push(
      Plot.dot(longData, {
        x: 'time',
        y: 'value',
        fill: d => getColor(d.change),
        r: dotSize,
        title: d => `${d[labelKey]}: ${d.value.toFixed(1)}`
      })
    );

    // Optional labels
    if (showLabels) {
      // Labels on the left (before)
      const beforeData = data.map(d => ({
        [labelKey]: d[labelKey],
        time: beforeLabel,
        value: d[beforeKey],
        change: d[afterKey] - d[beforeKey]
      }));

      marks.push(
        Plot.text(beforeData, {
          x: 'time',
          y: 'value',
          text: labelKey,
          dx: -10,
          textAnchor: 'end',
          fill: d => getColor(d.change),
          fontSize: 11
        })
      );

      // Values on the right (after)
      const afterData = data.map(d => ({
        [labelKey]: d[labelKey],
        time: afterLabel,
        value: d[afterKey],
        change: d[afterKey] - d[beforeKey]
      }));

      marks.push(
        Plot.text(afterData, {
          x: 'time',
          y: 'value',
          text: d => d.value.toFixed(1),
          dx: 10,
          textAnchor: 'start',
          fill: d => getColor(d.change),
          fontSize: 11,
          fontWeight: 600
        })
      );
    }

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      title,
      subtitle,
      caption,
      x: {
        domain: [beforeLabel, afterLabel],
        label: null
      },
      y: {
        label: null,
        grid: true
      },
      marks
    }) as SVGSVGElement;

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [
    data,
    beforeKey,
    afterKey,
    labelKey,
    beforeLabel,
    afterLabel,
    width,
    height,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    increaseColor,
    decreaseColor,
    noChangeColor,
    title,
    subtitle,
    caption,
    dotSize,
    strokeWidth,
    showLabels
  ]);

  return <div ref={containerRef} className={className} />;
}
