import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ComponentWorkspaceHeader from './ComponentWorkspaceHeader';

test('renders the detached Components title and closes only its page', () => {
  const onClose = jest.fn();
  render(
    <ComponentWorkspaceHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      connected
      status="Components loaded"
      onClose={onClose}
    />,
  );

  expect(screen.getByRole('heading', { name: 'Components' })).toBeInTheDocument();
  expect(screen.getByText('Saldo Banca Stato - Bot Job ID 5')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Components loaded');
  expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Hide Components' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('shows reconnecting status while the detached Components page is disconnected', () => {
  render(
    <ComponentWorkspaceHeader
      botJobId={5}
      botJobName="Saldo Banca Stato"
      connected={false}
      reconnectAttempts={2}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByRole('status')).toHaveTextContent('Reconnecting (2)');
});
