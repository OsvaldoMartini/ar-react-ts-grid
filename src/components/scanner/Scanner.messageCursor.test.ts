import { scannerPendingMessages } from './Scanner.messageCursor';

test('returns messages after the processed cursor', () => {
  expect(scannerPendingMessages(['old', 'next', 'last'], 1)).toEqual({
    pendingMessages: ['next', 'last'],
    nextProcessedCount: 3,
  });
});

test('resets cursor when message list shrinks', () => {
  expect(scannerPendingMessages(['fresh'], 3)).toEqual({
    pendingMessages: ['fresh'],
    nextProcessedCount: 1,
  });
});

test('treats negative processed count as zero', () => {
  expect(scannerPendingMessages(['first', 'second'], -2)).toEqual({
    pendingMessages: ['first', 'second'],
    nextProcessedCount: 2,
  });
});
