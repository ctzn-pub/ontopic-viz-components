# Ontopic Visualization Packages

Production-ready data visualization components and infrastructure for React applications.

## Packages

This monorepo contains the following packages:

### [@ontopic/viz-core](./packages/core)

Framework-agnostic registry, schemas, and utilities.

- **Size**: ~10KB
- **Dependencies**: zod only
- **React**: Not required
- **Components**: 0 (utilities only)

```bash
npm install @ontopic/viz-core
```

### [@ontopic/viz-components](./packages/components)

React visualization components using Observable Plot and Recharts.

- **Size**: ~500KB (with dependencies)
- **Dependencies**: @observablehq/plot, recharts, lucide-react
- **React**: 18 || 19
- **Components**: 64 total

```bash
npm install @ontopic/viz-components @ontopic/viz-core
```

## React Compatibility

✅ **React 18** - Fully supported
✅ **React 19** - Fully supported

All packages use flexible peer dependency ranges to support both React 18 and 19.

## Quick Start

```tsx
import { StateMap, PlotThemeProvider } from '@ontopic/viz-components';
import { getComponent } from '@ontopic/viz-core';

function App() {
  const data = [
    { state_code: 'CA', value: 78.5, state_name: 'California' },
    { state_code: 'TX', value: 65.2, state_name: 'Texas' }
  ];

  return (
    <PlotThemeProvider theme="light">
      <StateMap
        data={data}
        metadata={{
          title: 'Health Insurance Coverage',
          source: { id: 'brfss', name: 'CDC BRFSS' }
        }}
      />
    </PlotThemeProvider>
  );
}
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Build Individual Packages

```bash
pnpm build:core
pnpm build:components
```

### Development Mode

```bash
pnpm dev
```

## Documentation

- **Live Examples**: https://data-visualization.ontopic.ai
- **Core Package**: [packages/core/README.md](./packages/core/README.md)
- **Components Package**: [packages/components/README.md](./packages/components/README.md)

## License

MIT

## Repository Structure

```
viz-packages/
├── packages/
│   ├── core/                  # @ontopic/viz-core
│   │   ├── src/
│   │   │   ├── registry/      # Component registry
│   │   │   ├── schemas/       # Zod schemas
│   │   │   ├── validators/    # Validation functions
│   │   │   └── utils/         # Utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── README.md
│   │
│   └── components/            # @ontopic/viz-components
│       ├── src/
│       │   ├── plot/          # Observable Plot components (33)
│       │   ├── recharts/      # Recharts components (18)
│       │   ├── composite/     # Dashboard components (11)
│       │   ├── ui/            # UI components (2)
│       │   └── infrastructure/# Plot infrastructure (3)
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       └── README.md
│
├── package.json               # Root package with workspace config
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```
