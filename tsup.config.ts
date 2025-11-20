import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/plot/index.ts',
    'src/recharts/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to strict Plot types
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    'react',
    'react-dom',
    '@observablehq/plot',
    'recharts',
    'lucide-react',
    'topojson-client',
    'd3-array',
    'highcharts',
    'highcharts-react-official',
    'next/dynamic',
    'next-themes'
    // Removed shadcn/ui components from external - they're now bundled in the package
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
