import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/plot/index.ts',
    'src/recharts/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled while fixing component exports
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
    // shadcn/ui components (expected from consuming app)
    '@/components/ui/card',
    '@/components/ui/button',
    '@/components/ui/table',
    '@/components/ui/tabs',
    '@/components/ui/input',
    '@/components/ui/label',
    '@/components/ui/select',
    '@/components/ui/checkbox',
    '@/components/ui/accordion',
    '@/components/ui/switch'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
