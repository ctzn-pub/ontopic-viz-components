# @ontopic/viz-components

Production-ready data visualization components for React using Observable Plot and Recharts.

## Overview

`@ontopic/viz-components` provides **50+ React components** for data visualization, built on top of two industry-leading libraries:

- **Observable Plot**: Declarative, spec-based visualizations with automatic scales and intelligent defaults
- **Recharts**: Composable, SVG-based charts with rich interactivity

All components follow consistent patterns, accept standardized data formats, and work seamlessly with `@ontopic/viz-core`.

## Installation

```bash
npm install @ontopic/viz-components @ontopic/viz-core
# or
pnpm add @ontopic/viz-components @ontopic/viz-core
# or
yarn add @ontopic/viz-components @ontopic/viz-core
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom @observablehq/plot recharts lucide-react
```

## React Compatibility

✅ **React 18** - Fully supported and tested
✅ **React 19** - Fully supported and tested

Our peer dependencies use flexible version ranges to support both React 18 and 19:

```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

If you encounter peer dependency warnings, use `--legacy-peer-deps` or update to the latest package version.

## Quick Start

```tsx
import { StateMap, PlotThemeProvider } from '@ontopic/viz-components';

function App() {
  const data = [
    { state_code: 'CA', value: 78.5, state_name: 'California' },
    { state_code: 'TX', value: 65.2, state_name: 'Texas' },
    { state_code: 'NY', value: 81.3, state_name: 'New York' }
  ];

  return (
    <PlotThemeProvider theme="light">
      <StateMap
        data={data}
        metadata={{
          title: 'Health Insurance Coverage by State',
          subtitle: 'Percentage of population with coverage (2023)',
          source: { id: 'brfss', name: 'CDC BRFSS' }
        }}
      />
    </PlotThemeProvider>
  );
}
```

## Component Inventory

### Observable Plot Components (33 components)

#### Infrastructure (3 components)

| Component | Description | Props |
|-----------|-------------|-------|
| **PlotContainer** | Base rendering component for all Plot visualizations | `plotSpec`, `width`, `height`, `className`, `ariaLabel` |
| **PlotThemeProvider** | Theme context provider for consistent styling | `theme: 'light' \| 'dark'`, `children` |
| **PlotExport** | Export functionality (SVG, PNG) | `plotRef`, `filename`, `formats` |

#### Geographic Visualizations (6 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **StateMap** | US state choropleth map | `{ state_code, value }[]` | State-level comparisons |
| **BubbleMap** | Geographic bubble map | `{ lat, lon, value, label? }[]` | Location-based data with magnitude |
| **GeoDensityMap** | Geographic density visualization with boundaries | `{ lat, lon }[]` + boundary data | Population density, event locations |
| **ChoroplethMap** | County-level choropleth | `{ fips, value }[]` | County comparisons |
| **EuropeMap** | European country map | `{ country_code, value }[]` | European data |
| **ZipMap** | ZIP code level map | `{ zip, value }[]` | Local area analysis |

#### Statistical Distribution (12 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **BoxPlot** | Basic box plot | `{ category, value }[]` | Distribution by category |
| **BoxPlotGrouped** | Grouped box plots | `{ category, group, value }[]` | Two-way categorical comparisons |
| **BoxPlotFaceted** | Faceted box plots | `{ category, facet, value }[]` | Multiple small multiples |
| **BoxPlotFacetedGrouped** | Faceted + grouped | `{ category, group, facet, value }[]` | Three-way comparisons |
| **HistogramPlot** | Distribution histogram | `{ value }[]` | Frequency distribution |
| **HistogramObservable** | Alternative histogram implementation | `{ value }[]` | Distribution with custom bins |
| **DistributionPlot** | Distribution visualization | `{ value }[]` | Data distribution analysis |
| **DensityPlot** | Kernel density estimation | `{ value }[]` | Smooth distribution |
| **QQPlot** | Quantile-quantile plot | `{ value }[]` | Normality testing |
| **ResidualPlot** | Residual plot for regression | `{ fitted, residual }[]` | Regression diagnostics |
| **PointPlot** | Point plot with error bars | `{ category, value, error? }[]` | Estimates with uncertainty |
| **StripPlot** | 1D scatter plot | `{ category, value }[]` | Individual data points |
| **SwarmPlot** | Beeswarm plot | `{ category, value }[]` | Non-overlapping points |

#### Statistical Analysis (4 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **RegressionPlot** | Scatterplot with regression line | `{ x, y }[]` | Relationship analysis |
| **ForestPlot** | Forest plot for odds ratios | `{ label, estimate, ci_lower, ci_upper }[]` | Meta-analysis, odds ratios |
| **OddsRatio** | Odds ratio visualization | `{ label, or, ci_lower, ci_upper }[]` | Logistic regression results |
| **PcaPlot** | PCA biplot | `{ pc1, pc2, label }[]` | Dimensionality reduction |
| **SplitBar** | Bars with demographic subgroup dots | `{ category, overall, subgroups }[]` | Demographic comparisons |

#### Basic Charts (2 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **DotPlot** | Categorical dot plot | `{ category, value }[]` | Simple comparisons |
| **BarChart** | Basic bar chart | `{ category, value }[]` | Categorical comparisons |

#### Specialized Visualizations (5 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **Sparkline** | Inline sparkline | `{ value }[]` | Trend indicator |
| **SlopeChart** | Slope graph | `{ time, value, group }[]` | Change over two points |
| **BulletChart** | Bullet graph | `{ value, target, ranges }` | Progress to goal |
| **DivergingBar** | Diverging bar chart | `{ category, value }[]` | Positive/negative values |
| **FacetedPlot** | Generic faceted visualization | `{ ...fields, facet }[]` | Small multiples |

#### Matrix/Heatmap (1 component)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **CorrelationHeatmap** | Correlation matrix heatmap | `{ x, y, correlation }[]` | Correlation analysis |

#### Time Series (1 component)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **TimeTrendDemo** | Time trend visualization | `{ year, value, group? }[]` | Temporal trends |

---

### Recharts Components (18 components)

#### Time Series (8 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **TimeSeriesLine** | Single time series line | `{ date, value }[]` | Temporal trends |
| **LineChart** | Basic line chart | `{ x, y, group? }[]` | Trends over time |
| **TimeSeries** | General time series | `{ date, value, group? }[]` | Multi-series trends |
| **TimeSeriesChart** | Categorical time series | `{ date, category, value }[]` | Grouped trends |
| **TimeSeriesIndex** | Normalized index comparison | `{ date, series, value }[]` | Relative change |
| **DualAxisChart** | Dual-axis comparison | `{ date, value1, value2 }[]` | Different scales |
| **TimeTrendDemoChart** | Demo time trend | `{ year, value }[]` | Example visualization |
| **AbortionOpinionChart** | Opinion trend chart | `{ year, category, value }[]` | Survey data over time |

#### Demographic/Categorical (3 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **DemographicBarChart** | Demographic bar chart | `{ demographic, category, value }[]` | Demographic breakdowns |
| **DemographicLineChart** | Demographic line chart | `{ year, demographic, value }[]` | Demographic trends |
| **DemographicDotPlot** | Demographic dot plot | `{ demographic, value }[]` | Simple demographic comparisons |

#### Bar/Ranking (1 component)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **StateBarChart** | Sortable state bar chart | `{ state, value }[]` | State rankings |

#### Scatterplot (2 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **HealthScatterplot** | Health indicator scatter | `{ x, y, state }[]` | State comparisons |
| **ScatterplotRegression** | Scatter with OLS regression | `{ x, y }[]` | Relationship + fit line |

#### Distribution (2 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **HistogramRecharts** | Recharts histogram | `{ value }[]` | Distribution |
| **ViolinPlot** | Violin plot | `{ category, value }[]` | Distribution by category |

---

### Composite/Dashboard Components (11 components)

#### Dashboards (3 components)

| Component | Description | Dependencies | Use Case |
|-----------|-------------|--------------|----------|
| **AllStateViz** | Tabbed panel with map/bar/table views | StateMap, StateBarChart, StateDataTable | Multi-view state data |
| **BrfssDashboard** | Health surveillance dashboard | DemographicLineChart, DemographicBarChart, DemographicDotPlot | BRFSS data exploration |
| **ZipHealthDashboard** | ZIP code health dashboard | ZipMap | Local health data |

#### Compute/Analysis Components (5 components)

| Component | Description | Use Case |
|-----------|-------------|----------|
| **ComputeForm** | Interactive regression form | Variable selection, formula building |
| **ComputeResults** | Regression results display | Tabbed results (tables + visualizations) |
| **FormulaPanel** | Dynamic formula display | Show current regression model |
| **VariableHeader** | Variable metadata display | Show variable descriptions |
| **CopyResultsButton** | Copy results to clipboard | Export functionality |

#### Regression Visualization Components (3 components)

| Component | Description | Use Case |
|-----------|-------------|----------|
| **ForestPlot** | Forest plot component | Regression coefficients |
| **MainEffectsPlot** | Main effects visualization | Regression main effects |
| **InteractionEffectsPlot** | Interaction effects | Interaction terms |

---

### UI Components (2 components)

| Component | Description | Data Shape | Use Case |
|-----------|-------------|------------|----------|
| **StateDataTable** | Sortable state data table | `{ state, value }[]` | Tabular state data |
| **CorrelationHeatmapSvg** | Pure SVG correlation heatmap | `{ x, y, correlation }[]` | Lightweight correlation matrix |

---

## Total Component Count

- **Observable Plot**: 33 components
- **Recharts**: 18 components
- **Composite/Dashboard**: 11 components
- **UI**: 2 components
- **Total**: **64 components**

---

## Usage Patterns

### Observable Plot Components

All Plot components use the `PlotContainer` infrastructure:

```tsx
import { DensityPlot, PlotThemeProvider } from '@ontopic/viz-components';

