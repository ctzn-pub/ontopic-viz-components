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

    // ── Times — NYT-inspired ────────────────────────────────────────────────
    // Hairline ink on white, RNC/DNC primaries, judicious accent.
    timesInk:    '#121212',
    timesMuted:  '#666',
    timesLine:   '#ddd',
    timesPaper:  '#ffffff',
    timesDem:    '#0F4D92',  // NYT-style cool navy blue for Democrats
    timesRep:    '#B30000',  // NYT-style brick red for Republicans
    timesAccent: '#326891',  // their feature blue
    // Sequential = single-hue ramp suited to choropleths.
    nytRamp:     ['#FAFAFA', '#C7DCEA', '#7AA9D0', '#326891', '#0F4D92'],
    // Diverging = NYT's signature red-vs-blue. Saturated endpoints, neutral mid.
    nytDiverg:   ['#B30000', '#E07A6E', '#FAFAFA', '#7AA9D0', '#0F4D92'],

    // ── FT — Financial Times pink-paper system ──────────────────────────────
    ftPaper:     '#FFF1E5',  // the actual FT salmon
    ftInk:       '#33302E',  // their charcoal
    ftMuted:     '#66605C',
    ftLine:      '#E9DDD0',
    ftAccent:    '#0F5499',  // FT signature blue
    ftClaret:    '#990F3D',  // FT signature claret/maroon
    ftTeal:      '#0D7680',  // FT teal
    // Sequential = claret-deepening on cream paper.
    ftRamp:      ['#FFEBDD', '#F0B9A5', '#D45E5E', '#990F3D', '#5C0822'],
    // Diverging = saturated teal -> off-white -> saturated claret. Recognizably FT.
    ftDiverg:    ['#0D7680', '#5BA3A8', '#FFF8EE', '#D45E5E', '#990F3D'],

    // ── Economist — single-red emphasis system ──────────────────────────────
    econPaper:    '#E9EDF0',  // their characteristic cool grey-blue surface
    econInk:      '#121317',
    econMuted:    '#6E7479',
    econLine:     '#C8CFD4',
    econRed:      '#E3120B',  // Economist red
    econAccent:   '#006BA2',  // Economist blue
    econDeepRed:  '#9E0306',
    // Sequential = red-deepening from light to the Economist red.
    econRamp:     ['#F4F6F8', '#F5BBB4', '#E3120B', '#9E0306', '#5C0205'],
    // Diverging = Economist blue -> light grey-blue -> Economist red. Saturated.
    econDiverg:   ['#006BA2', '#7CB7D0', '#FFFFFF', '#F08881', '#E3120B'],

    // ── Bloomberg / Terminal — dark amber-on-black ──────────────────────────
    bloombergBg:    '#0A0A0B',
    bloombergInk:   '#F5F5F5',
    bloombergMuted: '#7A7A7A',
    bloombergLine:  '#2A2A2A',
    bloombergAmber: '#FFB000',  // signature amber
    bloombergCyan:  '#00D0FF',
    bloombergMag:   '#FF6FAF',
    // Sequential = deep amber -> bright amber on black.
    bloombergRamp:  ['#3A2A00', '#7A5800', '#B58400', '#FFB000', '#FFE082'],
    // Diverging = bright magenta -> mid grey (so it's distinguishable from
    // the black surface) -> bright cyan. Saturated endpoints.
    bloombergDiverg:['#FF6FAF', '#C97A99', '#3F3F46', '#7AB4D0', '#00D0FF'],

    // ── Observatory — dark data-atlas ledger ────────────────────────────────
    // Tokenized from the health-of-americas-zip-codes "Observatory Ledger"
    // (web/app/globals.css + web/lib/colors.ts). Near-black blue-cast surface,
    // serif display over sans body, warm/cool accent pair, gold instrument
    // needle. Ramps are ColorBrewer YlOrRd (sequential burden) and RdBu
    // (diverging gap) — luminance-ordered, grayscale-legible, CVD-resilient.
    obsBg:     '#070a11',
    obsPanel:  '#0d1420',  // card / chart surface
    obsPanel2: '#121a29',  // nested surface
    obsInk:    '#edf1f7',
    obsInk2:   '#a9b6c8',
    obsMuted:  '#78879c',
    obsGrid:   '#222d3d',
    obsAccent: '#f4685e',  // warm — worse / high-burden
    obsCool:   '#6cb6ff',  // cool — better / links
    obsGold:   '#e8c468',  // editorial highlight / instrument needle
    obsGood:   '#4fc99a',
    obsNodata: '#5d6675',
    obsBench:  '#9aa6b8',  // benchmark reference line (light slate)
    obsHalo:   '#0c1420',  // halo behind selected marks
    // Sequential = low -> high burden (YlOrRd).
    obsRamp:   ['#ffffcc', '#fed976', '#fd8d3c', '#f03b20', '#bd0026'],
    // Diverging = better-than-benchmark (cool) -> neutral -> worse (warm). RdBu
    // reversed relative to the default rdBu so "worse" reads warm.
    obsDiverg: ['#2166ac', '#67a9cf', '#f7f7f7', '#ef8a62', '#b2182b'],
  },
  font: {
    // Font stacks resolve through CSS vars set by the consumer app (next/font
    // in ctzn-pub) with the real font name as the var() fallback, so the same
    // tokens work in plain Vite (the preview app) or any non-Next consumer.
    // IMPORTANT: a var() with NO fallback invalidates the whole font-family
    // declaration when the variable is undefined — always keep the fallback
    // inside var().
    sans:  'var(--font-inter, Inter), system-ui, sans-serif',
    serif: 'var(--font-source-serif, "Source Serif 4"), Georgia, serif',
    mono:  'var(--font-jetbrains-mono, "JetBrains Mono"), ui-monospace, monospace',
    // Editorial-press type stacks. Each maps to a real loaded web font with
    // sensible system fallbacks. Loaded by the consumer (ctzn-pub app/layout.tsx;
    // the preview app loads them from Google Fonts in index.html).
    //   Times titles → DM Serif Display (high-contrast NYT-style display serif)
    //   Times body   → Libre Franklin (Franklin-Gothic-equivalent)
    //   FT titles    → Source Serif 4 (closest open serif to Financier)
    //   FT body      → Inter (closest open sans to MetricWeb)
    //   Econ titles  → Inter heavyweight (Officina-Sans-equivalent)
    //   Econ body    → Inter
    //   Bloomberg    → Inter (closest open sans to AvenirNext at terminal scale)
    timesSerif: 'var(--font-dm-serif, "DM Serif Display"), Georgia, "Times New Roman", serif',
    timesSans:  'var(--font-libre-franklin, "Libre Franklin"), "Franklin Gothic Medium", Arial, sans-serif',
    ftSerif:    'var(--font-source-serif, "Source Serif 4"), Georgia, serif',
    ftSans:     'var(--font-inter, Inter), system-ui, sans-serif',
    econSans:   'var(--font-inter, Inter), system-ui, sans-serif',
    econSerif:  'var(--font-source-serif, "Source Serif 4"), Georgia, serif',
    bloombergSans: 'var(--font-inter, Inter), system-ui, sans-serif',
    // Observatory Ledger stacks (dark data-atlas look from health-of-americas)
    obsSerif: 'var(--font-fraunces, Fraunces), Georgia, "Times New Roman", serif',
    obsSans:  'var(--font-archivo, Archivo), ui-sans-serif, system-ui, sans-serif',
    obsMono:  'var(--font-plex-mono, "IBM Plex Mono"), ui-monospace, "SF Mono", Menlo, monospace',
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
