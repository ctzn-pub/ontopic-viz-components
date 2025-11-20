'use client';

import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

/**
 * BulletChart Component (viz.bullet.v1)
 *
 * Compact horizontal bar chart showing actual vs target performance with color-coded ranges.
 * Perfect for KPI dashboards, sales tracking, budget monitoring, and goal progress.
 *
 * @example
 * ```tsx
 * <BulletChart
 *   title="Revenue"
 *   value={85}
 *   target={100}
 *   ranges={[
 *     { threshold: 60, color: '#ef4444', label: 'Poor' },
 *     { threshold: 80, color: '#f59e0b', label: 'Fair' },
 *     { threshold: 100, color: '#22c55e', label: 'Good' }
 *   ]}
 * />
 * ```
 */

export interface BulletRange {
  threshold: number;
  color: string;
  label: string;
}

export interface BulletChartProps {
  title: string;
  value: number;
  target: number;
  ranges: BulletRange[];
  width?: number;
  height?: number;
  valueColor?: string;
  targetColor?: string;
  showLabels?: boolean;
  className?: string;
}

export function BulletChart({
  title,
  value,
  target,
  ranges,
  width = 400,
  height = 80,
  valueColor = '#1e293b',
  targetColor = '#000000',
  showLabels = true,
  className = ''
}: BulletChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Sort ranges by threshold to ensure proper layering
    const sortedRanges = [...ranges].sort((a, b) => b.threshold - a.threshold);

    // Calculate max value for x-axis domain
    const maxValue = Math.max(
      target * 1.1,
      value * 1.1,
      ...sortedRanges.map(r => r.threshold)
    );

    // Build marks array
    const marks: any[] = [];

    // Background ranges (largest to smallest for proper layering)
    sortedRanges.forEach(range => {
      marks.push(
        Plot.barX([{ value: range.threshold }], {
          x: 'value',
          fill: range.color,
          fillOpacity: 0.3,
          y: () => title,
          title: () => `${range.label}: ${range.threshold}`
        })
      );
    });

    // Actual performance bar (darker, thinner)
    marks.push(
      Plot.barX([{ value }], {
        x: 'value',
        fill: valueColor,
        y: () => title,
        insetTop: 15,
        insetBottom: 15,
        title: () => `Actual: ${value}`
      })
    );

    // Target marker (vertical line)
    marks.push(
      Plot.tickX([{ value: target }], {
        x: 'value',
        y: () => title,
        stroke: targetColor,
        strokeWidth: 3,
        insetTop: 10,
        insetBottom: 10,
        title: () => `Target: ${target}`
      })
    );

    // Optional value labels
    if (showLabels) {
      // Value label
      marks.push(
        Plot.text([{ value, label: value.toString() }], {
          x: 'value',
          y: () => title,
          text: 'label',
          dx: 5,
          dy: -15,
          fontSize: 12,
          fontWeight: 600,
          fill: valueColor
        })
      );

      // Target label
      marks.push(
        Plot.text([{ value: target, label: `Target: ${target}` }], {
          x: 'value',
          y: () => title,
          text: 'label',
          dx: 5,
          dy: 15,
          fontSize: 10,
          fill: targetColor
        })
      );
    }

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 100,
      marginRight: 60,
      marginTop: 10,
      marginBottom: 10,
      x: {
        domain: [0, maxValue],
        label: null,
        grid: true
      },
      y: {
        domain: [title],
        label: null
      },
      marks
    }) as SVGSVGElement;

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [title, value, target, ranges, width, height, valueColor, targetColor, showLabels]);

  return <div ref={containerRef} className={className} />;
}
