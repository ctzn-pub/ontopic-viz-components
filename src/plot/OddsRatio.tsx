'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

interface OddsRatioData {
  odds_ratios: Record<string, number>;
  conf_int_lower: Record<string, number>;
  conf_int_upper: Record<string, number>;
}

interface PlotDataPoint {
  Label: string;
  OddsRatio: number;
  LowerCI: number;
  UpperCI: number;
}

interface OddsRatioProps {
  data: OddsRatioData;
}

const OddsRatio: React.FC<OddsRatioProps> = ({ data }) => {
  const observablePlotRef = useRef<HTMLDivElement>(null);
  const forestPlotRef = useRef<HTMLDivElement>(null);
  const dotPlotRef = useRef<HTMLDivElement>(null);

  // Transform data for visualizations
  const plotData: PlotDataPoint[] = useMemo(() => Object.keys(data.odds_ratios).map(key => ({
    Label: key.replace(/C\((.*?)\)\[T\.(.*?)\]/, '$1 $2')
             .replace(/C\((.*?), Treatment\(.*?\)\)\[T\.(.*?)\]/, '$1 $2')
             .replace(/:/g, ' × '), // Replace interaction symbols
    OddsRatio: data.odds_ratios[key],
    LowerCI: data.conf_int_lower[key],
    UpperCI: data.conf_int_upper[key]
  })), [data]);

  useEffect(() => {
    if (!data) return;

    // Clear existing plots
    if (observablePlotRef.current) observablePlotRef.current.innerHTML = '';
    if (forestPlotRef.current) forestPlotRef.current.innerHTML = '';
    if (dotPlotRef.current) dotPlotRef.current.innerHTML = '';

    // Observable Plot version
    const observablePlot = Plot.plot({
      marginLeft: 200,
      title: 'Statistical Odds Ratios',
      subtitle: 'Analysis of various factors affecting outcomes',
      caption: 'Source: General Social Survey',
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        grid: true,
        type: "log",
        label: 'Odds Ratio',
        tickFormat: ",",
      },
      y: {
        grid: true,
        label: '',
        domain: plotData.map(d => d.Label),
      },
      marks: [
        Plot.dot(plotData, {
          x: 'OddsRatio',
          y: 'Label',
          tip: {
            format: { fill: false, x: (d) => d.toFixed(2) },
          },
          fill: d => d.OddsRatio > 1 ? 'green' : 'red',
        }),
        Plot.ruleY(plotData, {
          x1: 'LowerCI',
          x2: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? 'green' : 'red'
        }),
        Plot.ruleX([1], {
          stroke: "black",
          strokeWidth: 0.5,
        })
      ],
      width: 800,
      height: 500,
    });

    // Forest Plot version (advanced statistical)
    const forestPlot = Plot.plot({
      marginLeft: 220,
      title: 'Forest Plot Analysis',
      subtitle: 'Advanced statistical visualization with enhanced features',
      caption: 'Source: General Social Survey',
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        grid: true,
        type: "log",
        label: 'Odds Ratio (log scale)',
        tickFormat: ".2f",
        domain: [0.3, 3]
      },
      y: {
        grid: true,
        label: '',
        domain: plotData.map(d => d.Label).reverse(), // Reverse for traditional forest plot order
      },
      marks: [
        // Confidence interval rectangles (for visual emphasis)
        Plot.rect(plotData, {
          x1: "LowerCI",
          x2: "UpperCI",
          y: "Label",
          fill: d => d.OddsRatio > 1 ? '#dcfce7' : '#fef2f2',
          fillOpacity: 0.3,
          ry: 3
        }),
        // Confidence interval lines
        Plot.ruleY(plotData, {
          x1: 'LowerCI',
          x2: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 3
        }),
        // End caps for confidence intervals
        Plot.ruleY(plotData, {
          x: 'LowerCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot.ruleY(plotData, {
          x: 'LowerCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        Plot.ruleY(plotData, {
          x: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: -8
        }),
        Plot.ruleY(plotData, {
          x: 'UpperCI',
          y: 'Label',
          stroke: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
          strokeWidth: 2,
          dx: 0,
          dy: 8
        }),
        // Central point estimates (squares for forest plots)
        Plot.dot(plotData, {
          x: 'OddsRatio',
          y: 'Label',
          fill: d => d.OddsRatio > 1 ? '#16a34a' : '#dc2626',
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
        Plot.ruleX([1], {
          stroke: "#374151",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        })
      ],
      width: 800,
      height: 500,
    });

    // Dot plot version with size encoding
    const dotPlot = Plot.plot({
      marginLeft: 200,
      title: 'Sized Dot Plot',
      subtitle: 'Dot size reflects statistical significance',
      caption: 'Source: General Social Survey',
      style: {
        backgroundColor: "white",
        fontFamily: "sans-serif",
      },
      x: {
        grid: true,
        type: "log",
        label: 'Odds Ratio',
        tickFormat: ".2f",
      },
      y: {
        grid: true,
        label: '',
        domain: plotData.map(d => d.Label),
      },
      marks: [
        // Confidence interval lines
        Plot.ruleY(plotData, {
          x1: 'LowerCI',
          x2: 'UpperCI',
          y: 'Label',
          stroke: "#9ca3af",
          strokeWidth: 2
        }),
        // Main dots with size based on confidence interval width (inverse - smaller CI = larger dot)
        Plot.dot(plotData, {
          x: 'OddsRatio',
          y: 'Label',
          r: d => Math.max(3, 15 - (d.UpperCI - d.LowerCI) * 5), // Smaller CI = larger dot
          fill: d => d.OddsRatio > 1 ? '#3b82f6' : '#ef4444',
          stroke: "white",
          strokeWidth: 1.5,
          fillOpacity: 0.8,
          tip: {
            format: {
              fill: false,
              x: (d) => `${d.toFixed(3)} [${plotData.find(p => p.OddsRatio === d)?.LowerCI.toFixed(3)}, ${plotData.find(p => p.OddsRatio === d)?.UpperCI.toFixed(3)}]`
            }
          }
        }),
        Plot.ruleX([1], {
          stroke: "black",
          strokeWidth: 1,
        })
      ],
      width: 800,
      height: 500,
    });

    // Append plots to containers
    if (observablePlotRef.current) observablePlotRef.current.appendChild(observablePlot);
    if (forestPlotRef.current) forestPlotRef.current.appendChild(forestPlot);
    if (dotPlotRef.current) dotPlotRef.current.appendChild(dotPlot);

    // Cleanup
    return () => {
      observablePlot?.remove();
      forestPlot?.remove();
      dotPlot?.remove();
    };
  }, [data, plotData]);


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Statistical odds ratio analysis demonstrating multiple visualization approaches.
          Each method emphasizes different aspects of the statistical relationships and confidence intervals.
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Basic Odds Ratio Plot</h3>
          <p className="text-sm text-gray-600">
            Standard odds ratio visualization with confidence intervals
          </p>
        </div>
        <div>
          <div ref={observablePlotRef} className="flex justify-center" />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Features:</strong> Logarithmic scale, conditional coloring (red &lt; 1, green &gt; 1),
            interactive tooltips, confidence interval lines, null effect reference line</p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Forest Plot Analysis</h3>
          <p className="text-sm text-gray-600">
            Advanced forest plot with enhanced statistical visualization features
          </p>
        </div>
        <div>
          <div ref={forestPlotRef} className="flex justify-center" />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Features:</strong> Square markers for point estimates, confidence interval rectangles,
            end caps on intervals, enhanced color coding, traditional forest plot layout</p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Precision-Weighted Dot Plot</h3>
          <p className="text-sm text-gray-600">
            Dot plot where marker size reflects statistical precision (inverse of confidence interval width)
          </p>
        </div>
        <div>
          <div ref={dotPlotRef} className="flex justify-center" />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Features:</strong> Size-encoded precision, larger dots indicate more precise estimates,
            confidence interval lines, statistical significance visual weighting</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Statistical Visualization Techniques</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Basic Odds Ratio</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Clear point estimates</li>
              <li>Confidence interval display</li>
              <li>Effect direction coding</li>
              <li>Reference line indication</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Forest Plot</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Meta-analysis standard</li>
              <li>Enhanced visual emphasis</li>
              <li>Professional presentation</li>
              <li>Multiple study comparison</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Precision Weighting</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Visual uncertainty encoding</li>
              <li>Statistical weight display</li>
              <li>Precision-based emphasis</li>
              <li>Quality assessment aid</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OddsRatio;