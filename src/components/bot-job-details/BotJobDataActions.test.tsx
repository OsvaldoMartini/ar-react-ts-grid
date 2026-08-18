import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import BotJobDataActions from './BotJobDataActions';
import { botJobDetailsTestState as state } from './BotJobDetails.testData';

afterEach(() => {
  jest.restoreAllMocks();
});

test('dispatches file operations after the React Excel overwrite confirmation', () => {
  const onAction = jest.fn();
  const confirm = jest.spyOn(window, 'confirm');
  render(
    <BotJobDataActions state={state} connected pendingAction={null} onAction={onAction} />,
  );

  fireEvent.click(screen.getByRole('button', { name: /Excel/ }));
  fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
  const confirmation = screen.getByRole('dialog', { name: 'Generate Excel file?' });
  expect(confirmation).toBeInTheDocument();
  expect(screen.getByText('Existing job data may be replaced.')).toBeInTheDocument();
  expect(onAction).toHaveBeenCalledTimes(1);
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Generate' }));
  fireEvent.click(screen.getByRole('button', { name: /Report/ }));
  fireEvent.click(screen.getByRole('button', { name: /Create BAT/ }));

  expect(confirm).not.toHaveBeenCalled();
  expect(onAction.mock.calls).toEqual([
    ['OPEN_EXCEL'],
    ['GENERATE_EXCEL', { confirmed: true }],
    ['OPEN_REPORT'],
    ['CREATE_BAT'],
  ]);
});

test('does not generate after cancellation and disables actions while another toolbar command is pending', () => {
  const onAction = jest.fn();
  const view = render(
    <BotJobDataActions state={state} connected pendingAction={null} onAction={onAction} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onAction).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  view.rerender(
    <BotJobDataActions state={state} connected pendingAction="OPEN_REPORT" onAction={onAction} />,
  );
  screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
});
