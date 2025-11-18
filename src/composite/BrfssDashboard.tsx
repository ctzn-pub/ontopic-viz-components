'use client';

import React, { useState, useEffect } from 'react';
import {
    Line,
    LineChart,
    Bar,
    BarChart,
    ScatterChart,
    Scatter,
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
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DataPoint {
    break_out: string;
    value: number;
    confidence_limit_low: number;
    confidence_limit_high: number;
    error: [number, number];
    break_out_category: string;
    [key: string]: any; // Allow additional properties
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

interface CategoryInfo {
    icon: LucideIcon;
    color: string;
}

const categoryReference: Record<string, CategoryInfo> = {
    'Age Group': { icon: Users, color: 'text-blue-500' },
    'Education Attained': { icon: GraduationCap, color: 'text-green-500' },
    Gender: { icon: UserCircle2, color: 'text-purple-500' },
    'Household Income': { icon: DollarSign, color: 'text-yellow-500' },
    'Race/Ethnicity': { icon: Palette, color: 'text-red-500' },
};

const defaultCategoryInfo: CategoryInfo = {
    icon: Users,
    color: 'text-gray-500',
};

function getCategoryInfo(category: string): CategoryInfo {
    return categoryReference[category] || defaultCategoryInfo;
}

const ChartComponent = ({ chartType, data, ylabel }: any) => {

    console.log('data', data)
    const CommonProps = {
        width: 600,
        height: 400,
        data: data,
        margin: { top: 20, right: 30, left: 20, bottom: 25 },
        className: 'w-full h-full',
    };

    const XAxisProps = {
        dataKey: 'break_out',
        label: {
            value: data[0].break_out_category,
            position: 'insideBottom',
            offset: -10,
        },
        interval: 0,
        tick: {
            fill: 'hsl(var(--foreground))',
            fontSize: 10, // Further reduced font size
            //   angle: -45, // Rotate labels
            textAnchor: 'end',
            dy: 10,
        },
        height: 80, // Increased height for rotated labels
        padding: { left: 30, right: 30 }
    };

    const YAxisProps = {
        label: {
            value: ylabel,
            angle: -90,
            position: 'insideLeft',
            offset: 0,
            style: { textAnchor: 'middle' },
        },
        tick: { fill: 'hsl(var(--foreground))' },
    };

    const TooltipProps = {
        contentStyle: {
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
        },
    };

    switch (chartType) {
        case 'dot':
            return (
                <ScatterChart {...CommonProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis {...XAxisProps} />
                    <YAxis {...YAxisProps} />
                    <Tooltip {...TooltipProps} />
                    <Scatter dataKey="value" fill='hsl(var(--foreground))' isAnimationActive={false}>
                        <ErrorBar
                            dataKey="error"
                            width={4}
                            strokeWidth={2}
                            stroke="grey"
                        />
                    </Scatter>
                </ScatterChart>
            );
        case 'line':
            return (
                <LineChart {...CommonProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis {...XAxisProps} />
                    <YAxis {...YAxisProps} />
                    <Tooltip {...TooltipProps} />
                    <Line
                        dataKey="value"
                        stroke='hsl(var(--foreground))'
                        isAnimationActive={false}
                        dot={true}
                    >
                        <ErrorBar
                            dataKey="error"
                            width={4}
                            strokeWidth={2}
                            stroke="grey"
                        />
                    </Line>
                </LineChart>
            );
        case 'bar':
            return (
                <BarChart {...CommonProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis {...XAxisProps} />
                    <YAxis {...YAxisProps} />
                    <Tooltip {...TooltipProps} />
                    <Bar dataKey="value" fill='hsl(var(--foreground))' isAnimationActive={false}>
                        <ErrorBar
                            dataKey="error"
                            width={4}
                            strokeWidth={2}
                            stroke="grey"
                        />
                    </Bar>
                </BarChart>
            );
        default:
            return null;
    }
};

interface DemographicCategory extends CategoryInfo {
    key: string;
    data: DataPoint[];
}

export default function DemographicDataDashboard({ data, stateCode }: any) {
    const [chartType, setChartType] = useState('dot');
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [demographicCategories, setDemographicCategories] = useState<
        DemographicCategory[]
    >([]);

    useEffect(() => {
        console.log('DemographicDataDashboard data:', data);
        console.log('Looking for state code:', stateCode);
        console.log('Available state codes:', Object.keys(data || {}));
        
        const stateData = data[stateCode];
        console.log('State data found:', stateData);
        
        if (!stateData || !stateData.demographics) {
            console.log('No demographics data found for state:', stateCode);
            return;
        }

        const categories = Object.entries(stateData.demographics)
            .filter(
                ([_, categoryData]) =>
                    categoryData &&
                    typeof categoryData === 'object' &&
                    Object.values(categoryData).some((value) => value !== null)
            )
            .map(([key, categoryData]) => ({
                key,
                ...getCategoryInfo(key),
                data: Object.entries(categoryData as Record<string, any>)
                    .map(([breakOut, details]: [string, any]) => ({
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
                        return order.indexOf(a.break_out) - order.indexOf(b.break_out);
                    }),
            }));

        setDemographicCategories(categories);
        setActiveTab(categories.length > 0 ? categories[0].key : null);
    }, [data, stateCode]);

    const toggleChartType = () => {
        const types = ['dot', 'line', 'bar'];
        const currentIndex = types.indexOf(chartType);
        setChartType(types[(currentIndex + 1) % types.length]);
    };

    if (!demographicCategories.length) {
        return <div>No demographic data available for this state.</div>;
    }

    return (
        <Card className="p-4 w-full max-w-3xl mx-auto">

            <CardContent>
                <Tabs
                    defaultValue={demographicCategories[0].key}
                    className="w-full"
                >
                    <TabsList>
                        {demographicCategories.map((category) => (
                            <TabsTrigger key={category.key} value={category.key}>
                                <category.icon
                                    size={12}
                                    style={{ strokeWidth: '1px' }}
                                    className={`mr-2 ${category.color}`}
                                />{' '}
                                {category.key}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {demographicCategories.map((category) => (
                        <TabsContent key={category.key} value={category.key}>
                            <div className="w-full">
                                <div className="mb-4">
                                    <Button onClick={toggleChartType}>
                                        Switch to{' '}
                                        {chartType === 'dot'
                                            ? 'Line'
                                            : chartType === 'line'
                                                ? 'Bar'
                                                : 'Dot'}{' '}
                                        Chart
                                    </Button>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-bold">{data.clean_title}</h2>
                                        <span className="text-md text-gray-500">({data.year})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-md text-gray-500">{data.question}</span>
                                    </div>
                                </div>
                                <ChartComponent
                                    chartType={chartType}
                                    data={category.data}
                                    ylabel={`${data.clean_title} (${data.data_value_unit})`}
                                />
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
                <p>Data source: CDC Behavioral Risk Factor Surveillance System</p>
                <p>
                    Note:{' '}
                    {chartType === 'bar' ? 'Bars' : 'Points'} represent{' '}
                    {data.response.toLowerCase()} with 95% confidence intervals.
                </p>
            </CardFooter>
        </Card>
    );
}
