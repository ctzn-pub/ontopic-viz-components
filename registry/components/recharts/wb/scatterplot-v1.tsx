'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
} from 'recharts';

interface DataPoint {
  code: string;
  label: string;
  x: number;
  y: number;
}

interface FocalCountry {
  code: string;
  color: string;
}

interface ScatterPlotProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  focalCountries: FocalCountry[];
  xLabel?: string;
  yLabel?: string;
  xUnit?: string;
  yUnit?: string;
  source?: string;
  showTrendLine?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScatterPlot({
  title,
  subtitle,
  data,
  focalCountries,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  source,
  showTrendLine = false,
  size = 'md',
}: ScatterPlotProps) {
  const focalColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    focalCountries.forEach((f) => {
      map[f.code] = f.color;
    });
    return map;
  }, [focalCountries]);

  const { xDomain, yDomain, trendLine } = useMemo(() => {
    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xPadding = (xMax - xMin) * 0.1;
    const yPadding = (yMax - yMin) * 0.1;

    // Calculate simple linear regression for trend line
    let trend = null;
    if (showTrendLine && data.length > 2) {
      const n = data.length;
      const sumX = data.reduce((s, d) => s + d.x, 0);
      const sumY = data.reduce((s, d) => s + d.y, 0);
      const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
      const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      trend = {
        slope,
        intercept,
        startX: xMin - xPadding,
        endX: xMax + xPadding,
      };
    }

    return {
      xDomain: [xMin - xPadding, xMax + xPadding],
      yDomain: [yMin - yPadding, yMax + yPadding],
      trendLine: trend,
    };
  }, [data, showTrendLine]);

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(2);
  };

  const heights = {
    sm: 250,
    md: 350,
    lg: 450,
  };

  const defaultColor = '#94a3b8';

  return (
    <div className="my-8 p-6 rounded-lg bg-card/50 dark:bg-card/30 border border-border/50">
      {/* Header */}
      <div className="mb-6">
        <div className="w-12 h-1 bg-primary mb-4" />
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-400" />
          <span className="text-xs text-muted-foreground">Other countries</span>
        </div>
        {focalCountries.map((f) => {
          const country = data.find((d) => d.code === f.code);
          return (
            <div key={f.code} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: f.color }}
              />
              <span className="text-xs font-medium text-foreground">
                {country?.label || f.code}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ height: heights[size] }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 60, bottom: 40, left: 60 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-zinc-200 dark:stroke-zinc-700"
            />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={{ stroke: '#d4d4d8' }}
              tickLine={{ stroke: '#d4d4d8' }}
            >
              {xLabel && (
                <Label
                  value={`${xLabel}${xUnit ? ` (${xUnit})` : ''}`}
                  position="bottom"
                  offset={20}
                  style={{ fontSize: 12, fill: '#71717a' }}
                />
              )}
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              domain={yDomain}
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={{ stroke: '#d4d4d8' }}
              tickLine={{ stroke: '#d4d4d8' }}
            >
              {yLabel && (
                <Label
                  value={`${yLabel}${yUnit ? ` (${yUnit})` : ''}`}
                  angle={-90}
                  position="left"
                  offset={40}
                  style={{ fontSize: 12, fill: '#71717a', textAnchor: 'middle' }}
                />
              )}
            </YAxis>

            {/* Trend line */}
            {trendLine && (
              <ReferenceLine
                segment={[
                  { x: trendLine.startX, y: trendLine.intercept + trendLine.slope * trendLine.startX },
                  { x: trendLine.endX, y: trendLine.intercept + trendLine.slope * trendLine.endX },
                ]}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            )}

            {/* Main scatter - non-focal points */}
            <Scatter data={data} fill={defaultColor}>
              {data.map((entry, index) => {
                const isFocal = entry.code in focalColorMap;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isFocal ? focalColorMap[entry.code] : defaultColor}
                    opacity={isFocal ? 1 : 0.5}
                    r={isFocal ? 8 : 4}
                  />
                );
              })}
            </Scatter>

            {/* Focal country labels */}
            {data
              .filter((d) => d.code in focalColorMap)
              .map((d) => {
                return (
                  <g key={`label-${d.code}`}>
                    {/* This is handled via CSS positioning below */}
                  </g>
                );
              })}
          </ScatterChart>
        </ResponsiveContainer>

        {/* Overlay labels for focal countries */}
        <div className="relative" style={{ marginTop: -heights[size] + 20, height: heights[size] - 60, pointerEvents: 'none' }}>
          {data
            .filter((d) => d.code in focalColorMap)
            .map((d) => {
              const xPos = ((d.x - xDomain[0]) / (xDomain[1] - xDomain[0])) * 100;
              const yPos = ((yDomain[1] - d.y) / (yDomain[1] - yDomain[0])) * 100;

              return (
                <div
                  key={`overlay-${d.code}`}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left: `calc(60px + ${xPos}% * (100% - 120px) / 100)`,
                    top: `calc(${yPos}% - 20px)`,
                  }}
                >
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{
                      backgroundColor: focalColorMap[d.code],
                      color: 'white',
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Source */}
      {source && (
        <p className="mt-6 text-xs text-muted-foreground/70">
          Source: {source}
        </p>
      )}
    </div>
  );
}

export default ScatterPlot;
