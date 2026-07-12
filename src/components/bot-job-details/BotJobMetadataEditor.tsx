import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BotJobDetailsState,
  BotJobMetadataDraft,
} from './BotJobDetails.types';
import styles from './BotJobMetadataEditor.module.scss';

interface BotJobMetadataEditorProps {
  state: BotJobDetailsState | null;
  loading: boolean;
  connected: boolean;
  saving: boolean;
  busy?: boolean;
  fieldErrors?: Record<string, string>;
  metadataSavedRevision?: number | null;
  onSave: (draft: BotJobMetadataDraft) => void;
  onRefreshEnvironments: () => void;
  onOpenOrganizations: () => void;
  onRetry: () => void;
}

const emptyDraft: BotJobMetadataDraft = {
  expectedMetadataRevision: 0,
  name: '',
  description: '',
  homeUrlId: 0,
};

const BotJobMetadataEditor: React.FC<BotJobMetadataEditorProps> = ({
  state,
  loading,
  connected,
  saving,
  busy = false,
  fieldErrors = {},
  metadataSavedRevision = null,
  onSave,
  onRefreshEnvironments,
  onOpenOrganizations,
  onRetry,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BotJobMetadataDraft>(emptyDraft);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const activeJobIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state) return;
    if (activeJobIdRef.current !== state.botJobId) {
      activeJobIdRef.current = state.botJobId;
      setDraft({
        expectedMetadataRevision: state.metadataRevision,
        name: state.name,
        description: state.description,
        homeUrlId: state.homeUrlId,
      });
      setEditing(false);
      setLocalErrors({});
    } else if (!editing) {
      setDraft({
        expectedMetadataRevision: state.metadataRevision,
        name: state.name,
        description: state.description,
        homeUrlId: state.homeUrlId,
      });
    }
  }, [editing, state]);

  useEffect(() => {
    if (state && metadataSavedRevision === state.metadataRevision) setEditing(false);
  }, [metadataSavedRevision, state]);

  const selectedEnvironment = useMemo(
    () => state?.environments.find((environment) => environment.id === draft.homeUrlId) ?? null,
    [draft.homeUrlId, state?.environments],
  );
  const errors = { ...localErrors, ...fieldErrors };
  const canEdit = Boolean(state?.capabilities.canEditMetadata && connected && !loading && !busy);

  const beginEdit = () => {
    if (!state || !canEdit) return;
    setDraft({
      expectedMetadataRevision: state.metadataRevision,
      name: state.name,
      description: state.description,
      homeUrlId: state.homeUrlId,
    });
    setLocalErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    if (state) {
      setDraft({
        expectedMetadataRevision: state.metadataRevision,
        name: state.name,
        description: state.description,
        homeUrlId: state.homeUrlId,
      });
    }
    setLocalErrors({});
    setEditing(false);
  };

  const save = () => {
    if (!state) return;
    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = 'Bot Job name cannot be empty';
    if (!draft.homeUrlId || !state.environments.some((environment) => environment.id === draft.homeUrlId)) {
      nextErrors.homeUrlId = 'Select an environment from the active organization';
    }
    setLocalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
  };

  if (loading && !state) {
    return <section className={styles.panel} aria-busy="true">Loading Bot Job metadata…</section>;
  }
  if (!state) {
    return (
      <section className={`${styles.panel} ${styles.unavailable}`}>
        <span>Bot Job metadata is unavailable.</span>
        <button type="button" onClick={onRetry} disabled={!connected}>Retry</button>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="Bot Job metadata">
      <div className={styles.headingRow}>
        <div>
          <h2 className={styles.title}>Job metadata</h2>
          <span className={styles.revision}>Metadata revision {state.metadataRevision}</span>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onRefreshEnvironments}
            disabled={!connected || busy || !state.capabilities.canUseWorkspaceActions}
          >
            Refresh environments
          </button>
          <button
            type="button"
            onClick={onOpenOrganizations}
            disabled={!connected || busy || !state.capabilities.canOpenOrganizations}
          >
            Manage environments
          </button>
          {!editing && <button type="button" className={styles.primary} onClick={beginEdit} disabled={!canEdit}>Edit</button>}
        </div>
      </div>

      {editing ? (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); save(); }}>
          <label className={styles.field}>
            Bot Job name
            <input
              value={draft.name}
              maxLength={100}
              disabled={busy || !connected || !state.capabilities.canEditMetadata}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
            {errors.name && <span className={styles.error} role="alert">{errors.name}</span>}
          </label>
          <label className={[styles.field, styles.contextField].join(' ')}>
            Project type
            <input value={state.projectType} readOnly aria-readonly="true" />
          </label>
          <label className={[styles.field, styles.contextField].join(' ')}>
            Organization
            <input value={state.organizationName || 'Unavailable'} readOnly aria-readonly="true" />
          </label>
          <label className={`${styles.field} ${styles.description}`}>
            Description
            <textarea
              value={draft.description}
              disabled={busy || !connected || !state.capabilities.canEditMetadata}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            Environment
            <select
              value={draft.homeUrlId || ''}
              disabled={busy || !connected || !state.capabilities.canEditMetadata || state.environments.length === 0}
              aria-invalid={Boolean(errors.homeUrlId)}
              onChange={(event) => setDraft((current) => ({ ...current, homeUrlId: Number(event.target.value) }))}
            >
              {state.environments.length === 0 && <option value="">No environments available</option>}
              {state.environments.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name} — {environment.url}
                </option>
              ))}
            </select>
            {errors.homeUrlId && <span className={styles.error} role="alert">{errors.homeUrlId}</span>}
          </label>
          <label className={[styles.field, styles.urlField].join(' ')}>
            Selected URL
            <input value={selectedEnvironment?.url || 'Unavailable'} readOnly aria-readonly="true" />
          </label>
          <div className={styles.formActions}>
            <button type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button
              type="submit"
              className={styles.primary}
              disabled={busy || !connected || !state.capabilities.canEditMetadata}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.summary}>
          <div><span>Name</span><strong>{state.name}</strong></div>
          <div><span>Project type</span><strong>{state.projectType}</strong></div>
          <div><span>Organization</span><strong>{state.organizationName || 'Unavailable'}</strong></div>
          <div><span>Environment</span><strong>{state.environmentName || 'Unavailable'}</strong></div>
          <div className={styles.wide}><span>URL</span><strong>{state.environmentUrl || 'Unavailable'}</strong></div>
          <div className={styles.wide}><span>Description</span><strong>{state.description || 'No description'}</strong></div>
        </div>
      )}
    </section>
  );
};

export default BotJobMetadataEditor;
