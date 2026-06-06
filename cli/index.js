#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Source resolution.
//
// Default mode is local-source: copy files from a sibling/parent checkout of
// the registry repo. Honors $ONTOPIC_VIZ_SOURCE; falls back to the canonical
// path if unset. Pass --remote to fetch from public GitHub raw instead.
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ctzn-pub/ontopic-viz-components/main/registry';
const DEFAULT_LOCAL_SOURCE = '/Users/umahuggins/github/ontopic-viz-components/registry';

function resolveLocalSource() {
  return process.env.ONTOPIC_VIZ_SOURCE || DEFAULT_LOCAL_SOURCE;
}

program
  .name('@ontopic/viz')
  .description('Install visualization components from the registry')
  .version('1.0.0');

program
  .command('add <component>')
  .description('Add a component. 3-seg: framework/category/file (e.g. recharts/gss/timeseries-line-v1). 2-seg: category/file (e.g. article/Callout) — for non-framework-bound assets like MDX layout components.')
  .option('--remote', 'Fetch from public GitHub instead of local source (default: local)')
  .option('--source <dir>', 'Override local source path (default: $ONTOPIC_VIZ_SOURCE or canonical path)')
  .action(async (component, opts) => {
    console.log(`\n📦 Installing ${component}...\n`);

    // Parse component path. Accept both forms:
    //   3-seg: framework/category/file  e.g. "recharts/gss/timeseries-line-v1"
    //          → installs to viz/components/<framework>/<category>/<file>.tsx
    //   2-seg: category/file            e.g. "article/Callout"
    //          → installs to viz/components/<category>/<file>.tsx
    // 2-seg is for non-framework-bound assets (article-layout components,
    // MDX building blocks) — they don't slot under a chart framework like
    // Recharts or Plot.
    const segments = component.split('/');
    let framework, folder, filename;
    if (segments.length === 3) {
      [framework, folder, filename] = segments;
    } else if (segments.length === 2) {
      framework = null;
      [folder, filename] = segments;
    } else {
      console.error('❌ Invalid component path.');
      console.error('   Use 3-seg framework/category/file: recharts/gss/timeseries-line-v1');
      console.error('   Or 2-seg category/file:           article/Callout');
      process.exit(1);
    }
    if (!folder || !filename) {
      console.error('❌ Invalid component path: empty segment.');
      process.exit(1);
    }

    // Decide source mode
    const useRemote = !!opts.remote;
    const localSource = opts.source || resolveLocalSource();

    if (useRemote) {
      console.log(`  source: remote (${GITHUB_RAW_BASE})`);
    } else {
      if (!fs.existsSync(localSource)) {
        console.error(`❌ Local source not found: ${localSource}`);
        console.error(`   Set $ONTOPIC_VIZ_SOURCE or pass --source <dir>, or use --remote.`);
        process.exit(1);
      }
      console.log(`  source: local (${localSource})`);
    }

    // Create local directory structure
    const vizDir = path.join(process.cwd(), 'viz');
    const componentsDir = path.join(vizDir, 'components');
    const componentSubDir = framework
      ? path.join(componentsDir, framework, folder)
      : path.join(componentsDir, folder);
    const uiDir = path.join(vizDir, 'ui');
    const utilsDir = path.join(vizDir, 'utils');

    [vizDir, componentsDir, componentSubDir, uiDir, utilsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created ${path.relative(process.cwd(), dir)}/`);
      }
    });

    // Fetch the main component file. Registry-relative path matches the
    // install path (with or without the framework segment).
    const componentRel = framework
      ? `components/${framework}/${folder}/${filename}.tsx`
      : `components/${folder}/${filename}.tsx`;
    const componentPath = path.join(componentSubDir, `${filename}.tsx`);

    try {
      await fetchFile(componentRel, componentPath, { useRemote, localSource });
      console.log(`✓ Installed ${filename}.tsx`);
    } catch (error) {
      console.error(`❌ Failed to fetch component: ${error.message}`);
      process.exit(1);
    }

    // Check component for dependencies and fetch them
    const componentContent = fs.readFileSync(componentPath, 'utf-8');

    // Extract UI imports
    const uiImports = [...componentContent.matchAll(/from ['"]@\/viz\/ui\/([^'"]+)['"]/g)]
      .map(match => match[1]);

    // Extract utils imports
    const utilImports = [...componentContent.matchAll(/from ['"]@\/viz\/utils\/([^'"]+)['"]/g)]
      .map(match => match[1]);

    // Track every file we copy so we can scan all of them for npm deps and
    // for the `cn` helper, not just the top-level component.
    const copiedFiles = [componentPath];

    // Fetch UI dependencies
    for (const uiFile of uiImports) {
      const uiRel = `ui/${uiFile}.tsx`;
      const uiPath = path.join(uiDir, `${uiFile}.tsx`);

      if (!fs.existsSync(uiPath)) {
        try {
          await fetchFile(uiRel, uiPath, { useRemote, localSource });
          console.log(`✓ Installed ui/${uiFile}.tsx`);
          copiedFiles.push(uiPath);
        } catch (error) {
          console.warn(`⚠ Could not fetch ui/${uiFile}.tsx`);
        }
      } else {
        copiedFiles.push(uiPath);
      }
    }

    // Fetch utils dependencies
    for (const utilFile of utilImports) {
      const utilRel = `utils/${utilFile}.ts`;
      const utilPath = path.join(utilsDir, `${utilFile}.ts`);

      if (!fs.existsSync(utilPath)) {
        try {
          await fetchFile(utilRel, utilPath, { useRemote, localSource });
          console.log(`✓ Installed utils/${utilFile}.ts`);
          copiedFiles.push(utilPath);
        } catch (error) {
          console.warn(`⚠ Could not fetch utils/${utilFile}.ts`);
        }
      } else {
        copiedFiles.push(utilPath);
      }
    }

    // The shadcn-style UI files import { cn } from "../lib/utils".
    // The registry has a cn helper at registry/utils/cn.ts but the imports
    // expect a sibling lib/utils.* file. Rather than patch every UI file or
    // every consumer, materialize a viz/lib/utils.ts shim that re-exports cn.
    const needsCnShim = copiedFiles.some(f => {
      try {
        return /from ['"](?:\.\.\/)+lib\/utils['"]/.test(fs.readFileSync(f, 'utf-8'));
      } catch { return false; }
    });

    if (needsCnShim) {
      const libDir = path.join(vizDir, 'lib');
      if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
        console.log(`✓ Created ${path.relative(process.cwd(), libDir)}/`);
      }
      const shimPath = path.join(libDir, 'utils.ts');
      if (!fs.existsSync(shimPath)) {
        fs.writeFileSync(
          shimPath,
          `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`
        );
        console.log(`✓ Installed lib/utils.ts (cn shim)`);
        copiedFiles.push(shimPath);
      }
    }

    // If any copied file imports from `@/viz/theme/*`, bring the theme layer
    // along. The theme is a small self-contained folder (tokens/semantic/
    // themes/provider/adapters) that both chart engines read through one React
    // context. We copy the whole folder rather than walking imports file-by-
    // file because the pieces always travel together. Existing files are
    // preserved (we never clobber a consumer's customized theme).
    const importsTheme = copiedFiles.some(f => {
      try {
        return /from ['"]@\/viz\/theme\//.test(fs.readFileSync(f, 'utf-8'));
      } catch { return false; }
    });

    if (importsTheme) {
      const themeDir = path.join(vizDir, 'theme');
      const alreadyHadTheme = fs.existsSync(themeDir);
      try {
        await copyThemeFolder(themeDir, { useRemote, localSource });
        if (alreadyHadTheme) {
          console.log(`✓ Theme present at viz/theme (existing files kept)`);
          console.log(`  ↳ to update an older theme: re-copy registry/theme over viz/theme`);
        } else {
          console.log(`✓ Installed theme/ (viz design tokens + provider)`);
        }
      } catch (error) {
        console.warn(`⚠ Could not copy theme/: ${error.message}`);
        console.warn(`  Copy it manually: cp -r <registry>/theme viz/theme`);
      }
    }

    // Extract npm dependencies from the component AND from every UI/utils
    // file we copied. The original CLI only scanned the top-level component,
    // which missed transitive imports like @radix-ui/* inside ui/label.tsx.
    // NOTE: theme files are intentionally excluded from this scan — their only
    // runtime import is React (a peer the consumer already has).
    const npmDepsSet = new Set();
    for (const file of copiedFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        for (const dep of extractNpmDependencies(content)) {
          npmDepsSet.add(dep);
        }
      } catch {}
    }
    if (needsCnShim) {
      // The cn shim depends on these directly.
      npmDepsSet.add('clsx');
      npmDepsSet.add('tailwind-merge');
    }
    const npmDeps = Array.from(npmDepsSet);

    if (npmDeps.length > 0) {
      console.log(`\n📥 Installing npm dependencies...`);
      npmDeps.forEach(dep => console.log(`   - ${dep}`));

      try {
        execSync(`pnpm add ${npmDeps.join(' ')}`, { stdio: 'inherit' });
        console.log(`✓ Dependencies installed`);
      } catch (error) {
        console.error(`❌ Failed to install dependencies. Run manually:`);
        console.error(`   pnpm add ${npmDeps.join(' ')}`);
      }
    }

    console.log(`\n✅ Component installed successfully!\n`);
    console.log(`Usage:`);
    const importPath = framework
      ? `@/viz/components/${framework}/${folder}/${filename}`
      : `@/viz/components/${folder}/${filename}`;
    console.log(`   import ${toPascalCase(filename)} from '${importPath}';\n`);
    console.log(`Make sure your tsconfig.json includes:`);
    console.log(`   "paths": { "@/viz/*": ["./viz/*"] }\n`);
  });

program.parse();

// Helper functions

// Unified fetch: from local registry checkout (default) or GitHub raw (--remote).
// `relPath` is registry-relative, e.g. "components/recharts/gss/timeseries-line-v1.tsx".
function fetchFile(relPath, dest, { useRemote, localSource }) {
  if (useRemote) {
    return downloadFile(`${GITHUB_RAW_BASE}/${relPath}`, dest);
  }
  return copyFromLocal(path.join(localSource, relPath), dest);
}

// The theme folder's portable files. Used for --remote installs, where there
// is no directory listing over GitHub raw, so we fetch a known manifest.
// `viz-theme.css` is the GENERATED output of generate-css.ts (the --viz-* vars);
// `theme.css` is the hand-written article-typography theme. Both ship.
const THEME_FILES = [
  'tokens.ts',
  'semantic.ts',
  'themes.ts',
  'scales.ts',
  'provider.tsx',
  'adapters/recharts.ts',
  'adapters/plot.ts',
  'adapters/maplibre.ts',
  'adapters/d3.ts',
  'generate-css.ts',
  'fonts.ts',
  'tailwind-preset.ts',
  'theme.css',
  'viz-theme.css',
  'README.md',
  'THEME-AUTHORING.md',
];

// Copy the registry theme/ folder into the consumer's viz/theme. Local mode
// does a filtered recursive copy (skipping tests/demo/tooling); remote mode
// fetches the THEME_FILES manifest. Never overwrites existing files.
async function copyThemeFolder(destThemeDir, { useRemote, localSource }) {
  if (useRemote) {
    for (const rel of THEME_FILES) {
      const dest = path.join(destThemeDir, rel);
      if (fs.existsSync(dest)) continue;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        await fetchFile(`theme/${rel}`, dest, { useRemote, localSource });
      } catch {
        // Optional files (e.g. viz-theme.css before first generate) may be
        // absent in the source — skip quietly rather than failing the install.
      }
    }
    return;
  }

  const srcThemeDir = path.join(localSource, 'theme');
  if (!fs.existsSync(srcThemeDir)) {
    throw new Error(`theme/ not found in local source: ${srcThemeDir}`);
  }
  // Skip authoring-only files; consumers don't need tests, the demo, or the
  // typecheck config.
  const SKIP = new Set(['__tests__', '__demo__', 'tsconfig.json']);
  fs.cpSync(srcThemeDir, destThemeDir, {
    recursive: true,
    force: false,            // keep any files the consumer already has
    errorOnExist: false,
    filter: (src) => {
      const base = path.basename(src);
      return !SKIP.has(base);
    },
  });
}

function copyFromLocal(src, dest) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(src)) {
      reject(new Error(`Not found in local source: ${src}`));
      return;
    }
    try {
      fs.copyFileSync(src, dest);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Version constraints for dependencies (to avoid breaking changes)
const VERSION_CONSTRAINTS = {
  'recharts': '^2.15.0',
  '@observablehq/plot': '^0.6.0',
  'd3-array': '^3.0.0',
  'd3-geo': '^3.0.0',
  'd3-scale': '^4.0.0',
  'd3-shape': '^3.0.0',
  'lucide-react': '^0.454.0',
  'maplibre-gl': '^5.0.0',
  'pmtiles': '^4.0.0',
};

function extractNpmDependencies(content) {
  const deps = new Set();

  // Match every `from "..."` import. We'll filter out non-npm specifiers
  // (relative paths and @/viz/* aliases) below — doing that filtering inside
  // the regex was the source of a long-standing bug where scoped packages
  // like @radix-ui/* were silently dropped.
  const importMatches = content.matchAll(/from ['"]([^'"]+)['"]/g);

  for (const match of importMatches) {
    const pkg = match[1];
    // Skip relative imports (./foo, ../foo) and the project's own viz alias.
    if (pkg.startsWith('.') || pkg.startsWith('/') || pkg.startsWith('@/')) {
      continue;
    }
    let pkgName;
    if (pkg.startsWith('@')) {
      // Scoped: @scope/name[/subpath] → @scope/name
      const parts = pkg.split('/');
      pkgName = `${parts[0]}/${parts[1]}`;
    } else {
      // Bare: name[/subpath] → name
      pkgName = pkg.split('/')[0];
    }
    const version = VERSION_CONSTRAINTS[pkgName];
    deps.add(version ? `${pkgName}@${version}` : pkgName);
  }

  return Array.from(deps);
}

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
