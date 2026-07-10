'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable, SortableHeader } from './data-table-v1'
import { cn } from '@/viz/utils/cn'

// ============================================================================
// Types
// ============================================================================

export interface CountryData {
  code: string
  name: string
  flag?: string
  region?: string
  incomeGroup?: string
  [key: string]: string | number | undefined
}

export interface CountryTableColumn {
  key: string
  header: string
  type?: 'text' | 'number' | 'currency' | 'percent' | 'index'
  decimals?: number
  prefix?: string
  suffix?: string
  width?: number
}

export interface CountryTableProps {
  /** Country data array */
  data: CountryData[]
  /** Column definitions - simplified format */
  columns: CountryTableColumn[]
  /** Country code to highlight */
  focalCountry?: string
  /** Enable virtual scrolling */
  virtualScroll?: boolean
  /** Container height */
  height?: number
  /** Callback when country is clicked */
  onCountryClick?: (code: string) => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// Flag Component
// ============================================================================

function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  const iso2 = code.length === 3 ? getIso2FromIso3(code) : code.toLowerCase()

  return (
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${iso2}.svg`}
      alt={`${code} flag`}
      width={size}
      height={size}
      className="rounded-full"
      loading="lazy"
    />
  )
}

// ISO3 to ISO2 mapping (common countries)
const iso3ToIso2: Record<string, string> = {
  USA: 'us', GBR: 'gb', DEU: 'de', FRA: 'fr', ITA: 'it', ESP: 'es', NLD: 'nl',
  BEL: 'be', CHE: 'ch', AUT: 'at', SWE: 'se', NOR: 'no', DNK: 'dk', FIN: 'fi',
  POL: 'pl', CZE: 'cz', HUN: 'hu', ROU: 'ro', GRC: 'gr', PRT: 'pt', IRL: 'ie',
  CHN: 'cn', JPN: 'jp', KOR: 'kr', IND: 'in', IDN: 'id', THA: 'th', VNM: 'vn',
  MYS: 'my', SGP: 'sg', PHL: 'ph', PAK: 'pk', BGD: 'bd', TWN: 'tw', HKG: 'hk',
  RUS: 'ru', UKR: 'ua', TUR: 'tr', ISR: 'il', SAU: 'sa', ARE: 'ae', IRN: 'ir',
  EGY: 'eg', ZAF: 'za', NGA: 'ng', KEN: 'ke', ETH: 'et', MAR: 'ma', DZA: 'dz',
  BRA: 'br', MEX: 'mx', ARG: 'ar', COL: 'co', CHL: 'cl', PER: 'pe', VEN: 've',
  CAN: 'ca', AUS: 'au', NZL: 'nz',
}

function getIso2FromIso3(iso3: string): string {
  return iso3ToIso2[iso3] || iso3.substring(0, 2).toLowerCase()
}

// ============================================================================
// Value Formatters
// ============================================================================

function formatValue(
  value: unknown,
  type: CountryTableColumn['type'] = 'text',
  decimals = 1,
  prefix = '',
  suffix = ''
): string {
  if (value === null || value === undefined) return '—'

  const num = Number(value)

  switch (type) {
    case 'currency':
      if (num >= 1e12) return `${prefix}${(num / 1e12).toFixed(decimals)}T${suffix}`
      if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(decimals)}B${suffix}`
      if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(decimals)}M${suffix}`
      if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(decimals)}K${suffix}`
      return `${prefix}${num.toFixed(decimals)}${suffix}`

    case 'percent':
      return `${num.toFixed(decimals)}%`

    case 'index':
      return num.toFixed(decimals > 0 ? decimals : 2)

    case 'number':
      return num.toLocaleString(undefined, { maximumFractionDigits: decimals })

    default:
      return String(value)
  }
}

// ============================================================================
// Build Columns
// ============================================================================

function buildColumns(
  columnDefs: CountryTableColumn[],
  onCountryClick?: (code: string) => void
): ColumnDef<CountryData>[] {
  const columns: ColumnDef<CountryData>[] = [
    // Country column with flag
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Country</SortableHeader>,
      cell: ({ row }) => (
        <div
          className={cn(
            'flex items-center gap-2',
            onCountryClick && 'cursor-pointer hover:underline'
          )}
          onClick={(e) => {
            if (onCountryClick) {
              e.stopPropagation()
              onCountryClick(row.original.code)
            }
          }}
        >
          <CountryFlag code={row.original.code} />
          <span>{row.original.name}</span>
        </div>
      ),
      size: 200,
    },
  ]

  // Add dynamic columns
  for (const col of columnDefs) {
    if (col.key === 'name' || col.key === 'code') continue

    columns.push({
      accessorKey: col.key,
      header: ({ column }) => <SortableHeader column={column}>{col.header}</SortableHeader>,
      cell: ({ row }) => {
        const value = row.original[col.key]
        return (
          <span className={col.type === 'number' || col.type === 'currency' ? 'tabular-nums' : ''}>
            {formatValue(value, col.type, col.decimals, col.prefix, col.suffix)}
          </span>
        )
      },
      size: col.width,
    })
  }

  return columns
}

// ============================================================================
// CountryTable Component
// ============================================================================

export function CountryTable({
  data,
  columns: columnDefs,
  focalCountry,
  virtualScroll = false,
  height = 500,
  onCountryClick,
  className,
}: CountryTableProps) {
  const columns = React.useMemo(
    () => buildColumns(columnDefs, onCountryClick),
    [columnDefs, onCountryClick]
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      virtualScroll={virtualScroll}
      height={height}
      highlightRow={focalCountry ? (row) => row.code === focalCountry : undefined}
      searchColumn="name"
      searchPlaceholder="Search countries..."
      exportFilename="country-data"
      onRowClick={onCountryClick ? (row) => onCountryClick(row.code) : undefined}
      className={className}
    />
  )
}

export default CountryTable
