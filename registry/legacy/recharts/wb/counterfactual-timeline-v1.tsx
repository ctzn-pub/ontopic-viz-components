'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineDataPoint {
  year: number;
  india: number;
  pakistan: number;
  bangladesh: number;
  china: number;
}

interface CounterfactualTimelineProps {
  title: string;
  subtitle?: string;
  data: TimelineDataPoint[];
  unit?: string;
  source?: string;
  yAxisLabel?: string;
  animationDuration?: number;
  /** How to aggregate: 'sum' for totals (GDP, population), 'weightedAvg' for indices/rates */
  aggregation?: 'sum' | 'weightedAvg';
}

const COLORS = {
  india: '#FF9933',
  pakistan: '#01411C',
  bangladesh: '#006A4E',
  subcontinent: '#8B5CF6',
  china: '#DE2910',
};

// Population weights (approximate, can vary by year but using 2023 as reference)
const POP_INDIA = 1438000000;
const POP_PAKISTAN = 247500000;
const POP_BANGLADESH = 171500000;
const POP_TOTAL = POP_INDIA + POP_PAKISTAN + POP_BANGLADESH;

export function CounterfactualTimeline({
  title,
  subtitle,
  data,
  unit = '',
  source,
  yAxisLabel,
  animationDuration = 3000,
  aggregation = 'sum',
}: CounterfactualTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYearIndex, setCurrentYearIndex] = useState(data.length - 1);
  const [showSubcontinent, setShowSubcontinent] = useState(true);

  // Calculate combined subcontinent values based on aggregation type
  const enrichedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      subcontinent: aggregation === 'weightedAvg'
        ? (d.india * POP_INDIA + d.pakistan * POP_PAKISTAN + d.bangladesh * POP_BANGLADESH) / POP_TOTAL
        : d.india + d.pakistan + d.bangladesh,
    }));
  }, [data, aggregation]);

  // Animation effect
  useEffect(() => {
    if (!isPlaying) return;

    if (currentYearIndex >= data.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentYearIndex((prev) => prev + 1);
    }, animationDuration / data.length);

    return () => clearTimeout(timer);
  }, [isPlaying, currentYearIndex, data.length, animationDuration]);

  const visibleData = enrichedData.slice(0, currentYearIndex + 1);
  const currentData = enrichedData[currentYearIndex];

  const formatValue = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const handlePlayPause = () => {
    if (currentYearIndex >= data.length - 1) {
      setCurrentYearIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const maxValue = Math.max(
    ...enrichedData.map((d) =>
      Math.max(d.subcontinent, d.china, d.india, d.pakistan, d.bangladesh)
    )
  );

  return (
    <div className="my-8 rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
        >
          {isPlaying ? (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {currentYearIndex >= data.length - 1 ? 'Replay' : 'Play'}
            </>
          )}
        </button>

        <button
          onClick={() => setShowSubcontinent(!showSubcontinent)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            showSubcontinent
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Combined View
        </button>

        {/* Year slider */}
        <div className="flex flex-1 items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {data[0].year}
          </span>
          <input
            type="range"
            min={0}
            max={data.length - 1}
            value={currentYearIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentYearIndex(parseInt(e.target.value));
            }}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-muted"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {data[data.length - 1].year}
          </span>
        </div>
      </div>

      {/* Current year display */}
      <motion.div
        key={currentYearIndex}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-4 flex items-center justify-center"
      >
        <span className="rounded-full bg-primary/10 px-6 py-2 text-3xl font-bold text-primary">
          {currentData.year}
        </span>
      </motion.div>

      {/* Chart */}
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis
              dataKey="year"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              domain={[0, maxValue * 1.1]}
              tickFormatter={formatValue}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))' },
                    }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                `${formatValue(value)}${unit ? ` ${unit}` : ''}`,
                name === 'subcontinent' ? 'Subcontinent' : name.charAt(0).toUpperCase() + name.slice(1),
              ]}
              labelFormatter={(year) => `Year: ${year}`}
            />

            {/* Area fill for subcontinent */}
            {showSubcontinent && (
              <Area
                type="monotone"
                dataKey="subcontinent"
                fill={COLORS.subcontinent}
                fillOpacity={0.1}
                stroke="none"
              />
            )}

            {/* Individual country lines */}
            <Line
              type="monotone"
              dataKey="india"
              stroke={COLORS.india}
              strokeWidth={2}
              dot={false}
              strokeOpacity={showSubcontinent ? 0.4 : 1}
            />
            <Line
              type="monotone"
              dataKey="pakistan"
              stroke={COLORS.pakistan}
              strokeWidth={2}
              dot={false}
              strokeOpacity={showSubcontinent ? 0.4 : 1}
            />
            <Line
              type="monotone"
              dataKey="bangladesh"
              stroke={COLORS.bangladesh}
              strokeWidth={2}
              dot={false}
              strokeOpacity={showSubcontinent ? 0.4 : 1}
            />

            {/* Combined subcontinent line */}
            {showSubcontinent && (
              <Line
                type="monotone"
                dataKey="subcontinent"
                stroke={COLORS.subcontinent}
                strokeWidth={3}
                dot={false}
                strokeDasharray="5 5"
              />
            )}

            {/* China line */}
            <Line
              type="monotone"
              dataKey="china"
              stroke={COLORS.china}
              strokeWidth={3}
              dot={false}
            />

            {/* Reference line for current year */}
            <ReferenceLine
              x={currentData.year}
              stroke="hsl(var(--foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          flag="IN"
          label="India"
          value={formatValue(currentData.india)}
          color={COLORS.india}
        />
        <StatCard
          flag="PK"
          label="Pakistan"
          value={formatValue(currentData.pakistan)}
          color={COLORS.pakistan}
        />
        <StatCard
          flag="BD"
          label="Bangladesh"
          value={formatValue(currentData.bangladesh)}
          color={COLORS.bangladesh}
        />
        {showSubcontinent && (
          <StatCard
            flag="SA"
            label="Subcontinent"
            value={formatValue(currentData.subcontinent)}
            color={COLORS.subcontinent}
            highlight
          />
        )}
        <StatCard
          flag="CN"
          label="China"
          value={formatValue(currentData.china)}
          color={COLORS.china}
        />
      </div>

      {/* Comparison insight */}
      {showSubcontinent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-lg bg-gradient-to-r from-violet-50 to-red-50 p-4 dark:from-violet-900/20 dark:to-red-900/20"
        >
          <p className="text-center text-sm font-medium text-foreground">
            {currentData.subcontinent > currentData.china ? (
              <>
                In {currentData.year}, the combined subcontinent ({formatValue(currentData.subcontinent)})
                was{' '}
                <span className="font-bold text-violet-600">
                  {((currentData.subcontinent / currentData.china - 1) * 100).toFixed(0)}% larger
                </span>{' '}
                than China ({formatValue(currentData.china)})
              </>
            ) : (
              <>
                In {currentData.year}, China ({formatValue(currentData.china)}) was{' '}
                <span className="font-bold text-red-600">
                  {((currentData.china / currentData.subcontinent - 1) * 100).toFixed(0)}% larger
                </span>{' '}
                than the combined subcontinent ({formatValue(currentData.subcontinent)})
              </>
            )}
          </p>
        </motion.div>
      )}

      {source && (
        <p className="mt-4 text-xs text-muted-foreground">Source: {source}</p>
      )}
    </div>
  );
}

function StatCard({
  flag,
  label,
  value,
  color,
  highlight = false,
}: {
  flag: string;
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-lg p-3 ${
        highlight
          ? 'bg-violet-100 dark:bg-violet-900/30'
          : 'bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-mono">{flag}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p
        className="mt-1 text-lg font-bold"
        style={{ color: highlight ? undefined : color }}
      >
        {value}
      </p>
    </motion.div>
  );
}

export default CounterfactualTimeline;
