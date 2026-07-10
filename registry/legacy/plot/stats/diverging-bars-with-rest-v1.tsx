'use client';

import React from 'react';

// ────────────────────────────────────────────────────────────────────────
// DivergingBarsWithRest — Pew-style 4-category Likert layout.
//
// Each row has four percentages that sum to ~100:
//   negative   (rendered to the LEFT of a center axis)
//   positive   (rendered to the RIGHT of a center axis)
//   neutral    (rendered in a separate "rest" column on the right)
//   unknown    (rendered in a second "rest" column on the right)
//
// Generic enough for any 4-option survey question: positive/
// negative attitudes (Pew, Gallup), too-little/too-much spending
// (GSS), approve/disapprove (Roper). Rows are typically demographic
// groups (age bands, party, education); facets are typically
// different questions sharing the same answer scale.
//
// Implementation note: laid out in CSS rather than Observable Plot
// because Plot has no first-class "diverging-with-side-rest" mark,
// and the editorial expectation (numbers inside bars, beige parked
// columns, faceted titles in small-caps) is finicky enough that
// fighting Plot's coordinate system would cost more than just
// writing the layout directly. See viz/components/composite/gss/
// wording-experiment-v1.tsx for the same approach with dumbbells.

// ────────────────────────────────────────────────────────────────────────
// Types

export interface DivergingRow {
    /** Label for this row (e.g. "Ages 18-29", "Republican"). */
    label: string;
    /** Percentage in the negative ("Worse") direction — plotted left of center. */
    negative: number;
    /** Percentage in the positive ("Better") direction — plotted right of center. */
    positive: number;
    /** "Neither / about right" — plotted in the parked rest column. */
    neutral: number;
    /** "Not sure / don't know" — plotted in the second parked rest column. */
    unknown: number;
}

export interface DivergingFacet {
    /** Title shown above the facet, in small-caps (e.g. "THINK CREATIVELY"). */
    title: string;
    /** Rows within this facet, in display order. */
    rows: DivergingRow[];
}

export interface DivergingBarsWithRestProps {
    /** Top-of-figure title (bold). */
    title?: string;
    /** One-paragraph subtitle / question wording (italic). */
    subtitle?: string;
    /** One or more facets, stacked vertically. */
    facets: DivergingFacet[];
    /** Override the column labels. */
    columnLabels?: {
        negative: string;
        positive: string;
        neutral: string;
        unknown: string;
    };
    /** Pew-style palette by default. */
    colors?: {
        negative: string;
        positive: string;
        neutral: string;
        unknown: string;
    };
    /** Note line above the source (e.g. respondents-not-shown). */
    note?: string;
    /** Source line at the bottom. */
    source?: string;
}

// ────────────────────────────────────────────────────────────────────────
// Defaults

const DEFAULT_COLUMN_LABELS = {
    negative: 'Worse',
    positive: 'Better',
    neutral: 'Neither better nor worse',
    unknown: 'Not sure',
};

const DEFAULT_COLORS = {
    negative: '#998A53', // Pew olive
    positive: '#2B5F8C', // Pew royal
    neutral:  '#E8E0D0', // Pew beige
    unknown:  '#D9D1C2', // Pew darker beige
};

// Visual constants. The diverging axis spans 0–MAX% on each side
// (some Pew charts truncate above 70%; we use 70 by default so the
// bars fill the band visibly without compressing the most extreme
// rows). The rest columns are scaled independently with a tighter
// max so neutral/unknown bars still read at small percentages.
const DIVERGING_MAX = 70; // % shown to either side of the center axis
const REST_MAX = 50;      // % shown in each rest column

// ────────────────────────────────────────────────────────────────────────
// Row — the smallest unit: one demographic, four numbers.

function Row({
    row,
    colors,
}: {
    row: DivergingRow;
    colors: DivergingBarsWithRestProps['colors'];
}) {
    const c = colors!;
    // Convert each value to a percentage of the band it occupies.
    // Diverging side: bar fills LEFT-to-CENTER (negative) or
    // CENTER-to-RIGHT (positive), scaled to DIVERGING_MAX.
    const negPct = Math.min(100, (row.negative / DIVERGING_MAX) * 100);
    const posPct = Math.min(100, (row.positive / DIVERGING_MAX) * 100);
    // Rest columns: filled left-to-right, scaled to REST_MAX.
    const neuPct = Math.min(100, (row.neutral / REST_MAX) * 100);
    const unkPct = Math.min(100, (row.unknown / REST_MAX) * 100);

    // A bar narrower than ~15% of its column can't fit a 2-digit
    // label inside. When that happens, render the number just OUTSIDE
    // the bar's tip in the bar's color (Pew's convention).
    const NARROW_THRESHOLD = 15; // percent of column width

    return (
        <div className="grid grid-cols-[80px_1fr_1fr_24px_100px_100px] items-center gap-2 py-1 text-sm">
            {/* Row label */}
            <div className="text-right text-gray-800 font-normal pr-1">{row.label}</div>

            {/* Diverging — negative (anchored right, fills leftward) */}
            <Bar
                widthPct={negPct}
                value={row.negative}
                color={c.negative}
                labelColor="white"
                outsideLabelColor={c.negative}
                side="right"       // anchored to the right edge, fills left
                narrowThreshold={NARROW_THRESHOLD}
            />

            {/* Diverging — positive (anchored left, fills rightward) */}
            <Bar
                widthPct={posPct}
                value={row.positive}
                color={c.positive}
                labelColor="white"
                outsideLabelColor={c.positive}
                side="left"
                narrowThreshold={NARROW_THRESHOLD}
            />

            {/* Gutter — visual breathing room between the diverging
                pair and the parked rest columns (matches Pew). */}
            <div aria-hidden="true" />

            {/* Rest — neutral */}
            <Bar
                widthPct={neuPct}
                value={row.neutral}
                color={c.neutral}
                labelColor="#3F3F46"
                outsideLabelColor="#6B6B5B"
                side="left"
                narrowThreshold={NARROW_THRESHOLD}
            />

            {/* Rest — unknown */}
            <Bar
                widthPct={unkPct}
                value={row.unknown}
                color={c.unknown}
                labelColor="#3F3F46"
                outsideLabelColor="#6B6B5B"
                side="left"
                narrowThreshold={NARROW_THRESHOLD}
            />
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Bar — one filled rectangle with its label. The label sits INSIDE the
// bar by default (white-on-color, right-justified for fills-rightward
// bars, left-justified for fills-leftward) but flips OUTSIDE the bar's
// tip when the bar is too narrow to fit the digits. Matches Pew's
// convention so a "3" or "7" on a tiny bar stays readable.

function Bar({
    widthPct,
    value,
    color,
    labelColor,
    outsideLabelColor,
    side,
    narrowThreshold,
}: {
    widthPct: number;
    value: number;
    color: string;
    labelColor: string;
    outsideLabelColor: string;
    /** "right" = bar anchored to the right edge, fills leftward (diverging-negative).
     *  "left"  = bar anchored to the left edge, fills rightward (diverging-positive, rest). */
    side: 'left' | 'right';
    narrowThreshold: number;
}) {
    const isNarrow = widthPct < narrowThreshold;

    // Position styles for the bar itself
    const barAnchor = side === 'right' ? 'right-0' : 'left-0';

    // When inside-the-bar: text is justified against the bar's far edge
    // (so the digits sit just inside the tip of the bar). Right-anchored
    // bars push the label to the left (start of the bar = its visible
    // tip). Left-anchored bars push to the right.
    const insideJustify = side === 'right' ? 'justify-start pl-1.5' : 'justify-end pr-1.5';

    if (isNarrow) {
        // OUTSIDE the bar. The bar still fills its widthPct%, but the
        // label is placed at the bar's tip in the bar's color, with
        // padding on the appropriate side.
        const outsideJustify = side === 'right' ? 'justify-end pr-1' : 'justify-start pl-1';
        // The bar tip is at: side==right → left edge of bar at (100-widthPct)% from left
        //                    side==left  → right edge of bar at widthPct% from left
        const outsideLabelPosition = side === 'right'
            ? { right: 'auto', left: `${100 - widthPct}%`, transform: 'translateX(-100%)' }
            : { left: `${widthPct}%`, paddingLeft: '4px' };
        return (
            <div className="relative h-6">
                {/* The (tiny) filled bar */}
                <div
                    className={`absolute ${barAnchor} top-0 h-6`}
                    style={{ width: `${widthPct}%`, background: color }}
                />
                {/* The label, OUTSIDE the bar, in the bar's color */}
                <div
                    className={`absolute top-0 h-6 flex items-center ${outsideJustify}`}
                    style={{
                        color: outsideLabelColor,
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        ...outsideLabelPosition,
                    }}
                >
                    {value}
                </div>
            </div>
        );
    }

    // Default: label INSIDE the bar.
    return (
        <div className="relative h-6">
            <div
                className={`absolute ${barAnchor} top-0 h-6 flex items-center ${insideJustify}`}
                style={{
                    width: `${widthPct}%`,
                    background: color,
                    color: labelColor,
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                }}
            >
                {value}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Facet — one question's rows, with a small-caps title and column
// headers (only on the first facet).

function Facet({
    facet,
    showColumnHeaders,
    columnLabels,
    colors,
}: {
    facet: DivergingFacet;
    showColumnHeaders: boolean;
    columnLabels: typeof DEFAULT_COLUMN_LABELS;
    colors: DivergingBarsWithRestProps['colors'];
}) {
    return (
        <section className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-bold uppercase tracking-wide text-gray-900 text-sm">
                    {facet.title}
                </h3>
                {showColumnHeaders && (
                    <div className="grid grid-cols-[1fr_1fr_24px_100px_100px] gap-2 text-xs text-gray-500 italic w-[calc(100%-88px)] -mr-2">
                        <div className="text-right pr-2" style={{ color: colors!.negative }}>{columnLabels.negative}</div>
                        <div className="text-left pl-2" style={{ color: colors!.positive }}>{columnLabels.positive}</div>
                        <div aria-hidden="true" />
                        <div className="text-right pr-1 leading-tight" style={{ color: '#6B6B5B' }}>{columnLabels.neutral}</div>
                        <div className="text-right pr-1 leading-tight" style={{ color: '#6B6B5B' }}>{columnLabels.unknown}</div>
                    </div>
                )}
            </div>
            <div className="border-t border-gray-200">
                {facet.rows.map((row, i) => (
                    <Row key={i} row={row} colors={colors} />
                ))}
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Top-level component

export default function DivergingBarsWithRestV1({
    title,
    subtitle,
    facets,
    columnLabels,
    colors,
    note,
    source,
}: DivergingBarsWithRestProps) {
    if (!facets || facets.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                No facets provided.
            </div>
        );
    }

    const mergedColors = { ...DEFAULT_COLORS, ...(colors ?? {}) };
    const mergedColumnLabels = { ...DEFAULT_COLUMN_LABELS, ...(columnLabels ?? {}) };

    return (
        <div className="bg-white p-6">
            {title && (
                <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                    {title}
                </h2>
            )}
            {subtitle && (
                <p className="text-sm italic text-gray-600 mb-6 leading-snug">
                    {subtitle}
                </p>
            )}

            {facets.map((facet, i) => (
                <Facet
                    key={i}
                    facet={facet}
                    showColumnHeaders={i === 0}
                    columnLabels={mergedColumnLabels}
                    colors={mergedColors}
                />
            ))}

            {(note || source) && (
                <div className="mt-6 text-xs text-gray-500 leading-snug border-t border-gray-100 pt-3 space-y-1">
                    {note && <div>Note: {note}</div>}
                    {source && <div>Source: {source}</div>}
                </div>
            )}
        </div>
    );
}
