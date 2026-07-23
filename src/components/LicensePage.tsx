import React from 'react';
import DetachedPageShell from './DetachedPageShell';
import LicenseManager from './LicenseManager';

export const LICENSE_PAGE_SESSION_ID = 'licenseManager';

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

const LicensePage: React.FC<Props> = ({ socketPort, sessionId, onClose }) => (
  <DetachedPageShell
    title="License Manager"
    testId="license-manager-workspace"
    onClose={undefined}
    showCloseButton={false}
  >
    <LicenseManager
      socketPort={socketPort}
      sessionId={sessionId}
      onClose={onClose}
      detached
    />
  </DetachedPageShell>
);

export default LicensePage;
