'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDataUrl } from '@/lib/config';

interface DataPoint {
  latitude: number;
  longitude: number;
  [key: string]: any; // Allow additional properties
}

interface GeoDensityMapProps {
  data: DataPoint[];
  valueKey?: string; // Optional key for color encoding
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  colorScheme?: string;
  legendLabel?: string;
}

const GeoDensityMap: React.FC<GeoDensityMapProps> = ({
  data,
  valueKey,
  width = 960,
  height = 600,
  title = "Geographic Density Map",
  description,
  colorScheme = "puor",
  legendLabel = "Density"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [us, setUs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch topology data
  useEffect(() => {
    fetch(getDataUrl('geo/us-albers-counties-10m.json'))
      .then(response => response.json())
      .then(topology => {
        setUs(topology);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !us || loading) return;
    if (!mapRef.current) return;

    // Clear existing plot
    mapRef.current.innerHTML = '';

    // Create topology features
    const statemesh = topojson.mesh(us as any, (us as any).objects.states, (a: any, b: any) => a !== b);
    const nation = topojson.feature(us as any, (us as any).objects.nation);
    const countiesmesh = topojson.mesh(us as any, (us as any).objects.counties);

    // Create the density map
    const mapPlot = Plot.plot({
      width,
      height,
      projection: "albers",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      color: {
        scheme: colorScheme,
        type: "quantile",
        n: 4,
        reverse: true,
        label: legendLabel,
        legend: true,
      },
      marks: [
        Plot.geo(countiesmesh, { strokeOpacity: 0.5 }),
        Plot.geo(nation),
        Plot.geo(statemesh, { strokeOpacity: 0.2 }),
        Plot.density(data, {
          x: "longitude",
          y: "latitude",
          bandwidth: 10,
          fill: "density"
        })
      ]
    });

    // Append plot to container
    mapRef.current.appendChild(mapPlot);

    // Cleanup
    return () => {
      mapPlot?.remove();
    };
  }, [data, width, height, us, loading, colorScheme, legendLabel]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center" style={{ minHeight: `${height}px` }}>
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="flex justify-center" />
        <p className="text-sm text-gray-600 mt-4">
          Density map showing geographic concentration across locations.
          Darker areas indicate higher concentration of data points.
          State and county boundaries are overlaid for geographic reference.
        </p>
      </CardContent>
    </Card>
  );
};

export default GeoDensityMap;
