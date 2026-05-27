// registry/theme/semantic.ts
//
// Layer 2 of the viz theme system: MEANING -> token, plus the resolver that
// every chart calls instead of touching a color literal. This is the
// load-bearing file: it makes "meaningful where meaning exists, consistent
// where it doesn't" a single code path, shared by both engines.
//
// Two DISTINCT kinds of semantic color — do not conflate them:
//   - Fixed lookups: categories with a *correct* color that must never drift
//     (party, sentiment). These are maps.
//   - Scales: encodings where color is arbitrary-but-consistent (an N-group
//     cycle, a sequential/diverging ramp). These are arrays.
//
// Pure data + functions. No Recharts, no Plot, no React.

import { tokens as t } from './tokens';

export type SemanticDomain = 'party' | 'sentiment';

// DEFAULT semantic definitions. A theme MAY override these (themes.ts) to stay
// tonally consistent — e.g. Newsprint uses muted brick/slate for party.
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
    t.palette.ink,
    t.palette.gray500,
    t.palette.blue,
    t.palette.red,
    t.palette.green,
    t.palette.amber,
    t.palette.purple,
  ],
  sequential: t.palette.blueRamp,
  diverging:  t.palette.rdBu,
} as const;

export interface SemanticMap {
  party: Record<string, string>;
  sentiment: Record<string, string>;
  categorical: readonly string[];
  sequential: readonly string[];
  diverging: readonly string[];
}

export type SemanticOverrides = Partial<{
  party: Record<string, string>;
  sentiment: Record<string, string>;
  categorical: string[];
  sequential: string[];
  diverging: string[];
}>;

/**
 * Merge a theme's optional overrides onto the defaults. Shallow per-domain
 * merge so a theme can override just `party` without redeclaring everything.
 */
export function mergeSemantic(overrides?: SemanticOverrides): SemanticMap {
  if (!overrides) return defaultSemantic as unknown as SemanticMap;
  return {
    party:       { ...defaultSemantic.party,     ...(overrides.party ?? {}) },
    sentiment:   { ...defaultSemantic.sentiment, ...(overrides.sentiment ?? {}) },
    categorical: overrides.categorical ?? [...defaultSemantic.categorical],
    sequential:  overrides.sequential  ?? [...defaultSemantic.sequential],
    diverging:   overrides.diverging   ?? [...defaultSemantic.diverging],
  };
}

/**
 * Resolve a color for a category. The single most important function in the
 * system — every chart calls this instead of hardcoding a hex value.
 *
 * @param sem      merged semantic map (from the active theme)
 * @param domain   'party' | 'sentiment' | null. null -> use categorical cycle.
 * @param category the category label (e.g. "Democrat", "EducationLevel:HS")
 * @param index    series index — used for the categorical fallback only
 */
export function colorFor(
  sem: SemanticMap,
  domain: SemanticDomain | null,
  category: string,
  index = 0,
): string {
  if (domain && category in sem[domain]) return sem[domain][category];
  // graceful fallback: unknown category -> stable position in the cycle.
  return sem.categorical[index % sem.categorical.length];
}

/** Whole-series-at-once (Plot wants a domain->range pairing). */
export function colorScale(
  sem: SemanticMap,
  domain: SemanticDomain | null,
  categories: string[],
): { domain: string[]; range: string[] } {
  return {
    domain: categories,
    range: categories.map((c, i) => colorFor(sem, domain, c, i)),
  };
}
