import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobExecutionControls from './BotJobExecutionControls';
import { botJobDetailsTestState as state } from './BotJobDetails.testData';

test('uses Execute All with green ALL mode by default and requires a numbered block for ONE', () => {
  const onAction = jest.fn();
  render(
    <BotJobExecutionControls
      state={state}
      connected
      pendingAction={null}
      onAction={onAction}
    />,
  );

  const blockSelect = screen.getByLabelText('Starting block');
  expect(blockSelect).toHaveValue('all');
  expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Execute All',
    '1 - Login',
    '2 - Payment',
  ]);
  expect(screen.getByRole('button', { name: 'Execution mode: ALL' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Execution mode: ALL' })).toHaveClass('modeAll');

  fireEvent.change(blockSelect, { target: { value: '12' } });
  fireEvent.click(screen.getByRole('button', { name: 'Execution mode: ALL' }));
  expect(screen.getByRole('button', { name: 'Execution mode: ONE' })).toHaveTextContent('ONE');
  expect(screen.getByRole('button', { name: 'Execution mode: ONE' })).toHaveClass('modeOne');
  fireEvent.click(screen.getByRole('button', { name: 'Test run' }));

  expect(onAction).toHaveBeenCalledWith('TEST_RUN', { executionMode: 'ONE', blockId: 12 });

  fireEvent.change(blockSelect, { target: { value: 'all' } });
  expect(screen.getByRole('button', { name: 'Execution mode: ALL' })).toBeDisabled();
});

test('dispatches navigation, reload, launch, and terminal execution actions with proper gating', () => {
  const onAction = jest.fn();
  const view = render(
    <BotJobExecutionControls
      state={state}
      connected
      pendingAction={null}
      onAction={onAction}
    />,
  );

  fireEvent.change(screen.getByLabelText('Navigation time'), { target: { value: '7' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reload blocks' }));
  fireEvent.click(screen.getByRole('button', { name: 'Launch' }));

  expect(onAction).toHaveBeenNthCalledWith(1, 'SET_NAVIGATION_TIME', { navigationTimeSeconds: 7 });
  expect(onAction).toHaveBeenNthCalledWith(2, 'REFRESH_BLOCKS');
  expect(onAction).toHaveBeenNthCalledWith(3, 'LAUNCH');

  view.rerender(
    <BotJobExecutionControls
      state={{ ...state, executionState: 'RUNNING' }}
      connected
      pendingAction={null}
      onAction={onAction}
    />,
  );
  expect(screen.getByRole('button', { name: 'Test run' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(onAction).toHaveBeenLastCalledWith('STOP_TEST_RUN');
});
