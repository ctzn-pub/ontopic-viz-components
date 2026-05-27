// registry/theme/adapters/recharts.ts
//
// Recharts wants per-element values (colors & sizes are JSX props). This
// adapter turns a Theme into a flat bundle of props a chart spreads in.
//
// NOTE: no color *resolution* happens here — that's `colorFor` from the hook
// (provider.tsx). This file produces only the non-semantic chrome: grid, axis,
// tooltip, typography. Sizes come from the global `tokens.size`, not the Theme
// (sizes are not theme-dependent), so charts stay free of literal font sizes.

import { tokens } from '../tokens';
import { Theme } from '../themes';

/** gridStyle -> Recharts CartesianGrid strokeDasharray. */
function gridDash(style: Theme['gridStyle']): string | undefined {
  switch (style) {
    case 'dashed': return '3 3';
    case 'dotted': return '1 3';
    default:       return undefined; // 'solid' | 'none'
  }
}

export function rcTheme(theme: Theme) {
  return {
    surface: theme.surface,
    fg: theme.fg,
    muted: theme.muted,
    accent: theme.accent,
    fontBody: theme.fontBody,
    fontTitle: theme.fontTitle,
    stroke: theme.stroke,
    grid: {
      stroke: theme.grid,
      strokeDasharray: gridDash(theme.gridStyle),
      hide: theme.gridStyle === 'none',
      vertical: theme.gridVertical,
    },
    axisTick: {
      fontSize: tokens.size.axisTick,
      fill: theme.muted,
      fontFamily: theme.fontBody,
    },
    tooltip: {
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      color: theme.fg,
    },
    titleStyle: {
      color: theme.fg,
      fontFamily: theme.fontTitle,
    },
    subtitleStyle: {
      color: theme.muted,
      fontFamily: theme.fontBody,
    },
    sourceStyle: {
      color: theme.muted,
      fontFamily: theme.fontBody,
      fontSize: tokens.size.source,
    },
  };
}

export type RcTheme = ReturnType<typeof rcTheme>;
