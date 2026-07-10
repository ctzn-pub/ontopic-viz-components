'use client';

interface RankingItem {
  rank: number;
  label: string;
  value: number;
  change?: number; // Change in rank from previous period
  flag?: string; // Country code for flag
  highlight?: boolean;
}

interface RankingChartProps {
  title: string;
  subtitle?: string;
  items: RankingItem[];
  valueLabel?: string;
  source?: string;
  formatValue?: (val: number) => string;
  showBars?: boolean;
}

export function RankingChart({
  title,
  subtitle,
  items,
  valueLabel,
  source,
  formatValue = (val) => val.toFixed(2),
  showBars = true,
}: RankingChartProps) {
  const maxValue = Math.max(...items.map((i) => i.value));

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

      {/* Table Header */}
      <div className="grid grid-cols-[40px_1fr_auto_60px] gap-2 pb-2 border-b border-zinc-300 dark:border-zinc-600 text-xs font-semibold text-zinc-500">
        <div>Rank</div>
        <div>Country</div>
        <div className="text-right">{valueLabel || 'Value'}</div>
        <div className="text-center">Change</div>
      </div>

      {/* Rankings */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {items.map((item) => (
          <div
            key={item.rank}
            className={`grid grid-cols-[40px_1fr_auto_60px] gap-2 py-3 items-center ${
              item.highlight ? 'bg-blue-50 dark:bg-blue-900/20 -mx-2 px-2 rounded' : ''
            }`}
          >
            {/* Rank */}
            <div
              className={`text-lg font-bold ${
                item.rank <= 3
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400'
              }`}
            >
              {item.rank}
            </div>

            {/* Country with optional bar */}
            <div className="flex items-center gap-3">
              {item.flag && (
                <img
                  src={`https://hatscripts.github.io/circle-flags/flags/${item.flag.toLowerCase()}.svg`}
                  alt={item.label}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {item.label}
                </div>
                {showBars && (
                  <div className="mt-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Value */}
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 text-right">
              {formatValue(item.value)}
            </div>

            {/* Change indicator */}
            <div className="text-center">
              {item.change !== undefined && item.change !== 0 && (
                <span
                  className={`inline-flex items-center text-xs font-medium ${
                    item.change > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {item.change > 0 ? '↑' : '↓'} {Math.abs(item.change)}
                </span>
              )}
              {item.change === 0 && (
                <span className="text-xs text-zinc-400">—</span>
              )}
            </div>
          </div>
        ))}
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

export default RankingChart;
