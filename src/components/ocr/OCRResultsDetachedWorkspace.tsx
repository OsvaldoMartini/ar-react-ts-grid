import React from 'react';
import DetachedPageShell from '../DetachedPageShell';
import OCRResultsWorkspace from './OCRResultsWorkspace';
import type { OcrWorkspaceRetarget } from './OCRWorkspace.contract';

type Props = {
  socketPort: number;
  sessionId: string;
  onWorkspaceRetarget: (target: OcrWorkspaceRetarget) => void;
  onClose?: () => void;
  onWorkspaceNotice?: (message: string) => void;
};

const OCRResultsDetachedWorkspace: React.FC<Props> = (props) => (
  <DetachedPageShell
    title="OCR Results"
    testId="ocr-results-window"
    onClose={undefined}
    showCloseButton={false}
  >
    <OCRResultsWorkspace {...props} />
  </DetachedPageShell>
);

export default OCRResultsDetachedWorkspace;
