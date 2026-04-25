'use client';

import * as React from 'react';

export interface AnnotationProps {
  children: React.ReactNode;
  /**
   * Tooltip text shown on hover/focus. Keep short — one sentence.
   * e.g. "Democratic support 80.6%, Republican 33.1% — see Figure 2."
   */
  note: string;
}

/**
 * Annotation — inline highlighted span in prose with a hover/focus
 * tooltip. Bridges prose to chart numbers without breaking flow.
 *
 * Use to surface a small data note about a number or phrase in the
 * sentence: e.g. wrap "47.5 points" with a note that breaks down the
 * components (Democrat 80.6, Republican 33.1).
 *
 * NOT for: definitions (use SideNote), methodology (use Callout), or
 * citations (those go inline via cite links).
 *
 * The current implementation uses native `title=` for the tooltip — works
 * on hover with desktop browsers, accessible to screen readers via
 * `aria-label`. A styled popover variant could be added later without
 * changing the call sites.
 */
export function Annotation({ children, note }: AnnotationProps) {
  return (
    <span
      className="border-b border-dotted border-muted cursor-help"
      title={note}
      aria-label={note}
    >
      {children}
    </span>
  );
}
