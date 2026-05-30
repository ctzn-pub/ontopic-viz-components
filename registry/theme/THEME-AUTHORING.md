# Authoring a viz theme

This is the viz **chart** theme system — a single source of truth for design
decisions (color, type, stroke, grid) that flows consistently across Recharts,
Observable Plot, and the CSS-driven chrome. It is modern-Tufte by intent: ink
first, color second, quiet chrome. Read [00-OVERVIEW](../../../design/00-OVERVIEW.md)
for the philosophy; this file is the how-to for adding a theme.

> Not to be confused with `theme.css` + `tailwind-preset.ts` + `fonts.ts` in
> this folder, which are the **article typography** bundle (prose/`--color-*`).
> The chart theme system is `tokens.ts` → `semantic.ts` → `themes.ts` →
> `provider.tsx` → `adapters/`, with `viz-theme.css` as a generated artifact.

## The four layers

```
tokens.ts      raw values: palette, sizes, fonts, strokes        (NO meaning)
   ↓
semantic.ts    meaning → token: party, sentiment, categorical ramps
   ↓           + colorFor() / colorScale() resolvers
themes.ts      a Theme = neutral foundation + type + stroke/grid
   ↓           + accent + OPTIONAL semantic overrides
provider.tsx   useVizTheme() — both engines read the active theme
adapters/      recharts.ts (props bundle) + plot.ts (options merge)
generate-css.ts → viz-theme.css (CSS vars for shadcn/article chrome + .dark)
```

A chart **never** writes a color literal. It calls `colorFor(domain, category,
index)` (Recharts) or `colorScale(domain, categories)` (Plot), both bound to the
active theme by `useVizTheme()`. That single indirection is what makes
"meaningful colors" and "cross-library consistency" the same mechanism.

## Add a theme in 4 steps

Say you want a `slate` theme — cool, low-contrast, dashed grid.

### 1. (Only if needed) add raw values to `tokens.ts`

Tokens are meaningless named materials. Reuse existing ones where you can; add a
neutral ramp only if your theme needs hues that don't exist yet.

```ts
// tokens.ts — palette
slateBg: '#f1f5f9', slateInk: '#1e293b', slateMuted: '#64748b', slateLine: '#e2e8f0',
```

### 2. Build the `Theme` in `themes.ts`

Use the `build()` helper. The second argument is **optional** semantic overrides
— a shallow per-domain merge, so override only what must change tonally
(everything else is inherited from `defaultSemantic`).

```ts
export const slate: Theme = build({
  name: 'slate',
  mode: 'light',
  fg:      t.palette.slateInk,
  muted:   t.palette.slateMuted,
  grid:    t.palette.slateLine,
  surface: t.palette.slateBg,
  border:  t.palette.slateLine,
  fontBody:  t.font.sans,
  fontTitle: t.font.sans,
  stroke:  t.stroke.thin,
  gridStyle: 'dashed',     // 'solid' | 'dashed' | 'dotted' | 'none'
  gridVertical: false,
  accent:  t.palette.blue,
}, {
  // optional: keep party tonally consistent with the palette
  party: { Democrat: t.palette.slate, Republican: t.palette.brick },
});
```

### 3. Register it

```ts
export const themes = { editorial, times, ft, economist, bloomberg, slate } as const;
```

`ThemeName` and the provider pick it up automatically. `defaultTheme` stays
`editorial` (the no-provider fallback) unless you deliberately change it.

### 4. Regenerate the CSS

```bash
pnpm theme:css      # rewrites viz-theme.css with a :root / .dark / [data-viz-theme="…"] block per theme
```

Then verify:

```bash
pnpm theme:check    # typechecks the theme layer + retrofitted components
pnpm test           # contract test: every theme resolves every domain in both engine paths
```

## The map engine reads the same theme (no extra wiring)

The MapLibre choropleth engine (`adapters/maplibre.ts` + `scales.ts`, see
[05-MAP-ENGINE](../../../design/05-MAP-ENGINE.md)) is a **third consumer of the
same `Theme` object** — adding a theme themes the maps too, for free. There is no
separate map palette to maintain.

