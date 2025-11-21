#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ctzn-pub/viz-registry/main/registry';

program
  .name('@ontopic/viz')
  .description('Install visualization components from the registry')
  .version('1.0.0');

program
  .command('add <component>')
  .description('Add a visualization component (e.g., recharts/generic/timeseries-line-v1)')
  .action(async (component) => {
    console.log(`\n📦 Installing ${component}...\n`);

    // Parse component path
    const [framework, folder, filename] = component.split('/');

    if (!framework || !folder || !filename) {
      console.error('❌ Invalid component path. Use: framework/category/component-name');
      console.error('   Example: recharts/generic/timeseries-line-v1');
      process.exit(1);
    }

    // Create local directory structure
    const vizDir = path.join(process.cwd(), 'viz');
    const componentsDir = path.join(vizDir, 'components');
    const componentSubDir = path.join(componentsDir, framework, folder);
    const uiDir = path.join(vizDir, 'ui');
    const utilsDir = path.join(vizDir, 'utils');

    [vizDir, componentsDir, componentSubDir, uiDir, utilsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created ${path.relative(process.cwd(), dir)}/`);
      }
    });

    // Download component
    const componentUrl = `${GITHUB_RAW_BASE}/components/${framework}/${folder}/${filename}.tsx`;
    const componentPath = path.join(componentSubDir, `${filename}.tsx`);

    try {
      await downloadFile(componentUrl, componentPath);
      console.log(`✓ Downloaded ${filename}.tsx`);
    } catch (error) {
      console.error(`❌ Failed to download component: ${error.message}`);
      process.exit(1);
    }

    // Check component for dependencies and download them
    const componentContent = fs.readFileSync(componentPath, 'utf-8');

    // Extract UI imports
    const uiImports = [...componentContent.matchAll(/from ['"]@\/viz\/ui\/([^'"]+)['"]/g)]
      .map(match => match[1]);

    // Extract utils imports
    const utilImports = [...componentContent.matchAll(/from ['"]@\/viz\/utils\/([^'"]+)['"]/g)]
      .map(match => match[1]);

    // Download UI dependencies
    for (const uiFile of uiImports) {
      const uiUrl = `${GITHUB_RAW_BASE}/ui/${uiFile}.tsx`;
      const uiPath = path.join(uiDir, `${uiFile}.tsx`);

      if (!fs.existsSync(uiPath)) {
        try {
          await downloadFile(uiUrl, uiPath);
          console.log(`✓ Downloaded ui/${uiFile}.tsx`);
        } catch (error) {
          console.warn(`⚠ Could not download ui/${uiFile}.tsx`);
        }
      }
    }

    // Download utils dependencies
    for (const utilFile of utilImports) {
      const utilUrl = `${GITHUB_RAW_BASE}/utils/${utilFile}.ts`;
      const utilPath = path.join(utilsDir, `${utilFile}.ts`);

      if (!fs.existsSync(utilPath)) {
        try {
          await downloadFile(utilUrl, utilPath);
          console.log(`✓ Downloaded utils/${utilFile}.ts`);
        } catch (error) {
          console.warn(`⚠ Could not download utils/${utilFile}.ts`);
        }
      }
    }

    // Extract npm dependencies
    const npmDeps = extractNpmDependencies(componentContent);

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
    console.log(`   import ${toPascalCase(filename)} from '@/viz/components/${framework}/${folder}/${filename}';\n`);
    console.log(`Make sure your tsconfig.json includes:`);
    console.log(`   "paths": { "@/viz/*": ["./viz/*"] }\n`);
  });

program.parse();

// Helper functions
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

function extractNpmDependencies(content) {
  const deps = new Set();

  // Match imports from npm packages (not @/viz/* or relative)
  const importMatches = content.matchAll(/from ['"]([^@.\/][^'"]+)['"]/g);

  for (const match of importMatches) {
    const pkg = match[1];
    // Handle scoped packages
    if (pkg.startsWith('@')) {
      const parts = pkg.split('/');
      deps.add(`${parts[0]}/${parts[1]}`);
    } else {
      deps.add(pkg.split('/')[0]);
    }
  }

  return Array.from(deps);
}

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
