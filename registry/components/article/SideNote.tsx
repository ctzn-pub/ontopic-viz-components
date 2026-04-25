'use client';

import * as React from 'react';

export interface SideNoteProps {
  children: React.ReactNode;
  /**
   * Optional small label rendered above the note. e.g. "Definition" or "Aside".
   */
  label?: string;
}

/**
 * SideNote — Tufte-style margin note. On lg: and up, sits in a right rail
 * outside the prose column; below lg:, collapses inline as an indented
 * italic block. Use for methodological asides, definitions, or "skip this
 * if you already know X" remarks.
 *
 * NOT for anything load-bearing — if a sidenote is necessary to follow the
 * main argument, it belongs in the prose itself.
 *
 * Implementation: relies on the parent `<article>` being `lg:max-w-none` so
 * we can position the rail. The provided ArticleShell uses `prose max-w-none`
 * inside a `max-w-3xl` container, which works — the SideNote `lg:absolute`
 * positions it relative to the nearest positioned ancestor (the `<figure>`
 * or wrapping div). Wrap the SideNote in its own positioned context if
 * needed.
 */
export function SideNote({ children, label }: SideNoteProps) {
  return (
    <aside
      className={[
        // Mobile / md: inline italic block.
        'block my-4 pl-4 border-l-2 border-border italic text-sm text-subtle',
        // lg: float to the right of the prose column.
        'lg:float-right lg:clear-right lg:my-0 lg:ml-6 lg:-mr-44',
        'lg:w-40 lg:pl-3 lg:border-l-0 lg:border-l lg:border-border-strong',
        'lg:not-italic lg:text-xs lg:leading-snug',
      ].join(' ')}
    >
      {label && (
        <span className="block uppercase tracking-wider text-[10px] font-semibold text-muted mb-1 not-italic">
          {label}
        </span>
      )}
      <span className="not-prose">{children}</span>
    </aside>
  );
}
