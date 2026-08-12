import {
  excelWriterManagerChannelName,
  isExcelWriterManagerMessage,
} from './excelWriterManagerBridge';

test('isolates ExcelWriter messages by Bot Job owner', () => {
  expect(excelWriterManagerChannelName(5)).toBe('arweb.excel-writer-manager.5');
  expect(isExcelWriterManagerMessage({ type: 'SAVE', botJobId: 5 }, 5)).toBe(true);
  expect(isExcelWriterManagerMessage({ type: 'SAVE', botJobId: 32 }, 5)).toBe(false);
  expect(isExcelWriterManagerMessage(null, 5)).toBe(false);
});
