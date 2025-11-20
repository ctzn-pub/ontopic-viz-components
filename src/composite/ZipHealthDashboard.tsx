'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getDataUrl } from '@/lib/config';

interface ZipDataPoint {
  obesity_rate: number;
  latitude: number;
  longitude: number;
}

interface ZipHealthDashboardProps {
  data: ZipDataPoint[];
  width?: number;
  height?: number;
}

const ZipHealthDashboard: React.FC<ZipHealthDashboardProps> = ({
  data,
  width = 800,
  height = 400
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const distributionRef = useRef<HTMLDivElement>(null);
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

    // Clear existing plots
    if (mapRef.current) mapRef.current.innerHTML = '';
    if (distributionRef.current) distributionRef.current.innerHTML = '';

    // Create the density map
    const statemesh = topojson.mesh(us as any, (us as any).objects.states, (a: any, b: any) => a !== b);
    const nation = topojson.feature(us as any, (us as any).objects.nation);
    const countiesmesh = topojson.mesh(us as any, (us as any).objects.counties);

    const mapPlot = Plot.plot({
      width: 960,
      height: 600,
      projection: "albers",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
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
        Plot.density(data, {
          x: "longitude",
          y: "latitude",
          bandwidth: 10,
          fill: "density"
        })
      ]
    });

    // Create the distribution plot
    const distributionPlot = Plot.plot({
      title: "Obesity Rate Distribution",
      subtitle: "Obesity Rate by Zipcode",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      y: { grid: true },
      x: { label: "Obesity Rate (%)" },
      marks: [
        Plot.areaY(data, Plot.binX(
          { y: "count", filter: null },
          { x: "obesity_rate", fillOpacity: 0.2 }
        )),
        Plot.lineY(data, Plot.binX(
          { y: "count", filter: null },
          { x: "obesity_rate", label: "Obesity", tip: true }
        )),
        Plot.ruleY([0]),
        Plot.ruleX([35], { stroke: "red", strokeDasharray: "3,3" })
      ],
      width: 600,
      height: 400,
    });

    // Append plots to containers
    if (mapRef.current) mapRef.current.appendChild(mapPlot);
    if (distributionRef.current) distributionRef.current.appendChild(distributionPlot);

    // Cleanup
    return () => {
      mapPlot?.remove();
      distributionPlot?.remove();
    };
  }, [data, width, height, us, loading]);

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
          <CardTitle>Geographic Distribution - Density Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            Density map showing geographic concentration of obesity rates across ZIP codes.
            Darker areas indicate higher concentration of data points.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistical Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={distributionRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            Histogram showing the distribution of obesity rates. The red dashed line indicates
            the national average threshold of 35%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZipHealthDashboard;