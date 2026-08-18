import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RefreshCw, Save, Settings2, Trash2, X } from 'lucide-react';
import QuestionsCard from '../QuestionsCard';
import FloatingWorkspaceFrame from '../workspace/FloatingWorkspaceFrame';
import {
  PAGE_SCANNER_CUSTOM_PROFILE_KEY,
  PAGE_SCANNER_DEFAULT_PROFILE_KEY,
  type PageScannerFocusProfile,
  pageScannerProfileKeyFromLabel,
} from './PageScannerFocusProfile';
import styles from './PageScannerFocusProfileEditor.module.scss';

export type PageScannerFocusProfileDraft = {
  id?: number;
  key: string;
  label: string;
  searchTerms: string;
  sortOrder: number;
};

type Props = {
  profiles: PageScannerFocusProfile[];
  selectedProfileKey: string;
  currentSearchTerms?: string;
  busy?: boolean;
  error?: string;
  onSelect: (profileKey: string) => void;
  onSave: (draft: PageScannerFocusProfileDraft) => void;
  onDelete: (profile: PageScannerFocusProfile) => void;
  onRefresh: () => boolean;
  onClose: () => void;
};

type SearchTermPattern = 'selector' | 'attribute';

type SearchTermRow = {
  id: string;
  pattern: SearchTermPattern;
  value: string;
};

const ATTRIBUTE_NAME_PATTERN = /^[A-Za-z_:][A-Za-z0-9_.:-]{0,127}$/;
let searchTermRowSequence = 0;

const nextSearchTermRowId = () => `search-term-${++searchTermRowSequence}`;

const stripAttributePrefix = (value: string) => (
  value.trim().replace(/^attr:\s*/i, '')
);

const searchTermRowFrom = (term: string): SearchTermRow => {
  const normalized = term.trim();
  const attribute = normalized.toLowerCase().startsWith('attr:');
  return {
    id: nextSearchTermRowId(),
    pattern: attribute ? 'attribute' : 'selector',
    value: attribute ? normalized.slice(5).trim() : normalized,
  };
};

const searchTermRowsFrom = (searchTerms: string): SearchTermRow[] => (
  searchTerms
    .split(',')
    .map(term => term.trim())
    .filter(Boolean)
    .map(searchTermRowFrom)
);

const serializeSearchTermRows = (rows: SearchTermRow[]): string => (
  rows
    .map(row => {
      const value = row.pattern === 'attribute'
        ? stripAttributePrefix(row.value)
        : row.value.trim();
      if (!value) return '';
      return row.pattern === 'attribute' ? `attr:${value}` : value;
    })
    .filter(Boolean)
    .join(', ')
);

const activeSearchTermCount = (rows: SearchTermRow[]) => (
  rows.filter(row => stripAttributePrefix(row.value).length > 0).length
);

const invalidAttributeRows = (rows: SearchTermRow[]) => (
  rows.filter(row => {
    if (row.pattern !== 'attribute') return false;
    const attributeName = stripAttributePrefix(row.value);
    return Boolean(attributeName) && !ATTRIBUTE_NAME_PATTERN.test(attributeName);
  })
);

const initialPosition = () => ({
  x: Math.max(16, window.innerWidth - Math.min(500, window.innerWidth - 32) - 24),
  y: Math.max(16, Math.min(130, window.innerHeight - 80)),
});

const draftFrom = (profile: PageScannerFocusProfile): PageScannerFocusProfileDraft => ({
  ...(profile.id ? { id: profile.id } : {}),
  key: profile.key,
  label: profile.label,
  searchTerms: profile.searchTerms,
  sortOrder: profile.sortOrder,
});

