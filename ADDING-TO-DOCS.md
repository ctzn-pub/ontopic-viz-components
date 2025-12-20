# Adding Components to viz-docs

This guide explains how to add components to the [viz-docs](https://github.com/ctzn-pub/viz-docs) documentation site after adding them to the registry.

## Prerequisites

1. Component must be added to `viz-registry` first (see [ADDING-COMPONENTS.md](./ADDING-COMPONENTS.md))
2. Component must be pushed to the registry repo

## Steps

### 1. Install the Component

From the viz-docs directory, install the component using the CLI:

```bash
cd /path/to/viz-docs
npx @ontopic/viz add <framework>/<category>/<component>

# Example
npx @ontopic/viz add recharts/generic/my-chart-v1
```

This copies the component to `viz/components/<framework>/<category>/`.

### 2. Add to Registry Data

Edit `lib/registry-data.ts` to add your component metadata:

```typescript
'recharts/generic': {
  title: 'Generic Charts',
  description: 'Reusable chart components',
  components: [
    // ... existing components
    {
      id: 'my-chart-v1',
      name: 'My Chart',
      description: 'Description of what this chart does',
      sampleData: 'path/to/sample-data.json',  // or full URL
    },
  ],
},
```

### 3. Add to Component Map

Edit `app/[...slug]/page.tsx` to add the dynamic import:

```typescript
const componentMap: Record<string, React.ComponentType<any>> = {
  // ... existing components
  'recharts/generic/my-chart-v1': dynamic(() => import('@/viz/components/recharts/generic/my-chart-v1')),
};
```

### 4. Add Data Transformation (if needed)

If your component needs special data handling, add a case in the render section of `page.tsx`:

```tsx
// In the render section
: path === 'recharts/generic/my-chart-v1' ? (
  (() => {
    const rawData = data as any;
    // Transform data as needed
    return (
      <Component
        data={transformedData}
        title={rawData.title}
        // ... other props
      />
    );
  })()
)
```

### 5. Test Locally

```bash
cd /path/to/viz-docs
pnpm dev
```

Visit `http://localhost:3000/recharts/generic/my-chart-v1` to verify:
- Component renders correctly
- Sample data loads
- Install command is correct

### 6. Commit and Push

```bash
git add .
git commit -m "Add my-chart-v1 to docs"
git push
```

## File Locations

| File | Purpose |
|------|---------|
| `lib/registry-data.ts` | Component metadata (name, description, sample data URL) |
| `app/[...slug]/page.tsx` | Dynamic imports and data transformations |
| `viz/components/` | Actual component files (installed via CLI) |

## Sample Data

Sample data should be hosted at a public URL. Common locations:

```
https://ontopic-public-data.t3.storage.dev/cdc-data/...
https://ontopic-public-data.t3.storage.dev/gss-data/...
```

For local testing, you can use `app/data/` for static JSON files.

## Troubleshooting

### Component not found

Ensure the component is:
1. Added to `componentMap` in `page.tsx`
2. Added to `registry-data.ts`
3. Actually installed in `viz/components/`

### Data not loading

Check:
1. Sample data URL is correct and accessible
2. Data format matches what the component expects
3. Add data transformation if needed

### Missing UI dependencies

Install missing shadcn/ui components:

```bash
npx shadcn@latest add <component>
# Example: npx shadcn@latest add tabs
```
