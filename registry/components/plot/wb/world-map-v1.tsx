'use client';

import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import * as React from "react";
import { useVizTheme } from "@/viz/theme/provider";

// World TopoJSON from unpkg (110m resolution - good balance of detail and performance)
const WORLD_TOPOLOGY_URL = 'https://unpkg.com/world-atlas@2/countries-110m.json';

export interface WorldMapDataPoint {
  /** ISO 3166-1 alpha-3 country code (e.g., "USA", "IND", "DEU") */
  id: string;
  /** Numeric value to display */
  value: number;
  /** Optional display name */
  name?: string;
}

export interface WorldMapProps {
  /** Array of country data points with id (ISO3) and value */
  data: WorldMapDataPoint[];
  /** Map width in pixels */
  width?: number;
  /** Map height in pixels */
  height?: number;
  /** Labels for the map */
  labels?: {
    title?: string;
    subtitle?: string;
    caption?: string;
    valueSuffix?: string;
    valuePrefix?: string;
    legendLabel?: string;
  };
  /** Observable Plot color scheme name */
  colorScheme?: string;
  /** Number of quantile buckets for color scale */
  quantiles?: number;
  /** Reverse the color scale direction */
  reverseColors?: boolean;
  /** Map projection type */
  projection?: 'equal-earth' | 'mercator' | 'equirectangular' | 'natural-earth1';
  /** Optional focal country to highlight (ISO3 code) */
  focalCountry?: string;
  /** Additional CSS class names */
  className?: string;
  /** Callback when a country is clicked */
  onCountryClick?: (countryCode: string) => void;
}

/** Minimal shape of a world-atlas country feature (numeric id, name prop). */
interface CountryFeature {
  id?: string | number;
  properties?: { name?: string };
}

// ISO3 to ISO numeric code mapping for world-atlas TopoJSON
// world-atlas uses numeric codes, but our app uses ISO3
const iso3ToNumeric: Record<string, string> = {
  AFG: '004', ALB: '008', DZA: '012', AND: '020', AGO: '024', ATG: '028', ARG: '032',
  ARM: '051', AUS: '036', AUT: '040', AZE: '031', BHS: '044', BHR: '048', BGD: '050',
  BRB: '052', BLR: '112', BEL: '056', BLZ: '084', BEN: '204', BTN: '064', BOL: '068',
  BIH: '070', BWA: '072', BRA: '076', BRN: '096', BGR: '100', BFA: '854', BDI: '108',
  KHM: '116', CMR: '120', CAN: '124', CPV: '132', CAF: '140', TCD: '148', CHL: '152',
  CHN: '156', COL: '170', COM: '174', COG: '178', COD: '180', CRI: '188', CIV: '384',
  HRV: '191', CUB: '192', CYP: '196', CZE: '203', DNK: '208', DJI: '262', DMA: '212',
  DOM: '214', ECU: '218', EGY: '818', SLV: '222', GNQ: '226', ERI: '232', EST: '233',
  SWZ: '748', ETH: '231', FJI: '242', FIN: '246', FRA: '250', GAB: '266', GMB: '270',
  GEO: '268', DEU: '276', GHA: '288', GRC: '300', GRD: '308', GTM: '320', GIN: '324',
  GNB: '624', GUY: '328', HTI: '332', HND: '340', HUN: '348', ISL: '352', IND: '356',
  IDN: '360', IRN: '364', IRQ: '368', IRL: '372', ISR: '376', ITA: '380', JAM: '388',
  JPN: '392', JOR: '400', KAZ: '398', KEN: '404', KIR: '296', PRK: '408', KOR: '410',
  KWT: '414', KGZ: '417', LAO: '418', LVA: '428', LBN: '422', LSO: '426', LBR: '430',
  LBY: '434', LIE: '438', LTU: '440', LUX: '442', MDG: '450', MWI: '454', MYS: '458',
  MDV: '462', MLI: '466', MLT: '470', MHL: '584', MRT: '478', MUS: '480', MEX: '484',
  FSM: '583', MDA: '498', MCO: '492', MNG: '496', MNE: '499', MAR: '504', MOZ: '508',
  MMR: '104', NAM: '516', NRU: '520', NPL: '524', NLD: '528', NZL: '554', NIC: '558',
  NER: '562', NGA: '566', MKD: '807', NOR: '578', OMN: '512', PAK: '586', PLW: '585',
  PAN: '591', PNG: '598', PRY: '600', PER: '604', PHL: '608', POL: '616', PRT: '620',
  QAT: '634', ROU: '642', RUS: '643', RWA: '646', KNA: '659', LCA: '662', VCT: '670',
  WSM: '882', SMR: '674', STP: '678', SAU: '682', SEN: '686', SRB: '688', SYC: '690',
  SLE: '694', SGP: '702', SVK: '703', SVN: '705', SLB: '090', SOM: '706', ZAF: '710',
  SSD: '728', ESP: '724', LKA: '144', SDN: '729', SUR: '740', SWE: '752', CHE: '756',
  SYR: '760', TJK: '762', TZA: '834', THA: '764', TLS: '626', TGO: '768', TON: '776',
  TTO: '780', TUN: '788', TUR: '792', TKM: '795', TUV: '798', UGA: '800', UKR: '804',
  ARE: '784', GBR: '826', USA: '840', URY: '858', UZB: '860', VUT: '548', VEN: '862',
  VNM: '704', YEM: '887', ZMB: '894', ZWE: '716', PSE: '275', TWN: '158', XKX: '383',
};

