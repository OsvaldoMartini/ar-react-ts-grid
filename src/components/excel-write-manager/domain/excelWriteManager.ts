import type { VariablesSmokeTestRuntimeValue, VariablesSmokeTestStep } from '../../variables/domain/variablesSmokeTestTypes';

export type ExcelWriteFlushPolicy = 'END_EXECUTION' | 'END_BLOCK';
export type ExcelWriteFileState = Readonly<{
  fileId: string; outputFile: string; displayName: string; finalFormat: 'CSV' | 'XLSX'; delimiter: ',' | '|';
  columns: readonly string[]; rows: readonly Readonly<Record<string, string>>[]; instructionIds: readonly number[];
  touchedBlockIds: readonly number[]; revision: number; dirty: boolean;
  flushState: 'MEMORY' | 'UPLOADING' | 'SAVED' | 'FAILED'; message: string;
}>;
export type ExcelWriteManagerState = Readonly<{ files: readonly ExcelWriteFileState[]; policy: ExcelWriteFlushPolicy }>;
export type ExcelWriteFinalizedArtifact = Readonly<{
  artifactKind: 'CSV' | 'XLSX';
  contentBase64: string;
  byteLength: number;
  sha256: string;
}>;
export const EMPTY_EXCEL_WRITE_MANAGER: ExcelWriteManagerState = Object.freeze({ files: Object.freeze([]), policy: 'END_EXECUTION' });

const parsedTarget = (encoded: string) => {
  const value = encoded.trim();
  const delimiter = value.endsWith(':|') ? '|' : ',';
  const path = value.endsWith(':|') || value.endsWith(':,') ? value.slice(0, -2) : value;
  const name = path.replace(/\\/g, '/').split('/').pop() || 'ExcelWrite.csv';
  return { delimiter: delimiter as ',' | '|', displayName: name,
    finalFormat: name.toLocaleLowerCase().endsWith('.xlsx') ? 'XLSX' as const : 'CSV' as const };
};
const fileId = (outputFile: string): string => outputFile.trim().replace(/\\/g, '/').toLocaleLowerCase();

export const arriveExcelWrite = (state: ExcelWriteManagerState, step: VariablesSmokeTestStep, rowIndex: number,
  runtimeValues: ReadonlyMap<number, VariablesSmokeTestRuntimeValue>): ExcelWriteManagerState => {
  if (!['E', 'EXCELWRITE'].includes(step.action.trim().toLocaleUpperCase())) return state;
  if (step.instructionId === null || step.blockId === null) throw new Error('ExcelWrite requires an authoritative instruction and Block ID.');
  const target = step.excelWrite;
  if (!target?.outputFile || !target.outputColumn) throw new Error(`ExcelWrite #${step.instructionId} has no complete instruction-owned file target.`);
  const variable = step.variables[0];
  if (!variable || variable.variableId === null) throw new Error(`ExcelWrite #${step.instructionId} has no READ variable.`);
  const runtime = runtimeValues.get(variable.variableId) ?? { state: variable.runtimeState, value: variable.runtimeRawValue };
  if (runtime.state !== 'VALUE') throw new Error(`ExcelWrite #${step.instructionId} cannot read VOID variable ${variable.variableName}.`);
  const id = fileId(target.outputFile); const existing = state.files.find(file => file.fileId === id); const parsed = parsedTarget(target.outputFile);
  if (existing && existing.delimiter !== parsed.delimiter) throw new Error('ExcelWrite instructions sharing one file must use the same delimiter.');
  const columns = existing?.columns.includes(target.outputColumn) ? existing.columns : Object.freeze([...(existing?.columns ?? []), target.outputColumn]);
  const rows = [...(existing?.rows ?? [])].map(row => ({ ...row })); while (rows.length <= rowIndex) rows.push({});
  rows[rowIndex][target.outputColumn] = runtime.value;
  const next: ExcelWriteFileState = Object.freeze({ fileId: id, outputFile: target.outputFile, displayName: parsed.displayName,
    finalFormat: parsed.finalFormat, delimiter: parsed.delimiter, columns: Object.freeze([...columns]), rows: Object.freeze(rows.map(row => Object.freeze({ ...row }))),
    instructionIds: Object.freeze(Array.from(new Set([...(existing?.instructionIds ?? []), step.instructionId]))),
    touchedBlockIds: Object.freeze(Array.from(new Set([...(existing?.touchedBlockIds ?? []), step.blockId]))), revision: (existing?.revision ?? 0) + 1,
    dirty: true, flushState: 'MEMORY', message: 'Held in React memory.' });
  return Object.freeze({ ...state, files: Object.freeze(existing ? state.files.map(file => file.fileId === id ? next : file) : [...state.files, next]) });
};

