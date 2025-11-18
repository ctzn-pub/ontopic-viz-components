'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LineChartProps {
  data?: any[];
}

const LineChart: React.FC<LineChartProps> = ({ data = [] }) => {
  const basicRef = useRef<HTMLDivElement>(null);
  const errorBarsRef = useRef<HTMLDivElement>(null);

  // Embed the marijuana trend data directly for now
  const marijuanaData = [
    { year: 1975, value: 33.766, ci_lower: 29.2359, ci_upper: 38.296, demo_level_title: "Rarely" },
    { year: 1980, value: 39.9999, ci_lower: 33.8308, ci_upper: 46.169, demo_level_title: "Rarely" },
    { year: 1990, value: 28.1103, ci_lower: 21.4728, ci_upper: 34.7478, demo_level_title: "Rarely" },
    { year: 1998, value: 44.4119, ci_lower: 40.0516, ci_upper: 48.7722, demo_level_title: "Rarely" },
    { year: 2008, value: 51.5992, ci_lower: 46.3518, ci_upper: 56.8467, demo_level_title: "Rarely" },
    { year: 2014, value: 68.025, ci_lower: 64.1351, ci_upper: 71.915, demo_level_title: "Rarely" },
    { year: 2018, value: 75.4005, ci_lower: 71.0312, ci_upper: 79.7699, demo_level_title: "Rarely" },
    { year: 2022, value: 82.1393, ci_lower: 78.1238, ci_upper: 86.1548, demo_level_title: "Rarely" },

    { year: 1975, value: 27.8498, ci_lower: 23.4259, ci_upper: 32.2738, demo_level_title: "Sometimes" },
    { year: 1980, value: 26.5497, ci_lower: 21.1635, ci_upper: 31.9359, demo_level_title: "Sometimes" },
    { year: 1990, value: 12.051, ci_lower: 7.6668, ci_upper: 16.4351, demo_level_title: "Sometimes" },
    { year: 1998, value: 25.4621, ci_lower: 20.8151, ci_upper: 30.1091, demo_level_title: "Sometimes" },
    { year: 2008, value: 33.1419, ci_lower: 28.3581, ci_upper: 37.9257, demo_level_title: "Sometimes" },
    { year: 2014, value: 56.069, ci_lower: 50.063, ci_upper: 62.075, demo_level_title: "Sometimes" },
    { year: 2018, value: 63.5873, ci_lower: 57.5489, ci_upper: 69.6256, demo_level_title: "Sometimes" },
    { year: 2022, value: 73.1045, ci_lower: 66.0019, ci_upper: 80.2071, demo_level_title: "Sometimes" },

    { year: 1975, value: 9.4417, ci_lower: 6.5779, ci_upper: 12.3055, demo_level_title: "Weekly" },
    { year: 1980, value: 14.9472, ci_lower: 10.4098, ci_upper: 19.4845, demo_level_title: "Weekly" },
    { year: 1990, value: 11.088, ci_lower: 5.5125, ci_upper: 16.6635, demo_level_title: "Weekly" },
    { year: 1998, value: 11.4878, ci_lower: 8.6407, ci_upper: 14.335, demo_level_title: "Weekly" },
    { year: 2008, value: 24.4865, ci_lower: 19.6032, ci_upper: 29.3699, demo_level_title: "Weekly" },
    { year: 2014, value: 34.5205, ci_lower: 30.212, ci_upper: 38.829, demo_level_title: "Weekly" },
    { year: 2018, value: 41.1593, ci_lower: 34.6969, ci_upper: 47.6217, demo_level_title: "Weekly" },
    { year: 2022, value: 44.1575, ci_lower: 33.6355, ci_upper: 54.6796, demo_level_title: "Weekly" }
  ];

  const metadata = {
    title: "Trends in Opinion on Marijuana Legalization, by Church Attendance",
    subtitle: "% of US Population Who Support Marijuana Legalization, by Year and Church Attendance",
    source: { name: "General Social Survey, United States, 1972 - 2022; 38312 Observations" },
    domain: ["Rarely", "Sometimes", "Weekly"]
  };

  // Custom colors matching the original design
  const customColors = [
    "#525252", // Dark Grey for Rarely
    "#D3D3D3", // Light Grey for Sometimes
    "#6A0DAD"  // Deep Purple for Weekly
  ];

  useEffect(() => {
    if (!marijuanaData || marijuanaData.length === 0) return;

    // Clear existing plots
    if (basicRef.current) basicRef.current.innerHTML = '';
    if (errorBarsRef.current) errorBarsRef.current.innerHTML = '';

    console.log('Rendering charts with data:', marijuanaData.length, 'points');

    try {
      // Basic line chart without error bars
      const basicPlot = Plot.plot({
        title: "Marijuana Legalization Support by Church Attendance",
        subtitle: "Trends from 1975-2022 (clean view)",
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif",
        },
        x: {
          label: "Year",
          domain: [1975, 2022],
          tickFormat: ".0f",
          grid: true
        },
        y: {
          label: "% Supporting Marijuana Legalization",
          grid: true,
          domain: [0, 90]
        },
        color: {
          legend: true,
          domain: metadata.domain,
          range: customColors
        },
        marks: [
          Plot.lineY(marijuanaData, {
            x: "year",
            y: "value",
            stroke: "demo_level_title",
            strokeWidth: 2.5,
            tip: true
          }),
          Plot.dot(marijuanaData, {
            x: "year",
            y: "value",
            fill: "demo_level_title",
            stroke: "white",
            strokeWidth: 1.5,
            r: 3,
            tip: true
          })
        ],
        width: 700,
        height: 400,
        marginLeft: 80
      });

      // Line chart with error bars
      const errorBarsPlot = Plot.plot({
        title: metadata.title,
        subtitle: metadata.subtitle,
        caption: `Source: ${metadata.source.name}`,
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif",
        },
        x: {
          label: "Year",
          domain: [1975, 2022],
          tickFormat: ".0f",
          grid: true
        },
        y: {
          label: "% Supporting Marijuana Legalization",
          grid: true,
          domain: [0, 90]
        },
        color: {
          legend: true,
          domain: metadata.domain,
          range: customColors
        },
        marks: [
          // Confidence interval error bars (vertical lines at each data point)
          Plot.ruleX(marijuanaData, {
            x: "year",
            y1: "ci_lower",
            y2: "ci_upper",
            stroke: "demo_level_title",
            strokeWidth: 1.5,
            strokeOpacity: 0.7
          }),
          // Main trend lines
          Plot.lineY(marijuanaData, {
            x: "year",
            y: "value",
            stroke: "demo_level_title",
            strokeWidth: 2.5,
            tip: true
          }),
          // Data points
          Plot.dot(marijuanaData, {
            x: "year",
            y: "value",
            fill: "demo_level_title",
            stroke: "white",
            strokeWidth: 1.5,
            r: 3.5,
            tip: true
          })
        ],
        width: 800,
        height: 350,
        marginLeft: 80
      });

      // Append plots
      if (basicRef.current) {
        basicRef.current.appendChild(basicPlot);
        console.log('Basic plot appended');
      }
      if (errorBarsRef.current) {
        errorBarsRef.current.appendChild(errorBarsPlot);
        console.log('Error bars plot appended');
      }

      // Cleanup function
      return () => {
        basicPlot?.remove();
        errorBarsPlot?.remove();
      };
    } catch (error) {
      console.error('Error rendering plots:', error);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Analysis of public opinion on marijuana legalization from the General Social Survey (1975-2022).
          Shows how attitudes vary by church attendance frequency, with confidence intervals showing statistical uncertainty.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Trend Lines</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clean line chart showing support trends by church attendance frequency
          </p>
        </CardHeader>
        <CardContent>
          <div ref={basicRef} className="flex justify-center" style={{ minHeight: '400px' }} />
          <p className="text-sm text-gray-600 mt-4">
            This simplified view shows the clear trend patterns: those who rarely attend church show the highest and fastest-growing support,
            while those who attend weekly show the lowest but steadily increasing support over time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trends with Error Bars</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete analysis including confidence intervals showing statistical uncertainty
          </p>
        </CardHeader>
        <CardContent>
          <div ref={errorBarsRef} className="flex justify-center" style={{ minHeight: '400px' }} />
          <p className="text-sm text-gray-600 mt-4">
            The error bars show 95% confidence intervals around each estimate. Larger error bars indicate greater statistical uncertainty,
            often due to smaller sample sizes. This matches the original Observable Framework visualization design.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Key Findings</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Rarely Attend Church</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Highest support levels (82% by 2022)</li>
              <li>Steady upward trend since 1990s</li>
              <li>Largest absolute increase over time</li>
              <li>Generally narrower confidence intervals</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Sometimes Attend</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Moderate support levels (73% by 2022)</li>
              <li>Similar upward trajectory</li>
              <li>More volatile in earlier years</li>
              <li>Intermediate between other groups</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Weekly Church Attendance</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Lowest support but growing (44% by 2022)</li>
              <li>Accelerated growth since 2000s</li>
              <li>Largest relative percentage increase</li>
              <li>Shows cultural shift even among religious</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChart;