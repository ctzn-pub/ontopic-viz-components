import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  CircleDot,
  FileCode2,
  Library,
  ListFilter,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { VizThemeProvider } from '../../registry/theme/provider';
import { themes, type ThemeName } from '../../registry/theme/themes';
import { catalog, engineOptions, kindOptions, statusFor, type RegistryComponent } from './catalog';
import { liveExamples, livePaths } from './live-examples';

const themeNames = Object.keys(themes) as ThemeName[];

function matchesFilters(
  component: RegistryComponent,
  query: string,
  engine: string,
  kind: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const queryMatch =
    normalizedQuery.length === 0 ||
    [
      component.name,
      component.path,
      component.engineLabel,
      component.bucket,
      component.kind,
      ...component.imports,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);

  return (
    queryMatch &&
    (engine === 'all' || component.engine === engine) &&
    (kind === 'all' || component.kind === kind)
  );
}

function formatStatus(component: RegistryComponent) {
  const status = statusFor(component, livePaths);
  if (status === 'live') return 'Live preview';
  if (status === 'catalog') return 'Catalog sidecar';
  return 'Listed';
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Library }) {
  return (
    <div className="stat">
      <Icon aria-hidden="true" size={17} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function StatusDot({ component }: { component: RegistryComponent }) {
  const status = statusFor(component, livePaths);
  return <span className={`status-dot status-dot-${status}`} aria-hidden="true" />;
}

function DetailPanel({ component }: { component: RegistryComponent }) {
  const status = statusFor(component, livePaths);
  return (
    <aside className="detail-panel" aria-label="Selected component details">
      <div className="panel-heading">
        <span className="eyebrow">{component.engineLabel}</span>
        <h2>{component.name}</h2>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Path</dt>
          <dd className="path-value">{component.path}</dd>
        </div>
        <div>
          <dt>Bucket</dt>
          <dd>{component.bucket}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{component.kind}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{formatStatus(component)}</dd>
        </div>
        <div>
          <dt>Theme hook</dt>
          <dd>{component.usesTheme ? 'Uses useVizTheme()' : 'Not detected'}</dd>
        </div>
        <div>
          <dt>Surface hints</dt>
          <dd>
            {component.literalHits === 0
              ? 'No obvious color or font literals'
              : `${component.literalHits} literal-style matches`}
          </dd>
        </div>
        <div>
          <dt>Lines</dt>
          <dd>{component.lines}</dd>
        </div>
      </dl>

      <div className="detail-section">
        <h3>Props</h3>
        {component.props.length > 0 ? (
          <ul>
            {component.props.map((prop) => (
              <li key={prop}>{prop}</li>
            ))}
          </ul>
        ) : (
          <p>No props interface detected.</p>
        )}
      </div>

      <div className="detail-section">
        <h3>Imports</h3>
        {component.imports.length > 0 ? (
          <ul>
            {component.imports.slice(0, 8).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No imports detected.</p>
        )}
      </div>

      <div className={`detail-note detail-note-${status}`}>
        {status === 'live'
          ? 'This component has a rendered sample in the preview gallery.'
          : status === 'catalog'
            ? 'This component has a catalog sidecar and is ready to promote into a live preview.'
            : 'This component is discoverable from the file system. Add a live example when it is ready for visual QA.'}
      </div>
    </aside>
  );
}

function ComponentRow({
  component,
  selected,
  onSelect,
}: {
  component: RegistryComponent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`component-row ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <StatusDot component={component} />
      <span className="component-row-main">
        <strong>{component.name}</strong>
        <span>{component.bucket} / {component.kind}</span>
      </span>
      <span>{component.engineLabel}</span>
    </button>
  );
}

export default function App() {
  const [themeName, setThemeName] = useState<ThemeName>('editorial');
  const [query, setQuery] = useState('');
  const [engineFilter, setEngineFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [selectedPath, setSelectedPath] = useState(liveExamples[0].path);

  const filteredCatalog = useMemo(
    () => catalog.filter((component) => matchesFilters(component, query, engineFilter, kindFilter)),
    [query, engineFilter, kindFilter],
  );

  const filteredLiveExamples = useMemo(
    () =>
      liveExamples.filter((example) => {
        const component = catalog.find((item) => item.path === example.path);
        return component ? matchesFilters(component, query, engineFilter, kindFilter) : true;
      }),
    [query, engineFilter, kindFilter],
  );

  useEffect(() => {
    if (filteredCatalog.length === 0) return;
    if (filteredCatalog.some((component) => component.path === selectedPath)) return;
    setSelectedPath(filteredCatalog[0].path);
  }, [filteredCatalog, selectedPath]);

  const selected =
    catalog.find((component) => component.path === selectedPath) ?? filteredCatalog[0] ?? catalog[0];

  const countsByEngine = useMemo(() => {
    return catalog.reduce<Record<string, number>>((acc, item) => {
      acc[item.engine] = (acc[item.engine] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const sidecarCount = catalog.filter((item) => item.hasSidecar).length;
  const needsThemeReview = catalog.filter((item) => item.literalHits > 0 && !item.usesTheme).length;

  return (
    <VizThemeProvider theme={themeName}>
      <div className="app-shell" data-viz-theme={themeName}>
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <BarChart3 size={18} />
            </div>
            <div>
              <h1>Ontopic Viz Preview</h1>
              <p>Component registry browser and live QA surface</p>
            </div>
          </div>

          <div className="topbar-controls">
            <label className="search-box">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search components</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search path, type, engine"
              />
            </label>

            <div className="theme-switcher" aria-label="Theme">
              {themeNames.map((theme) => (
                <button
                  key={theme}
                  className={themeName === theme ? 'active' : ''}
                  onClick={() => setThemeName(theme)}
                  type="button"
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="workspace">
          <aside className="filter-panel" aria-label="Component filters">
            <div className="panel-heading compact">
              <span className="eyebrow">Library</span>
              <h2>Browse</h2>
            </div>

            <nav className="engine-list">
              <button
                className={engineFilter === 'all' ? 'active' : ''}
                onClick={() => setEngineFilter('all')}
                type="button"
              >
                <Library size={15} aria-hidden="true" />
                <span>All libraries</span>
                <strong>{catalog.length}</strong>
              </button>
              {engineOptions.map((engine) => (
                <button
                  key={engine}
                  className={engineFilter === engine ? 'active' : ''}
                  onClick={() => setEngineFilter(engine)}
                  type="button"
                >
                  <CircleDot size={15} aria-hidden="true" />
                  <span>{catalog.find((item) => item.engine === engine)?.engineLabel ?? engine}</span>
                  <strong>{countsByEngine[engine]}</strong>
                </button>
              ))}
            </nav>

            <label className="select-field">
              <span>
                <ListFilter size={14} aria-hidden="true" />
                Type
              </span>
              <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
                <option value="all">All types</option>
                {kindOptions.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>

            <div className="legend-block">
              <h3>Status</h3>
              <p><span className="status-dot status-dot-live" />Live preview</p>
              <p><span className="status-dot status-dot-catalog" />Catalog sidecar</p>
              <p><span className="status-dot status-dot-listed" />File listed</p>
            </div>
          </aside>

          <section className="content-panel">
            <div className="stat-grid">
              <Stat label="components" value={catalog.length} icon={Library} />
              <Stat label="live examples" value={liveExamples.length} icon={CheckCircle2} />
              <Stat label="catalog sidecars" value={sidecarCount} icon={FileCode2} />
              <Stat label="theme review queue" value={needsThemeReview} icon={SlidersHorizontal} />
            </div>

            <section aria-labelledby="live-preview-title" className="live-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Live Gallery</span>
                  <h2 id="live-preview-title">Rendered examples</h2>
                </div>
                <p>{filteredLiveExamples.length} shown</p>
              </div>

              <div className="preview-grid">
                {filteredLiveExamples.map((example) => {
                  const component = catalog.find((item) => item.path === example.path);
                  return (
                    <article
                      key={example.path}
                      className={`preview-card ${example.span === 'wide' ? 'wide' : ''} ${
                        selected.path === example.path ? 'selected' : ''
                      }`}
                    >
                      <button
                        className="preview-card-header"
                        onClick={() => setSelectedPath(example.path)}
                        type="button"
                      >
                        <span>
                          <strong>{example.title}</strong>
                          <em>{example.description}</em>
                        </span>
                        {component ? <StatusDot component={component} /> : null}
                      </button>
                      <div className="component-stage">{example.render()}</div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="catalog-title" className="catalog-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Catalog</span>
                  <h2 id="catalog-title">Registry files</h2>
                </div>
                <p>{filteredCatalog.length} matches</p>
              </div>

              <div className="component-list">
                {filteredCatalog.slice(0, 80).map((component) => (
                  <ComponentRow
                    key={component.path}
                    component={component}
                    selected={selected.path === component.path}
                    onSelect={() => setSelectedPath(component.path)}
                  />
                ))}
              </div>
            </section>
          </section>

          <DetailPanel component={selected} />
        </main>
      </div>
    </VizThemeProvider>
  );
}
