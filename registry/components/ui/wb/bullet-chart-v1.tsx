'use client';

interface BulletChartProps {
  title: string;
  subtitle?: string;
  items: {
    label: string;
    value: number;
    target?: number;
    ranges?: [number, number, number]; // [poor, satisfactory, good]
    max: number;
  }[];
  source?: string;
  formatValue?: (val: number) => string;
}

export function BulletChart({
  title,
  subtitle,
  items,
  source,
  formatValue = (val) => val.toFixed(1),
}: BulletChartProps) {
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

      {/* Bullets */}
      <div className="space-y-6">
        {items.map((item) => {
          const ranges = item.ranges || [item.max * 0.3, item.max * 0.6, item.max];
          const valuePercent = (item.value / item.max) * 100;
          const targetPercent = item.target ? (item.target / item.max) * 100 : null;

          return (
            <div key={item.label}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatValue(item.value)}
                </span>
              </div>
              <div className="relative h-6">
                {/* Range backgrounds */}
                <div className="absolute inset-0 flex">
                  <div
                    className="bg-zinc-300 dark:bg-zinc-700"
                    style={{ width: `${(ranges[0] / item.max) * 100}%` }}
                  />
                  <div
                    className="bg-zinc-200 dark:bg-zinc-600"
                    style={{ width: `${((ranges[1] - ranges[0]) / item.max) * 100}%` }}
                  />
                  <div
                    className="bg-zinc-100 dark:bg-zinc-500"
                    style={{ width: `${((ranges[2] - ranges[1]) / item.max) * 100}%` }}
                  />
                </div>
                {/* Value bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 bg-zinc-800 dark:bg-zinc-200 rounded-sm"
                  style={{ width: `${valuePercent}%` }}
                />
                {/* Target marker */}
                {targetPercent && (
                  <div
                    className="absolute top-0 w-0.5 h-full bg-red-500"
                    style={{ left: `${targetPercent}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-zinc-800 dark:bg-zinc-200 rounded-sm" />
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-3 bg-red-500" />
          <span>Target</span>
        </div>
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

export default BulletChart;
