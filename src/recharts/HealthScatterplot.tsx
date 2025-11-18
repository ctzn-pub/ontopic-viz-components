'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthDataPoint {
  OBESITY_AdjPrev: number;
  DIABETES_AdjPrev: number;
  population: number;
  dir2020?: string;
}

interface HealthScatterplotProps {
  data: HealthDataPoint[];
}

const HealthScatterplot: React.FC<HealthScatterplotProps> = ({ data }) => {
  const singleRef = useRef<HTMLDivElement>(null);
  const regressionRef = useRef<HTMLDivElement>(null);
  const facetRef = useRef<HTMLDivElement>(null);

  // Filter data to remove undefined dir2020 values for cleaner visualization
  const cleanData = useMemo(() => data.filter(d => d.dir2020 !== undefined), [data]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear existing plots
    if (singleRef.current) singleRef.current.innerHTML = '';
    if (regressionRef.current) regressionRef.current.innerHTML = '';
    if (facetRef.current) facetRef.current.innerHTML = '';

    // Basic scatterplot
    const singlePlot = Plot.plot({
      title: "County Health Correlations",
      subtitle: "Obesity vs Diabetes prevalence by county",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      marks: [
        Plot.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: d => Math.sqrt(d.population) * 0.008,
          fill: d => d.dir2020,
          fillOpacity: 0.6,
          stroke: "black",
          strokeWidth: 0.5,
          title: d => `Obesity: ${d.OBESITY_AdjPrev}%\nDiabetes: ${d.DIABETES_AdjPrev}%\nPopulation: ${d.population?.toLocaleString()}`
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 700,
      height: 500
    });

    // Regression scatterplot
    const regressionPlot = Plot.plot({
      title: "County Health Correlations with Trend",
      subtitle: "Including linear regression line",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      marks: [
        Plot.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: d => Math.sqrt(d.population) * 0.008,
          fill: d => d.dir2020,
          fillOpacity: 0.7,
          stroke: "black",
          strokeWidth: 0.5,
          title: d => `Obesity: ${d.OBESITY_AdjPrev}%\nDiabetes: ${d.DIABETES_AdjPrev}%\nPopulation: ${d.population?.toLocaleString()}`
        }),
        Plot.linearRegressionY(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          strokeWidth: 2,
          stroke: "#ff6b35"
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 700,
      height: 500
    });

    // Faceted scatterplot
    const facetPlot = Plot.plot({
      title: "County Health Correlations by Category",
      subtitle: "Faceted by demographic grouping",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      facet: { data: cleanData, x: "dir2020" },
      marks: [
        Plot.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: d => Math.sqrt(d.population) * 0.01,
          stroke: "dir2020",
          fill: "dir2020",
          fillOpacity: 0.3,
          title: d => `Obesity: ${d.OBESITY_AdjPrev}%\nDiabetes: ${d.DIABETES_AdjPrev}%\nPopulation: ${d.population?.toLocaleString()}`,
          tip: true
        }),
        Plot.linearRegressionY(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          stroke: "dir2020",
          strokeWidth: 2
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 800,
      height: 600
    });

    // Append plots to containers
    if (singleRef.current) singleRef.current.appendChild(singlePlot);
    if (regressionRef.current) regressionRef.current.appendChild(regressionPlot);
    if (facetRef.current) facetRef.current.appendChild(facetPlot);

    // Cleanup
    return () => {
      singlePlot?.remove();
      regressionPlot?.remove();
      facetPlot?.remove();
    };
  }, [data, cleanData]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Scatterplot analysis exploring relationships between county-level health indicators.
          Each visualization reveals different aspects of the obesity-diabetes correlation using various analytical approaches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Scatterplot</CardTitle>
          <p className="text-sm text-muted-foreground">
            Simple scatter plot showing the relationship between obesity and diabetes rates
          </p>
        </CardHeader>
        <CardContent>
          <div ref={singleRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            Each point represents a county. Point size reflects population, and color indicates demographic grouping.
            The clear clustering pattern suggests a strong positive relationship between these health metrics.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regression Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Same data with linear regression line showing the overall trend
          </p>
        </CardHeader>
        <CardContent>
          <div ref={regressionRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            The orange regression line shows the positive correlation between obesity and diabetes rates across counties.
            The linear trend confirms the strong association between these health conditions at the population level.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faceted Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Separate panels for each demographic category with individual regression lines
          </p>
        </CardHeader>
        <CardContent>
          <div ref={facetRef} className="flex justify-center" />
          <p className="text-sm text-gray-600 mt-4">
            Faceted view allows comparison of obesity-diabetes relationships across different demographic groups,
            each with its own regression line. This reveals how the correlation strength may vary by population characteristics.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Scatterplot Techniques</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Basic Scatter</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Point-to-point relationships</li>
              <li>Size and color encoding</li>
              <li>Pattern identification</li>
              <li>Outlier detection</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Regression Lines</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Trend quantification</li>
              <li>Predictive modeling</li>
              <li>Correlation strength</li>
              <li>Statistical inference</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Faceted Views</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Group comparisons</li>
              <li>Conditional relationships</li>
              <li>Subpopulation analysis</li>
              <li>Interaction effects</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScatterplot;