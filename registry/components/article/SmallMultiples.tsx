'use client';

import * as React from 'react';

export interface SmallMultiplesProps {
  /**
   * Each child is a single panel. Each panel should be a chart rendered
   * with `compact={true}` so it has no card chrome, no internal title,
   * no per-panel legend, no presidential reference areas, and sparse
   * x-ticks. The grid provides one shared legend, source, and (if set)
   * shared y-axis range.
   */
  children: React.ReactNode;
  /**
   * Number of grid columns at the lg: breakpoint and up. md: gets
   * `Math.min(columns, 2)`; below md: always single column. Default 2.
   */
  columns?: 2 | 3 | 4;
  /**
   * Optional subtitle / caption above the grid. Use sparingly — usually
   * the surrounding prose `###` heading is enough. Renders as a small
   * secondary line, not as a heading.
   */
  subtitle?: string;
  /**
   * Optional shared legend rendered above the grid. Pass JSX so the
   * caller controls the swatch + label shape. If only one series across
   * all panels, the legend can be omitted — the panel labels carry it.
   */
  legend?: React.ReactNode;
  /**
   * Shared source line below the grid. Required — without a source the
   * panels look orphaned.
   */
  source: string;
  /**
   * Each panel gets a small uppercase label above it. Pass labels in the
   * same order as children. Required — small multiples without panel
   * labels are illegible.
   */
  labels: string[];
  /**
   * Shared y-axis domain across all panels. When set, threaded into each
   * child chart via the `sharedYDomain` prop so panel comparisons line up.
   * If omitted, each panel auto-scales independently — the visual
   * comparison breaks, so set this whenever the panels share units.
   */
  sharedY?: [number, number];
}

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'lg:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

/**
 * SmallMultiples — grid of compact charts with one shared legend, one
 * shared source, and (optionally) a shared y-axis. Use for 4–9 panels of
 * identical shape. For 2 panels, just place full-size charts side by
 * side. For 12+ panels, group into two separate small-multiples figures.
 *
 * The wrapper is intentionally light: no outer card, no shadow. The
 * grid sits directly on the page tint. Each panel is framed with a thin
 * border + an uppercase label. The whole thing reads as one figure.
 *
 * The prose `###` heading above the figure should introduce the grid;
 * this component does not render its own title to avoid duplication.
 *
 * Children must accept `compact?: boolean` and `sharedYDomain?: [number,
 * number]`. The wrapper clones each child element to inject those props.
 */
export function SmallMultiples({
  children,
  columns = 2,
  subtitle,
  legend,
  source,
  labels,
  sharedY,
}: SmallMultiplesProps) {
  const items = React.Children.toArray(children);
  const gridClass = `grid grid-cols-1 ${COLUMN_CLASSES[columns]} gap-4`;

  return (
    <figure className="not-prose my-10">
      {(subtitle || legend) && (
        <div className="mb-4 flex flex-col gap-2">
          {subtitle && (
            <p className="text-sm text-subtle leading-snug">{subtitle}</p>
          )}
          {legend && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-subtle">
              {legend}
            </div>
          )}
        </div>
      )}

      <div className={gridClass}>
        {items.map((child, i) => {
          const label = labels[i];
          const childWithProps = React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{
                  compact?: boolean;
                  sharedYDomain?: [number, number];
                }>,
                {
                  compact: true,
                  ...(sharedY ? { sharedYDomain: sharedY } : {}),
                },
              )
            : child;

          return (
            <div key={i} className="flex flex-col">
              {label && (
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">
                  {label}
                </div>
              )}
              <div className="bg-card rounded-md border border-border">
                {childWithProps}
              </div>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-4 text-xs text-muted italic leading-snug">
        Source: {source}
      </figcaption>
    </figure>
  );
}

/**
 * SmallMultiplesLegendItem — small helper for building the shared legend.
 * Use as: <SmallMultiplesLegendItem color={someThemeColor} label="College" />
 */
export function SmallMultiplesLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
