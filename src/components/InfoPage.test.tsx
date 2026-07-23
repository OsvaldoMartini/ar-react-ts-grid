import React from 'react';
import { render, screen } from '@testing-library/react';
import InfoPage from './InfoPage';

jest.mock('./AboutPanel', () => {
  return function MockAboutPanel() {
    return <div data-testid="about-panel">about panel</div>;
  };
});

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('InfoPage', () => {
  it('renders the panel inside the detached shell', () => {
    render(<InfoPage socketPort={59772} sessionId="aboutPanel" />);

    expect(screen.getByText('about panel')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
