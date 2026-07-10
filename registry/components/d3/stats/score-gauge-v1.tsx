'use client';

import React, { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

export interface ScoreGaugeData {
  /** 0–100, higher = better. */
  score: number;
  /** Caption under the number, e.g. "HEALTH SCORE". Defaults to "SCORE". */
  label?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface ScoreGaugeProps {
  data: ScoreGaugeData;
  /** Rendered width in px; the gauge keeps its aspect ratio. */
  width?: number;
}

// Fixed internal geometry — the svg scales via viewBox.
const W = 220;
const GH = 132;
const CX = 110;
const CY = 116;
const R = 92;
const ARC_W = 12;
const KNOB_R = 6.5;

function polar(deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
}

// Arc over the top semicircle: 180° (left) → 360° (right).
function arc(a0: number, a1: number): string {
  const [x0, y0] = polar(a0);
  const [x1, y1] = polar(a1);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`;
}

/**
 * ScoreGauge — a 0–100 score as a semicircular gauge with an end knob. The arc
 * color reads the score against the theme's sentiment roles (negative → neutral
 * → positive), so a low score is warm/"worse" and a high score cool/"better"
 * in every theme.
 *
 * Ported from the health-of-americas-zip-codes atlas (snapshot/ScoreGauge);
 * the original's glow filter was dropped in favor of quiet chrome.
 */
const ScoreGauge: React.FC<ScoreGaugeProps> = ({ data, width = 220 }) => {
  const { theme, d3, colorFor } = useVizTheme();

  const score = Math.max(0, Math.min(100, data.score));
  const angle = 180 + (score / 100) * 180;

  const color = useMemo(() => {
    const ramp = scaleLinear<string>()
      .domain([0, 50, 100])
      .range([
        colorFor('sentiment', 'negative'),
        colorFor('sentiment', 'neutral'),
        colorFor('sentiment', 'positive'),
      ])
      .clamp(true);
    return ramp(score);
  }, [colorFor, score]);

  const label = data.label ?? 'SCORE';
  const aria = `${label}: ${Math.round(score)} out of 100`;

  return (
    <figure style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody }}>
      {data.title && (
        <h2 style={{ fontFamily: theme.fontTitle, fontSize: d3.text.titleSize, fontWeight: 700, margin: '0 0 2px' }}>
          {data.title}
        </h2>
      )}
      {data.subtitle && (
        <h3 style={{ fontSize: d3.text.subtitleSize, fontWeight: 400, color: theme.muted, margin: '0 0 10px' }}>
          {data.subtitle}
        </h3>
      )}

      <svg
        role="img"
        aria-label={aria}
        viewBox={`0 0 ${W} ${GH}`}
        width={width}
        height={Math.round((width * GH) / W)}
        style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}
      >
        <title>{label}</title>
        <desc>{aria}</desc>

        {/* track */}
        <path d={arc(180, 360)} fill="none" stroke={d3.grid} strokeWidth={ARC_W} strokeLinecap="round" />
        {/* value arc */}
        <path d={arc(180, angle)} fill="none" stroke={color} strokeWidth={ARC_W} strokeLinecap="round" />
        {/* end knob, haloed by the surface so it separates from the arc */}
        <circle cx={polar(angle)[0]} cy={polar(angle)[1]} r={KNOB_R} fill={color} stroke={d3.surface} strokeWidth={d3.line.focusStrokeWidth} />

        <text
          x={CX}
          y={CY - 18}
          textAnchor="middle"
          fontSize={d3.text.titleSize * 2}
          fontWeight={700}
          fill={theme.fg}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(score)}
        </text>
        <text x={CX} y={CY + 2} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.muted} letterSpacing="0.04em">
          / 100 {label.toUpperCase()}
        </text>
        <text x={polar(180)[0]} y={CY + 16} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.muted}>0</text>
        <text x={polar(360)[0]} y={CY + 16} textAnchor="middle" fontSize={d3.text.annotationSize} fill={d3.muted}>100</text>
      </svg>

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>
          {data.source}
        </figcaption>
      )}
    </figure>
  );
};

export default ScoreGauge;
