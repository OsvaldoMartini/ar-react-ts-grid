import React from 'react';
import styles from './WorkspaceHeader.module.scss';

export type WorkspaceHeaderActionTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface WorkspaceHeaderAction<ActionId extends string = string> {
  id: ActionId;
  label: string;
  title?: string;
  tone?: WorkspaceHeaderActionTone;
  active?: boolean;
  disabled?: boolean;
}

interface WorkspaceHeaderProps<ActionId extends string = string> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  connected?: boolean;
  status?: string;
  statusTone?: 'neutral' | 'success' | 'warning' | 'error';
  actions?: WorkspaceHeaderAction<ActionId>[];
  onAction?: (actionId: ActionId) => void;
  compact?: boolean;
  className?: string;
}

function WorkspaceHeader<ActionId extends string = string>({
  eyebrow,
  title,
  subtitle,
  connected,
  status,
  statusTone = 'neutral',
  actions = [],
  onAction,
  compact = false,
  className,
}: WorkspaceHeaderProps<ActionId>): React.ReactElement {
  return (
  <header className={`${styles.header} ${compact ? styles.compact : ''} ${className || ''}`}>
    <div className={styles.identity}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {connected !== undefined && (
          <span className={`${styles.connection} ${connected ? styles.connected : styles.disconnected}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        )}
      </div>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>

    {status && (
      <div className={`${styles.status} ${styles[`status_${statusTone}`]}`} role="status">
        {status}
      </div>
    )}

    {actions.length > 0 && (
      <nav className={styles.actions} aria-label={`${title} actions`}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`${styles.actionButton} ${styles[`tone_${action.tone || 'default'}`]} ${action.active ? styles.active : ''}`}
            title={action.title || action.label}
            aria-pressed={action.active || undefined}
            disabled={action.disabled}
            onClick={() => onAction?.(action.id)}
          >
            {action.label}
          </button>
        ))}
      </nav>
    )}
  </header>
  );
}

export default WorkspaceHeader;
