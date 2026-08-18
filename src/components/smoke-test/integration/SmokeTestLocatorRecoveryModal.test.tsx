import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SmokeTestLocatorRecoveryModal from './SmokeTestLocatorRecoveryModal';
import type {
  SmokeTestLocatorRecovery,
  SmokeTestLocatorRecoveryCandidate,
} from './smokeTestIntegration.contract';

const candidate = (id: string, name: string): SmokeTestLocatorRecoveryCandidate => ({
  origin: id === 'a' ? 'PREVIOUS' : 'CURRENT',
  recoveryCandidateId: id.repeat(64),
  registryCandidateId: id === 'a' ? 101 : 202,
  savedCanonicalName: name,
  savedClientName: `${name} Client`,
  ocrMappedName: `${name} OCR`,
  previousXPath: `//*[@data-old='${id}']`,
  previousCustomXPath: '',
  previousCss: `[data-old='${id}']`,
  previousStableAttributes: { id: `old-${id}` },
  newXPath: `//*[@data-live='${id}']`,
  newCss: `[data-live='${id}']`,
  newStableAttributes: id === 'b'
    ? { 'automation.test-id.attribute': 'qa-hook', 'qa-hook': `live-${id}` }
    : { 'data-testid': `live-${id}` },
  previousPageIdentity: `url-v1:${id.repeat(64)}`,
  currentPageIdentity: `url-v1:${'c'.repeat(64)}`,
  tag: 'button',
  type: 'button',
  role: 'button',
  expectedAction: 'CLICK',
  confidence: id === 'a' ? 0.91 : 0.72,
  reasons: ['Exact client name'],
  ambiguityWarnings: id === 'a' ? [] : ['XPath changed'],
  matches: {
    xpath: false,
    customXPath: null,
    css: false,
    stableAttributes: true,
    frame: null,
    shadow: null,
  },
});

const recovery = (...candidates: SmokeTestLocatorRecoveryCandidate[]): SmokeTestLocatorRecovery => ({
  state: 'AWAITING_USER',
  failedTarget: {
    origin: 'BOT_JOB',
    savedCanonicalName: 'avanti',
    savedClientName: 'Continue',
    ocrMappedName: '',
    previousXPath: "//*[@id='avanti']",
    previousCustomXPath: "//*[@data-action='avanti']",
    previousCss: '#avanti',
    previousStableAttributes: { 'test-id': 'avanti' },
    previousPageIdentity: `url-v1:${'d'.repeat(64)}`,
    currentPageIdentity: `url-v1:${'c'.repeat(64)}`,
    tag: 'button',
    type: 'button',
    role: 'button',
    expectedAction: 'CLICK',
    diagnosticCode: 'TARGET_NOT_FOUND',
  },
  candidates,
});

test('renders the unresolved instruction first and database matches after it', () => {
  const firstDatabaseMatch = candidate('a', 'Continue from database');
  const secondDatabaseMatch = candidate('b', 'Alternative from database');
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="avanti"
      recovery={recovery(firstDatabaseMatch, secondDatabaseMatch)}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  const rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('avanti');
  expect(rows[1]).toHaveTextContent('BOT JOB');
  expect(rows[1]).toHaveTextContent('Target not located');
  expect(rows[1]).toHaveTextContent('test-id=avanti');
  expect(rows[2]).toHaveTextContent('Continue from database');
  expect(rows[2]).toHaveTextContent('PREVIOUS');
  expect(rows[3]).toHaveTextContent('Alternative from database');
  expect(rows[3]).toHaveTextContent('CURRENT');
  expect(rows[3]).toHaveTextContent('qa-hook=live-b');
  expect(screen.getAllByRole('radio')).toHaveLength(2);

  const headers = screen.getAllByRole('columnheader').map(header => header.textContent);
  expect(headers.indexOf('XPath match')).toBe(headers.indexOf('Test Click') + 1);
  expect(headers.indexOf('Test ID')).toBe(headers.indexOf('Select') + 1);
  expect(headers.indexOf('Origin')).toBe(headers.indexOf('Test ID') + 1);
});

test('opens the Locator Recovery rules beside the save action and restores focus', async () => {
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  const help = screen.getByRole('button', { name: 'Open Locator Recovery rules' });
  fireEvent.click(help);
  const rules = screen.getByRole('dialog', { name: 'Locator Recovery rules' });
  expect(rules).toBeVisible();
  expect(within(rules).getByText('BOT JOB')).toBeVisible();
  expect(within(rules).getByText('PREVIOUS')).toBeVisible();
  expect(within(rules).getByText('CURRENT')).toBeVisible();
  expect(within(rules).getByText('TEST ID')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Close Locator Recovery rules' }));
  await waitFor(() => expect(help).toHaveFocus());
});

test('shows comparison evidence and submits the explicitly selected candidate once', async () => {
  const first = candidate('a', 'Login');
  const second = candidate('b', 'Continue');
  const onDecision = jest.fn().mockResolvedValue(undefined);
  const onScanPage = jest.fn().mockResolvedValue('Page Scanner refreshed 2 candidates.');
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(first, second)}
      onScanPage={onScanPage}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  expect(screen.getByRole('dialog', { name: 'Locator Recovery · log_in' })).toBeVisible();
  expect(screen.getByText('Saved canonical')).toBeVisible();
  expect(screen.getAllByLabelText('XPath: different')).toHaveLength(2);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Page Scanner' }));
  });
  expect(onScanPage).toHaveBeenCalledTimes(1);
  expect(onDecision).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: 'Locator Recovery · log_in' })).toBeVisible();
  fireEvent.click(screen.getAllByRole('radio')[1]);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use Once' }));
  });

  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(second, 'USE_ONCE', 'CLICK'));
  expect(onDecision).toHaveBeenCalledTimes(1);
});

test('submits Use and Save only for the selected server candidate', async () => {
  const selected = candidate('a', 'Login');
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(selected)}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use and Save Locator' }));
  });

  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(selected, 'USE_AND_SAVE', 'CLICK'));
});

test('changes the selected recovery action and probes input or click without settling recovery', async () => {
  const selected = candidate('a', 'Login');
  const onDecision = jest.fn().mockResolvedValue(undefined);
  const onTestCandidate = jest.fn().mockResolvedValue('Candidate test completed.');
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(selected)}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={onTestCandidate}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /Execution type CLICK/ }));
  await act(async () => {
    fireEvent.click(screen.getByTitle('Test Input on Login OCR'));
  });
  expect(onTestCandidate).toHaveBeenCalledWith(selected, 'INPUT');
  expect(onDecision).not.toHaveBeenCalled();
  expect(await screen.findByText('Candidate test completed.')).toBeVisible();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use Once' }));
  });
  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(selected, 'USE_ONCE', 'INPUT'));
});

test('serializes recovery decisions behind a pending Page Scanner request', async () => {
  let resolveScanner: ((message: string) => void) | undefined;
  const onScanPage = jest.fn(() => new Promise<string>((resolve) => {
    resolveScanner = resolve;
  }));
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={onScanPage}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Page Scanner' }));
  expect(screen.getByRole('button', { name: 'Scanning...' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel Recovery' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Stop Execution' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Bypass & Continue' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use Once' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use and Save Locator' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Disable locator recovery verification' }))
    .toBeDisabled();
  expect(onDecision).not.toHaveBeenCalled();

  await act(async () => resolveScanner?.('Page Scanner completed.'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Page Scanner' })).toBeEnabled());
  expect(screen.getByRole('button', { name: 'Use Once' })).toBeEnabled();
});

test('shows a Page Scanner failure without settling or closing recovery', async () => {
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockRejectedValue(new Error('Scanner owner is stale.'))}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Page Scanner' }));
  });

  expect(await screen.findByText('Scanner owner is stale.')).toBeVisible();
  expect(screen.getByRole('dialog', { name: /Locator Recovery/ })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Use Once' })).toBeEnabled();
  expect(onDecision).not.toHaveBeenCalled();
});

test.each([
  ['Cancel Recovery', 'CANCEL'],
  ['Bypass & Continue', 'BYPASS'],
  ['Stop Execution', 'STOP'],
] as const)('%s submits a terminal decision without a candidate', async (button, decision) => {
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: button }));
  });

  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(null, decision, undefined));
});

test('allows an empty recovery to be explicitly bypassed and contains keyboard focus', async () => {
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="missing_element"
      recovery={recovery()}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  expect(screen.getByText('0 candidates')).toBeVisible();
  expect(screen.getByText(/No safe recovery candidates were found/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Use Once' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use and Save Locator' })).toBeDisabled();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Bypass & Continue' }));
  });
  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(null, 'BYPASS', undefined));
  const help = screen.getByRole('button', { name: 'Open Locator Recovery rules' });
  help.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Disable locator recovery verification' }))
    .toHaveFocus();
});

test('renders the bounded failed-target fallback and toggles verification both ways', () => {
  const onVerificationChange = jest.fn();
  const fallbackRecovery: SmokeTestLocatorRecovery = {
    state: 'AWAITING_USER',
    candidates: [],
  };
  const { rerender } = render(
    <SmokeTestLocatorRecoveryModal
      instructionName="missing_target"
      recovery={fallbackRecovery}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={onVerificationChange}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  expect(screen.getByTestId('locator-recovery-failed-target')).toHaveTextContent('missing_target');
  expect(screen.getByTestId('locator-recovery-failed-target')).toHaveTextContent('Unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Disable locator recovery verification' }));
  expect(onVerificationChange).toHaveBeenLastCalledWith(false);

  rerender(
    <SmokeTestLocatorRecoveryModal
      instructionName="missing_target"
      recovery={fallbackRecovery}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled={false}
      onVerificationChange={onVerificationChange}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Enable locator recovery verification' }));
  expect(onVerificationChange).toHaveBeenLastCalledWith(true);
});

test('moves selection to the first replacement candidate after a scanner refresh', async () => {
  const first = candidate('a', 'First');
  const replacement = candidate('b', 'Replacement');
  const onDecision = jest.fn().mockResolvedValue(undefined);
  const props = {
    instructionName: 'continue',
    onScanPage: jest.fn().mockResolvedValue('Page Scanner completed.'),
    onTestCandidate: jest.fn().mockResolvedValue('Candidate test completed.'),
    verificationEnabled: true,
    onVerificationChange: jest.fn(),
    onDecision,
  };
  const { rerender } = render(
    <SmokeTestLocatorRecoveryModal {...props} recovery={recovery(first)} />,
  );

  rerender(<SmokeTestLocatorRecoveryModal {...props} recovery={recovery(replacement)} />);
  await waitFor(() => expect(screen.getByRole('radio')).toBeChecked());
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Use Once' })));
  expect(onDecision).toHaveBeenCalledWith(replacement, 'USE_ONCE', 'CLICK');
});

test('reports non-Error scanner and candidate failures without settling recovery', async () => {
  const unnamed = {
    ...candidate('a', ''),
    savedClientName: '',
    ocrMappedName: '',
    newStableAttributes: {},
    previousStableAttributes: {},
  };
  const onDecision = jest.fn().mockResolvedValue(undefined);
  const onTestCandidate = jest.fn()
    .mockRejectedValueOnce(new Error('Input probe failed.'))
    .mockRejectedValueOnce('click-failure');
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="missing_target"
      recovery={recovery(unnamed)}
      onScanPage={jest.fn().mockRejectedValue('scanner-failure')}
      onTestCandidate={onTestCandidate}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Page Scanner' })));
  expect(await screen.findByText('The paused runtime page could not be scanned.')).toBeVisible();

  await act(async () => fireEvent.click(screen.getByTitle('Test Input on candidate')));
  expect(await screen.findByText('Input probe failed.')).toBeVisible();
  await act(async () => fireEvent.click(screen.getByTitle('Test Click on candidate')));
  expect(await screen.findByText('Test click failed.')).toBeVisible();
  expect(onDecision).not.toHaveBeenCalled();
});

