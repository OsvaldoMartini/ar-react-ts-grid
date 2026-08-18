import { excelWriteCommandFlushBoundary, settleExcelWriteStopBoundary } from './excelWriteFlushBoundary';

test('recognizes only authored PAUSE and close-browser ExcelWriter save boundaries', () => {
  expect(excelWriteCommandFlushBoundary('pause')).toBe('PAUSE');
  expect(excelWriteCommandFlushBoundary('Q')).toBe('CLOSE_BROWSER');
  expect(excelWriteCommandFlushBoundary(' quit ')).toBe('CLOSE_BROWSER');
  expect(excelWriteCommandFlushBoundary('REFRESH')).toBeNull();
});

test('flushes ExcelWrite memory before stopping the active run', async () => {
  const order: string[] = [];
  const result = await settleExcelWriteStopBoundary(
    async () => { order.push('flush'); },
    async () => { order.push('stop'); },
  );
  expect(order).toEqual(['flush', 'stop']);
  expect(result).toEqual({ flushFailure: null, stopFailure: null });
});

test('still stops and reports both outcomes when the in-progress save fails', async () => {
  const order: string[] = [];
  const result = await settleExcelWriteStopBoundary(
    async () => { order.push('flush'); throw new Error('disk refused'); },
    async () => { order.push('stop'); throw new Error('stop refused'); },
  );
  expect(order).toEqual(['flush', 'stop']);
  expect(result.flushFailure?.message).toBe('disk refused');
  expect(result.stopFailure?.message).toBe('stop refused');
});
