import * as React25 from 'react';
import React25__default, { createContext, useRef, useState, useEffect, useContext, useMemo } from 'react';
import * as Plot24 from '@observablehq/plot';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Download, Users, ArrowUpDown, ChevronUp, ChevronDown, Palette, DollarSign, UserCircle2, GraduationCap } from 'lucide-react';
import * as topojson3 from 'topojson-client';
import dynamic from 'next/dynamic';
import { mean, median } from 'd3-array';
import { useTheme } from 'next-themes';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ErrorBar, BarChart as BarChart$1, Legend, Bar, Brush, ReferenceArea, Text, ScatterChart, Scatter, ReferenceLine, ComposedChart, Cell, ZAxis, Area } from 'recharts';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
function PlotContainer({
  plotSpec,
  width = "responsive",
  height,
  className,
  ariaLabel,
  onPlotCreated
}) {
  const containerRef = useRef(null);
  const plotRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  useEffect(() => {
    if (width !== "responsive" || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width]);
  useEffect(() => {
    if (!containerRef.current) return;
    const finalWidth = width === "responsive" ? containerWidth : width;
    const plot34 = Plot24.plot({
      ...plotSpec,
      width: finalWidth,
      height
    });
    if (plotRef.current) {
      plotRef.current.remove();
    }
    containerRef.current.appendChild(plot34);
    plotRef.current = plot34;
    onPlotCreated?.(plot34);
    return () => {
      if (plotRef.current) {
        plotRef.current.remove();
        plotRef.current = null;
      }
    };
  }, [plotSpec, width, height, containerWidth, onPlotCreated]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: cn("plot-container", className),
      role: "img",
      "aria-label": ariaLabel
    }
  );
}
var defaultLightTheme = {
  name: "light",
  fonts: {
    base: "Inter, system-ui, sans-serif",
    mono: "IBM Plex Mono, monospace"
  },
  colors: {
    categorical: [
      "hsl(220, 70%, 50%)",
      // Blue
      "hsl(160, 60%, 45%)",
      // Green
      "hsl(30, 80%, 55%)",
      // Orange
      "hsl(280, 65%, 60%)",
      // Purple
      "hsl(340, 75%, 55%)"
      // Red
    ],
    sequential: "blues",
    diverging: "rdbu"
  },
  grid: {
    stroke: "#e0e0e0",
    strokeWidth: 1,
    strokeOpacity: 0.5
  },
  axes: {
    fontSize: 12,
    fontWeight: 400,
    color: "#666666"
  },
  background: "#ffffff",
  foreground: "#000000"
};
var defaultDarkTheme = {
  ...defaultLightTheme,
  name: "dark",
  colors: {
    ...defaultLightTheme.colors,
    categorical: [
      "hsl(220, 70%, 60%)",
      "hsl(160, 60%, 55%)",
      "hsl(30, 80%, 65%)",
      "hsl(280, 65%, 70%)",
      "hsl(340, 75%, 65%)"
    ]
  },
  grid: {
    stroke: "#333333",
    strokeWidth: 1,
    strokeOpacity: 0.3
  },
  axes: {
    fontSize: 12,
    fontWeight: 400,
    color: "#999999"
  },
  background: "#0a0a0a",
  foreground: "#ffffff"
};
var PlotThemeContext = createContext(defaultLightTheme);
function PlotThemeProvider({
  theme = "light",
  children
}) {
  const resolvedTheme = typeof theme === "string" ? theme === "dark" ? defaultDarkTheme : defaultLightTheme : theme;
  return /* @__PURE__ */ jsx(PlotThemeContext.Provider, { value: resolvedTheme, children });
}
function usePlotTheme() {
  return useContext(PlotThemeContext);
}
function PlotExport({
  plotRef,
  filename = "chart",
  formats = ["svg", "png"],
  Button: Button2,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
}) {
  const [isExporting, setIsExporting] = useState(false);
  const exportAs = async (format) => {
    if (!plotRef.current) return;
    setIsExporting(true);
    try {
      const svgElement = plotRef.current.querySelector("svg");
      if (!svgElement) throw new Error("No SVG found");
      if (format === "svg") {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        downloadBlob(blob, `${filename}.svg`);
      } else if (format === "png") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          canvas.width = svgElement.width.baseVal.value * 2;
          canvas.height = svgElement.height.baseVal.value * 2;
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${filename}.png`);
            setIsExporting(false);
          }, "image/png");
        };
        img.src = url;
        return;
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      if (format !== "png") {
        setIsExporting(false);
      }
    }
  };
  const downloadBlob = (blob, filename2) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename2;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (!Button2 || !DropdownMenu) {
    return /* @__PURE__ */ jsxs("div", { className: "plot-export", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => exportAs("svg"),
          disabled: isExporting,
          className: "px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 inline mr-2" }),
            isExporting ? "Exporting..." : "Export SVG"
          ]
        }
      ),
      formats.includes("png") && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => exportAs("png"),
          disabled: isExporting,
          className: "ml-2 px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50",
          children: "Export PNG"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button2, { variant: "outline", size: "sm", disabled: isExporting, children: [
      /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-2" }),
      isExporting ? "Exporting..." : "Export"
    ] }) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
      formats.includes("svg") && /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => exportAs("svg"), children: "Export as SVG" }),
      formats.includes("png") && /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => exportAs("png"), children: "Export as PNG" })
    ] })
  ] });
}
var StateMap = ({
  usTopoJSON,
  data,
  width = 975,
  height = 610,
  labels = {},
  colorScheme = "prgn",
  quantiles = 5,
  reverseColors = false,
  projection = "albers-usa",
  className = ""
}) => {
  const {
    title = "",
    subtitle = "",
    caption = "",
    valueSuffix = "",
    valuePrefix = ""
  } = labels;
  const containerRef = React25.useRef(null);
  React25.useEffect(() => {
    if (!containerRef.current || !usTopoJSON || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const stateToValueMap = new Map(
      data.map(({ state, value }) => [state, value])
    );
    const states = topojson3.feature(usTopoJSON, usTopoJSON.objects.states);
    for (const state of states.features) {
      state.properties.value = stateToValueMap.get(state.properties.name);
    }
    const formatNumberAsK = (value) => {
      if (value >= 1e3) {
        return `${valuePrefix}${(value / 1e3).toFixed(1)}k ${valueSuffix}`;
      } else {
        return `${valuePrefix}${value}${valueSuffix}`;
      }
    };
    const statemesh = topojson3.mesh(
      usTopoJSON,
      usTopoJSON.objects.states,
      (a, b) => a !== b
    );
    const nation = topojson3.feature(
      usTopoJSON,
      usTopoJSON.objects.nation
    );
    const plot34 = Plot24.plot({
      caption,
      projection,
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
        Plot24.geo(states, {
          fill: (d) => d.properties.value
        }),
        // State boundaries
        Plot24.geo(statemesh, {
          strokeWidth: 0.75
        }),
        // Nation outline
        Plot24.geo(nation, {
          strokeWidth: 1.5
        }),
        // Interactive tooltips
        Plot24.tip(
          states.features,
          Plot24.pointer(
            Plot24.centroid({
              title: (d) => `${d.properties.name}: ${formatNumberAsK(d.properties.value)}`
            })
          )
        )
      ]
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34.remove();
    };
  }, [usTopoJSON, data, width, height, title, subtitle, caption, valueSuffix, valuePrefix, colorScheme, quantiles, reverseColors, projection]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
};
var geo_state_map_v1_default = StateMap;
function BubbleMap({
  data,
  longitudeKey,
  latitudeKey,
  sizeKey,
  colorKey,
  nameKey,
  title,
  subtitle,
  fill = "#4682b4",
  fillOpacity = 0.6,
  stroke = "#fff",
  strokeWidth = 1,
  width = 975,
  height = 610,
  projection = "albers-usa",
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plotData = data.map((d) => ({
      ...d,
      longitude: d[longitudeKey],
      latitude: d[latitudeKey],
      size: d[sizeKey],
      ...colorKey && { color: d[colorKey] },
      ...nameKey && { name: d[nameKey] }
    }));
    const marks = [
      // Bubble dots
      Plot24.dot(plotData, {
        x: "longitude",
        y: "latitude",
        r: "size",
        fill: colorKey ? "color" : fill,
        fillOpacity,
        stroke,
        strokeWidth,
        title: nameKey ? (d) => `${d.name}: ${d.size.toLocaleString()}` : (d) => d.size.toLocaleString(),
        tip: true
      })
    ];
    const plot34 = Plot24.plot({
      width,
      height,
      title,
      subtitle,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      projection: {
        type: projection,
        ...projection === "albers-usa" && { domain: { type: "MultiPoint", coordinates: plotData.map((d) => [d.longitude, d.latitude]) } }
      },
      marks
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [data, longitudeKey, latitudeKey, sizeKey, colorKey, nameKey, title, subtitle, fill, fillOpacity, stroke, strokeWidth, width, height, projection]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
var geo_bubble_v1_default = BubbleMap;
function BoxPlot({
  data,
  x,
  y,
  title,
  xLabel,
  yLabel,
  fill = "#4682b4",
  fillOpacity = 0.4,
  stroke = "#2c5f8d",
  strokeWidth = 1.5,
  outlierRadius = 3,
  width = 800,
  height = 500,
  marginLeft = 60,
  marginBottom = 100,
  xTickRotate = -45,
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot34 = Plot24.plot({
      width,
      height,
      marginLeft,
      marginBottom,
      title,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        label: xLabel || x,
        tickRotate: xTickRotate
      },
      y: {
        label: yLabel || y,
        grid: true
      },
      marks: [
        // Box plot with Observable Plot's built-in boxY mark
        Plot24.boxY(data, {
          x,
          y,
          fill,
          fillOpacity,
          stroke,
          strokeWidth,
          r: outlierRadius
          // Outlier dot radius
        })
      ]
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [data, x, y, title, xLabel, yLabel, fill, fillOpacity, stroke, strokeWidth, outlierRadius, width, height, marginLeft, marginBottom, xTickRotate]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
var stat_boxplot_v1_default = BoxPlot;
function BoxPlotGrouped({
  data,
  xLabel = "Category",
  yLabel = "Value",
  groupLabel = "Group",
  title,
  width = 800,
  height = 500,
  colorScheme = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"],
  className = "",
  ariaLabel = "Grouped box plot showing distributions by category and group"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const transformedData = data.map((d) => ({
      ...d,
      compoundCategory: `${d.category}__${d.group}`
      // Use separator for unique key
    }));
    const categories = [...new Set(data.map((d) => d.category))];
    const groups = [...new Set(data.map((d) => d.group))];
    const xDomain = categories.flatMap(
      (cat) => groups.map((grp) => `${cat}__${grp}`)
    );
    const middleGroupIndex = Math.ceil((groups.length - 1) / 2);
    const tickValues = categories.flatMap((cat) => `${cat}__${groups[middleGroupIndex]}`);
    const tickFormat = (d) => d.split("__")[0];
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 120,
      marginBottom: 100,
      marginLeft: 60,
      title,
      x: {
        label: xLabel,
        domain: xDomain,
        ticks: tickValues,
        tickFormat,
        tickSize: 0
        // Remove tick marks
      },
      y: {
        label: yLabel,
        grid: true
      },
      color: {
        legend: true,
        label: groupLabel,
        domain: [...new Set(data.map((d) => d.group))],
        range: colorScheme
      },
      marks: [
        Plot24.boxY(transformedData, {
          x: "compoundCategory",
          y: "value",
          fill: "group",
          fillOpacity: 0.4,
          stroke: "group",
          strokeWidth: 1.5,
          r: 3
        })
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, groupLabel, title, width, height, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function BoxPlotFaceted({
  data,
  xLabel = "Category",
  yLabel = "Value",
  facetLabel = "Facet",
  title,
  width = 1e3,
  height = 600,
  facetColumns = 2,
  fillColor = "#4682b4",
  strokeColor = "#2c5f8d",
  className = "",
  ariaLabel = "Faceted box plot showing distributions across panels"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 50 : 40,
      marginRight: 20,
      marginBottom: 100,
      marginLeft: 60,
      title,
      x: {
        label: xLabel,
        tickRotate: -45
      },
      y: {
        label: yLabel,
        grid: true
      },
      fx: {
        label: facetLabel
      },
      facet: {
        data,
        x: "facet",
        marginRight: 20
      },
      marks: [
        Plot24.boxY(data, {
          x: "category",
          y: "value",
          fx: "facet",
          fill: fillColor,
          fillOpacity: 0.4,
          stroke: strokeColor,
          strokeWidth: 1.5,
          r: 3
        }),
        Plot24.frame()
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, facetLabel, title, width, height, facetColumns, fillColor, strokeColor, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function BoxPlotFacetedGrouped({
  data,
  facetLabel = "Facet",
  categoryLabel = "Category",
  groupLabel = "Group",
  yLabel = "Value",
  title,
  width = 1200,
  height = 500,
  colorScheme = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3"],
  className = "",
  ariaLabel = "Faceted and grouped box plot showing distributions across panels with side-by-side groups"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const transformedData = data.map((d) => ({
      ...d,
      compoundCategory: `${d.category}__${d.group}`
      // Unique key for side-by-side boxes
    }));
    const categories = [...new Set(data.map((d) => d.category))];
    const groups = [...new Set(data.map((d) => d.group))];
    const xDomain = categories.flatMap(
      (cat) => groups.map((grp) => `${cat}__${grp}`)
    );
    const middleGroupIndex = Math.ceil((groups.length - 1) / 2);
    const tickValues = categories.flatMap((cat) => `${cat}__${groups[middleGroupIndex]}`);
    const tickFormat = (d) => d.split("__")[0];
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 50 : 40,
      marginRight: 20,
      marginBottom: 100,
      marginLeft: 60,
      title,
      fx: {
        label: facetLabel,
        // Facet panels
        padding: 0.1
      },
      x: {
        label: categoryLabel,
        // Categories within each panel
        domain: xDomain,
        ticks: tickValues,
        tickFormat,
        tickSize: 0
        // Remove tick marks
      },
      y: {
        label: yLabel,
        grid: true
      },
      color: {
        legend: true,
        label: groupLabel,
        domain: [...new Set(data.map((d) => d.group))],
        range: colorScheme
      },
      marks: [
        Plot24.boxY(transformedData, {
          x: "compoundCategory",
          // Compound key for side-by-side positioning
          y: "value",
          fx: "facet",
          // Facet by region/panel dimension
          fill: "group",
          fillOpacity: 0.4,
          stroke: "group",
          strokeWidth: 1.5,
          r: 3
        }),
        Plot24.frame()
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, facetLabel, categoryLabel, yLabel, groupLabel, title, width, height, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function DistributionPlot({
  data,
  xLabel = "Value",
  title,
  width = 640,
  height = 400,
  showHistogram = true,
  showDensity = true,
  showRug = false,
  showMean = false,
  showMedian = false,
  binCount = 20,
  fillColor = "#3b82f6",
  densityColor = "#ef4444",
  meanColor = "#22c55e",
  medianColor = "#f97316",
  groupColors,
  className = "",
  ariaLabel = "Distribution plot showing data distribution"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const hasGroups = data.some((d) => d.group !== void 0);
    const groups = hasGroups ? Array.from(new Set(data.map((d) => d.group).filter(Boolean))) : [void 0];
    const marks = [];
    const defaultColors = ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#eab308", "#6366f1", "#14b8a6"];
    if (hasGroups) {
      groups.forEach((group, i) => {
        const groupData = data.filter((d) => d.group === group);
        const color = groupColors?.[group] || defaultColors[i % defaultColors.length];
        if (showHistogram) {
          marks.push(
            Plot24.rectY(
              groupData,
              Plot24.binX(
                { y: "count" },
                {
                  x: "value",
                  fill: color,
                  fillOpacity: 0.5,
                  thresholds: binCount
                }
              )
            )
          );
        }
        if (showDensity) {
          marks.push(
            Plot24.density(
              groupData,
              {
                x: "value",
                fill: color,
                fillOpacity: 0.2,
                stroke: color,
                strokeWidth: 2
              }
            )
          );
        }
        if (showRug) {
          marks.push(
            Plot24.tickX(groupData, {
              x: "value",
              stroke: color,
              strokeOpacity: 0.3
            })
          );
        }
        if (showMean) {
          const mean3 = groupData.reduce((sum, d) => sum + d.value, 0) / groupData.length;
          marks.push(
            Plot24.ruleX([mean3], {
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: "4,4"
            })
          );
        }
        if (showMedian) {
          const sorted = [...groupData].sort((a, b) => a.value - b.value);
          const median2 = sorted[Math.floor(sorted.length / 2)]?.value || 0;
          marks.push(
            Plot24.ruleX([median2], {
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: "2,2"
            })
          );
        }
      });
    } else {
      if (showHistogram) {
        marks.push(
          Plot24.rectY(
            data,
            Plot24.binX(
              { y: "count" },
              {
                x: "value",
                fill: fillColor,
                fillOpacity: 0.7,
                thresholds: binCount
              }
            )
          )
        );
      }
      if (showDensity) {
        marks.push(
          Plot24.density(
            data,
            {
              x: "value",
              fill: densityColor,
              fillOpacity: 0.2,
              stroke: densityColor,
              strokeWidth: 2
            }
          )
        );
      }
      if (showRug) {
        marks.push(
          Plot24.tickX(data, {
            x: "value",
            stroke: fillColor,
            strokeOpacity: 0.5
          })
        );
      }
      if (showMean) {
        const mean3 = data.reduce((sum, d) => sum + d.value, 0) / data.length;
        marks.push(
          Plot24.ruleX([mean3], {
            stroke: meanColor,
            strokeWidth: 2,
            strokeDasharray: "4,4"
          })
        );
      }
      if (showMedian) {
        const sorted = [...data].sort((a, b) => a.value - b.value);
        const median2 = sorted[Math.floor(sorted.length / 2)]?.value || 0;
        marks.push(
          Plot24.ruleX([median2], {
            stroke: medianColor,
            strokeWidth: 2,
            strokeDasharray: "2,2"
          })
        );
      }
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 40,
      marginLeft: 50,
      title,
      x: {
        label: xLabel,
        grid: true
      },
      y: {
        label: showDensity && !showHistogram ? "Density" : "Count",
        grid: true
      },
      marks
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, title, width, height, showHistogram, showDensity, showRug, showMean, showMedian, binCount, fillColor, densityColor, meanColor, medianColor, groupColors, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function RegressionPlot({
  data,
  xLabel = "X",
  yLabel = "Y",
  title,
  width = 640,
  height = 400,
  method = "linear",
  degree = 2,
  showConfidence = true,
  confidenceLevel = 0.95,
  showRSquared = false,
  pointColor = "#3b82f6",
  lineColor = "#ef4444",
  groupColors,
  className = "",
  ariaLabel = "Regression plot showing relationship between variables"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    let plotData = data;
    if (data.length > 1e4) {
      const sampleRate = 1e4 / data.length;
      plotData = data.filter(() => Math.random() < sampleRate);
    }
    const marks = [];
    const defaultColors = ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#06b6d4", "#eab308", "#6366f1", "#14b8a6"];
    const hasGroups = plotData.some((d) => d.group !== void 0);
    if (hasGroups) {
      const groups = Array.from(new Set(plotData.map((d) => d.group).filter(Boolean)));
      groups.forEach((group, i) => {
        const groupData = plotData.filter((d) => d.group === group);
        const color = groupColors?.[group] || defaultColors[i % defaultColors.length];
        marks.push(
          Plot24.dot(groupData, {
            x: "x",
            y: "y",
            fill: color,
            fillOpacity: 0.6,
            r: 3
          })
        );
        if (method === "linear") {
          marks.push(
            Plot24.linearRegressionY(groupData, {
              x: "x",
              y: "y",
              stroke: color,
              strokeWidth: 2,
              ci: showConfidence ? confidenceLevel : void 0
            })
          );
        } else if (method === "loess") {
          marks.push(
            Plot24.line(groupData, {
              x: "x",
              y: "y",
              stroke: color,
              strokeWidth: 2,
              curve: "monotone-x"
            })
          );
        }
      });
    } else {
      marks.push(
        Plot24.dot(plotData, {
          x: "x",
          y: "y",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 3
        })
      );
      if (method === "linear") {
        marks.push(
          Plot24.linearRegressionY(plotData, {
            x: "x",
            y: "y",
            stroke: lineColor,
            strokeWidth: 2,
            ci: showConfidence ? confidenceLevel : void 0
          })
        );
      } else if (method === "loess") {
        marks.push(
          Plot24.line(
            plotData,
            Plot24.windowY({
              k: Math.max(7, Math.floor(plotData.length / 20)),
              x: "x",
              y: "y",
              stroke: lineColor,
              strokeWidth: 2
            })
          )
        );
      } else if (method === "polynomial") {
        marks.push(
          Plot24.line(
            plotData,
            Plot24.windowY({
              k: Math.max(7, Math.floor(plotData.length / 10)),
              x: "x",
              y: "y",
              stroke: lineColor,
              strokeWidth: 2
            })
          )
        );
      }
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 40,
      marginLeft: 50,
      title,
      x: {
        label: xLabel,
        grid: true
      },
      y: {
        label: yLabel,
        grid: true
      },
      marks
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    if (showRSquared && !hasGroups) {
      const xMean = plotData.reduce((sum, d) => sum + d.x, 0) / plotData.length;
      const yMean = plotData.reduce((sum, d) => sum + d.y, 0) / plotData.length;
      const xVariance = plotData.reduce((sum, d) => sum + Math.pow(d.x - xMean, 2), 0);
      const yVariance = plotData.reduce((sum, d) => sum + Math.pow(d.y - yMean, 2), 0);
      const covariance = plotData.reduce((sum, d) => sum + (d.x - xMean) * (d.y - yMean), 0);
      const rSquared = Math.pow(covariance, 2) / (xVariance * yVariance);
      const rText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      rText.setAttribute("x", String(width - 80));
      rText.setAttribute("y", "30");
      rText.setAttribute("text-anchor", "start");
      rText.setAttribute("font-size", "14");
      rText.setAttribute("fill", "#666");
      rText.textContent = `R\xB2 = ${rSquared.toFixed(3)}`;
      plot34.appendChild(rText);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, method, degree, showConfidence, confidenceLevel, showRSquared, pointColor, lineColor, groupColors, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function QQPlot({
  data,
  xLabel = "Theoretical Quantiles",
  yLabel = "Sample Quantiles",
  title,
  width = 800,
  height = 500,
  pointColor = "#3b82f6",
  lineColor = "#ef4444",
  className = "",
  ariaLabel = "Q-Q plot for normality testing"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;
    const qqData = sortedData.map((value, i) => {
      const p = (i + 0.5) / n;
      const theoretical = Math.sqrt(2) * inverseErf(2 * p - 1);
      return {
        theoretical,
        sample: value
      };
    });
    const minVal = Math.min(...qqData.map((d) => d.theoretical));
    const maxVal = Math.max(...qqData.map((d) => d.theoretical));
    const sampleMin = Math.min(...sortedData);
    const sampleMax = Math.max(...sortedData);
    const slope = (sampleMax - sampleMin) / (maxVal - minVal);
    const intercept = sampleMin - slope * minVal;
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 60,
      marginLeft: 60,
      title,
      x: {
        label: xLabel,
        grid: true
      },
      y: {
        label: yLabel,
        grid: true
      },
      marks: [
        // Reference line (theoretical normal)
        Plot24.line(
          [
            { x: minVal, y: intercept + slope * minVal },
            { x: maxVal, y: intercept + slope * maxVal }
          ],
          {
            x: "x",
            y: "y",
            stroke: lineColor,
            strokeWidth: 2,
            strokeDasharray: "5,5"
          }
        ),
        // Q-Q points
        Plot24.dot(qqData, {
          x: "theoretical",
          y: "sample",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
        })
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, pointColor, lineColor, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function inverseErf(x) {
  const a = 0.147;
  const b = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
  const sqrt1 = Math.sqrt(b * b - Math.log(1 - x * x) / a);
  const sqrt2 = Math.sqrt(sqrt1 - b);
  return sqrt2 * Math.sign(x);
}
function ResidualPlot({
  data,
  xLabel = "Fitted Values",
  yLabel = "Residuals",
  title,
  width = 800,
  height = 500,
  pointColor = "#3b82f6",
  lineColor = "#ef4444",
  className = "",
  ariaLabel = "Residual plot for regression diagnostics"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const residualData = data.map((d) => {
      const fitted = intercept + slope * d.x;
      const residual = d.y - fitted;
      return { fitted, residual };
    });
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 60,
      marginLeft: 60,
      title,
      x: {
        label: xLabel,
        grid: true
      },
      y: {
        label: yLabel,
        grid: true
      },
      marks: [
        // Zero reference line
        Plot24.ruleY([0], {
          stroke: lineColor,
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),
        // Residual points
        Plot24.dot(residualData, {
          x: "fitted",
          y: "residual",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
        })
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, pointColor, lineColor, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function SwarmPlot({
  data,
  xLabel = "Category",
  yLabel = "Value",
  title,
  width = 800,
  height = 500,
  dotRadius = 4,
  dotOpacity = 0.7,
  colorScheme,
  className = "",
  ariaLabel = "Swarm plot showing distribution by category"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 80,
      marginLeft: 60,
      title,
      x: {
        label: xLabel,
        tickRotate: -45
      },
      y: {
        label: yLabel,
        grid: true
      },
      color: {
        legend: true,
        ...colorScheme && { scheme: colorScheme }
      },
      marks: [
        // Swarm plot using dodge transform
        Plot24.dot(
          data,
          Plot24.dodgeX("middle", {
            x: "category",
            y: "value",
            fill: "category",
            fillOpacity: dotOpacity,
            r: dotRadius,
            stroke: "#666",
            strokeWidth: 0.5
          })
        )
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, dotRadius, dotOpacity, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function StripPlot({
  data,
  xLabel = "Category",
  yLabel = "Value",
  title,
  width = 800,
  height = 500,
  dotRadius = 4,
  dotOpacity = 0.6,
  jitterWidth = 60,
  colorScheme,
  className = "",
  ariaLabel = "Strip plot showing distribution by category"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 80,
      marginLeft: 60,
      title,
      x: {
        label: xLabel,
        tickRotate: -45
      },
      y: {
        label: yLabel,
        grid: true
      },
      color: {
        legend: true,
        ...colorScheme && { scheme: colorScheme }
      },
      marks: [
        // Strip plot with jitter
        Plot24.dot(data, {
          x: "category",
          y: "value",
          fill: "category",
          fillOpacity: dotOpacity,
          r: dotRadius,
          dx: () => (Math.random() - 0.5) * jitterWidth
        })
      ]
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, dotRadius, dotOpacity, jitterWidth, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function ForestPlot({
  data,
  title,
  width = 640,
  height = 400,
  sortBy = "coef",
  showPValues = false,
  showZeroLine = true,
  positiveColor = "#22c55e",
  negativeColor = "#ef4444",
  nonsigColor = "#94a3b8",
  significanceLevel = 0.05,
  className = "",
  ariaLabel = "Forest plot showing regression coefficients with confidence intervals"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    let sortedData = [...data];
    if (sortBy === "coef") {
      sortedData.sort((a, b) => Math.abs(b.coef) - Math.abs(a.coef));
    } else if (sortBy === "pvalue" && data.every((d) => d.pvalue !== void 0)) {
      sortedData.sort((a, b) => (a.pvalue || 1) - (b.pvalue || 1));
    } else if (sortBy === "variable") {
      sortedData.sort((a, b) => a.variable.localeCompare(b.variable));
    }
    const getColor = (d) => {
      if (showPValues && d.pvalue !== void 0) {
        if (d.pvalue >= significanceLevel) return nonsigColor;
      }
      if (d.ci_lower < 0 && d.ci_upper > 0) return nonsigColor;
      return d.coef > 0 ? positiveColor : negativeColor;
    };
    const marks = [];
    if (showZeroLine) {
      marks.push(
        Plot24.ruleX([0], {
          stroke: "#000",
          strokeWidth: 2
        })
      );
    }
    marks.push(
      Plot24.ruleX(sortedData, {
        x1: "ci_lower",
        x2: "ci_upper",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot24.tickX(sortedData, {
        x: "ci_lower",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot24.tickX(sortedData, {
        x: "ci_upper",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot24.dot(sortedData, {
        x: "coef",
        y: "variable",
        fill: (d) => getColor(d),
        r: 5
      })
    );
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 40 : 20,
      marginRight: 20,
      marginBottom: 40,
      marginLeft: 150,
      // Extra space for variable names
      title,
      x: {
        label: "Coefficient",
        grid: true
      },
      y: {
        label: null,
        domain: sortedData.map((d) => d.variable)
      },
      marks
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    if (showPValues) {
      sortedData.forEach((d, i) => {
        if (d.pvalue !== void 0) {
          let stars = "";
          if (d.pvalue < 1e-3) stars = "***";
          else if (d.pvalue < 0.01) stars = "**";
          else if (d.pvalue < 0.05) stars = "*";
          if (stars) {
            const starText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            starText.setAttribute("x", String(width - 40));
            starText.setAttribute("y", String(60 + i * (height - 80) / sortedData.length));
            starText.setAttribute("text-anchor", "start");
            starText.setAttribute("font-size", "14");
            starText.setAttribute("fill", "#666");
            starText.textContent = stars;
            plot34.appendChild(starText);
          }
        }
      });
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, title, width, height, sortBy, showPValues, showZeroLine, positiveColor, negativeColor, nonsigColor, significanceLevel, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
var SplitBar = ({
  data,
  subcategories,
  width = 800,
  height = 750,
  colors = ["#e15759", "#59a14f"],
  categoryLabel = "",
  valueLabel = "",
  caption = "",
  sortBy = "overall",
  sortDirection = "descending",
  formatValue: formatValue2 = (v) => `${v.toFixed(1)}%`,
  className = "",
  marginLeft = 150,
  showValueLabels = true
}) => {
  const containerRef = React25.useRef(null);
  React25.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    if (subcategories.length !== 2) {
      console.error("SplitBar requires exactly 2 subcategories");
      return;
    }
    containerRef.current.innerHTML = "";
    let sortedData = [...data];
    if (sortBy === "overall") {
      sortedData.sort(
        (a, b) => sortDirection === "descending" ? b.overall - a.overall : a.overall - b.overall
      );
    } else if (sortBy === "category") {
      sortedData.sort(
        (a, b) => sortDirection === "descending" ? b.category.localeCompare(a.category) : a.category.localeCompare(b.category)
      );
    }
    const dotData = sortedData.flatMap(
      (d) => subcategories.map((subCat) => ({
        category: d.category,
        subcategory: subCat,
        value: typeof d[subCat] === "number" ? d[subCat] : null
      }))
    ).filter((d) => d.value !== null);
    const allValues = sortedData.flatMap(
      (d) => [d.overall, ...subcategories.map((s) => d[s])].filter(
        (v) => typeof v === "number"
      )
    );
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const plot34 = Plot24.plot({
      caption,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      color: {
        legend: true,
        domain: subcategories,
        range: colors
      },
      marginLeft,
      marginRight: 40,
      marginBottom: 60,
      width,
      height,
      clip: true,
      y: {
        label: categoryLabel,
        domain: sortedData.map((d) => d.category)
      },
      x: {
        label: valueLabel,
        domain: [minValue, maxValue],
        grid: true
      },
      marks: [
        // Background bars for overall values
        Plot24.barX(sortedData, {
          y: "category",
          x: "overall",
          fill: "#e4e4e4",
          title: (d) => `Overall: ${formatValue2(d.overall)}`
        }),
        // Dots for subcategory values
        Plot24.dot(dotData, {
          y: "category",
          x: "value",
          fill: "subcategory",
          r: 5,
          tip: true,
          title: (d) => `${d.subcategory}: ${formatValue2(d.value)}`
        }),
        // Value labels on bars
        ...showValueLabels ? [
          Plot24.text(sortedData, {
            y: "category",
            x: "overall",
            text: (d) => formatValue2(d.overall),
            dx: -25,
            fill: "black",
            fontSize: 9,
            fontWeight: "normal",
            textAnchor: "start"
          })
        ] : [],
        // Zero reference line
        Plot24.ruleX([minValue])
      ]
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34.remove();
    };
  }, [
    data,
    subcategories,
    width,
    height,
    colors,
    categoryLabel,
    valueLabel,
    caption,
    sortBy,
    sortDirection,
    formatValue2,
    marginLeft,
    showValueLabels
  ]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
};
var stat_splitbar_v1_default = SplitBar;
function DotPlot({
  data,
  x,
  y,
  fill,
  title,
  subtitle,
  xLabel,
  yLabel,
  radius = 4,
  fillOpacity = 0.7,
  width = 700,
  height = 300,
  marginLeft = 80,
  colorScheme,
  tipFormat,
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    let colorConfig = fill ? { legend: true } : void 0;
    if (fill && colorScheme) {
      if (Array.isArray(colorScheme)) {
        colorConfig = { ...colorConfig, range: colorScheme };
      } else {
        colorConfig = {
          ...colorConfig,
          domain: Object.keys(colorScheme),
          range: Object.values(colorScheme)
        };
      }
    }
    const plot34 = Plot24.plot({
      title,
      subtitle,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        label: xLabel || x,
        grid: true
      },
      y: {
        label: yLabel || y
      },
      color: colorConfig,
      marks: [
        Plot24.dot(data, {
          x,
          y,
          fill: fill || "currentColor",
          stroke: "white",
          strokeWidth: 1,
          r: radius,
          fillOpacity,
          title: tipFormat || ((d) => `${d[y]}: ${d[x]}`),
          tip: true
        }),
        Plot24.ruleX([0])
      ],
      width,
      height,
      marginLeft
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [data, x, y, fill, title, subtitle, xLabel, yLabel, radius, fillOpacity, width, height, marginLeft, colorScheme, tipFormat]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
var basic_dot_v1_default = DotPlot;
function BarChart({
  data,
  x,
  y,
  errorY,
  title,
  subtitle,
  caption,
  xLabel,
  yLabel,
  fill = "#708090",
  errorStroke = "#394E54",
  errorStrokeWidth = 2,
  width = 800,
  height = 400,
  marginBottom = 60,
  xTickRotate = 0,
  xTickFormat,
  xTicks,
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const marks = [
      // Main bar chart
      Plot24.barY(data, {
        x,
        y,
        fill
      })
    ];
    if (errorY) {
      marks.push(
        Plot24.ruleX(data, {
          x,
          y1: errorY.lower,
          y2: errorY.upper,
          stroke: errorStroke,
          strokeWidth: errorStrokeWidth
        })
      );
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginBottom,
      title,
      subtitle,
      caption,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        label: xLabel || x,
        tickRotate: xTickRotate,
        tickFormat: xTickFormat,
        tickSize: 5,
        labelOffset: 50,
        ...xTicks && { ticks: xTicks }
      },
      y: {
        label: yLabel || y,
        grid: true
      },
      marks
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [data, x, y, errorY, title, subtitle, caption, xLabel, yLabel, fill, errorStroke, errorStrokeWidth, width, height, marginBottom, xTickRotate, xTickFormat, xTicks]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
var basic_bar_v1_default = BarChart;
function Sparkline({
  data,
  variant = "line",
  width = 200,
  height = 50,
  showMinMax = false,
  positiveColor = "#22c55e",
  negativeColor = "#ef4444",
  neutralColor = "#6b7280",
  className = "",
  ariaLabel = "Sparkline chart"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const indexedData = data.map((value, index) => ({ index, value }));
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    let color = neutralColor;
    if (lastValue > firstValue) {
      color = positiveColor;
    } else if (lastValue < firstValue) {
      color = negativeColor;
    }
    const marks = [];
    if (variant === "line") {
      marks.push(
        Plot24.lineY(indexedData, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 2
        })
      );
    } else if (variant === "area") {
      marks.push(
        Plot24.areaY(indexedData, {
          x: "index",
          y: "value",
          fill: color,
          fillOpacity: 0.3,
          curve: "catmull-rom"
        }),
        Plot24.lineY(indexedData, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 1.5,
          curve: "catmull-rom"
        })
      );
    } else if (variant === "bar") {
      marks.push(
        Plot24.barY(indexedData, {
          x: "index",
          y: "value",
          fill: color,
          fillOpacity: 0.8
        })
      );
    }
    if (showMinMax) {
      const minValue = Math.min(...data);
      const maxValue = Math.max(...data);
      const minIndex = data.indexOf(minValue);
      const maxIndex = data.indexOf(maxValue);
      marks.push(
        Plot24.dot([{ index: minIndex, value: minValue }], {
          x: "index",
          y: "value",
          fill: negativeColor,
          r: 3,
          stroke: "white",
          strokeWidth: 1
        }),
        Plot24.dot([{ index: maxIndex, value: maxValue }], {
          x: "index",
          y: "value",
          fill: positiveColor,
          r: 3,
          stroke: "white",
          strokeWidth: 1
        })
      );
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: 5,
      marginRight: 5,
      marginBottom: 5,
      marginLeft: 5,
      x: {
        axis: null
      },
      y: {
        axis: null
      },
      marks
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [data, variant, width, height, showMinMax, positiveColor, negativeColor, neutralColor, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function SlopeChart({
  data,
  beforeKey,
  afterKey,
  labelKey,
  beforeLabel = "Before",
  afterLabel = "After",
  width = 800,
  height = 500,
  marginLeft = 100,
  marginRight = 100,
  marginTop = 40,
  marginBottom = 40,
  increaseColor = "#22c55e",
  decreaseColor = "#ef4444",
  noChangeColor = "#6b7280",
  title,
  subtitle,
  caption,
  dotSize = 4,
  strokeWidth = 2,
  showLabels = true,
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const longData = [];
    data.forEach((d) => {
      longData.push(
        { [labelKey]: d[labelKey], time: beforeLabel, value: d[beforeKey], change: d[afterKey] - d[beforeKey] },
        { [labelKey]: d[labelKey], time: afterLabel, value: d[afterKey], change: d[afterKey] - d[beforeKey] }
      );
    });
    const getColor = (change) => {
      if (change > 0) return increaseColor;
      if (change < 0) return decreaseColor;
      return noChangeColor;
    };
    const marks = [];
    marks.push(
      Plot24.line(longData, {
        x: "time",
        y: "value",
        z: labelKey,
        stroke: (d) => getColor(d.change),
        strokeWidth,
        title: (d) => `${d[labelKey]}: ${d.change > 0 ? "+" : ""}${d.change.toFixed(1)}`
      })
    );
    marks.push(
      Plot24.dot(longData, {
        x: "time",
        y: "value",
        fill: (d) => getColor(d.change),
        r: dotSize,
        title: (d) => `${d[labelKey]}: ${d.value.toFixed(1)}`
      })
    );
    if (showLabels) {
      const beforeData = data.map((d) => ({
        [labelKey]: d[labelKey],
        time: beforeLabel,
        value: d[beforeKey],
        change: d[afterKey] - d[beforeKey]
      }));
      marks.push(
        Plot24.text(beforeData, {
          x: "time",
          y: "value",
          text: labelKey,
          dx: -10,
          textAnchor: "end",
          fill: (d) => getColor(d.change),
          fontSize: 11
        })
      );
      const afterData = data.map((d) => ({
        [labelKey]: d[labelKey],
        time: afterLabel,
        value: d[afterKey],
        change: d[afterKey] - d[beforeKey]
      }));
      marks.push(
        Plot24.text(afterData, {
          x: "time",
          y: "value",
          text: (d) => d.value.toFixed(1),
          dx: 10,
          textAnchor: "start",
          fill: (d) => getColor(d.change),
          fontSize: 11,
          fontWeight: 600
        })
      );
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      title,
      subtitle,
      caption,
      x: {
        domain: [beforeLabel, afterLabel],
        label: null
      },
      y: {
        label: null,
        grid: true
      },
      marks
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [
    data,
    beforeKey,
    afterKey,
    labelKey,
    beforeLabel,
    afterLabel,
    width,
    height,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    increaseColor,
    decreaseColor,
    noChangeColor,
    title,
    subtitle,
    caption,
    dotSize,
    strokeWidth,
    showLabels
  ]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function BulletChart({
  title,
  value,
  target,
  ranges,
  width = 400,
  height = 80,
  valueColor = "#1e293b",
  targetColor = "#000000",
  showLabels = true,
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const sortedRanges = [...ranges].sort((a, b) => b.threshold - a.threshold);
    const maxValue = Math.max(
      target * 1.1,
      value * 1.1,
      ...sortedRanges.map((r) => r.threshold)
    );
    const marks = [];
    sortedRanges.forEach((range) => {
      marks.push(
        Plot24.barX([{ value: range.threshold }], {
          x: "value",
          fill: range.color,
          fillOpacity: 0.3,
          y: () => title,
          title: () => `${range.label}: ${range.threshold}`
        })
      );
    });
    marks.push(
      Plot24.barX([{ value }], {
        x: "value",
        fill: valueColor,
        y: () => title,
        insetTop: 15,
        insetBottom: 15,
        title: () => `Actual: ${value}`
      })
    );
    marks.push(
      Plot24.tickX([{ value: target }], {
        x: "value",
        y: () => title,
        stroke: targetColor,
        strokeWidth: 3,
        insetTop: 10,
        insetBottom: 10,
        title: () => `Target: ${target}`
      })
    );
    if (showLabels) {
      marks.push(
        Plot24.text([{ value, label: value.toString() }], {
          x: "value",
          y: () => title,
          text: "label",
          dx: 5,
          dy: -15,
          fontSize: 12,
          fontWeight: 600,
          fill: valueColor
        })
      );
      marks.push(
        Plot24.text([{ value: target, label: `Target: ${target}` }], {
          x: "value",
          y: () => title,
          text: "label",
          dx: 5,
          dy: 15,
          fontSize: 10,
          fill: targetColor
        })
      );
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginLeft: 100,
      marginRight: 60,
      marginTop: 10,
      marginBottom: 10,
      x: {
        domain: [0, maxValue],
        label: null,
        grid: true
      },
      y: {
        domain: [title],
        label: null
      },
      marks
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [title, value, target, ranges, width, height, valueColor, targetColor, showLabels]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function DivergingBar({
  data,
  categoryKey,
  positiveKey,
  negativeKey,
  width = 800,
  height = 400,
  marginLeft = 120,
  marginRight = 60,
  marginTop = 40,
  marginBottom = 40,
  positiveColor = "#22c55e",
  negativeColor = "#ef4444",
  positiveLabel = "Positive",
  negativeLabel = "Negative",
  title,
  subtitle,
  caption,
  sortByNet = true,
  showZeroLine = true,
  className = ""
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    let processedData = data.map((d) => ({
      ...d,
      net: d[positiveKey] + d[negativeKey]
      // negative values should already be negative
    }));
    if (sortByNet) {
      processedData = [...processedData].sort((a, b) => b.net - a.net);
    }
    const marks = [];
    if (showZeroLine) {
      marks.push(
        Plot24.ruleX([0], {
          stroke: "#000",
          strokeWidth: 2
        })
      );
    }
    marks.push(
      Plot24.barX(processedData, {
        y: categoryKey,
        x: positiveKey,
        fill: positiveColor,
        title: (d) => `${d[categoryKey]}: ${d[positiveKey]}% ${positiveLabel}`
      })
    );
    marks.push(
      Plot24.barX(processedData, {
        y: categoryKey,
        x: negativeKey,
        fill: negativeColor,
        title: (d) => `${d[categoryKey]}: ${Math.abs(d[negativeKey])}% ${negativeLabel}`
      })
    );
    const plot34 = Plot24.plot({
      width,
      height,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      title,
      subtitle,
      caption,
      y: {
        label: null,
        domain: processedData.map((d) => d[categoryKey])
      },
      x: {
        label: "\u2190 " + negativeLabel + "     |     " + positiveLabel + " \u2192",
        grid: true,
        tickFormat: (d) => Math.abs(d) + "%"
      },
      marks
    });
    containerRef.current.appendChild(plot34);
    return () => {
      plot34?.remove();
    };
  }, [
    data,
    categoryKey,
    positiveKey,
    negativeKey,
    width,
    height,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    positiveColor,
    negativeColor,
    positiveLabel,
    negativeLabel,
    title,
    subtitle,
    caption,
    sortByNet,
    showZeroLine
  ]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
function FacetedPlot({
  data,
  x,
  y,
  facetX,
  facetY,
  mark = "dot",
  xLabel,
  yLabel,
  title,
  width = 900,
  height = 600,
  sharedScales = true,
  color = "#3b82f6",
  groupBy,
  className = "",
  ariaLabel = "Faceted plot showing comparative analysis across groups"
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    let plotData = data;
    if (!facetX && !facetY) {
      if (data.length > 1e4) {
        const sampleRate = 1e4 / data.length;
        plotData = data.filter(() => Math.random() < sampleRate);
      }
    } else {
      const facetKey = facetX || facetY;
      if (facetKey) {
        const groups = Array.from(new Set(data.map((d) => d[facetKey])));
        const maxPerGroup = Math.floor(1e4 / groups.length);
        plotData = [];
        groups.forEach((group) => {
          let groupData = data.filter((d) => d[facetKey] === group);
          if (groupData.length > maxPerGroup) {
            const sampleRate = maxPerGroup / groupData.length;
            groupData = groupData.filter(() => Math.random() < sampleRate);
          }
          plotData.push(...groupData);
        });
      }
    }
    let marks = [];
    const baseOptions = {
      x,
      y,
      ...facetX && { fx: facetX },
      ...facetY && { fy: facetY }
    };
    if (groupBy) {
      baseOptions.stroke = groupBy;
      baseOptions.fill = groupBy;
    } else {
      if (mark === "line" || mark === "area") {
        baseOptions.stroke = color;
      } else {
        baseOptions.fill = color;
      }
    }
    switch (mark) {
      case "dot":
        marks.push(
          Plot24.dot(plotData, {
            ...baseOptions,
            r: 3,
            fillOpacity: 0.6
          })
        );
        break;
      case "line":
        marks.push(
          Plot24.line(plotData, {
            ...baseOptions,
            strokeWidth: 2,
            ...groupBy && { z: groupBy }
          })
        );
        break;
      case "bar":
        marks.push(
          Plot24.barY(plotData, {
            ...baseOptions
          })
        );
        break;
      case "area":
        marks.push(
          Plot24.areaY(plotData, {
            ...baseOptions,
            fillOpacity: 0.5,
            ...groupBy && { z: groupBy }
          })
        );
        break;
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginTop: title ? 50 : 30,
      marginRight: 20,
      marginBottom: 50,
      marginLeft: 60,
      title,
      x: {
        label: xLabel || x,
        grid: true
      },
      y: {
        label: yLabel || y,
        grid: true
      },
      ...facetX && {
        fx: {
          label: facetX,
          ...sharedScales ? {} : { domain: void 0 }
        }
      },
      ...facetY && {
        fy: {
          label: facetY,
          ...sharedScales ? {} : { domain: void 0 }
        }
      },
      marks
    });
    plot34.setAttribute("role", "img");
    plot34.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot34);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, x, y, facetX, facetY, mark, xLabel, yLabel, title, width, height, sharedScales, color, groupBy, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}
var CorrelationHeatmap = ({
  data,
  width = 600,
  height = 600,
  title = "County Health Correlations",
  subtitle = "Focus on variables focused on adjusted prevalence",
  caption = "Source: CDC"
}) => {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!data || !containerRef.current) return;
    containerRef.current.innerHTML = "";
    const variables = [...new Set(data.map((d) => d.x))];
    const convertedData = data.filter((d) => variables.indexOf(d.y) > variables.indexOf(d.x));
    const cleanVariableName = (name) => {
      return name.replace("_AdjPrev", "").replace("_", " ").toUpperCase();
    };
    const xDomain = [...new Set(convertedData.map((d) => d.x))];
    const yDomain = [...new Set(convertedData.map((d) => d.y))].reverse();
    const plot34 = Plot24.plot({
      title,
      subtitle,
      caption,
      padding: 0,
      marginLeft: 120,
      marginTop: 120,
      marginRight: 60,
      marginBottom: 60,
      grid: true,
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        axis: "top",
        label: "",
        domain: xDomain,
        tickRotate: -45,
        tickFormat: cleanVariableName
      },
      y: {
        label: "",
        domain: yDomain,
        tickFormat: cleanVariableName
      },
      color: {
        type: "linear",
        scheme: "RdBu",
        domain: [-1, 1],
        legend: true,
        label: "Correlation coefficient"
      },
      marks: [
        // Cell background
        Plot24.cell(convertedData, {
          x: "x",
          y: "y",
          fill: "value",
          inset: 0.5,
          tip: true,
          title: (d) => `${cleanVariableName(d.x)} vs ${cleanVariableName(d.y)}: ${d.value.toFixed(3)}`
        }),
        // Text overlay
        Plot24.text(convertedData, {
          x: "x",
          y: "y",
          text: (d) => d.value.toFixed(2),
          fill: (d) => Math.abs(d.value) > 0.5 ? "white" : "black",
          fontSize: 10,
          fontWeight: "bold"
        })
      ],
      width,
      height
    });
    containerRef.current.appendChild(plot34);
    return () => {
      if (plot34) plot34.remove();
    };
  }, [data, width, height, title, subtitle, caption]);
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsx("div", { ref: containerRef, className: "flex justify-center" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 text-sm text-gray-600 text-center", children: [
      /* @__PURE__ */ jsx("p", { children: "Correlation matrix showing relationships between health outcome variables." }),
      /* @__PURE__ */ jsx("p", { children: "Values range from -1 (strong negative correlation) to +1 (strong positive correlation)." })
    ] })
  ] });
};
var CorrelationHeatmap_default = CorrelationHeatmap;
var HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });
function PcaPlot() {
  const [Highcharts, setHighcharts] = useState(null);
  useEffect(() => {
    import('highcharts').then((HighchartsModule) => {
      setHighcharts(HighchartsModule.default);
    });
  }, []);
  if (!Highcharts) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-96", children: "Loading chart..." });
  }
  const pcadata = [
    {
      x: 0.678,
      y: 0.278,
      lab: "log_pd",
      col_var: "Active",
      type_var: "arrow",
      key_var: "log_pd",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> log_pd<br /> <strong>Axis 1 :</strong> 0.678<br /> <strong>Axis 2 :</strong> 0.278<br /> <strong>Squared cosinus:</strong> 0.536<br /> <strong>Contribution:</strong> 11.354<br />"
    },
    {
      x: -0.731,
      y: 0.285,
      lab: "per_white",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_white",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_white<br /> <strong>Axis 1 :</strong> -0.731<br /> <strong>Axis 2 :</strong> 0.285<br /> <strong>Squared cosinus:</strong> 0.615<br /> <strong>Contribution:</strong> 12.95<br />"
    },
    {
      x: 0.217,
      y: -0.439,
      lab: "per_unemployed",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_unemployed",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_unemployed<br /> <strong>Axis 1 :</strong> 0.217<br /> <strong>Axis 2 :</strong> -0.439<br /> <strong>Squared cosinus:</strong> 0.24<br /> <strong>Contribution:</strong> 6.67<br />"
    },
    {
      x: 0.278,
      y: -0.655,
      lab: "per_poverty",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_poverty",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_poverty<br /> <strong>Axis 1 :</strong> 0.278<br /> <strong>Axis 2 :</strong> -0.655<br /> <strong>Squared cosinus:</strong> 0.505<br /> <strong>Contribution:</strong> 14.268<br />"
    },
    {
      x: -0.489,
      y: 0.39,
      lab: "per_married",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_married",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_married<br /> <strong>Axis 1 :</strong> -0.489<br /> <strong>Axis 2 :</strong> 0.39<br /> <strong>Squared cosinus:</strong> 0.391<br /> <strong>Contribution:</strong> 9.237<br />"
    },
    {
      x: 0.53,
      y: -0.055,
      lab: "per_hispanic",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_hispanic",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_hispanic<br /> <strong>Axis 1 :</strong> 0.53<br /> <strong>Axis 2 :</strong> -0.055<br /> <strong>Squared cosinus:</strong> 0.284<br /> <strong>Contribution:</strong> 5.628<br />"
    },
    {
      x: 0.444,
      y: -0.174,
      lab: "per_hh_withkids_under18",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_hh_withkids_under18",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_hh_withkids_under18<br /> <strong>Axis 1 :</strong> 0.444<br /> <strong>Axis 2 :</strong> -0.174<br /> <strong>Squared cosinus:</strong> 0.227<br /> <strong>Contribution:</strong> 4.793<br />"
    },
    {
      x: 0.72,
      y: 0.309,
      lab: "per_foreign_born",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_foreign_born",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_foreign_born<br /> <strong>Axis 1 :</strong> 0.72<br /> <strong>Axis 2 :</strong> 0.309<br /> <strong>Squared cosinus:</strong> 0.614<br /> <strong>Contribution:</strong> 13.059<br />"
    },
    {
      x: 0.158,
      y: 0.712,
      lab: "per_college_above",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_college_above",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_college_above<br /> <strong>Axis 1 :</strong> 0.158<br /> <strong>Axis 2 :</strong> 0.712<br /> <strong>Squared cosinus:</strong> 0.532<br /> <strong>Contribution:</strong> 15.564<br />"
    },
    {
      x: 0.466,
      y: -0.381,
      lab: "per_black",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_black",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_black<br /> <strong>Axis 1 :</strong> 0.466<br /> <strong>Axis 2 :</strong> -0.381<br /> <strong>Squared cosinus:</strong> 0.362<br /> <strong>Contribution:</strong> 8.606<br />"
    },
    {
      x: 0.565,
      y: 0.465,
      lab: "per_asian",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_asian",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_asian<br /> <strong>Axis 1 :</strong> 0.565<br /> <strong>Axis 2 :</strong> 0.465<br /> <strong>Squared cosinus:</strong> 0.535<br /> <strong>Contribution:</strong> 12.716<br />"
    },
    {
      x: -0.547,
      y: 0.168,
      lab: "per_65_over",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_65_over",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_65_over<br /> <strong>Axis 1 :</strong> -0.547<br /> <strong>Axis 2 :</strong> 0.168<br /> <strong>Squared cosinus:</strong> 0.328<br /> <strong>Contribution:</strong> 6.749<br />"
    },
    {
      x: 0.12,
      y: 0.819,
      lab: "median_income",
      col_var: "Active",
      type_var: "arrow",
      key_var: "median_income",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> median_income<br /> <strong>Axis 1 :</strong> 0.12<br /> <strong>Axis 2 :</strong> 0.819<br /> <strong>Squared cosinus:</strong> 0.685<br /> <strong>Contribution:</strong> 20.25<br />"
    },
    {
      x: -0.643,
      y: 0.258,
      lab: "median_age",
      col_var: "Active",
      type_var: "arrow",
      key_var: "median_age",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> median_age<br /> <strong>Axis 1 :</strong> -0.643<br /> <strong>Axis 2 :</strong> 0.258<br /> <strong>Squared cosinus:</strong> 0.479<br /> <strong>Contribution:</strong> 10.128<br />"
    },
    {
      x: 0.465,
      y: -0.17,
      lab: "hh_size",
      col_var: "Active",
      type_var: "arrow",
      key_var: "hh_size",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> hh_size<br /> <strong>Axis 1 :</strong> 0.465<br /> <strong>Axis 2 :</strong> -0.17<br /> <strong>Squared cosinus:</strong> 0.245<br /> <strong>Contribution:</strong> 5.127<br />"
    },
    {
      x: 0.781,
      y: -0.031,
      lab: "gini.simpson.race",
      col_var: "Active",
      type_var: "arrow",
      key_var: "gini.simpson.race",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> gini.simpson.race<br /> <strong>Axis 1 :</strong> 0.781<br /> <strong>Axis 2 :</strong> -0.031<br /> <strong>Squared cosinus:</strong> 0.611<br /> <strong>Contribution:</strong> 12.057<br />"
    },
    {
      x: 0.251,
      y: -0.062,
      lab: "gini",
      col_var: "Active",
      type_var: "arrow",
      key_var: "gini",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> gini<br /> <strong>Axis 1 :</strong> 0.251<br /> <strong>Axis 2 :</strong> -0.062<br /> <strong>Squared cosinus:</strong> 0.067<br /> <strong>Contribution:</strong> 1.359<br />"
    },
    {
      x: 0.338,
      y: 0.731,
      lab: "B25077_001",
      col_var: "Active",
      type_var: "arrow",
      key_var: "B25077_001",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> B25077_001<br /> <strong>Axis 1 :</strong> 0.338<br /> <strong>Axis 2 :</strong> 0.731<br /> <strong>Squared cosinus:</strong> 0.649<br /> <strong>Contribution:</strong> 18.151<br />"
    },
    {
      x: 0.652,
      y: 0.314,
      lab: "avg_commute_time",
      col_var: "Active",
      type_var: "arrow",
      key_var: "avg_commute_time",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> avg_commute_time<br /> <strong>Axis 1 :</strong> 0.652<br /> <strong>Axis 2 :</strong> 0.314<br /> <strong>Squared cosinus:</strong> 0.525<br /> <strong>Contribution:</strong> 11.332<br />"
    },
    {
      x: -0.203,
      y: -0.73,
      lab: "OBESITY_zip",
      col_var: "Supplementary",
      type_var: "arrow",
      key_var: "OBESITY_zip",
      tooltip_text: "<strong>Level:</strong> <br /> <strong>Variable:</strong> OBESITY_zip<br /> <strong>Axis 1 :</strong> -0.203<br /> <strong>Axis 2 :</strong> -0.73<br /> <strong>Squared cosinus:</strong> 0.574<br /> "
    }
  ];
  const seriesData = pcadata.map((o) => {
    return {
      name: o.lab,
      color: o.lab == "OBESITY_zip" ? "#FF0000" : "#b3b3b3",
      marker: { symbol: "triangle-down" },
      lineWidth: 1,
      data: [
        [0, 0],
        [o["x"], o["y"]]
      ]
    };
  });
  seriesData.push({
    data: [[0, 0]],
    marker: {
      radius: 260,
      lineColor: "#e4e4e4",
      fillColor: "transparent",
      lineWidth: 1,
      symbol: "circle"
    }
  });
  const chartOptions = {
    chart: {
      backgroundColor: "white",
      style: {
        fontFamily: "Inter, sans-serif"
      }
    },
    title: {
      text: ""
    },
    legend: { enabled: false },
    yAxis: {
      gridLineWidth: 0,
      min: -1,
      max: 1,
      title: {
        align: "high",
        text: "Axis 2 (17.69%)",
        style: { color: "#374151" }
      },
      labels: {
        style: { color: "#374151" }
      },
      plotLines: [
        {
          color: "#d1d5db",
          width: 1,
          value: 0,
          dashStyle: "dash"
        }
      ]
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          padding: 5,
          style: {
            color: "#374151",
            fontSize: "12px",
            fontWeight: "500"
          },
          formatter: function() {
            return this.y === 0 ? null : this.series.name;
          }
        }
      }
    },
    xAxis: {
      lineWidth: 1,
      min: -1,
      max: 1,
      title: {
        align: "high",
        text: "Axis 1 (26.68%)",
        style: { color: "#374151" }
      },
      labels: {
        style: { color: "#374151" }
      },
      plotLines: [
        {
          color: "#d1d5db",
          width: 1,
          value: 0,
          dashStyle: "dash"
        }
      ]
    },
    series: seriesData
  };
  return /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-full max-w-4xl", children: /* @__PURE__ */ jsx(
    HighchartsReact,
    {
      highcharts: Highcharts,
      containerProps: {
        style: { width: "100%", height: "700px" }
      },
      options: chartOptions
    }
  ) }) });
}
var OddsRatio = ({ data }) => {
  const observablePlotRef = useRef(null);
  const forestPlotRef = useRef(null);
  const dotPlotRef = useRef(null);
  const plotData = useMemo(() => Object.keys(data.odds_ratios).map((key) => ({
    Label: key.replace(/C\((.*?)\)\[T\.(.*?)\]/, "$1 $2").replace(/C\((.*?), Treatment\(.*?\)\)\[T\.(.*?)\]/, "$1 $2").replace(/:/g, " \xD7 "),
    // Replace interaction symbols
    OddsRatio: data.odds_ratios[key],
    LowerCI: data.conf_int_lower[key],
    UpperCI: data.conf_int_upper[key]
  })), [data]);
  useEffect(() => {
    if (!data) return;
    if (observablePlotRef.current) observablePlotRef.current.innerHTML = "";
    if (forestPlotRef.current) forestPlotRef.current.innerHTML = "";
    if (dotPlotRef.current) dotPlotRef.current.innerHTML = "";
    const observablePlot = Plot24.plot({
      marginLeft: 200,
      title: "Statistical Odds Ratios",
      subtitle: "Analysis of various factors affecting outcomes",
      caption: "Source: General Social Survey",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        grid: true,
        type: "log",
        label: "Odds Ratio",
        tickFormat: ","
      },
      y: {
        grid: true,
        label: "",
        domain: plotData.map((d) => d.Label)
      },
      marks: [
        Plot24.dot(plotData, {
          x: "OddsRatio",
          y: "Label",
          tip: {
            format: { fill: false, x: (d) => d.toFixed(2) }
          },
          fill: (d) => d.OddsRatio > 1 ? "green" : "red"
        }),
        Plot24.ruleY(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "green" : "red"
        }),
        Plot24.ruleX([1], {
          stroke: "black",
          strokeWidth: 0.5
        })
      ],
      width: 800,
      height: 500
    });
    const forestPlot = Plot24.plot({
      marginLeft: 220,
      title: "Forest Plot Analysis",
      subtitle: "Advanced statistical visualization with enhanced features",
      caption: "Source: General Social Survey",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        grid: true,
        type: "log",
        label: "Odds Ratio (log scale)",
        tickFormat: ".2f",
        domain: [0.3, 3]
      },
      y: {
        grid: true,
        label: "",
        domain: plotData.map((d) => d.Label).reverse()
        // Reverse for traditional forest plot order
      },
      marks: [
        // Confidence interval rectangles (for visual emphasis)
        Plot24.rect(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          fill: (d) => d.OddsRatio > 1 ? "#dcfce7" : "#fef2f2",
          fillOpacity: 0.3,
          ry: 3
        }),
        // Confidence interval lines
        Plot24.ruleY(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 3
        }),
        // End caps for confidence intervals
        Plot24.ruleY(plotData, {
          x: "LowerCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot24.ruleY(plotData, {
          x: "LowerCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        Plot24.ruleY(plotData, {
          x: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot24.ruleY(plotData, {
          x: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        // Central point estimates (squares for forest plots)
        Plot24.dot(plotData, {
          x: "OddsRatio",
          y: "Label",
          fill: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          stroke: "white",
          strokeWidth: 2,
          r: 6,
          symbol: "square",
          tip: {
            format: {
              fill: false,
              x: (d) => `OR: ${d.toFixed(3)}`
            }
          }
        }),
        // Reference line at OR = 1
        Plot24.ruleX([1], {
          stroke: "#374151",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      ],
      width: 800,
      height: 500
    });
    const dotPlot = Plot24.plot({
      marginLeft: 200,
      title: "Sized Dot Plot",
      subtitle: "Dot size reflects statistical significance",
      caption: "Source: General Social Survey",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        grid: true,
        type: "log",
        label: "Odds Ratio",
        tickFormat: ".2f"
      },
      y: {
        grid: true,
        label: "",
        domain: plotData.map((d) => d.Label)
      },
      marks: [
        // Confidence interval lines
        Plot24.ruleY(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          stroke: "#9ca3af",
          strokeWidth: 2
        }),
        // Main dots with size based on confidence interval width (inverse - smaller CI = larger dot)
        Plot24.dot(plotData, {
          x: "OddsRatio",
          y: "Label",
          r: (d) => Math.max(3, 15 - (d.UpperCI - d.LowerCI) * 5),
          // Smaller CI = larger dot
          fill: (d) => d.OddsRatio > 1 ? "#3b82f6" : "#ef4444",
          stroke: "white",
          strokeWidth: 1.5,
          fillOpacity: 0.8,
          tip: {
            format: {
              fill: false,
              x: (d) => `${d.toFixed(3)} [${plotData.find((p) => p.OddsRatio === d)?.LowerCI.toFixed(3)}, ${plotData.find((p) => p.OddsRatio === d)?.UpperCI.toFixed(3)}]`
            }
          }
        }),
        Plot24.ruleX([1], {
          stroke: "black",
          strokeWidth: 1
        })
      ],
      width: 800,
      height: 500
    });
    if (observablePlotRef.current) observablePlotRef.current.appendChild(observablePlot);
    if (forestPlotRef.current) forestPlotRef.current.appendChild(forestPlot);
    if (dotPlotRef.current) dotPlotRef.current.appendChild(dotPlot);
    return () => {
      observablePlot?.remove();
      forestPlot?.remove();
      dotPlot?.remove();
    };
  }, [data, plotData]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Statistical odds ratio analysis demonstrating multiple visualization approaches. Each method emphasizes different aspects of the statistical relationships and confidence intervals." }) }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Basic Odds Ratio Plot" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Standard odds ratio visualization with confidence intervals" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: observablePlotRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Features:" }),
          " Logarithmic scale, conditional coloring (red < 1, green > 1), interactive tooltips, confidence interval lines, null effect reference line"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Forest Plot Analysis" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Advanced forest plot with enhanced statistical visualization features" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: forestPlotRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Features:" }),
          " Square markers for point estimates, confidence interval rectangles, end caps on intervals, enhanced color coding, traditional forest plot layout"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Precision-Weighted Dot Plot" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Dot plot where marker size reflects statistical precision (inverse of confidence interval width)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: dotPlotRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Features:" }),
          " Size-encoded precision, larger dots indicate more precise estimates, confidence interval lines, statistical significance visual weighting"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Statistical Visualization Techniques" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Basic Odds Ratio" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Clear point estimates" }),
            /* @__PURE__ */ jsx("li", { children: "Confidence interval display" }),
            /* @__PURE__ */ jsx("li", { children: "Effect direction coding" }),
            /* @__PURE__ */ jsx("li", { children: "Reference line indication" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Forest Plot" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Meta-analysis standard" }),
            /* @__PURE__ */ jsx("li", { children: "Enhanced visual emphasis" }),
            /* @__PURE__ */ jsx("li", { children: "Professional presentation" }),
            /* @__PURE__ */ jsx("li", { children: "Multiple study comparison" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Precision Weighting" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Visual uncertainty encoding" }),
            /* @__PURE__ */ jsx("li", { children: "Statistical weight display" }),
            /* @__PURE__ */ jsx("li", { children: "Precision-based emphasis" }),
            /* @__PURE__ */ jsx("li", { children: "Quality assessment aid" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var OddsRatio_default = OddsRatio;
function HistogramObservable({
  data,
  width = 800,
  height = 500,
  xlabel = "Value",
  ylabel = "Frequency",
  title,
  bins = 20,
  showMean = true,
  showMedian = false
}) {
  const chartRef = useRef(null);
  useEffect(() => {
    if (!data.length || !chartRef.current) return;
    const meanValue = mean(data);
    const medianValue = median(data);
    const marks = [
      // Histogram
      Plot24.rectY(data, Plot24.binX({ y: "count" }, {
        x: (d) => d,
        thresholds: bins,
        fill: "hsl(var(--primary))",
        fillOpacity: 0.6,
        stroke: "hsl(var(--foreground))",
        strokeWidth: 1
      }))
    ];
    if (showMean && meanValue !== void 0) {
      marks.push(
        Plot24.ruleX([meanValue], {
          stroke: "hsl(var(--destructive))",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),
        Plot24.text([{ x: meanValue, y: 0 }], {
          x: "x",
          y: "y",
          text: () => [`Mean: ${meanValue.toFixed(2)}`],
          dy: -10,
          fill: "hsl(var(--destructive))",
          fontSize: 12
        })
      );
    }
    if (showMedian && medianValue !== void 0) {
      marks.push(
        Plot24.ruleX([medianValue], {
          stroke: "hsl(var(--chart-2))",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      );
    }
    const plot34 = Plot24.plot({
      width,
      height,
      marginLeft: 60,
      marginBottom: 60,
      x: { label: xlabel },
      y: { label: ylabel, grid: true },
      marks
    });
    chartRef.current.innerHTML = "";
    chartRef.current.appendChild(plot34);
    return () => plot34.remove();
  }, [data, width, height, xlabel, ylabel, bins, showMean, showMedian]);
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: title }),
    /* @__PURE__ */ jsx("div", { ref: chartRef }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxs("p", { children: [
      "Total observations: ",
      data.length,
      " \u2022 Bins: ",
      bins
    ] }) })
  ] });
}
var DensityPlot = ({ data }) => {
  const singleRef = useRef(null);
  const overlayRef = useRef(null);
  const mentalHealthData = useMemo(() => data.map((d, i) => ({
    MHLTH_AdjPrev: Math.random() * 20 + 10,
    // Random mental health rates between 10-30%
    population: d.population || Math.floor(Math.random() * 5e4) + 1e4
  })), [data]);
  const cleanData = useMemo(() => data.filter((d) => d.dir2020 !== void 0), [data]);
  useEffect(() => {
    if (!data || data.length === 0) return;
    if (singleRef.current) singleRef.current.innerHTML = "";
    if (overlayRef.current) overlayRef.current.innerHTML = "";
    const singlePlot = Plot24.plot({
      title: "Mental Health Distribution",
      subtitle: "Distribution by County",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      y: { grid: true, label: "Count" },
      x: { label: "Mental Health Rate (%)" },
      marks: [
        Plot24.areaY(mentalHealthData, Plot24.binX(
          { y: "count", filter: null },
          { x: "MHLTH_AdjPrev", fillOpacity: 0.3, fill: "#3b82f6" }
        )),
        Plot24.lineY(mentalHealthData, Plot24.binX(
          { y: "count", filter: null },
          { x: "MHLTH_AdjPrev", label: "Mental Health", tip: true, stroke: "#3b82f6", strokeWidth: 2 }
        )),
        Plot24.ruleY([0])
      ],
      width: 600,
      height: 400
    });
    const overlayPlot = Plot24.plot({
      title: "Obesity Distribution by Category",
      subtitle: "Overlaid density plots by demographic grouping",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      y: { grid: true, label: "Count" },
      x: { label: "Obesity Rate (%)" },
      marks: [
        Plot24.areaY(cleanData, Plot24.binX(
          { y: "count", filter: null },
          { x: "OBESITY_AdjPrev", fill: "dir2020", fillOpacity: 0.2 }
        )),
        Plot24.lineY(cleanData, Plot24.binX(
          { y: "count", filter: null },
          { x: "OBESITY_AdjPrev", stroke: "dir2020", tip: true, strokeWidth: 2 }
        )),
        Plot24.ruleY([0])
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 600,
      height: 400
    });
    if (singleRef.current) singleRef.current.appendChild(singlePlot);
    if (overlayRef.current) overlayRef.current.appendChild(overlayPlot);
    return () => {
      singlePlot?.remove();
      overlayPlot?.remove();
    };
  }, [data, mentalHealthData, cleanData]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Density plot analysis showing the distribution patterns of health metrics across counties. These visualizations reveal the shape, spread, and central tendencies of population health indicators." }) }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Single Distribution" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Distribution of mental health rates across counties" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: singleRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "This histogram shows the frequency distribution of mental health prevalence rates, with both area and line representations of the density. The combined area and line approach emphasizes both the overall distribution shape and precise bin boundaries." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Overlay Comparison" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Comparison of obesity rate distributions by demographic category" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: overlayRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Multiple density curves overlaid to compare obesity rate distributions across different demographic groups, allowing for direct comparison of patterns. This approach reveals differences in distribution shapes, central tendencies, and spread between groups." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Density Plot techniques" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Single Distribution" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Overall distribution shape" }),
            /* @__PURE__ */ jsx("li", { children: "Central tendency identification" }),
            /* @__PURE__ */ jsx("li", { children: "Spread and variability" }),
            /* @__PURE__ */ jsx("li", { children: "Outlier and skewness detection" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Overlay Comparison" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Group comparison analysis" }),
            /* @__PURE__ */ jsx("li", { children: "Distribution shape differences" }),
            /* @__PURE__ */ jsx("li", { children: "Relative positioning" }),
            /* @__PURE__ */ jsx("li", { children: "Population heterogeneity" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var stat_density_v1_default = DensityPlot;
var TOPOLOGY_BASE_URL = "https://ontopic-public-data.t3.storage.dev/geo";
var GeoDensityMap = ({
  data,
  valueKey,
  width = 960,
  height = 600,
  title = "Geographic Density Map",
  description,
  colorScheme = "puor",
  legendLabel = "Density"
}) => {
  const mapRef = useRef(null);
  const [us, setUs] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL}/us-albers-counties-10m.json`).then((response) => response.json()).then((topology) => {
      setUs(topology);
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading topology:", error);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!data || data.length === 0 || !us || loading) return;
    if (!mapRef.current) return;
    mapRef.current.innerHTML = "";
    const statemesh = topojson3.mesh(us, us.objects.states, (a, b) => a !== b);
    const nation = topojson3.feature(us, us.objects.nation);
    const countiesmesh = topojson3.mesh(us, us.objects.counties);
    const mapPlot = Plot24.plot({
      width,
      height,
      projection: "albers",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      color: {
        scheme: colorScheme,
        type: "quantile",
        n: 4,
        reverse: true,
        label: legendLabel,
        legend: true
      },
      marks: [
        Plot24.geo(countiesmesh, { strokeOpacity: 0.5 }),
        Plot24.geo(nation),
        Plot24.geo(statemesh, { strokeOpacity: 0.2 }),
        Plot24.density(data, {
          x: "longitude",
          y: "latitude",
          bandwidth: 10,
          fill: "density"
        })
      ]
    });
    mapRef.current.appendChild(mapPlot);
    return () => {
      mapPlot?.remove();
    };
  }, [data, width, height, us, loading, colorScheme, legendLabel]);
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: title }),
        description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: description })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center", style: { minHeight: `${height}px` }, children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: description })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { ref: mapRef, className: "flex justify-center" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Density map showing geographic concentration across locations. Darker areas indicate higher concentration of data points. State and county boundaries are overlaid for geographic reference." })
    ] })
  ] });
};
var GeoDensityMap_default = GeoDensityMap;
var TOPOLOGY_BASE_URL2 = "https://ontopic-public-data.t3.storage.dev/geo";
var ChoroplethMap = ({
  data = [],
  title = "US County Mental Health Prevalence",
  subtitle = "County-level mental health data from CDC",
  valueLabel = "Mental Health (% Poor Mental Health Days)",
  colorScheme = "blues"
}) => {
  const mapRef = useRef(null);
  const [countyData, setCountyData] = useState([]);
  const [us, setUs] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL2}/us-albers-counties-10m.json`).then((response) => response.json()).then((topology) => {
      setUs(topology);
    }).catch((error) => {
      console.error("Error loading topology:", error);
    });
  }, []);
  useEffect(() => {
    if (data.length > 0) {
      setCountyData(data);
      setLoading(false);
    } else {
      fetch("/data/county_sample.json").then((response) => response.json()).then((data2) => {
        setCountyData(data2);
        setLoading(false);
      }).catch((error) => {
        console.error("Error loading county data:", error);
        setLoading(false);
      });
    }
  }, [data]);
  useEffect(() => {
    if (loading || !countyData || countyData.length === 0 || !us) return;
    if (!mapRef.current) return;
    mapRef.current.innerHTML = "";
    try {
      const statemesh = topojson3.mesh(us, us.objects.states, (a, b) => a !== b);
      const nation = topojson3.feature(us, us.objects.nation);
      const countiesmesh = topojson3.mesh(us, us.objects.counties);
      const counties = topojson3.feature(us, us.objects.counties);
      const dataMap = new Map(countyData.map((d) => [d.FIPS, d.MHLTH_AdjPrev]));
      const populationMap = new Map(countyData.map((d) => [d.FIPS, d.population]));
      console.log(`Loaded ${countyData.length} counties, data map has ${dataMap.size} entries`);
      const colorConfig = {
        type: "quantile",
        n: 7,
        scheme: colorScheme,
        legend: true,
        label: valueLabel,
        tickFormat: ".1f"
      };
      const plot34 = Plot24.plot({
        title,
        subtitle,
        width: 960,
        height: 600,
        projection: "albers",
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif"
        },
        color: colorConfig,
        marks: [
          // County boundaries (light stroke)
          Plot24.geo(countiesmesh, {
            strokeOpacity: 0.3,
            stroke: "#ddd"
          }),
          // Counties with data (choropleth fill)
          Plot24.geo(counties.features, {
            fill: (d) => {
              const value = dataMap.get(d.id);
              return value !== void 0 ? value : null;
            },
            stroke: "white",
            strokeWidth: 0.5,
            tip: true,
            title: (d) => {
              const countyName = d.properties?.name || `County ${d.id}`;
              const value = dataMap.get(d.id);
              const population = populationMap.get(d.id);
              if (value !== void 0) {
                const popText = population ? `
