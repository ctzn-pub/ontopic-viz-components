'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

interface ChartConfig {
  title: string;
  unit?: string;
  data: DataPoint[];
}

interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  charts: ChartConfig[];
  colors?: {
    default: string;
    highlight: string;
  };
  source?: string;
  columns?: 2 | 3 | 4;
}

export function HorizontalBarChart({
  title,
  subtitle,
  charts,
  colors = { default: '#6baed6', highlight: '#08519c' },
  source,
  columns = 2,
}: HorizontalBarChartProps) {
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

      {/* Charts Grid */}
      <div className={`grid gap-8 ${gridCols[columns]}`}>
        {charts.map((chart) => (
          <SingleBarChart
            key={chart.title}
            title={chart.title}
            unit={chart.unit}
            data={chart.data}
            colors={colors}
          />
        ))}
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

interface SingleBarChartProps {
  title: string;
  unit?: string;
  data: DataPoint[];
  colors: { default: string; highlight: string };
}

function SingleBarChart({ title, unit, data, colors }: SingleBarChartProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value)) * 1.15;
  }, [data]);

  const formatValue = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(2);
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
        {title}{unit ? ` (${unit})` : ''}
      </h4>
      <div style={{ height: data.length * 36 + 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 60, bottom: 0, left: 50 }}
          >
            <XAxis
              type="number"
              domain={[0, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#71717a' }}
              tickFormatter={formatValue}
            />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#52525b' }}
              width={45}
            />
            <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.highlight ? colors.highlight : colors.default}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(val: number) => formatValue(Number(val))}
                style={{ fontSize: 11, fill: '#52525b', fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default HorizontalBarChart;
