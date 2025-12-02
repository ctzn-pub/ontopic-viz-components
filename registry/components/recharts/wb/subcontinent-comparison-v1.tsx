'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface SubcontinentComparisonProps {
  title: string;
  subtitle?: string;
  metrics: Array<{
    name: string;
    india: number;
    pakistan: number;
    bangladesh: number;
    china: number;
    unit?: string;
    higherIsBetter?: boolean;
    /** How to aggregate: 'sum' for totals (GDP, population), 'weightedAvg' for indices/rates */
    aggregation?: 'sum' | 'weightedAvg';
  }>;
  source?: string;
}

const COLORS = {
  india: '#FF9933', // Saffron
  pakistan: '#01411C', // Pakistan green
  bangladesh: '#006A4E', // Bangladesh green
  subcontinent: '#8B5CF6', // Purple for combined
  china: '#DE2910', // China red
};

const FLAG_LABELS: Record<string, string> = {
  india: 'IN',
  pakistan: 'PK',
  bangladesh: 'BD',
  subcontinent: 'SA',
  china: 'CN',
};

export function SubcontinentComparison({
  title,
  subtitle,
  metrics,
  source,
}: SubcontinentComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState(0);
  const [showCombined, setShowCombined] = useState(true);

  const currentMetric = metrics[selectedMetric];

  // Population weights for weighted averages (approximate 2023 populations)
  const POP_INDIA = 1438000000;
  const POP_PAKISTAN = 247500000;
  const POP_BANGLADESH = 171500000;
  const POP_TOTAL = POP_INDIA + POP_PAKISTAN + POP_BANGLADESH;

  const chartData = useMemo(() => {
    let combined: number;

    if (currentMetric.aggregation === 'weightedAvg') {
      // Population-weighted average for indices, rates, per-capita metrics
      combined = (
        currentMetric.india * POP_INDIA +
        currentMetric.pakistan * POP_PAKISTAN +
        currentMetric.bangladesh * POP_BANGLADESH
      ) / POP_TOTAL;
    } else {
      // Sum for absolute values (GDP, population, emissions)
      combined = currentMetric.india + currentMetric.pakistan + currentMetric.bangladesh;
    }

    const data = [
      {
        name: 'India',
        value: currentMetric.india,
        color: COLORS.india,
        flag: FLAG_LABELS.india,
      },
      {
        name: 'Pakistan',
        value: currentMetric.pakistan,
        color: COLORS.pakistan,
        flag: FLAG_LABELS.pakistan,
      },
      {
        name: 'Bangladesh',
        value: currentMetric.bangladesh,
        color: COLORS.bangladesh,
        flag: FLAG_LABELS.bangladesh,
      },
    ];

    if (showCombined) {
      data.push({
        name: currentMetric.aggregation === 'weightedAvg' ? 'Subcontinent (avg)' : 'Subcontinent',
        value: combined,
        color: COLORS.subcontinent,
        flag: FLAG_LABELS.subcontinent,
      });
    }

    data.push({
      name: 'China',
      value: currentMetric.china,
      color: COLORS.china,
      flag: FLAG_LABELS.china,
    });

    return data;
  }, [currentMetric, showCombined]);

  const maxValue = Math.max(...chartData.map(d => d.value));

  const formatValue = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(value < 10 ? 2 : 0);
  };

  return (
    <div className="my-8 rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Metric selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {metrics.map((metric, idx) => (
          <button
            key={metric.name}
            onClick={() => setSelectedMetric(idx)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedMetric === idx
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {metric.name}
          </button>
        ))}
      </div>

      {/* Toggle for combined view */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setShowCombined(!showCombined)}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            showCombined
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <span className="text-base">SA</span>
          {showCombined ? 'Showing Combined Subcontinent' : 'Show Combined'}
        </button>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMetric}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 80, left: 100, bottom: 10 }}
            >
              <XAxis
                type="number"
                domain={[0, maxValue * 1.1]}
                tickFormatter={formatValue}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={95}
                tickFormatter={(value, index) => {
                  const item = chartData[index];
                  return item ? `${item.flag} ${value}` : value;
                }}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${formatValue(value)}${currentMetric.unit ? ` ${currentMetric.unit}` : ''}`,
                  currentMetric.name,
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value: number) =>
                    `${formatValue(value as number)}${currentMetric.unit ? ` ${currentMetric.unit}` : ''}`
                  }
                  style={{
                    fill: 'hsl(var(--foreground))',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      {/* Insight card */}
      {showCombined && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">*</span>
            <div>
              <p className="font-medium text-violet-900 dark:text-violet-100">
                {currentMetric.aggregation === 'weightedAvg'
                  ? 'Population-Weighted Average vs China'
                  : 'Combined Subcontinent vs China'}
              </p>
              <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">
                {(() => {
                  let combined: number;
                  if (currentMetric.aggregation === 'weightedAvg') {
                    combined = (
                      currentMetric.india * POP_INDIA +
                      currentMetric.pakistan * POP_PAKISTAN +
                      currentMetric.bangladesh * POP_BANGLADESH
                    ) / POP_TOTAL;
                    const diff = ((currentMetric.china - combined) / combined * 100);
                    if (diff > 0) {
                      return `China's ${currentMetric.name.toLowerCase()} (${formatValue(currentMetric.china)}) is ${diff.toFixed(0)}% higher than the subcontinent's weighted average (${formatValue(combined)}).`;
                    } else {
                      return `The subcontinent's weighted average (${formatValue(combined)}) is ${Math.abs(diff).toFixed(0)}% higher than China (${formatValue(currentMetric.china)}).`;
                    }
                  } else {
                    combined = currentMetric.india + currentMetric.pakistan + currentMetric.bangladesh;
                    const ratio = combined / currentMetric.china;
                    if (ratio > 1) {
                      return `The combined subcontinent (${formatValue(combined)}) is ${ratio.toFixed(1)}x larger than China (${formatValue(currentMetric.china)}).`;
                    } else {
                      return `China (${formatValue(currentMetric.china)}) is ${(1 / ratio).toFixed(1)}x larger than the combined subcontinent (${formatValue(combined)}).`;
                    }
                  }
                })()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {source && (
        <p className="mt-4 text-xs text-muted-foreground">Source: {source}</p>
      )}
    </div>
  );
}

export default SubcontinentComparison;
