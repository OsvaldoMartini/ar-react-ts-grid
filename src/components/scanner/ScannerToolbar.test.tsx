import { fireEvent, render, screen } from '@testing-library/react';
import ScannerToolbar from './ScannerToolbar';
import type { ScannerState } from './Scanner.types';

const state: ScannerState = {
  revision: 1,
  botJobId: 42,
  botJobName: 'Apre Acconto',
  homeBankingId: 2,
  environmentUrl: 'https://bank.example',
  blocks: [{ id: 100, order: 1, name: 'Login', active: true }],
  browser: { state: 'OPEN', activeUrl: 'https://bank.example/login', activeTitle: 'Login', openTabs: 2, scannable: true },
  focus: { profile: 'default', searchTerms: ['input', 'button'] },
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

test('sends search, tab, OCR, and execution commands', () => {
  const onAction = jest.fn();
  const onOpenOcrConfig = jest.fn();
  render(
    <ScannerToolbar
      connected
      scannerState={state}
      onAction={onAction}
      onOpenOcrConfig={onOpenOcrConfig}
    />,
  );

  const search = screen.getByLabelText('Scanner search terms');
  expect(search).toHaveValue('input, button');
  fireEvent.change(search, { target: { value: 'textarea, a ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'OCR Config' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pre-Launch' }));
  fireEvent.click(screen.getByRole('button', { name: 'STOP' }));

  expect(onAction).toHaveBeenNthCalledWith(1, 'PAGE_SCANNER', { searchTerms: 'textarea, a' });
  expect(onAction).toHaveBeenNthCalledWith(2, 'PREVIOUS_TAB');
  expect(onAction).toHaveBeenNthCalledWith(3, 'NEXT_TAB');
  expect(onOpenOcrConfig).toHaveBeenCalledTimes(1);
  expect(onAction).toHaveBeenNthCalledWith(4, 'PRE_LAUNCH');
  expect(onAction).toHaveBeenNthCalledWith(5, 'STOP_PRE_LAUNCH');
});

test('disables scanner toolbar while an action is pending', () => {
  render(<ScannerToolbar connected scannerState={state} pendingAction="PAGE_SCANNER" />);

  expect(screen.getByLabelText('Scanner search terms')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'OCR Config' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Pre-Launch' })).toBeDisabled();
});
