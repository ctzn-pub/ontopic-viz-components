'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { PlotTheme } from '../types/plot';

const defaultLightTheme: PlotTheme = {
  name: 'light',
  fonts: {
    base: 'Inter, system-ui, sans-serif',
    mono: 'IBM Plex Mono, monospace',
  },
  colors: {
    categorical: [
      'hsl(220, 70%, 50%)',  // Blue
      'hsl(160, 60%, 45%)',  // Green
      'hsl(30, 80%, 55%)',   // Orange
      'hsl(280, 65%, 60%)',  // Purple
      'hsl(340, 75%, 55%)',  // Red
    ],
    sequential: 'blues',
    diverging: 'rdbu',
  },
  grid: {
    stroke: '#e0e0e0',
    strokeWidth: 1,
    strokeOpacity: 0.5,
  },
  axes: {
    fontSize: 12,
    fontWeight: 400,
    color: '#666666',
  },
  background: '#ffffff',
  foreground: '#000000',
};

const defaultDarkTheme: PlotTheme = {
  ...defaultLightTheme,
  name: 'dark',
  colors: {
    ...defaultLightTheme.colors,
    categorical: [
      'hsl(220, 70%, 60%)',
      'hsl(160, 60%, 55%)',
      'hsl(30, 80%, 65%)',
      'hsl(280, 65%, 70%)',
      'hsl(340, 75%, 65%)',
    ],
  },
  grid: {
    stroke: '#333333',
    strokeWidth: 1,
    strokeOpacity: 0.3,
  },
  axes: {
    fontSize: 12,
    fontWeight: 400,
    color: '#999999',
  },
  background: '#0a0a0a',
  foreground: '#ffffff',
};

const PlotThemeContext = createContext<PlotTheme>(defaultLightTheme);

export function PlotThemeProvider({
  theme = 'light',
  children,
}: {
  theme?: 'light' | 'dark' | PlotTheme;
  children: ReactNode;
}) {
  const resolvedTheme =
    typeof theme === 'string'
      ? theme === 'dark'
        ? defaultDarkTheme
        : defaultLightTheme
      : theme;

  return (
    <PlotThemeContext.Provider value={resolvedTheme}>
      {children}
    </PlotThemeContext.Provider>
  );
}

export function usePlotTheme() {
  return useContext(PlotThemeContext);
}

// Export theme presets
export { defaultLightTheme, defaultDarkTheme };
