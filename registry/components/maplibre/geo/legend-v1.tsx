'use client';

// <MapLegend> — a THEMED React legend (not a MapLibre-native control), so it
// shares the token system and reads the SAME ResolvedScale the choropleth fill
// is compiled from. Accessibility: the legend is always visible, so the map is
// never encoded by color alone.
//
//   continuous → CSS linear-gradient with min / (center) / max ticks
//   classed    → discrete swatches with bin edges

import { useVizTheme } from '@/viz/theme/provider';
import { toGradientStops, type ScaleSpec, type ResolvedScale } from '@/viz/theme/scales';

export interface MapLegendProps {
  scale: ScaleSpec;
  /** Match the choropleth's `classed` so the legend mirrors the fill. */
  classed?: boolean;
  title?: string;
  /** Format a domain value for the ticks. Default: compact number. */
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number): string => {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US');
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

export default function MapLegend({
  scale,
  classed = false,
  title,
  format = defaultFormat,
  className,
}: MapLegendProps) {
  const { theme, scaleFor } = useVizTheme();
  const resolved = scaleFor(scale);
  const { colors, stops } = resolved;

  const frame: React.CSSProperties = {
    fontFamily: theme.fontBody,
    color: theme.fg,
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 4,
    padding: '8px 10px',
    fontSize: 11,
    lineHeight: 1.4,
    maxWidth: 220,
  };

  return (
    <div className={className} style={frame}>
      {title && (
        <div style={{ color: theme.muted, marginBottom: 6, fontWeight: 600 }}>{title}</div>
      )}
      {classed ? (
        <ClassedSwatches colors={colors} stops={stops} muted={theme.muted} format={format} />
      ) : (
        <ContinuousBar
          resolved={resolved}
          diverging={scale.kind === 'diverging'}
          border={theme.border}
          muted={theme.muted}
          format={format}
        />
      )}
    </div>
  );
}

function ContinuousBar({
  resolved,
  diverging,
  border,
  muted,
  format,
}: {
  resolved: ResolvedScale;
  diverging: boolean;
  border: string;
  muted: string;
  format: (n: number) => string;
}) {
  const gradient = toGradientStops(resolved);
  const css = gradient.map((g) => `${g.color} ${(g.offset * 100).toFixed(1)}%`).join(', ');
  const { stops } = resolved;
  const min = stops[0];
  const max = stops[stops.length - 1];
  const midIdx = (stops.length - 1) / 2;
  const showCenter = diverging && Number.isInteger(midIdx);
  const centerVal = showCenter ? stops[midIdx] : undefined;
  const centerOffset = showCenter ? (centerVal! - min) / ((max - min) || 1) : 0;

  return (
    <div>
      <div
        style={{
          height: 10,
          borderRadius: 2,
          border: `1px solid ${border}`,
          background: `linear-gradient(to right, ${css})`,
        }}
      />
      <div style={{ position: 'relative', height: 14, marginTop: 2, color: muted }}>
        <span style={{ position: 'absolute', left: 0 }}>{format(min)}</span>
        {showCenter && (
          <span
            style={{ position: 'absolute', left: `${centerOffset * 100}%`, transform: 'translateX(-50%)' }}
          >
            {format(centerVal!)}
          </span>
        )}
        <span style={{ position: 'absolute', right: 0 }}>{format(max)}</span>
      </div>
    </div>
  );
}

function ClassedSwatches({
  colors,
  stops,
  muted,
  format,
}: {
  colors: string[];
  stops: number[];
  muted: string;
  format: (n: number) => string;
}) {
  // colors[i] paints values in [stops[i], stops[i+1]); colors[0] is the low end.
  const rows = colors.map((color, i) => {
    let label: string;
    if (i === 0) label = `< ${format(stops[1])}`;
    else if (i === colors.length - 1) label = `≥ ${format(stops[i])}`;
    else label = `${format(stops[i])} – ${format(stops[i + 1])}`;
    return { color, label };
  });
  return (
    <div style={{ display: 'grid', gap: 3 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{ width: 14, height: 10, background: r.color, borderRadius: 2, flex: '0 0 auto' }}
          />
          <span style={{ color: muted }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}
