/**
 * Type definitions for Observable Plot infrastructure
 */

import type { PlotOptions } from '@observablehq/plot';

export interface PlotTheme {
  name: string;
  background: string;
  foreground: string;
  fonts: {
    base: string;
    mono: string;
  };
  axes: {
    fontSize: number;
    fontWeight: number;
    color: string;
  };
  grid: {
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
  };
  colors: {
    categorical: string[];
    sequential: string;
    diverging: string;
  };
}

export interface PlotContainerProps {
  /**
   * Observable Plot specification object
   */
  plotSpec: PlotOptions;

  /**
   * Width of the plot - number for fixed width, 'responsive' for container-based
   */
  width?: number | 'responsive';

  /**
   * Height of the plot in pixels
   */
  height?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Callback when plot is created
   */
  onPlotCreated?: (plot: SVGSVGElement) => void;
}

export interface BasePlotProps {
  /**
   * Array of data points
   */
  data: any[];

  /**
   * Width of the plot
   */
  width?: number | 'responsive';

  /**
   * Height of the plot
   */
  height?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}
