import React from 'react';
import { render, screen } from '@testing-library/react';
import CloneJobPage from './CloneJobPage';

jest.mock('./CloneJobManager', () => {
  return function MockCloneJobManager() {
    return <div data-testid="clone-job-manager">clone job manager</div>;
  };
});

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('CloneJobPage', () => {
  it('renders the manager inside the detached shell', () => {
    render(<CloneJobPage socketPort={59772} sessionId="cloneJobManager" sourceBotJobId={7} />);

    expect(screen.getByText('clone job manager')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
