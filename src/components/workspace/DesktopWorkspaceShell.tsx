import React from 'react';
import FloatingWorkspaceFrame from './FloatingWorkspaceFrame';
import styles from './DesktopWorkspaceShell.module.scss';

interface DesktopWorkspaceShellProps {
  ariaLabel: string;
  testId: string;
  children: React.ReactNode;
}

const initialWorkspacePosition = () => {
  const width = Math.min(1240, Math.max(0, window.innerWidth - 32));
  const height = Math.min(820, Math.max(0, window.innerHeight - 32));
  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
  };
};

const desktopShellPosition = () => ({ x: 0, y: 0 });

/** Shared outer-window template for Bot Job, Components, and scanner workspaces. */
const DesktopWorkspaceShell: React.FC<DesktopWorkspaceShellProps> = ({
  ariaLabel,
  testId,
  children,
}) => {
  const desktopShell = new URLSearchParams(window.location.search).get('desktopShell') === '1';

  return (
    <main className={`${styles.shell} ${desktopShell ? styles.desktopShell : ''}`}>
      <FloatingWorkspaceFrame
        className={`${styles.window} ${desktopShell ? styles.desktopShellWindow : ''}`}
        initialPosition={desktopShell ? desktopShellPosition : initialWorkspacePosition}
        edgeMargin={desktopShell ? 0 : 8}
        dragEnabled={!desktopShell}
        aria-label={ariaLabel}
        data-testid={testId}
      >
        <div className={styles.content}>{children}</div>
      </FloatingWorkspaceFrame>
    </main>
  );
};

export default DesktopWorkspaceShell;
