'use client';

// <GeoMap> — the MapLibre + PMTiles container (engine #3).
//
// Imperative wrapper (matching the Plot precedent): a thin React context hands
// child layers the `maplibre.Map` once it has `load`-ed. The root style is
// themed from `useVizTheme().ml`; data sources/layers are added by children
// (<ChoroplethLayer>), never here.
//
// CLIENT-ONLY. maplibre-gl touches `window` at import time, so consumers MUST
// import this via `next/dynamic { ssr:false }` and render a sized skeleton:
//
//   const GeoMap = dynamic(() => import('@/viz/components/maplibre/geo/map-v1'),
//     { ssr: false, loading: () => <div style={{ height: 480 }} /> });

import maplibregl, {
  type MapLibreMap,
  type LngLatBoundsLike,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useVizTheme } from '@/viz/theme/provider';

// --- pmtiles protocol: registered exactly ONCE per page -------------------
// addProtocol is global on the maplibregl namespace (not per-map), and throws
// if called twice for the same scheme — so guard at module scope. This also
// survives React 18 StrictMode's mount/unmount/mount in dev.
let _pmtilesRegistered = false;
function ensurePmtilesProtocol() {
  if (_pmtilesRegistered) return;
  maplibregl.addProtocol('pmtiles', new Protocol().tile);
  _pmtilesRegistered = true;
}

// --- context: children grab the Map once loaded ---------------------------
interface GeoMapContextValue {
  map: MapLibreMap | null;
  loaded: boolean;
  /** True when the OS requests reduced motion. Camera-animating layers should
   *  pass `duration: 0` (or skip easing) when this is set. */
  reducedMotion: boolean;
}
const GeoMapCtx = createContext<GeoMapContextValue>({
  map: null,
  loaded: false,
  reducedMotion: false,
});
export const useGeoMap = () => useContext(GeoMapCtx);

export interface GeoMapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface GeoMapProps {
  initialViewState?: GeoMapViewState;
  maxBounds?: LngLatBoundsLike;
  interactive?: boolean;
  /** Screen-reader summary of what the map shows — the raw canvas is not
   *  legible to assistive tech, so this is required, not optional. */
  ariaLabel: string;
  className?: string;
  /** px height — the canvas needs an explicit size or it collapses. Default 480. */
  height?: number;
  children?: ReactNode;
}

// NYC metro default (the demo's fast-loading NYC_MSA tileset sits here).
const DEFAULT_VIEW: GeoMapViewState = { longitude: -73.94, latitude: 40.7, zoom: 8 };

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export default function GeoMap({
  initialViewState = DEFAULT_VIEW,
  maxBounds,
  interactive = true,
  ariaLabel,
  className,
  height = 480,
  children,
}: GeoMapProps) {
  const { ml } = useVizTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const reducedMotion = prefersReducedMotion();

  // Build the map once. initialViewState/maxBounds/interactive are first-build
  // only — a rebuild on every prop tweak would refetch tiles and lose layer
  // feature-state. Re-theming is handled by the live-restyle effect below.
  useEffect(() => {
    if (!containerRef.current) return;
    ensurePmtilesProtocol();

    // Minimal boundary basemap: a themed background + (later) child fills. No
    // glyphs/sprite — boundary tilesets carry none, and labels are opt-in.
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': ml.background } },
      ],
    };

    const m = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom,
      maxBounds,
      interactive,
      // Sourcing lives in the surrounding figure caption (Plot-geo precedent),
      // so suppress the default control to keep the chrome quiet.
      attributionControl: false,
    });
    mapRef.current = m;

    if (interactive) {
      // Zoom only — no compass clutter (Tufte).
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }

    m.on('load', () => {
      setMap(m);
      setLoaded(true);
    });

    return () => {
      setLoaded(false);
      setMap(null);
      mapRef.current = null;
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live re-theme: when the active theme changes, restyle the background in
  // place instead of rebuilding the map.
  useEffect(() => {
    const m = mapRef.current;
    if (m && loaded) m.setPaintProperty('bg', 'background-color', ml.background);
  }, [ml.background, loaded]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height }}>
      {/* MapLibre owns this node exclusively — never let React reconcile
          children into it. Overlays (legend/tooltip) are siblings below. */}
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        style={{ position: 'absolute', inset: 0 }}
      />
      <GeoMapCtx.Provider value={{ map, loaded, reducedMotion }}>
        {children}
      </GeoMapCtx.Provider>
    </div>
  );
}
