import React from 'react';
import DesktopWorkspaceShell from './workspace/DesktopWorkspaceShell';
import styles from './DetachedPageShell.module.scss';

type Props = {
  title: string;
  testId: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  children?: React.ReactNode;
};

const DetachedPageShell: React.FC<Props> = ({ title, testId, onClose, showCloseButton = true, children }) => (
  <DesktopWorkspaceShell ariaLabel={title} testId={testId}>
    <section className={styles.page}>
      {showCloseButton && onClose && (
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close"
          title="Close"
          onClick={onClose}
        >
          Close
        </button>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  </DesktopWorkspaceShell>
);

export default DetachedPageShell;
