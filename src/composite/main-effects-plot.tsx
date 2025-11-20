import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  ResponsiveContainer,
} from 'recharts';

interface MainEffectDataPoint {
  category: string;
  estimate: number;
  conf_low: number;
  conf_high: number;
  std_error: number;
  p_value: number;
  statistic: number;
}

interface MainEffectsData {
  main_effects: Record<string, MainEffectDataPoint[]>;
}

interface MainEffectsPlotProps {
  data: MainEffectsData;
  displayAsPercentage?: boolean;
}

const MainEffectsPlot: React.FC<MainEffectsPlotProps> = ({ data, displayAsPercentage = false }) => {
  const categories = Object.keys(data.main_effects);

  // Transform data for each category and calculate y-axis domains
  const processedData: Record<string, any> = {};
  const domains: Record<string, [number, number]> = {};

  categories.forEach(cat => {
    const categoryData = data.main_effects[cat];

    const transformedData = categoryData.map(point => ({
      category: point.category,
      estimate: point.estimate,
      // ErrorBar component expects [negative error, positive error]
      error: [point.estimate - point.conf_low, point.conf_high - point.estimate]
    }));

    // Calculate domain for this category
    const allValues = transformedData.flatMap(d => [
      d.estimate - d.error[0], // conf_low
      d.estimate + d.error[1]  // conf_high
    ]);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1; // Add 10% padding

    domains[cat] = [
      Math.floor((minValue - padding) * 1000) / 1000,
      Math.ceil((maxValue + padding) * 1000) / 1000
    ];

    processedData[cat] = transformedData;
  });

  const formatValue = (value: number) => {
    if (displayAsPercentage) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(3);
  };

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-2 gap-4">
        {categories.map(category => (
          <div key={category} className="border rounded-lg p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-2 text-center dark:text-gray-100">{category}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  data={processedData[category]}
                  margin={{ top: 20, right: 30, left: 50, bottom: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(156, 163, 175, 0.2)"
                  />
                  <XAxis
                    dataKey="category"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    tickLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
                    axisLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
                  />
                  <YAxis
                    domain={domains[category]}
                    tickFormatter={formatValue}
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                    tickLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
                    axisLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
                    label={{
                      value: 'Estimate',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: 'currentColor'
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatValue(value), '']}
                    labelFormatter={(label) => `${category}: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'currentColor'
                    }}
                  />
                  <Scatter
                    dataKey="estimate"
                    fill="hsl(var(--foreground))"
                    isAnimationActive={false}
                  >
                    <ErrorBar
                      dataKey="error"
                      width={4}
                      strokeWidth={2}
                      stroke="grey"
                      direction="y"
                    />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainEffectsPlot;
