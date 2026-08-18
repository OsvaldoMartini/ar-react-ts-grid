import { scannerControllerResetState } from './Scanner.controllerState';

test('returns loading reset state when scanner is enabled', () => {
  expect(scannerControllerResetState(true)).toEqual({
    loadingState: true,
    status: 'Loading scanner state',
    statusTone: 'neutral',
  });
});

test('returns ready reset state when scanner is disabled', () => {
  expect(scannerControllerResetState(false)).toEqual({
    loadingState: false,
    status: 'Ready',
    statusTone: 'neutral',
  });
});
