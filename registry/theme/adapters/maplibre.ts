// registry/theme/adapters/maplibre.ts
//
// Analogous to `rcTheme`/`plotBase`: turn a Theme into the NON-semantic map
// chrome. These are *boundary* tilesets, so the "basemap" is minimal —
// background fill, hairline boundaries, and (optional) labels. That minimalism
// IS the Tufte aesthetic: the choropleth is the map; there are no roads/POIs to
// suppress.
//
// No color *resolution* happens here — continuous fills come from scales.ts and
// categorical color from semantic.ts. This file only produces chrome.
//
// Data-only: no maplibre-gl import (so the theme layer typechecks without it).

import { Theme } from '../themes';

export function mlTheme(theme: Theme) {
  return {
    background: theme.surface, // map root background
    boundary: { color: theme.border, width: theme.mode === 'dark' ? 0.6 : 0.5 }, // hairline
    boundaryHover: { color: theme.fg, width: 1.25 },
    label: { color: theme.muted, halo: theme.surface, font: theme.fontBody, size: 11 },
    showLabels: false, // default off — opt-in per map (labels need a glyphs URL)
  };
}

export type MlTheme = ReturnType<typeof mlTheme>;
