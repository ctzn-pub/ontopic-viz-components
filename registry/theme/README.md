# viz theme/

This folder holds **two related but distinct** design systems:

1. **The chart theme system** (`tokens.ts` → `semantic.ts` → `themes.ts` →
   `provider.tsx` → `adapters/`) — a single source of truth for chart design
   decisions (color, type, stroke, grid) shared by Recharts and Observable
   Plot. Ships 4 built-in themes (`editorial` default, `newsprint`, `carbon`,
   `blueprint`). See **[THEME-AUTHORING.md](./THEME-AUTHORING.md)**.
2. **The article typography bundle** (`fonts.ts`, `theme.css`,
   `tailwind-preset.ts`) — Fumadocs-inspired prose styling for long-form MDX
   articles. Documented below.

The two meet only at the generated **`viz-theme.css`** (`--viz-*` custom
properties), which exposes the active chart theme's chrome to CSS-driven
components. `theme.css` (article, hand-written, `--color-*`) and `viz-theme.css`
(charts, generated, `--viz-*`) are independent files — import both from your
globals.

## The chart theme system (quick start)

```tsx
// app/layout.tsx — wrap once at the root
import { VizThemeProvider } from '@/viz/theme/provider';

<VizThemeProvider theme="editorial">{children}</VizThemeProvider>
```

```tsx
// inside any chart — resolve colors through the active theme, never literals
import { useVizTheme } from '@/viz/theme/provider';
const { rc, colorFor } = useVizTheme();        // rc = Recharts chrome bundle
const lineColor = colorFor('party', 'Democrat'); // blue in every theme
```

With **no** provider, `useVizTheme()` returns `editorial` — components never
crash for lack of one. Regenerate the CSS vars after editing tokens/themes:

```bash
pnpm theme:css     # → viz-theme.css     pnpm theme:check     pnpm test
```

Files: `tokens.ts` (raw values), `semantic.ts` (`colorFor`/`colorScale`
resolvers), `themes.ts` (the 4 themes), `provider.tsx` (`VizThemeProvider` +
`useVizTheme`), `adapters/recharts.ts` + `adapters/plot.ts` (per-engine
translation), `generate-css.ts` (build step → `viz-theme.css`).

---

# Article typography bundle (Fumadocs-inspired)

Portable design identity for long-form articles, lifted from
Fumadocs (https://fumadocs.dev). Drop this folder into any Next 15 +
Tailwind 3.4 app and follow the three steps below to get the same
typography, color tokens, and prose styling.

## What's in the article bundle

- `fonts.ts` — Geist Sans + Geist Mono via `next/font/google`. Exports
  `geistSans` and `geistMono` with CSS-variable plumbing.
- `theme.css` — design tokens (`:root` custom properties) + body,
  link, blockquote, inline-code, heading-rhythm rules.
- `tailwind-preset.ts` — Tailwind preset that wires the tokens into
  `font-sans` / `font-mono` and color classes (`bg-surface`,
  `text-body`, `text-muted`, `border-border`, etc.) and extends
  `@tailwindcss/typography` to use the same tokens.

## Three-step install

### 1. Copy this folder

Drop `theme/` at the root of your Next.js app (next to `app/`).

### 2. Wire fonts in your root layout

```tsx
// app/layout.tsx
import { geistSans, geistMono } from '@/theme/fonts';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-surface text-body">
        {children}
      </body>
    </html>
  );
}
```

### 3. Wire CSS + Tailwind preset

In `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "../theme/theme.css";      /* article typography (--color-*) */
@import "../theme/viz-theme.css";  /* chart theme chrome (--viz-*, generated) */
```

In `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
import preset from './theme/tailwind-preset';

const config: Config = {
  presets: [preset],
  content: ['./app/**/*.{ts,tsx,mdx}'],   // your own globs
};

export default config;
```

That's it. Render `<h1>` / `<p>` / `<a>` and they should look like
fumadocs.dev. Wrap article prose in `<article className="prose
max-w-none">{children}</article>` for the typography overrides.

## Token vocabulary

The CSS tokens are reachable as Tailwind classes after the preset is
installed:

| Token              | Tailwind class         | What it's for                          |
| ------------------ | ---------------------- | -------------------------------------- |
| `--color-body`     | `text-body`            | Primary body text                      |
| `--color-muted`    | `text-muted`           | Header dl, footer, figcaptions         |
| `--color-subtle`   | `text-subtle`          | Subtitles, secondary lines             |
| `--color-surface`  | `bg-surface`           | Page background                        |
| `--color-card`     | `bg-card`              | Card surfaces                          |
| `--color-border`   | `border-border`        | Rules, table borders                   |
| `--color-link`     | `text-link`            | Links (default state)                  |

Flipping a token in `theme.css` flips it across the whole app — useful
when (eventually) wiring dark mode.

## Non-goals

- **Not an npm package.** Copy-paste preset, not `pnpm add`.
- **Not a component library.** Just typography + tokens. Bring your own
  layout components (`<ArticleShell>`, callouts, etc.) — see the parent
  preview app for examples.
- **No dark mode yet.** All tokens are CSS variables, so a dark-mode
  flip is a one-file change later.
