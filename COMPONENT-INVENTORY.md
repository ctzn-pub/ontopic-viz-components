# Component Inventory & Migration Plan

## Summary
- **Total Components**: 70
- **Recharts**: 18 components
- **Observable Plot**: 33 components
- **Composite**: 11 components
- **UI**: 8 components

---

## Registry Structure (Simplified)

```
registry/
├── components/
│   ├── recharts/          # Recharts-based components (18 total)
│   │   ├── generic/       # 13 reusable components
│   │   ├── gss/           # 1 GSS-specific
│   │   ├── brfss/         # 2 BRFSS-specific
│   │   └── ess/           # 1 ESS-specific
│   │
│   ├── plot/              # Observable Plot components (33 total)
│   │   ├── generic/       # 27 reusable components
│   │   ├── geo/           # 6 geographic visualizations
│   │   └── gss/           # 1 GSS-specific
│   │
│   └── composite/         # Multi-component dashboards (11 total)
│       ├── generic/       # 9 reusable
│       └── brfss/         # 2 BRFSS-specific
│
├── ui/                    # shadcn/ui primitives (8 components)
├── utils/                 # Shared utilities (2 files)
└── types/                 # TypeScript types (1 file)
```

**Migration Status:** 14/73 files complete (19%)

---

## Recharts Components (18 total)

### Featured: Time Series with Presidential Context
**timeseries-line-v1.tsx** [✅ MIGRATED]
- **What**: Multi-group time trends with presidential term backgrounds
- **Features**: Toggle 95% CI, interactive legend, presidential era shading
- **Best for**: Political polling data, GSS trends over time
- **Dependencies**: `recharts`, UI: `Label`, `Switch`
- **Example**: Abortion attitudes by political party across administrations

### All Recharts Components

#### Time Series (6 components)

2. **timeseries.line.v1.tsx** → `recharts/generic/timeseries-basic-v1.tsx`
   - Basic time series line chart with error bars
   - Dependencies: `recharts`
   - Status: ✅ MIGRATED (Batch 1)

3. **DualAxisChart.tsx** → `recharts/generic/timeseries-dual-axis-v1.tsx`
   - Dual y-axis chart with recession indicators and time range selection
   - Dependencies: `recharts`, `next-themes`, UI: `Button`
   - Status: ✅ MIGRATED (Batch 1)

4. **TimeSeriesIndex.tsx** → `recharts/generic/timeseries-index-v1.tsx`
   - Indexed time series comparison (normalized to base period) with recession bands
   - Dependencies: `recharts`, `next-themes`, UI: `Button`
   - Status: ✅ MIGRATED (Batch 1)

5. **TimeSeries.tsx** → `recharts/generic/timeseries-economic-v1.tsx`
   - Economic time series with recession shading and brush selector
   - Dependencies: `recharts`, `next-themes`, UI: `Button`
   - Status: ✅ MIGRATED (Batch 1)

6. **TimeSeriesChart.tsx** → `recharts/generic/timeseries-metadata-v1.tsx`
   - Time series line chart with error bars and metadata display
   - Dependencies: `recharts`
   - Status: 🔄 PENDING (Batch 2)

#### Demographic Visualizations (4)
7. **DemographicLineChart.tsx** → `recharts/generic/demographic-line-v1.tsx`
   - Tabbed line charts with error bars for demographic breakdowns (Age, Education, Income, Race, Gender)
   - Dependencies: `recharts`, `lucide-react`, UI: `Tabs`
   - Status: 🔄 PENDING (Batch 2)

8. **DemographicBarChart.tsx** → `recharts/generic/demographic-bar-v1.tsx`
   - Tabbed bar charts with error bars for demographic data
   - Dependencies: `recharts`, `lucide-react`, UI: `Tabs`
   - Status: 🔄 PENDING (Batch 2)

9. **DemographicDotPlot.tsx** → `recharts/generic/demographic-dot-v1.tsx`
   - Tabbed scatter plots with error bars for demographic comparisons
   - Dependencies: `recharts`, `lucide-react`, UI: `Tabs`
   - Status: 🔄 PENDING (Batch 2)

10. **stat.demographic_bar.v1.tsx** → `recharts/generic/stat-demographic-bar-v1.tsx`
    - Generic demographic bar chart component with configurable error bars
    - Dependencies: `recharts`
    - Status: 🔄 PENDING (Batch 2)

