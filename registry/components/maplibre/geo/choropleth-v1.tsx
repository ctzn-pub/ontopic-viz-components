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
  data?: Record<string, number>;
  /**
   * Multi-field alternative to `data` (the health-atlas pattern): several
   * named per-feature fields, e.g. { val: {...}, pct: {...} }, ALL pushed to
   * feature-state once. Combine with `valueField` — switching the displayed
   * field then swaps only the paint expression, with zero feature-state
   * re-push (instant even at ZCTA/block-group cardinality). Supersedes
   * `data` when provided.
   */
  fields?: Record<string, Record<string, number>>;
  /** Which feature-state field the fill expression reads. Default 'value'
   *  (the `data` prop's field), or a key of `fields`. */
  valueField?: string;
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
  /**
   * Persistently emphasized feature (weight + halo via the boundary layers —
   * never color alone, so selection survives any ramp). Cleared with null.
   */
  selectedId?: string | null;
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
  fields,
  valueField,
  scale,
  classed = false,
  beforeId,
  minzoom,
  maxzoom,
  id,
  selectedId = null,
  onHover,
}: ChoroplethLayerProps) {
  const { map, loaded } = useGeoMap();
  const { ml, scaleFor } = useVizTheme();

  const baseId = id ?? sourceLayer;
  const sourceId = `${baseId}__src`;
  const fillId = `${baseId}__fill`;
  const lineId = `${baseId}__line`;
  const sourceUrl = url.startsWith('pmtiles://') ? url : `pmtiles://${url}`;

  // Normalize the two data shapes into one field map: { fieldName: { key: value } }.
  // `fields` supersedes `data`; the plain-`data` path keeps its 'value' field name.
  const fieldMap: Record<string, Record<string, number>> = fields ?? { value: data ?? {} };
  const fieldNames = Object.keys(fieldMap);
  const activeField = valueField ?? fieldNames[0] ?? 'value';

  // Resolve the scale against the ACTIVE theme, then compile to a GPU paint
  // expression. Re-resolves (new colors) when the theme or spec changes;
  // changing `valueField` swaps this expression only — no feature-state push.
  const resolved = scaleFor(scale);
  const fillExpr: MaplibreExpression = classed
    ? toMaplibreStep(resolved, activeField)
    : toMaplibreFill(resolved, activeField);
  // Outline: hairline on every boundary, thickened + darkened on hover; the
  // selected feature keeps the emphasized boundary persistently (weight, not
  // color, so selection survives any ramp).
  const emphasized: MaplibreExpression = [
    'any',
    ['boolean', ['feature-state', 'hover'], false],
    ['boolean', ['feature-state', 'selected'], false],
  ];
  const lineColorExpr: MaplibreExpression = [
    'case',
    emphasized,
    ml.boundaryHover.color,
    ml.boundary.color,
  ];
  const lineWidthExpr: MaplibreExpression = [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    ml.boundaryHover.width + 1,
    ['boolean', ['feature-state', 'hover'], false],
    ml.boundaryHover.width,
    ml.boundary.width,
  ];

  // Per-feature state objects: { key: { field1: v, field2: v } } — one
  // setFeatureState per feature carries ALL fields at once.
  const featureState: Record<string, Record<string, number>> = {};
  for (const field of fieldNames) {
    const values = fieldMap[field];
    for (const key in values) {
      (featureState[key] ??= {})[field] = values[key];
    }
  }

  // Latest-value refs so the long-lived MapLibre event handlers and the
  // sourcedata re-apply read current props without re-subscribing.
  const stateRef = useRef(featureState);
  const fieldNamesRef = useRef(fieldNames);
  const activeFieldRef = useRef(activeField);
  const appliedRef = useRef<Record<string, Record<string, number>>>({});
  const onHoverRef = useRef(onHover);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const styleRef = useRef({ fillExpr, lineColorExpr, lineWidthExpr });
  stateRef.current = featureState;
  fieldNamesRef.current = fieldNames;
  activeFieldRef.current = activeField;
  onHoverRef.current = onHover;
  styleRef.current = { fillExpr, lineColorExpr, lineWidthExpr };

  // --- structural: add source + layers + handlers (rebuild only on identity) ---
  useEffect(() => {
    if (!map || !loaded) return;

    const applyAll = () => {
      for (const key in stateRef.current) {
        map.setFeatureState({ source: sourceId, sourceLayer, id: key }, stateRef.current[key]);
      }
      if (selectedIdRef.current != null) {
        map.setFeatureState(
          { source: sourceId, sourceLayer, id: selectedIdRef.current },
          { selected: true },
        );
      }
      appliedRef.current = { ...stateRef.current };
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
      const value =
        nextId != null ? stateRef.current[nextId]?.[activeFieldRef.current] ?? null : null;
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
      if (!(key in featureState)) {
        // remove only OUR fields — clearing whole state would wipe hover/selected
        for (const field in prev[key]) {
          map.removeFeatureState({ source: sourceId, sourceLayer, id: key }, field);
        }
      }
    }
    for (const key in featureState) {
      const next = featureState[key];
      const before = prev[key];
      let changed = before === undefined;
      if (!changed) {
        for (const field in next) if (next[field] !== before[field]) { changed = true; break; }
        for (const field in before) if (!(field in next)) { changed = true; break; }
      }
      if (changed) {
        for (const field in before ?? {}) {
          if (!(field in next)) map.removeFeatureState({ source: sourceId, sourceLayer, id: key }, field);
        }
        map.setFeatureState({ source: sourceId, sourceLayer, id: key }, next);
      }
    }
    appliedRef.current = { ...featureState };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, loaded, sourceId, sourceLayer, JSON.stringify(featureState)]);

  // --- selection sync: persistent weight+halo emphasis, never color alone ----
  useEffect(() => {
    if (!map || !loaded || !map.getSource(sourceId)) return;
    const prev = selectedIdRef.current;
    if (prev != null && prev !== selectedId) {
      map.setFeatureState({ source: sourceId, sourceLayer, id: prev }, { selected: false });
    }
    if (selectedId != null) {
      map.setFeatureState({ source: sourceId, sourceLayer, id: selectedId }, { selected: true });
    }
    selectedIdRef.current = selectedId;
  }, [map, loaded, sourceId, sourceLayer, selectedId]);

  return null;
}
