'use client';

import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import * as React from "react";

export interface StateMapProps {
  /** US TopoJSON data with states and nation objects */
  usTopoJSON: any;

  /** State data with state names and values */
  data: Array<{ state: string; value: number }>;

  /** Chart width in pixels */
  width?: number;

  /** Chart height in pixels */
  height?: number;

  /** Optional labels for title, subtitle, caption */
  labels?: {
    title?: string;
    valueSuffix?: string;
    valuePrefix?: string;
    subtitle?: string;
    caption?: string;
  };

  /** Color scheme for choropleth */
  colorScheme?: string;

  /** Number of quantiles for color scale */
  quantiles?: number;

  /** Reverse color scale */
  reverseColors?: boolean;

  /** Projection type */
  projection?: 'albers-usa' | 'mercator' | 'equal-earth';

  /** Additional CSS classes */
  className?: string;
}

/**
 * StateMap - US state choropleth map
 *
 * Visualizes state-level data with a color-coded map.
 *
 * @example
 * ```tsx
 * import us from '@/app/data/geo/us_counties_10m.json';
 *
 * <StateMap
 *   usTopoJSON={us}
 *   data={[
 *     { state: 'California', value: 850000 },
 *     { state: 'Texas', value: 620000 }
 *   ]}
 *   labels={{
 *     title: 'Population by State',
 *     valueSuffix: ' people',
 *     caption: 'Source: US Census'
 *   }}
 * />
 * ```
 */
export const StateMap: React.FC<StateMapProps> = ({
  usTopoJSON,
  data,
  width = 975,
  height = 610,
  labels = {},
  colorScheme = 'prgn',
  quantiles = 5,
  reverseColors = false,
  projection = 'albers-usa',
  className = ''
}) => {
  const {
    title = '',
    subtitle = '',
    caption = '',
    valueSuffix = '',
    valuePrefix = ''
  } = labels;

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || !usTopoJSON || !data || data.length === 0) return;

    containerRef.current.innerHTML = ''; // Clear any existing content

    // Map state names to values
    const stateToValueMap = new Map(
      data.map(({ state, value }) => [state, value])
    );

    // Extract state features from TopoJSON
    const states: any = topojson.feature(usTopoJSON, usTopoJSON.objects.states);

    // Attach values to state features
    for (const state of states.features) {
      state.properties.value = stateToValueMap.get(state.properties.name);
    }

    // Format numbers with k suffix for thousands
    const formatNumberAsK = (value: number) => {
      if (value >= 1000) {
        return `${valuePrefix}${(value / 1000).toFixed(1)}k ${valueSuffix}`;
      } else {
        return `${valuePrefix}${value}${valueSuffix}`;
      }
    };

    // Extract mesh and nation boundaries
    const statemesh = topojson.mesh(
      usTopoJSON,
      usTopoJSON.objects.states,
      (a: any, b: any) => a !== b
    ) as any;

    const nation = topojson.feature(
      usTopoJSON,
      usTopoJSON.objects.nation
    ) as any;

    // Create the plot
    const plot = Plot.plot({
      caption,
      projection: projection,
      color: {
        type: "quantile",
        n: quantiles,
        reverse: reverseColors,
        scheme: colorScheme,
        legend: true,
        tickFormat: formatNumberAsK
      },
      width,
      height,
      marks: [
        // State fills
        Plot.geo(states, {
          fill: (d: any) => d.properties.value
        }),
        // State boundaries
        Plot.geo(statemesh, {
          strokeWidth: 0.75
        }),
        // Nation outline
        Plot.geo(nation, {
          strokeWidth: 1.5
        }),
        // Interactive tooltips
        Plot.tip(
          states.features,
          Plot.pointer(
            Plot.centroid({
              title: (d: any) =>
                `${d.properties.name}: ${formatNumberAsK(d.properties.value)}`
            })
          )
        )
      ]
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot.remove();
    };
  }, [usTopoJSON, data, width, height, title, subtitle, caption, valueSuffix, valuePrefix, colorScheme, quantiles, reverseColors, projection]);

  return <div ref={containerRef} className={className}></div>;
};

export default StateMap;
