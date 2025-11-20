'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";
import { mean, median } from 'd3-array';

export interface HistogramObservableProps {
  data: number[];
  width?: number;
  height?: number;
  xlabel?: string;
  ylabel?: string;
  title?: string;
  bins?: number;
  showMean?: boolean;
  showMedian?: boolean;
}

export default function HistogramObservable({
  data,
  width = 800,
  height = 500,
  xlabel = 'Value',
  ylabel = 'Frequency',
  title,
  bins = 20,
  showMean = true,
  showMedian = false
}: HistogramObservableProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data.length || !chartRef.current) return;

    const meanValue = mean(data);
    const medianValue = median(data);

    const marks: any[] = [
      // Histogram
      Plot.rectY(data, Plot.binX({ y: "count" }, {
        x: d => d,
        thresholds: bins,
        fill: "hsl(var(--primary))",
        fillOpacity: 0.6,
        stroke: "hsl(var(--foreground))",
        strokeWidth: 1
      }))
    ];

    // Add mean line
    if (showMean && meanValue !== undefined) {
      marks.push(
        Plot.ruleX([meanValue], {
          stroke: "hsl(var(--destructive))",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),
        Plot.text([{ x: meanValue, y: 0 }], {
          x: "x",
          y: "y",
          text: () => [`Mean: ${meanValue.toFixed(2)}`],
          dy: -10,
          fill: "hsl(var(--destructive))",
          fontSize: 12
        })
      );
    }

    // Add median line
    if (showMedian && medianValue !== undefined) {
      marks.push(
        Plot.ruleX([medianValue], {
          stroke: "hsl(var(--chart-2))",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      );
    }

    const plot = Plot.plot({
      width,
      height,
      marginLeft: 60,
      marginBottom: 60,
      x: { label: xlabel },
      y: { label: ylabel, grid: true },
      marks
    });

    chartRef.current.innerHTML = '';
    chartRef.current.appendChild(plot);

    return () => plot.remove();
  }, [data, width, height, xlabel, ylabel, bins, showMean, showMedian]);

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div ref={chartRef} />
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Total observations: {data.length} • Bins: {bins}</p>
      </div>
    </div>
  );
}
