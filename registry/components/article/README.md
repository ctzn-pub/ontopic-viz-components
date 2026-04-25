# Article-layout component library

Components used by GSS articles to add visual structure around prose and
charts. All components are designed to live inside `<ArticleShell>`, which
wraps the article in a tinted page, prose-styled column, and shared
header/footer.

This README is the **API reference** — props, defaults, one example
each. For *when to reach for which component*, read the recipe doc:

> `~/.claude/skills/gss-article/references/layouts.md`

## Import

```tsx
import {
  Callout,
  TabSet, Tab,
  SmallMultiples, SmallMultiplesLegendItem,
  SideNote,
  KeyNumber,
  DataTable, DeltaCell,
  Quote,
  PullQuote,
  DropCap,
  SectionDivider,
  Annotation,
  Step,
} from '@/app/components/article';
```

`<ArticleShell>` also re-exports `Callout` directly so legacy MDX imports
keep working.

## Components

### `<Callout variant>`

Labelled, visually distinct block of prose. Four variants.

| Variant      | Color      | Default title         | Use for                                  |
| ------------ | ---------- | --------------------- | ---------------------------------------- |
| `caveat`     | amber      | "Methodological note" | survey mode shifts, data quality notes   |
| `definition` | gray       | (none)                | defining a term used in the section      |
| `finding`    | blue       | "Key finding"         | the one-sentence punchline of a section  |
| `aside`      | (no card)  | (none)                | conversational digression, italicized    |

Props:

- `variant?: 'caveat' | 'definition' | 'finding' | 'aside'` — default `'caveat'`.
- `title?: string` — overrides the default title. Pass `""` to suppress.
- `children: ReactNode` — the body of the callout.

```tsx
<Callout variant="caveat">
  Beginning in 2021, the GSS shifted to web-based interviewing. See{' '}
  <a className="underline" href="...">NORC MR135</a>.
</Callout>
```

### `<TabSet>` + `<Tab label>`

N tabs, one chart frame. Active tab has a 2px bottom border and bold weight.
Keyboard accessible: arrow keys cycle, Home/End jump.

`<TabSet>` props:

- `defaultIndex?: number` — initial selected tab. Default `0`.
- `ariaLabel?: string` — accessible label for the tablist.
- `children` — must be `<Tab>` elements; non-Tab children are ignored.

`<Tab>` props:

- `label: string` — tab trigger label.
- `children: ReactNode` — tab panel contents.

```tsx
<TabSet ariaLabel="Confidence by institution">
  <Tab label="Scientific community">
    <figure>
      <div className="not-prose"><TimeseriesLineChart data={consciData} ... /></div>
      <figcaption>Figure 1. ...</figcaption>
    </figure>
  </Tab>
  <Tab label="Medicine">
    <figure>
      <div className="not-prose"><TimeseriesLineChart data={conmedicData} ... /></div>
      <figcaption>Figure 2. ...</figcaption>
    </figure>
  </Tab>
</TabSet>
```

### `<SmallMultiples>` + `<SmallMultiplesLegendItem>`

Grid of compact charts with one shared legend, one shared source, and
(optionally) a shared y-axis. Use for 4–9 panels of identical shape.

The wrapper is intentionally light — no outer card, no shadow — so the
grid sits directly on the page tint. Each panel is framed with a thin
border and a small uppercase label. The whole grid reads as one figure.
The prose `###` heading above it should introduce the figure; the
component does not render its own title.

The wrapper threads `compact={true}` and (if `sharedY` is set)
`sharedYDomain` into each child chart automatically via
`React.cloneElement`. **Don't pass `compact` or `sharedYDomain` on the
inner charts** — the wrapper handles it.

`<SmallMultiples>` props:

- `columns?: 2 | 3 | 4` — grid columns at `lg:` breakpoint. Default `2`. `md:` gets `min(columns, 2)`. Mobile is always 1 column.
- `subtitle?: string` — optional secondary line above the grid. Use sparingly — the surrounding `###` heading is usually enough.
- `legend?: ReactNode` — shared legend rendered above the grid. If only one series across all panels, omit it — the panel labels carry it.
- `source: string` — **required** shared source line (rendered as a `<figcaption>` below the grid).
- `labels: string[]` — **required** per-panel labels in the same order as children. Small multiples without panel labels are illegible.
- `sharedY?: [number, number]` — shared y-axis domain across all panels. Set this whenever the panels share units, otherwise each panel auto-scales independently and the visual comparison breaks.

Children must be charts that accept `compact?: boolean` and
`sharedYDomain?: [number, number]` props (the timeseries chart does).

