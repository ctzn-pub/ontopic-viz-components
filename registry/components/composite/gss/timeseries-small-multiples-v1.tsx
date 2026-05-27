'use client';

import React from 'react';
import TimeseriesLineV1 from '@/viz/components/recharts/gss/timeseries-line-v1';
import { SmallMultiples } from '@/viz/components/article/SmallMultiples';

// --- Type Definitions ---
//
// One panel of the small-multiples grid. Each panel is a GSS time-trend
// shape — the same envelope `<TimeseriesLineV1>` expects — but the
// SmallMultiples wrapper injects `compact={true}` so the per-panel
// rendering strips chrome (legend, CI toggle, presidential bands,
// internal title) and falls back on the shared frame.

interface PanelData {
    metadata: {
        title: string;
        subtitle?: string;
        source?: { name: string; id?: string };
        [key: string]: any;
    };
    dataPoints: Array<{
        year: string | number | null;
        value: number | null;
        ci_lower?: number;
        ci_upper?: number;
        n_actual?: number;
        standard_error?: number;
        [key: string]: any;
    }>;
    dataPointMetadata: Array<{ id: string; categories?: string[]; [key: string]: any }>;
}

interface Panel {
    /** Uppercase label shown above each panel (e.g. "BY PARTY"). */
    label: string;
    /** Chart data envelope. */
    data: PanelData;
    /** Demographic column name (e.g. "PolParty"). */
    demographic: string;
    /** Ordered list of demographic groups present in `data.dataPoints`. */
    demographicGroups: string[];
    /** Subset that starts visible. Defaults to all groups. */
    defaultVisibleGroups?: string[];
}

interface TimeseriesSmallMultiplesProps {
    /** 2–6 panels. 4 is the canonical case (one per demographic axis). */
    panels: Panel[];
    /** Shared figure title / subtitle rendered above the grid. */
    title: string;
    subtitle?: string;
    /** Source line rendered as the figcaption below the grid. */
    source: string;
    /**
     * Grid column count at lg: and up. Default 2 → a 2x2 grid for the
     * canonical 4-panel layout. Use 3 or 4 for wider strips.
     */
    columns?: 2 | 3 | 4;
    /**
     * Shared y-axis domain across all panels. When set, every panel
     * scales identically so comparisons are visually honest. Default:
     * undefined → each panel auto-scales. For survey percentages you
     * almost always want this set ([0, 100] or [0, 80]).
     */
    sharedY?: [number, number];
}

// --- Component ---
//
// Renders N GSS time-trend charts inside a SmallMultiples grid with one
// shared title/subtitle/source. The wrapper handles the `compact={true}`
// + `sharedYDomain` cloning automatically.
//
// Used in The Great Sorting to show one outcome variable (e.g. abortion
// opinion) split across four demographic axes (party / age / college /
// church attendance) on a shared scale. This is the book's preferred
// figure for "the same trend, viewed four ways."
export default function TimeseriesSmallMultiples({
    panels,
    title,
    subtitle,
    source,
    columns = 2,
    sharedY,
}: TimeseriesSmallMultiplesProps) {
    if (!panels || panels.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                No panels provided to small-multiples figure.
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Figure-level title bar — the SmallMultiples wrapper
                deliberately doesn't render one (it expects the surrounding
                prose `###` to introduce the grid). For the catalog detail
                page we DO want a self-contained title, so we add it here. */}
            <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                )}
            </div>

            <SmallMultiples
                columns={columns}
                labels={panels.map((p) => p.label)}
                source={source}
                sharedY={sharedY}
            >
                {panels.map((panel) => (
                    <TimeseriesLineV1
                        key={panel.label}
                        data={panel.data}
                        demographic={panel.demographic}
                        demographicGroups={panel.demographicGroups}
                        defaultVisibleGroups={
                            panel.defaultVisibleGroups ?? panel.demographicGroups
                        }
                    />
                ))}
            </SmallMultiples>
        </div>
    );
}
