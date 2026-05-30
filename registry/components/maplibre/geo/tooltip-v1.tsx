'use client';

// <MapTooltip> — a THEMED React hover tooltip, positioned from <ChoroplethLayer>'s
// onHover screen coordinates. Rendered in React (not MapLibre) so it shares the
// token system and matches the Recharts tooltip styling (rc.tooltip) for
// cross-engine visual consistency.
//
// Presentational + controlled: the parent holds hover state and renders this
// inside <GeoMap> (which is position:relative), e.g.
//
//   const [hover, setHover] = useState<{id,value,x,y}|null>(null);
//   <ChoroplethLayer … onHover={(id,value,p)=> setHover(id&&p ? {id,value,...p}:null)} />
//   <MapTooltip visible={!!hover} x={hover?.x ?? 0} y={hover?.y ?? 0}
//               label={hover?.id} value={hover?.value ?? null} />

import { useVizTheme } from '@/viz/theme/provider';

export interface MapTooltipProps {
  visible: boolean;
  /** Screen position within the GeoMap container (from onHover's `point`). */
  x: number;
  y: number;
  label?: string;
  value: number | null;
  /** Format the value. Default: compact number. */
  format?: (n: number) => string;
}

const defaultFormat = (n: number): string => {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US');
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

export default function MapTooltip({
  visible,
  x,
  y,
  label,
  value,
  format = defaultFormat,
}: MapTooltipProps) {
  const { rc } = useVizTheme();
  if (!visible) return null;

  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(12px, -50%)',
        pointerEvents: 'none',
        zIndex: 2,
        background: rc.tooltip.background,
        border: rc.tooltip.border,
        color: rc.tooltip.color,
        fontFamily: rc.fontBody,
        fontSize: 12,
        lineHeight: 1.35,
        padding: '6px 8px',
        borderRadius: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        whiteSpace: 'nowrap',
      }}
    >
      {label && <div style={{ fontWeight: 600 }}>{label}</div>}
      <div style={{ color: value == null ? rc.muted : rc.fg }}>
        {value == null ? 'No data' : format(value)}
      </div>
    </div>
  );
}
