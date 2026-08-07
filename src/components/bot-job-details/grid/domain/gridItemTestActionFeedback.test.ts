import type { GridItemTestActionResult } from '../hooks/useGridItemTestAction';
import { gridItemTestActionFeedback } from './gridItemTestActionFeedback';

const result = (
  overrides: Partial<GridItemTestActionResult>,
): GridItemTestActionResult => ({
  ok: false,
  requestId: 'request-1',
  instructionId: 1728,
  action: 'INPUT',
  message: '',
  error: '',
  code: '',
  valueSource: '',
  datasetMode: '',
  excelRowIndex: null,
  column: '',
  ...overrides,
});

test('maps successful input and click tests to short success statuses', () => {
  expect(gridItemTestActionFeedback(result({ ok: true }))).toEqual({
    message: 'Input test passed',
    tone: 'success',
  });
  expect(gridItemTestActionFeedback(result({ ok: true, action: 'CLICK' }))).toEqual({
    message: 'Click test passed',
    tone: 'success',
  });
});

test.each([
  ['TIMEOUT', 'Input test timed out'],
  ['DISCONNECTED', 'Input test disconnected'],
  ['WORKSPACE_CHANGED', 'Input test cancelled'],
  ['SEND_FAILED', 'Input test not sent'],
  ['INPUT_FAILED', 'Input test failed'],
])('maps %s to a short red error status', (code, message) => {
  expect(gridItemTestActionFeedback(result({ code }))).toEqual({
    message,
    tone: 'error',
  });
});
