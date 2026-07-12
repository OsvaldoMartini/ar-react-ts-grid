import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BotJobDetailsHeader from './BotJobDetailsHeader';

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
