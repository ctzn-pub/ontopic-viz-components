# 03 — Provider & Adapters (Phase 3)

Goal: make both engines read the **active theme** through one React context, and generate
CSS variables for the chrome. After this phase a `<VizThemeProvider theme="newsprint">`
at the app root restyles every themed chart, and `useVizTheme()` hands components
everything pre-bound.

---

## `registry/theme/provider.tsx` — one context, both engines

Recharts has no theme provider and Plot is imperative, so we build a tiny shared one.
Critically: **`useVizTheme()` must work with no provider present** (returns the default
theme), so already-copied components don't break.

```tsx
// registry/theme/provider.tsx
'use client';
import { createContext, useContext, useMemo } from 'react';
import { themes, defaultTheme, Theme, ThemeName } from './themes';
import { colorFor as rawColorFor, colorScale as rawColorScale, SemanticDomain } from './semantic';

const VizThemeContext = createContext<Theme>(defaultTheme);

export function VizThemeProvider({
  theme = 'editorial', children,
}: { theme?: ThemeName | Theme; children: React.ReactNode }) {
  const resolved = typeof theme === 'string' ? themes[theme] : theme;
  return <VizThemeContext.Provider value={resolved}>{children}</VizThemeContext.Provider>;
}

/** Returns the active theme PLUS resolvers already bound to its semantic map. */
export function useVizTheme() {
  const theme = useContext(VizThemeContext); // defaultTheme if no provider
  return useMemo(() => ({
    theme,
    colorFor: (domain: SemanticDomain | null, category: string, index = 0) =>
      rawColorFor(theme.semantic, domain, category, index),
    colorScale: (domain: SemanticDomain | null, categories: string[]) =>
      rawColorScale(theme.semantic, domain, categories),
    rc: rcTheme(theme),       // Recharts style bundle (below)
    plotBase: () => plotBase(theme), // Plot options base (below)
  }), [theme]);
}

// import the adapters at the bottom to keep this file's top readable
import { rcTheme } from './adapters/recharts';
import { plotBase } from './adapters/plot';
```

> If your lint setup dislikes bottom imports, hoist them — the structure is what matters:
> the hook returns bound `colorFor`, `colorScale`, a Recharts bundle, and a Plot base.

---

## `registry/theme/adapters/recharts.ts` — props bundle

Recharts wants per-element values. The adapter turns a `Theme` into a flat bundle of
props the chart spreads in. No color *resolution* here — that's `colorFor` from the hook;
this is the non-semantic chrome (grid, axis, tooltip, typography).

```ts
// registry/theme/adapters/recharts.ts
import { Theme } from '../themes';

export function rcTheme(theme: Theme) {
  return {
    surface: theme.surface,
    fg: theme.fg,
    accent: theme.accent,
    fontBody: theme.fontBody,
    fontTitle: theme.fontTitle,
    stroke: theme.stroke,
    grid: {
      stroke: theme.grid,
      strokeDasharray: theme.gridStyle === 'dashed' ? '3 3' : undefined,
      hide: theme.gridStyle === 'none',
      vertical: theme.gridVertical,
    },
    axisTick: { fontSize: 12, fill: theme.muted, fontFamily: theme.fontBody },
    tooltip: { background: theme.surface, border: `1px solid ${theme.border}`, color: theme.fg },
    titleStyle:    { color: theme.fg, fontFamily: theme.fontTitle },
    subtitleStyle: { color: theme.muted, fontFamily: theme.fontBody },
    sourceStyle:   { color: theme.muted, fontFamily: theme.fontBody, fontSize: 12 },
  };
}
export type RcTheme = ReturnType<typeof rcTheme>;
```

---

## `registry/theme/adapters/plot.ts` — options merge

Plot is configured by one options object. The adapter produces a base you deep-merge with
chart-specific options. The one piece of real logic: **`marks` must concatenate, not
overwrite.**

