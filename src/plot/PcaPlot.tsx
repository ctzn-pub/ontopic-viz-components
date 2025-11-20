"use client";

import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

export default function PcaPlot() {
  const [Highcharts, setHighcharts] = useState<any>(null);

  useEffect(() => {
    import('highcharts').then((HighchartsModule) => {
      setHighcharts(HighchartsModule.default);
    });
  }, []);

  if (!Highcharts) {
    return <div className="flex items-center justify-center h-96">Loading chart...</div>;
  }
  const data = [
    { "Dim.1": 0.8641, "Dim.2": -0.2638, _row: "SMOKING_CrudePrev" },
    { "Dim.1": 0.956, "Dim.2": 0.1457, _row: "DIABETES_CrudePrev" },
    { "Dim.1": 0.4109, "Dim.2": 0.8128, _row: "HIGHCHOL_CrudePrev" },
    { "Dim.1": 0.8437, "Dim.2": -0.4007, _row: "MHLTH_CrudePrev" },
    { "Dim.1": 0.9226, "Dim.2": -0.1779, _row: "OBESITY_CrudePrev" },
    { "Dim.1": 0.8681, "Dim.2": -0.3872, _row: "SLEEP_CrudePrev" },
    { "Dim.1": 0.9141, "Dim.2": 0.2213, _row: "STROKE_CrudePrev" },
    { "Dim.1": 0.9499, "Dim.2": -0.2014, _row: "TEETHLOST_CrudePrev" },
    { "Dim.1": -0.7721, "Dim.2": -0.4624, _row: "BINGE_CrudePrev" },
    { "Dim.1": 0.8754, "Dim.2": 0.431, _row: "BPHIGH_CrudePrev" },
    { "Dim.1": 0.0401, "Dim.2": 0.9669, _row: "CANCER_CrudePrev" },
    { "Dim.1": 0.9238, "Dim.2": -0.2067, _row: "CASTHMA_CrudePrev" },
  ]

  const pcadata = [
    {
      x: 0.678,
      y: 0.278,
      lab: "log_pd",
      col_var: "Active",
      type_var: "arrow",
      key_var: "log_pd",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> log_pd<br /> <strong>Axis 1 :</strong> 0.678<br /> <strong>Axis 2 :</strong> 0.278<br /> <strong>Squared cosinus:</strong> 0.536<br /> <strong>Contribution:</strong> 11.354<br />",
    },
    {
      x: -0.731,
      y: 0.285,
      lab: "per_white",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_white",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_white<br /> <strong>Axis 1 :</strong> -0.731<br /> <strong>Axis 2 :</strong> 0.285<br /> <strong>Squared cosinus:</strong> 0.615<br /> <strong>Contribution:</strong> 12.95<br />",
    },
    {
      x: 0.217,
      y: -0.439,
      lab: "per_unemployed",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_unemployed",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_unemployed<br /> <strong>Axis 1 :</strong> 0.217<br /> <strong>Axis 2 :</strong> -0.439<br /> <strong>Squared cosinus:</strong> 0.24<br /> <strong>Contribution:</strong> 6.67<br />",
    },
    {
      x: 0.278,
      y: -0.655,
      lab: "per_poverty",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_poverty",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_poverty<br /> <strong>Axis 1 :</strong> 0.278<br /> <strong>Axis 2 :</strong> -0.655<br /> <strong>Squared cosinus:</strong> 0.505<br /> <strong>Contribution:</strong> 14.268<br />",
    },
    {
      x: -0.489,
      y: 0.39,
      lab: "per_married",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_married",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_married<br /> <strong>Axis 1 :</strong> -0.489<br /> <strong>Axis 2 :</strong> 0.39<br /> <strong>Squared cosinus:</strong> 0.391<br /> <strong>Contribution:</strong> 9.237<br />",
    },
    {
      x: 0.53,
      y: -0.055,
      lab: "per_hispanic",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_hispanic",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_hispanic<br /> <strong>Axis 1 :</strong> 0.53<br /> <strong>Axis 2 :</strong> -0.055<br /> <strong>Squared cosinus:</strong> 0.284<br /> <strong>Contribution:</strong> 5.628<br />",
    },
    {
      x: 0.444,
      y: -0.174,
      lab: "per_hh_withkids_under18",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_hh_withkids_under18",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_hh_withkids_under18<br /> <strong>Axis 1 :</strong> 0.444<br /> <strong>Axis 2 :</strong> -0.174<br /> <strong>Squared cosinus:</strong> 0.227<br /> <strong>Contribution:</strong> 4.793<br />",
    },
    {
      x: 0.72,
      y: 0.309,
      lab: "per_foreign_born",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_foreign_born",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_foreign_born<br /> <strong>Axis 1 :</strong> 0.72<br /> <strong>Axis 2 :</strong> 0.309<br /> <strong>Squared cosinus:</strong> 0.614<br /> <strong>Contribution:</strong> 13.059<br />",
    },
    {
      x: 0.158,
      y: 0.712,
      lab: "per_college_above",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_college_above",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_college_above<br /> <strong>Axis 1 :</strong> 0.158<br /> <strong>Axis 2 :</strong> 0.712<br /> <strong>Squared cosinus:</strong> 0.532<br /> <strong>Contribution:</strong> 15.564<br />",
    },
    {
      x: 0.466,
      y: -0.381,
      lab: "per_black",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_black",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_black<br /> <strong>Axis 1 :</strong> 0.466<br /> <strong>Axis 2 :</strong> -0.381<br /> <strong>Squared cosinus:</strong> 0.362<br /> <strong>Contribution:</strong> 8.606<br />",
    },
    {
      x: 0.565,
      y: 0.465,
      lab: "per_asian",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_asian",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_asian<br /> <strong>Axis 1 :</strong> 0.565<br /> <strong>Axis 2 :</strong> 0.465<br /> <strong>Squared cosinus:</strong> 0.535<br /> <strong>Contribution:</strong> 12.716<br />",
    },
    {
      x: -0.547,
      y: 0.168,
      lab: "per_65_over",
      col_var: "Active",
      type_var: "arrow",
      key_var: "per_65_over",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> per_65_over<br /> <strong>Axis 1 :</strong> -0.547<br /> <strong>Axis 2 :</strong> 0.168<br /> <strong>Squared cosinus:</strong> 0.328<br /> <strong>Contribution:</strong> 6.749<br />",
    },
    {
      x: 0.12,
      y: 0.819,
      lab: "median_income",
      col_var: "Active",
      type_var: "arrow",
      key_var: "median_income",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> median_income<br /> <strong>Axis 1 :</strong> 0.12<br /> <strong>Axis 2 :</strong> 0.819<br /> <strong>Squared cosinus:</strong> 0.685<br /> <strong>Contribution:</strong> 20.25<br />",
    },
    {
      x: -0.643,
      y: 0.258,
      lab: "median_age",
      col_var: "Active",
      type_var: "arrow",
      key_var: "median_age",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> median_age<br /> <strong>Axis 1 :</strong> -0.643<br /> <strong>Axis 2 :</strong> 0.258<br /> <strong>Squared cosinus:</strong> 0.479<br /> <strong>Contribution:</strong> 10.128<br />",
    },
    {
      x: 0.465,
      y: -0.17,
      lab: "hh_size",
      col_var: "Active",
      type_var: "arrow",
      key_var: "hh_size",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> hh_size<br /> <strong>Axis 1 :</strong> 0.465<br /> <strong>Axis 2 :</strong> -0.17<br /> <strong>Squared cosinus:</strong> 0.245<br /> <strong>Contribution:</strong> 5.127<br />",
    },
    {
      x: 0.781,
      y: -0.031,
      lab: "gini.simpson.race",
      col_var: "Active",
      type_var: "arrow",
      key_var: "gini.simpson.race",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> gini.simpson.race<br /> <strong>Axis 1 :</strong> 0.781<br /> <strong>Axis 2 :</strong> -0.031<br /> <strong>Squared cosinus:</strong> 0.611<br /> <strong>Contribution:</strong> 12.057<br />",
    },
    {
      x: 0.251,
      y: -0.062,
      lab: "gini",
      col_var: "Active",
      type_var: "arrow",
      key_var: "gini",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> gini<br /> <strong>Axis 1 :</strong> 0.251<br /> <strong>Axis 2 :</strong> -0.062<br /> <strong>Squared cosinus:</strong> 0.067<br /> <strong>Contribution:</strong> 1.359<br />",
    },
    {
      x: 0.338,
      y: 0.731,
      lab: "B25077_001",
      col_var: "Active",
      type_var: "arrow",
      key_var: "B25077_001",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> B25077_001<br /> <strong>Axis 1 :</strong> 0.338<br /> <strong>Axis 2 :</strong> 0.731<br /> <strong>Squared cosinus:</strong> 0.649<br /> <strong>Contribution:</strong> 18.151<br />",
    },
    {
      x: 0.652,
      y: 0.314,
      lab: "avg_commute_time",
      col_var: "Active",
      type_var: "arrow",
      key_var: "avg_commute_time",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> avg_commute_time<br /> <strong>Axis 1 :</strong> 0.652<br /> <strong>Axis 2 :</strong> 0.314<br /> <strong>Squared cosinus:</strong> 0.525<br /> <strong>Contribution:</strong> 11.332<br />",
    },
    {
      x: -0.203,
      y: -0.73,
      lab: "OBESITY_zip",
      col_var: "Supplementary",
      type_var: "arrow",
      key_var: "OBESITY_zip",
      tooltip_text:
        "<strong>Level:</strong> <br /> <strong>Variable:</strong> OBESITY_zip<br /> <strong>Axis 1 :</strong> -0.203<br /> <strong>Axis 2 :</strong> -0.73<br /> <strong>Squared cosinus:</strong> 0.574<br /> ",
    },
  ]

  const seriesData = pcadata.map((o) => {
    return {
      name: o.lab,
      color: o.lab == "OBESITY_zip" ? "#FF0000" : "#b3b3b3",
      marker: { symbol: "triangle-down" },
      lineWidth: 1,
      data: [
        [0, 0],
        [o["x"], o["y"]],
      ],
    }
  })

  const pp = seriesData.push({
    data: [[0, 0]],
    marker: {
      radius: 260,
      lineColor: "#e4e4e4",
      fillColor: "transparent",
      lineWidth: 1,
      symbol: "circle",
    },
  })

  const chartOptions = {
    chart: {
      backgroundColor: "white",
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
    title: {
      text: "",
    },
    legend: { enabled: false },
    yAxis: {
      gridLineWidth: 0,
      min: -1,
      max: 1,
      title: {
        align: "high",
        text: "Axis 2 (17.69%)",
        style: { color: "#374151" },
      },
      labels: {
        style: { color: "#374151" },
      },
      plotLines: [
        {
          color: "#d1d5db",
          width: 1,
          value: 0,
          dashStyle: "dash",
        },
      ],
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          padding: 5,
          style: {
            color: "#374151",
            fontSize: "12px",
            fontWeight: "500",
          },
          formatter: function () {
            return this.y === 0 ? null : this.series.name
          },
        },
      },
    },
    xAxis: {
      lineWidth: 1,
      min: -1,
      max: 1,
      title: {
        align: "high",
        text: "Axis 1 (26.68%)",
        style: { color: "#374151" },
      },
      labels: {
        style: { color: "#374151" },
      },
      plotLines: [
        {
          color: "#d1d5db",
          width: 1,
          value: 0,
          dashStyle: "dash",
        },
      ],
    },
    series: seriesData,
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <HighchartsReact
          highcharts={Highcharts}
          containerProps={{
            style: { width: "100%", height: "700px" },
          }}
          options={chartOptions}
        />
      </div>
    </div>
  )
}
