export type ExcelWriteStopBoundaryResult = Readonly<{
  flushFailure: Error | null;
  stopFailure: Error | null;
}>;

export type ExcelWriteCommandFlushBoundary = 'PAUSE' | 'CLOSE_BROWSER';

export const excelWriteCommandFlushBoundary = (action: string): ExcelWriteCommandFlushBoundary | null => {
  const canonical = action.trim().toLocaleUpperCase();
  if (canonical === 'PAUSE') return 'PAUSE';
  if (canonical === 'Q' || canonical === 'QUIT') return 'CLOSE_BROWSER';
  return null;
};

const asError = (failure: unknown, fallback: string): Error =>
  failure instanceof Error ? failure : new Error(fallback);

/** Flushes first, but always attempts terminal cleanup even when persistence fails. */
export const settleExcelWriteStopBoundary = async (
  flush: () => Promise<void>,
  stop: () => Promise<void>,
): Promise<ExcelWriteStopBoundaryResult> => {
  let flushFailure: Error | null = null;
  let stopFailure: Error | null = null;
  try {
    await flush();
  } catch (failure) {
    flushFailure = asError(failure, 'ExcelWrite in-progress save failed.');
  }
  try {
    await stop();
  } catch (failure) {
    stopFailure = asError(failure, 'Integration stop was not acknowledged.');
  }
  return Object.freeze({ flushFailure, stopFailure });
};
