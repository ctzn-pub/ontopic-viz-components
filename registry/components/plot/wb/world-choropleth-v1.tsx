'use client';

import { useMemo, type CSSProperties } from 'react';
import { WorldMap, type WorldMapDataPoint } from './world-map-v1';
import { useVizTheme } from '@/viz/theme/provider';

// NOTE: The legacy `indicatorId` path requires WB-specific data helpers from
// the wb-app. If you use it, implement or import these from your World Bank
// data layer:
// - getIndicatorValues(indicatorId) - returns array of { countryCode, value }
// - getIndicatorMeta(indicatorId) - returns indicator metadata
// - getCountryMeta(countryCode) - returns country metadata
// The preferred path is the `data` prop: per-country values, no data layer.

interface IndicatorMeta {
  name: string;
  shortName?: string;
  source: string;
  unit?: string;
  optimal?: 'higher' | 'lower' | 'neutral';
}

interface IndicatorValue {
  countryCode: string;
  value: number | null;
}

interface CountryMeta {
  name: string;
  code: string;
}

// Placeholder functions - replace with your actual data layer
function getIndicatorValues(indicatorId: string): IndicatorValue[] | null {
  console.warn(`getIndicatorValues not implemented - provide your own data layer (requested "${indicatorId}")`);
  return null;
}

function getIndicatorMeta(indicatorId: string): IndicatorMeta | null {
  console.warn(`getIndicatorMeta not implemented - provide your own data layer (requested "${indicatorId}")`);
  return null;
}

function getCountryMeta(countryCode: string): CountryMeta | null {
  void countryCode;
  return null;
}

export interface WorldChoroplethProps {
  /**
   * Per-country values: { id: ISO3 code, value, name? }. The preferred,
   * data-only way to drive the map — when set, no data layer is needed and
   * `indicatorId` is ignored.
   */
  data?: WorldMapDataPoint[];
  /** Legacy: indicator ID resolved through an app-supplied WB data layer. */
  indicatorId?: string;
  /** Title override (defaults to indicator name when using indicatorId) */
  title?: string;
  /** Subtitle override */
  subtitle?: string;
  /** Legend label (defaults to indicator short name when using indicatorId) */
  legendLabel?: string;
  /** Prefix prepended to formatted values (e.g. "$") */
  valuePrefix?: string;
  /** Suffix appended to formatted values (e.g. "%") */
  valueSuffix?: string;
  /**
   * Color scheme from Observable Plot (e.g. 'blues', 'greens', 'viridis').
   * When omitted, the map uses the active theme's sequential ramp so the
   * choropleth matches the rest of the library. An explicit prop always wins.
   */
  colorScheme?: string;
  /** Number of color quantiles (default: 5) */
  quantiles?: number;
  /** Reverse the color ramp (e.g. for indicators where lower is better) */
  reverseColors?: boolean;
  /** Focal country to highlight (ISO3 code) */
  focalCountry?: string;
  /** Map height in pixels */
  height?: number;
  /** Map projection */
  projection?: 'equal-earth' | 'mercator' | 'equirectangular' | 'natural-earth1';
}

/**
 * WorldChoropleth - A world map choropleth for per-country indicator values.
 *
 * Preferred usage — pure data:
 * ```tsx
 * <WorldChoropleth
 *   data={[{ id: 'USA', value: 77.5, name: 'United States' }, …]}
 *   title="Life expectancy at birth"
 *   valueSuffix=" yrs"
 * />
 * ```
 *
 * Legacy usage — via a World Bank data layer (getIndicatorValues /
 * getIndicatorMeta / getCountryMeta must be wired up by the consumer):
 * ```tsx
 * <WorldChoropleth indicatorId="hdi" focalCountry="IND" />
 * ```
 *
 * Color resolves from the active theme's sequential ramp unless an explicit
 * `colorScheme` is passed. NOTE: the underlying <WorldMap> fetches its world
 * TopoJSON from unpkg (world-atlas@2) at runtime.
 */
export function WorldChoropleth({
  data,
  indicatorId,
  title,
  subtitle,
  legendLabel,
  valuePrefix,
  valueSuffix,
  colorScheme,
  quantiles = 5,
  reverseColors,
  focalCountry,
  height = 450,
  projection = 'equal-earth',
}: WorldChoroplethProps) {
  const { theme } = useVizTheme();

  // Legacy data-layer path — only consulted when no direct data was given.
  const indicator = !data && indicatorId ? getIndicatorMeta(indicatorId) : null;
  const indicatorValues = !data && indicatorId ? getIndicatorValues(indicatorId) : null;

  const mapData = useMemo<WorldMapDataPoint[]>(() => {
    if (data && data.length > 0) return data;
    if (!indicatorValues) return [];
    return indicatorValues
      .filter((d) => d.value !== null)
      .map((d) => {
        const country = getCountryMeta(d.countryCode);
        return {
          id: d.countryCode,
          value: d.value as number,
          name: country?.name || d.countryCode,
        };
      });
  }, [data, indicatorValues]);

  const emptyStateStyle: CSSProperties = {
    background: theme.surface,
    color: theme.muted,
    border: `1px solid ${theme.border}`,
    fontFamily: theme.fontBody,
  };

  if (!data && indicatorId && !indicator) {
    return (
      <div className="p-4 rounded-lg" style={emptyStateStyle}>
        Indicator not found: {indicatorId}
      </div>
    );
  }

  if (mapData.length === 0) {
    return (
      <div className="p-4 rounded-lg" style={emptyStateStyle}>
        No data available{indicator ? ` for ${indicator.name}` : ''}
      </div>
    );
  }

  // Reverse the ramp for "lower is better" indicators unless the caller
  // decided explicitly. The ramp itself always comes from the theme (or the
  // explicit colorScheme prop) — never from the indicator metadata.
  const effectiveReverse = reverseColors ?? indicator?.optimal === 'lower';

  // Build value suffix/prefix: explicit props win; otherwise derive from the
  // indicator unit (legacy path).
  let derivedSuffix = '';
  let derivedPrefix = '';
  if (indicator) {
    if (indicator.unit === '%' || indicator.unit === 'percent') {
      derivedSuffix = '%';
    } else if (indicator.unit === 'USD' || indicator.unit === 'current US$') {
      derivedPrefix = '$';
    } else if (indicator.unit && indicator.unit !== 'index' && indicator.unit !== 'score') {
      derivedSuffix = ` ${indicator.unit}`;
    }
  }

  return (
    <div className="my-8">
      <WorldMap
        data={mapData}
        height={height}
        projection={projection}
        colorScheme={colorScheme}
        quantiles={quantiles}
        reverseColors={effectiveReverse}
        focalCountry={focalCountry}
        labels={{
          title: title || indicator?.name || '',
          subtitle: subtitle || (indicator ? `Source: ${indicator.source}` : ''),
          legendLabel: legendLabel || indicator?.shortName || indicator?.name || 'Value',
          valueSuffix: valueSuffix ?? derivedSuffix,
          valuePrefix: valuePrefix ?? derivedPrefix,
        }}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
}

export default WorldChoropleth;
