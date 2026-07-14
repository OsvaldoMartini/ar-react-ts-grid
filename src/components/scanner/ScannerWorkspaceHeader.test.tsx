import { fireEvent, render, screen } from '@testing-library/react';
import ScannerWorkspaceHeader from './ScannerWorkspaceHeader';
import type { ScannerState } from './Scanner.types';

const state: ScannerState = {
  revision: 1,
  botJobId: 42,
  botJobName: 'Apre Acconto',
  homeBankingId: 2,
  environmentUrl: 'https://bank.example',
  blocks: [{ id: 100, order: 1, name: 'Login', active: true }],
  browser: { state: 'UNKNOWN', activeUrl: '', activeTitle: '', openTabs: 0, scannable: false },
  focus: { profile: 'default', searchTerms: [] },
  ocr: { available: true, status: 'IDLE' },
  capabilities: {
    canRefreshState: true,
    canUsePageScanner: true,
    canUseOcr: true,
    canExecute: true,
    canApplyElements: true,
  },
  executionState: 'IDLE',
};

test('renders scanner state and sends refresh action', async () => {
  const onAction = jest.fn();
  render(
    <ScannerWorkspaceHeader
      botJobName="Fallback"
      connected
      scannerState={state}
      status="Ready"
      onAction={onAction}
    />,
  );

  expect(screen.getByText('AR Web Factory')).toBeInTheDocument();
  expect(screen.getByText(/Apre Acconto/)).toBeInTheDocument();
  expect(screen.getByText('https://bank.example')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

  expect(onAction).toHaveBeenCalledWith('REFRESH_STATE');
});

test('sends clear grid action', () => {
  const onAction = jest.fn();
  render(
    <ScannerWorkspaceHeader
      botJobName="Fallback"
      connected
      scannerState={state}
      onAction={onAction}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Clear Grid' }));

  expect(onAction).toHaveBeenCalledWith('CLEAR_GRID');
});

test('sends refresh page action', () => {
  const onAction = jest.fn();
  render(
    <ScannerWorkspaceHeader
      botJobName="Fallback"
      connected
      scannerState={state}
      onAction={onAction}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Refresh Web Page' }));

  expect(onAction).toHaveBeenCalledWith('REFRESH_PAGE');
});
