import { scannerTransportMessage } from './Scanner.transport';

test('serializes scanner websocket envelope with string body', () => {
  const raw = scannerTransportMessage('scanner.action', 'scannerGrid', 2, {
    requestId: 'action-1',
    botJobId: 42,
    action: 'PAGE_SCANNER',
    searchTerms: 'input, button',
  });

  const parsed = JSON.parse(raw);

  expect(parsed).toMatchObject({
    type: 'scanner.action',
    sessionId: 'scannerGrid',
    homeBankingId: 2,
  });
  expect(JSON.parse(parsed.body)).toEqual({
    requestId: 'action-1',
    botJobId: 42,
    action: 'PAGE_SCANNER',
    searchTerms: 'input, button',
  });
});
