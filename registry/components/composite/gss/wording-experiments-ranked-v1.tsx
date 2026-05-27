'use client';

import React from 'react';

// ────────────────────────────────────────────────────────────────────────
// Types — reads the GSS wording-experiments `index.json` directly.
//
// Schema (one entry per pair):
//   {
//     id, x_var, y_var, x_wording, y_wording,
//     pooled_too_little_x_pct, pooled_too_little_y_pct,
//     gap_pp, gap_se, gap_ci_lower, gap_ci_upper,
//     gap_within_party_d_pp, gap_within_party_i_pp, gap_within_party_r_pp,
//     gap_party_range_pp,
//     ...
//   }
//
// Per-pair we also need the X/Y level estimates within each party to
// position the dumbbells. Those don't live in index.json — they live
// in <pair-id>/by-party.json. To stay self-contained, this component
// expects a `byPartyLevels` map: pair id → {party → {X, Y}}. The
// preview bundle fuses both files.

interface PairSummary {
    id: string;
    x_var: string;
    y_var: string;
    x_wording: string;
    y_wording: string;
    pooled_too_little_x_pct: number;
    pooled_too_little_y_pct: number;
    gap_pp: number;
    gap_within_party_d_pp: number | null;
    gap_within_party_i_pp: number | null;
    gap_within_party_r_pp: number | null;
    gap_party_range_pp: number | null;
}

interface IndexFile {
    generated: string;
    source: string;
    method: string;
    pairs: PairSummary[];
}

interface PartyLevels {
    [pairId: string]: {
        [party: string]: { X: number; Y: number };
    };
}

interface WordingExperimentsRankedProps {
    /** The manifest from `/public/data/gss-wording-experiments/index.json`. */
    index: IndexFile;
    /** Per-pair, per-party X/Y level estimates (pooled across years). */
    byPartyLevels: PartyLevels;
    /**
     * Optional override: limit to the top N pairs (by gap_party_range_pp).
     * Default: render all pairs in `index.pairs`.
     */
    topN?: number;
}

const X_COLOR = '#9CA3AF';
const Y_COLOR = '#0EA5E9';
const PARTY_ROWS: { key: string; label: string; muted: string }[] = [
    { key: 'Democrat',    label: 'D', muted: '#3B82F6' },
    { key: 'Independent', label: 'I', muted: '#94A3B8' },
    { key: 'Republican',  label: 'R', muted: '#EF4444' },
];

// ────────────────────────────────────────────────────────────────────────
// Mini-dumbbell — a single-row barbell on a 0–100 scale.

