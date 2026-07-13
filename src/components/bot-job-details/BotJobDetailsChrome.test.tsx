import React from 'react';
import { render, screen } from '@testing-library/react';
import BotJobDetailsChrome from './BotJobDetailsChrome';
import type { BotJobDetailsControllerState } from './useBotJobDetailsController';
import { botJobDetailsTestState } from './BotJobDetails.testData';

test('keeps capability-gated actions disabled until bootstrap state is available', () => {
  const controller: BotJobDetailsControllerState = {
    state: null,
    loadingState: true,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: '',
    status: 'Loading Bot Job details',
    statusTone: 'neutral',
    sendAction: jest.fn(),
    sendToolbarAction: jest.fn(),
    saveMetadata: jest.fn(),
    refreshEnvironments: jest.fn(),
    retryBootstrap: jest.fn(),
  };

  render(
    <BotJobDetailsChrome
      fallbackBotJobId={42}
      fallbackBotJobName="Payments"
      fallbackSurface="botJob"
      connected
      controller={controller}
    />,
  );

  expect(screen.getByRole('button', { name: 'Pre Scan' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Components' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
});

test('keeps Stop available but disables editing, navigation, and file mutations during TEST RUN', () => {
  const controller: BotJobDetailsControllerState = {
    state: { ...botJobDetailsTestState, executionState: 'RUNNING' },
    loadingState: false,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: 'D:\\exports',
    status: 'TEST RUN active',
    statusTone: 'warning',
    sendAction: jest.fn(),
    sendToolbarAction: jest.fn(),
    saveMetadata: jest.fn(),
    refreshEnvironments: jest.fn(),
    retryBootstrap: jest.fn(),
  };

  render(
    <BotJobDetailsChrome
      fallbackBotJobId={42}
      fallbackBotJobName="Payments"
      fallbackSurface="botJob"
      connected
      controller={controller}
    />,
  );

  expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Excel/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Pre Scan' })).toBeDisabled();
});
