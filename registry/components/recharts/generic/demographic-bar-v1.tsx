'use client';

import React, { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ErrorBar,
} from 'recharts';
import {
    Users,
    GraduationCap,
    UserCircle2,
    DollarSign,
    Palette,
    LucideIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/viz/ui/tabs';
import { useVizTheme } from '@/viz/theme/provider';

/** One demographic break-out cell (e.g. the "25-34" row of "Age Group"). */
interface BreakoutDetails {
    value: number;
    confidence_limit_low: number;
    confidence_limit_high: number;
    [key: string]: unknown;
}

interface DataPoint extends BreakoutDetails {
    break_out: string;
    error: [number, number];
    break_out_category: string;
}

interface DemographicBarChartProps {
    /**
     * Nested record keyed by demographic category, then by break-out:
     * { "Age Group": { "18-24": { value, confidence_limit_low, confidence_limit_high }, … }, … }
     */
    data: Record<string, Record<string, BreakoutDetails | null> | null | undefined>;
    ylabel?: string;
    /**
     * Explicit semantic domain for the series color. Defaults to null, which
     * resolves to the categorical cycle at index 0 — the theme's ink (the
     * Tufte default). Never inferred from the data.
     */
    colorDomain?: 'party' | 'sentiment' | null;
}

const domains = {
    'Age Group': ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    'Education Attained': [
        'Less than H.S.',
        'H.S. or G.E.D.',
        'Some post-H.S.',
        'College graduate',
    ],
    'Household Income': [
        'Less than $15,000',
        '$15,000-$24,999',
        '$25,000-$34,999',
        '$35,000-$49,999',
        '$50,000-$99,999',
        '$100,000-$199,999',
        '$200,000+',
    ],
    'Race/Ethnicity': [
        'White, non-Hispanic',
        'Black, non-Hispanic',
        'Asian, non-Hispanic',
        'Hispanic',
    ],
    Gender: ['Female', 'Male'],
};

const categoryIcons: Record<string, LucideIcon> = {
    'Age Group': Users,
    'Education Attained': GraduationCap,
    Gender: UserCircle2,
    'Household Income': DollarSign,
    'Race/Ethnicity': Palette,
};

interface DemographicCategory {
    key: string;
    icon: LucideIcon;
    data: DataPoint[];
}

export default function DemographicBarChart({
    data,
    ylabel = 'Value (%)',
    colorDomain = null,
}: DemographicBarChartProps) {
    const { theme, rc, colorFor } = useVizTheme();
    // null domain + index 0 -> categorical[0] = theme ink (the Tufte default).
    const seriesColor = colorFor(colorDomain, 'value', 0);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [demographicCategories, setDemographicCategories] = useState<DemographicCategory[]>([]);

    React.useEffect(() => {
        if (!data || typeof data !== 'object') return;

        const categories = Object.entries(data)
            .filter(
                (entry): entry is [string, Record<string, BreakoutDetails | null>] =>
                    entry[1] != null &&
                    typeof entry[1] === 'object' &&
                    Object.values(entry[1]).some((value) => value !== null)
            )
            .map(([key, categoryData]) => ({
                key,
                icon: categoryIcons[key] || Users,
                data: Object.entries(categoryData)
                    .filter((entry): entry is [string, BreakoutDetails] => entry[1] !== null)
                    .map(([breakOut, details]): DataPoint => ({
                        break_out: breakOut,
                        ...details,
                        error: [
                            details.value - details.confidence_limit_low,
                            details.confidence_limit_high - details.value,
                        ],
                        break_out_category: key,
                    }))
                    .sort((a, b) => {
                        const order = domains[key as keyof typeof domains];
                        if (!order) return 0;
                        const indexA = order.indexOf(a.break_out);
                        const indexB = order.indexOf(b.break_out);
                        return indexA - indexB;
                    }),
            }));

        setDemographicCategories(categories);
        if (categories.length > 0 && !activeTab) {
            setActiveTab(categories[0].key);
        }
    }, [data, activeTab]);

    if (demographicCategories.length === 0) {
        return (
            <div
                className="border rounded-lg p-6"
                style={{ background: rc.surface, borderColor: theme.border }}
            >
                <div>
                    <p style={{ color: rc.muted, fontFamily: rc.fontBody }}>
                        No demographic data available
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="border rounded-lg p-6"
            style={{ background: rc.surface, borderColor: theme.border, color: rc.fg }}
        >
            <div className="mb-4">
                <h3
                    className="text-lg font-semibold flex items-center gap-2"
                    style={rc.titleStyle}
                >
                    <Users className="w-5 h-5" />
                    Demographic Bar Chart with Error Bars
                </h3>
            </div>
            <div>
                <Tabs value={activeTab || undefined} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${demographicCategories.length}, 1fr)` }}>
                        {demographicCategories.map((category, index) => {
                            const Icon = category.icon;
                            return (
                                <TabsTrigger key={category.key} value={category.key}>
                                    <Icon
                                        className="w-4 h-4 mr-2"
                                        style={{ color: colorFor(null, category.key, index) }}
                                    />
                                    {category.key}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {demographicCategories.map((category) => (
                        <TabsContent key={category.key} value={category.key} className="space-y-4">
                            <div className="flex justify-center mt-4">
                                <BarChart
                                    width={600}
                                    height={400}
                                    data={category.data}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                                    className="w-full h-full"
                                >
                                    <CartesianGrid
                                        stroke={rc.grid.stroke}
                                        strokeDasharray={rc.grid.strokeDasharray}
                                        vertical={rc.grid.vertical}
                                        horizontal={!rc.grid.hide}
                                    />
                                    <XAxis
                                        dataKey="break_out"
                                        label={{
                                            value: category.data[0]?.break_out_category || '',
                                            position: 'insideBottom',
                                            offset: -10,
                                            fill: rc.muted,
                                        }}
                                        interval={0}
                                        tick={{
                                            ...rc.axisTick,
                                            textAnchor: 'end',
                                            dy: 10,
                                        }}
                                        height={80}
                                        padding={{ left: 30, right: 30 }}
                                    />
                                    <YAxis
                                        label={{
                                            value: ylabel,
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: 0,
                                            style: { textAnchor: 'middle' },
                                            fill: rc.muted,
                                        }}
                                        tick={rc.axisTick}
                                    />
                                    <Tooltip
                                        contentStyle={{ ...rc.tooltip, fontFamily: rc.fontBody }}
                                    />
                                    <Bar dataKey="value" fill={seriesColor} isAnimationActive={false}>
                                        <ErrorBar
                                            dataKey="error"
                                            width={4}
                                            strokeWidth={2}
                                            stroke={rc.muted}
                                        />
                                    </Bar>
                                </BarChart>
                            </div>

                            <p className="text-center" style={rc.sourceStyle}>
                                Error bars represent 95% confidence intervals
                            </p>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}
