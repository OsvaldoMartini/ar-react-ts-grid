import { isExcelWriterManagerSnapshot } from './excelWriterManagerBridge';

const authority = { bindingEpoch: 'binding-1', workspaceEpoch: 4, homeBankingId: 2, botJobId: 5 };

test('accepts ExcelWriter state only for the exact workspace owner', () => {
  const snapshot = {
    ...authority,
    state: { files: [], policy: 'END_EXECUTION' },
    busy: false,
    policyLocked: false,
  };
  expect(isExcelWriterManagerSnapshot(snapshot, authority)).toBe(true);
  expect(isExcelWriterManagerSnapshot({ ...snapshot, botJobId: 32 }, authority)).toBe(false);
});
