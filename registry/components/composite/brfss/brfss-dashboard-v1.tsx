'use client';

import React, { useState, useMemo } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  GraduationCap,
  DollarSign,
  Palette,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVizTheme } from '@/viz/theme/provider';

interface DemographicValue {
  value: number;
  state_count?: number;
}

interface DemographicCategory {
  levels: string[];
  values: Record<string, DemographicValue>;
}

export interface BrfssData {
  clean_title: string;
  topic?: string;
  question?: string;
  response?: string;
  data_value_type?: string;
  data_value_unit?: string;
  year?: number;
  overall?: number;
  by_demographic: Record<string, DemographicCategory>;
}

// Icon per demographic axis. Colors are NOT stored here — they resolve from
// the active theme's categorical cycle by tab position at render time.
const categoryIcons: Record<string, LucideIcon> = {
  'Age Group': Users,
  'Education Attained': GraduationCap,
  'Household Income': DollarSign,
  'Race/Ethnicity': Palette,
};

function getCategoryIcon(category: string): LucideIcon {
  return categoryIcons[category] || Users;
}

interface ChartDataPoint {
  name: string;
  value: number;
  state_count?: number;
}

interface BrfssTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartDataPoint }>;
}

const ChartComponent = ({
  chartType,
  data,
  ylabel,
}: {
  chartType: string;
  data: ChartDataPoint[];
  ylabel: string;
}) => {
  const { rc, colorFor } = useVizTheme();
  // Single series, no semantic domain -> categorical[0]: the theme's ink.
  const seriesColor = colorFor(null, ylabel, 0);

  const XAxisProps = {
    dataKey: 'name',
    interval: 0,
    tick: {
      ...rc.axisTick,
      textAnchor: 'end' as const,
      dy: 10,
    },
    height: 80,
    padding: { left: 30, right: 30 },
    axisLine: { stroke: rc.grid.stroke },
    tickLine: { stroke: rc.grid.stroke },
  };

  const YAxisProps = {
    label: {
      value: ylabel,
      angle: -90,
      position: 'insideLeft' as const,
      offset: 0,
      style: { textAnchor: 'middle', fill: rc.muted, fontFamily: rc.fontBody },
    },
    tick: rc.axisTick,
    axisLine: { stroke: rc.grid.stroke },
    tickLine: { stroke: rc.grid.stroke },
  };

  const TooltipContent = ({ active, payload }: BrfssTooltipProps) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    return (
      <div
        className="p-2 rounded text-sm shadow-lg"
        style={{
          background: rc.tooltip.background,
          border: rc.tooltip.border,
          color: rc.tooltip.color,
          fontFamily: rc.fontBody,
        }}
      >
        <p className="font-medium">{point.name}</p>
        <p>{`Value: ${Number(point.value).toFixed(1)}%`}</p>
        {point.state_count && (
          <p className="text-xs" style={{ color: rc.muted }}>{`States: ${point.state_count}`}</p>
        )}
      </div>
    );
  };

  const grid = (
    <CartesianGrid
      stroke={rc.grid.stroke}
      strokeDasharray={rc.grid.strokeDasharray}
      vertical={rc.grid.vertical}
      horizontal={!rc.grid.hide}
    />
  );

  switch (chartType) {
    case 'dot':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
            {grid}
            <XAxis {...XAxisProps} type="category" allowDuplicatedCategory={false} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<TooltipContent />} />
            <Scatter
              data={data}
              dataKey="value"
              fill={seriesColor}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
            {grid}
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<TooltipContent />} />
            <Line
              dataKey="value"
              stroke={seriesColor}
              strokeWidth={rc.stroke}
              isAnimationActive={false}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
            {grid}
            <XAxis {...XAxisProps} />
            <YAxis {...YAxisProps} />
            <Tooltip content={<TooltipContent />} />
            <Bar dataKey="value" fill={seriesColor} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      );
    default:
      return null;
  }
};

export default function BrfssDashboard({ data }: { data: BrfssData }) {
  const { theme, rc, colorFor } = useVizTheme();
  const [chartType, setChartType] = useState('dot');

  const demographicCategories = useMemo(() => {
    if (!data?.by_demographic) return [];

    return Object.entries(data.by_demographic).map(([key, category], index) => {
      const chartData: ChartDataPoint[] = category.levels.map((level) => ({
        name: level,
        value: category.values[level]?.value ?? 0,
        state_count: category.values[level]?.state_count,
      }));

      return {
        key,
        icon: getCategoryIcon(key),
        // Tab-position color from the theme's categorical cycle — stable per
        // theme, no hardcoded per-category hues.
        color: colorFor(null, key, index),
        data: chartData,
      };
    });
  }, [data, colorFor]);

  const toggleChartType = () => {
    const types = ['dot', 'line', 'bar'];
    const currentIndex = types.indexOf(chartType);
    setChartType(types[(currentIndex + 1) % types.length]);
  };

  if (!demographicCategories.length) {
    return <div style={{ color: rc.muted }}>No demographic data available.</div>;
  }

  const ylabel = `${data.data_value_type || 'Prevalence'} (${data.data_value_unit || '%'})`;

  return (
    // Card chrome inline from the theme (no shadcn Card dependency): the
    // dashboard frame is part of this composite's design and must follow the
    // active theme's surface/border in every consumer app.
    <div
      className="p-4 w-full rounded-lg"
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        fontFamily: theme.fontBody,
      }}
    >
      <div className="p-2">
        <div className="mb-4">
          <h2 className="text-xl font-bold" style={rc.titleStyle}>{data.clean_title}</h2>
          {data.question && (
            <p className="text-sm mt-1" style={rc.subtitleStyle}>{data.question}</p>
          )}
          {data.overall !== undefined && (
            <p className="text-sm" style={rc.subtitleStyle}>
              Overall:{' '}
              <span className="font-medium" style={{ color: rc.fg }}>
                {Number(data.overall).toFixed(1)}%
              </span>
              {data.year && ` (${data.year})`}
            </p>
          )}
        </div>

        <Tabs defaultValue={demographicCategories[0]?.key} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {demographicCategories.map((category) => (
              <TabsTrigger key={category.key} value={category.key} className="text-xs">
                <category.icon size={12} className="mr-1" style={{ color: category.color }} />
                {category.key}
              </TabsTrigger>
            ))}
          </TabsList>

          {demographicCategories.map((category) => (
            <TabsContent key={category.key} value={category.key}>
              <div className="w-full">
                <div className="mb-4">
                  <Button onClick={toggleChartType} variant="outline" size="sm">
                    Switch to{' '}
                    {chartType === 'dot' ? 'Line' : chartType === 'line' ? 'Bar' : 'Dot'} Chart
                  </Button>
                </div>
                <ChartComponent chartType={chartType} data={category.data} ylabel={ylabel} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <div className="flex flex-col items-start text-sm p-2 pt-4" style={rc.sourceStyle}>
        <p>Data source: CDC Behavioral Risk Factor Surveillance System</p>
        {data.response && (
          <p>
            Note: {chartType === 'bar' ? 'Bars' : 'Points'} represent {data.response.toLowerCase()}.
          </p>
        )}
      </div>
    </div>
  );
}
