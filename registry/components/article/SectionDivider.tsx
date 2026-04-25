'use client';

import * as React from 'react';

export interface SectionDividerProps {
  /**
   * Ornament rendered between sections. Default: an asterism (* * *).
   * Override for variety:
   *   <SectionDivider ornament="§" />
   *   <SectionDivider ornament="◆ ◆ ◆" />
   */
  ornament?: string;
}

/**
 * SectionDivider — a horizontal break for shifts within a section that
 * don't warrant a new heading. NYT Magazine and Harper's both use this.
 *
 * Use sparingly — at most one or two per article. More than that and the
 * article reads as a sequence of fragments rather than a continuous piece.
 */
export function SectionDivider({ ornament = '* * *' }: SectionDividerProps) {
  return (
    <div
      className="not-prose my-12 text-center text-muted tracking-[0.5em] text-sm select-none"
      aria-hidden="true"
    >
      {ornament}
    </div>
  );
}
