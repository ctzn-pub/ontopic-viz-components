# 01 — Tokens & Semantic Layer (Phase 1)

Goal: the bottom two layers. After this phase, `colorFor('party', 'Democrat')` returns a
blue and `colorFor(null, 'whatever', 3)` returns a stable position in the categorical
cycle. No engine code yet.

---

## `registry/theme/tokens.ts` — raw, meaningless values

These are named raw materials. **No meaning is attached here** — `blue600` is just a
blue, not "Democrat." Themes (doc 02) decide which raw values become the foreground, the
accent, etc.

```ts
// registry/theme/tokens.ts
export const tokens = {
  palette: {
    // neutrals — cool grey ramp
    ink:    '#1a1a1a',
    gray700:'#374151', gray500:'#6b7280', gray400:'#9ca3af',
    gray200:'#e5e7eb', gray100:'#f3f4f6', white:'#ffffff',
    // warm neutrals (for the Newsprint theme)
    paper:  '#faf8f5', warmInk:'#2b2926', warmGray:'#8a857d', warmLine:'#e8e3db',
    // dark neutrals (for Carbon / dark mode)
    carbon: '#0c0c0d', carbonInk:'#f4f4f5', carbonMuted:'#a1a1aa', carbonLine:'#27272a',
    // accents — used judiciously, one at a time
    blue:   '#1d4ed8', blueBright:'#3b82f6',
    red:    '#c53030', brick:'#a23c2c',
    green:  '#15803d', amber:'#b45309', purple:'#6d28d9', slate:'#4a6b82',
    // semantic-grade political pair (slightly desaturated, map-friendly)
    demBlue:'#2b6cb0', repRed:'#c53030', indGray:'#718096',
    // ramps
    blueRamp: ['#eff6ff','#bfdbfe','#60a5fa','#2563eb','#1e3a8a'],
    rdBu:     ['#b2182b','#ef8a62','#f7f7f7','#67a9cf','#2166ac'], // diverging
  },
  font: {
    sans:  'Geist, system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono:  '"Geist Mono", ui-monospace, monospace',
  },
  size: { axisTick: 12, axisLabel: 13, title: 22, subtitle: 14, annotation: 11, source: 12 },
  stroke: { hairline: 1, thin: 1.25, regular: 1.5, thick: 2.5 },
  dot: { sm: 2, md: 3, lg: 5 },
  radius: 4,
} as const;

export type Tokens = typeof tokens;
```

`as const` is required — it gives literal types so the semantic layer and adapters get
autocomplete and catch typos at compile time.

---

## `registry/theme/semantic.ts` — meaning → token, plus the resolver

Two **distinct** kinds of semantic color. Do not conflate them:

- **Fixed lookups** — categories with a *correct* color that must never drift
  (party, sentiment, yes/no). These are maps.
- **Scales** — encodings where color is arbitrary-but-consistent
  (an N-group cycle, a sequential ramp). Arrays.

```ts
// registry/theme/semantic.ts
import { tokens as t } from './tokens';

export type SemanticDomain = 'party' | 'sentiment';

// DEFAULT semantic definitions. A theme MAY override these (doc 02) to stay tonally
// consistent — e.g. Newsprint uses muted brick/slate for party.
export const defaultSemantic = {
  party: {
    Democrat:    t.palette.demBlue,
    Republican:  t.palette.repRed,
    Independent: t.palette.indGray,
    Other:       t.palette.purple,
  },
  sentiment: {
    positive: t.palette.green,
    neutral:  t.palette.gray500,
    negative: t.palette.red,
  },
  // arbitrary-but-stable cycle for categories WITHOUT a semantic mapping.
  // Tufte-restrained: ink first, then greys, then accents.
  categorical: [
    t.palette.ink, t.palette.gray500, t.palette.blue,
    t.palette.red, t.palette.green, t.palette.amber, t.palette.purple,
  ],
  sequential: t.palette.blueRamp,
  diverging:  t.palette.rdBu,
} as const;

export type SemanticMap = {
  party: Record<string, string>;
  sentiment: Record<string, string>;
  categorical: readonly string[];
  sequential: readonly string[];
  diverging: readonly string[];
};

// Merge a theme's optional overrides onto the defaults. Shallow per-domain merge so a
// theme can override just `party` without redeclaring everything.
export function mergeSemantic(
  overrides?: Partial<{ party: Record<string,string>; sentiment: Record<string,string>;
                        categorical: string[]; sequential: string[]; diverging: string[] }>
): SemanticMap {
  if (!overrides) return defaultSemantic as unknown as SemanticMap;
  return {
    party:       { ...defaultSemantic.party,     ...(overrides.party ?? {}) },
    sentiment:   { ...defaultSemantic.sentiment, ...(overrides.sentiment ?? {}) },
    categorical: overrides.categorical ?? [...defaultSemantic.categorical],
    sequential:  overrides.sequential  ?? [...defaultSemantic.sequential],
    diverging:   overrides.diverging   ?? [...defaultSemantic.diverging],
  };
}
```

### The resolver — the single most important function in the system

Every chart calls this instead of touching a color literal. It is what makes "meaningful
where meaning exists, consistent where it doesn't" a single code path.

```ts
// still in semantic.ts

/**
 * Resolve a color for a category.
 * @param sem      merged semantic map (from the active theme)
 * @param domain   'party' | 'sentiment' | null. null → use categorical cycle.
 * @param category the category label (e.g. "Democrat", "EducationLevel:HS")
 * @param index    series index — used for the categorical fallback only
 */
export function colorFor(
  sem: SemanticMap, domain: SemanticDomain | null, category: string, index = 0
): string {
  if (domain && category in sem[domain]) return sem[domain][category];
  // graceful fallback: unknown category → stable position in the categorical cycle
  return sem.categorical[index % sem.categorical.length];
}

/** Whole-series-at-once (Plot wants a domain→range pairing). */
export function colorScale(
  sem: SemanticMap, domain: SemanticDomain | null, categories: string[]
): { domain: string[]; range: string[] } {
  return { domain: categories, range: categories.map((c, i) => colorFor(sem, domain, c, i)) };
}
```

---

## Why the fallback is the whole point

`timeseries-line-v1` gets `demographic="PolParty"` → you map that to `colorDomain="party"`
→ Democrat is blue everywhere, in both engines. The **same component** fed
`demographic="EducationLevel"` (no semantic map) falls through to the stable categorical
cycle and still looks right. One path, both cases.

The single-series chart shown in doc 04 passes `colorDomain={null}` and index `0`, so it
gets `categorical[0]` — which is **ink (near-black)**. That's the Tufte default falling
out of the same machine for free.

## Do / Don't

- **Do** make `domain` an explicit prop on components. **Don't** infer it from the data.
- **Do** keep `Independent`/`Other` in the party map so three-party charts resolve fully.
- **Don't** put any Recharts or Plot import in this file. It is pure data + functions.

## Phase 1 acceptance

```ts
import { mergeSemantic, colorFor } from './semantic';
const sem = mergeSemantic();           // defaults
colorFor(sem, 'party', 'Democrat');    // → '#2b6cb0'
colorFor(sem, 'party', 'Green Party'); // → categorical[0] = ink (unknown party label)
colorFor(sem, null, 'foo', 0);         // → ink
colorFor(sem, null, 'bar', 1);         // → gray500
```

Proceed to `02-THEMES.md`.
