import { useCallback } from 'react';

export type InstructionMoveRow = {
  id: number;
  blockId: number;
  blockOrderNumber: number;
  instructionOrderNumber: number;
  parentId?: number | null;
  parentBlockId?: number | null;
};

type MoveContext = {
  webSocket: WebSocket | null;
  connected: boolean;
  graphRevision: string;
  botJobId: number | null;
  botJobName: string | null;
  homeBankingId: number;
};

export const useInstructionDrag = (context: MoveContext) => useCallback((
  rows: InstructionMoveRow[],
  deleteBlockId: number,
  requestLabel = 'row-move',
) => {
  if (!context.webSocket || !context.connected || !context.graphRevision) return null;
  const requestId = `${Date.now()}-botJobTasks-${requestLabel}`;
  try {
    context.webSocket.send(JSON.stringify({
    type: 'ROW_MOVE',
    requestId,
    graphRevision: context.graphRevision,
    botJobId: context.botJobId,
    botJobName: context.botJobName,
    deleteBlockId,
    homeBankingId: context.homeBankingId,
    sessionId: 'botJobTasks',
    rowMoveLayoutVersion: 2,
    updatedRows: rows.map(row => ({
      blockId: row.blockId,
      instructionId: row.id,
      blockOrderNumber: row.blockOrderNumber,
      instructionOrderNumber: row.instructionOrderNumber,
      parentId: row.parentId ?? null,
      parentBlockId: row.parentBlockId ?? null,
    })),
    }));
    return requestId;
  } catch (_) {
    return null;
  }
}, [context]);
