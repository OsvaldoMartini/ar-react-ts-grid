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
