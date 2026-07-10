'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Columns3, Download } from 'lucide-react'
import { cn } from '@/viz/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================================================
// Types
// ============================================================================

export interface DataTableProps<TData, TValue> {
  /** Column definitions */
  columns: ColumnDef<TData, TValue>[]
  /** Data array */
  data: TData[]
  /** Enable virtual scrolling for large datasets */
  virtualScroll?: boolean
  /** Height for virtual scroll container */
  height?: number
  /** Estimated row height for virtualization */
  estimateRowHeight?: number
  /** Function to determine if a row should be highlighted */
  highlightRow?: (row: TData) => boolean
  /** Global search placeholder */
  searchPlaceholder?: string
  /** Column to use for global search */
  searchColumn?: string
  /** Show column visibility toggle */
  showColumnToggle?: boolean
  /** Show export button */
  showExport?: boolean
  /** Export filename (without extension) */
  exportFilename?: string
  /** Additional class names */
  className?: string
  /** Callback when row is clicked */
  onRowClick?: (row: TData) => void
}

// ============================================================================
// Helper: Sort Header
// ============================================================================

export function SortableHeader({
  column,
  children,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }
  children: React.ReactNode
}) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

// ============================================================================
// Helper: Export to CSV
// ============================================================================

function exportToCSV<TData>(data: TData[], columns: ColumnDef<TData, unknown>[], filename: string) {
  const headers = columns
    .filter((col) => 'accessorKey' in col || 'accessorFn' in col)
    .map((col) => {
      if (typeof col.header === 'string') return col.header
      if ('accessorKey' in col) return String(col.accessorKey)
      return 'Column'
    })

  const rows = data.map((row) =>
    columns
      .filter((col) => 'accessorKey' in col || 'accessorFn' in col)
      .map((col) => {
        if ('accessorKey' in col) {
          const value = (row as Record<string, unknown>)[col.accessorKey as string]
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value ?? '')
        }
        return ''
      })
      .join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

// ============================================================================
// DataTable Component
// ============================================================================

export function DataTable<TData, TValue>({
  columns,
  data,
  virtualScroll = false,
  height = 600,
  estimateRowHeight = 48,
  highlightRow,
  searchPlaceholder = 'Search...',
  searchColumn,
  showColumnToggle = true,
  showExport = true,
  exportFilename = 'data-export',
  className,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  const { rows } = table.getRowModel()

  // Virtual scrolling setup
  const parentRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Render table body based on virtual scrolling
  const renderTableBody = () => {
    if (virtualScroll) {
      return (
        <div
          ref={parentRef}
          className="overflow-auto rounded-md border"
          style={{ height, contain: 'strict' }}
        >
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              <tr style={{ height: `${virtualRows[0]?.start ?? 0}px` }} />
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                const isHighlighted = highlightRow?.(row.original)

                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={(node) => virtualizer.measureElement(node)}
                    className={cn(
                      'border-b transition-colors',
                      isHighlighted
                        ? 'bg-primary/10 hover:bg-primary/20 font-medium'
                        : 'hover:bg-muted/50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr style={{ height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px` }} />
            </tbody>
          </table>
        </div>
      )
    }

    // Standard (non-virtual) table
    return (
      <div className="rounded-md border overflow-auto" style={{ maxHeight: height }}>
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => {
              const isHighlighted = highlightRow?.(row.original)

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b transition-colors',
                    isHighlighted
                      ? 'bg-primary/10 hover:bg-primary/20 font-medium'
                      : 'hover:bg-muted/50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchColumn ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? '' : globalFilter}
            onChange={(e) =>
              searchColumn
                ? table.getColumn(searchColumn)?.setFilterValue(e.target.value)
                : setGlobalFilter(e.target.value)
            }
            className="h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(data, columns as ColumnDef<TData, unknown>[], exportFilename)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      {renderTableBody()}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {rows.length} of {data.length} row(s)
          {globalFilter && ` (filtered)`}
        </div>
      </div>
    </div>
  )
}

export default DataTable
