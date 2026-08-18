import React, { useEffect, useState } from 'react';
import { FileSearch, FolderOpen, X } from 'lucide-react';
import styles from './PathSelectionPanel.module.scss';

export type PathSelectionMode = 'file' | 'directory';

type Props = {
  title: string;
  subtitle?: string;
  label: string;
  mode: PathSelectionMode;
  value: string;
  browsing?: boolean;
  onChange: (value: string) => void;
  onBrowse: (currentPath: string) => void;
  onApply: (value: string) => void;
  onClose: () => void;
};

const PathSelectionPanel: React.FC<Props> = ({
  title,
  subtitle,
  label,
  mode,
  value,
  browsing = false,
  onChange,
  onBrowse,
  onApply,
  onClose,
}) => {
  const [error, setError] = useState('');
  const Icon = mode === 'file' ? FileSearch : FolderOpen;

  useEffect(() => {
    if (value.trim()) setError('');
  }, [value]);

  const apply = () => {
    const selectedPath = value.trim();
    if (!selectedPath) {
      setError(`A ${mode === 'file' ? 'file' : 'folder'} path is required.`);
      return;
    }
    onApply(selectedPath);
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <Icon size={19} aria-hidden="true" />
          <span>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
          <button
            type="button"
            title="Close"
            aria-label="Close path selector"
            disabled={browsing}
            onClick={onClose}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.form}>
          <label>
            {label}
            <span className={styles.pathControl}>
              <input
                autoFocus
                aria-label={label}
                value={value}
                disabled={browsing}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    apply();
                  }
                }}
              />
              <button
                type="button"
                className={styles.browse}
                disabled={browsing}
                onClick={() => onBrowse(value.trim())}
              >
                <Icon size={16} aria-hidden="true" />
                {browsing ? 'Choosing...' : 'Browse'}
              </button>
            </span>
          </label>
          <p className={styles.hint}>
            Enter a path or use Browse to select it in Explorer.
          </p>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <footer>
          <button type="button" className={styles.cancel} disabled={browsing} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.apply} disabled={browsing} onClick={apply}>
            Use {mode === 'file' ? 'File' : 'Folder'}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default PathSelectionPanel;
