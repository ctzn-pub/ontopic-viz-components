import React, { useEffect, useState, useRef } from 'react';
import * as Plot from "@observablehq/plot"
import { useTheme } from "next-themes"

interface TimetrendProps {
  defaults: {
    color: string;
    plotBands?: string;
    errorbar?: string;
    x: string;
    y: string;
  };
  data: any;
  error: any;
  colors: Record<string, Record<string, string>>;
  label: any;
}

export default function TimetrendDemo({ defaults, error, data, colors, label }: TimetrendProps) {

  console.log('ttd data', data)
  console.log('ttd defaults', defaults)

  if (!defaults || !data) {
    return <div>Loading...</div>;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const initialVisibleSeries = data.dataPointMetadata?.find((item: any) => item.id === defaults.color)?.categories || [];
  const [visibleSeries, setVisibleSeries] = useState(new Set(initialVisibleSeries));

  const getColor = (category: any) => {
    const categoryColors: { [key: string]: string } = colors[defaults.color] || {};
    return categoryColors[category] || "#cccccc";
  };

  const toggleSeries = (series: any) => {
    setVisibleSeries(prevVisibleSeries => {
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
  const USEPREZ = typeof defaults.plotBands !== 'undefined' && defaults.plotBands === "PrezEra";
  const colorPal = colors[defaults.color] || {};

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!data || !defaults || containerWidth === 0) return;

    const xFormedData = data.dataPoints.map((d: { [key: string]: any }) => ({
      ...d,
      year: +d['year']
    }));

    const average =
      xFormedData.reduce(
        (total: number, d: { [key: string]: any }) => total + d[defaults.y],
        0
      ) / xFormedData.length

    const yaxisMin = Math.max(
      0,
      Math.min(
        ...xFormedData.map((d: { [key: string]: any }) => d[defaults.y])
      ) -
      0.2 * average
    )

    const yaxisMax =
      Math.max(
        ...xFormedData.map((d: { [key: string]: any }) => d[defaults.y])
      ) +
      0.2 * average

    const yaxisMinEb = Math.floor(
      Math.min(
        ...data.dataPoints
          .filter((d: { ci_lower?: number }) => d.ci_lower !== undefined)
          .map((d: { ci_lower: number }) => d.ci_lower)
      )
    );

    const yaxisMaxEb = Math.round(
      Math.max(
        ...data.dataPoints
          .filter((d: { ci_upper?: number }) => d.ci_upper !== undefined)
          .map((d: { ci_upper: number }) => d.ci_upper)
      )
    );

    const lastValue = data.dataPointMetadata
      .find((d: { id: any }) => d.id == defaults.x)
      .categories.slice(-1)[0]


    const lastYearData = xFormedData
      .filter((d: { [x: string]: any }) => d[defaults.x] === lastValue)
      .sort(
        (a: { [x: string]: number }, b: { [x: string]: number }) =>
          a[defaults.y] - b[defaults.y]
      )

    const lastYearDataDiff = lastYearData.map(
      (d: { [x: string]: number }, i: number, arr: string | any[]) => {
        const valueDiff =
          i > 0 ? d[defaults.y] - arr[i - 1][defaults.y] : undefined
        const valueDiffRev =
          i < arr.length - 1
            ? d[defaults.y] - arr[i + 1][defaults.y]
            : undefined
        return {
          ...d,
          valueDiff,
          valueDiffRev,
          diffSmall:
            valueDiff !== undefined
              ? valueDiff / (yaxisMax - yaxisMin)
              : undefined,
          diffSmallRev:
            valueDiffRev !== undefined
              ? -valueDiffRev / (yaxisMax - yaxisMin)
              : undefined,
        }
      }
    )

    const PresEras = [
      { startYear: 1972, endYear: 1977, politicalParty: "Republican", president: "Nixon/Ford" },
      { startYear: 1977, endYear: 1981, politicalParty: "Democratic", president: "Carter" },
      { startYear: 1981, endYear: 1993, politicalParty: "Republican", president: "Reagan/Bush" },
      { startYear: 1993, endYear: 2001, politicalParty: "Democratic", president: "Clinton" },
      { startYear: 2001, endYear: 2009, politicalParty: "Republican", president: "Bush2" },
      { startYear: 2009, endYear: 2017, politicalParty: "Democratic", president: "Obama" },
      { startYear: 2017, endYear: 2021, politicalParty: "Republican", president: "Trump" },
      { startYear: 2021, endYear: 2023, politicalParty: "Democratic", president: "Biden" },
    ];

    const dataDates = data.dataPoints.map((d: any) => d[defaults.x])

    const dataStartDate = Math.min(...dataDates)
    const dataEndDate = Math.max(...dataDates)

    const filteredByDate = PresEras.filter(period => {
      return period.endYear >= dataStartDate && period.startYear <= dataEndDate;
    }).map(period => {
      return {
        ...period,
        startYear: Math.max(period.startYear, dataStartDate),
        endYear: Math.min(period.endYear, dataEndDate)
      };
    });

    const filteredDem = filteredByDate.filter((d: { politicalParty: string; }) => d.politicalParty === "Democratic");
    const filteredRep = filteredByDate.filter((d: { politicalParty: string; }) => d.politicalParty === "Republican");

    const colormaps = data.dataPointMetadata.find(
      (item: { id: any }) => item.id === defaults.color
    ).categories.map((category: string | number) => colorPal[category as keyof typeof colorPal] || "#cccccc")

    const filteredData = xFormedData.filter((d: { [x: string]: any; }) => visibleSeries.has(d[defaults.color]));

    const plotHeight = Math.min(400, containerWidth * 0.6);

    const plot = Plot.plot({
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
          (item: { id: any }) => item.id === defaults.x
        ).name,
        tickFormat: d => `${Math.floor(d)}`,
        labelOffset: 35,
      },
      y: {
        grid: true,
        domain: error === "none" ? [yaxisMin, yaxisMax] : [yaxisMinEb, yaxisMaxEb],
        label: data.dataPointMetadata.find(
          (item: { id: any }) => item.id === defaults.y
        ).name,
      },
      color: {
        type: 'ordinal',
        domain: Array.from(visibleSeries),
        range: Array.from(visibleSeries).map(series => getColor(series)),
      },
      marks: [
        USEPREZ ? Plot.rect(filteredDem, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#2987f1"
        }) : null,
        USEPREZ ? Plot.rect(filteredRep, {
          x1: "startYear",
          x2: "endYear",
          y1: yaxisMinEb,
          y2: yaxisMaxEb,
          fillOpacity: 0.1,
          fill: "#fa5352"
        }) : null,
        Plot.axisX({
          tickSize: 5,
          tickPadding: 5,
          tickFormat: d => `${Math.floor(d)}`,
        }),
        Plot.axisY({
          label: "",
          tickFormat:
            data.dataPointMetadata.find(
              (item: { id: any }) => item.id === defaults.y
            ).units == "Percent"
              ? (d) =>
                `${d}${data.dataPointMetadata.find(
                  (item: { id: any }) => item.id === defaults.y
                ).value_suffix
                }`
              : "",
          tickSize: 0,
        }),
        Plot.lineY(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color ? defaults.color : undefined,
          strokeWidth: 2,
          title: (d) => `${data.dataPointMetadata.find(
            (item: { id: any }) => item.id === defaults.x
          ).name
            }: ${d[defaults.x]} \n${data.dataPointMetadata.find(
              (item: { id: any }) => item.id === defaults.y
            ).name
            }:
${d[defaults.y].toFixed(2)}${data.dataPointMetadata.find(
              (item: { id: any }) => item.id === defaults.y
            ).units == "Percent"
              ? data.dataPointMetadata.find(
                (item: { id: any }) => item.id === defaults.y
              ).value_suffix
              : ""
            }`,
        }),
        error === "yes"
          ? Plot.ruleX(filteredData, {
            x: defaults.x,
            y1: "ci_lower",
            y2: "ci_upper",
            stroke: defaults.color ? defaults.color : undefined,
          })
          : null,
        Plot.dot(filteredData, {
          x: defaults.x,
          y: defaults.y,
          stroke: defaults.color ? defaults.color : undefined,
          r: 4,
        }),
        Plot.ruleY([yaxisMinEb]),
        ...filteredDem.map(president => Plot.text(
          [{
            x: president.startYear,
            y: yaxisMinEb,
            text: president.president
          }], {
          rotate: 270,
          x: "x",
          y: "y",
          text: "text",
          dy: -2,
          textAnchor: "start"
        }
        )),
        ...filteredRep.map(president => Plot.text(
          [{
            x: president.startYear,
            y: yaxisMinEb,
            text: president.president
          }], {
          rotate: 270,
          x: "x",
          y: "y",
          text: "text",
          dy: -2,
          textAnchor: "start"
        }
        )),
        Plot.tip(
          filteredData,
          Plot.pointer({
            x: defaults.x,
            y: defaults.y,
            title: (d) => `${d[defaults.color]} ${d[defaults.x]}: ${d[defaults.y].toFixed(0)}${data.dataPointMetadata.find(
              (item: { id: any }) => item.id === defaults.y
            ).units == "Percent"
              ? data.dataPointMetadata.find(
                (item: { id: any }) => item.id === defaults.y
              ).value_suffix
              : ""}`,
            fill: theme === "dark" ? "#000000" : "#FFFFFF",
          })
        ),
      ],
    })

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(plot);
    }
  }, [data, defaults, error, containerWidth, visibleSeries, theme, colorPal])


  const colorsinfo = data.dataPointMetadata.find((item: any) => item.id === defaults.color).categories

  return (
    <div className="w-full">
      <div className="text-xl font-semibold mb-1">
        {data.metadata.title}
      </div>
      <div className="text-md text-gray-600 dark:text-gray-300 mb-2">
        {data.metadata.subtitle}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <span className="text-xs">{label}</span>
        {colorsinfo.map((series: any) => (
          <div key={series}
            className="legend-item text-xs cursor-pointer flex items-center"
            onClick={() => toggleSeries(series)}>
            <div
              className="legend-icon mr-1 relative"
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: visibleSeries.has(series) ? getColor(series) : '#ccc',
                display: 'inline-block',
              }}
            >
              {!visibleSeries.has(series) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(to bottom right, transparent, black 50%, transparent)`,
                  }}
                />
              )}
            </div>
            <span style={{ color: visibleSeries.has(series) ? 'inherit' : '#ccc' }}>{series}</span>
          </div>
        ))}
      </div>
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
}