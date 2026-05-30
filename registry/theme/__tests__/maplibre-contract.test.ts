// registry/theme/__tests__/maplibre-contract.test.ts
//
// Drift insurance for the MAP engine (extends theme-contract.test.ts). Pure
// functions, no DOM. The guarantees locked here:
//   (1) a continuous scale's anchor colors ARE the active theme's ramp — the
//       choropleth fill can never drift from the ramp the legend draws;
//   (2) the compiled MapLibre expression has the null guard, so no-data
//       features paint `nodata` instead of mapping to the low end;
//   (3) every color literal inside the expression is a theme ramp color;
//   (4) stops are strictly ascending (MapLibre `interpolate`/`step` require it).

import { describe, test, expect } from 'vitest';
import { themes } from '../themes';
import {
  scaleFor,
  toMaplibreFill,
  toMaplibreStep,
  toGradientStops,
} from '../scales';

describe('maplibre scale contract', () => {
  test('every theme produces a sequential + diverging fill whose anchors are the theme ramp', () => {
    for (const theme of Object.values(themes)) {
      const seq = scaleFor(theme.semantic, { kind: 'sequential', domain: [0, 100] });
      expect(seq.colors).toEqual([...theme.semantic.sequential]); // no drift from the ramp

      const expr = toMaplibreFill(seq);
      expect(expr[0]).toBe('case'); // null guard present

      // every color literal in the expression is a theme ramp color (or nodata)
      const allowed = [
        ...theme.semantic.sequential,
        ...theme.semantic.diverging,
        'transparent',
      ].map(String);
      const used = JSON.stringify(expr).match(/#[0-9a-fA-F]{3,8}/g) ?? [];
      used.forEach((c) => expect(allowed).toContain(c));

      const div = scaleFor(theme.semantic, { kind: 'diverging', domain: [-30, 0, 30] });
      expect(div.colors).toEqual([...theme.semantic.diverging]);
    }
  });

  test('the step (classed) expression also carries the null guard and ramp colors', () => {
    for (const theme of Object.values(themes)) {
      const seq = scaleFor(theme.semantic, { kind: 'sequential', domain: [0, 100] });
      const step = toMaplibreStep(seq);
      expect(step[0]).toBe('case');
      const used = JSON.stringify(step).match(/#[0-9a-fA-F]{3,8}/g) ?? [];
      used.forEach((c) => expect([...theme.semantic.sequential].map(String)).toContain(c));
    }
  });

  test('stops are strictly ascending and bracket the domain', () => {
    const sem = themes.editorial.semantic;

    const seq = scaleFor(sem, { kind: 'sequential', domain: [0, 100] });
    expect(seq.stops[0]).toBe(0);
    expect(seq.stops[seq.stops.length - 1]).toBe(100);

    const div = scaleFor(sem, { kind: 'diverging', domain: [-30, 0, 30] });
    expect(div.stops[0]).toBe(-30);
    expect(div.stops[div.stops.length - 1]).toBe(30);
    expect(div.stops[(div.stops.length - 1) / 2]).toBe(0); // center color sits at the center value

    for (const s of [seq, div]) {
      for (let i = 1; i < s.stops.length; i++) {
        expect(s.stops[i]).toBeGreaterThan(s.stops[i - 1]);
      }
    }
  });

  test('reverse flips the color order but keeps stops ascending', () => {
    const sem = themes.editorial.semantic;
    const fwd = scaleFor(sem, { kind: 'diverging', domain: [-30, 0, 30] });
    const rev = scaleFor(sem, { kind: 'diverging', domain: [-30, 0, 30], reverse: true });
    expect(rev.colors).toEqual([...fwd.colors].reverse());
    expect(rev.stops).toEqual(fwd.stops); // stops follow the domain, not the color order
  });

  test('gradient stops span 0..1 in order (legend matches the fill)', () => {
    const sem = themes.editorial.semantic;
    const g = toGradientStops(scaleFor(sem, { kind: 'sequential', domain: [10, 50] }));
    expect(g[0].offset).toBeCloseTo(0);
    expect(g[g.length - 1].offset).toBeCloseTo(1);
    expect(g.map((s) => s.color)).toEqual([...sem.sequential]);
  });

  test('no-data is transparent (contract-test allowance)', () => {
    const sem = themes.bloomberg.semantic;
    expect(scaleFor(sem, { kind: 'sequential', domain: [0, 1] }).nodata).toBe('transparent');
  });
});
