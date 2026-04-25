'use client';

import * as React from 'react';

export type CalloutVariant = 'caveat' | 'definition' | 'finding' | 'aside';

export interface CalloutProps {
  variant?: CalloutVariant;
  /** Heading text. If omitted, falls back to variant default ("Methodological note", "Key finding", or none). */
  title?: string;
  children: React.ReactNode;
}

interface VariantSpec {
  container: string;
  defaultTitle: string | null;
  titleClass?: string;
}

const VARIANTS: Record<CalloutVariant, VariantSpec> = {
  caveat: {
    container:
      'rounded-md border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900',
    defaultTitle: 'Methodological note',
  },
  definition: {
    container:
      'rounded-md border-l-4 border-gray-400 bg-gray-50 p-4 text-sm text-gray-800',
    defaultTitle: null,
  },
  finding: {
    container:
      'rounded-md border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900',
    defaultTitle: 'Key finding',
  },
  aside: {
    // No background, no rounded card — feels conversational.
    container:
      'border-l-2 border-gray-200 pl-6 italic text-gray-700 text-[0.95em]',
    defaultTitle: null,
  },
};

/**
 * Callout — a labelled, visually distinct block of prose.
 *
 * Four variants:
 * - caveat (amber): methodological warnings, e.g. survey mode shifts.
 * - definition (gray): defines a term used throughout the section.
 * - finding (blue): the one-sentence punchline of a section.
 * - aside (italic, no card): a conversational digression.
 *
 * Use sparingly — at most one per section. Callouts that are too frequent
 * lose their visual weight and start to read as decoration.
 */
export function Callout({
  variant = 'caveat',
  title,
  children,
}: CalloutProps) {
  const spec = VARIANTS[variant];
  const resolvedTitle = title === undefined ? spec.defaultTitle : title;

  return (
    <aside className={`my-8 not-prose ${spec.container}`}>
      {resolvedTitle && (
        <strong className="font-semibold mr-1">{resolvedTitle}.</strong>
      )}
      <span>{children}</span>
    </aside>
  );
}
