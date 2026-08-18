import type { ExcelWriteManagerState } from './excelWriteManager';

export const EXCEL_WRITER_MANAGER_SESSION_ID = 'excelWriterManager';

export type ExcelWriterAuthority = {
  bindingEpoch: string;
  workspaceEpoch: number;
  homeBankingId: number;
  botJobId: number;
};

export type ExcelWriterManagerSnapshot = ExcelWriterAuthority & {
  state: ExcelWriteManagerState;
  busy: boolean;
  policyLocked: boolean;
};

export const isExcelWriterManagerSnapshot = (
  value: unknown,
  authority: ExcelWriterAuthority,
): value is ExcelWriterManagerSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.bindingEpoch === authority.bindingEpoch
    && candidate.workspaceEpoch === authority.workspaceEpoch
    && candidate.homeBankingId === authority.homeBankingId
    && candidate.botJobId === authority.botJobId
    && candidate.state !== null
    && typeof candidate.state === 'object'
    && typeof candidate.busy === 'boolean'
    && typeof candidate.policyLocked === 'boolean';
};
