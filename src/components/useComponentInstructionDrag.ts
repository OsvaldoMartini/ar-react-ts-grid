import { useCallback } from 'react';

export type ComponentInstructionMoveRow = {
  id: number;
  blockId: number;
  instructionOrderNumber: number;
};

type ComponentMoveContext = {
  webSocket: WebSocket | null;
  connected: boolean;
  graphRevision: string;
  botJobId: number | null;
  botJobName: string | null;
  homeBankingId: number;
};

/**
 * Row-move submitter for the COMPONENTS workspace ONLY. Deliberately separated from the
 * Bot Job grid's useInstructionDrag: it sends the dedicated COMPONENT_ROW_MOVE verb, which
 * the backend routes to ComponentRowMoveService (component_instruction/component_block,
 * home_banking_id scope). Duplicated by design so neither workspace can regress the other.
 */
export const useComponentInstructionDrag = (context: ComponentMoveContext) => useCallback((
  rows: ComponentInstructionMoveRow[],
  deleteBlockId: number,
  requestLabel = 'row-move',
) => {
  if (!context.webSocket || !context.connected || !context.graphRevision) return null;
  const requestId = `${Date.now()}-componentTasks-${requestLabel}`;
  try {
    context.webSocket.send(JSON.stringify({
    type: 'COMPONENT_ROW_MOVE',
    requestId,
    graphRevision: context.graphRevision,
    botJobId: context.botJobId,
    botJobName: context.botJobName,
    deleteBlockId,
    homeBankingId: context.homeBankingId,
    sessionId: 'componentTasks',
    updatedRows: rows.map(row => ({
      blockId: row.blockId,
      instructionId: row.id,
      instructionOrderNumber: row.instructionOrderNumber,
    })),
    }));
    return requestId;
  } catch (_) {
    return null;
  }
}, [context]);
