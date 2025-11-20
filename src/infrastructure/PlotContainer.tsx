'use client';

import { useEffect, useRef, useState } from 'react';
import * as Plot from '@observablehq/plot';
import type { PlotContainerProps } from '../types/plot';

// Simple className utility
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * PlotContainer - Base component for all Observable Plot visualizations
 *
 * Handles:
 * - Responsive width calculation via ResizeObserver
 * - Plot creation and lifecycle management
 * - SVG element injection into the DOM
 * - Cleanup on unmount to prevent memory leaks
 * - Fixed or responsive sizing modes
 * - Accessibility (ARIA labels)
 */
export function PlotContainer({
  plotSpec,
  width = 'responsive',
  height,
  className,
  ariaLabel,
  onPlotCreated,
}: PlotContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<SVGSVGElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Handle responsive width
  useEffect(() => {
    if (width !== 'responsive' || !containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width]);

  // Create/update plot
  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate final width
    const finalWidth = width === 'responsive' ? containerWidth : width;

    // Create plot with updated width
    const plot = Plot.plot({
      ...plotSpec,
      width: finalWidth,
      height: height,
    }) as SVGSVGElement;

    // Clear previous plot
    if (plotRef.current) {
      plotRef.current.remove();
    }

    // Append new plot
    containerRef.current.appendChild(plot);
    plotRef.current = plot;

    // Callback
    onPlotCreated?.(plot);

    // Cleanup
    return () => {
      if (plotRef.current) {
        plotRef.current.remove();
        plotRef.current = null;
      }
    };
  }, [plotSpec, width, height, containerWidth, onPlotCreated]);

  return (
    <div
      ref={containerRef}
      className={cn('plot-container', className)}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
