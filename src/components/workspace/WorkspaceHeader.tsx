import React from 'react';
import WorkspaceHeaderActionScroller from './WorkspaceHeaderActionScroller';
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
  /** Arbitrary extra content rendered inline inside the actions row. */
  extraActions?: React.ReactNode;
  /** Action id the extraActions content is inserted immediately before; appended at the end when omitted. */
  extraActionsBeforeId?: ActionId;
  /** Keeps actions on one horizontal lane and adds overflow navigation when space is limited. */
  scrollableActions?: boolean;
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
  extraActions,
  extraActionsBeforeId,
  scrollableActions = false,
}: WorkspaceHeaderProps<ActionId>): React.ReactElement {
  const actionContent = (
    <>
      {actions.map((action) => (
        <React.Fragment key={action.id}>
          {extraActions && extraActionsBeforeId === action.id && extraActions}
          <button
            type="button"
            className={`${styles.actionButton} ${styles[`tone_${action.tone || 'default'}`]} ${action.active ? styles.active : ''}`}
            title={action.title || action.label}
            aria-pressed={action.active || undefined}
            disabled={action.disabled}
            onClick={() => onAction?.(action.id)}
          >
            {action.label}
          </button>
        </React.Fragment>
      ))}
      {extraActions && extraActionsBeforeId === undefined && extraActions}
    </>
  );

  return (
  <header
    className={`${styles.header} ${compact ? styles.compact : ''} ${className || ''}`}
    data-floating-workspace-drag-handle
  >
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

    {(actions.length > 0 || extraActions) && (
      scrollableActions ? (
        <WorkspaceHeaderActionScroller
          ariaLabel={`${title} actions`}
          navClassName={styles.actions}
        >
          {actionContent}
        </WorkspaceHeaderActionScroller>
      ) : (
        <nav className={styles.actions} aria-label={`${title} actions`}>
          {actionContent}
        </nav>
      )
    )}
  </header>
  );
}

export default WorkspaceHeader;
