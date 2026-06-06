import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

function stripClientDirective(): Plugin {
  return {
    name: 'strip-client-directive',
    transform(code, id) {
      if (!id.includes('/registry/') && !id.includes('\\registry\\')) return null;
      const next = code.replace(/^(['"])use client\1;?\s*/u, '');
      return next === code ? null : { code: next, map: null };
    },
  };
}

export default defineConfig({
  plugins: [stripClientDirective()],
  resolve: {
    alias: [
      { find: '@/components/ui', replacement: resolve(root, 'registry/ui') },
      { find: '@/viz', replacement: resolve(root, 'registry') },
      { find: '@', replacement: resolve(root, 'preview/src') },
    ],
  },
  build: {
    outDir: 'preview-dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('react@')) return 'react';
          if (id.includes('recharts')) return 'recharts';
          if (id.includes('@observablehq') || id.includes('d3-')) return 'plot';
          return 'vendor';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
