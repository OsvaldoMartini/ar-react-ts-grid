import React, { useEffect, useMemo, useState } from 'react';
import { FlaskConical, GripHorizontal, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import FloatingWorkspaceFrame from '../workspace/FloatingWorkspaceFrame';
import styles from './AutoTestWorkspace.module.scss';

export interface AutomationTestEntry {
  id: string;
  project: string;
  repository: string;
  recordType: 'AUTOMATED_CASE' | 'GENERATED_SUITE' | 'MANUAL_TOOL' | 'SUPPORT';
  suite: string;
  name: string;
  displayName: string;
  framework: string;
  language: string;
  kind: string;
  runtime: string;
  execution: string;
  safety: string;
  sourcePath: string;
  line: number;
  caseCount: number;
  runnable: boolean;
  runAllEligible: boolean;
  command: string;
  tags: string[];
}

export interface AutomationTestCatalog {
  ok?: boolean;
  error?: string;
  schemaVersion: number;
  generatedAt: string;
  summary: {
    catalogEntries: number;
    automatedCodeCases: number;
    generatedApiCases: number;
    totalAutomatedCases: number;
    automatedSuites: number;
    generatedSuites: number;
    manualArtifacts: number;
    supportArtifacts: number;
    defaultRunnable: number;
    safeRunAllEligible: number;
  };
  sources: Array<{
    project: string;
    repository: string;
    branch: string;
    commit: string;
    sourceFiles: number;
    automatedSuites: number;
    automatedTestCases: number;
    generatedSuites: number;
    generatedCases: number;
    note?: string;
  }>;
  tests: AutomationTestEntry[];
}

type Props = {
  catalog: AutomationTestCatalog | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onClose: () => void;
};

const formatToken = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map(part => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');

const initialPosition = () => {
  const width = Math.min(1120, Math.max(320, window.innerWidth - 32));
  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.min(64, window.innerHeight - 240)),
  };
};