```tsx
<SmallMultiples
  columns={2}
  subtitle='% of US adults saying "a great deal" of confidence'
  legend={
    <>
      <SmallMultiplesLegendItem color="#2196f3" label="L/T High School" />
      <SmallMultiplesLegendItem color="#f44336" label="High School" />
      <SmallMultiplesLegendItem color="#4caf50" label="College" />
    </>
  }
  source="General Social Survey, 1973–2024"
  labels={['Scientific community', 'Education', 'Medicine', 'Press']}
  sharedY={[0, 70]}
>
  <TimeseriesLineChart data={consciData}   demographicGroups={[...]} demographic="Education" />
  <TimeseriesLineChart data={coneducData}  demographicGroups={[...]} demographic="Education" />
  <TimeseriesLineChart data={conmedicData} demographicGroups={[...]} demographic="Education" />
  <TimeseriesLineChart data={conpressData} demographicGroups={[...]} demographic="Education" />
</SmallMultiples>
```

### `<SideNote>`

Tufte-style margin annotation. On `lg:` and up: floats into the right
margin. Below `lg:`: collapses inline as an indented italic block.

Props:

- `label?: string` — small uppercase label above the note (e.g. "Definition").
- `children: ReactNode` — the note body.

Place inline within a paragraph. The float is on `clear-right` so multiple
sidenotes in a row stack vertically rather than overlap.

```tsx
<p>
  GSS asks about thirteen institutions in its <code>con*</code> battery.
  This article focuses on four.
  <SideNote label="On selection">
    The full battery is in the GSS codebook (1973–2024). We picked four where
    the diploma divide is most visible.
  </SideNote>
</p>
```

### `<KeyNumber>`

Large display of a single number with a label below. Magazine pattern.

Props:

- `value: string` — pre-formatted number, e.g. `"47.5"`. Use a string so
  the writer controls decimal places, commas, etc.
- `unit?: string` — e.g. `"points"`, `"%"`, `"million"`.
- `label: ReactNode` — caption below the number, ≤ ~20 words.
- `change?: string` — optional badge below the label. Sign determines color
  (`+` green, `-`/`−` red, otherwise neutral).
- `align?: 'left' | 'center'` — default `'left'`. Use `'center'` for the
  article's anchor number.

```tsx
<KeyNumber
  align="center"
  value="47.5"
  unit="points"
  label="Partisan gap on legal abortion 'for any reason' in 2024"
  change="+41 since 1977"
/>
```

### `<DataTable>` + `<DeltaCell>`

Small editorial table with tabular numerals, optional row highlighting,
and a `cellClass` callback for conditional cell coloring.

Props:

- `caption: string` — finding-style caption (italic, sm, gray-600).
- `columns: DataTableColumn[]` — `{ key, label, align?, format? }`.
- `rows: Record<string, unknown>[]` — table rows.
- `highlightRow?: number` — row index to bold.
- `cellClass?: (row, column, rowIndex) => string` — Tailwind classes per cell.

`<DeltaCell>` is a small helper for signed-change columns:

```tsx
{ key: 'gap_delta', label: 'Δ', format: (r) => <DeltaCell value={r.gap_delta} suffix="pp" /> }
```

```tsx
<DataTable
  caption="Table 1. The gap widened on three of four institutions and narrowed only on Press."
  highlightRow={3}
  columns={[
    { key: 'institution', label: 'Institution' },
    { key: 'gap_1973', label: '1973 gap' },
    { key: 'gap_2024', label: '2024 gap' },
    { key: 'delta', label: 'Δ', format: (r) => <DeltaCell value={r.delta} suffix="pp" /> },
  ]}
  rows={[
    { institution: 'Scientific community', gap_1973: 22, gap_2024: 33, delta: 11 },
    { institution: 'Education',            gap_1973: 18, gap_2024: 25, delta: 7 },
    { institution: 'Medicine',             gap_1973: 12, gap_2024: 18, delta: 6 },
    { institution: 'Press',                gap_1973: 15, gap_2024:  9, delta: -6 },
  ]}
  cellClass={(row, col) => {
    if (col.key !== 'delta') return '';
    const v = row.delta as number;
    if (v > 0) return 'text-red-700';   // gap widened — call it out red
    if (v < 0) return 'text-green-700'; // gap narrowed — call it out green
    return '';
  }}
/>
```

### `<Quote>`

Short attributed inline quotation. **Strict 25-word maximum** for
copyright safety.

Props:

- `author: string`, `work?: string`, `year?: string | number`.
- `children: ReactNode` — the quote body.

