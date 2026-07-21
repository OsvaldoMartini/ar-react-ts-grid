import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Settings2, Trash2, X } from 'lucide-react';
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
  onClose: () => void;
};

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
  const [validation, setValidation] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<PageScannerFocusProfile | null>(null);

  useEffect(() => {
    if (!selectedProfile) return;
    setCreating(false);
    setDraft(draftFrom(selectedProfile));
    setValidation('');
  }, [profiles, selectedProfile]);

  const existingProfile = creating
    ? undefined
    : profiles.find(profile => profile.key === draft.key);
  const profileProtected = existingProfile?.protected === true
    || existingProfile?.key === PAGE_SCANNER_DEFAULT_PROFILE_KEY;
  const canSave = Boolean(draft.key.trim() && draft.label.trim()) && !profileProtected && !busy;

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
    onSave({
      ...(draft.id ? { id: draft.id } : {}),
      key,
      label,
      searchTerms: draft.searchTerms.trim(),
      sortOrder: Number.isFinite(draft.sortOrder) ? Math.trunc(draft.sortOrder) : 0,
    });
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

            <label className={styles.field}>
              <span>Search terms</span>
              <textarea
                aria-label="Search terms"
                value={draft.searchTerms}
                disabled={busy || profileProtected}
                maxLength={8192}
                onChange={event => setDraft(current => ({ ...current, searchTerms: event.target.value }))}
                placeholder="button, input, attr:test-id, attr:data-testid"
              />
              <small>Use comma-separated Page Scanner rules; for custom attributes use syntax such as attr:test-id.</small>
            </label>

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
