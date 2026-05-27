# Viz Theme System — Project Brief (READ FIRST)

You are working in the `ontopic-viz-components` repo: a **copy-in component registry**
(shadcn-style) where a `viz add` CLI copies chart components from `registry/` into a
consumer app's `viz/` tree. Components are built on **two rendering engines**:

- **Recharts** (React/SVG, declarative — colors & sizes are JSX props)
- **Observable Plot** (imperative JS — config is one options object per chart)

Plus composite dashboards and framework-agnostic `article/*` MDX components.

There is already a `registry/theme/` folder (tokens, fonts, Tailwind preset). Your job is
**not** to throw it away — it's to formalize a real theming layer that both engines can
share, and to ship a few built-in themes the way a UI library ships themes.

---

## The problem in one sentence

Today, charts hardcode their colors, fonts, and sizes inline (e.g.
`stroke="#000000"`, `fontSize: 12`, `text-gray-400`), so there is **no seam** a theme
can plug into, and the two engines can't be made to agree because they consume styling
through completely different surfaces.

## The goal

A single source of truth for design decisions that flows consistently across Recharts,
Observable Plot, and the CSS-driven UI/article components — plus **2–4 built-in themes**
a consumer can swap, exactly like swapping a UI component theme.

---

## Design principles (non-negotiable aesthetic intent)

This is a **modern, Tufte-inspired** system. Not a copy of Tufte — the spirit:

1. **Ink first, color second.** The default series color is near-black on white. High
   data-ink ratio. Color is *spent*, not sprinkled. A single-series chart should be
   monochrome.
2. **Color carries meaning.** When color appears, it should *mean* something — a party,
   a sentiment, a category the reader must distinguish. Decorative color is a smell.
3. **Quiet chrome.** Faint horizontal gridlines (often dashed, vertical lines removed),
   thin strokes, muted axis labels, no chart junk, no heavy borders.
4. **Restraint scales.** Multi-series charts reach for greys + one accent before a full
   categorical ramp. Only use the categorical cycle when categories genuinely lack a
   semantic mapping.
5. **Political/semantic variables are an overlay, not a theme.** "Democrat = blue,
   Republican = red" is a *semantic domain* that rides on top of any theme — see below.

> You have creative latitude **within** these principles. Tune exact hues, propose a
> fourth theme, pick serif vs. sans per theme. You do **not** have latitude to make the
> default loud, colorful, or grid-heavy.

---

## Architecture — four layers, each consuming only the one below

```
tokens.ts            raw values: named palette, sizes, fonts, strokes (NO meaning)
   ↓
semantic.ts          meaning → token: party, sentiment, categorical, ramps
   ↓                 + colorFor() resolver  (the load-bearing file)
themes.ts            a Theme = neutral foundation + typography + stroke/grid behavior
   ↓                 + accent + categorical + OPTIONAL semantic overrides
adapters/            recharts.ts (props/hook) + plot.ts (options merge)
   ↓                 both consume the ACTIVE theme via one React context
generate-css.ts      build step → theme.css custom properties for shadcn + article + dark
```

**Why this order matters:** semantic sits *above* raw tokens but *below* adapters so that
a Recharts line for "Democrat" and a Plot mark for "Democrat" both ask the same resolver
and get the same color. That single indirection is what makes "meaningful colors" and
"cross-library consistency" the *same mechanism* rather than two features.

Canonical home for tokens is the **TS object**. CSS variables are a **generated build
artifact** (Recharts and Plot can't reliably read CSS vars; shadcn/article can).

---

## Files you will create (under `registry/theme/`)

```
registry/theme/
├── tokens.ts          raw palette/sizes/fonts            (doc 01)
├── semantic.ts        domains + colorFor resolver         (doc 01)
├── themes.ts          built-in Theme objects + registry   (doc 02)
├── provider.tsx       VizThemeProvider + useVizTheme()     (doc 03)
├── adapters/
│   ├── recharts.ts    rcTheme + bound colorFor            (doc 03)
│   └── plot.ts        plotBase() + colorScale             (doc 03)
├── generate-css.ts    TS → theme.css generator (build)     (doc 03)
└── theme.css          GENERATED — do not hand-edit         (doc 03)
```

## Build order (phases)

| Phase | Doc | Output | Done when |
|---|---|---|---|
| 1 | `01-TOKENS-AND-SEMANTIC.md` | `tokens.ts`, `semantic.ts` | `colorFor` resolves party + falls back to categorical |
| 2 | `02-THEMES.md` | `themes.ts` (3 themes) | `themes.editorial / newsprint / carbon` typecheck |
| 3 | `03-ADAPTERS.md` | `provider.tsx`, adapters, `generate-css.ts` | both engines read the active theme via `useVizTheme()` |
| 4 | `04-RETROFIT-AND-VERIFY.md` | migrated example + tests | the shown timeseries chart renders themed in all 3 themes |

Work one phase at a time. Do not start retrofitting components before the provider exists.

---

## Guardrails (things that will break the registry if you get them wrong)

- **Do not break already-copied components.** Consumers may have `viz add`-ed charts
  last month. New theme consumption must be **additive** with sensible defaults — a
  component dropped into an app with **no** `VizThemeProvider` must still render (fall
  back to the `editorial` default theme). Build `useVizTheme()` to return the default
  theme when no provider is present.
- **Never auto-detect semantics from data.** Do not sniff `"Democrat"` out of category
  strings. A component declares its domain explicitly via a prop
  (`colorDomain="party"`), defaulting to `null` → categorical. Explicit beats clever.
- **Tokens are dumb data; adapters are the only smart per-engine code.** No engine-specific
  logic in `tokens.ts` or `semantic.ts`.
- **`theme.css` is generated.** Hand-edits get overwritten. Edit `tokens.ts` and re-run
  the generator.
- **Dark mode is two mechanisms wearing one name.** CSS `.dark` restyles chrome
  (shadcn/article) for free; charts must be told the mode via JS (the provider). Keep the
  dark chart colors and the CSS dark vars sourced from the *same* token object so they're
  provably identical — see doc 03.
- **Keep the theme copy-flow intact.** Theme is copied separately (`cp -r registry/theme`).
  Don't introduce imports from `registry/theme` into a path the CLI's dependency-walk
  won't follow. Components import from `@/viz/theme/*`.

---

## Deliverable at the end

1. The files above, implemented.
2. The shown `TimeSeriesChart` retrofitted as the reference migration (doc 04).
3. A side-by-side demo page rendering one Recharts chart **and** one Plot chart through
   all three themes, so inconsistency is *visible*.
4. A short `THEME-AUTHORING.md` you write, explaining how to add a 4th theme (so the
   pattern is documented for future contributors).

Proceed to `01-TOKENS-AND-SEMANTIC.md`.
