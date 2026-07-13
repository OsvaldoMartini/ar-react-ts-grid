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

  fireEvent.click(screen.getByRole('button', { name: 'Navigation time: 2 seconds' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reload blocks' }));
  fireEvent.click(screen.getByRole('button', { name: 'Launch' }));

  expect(onAction).toHaveBeenNthCalledWith(1, 'SET_NAVIGATION_TIME', { navigationTimeSeconds: 3 });
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
  expect(screen.getByRole('button', { name: /Navigation time/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(onAction).toHaveBeenLastCalledWith('STOP_TEST_RUN');
});

test('navigation time toggle cycles 0-10, wraps back to 0, and changes color band', () => {
  const onAction = jest.fn();
  render(
    <BotJobExecutionControls
      state={state}
      connected
      pendingAction={null}
      onAction={onAction}
    />,
  );

  // Fixture starts at 2 seconds (light-orange band).
  const toggle = () => screen.getByRole('button', { name: /Navigation time/ });
  expect(toggle()).toHaveTextContent('2s');
  expect(toggle()).toHaveClass('navTimeOrangeLight');

  // 2 -> 6 stays light orange; 7 -> 10 turns dark orange.
  for (let expected = 3; expected <= 10; expected += 1) {
    fireEvent.click(toggle());
    expect(onAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: expected });
    expect(toggle()).toHaveTextContent(`${expected}s`);
    expect(toggle()).toHaveClass(expected <= 6 ? 'navTimeOrangeLight' : 'navTimeOrangeDark');
  }

  // 10 wraps to 0, which is green.
  fireEvent.click(toggle());
  expect(onAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: 0 });
  expect(toggle()).toHaveTextContent('0s');
  expect(toggle()).toHaveClass('navTimeGreen');

  // 0 -> 1 stays green; 1 -> 2 returns to light orange.
  fireEvent.click(toggle());
  expect(onAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: 1 });
  expect(toggle()).toHaveClass('navTimeGreen');

  fireEvent.click(toggle());
  expect(onAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: 2 });
  expect(toggle()).toHaveClass('navTimeOrangeLight');
});

test('keeps prompt STOP available while TEST RUN startup is still pending', () => {
  const onAction = jest.fn();
  render(
    <BotJobExecutionControls
      state={state}
      connected
      pendingAction="TEST_RUN"
      busy
      onAction={onAction}
    />,
  );

  expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Test run' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(onAction).toHaveBeenCalledWith('STOP_TEST_RUN');
});
