import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfigPage from './ConfigPage';

jest.mock('./TemplateForm', () => {
  return function MockTemplateForm() {
    return <div data-testid="template-form">configuration form</div>;
  };
});

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('ConfigPage', () => {
  it('renders the shared template form inside the detached shell', () => {
    render(<ConfigPage socketPort={59772} sessionId="configManager" />);

    expect(screen.getByText('configuration form')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });
});
