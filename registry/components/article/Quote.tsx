'use client';

import * as React from 'react';

export interface QuoteProps {
  /**
   * The quoted text. **Strict 25-word maximum** for copyright safety; one
   * attributed sentence is the right register. The component does not
   * enforce this — the writer is responsible.
   */
  children: React.ReactNode;
  /** Author or speaker. e.g. "Robert Putnam". */
  author: string;
  /** Optional work title (italicized). e.g. "Bowling Alone". */
  work?: string;
  /** Optional year of publication. */
  year?: string | number;
}

/**
 * Quote — short attributed inline quotation. Use for direct citations in
 * the literature section. Never reproduce paragraph-length quotes.
 *
 * For pulling a sentence from the article itself (not from a cited
 * source), use <PullQuote> instead.
 */
export function Quote({ children, author, work, year }: QuoteProps) {
  return (
    <blockquote className="border-l-4 border-border-strong pl-4 my-6 italic text-subtle not-prose">
      <p className="leading-relaxed">{children}</p>
      <cite className="block mt-2 not-italic text-sm text-muted">
        — {author}
        {work && (
          <>
            {', '}
            <em className="italic">{work}</em>
          </>
        )}
        {year && <> ({year})</>}
      </cite>
    </blockquote>
  );
}
