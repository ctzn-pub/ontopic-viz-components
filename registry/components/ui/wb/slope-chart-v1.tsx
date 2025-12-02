'use client';

import { useMemo } from 'react';

interface DataPoint {
  name: string;
  startValue: number;
  endValue: number;
  color?: string;
  highlight?: boolean;
}

interface SlopeChartProps {
  title: string;
  subtitle?: string;
  startLabel: string;
  endLabel: string;
  data: DataPoint[];
  source?: string;
  formatValue?: (val: number) => string;
}

export function SlopeChart({
  title,
  subtitle,
  startLabel,
  endLabel,
  data,
  source,
  formatValue = (val) => val.toFixed(1),
}: SlopeChartProps) {
  const { scale } = useMemo(() => {
    const allVals = data.flatMap((d) => [d.startValue, d.endValue]);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const padding = (max - min) * 0.1;
    return {
      minVal: min - padding,
      maxVal: max + padding,
      scale: (val: number) => ((val - (min - padding)) / (max - min + 2 * padding)) * 100,
    };
  }, [data]);

  const defaultColors = ['#2171b5', '#6baed6', '#bdd7e7', '#eff3ff'];

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

      {/* Chart */}
      <div className="relative">
        {/* Labels */}
        <div className="flex justify-between mb-2 px-16">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {startLabel}
          </span>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {endLabel}
          </span>
        </div>

        {/* Slope lines */}
        <svg className="w-full" style={{ height: data.length * 40 + 40 }}>
          {data.map((d, i) => {
            const startY = 100 - scale(d.startValue);
            const endY = 100 - scale(d.endValue);
            const yOffset = 20 + i * 40;
            const color = d.color || defaultColors[i % defaultColors.length];
            const strokeWidth = d.highlight ? 3 : 2;
            const opacity = d.highlight ? 1 : 0.7;

            return (
              <g key={d.name}>
                {/* Line */}
                <line
                  x1="60"
                  y1={yOffset + (startY / 100) * 30}
                  x2="calc(100% - 60px)"
                  y2={yOffset + (endY / 100) * 30}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                />
                {/* Start dot */}
                <circle
                  cx="60"
                  cy={yOffset + (startY / 100) * 30}
                  r={d.highlight ? 5 : 4}
                  fill={color}
                />
                {/* End dot */}
                <circle
                  cx="calc(100% - 60px)"
                  cy={yOffset + (endY / 100) * 30}
                  r={d.highlight ? 5 : 4}
                  fill={color}
                />
                {/* Start label */}
                <text
                  x="55"
                  y={yOffset + (startY / 100) * 30 + 4}
                  textAnchor="end"
                  className="text-xs fill-zinc-600 dark:fill-zinc-400"
                >
                  {formatValue(d.startValue)}
                </text>
                {/* End label */}
                <text
                  x="calc(100% - 55px)"
                  y={yOffset + (endY / 100) * 30 + 4}
                  textAnchor="start"
                  className="text-xs fill-zinc-600 dark:fill-zinc-400"
                >
                  {formatValue(d.endValue)}
                </text>
                {/* Name label */}
                <text
                  x="calc(100% - 50px)"
                  y={yOffset + (endY / 100) * 30 + 4}
                  textAnchor="start"
                  className="text-xs font-medium fill-zinc-700 dark:fill-zinc-300"
                  dx="35"
                >
                  {d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Source */}
      {source && (
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          Source: {source}
        </p>
      )}
    </div>
  );
}

export default SlopeChart;
