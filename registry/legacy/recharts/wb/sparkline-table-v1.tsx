'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineData {
  year: number;
  value: number;
}

interface TableRow {
  label: string;
  values: (string | number)[];
  sparkline?: SparklineData[];
  trend?: 'up' | 'down' | 'flat';
  highlight?: boolean;
}

interface SparklineTableProps {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: TableRow[];
  source?: string;
  sparklineColor?: string;
}

export function SparklineTable({
  title,
  subtitle,
  headers,
  rows,
  source,
  sparklineColor = '#2171b5',
}: SparklineTableProps) {
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-zinc-300 dark:border-zinc-600">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={`py-2 px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 ${
                    i === 0 ? 'text-left' : 'text-right'
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-zinc-200 dark:border-zinc-700 ${
                  row.highlight ? 'bg-zinc-100/50 dark:bg-zinc-800/50' : ''
                }`}
              >
                <td className="py-3 px-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {row.label}
                </td>
                {row.values.map((val, i) => (
                  <td
                    key={i}
                    className="py-3 px-3 text-sm text-right text-zinc-600 dark:text-zinc-400"
                  >
                    {val}
                  </td>
                ))}
                {row.sparkline && (
                  <td className="py-2 px-3">
                    <Sparkline data={row.sparkline} color={sparklineColor} />
                  </td>
                )}
                {row.trend && (
                  <td className="py-3 px-3 text-right">
                    <TrendIndicator trend={row.trend} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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

function Sparkline({ data, color }: { data: SparklineData[]; color: string }) {
  return (
    <div className="w-20 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const colors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    flat: 'text-zinc-400',
  };

  const arrows = {
    up: '↑',
    down: '↓',
    flat: '→',
  };

  return (
    <span className={`text-sm font-bold ${colors[trend]}`}>
      {arrows[trend]}
    </span>
  );
}

export default SparklineTable;
