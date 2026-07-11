import { useCallback } from 'react';

export type InstructionMoveRow = {
  id: number;
  blockId: number;
  instructionOrderNumber: number;
};

type MoveContext = {
  webSocket: WebSocket | null;
  connected: boolean;
  graphRevision: string;
  botJobId: number | null;
  botJobName: string | null;
  homeBankingId: number;
  targetSessionId: 'botJobTasks' | 'componentTasks';
};

export const useInstructionDrag = (context: MoveContext) => useCallback((
  rows: InstructionMoveRow[],
  deleteBlockId: number,
  requestLabel = 'row-move',
) => {
  if (!context.webSocket || !context.connected || !context.graphRevision) return null;
  const requestId = `${Date.now()}-${context.targetSessionId}-${requestLabel}`;
  context.webSocket.send(JSON.stringify({
    type: 'ROW_MOVE',
    requestId,
    graphRevision: context.graphRevision,
    botJobId: context.botJobId,
    botJobName: context.botJobName,
    deleteBlockId,
    homeBankingId: context.homeBankingId,
    sessionId: context.targetSessionId,
    updatedRows: rows.map(row => ({
      blockId: row.blockId,
      instructionId: row.id,
      instructionOrderNumber: row.instructionOrderNumber,
    })),
  }));
  return requestId;
}, [context]);
