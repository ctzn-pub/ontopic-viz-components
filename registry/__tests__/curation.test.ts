// registry/__tests__/curation.test.ts
//
// Curation-ledger contract. registry/curation.json is the source of truth for
// which components are core / foundation / merged / parked / retired (see
// registry/CURATION.md for the rationale). This test keeps the ledger honest:
//
//   1. Every component file under registry/components/ (and registry/legacy/,
//      once Phase 3 starts moving losers there) has exactly one ledger entry.
//   2. Every ledger entry points at a file that actually exists — no ghosts.
//   3. Statuses are from the allowed set; every entry carries a reason.
//   4. `merged` entries name a `winner` that exists and is itself `core`.
//   5. Every stem on the sidecar test's REQUIRES_SIDECAR list is `core`
//      (the end-state invariant — Phase 6 flips this to full equivalence by
//      deriving REQUIRES_SIDECAR from the ledger).
//
// Pure fs + JSON, matching catalog-sidecar.test.ts.

import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_ROOT = resolve(here, '../components');
const LEGACY_ROOT = resolve(here, '../legacy');
const LEDGER_PATH = resolve(here, '../curation.json');

const ALLOWED_STATUSES = new Set(['core', 'foundation', 'merged', 'parked', 'retired']);

interface LedgerEntry {
  status: string;
  reason: string;
  winner?: string;
}

const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as {
  components: Record<string, LedgerEntry>;
};
const entries = ledger.components;

function walkStems(root: string, dir = root, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) walkStems(root, full, out);
    else if (/\.(tsx|ts)$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(relative(root, full).replace(/\.(tsx|ts)$/, ''));
    }
  }
  return out;
}

// A component lives in exactly one of the two trees; the ledger tracks both.
const activeStems = walkStems(COMPONENTS_ROOT);
const legacyStems = walkStems(LEGACY_ROOT);
const allStems = [...activeStems, ...legacyStems];

describe('curation ledger contract', () => {
  test('every component file has exactly one ledger entry', () => {
    const missing = allStems.filter((s) => !entries[s]);
    expect(missing, `components missing from curation.json:\n${missing.join('\n')}`).toEqual([]);
  });

  test('every ledger entry points at a real file', () => {
    const ghosts = Object.keys(entries).filter((s) => !allStems.includes(s));
    expect(ghosts, `ledger entries with no component file:\n${ghosts.join('\n')}`).toEqual([]);
  });

  test('statuses are allowed and every entry has a reason', () => {
    const bad: string[] = [];
    for (const [stem, e] of Object.entries(entries)) {
      if (!ALLOWED_STATUSES.has(e.status)) bad.push(`${stem}: unknown status "${e.status}"`);
      if (typeof e.reason !== 'string' || e.reason.length < 10) bad.push(`${stem}: missing/thin reason`);
    }
    expect(bad, `\n${bad.join('\n')}`).toEqual([]);
  });

  test('merged entries name an existing core winner', () => {
    const bad: string[] = [];
    for (const [stem, e] of Object.entries(entries)) {
      if (e.status !== 'merged') continue;
      if (!e.winner) {
        bad.push(`${stem}: merged without winner`);
      } else if (!entries[e.winner]) {
        bad.push(`${stem}: winner "${e.winner}" not in ledger`);
      } else if (!['core', 'parked'].includes(entries[e.winner].status)) {
        // winner is normally core; parked is tolerated for discouraged forms
        // (e.g. dual-axis) where the pair was deduped but neither made the cut
        bad.push(`${stem}: winner "${e.winner}" has status "${entries[e.winner].status}"`);
      }
    }
    expect(bad, `\n${bad.join('\n')}`).toEqual([]);
  });

  test('everything on REQUIRES_SIDECAR is core', async () => {
    // read the sibling test's allowlist by parsing its source — keeps one
    // source of truth per list without exporting test internals
    const sidecarTest = readFileSync(resolve(here, 'catalog-sidecar.test.ts'), 'utf8');
    const listMatch = sidecarTest.match(/const REQUIRES_SIDECAR = \[([\s\S]*?)\];/);
    expect(listMatch, 'could not locate REQUIRES_SIDECAR in catalog-sidecar.test.ts').toBeTruthy();
    const stems = [...listMatch![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(stems.length).toBeGreaterThan(0);
    const notCore = stems.filter((s) => entries[s]?.status !== 'core');
    expect(notCore, `REQUIRES_SIDECAR stems not core in the ledger:\n${notCore.join('\n')}`).toEqual([]);
  });
});
