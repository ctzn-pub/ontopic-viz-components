# Setup & Usage Guide

The single consumer-side guide: installing components into your app, using the CLI, data shapes, updating, customizing, troubleshooting. For a repo overview see the [README](../README.md); for authoring new components see [ADDING-COMPONENTS.md](../ADDING-COMPONENTS.md).

## How this registry works

This is a **shadcn-style copy-in registry**: components are copied directly into your project rather than installed as an npm package. You own the copies — customize freely. The `viz add` CLI automates the copy plus its transitive dependencies (`@/viz/ui/*`, `@/viz/utils/*`, `@/viz/theme/*` imports) and `pnpm add`s the npm packages the component needs.

## Prerequisites

1. **Path alias** in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/viz/*": ["./viz/*"]
    }
  }
}
```

2. A React app (Next.js 14+ is the primary target; the preview app proves components also run under plain Vite).

## Installing with the CLI (recommended)

The CLI is not published to npm — clone this repo and either link it or invoke it directly:

```bash
# One-time: clone, then either
cd ~/github/ontopic-viz-components && pnpm link --global   # (a) puts `viz` on your PATH
# or invoke directly with node, no setup:
node ~/github/ontopic-viz-components/cli/index.js add d3/stats/ridge-v1
```

The CLI reads from the `registry/` folder that ships alongside it (self-relative — works from any clone location). Override the source with `$ONTOPIC_VIZ_SOURCE` or `--source <dir>`; pass `--remote` to fetch from GitHub raw instead (only works while the repo is public).

### Component path forms

```bash
# 3-segment: framework/category/file — for chart components
viz add recharts/gss/timeseries-line-v1
# → viz/components/recharts/gss/timeseries-line-v1.tsx

# 2-segment: category/file — for non-framework-bound assets (article/MDX layout)
viz add article/Callout
# → viz/components/article/Callout.tsx
```

What one `viz add` does:

1. Creates `viz/components/`, `viz/ui/`, `viz/utils/` as needed
2. Copies the component file
3. Walks its imports and copies `@/viz/ui/*` and `@/viz/utils/*` dependencies; any `@/viz/theme/*` import copies the whole theme folder
4. Detects npm dependencies (recharts, @observablehq/plot, d3-*, radix…) and `pnpm add`s them
5. Prints the import statement to use

## Installing manually

Copy the files yourself if you prefer:

```bash
mkdir -p viz/components viz/ui viz/utils

# The component
cp registry/components/recharts/gss/timeseries-line-v1.tsx viz/components/recharts/gss/

# Its UI dependencies (check the component's imports)
cp registry/ui/{label,switch}.tsx viz/ui/

# npm dependencies
pnpm add recharts @radix-ui/react-label @radix-ui/react-switch
```

## Theme (separate flow)

Design tokens, fonts, and the Tailwind preset live at `registry/theme/`. The CLI copies the whole folder automatically when a component imports `@/viz/theme/*`; to install it standalone:

```bash
cp -r ~/github/ontopic-viz-components/registry/theme ./viz/theme
```

Wire-up guide: `registry/theme/README.md`. To theme a whole book/article app (prose + charts from one switch), see `registry/theme/INTEGRATING-WITH-A-BOOK.md`.

## Usage example

```tsx
// app/my-chart/page.tsx
'use client';

import TimeseriesLineV1 from '@/viz/components/recharts/gss/timeseries-line-v1';

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

### Common data shape for time series

Most time-series components expect:

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
    ci_lower?: number;      // lower confidence bound
    ci_upper?: number;      // upper confidence bound
    standard_error?: number;
    n_actual?: number;      // sample size
    [groupField: string]: unknown; // demographic field, e.g. 'PolParty'
  }>,
  dataPointMetadata: [{
    id: "value",
    value_prefix?: string;  // e.g. "$"
    value_suffix?: string;  // e.g. "%"
  }]
}
```

## Updating a component

Re-run `viz add <path>` (or re-copy the file) — it overwrites your copy with the registry version. If you customized the copy, diff before overwriting.

## Customizing

You own the copied files. Either edit them directly (add a comment explaining why, so future updates can re-apply the change), or wrap them:

```tsx
// viz/components/my-time-series.tsx
import TimeseriesLineV1 from './recharts/gss/timeseries-line-v1';

export default function MyTimeSeries({ raw }: { raw: MyShape }) {
  const data = transformMyData(raw);
  return <TimeseriesLineV1 data={data} demographicGroups={['A', 'B']} demographic="group" />;
}
```

## Troubleshooting

**`Cannot find module '@/viz/...'`** — the path alias is missing. Add `"@/viz/*": ["./viz/*"]` to `tsconfig.json` paths.

**Blank chart area** — the chart framework isn't installed in *your* app: `pnpm add recharts` (or `@observablehq/plot`, `d3-scale d3-shape`, `maplibre-gl pmtiles` depending on the engine).

**Missing UI primitives** — copy them from `registry/ui/`: `cp registry/ui/{label,switch,tabs,button,input}.tsx viz/ui/`.

**Component file not found by the CLI** — check the path against the registry tree (`ls registry/components/<framework>/`), or browse the preview app (`pnpm preview:dev` in this repo).

**MapLibre components render nothing on the server** — they're client-only; import via `next/dynamic` with `ssr: false`.

## Best practices

1. Only copy components you actually use.
2. Commit the copied `viz/` files to your repo.
3. Test after re-copying an updated component.
4. Don't edit theme resolver plumbing in your copy — hardcoding colors breaks theme switching (see the theme docs).
