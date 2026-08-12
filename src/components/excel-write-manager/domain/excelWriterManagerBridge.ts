import type {
  ExcelWriteFlushPolicy,
  ExcelWriteManagerState,
} from './excelWriteManager';

export const EXCEL_WRITER_MANAGER_SESSION_ID = 'excelWriterManager';

export type ExcelWriterManagerSnapshot = {
  type: 'STATE';
  homeBankingId: number;
  botJobId: number;
  state: ExcelWriteManagerState;
  busy: boolean;
  policyLocked: boolean;
};

export type ExcelWriterManagerCommand =
  | { type: 'REQUEST_STATE'; botJobId: number }
  | { type: 'POLICY_CHANGE'; botJobId: number; policy: ExcelWriteFlushPolicy }
  | { type: 'CELL_CHANGE'; botJobId: number; fileId: string; rowIndex: number; column: string; value: string }
  | { type: 'SAVE'; botJobId: number };

export type ExcelWriterManagerBridgeMessage =
  | ExcelWriterManagerSnapshot
  | ExcelWriterManagerCommand;

export const excelWriterManagerChannelName = (botJobId: number): string =>
  `arweb.excel-writer-manager.${botJobId}`;

export const isExcelWriterManagerMessage = (
  value: unknown,
  botJobId: number,
): value is ExcelWriterManagerBridgeMessage => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.botJobId === botJobId && typeof candidate.type === 'string';
};