function DistributionChart() {
  const data = [
    { value: 65 }, { value: 72 }, { value: 78 },
    { value: 82 }, { value: 85 }, { value: 88 }
  ];

  return (
    <PlotThemeProvider theme="light">
      <DensityPlot
        data={data}
        metadata={{
          title: 'Test Score Distribution',
          subtitle: 'Student performance'
        }}
      />
    </PlotThemeProvider>
  );
}
```

### Recharts Components

Recharts components use standard Recharts patterns:

```tsx
import { TimeSeriesLine } from '@ontopic/viz-components';

function TrendChart() {
  const data = [
    { year: 2020, value: 100 },
    { year: 2021, value: 120 },
    { year: 2022, value: 140 },
    { year: 2023, value: 155 }
  ];

  return (
    <TimeSeriesLine
      data={data}
      metadata={{
        title: 'Revenue Growth',
        subtitle: '2020-2023'
      }}
      xField="year"
      yField="value"
    />
  );
}
```

### Composite Components

Composite components combine multiple visualizations:

```tsx
import { AllStateViz } from '@ontopic/viz-components';

function StateOverview() {
  const data = [
    { state_code: 'CA', state_name: 'California', value: 78.5 },
    { state_code: 'TX', state_name: 'Texas', value: 65.2 }
  ];

  return (
    <AllStateViz
      data={data}
      metadata={{
        title: 'Health Insurance Coverage by State',
        source: { id: 'brfss', name: 'CDC BRFSS' }
      }}
    />
  );
}
```

---

## Theming

### Plot Theme Provider

Wrap your Plot components in `PlotThemeProvider`:

```tsx
import { PlotThemeProvider, StateMap } from '@ontopic/viz-components';

