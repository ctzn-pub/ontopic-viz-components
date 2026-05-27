'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  CartesianGrid,
} from 'recharts';
import { useVizTheme } from '@/viz/theme/provider';

interface DataPoint {
  year: string;
  value: number;
  ci_lower?: number;
  ci_upper?: number;
  n_actual?: number;
  standard_error?: number;
}

interface DataPointMetadataItem {
  id: string;
  name: string;
  type: string;
  units?: string;
  value_prefix?: Record<string, string> | string;
  value_suffix?: string;
  categories?: string[];
  var_original?: string;
  label_original?: Record<string, string>;
}

interface TimeSeriesMetadata {
  note?: string;
  type: string;
  title: string;
  subtitle: string;
  source: {
    id: string;
    name: string;
  };
  question?: string;
  years_n?: number;
  year_min?: number;
  year_max?: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  metadata: TimeSeriesMetadata;
  dataPointMetadata: DataPointMetadataItem[];
  /**
   * Explicit semantic domain for the series color. Defaults to null, which
   * resolves to the categorical cycle at index 0 — i.e. the theme's ink
   * (near-black in `editorial`). Never inferred from the data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
}

export default function TimeSeriesChart({
  data,
  metadata,
  dataPointMetadata,
  colorDomain = null,
}: TimeSeriesChartProps) {
  const { rc, colorFor } = useVizTheme();
  // null domain + index 0 -> categorical[0] = theme ink (the Tufte default).
  const lineColor = colorFor(colorDomain, 'value', 0);

  // Convert year to a numerical value
  const numericData = data.map((d) => ({
    ...d,
    year: parseInt(d.year, 10),
  }));

  // Extract metadata for "value" field
  const valueMetadata = dataPointMetadata.find((d) => d.id === 'value');

  // Check for duplicate years
  const dataYears = numericData.map((d) => d.year);
  const uniqueYears = new Set(dataYears);

  if (dataYears.length !== uniqueYears.size) {
    console.warn('Duplicate years found in the data prop!');

    return <div>Error: Duplicate years detected in the dataset.</div>;
  }

  // Determine min and max years for the domain
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0].payload;

    return (
      <div style={{ ...rc.tooltip, padding: 12, borderRadius: 8 }}>
        <p style={{ fontWeight: 500, color: rc.fg }}>{`Year: ${label}`}</p>
        <p style={{ color: lineColor }}>
          {`${valueMetadata?.name}: ${dataPoint.value.toFixed(1)}${valueMetadata?.value_suffix || ''}`}
        </p>
        {dataPoint.ci_lower && dataPoint.ci_upper && (
          <p style={{ color: rc.muted, fontSize: 12 }}>
            {`95% CI: [${dataPoint.ci_lower.toFixed(1)}, ${dataPoint.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ''}`}
          </p>
        )}
        {dataPoint.n_actual && (
          <p style={{ color: rc.muted, fontSize: 12 }}>
            {`N: ${dataPoint.n_actual.toLocaleString()}`}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ background: rc.surface }}>
      <div className="mb-2">
        <h2 style={{ ...rc.titleStyle, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {metadata.title}
        </h2>
        <p style={{ ...rc.subtitleStyle, marginBottom: 8 }}>{metadata.subtitle}</p>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={numericData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              stroke={rc.grid.stroke}
              strokeDasharray={rc.grid.strokeDasharray}
              vertical={rc.grid.vertical}
              horizontal={!rc.grid.hide}
            />

            <XAxis
              dataKey="year"
              type="number"
              domain={[minYear, maxYear]}
              tickCount={(maxYear - minYear) / 2}
              tickFormatter={(value) => value.toString()}
              padding={{ left: 20, right: 20 }}
              tick={rc.axisTick}
            />

            <YAxis
              tickFormatter={(value) => {
                const valueMeta = dataPointMetadata.find((d) => d.id === 'value');

                const prefix =
                  typeof valueMeta?.value_prefix === 'string'
                    ? valueMeta.value_prefix
                    : '';

                const suffix =
                  typeof valueMeta?.value_suffix === 'string'
                    ? valueMeta.value_suffix
                    : '';

                const num = Number(value);

                let formattedValue: string;

                if (num >= 1_000_000_000) {
                  formattedValue =
                    (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
                } else if (num >= 1_000_000) {
                  formattedValue =
                    (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
                } else if (num >= 1_000) {
                  formattedValue =
                    (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
                } else {
                  formattedValue = num.toLocaleString();
                }

                return `${prefix}${formattedValue}${suffix}`;
              }}
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={rc.axisTick}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Line for "value" */}
            <Line
              key="value-line"
              type="linear"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={rc.stroke}
              dot={{ r: 3, fill: lineColor }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            >
              {/* Error bars for confidence intervals */}
              <ErrorBar
                dataKey={(d: DataPoint) =>
                  d.standard_error ? 1.96 * d.standard_error : 0
                }
                stroke={lineColor}
                strokeWidth={1}
                width={4}
                name="confidence-intervals"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>

        {/* Source information */}
        <div className="mb-2">
          <p style={rc.sourceStyle}>Source: {metadata.source.name}</p>
        </div>
      </div>
    </div>
  );
}
