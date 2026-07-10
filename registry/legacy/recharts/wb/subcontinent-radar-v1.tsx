'use client';

import { useMemo, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

interface RadarMetric {
  metric: string;
  fullName: string;
  india: number;
  pakistan: number;
  bangladesh: number;
  china: number;
  /** Normalized to 0-100 scale */
  normalizedIndia?: number;
  normalizedPakistan?: number;
  normalizedBangladesh?: number;
  normalizedChina?: number;
  normalizedSubcontinent?: number;
}

interface SubcontinentRadarProps {
  title: string;
  subtitle?: string;
  metrics: RadarMetric[];
  source?: string;
}

const COLORS = {
  india: '#FF9933',
  pakistan: '#01411C',
  bangladesh: '#006A4E',
  subcontinent: '#8B5CF6',
  china: '#DE2910',
};

export function SubcontinentRadar({
  title,
  subtitle,
  metrics,
  source,
}: SubcontinentRadarProps) {
  const [showIndividual, setShowIndividual] = useState(false);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // Normalize values to 0-100 scale for radar chart
  const normalizedData = useMemo(() => {
    return metrics.map((m) => {
      const allValues = [m.india, m.pakistan, m.bangladesh, m.china];
      const max = Math.max(...allValues);
      const min = Math.min(...allValues);
      const range = max - min || 1;

      // Calculate weighted average for subcontinent (by approximate population ratio)
      // India: ~74%, Pakistan: ~12%, Bangladesh: ~9%
      const subcontinentAvg = m.india * 0.74 + m.pakistan * 0.13 + m.bangladesh * 0.13;

      const normalize = (v: number) => ((v - min) / range) * 80 + 10; // Scale to 10-90

      return {
        ...m,
        normalizedIndia: normalize(m.india),
        normalizedPakistan: normalize(m.pakistan),
        normalizedBangladesh: normalize(m.bangladesh),
        normalizedChina: normalize(m.china),
        normalizedSubcontinent: normalize(subcontinentAvg),
      };
    });
  }, [metrics]);

  const hoveredData = hoveredMetric
    ? metrics.find((m) => m.metric === hoveredMetric)
    : null;

  return (
    <div className="my-8 rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowIndividual(false)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            !showIndividual
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          SA Subcontinent vs CN China
        </button>
        <button
          onClick={() => setShowIndividual(true)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            showIndividual
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Countries
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        {/* Radar Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={normalizedData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              {/* @ts-expect-error Recharts types issue with React 19 */}
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />

              {showIndividual ? (
                <>
                  <Radar
                    name="IN India"
                    dataKey="normalizedIndia"
                    stroke={COLORS.india}
                    fill={COLORS.india}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="PK Pakistan"
                    dataKey="normalizedPakistan"
                    stroke={COLORS.pakistan}
                    fill={COLORS.pakistan}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar
                    name="BD Bangladesh"
                    dataKey="normalizedBangladesh"
                    stroke={COLORS.bangladesh}
                    fill={COLORS.bangladesh}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar
                    name="CN China"
                    dataKey="normalizedChina"
                    stroke={COLORS.china}
                    fill={COLORS.china}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </>
              ) : (
                <>
                  <Radar
                    name="SA Subcontinent (weighted avg)"
                    dataKey="normalizedSubcontinent"
                    stroke={COLORS.subcontinent}
                    fill={COLORS.subcontinent}
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                  <Radar
                    name="CN China"
                    dataKey="normalizedChina"
                    stroke={COLORS.china}
                    fill={COLORS.china}
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                </>
              )}

              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Metric details panel */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            {hoveredMetric ? 'Selected Metric' : 'Hover over a metric'}
          </h4>

          {hoveredData ? (
            <motion.div
              key={hoveredMetric}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border bg-muted/30 p-4"
            >
              <h5 className="font-semibold text-foreground">
                {hoveredData.fullName}
              </h5>
              <div className="mt-3 space-y-2">
                <MetricRow
                  flag="IN"
                  label="India"
                  value={hoveredData.india}
                  color={COLORS.india}
                />
                <MetricRow
                  flag="PK"
                  label="Pakistan"
                  value={hoveredData.pakistan}
                  color={COLORS.pakistan}
                />
                <MetricRow
                  flag="BD"
                  label="Bangladesh"
                  value={hoveredData.bangladesh}
                  color={COLORS.bangladesh}
                />
                <div className="my-2 border-t border-border" />
                <MetricRow
                  flag="SA"
                  label="Subcontinent (avg)"
                  value={
                    hoveredData.india * 0.74 +
                    hoveredData.pakistan * 0.13 +
                    hoveredData.bangladesh * 0.13
                  }
                  color={COLORS.subcontinent}
                  highlight
                />
                <MetricRow
                  flag="CN"
                  label="China"
                  value={hoveredData.china}
                  color={COLORS.china}
                />
              </div>
            </motion.div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Hover over the chart to see details
              </p>
            </div>
          )}

          {/* Quick insights */}
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              * The radar shows normalized values (10-90 scale) to make
              different metrics comparable. Larger area = better overall performance.
            </p>
          </div>
        </div>
      </div>

      {source && (
        <p className="mt-4 text-xs text-muted-foreground">Source: {source}</p>
      )}
    </div>
  );
}

function MetricRow({
  flag,
  label,
  value,
  color,
  highlight = false,
}: {
  flag: string;
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  const formatValue = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    if (v < 1) return v.toFixed(3);
    if (v < 10) return v.toFixed(2);
    return v.toFixed(1);
  };

  return (
    <div
      className={`flex items-center justify-between rounded px-2 py-1 ${
        highlight ? 'bg-violet-100 dark:bg-violet-900/30' : ''
      }`}
    >
      <span className="flex items-center gap-2 text-sm">
        <span className="font-mono">{flag}</span>
        <span className={highlight ? 'font-medium' : ''}>{label}</span>
      </span>
      <span className="font-mono text-sm font-medium" style={{ color }}>
        {formatValue(value)}
      </span>
    </div>
  );
}

export default SubcontinentRadar;
