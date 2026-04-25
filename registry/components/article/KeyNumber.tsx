'use client';

import * as React from 'react';

export interface KeyNumberProps {
  /** The number itself. e.g. "47.5" — pre-formatted as a string. */
  value: string;
  /** Unit shown after the number. e.g. "points", "%", "million". */
  unit?: string;
  /** Caption below the number. Keep under ~20 words. */
  label: React.ReactNode;
  /**
   * Optional change indicator below the label. e.g. "+41 since 1977".
   * Sign of the change determines color: leading "+" is green, leading
   * "-" or "−" is red, anything else is neutral.
   */
  change?: string;
  /**
   * Visual alignment. Default "left". Use "center" for the article's
   * single anchor number near the top.
   */
  align?: 'left' | 'center';
}

function changeColor(change: string): string {
  const trimmed = change.trim();
  if (trimmed.startsWith('+')) return 'text-green-700 bg-green-50';
  if (trimmed.startsWith('-') || trimmed.startsWith('−'))
    return 'text-red-700 bg-red-50';
  return 'text-gray-700 bg-gray-100';
}

/**
 * KeyNumber — large, weighted display of a single number with a label.
 * Magazine pattern. Best for the article's anchor number near the top.
 * Use at most once per article — multiple KeyNumbers compete for attention.
 *
 * For numbers in body prose, just write them inline.
 */
export function KeyNumber({
  value,
  unit,
  label,
  change,
  align = 'left',
}: KeyNumberProps) {
  return (
    <div
      className={[
        'not-prose my-8',
        align === 'center' ? 'text-center' : 'text-left',
      ].join(' ')}
    >
      <div className="flex items-baseline gap-2 justify-start">
        {align === 'center' && <span className="flex-1" />}
        <span className="text-6xl font-semibold tracking-tight tabular-nums text-body">
          {value}
        </span>
        {unit && (
          <span className="text-2xl text-muted font-normal">{unit}</span>
        )}
        {align === 'center' && <span className="flex-1" />}
      </div>
      <div
        className={[
          'mt-2 text-sm text-subtle max-w-md leading-snug',
          align === 'center' ? 'mx-auto' : '',
        ].join(' ')}
      >
        {label}
      </div>
      {change && (
        <div
          className={[
            'mt-2',
            align === 'center' ? 'flex justify-center' : '',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block px-2 py-0.5 rounded-md text-xs font-medium tabular-nums',
              changeColor(change),
            ].join(' ')}
          >
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
