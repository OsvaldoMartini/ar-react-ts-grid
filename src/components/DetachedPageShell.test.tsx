import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetachedPageShell from './DetachedPageShell';

jest.mock('./workspace/DesktopWorkspaceShell', () => {
  return function MockDesktopWorkspaceShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="desktop-workspace-shell">{children}</div>;
  };
});

describe('DetachedPageShell', () => {
  it('renders the provided children', () => {
    render(
      <DetachedPageShell title="Detached Test" testId="detached-test">
        <div>child content</div>
      </DetachedPageShell>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-workspace-shell')).toBeInTheDocument();
  });

  it('renders a close button when onClose is provided', () => {
    const onClose = jest.fn();

    render(
      <DetachedPageShell title="Detached Test" testId="detached-test" onClose={onClose}>
        <div>child content</div>
      </DetachedPageShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
