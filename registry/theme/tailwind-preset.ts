// Tailwind preset for the GSS article theme. Re-exports color tokens
// (defined as CSS variables in theme.css) under named Tailwind classes,
// wires Geist Sans + Geist Mono into `font-sans` / `font-mono`, and
// extends `@tailwindcss/typography` to use the same tokens.
//
// Usage in a consumer's tailwind.config.ts:
//
//   import type { Config } from 'tailwindcss';
//   import preset from './theme/tailwind-preset';
//
//   const config: Config = {
//     presets: [preset],
//     content: [...],   // your own globs
//   };
//
//   export default config;
//
// The consumer must also (1) import theme/theme.css from their globals,
// and (2) load Geist Sans + Geist Mono from theme/fonts.ts in their
// root layout.

import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';

const preset = {
  // The preset doesn't set `content` — that's the consumer's job.
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        // Token names mirror the CSS custom properties in theme.css.
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        subtle: 'var(--color-subtle)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        link: 'var(--color-link)',
        'link-hover': 'var(--color-link-hover)',
        'code-bg': 'var(--color-code-bg)',
      },
      typography: {
        // Override the default `prose` (and `prose-neutral`) palette
        // with our tokens. Most fine-grained typography rules live in
        // theme.css — this block exists so colors flip when tokens flip.
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--color-body)',
            '--tw-prose-headings': 'var(--color-body)',
            '--tw-prose-lead': 'var(--color-subtle)',
            '--tw-prose-links': 'var(--color-link)',
            '--tw-prose-bold': 'var(--color-body)',
            '--tw-prose-counters': 'var(--color-muted)',
            '--tw-prose-bullets': 'var(--color-border-strong)',
            '--tw-prose-hr': 'var(--color-border)',
            '--tw-prose-quotes': 'var(--color-subtle)',
            '--tw-prose-quote-borders': 'var(--color-border-strong)',
            '--tw-prose-captions': 'var(--color-muted)',
            '--tw-prose-code': 'var(--color-body)',
            '--tw-prose-pre-code': '#e2e8f0',
            '--tw-prose-pre-bg': '#0f172a',
            '--tw-prose-th-borders': 'var(--color-border-strong)',
            '--tw-prose-td-borders': 'var(--color-border)',
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Partial<Config>;

export default preset;
