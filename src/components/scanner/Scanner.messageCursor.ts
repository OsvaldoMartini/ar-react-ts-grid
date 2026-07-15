export interface ScannerMessageCursorResult {
  pendingMessages: string[];
  nextProcessedCount: number;
}

export function scannerPendingMessages(
  messages: string[],
  processedCount: number,
): ScannerMessageCursorResult {
  const start = processedCount > messages.length ? 0 : Math.max(0, processedCount);
  return {
    pendingMessages: messages.slice(start),
    nextProcessedCount: messages.length,
  };
}
