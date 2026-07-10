'use client'

import * as React from 'react'
import { cn } from '@/viz/utils/cn'

// ============================================================================
// Types
// ============================================================================

export interface CountryMetadata {
  code: string
  name: string
  region?: string
  subregion?: string
  incomeGroup?: string
  population?: number
  gdp?: number
  gdpPerCapita?: number
  blocs?: string[]
}

export interface CountryProfileProps {
  /** Country metadata */
  country: CountryMetadata
  /** Child components to render */
  children: React.ReactNode
  /** Additional class names */
  className?: string
}

export interface ProfileHeaderProps {
  country: CountryMetadata
  className?: string
}

export interface KeyMetricsGridProps {
  country: CountryMetadata
  metrics?: Array<{
    key: string
    label: string
    value: number | string
    unit?: string
    trend?: 'up' | 'down' | 'flat'
  }>
  className?: string
}

export interface BlocBadgeProps {
  bloc: string
  className?: string
}

// ============================================================================
// Bloc Definitions
// ============================================================================

const BLOC_INFO: Record<string, { name: string; color: string; members: string[] }> = {
  BRICS: {
    name: 'BRICS+',
    color: '#ef4444',
    members: ['BRA', 'RUS', 'IND', 'CHN', 'ZAF', 'IRN', 'EGY', 'ETH', 'ARE', 'SAU'],
  },
  G7: {
    name: 'G7',
    color: '#3b82f6',
    members: ['USA', 'GBR', 'FRA', 'DEU', 'ITA', 'CAN', 'JPN'],
  },
  G20: {
    name: 'G20',
    color: '#8b5cf6',
    members: [
      'ARG', 'AUS', 'BRA', 'CAN', 'CHN', 'FRA', 'DEU', 'IND', 'IDN', 'ITA',
      'JPN', 'MEX', 'RUS', 'SAU', 'ZAF', 'KOR', 'TUR', 'GBR', 'USA',
    ],
  },
  EU: {
    name: 'EU',
    color: '#0ea5e9',
    members: [
      'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA',
      'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD',
      'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE',
    ],
  },
  ASEAN: {
    name: 'ASEAN',
    color: '#f59e0b',
    members: ['BRN', 'KHM', 'IDN', 'LAO', 'MYS', 'MMR', 'PHL', 'SGP', 'THA', 'VNM'],
  },
  OPEC: {
    name: 'OPEC',
    color: '#10b981',
    members: ['DZA', 'AGO', 'COG', 'GNQ', 'GAB', 'IRN', 'IRQ', 'KWT', 'LBY', 'NGA', 'SAU', 'ARE', 'VEN'],
  },
}

/**
 * Detect which blocs a country belongs to
 */
export function detectBlocs(countryCode: string): string[] {
  return Object.entries(BLOC_INFO)
    .filter(([, info]) => info.members.includes(countryCode))
    .map(([bloc]) => bloc)
}

/**
 * Get countries in the same bloc
 */
export function getBlocMembers(bloc: string): string[] {
  return BLOC_INFO[bloc]?.members || []
}

// ============================================================================
// Flag Component
// ============================================================================

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

function getIso2(iso3: string): string {
  return iso3ToIso2[iso3] || iso3.substring(0, 2).toLowerCase()
}

function CountryFlag({ code, size = 64 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${getIso2(code)}.svg`}
      alt={`${code} flag`}
      width={size}
      height={size}
      className="rounded-full shadow-md"
    />
  )
}

// ============================================================================
// Sub-components
// ============================================================================

export function BlocBadge({ bloc, className }: BlocBadgeProps) {
  const info = BLOC_INFO[bloc]
  if (!info) return null

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        className
      )}
      style={{ backgroundColor: `${info.color}20`, color: info.color }}
    >
      {info.name}
    </span>
  )
}

export function ProfileHeader({ country, className }: ProfileHeaderProps) {
  const blocs = country.blocs || detectBlocs(country.code)

  const formatNumber = (n: number | undefined) => {
    if (!n) return '—'
    if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    return n.toLocaleString()
  }

  return (
    <div className={cn('flex items-start gap-6', className)}>
      <CountryFlag code={country.code} size={80} />

      <div className="flex-1 space-y-2">
        <div>
          <h1 className="text-3xl font-bold">{country.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            {country.region && <span>{country.region}</span>}
            {country.incomeGroup && (
              <>
                <span>•</span>
                <span>{country.incomeGroup}</span>
              </>
            )}
          </div>
        </div>

        {blocs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {blocs.map((bloc) => (
              <BlocBadge key={bloc} bloc={bloc} />
            ))}
          </div>
        )}

        <div className="flex gap-6 text-sm pt-2">
          {country.population && (
            <div>
              <span className="text-muted-foreground">Population: </span>
              <span className="font-medium">{formatNumber(country.population)}</span>
            </div>
          )}
          {country.gdp && (
            <div>
              <span className="text-muted-foreground">GDP: </span>
              <span className="font-medium">{formatNumber(country.gdp)}</span>
            </div>
          )}
          {country.gdpPerCapita && (
            <div>
              <span className="text-muted-foreground">GDP/capita: </span>
              <span className="font-medium">${country.gdpPerCapita.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function KeyMetricsGrid({ metrics = [], className }: KeyMetricsGridProps) {
  if (!metrics.length) return null

  const getTrendColor = (trend?: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return ''
    }
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className="p-4 rounded-lg border bg-card"
        >
          <div className="text-sm text-muted-foreground">{metric.label}</div>
          <div className="text-2xl font-bold mt-1">
            {metric.value}
            {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
          </div>
          {metric.trend && (
            <div className={cn('text-sm mt-1', getTrendColor(metric.trend))}>
              {getTrendIcon(metric.trend)} vs last year
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// CountryProfile Component
// ============================================================================

/**
 * Container component for country profile pages.
 *
 * @example
 * ```tsx
 * <CountryProfile country={countryData}>
 *   <ProfileHeader country={countryData} />
 *   <KeyMetricsGrid metrics={metrics} />
 *   <RegionalComparison region="South Asia" focalCountry="IND" />
 *   {country.blocs.includes('BRICS') && (
 *     <BlocComparison bloc="BRICS" focalCountry="IND" />
 *   )}
 * </CountryProfile>
 * ```
 */
export function CountryProfile({
  country,
  children,
  className,
}: CountryProfileProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {children}
    </div>
  )
}

export default CountryProfile