#### State/Geographic Visualizations (2)
11. **StateBarChart.tsx** → `recharts/brfss/state-bar-v1.tsx`
    - Interactive state-level bar chart with sorting and filtering
    - Dependencies: `recharts`, UI: `Button`, `Input`
    - Status: 🔄 PENDING (Batch 3)

12. **bar.state.v1.tsx** → `recharts/brfss/state-bar-sortable-v1.tsx`
    - Sortable state bar chart with search and expand features
    - Dependencies: `recharts`, UI: `Button`, `Input`
    - Status: 🔄 PENDING (Batch 3)

#### Statistical Visualizations (3)
13. **HistogramRecharts.tsx** → `recharts/generic/histogram-v1.tsx`
    - Distribution histogram with mean/median reference lines
    - Dependencies: `recharts`, Utils: `statistical-utils`
    - Status: 🔄 PENDING (Batch 3)

14. **ViolinPlot.tsx** → `recharts/generic/violin-v1.tsx`
    - Kernel density estimation violin plots for distribution comparison
    - Dependencies: `recharts`, Utils: `statistical-utils`
    - Status: 🔄 PENDING (Batch 3)

15. **ScatterplotRegression.tsx** → `recharts/ess/scatter-regression-v1.tsx`
    - European Social Survey happiness correlates with OLS regression and confidence bands
    - Dependencies: `recharts`
    - Status: 🔄 PENDING (Batch 2)

### Dataset-Specific (4 components)

#### GSS (1)
16. **AbortionOpinionChart.tsx** → `recharts/gss/abortion-opinion-v1.tsx`
    - GSS abortion opinion data with demographic filters (Race, Education, Region)
    - Dependencies: `recharts`
    - Status: 🔄 PENDING (Batch 3)

#### Other (2 - Actually use Plot, not Recharts)
17. **HealthScatterplot.tsx** → `recharts/generic/health-scatter-v1.tsx`
    - County health indicators scatterplot (obesity vs diabetes) with regression
    - Dependencies: `@observablehq/plot` ⚠️ **Note: Uses Plot, not Recharts**
    - Status: 🔄 PENDING (Batch 4)

18. **LineChart.tsx** → `plot/gss/marijuana-trend-v1.tsx`
    - GSS marijuana legalization trends by church attendance
    - Dependencies: `@observablehq/plot` ⚠️ **Note: Uses Plot, not Recharts**
    - Status: 🔄 PENDING (Batch 4)

---

## Observable Plot Components (33 total)

### Geographic Visualizations (7 components)

19. **geo.state_map.v1.tsx** → `plot/geo/state-map-v1.tsx`
    - US state choropleth map with TopoJSON
    - Dependencies: `@observablehq/plot`, `topojson-client`
    - Status: 🔄 PENDING (Batch 4)

20. **ChoroplethMap.tsx** → `plot/geo/choropleth-v1.tsx`
    - Generic choropleth map component
    - Dependencies: `@observablehq/plot`, `topojson-client`
    - Status: 🔄 PENDING (Batch 4)

21. **GeoDensityMap.tsx** → `plot/geo/density-map-v1.tsx`
    - Density map with geographic boundaries
    - Dependencies: `@observablehq/plot`, `topojson-client`
    - Status: 🔄 PENDING (Batch 4)

22. **geo.bubble.v1.tsx** → `plot/geo/bubble-map-v1.tsx`
    - Geographic bubble map with size-encoded values
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 5)

23. **ZipMap.tsx** → `plot/geo/zip-map-v1.tsx`
    - ZIP code level map visualization
    - Dependencies: `@observablehq/plot`, `topojson-client`
    - Status: 🔄 PENDING (Batch 5)

24. **EuropeMap.tsx** → `plot/geo/europe-map-v1.tsx`
    - European country map with TopoJSON
    - Dependencies: `@observablehq/plot`, `topojson-client`
    - Status: 🔄 PENDING (Batch 5)

25. **PcaPlot.tsx** → `plot/generic/pca-biplot-v1.tsx`
    - PCA biplot visualization (dynamically loaded)
    - Dependencies: `next/dynamic`
    - Status: 🔄 PENDING (Batch 5)

### Distribution Visualizations (9 components)

26. **stat.histogram.v1.tsx** → `plot/generic/histogram-v1.tsx`
    - Distribution histogram with mean/median lines
    - Dependencies: `@observablehq/plot`, `d3-array`
    - Status: 🔄 PENDING (Batch 6)

27. **HistogramObservable.tsx** → `plot/generic/histogram-observable-v1.tsx`
    - Observable Plot histogram implementation
    - Dependencies: `@observablehq/plot`, `d3-array`
    - Status: 🔄 PENDING (Batch 6)

