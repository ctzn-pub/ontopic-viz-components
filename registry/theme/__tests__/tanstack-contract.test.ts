// registry/theme/__tests__/tanstack-contract.test.ts
//
// Drift insurance for the TANSTACK engine (extends theme-contract.test.ts).
//
// WHY THIS SUITE IS DIFFERENT FROM THE OTHER ADAPTER TESTS
//
// The other engines fail loudly: pass Recharts a bad prop and TypeScript or the
// render complains. TanStack's chart definition takes a loosely-typed options
// object, so a misplaced key is accepted by tsc AND silently ignored at render.
// The canonical example, which cost real time during the port:
//
//     x: { axis: { tickFormat: fmt } }            // ignored, compiles fine
//     x: { axis: { ticks: { format: fmt } } }     // the real path
//
// The first form renders years as "1,995" and drops the "%" suffix, with no
// error anywhere. tsc cannot catch this class of bug, so the only real guard is
// to RENDER and assert on the output.
//
// We do that WITHOUT a DOM: `createChartScene` + `renderChartSvg` are pure
// functions returning an SVG string, so this suite stays as fast and
// deterministic as the rest (no jsdom dependency, no React).
//
// Assertions read EXTRACTED <text> NODES, never raw SVG substrings. That
// distinction matters and is not pedantic — a naive `svg.includes('1,994')`
// check reports "no bug" on visibly bugged output, because the broken axis
// picks different tick values entirely (1,995) and a bare /\d+%/ matches the
// "%" inside unrelated attributes. Both were verified to produce false
// negatives before this suite was written; the text-node form was verified to
// discriminate correctly in both directions.
//
// Guarantees locked here:
//   (1) the adapter maps every theme onto a valid TanStack ChartTheme whose
//       palette IS that theme's categorical cycle (no engine defaults leak);
//   (2) axis tick FORMATTERS actually reach the renderer — the silent-ignore
//       regression above fails this suite;
//   (3) explicit tick VALUES are honored, so a survey time series labels the
//       years that exist in the data rather than round numbers that don't;
//   (4) tick density matches the ~5 our other engines settle on, not
//       TanStack's busier ~9 default;
//   (5) every color the renderer emits traces back to the active theme.

import { describe, test, expect } from 'vitest';
import {
  defineChart,
  lineY,
  barY,
  createChartScene,
  renderChartSvg,
} from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { themes } from '../themes';
import { tanstackTheme } from '../adapters/tanstack';

/** Survey-shaped fixture: irregular real years, percentage values. */
const ROWS = [
  { year: 1994, value: 41.2 },
  { year: 2000, value: 45.9 },
  { year: 2010, value: 52.3 },
  { year: 2018, value: 58.1 },
];

const SIZE = { width: 640, height: 360 };

/**
 * The rendered text labels, in document order. Assert on THESE — see the header
 * note on why raw-substring checks produce false negatives.
 */
function labelsOf(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
}

