'use client';

import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import * as React from "react";
import { useVizTheme } from "@/viz/theme/provider";

// Default US atlas (states + nation objects). Used ONLY when the caller does
// not pass `usTopoJSON` — an explicit prop always wins and skips the fetch.
const DEFAULT_US_TOPOLOGY_URL = 'https://unpkg.com/us-atlas@3/states-10m.json';

// The topology parameter type topojson-client actually accepts. We cast the
// loosely-typed prop through this at the call boundary instead of sprinkling
// `any` through the component.
type TopologyInput = Parameters<typeof topojson.feature>[0];

interface StateProperties {
  name: string;
  value?: number;
}

interface StateFeature {
  type: 'Feature';
  id?: string | number;
  properties: StateProperties;
  geometry: unknown;
}

export interface StateMapDatum {
  /** Full state name as it appears in the topology (e.g. "California"). */
  state: string;
  value: number;
}

export interface StateMapProps {
  /**
   * US TopoJSON with `objects.states` and `objects.nation` (us-atlas shape).
   * Optional: when omitted, the component fetches `topologyUrl` at runtime.
   */
  usTopoJSON?: unknown;

  /**
   * URL fetched for the topology when `usTopoJSON` is not provided.
   * Default: the us-atlas states-10m build on unpkg.
   */
  topologyUrl?: string;

  /** State data with state names and values */
  data: StateMapDatum[];

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

  /** Title displayed above the map (e.g., "Obesity Prevalence") */
  title?: string;

  /** Year displayed next to title (e.g., "2022") */
  year?: string | number;

  /** Description text below title */
  description?: string;

  /** Source attribution for footer */
  source?: string;

  /** Show national average value */
  showAverage?: boolean;

  /**
   * Color scheme for the choropleth. Pass a D3 scheme name (e.g. 'prgn',
   * 'blues', 'reds') to force a specific palette. When omitted, the map
   * uses the active theme's diverging ramp (semantic.diverging) by
   * default, so the choropleth feels of-a-piece with the rest of the
   * library. An explicit prop always wins.
   */
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
 * <StateMap
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
  topologyUrl = DEFAULT_US_TOPOLOGY_URL,
  data,
  width = 975,
  height = 610,
  labels = {},
  title: propTitle,
  year,
  description,
  source,
  showAverage = true,
  colorScheme,
  quantiles = 5,
  reverseColors = false,
  projection = 'albers-usa',
  className = ''
}) => {
  const { theme, rc } = useVizTheme();

  const {
    title: labelTitle = '',
    subtitle = '',
    caption = '',
    valueSuffix = '',
    valuePrefix = ''
  } = labels;

  // Use prop title or fall back to labels.title
  const displayTitle = propTitle || labelTitle;

  // Runtime topology fallback: fetched once, only when no prop was given.
  const [fetchedTopology, setFetchedTopology] = React.useState<unknown>(null);
  const [topologyError, setTopologyError] = React.useState<string | null>(null);
  const topology = usTopoJSON ?? fetchedTopology;

  React.useEffect(() => {
    if (usTopoJSON || fetchedTopology) return;
    let cancelled = false;
    fetch(topologyUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load US topology (${res.status})`);
        return res.json();
      })
      .then((topo: unknown) => {
        if (!cancelled) setFetchedTopology(topo);
      })
      .catch((err: Error) => {
        if (!cancelled) setTopologyError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [usTopoJSON, fetchedTopology, topologyUrl]);

  // Calculate national average
  const average = React.useMemo(() => {
    if (!data || data.length === 0) return null;
    const validValues = data.filter(d => d.value != null && !isNaN(d.value));
    if (validValues.length === 0) return null;
    const sum = validValues.reduce((acc, d) => acc + d.value, 0);
    return sum / validValues.length;
  }, [data]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || !topology || !data || data.length === 0) return;

    containerRef.current.innerHTML = ''; // Clear any existing content

    // Map state names to values
    const stateToValueMap = new Map<string, number>(
      data.map(({ state, value }) => [state, value])
    );

    const topo = topology as TopologyInput;

    // Extract state features from TopoJSON
    const states = topojson.feature(topo, topo.objects.states);
    const stateFeatures = (states as unknown as { features: StateFeature[] }).features;

    // Attach values to state features
    for (const state of stateFeatures) {
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
      topo,
      topo.objects.states as Parameters<typeof topojson.mesh>[1],
      (a, b) => a !== b
    );

    const nation = topojson.feature(topo, topo.objects.nation);

    // Color config: when the caller passes `colorScheme` we honour it as a
    // D3 scheme name; otherwise we fall through to the active theme's
    // diverging ramp (semantic.diverging) so the choropleth picks up the
    // library's palette. Choropleths default to diverging because most
    // policy/health metrics have a natural center (national average,
    // baseline, zero) the reader compares against.
    const colorConfig: Plot.ScaleOptions = {
      type: "quantile",
      n: quantiles,
      reverse: reverseColors,
      legend: true,
      tickFormat: formatNumberAsK,
    };
    if (colorScheme) {
      colorConfig.scheme = colorScheme as Plot.ScaleOptions['scheme'];
    } else {
      colorConfig.range = [...theme.semantic.diverging];
    }

    // Create the plot
    const plot = Plot.plot({
      caption,
      projection: projection,
      style: {
        fontFamily: theme.fontBody,
        color: theme.fg,
        background: 'transparent',
      },
      color: colorConfig,
      width,
      height,
      marks: [
        // State fills
        Plot.geo(states, {
          fill: (d: StateFeature) => d.properties.value
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
          stateFeatures,
          Plot.pointer(
            Plot.centroid({
              title: (d: StateFeature) =>
                d.properties.value != null
                  ? `${d.properties.name}: ${formatNumberAsK(d.properties.value)}`
                  : `${d.properties.name}: no data`
            })
          )
        )
      ]
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot.remove();
    };
  }, [topology, data, width, height, displayTitle, subtitle, caption, valueSuffix, valuePrefix, colorScheme, quantiles, reverseColors, projection, theme]);

  // Format average value
  const formattedAverage = average != null
    ? `${valuePrefix}${average.toFixed(2)}${valueSuffix}`
    : null;

  return (
    <div className={className} style={{ background: rc.surface }}>
      {/* Header */}
      {(displayTitle || year || description) && (
        <div className="mb-4">
          {(displayTitle || year) && (
            <div className="flex items-baseline gap-2 mb-1">
              {displayTitle && (
                <h2 className="text-2xl font-bold" style={rc.titleStyle}>
                  {displayTitle}
                </h2>
              )}
              {year && (
                <span className="text-lg" style={rc.subtitleStyle}>({year})</span>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm" style={rc.subtitleStyle}>{description}</p>
          )}
        </div>
      )}

      {/* Average value display */}
      {showAverage && formattedAverage && (
        <div className="mb-4">
          <span className="text-4xl font-bold" style={rc.titleStyle}>
            {formattedAverage}
          </span>
        </div>
      )}

      {/* Map container */}
      {!topology && !topologyError && (
        <div
          className="flex items-center justify-center text-sm"
          style={{ minHeight: Math.min(height, 240), color: theme.muted }}
        >
          Loading map…
        </div>
      )}
      {topologyError && (
        <div
          className="flex items-center justify-center text-sm"
          style={{ minHeight: Math.min(height, 240), color: theme.muted }}
        >
          Could not load map: {topologyError}
        </div>
      )}
      <div ref={containerRef}></div>

      {/* Source footer */}
      {source && (
        <div className="mt-4" style={rc.sourceStyle}>
          Source: {source}
        </div>
      )}
    </div>
  );
};

export default StateMap;
