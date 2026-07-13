import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobDetailsHeader from './BotJobDetailsHeader';
import { botJobDetailsTestState as state } from './BotJobDetails.testData';

test('marks the current surface and dispatches React-owned workspace navigation', () => {
  const onAction = jest.fn();
  render(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="botJob"
      connected
      onAction={onAction}
    />,
  );

  expect(screen.getByRole('button', { name: 'Bot Job' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Pre Scan' }));
  expect(onAction).toHaveBeenCalledWith('SHOW_PRE_SCAN');
  fireEvent.click(screen.getByRole('button', { name: 'Components' }));
  expect(onAction).toHaveBeenCalledWith('SHOW_COMPONENTS');
});

test('keeps Close available while other workspace actions are pending', () => {
  render(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="preScan"
      connected
      pendingAction="REFRESH"
      onAction={jest.fn()}
    />,
  );

  screen.getAllByRole('button').forEach((button) => {
    if (button.textContent === 'Close') expect(button).toBeEnabled();
    else expect(button).toBeDisabled();
  });
  expect(screen.getByRole('button', { name: 'Refreshing…' })).toBeInTheDocument();
});

test('uses Execute All with green ALL mode by default and requires a numbered block for ONE', () => {
  const onToolbarAction = jest.fn();
  render(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="botJob"
      connected
      onAction={jest.fn()}
      jobState={state}
      pendingToolbarAction={null}
      onToolbarAction={onToolbarAction}
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

  expect(onToolbarAction).toHaveBeenCalledWith('TEST_RUN', { executionMode: 'ONE', blockId: 12 });

  fireEvent.change(blockSelect, { target: { value: 'all' } });
  expect(screen.getByRole('button', { name: 'Execution mode: ALL' })).toBeDisabled();
});

test('dispatches navigation, reload, launch, and terminal execution actions with proper gating', () => {
  const onToolbarAction = jest.fn();
  const view = render(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="botJob"
      connected
      onAction={jest.fn()}
      jobState={state}
      pendingToolbarAction={null}
      onToolbarAction={onToolbarAction}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Navigation time: 2 seconds' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reload blocks' }));
  fireEvent.click(screen.getByRole('button', { name: 'Launch' }));

  expect(onToolbarAction).toHaveBeenNthCalledWith(1, 'SET_NAVIGATION_TIME', { navigationTimeSeconds: 3 });
  expect(onToolbarAction).toHaveBeenNthCalledWith(2, 'REFRESH_BLOCKS');
  expect(onToolbarAction).toHaveBeenNthCalledWith(3, 'LAUNCH');

  view.rerender(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="botJob"
      connected
      onAction={jest.fn()}
      jobState={{ ...state, executionState: 'RUNNING' }}
      pendingToolbarAction={null}
      onToolbarAction={onToolbarAction}
    />,
  );
  expect(screen.getByRole('button', { name: 'Test run' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Navigation time/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(onToolbarAction).toHaveBeenLastCalledWith('STOP_TEST_RUN');
});

test('navigation time toggle cycles 0-10, wraps back to 0, and changes color band', () => {
  const onToolbarAction = jest.fn();
  render(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="botJob"
      connected
      onAction={jest.fn()}
      jobState={state}
      pendingToolbarAction={null}
      onToolbarAction={onToolbarAction}
    />,
  );

  // Fixture starts at 2 seconds (light-orange band).
  const toggle = () => screen.getByRole('button', { name: /Navigation time/ });
  expect(toggle()).toHaveTextContent('2s');
  expect(toggle()).toHaveClass('navTimeOrangeLight');

  // 2 -> 6 stays light orange; 7 -> 10 turns dark orange.
  for (let expected = 3; expected <= 10; expected += 1) {
    fireEvent.click(toggle());
    expect(onToolbarAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: expected });
    expect(toggle()).toHaveTextContent(`${expected}s`);
    expect(toggle()).toHaveClass(expected <= 6 ? 'navTimeOrangeLight' : 'navTimeOrangeDark');
  }

  // 10 wraps to 0, which is green.
  fireEvent.click(toggle());
  expect(onToolbarAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: 0 });
  expect(toggle()).toHaveTextContent('0s');
  expect(toggle()).toHaveClass('navTimeGreen');

  // 0 -> 1 stays green; 1 -> 2 returns to light orange.
  fireEvent.click(toggle());
  expect(onToolbarAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: 1 });
  expect(toggle()).toHaveClass('navTimeGreen');

  fireEvent.click(toggle());
  expect(onToolbarAction).toHaveBeenLastCalledWith('SET_NAVIGATION_TIME', { navigationTimeSeconds: 2 });
  expect(toggle()).toHaveClass('navTimeOrangeLight');
});

test('keeps prompt STOP available while TEST RUN startup is still pending', () => {
  const onToolbarAction = jest.fn();
  render(
    <BotJobDetailsHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      activeSurface="botJob"
      connected
      onAction={jest.fn()}
      jobState={state}
      pendingToolbarAction="TEST_RUN"
      operationBusy
      onToolbarAction={onToolbarAction}
    />,
  );

  expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Test run' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
  expect(onToolbarAction).toHaveBeenCalledWith('STOP_TEST_RUN');
});
