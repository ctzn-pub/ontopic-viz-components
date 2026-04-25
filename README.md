# @ontopic/viz — Component Registry

A local component registry for data visualization. Clone the repo, run a small CLI, and the chart, layout, or theme assets you ask for get copied directly into your app — no npm install, no external package.

## What this is (and isn't)

The CLI's binary name is `viz`, declared as `@ontopic/viz` in `package.json` so it's runnable via `pnpm link --global` (and would be `npx`-able if it were ever published — it isn't). **The package is not on npm.** All commands assume you've cloned this repo locally and either linked the CLI or invoke it directly with `node`.

The `viz add` command works by **copying files from this repo's `registry/` folder** into a consuming app's `viz/` tree. It walks `@/viz/ui/*` and `@/viz/utils/*` imports automatically and `pnpm add`s any npm packages the components need (Recharts, Observable Plot, Radix, etc.).

## Quick Start

```bash
# 1. Clone this repo (one-time)
git clone <ontopic-viz-components-url> ~/github/ontopic-viz-components

# 2. Make the CLI runnable. Pick one:

#    (a) Link onto your PATH (recommended):
cd ~/github/ontopic-viz-components && pnpm link --global
#    Then in any consumer app:
viz add recharts/gss/timeseries-line-v1

#    (b) Or invoke directly, no PATH setup:
node ~/github/ontopic-viz-components/cli/index.js add recharts/gss/timeseries-line-v1
```

The CLI defaults to **local-source mode** — it reads from `~/github/ontopic-viz-components/registry/` (the canonical path baked into `cli/index.js`). Override with `$ONTOPIC_VIZ_SOURCE` if your clone lives elsewhere:

```bash
export ONTOPIC_VIZ_SOURCE=~/code/ontopic-viz-components/registry
viz add article/Callout
```

There's also a `--remote` flag that fetches from GitHub raw — only useful if this repo is public, which is a moving target. Treat local-source as the default.

## Component path forms

The CLI accepts two path shapes:

```bash
# 3-segment: framework/category/file
viz add recharts/gss/timeseries-line-v1
# → installs to viz/components/recharts/gss/timeseries-line-v1.tsx

# 2-segment: category/file (for non-framework-bound assets)
viz add article/Callout
# → installs to viz/components/article/Callout.tsx
```

Use 3-segment for chart components (they sit under a chart framework like Recharts or Plot). Use 2-segment for cross-framework assets like the `article/*` MDX layout components.

## Theme (separate flow)

The design tokens, fonts, and Tailwind preset live at `registry/theme/`. They're not React components, so the CLI's dependency-walk adds nothing — just copy the folder:

```bash
cp -r ~/github/ontopic-viz-components/registry/theme ./theme
```

Then wire it into your Next 15 app per `registry/theme/README.md` (a 3-step guide: import the preset in `tailwind.config.ts`, import fonts in `app/layout.tsx`, import `theme.css` in `app/globals.css`).

## GSS-specific articles

If you're scaffolding a long-form GSS article (Geist-styled MDX + a Recharts chart + the article-layout components), the full recipe lives in the `gss-article` Claude Code skill at `ctzn-pub/claude-skills/gss-article/SKILL.md`. The recipe walks through cloning this registry, running the right `viz add` commands, and wiring up `ArticleShell`. Env vars (Tigris, optional OpenAI) are documented at `ctzn-pub/claude-skills/gss-charts/.env.example`.

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

### 2. Framework Dependencies

The CLI auto-installs npm packages it detects in component imports, so you usually don't need to pre-install anything. If you're working offline:

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

## Available Components

### Recharts (18 components)

**Time Series:**
- `recharts/gss/timeseries-line-v1` — Multi-group trends with presidential backgrounds (GSS-specific)
- `recharts/generic/timeseries-basic-v1` — Basic line chart with error bars
- `recharts/generic/timeseries-dual-axis-v1` — Dual y-axis charts
- `recharts/generic/timeseries-index-v1` — Indexed/normalized comparisons
- `recharts/generic/timeseries-economic-v1` — Economic data with recession bands

**Statistical:**
- `recharts/generic/scatter-regression-v1` — Scatterplot with regression line
- `recharts/generic/demographic-bar-v1` — Tabbed demographic bar charts

**Other:**
- `recharts/generic/state-bar-v1` — Sortable state bar chart

See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for the complete list.

### Observable Plot (36 components)

**Geographic:**
- `plot/geo/state-map-v1` — US state choropleth
- `plot/geo/density-map-v1` — Density maps with boundaries
- `plot/geo/county-map-v1` — County-level maps
- `plot/geo/zip-map-v1` — ZIP code maps
- `plot/geo/europe-map-v1` — European country maps

**Statistical:**
- `plot/generic/histogram-v1` — Distribution histograms
- `plot/generic/density-v1` — Kernel density plots
- `plot/generic/splitbar-v1` — Split bars with subgroup dots
- `plot/generic/odds-ratio-v1` — Forest plots

**Other:**
- `plot/generic/dot-v1` — Categorical dot plots
- `plot/generic/correlation-heatmap-v1` — Correlation matrices

### Composite (11 components)

**Dashboards:**
- `composite/generic/state-overview-v1` — Tabbed panel with map/bar/table
- `composite/brfss/dashboard-v1` — Health surveillance dashboard
- `composite/generic/regression-analysis-v1` — Interactive regression interface

### Article-layout components (13 components)

MDX building blocks for long-form articles. Framework-agnostic; install with the 2-segment path form:

- `article/Callout` — Caveat / definition / finding / aside variants
- `article/DataTable` — 3–8-row tables with bold-row + delta-cell helpers
- `article/Figure` — Distill-style layout-zone wrapper (`body` / `body-outset` / `page-outset` / `screen-inset`)
- `article/SmallMultiples` — 4–9 panels of identical shape with shared y-axis
- `article/TabSet`, `article/Tab` — Tabbed chart frame
- `article/KeyNumber`, `article/PullQuote`, `article/Quote`, `article/Annotation`
- `article/SideNote`, `article/SectionDivider`, `article/Step`, `article/DropCap`

See [`registry/components/article/README.md`](./registry/components/article/README.md) for component API + usage guidance.

**Complete list of all 70+ components:** [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md).

## Architecture

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
│   ├── composite/         # Multi-component dashboards
│   │
│   └── article/           # MDX layout components (framework-agnostic)
│
├── theme/                 # Design tokens, fonts, Tailwind preset
├── ui/                    # shadcn/ui primitives
├── utils/                 # Shared utilities
└── types/                 # TypeScript types
```

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** — Get started in 5 minutes
- **[CLI-USAGE.md](./CLI-USAGE.md)** — CLI command reference
- **[INSTALLATION.md](./INSTALLATION.md)** — Detailed installation guide
- **[COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md)** — Complete component catalog

## Contributing

1. Add component to `registry/components/<framework>/<category>/` (3-seg) or `registry/components/<category>/` (2-seg, for framework-agnostic)
2. Add UI dependencies to `registry/ui/`
3. Update [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md)
4. Test installation with the CLI in a tmp dir

## License

MIT

## Repository

https://github.com/ctzn-pub/viz-registry