const PageScannerFocusProfileEditor: React.FC<Props> = ({
  profiles,
  selectedProfileKey,
  currentSearchTerms = '',
  busy = false,
  error = '',
  onSelect,
  onSave,
  onDelete,
  onRefresh,
  onClose,
}) => {
  const selectedProfile = useMemo(
    () => profiles.find(profile => profile.key === selectedProfileKey) || profiles[0],
    [profiles, selectedProfileKey],
  );
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<PageScannerFocusProfileDraft>(() => (
    selectedProfile
      ? draftFrom(selectedProfile)
      : { key: '', label: '', searchTerms: '', sortOrder: 10 }
  ));
  const [searchTermRows, setSearchTermRows] = useState<SearchTermRow[]>(() => (
    searchTermRowsFrom(selectedProfile?.searchTerms || '')
  ));
  const [searchTermsFeedback, setSearchTermsFeedback] = useState('');
  const [refreshRequested, setRefreshRequested] = useState(false);
  const [focusSearchTermId, setFocusSearchTermId] = useState<string | null>(null);
  const refreshObservedBusy = useRef(false);
  const [validation, setValidation] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<PageScannerFocusProfile | null>(null);

  useEffect(() => {
    if (!selectedProfile) return;
    setCreating(false);
    setDraft(draftFrom(selectedProfile));
    setSearchTermRows(searchTermRowsFrom(selectedProfile.searchTerms));
    setSearchTermsFeedback('');
    setValidation('');
  }, [profiles, selectedProfile]);

  useEffect(() => {
    if (!focusSearchTermId) return;
    document.getElementById(focusSearchTermId)?.focus();
    setFocusSearchTermId(null);
  }, [focusSearchTermId, searchTermRows]);

  useEffect(() => {
    if (!refreshRequested) {
      refreshObservedBusy.current = false;
      return;
    }
    if (busy) {
      refreshObservedBusy.current = true;
      return;
    }
    if (!refreshObservedBusy.current) return;

    if (selectedProfile) {
      const refreshedRows = searchTermRowsFrom(selectedProfile.searchTerms);
      setCreating(false);
      setDraft(draftFrom(selectedProfile));
      setSearchTermRows(refreshedRows);
      setSearchTermsFeedback(error
        ? `Refresh failed: ${error}`
        : `${activeSearchTermCount(refreshedRows)} search term${activeSearchTermCount(refreshedRows) === 1 ? '' : 's'} refreshed from the database.`);
    }
    setRefreshRequested(false);
    refreshObservedBusy.current = false;
  }, [busy, error, refreshRequested, selectedProfile]);

  const existingProfile = creating
    ? undefined
    : profiles.find(profile => profile.key === draft.key);
  const profileProtected = existingProfile?.protected === true
    || existingProfile?.key === PAGE_SCANNER_DEFAULT_PROFILE_KEY;
  const serializedSearchTerms = serializeSearchTermRows(searchTermRows);
  const invalidAttributes = invalidAttributeRows(searchTermRows);
  const searchTermsTooLong = serializedSearchTerms.length > 8192;
  const canSave = Boolean(draft.key.trim() && draft.label.trim())
    && invalidAttributes.length === 0
    && !searchTermsTooLong
    && !profileProtected
    && !busy;

  const startNew = () => {
    const highestOrder = profiles.reduce((highest, profile) => Math.max(highest, profile.sortOrder), 0);
    setCreating(true);
    setDraft({
      key: '',
      label: '',
      searchTerms: selectedProfileKey === PAGE_SCANNER_CUSTOM_PROFILE_KEY
        ? currentSearchTerms
        : selectedProfile?.searchTerms || '',
      sortOrder: highestOrder + 10,
    });
    const initialSearchTerms = selectedProfileKey === PAGE_SCANNER_CUSTOM_PROFILE_KEY
      ? currentSearchTerms
      : selectedProfile?.searchTerms || '';
    setSearchTermRows(searchTermRowsFrom(initialSearchTerms));
    setSearchTermsFeedback('');
    setValidation('');
  };

  const updateLabel = (label: string) => {
    setDraft(current => ({
      ...current,
      label,
      ...(creating ? { key: pageScannerProfileKeyFromLabel(label) } : {}),
    }));
    setValidation('');
  };

  const submit = () => {
    const label = draft.label.trim();
    const key = draft.key.trim();
    if (!label || !key) {
      setValidation('Profile name is required.');
      return;
    }
    if (invalidAttributes.length > 0) {
      setValidation('Attribute terms may contain only letters, numbers, underscore, dot, colon, or hyphen.');
      return;
    }
    if (searchTermsTooLong) {
      setValidation('Search terms cannot exceed 8192 characters.');
      return;
    }
    onSave({
      ...(draft.id ? { id: draft.id } : {}),
      key,
      label,
      searchTerms: serializedSearchTerms,
      sortOrder: Number.isFinite(draft.sortOrder) ? Math.trunc(draft.sortOrder) : 0,
    });
  };

  const addSearchTerm = () => {
    const row: SearchTermRow = {
      id: nextSearchTermRowId(),
      pattern: 'selector',
      value: '',
    };
    setSearchTermRows(current => [...current, row]);
    setFocusSearchTermId(`search-term-input-${row.id}`);
    setSearchTermsFeedback('New search term row added.');
    setValidation('');
  };

  const updateSearchTerm = (rowId: string, value: string) => {
    setSearchTermRows(current => current.map(row => (
      row.id === rowId ? { ...row, value } : row
    )));
    setSearchTermsFeedback('Search terms updated. Save the profile to persist the changes.');
    setValidation('');
  };

  const updateSearchTermPattern = (rowId: string, pattern: SearchTermPattern) => {
    setSearchTermRows(current => current.map(row => (
      row.id === rowId
        ? { ...row, pattern, value: pattern === 'attribute' ? stripAttributePrefix(row.value) : row.value }
        : row
    )));
    setSearchTermsFeedback(
      pattern === 'attribute'
        ? 'Attribute pattern selected. The attr: prefix will be added automatically.'
        : 'Selector pattern selected. No prefix or suffix will be added.',
    );
    setValidation('');
  };

  const removeSearchTerm = (rowId: string) => {
    const nextRows = searchTermRows.filter(row => row.id !== rowId);
    setSearchTermRows(nextRows);
    const count = activeSearchTermCount(nextRows);
    setSearchTermsFeedback(`Search term removed. ${count} term${count === 1 ? '' : 's'} ready; save the profile to persist the change.`);
    setValidation('');
  };

  const refreshSearchTerms = () => {
    setSearchTermsFeedback('Refreshing saved search terms from the database...');
    setRefreshRequested(true);
    if (!onRefresh()) {
      setRefreshRequested(false);
      setSearchTermsFeedback('The search terms refresh request could not be sent.');
    }
  };

  return (
    <>
      <FloatingWorkspaceFrame
        className={styles.frame}
        initialPosition={initialPosition}
        edgeMargin={8}
        visibleHeaderHeight={52}
        aria-label="Page Scanner focus profile editor"
        data-testid="page-scanner-focus-profile-editor"
      >
        <section className={styles.panel}>
          <header className={styles.header} data-floating-workspace-drag-handle>
            <div className={styles.heading}>
              <Settings2 size={18} aria-hidden="true" />
              <span>
                <strong>Page Scanner profiles</strong>
                <small>Reusable focus and selector rules</small>
              </span>
            </div>
            <button type="button" className={styles.headerButton} onClick={onClose} title="Close" aria-label="Close profile editor">
              <X size={17} aria-hidden="true" />
            </button>
          </header>

          <div className={styles.body}>
            <label className={styles.field}>
              <span>Profile</span>
              <select
                value={creating ? '' : selectedProfile?.key || ''}
                disabled={busy || profiles.length === 0}
                onChange={event => onSelect(event.target.value)}
              >
                {creating && <option value="">New profile</option>}
                {profiles.map(profile => (
                  <option key={profile.key} value={profile.key}>
                    {profile.label}{profile.protected ? ' (protected)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  autoFocus={creating}
                  value={draft.label}
                  disabled={busy || profileProtected}
                  maxLength={128}
                  onChange={event => updateLabel(event.target.value)}
                  placeholder="e.g. Angular dialog controls"
                />
              </label>
              <label className={styles.field}>
                <span>Order</span>
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  value={draft.sortOrder}
                  disabled={busy || profileProtected}
                  onChange={event => setDraft(current => ({ ...current, sortOrder: Number(event.target.value) }))}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Profile key</span>
              <input value={draft.key} readOnly aria-readonly="true" />
            </label>

            <section className={styles.searchTermsField} aria-labelledby="search-terms-heading">
              <div className={styles.searchTermsHeader}>
                <span id="search-terms-heading">Search terms</span>
                <div className={styles.searchTermsToolbar}>
                  <button
                    type="button"
                    className={styles.termToolbarButton}
                    disabled={busy || profileProtected}
                    onClick={addSearchTerm}
                    title="Add a search term"
                    aria-label="Add search term"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.termToolbarButton}
                    disabled={busy || creating}
                    onClick={refreshSearchTerms}
                    title={creating
                      ? 'Save the new profile before refreshing'
                      : 'Reload saved search terms from the database'}
                    aria-label="Refresh search terms from database"
                  >
                    <RefreshCw
                      size={14}
                      aria-hidden="true"
                      className={refreshRequested && busy ? styles.refreshing : undefined}
                    />
                  </button>
                </div>
              </div>

              <div className={styles.searchTermsTableWrap}>
                <table className={styles.searchTermsTable} aria-label="Search terms">
                  <thead>
                    <tr>
                      <th scope="col">Pattern</th>
                      <th scope="col">Term</th>
                      <th scope="col" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {searchTermRows.length === 0 && (
                      <tr>
                        <td colSpan={3} className={styles.emptyTerms}>
                          No search terms. Use + to add a selector or attribute.
                        </td>
                      </tr>
                    )}
                    {searchTermRows.map((row, index) => {
                      const attributeName = stripAttributePrefix(row.value);
                      const invalidAttribute = row.pattern === 'attribute'
                        && Boolean(attributeName)
                        && !ATTRIBUTE_NAME_PATTERN.test(attributeName);
                      return (
                        <tr key={row.id}>
                          <td className={styles.patternCell}>
                            <select
                              aria-label={`Pattern for search term ${index + 1}`}
                              value={row.pattern}
                              disabled={busy || profileProtected}
                              onChange={event => updateSearchTermPattern(
                                row.id,
                                event.target.value as SearchTermPattern,
                              )}
                            >
                              <option value="selector">Selector</option>
                              <option value="attribute">Attribute</option>
                            </select>
                          </td>
                          <td className={styles.termCell}>
                            <input
                              id={`search-term-input-${row.id}`}
                              aria-label={`Search term ${index + 1}`}
                              value={row.value}
                              disabled={busy || profileProtected}
                              maxLength={8192}
                              placeholder={row.pattern === 'attribute' ? 'test-id' : "button or [role='tab']"}
                              onChange={event => updateSearchTerm(row.id, event.target.value)}
                              onKeyDown={event => {
                                if (event.key === 'Enter' && !busy && !profileProtected) {
                                  event.preventDefault();
                                  addSearchTerm();
                                }
                              }}
                            />
                            <small className={invalidAttribute ? styles.termHelpError : styles.termHelp}>
                              {row.pattern === 'attribute'
                                ? invalidAttribute
                                  ? 'Invalid attribute name. Use letters, numbers, _, ., :, or -.'
                                  : `Prefix attr: is automatic${attributeName ? ` — saved as attr:${attributeName}` : ' — example: attr:test-id'}.`
                                : "No prefix or suffix — example: button or [role='tab']."}
                            </small>
                          </td>
                          <td className={styles.termActionCell}>
                            <button
                              type="button"
                              className={styles.removeTermButton}
                              disabled={busy || profileProtected}
                              onClick={() => removeSearchTerm(row.id)}
                              title="Remove this search term"
                              aria-label={`Remove search term ${index + 1}`}
                            >
                              <X size={14} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.searchTermsSummary} role="status" aria-live="polite">
                {searchTermsFeedback || `${activeSearchTermCount(searchTermRows)} search term${activeSearchTermCount(searchTermRows) === 1 ? '' : 's'} loaded.`}
              </div>
            </section>

            {profileProtected && (
              <p className={styles.protectedNotice}>
                The factory default is protected and always scans with blank search terms.
              </p>
            )}

            {(validation || error) && (
              <p className={styles.error} role="alert">{validation || error}</p>
            )}
          </div>

          <footer className={styles.footer}>
            <button type="button" onClick={startNew} disabled={busy}>
              <Plus size={15} aria-hidden="true" />New
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              disabled={!existingProfile || profileProtected || busy}
              title={profileProtected ? 'The factory default profile cannot be deleted' : 'Delete selected profile'}
              onClick={() => existingProfile && setDeleteCandidate(existingProfile)}
            >
              <Trash2 size={15} aria-hidden="true" />Delete
            </button>
            <span />
            <button type="button" onClick={onClose}>Close</button>
            <button type="button" className={styles.saveButton} disabled={!canSave} onClick={submit}>
              <Save size={15} aria-hidden="true" />{busy ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </section>
      </FloatingWorkspaceFrame>

      {deleteCandidate && (
        <QuestionsCard
          mode="confirm"
          header="Delete Page Scanner profile?"
          body={`Delete "${deleteCandidate.label}"?`}
          extraMsg="This removes the profile from the Page Scanner list. The factory default remains available."
          okLabel="Delete"
          destructive
          error
          onCancel={() => setDeleteCandidate(null)}
          onSubmit={() => {
            const candidate = deleteCandidate;
            setDeleteCandidate(null);
            onDelete(candidate);
          }}
        />
      )}
    </>
  );
};

export default PageScannerFocusProfileEditor;
