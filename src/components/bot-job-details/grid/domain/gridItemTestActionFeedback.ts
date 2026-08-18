import type { BotJobWorkspaceStatusTone } from '../../BotJobDetails.types';
import type { GridItemTestActionResult } from '../hooks/useGridItemTestAction';

export type GridItemTestActionFeedback = {
  message: string;
  tone: BotJobWorkspaceStatusTone;
};

export const gridItemTestActionFeedback = (
  result: GridItemTestActionResult,
): GridItemTestActionFeedback => {
  const action = result.action === 'INPUT' ? 'Input' : 'Click';
  if (result.ok) {
    return { message: `${action} test passed`, tone: 'success' };
  }

  switch (result.code.trim().toUpperCase()) {
    case 'TIMEOUT':
      return { message: `${action} test timed out`, tone: 'error' };
    case 'DISCONNECTED':
      return { message: `${action} test disconnected`, tone: 'error' };
    case 'WORKSPACE_CHANGED':
      return { message: `${action} test cancelled`, tone: 'error' };
    case 'SEND_FAILED':
      return { message: `${action} test not sent`, tone: 'error' };
    default:
      return { message: `${action} test failed`, tone: 'error' };
  }
};
