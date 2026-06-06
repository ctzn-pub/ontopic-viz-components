// registry/theme/adapters/d3.ts
//
// D3/SVG components own their geometry directly, so this adapter gives them the
// same non-semantic chrome Recharts and Plot receive: type, grid, strokes,
// margins, and interaction affordances. Color resolution stays in
// provider.tsx (`colorFor` / `colorScale` / `scaleFor`).

import { tokens } from '../tokens';
import { Theme } from '../themes';

function gridDash(style: Theme['gridStyle']): string | undefined {
  switch (style) {
    case 'dashed': return '3 3';
    case 'dotted': return '1 3';
    default:       return undefined;
  }
}

export function d3Theme(theme: Theme) {
  return {
    surface: theme.surface,
    fg: theme.fg,
    muted: theme.muted,
    grid: theme.grid,
    border: theme.border,
    accent: theme.accent,
    fontBody: theme.fontBody,
    fontTitle: theme.fontTitle,
    stroke: theme.stroke,
    gridDasharray: gridDash(theme.gridStyle),
    gridVisible: theme.gridStyle !== 'none',
    gridVertical: theme.gridVertical,
    axis: {
      stroke: theme.grid,
      tickStroke: theme.grid,
      labelFill: theme.muted,
      tickFill: theme.muted,
      tickSize: tokens.size.axisTick,
      labelSize: tokens.size.axisLabel,
    },
    line: {
      mutedStrokeWidth: tokens.stroke.hairline,
      strokeWidth: theme.stroke,
      focusStrokeWidth: tokens.stroke.thick,
      opacity: 0.28,
      mutedOpacity: 0.08,
      focusOpacity: 0.95,
    },
    point: {
      r: tokens.dot.sm,
      focusR: tokens.dot.lg,
    },
    text: {
      annotationSize: tokens.size.annotation,
      sourceSize: tokens.size.source,
    },
    control: {
      gap: 8,
      marginBottom: 10,
      padding: '4px 8px',
    },
    label: {
      gap: 8,
      minGap: 14,
      leaderOffset: 3,
      maxChars: 16,
    },
    distribution: {
      rowGap: 56,
      violinRowGap: 78,
      rowHeight: 34,
      violinHeight: 24,
      gridPoints: 120,
    },
    hitStroke: 'transparent',
    hitStrokeWidth: 10,
    margin: {
      top: 28,
      right: 28,
      bottom: 108,
      left: 48,
    },
    compactMargin: {
      top: 28,
      right: 72,
      bottom: 54,
      left: 56,
    },
    wideRightMargin: {
      top: 28,
      right: 156,
      bottom: 62,
      left: 58,
    },
  };
}

export type D3Theme = ReturnType<typeof d3Theme>;