```ts
// registry/theme/adapters/plot.ts
import { Theme } from '../themes';

export function plotBase(theme: Theme) {
  return {
    style: { fontFamily: theme.fontBody, color: theme.fg, background: 'transparent' },
    x: { tickSize: 4 },
    y: { grid: theme.gridStyle !== 'none', tickSize: 0 },
  };
}

/** Deep-ish merge that concatenates `marks` and shallow-merges scale/style objects. */
export function mergePlot(base: any, chart: any) {
  return {
    ...base, ...chart,
    style: { ...base.style, ...chart.style },
    x: { ...base.x, ...chart.x },
    y: { ...base.y, ...chart.y },
    color: { ...base.color, ...chart.color },
    marks: [ ...(base.marks ?? []), ...(chart.marks ?? []) ],
  };
}
```

A Plot component uses it like:

```tsx
const { plotBase, colorScale, theme } = useVizTheme();
const cats = ['Democrat','Republican','Independent'];
const plot = Plot.plot(mergePlot(plotBase(), {
  color: colorScale('party', cats),               // domain→range from the resolver
  marks: [ Plot.line(data, { x:'year', y:'value', stroke:'PolParty' }) ],
}));
```

Note the **inherent asymmetry**: Recharts resolves color per-series imperatively; Plot
hands the engine a `{domain, range}` scale. Different mechanics, identical output, because
both pulled from the same `theme.semantic`. That's the cross-library consistency.

---

## `registry/theme/generate-css.ts` — TS → CSS vars (build artifact)

CSS variables serve shadcn primitives and `article/*` components (which *do* read CSS and
*do* react to a `.dark` class). Charts do **not** read these — they use the provider.

```ts
// registry/theme/generate-css.ts   (run with: tsx registry/theme/generate-css.ts)
import { writeFileSync } from 'node:fs';
import { themes } from './themes';

const toVars = (t: typeof themes[keyof typeof themes]) => `
  --viz-fg: ${t.fg};
  --viz-muted: ${t.muted};
  --viz-grid: ${t.grid};
  --viz-surface: ${t.surface};
  --viz-border: ${t.border};
  --viz-accent: ${t.accent};
  --viz-font-body: ${t.fontBody};
  --viz-font-title: ${t.fontTitle};`;

const css = `/* GENERATED by generate-css.ts — do not hand-edit. */
:root {${toVars(themes.editorial)}
}
.dark {${toVars(themes.carbon)}
}
[data-viz-theme="newsprint"] {${toVars(themes.newsprint)}
}
`;
writeFileSync(new URL('./theme.css', import.meta.url), css);
console.log('wrote theme.css');
```

Add a script: `"theme:css": "tsx registry/theme/generate-css.ts"`. Run it after any
`tokens.ts`/`themes.ts` change.

---

## Dark mode — the honest part

Dark mode is **two mechanisms**:

1. **Chrome (shadcn/article):** toggling `.dark` on `<html>` swaps the CSS vars above.
   Free, automatic, no chart involvement.
2. **Charts (Recharts/Plot):** cannot read CSS vars reliably. They get dark colors only
   because the provider is given the `carbon` theme (or any `mode: 'dark'` theme).

To keep them provably identical, **both** the CSS generator and the chart provider source
dark values from the *same* `themes.carbon` object. They are the same data, so the chart's
"dark" and the page's "dark" cannot drift apart. Wire app-level dark mode so that flipping
`.dark` also sets the provider to a dark theme — e.g.:

```tsx
const isDark = useThemeMode(); // your app's existing dark detection
<VizThemeProvider theme={isDark ? 'carbon' : 'editorial'}>…</VizThemeProvider>
```

## Phase 3 acceptance

- A component calling `useVizTheme()` with **no** provider gets `editorial`.
- Wrapping it in `<VizThemeProvider theme="carbon">` flips fg/surface/grid.
- `pnpm theme:css` writes `theme.css` with `:root`, `.dark`, and the newsprint block.
- Plot's `mergePlot` concatenates marks (a base grid mark + chart marks both render).

Proceed to `04-RETROFIT-AND-VERIFY.md`.
