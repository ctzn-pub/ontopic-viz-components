'use client';

import * as React from 'react';

export interface DropCapProps {
  children: React.ReactNode;
}

/**
 * DropCap — wraps the first paragraph of an article. The first letter of
 * its content gets rendered very large with the rest of the paragraph
 * flowing around it. Tiny visual signal that "this is an article."
 *
 * Use once per article, on the opening paragraph only. Multiple drop
 * caps in one article look like a magazine layout test gone wrong.
 *
 * Implementation note: relies on the CSS `::first-letter` pseudo-element,
 * which only floats the very first character of the very first inline
 * text node. The component uses a `dropcap` className that the global
 * stylesheet styles (see `globals.css`).
 */
export function DropCap({ children }: DropCapProps) {
  return <div className="dropcap">{children}</div>;
}
