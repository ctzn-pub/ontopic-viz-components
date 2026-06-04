# Integrating the theme into a book / long-form article app

This is the recipe for a reader app — a book, an article, a docs-style site —
where the **page chrome and prose typography should re-tone together with the
charts** when the reader switches themes. One control, whole-page effect.

It builds on the two systems already in this folder (see
[`README.md`](./README.md)):

- the **chart theme system** (`tokens` → `themes` → `provider` → `adapters`),
  which exposes the active theme to charts via `useVizTheme()` and to CSS via
  the generated **`--viz-*`** custom properties in `viz-theme.css`;
- the **article-typography bundle** (`theme.css`, `tailwind-preset.ts`,
  `fonts.ts`), whose **`--color-*`** tokens style prose.

By default those two are independent — `theme.css` ships *static* `--color-*`
values. The trick below makes the article tokens **derive from** the chart
theme, so flipping one attribute re-tones everything with no duplicated
palette.

> A complete, working consumer of this exact wiring is the
> [`ctzn-pub/book-template`](https://github.com/ctzn-pub/book-template) repo.
> If you'd rather copy than read, start there.

## The idea in one diagram

```
viz/theme/{tokens,themes}.ts        theme definitions
        │  pnpm theme:css
        ▼
viz/theme/viz-theme.css             [data-viz-theme="…"] { --viz-fg, --viz-surface, … }
        │  var() references (you write these)
        ▼
app/globals.css                     --color-body: var(--viz-fg);  --color-surface: var(--viz-surface);  …
        │  tailwind-preset
        ▼
bg-surface / text-body / prose      chrome + prose re-tone with the theme
        ▲
        └ <html data-viz-theme="bloomberg">   ← one attribute drives it all
```

The same attribute that `viz-theme.css` keys its `--viz-*` blocks on is the one
your `ThemeProvider` sets — so charts (via `useVizTheme()`) and CSS (via the
cascade) read a single source of truth and can never drift.

## Step 1 — derive `--color-*` from `--viz-*`

Instead of the static values in `theme.css`, point the article tokens at the
chart-theme variables. In your `app/globals.css`, **before** the `@tailwind`
directives (the `@import` must come first per the CSS spec):

```css
@import "../viz/theme/viz-theme.css";   /* the generated --viz-* blocks */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-body:    var(--viz-fg);
  --color-muted:   var(--viz-muted);
  --color-surface: var(--viz-surface);
  --color-border:  var(--viz-border);
  --color-link:    var(--viz-accent);

  /* tokens the chart theme doesn't define — synthesize with color-mix so they
     still track the theme (works on light AND dark surfaces): */
  --color-subtle:        color-mix(in srgb, var(--viz-fg) 70%, var(--viz-muted));
  --color-card:          color-mix(in srgb, var(--viz-surface) 96%, var(--viz-fg));
  --color-border-strong: color-mix(in srgb, var(--viz-border) 60%, var(--viz-fg));
  --color-link-hover:    color-mix(in srgb, var(--viz-accent) 80%, var(--viz-fg));
  --color-code-bg:       color-mix(in srgb, var(--viz-surface) 92%, var(--viz-fg));

  /* fonts follow the theme too (serif headings under Times/FT, etc.) */
  --font-book-sans:    var(--viz-font-body,  var(--font-sans));
  --font-book-display: var(--viz-font-title, var(--font-sans));
}
```

You can keep importing `theme.css` as well if you want its base prose rules,
but the token values above win because they're defined after it. (book-template
inlines the rules it wants directly and skips importing `theme.css` to avoid
the duplicate `:root` block — either approach is fine.)

Then map the tokens into Tailwind classes as usual (the `tailwind-preset.ts`
already does this; or extend `theme.extend.colors` yourself). Point
`font-display`/`font-sans` at `--font-book-*` so headings pick up the theme's
title font.

## Step 2 — one provider that drives CSS *and* charts

`VizThemeProvider` themes the charts (JS). It does **not** set the
`data-viz-theme` attribute that drives the CSS. Wrap a thin provider that does
both:

```tsx
'use client';
import { VizThemeProvider } from '@/viz/theme/provider';
import { themes, type ThemeName, defaultTheme } from '@/viz/theme/themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeName>(/* read from <html> attr */);

  const choose = (t: ThemeName) => {
    setTheme(t);
    document.documentElement.setAttribute('data-viz-theme', t);  // drives CSS
    localStorage.setItem('book-theme', t);
  };

  return (
    <ThemeCtx.Provider value={{ theme, setTheme: choose, themes: Object.keys(themes) }}>
      <VizThemeProvider theme={theme}>{children}</VizThemeProvider>{/* drives charts */}
    </ThemeCtx.Provider>
  );
}
```

Build the reader-facing switcher off `Object.keys(themes)` (never a hand-typed
list) so adding a theme to `themes.ts` surfaces it automatically. Each theme
object carries `surface` / `fg` / `accent`, so you can render a 3-swatch
preview per option.

## Step 3 — apply the saved theme before first paint

Setting the attribute from React runs *after* hydration, so the page would
flash the default theme on reload. Add a tiny inline script in `<head>` (in a
Server Component / root layout) that sets the attribute synchronously:

```tsx
// app/layout.tsx — keep this string in a NON-'use client' module so the
// server can call it. (A function re-exported through a 'use client' boundary
// becomes a client reference and can't be invoked server-side.)
<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript() }} />
  </head>
  <body><ThemeProvider>{children}</ThemeProvider></body>
</html>
```

`themeNoFlashScript()` reads `localStorage`, validates against the known theme
names, and sets `data-viz-theme` on `<html>`. `suppressHydrationWarning` on
`<html>` is required because the attribute differs between server and client by
design.

## Gotchas (all hit while building book-template)

- **`@import` must be the first statement** in `globals.css`, before
  `@tailwind`. Tailwind directives expand to rules, and CSS forbids `@import`
  after rules.
- **No hard-coded hex in components.** Audit for literal Tailwind color classes
  (`bg-white`, `text-gray-600`, `#e0e0e0` grid strokes) — they won't re-tone
  and will break on the dark theme. Map neutrals to tokens; for an inverted
  chip use `bg-body text-surface` (not `text-white`, which fails on dark).
- **Charts must read the theme via JS, not just CSS.** CSS `--viz-*` themes
  CSS-driven chrome; a Recharts/Plot chart needs `useVizTheme()` (the `rc`
  bundle for grid/axis/tooltip, `colorFor`/`colorScale` for series). Dot halos
  and card backgrounds that were `'white'` should be `rc.surface`.
- **Decorative gradients** (hero washes, per-section tints) should be mixed
  from `var(--viz-accent)` / `var(--color-surface)` via `color-mix`, not fixed
  pastels — otherwise they blow out on the dark theme.
- **Dark theme is real.** `bloomberg` is `mode: 'dark'` with a near-black
  surface. Test every page in it; it's the fastest way to find a missed
  hard-coded color.