test('releases decision busy state after a rejected terminal request', async () => {
  const onDecision = jest.fn()
    .mockRejectedValueOnce(new Error('Decision failed.'))
    .mockRejectedValueOnce('decision-failure');
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use Once' }));
  });
  expect(await screen.findByText('Decision failed.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Use Once' })).toBeEnabled();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Use Once' })));
  expect(await screen.findByText('The Locator Recovery decision could not be completed.')).toBeVisible();
});

test('renders empty candidate evidence with deterministic fallbacks', () => {
  const emptyEvidence = {
    ...candidate('a', ''),
    savedClientName: '',
    ocrMappedName: '',
    previousXPath: '',
    previousCustomXPath: '',
    previousCss: '',
    newXPath: '',
    newCss: '',
    previousStableAttributes: {},
    newStableAttributes: {},
    tag: '',
    type: '',
    role: '',
    reasons: [],
    ambiguityWarnings: [],
  };
  const failed = recovery(emptyEvidence);
  failed.failedTarget = { ...failed.failedTarget!, savedCanonicalName: '' };
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="fallback_name"
      recovery={failed}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  expect(screen.getByTestId('locator-recovery-failed-target')).toHaveTextContent('fallback_name');
  expect(screen.getByText('No strong evidence')).toBeVisible();
});

test('contains focus in both directions and closes help by Escape or backdrop only', async () => {
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  const first = screen.getByRole('button', { name: 'Disable locator recovery verification' });
  const last = screen.getByRole('button', { name: 'Open Locator Recovery rules' });
  first.focus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(last).toHaveFocus();
  last.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(first).toHaveFocus();

  fireEvent.click(last);
  let rules = screen.getByRole('dialog', { name: 'Locator Recovery rules' });
  fireEvent.mouseDown(rules);
  expect(rules).toBeVisible();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Locator Recovery rules' })).not.toBeInTheDocument());

  fireEvent.click(last);
  rules = screen.getByRole('dialog', { name: 'Locator Recovery rules' });
  const close = screen.getByRole('button', { name: 'Close Locator Recovery rules' });
  close.focus();
  fireEvent.keyDown(rules, { key: 'Tab' });
  expect(close).toHaveFocus();
  fireEvent.keyDown(rules, { key: 'Tab', shiftKey: true });
  expect(close).toHaveFocus();
  rules.setAttribute('tabindex', '-1');
  rules.focus();
  fireEvent.keyDown(rules, { key: 'Tab', shiftKey: true });
  fireEvent.keyDown(rules, { key: 'Tab' });
  fireEvent.mouseDown(rules.parentElement as HTMLElement);
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Locator Recovery rules' })).not.toBeInTheDocument());
});

test('keeps focus on the recovery dialog when no enabled control is available', () => {
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  const dialog = screen.getByRole('dialog', { name: /Locator Recovery/ });
  const querySelectorAll = dialog.querySelectorAll.bind(dialog);
  dialog.querySelectorAll = jest.fn(() => []) as unknown as typeof dialog.querySelectorAll;
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(dialog).toHaveFocus();
  dialog.querySelectorAll = querySelectorAll;
});

test('ignores unrelated help keys and safely handles an empty help focus set', () => {
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(candidate('a', 'Login'))}
      onScanPage={jest.fn().mockResolvedValue('Page Scanner completed.')}
      onTestCandidate={jest.fn().mockResolvedValue('Candidate test completed.')}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Open Locator Recovery rules' }));
  const rules = screen.getByRole('dialog', { name: 'Locator Recovery rules' });
  fireEvent.keyDown(rules, { key: 'ArrowDown' });
  const querySelectorAll = rules.querySelectorAll.bind(rules);
  rules.querySelectorAll = jest.fn(() => []) as unknown as typeof rules.querySelectorAll;
  fireEvent.keyDown(rules, { key: 'Tab' });
  expect(rules).toBeVisible();
  rules.querySelectorAll = querySelectorAll;
});
