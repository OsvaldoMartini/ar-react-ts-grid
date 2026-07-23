import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfigPage from './ConfigPage';

jest.mock('./ConfigManager', () => {
  return function MockConfigManager() {
    return <div data-testid="config-manager">config manager</div>;
  };
});

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('ConfigPage', () => {
  it('renders the manager inside the detached shell', () => {
    render(<ConfigPage socketPort={59772} sessionId="configManager" />);

    expect(screen.getByText('config manager')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
