# @ontopic/viz — Component Registry

A local component registry for data visualization. Clone the repo, run a small CLI, and the chart, layout, or theme assets you ask for get copied directly into your app — no npm install, no external package.

## What this is (and isn't)

The CLI's binary name is `viz`, declared as `@ontopic/viz` in `package.json` so it's runnable via `pnpm link --global` (and would be `npx`-able if it were ever published — it isn't). **The package is not on npm.** All commands assume you've cloned this repo locally and either linked the CLI or invoke it directly with `node`.

The `viz add` command works by **copying files from this repo's `registry/` folder** into a consuming app's `viz/` tree. It walks `@/viz/ui/*`, `@/viz/utils/*`, and `@/viz/theme/*` imports automatically and `pnpm add`s any npm packages the components need (Recharts, Observable Plot, D3, Radix, etc.).

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

The CLI defaults to **local-source mode** — it reads from the `registry/` folder that ships alongside it (self-relative, so it works from any clone location). Override with `$ONTOPIC_VIZ_SOURCE` to point at a different checkout:

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

Use 3-segment for chart components (they sit under a chart framework like Recharts, Plot, D3, or MapLibre). Use 2-segment for cross-framework assets like the `article/*` MDX layout components.

## Theme (separate flow)

The design tokens, fonts, and Tailwind preset live at `registry/theme/`. They're not React components, so the CLI's dependency-walk adds nothing — just copy the folder:

```bash
cp -r ~/github/ontopic-viz-components/registry/theme ./theme
```

Then wire it into your Next 15 app per `registry/theme/README.md` (a 3-step guide: import the preset in `tailwind.config.ts`, import fonts in `app/layout.tsx`, import `theme.css` in `app/globals.css`).

**Theming a whole book or article app (one switch for prose + charts).** If you're building a long-form reader where the page chrome and typography should re-tone *together with* the charts when the user picks a theme, see [`registry/theme/INTEGRATING-WITH-A-BOOK.md`](registry/theme/INTEGRATING-WITH-A-BOOK.md). It derives the article's `--color-*` tokens from the generated `--viz-*` variables so a single `data-viz-theme` attribute drives everything, and adds a `ThemeProvider` + reader-facing switcher. The [`ctzn-pub/book-template`](https://github.com/ctzn-pub/book-template) repo is a complete, working consumer of this exact wiring — copy from it.

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

# For D3/SVG components
pnpm add d3-scale d3-shape
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

Roughly 100 components across five engines:

- **Recharts** (`recharts/*`) — declarative time-series, demographic breakdowns, histograms; flagship: `recharts/gss/timeseries-line-v1` (multi-group trends with presidential-term bands and CI toggle)
- **Observable Plot** (`plot/*`) — the largest set: statistical graphics (forest plots, ridgelines, PCA biplots, parallel coordinates), geo (choropleths, hexbins), time series
- **D3/SVG** (`d3/*`) — bespoke-geometry charts where the other engines fall short, rendered as pure-React SVG
- **MapLibre + PMTiles** (`maplibre/*`) — high-cardinality zoomable choropleths (block groups, ZCTAs) with feature-state joins
- **Article layout** (`article/*`) — framework-agnostic MDX building blocks (Figure, Callout, DataTable, SmallMultiples, …); see [`registry/components/article/README.md`](./registry/components/article/README.md)

**To browse:** run `pnpm preview:dev` for a live local gallery of every component with quality metrics, or explore `registry/components/` directly. Published components appear at `https://ctzn-pub.vercel.app/viz/<id>`.

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
│   ├── d3/                # D3/SVG bespoke interaction components
│   │   └── stats/         # Statistical and multivariate visualizations
│   │
│   ├── maplibre/          # MapLibre + PMTiles components
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

- **[docs/SETUP.md](./docs/SETUP.md)** — consumer guide: installation (CLI + manual), data shapes, updating, troubleshooting
- **[ADDING-COMPONENTS.md](./ADDING-COMPONENTS.md)** — authoring guide: conventions, catalog sidecars, the publish pipeline
- **[design/](./design/)** — the theme-system spec (tokens → semantic → themes → adapters, map engine)

## Contributing

1. Add the component to `registry/components/<framework>/<category>/` (3-seg) or `registry/components/<category>/` (2-seg, for framework-agnostic)
2. Ship a `.catalog.json` sidecar next to it (required — the contract test and publish workflow enforce this; see [ADDING-COMPONENTS.md](./ADDING-COMPONENTS.md))
3. Route every color/font/size through the theme system (`useVizTheme()`) — no hardcoded literals
4. Run `pnpm test` and test installation with the CLI in a tmp dir

## License

MIT

## Repository

https://github.com/ctzn-pub/ontopic-viz-components
