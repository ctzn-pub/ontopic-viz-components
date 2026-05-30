'use client';

// <ChoroplethLayer> — the core of the map engine.
//
// Headless: renders nothing, adds a vector source + a fill layer (and a hairline
// outline layer) to the <GeoMap> from context, and JOINS an external data array
// to tile features via `feature-state`. Changing the `data` prop updates colors
// WITHOUT rebuilding the layer — that's what makes "new survey question" cheap.
//
// Join contract (see design/05):
//   1. addSource with `promoteId` so each feature's id IS the join key.
//   2. fill-color is a compiled scale expression reading ['feature-state','value'].
//   3. push values with setFeatureState keyed by id — after tiles load, and
//      re-applied on `sourcedata` (MapLibre only retains state for loaded tiles).
//   4. on data change, diff + setFeatureState/removeFeatureState. Never rebuild.
//
// Multi-resolution block-group pair: render TWO of these, e.g. us_bg_zoom5 with
// maxzoom={6} and us_bg with minzoom={6}, same joinKey/data/scale, distinct `id`.

import { useEffect, useRef } from 'react';
import type { MapLayerMouseEvent, MapSourceDataEvent } from 'maplibre-gl';
import { useGeoMap } from './map-v1';
import { useVizTheme } from '@/viz/theme/provider';
import {
  toMaplibreFill,
  toMaplibreStep,
  type ScaleSpec,
  type MaplibreExpression,
} from '@/viz/theme/scales';

export interface ChoroplethLayerProps {
  /** pmtiles archive URL. The `pmtiles://` scheme is added if you omit it. */
  url: string;
  /** vector_layers[].id from `pmtiles show` — the tile's source layer. */
  sourceLayer: string;
  /** Feature property that matches your data keys (e.g. 'GEOID'). */
  joinKey: string;
  /** { [joinKeyValue]: value } — the survey/health values to paint. */
  data: Record<string, number>;
  /** Continuous (sequential | diverging) scale spec from scales.ts. */
  scale: ScaleSpec;
  /** step vs continuous fill. Default false (continuous). */
  classed?: boolean;
  /** Insert below this layer id (e.g. labels). */
  beforeId?: string;
  minzoom?: number;
  maxzoom?: number;
  /** Stable id so multiple layers on one map don't collide. Default = sourceLayer. */
  id?: string;
  /** Fired on hover. `point` is the screen position for positioning <MapTooltip>. */
  onHover?: (
    id: string | null,
    value: number | null,
    point?: { x: number; y: number },
  ) => void;
}

