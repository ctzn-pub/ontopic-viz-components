# CLI Usage Guide

## Installation Commands

The viz-registry provides a CLI tool to install components directly into your project.

### Using npx (Recommended)

```bash
# Install a component
npx @ontopic/viz add recharts/generic/timeseries-line-v1

# Install from different frameworks
npx @ontopic/viz add plot/generic/histogram-v1
npx @ontopic/viz add composite/generic/dashboard-v1
```

### Local Development (Testing)

```bash
# In viz-registry directory
pnpm link

# In your project directory
npx viz add recharts/generic/timeseries-line-v1
```

---

## How It Works

When you run `npx @ontopic/viz add <component>`, the CLI:

1. **Creates directory structure**:
   ```
   viz/
   ├── components/
   ├── ui/
   └── utils/
   ```

2. **Downloads component** from GitHub raw URLs:
   - Fetches the component file from the registry
   - Automatically downloads UI dependencies (Label, Switch, etc.)
   - Automatically downloads utility dependencies

3. **Installs npm dependencies**:
   - Detects required packages (recharts, @observablehq/plot, etc.)
   - Runs `pnpm add` to install them

4. **Provides usage instructions**:
   - Shows import statement
   - Reminds about tsconfig.json paths

---

## Component Paths

Components are organized by framework and category:

### Recharts Components

```bash
# Generic (reusable across datasets)
npx @ontopic/viz add recharts/generic/timeseries-line-v1
npx @ontopic/viz add recharts/generic/timeseries-basic-v1
npx @ontopic/viz add recharts/generic/timeseries-dual-axis-v1
npx @ontopic/viz add recharts/generic/timeseries-index-v1

# Dataset-specific
npx @ontopic/viz add recharts/gss/abortion-opinion-v1
npx @ontopic/viz add recharts/brfss/health-trends-v1
```

### Observable Plot Components

```bash
# Generic
npx @ontopic/viz add plot/generic/histogram-v1
npx @ontopic/viz add plot/generic/density-v1
npx @ontopic/viz add plot/generic/splitbar-v1

# Geographic
npx @ontopic/viz add plot/geo/state-map-v1
npx @ontopic/viz add plot/geo/density-map-v1
npx @ontopic/viz add plot/geo/europe-map-v1
```

### Composite Components

```bash
npx @ontopic/viz add composite/generic/state-overview-v1
npx @ontopic/viz add composite/generic/dashboard-v1
```

---

## Prerequisites

### 1. tsconfig.json Path Alias

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

### 2. Framework Installation

Components require their framework to be installed:

**For Recharts components:**
```bash
pnpm add recharts
```

**For Observable Plot components:**
```bash
pnpm add @observablehq/plot d3
```

**Note**: The CLI will automatically install these if not present.

---

## Example Workflow

### Install timeseries-line-v1

```bash
# 1. Install component
npx @ontopic/viz add recharts/generic/timeseries-line-v1

# Output:
# 📦 Installing recharts/generic/timeseries-line-v1...
#
# ✓ Created viz/
# ✓ Created viz/components/
# ✓ Created viz/ui/
# ✓ Created viz/utils/
# ✓ Downloaded timeseries-line-v1.tsx
# ✓ Downloaded ui/label.tsx
# ✓ Downloaded ui/switch.tsx
#
# 📥 Installing npm dependencies...
#    - recharts
#    - @radix-ui/react-label
#    - @radix-ui/react-switch
# ✓ Dependencies installed
#
# ✅ Component installed successfully!
#
# Usage:
#    import TimeseriesLineV1 from '@/viz/components/timeseries-line-v1';
#
# Make sure your tsconfig.json includes:
#    "paths": { "@/viz/*": ["./viz/*"] }
```

### 2. Use the Component

```tsx
// app/my-chart/page.tsx
import TimeseriesLineV1 from '@/viz/components/timeseries-line-v1';

export default function MyChartPage() {
  const data = {
    metadata: {
      title: "My Chart",
      source: { name: "Data Source" }
    },
    dataPoints: [
      { year: 2000, group: "A", value: 45, standard_error: 2 },
      { year: 2005, group: "A", value: 50, standard_error: 2 },
    ],
    dataPointMetadata: [{ id: "value", value_suffix: "%" }]
  };

  return (
    <TimeseriesLineV1
      data={data}
      demographicGroups={['A', 'B']}
      demographic="group"
    />
  );
}
```

---

## Troubleshooting

### "Cannot find module '@/viz/components/...'"

**Solution**: Add path alias to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/viz/*": ["./viz/*"]
    }
  }
}
```

### "Component not rendering"

**Solution**: Make sure framework is installed:
```bash
# For Recharts
pnpm add recharts

# For Observable Plot
pnpm add @observablehq/plot d3
```

### "HTTP 404" when downloading

**Possible causes**:
1. Component doesn't exist at that path
2. GitHub repository not public
3. Typo in component name

**Check available components**:
See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for full list.

---

## Advanced Usage

### Install Multiple Components

```bash
# Install all GSS Recharts components
for component in timeseries-line-v1 timeseries-basic-v1; do
  npx @ontopic/viz add recharts/generic/$component
done
```

### Install by Category

```bash
# Install all geographic Plot components
for component in state-map-v1 density-map-v1 europe-map-v1; do
  npx @ontopic/viz add plot/geo/$component
done
```

---

## See Also

- [QUICKSTART.md](./QUICKSTART.md) - Quick installation guide
- [INSTALLATION.md](./INSTALLATION.md) - Detailed installation documentation
- [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) - Full component catalog
