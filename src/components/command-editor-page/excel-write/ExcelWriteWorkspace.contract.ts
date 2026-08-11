export type ExcelWriteFileType = '.xlsx' | '.csv';
export type ExcelWriteDelimiter = ',' | '|';

export interface ExcelWriteFileTarget {
  outputFile: string;
  directory: string;
  filename: string;
  fileType: ExcelWriteFileType;
  delimiter: ExcelWriteDelimiter;
  usageCount: number;
  legacy?: boolean;
}

export interface ExcelWriteWorkspaceResponse {
  ok: boolean;
  requestId: string;
  bindingEpoch: string;
  error?: string;
  message?: string;
  cancelled?: boolean;
  directory?: string;
  outputFile?: string;
  current?: ExcelWriteFileTarget;
  targets?: ExcelWriteFileTarget[];
}

export type ExcelWriteWorkspaceOperation =
  | 'excelWrite.bootstrap'
  | 'excelWrite.chooseDirectory'
  | 'excelWrite.validateTarget';

export interface ExcelWriteWorkspaceClient {
  connected: boolean;
  request: (
    operation: ExcelWriteWorkspaceOperation,
    body: Record<string, unknown>,
  ) => Promise<ExcelWriteWorkspaceResponse>;
}

export const parseExcelWriteTarget = (
  encoded: string,
  usageCount = 0,
  legacy = false,
): ExcelWriteFileTarget => {
  let value = String(encoded || '').trim().replace(/\\/g, '/');
  let delimiter: ExcelWriteDelimiter = ',';
  if (value.endsWith(':,') || value.endsWith(':|')) {
    delimiter = value.slice(-1) as ExcelWriteDelimiter;
    value = value.slice(0, -2);
  }
  const slash = value.lastIndexOf('/');
  const filename = slash >= 0 ? value.slice(slash + 1) : value;
  return {
    outputFile: encoded,
    directory: slash >= 0 ? value.slice(0, slash) : '',
    filename,
    fileType: filename.toLowerCase().endsWith('.csv') ? '.csv' : '.xlsx',
    delimiter,
    usageCount,
    legacy,
  };
};
