import React from 'react';
import DetachedPageShell from '../DetachedPageShell';
import OCRConfigWorkspace from './OCRConfigWorkspace';
import type { OcrWorkspaceRetarget } from './OCRWorkspace.contract';

type Props = {
  socketPort: number;
  sessionId: string;
  onWorkspaceRetarget: (target: OcrWorkspaceRetarget) => void;
  onClose?: () => void;
  onWorkspaceNotice?: (message: string) => void;
};

const OCRConfigDetachedWorkspace: React.FC<Props> = (props) => (
  <DetachedPageShell title="OCR Config" testId="ocr-config-window" onClose={props.onClose}>
    <OCRConfigWorkspace {...props} />
  </DetachedPageShell>
);

export default OCRConfigDetachedWorkspace;
