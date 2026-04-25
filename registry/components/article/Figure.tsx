'use client';

import * as React from 'react';

export type FigureWidth =
  | 'body'          // matches the prose column (~768px). Default.
  | 'body-outset'   // slight breathing room (~880px); for hero charts that want air.
  | 'page-outset'   // wider than the prose column (~1080px); for SmallMultiples 4-up,
                    // wide tables, or comparison figures that need horizontal room.
  | 'screen-inset'; // close to viewport-edge, with a small inset; punctuation moments only.

export interface FigureProps {
  /**
   * Width zone. Borrowed from Distill / Radix / academic-article CSS
   * vernacular. The zone defines how far the figure breaks out of the
   * prose column at md: and up; below md:, all zones collapse to body
   * width (there's no horizontal room to escape into).
   *
   * Default: 'body' — same width as surrounding prose.
   */
  width?: FigureWidth;
  /**
   * Optional figcaption rendered below the figure content. Pass JSX so
   * you can inline figure numbers, links, etc. The figure itself does
   * not number — that's the author's call (per composition.md, every
   * figure is numbered + cross-referenced).
   *
   * If your inner content already renders its own <figcaption> (e.g.
   * <DataTable>), omit this — you don't want two captions.
   */
  caption?: React.ReactNode;
  /**
   * The figure body — typically a chart, SmallMultiples, table, or
   * image. Wrap in `not-prose` if not already (the wrapper does NOT
   * wrap in not-prose for you, since some captions are prose-styled).
   */
  children: React.ReactNode;
}

/**
 * Per-zone escape classes. Gated to `lg:` (1024px) and up — below that
 * the prose column already fills most of the viewport, so there's no
 * horizontal room to outset into. Sub-`lg:` everything collapses to
 * body width (= prose column width).
 *
 * The escape uses the standard "negative-margin to viewport-edge"
 * trick:
 *
 *   margin-left  = 50% - 50vw + Xrem
 *   max-width    = 100vw - 2*Xrem
 *
 * Where X is the inset distance from the viewport edge. The `mx-`
 * arbitrary-value class sets *both* horizontal margins to that
 * negative value, which (combined with `max-w-[100vw-2*Xrem]`)
 * produces a centered figure with `Xrem` of breathing room from each
 * viewport edge.
 *
 * Inset choices:
 *   body-outset   — 8rem inset (light escape; ~880px on a 1280 screen)
 *   page-outset   — 4rem inset (substantial escape; ~1152px on 1280)
 *   screen-inset  — 2rem inset (near-bleed; ~1216px on 1280)
 *
 * Note: at `lg:` (1024px), even `body-outset` collapses to roughly
 * body width because the calc resolves to ~0 margin. The visual
 * difference between zones really shows at `xl:` (1280px) and up,
 * which matches how Distill handled it — escape is a desktop-only
 * affordance.
 */
const WIDTH_CLASS: Record<FigureWidth, string> = {
  body: '',
  'body-outset':
    'lg:mx-[calc(50%-50vw+8rem)] lg:max-w-[calc(100vw-16rem)]',
  'page-outset':
    'lg:mx-[calc(50%-50vw+4rem)] lg:max-w-[calc(100vw-8rem)]',
  'screen-inset':
    'lg:mx-[calc(50%-50vw+2rem)] lg:max-w-[calc(100vw-4rem)]',
};

/**
 * Figure — Distill-style layout zone wrapper. Use to give a chart,
 * SmallMultiples, table, or image more (or less) horizontal room than
 * the prose column. Authors pick the zone editorially:
 *
 * | width        | Use for                                              |
 * | ------------ | ---------------------------------------------------- |
 * | body         | inline figure, single chart (default)                |
 * | body-outset  | hero chart that wants slight breathing room          |
 * | page-outset  | SmallMultiples 4-up, wide table, comparison figure   |
 * | screen-inset | rare — full-bleed-ish punctuation                    |
 *
 * Below md:, every zone collapses to body width.
 *
 * Implementation note: this component emits a `<figure>` element. If
 * an inner component (DataTable, SmallMultiples) also emits a
 * `<figure>`, you'd get nested figures. To avoid that, those
 * components should be passed without their own figure wrapper, OR you
 * wrap a chart's `<div>` directly without emitting a second figure.
 *
 * Use:
 *
 *   <Figure width="page-outset" caption="Figure 4. Confidence in four institutions, by education.">
 *     <SmallMultiples ...>...</SmallMultiples>
 *   </Figure>
 *
 * If your inner content is itself a complete figure (like DataTable or
 * the existing SmallMultiples, which both render their own
 * <figcaption>), omit `caption` and just use Figure for the width
 * escape:
 *
 *   <Figure width="page-outset">
 *     <SmallMultiples ...>...</SmallMultiples>
 *   </Figure>
 */
export function Figure({ width = 'body', caption, children }: FigureProps) {
  const escapeClass = WIDTH_CLASS[width];
  // We render a <div>, not a <figure>, when the child is already a
  // complete figure — to keep HTML valid (no nested <figure>). If a
  // caption is passed, we DO emit <figure>+<figcaption> here, on the
  // assumption the inner is a bare chart/table that doesn't have its
  // own caption.
  if (caption) {
    return (
      <figure className={['not-prose my-10', escapeClass].filter(Boolean).join(' ')}>
        {children}
        <figcaption className="mt-3 text-sm italic text-muted leading-snug">
          {caption}
        </figcaption>
      </figure>
    );
  }
  return (
    <div className={['not-prose my-10', escapeClass].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
