import {
  SCANNER_ACTION_COMMAND,
  SCANNER_ACTION_RESPONSE,
  SCANNER_BOOTSTRAP_COMMAND,
  SCANNER_BOOTSTRAP_RESPONSE,
  SCANNER_OPERATIONS,
  SCANNER_STATE_EVENT,
} from './Scanner.operations';

test('keeps scanner websocket command and operation ids stable', () => {
  expect(SCANNER_BOOTSTRAP_COMMAND).toBe('scanner.bootstrap');
  expect(SCANNER_ACTION_COMMAND).toBe('scanner.action');
  expect(SCANNER_BOOTSTRAP_RESPONSE).toBe('scanner.bootstrapResponse');
  expect(SCANNER_ACTION_RESPONSE).toBe('scanner.actionResponse');
  expect(SCANNER_STATE_EVENT).toBe('scanner.state');
  expect(SCANNER_OPERATIONS.has(SCANNER_BOOTSTRAP_RESPONSE)).toBe(true);
  expect(SCANNER_OPERATIONS.has(SCANNER_ACTION_RESPONSE)).toBe(true);
  expect(SCANNER_OPERATIONS.has(SCANNER_STATE_EVENT)).toBe(true);
});
