'use client';

import * as React from 'react';

export interface StepProps {
  /** The step number, rendered in a small circle on the left. */
  number: number;
  /** Bold heading for the step. */
  title: string;
  children: React.ReactNode;
}

/**
 * Step — a single numbered-step block. Use inside a wrapping <ol> or
 * <div> with sibling <Step>s. Better than markdown `1. 2. 3.` because
 * the styling is consistent and the number lives in a fixed-width
 * gutter (so multi-line content lines up).
 *
 * Use for "how to read this chart" sections, "what this means" sections,
 * or process descriptions. NOT for ranked lists where the order is
 * arbitrary — use a regular bulleted list instead.
 */
export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4 my-4 not-prose">
      <div className="flex-shrink-0">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-body text-white text-sm font-semibold tabular-nums">
          {number}
        </span>
      </div>
      <div className="flex-1 pt-0.5">
        <div className="font-semibold text-body mb-1">{title}</div>
        <div className="text-subtle leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
