'use client';
// registry/utils/table-fallback.tsx
//
// Accessible <details> data-table fallback — the house a11y pattern for
// canvas-rendered or visually-dense charts whose content a screen reader
// can't traverse. Promoted from the health-of-americas-zip-codes atlas.
// Chrome (border, text, type) resolves from the active theme; renders with
// the editorial defaults when no provider is mounted.

import React from 'react';
import { useVizTheme } from '@/viz/theme/provider';

export interface TableFallbackColumn {
  key: string;
  label: string;
  numeric?: boolean;
  fmt?: (v: unknown) => string;
}

export interface TableFallbackProps {
  /** Screen-reader caption describing what the table contains. */
  caption: string;
  columns: TableFallbackColumn[];
  rows: Record<string, unknown>[];
  /** The <summary> text. */
  label?: string;
  /** Cap the scrollable body height (px). */
  maxHeight?: number;
}

export function TableFallback({
  caption,
  columns,
  rows,
  label = 'Show data table',
  maxHeight = 280,
}: TableFallbackProps) {
  const { theme, d3 } = useVizTheme();
  const cell: React.CSSProperties = {
    padding: '4px 10px',
    borderBottom: `1px solid ${theme.grid}`,
    fontSize: d3.text.sourceSize,
    fontFamily: theme.fontBody,
    color: theme.fg,
  };
  return (
    <details style={{ marginTop: 8 }}>
      <summary
        style={{
          cursor: 'pointer',
          fontSize: d3.text.sourceSize,
          fontFamily: theme.fontBody,
          color: theme.muted,
        }}
      >
        {label}
      </summary>
      <div style={{ maxHeight, overflowY: 'auto', border: `1px solid ${theme.border}`, marginTop: 6 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', background: theme.surface }}>
          <caption
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={{ ...cell, textAlign: c.numeric ? 'right' : 'left', color: theme.muted, fontWeight: 600 }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} style={{ ...cell, textAlign: c.numeric ? 'right' : 'left' }}>
                    {c.fmt ? c.fmt(r[c.key]) : String(r[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