**Basemap chrome is derived, not authored.** `mlTheme(theme)` turns the fields you
already set in step 2 into the map's non-semantic chrome:

| Map chrome      | Comes from        | Notes                                            |
|-----------------|-------------------|--------------------------------------------------|
| background      | `theme.surface`   | the map root fill                                |
| boundary line   | `theme.border`    | hairline; auto-thickened on dark (`theme.mode`)  |
| boundary hover  | `theme.fg`        | the emphasized outline under the cursor          |
| labels (opt-in) | `theme.muted` + `theme.surface` halo + `theme.fontBody` | off by default |

So a new theme needs **nothing** map-specific as long as `surface`, `border`,
`fg`, `muted`, and `mode` are set — which they already are for charts.

**The choropleth fill + legend use the continuous ramps.** A choropleth is not
categorical; it reads `theme.semantic.sequential` (the blue ramp) and
`theme.semantic.diverging` (rdBu) through `scaleFor(spec)`. To re-tone maps for a
theme, override those ramps in the **same** semantic-overrides arg from step 2:

```ts
export const slate: Theme = build({ /* …foundation… */ }, {
  sequential: ['#f8fafc', '#cbd5e1', '#94a3b8', '#475569', '#1e293b'], // 5 anchors
  diverging:  ['#b45309', '#fcd9a8', '#f1f5f9', '#a8c7e8', '#1d4ed8'], // 5 anchors, center neutral
});
```

Keep ramps at **5 anchors**: every engine interpolates over identical stops, which
is what stops d3's Lab and MapLibre's RGB interpolation from drifting apart (the
`maplibre-contract.test.ts` guard fails if the fill's anchors stop matching the
ramp). Leave the ramps unset to inherit the defaults — most themes should.

**Verify map contrast, especially on dark.** `bloomberg` paints light boundaries on a
dark `surface`; confirm the hairline (`border`) and the legend text (`muted`/`fg`)
clear contrast against `surface` in every theme. The side-by-side demo
(`__demo__/theme-demo.tsx`) renders a live NYC choropleth panel per theme for
exactly this eyeball check.

## Rules that keep the system honest

- **Keep the default quiet.** `editorial` must stay near-black-on-white with one
  faint dashed horizontal grid. If it ever looks colorful or grid-heavy, it's
  wrong. Single-series charts should be monochrome.
- **Color carries meaning.** When color appears it should *mean* something
  (party, sentiment). Decorative color is a smell. Multi-series reaches for
  greys + one accent before a full categorical ramp.
- **Tokens are dumb data; adapters are the only engine-aware code.** No Recharts
  or Plot import in `tokens.ts`, `semantic.ts`, or `themes.ts`.
- **`viz-theme.css` is generated.** Hand-edits get overwritten. Edit
  `tokens.ts`/`themes.ts` and re-run `pnpm theme:css`.
- **Dark mode is two mechanisms.** CSS `.dark` restyles chrome for free; charts
  must be told the mode via JS (give the provider a `mode: 'dark'` theme). Both
  the `.dark` CSS block and the dark chart colors come from the *same* theme
  object, so they can't drift. Wire app dark mode to the provider:
  ```tsx
  <VizThemeProvider theme={isDark ? 'bloomberg' : 'editorial'}>…</VizThemeProvider>
  ```
- **Backwards-compatible by default.** A component dropped into an app with **no**
  `<VizThemeProvider>` still renders — `useVizTheme()` returns `editorial`. An
  unknown theme name falls back with a console warning, never a crash. See
  `THEME_SCHEMA_VERSION` in `tokens.ts`.

## Semantic overrides cheat-sheet

`mergeSemantic` (in `semantic.ts`) is a **shallow per-domain** merge:

| You override        | You also get (inherited)                          |
|---------------------|---------------------------------------------------|
| `party`             | the other party members you didn't name + all of `sentiment`, `sequential`, `diverging` |
| `categorical`       | replaces the whole cycle (it's an array, not merged) |
| nothing             | the full `defaultSemantic`                        |

Override `party` when your palette needs tonal harmony (Times/FT/Economist
re-tone Democrat/Republican per masthead; Bloomberg brightens them for dark).
Leave it alone otherwise — the editorial default blue/red reads on light themes.
