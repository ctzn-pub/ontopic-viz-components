// registry/theme/themes.ts
//
// Layer 3 of the viz theme system: built-in Theme objects. A Theme is the
// neutral *foundation* (neutrals, typography, stroke/grid behavior) plus a
// restrained accent and categorical ramp, plus OPTIONAL semantic overrides.
//
// Semantic domains (party, sentiment) come from semantic.ts and are
// theme-independent UNLESS a theme overrides them (to stay tonally consistent).
//
// Data-only: no React, no Plot, no Recharts. The provider (provider.tsx)
// selects one and the adapters translate it per engine.

import { tokens as t } from './tokens';
import { mergeSemantic, SemanticMap, SemanticOverrides } from './semantic';

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  // neutral foundation
  fg: string;       // primary ink (default series color, titles)
  muted: string;    // axis labels, source line, secondary text
  grid: string;     // gridline color
  surface: string;  // chart/tooltip background
  border: string;   // tooltip / table border
  // typography
  fontBody: string;  // axis ticks, labels, body
  fontTitle: string; // title/subtitle (may differ — e.g. serif headings)
  // line/mark behavior
  stroke: number;                              // default series stroke width
  gridStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  gridVertical: boolean;
  // emphasis
  accent: string; // the ONE color used for emphasis when not semantic
  // resolved semantic map (defaults merged with this theme's overrides)
  semantic: SemanticMap;
}

// helper so each theme declaration stays terse
function build(
  base: Omit<Theme, 'semantic'>,
  semOverrides?: SemanticOverrides,
): Theme {
  return { ...base, semantic: mergeSemantic(semOverrides) };
}

// -- Theme A — `editorial` (DEFAULT) ----------------------------------------
// Tufte-forward, monochrome ink on white. This is what a component renders
// with when there is no provider. Single-series charts are pure near-black.
// Color appears only via semantic domains or a sparingly-used accent.
export const editorial: Theme = build({
  name: 'editorial',
  mode: 'light',
  fg:      t.palette.ink,      // near-black series + titles
  muted:   t.palette.gray500,
  grid:    t.palette.gray200,  // very faint
  surface: t.palette.white,
  border:  t.palette.gray200,
  fontBody:  t.font.sans,
  fontTitle: t.font.sans,
  stroke:  t.stroke.thin,      // 1.25
  gridStyle: 'dashed',
  gridVertical: false,         // horizontal-only gridlines
  accent:  t.palette.blue,
});
// uses default semantics (Dem blue / Rep red / etc.)

// -- Theme B — `newsprint` --------------------------------------------------
// Warm muted editorial — paper-cream background, warm charcoal ink, serif
// headings, slightly higher tolerance for color but kept desaturated. Party
// colors are overridden to muted brick/slate so they sit in the warm palette.
export const newsprint: Theme = build(
  {
    name: 'newsprint',
    mode: 'light',
    fg:      t.palette.warmInk,
    muted:   t.palette.warmGray,
    grid:    t.palette.warmLine,
    surface: t.palette.paper,
    border:  t.palette.warmLine,
    fontBody:  t.font.sans,
    fontTitle: t.font.serif,   // newspaper-style headings
    stroke:  t.stroke.regular, // 1.5
    gridStyle: 'solid',
    gridVertical: false,
    accent:  t.palette.brick,
  },
  {
    // tonal overrides so semantic colors match the warm palette
    party: {
      Democrat:    t.palette.slate,
      Republican:  t.palette.brick,
      Independent: t.palette.warmGray,
    },
    categorical: [
      t.palette.warmInk,
      t.palette.slate,
      t.palette.brick,
      t.palette.amber,
      t.palette.warmGray,
    ],
  },
);

// -- Theme C — `carbon` (dark) ----------------------------------------------
// High-contrast dark theme. Doubles as the dark-mode demonstration: it proves
// the JS-threaded mode path works for charts (CSS `.dark` alone can't reach
// Recharts/Plot). Accents brighten so they read on the dark surface.
export const carbon: Theme = build(
  {
    name: 'carbon',
    mode: 'dark',
    fg:      t.palette.carbonInk,
    muted:   t.palette.carbonMuted,
    grid:    t.palette.carbonLine,
    surface: t.palette.carbon,
    border:  t.palette.carbonLine,
    fontBody:  t.font.sans,
    fontTitle: t.font.sans,
    stroke:  t.stroke.regular,
    gridStyle: 'solid',
    gridVertical: false,
    accent:  t.palette.blueBright,
  },
  {
    party: {
      Democrat:    t.palette.blueBright,
      Republican:  '#f87171',
      Independent: t.palette.carbonMuted,
    },
    categorical: [
      t.palette.carbonInk,
      t.palette.carbonMuted,
      t.palette.blueBright,
      '#f87171',
      '#4ade80',
      '#fbbf24',
    ],
  },
);

// -- Theme D — `blueprint` (optional technical theme) -----------------------
// A deep-navy "drafting" theme: mono body font, cyan accent, dotted grid.
// Included to show the system's range while staying within the principles —
// quiet chrome, restrained color, one accent. Dark mode.
export const blueprint: Theme = build(
  {
    name: 'blueprint',
    mode: 'dark',
    fg:      t.palette.blueprintInk,
    muted:   t.palette.blueprintMuted,
    grid:    t.palette.blueprintLine,
    surface: t.palette.blueprintBg,
    border:  t.palette.blueprintLine,
    fontBody:  t.font.mono,
    fontTitle: t.font.mono,
    stroke:  t.stroke.thin,
    gridStyle: 'dotted',
    gridVertical: true, // technical grids read as graph paper — both axes
    accent:  t.palette.cyan,
  },
  {
    party: {
      Democrat:    '#60a5fa',
      Republican:  '#f87171',
      Independent: t.palette.blueprintMuted,
    },
    categorical: [
      t.palette.blueprintInk,
      t.palette.cyan,
      '#60a5fa',
      '#f87171',
      '#a3e635',
      '#fbbf24',
    ],
  },
);

// -- The registry -----------------------------------------------------------
export const themes = { editorial, newsprint, carbon, blueprint } as const;
export type ThemeName = keyof typeof themes;
export const defaultTheme = editorial;