const AutoTestWorkspace: React.FC<Props> = ({ catalog, loading, error, onRefresh, onClose }) => {
  const [findText, setFindText] = useState('');
  const [project, setProject] = useState('ALL');
  const [kind, setKind] = useState('ALL');
  const [safety, setSafety] = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const entries = useMemo(() => catalog?.tests || [], [catalog]);
  const projects = useMemo(
    () => Array.from(new Set(entries.map(entry => entry.project))).sort(),
    [entries],
  );
  const kinds = useMemo(
    () => Array.from(new Set(entries.map(entry => entry.kind))).sort(),
    [entries],
  );
  const safetyModes = useMemo(
    () => Array.from(new Set(entries.map(entry => entry.safety))).sort(),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const query = findText.trim().toLowerCase();
    return entries.filter(entry => {
      if (project !== 'ALL' && entry.project !== project) return false;
      if (kind !== 'ALL' && entry.kind !== kind) return false;
      if (safety !== 'ALL' && entry.safety !== safety) return false;
      if (!query) return true;
      return [
        entry.displayName,
        entry.name,
        entry.suite,
        entry.framework,
        entry.runtime,
        entry.sourcePath,
        ...entry.tags,
      ].some(value => String(value).toLowerCase().includes(query));
    });
  }, [entries, findText, kind, project, safety]);

  const clearFilters = () => {
    setFindText('');
    setProject('ALL');
    setKind('ALL');
    setSafety('ALL');
  };

  const generatedLabel = catalog?.generatedAt
    ? new Date(catalog.generatedAt).toLocaleString()
    : 'Not loaded';

  return (
    <FloatingWorkspaceFrame
      className={styles.panel}
      initialPosition={initialPosition}
      aria-label="Auto Test automation catalog"
      data-testid="auto-test-workspace"
    >
      <header
        className={styles.header}
        data-testid="auto-test-drag-handle"
        data-floating-workspace-drag-handle
      >
        <div className={styles.heading}>
          <GripHorizontal size={18} aria-hidden="true" />
          <FlaskConical size={22} aria-hidden="true" />
          <span>
            <h2>Auto Test</h2>
            <small>Complete automation inventory · generated {generatedLabel}</small>
          </span>
        </div>
        <div className={styles.headerActions}>
          <button type="button" title="Refresh test catalog" aria-label="Refresh test catalog" onClick={onRefresh}>
            <RefreshCw size={17} aria-hidden="true" />
          </button>
          <button type="button" title="Close Auto Test" aria-label="Close Auto Test" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={styles.notice}>
        <ShieldAlert size={17} aria-hidden="true" />
        <span>
          Inventory only. Headed, live, generated, and manual suites stay clearly marked and are not
          included in an automatic Run All action.
        </span>
      </div>

      {catalog && (
        <section className={styles.summary} aria-label="Automation totals">
          <div><strong>{catalog.summary.automatedCodeCases.toLocaleString()}</strong><span>Code test cases</span></div>
          <div><strong>{catalog.summary.generatedApiCases.toLocaleString()}</strong><span>Generated API requests</span></div>
          <div><strong>{catalog.summary.automatedSuites.toLocaleString()}</strong><span>Code test files</span></div>
          <div><strong>{catalog.sources.length}</strong><span>Repositories audited</span></div>
        </section>
      )}

      <div className={styles.filters}>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <span className={styles.srOnly}>Find tests</span>
          <input
            aria-label="Find tests"
            value={findText}
            placeholder="Find test, class, path, tag..."
            onChange={event => setFindText(event.target.value)}
          />
        </label>
        <label>
          <span>Repository</span>
          <select aria-label="Filter by repository" value={project} onChange={event => setProject(event.target.value)}>
            <option value="ALL">All repositories</option>
            {projects.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select aria-label="Filter by test type" value={kind} onChange={event => setKind(event.target.value)}>
            <option value="ALL">All types</option>
            {kinds.map(value => <option key={value} value={value}>{formatToken(value)}</option>)}
          </select>
        </label>
        <label>
          <span>Safety</span>
          <select aria-label="Filter by safety" value={safety} onChange={event => setSafety(event.target.value)}>
            <option value="ALL">All safety modes</option>
            {safetyModes.map(value => <option key={value} value={value}>{formatToken(value)}</option>)}
          </select>
        </label>
        <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear</button>
      </div>

      <div className={styles.resultBar}>
        <strong>{filteredEntries.length.toLocaleString()}</strong>
        <span>of {entries.length.toLocaleString()} catalog entries</span>
        {catalog?.sources.map(source => (
          <span key={source.project} className={styles.sourceBadge} title={source.note || source.commit}>
            {source.project}: {source.automatedTestCases.toLocaleString()}
          </span>
        ))}
      </div>

      <div className={styles.tableWrap}>
        {loading && !catalog ? (
          <div className={styles.empty}>Loading the packaged automation catalog...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : filteredEntries.length === 0 ? (
          <div className={styles.empty}>No automation entries match the selected filters.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Test / source</th>
                <th>Repository</th>
                <th>Framework</th>
                <th>Type</th>
                <th>Runtime</th>
                <th>Safety</th>
                <th>Cases</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => (
                <tr key={entry.id} data-record-type={entry.recordType}>
                  <td title={entry.command || entry.sourcePath}>
                    <strong>{entry.displayName}</strong>
                    <span>{entry.suite}</span>
                    <code>{entry.sourcePath}:{entry.line}</code>
                  </td>
                  <td>{entry.project}</td>
                  <td>{entry.framework}</td>
                  <td><span className={styles.typeBadge}>{formatToken(entry.kind)}</span></td>
                  <td>{formatToken(entry.runtime)}</td>
                  <td>
                    <span className={[styles.safetyBadge, entry.safety === 'SAFE' ? styles.safe : styles.restricted].join(' ')}>
                      {formatToken(entry.safety)}
                    </span>
                  </td>
                  <td>{entry.caseCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </FloatingWorkspaceFrame>
  );
};

export default AutoTestWorkspace;
