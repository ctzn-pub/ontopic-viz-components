// Infrastructure exports
export * from '../infrastructure/PlotContainer';
export * from '../infrastructure/PlotTheme';
export * from '../infrastructure/PlotExport';

// Geographic components (clean - no app dependencies)
export { default as StateMap } from './geo.state_map.v1';
export type { StateMapProps } from './geo.state_map.v1';

export { default as BubbleMap } from './geo.bubble.v1';
export type { BubbleMapProps } from './geo.bubble.v1';

// Statistical distribution components (clean)
export { default as BoxPlot } from './stat.boxplot.v1';
export type { BoxPlotProps } from './stat.boxplot.v1';

export { BoxPlotGrouped } from './stat.boxplot.grouped.v1';
export type { BoxPlotGroupedProps } from './stat.boxplot.grouped.v1';

export { BoxPlotFaceted } from './stat.boxplot.faceted.v1';
export type { BoxPlotFacetedProps } from './stat.boxplot.faceted.v1';

export { BoxPlotFacetedGrouped } from './stat.boxplot.faceted_grouped.v1';
export type { BoxPlotFacetedGroupedProps } from './stat.boxplot.faceted_grouped.v1';

export { DistributionPlot } from './stat.distribution.v1';
export type { DistributionPlotProps } from './stat.distribution.v1';

// Statistical analysis components (clean)
export { RegressionPlot } from './stat.regression.v1';
export type { RegressionPlotProps } from './stat.regression.v1';

export { QQPlot } from './stat.qq.v1';
export type { QQPlotProps } from './stat.qq.v1';

export { ResidualPlot } from './stat.residual.v1';
export type { ResidualPlotProps } from './stat.residual.v1';

export { SwarmPlot } from './stat.swarm.v1';
export type { SwarmPlotProps } from './stat.swarm.v1';

export { StripPlot } from './stat.strip.v1';
export type { StripPlotProps } from './stat.strip.v1';

export { ForestPlot } from './stat.forest.v1';
export type { ForestPlotProps } from './stat.forest.v1';

export { default as SplitBar } from './stat.splitbar.v1';
export type { SplitBarProps } from './stat.splitbar.v1';

// Basic charts (clean)
export { default as DotPlot } from './basic.dot.v1';
export type { DotPlotProps } from './basic.dot.v1';

export { default as BarChart } from './basic.bar.v1';
export type { BarChartProps } from './basic.bar.v1';

// Specialized visualizations (clean)
export { Sparkline } from './viz.sparkline.v1';
export type { SparklineProps } from './viz.sparkline.v1';

export { SlopeChart } from './viz.slope.v1';
export type { SlopeChartProps } from './viz.slope.v1';

export { BulletChart } from './viz.bullet.v1';
export type { BulletChartProps } from './viz.bullet.v1';

export { DivergingBar } from './viz.diverging_bar.v1';
export type { DivergingBarProps } from './viz.diverging_bar.v1';

export { FacetedPlot } from './viz.faceted.v1';
export type { FacetedPlotProps } from './viz.faceted.v1';

// Additional Plot components (no app dependencies)
export { default as CorrelationHeatmap } from './CorrelationHeatmap';
export { default as PcaPlot } from './PcaPlot';
export { default as OddsRatio } from './OddsRatio';
export { default as HistogramObservable } from './HistogramObservable';
export { default as DensityPlot } from './stat.density.v1';
export { default as HistogramPlot } from './stat.histogram.v1';
export { default as PointPlot } from './stat.point.v1';

// Map components (now use public CDN for topology data)
export { default as GeoDensityMap } from './GeoDensityMap';
export { default as ChoroplethMap } from './ChoroplethMap';
export { default as EuropeMap } from './EuropeMap';
export { default as ZipMap } from './ZipMap';

// TimeTrendDemo (now accepts colors as prop)
export { default as TimeTrendDemo } from './TimeTrendDemo';
