# 04 — Retrofit & Verify (Phase 4)

Goal: prove the system on a real component, then lock it with tests and a visual diff. The
reference migration is the **single-series `TimeSeriesChart`** (the one with the hardcoded
black line) because it exercises the Tufte default; the multi-series note at the end shows
the semantic-color path.

---

## Before — what's hardcoded in the current component

Inventory the seams (every one of these must become theme-driven):

| Inline value (current) | Becomes |
|---|---|
| `stroke="#000000"` (Line) | `rc.fg` via `colorFor(null, 'value', 0)` → ink |
| `dot={{ r: 3, fill: "#000000" }}` | `fill: lineColor` |
| `<ErrorBar stroke="#000000" />` | `stroke={lineColor}` |
| `<CartesianGrid strokeDasharray="3 3" vertical={false} />` | spread `rc.grid` |
| `tick={{ fontSize: 12 }}` (XAxis) | `tick={rc.axisTick}` |
| `text-2xl font-bold` (title) | `style={rc.titleStyle}` |
| `text-gray-600` (subtitle) | `style={rc.subtitleStyle}` |
| `text-gray-400` (source) | `style={rc.sourceStyle}` |
| tooltip `bg-white border-gray-200`, `text-blue-600`, `text-gray-600` | `rc.tooltip` + `rc.fg`/`rc.muted` |

**Do not change** the data handling (year parsing, duplicate-year guard, CI = `1.96 *
standard_error`, the YAxis prefix/suffix formatter). Theming is orthogonal to those.

---

## After — migrated component

Only the styling changes. New/changed lines marked `// ★`.

```tsx
'use client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ErrorBar, CartesianGrid,
} from 'recharts';
import { useVizTheme } from '@/viz/theme/provider';          // ★

// ...interfaces unchanged (DataPoint, DataPointMetadataItem, TimeSeriesMetadata)...

interface TimeSeriesChartProps {
  data: DataPoint[];
  metadata: TimeSeriesMetadata;
  dataPointMetadata: DataPointMetadataItem[];
  colorDomain?: 'party' | 'sentiment' | null;               // ★ explicit, defaults null
}

export default function TimeSeriesChart({
  data, metadata, dataPointMetadata, colorDomain = null,    // ★
}: TimeSeriesChartProps) {
  const { rc, colorFor } = useVizTheme();                    // ★
  const lineColor = colorFor(colorDomain, 'value', 0);       // ★ null → ink (Tufte default)

  const numericData = data.map((d) => ({ ...d, year: parseInt(d.year, 10) }));
  const valueMetadata = dataPointMetadata.find((d) => d.id === 'value');

  const dataYears = numericData.map((d) => d.year);
  if (dataYears.length !== new Set(dataYears).size) {
    console.warn('Duplicate years found in the data prop!');
    return <div>Error: Duplicate years detected in the dataset.</div>;
  }
  const minYear = Math.min(...numericData.map((d) => d.year));
  const maxYear = Math.max(...numericData.map((d) => d.year));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const dp = payload[0].payload;
    return (
      <div style={{ ...rc.tooltip, padding: 12, borderRadius: 8 }}>   {/* ★ */}
        <p style={{ fontWeight: 500, color: rc.fg }}>{`Year: ${label}`}</p>
        <p style={{ color: lineColor }}>                              {/* ★ matches the line */}
          {`${valueMetadata?.name}: ${dp.value.toFixed(1)}${valueMetadata?.value_suffix || ''}`}
        </p>
        {dp.ci_lower && dp.ci_upper && (
          <p style={{ color: rc.tooltip.color, fontSize: 12 }}>
            {`95% CI: [${dp.ci_lower.toFixed(1)}, ${dp.ci_upper.toFixed(1)}]${valueMetadata?.value_suffix || ''}`}
          </p>
        )}
        {dp.n_actual && (
          <p style={{ color: rc.tooltip.color, fontSize: 12 }}>{`N: ${dp.n_actual.toLocaleString()}`}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ background: rc.surface }}>      {/* ★ */}
      <div className="mb-2">
        <h2 style={{ ...rc.titleStyle, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>  {/* ★ */}
          {metadata.title}
        </h2>
        <p style={{ ...rc.subtitleStyle, marginBottom: 8 }}>{metadata.subtitle}</p>        {/* ★ */}
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={numericData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid
              stroke={rc.grid.stroke}                                {/* ★ */}
              strokeDasharray={rc.grid.strokeDasharray}              {/* ★ */}
              vertical={rc.grid.vertical}                            {/* ★ */}
              horizontal={!rc.grid.hide}                             {/* ★ */}
            />
            <XAxis
              dataKey="year" type="number" domain={[minYear, maxYear]}
              tickCount={(maxYear - minYear) / 2}
              tickFormatter={(v) => v.toString()}
              padding={{ left: 20, right: 20 }}
              tick={rc.axisTick}                                     {/* ★ */}
            />
            <YAxis
              tickFormatter={/* ...unchanged prefix/suffix/abbrev formatter... */ (v) => String(v)}
              domain={['auto', 'auto']} axisLine={false} tickLine={false}
              tick={rc.axisTick}                                     {/* ★ */}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              key="value-line" type="linear" dataKey="value"
              stroke={lineColor}                                     {/* ★ */}
              strokeWidth={rc.stroke}                                {/* ★ */}
              dot={{ r: 3, fill: lineColor }}                        {/* ★ */}
              activeDot={{ r: 5 }} isAnimationActive={false}
            >
              <ErrorBar
                dataKey={(d: DataPoint) => (d.standard_error ? 1.96 * d.standard_error : 0)}
                stroke={lineColor} strokeWidth={1} width={4}         {/* ★ */}
                name="confidence-intervals"
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>

        <div className="mb-2">
          <p style={rc.sourceStyle}>Source: {metadata.source.name}</p>  {/* ★ */}
        </div>
      </div>
    </div>
  );
}
```

