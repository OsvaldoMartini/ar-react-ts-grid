import { EMPTY_EXCEL_WRITE_MANAGER, arriveExcelWrite, editExcelWriteCell, encodeExcelWriteCsv } from './excelWriteManager';
import type { VariablesSmokeTestStep } from '../../variables/domain/variablesSmokeTestTypes';
const step = (instructionId: number, column: string, outputFile = 'C:/exports/report.xlsx:,'): VariablesSmokeTestStep => ({
  key: String(instructionId), instructionId, instructionName: 'ExcelWrite', action: 'E', operation: '', onHoldSeconds: null,
  blockId: instructionId, blockName: `Block ${instructionId}`, blockOrder: instructionId, instructionOrder: 1, active: true,
  comparisonOperator: null, comparisonFormatPolicy: 'EXACT_TEXT', connections: [], variables: [{ slot: 'PRIMARY', variableId: instructionId,
    variableName: column, runtimeState: 'VALUE', runtimeRawValue: '', displayValue: '' }], excelWrite: { outputKey: column, outputColumn: column, outputFile } });
test('groups instructions by exact target and preserves first-arrival column and row order', () => {
  const first = arriveExcelWrite(EMPTY_EXCEL_WRITE_MANAGER, step(1, 'User'), 0, new Map([[1, { state: 'VALUE' as const, value: 'Alice' }]]));
  const second = arriveExcelWrite(first, step(2, 'Balance'), 0, new Map([[2, { state: 'VALUE' as const, value: '10' }]]));
  const third = arriveExcelWrite(second, step(1, 'User'), 1, new Map([[1, { state: 'VALUE' as const, value: 'Bob' }]]));
  expect(third.files).toHaveLength(1); expect(third.files[0].columns).toEqual(['User', 'Balance']);
  expect(third.files[0].rows).toEqual([{ User: 'Alice', Balance: '10' }, { User: 'Bob' }]); expect(third.files[0].instructionIds).toEqual([1, 2]);
});
test('edits memory and encodes deterministic escaped CSV', () => {
  const arrived = arriveExcelWrite(EMPTY_EXCEL_WRITE_MANAGER, step(1, 'User', 'C:/exports/report.csv:|'), 0, new Map([[1, { state: 'VALUE' as const, value: 'A|B' }]]));
  const edited = editExcelWriteCell(arrived, arrived.files[0].fileId, 0, 'User', 'A"B');
  expect(encodeExcelWriteCsv(edited.files[0])).toBe('User\r\n"A""B"\r\n'); expect(edited.files[0].dirty).toBe(true);
});
test('neutralizes spreadsheet formulas in generated CSV cells', () => {
  const arrived = arriveExcelWrite(EMPTY_EXCEL_WRITE_MANAGER, step(1, 'Value'), 0,
    new Map([[1, { state: 'VALUE' as const, value: '=HYPERLINK("https://example.invalid")' }]]));
  expect(encodeExcelWriteCsv(arrived.files[0])).toBe('Value\r\n"\'=HYPERLINK(""https://example.invalid"")"\r\n');
});
test('refuses incomplete target and VOID variables', () => {
  expect(() => arriveExcelWrite(EMPTY_EXCEL_WRITE_MANAGER, { ...step(1, 'User'), excelWrite: null }, 0, new Map())).toThrow(/file target/);
  expect(() => arriveExcelWrite(EMPTY_EXCEL_WRITE_MANAGER, step(1, 'User'), 0, new Map([[1, { state: 'VOID' as const, value: '' }]]))).toThrow(/VOID/);
});
