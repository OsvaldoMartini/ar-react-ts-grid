import { isPageScannerWorkspaceSession } from './Scanner.sessions';

/**
 * Detached Page Scanner generations are authorized by their backend coordinator.
 * Static scanner surfaces must assert the Bot Job workspace generation they were rendered for.
 */
export const pageScannerMemoryWorkspaceEpoch = (
  sessionId: string,
  workspaceEpoch: number,
): number | null => isPageScannerWorkspaceSession(sessionId)
  ? null
  : Number.isSafeInteger(workspaceEpoch) && workspaceEpoch > 0
    ? workspaceEpoch
    : 0;
