import React from 'react';
import { render, screen } from '@testing-library/react';
import NewBotJobPage from './NewBotJobPage';

jest.mock('./useWebSocket', () => {
  return {
    useWebSocket: () => ({
      webSocket: null,
      connected: false,
      messages: [],
      error: null,
    }),
  };
});

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('NewBotJobPage', () => {
  it('renders the TEMP-pattern form and Organization selection inside the detached shell', () => {
    render(<NewBotJobPage socketPort={59772} sessionId="newBotJobManager" />);

    expect(screen.getByRole('heading', { name: 'New Bot Job' })).toBeInTheDocument();
    expect(screen.getByTestId('new-bot-job-organizations-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('new-bot-job-environments-grid')).not.toBeInTheDocument();
    expect(screen.getByText('Select an Organization, then select one of its Environments.')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
