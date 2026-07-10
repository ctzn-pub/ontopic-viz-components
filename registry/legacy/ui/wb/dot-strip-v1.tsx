'use client';

import { useMemo } from 'react';

interface DataPoint {
  code: string;
  label: string;
  value: number;
}

interface FocalCountry {
  code: string;
  color: string;
}

interface DotStripProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  focalCountries: FocalCountry[];
  unit?: string;
  source?: string;
  min?: number;
  max?: number;
}

export function DotStrip({
  title,
  subtitle,
  data,
  focalCountries,
  unit,
  source,
  min,
  max,
}: DotStripProps) {
  const { minVal, maxVal, sortedData, focalData } = useMemo(() => {
    const values = data.map((d) => d.value);
    const computedMin = min ?? Math.min(...values);
    const computedMax = max ?? Math.max(...values);

    // Sort data by value for positioning
    const sorted = [...data].sort((a, b) => a.value - b.value);

    // Extract focal countries
    const focalCodes = new Set(focalCountries.map((f) => f.code));
    const focal = data.filter((d) => focalCodes.has(d.code));

    return {
      minVal: computedMin,
      maxVal: computedMax,
      sortedData: sorted,
      focalData: focal,
    };
  }, [data, focalCountries, min, max]);

  const scale = (val: number) =>
    ((val - minVal) / (maxVal - minVal)) * 100;

  const focalColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    focalCountries.forEach((f) => {
      map[f.code] = f.color;
    });
    return map;
  }, [focalCountries]);

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(2);
  };

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
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
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

      {/* Dot Strip Chart */}
      <div className="relative h-32">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Distribution area */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-16">
          {/* All dots (non-focal) */}
          {sortedData.map((d) => {
            const isFocal = d.code in focalColorMap;
            if (isFocal) return null;

            const pos = scale(d.value);
            return (
              <div
                key={d.code}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${pos}%` }}
                title={`${d.label}: ${formatValue(d.value)}${unit ? ` ${unit}` : ''}`}
              >
                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-500 opacity-60" />
              </div>
            );
          })}

          {/* Focal country dots with labels */}
          {focalData.map((d) => {
            const pos = scale(d.value);
            const color = focalColorMap[d.code];

            return (
              <div
                key={d.code}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${pos}%` }}
              >
                {/* Dot */}
                <div
                  className="w-4 h-4 rounded-full shadow-md"
                  style={{ backgroundColor: color }}
                />
                {/* Label line and text */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex flex-col items-center">
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded">
                    {d.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatValue(d.value)}{unit ? ` ${unit}` : ''}
                  </span>
                  <div
                    className="w-px h-3 mt-0.5"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Axis labels */}
      <div className="flex justify-between mt-4 text-xs text-muted-foreground">
        <span>{formatValue(minVal)}{unit ? ` ${unit}` : ''}</span>
        <span>{formatValue(maxVal)}{unit ? ` ${unit}` : ''}</span>
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

export default DotStrip;
