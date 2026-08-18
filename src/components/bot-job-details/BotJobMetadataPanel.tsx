import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { BotJobDetailsState, BotJobMetadataDraft } from './BotJobDetails.types';
import styles from './BotJobMetadataPanel.module.scss';

interface BotJobMetadataPanelProps {
  state: BotJobDetailsState | null;
  saving: boolean;
  fieldErrors: Record<string, string>;
  onSave: (draft: BotJobMetadataDraft) => void;
  onRefresh: () => void;
}

interface MetadataFormState {
  name: string;
  description: string;
  homeUrlId: number;
}

function formFromState(state: BotJobDetailsState | null): MetadataFormState {
  return {
    name: state?.name ?? '',
    description: state?.description ?? '',
    homeUrlId: state?.homeUrlId ?? 0,
  };
}

const BotJobMetadataPanel: React.FC<BotJobMetadataPanelProps> = ({
  state,
  saving,
  fieldErrors,
  onSave,
  onRefresh,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MetadataFormState>(() => formFromState(state));
  const canEdit = Boolean(state?.capabilities.canEditMetadata);
  const environments = useMemo(() => state?.environments ?? [], [state?.environments]);
  const selectedEnvironment = environments.find((environment) => environment.id === draft.homeUrlId);

  useEffect(() => {
    if (!editing) setDraft(formFromState(state));
  }, [editing, state]);

  const updateDraft = <Key extends keyof MetadataFormState>(key: Key, value: MetadataFormState[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    if (!state) return;
    onSave({
      expectedMetadataRevision: state.metadataRevision,
      name: draft.name.trim(),
      description: draft.description.trim(),
      homeUrlId: draft.homeUrlId,
    });
    setEditing(false);
  };

  const environmentName = selectedEnvironment?.name || state?.environmentName || 'No environment';
  const selectedUrl = selectedEnvironment?.url || state?.environmentUrl || '';

  return (
    <section className={styles.panel} aria-label="Bot Job metadata">
      {!editing ? (
        <>
          <div className={styles.summary}>
            <div className={styles.primary}>
              <span className={styles.label}>Name</span>
              <strong>{state?.name || 'Unnamed Bot Job'}</strong>
            </div>
            <div>
              <span className={styles.label}>Environment</span>
              <span>{environmentName}</span>
            </div>
            <div>
              <span className={styles.label}>Organization</span>
              <span>{state?.organizationName || 'No organization'}</span>
            </div>
            {state?.description && (
              <div className={styles.descriptionSummary}>
                <span className={styles.label}>Description</span>
                <span>{state.description}</span>
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.iconButton} title="Refresh environments" aria-label="Refresh environments" disabled={!state || saving} onClick={onRefresh}>
              <RefreshCw size={15} aria-hidden="true" />
            </button>
            {canEdit && (
              <button type="button" className={styles.primaryButton} disabled={saving} onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </div>
        </>
      ) : (
        <form className={styles.editor} onSubmit={(event) => {
          event.preventDefault();
          save();
        }}>
          <div className={styles.formGrid}>
            <label>
              <span>Bot Job name</span>
              <input
                name="botJobName"
                value={draft.name}
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.name) || undefined}
                onChange={(event) => updateDraft('name', event.target.value)}
              />
              {fieldErrors.name && <small>{fieldErrors.name}</small>}
            </label>
            <label>
              <span>Project type</span>
              <input value={state?.projectType ?? ''} readOnly />
            </label>
            <label>
              <span>Organization</span>
              <input value={state?.organizationName ?? ''} readOnly />
            </label>
            <label>
              <span>Environment</span>
              <select
                name="homeUrlId"
                value={draft.homeUrlId}
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.homeUrlId) || undefined}
                onChange={(event) => updateDraft('homeUrlId', Number(event.target.value))}
              >
                {environments.length === 0 && <option value={0}>No environment</option>}
                {environments.map((environment) => (
                  <option key={environment.id} value={environment.id}>
                    {environment.name}
                  </option>
                ))}
              </select>
              {fieldErrors.homeUrlId && <small>{fieldErrors.homeUrlId}</small>}
            </label>
            <label>
              <span>Selected URL</span>
              <input value={selectedUrl} readOnly />
            </label>
            <label className={styles.description}>
              <span>Description</span>
              <textarea
                name="botJobDescription"
                value={draft.description}
                disabled={saving}
                rows={2}
                onChange={(event) => updateDraft('description', event.target.value)}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving || !draft.name.trim()}>
              Save
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default BotJobMetadataPanel;