28. **stat.density.v1.tsx** → `plot/generic/density-v1.tsx`
    - Kernel density estimation plot
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 6)

29. **stat.distribution.v1.tsx** → `plot/generic/distribution-v1.tsx`
    - Multiple distribution visualizations
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 6)

30. **stat.boxplot.v1.tsx** → `plot/generic/boxplot-v1.tsx`
    - Box-and-whisker plot for distributions
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 6)

31. **stat.boxplot.grouped.v1.tsx** → `plot/generic/boxplot-grouped-v1.tsx`
    - Grouped box plots for comparisons
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 7)

32. **stat.boxplot.faceted.v1.tsx** → `plot/generic/boxplot-faceted-v1.tsx`
    - Faceted box plots by category
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 7)

33. **stat.boxplot.faceted_grouped.v1.tsx** → `plot/generic/boxplot-faceted-grouped-v1.tsx`
    - Combined faceting and grouping
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 7)

34. **stat.strip.v1.tsx** → `plot/generic/strip-v1.tsx`
    - Strip plot (1D scatter) for categorical data
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 7)

35. **stat.swarm.v1.tsx** → `plot/generic/swarm-v1.tsx`
    - Beeswarm plot avoiding point overlap
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 7)

### Statistical Analysis (7 components)

36. **stat.regression.v1.tsx** → `plot/generic/regression-v1.tsx`
    - Scatterplot with OLS regression line
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 8)

37. **stat.qq.v1.tsx** → `plot/generic/qq-plot-v1.tsx`
    - Q-Q plot for distribution comparison
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 8)

38. **stat.residual.v1.tsx** → `plot/generic/residual-v1.tsx`
    - Residual plot for regression diagnostics
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 8)

39. **stat.point.v1.tsx** → `plot/generic/point-estimate-v1.tsx`
    - Point estimate plots with error bars
    - Dependencies: `@observablehq/plot`, `d3-array`
    - Status: 🔄 PENDING (Batch 8)

40. **stat.forest.v1.tsx** → `plot/generic/forest-v1.tsx`
    - Forest plot for effect sizes/odds ratios
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 8)

41. **stat.splitbar.v1.tsx** → `plot/generic/splitbar-v1.tsx`
    - Split bar chart with contrasting subgroup dots
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 9)

42. **OddsRatio.tsx** → `plot/generic/odds-ratio-v1.tsx`
    - Odds ratio forest plot visualization
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 9)

43. **CorrelationHeatmap.tsx** → `plot/generic/correlation-heatmap-v1.tsx`
    - Lower-triangle correlation matrix heatmap
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 9)

### Basic Charts (2 components)

44. **basic.dot.v1.tsx** → `plot/generic/dot-v1.tsx`
    - Dot plot for categorical comparisons
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 9)

45. **basic.bar.v1.tsx** → `plot/generic/bar-v1.tsx`
    - Simple bar chart
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 9)

### Specialized Visualizations (8 components)

46. **viz.sparkline.v1.tsx** → `plot/generic/sparkline-v1.tsx`
    - Compact inline trend visualization
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 10)

47. **viz.bullet.v1.tsx** → `plot/generic/bullet-v1.tsx`
    - Bullet chart for performance metrics
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 10)

48. **viz.slope.v1.tsx** → `plot/generic/slope-v1.tsx`
    - Slope chart for before/after comparisons
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 10)

49. **viz.diverging_bar.v1.tsx** → `plot/generic/diverging-bar-v1.tsx`
    - Diverging bar chart centered at zero
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 10)

50. **viz.faceted.v1.tsx** → `plot/generic/faceted-v1.tsx`
    - Generic faceted visualization wrapper
    - Dependencies: `@observablehq/plot`
    - Status: 🔄 PENDING (Batch 10)

51. **TimeTrendDemo.tsx** → `plot/generic/time-trend-demo-v1.tsx`
    - Time trend visualization with theme support
    - Dependencies: `@observablehq/plot`, `next-themes`
    - Status: 🔄 PENDING (Batch 11)

---

## Composite/Dashboard Components (11 total)

### Dashboard Components (3)

52. **BrfssDashboard.tsx** → `composite/brfss/dashboard-v1.tsx`
    - BRFSS health surveillance dashboard with demographic tabs (Line/Bar/Dot charts)
    - Dependencies: `recharts`, `lucide-react`, UI: `Card`, `Tabs`, `Button`
    - Status: 🔄 PENDING (Batch 12)

