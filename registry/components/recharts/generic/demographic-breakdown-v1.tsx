'use client';

import React, { useState } from 'react';
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
} from 'recharts';
import { Button } from '@/viz/ui/button';
import { useVizTheme } from '@/viz/theme/provider';

interface DemographicData {
  break_out_category: string;
  break_out: string;
  value: number;
  confidence_limit_low: number;
  confidence_limit_high: number;
  sample_size: number;
  year: number;
  us_median: number;
}

/** The per-point payload the CI whiskers need. */
interface CIPayload {
  value: number;
  confidence_limit_low: number;
  confidence_limit_high: number;
}

interface CustomShapeProps {
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  width?: number;
  height?: number;
  payload?: CIPayload;
  chartType: 'dot' | 'line' | 'bar';
  /** Mark color, resolved by the caller from the theme. */
  fill: string;
  /** CI whisker color, resolved by the caller from the theme. */
  ciStroke: string;
}

/** Subset of the props Recharts hands to a custom `shape` / `dot` renderer. */
interface ShapeRenderProps {
  key?: React.Key;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  width?: number;
  height?: number;
  payload?: CIPayload;
}

export interface DemographicBreakdownData {
  metric?: string;
  clean_title?: string;
  topic?: string;
  question?: string;
  response?: string;
  data_value_type?: string;
  data_value_unit?: string;
  year?: number;
  state?: string;
  demographics: DemographicData[];
}

