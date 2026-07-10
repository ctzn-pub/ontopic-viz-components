'use client'
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Brush } from 'recharts';
import { useVizTheme } from '@/viz/theme/provider';

interface DataPoint {
  date: string;
  value: number;
  percentChange: number;
}

interface TimeSeriesProps {
  data: {
    id: string;
    title: string;
    short_title?: string | null;
    units: string;
    observations: Array<{
      date: string;
      value: string;
    }>;
  };
  /**
   * Explicit semantic domain for the series color. Defaults to null, which
   * resolves to the categorical cycle at index 0 — i.e. the theme's ink
   * (near-black in `editorial`). Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
  label?: string;
}

const formatValue = (value: number): string => {
  return value.toLocaleString('en-US');
};

const calculatePercentChange = (current: number, previous: number): number => {
  return ((current - previous) / previous) * 100;
};

const TimeSeries: React.FC<TimeSeriesProps> = ({ data, colorDomain = null }) => {
  const [showRecessions] = useState(true);
  const { rc, theme, colorFor } = useVizTheme();
  // null domain + index 0 -> categorical[0] = theme ink (the Tufte default).
  const lineColor = colorFor(colorDomain, 'value', 0);

  const processedData = useMemo(() => {
    return data.observations.map((item, index, arr) => {
      const value = parseFloat(item.value);
      const previousValue = index > 0 ? parseFloat(arr[index - 1].value) : value;
      return {
        date: item.date,
        value: value,
        percentChange: calculatePercentChange(value, previousValue)
      };
    });
  }, [data]);

  const filteredData = processedData;

  const recessionPeriods = [
    { start: '2020-02-01', end: '2020-04-01' },
    { start: '2007-12-01', end: '2009-06-01' },
    { start: '2001-03-01', end: '2001-11-01' },
    { start: '1990-07-01', end: '1991-03-01' },
    { start: '1981-07-01', end: '1982-11-01' },
    { start: '1980-01-01', end: '1980-07-01' },
    { start: '1973-11-01', end: '1975-03-01' },
    { start: '1969-12-01', end: '1970-11-01' },
    { start: '1960-04-01', end: '1961-02-01' },
    { start: '1957-08-01', end: '1958-04-01' },
    { start: '1953-07-01', end: '1954-05-01' },
    { start: '1948-11-01', end: '1949-10-01' },
    { start: '1945-02-01', end: '1945-10-01' },
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'short',
    });
  };

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const point = payload[0].payload;
    const date = new Date(label || '').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    const value = formatValue(point.value);
    const percentChange = point.percentChange.toFixed(1);
    // Up/down deltas ARE semantic — resolve through the sentiment domain so
    // "positive" green / "negative" red stay consistent across themes.
    const changeColor =
      point.percentChange > 0
        ? colorFor('sentiment', 'positive')
        : point.percentChange < 0
        ? colorFor('sentiment', 'negative')
        : rc.muted;

    return (
      <div className="p-2 rounded-lg shadow-lg" style={{ ...rc.tooltip, fontFamily: rc.fontBody }}>
        <div className="text-sm font-medium">{date}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-sm" style={{ color: changeColor }}>
          {percentChange}% from previous
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full shadow-lg rounded-lg border"
      style={{ background: rc.surface, borderColor: theme.border }}
    >
      <div className="pb-4 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <h3 className="text-2xl font-bold" style={rc.titleStyle}>
              {data.short_title || data.title.split(':')[0]}
            </h3>
            <p className="text-sm mt-1" style={rc.subtitleStyle}>
              {data.title}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 50, bottom: 0 }}
            >
              <CartesianGrid
                stroke={rc.grid.stroke}
                strokeDasharray={rc.grid.strokeDasharray}
                vertical={rc.grid.vertical}
                horizontal={!rc.grid.hide}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                minTickGap={30}
                tick={rc.axisTick}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={formatValue}
                tick={rc.axisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                dot={false}
                stroke={lineColor}
                strokeWidth={rc.stroke}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke={rc.muted}
                fill={rc.surface}
                tickFormatter={formatDate}
                travellerWidth={10}
                startIndex={0}
                endIndex={filteredData.length - 1}
              >
                <LineChart>
                  <Line dataKey="value" stroke={lineColor} dot={false} />
                  {showRecessions && recessionPeriods.map((period, index) => (
                <ReferenceArea
                  key={index}
                  x1={period.start}
                  x2={period.end}
                  fill={rc.muted}
                  fillOpacity={0.12}
                  strokeOpacity={0}
                />
              ))}
                </LineChart>
              </Brush>
              {/* NBER recession bands — quiet chrome: the theme's muted tone
                  at low opacity, no outline, so the data line stays primary. */}
              {showRecessions && recessionPeriods.map((period, index) => (
                <ReferenceArea
                  key={index}
                  x1={period.start}
                  x2={period.end}
                  fill={rc.muted}
                  fillOpacity={0.12}
                  strokeOpacity={0}
                />
              ))}
            </LineChart>

          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TimeSeries;
