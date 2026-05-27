'use client';

import * as React from 'react';

export interface StaticChartV1Props {
  /**
   * Resolved URL or path to the SVG. Caller is responsible for
   * resolving Tigris-relative keys to a usable URL or local path
   * before passing in. The component does no fetching.
   *
   * Acceptable forms:
   *   - Full URL:                "https://cdn.example.com/foo.svg"
   *   - Public CDN URL:          "https://t3.storage.dev/..."
   *   - App-local path:          "/articles/<slug>/data/foo.svg"
   *   - Inline data URI:         "data:image/svg+xml;..."
   */
  svgUrl: string;
  /**
   * Required for accessibility. Describe what the chart shows in
   * one sentence ("Republican confidence in science from 2010 to
   * 2024").
   */
  alt: string;
  /**
   * Optional source line shown below the image, matching the live-
   * chart envelope. If omitted, no source row renders.
   */
  source?: string;
  /**
   * Optional small text shown above the image as the chart title.
   * If your figure already provides a title via `<Figure caption>`,
   * leave this off — two titles look like noise.
   */
  title?: string;
  /**
   * Optional subtitle below the title (same role as the live chart's
   * subtitle). Same advice as `title` — only set if the surrounding
   * Figure isn't already providing context.
   */
  subtitle?: string;
}

/**
 * StaticChartV1 — a pre-rendered chart image inside the standard live-
 * chart visual envelope (white card, padding, optional title /
 * subtitle, source row).
 *
 * Use this when:
 *   1. The variable's `svg_url` (from `gss-charts` Step 2 metadata) is
 *      non-null, AND
 *   2. The article author has explicitly chosen the static version
 *      (planner output sets `static_preferred: true`).
 *
 * The default for live data is `<TimeseriesLineV1>` or
 * `<TimeseriesIndexV1>` — those carry interactive controls (legend
 * toggling, CI overlay) the static version can't. Reach for static
 * only when "the canonical pre-rendered version" is the editorial
 * point: an institutionally-published chart, a frozen reference
 * snapshot, or a paragraph where interactive controls would distract.
 *
 * No fetch. The caller resolves the URL — either from a manifest
 * the article-side fetch script wrote during data fetch, or directly
 * from `graph_metadata.svg_url`.
 */
export function StaticChartV1({ svgUrl, alt, source, title, subtitle }: StaticChartV1Props) {
  return (
    <div className="w-full bg-white rounded-lg shadow px-4 md:px-6 pt-3 md:pt-4 pb-4 md:pb-5">
      {(title || subtitle) && (
        <div className="mb-2">
          {title && (
            <h2 className="text-base font-semibold text-gray-800 leading-snug">{title}</h2>
          )}
          {subtitle && (
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      )}

      <div className="w-full">
        <img
          src={svgUrl}
          alt={alt}
          className="block w-full h-auto"
          loading="lazy"
        />
      </div>

      {source && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-1 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-left order-1 sm:order-none">
            Source: {source}
          </div>
        </div>
      )}
    </div>
  );
}

export default StaticChartV1;