```tsx
<Quote author="Robert Putnam" work="Bowling Alone" year="2000">
  By almost every measure, Americans' direct engagement in politics and
  government has fallen steadily.
</Quote>
```

### `<PullQuote>`

Large decorative quote breaking the column. Quotes the *article itself*,
not an external source. Use at most once per article.

Props: `children: ReactNode`.

```tsx
<PullQuote>
  The diploma divide on confidence in science isn't just a gap — it's now
  the largest demographic cleavage on any institution in the GSS.
</PullQuote>
```

### `<DropCap>`

Wraps the first paragraph of an article. The first letter is rendered
large with the rest flowing around it. CSS-driven (see `globals.css`).
Use once per article, opening paragraph only.

Props: `children: ReactNode`.

```tsx
<DropCap>
  In 1973, when the General Social Survey first asked Americans whether they had a
  great deal of confidence in the scientific community, 37 percent said yes.
</DropCap>
```

### `<SectionDivider>`

Horizontal break for shifts within a section that don't warrant a new heading.

Props:

- `ornament?: string` — default `'* * *'`.

```tsx
<SectionDivider />
<SectionDivider ornament="§" />
```

### `<Annotation>`

Inline highlighted span with a hover/focus tooltip. Bridges prose to
chart numbers without breaking flow.

Props:

- `note: string` — tooltip text. Keep short.
- `children: ReactNode` — the highlighted phrase.

```tsx
<p>
  In 2024, the Democrat-Republican gap on "any reason" abortion stood at{' '}
  <Annotation note="Democratic support 80.6%, Republican 33.1% — see Figure 2.">
    47.5 points
  </Annotation>
  .
</p>
```

### `<Step>`

A single numbered-step block. Use inside a `<div>` or `<ol>` with sibling
`<Step>`s.

Props: `number: number`, `title: string`, `children: ReactNode`.

```tsx
<Step number={1} title="Read the level">
  Aggregate American opinion was essentially flat from 1977 to 2016, then
  rose 20 points in eight years.
</Step>
<Step number={2} title="Read the composition">
  Almost all of that rise came from one group: Democrats.
</Step>
```

## Chart `compact` + `sharedYDomain` props

`recharts/gss/timeseries-line-v1` accepts `compact?: boolean` and
`sharedYDomain?: [number, number]`. When `compact` is `true`, the chart:

- Drops the outer card chrome (no white card, no shadow, no padding).
- Hides its title block, source line, and CI toggle.
- Hides the Recharts `<Legend>` (the wrapper renders one shared legend).
- Hides the presidential reference bands and president labels (too noisy at panel size).
- Renders at reduced height (`200–220px` instead of `360px+`).
- Uses sparser x-ticks (every 20 years instead of every 5).
- Narrows the y-axis label width to claw back chart width.

When `sharedYDomain={[min, max]}` is set, the chart pins its y-axis to that
range instead of auto-scaling. This is what lets a row of panels line up
for visual comparison.

You almost never set these directly — `<SmallMultiples>` injects both via
`React.cloneElement`. Pass them only when rendering a compact chart
*outside* a SmallMultiples grid (rare).

```tsx
{/* Inside <SmallMultiples>: don't pass compact, the wrapper sets it */}
<TimeseriesLineChart data={consciData} demographicGroups={[...]} demographic="Education" />

{/* Outside, standalone compact (rare): pass them yourself */}
<TimeseriesLineChart compact sharedYDomain={[0, 70]} data={consciData} ... />
```

## Anti-patterns

These are documented in `layouts.md` in detail, but a quick punch list:

- **One callout per section, max.** Otherwise the page reads as decoration, not editorial.
- **One DropCap per article.** Always at the top.
- **One PullQuote per article.** Two compete.
- **TabSet for "compare across N options"; SmallMultiples for "see all N at once."** They're not interchangeable.
- **DataTable color must carry meaning.** Never decorative.
- **No `<Callout variant="finding">` without an actual finding sentence.** It's a callout, not a label.
- **Components are tools, not requirements.** If the article doesn't want a SectionDivider, don't add one.

## File layout

```
preview/app/components/
├── ArticleShell.tsx        # Shell + Callout re-export
└── article/
    ├── index.ts            # Barrel
    ├── Callout.tsx
    ├── TabSet.tsx
    ├── SmallMultiples.tsx
    ├── SideNote.tsx
    ├── KeyNumber.tsx
    ├── DataTable.tsx
    ├── Quote.tsx
    ├── PullQuote.tsx
    ├── DropCap.tsx
    ├── SectionDivider.tsx
    ├── Annotation.tsx
    ├── Step.tsx
    └── README.md           # This file
```
