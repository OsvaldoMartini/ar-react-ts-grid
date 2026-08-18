import { fireEvent, render, screen } from '@testing-library/react';
import ScannerExecutionPanel from './ScannerExecutionPanel';
import { scannerState } from './Scanner.testUtils';

const state = scannerState({ blocks: [] });

test('sends scanner execution actions', () => {
  const onAction = jest.fn();
  render(<ScannerExecutionPanel connected scannerState={state} onAction={onAction} />);

  fireEvent.click(screen.getByRole('button', { name: 'Pre-Launch' }));
  fireEvent.click(screen.getByRole('button', { name: 'STOP' }));

  expect(onAction).toHaveBeenNthCalledWith(1, 'PRE_LAUNCH');
  expect(onAction).toHaveBeenNthCalledWith(2, 'STOP_PRE_LAUNCH');
});

test('blocks launch while execution is active but keeps STOP available', () => {
  render(<ScannerExecutionPanel connected scannerState={{ ...state, executionState: 'RUNNING' }} />);

  expect(screen.getByRole('button', { name: 'Pre-Launch' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'STOP' })).not.toBeDisabled();
});

test('disables execution controls without execution capability', () => {
  render(
    <ScannerExecutionPanel
      connected
      scannerState={{ ...state, capabilities: { ...state.capabilities, canExecute: false } }}
    />,
  );

  expect(screen.getByRole('button', { name: 'Pre-Launch' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'STOP' })).toBeDisabled();
});