Population: ${population.toLocaleString()}` : "";
                return `${countyName}
${valueLabel}: ${value.toFixed(1)}%${popText}`;
              }
              return `${countyName}
No data available`;
            }
          }),
          // Nation outline
          Plot24.geo(nation, {
            stroke: "black",
            strokeWidth: 1,
            fill: "none"
          }),
          // State boundaries (stronger stroke)
          Plot24.geo(statemesh, {
            stroke: "black",
            strokeOpacity: 0.5,
            strokeWidth: 0.5
          })
        ],
        marginLeft: 0,
        marginRight: 140
        // Space for legend
      });
      mapRef.current.appendChild(plot34);
      return () => {
        plot34?.remove();
      };
    } catch (error) {
      console.error("Error rendering choropleth map:", error);
      if (mapRef.current) {
        mapRef.current.innerHTML = `<div class="text-red-500 p-4">Error loading map: ${error}</div>`;
      }
    }
  }, [countyData, loading, title, subtitle, valueLabel, colorScheme, us]);
  if (loading || !us) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Loading county health data..." }) }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center", style: { minHeight: "600px" }, children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Interactive county-level choropleth map showing mental health prevalence across US counties. Colors represent different prevalence ranges using quantile scaling for optimal contrast. Data source: CDC Behavioral Risk Factor Surveillance System (BRFSS)." }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "County Mental Health Prevalence Map" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Percentage of adults reporting poor mental health for 14+ days per month" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: mapRef, className: "flex justify-center", style: { minHeight: "600px" } }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mt-4", children: [
          "This choropleth map uses quantile scaling to divide ",
          countyData.length,
          " counties into equal-sized groups, ensuring good color distribution across geographic regions. Hover over counties for detailed information including population data."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Choropleth Map Features" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Color Encoding" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Quantile-based color scaling" }),
            /* @__PURE__ */ jsx("li", { children: "7 color gradations for nuance" }),
            /* @__PURE__ */ jsx("li", { children: "Interactive legend" }),
            /* @__PURE__ */ jsx("li", { children: "Customizable color schemes" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Geographic Features" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "County-level detail" }),
            /* @__PURE__ */ jsx("li", { children: "State boundary overlay" }),
            /* @__PURE__ */ jsx("li", { children: "Albers projection for accuracy" }),
            /* @__PURE__ */ jsx("li", { children: "Clean boundary styling" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Interactivity" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Hover tooltips with details" }),
            /* @__PURE__ */ jsx("li", { children: "County names and values" }),
            /* @__PURE__ */ jsx("li", { children: "Responsive design" }),
            /* @__PURE__ */ jsx("li", { children: "Data-driven styling" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var ChoroplethMap_default = ChoroplethMap;
var TOPOLOGY_BASE_URL3 = "https://ontopic-public-data.t3.storage.dev/geo";
var EuropeMap = ({
  data = [],
  title = "European Economic Data",
  subtitle = "GDP per capita by country (2023)",
  valueLabel = "GDP per capita (thousands USD)",
  colorScheme = "blues"
}) => {
  const mapRef = useRef(null);
  const [countryData, setCountryData] = useState([]);
  const [europe, setEurope] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL3}/europe.json`).then((response) => response.json()).then((topology) => {
      setEurope(topology);
    }).catch((error) => {
      console.error("Error loading topology:", error);
    });
  }, []);
  const sampleData = useMemo(() => [
    { id: "DE", name: "Germany", value: 56.2, population: 8324e4 },
    { id: "FR", name: "France", value: 47.3, population: 6739e4 },
    { id: "IT", name: "Italy", value: 39.1, population: 5955e4 },
    { id: "ES", name: "Spain", value: 31.8, population: 4735e4 },
    { id: "PL", name: "Poland", value: 17.9, population: 3797e4 },
    { id: "NL", name: "Netherlands", value: 58.4, population: 1744e4 },
    { id: "BE", name: "Belgium", value: 51.7, population: 1159e4 },
    { id: "AT", name: "Austria", value: 50.8, population: 9006e3 },
    { id: "CH", name: "Switzerland", value: 93.5, population: 8715e3 },
    { id: "NO", name: "Norway", value: 88.9, population: 5421e3 },
    { id: "SE", name: "Sweden", value: 59.7, population: 1042e4 },
    { id: "DK", name: "Denmark", value: 66.8, population: 5831e3 },
    { id: "FI", name: "Finland", value: 52.4, population: 5541e3 },
    { id: "IE", name: "Ireland", value: 84.6, population: 5024e3 },
    { id: "PT", name: "Portugal", value: 24.7, population: 1029e4 },
    { id: "GR", name: "Greece", value: 19.9, population: 1072e4 },
    { id: "CZ", name: "Czech Republic", value: 28.1, population: 1071e4 },
    { id: "HU", name: "Hungary", value: 18.6, population: 975e4 },
    { id: "SK", name: "Slovakia", value: 20.8, population: 546e4 },
    { id: "SI", name: "Slovenia", value: 28.9, population: 2119e3 },
    { id: "HR", name: "Croatia", value: 16.7, population: 3879e3 },
    { id: "RO", name: "Romania", value: 13.8, population: 1912e4 },
    { id: "BG", name: "Bulgaria", value: 11.9, population: 6927e3 },
    { id: "LT", name: "Lithuania", value: 22.7, population: 2795e3 },
    { id: "LV", name: "Latvia", value: 20.6, population: 1884e3 },
    { id: "EE", name: "Estonia", value: 26.8, population: 1331e3 },
    { id: "LU", name: "Luxembourg", value: 125.7, population: 64e4 },
    { id: "IS", name: "Iceland", value: 72.5, population: 372e3 },
    { id: "UA", name: "Ukraine", value: 4.8, population: 4113e4 },
    { id: "BY", name: "Belarus", value: 6.9, population: 9449e3 },
    { id: "MD", name: "Moldova", value: 3.9, population: 2618e3 },
    { id: "RS", name: "Serbia", value: 9.2, population: 6834e3 },
    { id: "BA", name: "Bosnia and Herzegovina", value: 6.8, population: 3281e3 },
    { id: "ME", name: "Montenegro", value: 9.7, population: 628e3 },
    { id: "MK", name: "North Macedonia", value: 6.9, population: 2083e3 },
    { id: "AL", name: "Albania", value: 5.8, population: 2838e3 },
    { id: "KV", name: "Kosovo", value: 4.9, population: 1932e3 }
  ], []);
  useEffect(() => {
    if (data.length > 0) {
      setCountryData(data);
    } else {
      setCountryData(sampleData);
    }
    setLoading(false);
  }, [data, sampleData]);
  const countries = useMemo(() => {
    if (!europe) return [];
    try {
      return topojson3.feature(europe, europe.objects.default).features;
    } catch (error) {
      console.error("Error processing TopoJSON:", error);
      return [];
    }
  }, [europe]);
  useEffect(() => {
    if (!mapRef.current || loading || !europe || countries.length === 0 || countryData.length === 0) return;
    mapRef.current.innerHTML = "";
    const dataMap = new Map(countryData.map((d) => [d.id, d]));
    const enhancedCountries = countries.map((country) => {
      const countryId = country.id || country.properties?.id || country.properties?.["hc-key"]?.toUpperCase();
      const dataPoint = dataMap.get(countryId);
      return {
        ...country,
        properties: {
          ...country.properties,
          value: dataPoint?.value || 0,
          name: dataPoint?.name || country.properties?.name || "Unknown",
          population: dataPoint?.population || 0
        }
      };
    });
    const plot34 = Plot24.plot({
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
        Plot24.geo(enhancedCountries, {
          fill: (d) => d.properties.value,
          stroke: "#fff",
          strokeWidth: 0.5
        }),
        // Country borders
        Plot24.geo(enhancedCountries, {
          fill: "none",
          stroke: "#666",
          strokeWidth: 0.25
        }),
        // Interactive tooltips
        Plot24.tip(enhancedCountries, Plot24.pointer(Plot24.centroid({
          title: (d) => `${d.properties.name}: ${d.properties.value?.toFixed(1) || "N/A"}`
        })))
      ]
    });
    mapRef.current.appendChild(plot34);
  }, [loading, europe, countries.length, countryData.length, colorScheme, valueLabel]);
  if (loading || !europe) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-4", children: subtitle }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-96", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading map..." }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: title }),
    subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-4", children: subtitle }),
    /* @__PURE__ */ jsx("div", { ref: mapRef, className: "w-full" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 text-xs text-gray-500", children: [
      "Data shows ",
      valueLabel.toLowerCase(),
      " across European countries. Values are sample data for demonstration purposes."
    ] })
  ] });
};
var EuropeMap_default = EuropeMap;
var TOPOLOGY_BASE_URL4 = "https://ontopic-public-data.t3.storage.dev/geo";
var ZipMap = ({ data }) => {
  const mapRef = useRef(null);
  const [us, setUs] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL4}/us-albers-counties-10m.json`).then((response) => response.json()).then((topology) => {
      setUs(topology);
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading topology:", error);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!data || data.length === 0 || !us || loading) return;
    if (mapRef.current) mapRef.current.innerHTML = "";
    const statemesh = topojson3.mesh(us, us.objects.states, (a, b) => a !== b);
    const nation = topojson3.feature(us, us.objects.nation);
    const countiesmesh = topojson3.mesh(us, us.objects.counties);
    const mapPlot = Plot24.plot({
      width: 960,
      height: 600,
      projection: "albers",
      color: {
        scheme: "puor",
        type: "quantile",
        n: 4,
        reverse: true,
        label: "Obesity (%)",
        legend: true,
        tickFormat: (d) => `${d.toFixed(1)}%`
      },
      marks: [
        Plot24.geo(countiesmesh, { strokeOpacity: 0.5 }),
        Plot24.geo(nation),
        Plot24.geo(statemesh, { strokeOpacity: 0.2 }),
        Plot24.dot(data, {
          x: "longitude",
          y: "latitude",
          stroke: "obesity_rate",
          tip: true,
          strokeOpacity: 0.4,
          r: 1
        })
      ]
    });
    mapRef.current.appendChild(mapPlot);
    return () => mapPlot?.remove();
  }, [data, us, loading]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center", style: { minHeight: "600px" }, children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" }) }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "ZIP Code Density Map" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Geographic distribution of health data with size and color encoding" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { ref: mapRef, className: "flex justify-center" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Each dot represents a ZIP code area. Dot size and color both encode obesity rates, with larger and redder dots indicating higher rates." })
    ] })
  ] });
};
var ZipMap_default = ZipMap;
function TimetrendDemo({ defaults, error, data, colors, label }) {
  console.log("ttd data", data);
  console.log("ttd defaults", defaults);
  if (!defaults || !data) {
    return /* @__PURE__ */ jsx("div", { children: "Loading..." });
  }
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const initialVisibleSeries = data.dataPointMetadata?.find((item) => item.id === defaults.color)?.categories || [];
  const [visibleSeries, setVisibleSeries] = useState(new Set(initialVisibleSeries));
  const getColor = (category) => {
    const categoryColors = colors[defaults.color] || {};
    return categoryColors[category] || "#cccccc";
  };
  const toggleSeries = (series) => {
    setVisibleSeries((prevVisibleSeries) => {
      const updatedSet = new Set(prevVisibleSeries);
      if (updatedSet.has(series)) {
        updatedSet.delete(series);
      } else {
        updatedSet.add(series);
      }
      return updatedSet;
    });
  };
  const { theme } = useTheme();
  const USEPREZ = typeof defaults.plotBands !== "undefined" && defaults.plotBands === "PrezEra";
  const colorPal = colors[defaults.color] || {};
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);
  useEffect(() => {
    if (!data || !defaults || containerWidth === 0) return;
    const xFormedData = data.dataPoints.map((d) => ({
      ...d,
      year: +d["year"]
    }));
    const average = xFormedData.reduce(
      (total, d) => total + d[defaults.y],
      0
    ) / xFormedData.length;
    const yaxisMin = Math.max(
      0,
      Math.min(
        ...xFormedData.map((d) => d[defaults.y])
      ) - 0.2 * average
    );
    const yaxisMax = Math.max(
      ...xFormedData.map((d) => d[defaults.y])
    ) + 0.2 * average;
    const yaxisMinEb = Math.floor(
      Math.min(
        ...data.dataPoints.filter((d) => d.ci_lower !== void 0).map((d) => d.ci_lower)
      )
    );
    const yaxisMaxEb = Math.round(
      Math.max(
        ...data.dataPoints.filter((d) => d.ci_upper !== void 0).map((d) => d.ci_upper)
      )
    );
    const lastValue = data.dataPointMetadata.find((d) => d.id == defaults.x).categories.slice(-1)[0];
    const lastYearData = xFormedData.filter((d) => d[defaults.x] === lastValue).sort(
      (a, b) => a[defaults.y] - b[defaults.y]
    );
    lastYearData.map(
      (d, i, arr) => {
        const valueDiff = i > 0 ? d[defaults.y] - arr[i - 1][defaults.y] : void 0;
        const valueDiffRev = i < arr.length - 1 ? d[defaults.y] - arr[i + 1][defaults.y] : void 0;
        return {
          ...d,
          valueDiff,
          valueDiffRev,
          diffSmall: valueDiff !== void 0 ? valueDiff / (yaxisMax - yaxisMin) : void 0,
          diffSmallRev: valueDiffRev !== void 0 ? -valueDiffRev / (yaxisMax - yaxisMin) : void 0
        };
      }
    );
    const PresEras = [
      { startYear: 1972, endYear: 1977, politicalParty: "Republican", president: "Nixon/Ford" },
      { startYear: 1977, endYear: 1981, politicalParty: "Democratic", president: "Carter" },
      { startYear: 1981, endYear: 1993, politicalParty: "Republican", president: "Reagan/Bush" },
      { startYear: 1993, endYear: 2001, politicalParty: "Democratic", president: "Clinton" },
      { startYear: 2001, endYear: 2009, politicalParty: "Republican", president: "Bush2" },
      { startYear: 2009, endYear: 2017, politicalParty: "Democratic", president: "Obama" },
      { startYear: 2017, endYear: 2021, politicalParty: "Republican", president: "Trump" },
      { startYear: 2021, endYear: 2023, politicalParty: "Democratic", president: "Biden" }
    ];
    const dataDates = data.dataPoints.map((d) => d[defaults.x]);
    const dataStartDate = Math.min(...dataDates);
    const dataEndDate = Math.max(...dataDates);
    const filteredByDate = PresEras.filter((period) => {
      return period.endYear >= dataStartDate && period.startYear <= dataEndDate;
    }).map((period) => {
      return {
        ...period,
        startYear: Math.max(period.startYear, dataStartDate),
        endYear: Math.min(period.endYear, dataEndDate)
      };
    });
    const filteredDem = filteredByDate.filter((d) => d.politicalParty === "Democratic");
    const filteredRep = filteredByDate.filter((d) => d.politicalParty === "Republican");
    data.dataPointMetadata.find(
      (item) => item.id === defaults.color
    ).categories.map((category) => colorPal[category] || "#cccccc");
    const filteredData = xFormedData.filter((d) => visibleSeries.has(d[defaults.color]));
    const plotHeight = Math.min(400, containerWidth * 0.6);
    const plot34 = Plot24.plot({
      caption: `Source: ${data.metadata.source.name}`,
      height: plotHeight,
      width: containerWidth,
      marginTop: 20,
      marginRight: 40,
      marginBottom: 50,
      marginLeft: 60,
      style: {
        backgroundColor: "transparent",
        overflow: "visible"
      },
      x: {
        label: data.dataPointMetadata.find(
          (item) => item.id === defaults.x
        ).name,
        tickFormat: (d) => `${Math.floor(d)}`,
        labelOffset: 35
      },
      y: {
        grid: true,
        domain: error === "none" ? [yaxisMin, yaxisMax] : [yaxisMinEb, yaxisMaxEb],
        label: data.dataPointMetadata.find(
          (item) => item.id === defaults.y
        ).name
      },
      color: {
        type: "ordinal",
        domain: Array.from(visibleSeries),
        range: Array.from(visibleSeries).map((series) => getColor(series))
      },
      marks: [
        USEPREZ ? Plot24.rect(filteredDem, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#2987f1"
        }) : null,
        USEPREZ ? Plot24.rect(filteredRep, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#fa5352"
        }) : null,
        Plot24.axisX({
          tickSize: 5,
          tickPadding: 5,
          tickFormat: (d) => `${Math.floor(d)}`
        }),
        Plot24.axisY({
          label: "",
          tickFormat: data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).units == "Percent" ? (d) => `${d}${data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).value_suffix}` : "",
          tickSize: 0
        }),
        Plot24.lineY(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color ? defaults.color : void 0,
          strokeWidth: 2,
          title: (d) => `${data.dataPointMetadata.find(
            (item) => item.id === defaults.x
          ).name}: ${d[defaults.x]} 
