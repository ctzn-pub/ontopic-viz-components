// registry/theme/provider.tsx
//
// Layer 4 (the seam both engines share). Recharts has no theme provider and
// Plot is imperative, so we build one tiny React context that drives both.
//
// CRITICAL: `useVizTheme()` works with NO provider present — it returns the
// default (`editorial`) theme. That guarantee is what keeps already-copied
// components from breaking when dropped into an app that never mounted a
// <VizThemeProvider>. Graceful degradation over hard coupling.

'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { themes, defaultTheme, Theme, ThemeName } from './themes';
import {
  colorFor as rawColorFor,
  colorScale as rawColorScale,
  SemanticDomain,
} from './semantic';
import { rcTheme } from './adapters/recharts';
import { plotBase } from './adapters/plot';

export { THEME_SCHEMA_VERSION } from './tokens';

const VizThemeContext = createContext<Theme>(defaultTheme);

export function VizThemeProvider({
  theme = 'editorial',
  children,
}: {
  theme?: ThemeName | Theme;
  children: React.ReactNode;
}) {
  let resolved: Theme;
  if (typeof theme === 'string') {
    // Unknown name (e.g. a newer component naming a theme an older copied
    // theme.ts doesn't have) -> warn and fall back, never crash.
    resolved = themes[theme] ?? defaultTheme;
    if (!themes[theme] && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[viz-theme] Unknown theme "${theme}"; falling back to "${defaultTheme.name}".`,
      );
    }
  } else {
    resolved = theme;
  }
  return (
    <VizThemeContext.Provider value={resolved}>
      {children}
    </VizThemeContext.Provider>
  );
}

/** Returns the active theme PLUS resolvers already bound to its semantic map. */
export function useVizTheme() {
  const theme = useContext(VizThemeContext); // defaultTheme if no provider
  return useMemo(
    () => ({
      theme,
      colorFor: (domain: SemanticDomain | null, category: string, index = 0) =>
        rawColorFor(theme.semantic, domain, category, index),
      colorScale: (domain: SemanticDomain | null, categories: string[]) =>
        rawColorScale(theme.semantic, domain, categories),
      rc: rcTheme(theme), // Recharts style bundle
      plotBase: () => plotBase(theme), // Plot options base
    }),
    [theme],
  );
}