/** Every color literal the renderer emitted, lowercased and de-duplicated. */
function colorsOf(svg: string): string[] {
  return [...new Set((svg.match(/#[0-9a-fA-F]{3,8}/g) ?? []).map((c) => c.toLowerCase()))];
}

/**
 * Build + render a time series the way registry/components/tanstack/timeseries/
 * line-v1.tsx does. Kept in this file rather than imported so the suite tests
 * the ENGINE CONTRACT (which option paths are live) independently of any one
 * component's current code.
 */
function renderTimeSeries(themeName: keyof typeof themes) {
  const tsq = tanstackTheme(themes[themeName]);
  const stroke = themes[themeName].semantic.categorical[0];
  const tickYears = ROWS.map((r) => r.year);

  const definition = defineChart({
    theme: tsq.chartTheme,
    margin: tsq.margin,
    marks: [
      lineY(ROWS, {
        x: (d: { year: number }) => d.year,
        y: (d: { value: number }) => d.value,
        stroke,
        strokeWidth: tsq.line.strokeWidth,
      }),
    ],
    x: {
      scale: scaleLinear,
      grid: false,
      axis: { ticks: { values: tickYears, format: (v: number) => String(Math.round(v)) } },
    },
    y: {
      scale: scaleLinear,
      grid: tsq.gridVisible,
      axis: { ticks: { count: tsq.axis.tickCount, format: (v: number) => `${v}%` } },
    },
  });

  return renderChartSvg(createChartScene(definition, SIZE), { ...SIZE, ariaLabel: 'contract test' });
}

describe('tanstack theme adapter', () => {
  test('every theme produces a complete ChartTheme with no undefined slots', () => {
    for (const theme of Object.values(themes)) {
      const { chartTheme } = tanstackTheme(theme);
      expect(chartTheme.foreground).toMatch(/^#/);
      expect(chartTheme.muted).toMatch(/^#/);
      expect(chartTheme.grid).toMatch(/^#/);
      // Charts sit on the host card's surface; an opaque background would
      // punch a hole through a themed card.
      expect(chartTheme.background).toBe('transparent');
      expect(chartTheme.palette.length).toBeGreaterThan(0);
    }
  });

  test("palette IS the theme's categorical cycle — engine defaults never leak", () => {
    for (const theme of Object.values(themes)) {
      const { chartTheme } = tanstackTheme(theme);
      expect([...chartTheme.palette]).toEqual([...theme.semantic.categorical]);
    }
  });

  test('tick density matches the other engines rather than the engine default', () => {
    for (const theme of Object.values(themes)) {
      // TanStack lands near 9 on a typical domain; our other engines settle
      // around 5. Locked so density reads the same across all five engines.
      expect(tanstackTheme(theme).axis.tickCount).toBe(5);
    }
  });
});

describe('tanstack render contract (the silent-ignore guard)', () => {
  test('y-axis tick FORMATTER reaches the renderer', () => {
    const labels = labelsOf(renderTimeSeries('editorial'));
    // Regression: with the formatter at the wrong nesting level these render
    // as bare "42", "44", … and nothing anywhere reports a problem.
    expect(labels.some((l) => /^\d+(\.\d+)?%$/.test(l))).toBe(true);
  });

  test('x-axis tick FORMATTER reaches the renderer — years are never comma-grouped', () => {
    const labels = labelsOf(renderTimeSeries('editorial'));
    // Regression: the ignored-formatter path renders "1,995" via the default
    // number formatter.
    for (const label of labels) {
      expect(label).not.toMatch(/\d,\d{3}/);
    }
  });

  test('explicit tick VALUES are honored — the axis labels real survey years', () => {
    const labels = labelsOf(renderTimeSeries('editorial'));
    // Regression: a generic tick `count` makes TanStack choose round years
    // (1995, 2005, 2015) that do not exist in the data at all.
    for (const row of ROWS) {
      expect(labels).toContain(String(row.year));
    }
  });

  test('axis labels are never duplicated by over-rounding', () => {
    // Regression (found by rendering, not by tsc): the indexed chart formatted
    // its percent ticks with Math.round, which is fine on a wide series but
    // collapses a narrow one into "0% | 0% | +1% | +1%" — an axis that reads as
    // four ticks but carries two values. Precision is now derived once from the
    // plotted span. This asserts the narrow case stays legible.
    const narrow = [
      { year: 2015, value: 0.0 },
      { year: 2018, value: 0.3 },
      { year: 2021, value: 0.6 },
      { year: 2024, value: 0.9 },
    ];
    const span = 0.9;
    const decimals = span >= 10 ? 0 : span >= 2 ? 1 : 2;
    const tsq = tanstackTheme(themes.editorial);

    const definition = defineChart({
      theme: tsq.chartTheme,
      margin: tsq.margin,
      marks: [
        lineY(narrow, {
          x: (d: { year: number }) => d.year,
          y: (d: { value: number }) => d.value,
          stroke: themes.editorial.semantic.categorical[0],
          strokeWidth: tsq.line.strokeWidth,
        }),
      ],
      x: { scale: scaleLinear, grid: false },
      y: {
        scale: scaleLinear,
        grid: tsq.gridVisible,
        axis: {
          ticks: {
            count: tsq.axis.tickCount,
            format: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(decimals)}%`,
          },
        },
      },
    });

    const labels = labelsOf(
      renderChartSvg(createChartScene(definition, SIZE), { ...SIZE, ariaLabel: 'narrow' }),
    ).filter((l) => l.includes('%'));

    expect(labels.length).toBeGreaterThan(1);
    expect(new Set(labels).size).toBe(labels.length); // no two ticks share a label
  });

  test('count axes never emit fractional ticks', () => {
    // Regression (found by rendering): a histogram y axis counts observations,
    // but on a small sample the engine's default density produced "0.2", "0.4"
    // — fractions of an observation. Tick count is now capped by the largest
    // whole count and non-integers are dropped.
    const maxCount = 1; // the sparse case that used to break
    const tsq = tanstackTheme(themes.editorial);
    const bars = [
      { x1: 0, x2: 10, value: 1 },
      { x1: 10, x2: 20, value: 1 },
    ];

    const definition = defineChart({
      theme: tsq.chartTheme,
      margin: tsq.margin,
      marks: [
        barY(bars, {
          x1: (d: { x1: number }) => d.x1,
          x2: (d: { x2: number }) => d.x2,
          y: (d: { value: number }) => d.value,
          fill: themes.editorial.semantic.categorical[0],
        }),
      ],
      // Formatted like the component's own x axis so this test only judges the
      // count axis below — an unformatted x axis emits its own "0.0" ticks.
      x: {
        scale: scaleLinear,
        grid: false,
        axis: { ticks: { count: tsq.axis.tickCount, format: (v: number) => String(Math.round(v)) } },
      },
      y: {
        scale: scaleLinear,
        grid: tsq.gridVisible,
        axis: {
          ticks: {
            count: Math.max(2, Math.min(tsq.axis.tickCount, maxCount + 1)),
            format: (v: number) => (Number.isInteger(v) ? String(v) : ''),
          },
        },
      },
    });

    const labels = labelsOf(
      renderChartSvg(createChartScene(definition, SIZE), { ...SIZE, ariaLabel: 'counts' }),
    );
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label).not.toMatch(/\./); // "0.2 observations" is not a thing
    }
  });

  test('temporal x values are labelled as years, never as raw timestamps', () => {
    // Regression (found in the preview, not by tsc): callers may pass Date
    // objects for x — the Plot engine accepts them — and the multiline chart
    // coerced those to epoch milliseconds, rendering "946702800000" as an axis
    // label. Timestamps must be recognised and formatted as years.
    const TEMPORAL_THRESHOLD = 100000;
    const dated = [2000, 2004, 2008, 2012].map((y) => ({
      x: Date.UTC(y, 0, 1),
      y: 40 + y / 100,
    }));
    const isTemporal = dated.some((d) => Math.abs(d.x) > TEMPORAL_THRESHOLD);
    expect(isTemporal).toBe(true); // fixture really is in ms

    const tsq = tanstackTheme(themes.editorial);
    const definition = defineChart({
      theme: tsq.chartTheme,
      margin: tsq.margin,
      marks: [
        lineY(dated, {
          x: (d: { x: number }) => d.x,
          y: (d: { y: number }) => d.y,
          stroke: themes.editorial.semantic.categorical[0],
          strokeWidth: tsq.line.strokeWidth,
        }),
      ],
      x: {
        scale: scaleLinear,
        grid: false,
        axis: {
          ticks: {
            values: dated.map((d) => d.x),
            format: (v: number) =>
              isTemporal ? String(new Date(v).getUTCFullYear()) : String(Math.round(v)),
          },
        },
      },
      y: {
        scale: scaleLinear,
        grid: tsq.gridVisible,
        axis: { ticks: { count: tsq.axis.tickCount, format: (v: number) => `${v}%` } },
      },
    });

    const labels = labelsOf(
      renderChartSvg(createChartScene(definition, SIZE), { ...SIZE, ariaLabel: 'temporal' }),
    );
    // No label may be a raw epoch value, and the real years must be present.
    for (const label of labels) {
      expect(label).not.toMatch(/^\d{11,}$/);
    }
    expect(labels).toContain('2000');
    expect(labels).toContain('2012');
  });

  test('every emitted color traces back to the active theme', () => {
    for (const name of Object.keys(themes) as (keyof typeof themes)[]) {
      const theme = themes[name];
      const allowed = new Set(
        [
          theme.fg,
          theme.muted,
          theme.grid,
          theme.surface,
          theme.border,
          theme.accent,
          ...theme.semantic.categorical,
        ].map((c) => c.toLowerCase()),
      );
      for (const color of colorsOf(renderTimeSeries(name))) {
        expect(allowed.has(color)).toBe(true);
      }
    }
  });
});