${data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).name}:
${d[defaults.y].toFixed(2)}${data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).units == "Percent" ? data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).value_suffix : ""}`
        }),
        error === "yes" ? Plot24.ruleX(filteredData, {
          x: defaults.x,
          y1: "ci_lower",
          y2: "ci_upper",
          stroke: defaults.color ? defaults.color : void 0
        }) : null,
        Plot24.dot(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color ? defaults.color : void 0,
          r: 4
        }),
        Plot24.ruleY([yaxisMinEb]),
        ...filteredDem.map((president) => Plot24.text(
          [{
            x: president.startYear,
            y: yaxisMinEb,
            text: president.president
          }],
          {
            rotate: 270,
            x: "x",
            y: "y",
            text: "text",
            dy: -2,
            textAnchor: "start"
          }
        )),
        ...filteredRep.map((president) => Plot24.text(
          [{
            x: president.startYear,
            y: yaxisMinEb,
            text: president.president
          }],
          {
            rotate: 270,
            x: "x",
            y: "y",
            text: "text",
            dy: -2,
            textAnchor: "start"
          }
        )),
        Plot24.tip(
          filteredData,
          Plot24.pointer({
            x: defaults.x,
            y: defaults.y,
            title: (d) => `${d[defaults.color]} ${d[defaults.x]}: ${d[defaults.y].toFixed(0)}${data.dataPointMetadata.find(
              (item) => item.id === defaults.y
            ).units == "Percent" ? data.dataPointMetadata.find(
              (item) => item.id === defaults.y
            ).value_suffix : ""}`,
            fill: theme === "dark" ? "#000000" : "#FFFFFF"
          })
        )
      ]
    });
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(plot34);
    }
  }, [data, defaults, error, containerWidth, visibleSeries, theme, colorPal]);
  const colorsinfo = data.dataPointMetadata.find((item) => item.id === defaults.color).categories;
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold mb-1", children: data.metadata.title }),
    /* @__PURE__ */ jsx("div", { className: "text-md text-gray-600 dark:text-gray-300 mb-2", children: data.metadata.subtitle }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs", children: label }),
      colorsinfo.map((series) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "legend-item text-xs cursor-pointer flex items-center",
          onClick: () => toggleSeries(series),
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "legend-icon mr-1 relative",
                style: {
                  width: "12px",
                  height: "12px",
                  backgroundColor: visibleSeries.has(series) ? getColor(series) : "#ccc",
                  display: "inline-block"
                },
                children: !visibleSeries.has(series) && /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(to bottom right, transparent, black 50%, transparent)`
                    }
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("span", { style: { color: visibleSeries.has(series) ? "inherit" : "#ccc" }, children: series })
          ]
        },
        series
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { ref: containerRef, className: "w-full" })
  ] });
}
function TimeSeriesChart({
  data,
  metadata,
  dataPointMetadata
}) {
  const numericData = data.map((d) => ({
    ...d,
    year: parseInt(d.year, 10)
    // Convert year to number
  }));
  const valueMetadata = dataPointMetadata.find((d) => d.id === "value");
  const dataYears = numericData.map((d) => d.year);
  const uniqueYears = new Set(dataYears);
  if (dataYears.length !== uniqueYears.size) {
    console.warn("Duplicate years found in the data prop!");
    return /* @__PURE__ */ jsx("div", { children: "Error: Duplicate years detected in the dataset." });
  }
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;
    return /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 border border-gray-200 shadow-lg rounded-lg", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium", children: `Year: ${label}` }),
      /* @__PURE__ */ jsx("p", { className: "text-blue-600", children: `${valueMetadata?.name}: ${dataPoint.value.toFixed(1)}${valueMetadata?.value_suffix || ""}` }),
      dataPoint.ci_lower && dataPoint.ci_upper && /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm", children: `95% CI: [${dataPoint.ci_lower.toFixed(1)}, ${dataPoint.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ""}` }),
      dataPoint.n_actual && /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm", children: `N: ${dataPoint.n_actual.toLocaleString()}` })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-1", children: metadata.title }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-2", children: metadata.subtitle })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full h-[400px]", children: [
      /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
        LineChart,
        {
          data: numericData,
          margin: {
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          },
          children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "year",
                type: "number",
                domain: [minYear, maxYear],
                tickCount: (maxYear - minYear) / 2,
                tickFormatter: (value) => value.toString(),
                padding: { left: 20, right: 20 },
                tick: { fontSize: 12 }
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                tickFormatter: (value) => {
                  const metadata2 = dataPointMetadata.find((d) => d.id === "value");
                  const prefix = typeof metadata2?.value_prefix === "string" ? metadata2.value_prefix : "";
                  const suffix = typeof metadata2?.value_suffix === "string" ? metadata2.value_suffix : "";
                  const num = Number(value);
                  let formattedValue;
                  if (num >= 1e9) {
                    formattedValue = (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
                  } else if (num >= 1e6) {
                    formattedValue = (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
                  } else if (num >= 1e3) {
                    formattedValue = (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
                  } else {
                    formattedValue = num.toLocaleString();
                  }
                  return `${prefix}${formattedValue}${suffix}`;
                },
                domain: ["auto", "auto"],
                axisLine: false,
                tickLine: false
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "linear",
                dataKey: "value",
                stroke: "#000000",
                strokeWidth: 1.5,
                dot: { r: 3, fill: "#000000" },
                activeDot: { r: 5 },
                isAnimationActive: false,
                children: /* @__PURE__ */ jsx(
                  ErrorBar,
                  {
                    dataKey: (d) => d.standard_error ? 1.96 * d.standard_error : 0,
                    stroke: "#000000",
                    strokeWidth: 1,
                    width: 4,
                    name: "confidence-intervals"
                  }
                )
              },
              "value-line"
            )
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
        "Source: ",
        metadata.source.name
      ] }) })
    ] })
  ] });
}
function TimeSeriesChart2({
  data,
  metadata,
  dataPointMetadata
}) {
  const numericData = data.map((d) => ({
    ...d,
    year: parseInt(d.year, 10)
    // Convert year to number
  }));
  const valueMetadata = dataPointMetadata.find((d) => d.id === "value");
  const dataYears = numericData.map((d) => d.year);
  const uniqueYears = new Set(dataYears);
  if (dataYears.length !== uniqueYears.size) {
    console.warn("Duplicate years found in the data prop!");
    return /* @__PURE__ */ jsx("div", { children: "Error: Duplicate years detected in the dataset." });
  }
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;
    return /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 border border-gray-200 shadow-lg rounded-lg", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium", children: `Year: ${label}` }),
      /* @__PURE__ */ jsx("p", { className: "text-blue-600", children: `${valueMetadata?.name}: ${dataPoint.value.toFixed(1)}${valueMetadata?.value_suffix || ""}` }),
      dataPoint.ci_lower && dataPoint.ci_upper && /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm", children: `95% CI: [${dataPoint.ci_lower.toFixed(1)}, ${dataPoint.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ""}` }),
      dataPoint.n_actual && /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm", children: `N: ${dataPoint.n_actual.toLocaleString()}` })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-1", children: metadata.title }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-2", children: metadata.subtitle })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full h-[400px]", children: [
      /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
        LineChart,
        {
          data: numericData,
          margin: {
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          },
          children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "year",
                type: "number",
                domain: [minYear, maxYear],
                tickCount: (maxYear - minYear) / 2,
                tickFormatter: (value) => value.toString(),
                padding: { left: 20, right: 20 },
                tick: { fontSize: 12 }
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                tickFormatter: (value) => {
                  const metadata2 = dataPointMetadata.find((d) => d.id === "value");
                  const prefix = typeof metadata2?.value_prefix === "string" ? metadata2.value_prefix : "";
                  const suffix = typeof metadata2?.value_suffix === "string" ? metadata2.value_suffix : "";
                  const num = Number(value);
                  let formattedValue;
                  if (num >= 1e9) {
                    formattedValue = (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
                  } else if (num >= 1e6) {
                    formattedValue = (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
                  } else if (num >= 1e3) {
                    formattedValue = (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
                  } else {
                    formattedValue = num.toLocaleString();
                  }
                  return `${prefix}${formattedValue}${suffix}`;
                },
                domain: ["auto", "auto"],
                axisLine: false,
                tickLine: false
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "linear",
                dataKey: "value",
                stroke: "#000000",
                strokeWidth: 1.5,
                dot: { r: 3, fill: "#000000" },
                activeDot: { r: 5 },
                isAnimationActive: false,
                children: /* @__PURE__ */ jsx(
                  ErrorBar,
                  {
                    dataKey: (d) => d.standard_error ? 1.96 * d.standard_error : 0,
                    stroke: "#000000",
                    strokeWidth: 1,
                    width: 4,
                    name: "confidence-intervals"
                  }
                )
              },
              "value-line"
            )
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
        "Source: ",
        metadata.source.name
      ] }) })
    ] })
  ] });
}
function AbortionOpinionChart({ data }) {
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedEducation, setSelectedEducation] = useState("All");
  const { metadata, dataPoints, dataPointMetadata } = data;
  const regions = ["All", ...dataPointMetadata.find((d) => d.id === "Census_Region")?.categories || []];
  const educationLevels = ["All", ...dataPointMetadata.find((d) => d.id === "Education")?.categories || []];
  const races = dataPointMetadata.find((d) => d.id === "Race")?.categories || [];
  const filteredData = dataPoints.filter((point) => {
    const regionMatch = selectedRegion === "All" || point.Census_Region === selectedRegion;
    const educationMatch = selectedEducation === "All" || point.Education === selectedEducation;
    return regionMatch && educationMatch;
  });
  const groupedData = React25__default.useMemo(() => {
    const groups = {};
    filteredData.forEach((point) => {
      const key = `${point.Census_Region} - ${point.Education}`;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          region: point.Census_Region,
          education: point.Education
        };
      }
      groups[key][`${point.Race}`] = point.value;
      groups[key][`${point.Race}_error`] = point.standard_error * 1.96;
      groups[key][`${point.Race}_ci_lower`] = point.ci_lower;
      groups[key][`${point.Race}_ci_upper`] = point.ci_upper;
      groups[key][`${point.Race}_n`] = point.n_actual;
    });
    return Object.values(groups).sort((a, b) => {
      if (a.region !== b.region) {
        return regions.indexOf(a.region) - regions.indexOf(b.region);
      }
      return educationLevels.indexOf(a.education) - educationLevels.indexOf(b.education);
    });
  }, [filteredData, regions, educationLevels]);
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data2 = payload[0]?.payload;
    return /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 border border-gray-300 shadow-lg rounded-lg", children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2 text-sm", children: label }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1", children: races.map((race) => {
        const value = data2[race];
        const ciLower = data2[`${race}_ci_lower`];
        const ciUpper = data2[`${race}_ci_upper`];
        const n = data2[`${race}_n`];
        if (value === void 0) return null;
        return /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            race,
            ":"
          ] }),
          " ",
          /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
            value.toFixed(1),
            "%"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600 ml-2", children: [
            "95% CI: [",
            ciLower.toFixed(1),
            "%, ",
            ciUpper.toFixed(1),
            "%]"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 ml-2", children: [
            "n = ",
            n
          ] })
        ] }, race);
      }) })
    ] });
  };
  const colors = {
    White: "#374151",
    Black: "#9CA3AF"
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: metadata.title }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: metadata.subtitle }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 italic", children: metadata.question })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-center flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "region", className: "text-sm font-medium", children: "Region:" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            id: "region",
            value: selectedRegion,
            onChange: (e) => setSelectedRegion(e.target.value),
            className: "border border-gray-300 rounded px-3 py-1 text-sm",
            children: regions.map((region) => /* @__PURE__ */ jsx("option", { value: region, children: region }, region))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "education", className: "text-sm font-medium", children: "Education:" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            id: "education",
            value: selectedEducation,
            onChange: (e) => setSelectedEducation(e.target.value),
            className: "border border-gray-300 rounded px-3 py-1 text-sm",
            children: educationLevels.map((level) => /* @__PURE__ */ jsx("option", { value: level, children: level }, level))
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full", style: { height: Math.max(400, groupedData.length * 40) }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
      BarChart$1,
      {
        data: groupedData,
        layout: "vertical",
        margin: { top: 20, right: 30, left: 200, bottom: 20 },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              type: "number",
              domain: [0, 100],
              tickFormatter: (value) => `${value}%`,
              label: { value: "Support for Legal Abortion (%)", position: "bottom", offset: 0 }
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              dataKey: "name",
              type: "category",
              width: 190,
              tick: { fontSize: 11 }
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
          /* @__PURE__ */ jsx(Legend, {}),
          races.map((race) => /* @__PURE__ */ jsx(
            Bar,
            {
              dataKey: race,
              fill: colors[race] || "#6B7280",
              name: race,
              isAnimationActive: false,
              children: /* @__PURE__ */ jsx(
                ErrorBar,
                {
                  dataKey: `${race}_error`,
                  stroke: "#000000",
                  strokeWidth: 1,
                  width: 4
                }
              )
            },
            race
          ))
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 space-y-1 mt-4 border-t pt-4", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Source:" }),
        " ",
        metadata.source.name
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Note:" }),
        " ",
        metadata.note
      ] })
    ] })
  ] });
}
function DemographicBarChart({
  data,
  categoryKey,
  valueKey,
  errorLowKey,
  errorHighKey,
  title,
  xLabel,
  yLabel = "Value (%)",
  fill = "#8884d8",
  errorStroke = "#666",
  errorStrokeWidth = 2,
  width = "100%",
  height = 400,
  xTickRotate = -45,
  xTickFontSize = 10,
  showGrid = true,
  className = ""
}) {
  if (!data || data.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: `p-6 text-center text-gray-500 ${className}`, children: "No demographic data available" });
  }
  const transformedData = data.map((item) => {
    const transformed = { ...item };
    if (errorLowKey && errorHighKey) {
      transformed.error = [item[errorLowKey], item[errorHighKey]];
    }
    return transformed;
  });
  return /* @__PURE__ */ jsxs("div", { className, children: [
    title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4 text-center", children: title }),
    /* @__PURE__ */ jsx(ResponsiveContainer, { width, height, children: /* @__PURE__ */ jsxs(
      BarChart$1,
      {
        data: transformedData,
        margin: { top: 20, right: 30, left: 20, bottom: 80 },
        children: [
          showGrid && /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: categoryKey,
              label: xLabel ? { value: xLabel, position: "insideBottom", offset: -70 } : void 0,
              interval: 0,
              angle: xTickRotate,
              textAnchor: "end",
              height: 100,
              tick: { fontSize: xTickFontSize }
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              label: yLabel ? { value: yLabel, angle: -90, position: "insideLeft" } : void 0
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: valueKey, fill, children: errorLowKey && errorHighKey && /* @__PURE__ */ jsx(
            ErrorBar,
            {
              dataKey: "error",
              stroke: errorStroke,
              strokeWidth: errorStrokeWidth
            }
          ) })
        ]
      }
    ) })
  ] });
}
var stat_demographic_bar_v1_default = DemographicBarChart;
function pearsonR(points) {
  const n = points.length;
  if (n < 2) return NaN;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (const { x, y } of points) {
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const cov = sxy - sx * sy / n;
  const vx = sxx - sx * sx / n;
  const vy = syy - sy * sy / n;
  if (vx <= 0 || vy <= 0) return NaN;
  return cov / Math.sqrt(vx * vy);
}
function ols(points) {
  const n = points.length;
  if (n < 2) return { b0: 0, b1: 0, se: NaN, xbar: NaN, sxx: NaN };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const { x, y } of points) {
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  const denom = n * sxx - sx * sx;
  const b1 = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const b0 = (sy - b1 * sx) / n;
  const sse = points.reduce((acc, p) => {
    const yhat = b0 + b1 * p.x;
    return acc + (p.y - yhat) ** 2;
  }, 0);
  const se = Math.sqrt(sse / Math.max(1, n - 2));
  const xbar = sx / n;
  const sxxCentered = points.reduce((a, p) => a + (p.x - xbar) ** 2, 0);
  return { b0, b1, se, xbar, sxx: sxxCentered };
}
function lineAndBand(points, xMin, xMax, steps = 120) {
  const { b0, b1, se, xbar, sxx } = ols(points);
  const xs = [];
  for (let i = 0; i <= steps; i++) xs.push(xMin + i * (xMax - xMin) / steps);
  const t = 2;
  const rows = xs.map((x) => {
    const y = b0 + b1 * x;
    const seFit = isFinite(se) && isFinite(sxx) && sxx > 0 && points.length > 0 ? se * Math.sqrt(1 / points.length + (x - xbar) ** 2 / sxx) : NaN;
    const yLow = isFinite(seFit) ? y - t * seFit : y;
    const yHigh = isFinite(seFit) ? y + t * seFit : y;
    return { x, y, band: [yLow, yHigh] };
  });
  return { line: rows.map(({ x, y }) => ({ x, y })), band: rows };
}
var REGION_COLORS = {
  Catholic: "#facc15",
  // gold
  Protestant: "#52525b",
  // zinc-600
  Orthodox: "#3b82f6",
  // blue-500
  Muslim: "#ef4444",
  // red-500
  Other: "#22c55e"
  // green-500
};
function normalizeReligion(s) {
  const v = (s || "").toLowerCase();
  if (v.includes("catholic")) return "Catholic";
  if (v.includes("protestant")) return "Protestant";
  if (v.includes("orthodox")) return "Orthodox";
  if (v.includes("muslim") || v.includes("islam")) return "Muslim";
  return "Other";
}
function prepareEssRows(rows, opts = {}) {
  const { happinessKey = "happiness" } = opts;
  return rows.map((r) => {
    const region = normalizeReligion(r.religion);
    const happiness = Number(r[happinessKey]);
    return {
      name: r.cntry,
      religion: r.religion || region,
      region,
      population_m: Number(r.population ?? 0),
      happiness: isFinite(happiness) ? happiness : NaN,
      hdi: Number(r.hdi),
      gdp: Number(r.gdp),
      education: Number(r.education)
    };
  });
}
function fmtGDP(v) {
  if (!isFinite(v)) return "";
  if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3)}k`;
  return `${v}`;
}
function fmtMillions(v) {
  if (!isFinite(v)) return "";
  return v < 10 ? `${v.toFixed(1)} Million` : `${Math.round(v)} Million`;
}
var BubbleTooltip = ({ active, payload, label, xLabel, xFmt }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return /* @__PURE__ */ jsxs("div", { className: "relative max-w-xs rounded-xl bg-white/95 p-3 shadow-xl ring-1 ring-black/5", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm bg-white ring-1 ring-black/5",
        "aria-hidden": true
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "text-base font-semibold", children: d.name }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm leading-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
          xLabel,
          ":"
        ] }),
        " ",
        xFmt ? xFmt(d.x) : d.x
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Average Happiness:" }),
        " ",
        isFinite(d.y) ? Number(d.y).toFixed(2) : "\u2014"
      ] }),
      isFinite(d.population_m) && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Population:" }),
        " ",
        fmtMillions(d.population_m)
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Religion:" }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "inline-block h-2.5 w-2.5 rounded-full",
            style: { background: d.fill }
          }
        ),
        /* @__PURE__ */ jsx("span", { children: d.religion })
      ] })
    ] })
  ] });
};
function Section({ title, xKey, xLabel, xDomain, xTickFmt, data }) {
  if (title.includes("Human Development") && data.length > 0) {
    console.log(
      `${title} - Sample happiness values:`,
      data.slice(0, 5).map((d) => `${d.name}: ${d.happiness}`)
    );
  }
  const points = data.filter((d) => Number.isFinite(d[xKey]) && Number.isFinite(d.happiness)).map((d) => ({ x: Number(d[xKey]), y: Number(d.happiness) }));
  const r = pearsonR(points);
  const [xMin, xMax] = xDomain;
  const { line: line5, band } = lineAndBand(points, xMin, xMax, 100);
  const scatterData = data.map((d) => {
    const x = Number(d[xKey]);
    const y = Number(d.happiness);
    return {
      ...d,
      x,
      y,
      // bubble area ~ sqrt(pop) -> visually closer to population without extreme skew
      z: isFinite(d.population_m) ? Math.max(24, Math.sqrt(d.population_m) * 4) : 24,
      fill: REGION_COLORS[d.region] || "#8884d8"
    };
  });
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-1 text-lg md:text-xl font-semibold", children: title }),
    /* @__PURE__ */ jsx("div", { className: "h-[340px] w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(ComposedChart, { margin: { top: 8, right: 18, bottom: 8, left: 8 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          type: "number",
          dataKey: "x",
          domain: xDomain,
          tickFormatter: xTickFmt,
          label: { value: xLabel, position: "insideBottom", offset: -2 }
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          type: "number",
          domain: ["dataMin - 0.5", "dataMax + 0.5"],
          label: { value: "Average Happiness", angle: -90, position: "insideLeft" }
        }
      ),
      /* @__PURE__ */ jsx(ZAxis, { dataKey: "z", range: [50, 240] }),
      /* @__PURE__ */ jsx(
        Area,
        {
          type: "monotone",
          data: band,
          dataKey: "band",
          stroke: "none",
          fill: "#94a3b8",
          fillOpacity: 0.22,
          isAnimationActive: false
        }
      ),
      /* @__PURE__ */ jsx(
        Line,
        {
          type: "monotone",
          data: line5,
          dataKey: "y",
          dot: false,
          stroke: "#475569",
          strokeWidth: 2,
          isAnimationActive: false
        }
      ),
      /* @__PURE__ */ jsx(ReferenceLine, { y: 7, stroke: "#cbd5e1", strokeDasharray: "4 4" }),
      /* @__PURE__ */ jsx(
        Scatter,
        {
          data: scatterData,
          dataKey: "y",
          shape: (props) => {
            const { cx, cy, payload, size } = props;
            const r2 = Math.sqrt(Math.max(0, size) / Math.PI);
            return /* @__PURE__ */ jsx(
              "circle",
              {
                cx,
                cy,
                r: r2,
                fill: payload.fill,
                fillOpacity: 0.9,
                stroke: "#334155",
                strokeOpacity: 0.35
              }
            );
          }
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          cursor: { strokeDasharray: "3 3" },
          content: (
            // We pass the axis label and formatter so the tooltip can render the x-value correctly.
            /* @__PURE__ */ jsx(BubbleTooltip, { xLabel, xFmt: xTickFmt })
          ),
          wrapperStyle: { outline: "none" }
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-violet-700", children: [
      "Correlation: ",
      isFinite(r) ? r.toFixed(2) : "\u2014"
    ] })
  ] });
}
function RegionLegend() {
  const items = Object.keys(REGION_COLORS).map((k) => [k, REGION_COLORS[k]]);
  return /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-3 text-sm", children: items.map(([label, color]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
    /* @__PURE__ */ jsx("span", { className: "inline-block h-3 w-3 rounded-full", style: { background: color } }),
    /* @__PURE__ */ jsx("span", { children: label })
  ] }, label)) });
}
function HappinessCorrelatesPanel({ data }) {
  const dataset = data ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "w-full p-4 md:p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid items-start gap-8 md:grid-cols-3", children: [
      /* @__PURE__ */ jsx(
        Section,
        {
          title: "Human Development Index",
          xKey: "hdi",
          xLabel: "HDI",
          xDomain: [0.5, 1],
          data: dataset
        }
      ),
      /* @__PURE__ */ jsx(
        Section,
        {
          title: "GDP per capita (2011 PPP$)",
          xKey: "gdp",
          xLabel: "GDP per capita (2011 PPP$)",
          xDomain: [3e3, 55e3],
          xTickFmt: fmtGDP,
          data: dataset
        }
      ),
      /* @__PURE__ */ jsx(
        Section,
        {
          title: "Mean Year of Schooling",
          xKey: "education",
          xLabel: "Mean Years of Schooling",
          xDomain: [8, 14],
          data: dataset
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsx(RegionLegend, {}) })
  ] });
}
var LineChart3 = ({ data = [] }) => {
  const basicRef = useRef(null);
  const errorBarsRef = useRef(null);
  const marijuanaData = [
    { year: 1975, value: 33.766, ci_lower: 29.2359, ci_upper: 38.296, demo_level_title: "Rarely" },
    { year: 1980, value: 39.9999, ci_lower: 33.8308, ci_upper: 46.169, demo_level_title: "Rarely" },
    { year: 1990, value: 28.1103, ci_lower: 21.4728, ci_upper: 34.7478, demo_level_title: "Rarely" },
    { year: 1998, value: 44.4119, ci_lower: 40.0516, ci_upper: 48.7722, demo_level_title: "Rarely" },
    { year: 2008, value: 51.5992, ci_lower: 46.3518, ci_upper: 56.8467, demo_level_title: "Rarely" },
    { year: 2014, value: 68.025, ci_lower: 64.1351, ci_upper: 71.915, demo_level_title: "Rarely" },
    { year: 2018, value: 75.4005, ci_lower: 71.0312, ci_upper: 79.7699, demo_level_title: "Rarely" },
    { year: 2022, value: 82.1393, ci_lower: 78.1238, ci_upper: 86.1548, demo_level_title: "Rarely" },
    { year: 1975, value: 27.8498, ci_lower: 23.4259, ci_upper: 32.2738, demo_level_title: "Sometimes" },
    { year: 1980, value: 26.5497, ci_lower: 21.1635, ci_upper: 31.9359, demo_level_title: "Sometimes" },
    { year: 1990, value: 12.051, ci_lower: 7.6668, ci_upper: 16.4351, demo_level_title: "Sometimes" },
    { year: 1998, value: 25.4621, ci_lower: 20.8151, ci_upper: 30.1091, demo_level_title: "Sometimes" },
    { year: 2008, value: 33.1419, ci_lower: 28.3581, ci_upper: 37.9257, demo_level_title: "Sometimes" },
    { year: 2014, value: 56.069, ci_lower: 50.063, ci_upper: 62.075, demo_level_title: "Sometimes" },
    { year: 2018, value: 63.5873, ci_lower: 57.5489, ci_upper: 69.6256, demo_level_title: "Sometimes" },
    { year: 2022, value: 73.1045, ci_lower: 66.0019, ci_upper: 80.2071, demo_level_title: "Sometimes" },
    { year: 1975, value: 9.4417, ci_lower: 6.5779, ci_upper: 12.3055, demo_level_title: "Weekly" },
    { year: 1980, value: 14.9472, ci_lower: 10.4098, ci_upper: 19.4845, demo_level_title: "Weekly" },
    { year: 1990, value: 11.088, ci_lower: 5.5125, ci_upper: 16.6635, demo_level_title: "Weekly" },
    { year: 1998, value: 11.4878, ci_lower: 8.6407, ci_upper: 14.335, demo_level_title: "Weekly" },
    { year: 2008, value: 24.4865, ci_lower: 19.6032, ci_upper: 29.3699, demo_level_title: "Weekly" },
    { year: 2014, value: 34.5205, ci_lower: 30.212, ci_upper: 38.829, demo_level_title: "Weekly" },
    { year: 2018, value: 41.1593, ci_lower: 34.6969, ci_upper: 47.6217, demo_level_title: "Weekly" },
    { year: 2022, value: 44.1575, ci_lower: 33.6355, ci_upper: 54.6796, demo_level_title: "Weekly" }
  ];
  const metadata = {
    title: "Trends in Opinion on Marijuana Legalization, by Church Attendance",
    subtitle: "% of US Population Who Support Marijuana Legalization, by Year and Church Attendance",
    source: { name: "General Social Survey, United States, 1972 - 2022; 38312 Observations" },
    domain: ["Rarely", "Sometimes", "Weekly"]
  };
  const customColors = [
    "#525252",
    // Dark Grey for Rarely
    "#D3D3D3",
    // Light Grey for Sometimes
    "#6A0DAD"
    // Deep Purple for Weekly
  ];
  useEffect(() => {
    if (!marijuanaData || marijuanaData.length === 0) return;
    if (basicRef.current) basicRef.current.innerHTML = "";
    if (errorBarsRef.current) errorBarsRef.current.innerHTML = "";
    console.log("Rendering charts with data:", marijuanaData.length, "points");
    try {
      const basicPlot = Plot24.plot({
        title: "Marijuana Legalization Support by Church Attendance",
        subtitle: "Trends from 1975-2022 (clean view)",
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif"
        },
        x: {
          label: "Year",
          domain: [1975, 2022],
          tickFormat: ".0f",
          grid: true
        },
        y: {
          label: "% Supporting Marijuana Legalization",
          grid: true,
          domain: [0, 90]
        },
        color: {
          legend: true,
          domain: metadata.domain,
          range: customColors
        },
        marks: [
          Plot24.lineY(marijuanaData, {
            x: "year",
            y: "value",
            stroke: "demo_level_title",
            strokeWidth: 2.5,
            tip: true
          }),
          Plot24.dot(marijuanaData, {
            x: "year",
            y: "value",
            fill: "demo_level_title",
            stroke: "white",
            strokeWidth: 1.5,
            r: 3,
            tip: true
          })
        ],
        width: 700,
        height: 400,
        marginLeft: 80
      });
      const errorBarsPlot = Plot24.plot({
        title: metadata.title,
        subtitle: metadata.subtitle,
        caption: `Source: ${metadata.source.name}`,
        style: {
          backgroundColor: "white",
          fontFamily: "sans-serif"
        },
        x: {
          label: "Year",
          domain: [1975, 2022],
          tickFormat: ".0f",
          grid: true
        },
        y: {
          label: "% Supporting Marijuana Legalization",
          grid: true,
          domain: [0, 90]
        },
        color: {
          legend: true,
          domain: metadata.domain,
          range: customColors
        },
        marks: [
          // Confidence interval error bars (vertical lines at each data point)
          Plot24.ruleX(marijuanaData, {
            x: "year",
            y1: "ci_lower",
            y2: "ci_upper",
            stroke: "demo_level_title",
            strokeWidth: 1.5,
            strokeOpacity: 0.7
          }),
          // Main trend lines
          Plot24.lineY(marijuanaData, {
            x: "year",
            y: "value",
            stroke: "demo_level_title",
            strokeWidth: 2.5,
            tip: true
          }),
          // Data points
          Plot24.dot(marijuanaData, {
            x: "year",
            y: "value",
            fill: "demo_level_title",
            stroke: "white",
            strokeWidth: 1.5,
            r: 3.5,
            tip: true
          })
        ],
        width: 800,
        height: 350,
        marginLeft: 80
      });
      if (basicRef.current) {
        basicRef.current.appendChild(basicPlot);
        console.log("Basic plot appended");
      }
      if (errorBarsRef.current) {
        errorBarsRef.current.appendChild(errorBarsPlot);
        console.log("Error bars plot appended");
      }
      return () => {
        basicPlot?.remove();
        errorBarsPlot?.remove();
      };
    } catch (error) {
      console.error("Error rendering plots:", error);
    }
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Analysis of public opinion on marijuana legalization from the General Social Survey (1975-2022). Shows how attitudes vary by church attendance frequency, with confidence intervals showing statistical uncertainty." }) }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Basic Trend Lines" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Clean line chart showing support trends by church attendance frequency" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: basicRef, className: "flex justify-center", style: { minHeight: "400px" } }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "This simplified view shows the clear trend patterns: those who rarely attend church show the highest and fastest-growing support, while those who attend weekly show the lowest but steadily increasing support over time." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Trends with Error Bars" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Complete analysis including confidence intervals showing statistical uncertainty" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: errorBarsRef, className: "flex justify-center", style: { minHeight: "400px" } }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "The error bars show 95% confidence intervals around each estimate. Larger error bars indicate greater statistical uncertainty, often due to smaller sample sizes. This matches the original Observable Framework visualization design." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Key Findings" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Rarely Attend Church" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Highest support levels (82% by 2022)" }),
            /* @__PURE__ */ jsx("li", { children: "Steady upward trend since 1990s" }),
            /* @__PURE__ */ jsx("li", { children: "Largest absolute increase over time" }),
            /* @__PURE__ */ jsx("li", { children: "Generally narrower confidence intervals" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Sometimes Attend" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Moderate support levels (73% by 2022)" }),
            /* @__PURE__ */ jsx("li", { children: "Similar upward trajectory" }),
            /* @__PURE__ */ jsx("li", { children: "More volatile in earlier years" }),
            /* @__PURE__ */ jsx("li", { children: "Intermediate between other groups" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Weekly Church Attendance" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Lowest support but growing (44% by 2022)" }),
            /* @__PURE__ */ jsx("li", { children: "Accelerated growth since 2000s" }),
            /* @__PURE__ */ jsx("li", { children: "Largest relative percentage increase" }),
            /* @__PURE__ */ jsx("li", { children: "Shows cultural shift even among religious" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var LineChart_default = LineChart3;
function cn2(...inputs) {
  return twMerge(clsx(inputs));
}
var buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      className: cn2(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
var formatValue = (value) => {
  return value.toLocaleString("en-US");
};
var calculatePercentChange = (current, previous) => {
  return (current - previous) / previous * 100;
};
var calculateStats = (data) => {
  if (!data.length) return { avg: "0", max: "0", min: "0", trend: 0 };
  const values = data.map((d) => d.value);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const trend = calculatePercentChange(lastValue, firstValue);
  return {
    avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
    max: Math.max(...values).toFixed(1),
    min: Math.min(...values).toFixed(1),
    trend
  };
};
var TimeSeries = ({ data }) => {
  const [showRecessions, setShowRecessions] = useState(true);
  const { theme } = useTheme();
  const processedData = useMemo(() => {
    return data.observations.map((item, index, arr) => {
      const value = parseFloat(item.value);
      const previousValue = index > 0 ? parseFloat(arr[index - 1].value) : value;
      return {
        date: item.date,
        value,
        percentChange: calculatePercentChange(value, previousValue)
      };
    });
  }, [data]);
  const filteredData = processedData;
  calculateStats(filteredData);
  filteredData[filteredData.length - 1]?.value || 0;
  const recessionPeriods2 = [
    { start: "2020-02-01", end: "2020-04-01" },
    { start: "2007-12-01", end: "2009-06-01" },
    { start: "2001-03-01", end: "2001-11-01" },
    { start: "1990-07-01", end: "1991-03-01" },
    { start: "1981-07-01", end: "1982-11-01" },
    { start: "1980-01-01", end: "1980-07-01" },
    { start: "1973-11-01", end: "1975-03-01" },
    { start: "1969-12-01", end: "1970-11-01" },
    { start: "1960-04-01", end: "1961-02-01" },
    { start: "1957-08-01", end: "1958-04-01" },
    { start: "1953-07-01", end: "1954-05-01" },
    { start: "1948-11-01", end: "1949-10-01" },
    { start: "1945-02-01", end: "1945-10-01" }
  ];
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short"
    });
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data2 = payload[0].payload;
    const date = new Date(label || "").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long"
    });
    const value = formatValue(data2.value);
    const percentChange = data2.percentChange.toFixed(1);
    const color = data2.percentChange > 0 ? "text-green-500" : data2.percentChange < 0 ? "text-red-500" : "text-gray-500";
    return /* @__PURE__ */ jsxs("div", { className: "bg-popover/80 backdrop-blur p-2 rounded-lg border shadow-lg", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: date }),
      /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: value }),
      /* @__PURE__ */ jsxs("div", { className: `text-sm ${color}`, children: [
        percentChange,
        "% from previous"
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-background shadow-lg rounded-lg border", children: [
    /* @__PURE__ */ jsx("div", { className: "pb-4 p-6", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-foreground", children: data.short_title || data.title.split(":")[0] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: data.title })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "p-6 pt-0", children: /* @__PURE__ */ jsx("div", { className: "h-[400px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
      LineChart,
      {
        data: filteredData,
        margin: { top: 20, right: 30, left: 50, bottom: 0 },
        children: [
          /* @__PURE__ */ jsx(
            CartesianGrid,
            {
              strokeDasharray: "3 3",
              className: "stroke-muted",
              vertical: false
            }
          ),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "date",
              tickFormatter: formatDate,
              minTickGap: 30,
              tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              domain: ["auto", "auto"],
              tickFormatter: formatValue,
              tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "value",
              dot: false,
              stroke: "#4299e1",
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsx(
            Brush,
            {
              dataKey: "date",
              height: 30,
              stroke: "#8884d8",
              fill: "#fff",
              tickFormatter: formatDate,
              travellerWidth: 10,
              startIndex: 0,
              endIndex: filteredData.length - 1,
              children: /* @__PURE__ */ jsxs(LineChart, { children: [
                /* @__PURE__ */ jsx(Line, { dataKey: "value", stroke: "#4299e1", dot: false }),
                showRecessions && recessionPeriods2.map((period, index) => /* @__PURE__ */ jsx(
                  ReferenceArea,
                  {
                    x1: period.start,
                    x2: period.end,
                    fill: "currentColor",
                    fillOpacity: 0.1,
                    strokeOpacity: 0
                  },
                  index
                ))
              ] })
            }
          ),
          showRecessions && recessionPeriods2.map((period, index) => /* @__PURE__ */ jsx(
            ReferenceArea,
            {
              x1: period.start,
              x2: period.end,
              fill: "currentColor",
              fillOpacity: 0.1,
              strokeOpacity: 0
            },
            index
          ))
        ]
      }
    ) }) }) })
  ] });
};
var TimeSeries_default = TimeSeries;
var TimeRangeButton = ({ active, onClick, children }) => /* @__PURE__ */ jsx(
  Button,
  {
    variant: active ? "default" : "ghost",
    size: "sm",
    onClick,
    className: `transition-all ${active ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-100"}`,
    children
  }
);
var IndexChart = ({ series1, series2 }) => {
  const [timeRange, setTimeRange] = useState("MAX");
  const [showRecessions, setShowRecessions] = useState(true);
  const [brushDomain, setBrushDomain] = useState(null);
  const { theme } = useTheme();
  const colors = {
    series1: "#4299e1",
    // original blue
    series2: "#f59e0b"
    // original amber
  };
  console.log("series1:", series1);
  console.log("series2:", series2);
  const recessionPeriods2 = [
    { start: "1960-04-01", end: "1961-02-01" },
    { start: "1969-12-01", end: "1970-11-01" },
    { start: "1973-11-01", end: "1975-03-01" },
    { start: "1980-01-01", end: "1980-07-01" },
    { start: "1981-07-01", end: "1982-11-01" },
    { start: "1990-07-01", end: "1991-03-01" },
    { start: "2001-03-01", end: "2001-11-01" },
    { start: "2007-12-01", end: "2009-06-01" },
    { start: "2020-02-01", end: "2020-04-01" }
  ];
  const formatSeriesData = (series) => {
    return series.observations.map((obs) => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }));
  };
  const filteredData = useMemo(() => {
    const series1Data = formatSeriesData(series1);
    const series2Data = formatSeriesData(series2);
    if (!series1Data?.length || !series2Data?.length) return [];
    const now = /* @__PURE__ */ new Date();
    let startDate;
    const ranges = {
      "1Y": () => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      "2Y": () => new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      "5Y": () => new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
      "MAX": () => new Date(Math.max(+new Date(series1Data[0].date), +new Date(series2Data[0].date)))
    };
    startDate = ranges[timeRange]();
    const filteredSeries1 = series1Data.filter((item) => new Date(item.date) >= startDate);
    const filteredSeries2 = series2Data.filter((item) => new Date(item.date) >= startDate);
    if (!filteredSeries1.length || !filteredSeries2.length) return [];
    const baseValueSeries1 = filteredSeries1[0].value;
    const baseValueSeries2 = filteredSeries2[0].value;
    const indexedSeries1 = filteredSeries1.map((item) => ({
      date: item.date,
      value: (item.value - baseValueSeries1) / baseValueSeries1 * 100
    }));
    const indexedSeries2 = filteredSeries2.map((item) => ({
      date: item.date,
      value: (item.value - baseValueSeries2) / baseValueSeries2 * 100
    }));
    return indexedSeries1.map((item, index) => ({
      date: item.date,
      [series1.title]: item.value,
      [series2.title]: indexedSeries2[index] ? indexedSeries2[index].value : null
    }));
  }, [series1, series2, timeRange]);
  const timeRanges = ["1Y", "2Y", "5Y", "MAX"];
  const formatDate = (str) => {
    const date = new Date(str);
    if (timeRange === "MAX") {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };
  const handleBrushChange = (domain) => {
    if (domain && domain.startIndex !== void 0 && domain.endIndex !== void 0) {
      setBrushDomain({
        start: domain.startIndex,
        end: domain.endIndex
      });
    }
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && label) {
      return /* @__PURE__ */ jsxs("div", { className: "bg-background p-4 rounded-lg shadow-lg border border-border", children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-foreground", children: formatDate(label) }),
        payload.map((entry) => {
          const color = entry.dataKey === series1.title ? colors.series1 : colors.series2;
          return /* @__PURE__ */ jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full mr-2", style: { backgroundColor: color } }),
            /* @__PURE__ */ jsxs("span", { children: [
              entry.dataKey,
              ":"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "ml-1 font-medium", style: { color }, children: [
              entry.value.toFixed(2),
              "%"
            ] })
          ] }) }, entry.dataKey);
        })
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-background shadow-lg rounded-lg border", children: [
    /* @__PURE__ */ jsx("div", { className: "pb-0 p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-foreground", children: "Index Chart" }),
        /* @__PURE__ */ jsxs("div", { className: "text-gray-600 text-sm mt-2", children: [
          series1.title,
          " vs ",
          series2.title
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 items-center", children: /* @__PURE__ */ jsx("div", { className: "flex space-x-2", children: timeRanges.map((range) => /* @__PURE__ */ jsx(
        TimeRangeButton,
        {
          active: timeRange === range,
          onClick: () => setTimeRange(range),
          children: range
        },
        range
      )) }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "p-6 pt-0", children: /* @__PURE__ */ jsx("div", { className: "h-[500px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
      LineChart,
      {
        data: filteredData,
        margin: { top: 30, right: 30, left: 0, bottom: 20 },
        children: [
          /* @__PURE__ */ jsx(
            Legend,
            {
              verticalAlign: "top",
              align: "left",
              height: 36,
              iconType: "circle",
              wrapperStyle: {
                paddingBottom: "60px"
              },
              formatter: (value) => /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: value })
            }
          ),
          /* @__PURE__ */ jsx(
            CartesianGrid,
            {
              strokeDasharray: "3 3",
              className: "stroke-muted",
              vertical: false
            }
          ),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "date",
              axisLine: false,
              tickLine: false,
              tickFormatter: formatDate,
              tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 },
              dy: 10,
              minTickGap: 5,
              interval: "preserveStartEnd"
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              domain: ["auto", "auto"],
              axisLine: false,
              tickLine: false,
              tickFormatter: (value) => `${value}%`,
              tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 },
              width: 60,
              dx: -10
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
          showRecessions && recessionPeriods2.map((period, index) => /* @__PURE__ */ jsx(
            ReferenceArea,
            {
              x1: period.start,
              x2: period.end,
              className: "fill-muted",
              fillOpacity: 0.4,
              alwaysShow: true,
              ifOverflow: "visible"
            },
            index
          )),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: series1.title,
              stroke: colors.series1,
              strokeWidth: 2,
              dot: false,
              activeDot: { r: 6, fill: colors.series1 }
            }
          ),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: series2.title,
              stroke: colors.series2,
              strokeWidth: 2,
              dot: false,
              activeDot: { r: 6, fill: colors.series2 }
            }
          ),
          /* @__PURE__ */ jsx(
            Brush,
            {
              dataKey: "date",
              height: 40,
              stroke: "#8884d8",
              tickFormatter: formatDate,
              onChange: handleBrushChange,
              startIndex: brushDomain?.start,
              endIndex: brushDomain?.end,
              children: /* @__PURE__ */ jsxs(LineChart, { children: [
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: series1.title,
                    stroke: colors.series1,
                    strokeWidth: 1,
                    dot: false
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: series2.title,
                    stroke: colors.series2,
                    strokeWidth: 1,
                    dot: false
                  }
                )
              ] })
            }
          )
        ]
      }
    ) }) }) })
  ] });
};
var SeriesComparison = ({
  series1,
  series2,
  title = "Series Comparison",
  description
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl mx-auto p-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-4", children: title }),
    /* @__PURE__ */ jsx(
      IndexChart,
      {
        series1,
        series2
      }
    ),
    description && /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsx("p", { children: description }) })
  ] });
};
var TimeSeriesIndex_default = SeriesComparison;
var TimeRangeButton2 = ({ active, onClick, children }) => /* @__PURE__ */ jsx(
  Button,
  {
    variant: active ? "default" : "ghost",
    size: "sm",
    onClick,
    className: `transition-all ${active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"}`,
    children
  }
);
var recessionPeriods = [
  { start: "1960-04-01", end: "1961-02-01" },
  { start: "1969-12-01", end: "1970-11-01" },
  { start: "1973-11-01", end: "1975-03-01" },
  { start: "1980-01-01", end: "1980-07-01" },
  { start: "1981-07-01", end: "1982-11-01" },
  { start: "1990-07-01", end: "1991-03-01" },
  { start: "2001-03-01", end: "2001-11-01" },
  { start: "2007-12-01", end: "2009-06-01" },
  { start: "2020-02-01", end: "2020-04-01" }
];
var DualAxisChart = ({
  series1Data,
  series2Data,
  series1Name,
  series2Name,
  series1Unit,
  series2Unit,
  title = "Housing Market Indicators",
  description
}) => {
  const [timeRange, setTimeRange] = useState("MAX");
  const [showRecessions, setShowRecessions] = useState(true);
  const { theme } = useTheme();
  const colors = {
    series1: "#4299e1",
    series2: "#f59e0b"};
  const filteredData = React25__default.useMemo(() => {
    if (!series1Data?.length || !series2Data?.length) return [];
    const now = /* @__PURE__ */ new Date();
    let startDate;
    const ranges = {
      "1Y": () => new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      "2Y": () => new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      "5Y": () => new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()),
      "MAX": () => new Date(Math.min(+new Date(series1Data[0].date), +new Date(series2Data[0].date)))
    };
    startDate = ranges[timeRange]();
    const filteredSeries1 = series1Data.filter((item) => new Date(item.date) >= startDate);
    const filteredSeries2 = series2Data.filter((item) => new Date(item.date) >= startDate);
    const mergedData = [];
    let i = 0, j = 0;
    while (i < filteredSeries1.length && j < filteredSeries2.length) {
      const date1 = new Date(filteredSeries1[i].date);
      const date2 = new Date(filteredSeries2[j].date);
      if (date1.getTime() === date2.getTime()) {
        mergedData.push({
          date: filteredSeries1[i].date,
          [series1Name]: filteredSeries1[i].value,
          [series2Name]: filteredSeries2[j].value
        });
        i++;
        j++;
      } else if (date1 < date2) {
        i++;
      } else {
        j++;
      }
    }
    return mergedData;
  }, [series1Data, series2Data, series1Name, series2Name, timeRange]);
  const timeRanges = ["1Y", "2Y", "5Y", "MAX"];
  const formatDate = (str) => {
    const date = new Date(str);
    if (timeRange === "MAX") {
      return date.getFullYear().toString();
    }
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };
  const CustomTooltip = ({
    active,
    payload,
    label
  }) => {
    if (active && payload && payload.length) {
      return /* @__PURE__ */ jsxs("div", { className: "bg-background p-4 rounded-lg shadow-lg border border-border", children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-foreground", children: formatDate(label || "") }),
        payload.map((entry) => /* @__PURE__ */ jsxs(
          "p",
          {
            className: "text-sm text-muted-foreground flex items-center",
            children: [
              /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full mr-2", style: { backgroundColor: entry.color } }),
              /* @__PURE__ */ jsxs("span", { children: [
                entry.name,
                ":"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "ml-1 font-medium", style: { color: entry.color }, children: typeof entry.value === "number" ? `${entry.value.toFixed(1)} ${entry.name === series1Name ? series1Unit : series2Unit}` : "N/A" })
            ]
          },
          entry.dataKey
        ))
      ] });
    }
    return null;
  };
  const yAxis1Domain = React25__default.useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map((item) => Number(item[series1Name])).filter(
      (value) => value !== void 0 && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series1Name]);
  const yAxis2Domain = React25__default.useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map((item) => Number(item[series2Name])).filter(
      (value) => value !== void 0 && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series2Name]);
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-background shadow-lg rounded-lg border", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-row items-center justify-between space-y-0 pb-2 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-medium", children: title }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-2", children: timeRanges.map((range) => /* @__PURE__ */ jsx(
        TimeRangeButton2,
        {
          active: timeRange === range,
          onClick: () => setTimeRange(range),
          children: range
        },
        range
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 pt-0", children: [
      description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-6", children: description }),
      /* @__PURE__ */ jsx("div", { className: "h-96", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
        LineChart,
        {
          data: filteredData,
          margin: { top: 20, right: 30, left: 0, bottom: 0 },
          children: [
            /* @__PURE__ */ jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                className: "stroke-muted",
                vertical: false
              }
            ),
            /* @__PURE__ */ jsx(
              Legend,
              {
                verticalAlign: "top",
                align: "left",
                height: 36,
                iconType: "circle",
                formatter: (value) => /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: value })
              }
            ),
            /* @__PURE__ */ jsx(
              Brush,
              {
                dataKey: "date",
                height: 30,
                stroke: "#8884d8",
                fill: "#fff",
                tickFormatter: formatDate,
                travellerWidth: 10,
                startIndex: 0,
                endIndex: filteredData.length - 1,
                children: /* @__PURE__ */ jsxs(LineChart, { children: [
                  /* @__PURE__ */ jsx(Line, { dataKey: series1Name, stroke: colors.series1, dot: false }),
                  /* @__PURE__ */ jsx(Line, { dataKey: series2Name, stroke: colors.series2, dot: false })
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "date",
                axisLine: false,
                tickLine: false,
                tickFormatter: formatDate,
                tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 },
                dy: 10,
                minTickGap: 5,
                interval: "preserveStartEnd"
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                yAxisId: "left",
                domain: yAxis1Domain,
                orientation: "left",
                axisLine: false,
                tickLine: false,
                tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 },
                width: 60,
                dx: -10,
                label: {
                  value: series1Unit,
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: colors.series1, fontSize: 12 }
                },
                tickFormatter: (value) => value.toFixed(1)
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                yAxisId: "right",
                domain: yAxis2Domain,
                orientation: "right",
                axisLine: false,
                tickLine: false,
                tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 },
                width: 60,
                dx: 10,
                label: {
                  value: series2Unit,
                  angle: 90,
                  position: "insideRight",
                  style: { fill: colors.series2, fontSize: 12 }
                },
                tickFormatter: (value) => value.toFixed(1)
              }
            ),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                content: (props) => /* @__PURE__ */ jsx(CustomTooltip, { ...props })
              }
            ),
            showRecessions && recessionPeriods.map((period, index) => /* @__PURE__ */ jsx(
              ReferenceArea,
              {
                x1: period.start,
                x2: period.end,
                className: "fill-muted",
                fillOpacity: 0.4,
                alwaysShow: true,
                ifOverflow: "visible"
              },
              index
            )),
            /* @__PURE__ */ jsx(
              Line,
              {
                yAxisId: "left",
                type: "monotone",
                dataKey: series1Name,
                stroke: colors.series1,
                strokeWidth: 2,
                dot: false,
                activeDot: { r: 6, fill: colors.series1 }
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                yAxisId: "right",
                type: "monotone",
                dataKey: series2Name,
                stroke: colors.series2,
                strokeWidth: 2,
                dot: false,
                activeDot: { r: 6, fill: colors.series2 }
              }
            )
          ]
        }
      ) }) })
    ] })
  ] });
};
var DualAxisChart_default = DualAxisChart;
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn2(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
function Switch({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SwitchPrimitive.Root,
    {
      "data-slot": "switch",
      className: cn2(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        SwitchPrimitive.Thumb,
        {
          "data-slot": "switch-thumb",
          className: cn2(
            "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
          )
        }
      )
    }
  );
}
var COLORS = ["#2196f3", "#f44336", "#4caf50", "#ff9800", "#9c27b0", "#795548", "#607d8b"];
var presidentialTerms = [
  { start: 1971, end: 1976, party: "Republican", president: "Nixon/Ford" },
  { start: 1976, end: 1980, party: "Democrat", president: "Carter" },
  { start: 1980, end: 1992, party: "Republican", president: "Reagan/Bush" },
  { start: 1992, end: 2e3, party: "Democrat", president: "Clinton" },
  { start: 2e3, end: 2008, party: "Republican", president: "Bush" },
  // Simplified name
  { start: 2008, end: 2016, party: "Democrat", president: "Obama" },
  { start: 2016, end: 2020, party: "Republican", president: "Trump" },
  { start: 2020, end: 2024, party: "Democrat", president: "Biden" }
  // Adjust end year if needed
];
var generateTicks = (start, end, interval) => {
  const ticks = [];
  const firstTick = Math.ceil(start / interval) * interval;
  for (let i = firstTick; i <= end; i += interval) {
    if (i <= end) {
      ticks.push(i);
    }
  }
  return ticks;
};
var processDataPoint = (d) => {
  const yearNum = parseInt(String(d.year), 10);
  const valueNum = typeof d.value === "number" ? d.value : parseFloat(String(d.value));
  return {
    ...d,
    year: isNaN(yearNum) ? null : yearNum,
    value: typeof valueNum === "number" && !isNaN(valueNum) ? valueNum : null
  };
};
function TimeTrendDemoChart({
  data,
  demographicGroups,
  demographic,
  defaultVisibleGroups
}) {
  const [visibleGroups, setVisibleGroups] = useState(
    new Set(defaultVisibleGroups || demographicGroups)
  );
  const [showCI, setShowCI] = useState(false);
  useEffect(() => {
    setVisibleGroups(new Set(defaultVisibleGroups || demographicGroups));
  }, [demographicGroups, defaultVisibleGroups]);
  if (!data || !data.dataPoints || !Array.isArray(data.dataPoints) || data.dataPoints.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-gray-500", children: "No data available to display chart." });
  }
  const processedDataPoints = data.dataPoints.map(processDataPoint);
  const allValidYearsNumeric = processedDataPoints.map((d) => d.year).filter((year) => year !== null);
  if (allValidYearsNumeric.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-gray-500", children: "Data contains no valid years." });
  }
  const minYearInData = Math.min(...allValidYearsNumeric);
  const maxYearInData = Math.max(...allValidYearsNumeric);
  const relevantPresidentialTerms = presidentialTerms.filter(
    (term) => term.end >= minYearInData && term.start <= maxYearInData
  );
  const firstRelevantBandStart = relevantPresidentialTerms.length > 0 ? Math.min(...relevantPresidentialTerms.map((t) => t.start)) : minYearInData;
  const xAxisMin = Math.min(firstRelevantBandStart, minYearInData);
  const xAxisMax = maxYearInData;
  const xTickInterval = 5;
  const xAxisTicks = generateTicks(xAxisMin, xAxisMax, xTickInterval);
  const groupedData = demographicGroups.map((group) => {
    const groupData = processedDataPoints.filter((d) => d[demographic] === group && d.year !== null).map((d) => d).sort((a, b) => a.year - b.year);
    return { name: group, data: groupData };
  });
  const hasCIData = groupedData.some(
    (g) => g.data.some((d) => d.standard_error !== void 0 || d.ci_lower !== void 0 && d.ci_upper !== void 0)
  );
  const getVisibleBounds = () => {
    let overallMin = Infinity;
    let overallMax = -Infinity;
    let hasVisibleData = false;
    groupedData.filter((group) => visibleGroups.has(group.name)).forEach((group) => {
      group.data.forEach((point) => {
        if (point.value === null) return;
        hasVisibleData = true;
        let currentMin = point.value;
        let currentMax = point.value;
        if (showCI) {
          if (point.ci_lower !== void 0 && point.ci_lower !== null) {
            currentMin = point.ci_lower;
          } else if (typeof point.standard_error === "number" && !isNaN(point.standard_error)) {
            currentMin = point.value - 1.96 * point.standard_error;
          }
          if (point.ci_upper !== void 0 && point.ci_upper !== null) {
            currentMax = point.ci_upper;
          } else if (typeof point.standard_error === "number" && !isNaN(point.standard_error)) {
            currentMax = point.value + 1.96 * point.standard_error;
          }
        }
        if (typeof currentMin === "number" && !isNaN(currentMin)) {
          overallMin = Math.min(overallMin, currentMin);
        }
        if (typeof currentMax === "number" && !isNaN(currentMax)) {
          overallMax = Math.max(overallMax, currentMax);
        }
      });
    });
    return hasVisibleData && isFinite(overallMin) && isFinite(overallMax) ? { min: overallMin, max: overallMax } : { min: 0, max: 100 };
  };
  const { min: effectiveMin, max: effectiveMax } = getVisibleBounds();
  let yDomain = [0, 100];
  if (isFinite(effectiveMin) && isFinite(effectiveMax)) {
    const dataRange = effectiveMax - effectiveMin;
    const buffer = Math.max(5, dataRange * 0.15);
    const lowerBound = effectiveMin - buffer;
    const upperBound = effectiveMax + buffer;
    const finalMin = Math.max(0, lowerBound);
    const finalMax = Math.min(100, upperBound);
    const minRange = 10;
    if (finalMin >= finalMax) {
      const centerValue = Math.min(100, Math.max(0, (effectiveMin + effectiveMax) / 2));
      yDomain = [Math.max(0, Math.floor((centerValue - minRange / 2) / 5) * 5), Math.min(100, Math.ceil((centerValue + minRange / 2) / 5) * 5)];
      if (yDomain[0] >= yDomain[1]) {
        yDomain = [Math.max(0, finalMin - 5), Math.min(100, finalMax + 5)];
      }
    } else if (finalMax - finalMin < minRange) {
      const midPoint = (finalMin + finalMax) / 2;
      yDomain = [Math.max(0, Math.floor((midPoint - minRange / 2) / 5) * 5), Math.min(100, Math.ceil((midPoint + minRange / 2) / 5) * 5)];
      if (yDomain[0] >= yDomain[1]) {
        yDomain = [Math.max(0, finalMin - buffer), Math.min(100, finalMax + buffer)];
        if (yDomain[0] >= yDomain[1]) yDomain = [Math.max(0, finalMin - 5), Math.min(100, finalMax + 5)];
      }
    } else {
      yDomain = [finalMin, finalMax];
    }
  }
  const handleLegendClick = (entry) => {
    setVisibleGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entry.value)) {
        newSet.delete(entry.value);
      } else {
        newSet.add(entry.value);
      }
      return newSet;
    });
  };
  const yAxisTickFormatter = (value) => {
    const metadata = data.dataPointMetadata.find((d) => d.id === "value");
    const prefixValue = metadata?.value_prefix;
    const suffixValue = metadata?.value_suffix;
    const prefix = prefixValue && (typeof prefixValue !== "object" || Object.keys(prefixValue).length > 0) ? String(prefixValue) : "";
    const suffix = suffixValue && (typeof suffixValue !== "object" || Object.keys(suffixValue).length > 0) ? String(suffixValue) : "%";
    const num = Number(value);
    if (isNaN(num)) return String(value);
    const formattedValue = num.toLocaleString(void 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${prefix}${formattedValue}${suffix}`;
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0 || label === void 0) return null;
    const visiblePayload = payload.filter((series) => visibleGroups.has(series.name));
    if (visiblePayload.length === 0) return null;
    const valueMetadata = data.dataPointMetadata.find((m) => m.id === "value");
    const suffix = typeof valueMetadata?.value_suffix === "string" ? valueMetadata.value_suffix : "%";
    const prefix = typeof valueMetadata?.value_prefix === "string" ? valueMetadata.value_prefix : "";
    return /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 border border-gray-300 shadow-lg rounded-md text-sm max-w-xs", children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold mb-2 text-gray-700", children: `Year: ${label}` }),
      visiblePayload.map((series) => {
        const colorIndex = demographicGroups.indexOf(series.name);
        const color = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : series.color || "#8884d8";
        const pointData = series.payload;
        return /* @__PURE__ */ jsxs("div", { className: "mb-1.5 last:mb-0", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", style: { color }, children: series.name }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", style: { color }, children: `Value: ${series.value != null ? `${prefix}${series.value.toFixed(1)}${suffix}` : "N/A"}` }),
          pointData?.ci_lower !== void 0 && pointData?.ci_upper !== void 0 && /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-xs", children: `95% CI: [${pointData.ci_lower.toFixed(1)}%, ${pointData.ci_upper.toFixed(1)}%]` }),
          pointData?.n_actual && /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-xs", children: `N: ${pointData.n_actual.toLocaleString()}` })
        ] }, series.name);
      })
    ] });
  };
  console.log("[TimeTrendDemoChart] Rendering with:", {
    demographicGroups,
    demographic,
    visibleGroups: Array.from(visibleGroups),
    groupedDataLength: groupedData.length,
    groupedDataSample: groupedData.map((g) => ({ name: g.name, dataLength: g.data.length })),
    yDomain,
    xAxisMin,
    xAxisMax,
    hasCIData,
    showCI
  });
  return /* @__PURE__ */ jsxs("div", { className: "w-full bg-white p-4 md:p-6 rounded-lg shadow", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800", children: data.metadata.title }),
      data.metadata.subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: data.metadata.subtitle }),
      data.metadata.question && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 italic mt-1", children: data.metadata.question })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-[450px] md:h-[500px] w-full", style: { border: "2px solid blue" }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
      LineChart,
      {
        margin: { top: 20, right: 20, left: 10, bottom: 5 },
        children: [
          relevantPresidentialTerms.map((term, index) => /* @__PURE__ */ jsx(
            ReferenceArea,
            {
              x1: term.start,
              x2: term.end,
              yAxisId: "left",
              fill: term.party === "Democrat" ? "rgba(230, 240, 255, 0.5)" : "rgba(255, 235, 238, 0.5)",
              ifOverflow: "visible",
              shapeRendering: "crispEdges"
            },
            `term-bg-${index}`
          )),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e0e0e0", vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "year",
              type: "number",
              domain: [xAxisMin, xAxisMax],
              allowDataOverflow: true,
              ticks: xAxisTicks,
              tick: { fontSize: 11, fill: "#666" },
              padding: { left: 10, right: 10 },
              tickFormatter: (year) => String(year),
              interval: 0,
              axisLine: { stroke: "#ccc" },
              tickLine: { stroke: "#ccc" }
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              yAxisId: "left",
              tickFormatter: yAxisTickFormatter,
              domain: yDomain,
              allowDataOverflow: false,
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 11, fill: "#666" },
              width: 50
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}), cursor: { stroke: "#a0a0a0", strokeWidth: 1, strokeDasharray: "3 3" } }),
          /* @__PURE__ */ jsx(
            Legend,
            {
              verticalAlign: "bottom",
              align: "center",
              height: 40,
              onClick: handleLegendClick,
              iconSize: 10,
              wrapperStyle: { paddingTop: "10px" },
              formatter: (value) => {
                const isVisible = visibleGroups.has(value);
                return /* @__PURE__ */ jsx("span", { style: { color: isVisible ? "#333" : "#aaa", cursor: "pointer", marginLeft: "4px", fontSize: "12px" }, children: value });
              }
            }
          ),
          groupedData.map((group) => {
            const colorIndex = demographicGroups.indexOf(group.name);
            const color = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : "#8884d8";
            return /* @__PURE__ */ jsx(
              Line,
              {
                yAxisId: "left",
                type: "linear",
                data: group.data,
                dataKey: "value",
                name: group.name,
                stroke: color,
                strokeWidth: 2,
                dot: { r: 3, fill: color, strokeWidth: 1, stroke: "white" },
                activeDot: { r: 5, strokeWidth: 1, stroke: "white" },
                hide: !visibleGroups.has(group.name),
                connectNulls: true,
                isAnimationActive: false,
                children: showCI && hasCIData && /* @__PURE__ */ jsx(
                  ErrorBar,
                  {
                    dataKey: (d) => typeof d.standard_error === "number" && !isNaN(d.standard_error) ? 1.96 * d.standard_error : 0,
                    width: 4,
                    strokeWidth: 1.5,
                    stroke: color,
                    opacity: 0.35,
                    direction: "y"
                  }
                )
              },
              group.name
            );
          }),
          relevantPresidentialTerms.map((term, index) => /* @__PURE__ */ jsx(
            Text,
            {
              x: (term.start + term.end) / 2,
              y: typeof yDomain[1] === "number" ? yDomain[1] - 3 : 97,
              textAnchor: "middle",
              verticalAnchor: "start",
              fill: "#6b7280",
              fontSize: 10,
              children: term.president
            },
            `term-label-${index}`
          ))
        ]
      },
      `${demographic}-${showCI}`
    ) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-1 pt-2 border-t border-gray-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 text-left order-1 sm:order-none", children: [
        "Source: ",
        data.metadata.source?.name || "Not specified",
        data.metadata.observations && ` (${data.metadata.observations.toLocaleString()} Observations)`
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 order-2 sm:order-none", children: [
        /* @__PURE__ */ jsx(
          Switch,
          {
            id: "show-ci",
            checked: showCI,
            onCheckedChange: setShowCI,
            disabled: !hasCIData
          }
        ),
        /* @__PURE__ */ jsx(Label, { htmlFor: "show-ci", className: `text-xs ${!hasCIData ? "text-gray-400" : "text-gray-600"}`, children: "Show 95% CI" })
      ] })
    ] })
  ] });
}
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Root,
    {
      "data-slot": "tabs",
      className: cn2("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.List,
    {
      "data-slot": "tabs-list",
      className: cn2(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn2(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function TabsContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Content,
    {
      "data-slot": "tabs-content",
      className: cn2("flex-1 outline-none", className),
      ...props
    }
  );
}
var domains = {
  "Age Group": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
  "Education Attained": [
    "Less than H.S.",
    "H.S. or G.E.D.",
    "Some post-H.S.",
    "College graduate"
  ],
  "Household Income": [
    "Less than $15,000",
    "$15,000-$24,999",
    "$25,000-$34,999",
    "$35,000-$49,999",
    "$50,000-$99,999",
    "$100,000-$199,999",
    "$200,000+"
  ],
  "Race/Ethnicity": [
    "White, non-Hispanic",
    "Black, non-Hispanic",
    "Asian, non-Hispanic",
    "Hispanic"
  ],
  Gender: ["Female", "Male"]
};
var categoryReference = {
  "Age Group": { icon: Users, color: "text-blue-500" },
  "Education Attained": { icon: GraduationCap, color: "text-green-500" },
  Gender: { icon: UserCircle2, color: "text-purple-500" },
  "Household Income": { icon: DollarSign, color: "text-yellow-500" },
  "Race/Ethnicity": { icon: Palette, color: "text-red-500" }
};
var defaultCategoryInfo = {
  icon: Users,
  color: "text-gray-500"
};
function getCategoryInfo(category) {
  return categoryReference[category] || defaultCategoryInfo;
}
function DemographicLineChart({
  data,
  ylabel = "Value (%)"
}) {
  const [activeTab, setActiveTab] = useState(null);
  const [demographicCategories, setDemographicCategories] = useState([]);
  React25__default.useEffect(() => {
    if (!data || typeof data !== "object") return;
    const categories = Object.entries(data).filter(
      ([_, categoryData]) => categoryData && typeof categoryData === "object" && Object.values(categoryData).some((value) => value !== null)
    ).map(([key, categoryData]) => ({
      key,
      ...getCategoryInfo(key),
      data: Object.entries(categoryData).map(([breakOut, details]) => ({
        break_out: breakOut,
        ...details,
        error: [
          details.value - details.confidence_limit_low,
          details.confidence_limit_high - details.value
        ],
        break_out_category: key
      })).sort((a, b) => {
        const order = domains[key];
        if (!order) return 0;
        const indexA = order.indexOf(a.break_out);
        const indexB = order.indexOf(b.break_out);
        return indexA - indexB;
      })
    }));
    setDemographicCategories(categories);
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].key);
    }
  }, [data, activeTab]);
  if (demographicCategories.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "border rounded-lg p-6", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "No demographic data available" }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" }),
      "Demographic Line Chart with Error Bars"
    ] }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Tabs, { value: activeTab || void 0, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsx(TabsList, { className: "grid w-full", style: { gridTemplateColumns: `repeat(${demographicCategories.length}, 1fr)` }, children: demographicCategories.map((category) => {
        const Icon = category.icon;
        return /* @__PURE__ */ jsxs(TabsTrigger, { value: category.key, children: [
          /* @__PURE__ */ jsx(Icon, { className: `w-4 h-4 mr-2 ${category.color}` }),
          category.key
        ] }, category.key);
      }) }),
      demographicCategories.map((category) => /* @__PURE__ */ jsxs(TabsContent, { value: category.key, className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxs(
          LineChart,
          {
            width: 600,
            height: 400,
            data: category.data,
            margin: { top: 20, right: 30, left: 20, bottom: 25 },
            className: "w-full h-full",
            children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
              /* @__PURE__ */ jsx(
                XAxis,
                {
                  dataKey: "break_out",
                  label: {
                    value: category.data[0]?.break_out_category || "",
                    position: "insideBottom",
                    offset: -10
                  },
                  interval: 0,
                  tick: {
                    fill: "hsl(var(--foreground))",
                    fontSize: 10,
                    textAnchor: "end",
                    dy: 10
                  },
                  height: 80,
                  padding: { left: 30, right: 30 }
                }
              ),
              /* @__PURE__ */ jsx(
                YAxis,
                {
                  label: {
                    value: ylabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 0,
                    style: { textAnchor: "middle" }
                  },
                  tick: { fill: "hsl(var(--foreground))" }
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: {
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))"
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                Line,
                {
                  dataKey: "value",
                  stroke: "hsl(var(--foreground))",
                  isAnimationActive: false,
                  dot: true,
                  children: /* @__PURE__ */ jsx(
                    ErrorBar,
                    {
                      dataKey: "error",
                      width: 4,
                      strokeWidth: 2,
                      stroke: "grey"
                    }
                  )
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 text-center", children: "Error bars represent 95% confidence intervals" })
      ] }, category.key))
    ] }) })
  ] });
}
var domains2 = {
  "Age Group": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
  "Education Attained": [
    "Less than H.S.",
    "H.S. or G.E.D.",
    "Some post-H.S.",
    "College graduate"
  ],
  "Household Income": [
    "Less than $15,000",
    "$15,000-$24,999",
    "$25,000-$34,999",
    "$35,000-$49,999",
    "$50,000-$99,999",
    "$100,000-$199,999",
    "$200,000+"
  ],
  "Race/Ethnicity": [
    "White, non-Hispanic",
    "Black, non-Hispanic",
    "Asian, non-Hispanic",
    "Hispanic"
  ],
  Gender: ["Female", "Male"]
};
var categoryReference2 = {
  "Age Group": { icon: Users, color: "text-blue-500" },
  "Education Attained": { icon: GraduationCap, color: "text-green-500" },
  Gender: { icon: UserCircle2, color: "text-purple-500" },
  "Household Income": { icon: DollarSign, color: "text-yellow-500" },
  "Race/Ethnicity": { icon: Palette, color: "text-red-500" }
};
var defaultCategoryInfo2 = {
  icon: Users,
  color: "text-gray-500"
};
function getCategoryInfo2(category) {
  return categoryReference2[category] || defaultCategoryInfo2;
}
function DemographicDotPlot({
  data,
  ylabel = "Value (%)"
}) {
  const [activeTab, setActiveTab] = useState(null);
  const [demographicCategories, setDemographicCategories] = useState([]);
  React25__default.useEffect(() => {
    if (!data || typeof data !== "object") return;
    const categories = Object.entries(data).filter(
      ([_, categoryData]) => categoryData && typeof categoryData === "object" && Object.values(categoryData).some((value) => value !== null)
    ).map(([key, categoryData]) => ({
      key,
      ...getCategoryInfo2(key),
      data: Object.entries(categoryData).map(([breakOut, details]) => ({
        break_out: breakOut,
        ...details,
        error: [
          details.value - details.confidence_limit_low,
          details.confidence_limit_high - details.value
        ],
        break_out_category: key
      })).sort((a, b) => {
        const order = domains2[key];
        if (!order) return 0;
        const indexA = order.indexOf(a.break_out);
        const indexB = order.indexOf(b.break_out);
        return indexA - indexB;
      })
    }));
    setDemographicCategories(categories);
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].key);
    }
  }, [data, activeTab]);
  if (demographicCategories.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "border rounded-lg p-6", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "No demographic data available" }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" }),
      "Demographic Dot Plot with Error Bars"
    ] }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Tabs, { value: activeTab || void 0, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsx(TabsList, { className: "grid w-full", style: { gridTemplateColumns: `repeat(${demographicCategories.length}, 1fr)` }, children: demographicCategories.map((category) => {
        const Icon = category.icon;
        return /* @__PURE__ */ jsxs(TabsTrigger, { value: category.key, children: [
          /* @__PURE__ */ jsx(Icon, { className: `w-4 h-4 mr-2 ${category.color}` }),
          category.key
        ] }, category.key);
      }) }),
      demographicCategories.map((category) => /* @__PURE__ */ jsxs(TabsContent, { value: category.key, className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxs(
          ScatterChart,
          {
            width: 600,
            height: 400,
            data: category.data,
            margin: { top: 20, right: 30, left: 20, bottom: 25 },
            className: "w-full h-full",
            children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
              /* @__PURE__ */ jsx(
                XAxis,
                {
                  dataKey: "break_out",
                  label: {
                    value: category.data[0]?.break_out_category || "",
                    position: "insideBottom",
                    offset: -10
                  },
                  interval: 0,
                  tick: {
                    fill: "hsl(var(--foreground))",
                    fontSize: 10,
                    textAnchor: "end",
                    dy: 10
                  },
                  height: 80,
                  padding: { left: 30, right: 30 }
                }
              ),
              /* @__PURE__ */ jsx(
                YAxis,
                {
                  label: {
                    value: ylabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 0,
                    style: { textAnchor: "middle" }
                  },
                  tick: { fill: "hsl(var(--foreground))" }
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: {
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))"
                  }
                }
              ),
              /* @__PURE__ */ jsx(Scatter, { dataKey: "value", fill: "hsl(var(--foreground))", isAnimationActive: false, children: /* @__PURE__ */ jsx(
                ErrorBar,
                {
                  dataKey: "error",
                  width: 4,
                  strokeWidth: 2,
                  stroke: "grey"
                }
              ) })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 text-center", children: "Error bars represent 95% confidence intervals" })
      ] }, category.key))
    ] }) })
  ] });
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn2(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function StateBarChart({ data }) {
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedData = Object.entries(data.state_data).filter((entry) => entry[1].overall !== null).map(([code, data2]) => ({
    code,
    state: data2.state_name,
    overall: data2.overall
  })).sort((a, b) => sortOrder === "desc" ? b.overall - a.overall : a.overall - b.overall).filter(
    (item) => item.state.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const toggleSort = () => {
    setSortOrder((prev) => prev === "desc" ? "asc" : "desc");
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: data.clean_title }),
        /* @__PURE__ */ jsxs("span", { className: "text-md text-gray-500", children: [
          "(",
          data.year,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-4", children: /* @__PURE__ */ jsx("span", { className: "text-md text-gray-500", children: data.question }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search states...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "max-w-sm"
          }
        ),
        /* @__PURE__ */ jsxs(Button, { onClick: toggleSort, variant: "outline", children: [
          "Sort ",
          sortOrder === "desc" ? "Ascending" : "Descending",
          /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `${isExpanded ? "h-auto" : "h-[400px]"}`, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: isExpanded ? 800 : 400, children: /* @__PURE__ */ jsxs(BarChart$1, { data: sortedData, layout: "vertical", margin: { right: 20, top: 20, bottom: 40 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          type: "number",
          label: { value: `Response: ${data.response} (%)`, position: "bottom", offset: 0 },
          tickFormatter: (value) => `${value}%`
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          dataKey: "state",
          type: "category",
          width: 180,
          interval: isExpanded ? 0 : 5,
          tick: { fontSize: 10 }
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          formatter: (value) => [`${value}%`, `Response: ${data.response}`],
          labelFormatter: (label) => `State: ${label}`
        }
      ),
      /* @__PURE__ */ jsx(Bar, { dataKey: "overall", fill: "#4A4A4A" })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsx(Button, { onClick: () => setIsExpanded(!isExpanded), variant: "outline", children: isExpanded ? /* @__PURE__ */ jsxs(Fragment, { children: [
      "See less ",
      /* @__PURE__ */ jsx(ChevronUp, { className: "ml-2 h-4 w-4" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      "Expand ",
      /* @__PURE__ */ jsx(ChevronDown, { className: "ml-2 h-4 w-4" })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-6", children: /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Source: CDC Behavioral Risk Factor Surveillance System" }) })
  ] });
}
var HealthScatterplot = ({ data }) => {
  const singleRef = useRef(null);
  const regressionRef = useRef(null);
  const facetRef = useRef(null);
  const cleanData = useMemo(() => data.filter((d) => d.dir2020 !== void 0), [data]);
  useEffect(() => {
    if (!data || data.length === 0) return;
    if (singleRef.current) singleRef.current.innerHTML = "";
    if (regressionRef.current) regressionRef.current.innerHTML = "";
    if (facetRef.current) facetRef.current.innerHTML = "";
    const singlePlot = Plot24.plot({
      title: "County Health Correlations",
      subtitle: "Obesity vs Diabetes prevalence by county",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      marks: [
        Plot24.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: (d) => Math.sqrt(d.population) * 8e-3,
          fill: (d) => d.dir2020,
          fillOpacity: 0.6,
          stroke: "black",
          strokeWidth: 0.5,
          title: (d) => `Obesity: ${d.OBESITY_AdjPrev}%
Diabetes: ${d.DIABETES_AdjPrev}%
Population: ${d.population?.toLocaleString()}`
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 700,
      height: 500
    });
    const regressionPlot = Plot24.plot({
      title: "County Health Correlations with Trend",
      subtitle: "Including linear regression line",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      marks: [
        Plot24.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: (d) => Math.sqrt(d.population) * 8e-3,
          fill: (d) => d.dir2020,
          fillOpacity: 0.7,
          stroke: "black",
          strokeWidth: 0.5,
          title: (d) => `Obesity: ${d.OBESITY_AdjPrev}%
Diabetes: ${d.DIABETES_AdjPrev}%
Population: ${d.population?.toLocaleString()}`
        }),
        Plot24.linearRegressionY(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          strokeWidth: 2,
          stroke: "#ff6b35"
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 700,
      height: 500
    });
    const facetPlot = Plot24.plot({
      title: "County Health Correlations by Category",
      subtitle: "Faceted by demographic grouping",
      caption: "Source: CDC",
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif"
      },
      x: {
        label: "Obesity (%)",
        grid: true
      },
      y: {
        label: "Diabetes (%)",
        grid: true
      },
      facet: { data: cleanData, x: "dir2020" },
      marks: [
        Plot24.dot(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          r: (d) => Math.sqrt(d.population) * 0.01,
          stroke: "dir2020",
          fill: "dir2020",
          fillOpacity: 0.3,
          title: (d) => `Obesity: ${d.OBESITY_AdjPrev}%
Diabetes: ${d.DIABETES_AdjPrev}%
Population: ${d.population?.toLocaleString()}`,
          tip: true
        }),
        Plot24.linearRegressionY(cleanData, {
          x: "OBESITY_AdjPrev",
          y: "DIABETES_AdjPrev",
          stroke: "dir2020",
          strokeWidth: 2
        })
      ],
      color: {
        legend: true,
        scheme: "category10"
      },
      width: 800,
      height: 600
    });
    if (singleRef.current) singleRef.current.appendChild(singlePlot);
    if (regressionRef.current) regressionRef.current.appendChild(regressionPlot);
    if (facetRef.current) facetRef.current.appendChild(facetPlot);
    return () => {
      singlePlot?.remove();
      regressionPlot?.remove();
      facetPlot?.remove();
    };
  }, [data, cleanData]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Scatterplot analysis exploring relationships between county-level health indicators. Each visualization reveals different aspects of the obesity-diabetes correlation using various analytical approaches." }) }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Basic Scatterplot" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Simple scatter plot showing the relationship between obesity and diabetes rates" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: singleRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Each point represents a county. Point size reflects population, and color indicates demographic grouping. The clear clustering pattern suggests a strong positive relationship between these health metrics." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Regression Analysis" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Same data with linear regression line showing the overall trend" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: regressionRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "The orange regression line shows the positive correlation between obesity and diabetes rates across counties. The linear trend confirms the strong association between these health conditions at the population level." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Faceted Analysis" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Separate panels for each demographic category with individual regression lines" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { ref: facetRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Faceted view allows comparison of obesity-diabetes relationships across different demographic groups, each with its own regression line. This reveals how the correlation strength may vary by population characteristics." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Scatterplot Techniques" }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Basic Scatter" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Point-to-point relationships" }),
            /* @__PURE__ */ jsx("li", { children: "Size and color encoding" }),
            /* @__PURE__ */ jsx("li", { children: "Pattern identification" }),
            /* @__PURE__ */ jsx("li", { children: "Outlier detection" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Regression Lines" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Trend quantification" }),
            /* @__PURE__ */ jsx("li", { children: "Predictive modeling" }),
            /* @__PURE__ */ jsx("li", { children: "Correlation strength" }),
            /* @__PURE__ */ jsx("li", { children: "Statistical inference" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-medium", children: "Faceted Views" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Group comparisons" }),
            /* @__PURE__ */ jsx("li", { children: "Conditional relationships" }),
            /* @__PURE__ */ jsx("li", { children: "Subpopulation analysis" }),
            /* @__PURE__ */ jsx("li", { children: "Interaction effects" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var HealthScatterplot_default = HealthScatterplot;

// src/utils/statistical-utils.ts
function calculateQuartiles(data) {
  if (data.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [], iqr: 0 };
  }
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = quantile(sorted, 0.25);
  const median2 = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
  const nonOutliers = sorted.filter((v) => v >= lowerFence && v <= upperFence);
  const min = nonOutliers.length > 0 ? nonOutliers[0] : sorted[0];
  const max = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : sorted[n - 1];
  return { min, q1, median: median2, q3, max, outliers, iqr };
}
function quantile(sortedData, p) {
  if (sortedData.length === 0) return 0;
  if (p <= 0) return sortedData[0];
  if (p >= 1) return sortedData[sortedData.length - 1];
  const index = (sortedData.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}
function mean2(data) {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}
function standardDeviation(data) {
  if (data.length === 0) return 0;
  const avg = mean2(data);
  const squareDiffs = data.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = mean2(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}
function kernelDensity(data, bandwidth, points = 50) {
  const n = data.length;
  if (n === 0) return [];
  const std = standardDeviation(data);
  const bw = 1.06 * std * Math.pow(n, -1 / 5);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = range * 0.1;
  const result = [];
  for (let i = 0; i < points; i++) {
    const x = min - padding + (max - min + 2 * padding) * i / (points - 1);
    let density3 = 0;
    for (const value of data) {
      const u = (x - value) / bw;
      density3 += Math.exp(-1 / 2 * u * u) / Math.sqrt(2 * Math.PI);
    }
    result.push({ x, density: density3 / (n * bw) });
  }
  return result;
}
function createHistogram(data, bins) {
  if (data.length === 0) return [];
  const numBins = bins ?? Math.ceil(Math.log2(data.length) + 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / numBins;
  const histogram = Array.from({ length: numBins }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    const binMid = (binStart + binEnd) / 2;
    return {
      bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      count: 0,
      binStart,
      binEnd,
      binMid
    };
  });
  data.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    histogram[binIndex].count++;
  });
  return histogram;
}
function HistogramRecharts({
  data,
  bins,
  width,
  height = 500,
  xlabel = "Value",
  ylabel = "Frequency",
  title,
  color = "hsl(var(--primary))",
  showMean = true,
  showMedian = false
}) {
  const histogramData = useMemo(() => {
    return createHistogram(data, bins);
  }, [data, bins]);
  const statistics = useMemo(() => {
    if (data.length === 0) return { mean: 0, median: 0 };
    const mean3 = data.reduce((sum, val) => sum + val, 0) / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median2 = sorted[Math.floor(sorted.length / 2)];
    return { mean: mean3, median: median2 };
  }, [data]);
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data2 = payload[0].payload;
      return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-800 p-3 border rounded shadow-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: data2.bin }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          "Count: ",
          data2.count
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Range: [",
          data2.binStart.toFixed(2),
          ", ",
          data2.binEnd.toFixed(2),
          ")"
        ] })
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: title }),
    /* @__PURE__ */ jsx(ResponsiveContainer, { width: width || "100%", height, children: /* @__PURE__ */ jsxs(BarChart$1, { data: histogramData, margin: { top: 20, right: 30, left: 20, bottom: 60 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "bin",
          label: { value: xlabel, position: "insideBottom", offset: -10 },
          angle: -45,
          textAnchor: "end",
          height: 80
        }
      ),
      /* @__PURE__ */ jsx(YAxis, { label: { value: ylabel, angle: -90, position: "insideLeft" } }),
      /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
      /* @__PURE__ */ jsx(Legend, {}),
      /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: color, name: "Frequency" }),
      showMean && /* @__PURE__ */ jsx(
        ReferenceLine,
        {
          x: histogramData.find(
            (d) => d.binStart <= statistics.mean && d.binEnd > statistics.mean
          )?.bin,
          stroke: "hsl(var(--destructive))",
          strokeWidth: 2,
          strokeDasharray: "5 5",
          label: { value: `Mean: ${statistics.mean.toFixed(2)}`, position: "top", fill: "hsl(var(--destructive))" }
        }
      ),
      showMedian && /* @__PURE__ */ jsx(
        ReferenceLine,
        {
          x: histogramData.find(
            (d) => d.binStart <= statistics.median && d.binEnd > statistics.median
          )?.bin,
          stroke: "hsl(var(--chart-2))",
          strokeWidth: 2,
          strokeDasharray: "5 5",
          label: { value: `Median: ${statistics.median.toFixed(2)}`, position: "bottom", fill: "hsl(var(--chart-2))" }
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxs("p", { children: [
      "Total observations: ",
      data.length,
      " \u2022 Bins: ",
      histogramData.length,
      " \u2022 Mean: ",
      statistics.mean.toFixed(2),
      " \u2022 Median: ",
      statistics.median.toFixed(2)
    ] }) })
  ] });
}
function ViolinPlot({
  data,
  width,
  height = 500,
  xlabel = "Category",
  ylabel = "Value",
  title,
  showBox = true
}) {
  const { violinShapes, scatterData, yDomain } = useMemo(() => {
    const shapes = data.map((item, idx) => {
      const density3 = kernelDensity(item.values, void 0, 100);
      const maxDensity = Math.max(...density3.map((d) => d.density));
      const quartiles = calculateQuartiles(item.values);
      return {
        category: item.category,
        categoryIndex: idx,
        density: density3.map((d) => ({
          y: d.x,
          width: maxDensity > 0 ? d.density / maxDensity * 0.35 : 0
        })),
        quartiles
      };
    });
    const points = shapes.flatMap(
      (shape) => shape.density.flatMap((d) => [
        {
          categoryIndex: shape.categoryIndex - d.width,
          category: shape.category,
          value: d.y
        },
        {
          categoryIndex: shape.categoryIndex + d.width,
          category: shape.category,
          value: d.y
        }
      ])
    );
    const allValues = data.flatMap((d) => d.values);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const padding = (maxVal - minVal) * 0.1;
    return {
      violinShapes: shapes,
      scatterData: points,
      yDomain: [minVal - padding, maxVal + padding]
    };
  }, [data]);
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data2 = payload[0].payload;
      return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-800 p-3 border rounded shadow-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: data2.category }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          "Value: ",
          data2.value?.toFixed(2) || "N/A"
        ] })
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: title }),
    /* @__PURE__ */ jsx(ResponsiveContainer, { width: width || "100%", height, children: /* @__PURE__ */ jsxs(ComposedChart, { margin: { top: 20, right: 30, left: 20, bottom: 80 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          type: "number",
          dataKey: "categoryIndex",
          domain: [-0.5, data.length - 0.5],
          ticks: data.map((_, idx) => idx),
          tickFormatter: (value) => data[Math.round(value)]?.category || "",
          label: { value: xlabel, position: "insideBottom", offset: -15 },
          angle: -45,
          textAnchor: "end",
          height: 100
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          type: "number",
          dataKey: "value",
          domain: yDomain,
          label: { value: ylabel, angle: -90, position: "insideLeft" }
        }
      ),
      /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
      /* @__PURE__ */ jsx(
        Scatter,
        {
          data: scatterData,
          fill: "hsl(var(--primary))",
          fillOpacity: 0.3,
          children: scatterData.map((entry, index) => /* @__PURE__ */ jsx(
            Cell,
            {
              fill: `hsl(${Math.floor(entry.categoryIndex + 0.5) * 60 % 360}, 70%, 50%)`
            },
            `cell-${index}`
          ))
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxs("p", { children: [
      "Violin plot showing distribution density (wider = more data points) \u2022 Categories: ",
      data.length
    ] }) })
  ] });
}

export { AbortionOpinionChart, basic_bar_v1_default as BarChart, stat_boxplot_v1_default as BoxPlot, BoxPlotFaceted, BoxPlotFacetedGrouped, BoxPlotGrouped, geo_bubble_v1_default as BubbleMap, BulletChart, Button, ChoroplethMap_default as ChoroplethMap, CorrelationHeatmap_default as CorrelationHeatmap, stat_demographic_bar_v1_default as DemographicBarChart, DemographicDotPlot, DemographicLineChart, stat_density_v1_default as DensityPlot, DistributionPlot, DivergingBar, basic_dot_v1_default as DotPlot, DualAxisChart_default as DualAxisChart, EuropeMap_default as EuropeMap, FacetedPlot, ForestPlot, GeoDensityMap_default as GeoDensityMap, HealthScatterplot_default as HealthScatterplot, HistogramObservable, HistogramRecharts, Input, Label, LineChart_default as LineChart, OddsRatio_default as OddsRatio, PcaPlot, PlotContainer, PlotExport, PlotThemeProvider, QQPlot, RegressionPlot, ResidualPlot, HappinessCorrelatesPanel as ScatterplotRegression, SlopeChart, Sparkline, stat_splitbar_v1_default as SplitBar, StateBarChart, geo_state_map_v1_default as StateMap, StripPlot, SwarmPlot, Switch, Tabs, TabsContent, TabsList, TabsTrigger, TimeSeries_default as TimeSeries, TimeSeriesChart2 as TimeSeriesChart, TimeSeriesIndex_default as TimeSeriesIndex, TimeSeriesChart as TimeSeriesLine, TimetrendDemo as TimeTrendDemo, TimeTrendDemoChart, ViolinPlot, ZipMap_default as ZipMap, defaultDarkTheme, defaultLightTheme, prepareEssRows, usePlotTheme };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map