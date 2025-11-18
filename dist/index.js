'use strict';

var React = require('react');
var Plot2 = require('@observablehq/plot');
var jsxRuntime = require('react/jsx-runtime');
var lucideReact = require('lucide-react');
var topojson = require('topojson-client');
var recharts = require('recharts');

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
var Plot2__namespace = /*#__PURE__*/_interopNamespace(Plot2);
var topojson__namespace = /*#__PURE__*/_interopNamespace(topojson);

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
    const plot8 = Plot2__namespace.plot({
      ...plotSpec,
      width: finalWidth,
      height
    });
    if (plotRef.current) {
      plotRef.current.remove();
    }
    containerRef.current.appendChild(plot8);
    plotRef.current = plot8;
    onPlotCreated?.(plot8);
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
    const states = topojson__namespace.feature(usTopoJSON, usTopoJSON.objects.states);
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
    const statemesh = topojson__namespace.mesh(
      usTopoJSON,
      usTopoJSON.objects.states,
      (a, b) => a !== b
    );
    const nation = topojson__namespace.feature(
      usTopoJSON,
      usTopoJSON.objects.nation
    );
    const plot8 = Plot2__namespace.plot({
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
        Plot2__namespace.geo(states, {
          fill: (d) => d.properties.value
        }),
        // State boundaries
        Plot2__namespace.geo(statemesh, {
          strokeWidth: 0.75
        }),
        // Nation outline
        Plot2__namespace.geo(nation, {
          strokeWidth: 1.5
        }),
        // Interactive tooltips
        Plot2__namespace.tip(
          states.features,
          Plot2__namespace.pointer(
            Plot2__namespace.centroid({
              title: (d) => `${d.properties.name}: ${formatNumberAsK(d.properties.value)}`
            })
          )
        )
      ]
    });
    containerRef.current.appendChild(plot8);
    return () => {
      plot8.remove();
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
      Plot2__namespace.dot(plotData, {
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
    const plot8 = Plot2__namespace.plot({
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
    containerRef.current.appendChild(plot8);
    return () => {
      plot8?.remove();
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
    const plot8 = Plot2__namespace.plot({
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
        Plot2__namespace.boxY(data, {
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
    containerRef.current.appendChild(plot8);
    return () => {
      plot8?.remove();
    };
  }, [data, x, y, title, xLabel, yLabel, fill, fillOpacity, stroke, strokeWidth, outlierRadius, width, height, marginLeft, marginBottom, xTickRotate]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
}
var stat_boxplot_v1_default = BoxPlot;
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
    const plot8 = Plot2__namespace.plot({
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
        Plot2__namespace.barX(sortedData, {
          y: "category",
          x: "overall",
          fill: "#e4e4e4",
          title: (d) => `Overall: ${formatValue(d.overall)}`
        }),
        // Dots for subcategory values
        Plot2__namespace.dot(dotData, {
          y: "category",
          x: "value",
          fill: "subcategory",
          r: 5,
          tip: true,
          title: (d) => `${d.subcategory}: ${formatValue(d.value)}`
        }),
        // Value labels on bars
        ...showValueLabels ? [
          Plot2__namespace.text(sortedData, {
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
        Plot2__namespace.ruleX([minValue])
      ]
    });
    containerRef.current.appendChild(plot8);
    return () => {
      plot8.remove();
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
    const plot8 = Plot2__namespace.plot({
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
        Plot2__namespace.dot(data, {
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
        Plot2__namespace.ruleX([0])
      ],
      width,
      height,
      marginLeft
    });
    containerRef.current.appendChild(plot8);
    return () => {
      plot8?.remove();
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
      Plot2__namespace.barY(data, {
        x,
        y,
        fill
      })
    ];
    if (errorY) {
      marks.push(
        Plot2__namespace.ruleX(data, {
          x,
          y1: errorY.lower,
          y2: errorY.upper,
          stroke: errorStroke,
          strokeWidth: errorStrokeWidth
        })
      );
    }
    const plot8 = Plot2__namespace.plot({
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
    containerRef.current.appendChild(plot8);
    return () => {
      plot8?.remove();
    };
  }, [data, x, y, errorY, title, subtitle, caption, xLabel, yLabel, fill, errorStroke, errorStrokeWidth, width, height, marginBottom, xTickRotate, xTickFormat, xTicks]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref: containerRef, className });
}
var basic_bar_v1_default = BarChart;
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { children: "Error: Duplicate years detected in the dataset." });
  }
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-white p-3 border border-gray-200 shadow-lg rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-medium", children: `Year: ${label}` }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-blue-600", children: `${valueMetadata?.name}: ${dataPoint.value.toFixed(1)}${valueMetadata?.value_suffix || ""}` }),
      dataPoint.ci_lower && dataPoint.ci_upper && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 text-sm", children: `95% CI: [${dataPoint.ci_lower.toFixed(1)}, ${dataPoint.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ""}` }),
      dataPoint.n_actual && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 text-sm", children: `N: ${dataPoint.n_actual.toLocaleString()}` })
    ] });
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-2xl font-bold mb-1", children: metadata.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 mb-2", children: metadata.subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full h-[400px]", children: [
      /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
        recharts.LineChart,
        {
          data: numericData,
          margin: {
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          },
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3", vertical: false }),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.XAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.YAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Line,
              {
                type: "linear",
                dataKey: "value",
                stroke: "#000000",
                strokeWidth: 1.5,
                dot: { r: 3, fill: "#000000" },
                activeDot: { r: 5 },
                isAnimationActive: false,
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  recharts.ErrorBar,
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
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-sm text-gray-400", children: [
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { children: "Error: Duplicate years detected in the dataset." });
  }
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-white p-3 border border-gray-200 shadow-lg rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-medium", children: `Year: ${label}` }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-blue-600", children: `${valueMetadata?.name}: ${dataPoint.value.toFixed(1)}${valueMetadata?.value_suffix || ""}` }),
      dataPoint.ci_lower && dataPoint.ci_upper && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 text-sm", children: `95% CI: [${dataPoint.ci_lower.toFixed(1)}, ${dataPoint.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ""}` }),
      dataPoint.n_actual && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 text-sm", children: `N: ${dataPoint.n_actual.toLocaleString()}` })
    ] });
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-2xl font-bold mb-1", children: metadata.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600 mb-2", children: metadata.subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full h-[400px]", children: [
      /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
        recharts.LineChart,
        {
          data: numericData,
          margin: {
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          },
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3", vertical: false }),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.XAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.YAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Line,
              {
                type: "linear",
                dataKey: "value",
                stroke: "#000000",
                strokeWidth: 1.5,
                dot: { r: 3, fill: "#000000" },
                activeDot: { r: 5 },
                isAnimationActive: false,
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  recharts.ErrorBar,
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
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-sm text-gray-400", children: [
        "Source: ",
        metadata.source.name
      ] }) })
    ] })
  ] });
}
function AbortionOpinionChart({ data }) {
  const [selectedRegion, setSelectedRegion] = React.useState("All");
  const [selectedEducation, setSelectedEducation] = React.useState("All");
  const { metadata, dataPoints, dataPointMetadata } = data;
  const regions = ["All", ...dataPointMetadata.find((d) => d.id === "Census_Region")?.categories || []];
  const educationLevels = ["All", ...dataPointMetadata.find((d) => d.id === "Education")?.categories || []];
  const races = dataPointMetadata.find((d) => d.id === "Race")?.categories || [];
  const filteredData = dataPoints.filter((point) => {
    const regionMatch = selectedRegion === "All" || point.Census_Region === selectedRegion;
    const educationMatch = selectedEducation === "All" || point.Education === selectedEducation;
    return regionMatch && educationMatch;
  });
  const groupedData = React__namespace.default.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-white p-4 border border-gray-300 shadow-lg rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-semibold mb-2 text-sm", children: label }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "space-y-1", children: races.map((race) => {
        const value = data2[race];
        const ciLower = data2[`${race}_ci_lower`];
        const ciUpper = data2[`${race}_ci_upper`];
        const n = data2[`${race}_n`];
        if (value === void 0) return null;
        return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "font-medium", children: [
            race,
            ":"
          ] }),
          " ",
          /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "font-semibold", children: [
            value.toFixed(1),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-xs text-gray-600 ml-2", children: [
            "95% CI: [",
            ciLower.toFixed(1),
            "%, ",
            ciUpper.toFixed(1),
            "%]"
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-xs text-gray-500 ml-2", children: [
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full space-y-4", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-2xl font-bold", children: metadata.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: metadata.subtitle }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-xs text-gray-500 italic", children: metadata.question })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-4 items-center flex-wrap", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: "region", className: "text-sm font-medium", children: "Region:" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "select",
          {
            id: "region",
            value: selectedRegion,
            onChange: (e) => setSelectedRegion(e.target.value),
            className: "border border-gray-300 rounded px-3 py-1 text-sm",
            children: regions.map((region) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: region, children: region }, region))
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: "education", className: "text-sm font-medium", children: "Education:" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "select",
          {
            id: "education",
            value: selectedEducation,
            onChange: (e) => setSelectedEducation(e.target.value),
            className: "border border-gray-300 rounded px-3 py-1 text-sm",
            children: educationLevels.map((level) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: level, children: level }, level))
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "w-full", style: { height: Math.max(400, groupedData.length * 40) }, children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
      recharts.BarChart,
      {
        data: groupedData,
        layout: "vertical",
        margin: { top: 20, right: 30, left: 200, bottom: 20 },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3", horizontal: false }),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.XAxis,
            {
              type: "number",
              domain: [0, 100],
              tickFormatter: (value) => `${value}%`,
              label: { value: "Support for Legal Abortion (%)", position: "bottom", offset: 0 }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.YAxis,
            {
              dataKey: "name",
              type: "category",
              width: 190,
              tick: { fontSize: 11 }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Legend, {}),
          races.map((race) => /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Bar,
            {
              dataKey: race,
              fill: colors[race] || "#6B7280",
              name: race,
              isAnimationActive: false,
              children: /* @__PURE__ */ jsxRuntime.jsx(
                recharts.ErrorBar,
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
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-xs text-gray-500 space-y-1 mt-4 border-t pt-4", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "Source:" }),
        " ",
        metadata.source.name
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "Note:" }),
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: `p-6 text-center text-gray-500 ${className}`, children: "No demographic data available" });
  }
  const transformedData = data.map((item) => {
    const transformed = { ...item };
    if (errorLowKey && errorHighKey) {
      transformed.error = [item[errorLowKey], item[errorHighKey]];
    }
    return transformed;
  });
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, children: [
    title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold mb-4 text-center", children: title }),
    /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width, height, children: /* @__PURE__ */ jsxRuntime.jsxs(
      recharts.BarChart,
      {
        data: transformedData,
        margin: { top: 20, right: 30, left: 20, bottom: 80 },
        children: [
          showGrid && /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.XAxis,
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
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.YAxis,
            {
              label: yLabel ? { value: yLabel, angle: -90, position: "insideLeft" } : void 0
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, {}),
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Bar, { dataKey: valueKey, fill, children: errorLowKey && errorHighKey && /* @__PURE__ */ jsxRuntime.jsx(
            recharts.ErrorBar,
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative max-w-xs rounded-xl bg-white/95 p-3 shadow-xl ring-1 ring-black/5", children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: "absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm bg-white ring-1 ring-black/5",
        "aria-hidden": true
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-base font-semibold", children: d.name }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-1 text-sm leading-5", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "font-semibold", children: [
          xLabel,
          ":"
        ] }),
        " ",
        xFmt ? xFmt(d.x) : d.x
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "font-semibold", children: "Average Happiness:" }),
        " ",
        isFinite(d.y) ? Number(d.y).toFixed(2) : "\u2014"
      ] }),
      isFinite(d.population_m) && /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "font-semibold", children: "Population:" }),
        " ",
        fmtMillions(d.population_m)
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "font-semibold", children: "Religion:" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            className: "inline-block h-2.5 w-2.5 rounded-full",
            style: { background: d.fill }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("span", { children: d.religion })
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
  const { line, band } = lineAndBand(points, xMin, xMax, 100);
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-1 text-lg md:text-xl font-semibold", children: title }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-[340px] w-full", children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.ComposedChart, { margin: { top: 8, right: 18, bottom: 8, left: 8 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.XAxis,
        {
          type: "number",
          dataKey: "x",
          domain: xDomain,
          tickFormatter: xTickFmt,
          label: { value: xLabel, position: "insideBottom", offset: -2 }
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.YAxis,
        {
          type: "number",
          domain: ["dataMin - 0.5", "dataMax + 0.5"],
          label: { value: "Average Happiness", angle: -90, position: "insideLeft" }
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.ZAxis, { dataKey: "z", range: [50, 240] }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.Area,
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
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.Line,
        {
          type: "monotone",
          data: line,
          dataKey: "y",
          dot: false,
          stroke: "#475569",
          strokeWidth: 2,
          isAnimationActive: false
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.ReferenceLine, { y: 7, stroke: "#cbd5e1", strokeDasharray: "4 4" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.Scatter,
        {
          data: scatterData,
          dataKey: "y",
          shape: (props) => {
            const { cx, cy, payload, size } = props;
            const r2 = Math.sqrt(Math.max(0, size) / Math.PI);
            return /* @__PURE__ */ jsxRuntime.jsx(
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
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.Tooltip,
        {
          cursor: { strokeDasharray: "3 3" },
          content: (
            // We pass the axis label and formatter so the tooltip can render the x-value correctly.
            /* @__PURE__ */ jsxRuntime.jsx(BubbleTooltip, { xLabel, xFmt: xTickFmt })
          ),
          wrapperStyle: { outline: "none" }
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-1 text-xs text-violet-700", children: [
      "Correlation: ",
      isFinite(r) ? r.toFixed(2) : "\u2014"
    ] })
  ] });
}
function RegionLegend() {
  const items = Object.keys(REGION_COLORS).map((k) => [k, REGION_COLORS[k]]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex flex-wrap items-center gap-3 text-sm", children: items.map(([label, color]) => /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1", children: [
    /* @__PURE__ */ jsxRuntime.jsx("span", { className: "inline-block h-3 w-3 rounded-full", style: { background: color } }),
    /* @__PURE__ */ jsxRuntime.jsx("span", { children: label })
  ] }, label)) });
}
function HappinessCorrelatesPanel({ data }) {
  const dataset = data ?? [];
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full p-4 md:p-6", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid items-start gap-8 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        Section,
        {
          title: "Human Development Index",
          xKey: "hdi",
          xLabel: "HDI",
          xDomain: [0.5, 1],
          data: dataset
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
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
      /* @__PURE__ */ jsxRuntime.jsx(
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
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsxRuntime.jsx(RegionLegend, {}) })
  ] });
}

exports.AbortionOpinionChart = AbortionOpinionChart;
exports.BarChart = basic_bar_v1_default;
exports.BoxPlot = stat_boxplot_v1_default;
exports.BubbleMap = geo_bubble_v1_default;
exports.DemographicBarChart = stat_demographic_bar_v1_default;
exports.DotPlot = basic_dot_v1_default;
exports.PlotContainer = PlotContainer;
exports.PlotExport = PlotExport;
exports.PlotThemeProvider = PlotThemeProvider;
exports.ScatterplotRegression = HappinessCorrelatesPanel;
exports.SplitBar = stat_splitbar_v1_default;
exports.StateMap = geo_state_map_v1_default;
exports.TimeSeriesChart = TimeSeriesChart2;
exports.TimeSeriesLine = TimeSeriesChart;
exports.defaultDarkTheme = defaultDarkTheme;
exports.defaultLightTheme = defaultLightTheme;
exports.usePlotTheme = usePlotTheme;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map