// registry/theme/adapters/tanstack.ts
//
// TanStack Charts (@tanstack/charts) is configured by a chart *definition* whose
// `theme` field takes a small, fixed shape:
//
//     ChartTheme { foreground, muted, grid, background, palette }
//
// which maps almost 1:1 onto our Theme. This adapter does that mapping and, like
// the other engine adapters, also exposes the non-semantic *chrome* (type sizes,
// stroke widths, dot radii, margins, grid dash) so a component never writes a
// literal.
//
// Color RESOLUTION is not done here. A TanStack chart passes the palette below
// for the arbitrary-cycle case, and for semantic domains (party / sentiment) it
// calls `colorFor` / `colorScale` from the provider exactly like every other
// engine — same data in, same colors out, across all four engines.
//
// NOTE ON REACT: @tanstack/react-charts requires React ^19. This adapter and the
// components under registry/components/tanstack/ are the only part of the
// registry with that constraint; both TanStack packages are declared as OPTIONAL
// peer dependencies so React-18 consumers of every other component are
// unaffected. See docs/SETUP.md.

import { tokens } from '../tokens';
import { Theme } from '../themes';

/**
 * The theme shape @tanstack/charts consumes. Declared structurally rather than
 * imported so this adapter (and `pnpm theme:check`) stay compilable even when
 * the optional TanStack packages aren't installed.
 */
export interface TanstackChartTheme {
  foreground: string;
  muted: string;
  grid: string;
  background: string;
  palette: readonly string[];
}

function gridDash(style: Theme['gridStyle']): string | undefined {
  switch (style) {
    case 'dashed': return '3 3';
    case 'dotted': return '1 3';
    default:       return undefined;
  }
}

export function tanstackTheme(theme: Theme) {
  /**
   * Pass straight into `defineChart({ theme })`. `palette` is the theme's
   * categorical cycle — ink first — so a single-series chart renders monochrome
   * (the Tufte default) without the component asking for a color.
   */
  const chartTheme: TanstackChartTheme = {
    foreground: theme.fg,
    muted: theme.muted,
    grid: theme.grid,
    // Charts sit on whatever surface the host card provides; painting an opaque
    // background here would punch a hole through a themed card.
    background: 'transparent',
    palette: theme.semantic.categorical,
  };

  return {
    /** → defineChart({ theme: tsq.chartTheme }) */
    chartTheme,

    // ── chrome, mirroring the other adapters so components stay literal-free ──
    fontBody: theme.fontBody,
    fontTitle: theme.fontTitle,
    surface: theme.surface,
    fg: theme.fg,
    muted: theme.muted,
    grid: theme.grid,
    border: theme.border,
    accent: theme.accent,

    gridVisible: theme.gridStyle !== 'none',
    gridVertical: theme.gridVertical,
    /**
     * KNOWN ENGINE GAP: TanStack's axis takes `grid?: boolean` — on or off. It
     * owns the gridline rendering, so `theme.gridStyle`'s dashed/dotted variants
     * CANNOT be honored here the way they are on Recharts/Plot/D3; the grid is
     * always solid at the engine's own low alpha. Exposed anyway so a component
     * that draws its own `ruleY` gridlines can still match the house style.
     * Documented in registry/CURATION.md.
     */
    gridDasharray: gridDash(theme.gridStyle),

    axis: {
      stroke: theme.grid,
      labelFill: theme.muted,
      tickFill: theme.muted,
      tickSize: tokens.size.axisTick,
      labelSize: tokens.size.axisLabel,
      /**
       * Preferred tick/gridline count. TanStack's default lands around 9 on a
       * typical domain — visibly busier than the ~5 our other engines settle on.
       * Pass this as `axis.ticks.count` on BOTH axes so density reads the same
       * across all four engines.
       */
      tickCount: 5,
    },
    line: {
      strokeWidth: theme.stroke,
      mutedStrokeWidth: tokens.stroke.hairline,
      focusStrokeWidth: tokens.stroke.thick,
      mutedOpacity: 0.28,
      focusOpacity: 0.95,
    },
    point: {
      r: tokens.dot.sm,
      focusR: tokens.dot.lg,
    },
    text: {
      titleSize: tokens.size.title,
      subtitleSize: tokens.size.subtitle,
      annotationSize: tokens.size.annotation,
      sourceSize: tokens.size.source,
    },
    /** TanStack takes `margin` as a number or Partial<ChartMargin>. */
    margin: { top: 16, right: 24, bottom: 32, left: 48 },
    compactMargin: { top: 12, right: 16, bottom: 26, left: 36 },
    wideRightMargin: { top: 16, right: 96, bottom: 32, left: 52 },
  };
}

export type TanstackAdapter = ReturnType<typeof tanstackTheme>;