export interface DemographicBreakdownProps {
  data: DemographicBreakdownData;
  /**
   * Explicit semantic domain for the mark color. Defaults to null, which
   * resolves to the categorical cycle at index 0 — the theme's ink (the
   * Tufte default). Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
}

const CustomShape: React.FC<CustomShapeProps> = ({
  x = 0,
  y = 0,
  cx = 0,
  cy = 0,
  width = 0,
  height = 0,
  payload,
  chartType,
  fill,
  ciStroke,
}) => {
  if (!payload) return null;

  const { confidence_limit_low, confidence_limit_high } = payload;

  if (chartType === 'bar') {
    const ciLowY = y + height * (1 - confidence_limit_low / payload.value);
    const ciHighY = y + height * (1 - confidence_limit_high / payload.value);

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} />
        <line x1={x + width / 2} y1={ciLowY} x2={x + width / 2} y2={ciHighY} stroke={ciStroke} strokeWidth={2} />
        <line x1={x + width / 2 - 4} y1={ciLowY} x2={x + width / 2 + 4} y2={ciLowY} stroke={ciStroke} strokeWidth={2} />
        <line x1={x + width / 2 - 4} y1={ciHighY} x2={x + width / 2 + 4} y2={ciHighY} stroke={ciStroke} strokeWidth={2} />
      </g>
    );
  } else {
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill={fill} />
        <line
          x1={cx}
          y1={cy - (payload.value - confidence_limit_low) * 4}
          x2={cx}
          y2={cy + (confidence_limit_high - payload.value) * 4}
          stroke={ciStroke}
          strokeWidth={2}
        />
        <line
          x1={cx - 4}
          y1={cy - (payload.value - confidence_limit_low) * 4}
          x2={cx + 4}
          y2={cy - (payload.value - confidence_limit_low) * 4}
          stroke={ciStroke}
          strokeWidth={2}
        />
        <line
          x1={cx - 4}
          y1={cy + (confidence_limit_high - payload.value) * 4}
          x2={cx + 4}
          y2={cy + (confidence_limit_high - payload.value) * 4}
          stroke={ciStroke}
          strokeWidth={2}
        />
      </g>
    );
  }
};

interface ChartComponentProps {
  chartType: 'dot' | 'line' | 'bar';
  data: DemographicData[];
  jsonData: DemographicBreakdownData;
  colorDomain: 'party' | 'sentiment' | null;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ chartType, data, jsonData, colorDomain }) => {
  const { rc, colorFor } = useVizTheme();
  // null domain + index 0 -> categorical[0] = theme ink (the Tufte default).
  const markColor = colorFor(colorDomain, 'value', 0);
  const ciColor = rc.muted;

  const CommonProps = {
    width: 600,
    height: 400,
    data: data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    className: 'w-full h-full',
  };

  const GridProps = {
    stroke: rc.grid.stroke,
    strokeDasharray: rc.grid.strokeDasharray,
    vertical: rc.grid.vertical,
    horizontal: !rc.grid.hide,
  };

  const XAxisProps = {
    dataKey: 'break_out',
    label: { value: data[0]?.break_out_category || '', position: 'insideBottom' as const, offset: -5, fill: rc.muted },
    tick: rc.axisTick,
    padding: { left: 30, right: 30 },
  };

  const YAxisProps = {
    label: {
      value: `${jsonData.clean_title || 'Value'} (${jsonData.data_value_unit || '%'})`,
      angle: -90,
      position: 'insideLeft' as const,
      fill: rc.muted,
    },
    tick: rc.axisTick,
  };

  const TooltipProps = {
    contentStyle: { ...rc.tooltip, fontFamily: rc.fontBody },
  };

  const DataComponentProps = {
    type: 'monotone' as const,
    dataKey: 'value',
    stroke: markColor,
    fill: markColor,
    isAnimationActive: false,
  };

  const renderShape =
    (type: 'dot' | 'line' | 'bar') =>
    ({ key, ...props }: ShapeRenderProps) => (
      <CustomShape key={key} {...props} chartType={type} fill={markColor} ciStroke={ciColor} />
    );

  switch (chartType) {
    case 'dot':
      return (
        <ScatterChart {...CommonProps}>
          <CartesianGrid {...GridProps} />
          <XAxis {...XAxisProps} />
          <YAxis {...YAxisProps} />
          <Tooltip {...TooltipProps} />
          <Scatter {...DataComponentProps} shape={renderShape('dot')} />
        </ScatterChart>
      );
    case 'line':
      return (
        <LineChart {...CommonProps}>
          <CartesianGrid {...GridProps} />
          <XAxis {...XAxisProps} />
          <YAxis {...YAxisProps} />
          <Tooltip {...TooltipProps} />
          <Line {...DataComponentProps} strokeWidth={rc.stroke} dot={renderShape('line')} />
        </LineChart>
      );
    case 'bar':
      return (
        <BarChart {...CommonProps}>
          <CartesianGrid {...GridProps} />
          <XAxis {...XAxisProps} />
          <YAxis {...YAxisProps} />
          <Tooltip {...TooltipProps} />
          <Bar {...DataComponentProps} shape={renderShape('bar')} />
        </BarChart>
      );
    default:
      return null;
  }
};

const DemographicBreakdown: React.FC<DemographicBreakdownProps> = ({ data, colorDomain = null }) => {
  const { theme, rc } = useVizTheme();
  const [chartType, setChartType] = useState<'dot' | 'line' | 'bar'>('dot');

  if (!data || !data.demographics || data.demographics.length === 0) {
    return (
      <div style={{ color: rc.muted, fontFamily: rc.fontBody }}>No demographic data available</div>
    );
  }

  const toggleChartType = () => {
    const types: ('dot' | 'line' | 'bar')[] = ['dot', 'line', 'bar'];
    const currentIndex = types.indexOf(chartType);
    setChartType(types[(currentIndex + 1) % types.length]);
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto border rounded-lg shadow-sm"
      style={{ background: rc.surface, color: rc.fg, borderColor: theme.border }}
    >
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight" style={rc.titleStyle}>
          {data.clean_title}
        </h3>
        <p className="text-sm" style={rc.subtitleStyle}>
          {data.metric} for {data.state} ({data.year})
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="mb-4">
          <Button variant="outline" onClick={toggleChartType}>
            Switch to {chartType === 'dot' ? 'Line' : chartType === 'line' ? 'Bar' : 'Dot'} Chart
          </Button>
        </div>
        <div className="h-[400px] w-full">
          <ChartComponent chartType={chartType} data={data.demographics} jsonData={data} colorDomain={colorDomain} />
        </div>
      </div>
      <div
        className="flex flex-col items-start p-6 pt-0 text-sm"
        style={{ color: rc.muted, fontFamily: rc.fontBody }}
      >
        <p>Data source: {data.question}</p>
        <p>
          Note: {chartType === 'bar' ? 'Bars' : 'Points'} represent {data.response?.toLowerCase()} with 95% confidence
          intervals.
        </p>
      </div>
    </div>
  );
};

export default DemographicBreakdown;
