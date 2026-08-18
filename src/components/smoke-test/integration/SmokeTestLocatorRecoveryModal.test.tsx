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
