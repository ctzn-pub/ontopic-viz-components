# Adding Components to the Registry

This guide explains how to add new visualization components to the `@ontopic/viz` registry **and have them appear automatically on the public gallery at https://ctzn-pub.vercel.app/viz**.

## TL;DR

For your component to show up on ctzn.pub:

1. Drop the component file at `registry/components/<engine>/<bucket>/<name>-v1.tsx`.
2. Drop a **`.catalog.json` sidecar** at the same path (e.g. `name-v1.catalog.json`).
3. Push to `main`.
4. Watch the **Sync to gallery** Action in this repo's Actions tab — it echoes the live URL on success.
5. Open `https://ctzn-pub.vercel.app/viz/<id>` (where `<id>` is the value in your sidecar). It'll be live within ~2 minutes.

That's the whole loop. If anything fails, the Action's log tells you exactly what's wrong (missing sidecar field, unreachable sample-data URL, etc.). Details for each step below.

**No sidecar? Your component still lands on `main` and is installable via `viz add`, but it does NOT appear on the public gallery.** The Action will print a warning, skip the publish step, and continue. Add a sidecar later to backfill the gallery card.

---

## AI-agent workflow (Claude Code, Cursor, etc.)

If you're driving this through an AI coding agent — telling it "add a Sankey component for showing migration flows" — the agent should run the whole loop autonomously. The point of this section is to make that loop unambiguous so the agent doesn't stop mid-flight to ask for permission.

**The 7-step autonomous loop:**

1. **Read this doc and the `ontopic-viz-conventions` skill** (auto-loads in any Claude session inside this repo) before writing anything. Both documents are the source of truth for the conventions; neither alone is sufficient.

2. **Author the `.tsx` AND the `.catalog.json` in the same operation.** They MUST land together. Writing the component without the sidecar means the workflow skips the publish — the gallery silently does nothing. This is the single most common mistake.

3. **Verify the sample-data URL returns 200 BEFORE committing.** Use `curl -fI <url>` or equivalent. If the data doesn't exist yet, upload it to Tigris first (`s3://ontopic-public-data/sample-data/<filename>`) and then commit. The workflow's `curl -fsSI --max-time 5` check is identical, so anything that passes locally will pass in CI.

4. **Run the contract tests** (`pnpm test`) to catch obvious schema errors before push.

5. **Commit both files together** with a descriptive message:
   ```
   Add my-chart-v1 component

   <one-paragraph summary of what the chart does and what data shape it expects>
   ```

6. **Push to main directly** (or merge a PR if one is open). The auto-publish workflow is only triggered by pushes to `main`. There is no staging step; iterating on a branch doesn't surface anything on ctzn.pub.

7. **Watch the workflow log + echo the URL to the user.** When validation succeeds, the workflow prints `https://ctzn-pub.vercel.app/viz/<id>`. The agent should surface that URL to the user as the final step of the task. The user will hit the URL after ~90s.

**The agent should NOT:**

- Skip the sidecar "for now" and offer to add it later. The cost of writing the sidecar is one minute; the cost of fixing a half-published component is higher.
- Push to a feature branch and stop there. The pipeline trigger is `main`-only. Either merge to `main` or use a direct push.
- Wait for the user to confirm the push if the diff is clean (theme-aware imports, no hardcoded colors, sidecar present and valid, sample-data URL returns 200). If the diff is messy or there's ambiguity (which category? new gallery card or variant of existing one?) — pause and ask.
- Touch `ctzn-pub` directly. The auto-publish handles all gallery integration; manual edits there cause merge conflicts with the sync bot.

**For a fully worked agent transcript:** see commit `d28a33d` in this repo's log — Vishal's Claude session added four d3 components in a single autonomous push, all with sidecars, and the workflow ran clean.

---

## The auto-publish pipeline (what happens after you push)

Two GitHub Actions, one per repo, do all the work:

```
You push a component + sidecar
            ↓
  ontopic-viz-components/main
            ↓
.github/workflows/sync-to-gallery.yml
  - validates every sidecar (schema + sample-data URL reachable)
  - dispatches the downstream workflow on ctzn-pub
  - logs the deterministic URL: https://ctzn-pub.vercel.app/viz/<id>
            ↓
       ctzn-pub/main
            ↓
.github/workflows/sync-from-registry.yml
  - clones the registry at your exact SHA
  - copies the .tsx into ctzn-pub's viz/components/
  - generates/updates the catalog entry in lib/viz-catalog.ts
  - generates/updates the preview-manifest entry
  - commits + pushes to ctzn-pub/main
            ↓
       Vercel deploy
            ↓
  Live at https://ctzn-pub.vercel.app/viz/<id>
```

You don't touch ctzn-pub at all. The URL appears in the Actions log on YOUR commit — no need to remember it in advance.

