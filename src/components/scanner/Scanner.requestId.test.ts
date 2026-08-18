import { scannerRequestId } from './Scanner.requestId';

test('formats scanner request id with timestamp sequence and label', () => {
  expect(scannerRequestId(1720000000000, 3, 'page_scanner')).toBe('1720000000000-3-scanner-page_scanner');
});
