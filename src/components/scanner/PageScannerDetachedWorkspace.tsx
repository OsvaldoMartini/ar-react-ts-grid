import React from 'react';
import GridItemScann, { type GridItemScannProps } from '../GridItemScann';
import DetachedPageShell from '../DetachedPageShell';

type PageScannerDetachedWorkspaceProps = Omit<GridItemScannProps, 'mode'>;

const PageScannerDetachedWorkspace: React.FC<PageScannerDetachedWorkspaceProps> = (props) => (
  <DetachedPageShell title="Page Scanner" testId="detached-page-scanner-workspace" onClose={props.onDetachedClose}>
    <GridItemScann {...props} mode="preScan" />
  </DetachedPageShell>
);

export default PageScannerDetachedWorkspace;
