'use client'

import * as Plot from '@observablehq/plot'
import * as React from 'react'
import { cn } from '@/viz/utils/cn'

// ============================================================================
// Types
// ============================================================================

export interface DotDistributionDataPoint {
  /** Country or entity code */
  code: string
  /** Display label */
  label: string
  /** Numeric value */
  value: number
}

export interface FocalCountry {
  code: string
  color: string
  label?: string
}

export interface Annotation {
  value: number
  label: string
  color?: string
}

export interface DotDistributionProps {
  /** Data points to display */
  data: DotDistributionDataPoint[]
  /** Countries to highlight with labels */
  focalCountries?: FocalCountry[]
  /** Threshold or reference annotations */
  annotations?: Annotation[]
  /** Chart title */
  title?: string
  /** Chart subtitle */
  subtitle?: string
  /** Value unit for tooltip */
  unit?: string
  /** Minimum value for scale */
  min?: number
  /** Maximum value for scale */
  max?: number
  /** Chart width */
  width?: number
  /** Chart height */
  height?: number
  /** Data source caption */
  source?: string
  /** Additional class names */
  className?: string
}

// ============================================================================
// Color Palette
// ============================================================================

const FOCAL_COLORS = [
  '#e41a1c', // red
  '#377eb8', // blue
  '#4daf4a', // green
  '#984ea3', // purple
  '#ff7f00', // orange
]

// ============================================================================
// DotDistribution Component
// ============================================================================

export function DotDistribution({
  data,
  focalCountries = [],
  annotations = [],
  title,
  subtitle,
  unit = '',
  min,
  max,
  width = 800,
  height = 120,
  source,
  className,
}: DotDistributionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!containerRef.current || !data.length) return

    containerRef.current.innerHTML = ''

    // Calculate domain
    const values = data.map((d) => d.value)
    const domainMin = min ?? Math.min(...values)
    const domainMax = max ?? Math.max(...values)

    // Create focal country set for quick lookup
    const focalSet = new Set(focalCountries.map((f) => f.code))
    const focalColorMap = new Map(
      focalCountries.map((f, i) => [f.code, f.color || FOCAL_COLORS[i % FOCAL_COLORS.length]])
    )
    const focalLabelMap = new Map(focalCountries.map((f) => [f.code, f.label]))

    // Separate focal and non-focal data
    const nonFocalData = data.filter((d) => !focalSet.has(d.code))
    const focalData = data.filter((d) => focalSet.has(d.code))

    // Format value for display
    const formatValue = (v: number) => {
      if (unit === '%') return `${v.toFixed(1)}%`
      if (unit === '$') return `$${v.toLocaleString()}`
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
      if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
      return v < 1 ? v.toFixed(3) : v.toFixed(1)
    }

    const marks: Plot.Markish[] = [
      // Background dots (non-focal)
      Plot.dotX(nonFocalData, {
        x: 'value',
        r: 4,
        fill: '#94a3b8',
        fillOpacity: 0.4,
        title: (d: DotDistributionDataPoint) => `${d.label}: ${formatValue(d.value)}${unit}`,
      }),

      // Focal country dots
      Plot.dotX(focalData, {
        x: 'value',
        r: 8,
        fill: (d: DotDistributionDataPoint) => focalColorMap.get(d.code) || '#e41a1c',
        stroke: '#fff',
        strokeWidth: 2,
        title: (d: DotDistributionDataPoint) => `${d.label}: ${formatValue(d.value)}${unit}`,
      }),

      // Focal country labels
      Plot.text(focalData, {
        x: 'value',
        y: 0,
        text: (d: DotDistributionDataPoint) => focalLabelMap.get(d.code) || d.label,
        fill: (d: DotDistributionDataPoint) => focalColorMap.get(d.code) || '#e41a1c',
        dy: -20,
        fontSize: 12,
        fontWeight: 600,
      }),

      // Annotation lines
      ...annotations.map((a) =>
        Plot.ruleX([a.value], {
          stroke: a.color || '#64748b',
          strokeWidth: 1.5,
          strokeDasharray: '4,4',
        })
      ),

      // Annotation labels
      ...annotations.map((a) =>
        Plot.text([a], {
          x: 'value',
          y: 0,
          text: 'label',
          fill: a.color || '#64748b',
          dy: 25,
          fontSize: 10,
        })
      ),
    ]

    const plot = Plot.plot({
      width,
      height,
      marginTop: 40,
      marginBottom: 40,
      marginLeft: 20,
      marginRight: 20,
      x: {
        domain: [domainMin, domainMax],
        label: null,
        tickFormat: (d) => formatValue(d as number),
      },
      y: {
        axis: null,
      },
      style: {
        backgroundColor: 'transparent',
      },
      marks,
    })

    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [data, focalCountries, annotations, min, max, width, height, unit])

  if (!data.length) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>
        No data available
      </div>
    )
  }

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>}
      <div ref={containerRef} className="w-full" />
      {source && (
        <p className="text-xs text-muted-foreground mt-2">Source: {source}</p>
      )}
    </div>
  )
}

export default DotDistribution
