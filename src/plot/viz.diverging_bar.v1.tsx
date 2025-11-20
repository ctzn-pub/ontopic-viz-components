'use client';

import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

/**
 * DivergingBar Component (viz.diverging_bar.v1)
 *
 * Horizontal bar chart with positive values extending right and negative values extending left
 * from a central zero baseline. Perfect for survey responses, sentiment analysis, NPS scores,
 * and election margins.
 *
 * @example
 * ```tsx
 * <DivergingBar
 *   data={[
 *     { category: 'Strongly Agree', positive: 45, negative: -12 },
 *     { category: 'Agree', positive: 32, negative: -8 }
 *   ]}
 *   categoryKey="category"
 *   positiveKey="positive"
 *   negativeKey="negative"
 * />
 * ```
 */

export interface DivergingBarProps {
  data: any[];
  categoryKey: string;
  positiveKey: string;
  negativeKey: string;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  positiveColor?: string;
  negativeColor?: string;
  positiveLabel?: string;
  negativeLabel?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  sortByNet?: boolean;
  showZeroLine?: boolean;
  className?: string;
}

export function DivergingBar({
  data,
  categoryKey,
  positiveKey,
  negativeKey,
  width = 800,
  height = 400,
  marginLeft = 120,
  marginRight = 60,
  marginTop = 40,
  marginBottom = 40,
  positiveColor = '#22c55e',
  negativeColor = '#ef4444',
  positiveLabel = 'Positive',
  negativeLabel = 'Negative',
  title,
  subtitle,
  caption,
  sortByNet = true,
  showZeroLine = true,
  className = ''
}: DivergingBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Calculate net values and sort if requested
    let processedData = data.map(d => ({
      ...d,
      net: d[positiveKey] + d[negativeKey] // negative values should already be negative
    }));

    if (sortByNet) {
      processedData = [...processedData].sort((a, b) => b.net - a.net);
    }

    // Build marks array
    const marks: any[] = [];

    // Zero baseline
    if (showZeroLine) {
      marks.push(
        Plot.ruleX([0], {
          stroke: '#000',
          strokeWidth: 2
        })
      );
    }

    // Positive bars (extending right)
    marks.push(
      Plot.barX(processedData, {
        y: categoryKey,
        x: positiveKey,
        fill: positiveColor,
        title: d => `${d[categoryKey]}: ${d[positiveKey]}% ${positiveLabel}`
      })
    );

    // Negative bars (extending left)
    marks.push(
      Plot.barX(processedData, {
        y: categoryKey,
        x: negativeKey,
        fill: negativeColor,
        title: d => `${d[categoryKey]}: ${Math.abs(d[negativeKey])}% ${negativeLabel}`
      })
    );

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
      y: {
        label: null,
        domain: processedData.map(d => d[categoryKey])
      },
      x: {
        label: '← ' + negativeLabel + '     |     ' + positiveLabel + ' →',
        grid: true,
        tickFormat: d => Math.abs(d) + '%'
      },
      marks
    }) as SVGSVGElement;

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [
    data,
    categoryKey,
    positiveKey,
    negativeKey,
    width,
    height,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    positiveColor,
    negativeColor,
    positiveLabel,
    negativeLabel,
    title,
    subtitle,
    caption,
    sortByNet,
    showZeroLine
  ]);

  return <div ref={containerRef} className={className} />;
}
