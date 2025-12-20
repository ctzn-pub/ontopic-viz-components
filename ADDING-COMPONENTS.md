# Adding Components to the Registry

This guide explains how to add new visualization components to the `@ontopic/viz` registry.

## Directory Structure

Components are organized by framework and category:

```
registry/components/
├── recharts/           # Recharts-based components
│   ├── generic/        # Reusable across datasets
│   ├── gss/            # GSS-specific
│   ├── brfss/          # BRFSS-specific
│   └── ess/            # ESS-specific
├── plot/               # Observable Plot components
│   ├── generic/        # Reusable
│   ├── geo/            # Geographic maps
│   ├── stats/          # Statistical visualizations
│   ├── health/         # Health data visualizations
│   ├── brfss/          # BRFSS-specific
│   ├── gss/            # GSS-specific
│   └── timeseries/     # Time series charts
└── composite/          # Multi-component dashboards
    ├── generic/        # Reusable dashboards
    ├── brfss/          # BRFSS dashboards
    └── wb/             # World Bank dashboards
```

## Naming Convention

Component files follow this pattern: `<name>-v<version>.tsx`

Examples:
- `timeseries-basic-v1.tsx`
- `state-map-v1.tsx`
- `brfss-dashboard-v1.tsx`

## Steps to Add a Component

### 1. Create the Component File

Add your component to the appropriate directory:

```bash
# Example: Adding a new Recharts time series component
touch registry/components/recharts/generic/my-chart-v1.tsx
```

### 2. Component Requirements

Your component must:

1. **Use 'use client' directive** (for Next.js compatibility)
2. **Export as default**
3. **Import UI dependencies from `@/viz/ui/`**
4. **Import utilities from `@/viz/utils/`**
5. **Include TypeScript types for props**

Example structure:

```tsx
'use client';

import React from 'react';
import { Label } from '@/viz/ui/label';
import { Switch } from '@/viz/ui/switch';
// ... other imports

interface MyChartProps {
  data: DataShape[];
  title?: string;
  // ... other props
}

export default function MyChart({ data, title }: MyChartProps) {
  // Component implementation
  return (
    <div>
      {/* Chart content */}
    </div>
  );
}
```

### 3. Add UI Dependencies

If your component uses UI primitives not yet in the registry:

```bash
# Add to registry/ui/
touch registry/ui/my-ui-component.tsx
```

Common UI components in `registry/ui/`:
- `button.tsx`
- `card.tsx`
- `label.tsx`
- `switch.tsx`
- `tabs.tsx`
- `input.tsx`

### 4. Add Utility Functions

Shared utilities go in `registry/utils/`:

```bash
touch registry/utils/my-utils.ts
```

### 5. Update Component Inventory

Add your component to `COMPONENT-INVENTORY.md`:

```markdown
### recharts/generic/my-chart-v1

**Description**: Brief description of what the chart does

**Props**:
- `data` (required): Array of data points
- `title` (optional): Chart title

**Dependencies**:
- recharts
- @radix-ui/react-label

**Sample Data**: URL to sample data
```

### 6. Test Installation

Test that your component can be installed via CLI:

```bash
# From a test project
npx @ontopic/viz add recharts/generic/my-chart-v1

# Or test locally
node /path/to/viz-registry/cli/index.js add recharts/generic/my-chart-v1
```

### 7. Commit and Push

```bash
cd /path/to/viz-registry
git add .
git commit -m "Add my-chart-v1 component"
git push
```

## Best Practices

1. **Keep components self-contained**: Minimize external dependencies
2. **Use consistent prop naming**: Follow existing patterns (e.g., `data`, `title`, `width`, `height`)
3. **Include TypeScript types**: Export interfaces for reuse
4. **Document sample data format**: Show expected data shape in comments or docs
5. **Test with sample data**: Ensure component renders correctly before committing

## Sample Data

Components should reference sample data URLs in the component inventory. Sample data is hosted at:

```
https://ontopic-public-data.t3.storage.dev/
```

## Questions?

- Check existing components for patterns
- See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for the full list
- Review [CLI-USAGE.md](./CLI-USAGE.md) for installation testing
