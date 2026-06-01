'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { feature } from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { useVizTheme } from '@/viz/theme/provider';

export interface CountyHexbinData {
  /** TopoJSON with a `counties` object (GEOID on feature.properties). */
  topology: unknown;
  /** Per-county values keyed by GEOID string. */
  values: Record<string, number>;
  /** Color domain [min, max]. */
  domain?: [number, number];
  measure?: string;
  label?: string;
}

export interface CountyHexbinProps {
  data: CountyHexbinData;
  /** Override the color domain. */
  domain?: [number, number];
  /** Color-legend label. */
  label?: string;
  width?: number;
  height?: number;
}

/**
 * CountyHexbin — every county snapped to a hex lattice by its projected centroid,
 * each hex colored by the mean of the counties it absorbs.
 *
 * Removes the area bias of a county choropleth while preserving spatial pattern.
 * Color is a magnitude encoding, so it uses the theme's sequential ramp (resolved
 * via scaleFor). Ported from "Picturing American Health" (Ch.7).
 */
const CountyHexbin: React.FC<CountyHexbinProps> = ({
  data,
  domain,
  label,
  width = 720,
  height = 460,
}) => {
  const { theme, scaleFor } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const topo = data?.topology as
      | { objects: { counties: unknown } }
      | undefined;
    const values = data?.values ?? {};
    if (!topo) return;

    const dom = domain ?? data?.domain ?? [0, 100];
    const fc = feature(topo as never, topo.objects.counties as never) as {
      features: { properties?: Record<string, unknown> }[];
    };

    const projection = geoAlbersUsa().fitSize([width, height - 30], fc as never);
    const path = geoPath(projection);
    const radius = 7;
    const dx = Math.sqrt(3) * radius;
    const dy = 1.5 * radius;
    const bins = new Map<string, { sum: number; n: number; cx: number; cy: number }>();
    for (const f of fc.features) {
      const id = String(f.properties?.GEOID ?? '');
      if (!(id in values)) continue;
      const c = path.centroid(f as never);
      if (!c || isNaN(c[0])) continue;
      const row = Math.round(c[1] / dy);
      const off = (row % 2) * (dx / 2);
      const col = Math.round((c[0] - off) / dx);
      const key = `${col},${row}`;
      const b =
        bins.get(key) ?? { sum: 0, n: 0, cx: col * dx + off, cy: row * dy };
      b.sum += values[id];
      b.n += 1;
      bins.set(key, b);
    }
    const hexes = [...bins.values()].map((b) => ({
      cx: b.cx,
      cy: b.cy,
      mean: b.sum / b.n,
    }));

    const ramp = scaleFor({ kind: 'sequential', domain: dom });

    const chart = Plot.plot({
      width,
      height,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: { axis: null },
      y: { axis: null, domain: [height - 30, 0] },
      color: {
        type: 'linear',
        domain: ramp.stops,
        range: ramp.colors,
        legend: true,
        label: label ?? data?.label ?? 'value (%)',
      },
      marks: [
        Plot.dot(hexes, {
          x: 'cx',
          y: 'cy',
          fill: 'mean',
          r: radius * 0.92,
          symbol: 'hexagon',
          stroke: theme.surface,
          strokeWidth: 0.4,
          tip: true,
        }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, domain, label, width, height, theme, scaleFor]);

  return <div ref={containerRef} />;
};

export default CountyHexbin;
