import * as Plot from '@observablehq/plot'
import { cn } from '@/viz/utils/cn'

// ============================================================================
// Types
// ============================================================================

export interface ServerPlotProps {
  /** Observable Plot specification */
  spec: Plot.PlotOptions
  /** Chart title */
  title?: string
  /** Chart subtitle */
  subtitle?: string
  /** Data source caption */
  source?: string
  /** Additional class names */
  className?: string
}

// ============================================================================
// ServerPlot Component
// ============================================================================

/**
 * Server-side rendered Observable Plot chart.
 *
 * This component renders the chart on the server and returns static SVG.
 * No JavaScript is shipped to the client - ideal for static visualizations.
 *
 * @example
 * ```tsx
 * // In a Server Component (no 'use client')
 * import { ServerPlot } from '@/viz/components/plot/wb/server-plot-v1'
 *
 * export default async function Page() {
 *   const data = await fetchData()
 *
 *   return (
 *     <ServerPlot
 *       title="GDP Distribution"
 *       spec={{
 *         marks: [
 *           Plot.dotX(data, { x: 'gdp', fill: 'region' })
 *         ]
 *       }}
 *       source="World Bank, 2023"
 *     />
 *   )
 * }
 * ```
 */
export function ServerPlot({
  spec,
  title,
  subtitle,
  source,
  className,
}: ServerPlotProps) {
  // Generate the SVG string on the server
  const plot = Plot.plot(spec)
  const svgString = plot.outerHTML

  return (
    <div className={cn('space-y-2', className)}>
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
      {source && (
        <p className="text-xs text-muted-foreground">Source: {source}</p>
      )}
    </div>
  )
}

// ============================================================================
// Pre-built Server Chart Components
// ============================================================================

export interface ServerBarChartProps {
  data: { label: string; value: number; color?: string }[]
  title?: string
  subtitle?: string
  source?: string
  width?: number
  height?: number
  horizontal?: boolean
  className?: string
}

/**
 * Server-rendered bar chart
 */
export function ServerBarChart({
  data,
  title,
  subtitle,
  source,
  width = 600,
  height = 300,
  horizontal = false,
  className,
}: ServerBarChartProps) {
  const spec: Plot.PlotOptions = horizontal
    ? {
        width,
        height,
        marginLeft: 100,
        x: { label: null },
        y: { label: null },
        marks: [
          Plot.barX(data, {
            x: 'value',
            y: 'label',
            fill: (d) => d.color || '#3b82f6',
            sort: { y: '-x' },
          }),
          Plot.ruleX([0]),
        ],
      }
    : {
        width,
        height,
        marginBottom: 50,
        x: { label: null, tickRotate: -45 },
        y: { label: null },
        marks: [
          Plot.barY(data, {
            x: 'label',
            y: 'value',
            fill: (d) => d.color || '#3b82f6',
          }),
          Plot.ruleY([0]),
        ],
      }

  return (
    <ServerPlot
      spec={spec}
      title={title}
      subtitle={subtitle}
      source={source}
      className={className}
    />
  )
}

export interface ServerLineChartProps {
  data: { year: number; value: number; series?: string }[]
  title?: string
  subtitle?: string
  source?: string
  width?: number
  height?: number
  className?: string
}

/**
 * Server-rendered line chart
 */
export function ServerLineChart({
  data,
  title,
  subtitle,
  source,
  width = 600,
  height = 300,
  className,
}: ServerLineChartProps) {
  const hasSeries = data.some((d) => d.series)

  const spec: Plot.PlotOptions = {
    width,
    height,
    x: { label: null },
    y: { label: null, grid: true },
    color: hasSeries ? { legend: true } : undefined,
    marks: [
      Plot.lineY(data, {
        x: 'year',
        y: 'value',
        stroke: hasSeries ? 'series' : '#3b82f6',
        strokeWidth: 2,
      }),
      Plot.dot(data, {
        x: 'year',
        y: 'value',
        fill: hasSeries ? 'series' : '#3b82f6',
        r: 3,
      }),
    ],
  }

  return (
    <ServerPlot
      spec={spec}
      title={title}
      subtitle={subtitle}
      source={source}
      className={className}
    />
  )
}

export interface ServerScatterPlotProps {
  data: { x: number; y: number; label?: string; color?: string }[]
  title?: string
  subtitle?: string
  source?: string
  xLabel?: string
  yLabel?: string
  width?: number
  height?: number
  showTrendLine?: boolean
  className?: string
}

/**
 * Server-rendered scatter plot
 */
export function ServerScatterPlot({
  data,
  title,
  subtitle,
  source,
  xLabel,
  yLabel,
  width = 600,
  height = 400,
  showTrendLine = false,
  className,
}: ServerScatterPlotProps) {
  const marks: Plot.Markish[] = [
    Plot.dot(data, {
      x: 'x',
      y: 'y',
      fill: (d) => d.color || '#3b82f6',
      r: 5,
      title: (d) => d.label,
    }),
  ]

  if (showTrendLine) {
    marks.push(
      Plot.linearRegressionY(data, {
        x: 'x',
        y: 'y',
        stroke: '#94a3b8',
        strokeWidth: 1.5,
        strokeDasharray: '4,4',
      })
    )
  }

  // Add labels for points that have them
  const labeledData = data.filter((d) => d.label)
  if (labeledData.length > 0 && labeledData.length <= 20) {
    marks.push(
      Plot.text(labeledData, {
        x: 'x',
        y: 'y',
        text: 'label',
        dy: -10,
        fontSize: 10,
      })
    )
  }

  const spec: Plot.PlotOptions = {
    width,
    height,
    x: { label: xLabel, grid: true },
    y: { label: yLabel, grid: true },
    marks,
  }

  return (
    <ServerPlot
      spec={spec}
      title={title}
      subtitle={subtitle}
      source={source}
      className={className}
    />
  )
}

export default ServerPlot
