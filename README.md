# @ontopic/viz - Component Registry

A shadcn-style component registry for data visualization. Install components directly into your project instead of using npm packages.

## Quick Start

```bash
# Install a component with one command
npx @ontopic/viz add recharts/generic/timeseries-line-v1

# Use it in your app
import TimeseriesLineV1 from '@/viz/components/timeseries-line-v1';
```

## Why Component Registry?

**vs npm packages:**
- ✅ Full control - edit components directly
- ✅ No version conflicts - copy what you need
- ✅ Tree-shakeable - only bundle what you use
- ✅ Customizable - modify without forking

**vs copy-paste:**
- ✅ Automatic dependency resolution
- ✅ Single command installation
- ✅ Version tracking
- ✅ Easy updates

## Overview

This registry provides **70+ React components** for data visualization, built on:

- **Observable Plot**: Declarative, spec-based visualizations
- **Recharts**: Composable, SVG-based charts with rich interactivity

Components are organized by framework and category, allowing you to install only what you need.

## Installation

### CLI Method (Recommended)

```bash
# Install any component
npx @ontopic/viz add <framework>/<category>/<component>
```

**Examples:**
```bash
# Recharts time series
npx @ontopic/viz add recharts/generic/timeseries-line-v1

# Observable Plot histogram
npx @ontopic/viz add plot/generic/histogram-v1

# Geographic map
npx @ontopic/viz add plot/geo/state-map-v1
```

The CLI automatically:
- Creates `viz/` directory structure
- Downloads component + dependencies (UI, utils)
- Installs npm packages (recharts, plot, etc.)

### Manual Method

Copy files from `registry/` and install dependencies manually. See [INSTALLATION.md](./INSTALLATION.md).

## Prerequisites

### 1. Path Alias

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/viz/*": ["./viz/*"]
    }
  }
}
```

### 2. Framework

Install based on which components you use:

```bash
# For Recharts components
pnpm add recharts

# For Observable Plot components
pnpm add @observablehq/plot d3
```

## Usage Example

```tsx
// app/my-chart/page.tsx
'use client';

import TimeseriesLineV1 from '@/viz/components/timeseries-line-v1';

export default function MyChartPage() {
  const data = {
    metadata: {
      title: "Support for Marriage Equality by Party",
      subtitle: "General Social Survey (GSS)",
      source: { name: "GSS", id: "gss" }
    },
    dataPoints: [
      { year: 2000, PolParty: "Democrat", value: 65.2, standard_error: 2.1 },
      { year: 2000, PolParty: "Republican", value: 42.8, standard_error: 2.3 },
      { year: 2005, PolParty: "Democrat", value: 68.5, standard_error: 1.9 },
      { year: 2005, PolParty: "Republican", value: 45.2, standard_error: 2.1 },
    ],
    dataPointMetadata: [{ id: "value", value_suffix: "%" }]
  };

  return (
    <TimeseriesLineV1
      data={data}
      demographicGroups={['Democrat', 'Republican', 'Independent']}
      demographic="PolParty"
    />
  );
}
```

## Available Components

### Recharts (18 components)

**Time Series:**
- `recharts/generic/timeseries-line-v1` - Multi-group trends with presidential backgrounds
- `recharts/generic/timeseries-basic-v1` - Basic line chart with error bars
- `recharts/generic/timeseries-dual-axis-v1` - Dual y-axis charts
- `recharts/generic/timeseries-index-v1` - Indexed/normalized comparisons
- `recharts/generic/timeseries-economic-v1` - Economic data with recession bands

**Statistical:**
- `recharts/generic/scatter-regression-v1` - Scatterplot with regression line
- `recharts/generic/demographic-bar-v1` - Tabbed demographic bar charts

**Other:**
- `recharts/generic/state-bar-v1` - Sortable state bar chart

See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for the complete list.

**Geographic:**
- `plot/geo/state-map-v1` - US state choropleth
- `plot/geo/density-map-v1` - Density maps with boundaries
- `plot/geo/county-map-v1` - County-level maps
- `plot/geo/zip-map-v1` - ZIP code maps
- `plot/geo/europe-map-v1` - European country maps

**Statistical:**
- `plot/generic/histogram-v1` - Distribution histograms
- `plot/generic/density-v1` - Kernel density plots
- `plot/generic/splitbar-v1` - Split bars with subgroup dots
- `plot/generic/odds-ratio-v1` - Forest plots

**Other:**
- `plot/generic/dot-v1` - Categorical dot plots
- `plot/generic/correlation-heatmap-v1` - Correlation matrices

### Composite (11 components)

**Dashboards:**
- `composite/generic/state-overview-v1` - Tabbed panel with map/bar/table
- `composite/brfss/dashboard-v1` - Health surveillance dashboard
- `composite/generic/regression-analysis-v1` - Interactive regression interface

**Complete list**: See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for all 70+ components.

## Architecture

Components are organized by framework, then category:

```
registry/
├── components/
│   ├── recharts/          # Recharts-based components
│   │   ├── generic/       # Reusable across datasets
│   │   ├── gss/           # GSS-specific
│   │   └── brfss/         # BRFSS-specific
│   │
│   ├── plot/              # Observable Plot components
│   │   ├── generic/       # Reusable
│   │   └── geo/           # Geographic visualizations
│   │
│   └── composite/         # Multi-component dashboards
│
├── ui/                    # shadcn/ui primitives
├── utils/                 # Shared utilities
└── types/                 # TypeScript types
```

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[CLI-USAGE.md](./CLI-USAGE.md)** - CLI command reference
- **[INSTALLATION.md](./INSTALLATION.md)** - Detailed installation guide
- **[COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md)** - Complete component catalog

## Testing Locally

For development and testing before publishing to npm:

```bash
# In viz-registry directory
npm link

# In your project
npx viz add recharts/generic/timeseries-line-v1
```

Or run directly:

```bash
node /path/to/viz-registry/cli/index.js add recharts/generic/timeseries-line-v1
```

## Contributing

1. Add component to `registry/components/<framework>/<category>/`
2. Add UI dependencies to `registry/ui/`
3. Update [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md)
4. Test installation with CLI

## License

MIT

## Repository

https://github.com/ctzn-pub/viz-registry
