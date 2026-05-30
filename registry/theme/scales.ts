// registry/theme/scales.ts
//
// Layer between semantic and the engines for CONTINUOUS color (number -> color).
// `colorFor`/`colorScale` in semantic.ts are categorical-only; choropleths need
// a continuous ramp. This file is the third resolver, and it reuses the EXISTING
// ramps (`theme.semantic.sequential` = blueRamp, `.diverging` = rdBu) so a
// continuous scale and a categorical lookup never drift apart.
//
// Cross-engine consistency by construction: a scale is defined once as shared
// ANCHOR STOPS, then compiled per engine. Because the ramps are 5-color arrays,
// every engine does piecewise-linear interpolation over IDENTICAL anchors — which
// sidesteps the trap where d3's Lab interpolation and MapLibre's RGB interpolation
// drift. Pin the anchors; the interpolation method stops mattering.
//
// Pure data + functions. NO Recharts, Plot, MapLibre, or React import — the
// MapLibre expression type is kept structural (`unknown[]`) so this file
// typechecks without maplibre-gl installed.

import { SemanticMap } from './semantic';

export type ScaleKind = 'sequential' | 'diverging';
export type ClassMode = 'continuous' | 'quantize'; // quantile/jenks = later extension

/** A MapLibre paint/style expression. Kept structural to avoid a maplibre-gl
 *  dependency in the theme layer; consumers cast it where MapLibre wants it. */
export type MaplibreExpression = unknown[];

export interface ScaleSpec {
  kind: ScaleKind;
  /** sequential: [min,max]; diverging: [min,center,max] (center is the neutral color) */
  domain: number[];
  mode?: ClassMode;   // default 'continuous'
  classes?: number;   // for 'quantize'; default = colors.length
  reverse?: boolean;  // flip the ramp (e.g. rdBu so red=low or red=high as the data needs)
}

export interface ResolvedScale {
  colors: string[];   // anchor colors, theme-resolved, post-reverse
  stops: number[];    // value at each anchor, same length as colors
  nodata: string;     // color for features with no joined value
}

/** Pull anchors from the active theme's semantic ramp and lay them across the domain. */
export function scaleFor(sem: SemanticMap, spec: ScaleSpec): ResolvedScale {
  const ramp = (spec.kind === 'diverging' ? sem.diverging : sem.sequential).slice();
  const colors = spec.reverse ? ramp.reverse() : ramp;

  let stops: number[];
  if (spec.kind === 'diverging') {
    const [min, mid, max] = spec.domain;
    const midIdx = (colors.length - 1) / 2; // center color sits at `mid`
    stops = colors.map((_, i) =>
      i <= midIdx
        ? min + (mid - min) * (i / midIdx)
        : mid + (max - mid) * ((i - midIdx) / (colors.length - 1 - midIdx)),
    );
  } else {
    const [min, max] = spec.domain;
    stops = colors.map((_, i) => min + (max - min) * (i / (colors.length - 1)));
  }
  return { colors, stops, nodata: 'transparent' };
}

/** Compile to a MapLibre paint expression reading a numeric feature-state `value`. */
export function toMaplibreFill(s: ResolvedScale): MaplibreExpression {
  const interp: MaplibreExpression = [
    'interpolate',
    ['linear'],
    ['to-number', ['feature-state', 'value']],
  ];
  s.stops.forEach((stop, i) => interp.push(stop, s.colors[i]));
  // guard: features with no joined value get the nodata color instead of mapping
  // `to-number(null) === 0` onto the low end of the ramp.
  return ['case', ['==', ['feature-state', 'value'], null], s.nodata, interp];
}

/** Quantized variant -> MapLibre `step` expression (classed choropleth, Tufte-friendly). */
export function toMaplibreStep(s: ResolvedScale): MaplibreExpression {
  const expr: MaplibreExpression = ['step', ['to-number', ['feature-state', 'value']], s.colors[0]];
  for (let i = 1; i < s.colors.length; i++) expr.push(s.stops[i], s.colors[i]);
  return ['case', ['==', ['feature-state', 'value'], null], s.nodata, expr];
}

/** For the React legend (and any SVG engine): same stops as a 0–1 gradient. */
export function toGradientStops(s: ResolvedScale): { offset: number; color: string }[] {
  const span = s.stops[s.stops.length - 1] - s.stops[0] || 1;
  return s.colors.map((color, i) => ({ offset: (s.stops[i] - s.stops[0]) / span, color }));
}
