import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkspaceHeader from './WorkspaceHeader';

test('renders identity, connection, status, and dispatches one typed action', () => {
  const onAction = jest.fn();
  render(
    <WorkspaceHeader
      eyebrow="Bot Job Details"
      title="Saldo Banca Stato"
      subtitle="Bot Job ID 5"
      connected
      status="Ready"
      actions={[{ id: 'REFRESH', label: 'Refresh' }]}
      onAction={onAction}
    />,
  );

  expect(screen.getByText('Saldo Banca Stato')).toBeInTheDocument();
  expect(screen.getByText('Connected')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Ready');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(onAction).toHaveBeenCalledTimes(1);
  expect(onAction).toHaveBeenCalledWith('REFRESH');
});

test('keeps the established navigation contract when horizontal action scrolling is enabled', () => {
  render(
    <WorkspaceHeader
      title="Bot Job"
      actions={[{ id: 'REFRESH', label: 'Refresh' }]}
      scrollableActions
    />,
  );

  const navigation = screen.getByRole('navigation', { name: 'Bot Job actions' });
  expect(navigation).toContainElement(screen.getByRole('button', { name: 'Refresh' }));
  expect(navigation.parentElement).toHaveAttribute('data-horizontal-action-scroll');
  expect(navigation.parentElement).toHaveAttribute('data-floating-drag-ignore');
});
