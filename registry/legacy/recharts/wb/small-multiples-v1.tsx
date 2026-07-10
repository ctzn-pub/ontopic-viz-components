'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface DataPoint {
  year: number;
  [key: string]: number;
}

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
}

interface ChartConfig {
  title: string;
  data: DataPoint[];
}

interface SmallMultiplesChartProps {
  title: string;
  subtitle?: string;
  charts: ChartConfig[];
  series: SeriesConfig[];
  source?: string;
  columns?: 2 | 3 | 4;
}

export function SmallMultiplesChart({
  title,
  subtitle,
  charts,
  series,
  source,
  columns = 4,
}: SmallMultiplesChartProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
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
      <div className="flex gap-6 mb-6">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-sm text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className={`grid gap-6 ${gridCols[columns]}`}>
        {charts.map((chart) => (
          <SingleChart
            key={chart.title}
            title={chart.title}
            data={chart.data}
            series={series}
          />
        ))}
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

interface SingleChartProps {
  title: string;
  data: DataPoint[];
  series: SeriesConfig[];
}

function SingleChart({ title, data, series }: SingleChartProps) {
  const { minY, maxY, lastPoints } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    const last: { [key: string]: { year: number; value: number } } = {};

    data.forEach((d) => {
      series.forEach((s) => {
        const val = d[s.key];
        if (val !== undefined && val !== null) {
          min = Math.min(min, val);
          max = Math.max(max, val);
          last[s.key] = { year: d.year, value: val };
        }
      });
    });

    // Add padding
    const padding = (max - min) * 0.1;
    return {
      minY: Math.max(0, min - padding),
      maxY: max + padding,
      lastPoints: last,
    };
  }, [data, series]);

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3">
        {title}
      </h4>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
              tickFormatter={(year) => year.toString()}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minY, maxY]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
              width={40}
              tickFormatter={(val) => {
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val.toFixed(0);
              }}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
            {/* End dots */}
            {series.map((s) => {
              const point = lastPoints[s.key];
              if (!point) return null;
              return (
                <ReferenceDot
                  key={`dot-${s.key}`}
                  x={point.year}
                  y={point.value}
                  r={5}
                  fill={s.color}
                  stroke="none"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SmallMultiplesChart;
