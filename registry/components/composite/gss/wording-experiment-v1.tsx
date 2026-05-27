'use client';

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ErrorBar,
    ReferenceLine,
    Customized,
} from 'recharts';

// ────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────
//
// Both panels read from the same GSS chart-shaped envelope:
//
//   { metadata: { title, x_wording, y_wording, ... },
//     dataPoints: [{ year, Wording, value, ci_lower, ci_upper, n_actual,
//                    [moderator]?: string }],
//     dataPointMetadata: [...] }
//
// `Wording` is the series-splitter (two values: X-wording and Y-wording).
// An optional moderator column (e.g. "PolParty") names a third axis.

interface DataPoint {
    year: number;
    Wording: string;
    value: number | null;
    ci_lower?: number | null;
    ci_upper?: number | null;
    standard_error?: number | null;
    n_actual?: number;
    [key: string]: any;
}

interface ChartData {
    metadata: {
        title: string;
        x_wording: string;
        y_wording: string;
        moderator?: string | null;
        outcome?: string;
        source?: { id?: string; name: string };
    };
    dataPoints: DataPoint[];
    dataPointMetadata: Array<{ id: string; [key: string]: any }>;
}

interface WordingExperimentProps {
    /** Time-trend data (year × wording). The "main effect" file. */
    mainData: ChartData;
    /**
     * HTE data with a single moderator column (party / race / age).
     * The `metadata.moderator` field names which column carries the
     * moderator level. If omitted, only the time-trend panel renders.
     */
    moderatorData?: ChartData;
    /** Override the panel titles. */
    titleMain?: string;
    titleModerator?: string;
}

// ────────────────────────────────────────────────────────────────────────
// Color palette
// ────────────────────────────────────────────────────────────────────────
//
// X-form ("Welfare") = warm gray; Y-form ("Assistance to the poor") = blue.
// The choice signals the editorial point: the Y-wording is the cleaner,
// more honest description; the X-wording carries baggage. Warm gray + blue
// is also color-blind-safe.

const X_COLOR = '#9CA3AF'; // tailwind gray-400
const Y_COLOR = '#0EA5E9'; // tailwind sky-500
const REF_COLOR = '#94A3B8'; // tailwind slate-400

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function poolByYear(data: ChartData): {
    [moderator: string]: { [wording: string]: { mean: number; n: number } };
} {
    // For each (moderator_level, wording) cell, compute the n-weighted
    // average of the per-year point estimates. Returns a nested object
    // keyed by [moderator_level][wording].
    const moderatorKey = data.metadata.moderator;
    const buckets: Record<string, Record<string, { sumWtMean: number; sumWt: number }>> = {};
    for (const p of data.dataPoints) {
        if (p.value == null) continue;
        const modVal = moderatorKey ? String(p[moderatorKey] ?? '') : 'all';
        const w = String(p.Wording);
        const n = p.n_actual ?? 1;
        if (!buckets[modVal]) buckets[modVal] = {};
        if (!buckets[modVal][w]) buckets[modVal][w] = { sumWtMean: 0, sumWt: 0 };
        buckets[modVal][w].sumWtMean += p.value * n;
        buckets[modVal][w].sumWt += n;
    }
    const out: Record<string, Record<string, { mean: number; n: number }>> = {};
    for (const mod of Object.keys(buckets)) {
        out[mod] = {};
        for (const w of Object.keys(buckets[mod])) {
            const { sumWtMean, sumWt } = buckets[mod][w];
            out[mod][w] = { mean: sumWt > 0 ? sumWtMean / sumWt : 0, n: sumWt };
        }
    }
    return out;
}

// ────────────────────────────────────────────────────────────────────────
// Panel 1 — Gap by moderator (the punchline figure)
// ────────────────────────────────────────────────────────────────────────
//
// Horizontal "barbell" / paired-dot layout: for each moderator level,
// plot the X-mean and Y-mean as two dots, with a connector line and a
// labeled gap. Implemented in raw SVG via <Customized> because Recharts
// has no first-class dumbbell mark.

function GapByModeratorPanel({
    data,
    title,
}: {
    data: ChartData;
    title?: string;
}) {
    const moderator = data.metadata.moderator;
    if (!moderator) {
        return <div className="p-4 text-center text-sm text-gray-500">No moderator data.</div>;
    }

    const pooled = useMemo(() => poolByYear(data), [data]);

    // Use the moderator's declared category order, then fall back to
    // whatever shows up in the data.
    const modMeta = data.dataPointMetadata.find((m) => m.id === moderator);
    const declared: string[] = (modMeta?.categories ?? []) as string[];
    const observed = Object.keys(pooled).filter((k) => k !== '');
    const orderedLevels = declared.length > 0
        ? [...declared.filter((l) => pooled[l]), ...observed.filter((l) => !declared.includes(l))]
        : observed;

    const xWord = data.metadata.x_wording;
    const yWord = data.metadata.y_wording;

    // Build rows for the chart: one per moderator level. Recharts
    // doesn't have a dumbbell mark, so we'll render with a horizontal
    // bar-chart-style structure: y-axis = moderator level, x-axis =
    // percent. Two scatter dots per row + a connector line, drawn via
    // <Customized>.
    const rows = orderedLevels.map((level) => {
        const x = pooled[level]?.[xWord]?.mean ?? null;
        const y = pooled[level]?.[yWord]?.mean ?? null;
        return { level, x, y, gap: x !== null && y !== null ? y - x : null };
    }).filter((r) => r.x !== null && r.y !== null);

    if (rows.length === 0) {
        return <div className="p-4 text-center text-sm text-gray-500">No pooled data.</div>;
    }

    return (
        <div className="bg-white rounded-md border border-gray-200 p-4">
            {title && (
                <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
            )}
            <div className="space-y-4">
                {rows.map((row) => (
                    <Dumbbell
                        key={row.level}
                        level={row.level}
                        xValue={row.x as number}
                        yValue={row.y as number}
                        gap={row.gap as number}
                        xWording={xWord}
                        yWording={yWord}
                    />
                ))}
                <div className="flex items-center gap-4 pt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ background: X_COLOR }} />
                        {xWord}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ background: Y_COLOR }} />
                        {yWord}
                    </span>
                </div>
            </div>
        </div>
    );
}

function Dumbbell({
    level,
    xValue,
    yValue,
    gap,
    xWording,
    yWording,
}: {
    level: string;
    xValue: number;
    yValue: number;
    gap: number;
    xWording: string;
    yWording: string;
}) {
    // x-axis: 0–100% support. Convert values to percentages of width.
    const trackPct = (v: number) => `${Math.max(0, Math.min(100, v))}%`;

    return (
        <div className="grid grid-cols-[120px_1fr_70px] items-center gap-3 text-sm">
            <div className="font-medium text-gray-800 text-right truncate" title={level}>
                {level}
            </div>
            <div className="relative h-7">
                {/* Track */}
                <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-gray-200" />
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map((t) => (
                    <div
                        key={t}
                        className="absolute top-1/2 -translate-y-1/2 w-px h-1.5 bg-gray-300"
                        style={{ left: `${t}%` }}
                    />
                ))}
                {/* Connector */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full"
                    style={{
                        left: trackPct(Math.min(xValue, yValue)),
                        width: trackPct(Math.abs(yValue - xValue)),
                        background: `linear-gradient(to right, ${xValue < yValue ? X_COLOR : Y_COLOR}, ${xValue < yValue ? Y_COLOR : X_COLOR})`,
                        opacity: 0.35,
                    }}
                />
                {/* X dot */}
                <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full ring-2 ring-white"
                    style={{ left: trackPct(xValue), background: X_COLOR }}
                    title={`${xWording}: ${xValue.toFixed(1)}%`}
                />
                {/* Y dot */}
                <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full ring-2 ring-white"
                    style={{ left: trackPct(yValue), background: Y_COLOR }}
                    title={`${yWording}: ${yValue.toFixed(1)}%`}
                />
            </div>
            <div className="text-right font-mono text-xs text-gray-700">
                {gap > 0 ? '+' : ''}{gap.toFixed(1)} pp
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Panel 2 — Time-trend (the longitudinal stability figure)
// ────────────────────────────────────────────────────────────────────────

function TimeTrendPanel({
    data,
    title,
}: {
    data: ChartData;
    title?: string;
}) {
    // Pivot: one row per year, with two value columns (one per wording).
    const xWord = data.metadata.x_wording;
    const yWord = data.metadata.y_wording;

    const pivot = useMemo(() => {
        const byYear: Record<number, any> = {};
        for (const p of data.dataPoints) {
            if (p.value == null) continue;
            const yr = +p.year;
            if (!byYear[yr]) byYear[yr] = { year: yr };
            const valKey = p.Wording === xWord ? 'x' : 'y';
            byYear[yr][valKey] = p.value;
            byYear[yr][`${valKey}_se`] = p.standard_error ?? null;
            byYear[yr][`${valKey}_ci_lower`] = p.ci_lower ?? null;
            byYear[yr][`${valKey}_ci_upper`] = p.ci_upper ?? null;
        }
        return Object.values(byYear).sort((a, b) => a.year - b.year);
    }, [data, xWord, yWord]);

    return (
        <div className="bg-white rounded-md border border-gray-200 p-4">
            {title && (
                <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
            )}
            <ResponsiveContainer width="100%" height={340}>
                <LineChart data={pivot} margin={{ top: 10, right: 50, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                        dataKey="year"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        ticks={[1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024]}
                        tick={{ fontSize: 11, fill: '#4b5563' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: '#4b5563' }}
                        axisLine={false}
                        tickLine={false}
                        // Hard-clamp so Recharts doesn't expand the axis
                        // when ErrorBar dataKey returns large values; in
                        // a 0-100 percentage chart, going negative or
                        // above 100 is never informative.
                        allowDataOverflow
                    />
                    <Tooltip
                        formatter={(value: any, name: string) =>
                            value == null ? '—' : `${(+value).toFixed(1)}%`
                        }
                        labelFormatter={(yr) => `Year: ${yr}`}
                        contentStyle={{ fontSize: 12 }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={28}
                        wrapperStyle={{ fontSize: 12 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="x"
                        name={xWord}
                        stroke={X_COLOR}
                        strokeWidth={2}
                        dot={{ r: 3, fill: X_COLOR, stroke: 'white', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                        isAnimationActive={false}
                    >
                        <ErrorBar
                            dataKey={(d: any) =>
                                d.x_se != null ? 1.96 * d.x_se : 0
                            }
                            stroke={X_COLOR}
                            strokeWidth={1}
                            opacity={0.35}
                            width={3}
                        />
                    </Line>
                    <Line
                        type="monotone"
                        dataKey="y"
                        name={yWord}
                        stroke={Y_COLOR}
                        strokeWidth={2}
                        dot={{ r: 3, fill: Y_COLOR, stroke: 'white', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                        isAnimationActive={false}
                    >
                        <ErrorBar
                            dataKey={(d: any) =>
                                d.y_se != null ? 1.96 * d.y_se : 0
                            }
                            stroke={Y_COLOR}
                            strokeWidth={1}
                            opacity={0.35}
                            width={3}
                        />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Top-level component
// ────────────────────────────────────────────────────────────────────────

export default function WordingExperimentV1({
    mainData,
    moderatorData,
    titleMain,
    titleModerator,
}: WordingExperimentProps) {
    if (!mainData) {
        return (
            <div className="p-4 text-center text-sm text-gray-500">
                No data provided to WordingExperiment.
            </div>
        );
    }

    const xWord = mainData.metadata.x_wording;
    const yWord = mainData.metadata.y_wording;
    const moderator = moderatorData?.metadata?.moderator;

    return (
        <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-mono">
                GSS split-ballot experiment · {mainData.metadata.source?.name}
            </div>
            <div className="text-lg font-semibold text-gray-900">
                {mainData.metadata.title}
            </div>
            <div className="text-sm text-gray-600 leading-snug">
                Two randomly-assigned subsamples answered the same spending question
                under one of two wordings:{' '}
                <span style={{ color: X_COLOR, fontWeight: 600 }}>{xWord}</span>{' '}
                or{' '}
                <span style={{ color: Y_COLOR, fontWeight: 600 }}>{yWord}</span>.
                Each panel shows the % saying "too little" is being spent.
            </div>

            {moderatorData && (
                <GapByModeratorPanel
                    data={moderatorData}
                    title={
                        titleModerator ??
                        `Pooled estimates by ${moderator ?? 'group'}, 1984–2024`
                    }
                />
            )}

            <TimeTrendPanel
                data={mainData}
                title={titleMain ?? 'Over time, with 95% confidence intervals'}
            />
        </div>
    );
}
