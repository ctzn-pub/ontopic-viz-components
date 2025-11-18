'use client';

import * as Plot from "@observablehq/plot";
import * as React from "react";

export interface SplitBarDataPoint {
  /** Category label (e.g., state name) */
  category: string;
  /** Overall value shown as bar */
  overall: number;
  /** Values for subcategories shown as dots */
  [subCategory: string]: string | number;
}

export interface SplitBarProps {
  /** Array of data points with category, overall, and subcategory values */
  data: SplitBarDataPoint[];

  /** Names of subcategories to display as dots (exactly 2) */
  subcategories: [string, string];

  /** Chart width in pixels */
  width?: number;

  /** Chart height in pixels */
  height?: number;

  /** Colors for the two subcategories */
  colors?: [string, string];

  /** Label for the category axis */
  categoryLabel?: string;

  /** Label for the value axis */
  valueLabel?: string;

  /** Caption text */
  caption?: string;

  /** Sort order for categories */
  sortBy?: 'overall' | 'category' | 'none';

  /** Sort direction */
  sortDirection?: 'ascending' | 'descending';

  /** Value formatter function */
  formatValue?: (value: number) => string;

  /** Additional CSS classes */
  className?: string;

  /** Left margin for category labels */
  marginLeft?: number;

  /** Show value labels on bars */
  showValueLabels?: boolean;
}

/**
 * SplitBar - Bars with contrasting subgroup dots
 *
 * Displays overall values as horizontal bars with subcategory values
 * overlaid as colored dots, useful for comparing subgroups within categories.
 *
 * @example
 * ```tsx
 * <SplitBar
 *   data={[
 *     { category: 'Alabama', overall: 25.5, Male: 23.2, Female: 27.8 },
 *     { category: 'Alaska', overall: 22.1, Male: 20.5, Female: 23.7 }
 *   ]}
 *   subcategories={['Male', 'Female']}
 *   colors={['#e15759', '#59a14f']}
 *   valueLabel="Prevalence (%)"
 * />
 * ```
 */
export const SplitBar: React.FC<SplitBarProps> = ({
  data,
  subcategories,
  width = 800,
  height = 750,
  colors = ['#e15759', '#59a14f'],
  categoryLabel = '',
  valueLabel = '',
  caption = '',
  sortBy = 'overall',
  sortDirection = 'descending',
  formatValue = (v) => `${v.toFixed(1)}%`,
  className = '',
  marginLeft = 150,
  showValueLabels = true
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;
    if (subcategories.length !== 2) {
      console.error('SplitBar requires exactly 2 subcategories');
      return;
    }

    containerRef.current.innerHTML = '';

    // Sort data
    let sortedData = [...data];
    if (sortBy === 'overall') {
      sortedData.sort((a, b) =>
        sortDirection === 'descending'
          ? b.overall - a.overall
          : a.overall - b.overall
      );
    } else if (sortBy === 'category') {
      sortedData.sort((a, b) =>
        sortDirection === 'descending'
          ? b.category.localeCompare(a.category)
          : a.category.localeCompare(b.category)
      );
    }

    // Prepare dot data
    const dotData = sortedData.flatMap((d) =>
      subcategories.map((subCat) => ({
        category: d.category,
        subcategory: subCat,
        value: typeof d[subCat] === 'number' ? (d[subCat] as number) : null
      }))
    ).filter((d) => d.value !== null);

    // Calculate value range
    const allValues = sortedData.flatMap((d) =>
      [d.overall, ...subcategories.map((s) => d[s] as number)].filter(
        (v) => typeof v === 'number'
      )
    );
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const plot = Plot.plot({
      caption,
      style: {
        backgroundColor: 'white',
        fontFamily: 'sans-serif'
      },
      color: {
        legend: true,
        domain: subcategories,
        range: colors
      },
      marginLeft,
      marginRight: 40,
      marginBottom: 60,
      width,
      height,
      clip: true,
      y: {
        label: categoryLabel,
        domain: sortedData.map((d) => d.category)
      },
      x: {
        label: valueLabel,
        domain: [minValue, maxValue],
        grid: true
      },
      marks: [
        // Background bars for overall values
        Plot.barX(sortedData, {
          y: 'category',
          x: 'overall',
          fill: '#e4e4e4',
          title: (d) => `Overall: ${formatValue(d.overall)}`
        }),
        // Dots for subcategory values
        Plot.dot(dotData, {
          y: 'category',
          x: 'value',
          fill: 'subcategory',
          r: 5,
          tip: true,
          title: (d) => `${d.subcategory}: ${formatValue(d.value!)}`
        }),
        // Value labels on bars
        ...(showValueLabels
          ? [
              Plot.text(sortedData, {
                y: 'category',
                x: 'overall',
                text: (d) => formatValue(d.overall),
                dx: -25,
                fill: 'black',
                fontSize: 9,
                fontWeight: 'normal',
                textAnchor: 'start'
              })
            ]
          : []),
        // Zero reference line
        Plot.ruleX([minValue])
      ]
    });

    containerRef.current.appendChild(plot);

    return () => {
      plot.remove();
    };
  }, [
    data,
    subcategories,
    width,
    height,
    colors,
    categoryLabel,
    valueLabel,
    caption,
    sortBy,
    sortDirection,
    formatValue,
    marginLeft,
    showValueLabels
  ]);

  return <div ref={containerRef} className={className}></div>;
};

export default SplitBar;
