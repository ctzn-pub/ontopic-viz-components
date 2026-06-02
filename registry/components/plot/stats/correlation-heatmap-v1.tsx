// @ts-nocheck
'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from "@observablehq/plot";
import { useVizTheme } from "@/viz/theme/provider";

interface CorrelationDataPoint {
  x: string;
  y: string;
  value: number;
}

interface CorrelationHeatmapProps {
  data: CorrelationDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
  source?: string;
  /**
   * Explicit D3 color-scheme name to override the default. When omitted,
   * the heatmap uses the active theme's diverging ramp
   * (semantic.diverging). Diverging is the right default for a
   * correlation matrix where the natural center is 0.
   */
  colorScheme?: string;
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  data,
  width = 600,
  height = 600,
  title = "County Health Correlations",
  subtitle = "Focus on variables focused on adjusted prevalence",
  source = "CDC",
  colorScheme,
}) => {
  const { theme } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    // Extract unique variables and create lower triangle matrix
    const variables = [...new Set(data.map(d => d.x))];
    const convertedData = data.filter(d => variables.indexOf(d.y) > variables.indexOf(d.x));

    // Clean variable names for display
    const cleanVariableName = (name: string) => {
      return name.replace('_AdjPrev', '').replace('_', ' ').toUpperCase();
    };

    // Create domains with cleaned names
    const xDomain = [...new Set(convertedData.map(d => d.x))];
    const yDomain = [...new Set(convertedData.map(d => d.y))].reverse();

    // Color config: prop wins if passed; otherwise the theme's diverging
    // ramp. Diverging is right for correlation because the value scale
    // (-1 to 1) is naturally centered at 0.
    const colorConfig: any = {
      type: "linear",
      domain: [-1, 1],
      legend: true,
      label: "Correlation coefficient",
    };
    if (colorScheme) {
      colorConfig.scheme = colorScheme;
    } else {
      colorConfig.range = theme.semantic.diverging;
    }

    const plot = Plot.plot({
      title,
      subtitle,
      caption: `Source: ${source}`,
      padding: 0,
      marginLeft: 120,
      marginTop: 120,
      marginRight: 60,
      marginBottom: 60,
      grid: true,
      style: {
        backgroundColor: theme.surface,
        color: theme.fg,
        fontFamily: theme.fontBody,
      },
      x: {
        axis: "top",
        label: "",
        domain: xDomain,
        tickRotate: -45,
        tickFormat: cleanVariableName,
      },
      y: {
        label: "",
        domain: yDomain,
        tickFormat: cleanVariableName,
      },
      color: colorConfig,
      marks: [
        Plot.cell(convertedData, {
          x: "x",
          y: "y",
          fill: "value",
          inset: 0.5,
          tip: true,
          title: d => `${cleanVariableName(d.x)} vs ${cleanVariableName(d.y)}: ${d.value.toFixed(3)}`
        }),
        Plot.text(convertedData, {
          x: "x",
          y: "y",
          text: d => d.value.toFixed(2),
          fill: d => Math.abs(d.value) > 0.5 ? "white" : "black",
          fontSize: 10,
          fontWeight: "bold",
        })
      ],
      width,
      height,
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot?.remove();
    };
  }, [data, width, height, title, subtitle, source, colorScheme, theme]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default CorrelationHeatmap;