---

## Directory Structure

Components are organized by framework and category:

```
registry/components/
├── recharts/           # Recharts-based components
│   ├── generic/        # Reusable across datasets
│   ├── gss/            # GSS-specific
│   ├── brfss/          # BRFSS-specific
│   └── ess/            # ESS-specific
├── plot/               # Observable Plot components
│   ├── generic/        # Reusable
│   ├── geo/            # Geographic maps
│   ├── stats/          # Statistical visualizations
│   ├── health/         # Health data visualizations
│   ├── brfss/          # BRFSS-specific
│   ├── gss/            # GSS-specific
│   └── timeseries/     # Time series charts
├── d3/                 # D3/SVG components for bespoke geometry/interaction
│   └── stats/          # Statistical and multivariate visualizations
├── maplibre/           # MapLibre + PMTiles components
│   └── geo/            # Zoomable geographic visualizations
└── composite/          # Multi-component dashboards
    ├── generic/        # Reusable dashboards
    ├── brfss/          # BRFSS dashboards
    └── wb/             # World Bank dashboards
```

## Naming Convention

Component files follow this pattern: `<name>-v<version>.tsx`

Examples:
- `timeseries-basic-v1.tsx`
- `state-map-v1.tsx`
- `brfss-dashboard-v1.tsx`

## Steps to Add a Component

### 1. Create the Component File

Add your component to the appropriate directory:

```bash
# Example: Adding a new Recharts time series component
touch registry/components/recharts/generic/my-chart-v1.tsx
```

### 2. Component Requirements

Your component must:

1. **Use 'use client' directive** (for Next.js compatibility)
2. **Export as default**
3. **Import UI dependencies from `@/viz/ui/`**
4. **Import utilities from `@/viz/utils/`**
5. **Include TypeScript types for props**

Example structure:

```tsx
'use client';

import React from 'react';
import { Label } from '@/viz/ui/label';
import { Switch } from '@/viz/ui/switch';
// ... other imports

interface MyChartProps {
  data: DataShape[];
  title?: string;
  // ... other props
}

export default function MyChart({ data, title }: MyChartProps) {
  // Component implementation
  return (
    <div>
      {/* Chart content */}
    </div>
  );
}
```

### 3. Add UI Dependencies

If your component uses UI primitives not yet in the registry:

```bash
# Add to registry/ui/
touch registry/ui/my-ui-component.tsx
```

Common UI components in `registry/ui/`:
- `button.tsx`
- `card.tsx`
- `label.tsx`
- `switch.tsx`
- `tabs.tsx`
- `input.tsx`

### 4. Add Utility Functions

Shared utilities go in `registry/utils/`:

```bash
touch registry/utils/my-utils.ts
```

### 5. Write the `.catalog.json` Sidecar (required for ctzn.pub publishing)

This is the **editorial layer the gallery needs** — without it, your component lands in the registry but never appears on https://ctzn-pub.vercel.app/viz.

Drop a file next to your component:

```bash
touch registry/components/recharts/generic/my-chart-v1.catalog.json
```

**Minimum schema (top-level component):**

```json
{
  "id": "my-chart",
  "name": "My Chart",
  "category": "time-series",
  "subcategory": "generic",
  "tags": ["trend", "line-chart"],
  "description": "One-paragraph editorial blurb. What question does this chart answer? When would a reader pick this over a related chart? Plain prose, no Markdown.",
  "sample_data": {
    "url": "https://ontopic-public-data.t3.storage.dev/sample-data/my-data.json",
    "transform": "passthrough"
  },
  "dependencies": ["recharts", "lucide-react"],
  "foldInto": null,
  "variantLabel": null
}
```

**Field rules:**

| Field | Required | Notes |
|---|---|---|
| `id` | always | URL slug. The gallery URL is `https://ctzn-pub.vercel.app/viz/<id>`. Lowercase, hyphen-separated. Pick a stable id; renaming breaks bookmarks. |
| `name` | always | Display title in gallery card + detail page. |
| `category` | always | One of: `time-series`, `maps`, `distributions`, `demographic-breakdowns`, `regression-and-effects`. The gallery's left rail groups by this. Don't invent new ones. |
| `subcategory` | optional | E.g. `gss`, `brfss`, `generic`. Display-only. |
| `tags` | always | 3–6 short lowercase strings. Used for search/chips. Don't duplicate the category or framework. |
| `description` | always | 1–3 sentences of editorial prose. No Markdown. |
| `sample_data.url` | required when no `foldInto` | A publicly-readable URL the gallery fetches at build time. Tigris is preferred. **Must return 200 BEFORE you commit** — the CI lint pings it; a 404 fails the workflow. |
| `sample_data.transform` | required when `sample_data` present | Name of a transform function in `ctzn-pub/lib/viz-preview-manifest.ts`. Most charts use `"passthrough"`. |
| `dependencies` | optional | npm packages your component imports. Display-only. |
| `foldInto` | optional | If your component is a NEW VARIANT of an existing gallery card, set this to that card's `id`. Otherwise `null`. |
| `variantLabel` | required when `foldInto` set | The short label the gallery shows in the variants list (e.g. `"With confidence intervals"`). |

