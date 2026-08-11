import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InfoPage from './InfoPage';

jest.mock('./useWebSocket', () => ({
  useWebSocket: () => ({
    webSocket: null,
    connected: false,
    messages: [],
    error: null,
  }),
}));

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('InfoPage', () => {
  it('renders an independent software and license workspace with a local close action', () => {
    const onClose = jest.fn();
    render(<InfoPage socketPort={59772} sessionId="aboutPanel" onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'About this Software' })).toBeInTheDocument();
    expect(screen.getByText('Software Information')).toBeInTheDocument();
    expect(screen.getByText('License Information')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
