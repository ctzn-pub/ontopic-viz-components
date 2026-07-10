// @ts-nocheck
'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { loadParquetData } from '@/lib/duckdb';
import { useVizTheme } from "@/viz/theme/provider";

const TOPOLOGY_URL = 'https://ontopic-public-data.t3.storage.dev/geo/us-albers-counties-10m.json';
const PARQUET_URL = 'https://ontopic-public-data.t3.storage.dev/sample-data/health_zip.parquet';

interface ZipDataPoint {
  obesity_rate: number;
  latitude: number;
  longitude: number;
}

interface ZipMapProps {
  data?: ZipDataPoint[];
  /**
   * Explicit D3 color-scheme name to override the default. When omitted,
   * the map uses the active theme's diverging ramp (semantic.diverging).
   * Diverging is right for obesity-rate quantiles where readers naturally
   * compare against a national median.
   */
  colorScheme?: string;
}

const ZipMap: React.FC<ZipMapProps> = ({ colorScheme } = {}) => {
  const { theme } = useVizTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const [us, setUs] = useState<any>(null);
  const [data, setData] = useState<ZipDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch topology data
  useEffect(() => {
    fetch(TOPOLOGY_URL)
      .then(response => response.json())
      .then(topology => {
        setUs(topology);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
      });
  }, []);

  // Load data from parquet
  useEffect(() => {
    loadParquetData(PARQUET_URL)
      .then(parquetData => {
        setData(parquetData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading parquet data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !us || loading) return;

    if (mapRef.current) mapRef.current.innerHTML = '';

    // Create the density map
    const statemesh = topojson.mesh(us as any, (us as any).objects.states, (a: any, b: any) => a !== b);
    const nation = topojson.feature(us as any, (us as any).objects.nation);
    const countiesmesh = topojson.mesh(us as any, (us as any).objects.counties);

    // Color: explicit prop wins; otherwise theme's diverging ramp.
    const colorConfig: any = {
      type: "quantile",
      n: 4,
      reverse: true,
      label: "Obesity (%)",
      legend: true,
      tickFormat: (d: number) => `${d.toFixed(1)}%`,
    };
    if (colorScheme) {
      colorConfig.scheme = colorScheme;
    } else {
      colorConfig.range = theme.semantic.diverging;
    }

    const mapPlot = Plot.plot({
      width: 960,
      height: 600,
      projection: "albers",
      style: {
        backgroundColor: theme.surface,
        color: theme.fg,
        fontFamily: theme.fontBody,
      },
      color: colorConfig,
      marks: [
        Plot.geo(countiesmesh, { strokeOpacity: 0.5 }),
        Plot.geo(nation),
        Plot.geo(statemesh, { strokeOpacity: 0.2 }),
        Plot.dot(data, {
          x: "longitude",
          y: "latitude",
          stroke: "obesity_rate",
          tip: true,
          strokeOpacity: 0.4,
          r: 1
        })
      ]
    });

    mapRef.current.appendChild(mapPlot);

    return () => mapPlot?.remove();
  }, [data, us, loading, colorScheme, theme]);

  if (loading || !us) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '600px' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">ZIP Code Density Map</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Geographic distribution of health data with size and color encoding
      </p>
      <div ref={mapRef} className="flex justify-center" />
      <p className="text-sm text-muted-foreground mt-4">
        Each dot represents a ZIP code area. Dot size and color both encode obesity rates,
        with larger and redder dots indicating higher rates.
      </p>
    </div>
  );
};

export default ZipMap;
