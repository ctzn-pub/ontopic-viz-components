'use client';

import { useMemo } from 'react';

interface DataPoint {
  label: string;
  value: number;
  category?: string;
  highlight?: boolean;
}

interface DotPlotProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  min?: number;
  max?: number;
  source?: string;
  formatValue?: (val: number) => string;
  showLabels?: boolean;
  categoryColors?: { [key: string]: string };
}

export function DotPlot({
  title,
  subtitle,
  data,
  min,
  max,
  source,
  formatValue = (val) => val.toFixed(1),
  showLabels = true,
  categoryColors,
}: DotPlotProps) {
  const { minVal, maxVal } = useMemo(() => {
    const values = data.map((d) => d.value);
    return {
      minVal: min ?? Math.min(...values) * 0.9,
      maxVal: max ?? Math.max(...values) * 1.1,
    };
  }, [data, min, max]);

  const scale = (val: number) =>
    ((val - minVal) / (maxVal - minVal)) * 100;

  const defaultColor = '#2171b5';

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

      {/* Category Legend */}
      {categoryColors && (
        <div className="flex gap-4 mb-4">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {cat}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dot Plot */}
      <div className="space-y-3">
        {data.map((d, i) => {
          const color = d.category && categoryColors
            ? categoryColors[d.category]
            : defaultColor;
          const pos = scale(d.value);

          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 text-right">
                <span
                  className={`text-sm ${
                    d.highlight
                      ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
              <div className="flex-1 relative h-6">
                {/* Axis line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-300 dark:bg-zinc-600" />
                {/* Dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all"
                  style={{ left: `${pos}%` }}
                >
                  <div
                    className={`rounded-full ${d.highlight ? 'w-4 h-4' : 'w-3 h-3'}`}
                    style={{ backgroundColor: color }}
                  />
                </div>
                {/* Value label */}
                {showLabels && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 translate-x-3 text-xs text-zinc-500"
                    style={{ left: `${pos}%` }}
                  >
                    {formatValue(d.value)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis labels */}
      <div className="flex justify-between mt-2 ml-28 text-xs text-zinc-500">
        <span>{formatValue(minVal)}</span>
        <span>{formatValue(maxVal)}</span>
      </div>

      {/* Source */}
      {source && (
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          Source: {source}
        </p>
      )}
    </div>
  );
}

export default DotPlot;
