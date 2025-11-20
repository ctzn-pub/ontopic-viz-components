'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

export interface DistributionPlotProps {
  data: Array<{ value: number; group?: string }>;
  xLabel?: string;
  title?: string;
  width?: number;
  height?: number;
  showHistogram?: boolean;
  showDensity?: boolean;
  showRug?: boolean;
  showMean?: boolean;
  showMedian?: boolean;
  binCount?: number;
  fillColor?: string;
  densityColor?: string;
  meanColor?: string;
  medianColor?: string;
  groupColors?: Record<string, string>;
  className?: string;
  ariaLabel?: string;
}

/**
 * DistributionPlot - Combined histogram, density curve, and rug plot
 *
 * Use cases:
 * - Explore distributions
 * - Identify skewness and outliers
 * - Compare group distributions
 * - Pre-analysis exploratory checks
 *
 * Features:
 * - Histogram with adjustable bins
 * - Density curve overlay
 * - Rug plot showing individual values
 * - Mean and median reference lines
 * - Multiple group support (overlaid or faceted)
 */
export function DistributionPlot({
  data,
  xLabel = 'Value',
  title,
  width = 640,
  height = 400,
  showHistogram = true,
  showDensity = true,
  showRug = false,
  showMean = false,
  showMedian = false,
  binCount = 20,
  fillColor = '#3b82f6',
  densityColor = '#ef4444',
  meanColor = '#22c55e',
  medianColor = '#f97316',
  groupColors,
  className = '',
  ariaLabel = 'Distribution plot showing data distribution'
}: DistributionPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Check for groups
    const hasGroups = data.some(d => d.group !== undefined);
    const groups = hasGroups ? Array.from(new Set(data.map(d => d.group).filter(Boolean))) : [undefined];

    const marks: any[] = [];

    // Default color palette
    const defaultColors = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#6366f1', '#14b8a6'];

    if (hasGroups) {
      // Multiple groups - overlay with transparency
      groups.forEach((group, i) => {
        const groupData = data.filter(d => d.group === group);
        const color = groupColors?.[group as string] || defaultColors[i % defaultColors.length];

        if (showHistogram) {
          marks.push(
            Plot.rectY(
              groupData,
              Plot.binX(
                { y: 'count' },
                {
                  x: 'value',
                  fill: color,
                  fillOpacity: 0.5,
                  thresholds: binCount
                }
              )
            )
          );
        }

        if (showDensity) {
          // Use density mark directly instead of densityY transform
          marks.push(
            Plot.density(
              groupData,
              {
                x: 'value',
                fill: color,
                fillOpacity: 0.2,
                stroke: color,
                strokeWidth: 2
              }
            )
          );
        }

        if (showRug) {
          marks.push(
            Plot.tickX(groupData, {
              x: 'value',
              stroke: color,
              strokeOpacity: 0.3
            })
          );
        }

        // Group-wise mean/median
        if (showMean) {
          const mean = groupData.reduce((sum, d) => sum + d.value, 0) / groupData.length;
          marks.push(
            Plot.ruleX([mean], {
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: '4,4'
            })
          );
        }

        if (showMedian) {
          const sorted = [...groupData].sort((a, b) => a.value - b.value);
          const median = sorted[Math.floor(sorted.length / 2)]?.value || 0;
          marks.push(
            Plot.ruleX([median], {
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: '2,2'
            })
          );
        }
      });
    } else {
      // Single distribution
      if (showHistogram) {
        marks.push(
          Plot.rectY(
            data,
            Plot.binX(
              { y: 'count' },
              {
                x: 'value',
                fill: fillColor,
                fillOpacity: 0.7,
                thresholds: binCount
              }
            )
          )
        );
      }

      if (showDensity) {
        // Use density mark directly instead of densityY transform
        marks.push(
          Plot.density(
            data,
            {
              x: 'value',
              fill: densityColor,
              fillOpacity: 0.2,
              stroke: densityColor,
              strokeWidth: 2
            }
          )
        );
      }

      if (showRug) {
        marks.push(
          Plot.tickX(data, {
            x: 'value',
            stroke: fillColor,
            strokeOpacity: 0.5
          })
        );
      }

      if (showMean) {
        const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
        marks.push(
          Plot.ruleX([mean], {
            stroke: meanColor,
            strokeWidth: 2,
            strokeDasharray: '4,4'
          })
        );
      }

      if (showMedian) {
        const sorted = [...data].sort((a, b) => a.value - b.value);
        const median = sorted[Math.floor(sorted.length / 2)]?.value || 0;
        marks.push(
          Plot.ruleX([median], {
            stroke: medianColor,
            strokeWidth: 2,
            strokeDasharray: '2,2'
          })
        );
      }
    }

    // Create plot
    const plot = Plot.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 40,
      marginLeft: 50,
      title: title,
      x: {
        label: xLabel,
        grid: true
      },
      y: {
        label: showDensity && !showHistogram ? 'Density' : 'Count',
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
  }, [data, xLabel, title, width, height, showHistogram, showDensity, showRug, showMean, showMedian, binCount, fillColor, densityColor, meanColor, medianColor, groupColors, ariaLabel]);

  return <div ref={containerRef} className={className} />;
}
