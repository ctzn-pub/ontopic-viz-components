'use client';

import React from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ErrorBar,
  ResponsiveContainer
} from 'recharts';

/**
 * DemographicBarChart Component
 *
 * A Recharts-based bar chart for displaying demographic data with error bars.
 * Suitable for showing distributions across demographic categories with confidence intervals.
 *
 * @example
 * ```tsx
 * <DemographicBarChart
 *   data={[
 *     { category: '18-24', value: 45.2, errorLow: 2.1, errorHigh: 2.3 },
 *     { category: '25-34', value: 52.1, errorLow: 1.8, errorHigh: 1.9 }
 *   ]}
 *   categoryKey="category"
 *   valueKey="value"
 *   errorLowKey="errorLow"
 *   errorHighKey="errorHigh"
 * />
 * ```
 */

export interface DemographicBarChartProps {
  /** Data array to visualize */
  data: any[];

  /** Field name for category labels (x-axis) */
  categoryKey: string;

  /** Field name for bar height values (y-axis) */
  valueKey: string;

  /** Field name for lower error values */
  errorLowKey?: string;

  /** Field name for upper error values */
  errorHighKey?: string;

  /** Chart title */
  title?: string;

  /** X-axis label */
  xLabel?: string;

  /** Y-axis label */
  yLabel?: string;

  /** Bar fill color */
  fill?: string;

  /** Error bar stroke color */
  errorStroke?: string;

  /** Error bar stroke width */
  errorStrokeWidth?: number;

  /** Chart width (default: responsive) */
  width?: number | string;

  /** Chart height in pixels */
  height?: number;

  /** Rotate x-axis labels (degrees) */
  xTickRotate?: number;

  /** X-axis tick font size */
  xTickFontSize?: number;

  /** Show grid lines */
  showGrid?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export function DemographicBarChart({
  data,
  categoryKey,
  valueKey,
  errorLowKey,
  errorHighKey,
  title,
  xLabel,
  yLabel = 'Value (%)',
  fill = '#8884d8',
  errorStroke = '#666',
  errorStrokeWidth = 2,
  width = '100%',
  height = 400,
  xTickRotate = -45,
  xTickFontSize = 10,
  showGrid = true,
  className = ''
}: DemographicBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        No demographic data available
      </div>
    );
  }

  // Transform error data if provided as absolute values
  const transformedData = data.map(item => {
    const transformed: any = { ...item };

    // If error keys are provided, create error array for ErrorBar
    if (errorLowKey && errorHighKey) {
      transformed.error = [item[errorLowKey], item[errorHighKey]];
    }

    return transformed;
  });

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
      <ResponsiveContainer width={width} height={height}>
        <RechartsBarChart
          data={transformedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}

          <XAxis
            dataKey={categoryKey}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -70 } : undefined}
            interval={0}
            angle={xTickRotate}
            textAnchor="end"
            height={100}
            tick={{ fontSize: xTickFontSize }}
          />

          <YAxis
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
          />

          <Tooltip />

          <Bar dataKey={valueKey} fill={fill}>
            {errorLowKey && errorHighKey && (
              <ErrorBar
                dataKey="error"
                stroke={errorStroke}
                strokeWidth={errorStrokeWidth}
              />
            )}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DemographicBarChart;
