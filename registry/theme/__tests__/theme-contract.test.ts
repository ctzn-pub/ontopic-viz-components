// registry/theme/__tests__/theme-contract.test.ts
//
// Drift insurance. These run on pure functions (no React/DOM) so they're fast
// and deterministic. They lock the two guarantees that make the system worth
// having: (1) every theme resolves every semantic domain in BOTH engine paths,
// and (2) the Recharts path (colorFor) and the Plot path (colorScale) return
// the SAME color for the same category — that identity is the cross-engine
// consistency, verified at the data layer where it actually lives.

import { describe, test, expect } from 'vitest';
import { themes, defaultTheme } from '../themes';
import {
  mergeSemantic,
  colorFor,
  colorScale,
  defaultSemantic,
} from '../semantic';

describe('semantic resolver', () => {
  test('every theme resolves every semantic domain in both engine paths', () => {
    for (const theme of Object.values(themes)) {
      for (const domain of ['party', 'sentiment'] as const) {
        for (const cat of Object.keys(theme.semantic[domain])) {
          // Recharts path (per-series imperative resolve)
          expect(colorFor(theme.semantic, domain, cat)).toMatch(/^#/);
          // Plot path (whole-series domain->range scale)
          expect(colorScale(theme.semantic, domain, [cat]).range[0]).toMatch(/^#/);
        }
      }
    }
  });

  test('the two engine paths agree for every theme + party category', () => {
    for (const theme of Object.values(themes)) {
      for (const cat of Object.keys(theme.semantic.party)) {
        const recharts = colorFor(theme.semantic, 'party', cat);
        const plot = colorScale(theme.semantic, 'party', [cat]).range[0];
        expect(plot).toBe(recharts); // same data -> same color, both engines
      }
    }
  });

  test('unknown category falls back to categorical, never throws', () => {
    const t = themes.editorial.semantic;
    expect(colorFor(t, 'party', 'Libertarian')).toBe(t.categorical[0]);
    expect(() => colorScale(t, 'party', ['Libertarian', 'Green'])).not.toThrow();
  });
});

describe('Phase 1 acceptance — colorFor', () => {
  const sem = mergeSemantic(); // defaults

  test('party lookups resolve to the fixed map', () => {
    expect(colorFor(sem, 'party', 'Democrat')).toBe('#2b6cb0');
  });

  test('unknown party label -> categorical[0] (ink)', () => {
    expect(colorFor(sem, 'party', 'Green Party')).toBe(sem.categorical[0]);
  });

  test('null domain walks the categorical cycle by index', () => {
    expect(colorFor(sem, null, 'foo', 0)).toBe(sem.categorical[0]); // ink
    expect(colorFor(sem, null, 'bar', 1)).toBe(sem.categorical[1]); // gray500
  });

  test('index wraps around the categorical cycle', () => {
    const n = sem.categorical.length;
    expect(colorFor(sem, null, 'wrap', n)).toBe(sem.categorical[0]);
  });
});

describe('Phase 2 acceptance — themes', () => {
  test('editorial uses default party semantics', () => {
    expect(themes.editorial.semantic.party.Democrat).toBe('#2b6cb0');
  });

  test('newsprint overrides party tonally (slate Democrat)', () => {
    expect(themes.newsprint.semantic.party.Democrat).toBe('#4a6b82');
  });

  test('carbon is dark; editorial is the default', () => {
    expect(themes.carbon.mode).toBe('dark');
    expect(defaultTheme.name).toBe('editorial');
  });
});

describe('mergeSemantic — shallow per-domain merge', () => {
  test('overriding party leaves sentiment/sequential/diverging inherited', () => {
    const sem = mergeSemantic({ party: { Democrat: '#000000' } });
    expect(sem.party.Democrat).toBe('#000000');
    // unspecified party members still inherited
    expect(sem.party.Republican).toBe(defaultSemantic.party.Republican);
    // untouched domains inherited wholesale
    expect(sem.sentiment.positive).toBe(defaultSemantic.sentiment.positive);
    expect(sem.diverging).toEqual([...defaultSemantic.diverging]);
  });

  test('no overrides returns the defaults', () => {
    const sem = mergeSemantic();
    expect(sem.party.Democrat).toBe(defaultSemantic.party.Democrat);
  });
});
