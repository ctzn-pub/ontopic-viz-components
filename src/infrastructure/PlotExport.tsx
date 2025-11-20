'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

/**
 * PlotExport - Export functionality for Observable Plot charts
 *
 * Provides SVG and PNG export capabilities with 2x scaling for high-DPI displays.
 *
 * Note: This component expects Button and DropdownMenu components to be available.
 * These are typically provided by shadcn/ui in the consuming application.
 */

interface PlotExportProps {
  plotRef: React.RefObject<HTMLDivElement>;
  filename?: string;
  formats?: ('svg' | 'png')[];
  // Allow consumers to provide their own Button/Dropdown components
  Button?: any;
  DropdownMenu?: any;
  DropdownMenuTrigger?: any;
  DropdownMenuContent?: any;
  DropdownMenuItem?: any;
}

export function PlotExport({
  plotRef,
  filename = 'chart',
  formats = ['svg', 'png'],
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}: PlotExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportAs = async (format: 'svg' | 'png') => {
    if (!plotRef.current) return;

    setIsExporting(true);

    try {
      const svgElement = plotRef.current.querySelector('svg');
      if (!svgElement) throw new Error('No SVG found');

      if (format === 'svg') {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadBlob(blob, `${filename}.svg`);
      } else if (format === 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          // 2x scale for high-DPI displays
          canvas.width = svgElement.width.baseVal.value * 2;
          canvas.height = svgElement.height.baseVal.value * 2;
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, `${filename}.png`);
            setIsExporting(false);
          }, 'image/png');
        };

        img.src = url;
        return;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      if (format !== 'png') {
        setIsExporting(false);
      }
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If UI components are not provided, return a simple button
  if (!Button || !DropdownMenu) {
    return (
      <div className="plot-export">
        <button
          onClick={() => exportAs('svg')}
          disabled={isExporting}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4 inline mr-2" />
          {isExporting ? 'Exporting...' : 'Export SVG'}
        </button>
        {formats.includes('png') && (
          <button
            onClick={() => exportAs('png')}
            disabled={isExporting}
            className="ml-2 px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Export PNG
          </button>
        )}
      </div>
    );
  }

  // Use provided UI components (shadcn/ui pattern)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes('svg') && (
          <DropdownMenuItem onClick={() => exportAs('svg')}>
            Export as SVG
          </DropdownMenuItem>
        )}
        {formats.includes('png') && (
          <DropdownMenuItem onClick={() => exportAs('png')}>
            Export as PNG
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
