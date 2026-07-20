import { fireEvent, render, screen } from '@testing-library/react';
import PageScannerWorkspaceHeader from './PageScannerWorkspaceHeader';

test('shows detached Page Scanner identity and closes only through its callback', () => {
  const onClose = jest.fn();
  render(
    <PageScannerWorkspaceHeader
      botJobId={42}
      botJobName="Payments"
      connected
      status="Ready"
      onClose={onClose}
    />,
  );

  expect(screen.getByText('Page Scanner')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument();
  expect(screen.getByText('Bot Job ID 42')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('prevents duplicate close requests while cleanup is pending', () => {
  const onClose = jest.fn();
  render(
    <PageScannerWorkspaceHeader
      botJobId={42}
      botJobName="Payments"
      connected
      closing
      onClose={onClose}
    />,
  );

  expect(screen.getByRole('button', { name: 'Closing...' })).toBeDisabled();
});
