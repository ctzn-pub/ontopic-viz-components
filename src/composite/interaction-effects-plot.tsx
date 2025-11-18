import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface InteractionDataPoint {
  [key: string]: string | number | null; // For dynamic keys like "Gender", "Ideology", etc.
  conf_low: number;
  conf_high: number;
  estimate: number;
  p_value: number;
  // s_value: null | string;
  statistic: number;
  std_error: number;
}

interface InteractionEffectsPlotProps {
  data: InteractionDataPoint[];
  variables: string;
  displayAsPercentage?: boolean;
}

interface PlotDataPoint {
  x: string;
  [key: string]: string | number | [number, number];
}

const COLORS = ['#60a5fa', '#f97316', '#22c55e'];

const InteractionEffectsPlot: React.FC<InteractionEffectsPlotProps> = ({ data, variables, displayAsPercentage = false }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const variableNames = variables.split(' * ');
  
  if (variableNames.length === 3) {
    return create3WayInteractionPlot(variableNames, data, displayAsPercentage);
  } else if (variableNames.length === 2) {
    return create2WayInteractionPlot(variableNames, data, true, undefined, false, displayAsPercentage);
  }
  
  return null;
};

const create2WayInteractionPlot = (
  variables: string[], 
  data: InteractionDataPoint[],
  showLegend: boolean = true,
  title?: string,
  isSubplot: boolean = false,
  displayAsPercentage: boolean = false
) => {
  const [var1, var2] = variables;
  const uniqueVar1Values = [...new Set(data.map(d => d[var1]))];
  const uniqueVar2Values = [...new Set(data.map(d => d[var2]))];
  
  const plotData: PlotDataPoint[] = uniqueVar2Values.map(var2Value => {
    const dataPoint: PlotDataPoint = { x: var2Value as string };
    
    uniqueVar1Values.forEach(var1Value => {
      const dataEntry = data.find(d => 
        d[var2] === var2Value && d[var1] === var1Value
      );
      
      if (dataEntry) {
        dataPoint[var1Value as string] = dataEntry.estimate;
        dataPoint[`${var1Value}_error`] = [
          dataEntry.estimate - dataEntry.conf_low,
          dataEntry.conf_high - dataEntry.estimate
        ];
      }
    });
    
    return dataPoint;
  });

  const height = isSubplot ? 250 : 300;
  const width = isSubplot ? "100%" : "60%";

  return (
    <div className={`space-y-2 ${!isSubplot ? 'mb-8' : ''}`}>
      {!isSubplot && (
        <div className="flex justify-center items-center">
          <h3 className="text-xl font-semibold dark:text-gray-100">Interaction Effect: {var1} × {var2}</h3>
        </div>
      )}
      {title && (
        <div className="flex justify-center items-center">
          <h4 className="text-lg dark:text-gray-200">{title}</h4>
        </div>
      )}
      <div style={{ height: `${height}px`, width: width, margin: '0 auto' }} className="border rounded-lg p-4 shadow dark:border-gray-700 dark:bg-gray-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={plotData} margin={{ top: 20, right: 30, left: 50, bottom: 40 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(156, 163, 175, 0.2)" 
            />
            <XAxis
              dataKey="x"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
              axisLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
            />
            <YAxis
              domain={[0.15, 0.5]}
              tickFormatter={(value) => displayAsPercentage ? `${(value * 100).toFixed(1)}%` : value.toFixed(3)}
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
              axisLine={{ stroke: 'rgba(156, 163, 175, 0.4)' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const displayName = name.includes('_error') ? '' : displayAsPercentage ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);
                return [displayName, name.includes('_error') ? '' : `${var1}: ${name}`];
              }}
              labelFormatter={(label) => `${var2}: ${label}`}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: 'currentColor'
              }}
            />
            {showLegend && (
              <Legend 
                wrapperStyle={{ position: 'relative', marginTop: '20px' }}
                formatter={(value) => <span className="dark:text-gray-200">{value}</span>}
              />
            )}
            {uniqueVar1Values.map((var1Value, index) => (
              <Line
                key={var1Value}
                type="monotone"
                dataKey={var1Value as string}
                stroke={COLORS[index % COLORS.length]}
                name={`${var1Value}`}
                strokeWidth={2}
                dot={{ r: 4 }}
              >
                <ErrorBar
                  dataKey={`${var1Value}_error`}
                  width={4}
                  strokeWidth={2}
                  stroke={COLORS[index % COLORS.length]}
                  direction="y"
                />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const create3WayInteractionPlot = (variables: string[], data: InteractionDataPoint[], displayAsPercentage: boolean) => {
  const [var1, var2, var3] = variables;
  const uniqueVar3Values = [...new Set(data.map(d => d[var3]))];
  const uniqueVar1Values = [...new Set(data.map(d => d[var1]))];
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-xl font-semibold dark:text-gray-100">Three-Way Interaction: {var1} × {var2} × {var3}</h3>
        <div className="flex items-center space-x-8">
          {uniqueVar1Values.map((value, index) => (
            <div key={value} className="flex items-center">
              <div 
                className="w-4 h-0.5 mr-2" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {uniqueVar3Values.map((var3Value) => {
          const filteredData = data.filter(d => d[var3] === var3Value);

          return (
            <div key={var3Value}>
              {create2WayInteractionPlot(
                [var1, var2], 
                filteredData, 
                false, 
                var3Value as string,
                true,
                displayAsPercentage
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractionEffectsPlot;
