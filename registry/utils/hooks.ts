'use client';
// registry/utils/hooks.ts
//
// Shared chart hooks, promoted from the health-of-americas-zip-codes atlas
// (web/components/charts/chartUtils.tsx). Engine-agnostic.

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Container width from a ResizeObserver on a wrapping element (height stays
 * fixed per chart). Returns [ref, width]; width is 0 until first measure, so
 * gate rendering on `width > 0` or fall back to a default.
 */
export function useResize<T extends HTMLElement = HTMLDivElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(0, Math.floor(e.contentRect.width)));
    });
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Tracks the user's prefers-reduced-motion setting; gate transitions on it. */
export function useReducedMotion(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(mq.matches);
    const fn = () => setR(mq.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);
  return r;
}
