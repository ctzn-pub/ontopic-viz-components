// registry/theme/tokens.ts
//
// Layer 1 of the viz theme system: raw, MEANINGLESS values. These are named
// raw materials only — `blue` is just a blue, not "Democrat". Themes (themes.ts)
// decide which raw values become the foreground, the accent, etc. The semantic
// layer (semantic.ts) decides which become "party" or "sentiment" colors.
//
// No engine-specific logic lives here. No React, no Recharts, no Plot.
//
// `as const` is required: it gives literal types so the semantic layer and the
// adapters get autocomplete and catch typos at compile time.

/**
 * Bump when the shape of tokens/themes changes in a way an already-copied
 * component might read. Components read this loosely (warn, don't throw) so a
 * consumer that `viz add`-ed a new component against an old copied theme
 * degrades gracefully instead of crashing. See provider.tsx.
 */
export const THEME_SCHEMA_VERSION = 1;

export const tokens = {
  palette: {
    // neutrals — cool grey ramp
    ink:     '#1a1a1a',
    gray700: '#374151',
    gray500: '#6b7280',
    gray400: '#9ca3af',
    gray200: '#e5e7eb',
    gray100: '#f3f4f6',
    white:   '#ffffff',
    // warm neutrals (for the Newsprint theme)
    paper:    '#faf8f5',
    warmInk:  '#2b2926',
    warmGray: '#8a857d',
    warmLine: '#e8e3db',
    // dark neutrals (for Carbon / dark mode)
    carbon:      '#0c0c0d',
    carbonInk:   '#f4f4f5',
    carbonMuted: '#a1a1aa',
    carbonLine:  '#27272a',
    // blueprint neutrals (for the optional technical theme)
    blueprintBg:    '#0b1f33',
    blueprintInk:   '#e6f1ff',
    blueprintMuted: '#7da2c4',
    blueprintLine:  '#1c3a57',
    // accents — used judiciously, one at a time
    blue:       '#1d4ed8',
    blueBright: '#3b82f6',
    cyan:       '#22d3ee',
    red:        '#c53030',
    brick:      '#a23c2c',
    green:      '#15803d',
    amber:      '#b45309',
    purple:     '#6d28d9',
    slate:      '#4a6b82',
    // semantic-grade political pair (slightly desaturated, map-friendly)
    demBlue: '#2b6cb0',
    repRed:  '#c53030',
    indGray: '#718096',
    // ramps
    blueRamp: ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'],
    rdBu:     ['#b2182b', '#ef8a62', '#f7f7f7', '#67a9cf', '#2166ac'], // diverging
  },
  font: {
    sans:  'Geist, system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono:  '"Geist Mono", ui-monospace, monospace',
  },
  size: {
    axisTick:   12,
    axisLabel:  13,
    title:      22,
    subtitle:   14,
    annotation: 11,
    source:     12,
  },
  stroke: {
    hairline: 1,
    thin:     1.25,
    regular:  1.5,
    thick:    2.5,
  },
  dot: { sm: 2, md: 3, lg: 5 },
  radius: 4,
} as const;

export type Tokens = typeof tokens;
