import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobDataActions from './BotJobDataActions';
import { botJobDetailsTestState as state } from './BotJobDetails.testData';

afterEach(() => {
  jest.restoreAllMocks();
});

test('dispatches file operations and sends Excel overwrite confirmation', () => {
  const onAction = jest.fn();
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(
    <BotJobDataActions state={state} connected pendingAction={null} onAction={onAction} />,
  );

  fireEvent.click(screen.getByRole('button', { name: /Excel/ }));
  fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
  fireEvent.click(screen.getByRole('button', { name: /Report/ }));
  fireEvent.click(screen.getByRole('button', { name: /Create BAT/ }));

  expect(confirm).toHaveBeenCalledWith('Generate the Excel file? Existing job data may be replaced.');
  expect(onAction.mock.calls).toEqual([
    ['OPEN_EXCEL'],
    ['GENERATE_EXCEL', { confirmed: true }],
    ['OPEN_REPORT'],
    ['CREATE_BAT'],
  ]);
});

test('does not generate after cancellation and disables actions while another toolbar command is pending', () => {
  const onAction = jest.fn();
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  const view = render(
    <BotJobDataActions state={state} connected pendingAction={null} onAction={onAction} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
  expect(onAction).not.toHaveBeenCalled();

  view.rerender(
    <BotJobDataActions state={state} connected pendingAction="OPEN_REPORT" onAction={onAction} />,
  );
  screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
});
