# Quick Start Guide

Get a visualization component running in 5 minutes.

## Prerequisites

- Next.js 14+ project
- pnpm (or npm/yarn)

## Install Your First Component

### 1. Create viz directory

```bash
mkdir -p viz/components viz/ui
```

### 2. Add path alias to tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/viz/*": ["./viz/*"]
    }
  }
}
```

### 3. Copy files from viz-registry

```bash
# Main component
cp registry/components/recharts/generic/timeseries-line-v1.tsx viz/components/

# UI dependencies
cp registry/ui/label.tsx viz/ui/
cp registry/ui/switch.tsx viz/ui/
```

### 4. Install npm packages

```bash
pnpm add recharts @radix-ui/react-label @radix-ui/react-switch
```

### 5. Use it

```tsx
// app/my-chart/page.tsx
import TimeTrendDemoChart from '@/viz/components/timeseries-line-v1';

export default function MyChartPage() {
  return (
    <TimeTrendDemoChart
      data={{
        metadata: {
          title: "Your Chart Title",
          source: { name: "Data Source" }
        },
        dataPoints: [
          { year: 2000, group: "A", value: 45, standard_error: 2 },
          { year: 2000, group: "B", value: 55, standard_error: 2 },
          { year: 2005, group: "A", value: 50, standard_error: 2 },
          { year: 2005, group: "B", value: 60, standard_error: 2 },
        ],
        dataPointMetadata: [{ id: "value", value_suffix: "%" }]
      }}
      demographicGroups={['A', 'B']}
      demographic="group"
    />
  );
}
```

### 6. Run your app

```bash
pnpm dev
```

Visit `http://localhost:3000/my-chart` to see your chart!

---

## Next Steps

- **Browse all components**: See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md)
- **Full guide**: Read [INSTALLATION.md](./INSTALLATION.md) for detailed instructions
- **Customize**: Edit the copied component file to suit your needs

## Need Help?

- Path import errors? Check your `tsconfig.json` paths
- Blank chart? Make sure recharts is installed
- Missing UI components? Copy all files from `registry/ui/`

See full troubleshooting in [INSTALLATION.md](./INSTALLATION.md#troubleshooting)