export const WorldMap: React.FC<WorldMapProps> = ({
  data,
  width = 960,
  height = 500,
  labels = {},
  colorScheme,
  quantiles = 5,
  reverseColors = false,
  projection = 'equal-earth',
  focalCountry,
  className = '',
  onCountryClick,
}) => {
  const { theme } = useVizTheme();
  const {
    title = '',
    subtitle = '',
    caption = '',
    valueSuffix = '',
    valuePrefix = '',
    legendLabel = 'Value',
  } = labels;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [worldTopology, setWorldTopology] = React.useState<Parameters<typeof topojson.feature>[0] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load world topology
  React.useEffect(() => {
    fetch(WORLD_TOPOLOGY_URL)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load world map data');
        return res.json();
      })
      .then(topology => {
        setWorldTopology(topology);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading world topology:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Render map
  React.useEffect(() => {
    if (!containerRef.current || !worldTopology || !data || data.length === 0) return;

    containerRef.current.innerHTML = '';

    try {
      // Create lookup maps using numeric codes
      const iso3ToValue = new Map(data.map(d => [d.id, d.value]));
      const iso3ToName = new Map(data.map(d => [d.id, d.name || d.id]));

      // Convert to numeric code lookup
      const numericToValue = new Map<string, number>();
      const numericToName = new Map<string, string>();
      const numericToIso3 = new Map<string, string>();

      for (const [iso3, numeric] of Object.entries(iso3ToNumeric)) {
        const value = iso3ToValue.get(iso3);
        if (value !== undefined) {
          numericToValue.set(numeric, value);
          numericToName.set(numeric, iso3ToName.get(iso3) || iso3);
          numericToIso3.set(numeric, iso3);
        }
      }

      // Get focal country numeric code
      const focalNumeric = focalCountry ? iso3ToNumeric[focalCountry] : null;

      // Extract features from topology
      const countries = topojson.feature(
        worldTopology,
        worldTopology.objects.countries,
      ) as unknown as { features: CountryFeature[] };
      const countrymesh = topojson.mesh(
        worldTopology,
        worldTopology.objects.countries as Parameters<typeof topojson.mesh>[1],
        (a, b) => a !== b,
      );

      // Format function for values
      const formatValue = (value: number) => {
        if (value >= 1000000) {
          return `${valuePrefix}${(value / 1000000).toFixed(1)}M${valueSuffix}`;
        } else if (value >= 1000) {
          return `${valuePrefix}${(value / 1000).toFixed(1)}k${valueSuffix}`;
        } else if (value < 1 && value > 0) {
          return `${valuePrefix}${value.toFixed(2)}${valueSuffix}`;
        }
        return `${valuePrefix}${value.toFixed(1)}${valueSuffix}`;
      };

      // Color: explicit prop wins; otherwise theme's sequential ramp.
      // Sequential by default for indicator metrics (HDI, GDP per capita,
      // life expectancy) where the natural reading is low→high.
      const colorConfig: Record<string, unknown> = {
        type: 'quantile',
        n: quantiles,
        reverse: reverseColors,
        legend: true,
        label: legendLabel,
        tickFormat: (d: number) => formatValue(d),
      };
      if (colorScheme) {
        colorConfig.scheme = colorScheme;
      } else {
        colorConfig.range = [...theme.semantic.sequential];
      }

      const plot = Plot.plot({
        projection,
        width,
        height,
        style: {
          backgroundColor: 'transparent',
          color: theme.fg,
          fontFamily: theme.fontBody,
        },
        color: colorConfig,
        marks: [
          // Base layer - no-data countries in quiet theme chrome
          Plot.geo(countries.features, {
            fill: theme.grid,
            stroke: theme.surface,
            strokeWidth: 0.5,
          }),
          // Data layer - countries with values
          Plot.geo(countries.features.filter((d: CountryFeature) => numericToValue.has(String(d.id))), {
            fill: (d: CountryFeature) => numericToValue.get(String(d.id)),
            stroke: (d: CountryFeature) => (String(d.id) === focalNumeric ? theme.accent : theme.surface),
            strokeWidth: (d: CountryFeature) => (String(d.id) === focalNumeric ? 2 : 0.5),
          }),
          // Country boundaries
          Plot.geo(countrymesh, {
            stroke: theme.muted,
            strokeWidth: 0.25,
          }),
          // Focal country highlight outline
          focalNumeric ? Plot.geo(
            countries.features.filter((d: CountryFeature) => String(d.id) === focalNumeric),
            {
              fill: 'none',
              stroke: theme.accent,
              strokeWidth: 2.5,
            }
          ) : null,
          // Interactive tooltips
          Plot.tip(
            countries.features.filter((d: CountryFeature) => numericToValue.has(String(d.id))),
            Plot.pointer(
              Plot.centroid({
                title: (d: CountryFeature) => {
                  const value = numericToValue.get(String(d.id));
                  const name = numericToName.get(String(d.id)) || d.properties?.name || 'Unknown';
                  return value !== undefined
                    ? `${name}\n${formatValue(value)}`
                    : `${name}\nNo data`;
                },
              })
            )
          ),
        ].filter(Boolean),
      });

      // Add click handler
      if (onCountryClick) {
        plot.addEventListener('click', (event: Event) => {
          const target = event.target as SVGElement;
          if (target.tagName === 'path') {
            // Try to find the country from the click event
            const data = (target as unknown as { __data__?: { id?: string | number } }).__data__;
            if (data?.id != null) {
              const iso3 = numericToIso3.get(String(data.id));
              if (iso3) {
                onCountryClick(iso3);
              }
            }
          }
        });
      }

      containerRef.current.appendChild(plot);

      return () => {
        plot.remove();
      };
    } catch (err) {
      console.error('Error rendering world map:', err);
      if (containerRef.current) {
        containerRef.current.textContent = 'Error rendering map';
        containerRef.current.style.color = theme.semantic.sentiment.negative;
        containerRef.current.style.padding = '16px';
      }
    }
  }, [worldTopology, data, width, height, colorScheme, quantiles, reverseColors, projection, focalCountry, labels, onCountryClick, valuePrefix, valueSuffix, legendLabel, theme]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: height }}>
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: theme.accent }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ minHeight: height, color: theme.semantic.sentiment.negative }}
      >
        Error loading map: {error}
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold mb-1" style={{ color: theme.fg, fontFamily: theme.fontTitle }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm mb-3" style={{ color: theme.muted }}>
          {subtitle}
        </p>
      )}
      <div ref={containerRef} className="w-full" style={{ minHeight: height }} />
      {caption && (
        <p className="text-xs mt-2" style={{ color: theme.muted }}>
          {caption}
        </p>
      )}
    </div>
  );
};

export default WorldMap;
