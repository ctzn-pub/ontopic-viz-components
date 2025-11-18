'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { createHistogram } from '@/lib/statistical-utils';

export interface HistogramProps {
  data: number[];
  bins?: number;
  width?: number;
  height?: number;
  xlabel?: string;
  ylabel?: string;
  title?: string;
  color?: string;
  showMean?: boolean;
  showMedian?: boolean;
}

export default function HistogramRecharts({
  data,
  bins,
  width,
  height = 500,
  xlabel = 'Value',
  ylabel = 'Frequency',
  title,
  color = 'hsl(var(--primary))',
  showMean = true,
  showMedian = false
}: HistogramProps) {
  const histogramData = useMemo(() => {
    return createHistogram(data, bins);
  }, [data, bins]);

  const statistics = useMemo(() => {
    if (data.length === 0) return { mean: 0, median: 0 };

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return { mean, median };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.bin}</p>
          <p className="text-sm">Count: {data.count}</p>
          <p className="text-xs text-muted-foreground">
            Range: [{data.binStart.toFixed(2)}, {data.binEnd.toFixed(2)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width={width || '100%'} height={height}>
        <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="bin"
            label={{ value: xlabel, position: 'insideBottom', offset: -10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis label={{ value: ylabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="count" fill={color} name="Frequency" />

          {showMean && (
            <ReferenceLine
              x={histogramData.find(d =>
                d.binStart <= statistics.mean && d.binEnd > statistics.mean
              )?.bin}
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: `Mean: ${statistics.mean.toFixed(2)}`, position: 'top', fill: 'hsl(var(--destructive))' }}
            />
          )}

          {showMedian && (
            <ReferenceLine
              x={histogramData.find(d =>
                d.binStart <= statistics.median && d.binEnd > statistics.median
              )?.bin}
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: `Median: ${statistics.median.toFixed(2)}`, position: 'bottom', fill: 'hsl(var(--chart-2))' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Total observations: {data.length} • Bins: {histogramData.length} • Mean: {statistics.mean.toFixed(2)} • Median: {statistics.median.toFixed(2)}</p>
      </div>
    </div>
  );
}
