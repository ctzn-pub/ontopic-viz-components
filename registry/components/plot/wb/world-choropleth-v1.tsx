'use client';

import { useMemo } from 'react';
import { WorldMap, type WorldMapDataPoint } from './world-map-v1';

// NOTE: This component requires WB-specific data helpers from the wb-app
// You'll need to implement or import these from your World Bank data layer:
// - getIndicatorValues(indicatorId) - returns array of { countryCode, value }
// - getIndicatorMeta(indicatorId) - returns indicator metadata
// - getCountryMeta(countryCode) - returns country metadata
// - formatValue(value, indicator) - formats value for display

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
  console.warn(`getIndicatorValues not implemented - provide your own data layer`);
  return null;
}

function getIndicatorMeta(indicatorId: string): IndicatorMeta | null {
  console.warn(`getIndicatorMeta not implemented - provide your own data layer`);
  return null;
}

function getCountryMeta(countryCode: string): CountryMeta | null {
  return null;
}

interface WorldChoroplethProps {
  /** Indicator ID to display on the map */
  indicatorId: string;
  /** Title override (defaults to indicator name) */
  title?: string;
  /** Subtitle override */
  subtitle?: string;
  /** Color scheme from Observable Plot (e.g., 'blues', 'greens', 'reds', 'purples', 'oranges', 'greys', 'viridis', 'magma', 'plasma', 'warm', 'cool') */
  colorScheme?: string;
  /** Number of color quantiles (default: 5) */
  quantiles?: number;
  /** Focal country to highlight (ISO3 code) */
  focalCountry?: string;
  /** Map height in pixels */
  height?: number;
  /** Map projection */
  projection?: 'equal-earth' | 'mercator' | 'equirectangular' | 'natural-earth1';
}

/**
 * WorldChoropleth - A world map choropleth visualization for World Bank indicators
 *
 * NOTE: This component requires a World Bank data layer with:
 * - getIndicatorValues(indicatorId) - fetch indicator values
 * - getIndicatorMeta(indicatorId) - fetch indicator metadata
 * - getCountryMeta(countryCode) - fetch country metadata
 *
 * Usage:
 * ```tsx
 * <WorldChoropleth
 *   indicatorId="hdi"
 *   colorScheme="greens"
 *   focalCountry="IND"
 * />
 * ```
 */
export function WorldChoropleth({
  indicatorId,
  title,
  subtitle,
  colorScheme,
  quantiles = 5,
  focalCountry,
  height = 450,
  projection = 'equal-earth',
}: WorldChoroplethProps) {
  const indicator = getIndicatorMeta(indicatorId);
  const indicatorValues = getIndicatorValues(indicatorId);

  const { mapData, derivedColorScheme } = useMemo(() => {
    if (!indicatorValues) {
      return { mapData: [], derivedColorScheme: 'blues' };
    }

    const data: WorldMapDataPoint[] = indicatorValues
      .filter(d => d.value !== null)
      .map(d => {
        const country = getCountryMeta(d.countryCode);
        return {
          id: d.countryCode,
          value: d.value as number,
          name: country?.name || d.countryCode,
        };
      });

    // Auto-select color scheme based on indicator optimal direction if not specified
    let scheme = colorScheme;
    if (!scheme && indicator) {
      if (indicator.optimal === 'higher') {
        scheme = 'greens';
      } else if (indicator.optimal === 'lower') {
        scheme = 'reds';
      } else {
        scheme = 'blues';
      }
    }

    return { mapData: data, derivedColorScheme: scheme || 'blues' };
  }, [indicatorValues, indicator, colorScheme]);

  if (!indicator) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50 text-muted-foreground">
        Indicator not found: {indicatorId}
      </div>
    );
  }

  if (mapData.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50 text-muted-foreground">
        No data available for {indicator.name}
      </div>
    );
  }

  // Determine if we should reverse colors (for indicators where lower is better)
  const reverseColors = indicator.optimal === 'lower';

  // Build value suffix/prefix from indicator unit
  let valueSuffix = '';
  let valuePrefix = '';
  if (indicator.unit === '%' || indicator.unit === 'percent') {
    valueSuffix = '%';
  } else if (indicator.unit === 'USD' || indicator.unit === 'current US$') {
    valuePrefix = '$';
  } else if (indicator.unit && indicator.unit !== 'index' && indicator.unit !== 'score') {
    valueSuffix = ` ${indicator.unit}`;
  }

  return (
    <div className="my-8">
      <WorldMap
        data={mapData}
        height={height}
        projection={projection}
        colorScheme={derivedColorScheme}
        quantiles={quantiles}
        reverseColors={reverseColors}
        focalCountry={focalCountry}
        labels={{
          title: title || indicator.name,
          subtitle: subtitle || `Source: ${indicator.source}`,
          legendLabel: indicator.shortName || indicator.name,
          valueSuffix,
          valuePrefix,
        }}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
}

export default WorldChoropleth;
