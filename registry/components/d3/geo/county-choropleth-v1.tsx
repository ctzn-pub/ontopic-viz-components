'use client';

import React, { useMemo, useState, useId } from 'react';
import { feature, mesh } from 'topojson-client';
import { geoAlbersUsa, geoPath, geoTransform } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { useVizTheme } from '@/viz/theme/provider';

/**
 * One county's value, keyed by 5-digit FIPS (GEOID). `label`/`sub` populate the
 * hover tooltip; everything else is optional.
 */
export interface CountyDatum {
  fips: string;
  value: number;
  label?: string; // e.g. "Autauga, AL"
  sub?: string; // e.g. "poor kids p37 · rich kids p57"
}

export interface CountyChoroplethData {
  /** US counties TopoJSON ({ objects: { counties }}, GEOID on properties). */
  topology: unknown;
  /** Per-county values. */
  counties: CountyDatum[];
  /**
   * Diverging color domain [low, center, high]. Center is the neutral color
   * (e.g. the national mean / zero). Sequential if only [low, high] given.
   */
  domain?: number[];
  /** Units suffix shown in the tooltip, e.g. "percentiles" or "%". */
  unit?: string;
  title?: string;
  subtitle?: string;
  source?: string;
}

export interface CountyChoroplethProps {
  data: CountyChoroplethData;
  /** Override the color domain. */
  domain?: number[];
  width?: number;
}

/**
 * CountyChoropleth — a US county map (Albers-USA) with each county filled by a
 * value, theme-aware diverging colors, state-mesh borders, and a hover tooltip.
 * Counties with no joined value get a neutral "no data" fill.
 *
 * Derived from 34 county-choropleth figures across the birth_death corpus
 * (e.g. born-rich-premium#map — county mobility-premium map). The example data
 * is that figure's real `D.county` payload. Color domain and tooltip fields are
 * props, so the same component covers every county-rate map.
 */
