import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SmokeTestLocatorRecoveryModal from './SmokeTestLocatorRecoveryModal';
import type {
  SmokeTestLocatorRecovery,
  SmokeTestLocatorRecoveryCandidate,
} from './smokeTestIntegration.contract';

const candidate = (id: string, name: string): SmokeTestLocatorRecoveryCandidate => ({
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
  newStableAttributes: { id: `live-${id}` },
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
  candidates,
});

test('shows comparison evidence and submits the explicitly selected candidate once', async () => {
  const first = candidate('a', 'Login');
  const second = candidate('b', 'Continue');
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(first, second)}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  expect(screen.getByRole('dialog', { name: 'Locator Recovery · log_in' })).toBeVisible();
  expect(screen.getByText('Saved canonical')).toBeVisible();
  expect(screen.getAllByLabelText('XPath: different')).toHaveLength(2);
  fireEvent.click(screen.getAllByRole('radio')[1]);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use Once' }));
  });

  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(second, 'USE_ONCE'));
  expect(onDecision).toHaveBeenCalledTimes(1);
});

test('submits Use and Save only for the selected server candidate', async () => {
  const selected = candidate('a', 'Login');
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="log_in"
      recovery={recovery(selected)}
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use and Save Locator' }));
  });

  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(selected, 'USE_AND_SAVE'));
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
      verificationEnabled
      onVerificationChange={jest.fn()}
      onDecision={onDecision}
    />,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: button }));
  });

  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(null, decision));
});

test('allows an empty recovery to be explicitly bypassed and contains keyboard focus', async () => {
  const onDecision = jest.fn().mockResolvedValue(undefined);
  render(
    <SmokeTestLocatorRecoveryModal
      instructionName="missing_element"
      recovery={recovery()}
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
  await waitFor(() => expect(onDecision).toHaveBeenCalledWith(null, 'BYPASS'));
  const bypass = screen.getByRole('button', { name: 'Bypass & Continue' });
  const cancel = screen.getByRole('button', { name: 'Cancel Recovery' });
  bypass.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Disable locator recovery verification' }))
    .toHaveFocus();
});
