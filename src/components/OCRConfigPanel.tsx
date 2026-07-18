import React, { useEffect, useMemo, useState } from 'react';
import { Eraser, Play, Save, Settings2, Trash2, X } from 'lucide-react';
import styles from './OCRConfigPanel.module.scss';

export type OCRProfile = {
  id: number;
  name: string;
  description?: string;
  homeBankingId?: number | null;
  homeUrlId?: number | null;
  default: boolean;
};

export type OCRParameter = {
  category: string;
  name: string;
  valueType: string;
  value: string;
  description?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
};

export type OCRConfigData = {
  profiles: OCRProfile[];
  activeProfileId?: number | null;
  categories: string[];
  parameters: OCRParameter[];
};

type Props = {
  data: OCRConfigData;
  busy?: boolean;
  error?: string;
  onSelect: (id: number) => void;
  onSave: (draft: {
    profileId?: number;
    name: string;
    description: string;
    parameters: OCRParameter[];
    asNew: boolean;
  }) => void;
  onDelete: (id: number) => void;
  onCleanup: () => void;
  onTest: (parameters: OCRParameter[]) => void;
  onClose: () => void;
};

const OCRConfigPanel: React.FC<Props> = ({
  data,
  busy,
  error,
  onSelect,
  onSave,
  onDelete,
  onCleanup,
  onTest,
  onClose,
}) => {
  const active = data.profiles.find(profile => profile.id === data.activeProfileId);
  const [name, setName] = useState(active?.name || '');
  const [description, setDescription] = useState(active?.description || '');
  const [parameters, setParameters] = useState(data.parameters);
  const [validation, setValidation] = useState('');

  useEffect(() => {
    setName(active?.name || '');
    setDescription(active?.description || '');
    setParameters(data.parameters);
    setValidation('');
  }, [active?.description, active?.id, active?.name, data.parameters]);

  const grouped = useMemo(() => data.categories.map(category => ({
    category,
    items: parameters.filter(parameter => parameter.category === category),
  })), [data.categories, parameters]);

  const update = (target: OCRParameter, value: string) => {
    setParameters(items => items.map(item => (
      item.category === target.category && item.name === target.name
        ? { ...item, value }
        : item
    )));
  };

  const submit = (asNew: boolean) => {
    if (!name.trim()) {
      setValidation('Profile name is required.');
      return;
    }
    onSave({
      profileId: active?.id,
      name: name.trim(),
      description: description.trim(),
      parameters,
      asNew,
    });
  };

  return (
    <section
      className={styles.panel}
      aria-label="OCR configuration"
      data-testid="ocr-config-workspace"
    >
      <header
        className={styles.header}
        data-testid="ocr-config-header"
      >
        <div className={styles.heading}>
          <Settings2 size={20} aria-hidden="true" />
          <span>
            <strong>OCR configuration</strong>
            <small>Profile and recognition controls</small>
          </span>
        </div>
        <button
          type="button"
          title="Close OCR configuration"
          aria-label="Close OCR configuration"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.layout}>
        <aside>
          <label>
            Profile
            <select value={active?.id || ''} onChange={event => onSelect(Number(event.target.value))}>
              {data.profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}{profile.default ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input value={name} onChange={event => setName(event.target.value)} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={event => setDescription(event.target.value)} />
          </label>
        </aside>
        <main>
          {grouped.map(group => (
            <section key={group.category}>
              <h3>{group.category.replace(/_/g, ' ')}</h3>
              <div className={styles.fields}>
                {group.items.map(parameter => (
                  <label key={`${parameter.category}.${parameter.name}`} title={parameter.description}>
                    <span>{parameter.name.replace(/_/g, ' ')}</span>
                    {parameter.options?.length ? (
                      <select value={parameter.value} onChange={event => update(parameter, event.target.value)}>
                        {parameter.options.map(value => <option key={value}>{value}</option>)}
                      </select>
                    ) : parameter.valueType === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={parameter.value === 'true'}
                        onChange={event => update(parameter, String(event.target.checked))}
                      />
                    ) : (
                      <input
                        type={parameter.min !== undefined ? 'number' : 'text'}
                        value={parameter.value}
                        min={parameter.min}
                        max={parameter.max}
                        step={parameter.step}
                        onChange={event => update(parameter, event.target.value)}
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      {(validation || error) && <p className={styles.error}>{validation || error}</p>}

      <footer>
        <button disabled={!active || active.default || busy} onClick={() => active && onDelete(active.id)}>
          <Trash2 size={15} aria-hidden="true" />Delete
        </button>
        <button disabled={busy} onClick={onCleanup}>
          <Eraser size={15} aria-hidden="true" />Clean orphans
        </button>
        <button disabled={busy} onClick={() => onTest(parameters)}>
          <Play size={15} aria-hidden="true" />Test current page
        </button>
        <span />
        <button disabled={busy} onClick={() => submit(true)}>Save as new</button>
        <button className={styles.primary} disabled={busy} onClick={() => submit(false)}>
          <Save size={15} aria-hidden="true" />Save
        </button>
      </footer>
    </section>
  );
};

export default OCRConfigPanel;