const CountyChoropleth: React.FC<CountyChoroplethProps> = ({
  data,
  domain,
  width = 880,
}) => {
  const { theme, d3, scaleFor } = useVizTheme();
  const clipId = useId();
  const [hover, setHover] = useState<{ d: CountyDatum; x: number; y: number } | null>(null);

  const { paths, stateBorder, colorOf, vbW, vbH } = useMemo(() => {
    const topo = data?.topology as
      | { objects: { counties: unknown }; bbox?: number[] }
      | undefined;
    if (!topo) return { paths: [], stateBorder: '', colorOf: () => d3.muted, vbW: width, vbH: width * 0.62 };

    const fc = feature(topo as never, topo.objects.counties as never) as unknown as {
      type: 'FeatureCollection';
      features: { id?: string | number; properties?: Record<string, unknown> }[];
    };
    // County FIPS lives on `feature.id` in some county TopoJSONs and on
    // `properties.GEOID` in others — read whichever is present.
    const fipsOf = (f: { id?: string | number; properties?: Record<string, unknown> }): string =>
      String(f.id ?? f.properties?.GEOID ?? f.properties?.fips ?? '');
    const stateMesh = mesh(
      topo as never,
      topo.objects.counties as never,
      ((a: never, b: never) => fipsOf(a).slice(0, 2) !== fipsOf(b).slice(0, 2)) as never
    );

    // The county TopoJSON may be raw lng/lat OR already pre-projected into a
    // pixel coordinate space (bbox values far outside [-180,180]). For raw geo,
    // apply Albers-USA + fitSize. For pre-projected, render with NO projection
    // (an identity transform) and set the viewBox to the topo's own bbox, so we
    // don't double-project it into garbage.
    const bbox = topo.bbox;
    const preProjected = !!bbox && (bbox[2] > 181 || bbox[3] > 91 || bbox[0] < -181 || bbox[1] < -91);

    let path: ReturnType<typeof geoPath>;
    let outW = width;
    let outH = Math.round(width * 0.62);
    if (preProjected && bbox) {
      const [x0, y0, x1, y1] = bbox;
      outW = x1 - x0;
      outH = y1 - y0;
      // Identity transform that subtracts the bbox origin so coords start at 0.
      const identity = geoTransform({
        point(this: { stream: { point: (x: number, y: number) => void } }, x: number, y: number) {
          this.stream.point(x - x0, y - y0);
        },
      });
      path = geoPath(identity as never);
    } else {
      const projection = geoAlbersUsa().fitSize([outW, outH], fc as never);
      path = geoPath(projection);
    }

    const byFips = new Map(data.counties.map((c) => [c.fips, c]));

    // Theme-resolved diverging (or sequential) color ramp across the domain.
    const dom = domain ?? data.domain ?? extentDomain(data.counties);
    const ramp =
      dom.length >= 3
        ? scaleFor({ kind: 'diverging', domain: [dom[0], dom[1], dom[dom.length - 1]] })
        : scaleFor({ kind: 'sequential', domain: [dom[0], dom[dom.length - 1]] });
    const colorScale = scaleLinear<string>()
      .domain(ramp.stops)
      .range(ramp.colors)
      .clamp(true);

    const colorOf = (fips: string): string => {
      const rec = byFips.get(fips);
      // Theme gridline color reads as "no data" on both light and dark surfaces.
      return rec ? colorScale(rec.value) : d3.grid;
    };

    const paths = fc.features.map((f, i) => {
      const fips = fipsOf(f);
      return {
        key: fips || `f${i}`,
        d: path(f as never) ?? '',
        fips,
        datum: byFips.get(fips) ?? null,
      };
    });

    return { paths, stateBorder: path(stateMesh as never) ?? '', colorOf, vbW: outW, vbH: outH };
  }, [data, domain, width, d3.muted, d3.grid, scaleFor]);

  return (
    <figure
      className="county-choropleth"
      style={{ margin: 0, color: theme.fg, fontFamily: theme.fontBody, position: 'relative' }}
    >
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
        aria-label={data.title ?? 'US county choropleth'}
        viewBox={`0 0 ${vbW} ${vbH}`}
        width="100%"
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        onMouseLeave={() => setHover(null)}
      >
        <clipPath id={clipId}>
          <rect width={vbW} height={vbH} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill={colorOf(p.fips)}
              stroke="none"
              onMouseMove={(e) => {
                if (!p.datum) return setHover(null);
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ d: p.datum, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
            />
          ))}
          <path d={stateBorder} fill="none" stroke={theme.surface} strokeWidth={d3.line.mutedStrokeWidth} />
        </g>
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.x + 14, width - 180),
            top: hover.y + 14,
            pointerEvents: 'none',
            background: theme.fg,
            color: theme.surface,
            padding: '6px 9px',
            borderRadius: 6,
            fontSize: d3.axis.tickSize,
            lineHeight: 1.35,
            maxWidth: 220,
            zIndex: 10,
          }}
        >
          <strong>{hover.d.label ?? hover.d.fips}</strong>
          <br />
          {fmt(hover.d.value)}
          {data.unit ? ` ${data.unit}` : ''}
          {hover.d.sub ? (
            <>
              <br />
              <span style={{ opacity: 0.75 }}>{hover.d.sub}</span>
            </>
          ) : null}
        </div>
      )}

      {data.source && (
        <figcaption style={{ fontSize: d3.text.sourceSize, color: theme.muted, marginTop: 8 }}>
          {data.source}
        </figcaption>
      )}
    </figure>
  );
};

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Symmetric-ish diverging domain from the data when none is supplied. */
function extentDomain(rows: CountyDatum[]): number[] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rows) {
    if (r.value < lo) lo = r.value;
    if (r.value > hi) hi = r.value;
  }
  if (!isFinite(lo)) return [0, 1];
  const mid = (lo + hi) / 2;
  return [lo, mid, hi];
}

export default CountyChoropleth;
