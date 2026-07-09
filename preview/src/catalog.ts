import curationLedger from '../../registry/curation.json';

export type ComponentStatus = 'live' | 'catalog' | 'listed';

export type CurationStatus = 'core' | 'foundation' | 'merged' | 'parked' | 'retired' | 'unlisted';

export interface RegistryComponent {
  id: string;
  path: string;
  name: string;
  fileName: string;
  engine: string;
  engineLabel: string;
  bucket: string;
  kind: string;
  lines: number;
  imports: string[];
  props: string[];
  usesTheme: boolean;
  literalHits: number;
  hasSidecar: boolean;
  sidecar?: unknown;
  curation: CurationStatus;
  curationReason?: string;
  curationWinner?: string;
}

const curationEntries = (
  curationLedger as {
    components: Record<string, { status: string; reason: string; winner?: string }>;
  }
).components;

const sourceModules = import.meta.glob('../../registry/components/**/*.{tsx,ts}', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const sidecarModules = import.meta.glob('../../registry/components/**/*.catalog.json', {
  eager: true,
}) as Record<string, unknown>;

export const engineLabels: Record<string, string> = {
  article: 'Article',
  book: 'Book',
  composite: 'Composite',
  d3: 'D3',
  maplibre: 'MapLibre',
  plot: 'Observable Plot',
  recharts: 'Recharts',
  table: 'Table',
  ui: 'UI',
};

const engineOrder = [
  'recharts',
  'plot',
  'd3',
  'maplibre',
  'ui',
  'table',
  'article',
  'book',
  'composite',
];

function normalizePath(modulePath: string) {
  return modulePath
    .replaceAll('\\', '/')
    .replace('../../', '')
    .replace(/^registry\/components\//, 'registry/components/');
}

function titleCase(input: string) {
  return input
    .replace(/\.(tsx|ts)$/u, '')
    .replace(/-v\d+$/u, '')
    .replace(/[._-]+/gu, ' ')
    .replace(/\b\w/gu, (char) => char.toUpperCase());
}

function classifyKind(engine: string, bucket: string, fileName: string) {
  const stem = fileName.toLowerCase();
  if (engine === 'maplibre' || bucket === 'geo' || stem.includes('map')) return 'map';
  if (engine === 'table') return 'table';
  if (engine === 'article') return 'article';
  if (engine === 'book') return 'book';
  if (engine === 'composite') return 'dashboard';
  if (stem.includes('heatmap')) return 'heatmap';
  if (stem.includes('timeseries') || stem.includes('timeline') || stem.includes('slope')) {
    return 'time series';
  }
  if (stem.includes('scatter') || stem.includes('dot')) return 'point chart';
  if (stem.includes('bar') || stem.includes('ranking') || stem.includes('bullet')) return 'bar chart';
  if (stem.includes('density') || stem.includes('ridge') || stem.includes('histogram')) {
    return 'distribution';
  }
  if (stem.includes('forest') || stem.includes('odds') || stem.includes('regression')) {
    return 'statistical';
  }
  return engine === 'ui' ? 'ui chart' : 'chart';
}

function sidecarPayload(value: unknown) {
  if (value && typeof value === 'object' && 'default' in value) {
    return (value as { default: unknown }).default;
  }
  return value;
}

const sidecarsByStem = new Map(
  Object.entries(sidecarModules).map(([modulePath, moduleValue]) => {
    const path = normalizePath(modulePath);
    return [path.replace(/\.catalog\.json$/u, ''), sidecarPayload(moduleValue)] as const;
  }),
);

export const catalog = Object.entries(sourceModules)
  .map(([modulePath, source]) => {
    const path = normalizePath(modulePath);
    const relative = path.replace('registry/components/', '');
    const parts = relative.split('/');
    const engine = parts[0] ?? 'unknown';
    const bucket = parts.length > 2 ? parts[1] : engine;
    const fileName = parts[parts.length - 1] ?? relative;
    const stem = path.replace(/\.(tsx|ts)$/u, '');
    const sidecar = sidecarsByStem.get(stem);
    const curationEntry = curationEntries[stem.replace('registry/components/', '')];
    const imports = Array.from(
      source.matchAll(/^import\s+(?:type\s+)?(?:[^'"]+from\s+)?['"]([^'"]+)['"]/gmu),
      (match) => match[1],
    );
    const props = Array.from(
      source.matchAll(/(?:export\s+)?interface\s+([A-Za-z0-9]+Props)\b/gmu),
      (match) => match[1],
    );
    const literalHits = (source.match(/#[0-9a-fA-F]{3,8}|fontSize:\s*\d+|stroke="#/gu) ?? [])
      .length;

    return {
      id: path,
      path,
      name: titleCase(fileName),
      fileName,
      engine,
      engineLabel: engineLabels[engine] ?? titleCase(engine),
      bucket,
      kind: classifyKind(engine, bucket, fileName),
      lines: source.split(/\r?\n/u).length,
      imports,
      props,
      usesTheme: source.includes('useVizTheme'),
      literalHits,
      hasSidecar: sidecar !== undefined,
      sidecar,
      curation: (curationEntry?.status ?? 'unlisted') as CurationStatus,
      curationReason: curationEntry?.reason,
      curationWinner: curationEntry?.winner,
    } satisfies RegistryComponent;
  })
  .sort((a, b) => {
    const engineDelta = engineOrder.indexOf(a.engine) - engineOrder.indexOf(b.engine);
    if (engineDelta !== 0) return engineDelta;
    return a.path.localeCompare(b.path);
  });

export const kindOptions = Array.from(new Set(catalog.map((item) => item.kind))).sort();

const curationOrder: CurationStatus[] = ['core', 'foundation', 'merged', 'parked', 'retired', 'unlisted'];

export const curationOptions = Array.from(new Set(catalog.map((item) => item.curation))).sort(
  (a, b) => curationOrder.indexOf(a) - curationOrder.indexOf(b),
);

export const engineOptions = Array.from(new Set(catalog.map((item) => item.engine))).sort(
  (a, b) => engineOrder.indexOf(a) - engineOrder.indexOf(b),
);

export function statusFor(component: RegistryComponent, livePaths: Set<string>): ComponentStatus {
  if (livePaths.has(component.path)) return 'live';
  if (component.hasSidecar) return 'catalog';
  return 'listed';
}
