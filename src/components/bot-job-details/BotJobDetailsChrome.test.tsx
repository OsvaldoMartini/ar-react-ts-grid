import React from 'react';
import { render, screen } from '@testing-library/react';
import BotJobDetailsChrome from './BotJobDetailsChrome';
import type { BotJobDetailsControllerState } from './useBotJobDetailsController';

test('keeps capability-gated actions disabled until bootstrap state is available', () => {
  const controller: BotJobDetailsControllerState = {
    state: null,
    loadingState: true,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    status: 'Loading Bot Job details',
    statusTone: 'neutral',
    sendAction: jest.fn(),
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