export const editExcelWriteCell = (state: ExcelWriteManagerState, fileIdValue: string, rowIndex: number, column: string, value: string): ExcelWriteManagerState => Object.freeze({
  ...state, files: Object.freeze(state.files.map(file => {
    if (file.fileId !== fileIdValue || !file.columns.includes(column) || !file.rows[rowIndex]) return file;
    const rows = file.rows.map((row, index) => index === rowIndex ? Object.freeze({ ...row, [column]: value }) : row);
    return Object.freeze({ ...file, rows: Object.freeze(rows), revision: file.revision + 1, dirty: true, flushState: 'MEMORY' as const, message: 'Edited in React memory.' });
  })),
});
export const markExcelWriteFile = (state: ExcelWriteManagerState, fileIdValue: string, flushState: ExcelWriteFileState['flushState'], message: string): ExcelWriteManagerState => Object.freeze({
  ...state, files: Object.freeze(state.files.map(file => file.fileId === fileIdValue ? Object.freeze({ ...file, flushState, dirty: flushState === 'SAVED' ? false : file.dirty, message }) : file)),
});
const spreadsheetSafe = (value: string): string => /^[=+\-@]/.test(value) ? `'${value}` : value;
const escaped = (rawValue: string, delimiter: string): string => {
  const value = spreadsheetSafe(rawValue);
  return !value.includes(delimiter) && !/["\r\n]/.test(value) ? value : `"${value.replace(/"/g, '""')}"`;
};
export const encodeExcelWriteCsv = (file: ExcelWriteFileState): string => `${[
  file.columns.map(column => escaped(column, file.delimiter)).join(file.delimiter),
  ...file.rows.map(row => file.columns.map(column => escaped(row[column] ?? '', file.delimiter)).join(file.delimiter)),
].join('\r\n')}\r\n`;
const bytesSha256 = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};
const bytesBase64 = (bytes: Uint8Array): string => {
  let encoded = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    encoded += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(encoded);
};
const finalized = async (artifactKind: 'CSV' | 'XLSX', bytes: Uint8Array): Promise<ExcelWriteFinalizedArtifact> => Object.freeze({
  artifactKind,
  contentBase64: bytesBase64(bytes),
  byteLength: bytes.byteLength,
  sha256: await bytesSha256(bytes),
});

export const buildExcelWriteArtifacts = async (file: ExcelWriteFileState): Promise<readonly ExcelWriteFinalizedArtifact[]> => {
  const csv = new TextEncoder().encode(encodeExcelWriteCsv(file));
  const csvArtifact = await finalized('CSV', csv);
  if (file.finalFormat === 'CSV') return Object.freeze([csvArtifact]);

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ExcelWrite');
  sheet.addRow([...file.columns]);
  file.rows.forEach(row => sheet.addRow(file.columns.map(column => row[column] ?? '')));
  file.columns.forEach((column, index) => {
    const maxValueLength = file.rows.reduce((length, row) => Math.max(length, (row[column] ?? '').length), column.length);
    sheet.getColumn(index + 1).width = Math.min(80, Math.max(10, maxValueLength + 2));
  });
  const workbookBuffer = await workbook.xlsx.writeBuffer();
  return Object.freeze([csvArtifact, await finalized('XLSX', new Uint8Array(workbookBuffer))]);
};
