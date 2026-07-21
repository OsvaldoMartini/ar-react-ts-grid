import { canStartCommandApply, resolveCommandApplyResponse } from './commandApplyResponse';

test('ignores a response that does not match the pending Add Command request', () => {
  expect(resolveCommandApplyResponse('request-2', { requestId: 'request-1', ok: true })).toEqual({ kind: 'ignore' });
});

test('keeps a matching backend failure available for the professional error message', () => {
  expect(resolveCommandApplyResponse('request-1', {
    requestId: 'request-1',
    ok: false,
    error: 'Select a compatible Web Field.',
  })).toEqual({ kind: 'failure', error: 'Select a compatible Web Field.' });
});

test('treats a malformed matching response as a failure instead of closing the panel', () => {
  expect(resolveCommandApplyResponse('request-1', { requestId: 'request-1' })).toEqual({
    kind: 'failure',
    error: 'The command could not be saved.',
  });
});

test('accepts only the matching successful instruction snapshot', () => {
  const instructions = [{ id: 44, actions: 'LOOP' }];
  expect(resolveCommandApplyResponse('request-1', {
    requestId: 'request-1',
    ok: true,
    instructions,
  })).toEqual({ kind: 'success', instructions });
});

test('blocks a second Apply while the first request is pending', () => {
  expect(canStartCommandApply(null)).toBe(true);
  expect(canStartCommandApply('request-1')).toBe(false);
});
