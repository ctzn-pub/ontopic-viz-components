import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ReferenceLine, Scatter, CartesianGrid, Tooltip } from 'recharts';

interface OddsRatioData {
  Label: string;
  LowerCI: string;
  OddsRatio: string;
  UpperCI: string;
}

interface MarginalEffectData {
  term: string;
  odds_ratio: string | number;
  conf_low: string | number;
  conf_high: string | number;
}

type DataItem = OddsRatioData | MarginalEffectData;

type Size = 'small' | 'medium' | 'large';

interface ForestPlotProps {
  data: DataItem[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  size?: Size;
  referenceLine?: number;
}

interface ScatterShapeProps {
  cx?: number;
  cy?: number;
  payload?: { value: number };
}

const sizeConfig: Record<Size, { width: number; height: number; fontSize: number; pointRadius: number }> = {
  small: { width: 450, height: 300, fontSize: 11, pointRadius: 3 },
  medium: { width: 600, height: 400, fontSize: 12, pointRadius: 4 },
  large: { width: 750, height: 500, fontSize: 13, pointRadius: 5 },
};

const ForestPlot = ({ 
  data = [], 
  title = "",
  subtitle = "",
  size = 'medium',
  width: customWidth,
  height: customHeight,
  referenceLine = 0
}: ForestPlotProps) => {
  const [isClient, setIsClient] = useState(false);
  const { width, height: baseHeight, fontSize, pointRadius } = sizeConfig[size];
  const finalWidth = customWidth ?? width;
  
  // Calculate height based on data size
  const maxHeight = 2000, minHeight = 400;
  const pointSpacing = 30; // Fixed spacing between points
  const marginSpace = 100; // Space for margins
  const calculatedHeight = Math.min(maxHeight, Math.max(minHeight, data.length * pointSpacing + marginSpace));
  const finalHeight = customHeight ?? calculatedHeight;

  useEffect(() => setIsClient(true), []);

  if (!isClient) return <div style={{ height: finalHeight }} />;

  // Fix: Properly type `termCounts`
  const termCounts: Record<string, number> = {};
 
  // Generate unique internal keys invisibly
  const plotData = data.map((item) => {
    // Determine if we're dealing with odds ratio or marginal effect data
    const isOddsRatio = 'Label' in item;
    
    const term = isOddsRatio ? item.Label : item.term;
    const value = isOddsRatio ? item.OddsRatio : item.odds_ratio;
    const lowerCI = isOddsRatio ? item.LowerCI : item.conf_low;
    const upperCI = isOddsRatio ? item.UpperCI : item.conf_high;
    
    if (!termCounts[term]) termCounts[term] = 0;
    termCounts[term]++;

    // For header rows, return a special object
    if (value === "") {
      return {
        name: term,
        internalKey: `${term}_${termCounts[term]}`,
        isHeader: true,
        value: null,
        ci: null
      };
    }

    return {
      name: term,
      internalKey: `${term}_${termCounts[term]}`,
      isHeader: false,
      value: Number(value),
      ci: [Number(lowerCI), Number(upperCI)] as [number, number]
    };
  });

  // Calculate domain based on data (exclude null values from headers)
  const allValues = plotData
    .filter(item => !item.isHeader)
    .flatMap(item => {
      const values = [];
      if (item.value !== null) values.push(item.value);
      if (item.ci) values.push(...item.ci);
      return values;
    });
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = Math.abs(maxValue - minValue) * 0.1;
  const domainMin = Math.floor((minValue - padding) * 10) / 10;
  const domainMax = Math.ceil((maxValue + padding) * 10) / 10;

  // Generate custom ticks
  const tickCount = 6;
  const tickStep = (domainMax - domainMin) / (tickCount - 1);
  const customTicks = Array.from({ length: tickCount }, (_, i) => 
    Math.round((domainMin + i * tickStep) * 1000) / 1000
  );

  // Shape renderer for scatter points
  const renderShape = (props: ScatterShapeProps) => {
    if (!props.payload?.value) return <g />; // Return empty group instead of null
  
    const fill = props.payload.value >= referenceLine ? "#4ade80" : "#ef4444";
    return <circle cx={props.cx} cy={props.cy} r={pointRadius} fill={fill} />;
  };

  return (
    <div className="w-full">
      <div className="relative" style={{ height: `${finalHeight}px` }}>
        <ComposedChart 
          layout="vertical" 
          width={finalWidth} 
          height={finalHeight} 
          data={plotData} 
          margin={{ top: 20, right: 40, bottom: 20, left: 100 }}
        >
          <CartesianGrid vertical horizontal={false} strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
          
          <XAxis 
            type="number" 
            domain={[domainMin, domainMax]}
            ticks={customTicks}
            tick={{ fontSize, fill: 'currentColor' }}
            tickLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
            axisLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={160}
            tick={(props) => {
              const { x, y, payload } = props;
              const dataPoint = plotData.find(d => d.name === payload.value);
              const isHeader = dataPoint?.isHeader;

              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={isHeader ? -20 : -10}
                    y={0}
                    textAnchor="end"
                    fill={isHeader ? "#374151" : "currentColor"}
                    fontSize={isHeader ? fontSize : fontSize}
                    fontWeight={isHeader ? "600" : "normal"}
                  >
                    {payload.value}
                  </text>
                </g>
              );
            }}
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip 
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const dataPoint = payload[0].payload;
              return (
                <div className="text-sm" style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div className="font-medium">{dataPoint.name}</div>
                  <div>Effect: {dataPoint.value.toFixed(3)}</div>
                  {dataPoint.ci && (
                    <div className="text-gray-600">
                      CI: [{dataPoint.ci[0].toFixed(3)}, {dataPoint.ci[1].toFixed(3)}]
                    </div>
                  )}
                </div>
              );
            }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          
          <ReferenceLine x={referenceLine} stroke="rgba(156, 163, 175, 0.4)" strokeWidth={1} strokeDasharray="4 4" />
          
          {/* Confidence intervals */}
          {plotData.map((item) => (
            item.ci && (
              <ReferenceLine
                key={`ci-${item.internalKey}`}
                segment={[
                  { x: item.ci[0], y: item.name }, 
                  { x: item.ci[1], y: item.name }
                ]}
                stroke={item.value && item.value >= referenceLine ? "#4ade80" : "#ef4444"}
                strokeWidth={2}
                strokeOpacity={0.7}
              />
            )
          ))}
          
          {/* Points */}
          <Scatter data={plotData} dataKey="value" shape={renderShape} />
        </ComposedChart>
      </div>
    </div>
  );
};

export default ForestPlot;