function MiniDumbbell({
    xValue,
    yValue,
    title,
}: {
    xValue: number | null;
    yValue: number | null;
    title?: string;
}) {
    if (xValue == null || yValue == null) {
        return <div className="h-4 text-xs text-gray-400 italic" title={title}>—</div>;
    }
    const trackPct = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
    return (
        <div className="relative h-4" title={title}>
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-gray-200" />
            <div
                className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full"
                style={{
                    left: trackPct(Math.min(xValue, yValue)),
                    width: trackPct(Math.abs(yValue - xValue)),
                    background: `linear-gradient(to right, ${xValue < yValue ? X_COLOR : Y_COLOR}, ${xValue < yValue ? Y_COLOR : X_COLOR})`,
                    opacity: 0.45,
                }}
            />
            <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-1 ring-white"
                style={{ left: trackPct(xValue), background: X_COLOR }}
            />
            <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-1 ring-white"
                style={{ left: trackPct(yValue), background: Y_COLOR }}
            />
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Pair row — three party rows of mini-dumbbells inside a card.

function PairRow({
    pair,
    levels,
    rank,
}: {
    pair: PairSummary;
    levels: PartyLevels[string];
    rank: number;
}) {
    return (
        <div className="grid grid-cols-[36px_1fr_240px_72px] items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
            {/* Rank */}
            <div className="text-xs font-mono text-gray-400 text-right">
                #{rank}
            </div>

            {/* Pair label */}
            <div className="text-sm leading-tight">
                <div className="font-medium text-gray-900">
                    <span style={{ color: X_COLOR }}>"{pair.x_wording}"</span>
                </div>
                <div className="text-xs text-gray-500">
                    vs. <span style={{ color: Y_COLOR }}>"{pair.y_wording}"</span>
                </div>
            </div>

            {/* Three within-party dumbbells, stacked */}
            <div className="flex flex-col gap-1">
                {PARTY_ROWS.map(({ key, label }) => {
                    const cell = levels?.[key];
                    const gap = (() => {
                        if (key === 'Democrat')    return pair.gap_within_party_d_pp;
                        if (key === 'Independent') return pair.gap_within_party_i_pp;
                        return pair.gap_within_party_r_pp;
                    })();
                    return (
                        <div key={key} className="grid grid-cols-[14px_1fr_42px] items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-500 text-right">{label}</span>
                            <MiniDumbbell
                                xValue={cell?.X ?? null}
                                yValue={cell?.Y ?? null}
                                title={key + ' ' + pair.id}
                            />
                            <span className="text-[10px] font-mono text-gray-600 text-right">
                                {gap == null ? '' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* HTE descriptor: the range across parties */}
            <div className="text-right">
                <div className="text-sm font-mono text-gray-900">
                    {pair.gap_party_range_pp == null ? '—' : `${pair.gap_party_range_pp.toFixed(1)}pp`}
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                    HTE range
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Top-level — render the ranked stack.

export default function WordingExperimentsRankedV1({
    index,
    byPartyLevels,
    topN,
}: WordingExperimentsRankedProps) {
    if (!index || !index.pairs?.length) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                No wording-experiment data.
            </div>
        );
    }

    const pairs = (topN ? index.pairs.slice(0, topN) : index.pairs);

    return (
        <div className="bg-white rounded-md border border-gray-200 p-5">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-1">
                {index.source}
            </div>
            <div className="text-base font-semibold text-gray-900 mb-1">
                Wording effects across all 11 GSS spending experiments, ranked by partisan HTE
            </div>
            <div className="text-xs text-gray-600 mb-4 leading-snug">
                Each row shows one NAT___ / NAT___Y pair. Within the row, three
                mini-dumbbells track the same wording effect for{' '}
                <span className="font-mono">D</span>emocrats,{' '}
                <span className="font-mono">I</span>ndependents, and{' '}
                <span className="font-mono">R</span>epublicans separately. A pair
                where all three dumbbells look identical has zero partisan HTE;
                a pair where the dumbbells differ shows party-conditional framing.
                Pairs sorted by HTE range (rightmost column) descending.
            </div>

            {/* Header */}
            <div className="grid grid-cols-[36px_1fr_240px_72px] gap-3 py-2 border-b-2 border-gray-200 text-[10px] uppercase tracking-wide text-gray-500 font-mono">
                <div className="text-right">Rank</div>
                <div>Pair</div>
                <div className="grid grid-cols-[14px_1fr_42px] gap-2">
                    <span></span>
                    <span>% saying "too little", 0–100</span>
                    <span className="text-right">gap</span>
                </div>
                <div className="text-right">HTE</div>
            </div>

            <div>
                {pairs.map((pair, i) => (
                    <PairRow
                        key={pair.id}
                        pair={pair}
                        levels={byPartyLevels[pair.id] ?? {}}
                        rank={i + 1}
                    />
                ))}
            </div>

            {/* Color legend */}
            <div className="flex items-center gap-4 pt-4 mt-2 text-xs text-gray-600 border-t border-gray-100">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: X_COLOR }} />
                    X-wording (legacy / original)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: Y_COLOR }} />
                    Y-wording (alternate)
                </span>
            </div>
        </div>
    );
}
