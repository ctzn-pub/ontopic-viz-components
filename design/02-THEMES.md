# 02 — Themes (Phase 2)

Goal: define the `Theme` shape and ship **three** built-in themes. A theme is the
*foundation* (neutrals, typography, stroke/grid behavior) plus a restrained accent and
categorical ramp, plus **optional** semantic overrides. Semantic domains (party,
sentiment) come from doc 01 and are theme-independent **unless** a theme overrides them.

This is the creative core of the project. The three below are a strong starting set; you
may tune hues and propose a fourth, but keep the defaults quiet (see principles in doc 00).

---

## The `Theme` type

```ts
// registry/theme/themes.ts
import { tokens as t } from './tokens';
import { mergeSemantic, SemanticMap } from './semantic';

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  // neutral foundation
  fg: string;        // primary ink (default series color, titles)
  muted: string;     // axis labels, source line, secondary text
  grid: string;      // gridline color
  surface: string;   // chart/tooltip background
  border: string;    // tooltip / table border
  // typography
  fontBody: string;  // axis ticks, labels, body
  fontTitle: string; // title/subtitle (may differ — e.g. serif headings)
  // line/mark behavior
  stroke: number;    // default series stroke width
  gridStyle: 'solid' | 'dashed' | 'none';
  gridVertical: boolean;
  // emphasis
  accent: string;    // the ONE color used for emphasis when not semantic
  // resolved semantic map (defaults merged with this theme's overrides)
  semantic: SemanticMap;
}

// helper so each theme declaration stays terse
function build(base: Omit<Theme, 'semantic'>, semOverrides?: Parameters<typeof mergeSemantic>[0]): Theme {
  return { ...base, semantic: mergeSemantic(semOverrides) };
}
```

---

## Theme A — `editorial` (DEFAULT)

Tufte-forward, monochrome ink on white. This is what a component renders with when there
is no provider. Single-series charts are pure black. Color appears only via semantic
domains or a sparingly-used accent.

```ts
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
```

## Theme B — `newsprint`

Warm muted editorial — paper-cream background, warm charcoal ink, serif headings, a
slightly higher tolerance for color but kept *desaturated*. Party colors are overridden
to muted brick/slate so they sit in the warm palette instead of screaming.

```ts
export const newsprint: Theme = build({
  name: 'newsprint',
  mode: 'light',
  fg:      t.palette.warmInk,
  muted:   t.palette.warmGray,
  grid:    t.palette.warmLine,
  surface: t.palette.paper,
  border:  t.palette.warmLine,
  fontBody:  t.font.sans,
  fontTitle: t.font.serif,     // newspaper-style headings
  stroke:  t.stroke.regular,   // 1.5
  gridStyle: 'solid',
  gridVertical: false,
  accent:  t.palette.brick,
}, {
  // tonal overrides so semantic colors match the warm palette
  party: { Democrat: t.palette.slate, Republican: t.palette.brick, Independent: t.palette.warmGray },
  categorical: [t.palette.warmInk, t.palette.slate, t.palette.brick,
                t.palette.amber, t.palette.warmGray],
});
```

## Theme C — `carbon` (dark)

High-contrast dark theme. Doubles as the **dark-mode demonstration**: it proves the
JS-threaded mode path works for charts (CSS `.dark` alone can't reach Recharts/Plot).
Accents brighten so they read on the dark surface.

```ts
export const carbon: Theme = build({
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
}, {
  party: { Democrat: t.palette.blueBright, Republican: '#f87171', Independent: t.palette.carbonMuted },
  categorical: [t.palette.carbonInk, t.palette.carbonMuted, t.palette.blueBright,
                '#f87171', '#4ade80', '#fbbf24'],
});
```

---

## The registry

```ts
export const themes = { editorial, newsprint, carbon } as const;
export type ThemeName = keyof typeof themes;
export const defaultTheme = editorial;
```

---

## Notes for you (the implementer)

- **Default must be quiet.** If `editorial` ever looks colorful or grid-heavy, it's wrong.
  Verify by rendering the single-series chart from doc 04 — it should be black-on-white
  with one faint dashed horizontal grid.
- **Semantic override merge is shallow per-domain** (doc 01's `mergeSemantic`): Newsprint
  overrides `party` and `categorical` but inherits `sentiment`, `sequential`, `diverging`.
  That's intentional — only override what needs to change tonally.
- **Optional 4th theme (your call):** a "blueprint"/technical theme (mono font, cyan
  accent, dotted grid) could be a nice addition to show range. Keep it within principles.
- Keep themes **data-only** (no React, no Plot). The provider (doc 03) selects one.

## Phase 2 acceptance

```ts
import { themes, defaultTheme } from './themes';
themes.editorial.semantic.party.Democrat;  // '#2b6cb0'
themes.newsprint.semantic.party.Democrat;  // '#4a6b82' (slate override)
themes.carbon.mode;                          // 'dark'
defaultTheme.name;                           // 'editorial'
```

Proceed to `03-ADAPTERS.md`.
