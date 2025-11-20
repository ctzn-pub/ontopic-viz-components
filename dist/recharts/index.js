'use strict';

var recharts = require('recharts');
var jsxRuntime = require('react/jsx-runtime');
var React5 = require('react');
var Plot2 = require('@observablehq/plot');
var reactSlot = require('@radix-ui/react-slot');
var classVarianceAuthority = require('class-variance-authority');
var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');
var nextThemes = require('next-themes');
var LabelPrimitive = require('@radix-ui/react-label');
var SwitchPrimitive = require('@radix-ui/react-switch');
var lucideReact = require('lucide-react');
var TabsPrimitive = require('@radix-ui/react-tabs');

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

var React5__default = /*#__PURE__*/_interopDefault(React5);
var Plot2__namespace = /*#__PURE__*/_interopNamespace(Plot2);
var LabelPrimitive__namespace = /*#__PURE__*/_interopNamespace(LabelPrimitive);
var SwitchPrimitive__namespace = /*#__PURE__*/_interopNamespace(SwitchPrimitive);
var TabsPrimitive__namespace = /*#__PURE__*/_interopNamespace(TabsPrimitive);

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
  const [selectedRegion, setSelectedRegion] = React5.useState("All");
  const [selectedEducation, setSelectedEducation] = React5.useState("All");
  const { metadata, dataPoints, dataPointMetadata } = data;
  const regions = ["All", ...dataPointMetadata.find((d) => d.id === "Census_Region")?.categories || []];
  const educationLevels = ["All", ...dataPointMetadata.find((d) => d.id === "Education")?.categories || []];
  const races = dataPointMetadata.find((d) => d.id === "Race")?.categories || [];
  const filteredData = dataPoints.filter((point) => {
    const regionMatch = selectedRegion === "All" || point.Census_Region === selectedRegion;
    const educationMatch = selectedEducation === "All" || point.Education === selectedEducation;
    return regionMatch && educationMatch;
  });
  const groupedData = React5__default.default.useMemo(() => {
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
var LineChart3 = ({ data = [] }) => {
  const basicRef = React5.useRef(null);
  const errorBarsRef = React5.useRef(null);
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
  React5.useEffect(() => {
    if (!marijuanaData || marijuanaData.length === 0) return;
    if (basicRef.current) basicRef.current.innerHTML = "";
    if (errorBarsRef.current) errorBarsRef.current.innerHTML = "";
    console.log("Rendering charts with data:", marijuanaData.length, "points");
    try {
      const basicPlot = Plot2__namespace.plot({
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
          Plot2__namespace.lineY(marijuanaData, {
            x: "year",
            y: "value",
            stroke: "demo_level_title",
            strokeWidth: 2.5,
            tip: true
          }),
          Plot2__namespace.dot(marijuanaData, {
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
      const errorBarsPlot = Plot2__namespace.plot({
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
          Plot2__namespace.ruleX(marijuanaData, {
            x: "year",
            y1: "ci_lower",
            y2: "ci_upper",
            stroke: "demo_level_title",
            strokeWidth: 1.5,
            strokeOpacity: 0.7
          }),
          // Main trend lines
          Plot2__namespace.lineY(marijuanaData, {
            x: "year",
            y: "value",
            stroke: "demo_level_title",
            strokeWidth: 2.5,
            tip: true
          }),
          // Data points
          Plot2__namespace.dot(marijuanaData, {
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "Analysis of public opinion on marijuana legalization from the General Social Survey (1975-2022). Shows how attitudes vary by church attendance frequency, with confidence intervals showing statistical uncertainty." }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Basic Trend Lines" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Clean line chart showing support trends by church attendance frequency" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: basicRef, className: "flex justify-center", style: { minHeight: "400px" } }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "This simplified view shows the clear trend patterns: those who rarely attend church show the highest and fastest-growing support, while those who attend weekly show the lowest but steadily increasing support over time." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Trends with Error Bars" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Complete analysis including confidence intervals showing statistical uncertainty" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: errorBarsRef, className: "flex justify-center", style: { minHeight: "400px" } }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "The error bars show 95% confidence intervals around each estimate. Larger error bars indicate greater statistical uncertainty, often due to smaller sample sizes. This matches the original Observable Framework visualization design." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "font-semibold mb-2", children: "Key Findings" }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Rarely Attend Church" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Highest support levels (82% by 2022)" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Steady upward trend since 1990s" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Largest absolute increase over time" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Generally narrower confidence intervals" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Sometimes Attend" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Moderate support levels (73% by 2022)" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Similar upward trajectory" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "More volatile in earlier years" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Intermediate between other groups" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Weekly Church Attendance" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Lowest support but growing (44% by 2022)" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Accelerated growth since 2000s" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Largest relative percentage increase" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Shows cultural shift even among religious" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var LineChart_default = LineChart3;
function cn(...inputs) {
  return tailwindMerge.twMerge(clsx.clsx(inputs));
}
var buttonVariants = classVarianceAuthority.cva(
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
  const Comp = asChild ? reactSlot.Slot : "button";
  return /* @__PURE__ */ jsxRuntime.jsx(
    Comp,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
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
  const [showRecessions, setShowRecessions] = React5.useState(true);
  const { theme } = nextThemes.useTheme();
  const processedData = React5.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-popover/80 backdrop-blur p-2 rounded-lg border shadow-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-sm font-medium", children: date }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-lg font-bold", children: value }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: `text-sm ${color}`, children: [
        percentChange,
        "% from previous"
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full bg-background shadow-lg rounded-lg border", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pb-4 p-6", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-2xl font-bold text-foreground", children: data.short_title || data.title.split(":")[0] }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-1", children: data.title })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "p-6 pt-0", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-[400px]", children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
      recharts.LineChart,
      {
        data: filteredData,
        margin: { top: 20, right: 30, left: 50, bottom: 0 },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.CartesianGrid,
            {
              strokeDasharray: "3 3",
              className: "stroke-muted",
              vertical: false
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.XAxis,
            {
              dataKey: "date",
              tickFormatter: formatDate,
              minTickGap: 30,
              tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.YAxis,
            {
              domain: ["auto", "auto"],
              tickFormatter: formatValue,
              tick: { fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Line,
            {
              type: "monotone",
              dataKey: "value",
              dot: false,
              stroke: "#4299e1",
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Brush,
            {
              dataKey: "date",
              height: 30,
              stroke: "#8884d8",
              fill: "#fff",
              tickFormatter: formatDate,
              travellerWidth: 10,
              startIndex: 0,
              endIndex: filteredData.length - 1,
              children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.LineChart, { children: [
                /* @__PURE__ */ jsxRuntime.jsx(recharts.Line, { dataKey: "value", stroke: "#4299e1", dot: false }),
                showRecessions && recessionPeriods2.map((period, index) => /* @__PURE__ */ jsxRuntime.jsx(
                  recharts.ReferenceArea,
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
          showRecessions && recessionPeriods2.map((period, index) => /* @__PURE__ */ jsxRuntime.jsx(
            recharts.ReferenceArea,
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
var TimeRangeButton = ({ active, onClick, children }) => /* @__PURE__ */ jsxRuntime.jsx(
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
  const [timeRange, setTimeRange] = React5.useState("MAX");
  const [showRecessions, setShowRecessions] = React5.useState(true);
  const [brushDomain, setBrushDomain] = React5.useState(null);
  const { theme } = nextThemes.useTheme();
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
  const filteredData = React5.useMemo(() => {
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
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-background p-4 rounded-lg shadow-lg border border-border", children: [
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-bold text-foreground", children: formatDate(label) }),
        payload.map((entry) => {
          const color = entry.dataKey === series1.title ? colors.series1 : colors.series2;
          return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-sm text-muted-foreground flex items-center", children: [
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "w-2 h-2 rounded-full mr-2", style: { backgroundColor: color } }),
            /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
              entry.dataKey,
              ":"
            ] }),
            /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "ml-1 font-medium", style: { color }, children: [
              entry.value.toFixed(2),
              "%"
            ] })
          ] }) }, entry.dataKey);
        })
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full bg-background shadow-lg rounded-lg border", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pb-0 p-6", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-2xl font-bold text-foreground", children: "Index Chart" }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-gray-600 text-sm mt-2", children: [
          series1.title,
          " vs ",
          series2.title
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex flex-wrap gap-2 items-center", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex space-x-2", children: timeRanges.map((range) => /* @__PURE__ */ jsxRuntime.jsx(
        TimeRangeButton,
        {
          active: timeRange === range,
          onClick: () => setTimeRange(range),
          children: range
        },
        range
      )) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "p-6 pt-0", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-[500px]", children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
      recharts.LineChart,
      {
        data: filteredData,
        margin: { top: 30, right: 30, left: 0, bottom: 20 },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Legend,
            {
              verticalAlign: "top",
              align: "left",
              height: 36,
              iconType: "circle",
              wrapperStyle: {
                paddingBottom: "60px"
              },
              formatter: (value) => /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm text-muted-foreground", children: value })
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.CartesianGrid,
            {
              strokeDasharray: "3 3",
              className: "stroke-muted",
              vertical: false
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.XAxis,
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
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.YAxis,
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
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
          showRecessions && recessionPeriods2.map((period, index) => /* @__PURE__ */ jsxRuntime.jsx(
            recharts.ReferenceArea,
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
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Line,
            {
              type: "monotone",
              dataKey: series1.title,
              stroke: colors.series1,
              strokeWidth: 2,
              dot: false,
              activeDot: { r: 6, fill: colors.series1 }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Line,
            {
              type: "monotone",
              dataKey: series2.title,
              stroke: colors.series2,
              strokeWidth: 2,
              dot: false,
              activeDot: { r: 6, fill: colors.series2 }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Brush,
            {
              dataKey: "date",
              height: 40,
              stroke: "#8884d8",
              tickFormatter: formatDate,
              onChange: handleBrushChange,
              startIndex: brushDomain?.start,
              endIndex: brushDomain?.end,
              children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.LineChart, { children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  recharts.Line,
                  {
                    type: "monotone",
                    dataKey: series1.title,
                    stroke: colors.series1,
                    strokeWidth: 1,
                    dot: false
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  recharts.Line,
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full max-w-7xl mx-auto p-4", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-2xl font-bold mb-4", children: title }),
    /* @__PURE__ */ jsxRuntime.jsx(
      IndexChart,
      {
        series1,
        series2
      }
    ),
    description && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-gray-600", children: /* @__PURE__ */ jsxRuntime.jsx("p", { children: description }) })
  ] });
};
var TimeSeriesIndex_default = SeriesComparison;
var TimeRangeButton2 = ({ active, onClick, children }) => /* @__PURE__ */ jsxRuntime.jsx(
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
  const [timeRange, setTimeRange] = React5.useState("MAX");
  const [showRecessions, setShowRecessions] = React5.useState(true);
  const { theme } = nextThemes.useTheme();
  const colors = {
    series1: "#4299e1",
    series2: "#f59e0b"};
  const filteredData = React5__default.default.useMemo(() => {
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
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-background p-4 rounded-lg shadow-lg border border-border", children: [
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-bold text-foreground", children: formatDate(label || "") }),
        payload.map((entry) => /* @__PURE__ */ jsxRuntime.jsxs(
          "p",
          {
            className: "text-sm text-muted-foreground flex items-center",
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "w-2 h-2 rounded-full mr-2", style: { backgroundColor: entry.color } }),
              /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
                entry.name,
                ":"
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ml-1 font-medium", style: { color: entry.color }, children: typeof entry.value === "number" ? `${entry.value.toFixed(1)} ${entry.name === series1Name ? series1Unit : series2Unit}` : "N/A" })
            ]
          },
          entry.dataKey
        ))
      ] });
    }
    return null;
  };
  const yAxis1Domain = React5__default.default.useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map((item) => Number(item[series1Name])).filter(
      (value) => value !== void 0 && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series1Name]);
  const yAxis2Domain = React5__default.default.useMemo(() => {
    if (!filteredData.length) return [0, 0];
    const values = filteredData.map((item) => Number(item[series2Name])).filter(
      (value) => value !== void 0 && !isNaN(value)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const margin = (max - min) * 0.1;
    return [min - margin, max + margin];
  }, [filteredData, series2Name]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full bg-background shadow-lg rounded-lg border", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-row items-center justify-between space-y-0 pb-2 p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-base font-medium", children: title }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center space-x-2", children: timeRanges.map((range) => /* @__PURE__ */ jsxRuntime.jsx(
        TimeRangeButton2,
        {
          active: timeRange === range,
          onClick: () => setTimeRange(range),
          children: range
        },
        range
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "p-6 pt-0", children: [
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mb-6", children: description }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-96", children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
        recharts.LineChart,
        {
          data: filteredData,
          margin: { top: 20, right: 30, left: 0, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.CartesianGrid,
              {
                strokeDasharray: "3 3",
                className: "stroke-muted",
                vertical: false
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Legend,
              {
                verticalAlign: "top",
                align: "left",
                height: 36,
                iconType: "circle",
                formatter: (value) => /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm text-muted-foreground", children: value })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Brush,
              {
                dataKey: "date",
                height: 30,
                stroke: "#8884d8",
                fill: "#fff",
                tickFormatter: formatDate,
                travellerWidth: 10,
                startIndex: 0,
                endIndex: filteredData.length - 1,
                children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.LineChart, { children: [
                  /* @__PURE__ */ jsxRuntime.jsx(recharts.Line, { dataKey: series1Name, stroke: colors.series1, dot: false }),
                  /* @__PURE__ */ jsxRuntime.jsx(recharts.Line, { dataKey: series2Name, stroke: colors.series2, dot: false })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.XAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.YAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.YAxis,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Tooltip,
              {
                content: (props) => /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, { ...props })
              }
            ),
            showRecessions && recessionPeriods.map((period, index) => /* @__PURE__ */ jsxRuntime.jsx(
              recharts.ReferenceArea,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Line,
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
            /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Line,
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    LabelPrimitive__namespace.Root,
    {
      "data-slot": "label",
      className: cn(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    SwitchPrimitive__namespace.Root,
    {
      "data-slot": "switch",
      className: cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntime.jsx(
        SwitchPrimitive__namespace.Thumb,
        {
          "data-slot": "switch-thumb",
          className: cn(
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
  const [visibleGroups, setVisibleGroups] = React5.useState(
    new Set(defaultVisibleGroups || demographicGroups)
  );
  const [showCI, setShowCI] = React5.useState(false);
  React5.useEffect(() => {
    setVisibleGroups(new Set(defaultVisibleGroups || demographicGroups));
  }, [demographicGroups, defaultVisibleGroups]);
  if (!data || !data.dataPoints || !Array.isArray(data.dataPoints) || data.dataPoints.length === 0) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "p-4 text-center text-gray-500", children: "No data available to display chart." });
  }
  const processedDataPoints = data.dataPoints.map(processDataPoint);
  const allValidYearsNumeric = processedDataPoints.map((d) => d.year).filter((year) => year !== null);
  if (allValidYearsNumeric.length === 0) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "p-4 text-center text-gray-500", children: "Data contains no valid years." });
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
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-white p-3 border border-gray-300 shadow-lg rounded-md text-sm max-w-xs", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-semibold mb-2 text-gray-700", children: `Year: ${label}` }),
      visiblePayload.map((series) => {
        const colorIndex = demographicGroups.indexOf(series.name);
        const color = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : series.color || "#8884d8";
        const pointData = series.payload;
        return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-1.5 last:mb-0", children: [
          /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-medium", style: { color }, children: series.name }),
          /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", style: { color }, children: `Value: ${series.value != null ? `${prefix}${series.value.toFixed(1)}${suffix}` : "N/A"}` }),
          pointData?.ci_lower !== void 0 && pointData?.ci_upper !== void 0 && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-500 text-xs", children: `95% CI: [${pointData.ci_lower.toFixed(1)}%, ${pointData.ci_upper.toFixed(1)}%]` }),
          pointData?.n_actual && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-500 text-xs", children: `N: ${pointData.n_actual.toLocaleString()}` })
        ] }, series.name);
      })
    ] });
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full bg-white p-4 md:p-6 rounded-lg shadow", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-xl font-semibold text-gray-800", children: data.metadata.title }),
      data.metadata.subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-1", children: data.metadata.subtitle }),
      data.metadata.question && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-500 italic mt-1", children: data.metadata.question })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-[450px] md:h-[500px] w-full", children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
      recharts.LineChart,
      {
        margin: { top: 20, right: 20, left: 10, bottom: 5 },
        children: [
          relevantPresidentialTerms.map((term, index) => /* @__PURE__ */ jsxRuntime.jsx(
            recharts.ReferenceArea,
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
          /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#e0e0e0", vertical: false }),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.XAxis,
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
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.YAxis,
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
          /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}), cursor: { stroke: "#a0a0a0", strokeWidth: 1, strokeDasharray: "3 3" } }),
          /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Legend,
            {
              verticalAlign: "bottom",
              align: "center",
              height: 40,
              onClick: handleLegendClick,
              iconSize: 10,
              wrapperStyle: { paddingTop: "10px" },
              formatter: (value) => {
                const isVisible = visibleGroups.has(value);
                return /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: isVisible ? "#333" : "#aaa", cursor: "pointer", marginLeft: "4px", fontSize: "12px" }, children: value });
              }
            }
          ),
          groupedData.map((group) => {
            const colorIndex = demographicGroups.indexOf(group.name);
            const color = colorIndex !== -1 ? COLORS[colorIndex % COLORS.length] : "#8884d8";
            return /* @__PURE__ */ jsxRuntime.jsx(
              recharts.Line,
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
                children: showCI && hasCIData && /* @__PURE__ */ jsxRuntime.jsx(
                  recharts.ErrorBar,
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
          relevantPresidentialTerms.map((term, index) => /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Text,
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
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-1 pt-2 border-t border-gray-200", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-xs text-gray-500 text-left order-1 sm:order-none", children: [
        "Source: ",
        data.metadata.source?.name || "Not specified",
        data.metadata.observations && ` (${data.metadata.observations.toLocaleString()} Observations)`
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center space-x-2 order-2 sm:order-none", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          Switch,
          {
            id: "show-ci",
            checked: showCI,
            onCheckedChange: setShowCI,
            disabled: !hasCIData
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(Label, { htmlFor: "show-ci", className: `text-xs ${!hasCIData ? "text-gray-400" : "text-gray-600"}`, children: "Show 95% CI" })
      ] })
    ] })
  ] });
}
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    TabsPrimitive__namespace.Root,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    TabsPrimitive__namespace.List,
    {
      "data-slot": "tabs-list",
      className: cn(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    TabsPrimitive__namespace.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    TabsPrimitive__namespace.Content,
    {
      "data-slot": "tabs-content",
      className: cn("flex-1 outline-none", className),
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
  "Age Group": { icon: lucideReact.Users, color: "text-blue-500" },
  "Education Attained": { icon: lucideReact.GraduationCap, color: "text-green-500" },
  Gender: { icon: lucideReact.UserCircle2, color: "text-purple-500" },
  "Household Income": { icon: lucideReact.DollarSign, color: "text-yellow-500" },
  "Race/Ethnicity": { icon: lucideReact.Palette, color: "text-red-500" }
};
var defaultCategoryInfo = {
  icon: lucideReact.Users,
  color: "text-gray-500"
};
function getCategoryInfo(category) {
  return categoryReference[category] || defaultCategoryInfo;
}
function DemographicLineChart({
  data,
  ylabel = "Value (%)"
}) {
  const [activeTab, setActiveTab] = React5.useState(null);
  const [demographicCategories, setDemographicCategories] = React5.useState([]);
  React5__default.default.useEffect(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border rounded-lg p-6", children: /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "No demographic data available" }) }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntime.jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Users, { className: "w-5 h-5" }),
      "Demographic Line Chart with Error Bars"
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsxs(Tabs, { value: activeTab || void 0, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsxRuntime.jsx(TabsList, { className: "grid w-full", style: { gridTemplateColumns: `repeat(${demographicCategories.length}, 1fr)` }, children: demographicCategories.map((category) => {
        const Icon = category.icon;
        return /* @__PURE__ */ jsxRuntime.jsxs(TabsTrigger, { value: category.key, children: [
          /* @__PURE__ */ jsxRuntime.jsx(Icon, { className: `w-4 h-4 mr-2 ${category.color}` }),
          category.key
        ] }, category.key);
      }) }),
      demographicCategories.map((category) => /* @__PURE__ */ jsxRuntime.jsxs(TabsContent, { value: category.key, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxRuntime.jsxs(
          recharts.LineChart,
          {
            width: 600,
            height: 400,
            data: category.data,
            margin: { top: 20, right: 30, left: 20, bottom: 25 },
            className: "w-full h-full",
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.XAxis,
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
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.YAxis,
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
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.Tooltip,
                {
                  contentStyle: {
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))"
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.Line,
                {
                  dataKey: "value",
                  stroke: "hsl(var(--foreground))",
                  isAnimationActive: false,
                  dot: true,
                  children: /* @__PURE__ */ jsxRuntime.jsx(
                    recharts.ErrorBar,
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
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 text-center", children: "Error bars represent 95% confidence intervals" })
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
  "Age Group": { icon: lucideReact.Users, color: "text-blue-500" },
  "Education Attained": { icon: lucideReact.GraduationCap, color: "text-green-500" },
  Gender: { icon: lucideReact.UserCircle2, color: "text-purple-500" },
  "Household Income": { icon: lucideReact.DollarSign, color: "text-yellow-500" },
  "Race/Ethnicity": { icon: lucideReact.Palette, color: "text-red-500" }
};
var defaultCategoryInfo2 = {
  icon: lucideReact.Users,
  color: "text-gray-500"
};
function getCategoryInfo2(category) {
  return categoryReference2[category] || defaultCategoryInfo2;
}
function DemographicDotPlot({
  data,
  ylabel = "Value (%)"
}) {
  const [activeTab, setActiveTab] = React5.useState(null);
  const [demographicCategories, setDemographicCategories] = React5.useState([]);
  React5__default.default.useEffect(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border rounded-lg p-6", children: /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "No demographic data available" }) }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntime.jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Users, { className: "w-5 h-5" }),
      "Demographic Dot Plot with Error Bars"
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsxs(Tabs, { value: activeTab || void 0, onValueChange: setActiveTab, children: [
      /* @__PURE__ */ jsxRuntime.jsx(TabsList, { className: "grid w-full", style: { gridTemplateColumns: `repeat(${demographicCategories.length}, 1fr)` }, children: demographicCategories.map((category) => {
        const Icon = category.icon;
        return /* @__PURE__ */ jsxRuntime.jsxs(TabsTrigger, { value: category.key, children: [
          /* @__PURE__ */ jsxRuntime.jsx(Icon, { className: `w-4 h-4 mr-2 ${category.color}` }),
          category.key
        ] }, category.key);
      }) }),
      demographicCategories.map((category) => /* @__PURE__ */ jsxRuntime.jsxs(TabsContent, { value: category.key, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxRuntime.jsxs(
          recharts.ScatterChart,
          {
            width: 600,
            height: 400,
            data: category.data,
            margin: { top: 20, right: 30, left: 20, bottom: 25 },
            className: "w-full h-full",
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.XAxis,
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
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.YAxis,
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
              /* @__PURE__ */ jsxRuntime.jsx(
                recharts.Tooltip,
                {
                  contentStyle: {
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))"
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(recharts.Scatter, { dataKey: "value", fill: "hsl(var(--foreground))", isAnimationActive: false, children: /* @__PURE__ */ jsxRuntime.jsx(
                recharts.ErrorBar,
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
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 text-center", children: "Error bars represent 95% confidence intervals" })
      ] }, category.key))
    ] }) })
  ] });
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
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
  const [sortOrder, setSortOrder] = React5.useState("desc");
  const [searchTerm, setSearchTerm] = React5.useState("");
  const [isExpanded, setIsExpanded] = React5.useState(false);
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h2", { className: "text-2xl font-bold", children: data.clean_title }),
        /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-md text-gray-500", children: [
          "(",
          data.year,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center gap-2 mb-4", children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-md text-gray-500", children: data.question }) }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          Input,
          {
            placeholder: "Search states...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "max-w-sm"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(Button, { onClick: toggleSort, variant: "outline", children: [
          "Sort ",
          sortOrder === "desc" ? "Ascending" : "Descending",
          /* @__PURE__ */ jsxRuntime.jsx(lucideReact.ArrowUpDown, { className: "ml-2 h-4 w-4" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: `${isExpanded ? "h-auto" : "h-[400px]"}`, children: /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: "100%", height: isExpanded ? 800 : 400, children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.BarChart, { data: sortedData, layout: "vertical", margin: { right: 20, top: 20, bottom: 40 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.XAxis,
        {
          type: "number",
          label: { value: `Response: ${data.response} (%)`, position: "bottom", offset: 0 },
          tickFormatter: (value) => `${value}%`
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.YAxis,
        {
          dataKey: "state",
          type: "category",
          width: 180,
          interval: isExpanded ? 0 : 5,
          tick: { fontSize: 10 }
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.Tooltip,
        {
          formatter: (value) => [`${value}%`, `Response: ${data.response}`],
          labelFormatter: (label) => `State: ${label}`
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.Bar, { dataKey: "overall", fill: "#4A4A4A" })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxRuntime.jsx(Button, { onClick: () => setIsExpanded(!isExpanded), variant: "outline", children: isExpanded ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      "See less ",
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.ChevronUp, { className: "ml-2 h-4 w-4" })
    ] }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      "Expand ",
      /* @__PURE__ */ jsxRuntime.jsx(lucideReact.ChevronDown, { className: "ml-2 h-4 w-4" })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center gap-2 mt-6", children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm text-gray-500", children: "Source: CDC Behavioral Risk Factor Surveillance System" }) })
  ] });
}
var HealthScatterplot = ({ data }) => {
  const singleRef = React5.useRef(null);
  const regressionRef = React5.useRef(null);
  const facetRef = React5.useRef(null);
  const cleanData = React5.useMemo(() => data.filter((d) => d.dir2020 !== void 0), [data]);
  React5.useEffect(() => {
    if (!data || data.length === 0) return;
    if (singleRef.current) singleRef.current.innerHTML = "";
    if (regressionRef.current) regressionRef.current.innerHTML = "";
    if (facetRef.current) facetRef.current.innerHTML = "";
    const singlePlot = Plot2__namespace.plot({
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
        Plot2__namespace.dot(cleanData, {
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
    const regressionPlot = Plot2__namespace.plot({
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
        Plot2__namespace.dot(cleanData, {
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
        Plot2__namespace.linearRegressionY(cleanData, {
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
    const facetPlot = Plot2__namespace.plot({
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
        Plot2__namespace.dot(cleanData, {
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
        Plot2__namespace.linearRegressionY(cleanData, {
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: "Scatterplot analysis exploring relationships between county-level health indicators. Each visualization reveals different aspects of the obesity-diabetes correlation using various analytical approaches." }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Basic Scatterplot" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Simple scatter plot showing the relationship between obesity and diabetes rates" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: singleRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Each point represents a county. Point size reflects population, and color indicates demographic grouping. The clear clustering pattern suggests a strong positive relationship between these health metrics." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Regression Analysis" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Same data with linear regression line showing the overall trend" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: regressionRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "The orange regression line shows the positive correlation between obesity and diabetes rates across counties. The linear trend confirms the strong association between these health conditions at the population level." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "border rounded-lg p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold", children: "Faceted Analysis" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600", children: "Separate panels for each demographic category with individual regression lines" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { ref: facetRef, className: "flex justify-center" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-600 mt-4", children: "Faceted view allows comparison of obesity-diabetes relationships across different demographic groups, each with its own regression line. This reveals how the correlation strength may vary by population characteristics." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "font-semibold mb-2", children: "Scatterplot Techniques" }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid md:grid-cols-3 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Basic Scatter" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Point-to-point relationships" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Size and color encoding" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Pattern identification" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Outlier detection" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Regression Lines" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Trend quantification" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Predictive modeling" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Correlation strength" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Statistical inference" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx("h4", { className: "font-medium", children: "Faceted Views" }),
          /* @__PURE__ */ jsxRuntime.jsxs("ul", { className: "list-disc list-inside text-gray-600 space-y-1", children: [
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Group comparisons" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Conditional relationships" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Subpopulation analysis" }),
            /* @__PURE__ */ jsxRuntime.jsx("li", { children: "Interaction effects" })
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
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
  const nonOutliers = sorted.filter((v) => v >= lowerFence && v <= upperFence);
  const min = nonOutliers.length > 0 ? nonOutliers[0] : sorted[0];
  const max = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : sorted[n - 1];
  return { min, q1, median, q3, max, outliers, iqr };
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
function mean(data) {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}
function standardDeviation(data) {
  if (data.length === 0) return 0;
  const avg = mean(data);
  const squareDiffs = data.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
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
    let density = 0;
    for (const value of data) {
      const u = (x - value) / bw;
      density += Math.exp(-1 / 2 * u * u) / Math.sqrt(2 * Math.PI);
    }
    result.push({ x, density: density / (n * bw) });
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
  const histogramData = React5.useMemo(() => {
    return createHistogram(data, bins);
  }, [data, bins]);
  const statistics = React5.useMemo(() => {
    if (data.length === 0) return { mean: 0, median: 0 };
    const mean2 = data.reduce((sum, val) => sum + val, 0) / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return { mean: mean2, median };
  }, [data]);
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data2 = payload[0].payload;
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-white dark:bg-gray-800 p-3 border rounded shadow-lg", children: [
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-semibold", children: data2.bin }),
        /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-sm", children: [
          "Count: ",
          data2.count
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-xs text-muted-foreground", children: [
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold mb-4", children: title }),
    /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: width || "100%", height, children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.BarChart, { data: histogramData, margin: { top: 20, right: 30, left: 20, bottom: 60 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.XAxis,
        {
          dataKey: "bin",
          label: { value: xlabel, position: "insideBottom", offset: -10 },
          angle: -45,
          textAnchor: "end",
          height: 80
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.YAxis, { label: { value: ylabel, angle: -90, position: "insideLeft" } }),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.Legend, {}),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.Bar, { dataKey: "count", fill: color, name: "Frequency" }),
      showMean && /* @__PURE__ */ jsxRuntime.jsx(
        recharts.ReferenceLine,
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
      showMedian && /* @__PURE__ */ jsxRuntime.jsx(
        recharts.ReferenceLine,
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
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
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
  const { violinShapes, scatterData, yDomain } = React5.useMemo(() => {
    const shapes = data.map((item, idx) => {
      const density = kernelDensity(item.values, void 0, 100);
      const maxDensity = Math.max(...density.map((d) => d.density));
      const quartiles = calculateQuartiles(item.values);
      return {
        category: item.category,
        categoryIndex: idx,
        density: density.map((d) => ({
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
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "bg-white dark:bg-gray-800 p-3 border rounded shadow-lg", children: [
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "font-semibold", children: data2.category }),
        /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "text-sm", children: [
          "Value: ",
          data2.value?.toFixed(2) || "N/A"
        ] })
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "w-full", children: [
    title && /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-lg font-semibold mb-4", children: title }),
    /* @__PURE__ */ jsxRuntime.jsx(recharts.ResponsiveContainer, { width: width || "100%", height, children: /* @__PURE__ */ jsxRuntime.jsxs(recharts.ComposedChart, { margin: { top: 20, right: 30, left: 20, bottom: 80 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(recharts.CartesianGrid, { strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.XAxis,
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
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.YAxis,
        {
          type: "number",
          dataKey: "value",
          domain: yDomain,
          label: { value: ylabel, angle: -90, position: "insideLeft" }
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(recharts.Tooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(CustomTooltip, {}) }),
      /* @__PURE__ */ jsxRuntime.jsx(
        recharts.Scatter,
        {
          data: scatterData,
          fill: "hsl(var(--primary))",
          fillOpacity: 0.3,
          children: scatterData.map((entry, index) => /* @__PURE__ */ jsxRuntime.jsx(
            recharts.Cell,
            {
              fill: `hsl(${Math.floor(entry.categoryIndex + 0.5) * 60 % 360}, 70%, 50%)`
            },
            `cell-${index}`
          ))
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-4 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxRuntime.jsxs("p", { children: [
      "Violin plot showing distribution density (wider = more data points) \u2022 Categories: ",
      data.length
    ] }) })
  ] });
}

exports.AbortionOpinionChart = AbortionOpinionChart;
exports.DemographicBarChart = stat_demographic_bar_v1_default;
exports.DemographicDotPlot = DemographicDotPlot;
exports.DemographicLineChart = DemographicLineChart;
exports.DualAxisChart = DualAxisChart_default;
exports.HealthScatterplot = HealthScatterplot_default;
exports.HistogramRecharts = HistogramRecharts;
exports.LineChart = LineChart_default;
exports.ScatterplotRegression = HappinessCorrelatesPanel;
exports.StateBarChart = StateBarChart;
exports.TimeSeries = TimeSeries_default;
exports.TimeSeriesChart = TimeSeriesChart2;
exports.TimeSeriesIndex = TimeSeriesIndex_default;
exports.TimeSeriesLine = TimeSeriesChart;
exports.TimeTrendDemoChart = TimeTrendDemoChart;
exports.ViolinPlot = ViolinPlot;
exports.prepareEssRows = prepareEssRows;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map