# Quick Start: Private Package Migration

## ✅ What's Ready

Your packages are **ready to publish**! Everything is set up:

- ✅ **@ontopic/viz-core** - 18 files, builds successfully
- ✅ **@ontopic/viz-components** - 28 components, builds successfully
- ✅ Comprehensive READMEs (13,000+ words)
- ✅ LICENSE files (MIT)
- ✅ .gitignore files
- ✅ Build configs
- ✅ React 18 & 19 compatible

## 🚀 Next Steps (5 easy steps)

### 1. Create GitHub Repos (5 mins)

On GitHub.com, create **2 private repos**:

1. **ontopic-viz-core** (private ✅)
2. **ontopic-viz-components** (private ✅)

See [GITHUB-SETUP.md](./GITHUB-SETUP.md) for detailed instructions.

### 2. Push to GitHub (2 mins)

```bash
# Core package
cd /Users/umahuggins/github/viz-packages/packages/core
git init
git add .
git commit -m "Initial commit: @ontopic/viz-core v1.0.0"
git remote add origin git@github.com:YOUR_ORG/ontopic-viz-core.git
git push -u origin main
git tag v1.0.0
git push origin v1.0.0

# Components package
cd /Users/umahuggins/github/viz-packages/packages/components
git init
git add .
git commit -m "Initial commit: @ontopic/viz-components v1.0.0"
git remote add origin git@github.com:YOUR_ORG/ontopic-viz-components.git
git push -u origin main
git tag v1.0.0
git push origin v1.0.0
```

**Replace YOUR_ORG** with your GitHub username or organization.

### 3. Install in Main Site (2 mins)

```bash
cd /Users/umahuggins/github/data-visualization
```

Add to `package.json` (replace YOUR_ORG):
```json
{
  "dependencies": {
    "@ontopic/viz-core": "git+ssh://git@github.com:YOUR_ORG/ontopic-viz-core.git#v1.0.0",
    "@ontopic/viz-components": "git+ssh://git@github.com:YOUR_ORG/ontopic-viz-components.git#v1.0.0"
  }
}
```

Then:
```bash
npm install
```

### 4. Test with One Page (5 mins)

Test with split-bar page:

```bash
# Edit app/plot/split-bar/page.tsx
# Change: import SplitBar from '@/components/SplitBar';
# To: import { SplitBar } from '@ontopic/viz-components';

npm run dev
# Visit http://localhost:3000/plot/split-bar
```

### 5. Migrate All Pages (10 mins)

```bash
cd /Users/umahuggins/github/data-visualization
./scripts/migrate-to-packages.sh
```

This automatically updates ALL import statements!

## 📦 What You Get

### 28 Ready-to-Use Components

**Observable Plot (23):**
- Geographic: StateMap, BubbleMap
- Statistical: BoxPlot (4 variants), DistributionPlot
- Analysis: RegressionPlot, QQPlot, ResidualPlot, SwarmPlot, StripPlot, ForestPlot, SplitBar
- Basic: DotPlot, BarChart
- Specialized: Sparkline, SlopeChart, BulletChart, DivergingBar, FacetedPlot

**Recharts (5):**
- TimeSeriesLine, TimeSeriesChart, AbortionOpinionChart
- DemographicBarChart, ScatterplotRegression

**Infrastructure:**
- PlotContainer, PlotThemeProvider, PlotExport

### Plus

- Full TypeScript types
- React 18 & 19 support
- Observable Plot infrastructure
- Comprehensive documentation

## 🔒 Privacy

✅ Repos are **private** - only accessible to your GitHub org
✅ Git URLs require SSH authentication
✅ Works on Vercel with deploy keys
✅ Not published to public npm

## ❓ Need Help?

- **Detailed setup**: See [GITHUB-SETUP.md](./GITHUB-SETUP.md)
- **Package docs**: See READMEs in each package folder
- **Migration details**: See [SETUP-SUMMARY.md](./SETUP-SUMMARY.md)

## 🎯 Quick Commands Reference

```bash
# Create GitHub repos (on github.com)
# Push packages to GitHub (see step 2 above)
# Install in main site (see step 3 above)
# Test one page (see step 4 above)
# Migrate all pages (see step 5 above)

# Update to latest version
cd /Users/umahuggins/github/data-visualization
npm install git+ssh://git@github.com:YOUR_ORG/ontopic-viz-core.git#main
npm install git+ssh://git@github.com:YOUR_ORG/ontopic-viz-components.git#main

# Publish new version
cd /Users/umahuggins/github/viz-packages/packages/core
git tag v1.0.1
git push origin v1.0.1
```

## ⏱️ Time Estimate

- GitHub setup: 5 mins
- Push to GitHub: 2 mins
- Install packages: 2 mins
- Test one page: 5 mins
- Migrate all pages: 10 mins

**Total: 24 minutes** to complete migration! 🎉
