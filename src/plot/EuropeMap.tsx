'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataUrl } from '@/lib/config';

interface CountryDataPoint {
  id: string;
  name: string;
  value: number;
  population?: number;
}

interface EuropeMapProps {
  data?: CountryDataPoint[];
  title?: string;
  subtitle?: string;
  valueLabel?: string;
  colorScheme?: string;
}

const EuropeMap: React.FC<EuropeMapProps> = ({
  data = [],
  title = "European Economic Data",
  subtitle = "GDP per capita by country (2023)",
  valueLabel = "GDP per capita (thousands USD)",
  colorScheme = "blues"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<CountryDataPoint[]>([]);
  const [europe, setEurope] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch topology data
  useEffect(() => {
    fetch(getDataUrl('geo/europe.json'))
      .then(response => response.json())
      .then(topology => {
        setEurope(topology);
      })
      .catch(error => {
        console.error('Error loading topology:', error);
      });
  }, []);

  // Static sample data for European countries (no random values to prevent re-renders)
  const sampleData: CountryDataPoint[] = useMemo(() => [
    { id: "DE", name: "Germany", value: 56.2, population: 83240000 },
    { id: "FR", name: "France", value: 47.3, population: 67390000 },
    { id: "IT", name: "Italy", value: 39.1, population: 59550000 },
    { id: "ES", name: "Spain", value: 31.8, population: 47350000 },
    { id: "PL", name: "Poland", value: 17.9, population: 37970000 },
    { id: "NL", name: "Netherlands", value: 58.4, population: 17440000 },
    { id: "BE", name: "Belgium", value: 51.7, population: 11590000 },
    { id: "AT", name: "Austria", value: 50.8, population: 9006000 },
    { id: "CH", name: "Switzerland", value: 93.5, population: 8715000 },
    { id: "NO", name: "Norway", value: 88.9, population: 5421000 },
    { id: "SE", name: "Sweden", value: 59.7, population: 10420000 },
    { id: "DK", name: "Denmark", value: 66.8, population: 5831000 },
    { id: "FI", name: "Finland", value: 52.4, population: 5541000 },
    { id: "IE", name: "Ireland", value: 84.6, population: 5024000 },
    { id: "PT", name: "Portugal", value: 24.7, population: 10290000 },
    { id: "GR", name: "Greece", value: 19.9, population: 10720000 },
    { id: "CZ", name: "Czech Republic", value: 28.1, population: 10710000 },
    { id: "HU", name: "Hungary", value: 18.6, population: 9750000 },
    { id: "SK", name: "Slovakia", value: 20.8, population: 5460000 },
    { id: "SI", name: "Slovenia", value: 28.9, population: 2119000 },
    { id: "HR", name: "Croatia", value: 16.7, population: 3879000 },
    { id: "RO", name: "Romania", value: 13.8, population: 19120000 },
    { id: "BG", name: "Bulgaria", value: 11.9, population: 6927000 },
    { id: "LT", name: "Lithuania", value: 22.7, population: 2795000 },
    { id: "LV", name: "Latvia", value: 20.6, population: 1884000 },
    { id: "EE", name: "Estonia", value: 26.8, population: 1331000 },
    { id: "LU", name: "Luxembourg", value: 125.7, population: 640000 },
    { id: "IS", name: "Iceland", value: 72.5, population: 372000 },
    { id: "UA", name: "Ukraine", value: 4.8, population: 41130000 },
    { id: "BY", name: "Belarus", value: 6.9, population: 9449000 },
    { id: "MD", name: "Moldova", value: 3.9, population: 2618000 },
    { id: "RS", name: "Serbia", value: 9.2, population: 6834000 },
    { id: "BA", name: "Bosnia and Herzegovina", value: 6.8, population: 3281000 },
    { id: "ME", name: "Montenegro", value: 9.7, population: 628000 },
    { id: "MK", name: "North Macedonia", value: 6.9, population: 2083000 },
    { id: "AL", name: "Albania", value: 5.8, population: 2838000 },
    { id: "KV", name: "Kosovo", value: 4.9, population: 1932000 }
  ], []);

  // Load country data
  useEffect(() => {
    if (data.length > 0) {
      setCountryData(data);
    } else {
      setCountryData(sampleData);
    }
    setLoading(false);
  }, [data, sampleData]);

  // Convert TopoJSON to GeoJSON features
  const countries = useMemo(() => {
    if (!europe) return [];
    try {
      return topojson.feature(europe as any, europe.objects.default as any).features;
    } catch (error) {
      console.error('Error processing TopoJSON:', error);
      return [];
    }
  }, [europe]);

  // Create the map visualization
  useEffect(() => {
    if (!mapRef.current || loading || !europe || countries.length === 0 || countryData.length === 0) return;

    // Clear previous content
    mapRef.current.innerHTML = '';

    // Create a data lookup for country values
    const dataMap = new Map(countryData.map(d => [d.id, d]));

    // Enhance country features with data
    const enhancedCountries = countries.map(country => {
      const countryId = country.id || country.properties?.id || country.properties?.['hc-key']?.toUpperCase();
      const dataPoint = dataMap.get(countryId);

      return {
        ...country,
        properties: {
          ...country.properties,
          value: dataPoint?.value || 0,
          name: dataPoint?.name || country.properties?.name || 'Unknown',
          population: dataPoint?.population || 0
        }
      };
    });

    // Create the plot
    const plot = Plot.plot({
      projection: {
        type: "mercator",
        domain: {
          type: "MultiPoint",
          coordinates: [[-25, 35], [45, 75]]
        }
      },
      width: 800,
      height: 600,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
      color: {
        type: "quantile",
        n: 5,
        scheme: colorScheme,
        legend: true,
        label: valueLabel
      },
      marks: [
        // Country fills
        Plot.geo(enhancedCountries, {
          fill: d => d.properties.value,
          stroke: "#fff",
          strokeWidth: 0.5
        }),
        // Country borders
        Plot.geo(enhancedCountries, {
          fill: "none",
          stroke: "#666",
          strokeWidth: 0.25
        }),
        // Interactive tooltips
        Plot.tip(enhancedCountries, Plot.pointer(Plot.centroid({
          title: d => `${d.properties.name}: ${d.properties.value?.toFixed(1) || 'N/A'}`,
        })))
      ]
    });

    // Append the plot
    mapRef.current.appendChild(plot);
  }, [loading, europe, countries.length, countryData.length, colorScheme, valueLabel]);

  if (loading || !europe) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Loading map...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full"></div>
        <div className="mt-4 text-xs text-gray-500">
          Data shows {valueLabel.toLowerCase()} across European countries.
          Values are sample data for demonstration purposes.
        </div>
      </CardContent>
    </Card>
  );
};

export default EuropeMap;