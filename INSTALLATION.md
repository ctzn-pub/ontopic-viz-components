# Installation & Usage Guide

## Overview

The viz-registry uses a **shadcn-style** architecture where components are copied directly into your project rather than installed as npm packages. This gives you full control to customize components while keeping them up-to-date.

---

## Installation Methods

### Method 1: Manual Installation (Current)

Until the CLI tool is ready, copy components manually from the registry.

#### Step 1: Set Up Directory Structure

Create the viz directory structure in your project:

```bash
mkdir -p viz/components viz/ui viz/utils viz/types
```

Your project structure should look like:
```
your-project/
├── viz/
│   ├── components/     # Copied visualization components
│   ├── ui/            # shadcn/ui primitives (Label, Switch, etc.)
│   ├── utils/         # Shared utilities
│   └── types/         # TypeScript types
├── app/               # Your Next.js app
└── components/        # Your other components
```

#### Step 2: Configure Path Aliases

Add path aliases to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/viz/*": ["./viz/*"]
    }
  }
}
```

This allows imports like `import { Label } from "@/viz/ui/label"`.

#### Step 3: Copy a Component

Example: Installing `timeseries-line-v1`

```bash
# From viz-registry directory
cp registry/components/recharts/generic/timeseries-line-v1.tsx \
   /path/to/your-project/viz/components/

# Copy required UI dependencies
cp registry/ui/label.tsx /path/to/your-project/viz/ui/
cp registry/ui/switch.tsx /path/to/your-project/viz/ui/
```

#### Step 4: Install npm Dependencies

Check the component's dependencies and install them:

```bash
cd /path/to/your-project
pnpm add recharts@^2.15.0
pnpm add @radix-ui/react-label @radix-ui/react-switch
```

#### Step 5: Use the Component

```tsx
import TimeTrendDemoChart from '@/viz/components/timeseries-line-v1';

export default function MyPage() {
  const chartData = {
    metadata: {
      title: "Abortion Opinion by Political Party",
      subtitle: "General Social Survey (GSS)",
      question: "Should abortion be legal?",
      source: { name: "GSS", id: "gss" },
      observations: 15420
    },
    dataPoints: [
      { year: 2000, PolParty: "Democrat", value: 65.2, standard_error: 2.1 },
      { year: 2000, PolParty: "Republican", value: 42.8, standard_error: 2.3 },
      // ... more data
    ],
    dataPointMetadata: [
      { id: "value", name: "% Agree", value_suffix: "%" }
    ]
  };

  return (
    <TimeTrendDemoChart
      data={chartData}
      demographicGroups={['Democrat', 'Republican', 'Other']}
      demographic="PolParty"
    />
  );
}
```

---

### Method 2: CLI Installation (Future)

Once the CLI is built, installation will be simpler:

```bash
# Initialize viz components in your project
npx @ontopic/viz init

# Add a component (copies files + installs deps)
npx @ontopic/viz add timeseries.line.v1

# Add multiple components
npx @ontopic/viz add geo.state_map.v1 stat.histogram.v1

# List available components
npx @ontopic/viz list
```

---

## Component Reference

### timeseries-line-v1 (Recharts)

**Location**: `registry/components/recharts/generic/timeseries-line-v1.tsx`

**What it does**: Multi-group time series with presidential term backgrounds and confidence intervals.

**Dependencies**:
- `recharts@^2.15.0`
- `@radix-ui/react-label@2.1.1`
- `@radix-ui/react-switch@1.1.2`

**Registry dependencies**:
- `viz/ui/label.tsx`
- `viz/ui/switch.tsx`

**Props**:
```typescript
interface TimeTrendDemoChartProps {
  data: ChartData;               // Chart data with metadata
  demographicGroups: string[];   // Groups to display (e.g., ['Democrat', 'Republican'])
  demographic: string;           // Field name in data (e.g., 'PolParty')
  defaultVisibleGroups?: string[]; // Optional: initially visible groups
}

interface ChartData {
  metadata: {
    title: string;
    subtitle?: string;
    question?: string;
    source?: { name: string; id?: string };
    observations?: number;
  };
  dataPoints: Array<{
    year: string | number;
    value: number;
    ci_lower?: number;
    ci_upper?: number;
    n_actual?: number;
    standard_error?: number;
    [demographicField: string]: any;
  }>;
  dataPointMetadata: Array<{
    id: string;
    value_prefix?: string;
    value_suffix?: string;
  }>;
}
```

**Example**:
```tsx
<TimeTrendDemoChart
  data={{
    metadata: {
      title: "Support for Marijuana Legalization",
      source: { name: "GSS" }
    },
    dataPoints: [
      { year: 2000, party: "Democrat", value: 45, standard_error: 1.2 },
      { year: 2000, party: "Republican", value: 30, standard_error: 1.5 },
    ],
    dataPointMetadata: [
      { id: "value", value_suffix: "%" }
    ]
  }}
  demographicGroups={['Democrat', 'Republican', 'Independent']}
  demographic="party"
/>
```

---

## Common Patterns

### Data Shape for Time Series

Most time series components expect data in this shape:

```typescript
{
  metadata: {
    title: string;
    subtitle?: string;
    source?: { name: string; id?: string };
  },
  dataPoints: Array<{
    year: string | number;
    value: number;
    ci_lower?: number;  // Lower confidence interval
    ci_upper?: number;  // Upper confidence interval
    standard_error?: number;
    n_actual?: number;  // Sample size
    [groupField]: string;  // Demographic field (e.g., 'PolParty', 'Race')
  }>,
  dataPointMetadata: [{
    id: "value",
    value_prefix?: string;  // e.g., "$"
    value_suffix?: string;  // e.g., "%"
  }]
}
```

### Installing Multiple Components

When installing a component that uses other registry components:

1. **Check registry dependencies** in the component documentation
2. **Copy all registry dependencies** to your `viz/` directory
3. **Install npm dependencies** for the main component only

Example for `timeseries-line-v1`:
```bash
# Main component
cp registry/components/recharts/generic/timeseries-line-v1.tsx viz/components/

# Registry dependencies (UI)
cp registry/ui/{label,switch}.tsx viz/ui/

# npm dependencies
pnpm add recharts @radix-ui/react-label @radix-ui/react-switch
```

---

## Updating Components

To update a component to a newer version:

1. **Copy the new version** from the registry (overwrites old file)
2. **Check for breaking changes** in the component's changelog
3. **Update dependencies** if needed

```bash
# Update timeseries-line-v1
cp registry/components/recharts/generic/timeseries-line-v1.tsx \
   viz/components/timeseries-line-v1.tsx
```

---

## Customizing Components

Since components are copied into your project, you can customize them:

### Option 1: Edit Directly
Modify the copied component file to suit your needs.

### Option 2: Wrap and Extend
Create a wrapper component:

```tsx
// viz/components/my-time-series.tsx
import TimeTrendDemoChart from './timeseries-line-v1';

export default function MyTimeSeries({ data }) {
  // Add custom logic, transform data, etc.
  const transformedData = transformMyData(data);

  return (
    <div className="my-custom-wrapper">
      <TimeTrendDemoChart
        data={transformedData}
        demographicGroups={['A', 'B', 'C']}
        demographic="myField"
      />
    </div>
  );
}
```

---

## Troubleshooting

### Import errors: "Cannot find module '@/viz/ui/label'"

**Problem**: Path alias not configured.

**Solution**: Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/viz/*": ["./viz/*"]
    }
  }
}
```

### Recharts not rendering (blank chart area)

**Problem**: Recharts needs to be installed in the consuming project, not just bundled.

**Solution**:
```bash
pnpm add recharts@^2.15.0
```

### Missing UI components

**Problem**: Component uses UI primitives that aren't copied yet.

**Solution**: Copy required UI files from `registry/ui/`:
```bash
cp registry/ui/{label,switch,tabs,button,input}.tsx viz/ui/
```

---

## Migration from npm Package

If you're currently using `@ontopic/viz-components` as an npm package:

### Before (npm package):
```tsx
import { TimeTrendDemoChart } from '@ontopic/viz-components';
```

### After (registry):
```tsx
import TimeTrendDemoChart from '@/viz/components/timeseries-line-v1';
```

### Migration steps:
1. Remove package: `pnpm remove @ontopic/viz-components`
2. Copy components manually (see Method 1 above)
3. Update imports in your code
4. Install component dependencies directly

---

## Best Practices

1. **Keep viz/ directory clean**: Only copy components you actually use
2. **Document customizations**: If you modify a component, add comments explaining why
3. **Version control**: Commit the copied components to your repo
4. **Update regularly**: Check the registry for updates and improvements
5. **Test after updates**: Always test when updating a component from the registry

---

## Component Categories

### Time Series
- `timeseries-line-v1` - Multi-group trends with presidential backgrounds
- `timeseries-basic-v1` - Simple time series with error bars
- `timeseries-dual-axis-v1` - Dual y-axis charts
- `timeseries-index-v1` - Indexed/normalized comparisons
- `timeseries-economic-v1` - Economic data with recession bands

### Geographic
- `geo.state_map.v1` - US state choropleth
- `geo.density_map.v1` - Density maps with boundaries
- `geo.bubble.v1` - Bubble maps
- `map.county.v1` - County-level maps
- `map.zip.v1` - ZIP code maps
- `map.europe.v1` - European country maps

### Statistical
- `stat.histogram.v1` - Distribution histograms
- `stat.density.v1` - Kernel density plots
- `stat.boxplot.v1` - Box-and-whisker plots
- `stat.regression.v1` - Scatterplot with regression
- `stat.forest.v1` - Forest plots (odds ratios)
- `stat.splitbar.v1` - Split bars with subgroup dots

### Demographic
- `demographic-line-v1` - Tabbed demographic line charts
- `demographic-bar-v1` - Tabbed demographic bar charts
- `demographic-dot-v1` - Tabbed demographic dot plots

---

## Next Steps

- **Browse components**: See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for full list
- **CLI tool**: Coming soon - will automate copying and dependency installation
- **Examples**: Check the data-visualization repo for working examples
- **Contribute**: Submit new components to the registry

---

## Support

- **Issues**: [GitHub Issues](https://github.com/ctzn-pub/ontopic-viz-components/issues)
- **Documentation**: [Component Inventory](./COMPONENT-INVENTORY.md)
- **Examples**: [data-visualization repo](https://github.com/ctzn-pub/data-visualization)
