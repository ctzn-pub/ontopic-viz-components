'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataUrl } from '@/lib/config';

interface ZipDataPoint {
  obesity_rate: number;
  latitude: number;
  longitude: number;
}

interface ZipMapProps {
  data: ZipDataPoint[];
}

const ZipMap: React.FC<ZipMapProps> = ({ data }) => {
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

    if (mapRef.current) mapRef.current.innerHTML = '';

    // Create the density map
    const statemesh = topojson.mesh(us as any, (us as any).objects.states, (a: any, b: any) => a !== b);
    const nation = topojson.feature(us as any, (us as any).objects.nation);

    const countiesmesh = topojson.mesh(us as any, (us as any).objects.counties);

    const mapPlot = Plot.plot({
      width: 960,
      height: 600,
      projection: "albers",
      color: {
        scheme: "puor",
        type: "quantile",
        n: 4,
        reverse: true,
        label: "Obesity (%)",
        legend: true,
        tickFormat: d => `${d.toFixed(1)}%`
      },
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
  }, [data, us, loading]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex justify-center items-center" style={{ minHeight: '600px' }}>
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ZIP Code Density Map</CardTitle>
          <p className="text-sm text-muted-foreground">
            Geographic distribution of health data with size and color encoding
          </p>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            Each dot represents a ZIP code area. Dot size and color both encode obesity rates,
            with larger and redder dots indicating higher rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZipMap;