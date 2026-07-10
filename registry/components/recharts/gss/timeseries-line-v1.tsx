"use client";

import React, { useState, useEffect } from 'react';
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
    ReferenceArea,
    Customized
} from 'recharts';
import { Label } from "@/viz/ui/label";
import { Switch } from "@/viz/ui/switch";
import { useVizTheme } from "@/viz/theme/provider";

// --- Type Definitions ---
interface DataPoint {
    year: string | number | null;
    value: number | null;
    ci_lower?: number;
    ci_upper?: number;
    n_actual?: number;
    standard_error?: number;
    // demographic columns (e.g. PolParty: "Democrat") ride along untyped
    [key: string]: unknown;
}

interface TooltipPayloadItem {
    name: string;
    value: number | null;
    color: string;
    payload: DataPoint;
    dataKey: string;
    stroke?: string;
    fill?: string;
}

interface DataPointMetadataItem {
    id: string;
    categories?: string[];
    value_prefix?: string | object;
    value_suffix?: string | object;
    [key: string]: unknown;
}

// The subset of Recharts' internal chart state a <Customized> render prop
// receives that we actually read: the axis maps, whose d3 scales let us place
// the presidential-era labels in pixel space. Everything optional — Recharts
// hands us far more, we narrow to just this.
interface CustomizedAxisScale {
    (value: number): number | undefined;
    range: () => number[];
}
interface CustomizedChartState {
    xAxisMap?: Record<string, { scale: CustomizedAxisScale }>;
    yAxisMap?: Record<string, { scale: CustomizedAxisScale }>;
}

interface ChartData {
    metadata: {
        title: string;
        subtitle?: string;
        question?: string;
        source?: { name: string; id?: string; };
        observations?: number;
        [key: string]: unknown;
    };
    dataPoints: DataPoint[];
    dataPointMetadata: DataPointMetadataItem[];
}

interface TimeTrendDemoChartProps {
    data: ChartData;
    /**
     * The demographic groups to draw as series (e.g. ["Democrat", "Republican"]).
     * Optional: when omitted, derived from the payload's own dataPointMetadata
     * (the first non-"value" entry that lists `categories`) so a data-only
     * render — the gallery preview — works without wiring. Explicit props win.
     */
    demographicGroups?: string[];
    /**
     * The dataPoints field holding the group label (e.g. "PolParty"). Optional
     * with the same dataPointMetadata-derived fallback as demographicGroups.
     */
    demographic?: string;
    defaultVisibleGroups?: string[];
    /**
     * When true, renders a stripped-down version of the chart suitable for
     * small-multiples grids:
     *   - no card chrome (surface background, shadow, rounded corners) — the
     *     wrapper provides the frame
     *   - no internal title / subtitle / question block
     *   - no source line and no CI toggle footer
     *   - no Recharts legend (the wrapper renders one shared legend)
     *   - no presidential reference areas or president-name labels
     *     (illegible at panel size, mistaken for gridlines)
     *   - sparser x-axis ticks (every 20 years, not every 5)
     *   - smaller axis-tick font, smaller chart height
     *
     * The caller is expected to provide a single shared title/source/legend
     * outside the grid. Default: false.
     */
    compact?: boolean;
    /**
     * When set, overrides the chart's auto-computed y-axis domain. Used by
     * <SmallMultiples> to enforce a shared range across panels so visual
     * comparison works. Format: [min, max] in the same units as the data
     * (typically 0–100 for percentages). Default: undefined → auto-scale.
     */
    sharedYDomain?: [number, number];
    /**
     * Explicit semantic domain for series colors. When omitted, defaults to
     * 'party' if `demographic === 'PolParty'` else null (categorical cycle).
     * Pass `null` to force the categorical cycle even for party data. Never
     * inferred from the data values themselves.
     */
    colorDomain?: 'party' | 'sentiment' | null;
}

// --- Constants ---
const presidentialTerms = [
    { start: 1971, end: 1976, party: "Republican", president: "Nixon/Ford" },
    { start: 1976, end: 1980, party: "Democrat", president: "Carter" },
    { start: 1980, end: 1992, party: "Republican", president: "Reagan/Bush" },
    { start: 1992, end: 2000, party: "Democrat", president: "Clinton" },
    { start: 2000, end: 2008, party: "Republican", president: "Bush" },
    { start: 2008, end: 2016, party: "Democrat", president: "Obama" },
    { start: 2016, end: 2020, party: "Republican", president: "Trump" },
    { start: 2020, end: 2024, party: "Democrat", president: "Biden" },
];

// --- Helper Functions ---
const generateTicks = (start: number, end: number, interval: number): number[] => {
    const ticks: number[] = [];
    const firstTick = Math.ceil(start / interval) * interval;
    for (let i = firstTick; i <= end; i += interval) {
        if (i <= end) { ticks.push(i); }
    }
    return ticks;
};

const processDataPoint = (d: DataPoint): DataPoint & { year: number | null } => {
    const yearNum = parseInt(String(d.year), 10);
    const valueNum = typeof d.value === 'number' ? d.value : parseFloat(String(d.value));
    return {
        ...d,
        year: isNaN(yearNum) ? null : yearNum,
        value: typeof valueNum === 'number' && !isNaN(valueNum) ? valueNum : null
    };
};

// --- Component ---
export default function TimeTrendDemoChart({
    data, demographicGroups: demographicGroupsProp, demographic: demographicProp,
    defaultVisibleGroups, compact = false, sharedYDomain,
    colorDomain
}: TimeTrendDemoChartProps) {
    const { rc, colorFor } = useVizTheme();

    // Data-only render support (the gallery preview passes just `data`):
    // derive the demographic split from the payload's own dataPointMetadata —
    // the entry matching the explicit `demographic` prop if given, otherwise
    // the first non-"value" entry that lists categories. Explicit props always
    // win; this fills gaps, it never overrides.
    const derivedMeta = data?.dataPointMetadata?.find(m =>
        demographicProp
            ? m.id === demographicProp
            : (m.id !== 'value' && Array.isArray(m.categories) && m.categories.length > 0)
    );
    const demographic = demographicProp ?? derivedMeta?.id ?? '';
    const demographicGroups = demographicGroupsProp ?? derivedMeta?.categories ?? [];

    // Explicit author mapping, not data sniffing: a `PolParty` breakdown gets
    // the party domain (Democrat blue / Republican red); anything else falls
    // through to the categorical cycle. An explicit prop wins.
    const domain = colorDomain === undefined
        ? (demographic === 'PolParty' ? 'party' : null)
        : colorDomain;

    // Series color resolver. Semantic domains (party / sentiment) go through
    // the theme so Democrat/Republican/etc. stay red/blue across themes.
    // Non-semantic series (the single-line "Overall" case, or any breakdown
    // without a semantic mapping) fall through to the theme's categorical
    // cycle — ink first, so a lone series renders monochrome (the Tufte
    // default) and stays consistent with every other chart in the registry.
    const resolveColor = (name: string, index: number): string =>
        colorFor(domain, name, index);

    // Type sizes are derived from the theme's axis-tick token, never literal:
    // compact (small-multiples) panels drop two notches so ~3 tick labels fit
    // a narrow column; full size drops one for year-by-year density.
    const tickFontSize = rc.axisTick.fontSize - (compact ? 2 : 1);
    const legendFontSize = rc.axisTick.fontSize - (compact ? 2 : 0);

    // For a single-series timetrend (no demographic split, e.g. /chat),
    // demographicGroups is empty — fall back to the synthetic 'Overall' series
    // so it starts visible. Without this, visibleGroups inits empty and every
    // <Line> gets hide={true}, leaving the chart blank.
    const effectiveVisible = (defaultVisibleGroups && defaultVisibleGroups.length > 0)
        ? defaultVisibleGroups
        : (demographicGroups.length > 0 ? demographicGroups : ['Overall']);

    const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
        new Set(effectiveVisible)
    );
    const [showCI, setShowCI] = useState(false);

    useEffect(() => {
        setVisibleGroups(new Set(effectiveVisible));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [demographicGroups.join('|'), (defaultVisibleGroups || []).join('|')]);

    if (!data || !data.dataPoints || !Array.isArray(data.dataPoints) || data.dataPoints.length === 0) {
        return <div className="p-4 text-center" style={{ color: rc.muted }}>No data available to display chart.</div>;
    }

    const processedDataPoints = data.dataPoints.map(processDataPoint);
    const allValidYearsNumeric = processedDataPoints.map(d => d.year).filter((year): year is number => year !== null);

    if (allValidYearsNumeric.length === 0) {
        return <div className="p-4 text-center" style={{ color: rc.muted }}>Data contains no valid years.</div>;
    }

    const minYearInData = Math.min(...allValidYearsNumeric);
    const maxYearInData = Math.max(...allValidYearsNumeric);

    const relevantPresidentialTerms = presidentialTerms.filter(term =>
        term.end >= minYearInData && term.start <= maxYearInData
    );
    const firstRelevantBandStart = relevantPresidentialTerms.length > 0
        ? Math.min(...relevantPresidentialTerms.map(t => t.start)) : minYearInData;
    const xAxisMin = Math.min(firstRelevantBandStart, minYearInData);
    const xAxisMax = maxYearInData;
    // Sparser ticks in compact mode — every 5 years collides into a smudge
    // in narrow small-multiples columns. Every 20 years gives ~3 labels per
    // panel for a 50-year range, which is readable.
    const xTickInterval = compact ? 20 : 5;
    const xAxisTicks = generateTicks(xAxisMin, xAxisMax, xTickInterval);

    // When demographicGroups is empty (single-series timetrend, e.g. from
    // /chat where VizResolver couldn't find a demographic dataPointMetadata
    // entry), fall back to one "Overall" series over the raw data. Without
    // this fallback the chart renders axes + president bands but zero
    // <Line> elements — a hollow shell. Mirror of the generic sibling at
    // viz/components/recharts/timeseries-line-v1.tsx.
    const groupedData = demographicGroups.length > 0
        ? demographicGroups.map(group => {
            const groupData = processedDataPoints
                .filter(d => d[demographic] === group && d.year !== null)
                .map(d => d as DataPoint & { year: number })
                .sort((a, b) => a.year - b.year);
            return { name: group, data: groupData };
        })
        : [{
            name: 'Overall',
            data: processedDataPoints
                .filter(d => d.year !== null)
                .map(d => d as DataPoint & { year: number })
                .sort((a, b) => a.year - b.year),
        }];
    const hasCIData = groupedData.some(g =>
        g.data.some(d => d.standard_error !== undefined || (d.ci_lower !== undefined && d.ci_upper !== undefined))
    );

    const getVisibleBounds = (): { min: number; max: number } => {
        let overallMin = Infinity;
        let overallMax = -Infinity;
        let hasVisibleData = false;

        groupedData
            .filter(group => visibleGroups.has(group.name))
            .forEach(group => {
                group.data.forEach(point => {
                    if (point.value === null) return;
                    hasVisibleData = true;
                    let currentMin = point.value;
                    let currentMax = point.value;

                    if (showCI) {
                        if (point.ci_lower !== undefined && point.ci_lower !== null) { currentMin = point.ci_lower; }
                        else if (typeof point.standard_error === 'number' && !isNaN(point.standard_error)) { currentMin = point.value - 1.96 * point.standard_error; }
                        if (point.ci_upper !== undefined && point.ci_upper !== null) { currentMax = point.ci_upper; }
                        else if (typeof point.standard_error === 'number' && !isNaN(point.standard_error)) { currentMax = point.value + 1.96 * point.standard_error; }
                    }

                    if (typeof currentMin === 'number' && !isNaN(currentMin)) { overallMin = Math.min(overallMin, currentMin); }
                    if (typeof currentMax === 'number' && !isNaN(currentMax)) { overallMax = Math.max(overallMax, currentMax); }
                });
            });

        return hasVisibleData && isFinite(overallMin) && isFinite(overallMax)
            ? { min: overallMin, max: overallMax } : { min: 0, max: 100 };
    };

    const { min: effectiveMin, max: effectiveMax } = getVisibleBounds();
    let yDomain: [number, number] = [0, 100];

    // sharedYDomain wins over auto-scaling — used by <SmallMultiples> to
    // enforce a shared range across panels.
    if (sharedYDomain) {
        yDomain = sharedYDomain;
    } else if (isFinite(effectiveMin) && isFinite(effectiveMax)) {
        const dataRange = effectiveMax - effectiveMin;
        const buffer = Math.max(5, dataRange * 0.15);
        const lowerBound = effectiveMin - buffer;
        const upperBound = effectiveMax + buffer;
        const finalMin = Math.max(0, lowerBound);
        const finalMax = Math.min(100, upperBound);
        const minRange = 10;

        if (finalMin >= finalMax) {
             const centerValue = Math.min(100, Math.max(0, (effectiveMin + effectiveMax) / 2));
             yDomain = [Math.max(0, Math.floor((centerValue - minRange / 2) / 5) * 5), Math.min(100, Math.ceil((centerValue + minRange / 2) / 5) * 5)];
             if (yDomain[0] >= yDomain[1]) { yDomain = [Math.max(0, finalMin - 5), Math.min(100, finalMax + 5)]; }
        } else if (finalMax - finalMin < minRange) {
             const midPoint = (finalMin + finalMax) / 2;
             yDomain = [Math.max(0, Math.floor((midPoint - minRange / 2) / 5) * 5), Math.min(100, Math.ceil((midPoint + minRange / 2) / 5) * 5)];
             if (yDomain[0] >= yDomain[1]) {
                 yDomain = [Math.max(0, finalMin - buffer), Math.min(100, finalMax + buffer)];
                 if(yDomain[0] >= yDomain[1]) yDomain = [Math.max(0, finalMin - 5), Math.min(100, finalMax + 5)];
             }
        } else {
            yDomain = [finalMin, finalMax];
        }
    }

    const handleLegendClick = (entry: { value: string }) => {
        setVisibleGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entry.value)) {
                newSet.delete(entry.value);
            } else {
                newSet.add(entry.value);
            }
            return newSet;
        });
    };

    const yAxisTickFormatter = (value: number | string): string => {
        const metadata = data.dataPointMetadata.find(d => d.id === 'value');
        const prefixValue = metadata?.value_prefix;
        const suffixValue = metadata?.value_suffix;
        const prefix = (prefixValue && (typeof prefixValue !== 'object' || Object.keys(prefixValue).length > 0)) ? String(prefixValue) : '';
        const suffix = (suffixValue && (typeof suffixValue !== 'object' || Object.keys(suffixValue).length > 0)) ? String(suffixValue) : '%';
        const num = Number(value);
        if (isNaN(num)) return String(value);
        const formattedValue = num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        return `${prefix}${formattedValue}${suffix}`;
    };

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number }) => {
        if (!active || !payload || payload.length === 0 || label === undefined) return null;
        const visiblePayload = payload.filter(series => visibleGroups.has(series.name));
        if (visiblePayload.length === 0) return null;
        const valueMetadata = data.dataPointMetadata.find(m => m.id === 'value');
        const suffix = (typeof valueMetadata?.value_suffix === 'string') ? valueMetadata.value_suffix : '%';
        const prefix = (typeof valueMetadata?.value_prefix === 'string') ? valueMetadata.value_prefix : '';

        return (
            <div
                className="p-3 shadow-lg rounded-md text-sm max-w-xs"
                style={{ ...rc.tooltip }}
            >
                <p className="font-semibold mb-2" style={{ color: rc.fg }}>{`Year: ${label}`}</p>
                {visiblePayload.map((series) => {
                    const colorIndex = demographicGroups.indexOf(series.name);
                    const color = resolveColor(series.name, colorIndex !== -1 ? colorIndex : 0);
                    const pointData = series.payload;
                    return (
                        <div key={series.name} className="mb-1.5 last:mb-0">
                            <p className="font-medium" style={{ color: color }}>{series.name}</p>
                            <p style={{ color: color }}>
                                {`Value: ${series.value != null ? `${prefix}${series.value.toFixed(1)}${suffix}` : 'N/A'}`}
                            </p>
                            {pointData?.ci_lower !== undefined && pointData?.ci_upper !== undefined && (
                                <p className="text-xs" style={{ color: rc.muted }}>
                                    {`95% CI: [${pointData.ci_lower.toFixed(1)}%, ${pointData.ci_upper.toFixed(1)}%]`}
                                </p>
                            )}
                            {pointData?.n_actual && (
                                <p className="text-xs" style={{ color: rc.muted }}>
                                    {`N: ${pointData.n_actual.toLocaleString()}`}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className={
                compact
                    ? "w-full p-2"
                    : `w-full rounded-lg shadow px-4 md:px-6 pt-3 md:pt-4 pb-4 md:pb-5`
            }
            style={{ background: rc.surface }}
        >
            {!compact && (
                <div className="mb-3">
                    {/* Editorial type ramp — matches the generic sibling and
                        the Plot wrapper rules:
                          title    ~28px bold (headline)
                          subtitle ~18px regular (sentence-claim)
                          question 12px italic (caption) */}
                    <h2 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-tight" style={rc.titleStyle}>{data.metadata.title}</h2>
                    {data.metadata.subtitle && <p className="text-base sm:text-[18px] font-normal leading-snug mt-1.5 max-w-3xl" style={rc.subtitleStyle}>{data.metadata.subtitle}</p>}
                    {data.metadata.question && <p className="text-xs italic mt-2 leading-snug max-w-2xl" style={{ color: rc.muted, fontFamily: rc.fontBody }}>{data.metadata.question}</p>}
                </div>
            )}

            <div className={compact ? "h-[200px] md:h-[220px] w-full" : "h-[450px] md:h-[500px] w-full"}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        key={`${demographic}-${showCI}`}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                        {!compact && relevantPresidentialTerms.map((term, index) => (
                            // Faint party-tinted band, sourced from the active theme's party
                            // colors (+ '1A' alpha ~10%) so the overlay matches the lines.
                            <ReferenceArea key={`term-bg-${index}`} x1={term.start} x2={term.end} yAxisId="left"
                                fill={`${colorFor('party', term.party, 0)}1A`}
                                ifOverflow="visible" shapeRendering="crispEdges" />
                        ))}

                        <CartesianGrid
                            stroke={rc.grid.stroke}
                            strokeDasharray={rc.grid.strokeDasharray}
                            vertical={rc.grid.vertical}
                            horizontal={!rc.grid.hide}
                        />

                        <XAxis
                            dataKey="year" type="number"
                            domain={[xAxisMin, xAxisMax]}
                            allowDataOverflow={true}
                            ticks={xAxisTicks}
                            tick={{ ...rc.axisTick, fontSize: tickFontSize }}
                            padding={{ left: 10, right: 10 }}
                            tickFormatter={(year) => String(year)}
                            interval={0}
                            axisLine={{ stroke: rc.grid.stroke }}
                            tickLine={{ stroke: rc.grid.stroke }}
                        />

                        <YAxis
                            yAxisId="left"
                            tickFormatter={yAxisTickFormatter}
                            domain={yDomain}
                            allowDataOverflow={false}
                            axisLine={false} tickLine={false}
                            tick={{ ...rc.axisTick, fontSize: tickFontSize }}
                            width={compact ? 36 : 50}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: rc.muted, strokeWidth: 1, strokeDasharray: rc.grid.strokeDasharray }} />

                        {/* Per-panel legend. In `compact` mode (small-multiples)
                            it renders smaller so each panel gets its own group
                            attribution — different demographics per panel means
                            a single shared legend doesn't fit. */}
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            height={compact ? 22 : 40}
                            onClick={handleLegendClick}
                            iconSize={compact ? 7 : 10}
                            wrapperStyle={{ paddingTop: compact ? '2px' : '10px' }}
                            formatter={(value) => {
                                const isVisible = visibleGroups.has(value);
                                return (
                                    <span style={{
                                        color: isVisible ? rc.fg : rc.muted,
                                        cursor: 'pointer',
                                        marginLeft: '4px',
                                        fontSize: `${legendFontSize}px`,
                                    }}>{value}</span>
                                );
                            }}
                        />


                        {groupedData.map((group) => {
                            const colorIndex = demographicGroups.indexOf(group.name);
                            const color = resolveColor(group.name, colorIndex !== -1 ? colorIndex : 0);
                            return (
                                <Line
                                    key={group.name} yAxisId="left" type="linear"
                                    data={group.data}
                                    dataKey="value" name={group.name} stroke={color} strokeWidth={rc.stroke}
                                    // Hollow dots — white fill with a colored stroke. Reads
                                    // cleaner at year-by-year density than filled solid dots.
                                    dot={{ r: 3, fill: rc.surface, strokeWidth: 1.5, stroke: color }}
                                    activeDot={{ r: 5, fill: rc.surface, strokeWidth: 2, stroke: color }}
                                    hide={!visibleGroups.has(group.name)}
                                    connectNulls={true}
                                    isAnimationActive={false}
                                >
                                    {showCI && hasCIData && (
                                        <ErrorBar
                                            dataKey={(d: DataPoint) => (typeof d.standard_error === 'number' && !isNaN(d.standard_error)) ? (1.96 * d.standard_error) : 0}
                                            width={4} strokeWidth={1.5} stroke={color}
                                            opacity={0.35} direction="y"
                                        />
                                    )}
                                </Line>
                            );
                        })}

                        {/* Presidential-era labels: vertical text near the
                            bottom of each band, reading upward, in the theme's
                            muted color so the data lines stay the primary read.
                            Implemented via <Customized> because Recharts
                            silently drops bare <Text> children — it only
                            recognises a fixed set of element types in its
                            render tree (Line, Area, ReferenceArea, Customized,
                            …). The Customized callback gets the chart's
                            xScale/yScale so we can place the labels in pixel
                            space at the band's start, just above the x-axis. */}
                        {!compact && relevantPresidentialTerms.length > 0 && (
                            <Customized
                                component={(chartState: unknown) => {
                                    // Recharts types the render-prop argument loosely; narrow
                                    // to the two axis maps we read (see CustomizedChartState).
                                    const { xAxisMap, yAxisMap } = chartState as CustomizedChartState;
                                    const xAxis = xAxisMap?.[Object.keys(xAxisMap ?? {})[0]];
                                    const yAxis = yAxisMap?.[Object.keys(yAxisMap ?? {})[0]];
                                    if (!xAxis || !yAxis) return null;
                                    const xScale = xAxis.scale;
                                    const yScale = yAxis.scale;
                                    // Recharts' y-scale range is [top, bottom]
                                    // (inverted to match SVG coords), so
                                    // range()[0] is the bottom pixel.
                                    const yBottomPx = yScale.range()[0];
                                    return (
                                        <g>
                                            {relevantPresidentialTerms.map((term, index) => {
                                                const xPx = xScale(term.start);
                                                if (typeof xPx !== 'number') return null;
                                                // Anchor 6px above the x-axis,
                                                // 4px inset from the band start.
                                                // textAnchor="start" + rotate(-90)
                                                // makes the text extend UPWARD
                                                // inside the band, out of the
                                                // way of the data lines.
                                                const x = xPx + 4;
                                                const y = yBottomPx - 6;
                                                return (
                                                    <text
                                                        key={`term-label-${index}`}
                                                        x={x}
                                                        y={y}
                                                        fontSize={rc.axisTick.fontSize - 2}
                                                        fontFamily={rc.fontBody}
                                                        fontWeight={500}
                                                        fill={rc.muted}
                                                        opacity={0.7}
                                                        transform={`rotate(-90 ${x} ${y})`}
                                                        textAnchor="start"
                                                        dominantBaseline="hanging"
                                                    >
                                                        {term.president}
                                                    </text>
                                                );
                                            })}
                                        </g>
                                    );
                                }}
                            />
                        )}

                    </LineChart>
                </ResponsiveContainer>
            </div>

            {!compact && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-1 pt-2 border-t" style={{ borderColor: rc.grid.stroke }}>
                    <div className="text-xs text-left order-1 sm:order-none" style={rc.sourceStyle}>
                        Source: {data.metadata.source?.name || 'Not specified'}
                        {data.metadata.observations && ` (${data.metadata.observations.toLocaleString()} Observations)`}
                    </div>

                    <div className="flex items-center space-x-2 order-2 sm:order-none">
                        <Switch
                            id="show-ci" checked={showCI} onCheckedChange={setShowCI}
                            disabled={!hasCIData}
                        />
                        <Label htmlFor="show-ci" className="text-xs" style={{ color: hasCIData ? rc.muted : rc.grid.stroke }}>
                            Show 95% CI
                        </Label>
                    </div>
                </div>
            )}
        </div>
    );
}
