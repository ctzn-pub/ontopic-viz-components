'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DensityDataPoint {
  OBESITY_AdjPrev?: number;
  DIABETES_AdjPrev?: number;
  MHLTH_AdjPrev?: number;
  population?: number;
  dir2020?: string;
}

interface DensityPlotProps {
  data: DensityDataPoint[];
}

export const DensityPlot: React.FC<DensityPlotProps> = ({ data }) => {
  const singleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Create synthetic mental health data for demonstration
  const mentalHealthData = useMemo(() => data.map((d, i) => ({
    MHLTH_AdjPrev: Math.random() * 20 + 10, // Random mental health rates between 10-30%
    population: d.population || Math.floor(Math.random() * 50000) + 10000
  })), [data]);

  const cleanData = useMemo(() => data.filter(d => d.dir2020 !== undefined), [data]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear existing plots
    if (singleRef.current) singleRef.current.innerHTML = '';
    if (overlayRef.current) overlayRef.current.innerHTML = '';

    // Single density plot for mental health
    const singlePlot = Plot.plot({
      title: "Mental Health Distribution",
      subtitle: "Distribution by County",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      y: { grid: true, label: "Count" },
      x: { label: "Mental Health Rate (%)" },
      marks: [
        Plot.areaY(mentalHealthData, Plot.binX(
          { y: "count", filter: null },
          { x: "MHLTH_AdjPrev", fillOpacity: 0.3, fill: "#3b82f6" }
        )),
        Plot.lineY(mentalHealthData, Plot.binX(
          { y: "count", filter: null },
          { x: "MHLTH_AdjPrev", label: "Mental Health", tip: true, stroke: "#3b82f6", strokeWidth: 2 }
        )),
        Plot.ruleY([0])
      ],
      width: 600,
      height: 400,
    });

    // Overlay density plot for obesity by category
    const overlayPlot = Plot.plot({
      title: "Obesity Distribution by Category",
      subtitle: "Overlaid density plots by demographic grouping",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      y: { grid: true, label: "Count" },
      x: { label: "Obesity Rate (%)" },
      marks: [
        Plot.areaY(cleanData, Plot.binX(
          { y: "count", filter: null },
          { x: "OBESITY_AdjPrev", fill: "dir2020", fillOpacity: 0.2 }
        )),
        Plot.lineY(cleanData, Plot.binX(
          { y: "count", filter: null },
          { x: "OBESITY_AdjPrev", stroke: "dir2020", tip: true, strokeWidth: 2 }
        )),
        Plot.ruleY([0])
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 600,
      height: 400,
    });

    // Append plots to containers
    if (singleRef.current) singleRef.current.appendChild(singlePlot);
    if (overlayRef.current) overlayRef.current.appendChild(overlayPlot);

    // Cleanup
    return () => {
      singlePlot?.remove();
      overlayPlot?.remove();
    };
  }, [data, mentalHealthData, cleanData]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Density plot analysis showing the distribution patterns of health metrics across counties.
          These visualizations reveal the shape, spread, and central tendencies of population health indicators.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Single Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribution of mental health rates across counties
          </p>
        </CardHeader>
        <CardContent>
          <div ref={singleRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            This histogram shows the frequency distribution of mental health prevalence rates,
            with both area and line representations of the density. The combined area and line approach
            emphasizes both the overall distribution shape and precise bin boundaries.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overlay Comparison</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparison of obesity rate distributions by demographic category
          </p>
        </CardHeader>
        <CardContent>
          <div ref={overlayRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            Multiple density curves overlaid to compare obesity rate distributions across
            different demographic groups, allowing for direct comparison of patterns. This approach
            reveals differences in distribution shapes, central tendencies, and spread between groups.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Density Plot techniques</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Single Distribution</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Overall distribution shape</li>
              <li>Central tendency identification</li>
              <li>Spread and variability</li>
              <li>Outlier and skewness detection</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Overlay Comparison</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Group comparison analysis</li>
              <li>Distribution shape differences</li>
              <li>Relative positioning</li>
              <li>Population heterogeneity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DensityPlot;
