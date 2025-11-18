# GitHub Repository Setup Guide

This guide will help you create private GitHub repositories for the viz packages and install them in your data-visualization site.

## Step 1: Create Private GitHub Repositories

### On GitHub.com:

1. **Create ontopic-viz-core repo:**
   - Go to https://github.com/new
   - Repository name: `ontopic-viz-core`
   - Description: "Framework-agnostic visualization component registry and utilities"
   - ✅ **Private** (important!)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Create ontopic-viz-components repo:**
   - Go to https://github.com/new
   - Repository name: `ontopic-viz-components`
   - Description: "React data visualization components using Observable Plot and Recharts"
   - ✅ **Private** (important!)
   - Don't initialize with README
   - Click "Create repository"

## Step 2: Push Packages to GitHub

### For viz-core:

```bash
cd /Users/umahuggins/github/viz-packages/packages/core

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: @ontopic/viz-core v1.0.0

- Framework-agnostic registry system
- Zod schemas for component validation
- Utility functions for data formatting
- Complete TypeScript types"

# Add remote (replace YOUR_ORG with your GitHub username or org)
git remote add origin git@github.com:YOUR_ORG/ontopic-viz-core.git
git branch -M main
git push -u origin main

# Create version tag
git tag v1.0.0
git push origin v1.0.0
```

### For viz-components:

```bash
cd /Users/umahuggins/github/viz-packages/packages/components

# Initialize git
git init
git add .
git commit -m "Initial commit: @ontopic/viz-components v1.0.0

- 28 Observable Plot components
- 5 Recharts components
- Plot infrastructure (container, theme, export)
- React 18 & 19 compatible"

# Add remote (replace YOUR_ORG with your GitHub username or org)
git remote add origin git@github.com:YOUR_ORG/ontopic-viz-components.git
git branch -M main
git push -u origin main

# Create version tag
git tag v1.0.0
git push origin v1.0.0
```

## Step 3: Install in data-visualization Site

### Update package.json:

```bash
cd /Users/umahuggins/github/data-visualization
```

Add to your `package.json` dependencies (replace YOUR_ORG):

```json
{
  "dependencies": {
    "@ontopic/viz-core": "git+ssh://git@github.com:YOUR_ORG/ontopic-viz-core.git#v1.0.0",
    "@ontopic/viz-components": "git+ssh://git@github.com:YOUR_ORG/ontopic-viz-components.git#v1.0.0"
  }
}
```

### Install packages:

```bash
npm install
```

### Verify installation:

```bash
ls node_modules/@ontopic/
# Should show: viz-components  viz-core
```

## Step 4: Test with One Page

### Update /app/plot/split-bar/page.tsx:

```typescript
// BEFORE
import SplitBar from '@/components/SplitBar';

// AFTER
import { SplitBar } from '@ontopic/viz-components';
```

### Run dev server and test:

```bash
npm run dev
# Visit http://localhost:3000/plot/split-bar
```

## Step 5: For Vercel Deployment

### Add Deploy Key:

1. Go to Vercel project settings
2. Navigate to Git → Deploy Hooks
3. Add GitHub Deploy Key (allows Vercel to access private repos)

OR

### Use HTTPS with Personal Access Token:

```json
{
  "dependencies": {
    "@ontopic/viz-core": "git+https://YOUR_TOKEN@github.com/YOUR_ORG/ontopic-viz-core.git#v1.0.0"
  }
}
```

**Create token:** GitHub → Settings → Developer settings → Personal access tokens → Generate new token (with repo access)

## Updating Packages

### To get latest changes:

```bash
# Update to latest main branch
npm install git+ssh://git@github.com:YOUR_ORG/ontopic-viz-core.git#main

# Or update to specific version
npm install git+ssh://git@github.com:YOUR_ORG/ontopic-viz-core.git#v1.0.1
```

### To publish new version:

```bash
cd /Users/umahuggins/github/viz-packages/packages/core

# Make changes, commit
git add .
git commit -m "Fix: description of changes"
git push

# Tag new version
git tag v1.0.1
git push origin v1.0.1
```

## Troubleshooting

### SSH Key Issues

If you get "Permission denied (publickey)":

1. Check SSH key is added to GitHub:
   ```bash
   ssh -T git@github.com
   # Should say: "Hi username! You've successfully authenticated"
   ```

2. If not, add SSH key:
   ```bash
   cat ~/.ssh/id_rsa.pub
   # Copy output and add to GitHub → Settings → SSH keys
   ```

### Package Not Found

If npm can't find the package:
- Verify repo is created on GitHub
- Verify repo is accessible (private repos need authentication)
- Check repo URL is correct in package.json

### Build Errors

If components don't work:
- Check peer dependencies are installed (`@observablehq/plot`, `recharts`, etc.)
- Verify React version compatibility (18 or 19)
- Check Tailwind config includes node_modules/@ontopic

## Next Steps

Once packages are installed and working:
1. Update remaining pages to use package imports
2. Remove TypeScript path mapping from tsconfig.json
3. Delete local `/packages/` folder
4. Delete migrated components from `/components/`
5. Deploy and celebrate! 🎉