function App() {
  return (
    <PlotThemeProvider theme="dark">
      {/* All Plot components inside will use dark theme */}
      <StateMap data={data} metadata={metadata} />
    </PlotThemeProvider>
  );
}
```

### Custom Themes

Create custom themes:

```tsx
import { PlotThemeProvider } from '@ontopic/viz-components';

const customTheme = {
  backgroundColor: '#f8f9fa',
  textColor: '#212529',
  colors: ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0'],
  gridColor: '#dee2e6'
};

<PlotThemeProvider theme={customTheme}>
  <YourComponents />
</PlotThemeProvider>
```

---

## Export Functionality

Use `PlotExport` to enable chart export:

```tsx
import { PlotContainer, PlotExport } from '@ontopic/viz-components';
import { useRef } from 'react';

function ExportableChart() {
  const plotRef = useRef(null);

  return (
    <div>
      <PlotExport
        plotRef={plotRef}
        filename="my-chart"
        formats={['svg', 'png']}
      />
      <PlotContainer
        ref={plotRef}
        plotSpec={yourPlotSpec}
        width="responsive"
        height={400}
      />
    </div>
  );
}
```

---

## Troubleshooting

### React Version Conflicts

If you see peer dependency warnings:

```
npm ERR! peer react@"^18.0.0" from @ontopic/viz-components
```

**Solution 1**: Update to latest package (supports React 18 || 19)
```bash
npm install @ontopic/viz-components@latest
```

**Solution 2**: Use --legacy-peer-deps
```bash
npm install @ontopic/viz-components --legacy-peer-deps
```

**Solution 3**: Use npm overrides (npm 8.3+)
```json
{
  "overrides": {
    "@ontopic/viz-components": {
      "react": "$react"
    }
  }
}
```

### TypeScript Errors

Ensure you have the correct types:
```bash
npm install --save-dev @types/react @types/react-dom
```

### Missing Styles

Some components require Tailwind CSS. Add to your `tailwind.config.js`:

```js
module.exports = {
  content: [
    './node_modules/@ontopic/viz-components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ]
};
```

---

## Next.js Compatibility

All components include `'use client'` directives for Next.js App Router:

```tsx
// app/dashboard/page.tsx
import { StateMap } from '@ontopic/viz-components';

export default function DashboardPage() {
  return <StateMap data={data} metadata={metadata} />;
}
```

---

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type {
  StateMapProps,
  TimeSeriesLineProps,
  BoxPlotGroupedProps
} from '@ontopic/viz-components';

const config: StateMapProps = {
  data: [...],
  metadata: { title: '...' }
};
```

---

## Examples & Documentation

Live examples and documentation: https://data-visualization.ontopic.ai

Each component has:
- Interactive demo
- Data format examples
- Props documentation
- Use case descriptions

---

## License

MIT

## Repository

https://github.com/ontopic/viz-packages/tree/main/packages/components

---

## Related Packages

- **@ontopic/viz-core** - Registry, schemas, validators (framework-agnostic)
- **@ontopic/viz-layouts** - Layout components for Next.js apps (optional)
