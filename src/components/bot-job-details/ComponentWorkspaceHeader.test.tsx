import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ComponentWorkspaceHeader from './ComponentWorkspaceHeader';

test('exposes only the component-specific hide action', () => {
  const onHide = jest.fn();
  render(
    <ComponentWorkspaceHeader
      botJobName="Saldo Banca Stato"
      connected
      onHide={onHide}
    />,
  );

  expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Hide Components' }));
  expect(onHide).toHaveBeenCalledTimes(1);
});

test('disables the compact hide action when workspace capability is revoked', () => {
  render(
    <ComponentWorkspaceHeader
      botJobName="Saldo Banca Stato"
      connected
      canUseWorkspaceActions={false}
      onHide={jest.fn()}
    />,
  );

  expect(screen.getByRole('button', { name: 'Hide Components' })).toBeDisabled();
});