**Variant flow:** when `foldInto` is set, your component is treated as a sub-component of the parent card. Your sidecar can OMIT `sample_data` — variants inherit it from their parent. This is the pattern Vishal used for the four d3 components (each set `foldInto: pca-biplot` / `ridge` / etc. so they appear as alternate implementations of an existing card rather than spawning new cards).

**Where your component will appear:**

- Top-level sidecar (`foldInto: null`) → new card at `https://ctzn-pub.vercel.app/viz/<id>`
- Variant sidecar (`foldInto: "parent-id"`) → new variant on the existing parent card at `https://ctzn-pub.vercel.app/viz/<parent-id>`

### 6. Update Component Inventory (optional but appreciated)

Add your component to `COMPONENT-INVENTORY.md` for human-browsable docs:

```markdown
### recharts/generic/my-chart-v1

**Description**: Brief description of what the chart does

**Props**:
- `data` (required): Array of data points
- `title` (optional): Chart title

**Dependencies**:
- recharts
- @radix-ui/react-label

**Sample Data**: URL to sample data
```

### 7. Test Installation

Test that your component can be installed via CLI:

```bash
# From a test project
npx @ontopic/viz add recharts/generic/my-chart-v1

# Or test locally
node /path/to/viz-registry/cli/index.js add recharts/generic/my-chart-v1
```

### 8. Commit and Push to `main`

```bash
cd /path/to/viz-registry
git add registry/components/<engine>/<bucket>/my-chart-v1.tsx \
        registry/components/<engine>/<bucket>/my-chart-v1.catalog.json
git commit -m "Add my-chart-v1 component"
git push origin main
```

**The pipeline only triggers on pushes to `main`** (not feature branches), so push directly or merge a PR.

### 9. Watch the Auto-Publish Workflow

Go to https://github.com/ctzn-pub/ontopic-viz-components/actions and click the most recent **Sync to gallery** run on your commit.

**What success looks like:**

```
✓ <id> — sidecar valid, sample data reachable

🟢 Dispatched ctzn-pub sync for components: ["<id>"]

Your components will appear at:
  https://ctzn-pub.vercel.app/viz/<id>
```

The URL printed in that log is your component's permanent home. Bookmark it.

**Common failure modes:**

| Symptom | What it means | Fix |
|---|---|---|
| `Missing catalog sidecar at …` (warning, not error) | You didn't write a sidecar. Component lands in registry, **does NOT publish to gallery**. | Add `<path>.catalog.json` and push again. |
| `Required field "X" missing` (error) | Sidecar is malformed. | Add the missing field. See schema table in step 5. |
| `sample_data.url (…) is unreachable` (error) | Sample-data URL returns non-200. | Upload the file to Tigris first, then push the sidecar. |
| Workflow doesn't run at all | You pushed to a branch, not `main`. | Open a PR, merge it. |

### 10. Confirm It's Live

Wait ~90 seconds after the workflow completes, then open the URL the log printed. Hard-reload if needed (Vercel CDN cache).

If anything looks wrong on the gallery page (wrong description, missing preview), check:
- The catalog entry in `ctzn-pub/lib/viz-catalog.ts` — was it auto-generated or auto-merged into an existing card?
- The preview manifest in `ctzn-pub/lib/viz-preview-manifest.ts` — does the `transform` map your data correctly to the component's props?

For non-trivial edits to either of those, hand-tune them in a follow-up commit to `ctzn-pub/main`. The auto-publish script is conservative — it never overwrites hand-curated content.

## Best Practices

1. **Keep components self-contained**: Minimize external dependencies
2. **Use consistent prop naming**: Follow existing patterns (e.g., `data`, `title`, `width`, `height`)
3. **Include TypeScript types**: Export interfaces for reuse
4. **Document sample data format**: Show expected data shape in comments or docs
5. **Test with sample data**: Ensure component renders correctly before committing

## Sample Data

Components should reference sample data URLs in the component inventory. Sample data is hosted at:

```
https://ontopic-public-data.t3.storage.dev/
```

## Questions?

- Check existing components for patterns
- See [COMPONENT-INVENTORY.md](./COMPONENT-INVENTORY.md) for the full list
- Review [CLI-USAGE.md](./CLI-USAGE.md) for installation testing
