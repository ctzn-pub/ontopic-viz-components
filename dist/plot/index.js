'use strict';

var React = require('react');
var Plot24 = require('@observablehq/plot');
var jsxRuntime = require('react/jsx-runtime');
var lucideReact = require('lucide-react');
var topojson3 = require('topojson-client');
var dynamic = require('next/dynamic');
var d3Array = require('d3-array');
var nextThemes = require('next-themes');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);
var Plot24__namespace = /*#__PURE__*/_interopNamespace(Plot24);
var topojson3__namespace = /*#__PURE__*/_interopNamespace(topojson3);
var dynamic__default = /*#__PURE__*/_interopDefault(dynamic);

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
  const containerRef = React.useRef(null);
  const plotRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(800);
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (!containerRef.current) return;
    const finalWidth = width === "responsive" ? containerWidth : width;
    const plot32 = Plot24__namespace.plot({
      ...plotSpec,
      width: finalWidth,
      height
    });
    if (plotRef.current) {
      plotRef.current.remove();
    }
    containerRef.current.appendChild(plot32);
    plotRef.current = plot32;
    onPlotCreated?.(plot32);
    return () => {
      if (plotRef.current) {
        plotRef.current.remove();
        plotRef.current = null;
      }
    };
  }, [plotSpec, width, height, containerWidth, onPlotCreated]);
  return /* @__PURE__ */ jsxRuntime.jsx(
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
var PlotThemeContext = React.createContext(defaultLightTheme);
function PlotThemeProvider({
  theme = "light",
  children
}) {
  const resolvedTheme = typeof theme === "string" ? theme === "dark" ? defaultDarkTheme : defaultLightTheme : theme;
  return /* @__PURE__ */ jsxRuntime.jsx(PlotThemeContext.Provider, { value: resolvedTheme, children });
}
function usePlotTheme() {
  return React.useContext(PlotThemeContext);
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
  const [isExporting, setIsExporting] = React.useState(false);
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
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "plot-export", children: [
      /* @__PURE__ */ jsxRuntime.jsxs(
        "button",
        {
          onClick: () => exportAs("svg"),
          disabled: isExporting,
          className: "px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Download, { className: "h-4 w-4 inline mr-2" }),
            isExporting ? "Exporting..." : "Export SVG"
          ]
        }
      ),
      formats.includes("png") && /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsxs(Button, { variant: "outline", size: "sm", disabled: isExporting, children: [
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Download, { className: "h-4 w-4 mr-2" }),
      isExporting ? "Exporting..." : "Export"
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(DropdownMenuContent, { align: "end", children: [
      formats.includes("svg") && /* @__PURE__ */ jsxRuntime.jsx(DropdownMenuItem, { onClick: () => exportAs("svg"), children: "Export as SVG" }),
      formats.includes("png") && /* @__PURE__ */ jsxRuntime.jsx(DropdownMenuItem, { onClick: () => exportAs("png"), children: "Export as PNG" })
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
  const containerRef = React__namespace.useRef(null);
  React__namespace.useEffect(() => {
    if (!containerRef.current || !usTopoJSON || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const stateToValueMap = new Map(
      data.map(({ state, value }) => [state, value])
    );
    const states = topojson3__namespace.feature(usTopoJSON, usTopoJSON.objects.states);
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
    const statemesh = topojson3__namespace.mesh(
      usTopoJSON,
      usTopoJSON.objects.states,
      (a, b) => a !== b
    );
    const nation = topojson3__namespace.feature(
      usTopoJSON,
      usTopoJSON.objects.nation
    );
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.geo(states, {
          fill: (d) => d.properties.value
        }),
        // State boundaries
        Plot24__namespace.geo(statemesh, {
          strokeWidth: 0.75
        }),
        // Nation outline
        Plot24__namespace.geo(nation, {
          strokeWidth: 1.5
        }),
        // Interactive tooltips
        Plot24__namespace.tip(
          states.features,
          Plot24__namespace.pointer(
            Plot24__namespace.centroid({
              title: (d) => `${d.properties.name}: ${formatNumberAsK(d.properties.value)}`
            })
          )
        )
      ]
    });
    containerRef.current.appendChild(plot32);
    return () => {
      plot32.remove();
    };
  }, [usTopoJSON, data, width, height, title, subtitle, caption, valueSuffix, valuePrefix, colorScheme, quantiles, reverseColors, projection]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
      Plot24__namespace.dot(plotData, {
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
    const plot32 = Plot24__namespace.plot({
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
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
    };
  }, [data, longitudeKey, latitudeKey, sizeKey, colorKey, nameKey, title, subtitle, fill, fillOpacity, stroke, strokeWidth, width, height, projection]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.boxY(data, {
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
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
    };
  }, [data, x, y, title, xLabel, yLabel, fill, fillOpacity, stroke, strokeWidth, outlierRadius, width, height, marginLeft, marginBottom, xTickRotate]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.boxY(transformedData, {
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, groupLabel, title, width, height, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.boxY(data, {
          x: "category",
          y: "value",
          fx: "facet",
          fill: fillColor,
          fillOpacity: 0.4,
          stroke: strokeColor,
          strokeWidth: 1.5,
          r: 3
        }),
        Plot24__namespace.frame()
      ]
    });
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, facetLabel, title, width, height, facetColumns, fillColor, strokeColor, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.boxY(transformedData, {
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
        Plot24__namespace.frame()
      ]
    });
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, facetLabel, categoryLabel, yLabel, groupLabel, title, width, height, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
            Plot24__namespace.rectY(
              groupData,
              Plot24__namespace.binX(
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
            Plot24__namespace.density(
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
            Plot24__namespace.tickX(groupData, {
              x: "value",
              stroke: color,
              strokeOpacity: 0.3
            })
          );
        }
        if (showMean) {
          const mean2 = groupData.reduce((sum, d) => sum + d.value, 0) / groupData.length;
          marks.push(
            Plot24__namespace.ruleX([mean2], {
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
            Plot24__namespace.ruleX([median2], {
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
          Plot24__namespace.rectY(
            data,
            Plot24__namespace.binX(
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
          Plot24__namespace.density(
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
          Plot24__namespace.tickX(data, {
            x: "value",
            stroke: fillColor,
            strokeOpacity: 0.5
          })
        );
      }
      if (showMean) {
        const mean2 = data.reduce((sum, d) => sum + d.value, 0) / data.length;
        marks.push(
          Plot24__namespace.ruleX([mean2], {
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
          Plot24__namespace.ruleX([median2], {
            stroke: medianColor,
            strokeWidth: 2,
            strokeDasharray: "2,2"
          })
        );
      }
    }
    const plot32 = Plot24__namespace.plot({
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, title, width, height, showHistogram, showDensity, showRug, showMean, showMedian, binCount, fillColor, densityColor, meanColor, medianColor, groupColors, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
          Plot24__namespace.dot(groupData, {
            x: "x",
            y: "y",
            fill: color,
            fillOpacity: 0.6,
            r: 3
          })
        );
        if (method === "linear") {
          marks.push(
            Plot24__namespace.linearRegressionY(groupData, {
              x: "x",
              y: "y",
              stroke: color,
              strokeWidth: 2,
              ci: showConfidence ? confidenceLevel : void 0
            })
          );
        } else if (method === "loess") {
          marks.push(
            Plot24__namespace.line(groupData, {
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
        Plot24__namespace.dot(plotData, {
          x: "x",
          y: "y",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 3
        })
      );
      if (method === "linear") {
        marks.push(
          Plot24__namespace.linearRegressionY(plotData, {
            x: "x",
            y: "y",
            stroke: lineColor,
            strokeWidth: 2,
            ci: showConfidence ? confidenceLevel : void 0
          })
        );
      } else if (method === "loess") {
        marks.push(
          Plot24__namespace.line(
            plotData,
            Plot24__namespace.windowY({
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
          Plot24__namespace.line(
            plotData,
            Plot24__namespace.windowY({
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
    const plot32 = Plot24__namespace.plot({
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
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
      plot32.appendChild(rText);
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, method, degree, showConfidence, confidenceLevel, showRSquared, pointColor, lineColor, groupColors, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.line(
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
        Plot24__namespace.dot(qqData, {
          x: "theoretical",
          y: "sample",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
        })
      ]
    });
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, pointColor, lineColor, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.ruleY([0], {
          stroke: lineColor,
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),
        // Residual points
        Plot24__namespace.dot(residualData, {
          x: "fitted",
          y: "residual",
          fill: pointColor,
          fillOpacity: 0.6,
          r: 4
        })
      ]
    });
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, pointColor, lineColor, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.dot(
          data,
          Plot24__namespace.dodgeX("middle", {
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, dotRadius, dotOpacity, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.dot(data, {
          x: "category",
          y: "value",
          fill: "category",
          fillOpacity: dotOpacity,
          r: dotRadius,
          dx: () => (Math.random() - 0.5) * jitterWidth
        })
      ]
    });
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, xLabel, yLabel, title, width, height, dotRadius, dotOpacity, jitterWidth, colorScheme, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
        Plot24__namespace.ruleX([0], {
          stroke: "#000",
          strokeWidth: 2
        })
      );
    }
    marks.push(
      Plot24__namespace.ruleX(sortedData, {
        x1: "ci_lower",
        x2: "ci_upper",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot24__namespace.tickX(sortedData, {
        x: "ci_lower",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot24__namespace.tickX(sortedData, {
        x: "ci_upper",
        y: "variable",
        stroke: (d) => getColor(d),
        strokeWidth: 2
      })
    );
    marks.push(
      Plot24__namespace.dot(sortedData, {
        x: "coef",
        y: "variable",
        fill: (d) => getColor(d),
        r: 5
      })
    );
    const plot32 = Plot24__namespace.plot({
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
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
            plot32.appendChild(starText);
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React__namespace.useRef(null);
  React__namespace.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.barX(sortedData, {
          y: "category",
          x: "overall",
          fill: "#e4e4e4",
          title: (d) => `Overall: ${formatValue(d.overall)}`
        }),
        // Dots for subcategory values
        Plot24__namespace.dot(dotData, {
          y: "category",
          x: "value",
          fill: "subcategory",
          r: 5,
          tip: true,
          title: (d) => `${d.subcategory}: ${formatValue(d.value)}`
        }),
        // Value labels on bars
        ...showValueLabels ? [
          Plot24__namespace.text(sortedData, {
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
        Plot24__namespace.ruleX([minValue])
      ]
    });
    containerRef.current.appendChild(plot32);
    return () => {
      plot32.remove();
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.dot(data, {
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
        Plot24__namespace.ruleX([0])
      ],
      width,
      height,
      marginLeft
    });
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
    };
  }, [data, x, y, fill, title, subtitle, xLabel, yLabel, radius, fillOpacity, width, height, marginLeft, colorScheme, tipFormat]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    containerRef.current.innerHTML = "";
    const marks = [
      // Main bar chart
      Plot24__namespace.barY(data, {
        x,
        y,
        fill
      })
    ];
    if (errorY) {
      marks.push(
        Plot24__namespace.ruleX(data, {
          x,
          y1: errorY.lower,
          y2: errorY.upper,
          stroke: errorStroke,
          strokeWidth: errorStrokeWidth
        })
      );
    }
    const plot32 = Plot24__namespace.plot({
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
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
    };
  }, [data, x, y, errorY, title, subtitle, caption, xLabel, yLabel, fill, errorStroke, errorStrokeWidth, width, height, marginBottom, xTickRotate, xTickFormat, xTicks]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
        Plot24__namespace.lineY(indexedData, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 2
        })
      );
    } else if (variant === "area") {
      marks.push(
        Plot24__namespace.areaY(indexedData, {
          x: "index",
          y: "value",
          fill: color,
          fillOpacity: 0.3,
          curve: "catmull-rom"
        }),
        Plot24__namespace.lineY(indexedData, {
          x: "index",
          y: "value",
          stroke: color,
          strokeWidth: 1.5,
          curve: "catmull-rom"
        })
      );
    } else if (variant === "bar") {
      marks.push(
        Plot24__namespace.barY(indexedData, {
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
        Plot24__namespace.dot([{ index: minIndex, value: minValue }], {
          x: "index",
          y: "value",
          fill: negativeColor,
          r: 3,
          stroke: "white",
          strokeWidth: 1
        }),
        Plot24__namespace.dot([{ index: maxIndex, value: maxValue }], {
          x: "index",
          y: "value",
          fill: positiveColor,
          r: 3,
          stroke: "white",
          strokeWidth: 1
        })
      );
    }
    const plot32 = Plot24__namespace.plot({
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
    };
  }, [data, variant, width, height, showMinMax, positiveColor, negativeColor, neutralColor, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
      Plot24__namespace.line(longData, {
        x: "time",
        y: "value",
        z: labelKey,
        stroke: (d) => getColor(d.change),
        strokeWidth,
        title: (d) => `${d[labelKey]}: ${d.change > 0 ? "+" : ""}${d.change.toFixed(1)}`
      })
    );
    marks.push(
      Plot24__namespace.dot(longData, {
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
        Plot24__namespace.text(beforeData, {
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
        Plot24__namespace.text(afterData, {
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
    const plot32 = Plot24__namespace.plot({
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
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
        Plot24__namespace.barX([{ value: range.threshold }], {
          x: "value",
          fill: range.color,
          fillOpacity: 0.3,
          y: () => title,
          title: () => `${range.label}: ${range.threshold}`
        })
      );
    });
    marks.push(
      Plot24__namespace.barX([{ value }], {
        x: "value",
        fill: valueColor,
        y: () => title,
        insetTop: 15,
        insetBottom: 15,
        title: () => `Actual: ${value}`
      })
    );
    marks.push(
      Plot24__namespace.tickX([{ value: target }], {
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
        Plot24__namespace.text([{ value, label: value.toString() }], {
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
        Plot24__namespace.text([{ value: target, label: `Target: ${target}` }], {
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
    const plot32 = Plot24__namespace.plot({
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
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
    };
  }, [title, value, target, ranges, width, height, valueColor, targetColor, showLabels]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
        Plot24__namespace.ruleX([0], {
          stroke: "#000",
          strokeWidth: 2
        })
      );
    }
    marks.push(
      Plot24__namespace.barX(processedData, {
        y: categoryKey,
        x: positiveKey,
        fill: positiveColor,
        title: (d) => `${d[categoryKey]}: ${d[positiveKey]}% ${positiveLabel}`
      })
    );
    marks.push(
      Plot24__namespace.barX(processedData, {
        y: categoryKey,
        x: negativeKey,
        fill: negativeColor,
        title: (d) => `${d[categoryKey]}: ${Math.abs(d[negativeKey])}% ${negativeLabel}`
      })
    );
    const plot32 = Plot24__namespace.plot({
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
    containerRef.current.appendChild(plot32);
    return () => {
      plot32?.remove();
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
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
  const containerRef = React.useRef(null);
  React.useEffect(() => {
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
          Plot24__namespace.dot(plotData, {
            ...baseOptions,
            r: 3,
            fillOpacity: 0.6
          })
        );
        break;
      case "line":
        marks.push(
          Plot24__namespace.line(plotData, {
            ...baseOptions,
            strokeWidth: 2,
            ...groupBy && { z: groupBy }
          })
        );
        break;
      case "bar":
        marks.push(
          Plot24__namespace.barY(plotData, {
            ...baseOptions
          })
        );
        break;
      case "area":
        marks.push(
          Plot24__namespace.areaY(plotData, {
            ...baseOptions,
            fillOpacity: 0.5,
            ...groupBy && { z: groupBy }
          })
        );
        break;
    }
    const plot32 = Plot24__namespace.plot({
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
    plot32.setAttribute("role", "img");
    plot32.setAttribute("aria-label", ariaLabel);
    containerRef.current.appendChild(plot32);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [data, x, y, facetX, facetY, mark, xLabel, yLabel, title, width, height, sharedScales, color, groupBy, ariaLabel]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
}
var CorrelationHeatmap = ({
  data,
  width = 600,
  height = 600,
  title = "County Health Correlations",
  subtitle = "Focus on variables focused on adjusted prevalence",
  caption = "Source: CDC"
}) => {
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (!data || !containerRef.current) return;
    containerRef.current.innerHTML = "";
    const variables = [...new Set(data.map((d) => d.x))];
    const convertedData = data.filter((d) => variables.indexOf(d.y) > variables.indexOf(d.x));
    const cleanVariableName = (name) => {
      return name.replace("_AdjPrev", "").replace("_", " ").toUpperCase();
    };
    const xDomain = [...new Set(convertedData.map((d) => d.x))];
    const yDomain = [...new Set(convertedData.map((d) => d.y))].reverse();
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.cell(convertedData, {
          x: "x",
          y: "y",
          fill: "value",
          inset: 0.5,
          tip: true,
          title: (d) => `${cleanVariableName(d.x)} vs ${cleanVariableName(d.y)}: ${d.value.toFixed(3)}`
        }),
        // Text overlay
        Plot24__namespace.text(convertedData, {
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
    containerRef.current.appendChild(plot32);
    return () => {
      if (plot32) plot32.remove();
    };
  }, [data, width, height, title, subtitle, caption]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className: "flex justify-center" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-4 text-sm text-gray-600 text-center", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: "Correlation matrix showing relationships between health outcome variables." }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: "Values range from -1 (strong negative correlation) to +1 (strong positive correlation)." })
    ] })
  ] });
};
var CorrelationHeatmap_default = CorrelationHeatmap;
var HighchartsReact = dynamic__default.default(() => import('highcharts-react-official'), { ssr: false });
function PcaPlot() {
  const [Highcharts, setHighcharts] = React.useState(null);
  React.useEffect(() => {
    import('highcharts').then((HighchartsModule) => {
      setHighcharts(HighchartsModule.default);
    });
  }, []);
  if (!Highcharts) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center justify-center h-96", children: "Loading chart..." });
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "w-full max-w-4xl", children: /* @__PURE__ */ jsxRuntime.jsx(
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
  const observablePlotRef = React.useRef(null);
  const forestPlotRef = React.useRef(null);
  const dotPlotRef = React.useRef(null);
  const plotData = React.useMemo(() => Object.keys(data.odds_ratios).map((key) => ({
    Label: key.replace(/C\((.*?)\)\[T\.(.*?)\]/, "$1 $2").replace(/C\((.*?), Treatment\(.*?\)\)\[T\.(.*?)\]/, "$1 $2").replace(/:/g, " \xD7 "),
    // Replace interaction symbols
    OddsRatio: data.odds_ratios[key],
    LowerCI: data.conf_int_lower[key],
    UpperCI: data.conf_int_upper[key]
  })), [data]);
  React.useEffect(() => {
    if (!data) return;
    if (observablePlotRef.current) observablePlotRef.current.innerHTML = "";
    if (forestPlotRef.current) forestPlotRef.current.innerHTML = "";
    if (dotPlotRef.current) dotPlotRef.current.innerHTML = "";
    const observablePlot = Plot24__namespace.plot({
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
        Plot24__namespace.dot(plotData, {
          x: "OddsRatio",
          y: "Label",
          tip: {
            format: { fill: false, x: (d) => d.toFixed(2) }
          },
          fill: (d) => d.OddsRatio > 1 ? "green" : "red"
        }),
        Plot24__namespace.ruleY(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "green" : "red"
        }),
        Plot24__namespace.ruleX([1], {
          stroke: "black",
          strokeWidth: 0.5
        })
      ],
      width: 800,
      height: 500
    });
    const forestPlot = Plot24__namespace.plot({
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
        Plot24__namespace.rect(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          fill: (d) => d.OddsRatio > 1 ? "#dcfce7" : "#fef2f2",
          fillOpacity: 0.3,
          ry: 3
        }),
        // Confidence interval lines
        Plot24__namespace.ruleY(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 3
        }),
        // End caps for confidence intervals
        Plot24__namespace.ruleY(plotData, {
          x: "LowerCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot24__namespace.ruleY(plotData, {
          x: "LowerCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        Plot24__namespace.ruleY(plotData, {
          x: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot24__namespace.ruleY(plotData, {
          x: "UpperCI",
          y: "Label",
          stroke: (d) => d.OddsRatio > 1 ? "#16a34a" : "#dc2626",
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        // Central point estimates (squares for forest plots)
        Plot24__namespace.dot(plotData, {
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
        Plot24__namespace.ruleX([1], {
          stroke: "#374151",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      ],
      width: 800,
      height: 500
    });
    const dotPlot = Plot24__namespace.plot({
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
        Plot24__namespace.ruleY(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          stroke: "#9ca3af",
          strokeWidth: 2
        }),
        // Main dots with size based on confidence interval width (inverse - smaller CI = larger dot)
        Plot24__namespace.dot(plotData, {
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
        Plot24__namespace.ruleX([1], {
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "Statistical odds ratio analysis demonstrating multiple visualization approaches. Each method emphasizes different aspects of the statistical relationships and confidence intervals." }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Basic Odds Ratio Plot" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Standard odds ratio visualization with confidence intervals" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: observablePlotRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "Features:" }),
          " Logarithmic scale, conditional coloring (red < 1, green > 1), interactive tooltips, confidence interval lines, null effect reference line"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Forest Plot Analysis" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Advanced forest plot with enhanced statistical visualization features" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: forestPlotRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "Features:" }),
          " Square markers for point estimates, confidence interval rectangles, end caps on intervals, enhanced color coding, traditional forest plot layout"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Precision-Weighted Dot Plot" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Dot plot where marker size reflects statistical precision (inverse of confidence interval width)" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: dotPlotRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "Features:" }),
          " Size-encoded precision, larger dots indicate more precise estimates, confidence interval lines, statistical significance visual weighting"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "font-semibold mb-2", children: "Statistical Visualization Techniques" }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Basic Odds Ratio" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Clear point estimates" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Confidence interval display" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Effect direction coding" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Reference line indication" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Forest Plot" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Meta-analysis standard" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Enhanced visual emphasis" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Professional presentation" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Multiple study comparison" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Precision Weighting" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Visual uncertainty encoding" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Statistical weight display" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Precision-based emphasis" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Quality assessment aid" })
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
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    if (!data.length || !chartRef.current) return;
    const meanValue = d3Array.mean(data);
    const medianValue = d3Array.median(data);
    const marks = [
      // Histogram
      Plot24__namespace.rectY(data, Plot24__namespace.binX({ y: "count" }, {
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
        Plot24__namespace.ruleX([meanValue], {
          stroke: "hsl(var(--destructive))",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),
        Plot24__namespace.text([{ x: meanValue, y: 0 }], {
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
        Plot24__namespace.ruleX([medianValue], {
          stroke: "hsl(var(--chart-2))",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      );
    }
    const plot32 = Plot24__namespace.plot({
      width,
      height,
      marginLeft: 60,
      marginBottom: 60,
      x: { label: xlabel },
      y: { label: ylabel, grid: true },
      marks
    });
    chartRef.current.innerHTML = "";
    chartRef.current.appendChild(plot32);
    return () => plot32.remove();
  }, [data, width, height, xlabel, ylabel, bins, showMean, showMedian]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold mb-4", children: title }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { ref: chartRef }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
      "Total observations: ",
      data.length,
      " \u2022 Bins: ",
      bins
    ] }) })
  ] });
}
var DensityPlot = ({ data }) => {
  const singleRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const mentalHealthData = React.useMemo(() => data.map((d, i) => ({
    MHLTH_AdjPrev: Math.random() * 20 + 10,
    // Random mental health rates between 10-30%
    population: d.population || Math.floor(Math.random() * 5e4) + 1e4
  })), [data]);
  const cleanData = React.useMemo(() => data.filter((d) => d.dir2020 !== void 0), [data]);
  React.useEffect(() => {
    if (!data || data.length === 0) return;
    if (singleRef.current) singleRef.current.innerHTML = "";
    if (overlayRef.current) overlayRef.current.innerHTML = "";
    const singlePlot = Plot24__namespace.plot({
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
        Plot24__namespace.areaY(mentalHealthData, Plot24__namespace.binX(
          { y: "count", filter: null },
          { x: "MHLTH_AdjPrev", fillOpacity: 0.3, fill: "#3b82f6" }
        )),
        Plot24__namespace.lineY(mentalHealthData, Plot24__namespace.binX(
          { y: "count", filter: null },
          { x: "MHLTH_AdjPrev", label: "Mental Health", tip: true, stroke: "#3b82f6", strokeWidth: 2 }
        )),
        Plot24__namespace.ruleY([0])
      ],
      width: 600,
      height: 400
    });
    const overlayPlot = Plot24__namespace.plot({
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
        Plot24__namespace.areaY(cleanData, Plot24__namespace.binX(
          { y: "count", filter: null },
          { x: "OBESITY_AdjPrev", fill: "dir2020", fillOpacity: 0.2 }
        )),
        Plot24__namespace.lineY(cleanData, Plot24__namespace.binX(
          { y: "count", filter: null },
          { x: "OBESITY_AdjPrev", stroke: "dir2020", tip: true, strokeWidth: 2 }
        )),
        Plot24__namespace.ruleY([0])
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "Density plot analysis showing the distribution patterns of health metrics across counties. These visualizations reveal the shape, spread, and central tendencies of population health indicators." }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Single Distribution" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Distribution of mental health rates across counties" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: singleRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "This histogram shows the frequency distribution of mental health prevalence rates, with both area and line representations of the density. The combined area and line approach emphasizes both the overall distribution shape and precise bin boundaries." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Overlay Comparison" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Comparison of obesity rate distributions by demographic category" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: overlayRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Multiple density curves overlaid to compare obesity rate distributions across different demographic groups, allowing for direct comparison of patterns. This approach reveals differences in distribution shapes, central tendencies, and spread between groups." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "font-semibold mb-2", children: "Density Plot techniques" }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid md:grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Single Distribution" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Overall distribution shape" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Central tendency identification" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Spread and variability" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Outlier and skewness detection" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Overlay Comparison" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Group comparison analysis" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Distribution shape differences" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Relative positioning" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Population heterogeneity" })
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
  const mapRef = React.useRef(null);
  const [us, setUs] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL}/us-albers-counties-10m.json`).then((response) => response.json()).then((topology) => {
      setUs(topology);
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading topology:", error);
      setLoading(false);
    });
  }, []);
  React.useEffect(() => {
    if (!data || data.length === 0 || !us || loading) return;
    if (!mapRef.current) return;
    mapRef.current.innerHTML = "";
    const statemesh = topojson3__namespace.mesh(us, us.objects.states, (a, b) => a !== b);
    const nation = topojson3__namespace.feature(us, us.objects.nation);
    const countiesmesh = topojson3__namespace.mesh(us, us.objects.counties);
    const mapPlot = Plot24__namespace.plot({
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
        Plot24__namespace.geo(countiesmesh, { strokeOpacity: 0.5 }),
        Plot24__namespace.geo(nation),
        Plot24__namespace.geo(statemesh, { strokeOpacity: 0.2 }),
        Plot24__namespace.density(data, {
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
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: title }),
        description && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: description })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center items-center", style: { minHeight: `${height}px` }, children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: title }),
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { ref: mapRef, className: "flex justify-center" }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Density map showing geographic concentration across locations. Darker areas indicate higher concentration of data points. State and county boundaries are overlaid for geographic reference." })
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
  const mapRef = React.useRef(null);
  const [countyData, setCountyData] = React.useState([]);
  const [us, setUs] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL2}/us-albers-counties-10m.json`).then((response) => response.json()).then((topology) => {
      setUs(topology);
    }).catch((error) => {
      console.error("Error loading topology:", error);
    });
  }, []);
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (loading || !countyData || countyData.length === 0 || !us) return;
    if (!mapRef.current) return;
    mapRef.current.innerHTML = "";
    try {
      const statemesh = topojson3__namespace.mesh(us, us.objects.states, (a, b) => a !== b);
      const nation = topojson3__namespace.feature(us, us.objects.nation);
      const countiesmesh = topojson3__namespace.mesh(us, us.objects.counties);
      const counties = topojson3__namespace.feature(us, us.objects.counties);
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
      const plot32 = Plot24__namespace.plot({
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
          Plot24__namespace.geo(countiesmesh, {
            strokeOpacity: 0.3,
            stroke: "#ddd"
          }),
          // Counties with data (choropleth fill)
          Plot24__namespace.geo(counties.features, {
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
          Plot24__namespace.geo(nation, {
            stroke: "black",
            strokeWidth: 1,
            fill: "none"
          }),
          // State boundaries (stronger stroke)
          Plot24__namespace.geo(statemesh, {
            stroke: "black",
            strokeOpacity: 0.5,
            strokeWidth: 0.5
          })
        ],
        marginLeft: 0,
        marginRight: 140
        // Space for legend
      });
      mapRef.current.appendChild(plot32);
      return () => {
        plot32?.remove();
      };
    } catch (error) {
      console.error("Error rendering choropleth map:", error);
      if (mapRef.current) {
        mapRef.current.innerHTML = `<div class="text-red-500 p-4">Error loading map: ${error}</div>`;
      }
    }
  }, [countyData, loading, title, subtitle, valueLabel, colorScheme, us]);
  if (loading || !us) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "Loading county health data..." }) }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center items-center", style: { minHeight: "600px" }, children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "Interactive county-level choropleth map showing mental health prevalence across US counties. Colors represent different prevalence ranges using quantile scaling for optimal contrast. Data source: CDC Behavioral Risk Factor Surveillance System (BRFSS)." }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "County Mental Health Prevalence Map" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Percentage of adults reporting poor mental health for 14+ days per month" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: mapRef, className: "flex justify-center", style: { minHeight: "600px" } }),
        /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-sm text-gray-600 mt-4", children: [
          "This choropleth map uses quantile scaling to divide ",
          countyData.length,
          " counties into equal-sized groups, ensuring good color distribution across geographic regions. Hover over counties for detailed information including population data."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "font-semibold mb-2", children: "Choropleth Map Features" }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Color Encoding" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Quantile-based color scaling" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "7 color gradations for nuance" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Interactive legend" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Customizable color schemes" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Geographic Features" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "County-level detail" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "State boundary overlay" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Albers projection for accuracy" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Clean boundary styling" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Interactivity" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Hover tooltips with details" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "County names and values" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Responsive design" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Data-driven styling" })
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
  const mapRef = React.useRef(null);
  const [countryData, setCountryData] = React.useState([]);
  const [europe, setEurope] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL3}/europe.json`).then((response) => response.json()).then((topology) => {
      setEurope(topology);
    }).catch((error) => {
      console.error("Error loading topology:", error);
    });
  }, []);
  const sampleData = React.useMemo(() => [
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
  React.useEffect(() => {
    if (data.length > 0) {
      setCountryData(data);
    } else {
      setCountryData(sampleData);
    }
    setLoading(false);
  }, [data, sampleData]);
  const countries = React.useMemo(() => {
    if (!europe) return [];
    try {
      return topojson3__namespace.feature(europe, europe.objects.default).features;
    } catch (error) {
      console.error("Error processing TopoJSON:", error);
      return [];
    }
  }, [europe]);
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        Plot24__namespace.geo(enhancedCountries, {
          fill: (d) => d.properties.value,
          stroke: "#fff",
          strokeWidth: 0.5
        }),
        // Country borders
        Plot24__namespace.geo(enhancedCountries, {
          fill: "none",
          stroke: "#666",
          strokeWidth: 0.25
        }),
        // Interactive tooltips
        Plot24__namespace.tip(enhancedCountries, Plot24__namespace.pointer(Plot24__namespace.centroid({
          title: (d) => `${d.properties.name}: ${d.properties.value?.toFixed(1) || "N/A"}`
        })))
      ]
    });
    mapRef.current.appendChild(plot32);
  }, [loading, europe, countries.length, countryData.length, colorScheme, valueLabel]);
  if (loading || !europe) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
      title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold mb-2", children: title }),
      subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mb-4", children: subtitle }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center justify-center h-96", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-gray-500", children: "Loading map..." }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold mb-2", children: title }),
    subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mb-4", children: subtitle }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { ref: mapRef, className: "w-full" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-4 text-xs text-gray-500", children: [
      "Data shows ",
      valueLabel.toLowerCase(),
      " across European countries. Values are sample data for demonstration purposes."
    ] })
  ] });
};
var EuropeMap_default = EuropeMap;
var TOPOLOGY_BASE_URL4 = "https://ontopic-public-data.t3.storage.dev/geo";
var ZipMap = ({ data }) => {
  const mapRef = React.useRef(null);
  const [us, setUs] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(`${TOPOLOGY_BASE_URL4}/us-albers-counties-10m.json`).then((response) => response.json()).then((topology) => {
      setUs(topology);
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading topology:", error);
      setLoading(false);
    });
  }, []);
  React.useEffect(() => {
    if (!data || data.length === 0 || !us || loading) return;
    if (mapRef.current) mapRef.current.innerHTML = "";
    const statemesh = topojson3__namespace.mesh(us, us.objects.states, (a, b) => a !== b);
    const nation = topojson3__namespace.feature(us, us.objects.nation);
    const countiesmesh = topojson3__namespace.mesh(us, us.objects.counties);
    const mapPlot = Plot24__namespace.plot({
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
        Plot24__namespace.geo(countiesmesh, { strokeOpacity: 0.5 }),
        Plot24__namespace.geo(nation),
        Plot24__namespace.geo(statemesh, { strokeOpacity: 0.2 }),
        Plot24__namespace.dot(data, {
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center items-center", style: { minHeight: "600px" }, children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" }) }) }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "ZIP Code Density Map" }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Geographic distribution of health data with size and color encoding" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { ref: mapRef, className: "flex justify-center" }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Each dot represents a ZIP code area. Dot size and color both encode obesity rates, with larger and redder dots indicating higher rates." })
    ] })
  ] });
};
var ZipMap_default = ZipMap;
function TimetrendDemo({ defaults, error, data, colors, label }) {
  console.log("ttd data", data);
  console.log("ttd defaults", defaults);
  if (!defaults || !data) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { children: "Loading..." });
  }
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const initialVisibleSeries = data.dataPointMetadata?.find((item) => item.id === defaults.color)?.categories || [];
  const [visibleSeries, setVisibleSeries] = React.useState(new Set(initialVisibleSeries));
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
  const { theme } = nextThemes.useTheme();
  const USEPREZ = typeof defaults.plotBands !== "undefined" && defaults.plotBands === "PrezEra";
  const colorPal = colors[defaults.color] || {};
  React.useEffect(() => {
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
  React.useEffect(() => {
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
    const plot32 = Plot24__namespace.plot({
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
        USEPREZ ? Plot24__namespace.rect(filteredDem, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#2987f1"
        }) : null,
        USEPREZ ? Plot24__namespace.rect(filteredRep, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#fa5352"
        }) : null,
        Plot24__namespace.axisX({
          tickSize: 5,
          tickPadding: 5,
          tickFormat: (d) => `${Math.floor(d)}`
        }),
        Plot24__namespace.axisY({
          label: "",
          tickFormat: data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).units == "Percent" ? (d) => `${d}${data.dataPointMetadata.find(
            (item) => item.id === defaults.y
          ).value_suffix}` : "",
          tickSize: 0
        }),
        Plot24__namespace.lineY(filteredData, {
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
        error === "yes" ? Plot24__namespace.ruleX(filteredData, {
          x: defaults.x,
          y1: "ci_lower",
          y2: "ci_upper",
          stroke: defaults.color ? defaults.color : void 0
        }) : null,
        Plot24__namespace.dot(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color ? defaults.color : void 0,
          r: 4
        }),
        Plot24__namespace.ruleY([yaxisMinEb]),
        ...filteredDem.map((president) => Plot24__namespace.text(
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
        ...filteredRep.map((president) => Plot24__namespace.text(
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
        Plot24__namespace.tip(
          filteredData,
          Plot24__namespace.pointer({
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
      containerRef.current.appendChild(plot32);
    }
  }, [data, defaults, error, containerWidth, visibleSeries, theme, colorPal]);
  const colorsinfo = data.dataPointMetadata.find((item) => item.id === defaults.color).categories;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-xl font-semibold mb-1", children: data.metadata.title }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-md text-gray-600 dark:text-gray-300 mb-2", children: data.metadata.subtitle }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }, children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs", children: label }),
      colorsinfo.map((series) => /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: "legend-item text-xs cursor-pointer flex items-center",
          onClick: () => toggleSeries(series),
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "legend-icon mr-1 relative",
                style: {
                  width: "12px",
                  height: "12px",
                  backgroundColor: visibleSeries.has(series) ? getColor(series) : "#ccc",
                  display: "inline-block"
                },
                children: !visibleSeries.has(series) && /* @__PURE__ */ jsxRuntime.jsx(
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
            /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: visibleSeries.has(series) ? "inherit" : "#ccc" }, children: series })
          ]
        },
        series
      ))
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className: "w-full" })
  ] });
}

exports.BarChart = basic_bar_v1_default;
exports.BoxPlot = stat_boxplot_v1_default;
exports.BoxPlotFaceted = BoxPlotFaceted;
exports.BoxPlotFacetedGrouped = BoxPlotFacetedGrouped;
exports.BoxPlotGrouped = BoxPlotGrouped;
exports.BubbleMap = geo_bubble_v1_default;
exports.BulletChart = BulletChart;
exports.ChoroplethMap = ChoroplethMap_default;
exports.CorrelationHeatmap = CorrelationHeatmap_default;
exports.DensityPlot = stat_density_v1_default;
exports.DistributionPlot = DistributionPlot;
exports.DivergingBar = DivergingBar;
exports.DotPlot = basic_dot_v1_default;
exports.EuropeMap = EuropeMap_default;
exports.FacetedPlot = FacetedPlot;
exports.ForestPlot = ForestPlot;
exports.GeoDensityMap = GeoDensityMap_default;
exports.HistogramObservable = HistogramObservable;
exports.OddsRatio = OddsRatio_default;
exports.PcaPlot = PcaPlot;
exports.PlotContainer = PlotContainer;
exports.PlotExport = PlotExport;
exports.PlotThemeProvider = PlotThemeProvider;
exports.QQPlot = QQPlot;
exports.RegressionPlot = RegressionPlot;
exports.ResidualPlot = ResidualPlot;
exports.SlopeChart = SlopeChart;
exports.Sparkline = Sparkline;
exports.SplitBar = stat_splitbar_v1_default;
exports.StateMap = geo_state_map_v1_default;
exports.StripPlot = StripPlot;
exports.SwarmPlot = SwarmPlot;
exports.TimeTrendDemo = TimetrendDemo;
exports.ZipMap = ZipMap_default;
exports.defaultDarkTheme = defaultDarkTheme;
exports.defaultLightTheme = defaultLightTheme;
exports.usePlotTheme = usePlotTheme;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map