Result: with no provider and `colorDomain={null}`, this renders **black-on-white, faint
dashed horizontal grid, muted grey axis labels** — the Tufte default — and switches to
warm/dark automatically under `newsprint`/`carbon`. Zero data-logic changes.

---

## Multi-series note (the semantic path)

For `timeseries-line-v1` (multi-group), the only difference is mapping the existing
`demographic` prop to a domain and resolving per group:

```tsx
const { colorFor } = useVizTheme();
const domain = demographic === 'PolParty' ? 'party' : null;   // explicit mapping, no sniffing
{groups.map((g, i) => (
  <Line key={g} dataKey={g} stroke={colorFor(domain, g, i)} strokeWidth={rc.stroke} dot={false} />
))}
```

Democrat → blue, Republican → red in every theme; an unknown grouping → the stable
categorical cycle. Same resolver, same output as the Plot version.

---

## Verify #1 — contract test (drift insurance)

```ts
// registry/theme/__tests__/theme-contract.test.ts
import { themes } from '../themes';
import { colorFor, colorScale } from '../semantic';

test('every theme resolves every semantic domain in both engine paths', () => {
  for (const theme of Object.values(themes)) {
    for (const domain of ['party', 'sentiment'] as const) {
      for (const cat of Object.keys(theme.semantic[domain])) {
        expect(colorFor(theme.semantic, domain, cat)).toMatch(/^#/);             // recharts path
        expect(colorScale(theme.semantic, domain, [cat]).range[0]).toMatch(/^#/); // plot path
      }
    }
  }
});

test('unknown category falls back to categorical, never throws', () => {
  const t = themes.editorial.semantic;
  expect(colorFor(t, 'party', 'Libertarian')).toBe(t.categorical[0]);
});
```

## Verify #2 — side-by-side demo page (the visual diff)

Build a page that renders the **same dataset** through one Recharts chart and one Plot
chart, looped over all three themes. This is the fastest way to *see* inconsistency and
the best regression guard.

```tsx
// app/_theme-demo/page.tsx
'use client';
import { VizThemeProvider } from '@/viz/theme/provider';
import { themes } from '@/viz/theme/themes';

export default function Demo() {
  return (
    <div className="grid gap-12 p-8">
      {Object.keys(themes).map((name) => (
        <VizThemeProvider key={name} theme={name as any}>
          <section data-viz-theme={name}>
            <h3>{name}</h3>
            {/* <TimeSeriesChart .../>  and  <PlotLineChart .../> with identical data */}
          </section>
        </VizThemeProvider>
      ))}
    </div>
  );
}
```

Eyeball check: Democrat lines are the same blue in the Recharts and Plot panels of a given
theme; the single-series chart is ink in `editorial`, warm charcoal in `newsprint`, light
in `carbon`.

---

## Final acceptance checklist

- [ ] `tokens.ts`, `semantic.ts`, `themes.ts`, `provider.tsx`, both adapters, `generate-css.ts` exist under `registry/theme/`.
- [ ] No chart imports a color/size literal for theme-able properties (grep for `#000`, `fontSize: 12`, `text-gray-`).
- [ ] A component with **no** provider still renders (defaults to `editorial`).
- [ ] The retrofitted `TimeSeriesChart` renders correctly in all three themes.
- [ ] Multi-series resolves Democrat→blue / Republican→red identically in Recharts and Plot.
- [ ] Contract test passes; side-by-side demo page renders.
- [ ] `pnpm theme:css` regenerates `theme.css`; `.dark` chrome and `carbon` charts share values.
- [ ] You wrote `THEME-AUTHORING.md` documenting how to add a 4th theme.
- [ ] Existing copied components are untouched in their data logic — changes are styling-only and additive.

---

## A note on the copy-in model (don't skip)

Because theme is copied separately (`cp -r registry/theme`) and components are added with
`viz add`, a consumer can end up with a new component and an old theme (or vice versa).
Two mitigations: (1) keep `useVizTheme()` defaulting to `editorial` so a missing/old theme
never crashes a component; (2) put a `THEME_SCHEMA_VERSION` constant in `tokens.ts` and
have components read it loosely — log a console warning on mismatch rather than throwing.
Graceful degradation over hard coupling.
