'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import { useVizTheme } from '@/viz/theme/provider';

export interface PCAScore {
  x: number;
  y: number;
}

export interface PCALoading {
  label: string;
  x: number;
  y: number;
}

export interface PCABiplotData {
  /** County (observation) scores. */
  points: PCAScore[];
  /** Variable loadings (arrows from the origin). */
  arrows: PCALoading[];
  /** Variance explained by PC1 (number, shown as %). */
  pc1_var?: number | string;
  /** Variance explained by PC2 (number, shown as %). */
  pc2_var?: number | string;
  note?: string;
}

export interface PCABiplotProps {
  data: PCABiplotData;
  width?: number;
  height?: number;
}

/**
 * PCABiplot — observation scores as a faint point cloud plus variable loadings as
 * labeled arrows from the origin.
 *
 * Scores and loadings are co-scaled (scores blown up by a constant so their
 * spread matches the loadings' range) so the cloud fills the frame while every
 * relative position is preserved. Loadings are drawn in a meaningful red (a role
 * distinction: vectors vs. cloud), resolved from the theme. Labels are
 * de-collided vertically within each side. Ported from "Picturing American
 * Health" (Ch.10).
 */
const PCABiplot: React.FC<PCABiplotProps> = ({
  data,
  width = 720,
  height = 560,
}) => {
  const { theme, colorFor } = useVizTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rawPoints = data?.points ?? [];
    const arrows = (data?.arrows ?? []).map((a) => ({ ...a, x0: 0, y0: 0 }));
    if (rawPoints.length === 0 && arrows.length === 0) return;

    // role-distinction red for the loading vectors (meaningful, not decorative)
    const vectorColor = colorFor('sentiment', 'negative');

    // co-scale: match the 98th-percentile point radius to the max arrow radius
    const arrowMax = Math.max(0.001, ...arrows.map((a) => Math.hypot(a.x, a.y)));
    const ptR = rawPoints
      .map((p) => Math.hypot(p.x, p.y))
      .sort((a, b) => a - b);
    const ptHi = ptR[Math.floor(ptR.length * 0.98)] || Math.max(0.001, ...ptR);
    const k = (arrowMax * 0.85) / ptHi;
    const points = rawPoints.map((p) => ({ x: p.x * k, y: p.y * k }));

    const labels = arrows.map((a) => {
      const ext = 0.22;
      return {
        x: a.x * (1 + ext),
        y: a.y * (1 + ext),
        label: a.label,
        anchor: a.x >= 0 ? 'start' : 'end',
      };
    });

    // de-collide labels vertically within each side
    const yvals = labels.map((l) => l.y);
    const yspan = Math.max(...yvals) - Math.min(...yvals) || 1;
    const minGap = yspan * 0.045;
    for (const side of ['start', 'end']) {
      const grp = labels
        .filter((l) => l.anchor === side)
        .sort((a, b) => a.y - b.y);
      for (let i = 1; i < grp.length; i++) {
        if (grp[i].y - grp[i - 1].y < minGap) grp[i].y = grp[i - 1].y + minGap;
      }
    }

    const chart = Plot.plot({
      width,
      height,
      marginLeft: 52,
      marginRight: 90,
      marginBottom: 44,
      marginTop: 24,
      style: {
        background: 'transparent',
        color: theme.fg,
        fontFamily: theme.fontBody,
        fontSize: '12px',
      },
      x: {
        label: `PC1 (${data?.pc1_var ?? ''}%) →`,
        labelAnchor: 'center',
        grid: theme.gridStyle !== 'none',
      },
      y: {
        label: `PC2 (${data?.pc2_var ?? ''}%) →`,
        grid: theme.gridStyle !== 'none',
      },
      marks: [
        Plot.ruleX([0], { stroke: theme.grid }),
        Plot.ruleY([0], { stroke: theme.grid }),
        Plot.dot(points, {
          x: 'x',
          y: 'y',
          r: 1.4,
          fill: theme.muted,
          fillOpacity: 0.35,
        }),
        Plot.arrow(arrows, {
          x1: 'x0',
          y1: 'y0',
          x2: 'x',
          y2: 'y',
          stroke: vectorColor,
          strokeWidth: 1.1,
          strokeOpacity: 0.8,
          headLength: 5,
        }),
        Plot.text(
          labels.filter((d) => d.anchor === 'start'),
          {
            x: 'x',
            y: 'y',
            text: 'label',
            fill: vectorColor,
            fontSize: 8.5,
            fontWeight: 600,
            textAnchor: 'start',
            dx: 2,
          },
        ),
        Plot.text(
          labels.filter((d) => d.anchor === 'end'),
          {
            x: 'x',
            y: 'y',
            text: 'label',
            fill: vectorColor,
            fontSize: 8.5,
            fontWeight: 600,
            textAnchor: 'end',
            dx: -2,
          },
        ),
      ],
    });

    containerRef.current.innerHTML = '';
    containerRef.current.append(chart);
    return () => {
      chart.remove();
    };
  }, [data, width, height, theme, colorFor]);

  return <div ref={containerRef} />;
};

export default PCABiplot;
