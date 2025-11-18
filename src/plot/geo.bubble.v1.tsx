'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";

/**
 * BubbleMap Component
 *
 * A geographic bubble map visualization using Observable Plot.
 * Displays data points as circles on a map, with size encoding values.
 *
 * NOTE: This version requires data with longitude and latitude coordinates.
 * For TopoJSON-based maps, see the geography integration guide.
 *
 * @example
 * ```tsx
 * <BubbleMap
 *   data={[
 *     { lon: -122.4194, lat: 37.7749, value: 850000, name: 'San Francisco' },
 *     { lon: -74.0060, lat: 40.7128, value: 8400000, name: 'New York' }
 *   ]}
 *   longitudeKey="lon"
 *   latitudeKey="lat"
 *   sizeKey="value"
 *   nameKey="name"
 * />
 * ```
 */

export interface BubbleMapProps {
  /** Data array with geographic coordinates */
  data: any[];

  /** Field name for longitude */
  longitudeKey: string;

  /** Field name for latitude */
  latitudeKey: string;

  /** Field name for bubble size */
  sizeKey: string;

  /** Optional field name for bubble color encoding */
  colorKey?: string;

  /** Optional field name for labels/tooltips */
  nameKey?: string;

  /** Chart title */
  title?: string;

  /** Chart subtitle */
  subtitle?: string;

  /** Bubble fill color (if not using colorKey) */
  fill?: string;

  /** Bubble fill opacity */
  fillOpacity?: number;

  /** Bubble stroke color */
  stroke?: string;

  /** Bubble stroke width */
  strokeWidth?: number;

  /** Chart width in pixels */
  width?: number;

  /** Chart height in pixels */
  height?: number;

  /** Projection type for geographic data */
  projection?: 'albers-usa' | 'mercator' | 'equal-earth' | 'orthographic';

  /** Additional CSS classes */
  className?: string;
}

export function BubbleMap({
  data,
  longitudeKey,
  latitudeKey,
  sizeKey,
  colorKey,
  nameKey,
  title,
  subtitle,
  fill = '#4682b4',
  fillOpacity = 0.6,
  stroke = '#fff',
  strokeWidth = 1,
  width = 975,
  height = 610,
  projection = 'albers-usa',
  className = ''
}: BubbleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Transform data for Plot
    const plotData = data.map(d => ({
      ...d,
      longitude: d[longitudeKey],
      latitude: d[latitudeKey],
      size: d[sizeKey],
      ...(colorKey && { color: d[colorKey] }),
      ...(nameKey && { name: d[nameKey] })
    }));

    // Build marks
    const marks: any[] = [
      // Bubble dots
      Plot.dot(plotData, {
        x: 'longitude',
        y: 'latitude',
        r: 'size',
        fill: colorKey ? 'color' : fill,
        fillOpacity,
        stroke,
        strokeWidth,
        title: nameKey
          ? d => `${d.name}: ${d.size.toLocaleString()}`
          : d => d.size.toLocaleString(),
        tip: true
      })
    ];

    // Create the plot
    const plot = Plot.plot({
      width,
      height,
      title,
      subtitle,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      projection: {
        type: projection,
        ...(projection === 'albers-usa' && { domain: { type: 'MultiPoint', coordinates: plotData.map(d => [d.longitude, d.latitude]) } })
      },
      marks
    }) as SVGSVGElement;

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, longitudeKey, latitudeKey, sizeKey, colorKey, nameKey, title, subtitle, fill, fillOpacity, stroke, strokeWidth, width, height, projection]);

  return (
    <div ref={containerRef} className={className} />
  );
}

export default BubbleMap;
