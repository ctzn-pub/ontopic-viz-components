# GSS article theme bundle

Portable design identity for long-form GSS articles, lifted from
Fumadocs (https://fumadocs.dev). Drop this folder into any Next 15 +
Tailwind 3.4 app and follow the three steps below to get the same
typography, color tokens, and prose styling.

## What's in this folder

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

@import "../theme/theme.css";
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
