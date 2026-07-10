#!/usr/bin/env node
// Regenerates docs/INVENTORY.md from registry/curation.json + the .catalog.json
// sidecars — the successor to the hand-maintained (and chronically stale)
// COMPONENT-INVENTORY.md. Run after any curation or sidecar change:
//   node scripts/generate-inventory.mjs
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const componentsRoot = resolve(root, 'registry/components');
const ledger = JSON.parse(readFileSync(resolve(root, 'registry/curation.json'), 'utf8')).components;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

const rows = [];
for (const file of walk(componentsRoot)) {
  const stem = relative(componentsRoot, file).replace(/\.(tsx|ts)$/, '');
  const entry = ledger[stem];
  if (!entry) continue;
  const sidecarPath = resolve(componentsRoot, `${stem}.catalog.json`);
  const sidecar = existsSync(sidecarPath) ? JSON.parse(readFileSync(sidecarPath, 'utf8')) : null;
  rows.push({ stem, status: entry.status, sidecar });
}

const byStatus = { core: [], foundation: [] };
for (const r of rows) (byStatus[r.status] ??= []).push(r);

const engineOf = (stem) => stem.split('/')[0];
const lines = [];
lines.push('# Component Inventory');
lines.push('');
lines.push('> GENERATED — do not edit. `node scripts/generate-inventory.mjs` regenerates this');
lines.push('> from `registry/curation.json` + the `.catalog.json` sidecars.');
lines.push('> Rationale for every curation call: [registry/CURATION.md](../registry/CURATION.md).');
lines.push('');

const coreByCat = {};
for (const r of byStatus.core) {
  const cat = r.sidecar?.category ?? 'uncategorized';
  (coreByCat[cat] ??= []).push(r);
}
lines.push(`## Core components (${byStatus.core.length})`);
lines.push('');
lines.push('Publishable chart cards: theme-aware, typed, sidecar’d. Grouped by gallery category.');
for (const cat of Object.keys(coreByCat).sort()) {
  lines.push('');
  lines.push(`### ${cat}`);
  lines.push('');
  lines.push('| id | component | engine | description |');
  lines.push('|---|---|---|---|');
  for (const r of coreByCat[cat].sort((a, b) => (a.sidecar?.id ?? '').localeCompare(b.sidecar?.id ?? ''))) {
    const s = r.sidecar ?? {};
    const idCell = s.foldInto ? `${s.id} → folds into ${s.foldInto}` : s.id ?? '—';
    lines.push(`| ${idCell} | \`${r.stem}\` | ${engineOf(r.stem)} | ${(s.description ?? '').split('. ')[0]}. |`);
  }
}

lines.push('');
lines.push(`## Foundation (${byStatus.foundation.length})`);
lines.push('');
lines.push('Kept + maintained; not gallery chart cards (article/book MDX building blocks).');
lines.push('');
for (const r of byStatus.foundation.sort((a, b) => a.stem.localeCompare(b.stem))) {
  lines.push(`- \`${r.stem}\``);
}

const legacyCount = Object.values(ledger).filter((e) => e.status === 'merged' || e.status === 'parked').length;
lines.push('');
lines.push(`## Legacy (${legacyCount})`);
lines.push('');
lines.push('Merged (dedupe losers) and parked components live under `registry/legacy/` —');
lines.push('see [registry/CURATION.md](../registry/CURATION.md) for each call and how to un-park.');
lines.push('');

writeFileSync(resolve(root, 'docs/INVENTORY.md'), lines.join('\n'));
console.log(`docs/INVENTORY.md written: ${byStatus.core.length} core, ${byStatus.foundation.length} foundation, ${legacyCount} legacy.`);
