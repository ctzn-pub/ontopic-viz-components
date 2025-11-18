import * as React from 'react';
import { createContext, useRef, useState, useEffect, useContext } from 'react';
import * as Plot8 from '@observablehq/plot';
import { jsx, jsxs } from 'react/jsx-runtime';
import { Download } from 'lucide-react';
import * as topojson from 'topojson-client';

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
    const plot23 = Plot8.plot({
      ...plotSpec,
      width: finalWidth,
      height
    });
    if (plotRef.current) {
      plotRef.current.remove();
    }
    containerRef.current.appendChild(plot23);
    plotRef.current = plot23;
    onPlotCreated?.(plot23);
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
  Button,
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
  if (!Button || !DropdownMenu) {
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
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", disabled: isExporting, children: [
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!containerRef.current || !usTopoJSON || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const stateToValueMap = new Map(
      data.map(({ state, value }) => [state, value])
    );
    const states = topojson.feature(usTopoJSON, usTopoJSON.objects.states);
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
    const statemesh = topojson.mesh(
      usTopoJSON,
      usTopoJSON.objects.states,
      (a, b) => a !== b
    );
    const nation = topojson.feature(
      usTopoJSON,
      usTopoJSON.objects.nation
    );
    const plot23 = Plot8.plot({
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
        Plot8.geo(states, {
          fill: (d) => d.properties.value
        }),
        // State boundaries
        Plot8.geo(statemesh, {
          strokeWidth: 0.75
        }),
        // Nation outline
        Plot8.geo(nation, {
          strokeWidth: 1.5
        }),
        // Interactive tooltips
        Plot8.tip(
          states.features,
          Plot8.pointer(
            Plot8.centroid({
              title: (d) => `${d.properties.name}: ${formatNumberAsK(d.properties.value)}`
            })
          )
        )
      ]
    });
    containerRef.current.appendChild(plot23);
    return () => {
      plot23.remove();
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
      Plot8.dot(plotData, {
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
    const plot23 = Plot8.plot({
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
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
    const plot23 = Plot8.plot({
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
        Plot8.boxY(data, {
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
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
    const plot23 = Plot8.plot({
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
        Plot8.boxY(transformedData, {
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
    const plot23 = Plot8.plot({
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
        Plot8.boxY(data, {
          x: "category",
          y: "value",
          fx: "facet",
          fill: fillColor,
          fillOpacity: 0.4,
          stroke: strokeColor,
          strokeWidth: 1.5,
          r: 3
        }),
        Plot8.frame()
      ]
    });
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
    const plot23 = Plot8.plot({
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
        Plot8.boxY(transformedData, {
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
        Plot8.frame()
      ]
    });
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
            Plot8.rectY(
              groupData,
              Plot8.binX(
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
            Plot8.density(
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
            Plot8.tickX(groupData, {
              x: "value",
              stroke: color,
              strokeOpacity: 0.3
            })
          );
        }
        if (showMean) {
          const mean = groupData.reduce((sum, d) => sum + d.value, 0) / groupData.length;
          marks.push(
            Plot8.ruleX([mean], {
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: "4,4"
            })
          );
        }
        if (showMedian) {
          const sorted = [...groupData].sort((a, b) => a.value - b.value);
          const median = sorted[Math.floor(sorted.length / 2)]?.value || 0;
          marks.push(
            Plot8.ruleX([median], {
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
          Plot8.rectY(
            data,
            Plot8.binX(
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
          Plot8.density(
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
          Plot8.tickX(data, {
            x: "value",
            stroke: fillColor,
            strokeOpacity: 0.5
          })
        );
      }
      if (showMean) {
        const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
        marks.push(
          Plot8.ruleX([mean], {
            stroke: meanColor,
            strokeWidth: 2,
            strokeDasharray: "4,4"
          })
        );
      }
      if (showMedian) {
        const sorted = [...data].sort((a, b) => a.value - b.value);
        const median = sorted[Math.floor(sorted.length / 2)]?.value || 0;
        marks.push(
          Plot8.ruleX([median], {
            stroke: medianColor,
            strokeWidth: 2,
            strokeDasharray: "2,2"
          })
        );
      }
    }
    const plot23 = Plot8.plot({
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
          Plot8.dot(groupData, {
            x: "x",
            y: "y",
            fill: color,
            fillOpacity: 0.6,
            r: 3
          })
        );
        if (method === "linear") {
          marks.push(
            Plot8.linearRegressionY(groupData, {
              x: "x",
              y: "y",
              stroke: color,
              strokeWidth: 2,
              ci: showConfidence ? confidenceLevel : void 0
            })
          );
        } else if (method === "loess") {
          marks.push(
            Plot8.line(groupData, {
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
        Plot8.dot(plotData, {
          x: "x",
          y: "y",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 3
        })
      );
      if (method === "linear") {
        marks.push(
          Plot8.linearRegressionY(plotData, {
            x: "x",
            y: "y",
            stroke: lineColor,
            strokeWidth: 2,
            ci: showConfidence ? confidenceLevel : void 0
          })
        );
      } else if (method === "loess") {
        marks.push(
          Plot8.line(
            plotData,
            Plot8.windowY({
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
          Plot8.line(
            plotData,
            Plot8.windowY({
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
    const plot23 = Plot8.plot({
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
      plot23.appendChild(rText);
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
    const plot23 = Plot8.plot({
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
        Plot8.line(
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
        Plot8.dot(qqData, {
          x: "theoretical",
          y: "sample",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
        })
      ]
    });
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
    const plot23 = Plot8.plot({
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
        Plot8.ruleY([0], {
          stroke: lineColor,
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),
        // Residual points
        Plot8.dot(residualData, {
          x: "fitted",
          y: "residual",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
        })
      ]
    });
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
    const plot23 = Plot8.plot({
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
        Plot8.dot(
          data,
          Plot8.dodgeX("middle", {
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
    const plot23 = Plot8.plot({
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
        Plot8.dot(data, {
          x: "category",
          y: "value",
          fill: "category",
          fillOpacity: dotOpacity,
          r: dotRadius,
          dx: () => (Math.random() - 0.5) * jitterWidth
        })
      ]
    });
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
        Plot8.ruleX([0], {
          stroke: "#000",
          strokeWidth: 2
        })
      );
    }
    marks.push(
      Plot8.ruleX(sortedData, {
        x1: "ci_lower",
        x2: "ci_upper",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot8.tickX(sortedData, {
        x: "ci_lower",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot8.tickX(sortedData, {
        x: "ci_upper",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot8.dot(sortedData, {
        x: "coef",
        y: "variable",
        fill: (d) => getColor(d),
        r: 5
      })
    );
    const plot23 = Plot8.plot({
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
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
            plot23.appendChild(starText);
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
  formatValue = (v) => `${v.toFixed(1)}%`,
  className = "",
  marginLeft = 150,
  showValueLabels = true
}) => {
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
    const plot23 = Plot8.plot({
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
        Plot8.barX(sortedData, {
          y: "category",
          x: "overall",
          fill: "#e4e4e4",
          title: (d) => `Overall: ${formatValue(d.overall)}`
        }),
        // Dots for subcategory values
        Plot8.dot(dotData, {
          y: "category",
          x: "value",
          fill: "subcategory",
          r: 5,
          tip: true,
          title: (d) => `${d.subcategory}: ${formatValue(d.value)}`
        }),
        // Value labels on bars
        ...showValueLabels ? [
          Plot8.text(sortedData, {
            y: "category",
            x: "overall",
            text: (d) => formatValue(d.overall),
            dx: -25,
            fill: "black",
            fontSize: 9,
            fontWeight: "normal",
            textAnchor: "start"
          })
        ] : [],
        // Zero reference line
        Plot8.ruleX([minValue])
      ]
    });
    containerRef.current.appendChild(plot23);
    return () => {
      plot23.remove();
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
    formatValue,
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
    const plot23 = Plot8.plot({
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
        Plot8.dot(data, {
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
        Plot8.ruleX([0])
      ],
      width,
      height,
      marginLeft
    });
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
      Plot8.barY(data, {
        x,
        y,
        fill
      })
    ];
    if (errorY) {
      marks.push(
        Plot8.ruleX(data, {
          x,
          y1: errorY.lower,
          y2: errorY.upper,
          stroke: errorStroke,
          strokeWidth: errorStrokeWidth
        })
      );
    }
    const plot23 = Plot8.plot({
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
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
        Plot8.lineY(indexedData, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 2
        })
      );
    } else if (variant === "area") {
      marks.push(
        Plot8.areaY(indexedData, {
          x: "index",
          y: "value",
          fill: color,
          fillOpacity: 0.3,
          curve: "catmull-rom"
        }),
        Plot8.lineY(indexedData, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 1.5,
          curve: "catmull-rom"
        })
      );
    } else if (variant === "bar") {
      marks.push(
        Plot8.barY(indexedData, {
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
        Plot8.dot([{ index: minIndex, value: minValue }], {
          x: "index",
          y: "value",
          fill: negativeColor,
          r: 3,
          stroke: "white",
          strokeWidth: 1
        }),
        Plot8.dot([{ index: maxIndex, value: maxValue }], {
          x: "index",
          y: "value",
          fill: positiveColor,
          r: 3,
          stroke: "white",
          strokeWidth: 1
        })
      );
    }
    const plot23 = Plot8.plot({
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
      Plot8.line(longData, {
        x: "time",
        y: "value",
        z: labelKey,
        stroke: (d) => getColor(d.change),
        strokeWidth,
        title: (d) => `${d[labelKey]}: ${d.change > 0 ? "+" : ""}${d.change.toFixed(1)}`
      })
    );
    marks.push(
      Plot8.dot(longData, {
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
        Plot8.text(beforeData, {
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
        Plot8.text(afterData, {
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
    const plot23 = Plot8.plot({
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
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
        Plot8.barX([{ value: range.threshold }], {
          x: "value",
          fill: range.color,
          fillOpacity: 0.3,
          y: () => title,
          title: () => `${range.label}: ${range.threshold}`
        })
      );
    });
    marks.push(
      Plot8.barX([{ value }], {
        x: "value",
        fill: valueColor,
        y: () => title,
        insetTop: 15,
        insetBottom: 15,
        title: () => `Actual: ${value}`
      })
    );
    marks.push(
      Plot8.tickX([{ value: target }], {
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
        Plot8.text([{ value, label: value.toString() }], {
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
        Plot8.text([{ value: target, label: `Target: ${target}` }], {
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
    const plot23 = Plot8.plot({
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
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
        Plot8.ruleX([0], {
          stroke: "#000",
          strokeWidth: 2
        })
      );
    }
    marks.push(
      Plot8.barX(processedData, {
        y: categoryKey,
        x: positiveKey,
        fill: positiveColor,
        title: (d) => `${d[categoryKey]}: ${d[positiveKey]}% ${positiveLabel}`
      })
    );
    marks.push(
      Plot8.barX(processedData, {
        y: categoryKey,
        x: negativeKey,
        fill: negativeColor,
        title: (d) => `${d[categoryKey]}: ${Math.abs(d[negativeKey])}% ${negativeLabel}`
      })
    );
    const plot23 = Plot8.plot({
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
    containerRef.current.appendChild(plot23);
    return () => {
      plot23?.remove();
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
          Plot8.dot(plotData, {
            ...baseOptions,
            r: 3,
            fillOpacity: 0.6
          })
        );
        break;
      case "line":
        marks.push(
          Plot8.line(plotData, {
            ...baseOptions,
            strokeWidth: 2,
            ...groupBy && { z: groupBy }
          })
        );
        break;
      case "bar":
        marks.push(
          Plot8.barY(plotData, {
            ...baseOptions
          })
        );
        break;
      case "area":
        marks.push(
          Plot8.areaY(plotData, {
            ...baseOptions,
            fillOpacity: 0.5,
            ...groupBy && { z: groupBy }
          })
        );
        break;
    }
    const plot23 = Plot8.plot({
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
    plot23.setAttribute("role", "img");
    plot23.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot23);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, x, y, facetX, facetY, mark, xLabel, yLabel, title, width, height, sharedScales, color, groupBy, ariaLabel]);
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className });
}

export { basic_bar_v1_default as BarChart, stat_boxplot_v1_default as BoxPlot, BoxPlotFaceted, BoxPlotFacetedGrouped, BoxPlotGrouped, geo_bubble_v1_default as BubbleMap, BulletChart, DistributionPlot, DivergingBar, basic_dot_v1_default as DotPlot, FacetedPlot, ForestPlot, PlotContainer, PlotExport, PlotThemeProvider, QQPlot, RegressionPlot, ResidualPlot, SlopeChart, Sparkline, stat_splitbar_v1_default as SplitBar, geo_state_map_v1_default as StateMap, StripPlot, SwarmPlot, defaultDarkTheme, defaultLightTheme, usePlotTheme };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map