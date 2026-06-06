# Ontopic Viz Preview

This is a Vite preview site for the registry components in `registry/components`.

Run locally:

```bash
pnpm preview:dev
```

Build the static site:

```bash
pnpm preview:build
```

Vercel uses `vercel.json` at the repository root:

- Build command: `pnpm preview:build`
- Output directory: `preview-dist`

The catalog is generated from registry file paths at build time, so new component
files appear automatically. Add a live example in `preview/src/live-examples.tsx`
when a component is ready for rendered QA.