53. **ZipHealthDashboard.tsx** → `composite/brfss/zip-dashboard-v1.tsx`
    - ZIP code health metrics dashboard
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 12)

54. **AllStateViz.tsx** → `composite/generic/state-panel-v1.tsx`
    - Comprehensive state visualization panel
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 12)

### Analysis/Computation Components (5)

55. **ComputeForm.tsx** → `composite/generic/compute-form-v1.tsx`
    - Interactive regression analysis form interface
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 12)

56. **ComputeResults.tsx** → `composite/generic/compute-results-v1.tsx`
    - Results display for regression computations
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 12)

57. **FormulaPanel.tsx** → `composite/generic/formula-panel-v1.tsx`
    - Dynamic regression formula builder/display
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 13)

58. **VariableHeader.tsx** → `composite/generic/variable-header-v1.tsx`
    - Variable metadata display component
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 13)

59. **forest-plot.tsx** → `composite/generic/forest-plot-v1.tsx`
    - Forest plot for statistical meta-analysis
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 13)

60. **main-effects-plot.tsx** → `composite/generic/main-effects-v1.tsx`
    - Main effects visualization for ANOVA/regression
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 13)

61. **interaction-effects-plot.tsx** → `composite/generic/interaction-effects-v1.tsx`
    - Interaction effects visualization
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 13)

### Utility Components (1)

62. **CopyResultsButton.tsx** → `composite/generic/copy-button-v1.tsx`
    - Copy-to-clipboard button for analysis results
    - Dependencies: composite
    - Status: 🔄 PENDING (Batch 14)

---

## UI/Infrastructure Components (8 total)

### Data Display Components (2)

63. **StateDataTable.tsx** → `ui/state-data-table.tsx`
    - Sortable, searchable state data table
    - Dependencies: UI: `Table`, `Input`, `Button`
    - BRFSS-specific
    - Status: 🔄 PENDING (Batch 14)

64. **CorrelationHeatmapSvg.tsx** → `ui/correlation-heatmap-svg.tsx`
    - SVG-based correlation matrix
    - Dependencies: ui primitives
    - Generic
    - Status: 🔄 PENDING (Batch 14)

### Radix UI/shadcn Components (6)

65. **tabs.tsx** → `ui/tabs.tsx`
    - Tabs UI component from Radix
    - Dependencies: `@radix-ui/react-tabs`
    - Status: ✅ COPIED (Batch 0)

66. **label.tsx** → `ui/label.tsx`
    - Label component from Radix
    - Dependencies: `@radix-ui/react-label`
    - Status: ✅ COPIED (Batch 0)

67. **switch.tsx** → `ui/switch.tsx`
    - Toggle switch from Radix
    - Dependencies: `@radix-ui/react-switch`
    - Status: ✅ COPIED (Batch 0)

68. **button.tsx** → `ui/button.tsx`
    - Button component with variants
    - Dependencies: `@radix-ui/react-slot`
    - Status: ✅ COPIED (Batch 0)

69. **input.tsx** → `ui/input.tsx`
    - Input field component
    - Dependencies: ui primitives
    - Status: ✅ COPIED (Batch 0)

70. **table.tsx** → `ui/table.tsx`
    - Table components
    - Dependencies: ui primitives
    - Status: ⚠️ NEEDS COPY (used by StateDataTable)

---

## Shared Utilities & Types

### Utils (2 files)
- **statistical-utils.ts** → `utils/statistical-utils.ts`
  - Quartile calculations, kernel density estimation, histogram binning
  - Status: ✅ COPIED (Batch 0)

- **lib/utils.ts** → `utils/cn.ts`
  - Tailwind className merging utility
  - Status: ✅ COPIED (Batch 0)

### Types (1 file)
- **types/plot.ts** → `types/plot.ts`
  - TypeScript interfaces for Plot components
  - Status: ✅ COPIED (Batch 0)

---

## Migration Progress

### Completed
- ✅ Batch 0: Foundation (UI, utils, types) - **9 files**
- ✅ Batch 1: Priority Recharts - **5 components**

### In Progress
- 🔄 Batch 2: Recharts demographics - **5 components**

### Pending
- ⏳ Batches 3-14: **51 components**

**Total Migrated: 14/70 (20%)**

---

## Next Steps

1. Complete Batches 2-14 (migrate remaining 56 components)
2. Create `registry.json` with metadata for all components
3. Build minimal CLI tool
4. Test TimeTrendDemoChart in v0-ctzn-pub
5. Write installation documentation
6. Clean up old build artifacts
