// registry/__tests__/catalog-sidecar.test.ts
//
// Publish-gate contract. The ctzn-pub auto-publish workflow only ships a
// component if it has a well-formed .catalog.json sidecar; the conventions
// skill says this gate should be enforced by a test, but the test didn't exist.
// This is it.
//
// Two guarantees:
//   1. EVERY .catalog.json present in the registry is well-formed (so a typo in
//      an existing sidecar fails CI here instead of silently breaking the gallery).
//   2. Every component on REQUIRES_SIDECAR has a matching, valid sidecar. This is
//      an explicit allowlist rather than "all components" on purpose: 80 legacy
//      components predate the sidecar convention, and retroactively requiring one
//      would fail the build instead of catching real regressions. New components
//      add themselves here; the list only grows.
//
// Pure fs + JSON. No DOM, no engine deps — runs in the existing vitest setup.

import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_ROOT = resolve(here, '../components');

const ALLOWED_CATEGORIES = new Set([
  'time-series',
  'maps',
  'distributions',
  'demographic-breakdowns',
  'regression-and-effects',
  // added 2026-07-09 for the health-of-americas imports (gauges, correlation
  // matrices) that fit none of the original five; the ctzn-pub gallery rail
  // needs a matching label when Phase 7 lands
  'indicators-and-matrices',
]);

// Components that MUST ship a sidecar: exactly the curation ledger's `core`
// set (registry/curation.json). Derived, not hand-maintained, so the ledger
// and this gate can never drift — promoting a component to core makes its
// sidecar mandatory in the same change. `foundation` (article/book MDX
// blocks) is exempt by design; merged/parked live in registry/legacy/.
const curationLedger = JSON.parse(
  readFileSync(resolve(here, '../curation.json'), 'utf8'),
) as { components: Record<string, { status: string }> };
const REQUIRES_SIDECAR = Object.entries(curationLedger.components)
  .filter(([, e]) => e.status === 'core')
  .map(([stem]) => stem)
  .sort();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(COMPONENTS_ROOT);
const sidecarFiles = allFiles.filter((f) => f.endsWith('.catalog.json'));

/** Validate one parsed sidecar object; returns a list of human-readable errors. */
function validateSidecar(obj: unknown): string[] {
  const errs: string[] = [];
  if (typeof obj !== 'object' || obj === null) return ['not a JSON object'];
  const d = obj as Record<string, unknown>;

  for (const field of ['id', 'name', 'category', 'tags', 'description'] as const) {
    const v = d[field];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
      errs.push(`missing required field: ${field}`);
    }
  }

  if (typeof d.id === 'string' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id)) {
    errs.push(`id is not a lowercase hyphen slug: "${d.id}"`);
  }
  if (typeof d.category === 'string' && !ALLOWED_CATEGORIES.has(d.category)) {
    errs.push(`category not allowed: "${d.category}"`);
  }
  if (d.tags !== undefined && !Array.isArray(d.tags)) {
    errs.push('tags must be an array');
  }

  // sample_data is required UNLESS the component folds into a parent card
  const foldInto = d.foldInto ?? null;
  if (!foldInto) {
    const sd = d.sample_data as Record<string, unknown> | undefined;
    if (!sd) {
      errs.push('missing sample_data (required unless foldInto is set)');
    } else {
      if (typeof sd.url !== 'string' || !/^https:\/\//.test(sd.url)) {
        errs.push('sample_data.url must be an https URL');
      }
      if (sd.transform !== undefined && typeof sd.transform !== 'string') {
        errs.push('sample_data.transform must be a string');
      }
    }
  }

  return errs;
}

describe('catalog sidecar contract', () => {
  test('every .catalog.json in the registry is well-formed', () => {
    const failures: string[] = [];
    for (const file of sidecarFiles) {
      const rel = relative(COMPONENTS_ROOT, file);
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
      } catch (e) {
        failures.push(`${rel}: invalid JSON (${(e as Error).message})`);
        continue;
      }
      for (const err of validateSidecar(parsed)) failures.push(`${rel}: ${err}`);
    }
    expect(failures, `\n${failures.join('\n')}`).toEqual([]);
  });

  test('every sidecar id is unique', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const file of sidecarFiles) {
      try {
        const d = JSON.parse(readFileSync(file, 'utf8')) as { id?: string };
        if (typeof d.id === 'string') {
          if (seen.has(d.id)) dupes.push(`duplicate id "${d.id}": ${seen.get(d.id)} & ${relative(COMPONENTS_ROOT, file)}`);
          else seen.set(d.id, relative(COMPONENTS_ROOT, file));
        }
      } catch {
        /* covered by the well-formed test */
      }
    }
    expect(dupes, `\n${dupes.join('\n')}`).toEqual([]);
  });

  test('every component requiring a sidecar has its .tsx and .catalog.json', () => {
    const missing: string[] = [];
    for (const stem of REQUIRES_SIDECAR) {
      const tsx = resolve(COMPONENTS_ROOT, `${stem}.tsx`);
      const cat = resolve(COMPONENTS_ROOT, `${stem}.catalog.json`);
      if (!existsSync(tsx)) missing.push(`${stem}.tsx is missing`);
      if (!existsSync(cat)) missing.push(`${stem}.catalog.json is missing`);
    }
    expect(missing, `\n${missing.join('\n')}`).toEqual([]);
  });
});
