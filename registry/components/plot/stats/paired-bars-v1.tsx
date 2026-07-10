'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface PairedBarsItem {
  /** Row label (groups are kept in the given order). */
  label: string;
  /** Magnitude of the left-side measure (drawn left of center). */
  left: number;
  /** Magnitude of the right-side measure (drawn right of center). */
  right: number;
}

export interface PairedBarsData {
  items: PairedBarsItem[];
  /** Legend/label for the left measure. */
  leftLabel: string;
  /** Legend/label for the right measure. */
  rightLabel: string;
  note?: string;
}

export interface PairedBarsProps {
  data: PairedBarsData;
  /**
   * Explicit semantic domain for the two measures' colors. Default null uses the
   * theme's categorical cycle (two distinct hues). Never inferred from data.
   */
  colorDomain?: 'party' | 'sentiment' | null;
  width?: number;
  height?: number;
}

/**
 * PairedBars — two measures per group, back to back around a center axis.
 *
 * Two distinct measures (e.g. an access barrier vs. a behavior) are a meaningful
 * two-color contrast resolved from the theme. Groups keep the data's order so a
 * gradient (e.g. income low→high) reads top-to-bottom. Ported from "Picturing
 * American Health" (Ch.4).
 */
const PairedBars: React.FC<PairedBarsProps> = ({
  data,
  colorDomain = null,
  width,
  height,
}) => {
  const { theme, colorScale } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = data?.items ?? [];
    if (items.length === 0) return;

    const leftLabel = data.leftLabel ?? 'left';
    const rightLabel = data.rightLabel ?? 'right';
    const order = items.map((d) => d.label);
    const rows: { label: string; measure: string; x: number }[] = [];
    for (const d of items) {
      rows.push({ label: d.label, measure: leftLabel, x: -d.left });
      rows.push({ label: d.label, measure: rightLabel, x: d.right });
    }

    const few = items.length <= 8;
    const rowH = few ? 34 : 14;

    const chart = Plot.plot({
      width: width ?? (few ? 560 : 720),
      height: height ?? 48 + items.length * rowH,
      marginLeft: 80,
      marginRight: 80,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        label: `← ${leftLabel}        ${rightLabel} →`,
        labelAnchor: 'center',
        tickFormat: (d) => Math.abs(d as number) + '%',
      },
      y: { domain: order, label: null },
      color: {
        ...colorScale(colorDomain, [leftLabel, rightLabel]),
        legend: true,
      },
      marks: [
        Plot.barX(rows, { y: 'label', x: 'x', fill: 'measure', tip: true }),
        // textAnchor is a fixed style, not a per-datum channel (Plot's types
        // reject a function there) — split into two marks, one per side,
        // rather than fight the type with a cast.
        ...(few
          ? [
              Plot.text(
                rows.filter((d) => d.x < 0),
                {
                  y: 'label',
                  x: 'x',
                  text: (d) => `${Math.abs(d.x)}%`,
                  textAnchor: 'end',
                  dx: -4,
                  fill: theme.muted,
                  fontSize: 10,
                },
              ),
              Plot.text(
                rows.filter((d) => d.x >= 0),
                {
                  y: 'label',
                  x: 'x',
                  text: (d) => `${Math.abs(d.x)}%`,
                  textAnchor: 'start',
                  dx: 4,
                  fill: theme.muted,
                  fontSize: 10,
                },
              ),
            ]
          : []),
        Plot.ruleX([0], { stroke: theme.muted }),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, colorDomain, width, height, theme, colorScale]);

  return <div ref={containerRef} />;
};

export default PairedBars;
