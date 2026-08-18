import React from 'react';
import { render, screen } from '@testing-library/react';
import CloneJobPage from './CloneJobPage';

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

describe('CloneJobPage', () => {
  it('renders the TEMP-pattern clone form inside the detached shell', () => {
    render(<CloneJobPage socketPort={59772} sessionId="cloneJobManager" sourceBotJobId={7} />);

    expect(screen.getByRole('heading', { name: 'Clone Job' })).toBeInTheDocument();
    expect(screen.getByTestId('clone-job-organizations-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('clone-job-environments-grid')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clone Bot Job' })).toBeDisabled();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
