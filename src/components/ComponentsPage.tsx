import React from 'react';
import DetachedPageShell from './DetachedPageShell';
import GridItemComp, { type GridItemCompProps } from './GridItemComp';
import styles from './ComponentsPage.module.scss';

type ComponentsPageProps = Omit<GridItemCompProps, 'onDetachedClose'> & {
  onClose?: () => void;
};

const ComponentsPage: React.FC<ComponentsPageProps> = ({ onClose, ...gridProps }) => (
  <DetachedPageShell
    title="Components"
    testId="components-page"
    onClose={undefined}
    showCloseButton={false}
  >
    <div className={styles.frame}>
      <GridItemComp
        {...gridProps}
        onDetachedClose={onClose}
      />
    </div>
  </DetachedPageShell>
);

export default ComponentsPage;