export default function ChoroplethLayer({
  url,
  sourceLayer,
  joinKey,
  data,
  scale,
  classed = false,
  beforeId,
  minzoom,
  maxzoom,
  id,
  onHover,
}: ChoroplethLayerProps) {
  const { map, loaded } = useGeoMap();
  const { ml, scaleFor } = useVizTheme();

  const baseId = id ?? sourceLayer;
  const sourceId = `${baseId}__src`;
  const fillId = `${baseId}__fill`;
  const lineId = `${baseId}__line`;
  const sourceUrl = url.startsWith('pmtiles://') ? url : `pmtiles://${url}`;

  // Resolve the scale against the ACTIVE theme, then compile to a GPU paint
  // expression. Re-resolves (new colors) when the theme or spec changes.
  const resolved = scaleFor(scale);
  const fillExpr: MaplibreExpression = classed
    ? toMaplibreStep(resolved)
    : toMaplibreFill(resolved);
  // Outline: hairline on every boundary, thickened + darkened on hover.
  const lineColorExpr: MaplibreExpression = [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    ml.boundaryHover.color,
    ml.boundary.color,
  ];
  const lineWidthExpr: MaplibreExpression = [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    ml.boundaryHover.width,
    ml.boundary.width,
  ];

  // Latest-value refs so the long-lived MapLibre event handlers and the
  // sourcedata re-apply read current props without re-subscribing.
  const dataRef = useRef(data);
  const appliedRef = useRef<Record<string, number>>({});
  const onHoverRef = useRef(onHover);
  const hoveredIdRef = useRef<string | null>(null);
  const styleRef = useRef({ fillExpr, lineColorExpr, lineWidthExpr });
  dataRef.current = data;
  onHoverRef.current = onHover;
  styleRef.current = { fillExpr, lineColorExpr, lineWidthExpr };

  // --- structural: add source + layers + handlers (rebuild only on identity) ---
  useEffect(() => {
    if (!map || !loaded) return;

    const applyAll = () => {
      for (const key in dataRef.current) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: key },
          { value: dataRef.current[key] },
        );
      }
      appliedRef.current = { ...dataRef.current };
    };

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: sourceUrl,
        promoteId: { [sourceLayer]: joinKey },
      });
    }

    if (!map.getLayer(fillId)) {
      map.addLayer(
        {
          id: fillId,
          type: 'fill',
          source: sourceId,
          'source-layer': sourceLayer,
          minzoom,
          maxzoom,
          paint: { 'fill-color': styleRef.current.fillExpr as never, 'fill-antialias': true },
        },
        beforeId,
      );
    }
    if (!map.getLayer(lineId)) {
      map.addLayer(
        {
          id: lineId,
          type: 'line',
          source: sourceId,
          'source-layer': sourceLayer,
          minzoom,
          maxzoom,
          paint: {
            'line-color': styleRef.current.lineColorExpr as never,
            'line-width': styleRef.current.lineWidthExpr as never,
          },
        },
        beforeId,
      );
    }

    // Apply now (in case tiles are already cached) and on every (re)load —
    // feature-state is only retained for currently loaded tiles.
    applyAll();
    const onSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) applyAll();
    };
    map.on('sourcedata', onSourceData);

    const onMove = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      const nextId = f?.id != null ? String(f.id) : null;
      if (nextId !== hoveredIdRef.current) {
        if (hoveredIdRef.current != null) {
          map.setFeatureState(
            { source: sourceId, sourceLayer, id: hoveredIdRef.current },
            { hover: false },
          );
        }
        hoveredIdRef.current = nextId;
        if (nextId != null) {
          map.setFeatureState({ source: sourceId, sourceLayer, id: nextId }, { hover: true });
        }
        map.getCanvas().style.cursor = nextId != null ? 'pointer' : '';
      }
      const value = nextId != null ? dataRef.current[nextId] ?? null : null;
      onHoverRef.current?.(nextId, value, { x: e.point.x, y: e.point.y });
    };
    const onLeave = () => {
      if (hoveredIdRef.current != null) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: hoveredIdRef.current },
          { hover: false },
        );
      }
      hoveredIdRef.current = null;
      map.getCanvas().style.cursor = '';
      onHoverRef.current?.(null, null);
    };
    map.on('mousemove', fillId, onMove);
    map.on('mouseleave', fillId, onLeave);

    return () => {
      map.off('sourcedata', onSourceData);
      map.off('mousemove', fillId, onMove);
      map.off('mouseleave', fillId, onLeave);
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getLayer(fillId)) map.removeLayer(fillId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      hoveredIdRef.current = null;
      appliedRef.current = {};
    };
    // structural identity only — paint + data are synced by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded, sourceId, fillId, lineId, sourceUrl, sourceLayer, joinKey, beforeId, minzoom, maxzoom]);

  // --- paint sync: re-theme / scale / classed change updates color in place ---
  useEffect(() => {
    if (!map || !loaded) return;
    if (map.getLayer(fillId)) map.setPaintProperty(fillId, 'fill-color', fillExpr as never);
    if (map.getLayer(lineId)) {
      map.setPaintProperty(lineId, 'line-color', lineColorExpr as never);
      map.setPaintProperty(lineId, 'line-width', lineWidthExpr as never);
    }
    // depend on the serialized expressions so identical specs don't thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded, fillId, lineId, JSON.stringify({ fillExpr, lineColorExpr, lineWidthExpr })]);

  // --- data sync: diff + setFeatureState/removeFeatureState, never rebuild ----
  useEffect(() => {
    if (!map || !loaded || !map.getSource(sourceId)) return;
    const prev = appliedRef.current;
    for (const key in prev) {
      if (!(key in data)) map.removeFeatureState({ source: sourceId, sourceLayer, id: key }, 'value');
    }
    for (const key in data) {
      if (data[key] !== prev[key]) {
        map.setFeatureState({ source: sourceId, sourceLayer, id: key }, { value: data[key] });
      }
    }
    appliedRef.current = { ...data };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded, sourceId, sourceLayer, JSON.stringify(data)]);

  return null;
}
