import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ErrorBar, BarChart, Legend, Bar, ComposedChart, ZAxis, Area, ReferenceLine, Scatter } from 'recharts';
import { jsx, jsxs } from 'react/jsx-runtime';
import React, { useState } from 'react';

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
  const groupedData = React.useMemo(() => {
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
      BarChart,
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
      BarChart,
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
          data: line,
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

export { AbortionOpinionChart, stat_demographic_bar_v1_default as DemographicBarChart, HappinessCorrelatesPanel as ScatterplotRegression, TimeSeriesChart2 as TimeSeriesChart, TimeSeriesChart as TimeSeriesLine };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map