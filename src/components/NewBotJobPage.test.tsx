import React from 'react';
import { render, screen } from '@testing-library/react';
import NewBotJobPage from './NewBotJobPage';

jest.mock('./NewBotJobManager', () => {
  return function MockNewBotJobManager() {
    return <div data-testid="new-bot-job-manager">new bot job manager</div>;
  };
});

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('NewBotJobPage', () => {
  it('renders the manager inside the detached shell', () => {
    render(<NewBotJobPage socketPort={59772} sessionId="newBotJobManager" />);

    expect(screen.getByText('new bot job manager')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
