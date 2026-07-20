import React from 'react';
import GridItemScann, { type GridItemScannProps } from '../GridItemScann';

type PageScannerWorkspaceProps = Omit<GridItemScannProps, 'mode'>;

const PageScannerWorkspace: React.FC<PageScannerWorkspaceProps> = (props) => (
  <GridItemScann {...props} mode="preScan" />
);

export default PageScannerWorkspace;
