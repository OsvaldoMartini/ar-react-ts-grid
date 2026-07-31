import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
    executionPause: null,
    executionPreflight: null,
    resolveExecutionPause: jest.fn(),
    dismissExecutionPreflight: jest.fn(),
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
    executionPause: null,
    executionPreflight: null,
    resolveExecutionPause: jest.fn(),
    dismissExecutionPreflight: jest.fn(),
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

test('saves metadata through the restored editor entry point', () => {
  const saveMetadata = jest.fn();
  const controller: BotJobDetailsControllerState = {
    state: botJobDetailsTestState,
    loadingState: false,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: '',
    status: 'Ready',
    statusTone: 'neutral',
    executionPause: null,
    executionPreflight: null,
    resolveExecutionPause: jest.fn(),
    dismissExecutionPreflight: jest.fn(),
    sendAction: jest.fn(),
    sendToolbarAction: jest.fn(),
    saveMetadata,
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

  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Bot Job name' }), {
    target: { value: 'Payments QA' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(saveMetadata).toHaveBeenCalledWith({
    expectedMetadataRevision: botJobDetailsTestState.metadataRevision,
    name: 'Payments QA',
    description: botJobDetailsTestState.description,
    homeUrlId: botJobDetailsTestState.homeUrlId,
  });
});

test('renders the standard React confirmation for an instruction PAUSE', () => {
  const resolveExecutionPause = jest.fn();
  const controller: BotJobDetailsControllerState = {
    state: { ...botJobDetailsTestState, executionState: 'RUNNING' },
    loadingState: false,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: '',
    status: 'Paused at Login',
    statusTone: 'warning',
    executionPause: {
      requestId: 'pause-1',
      botJobId: 42,
      workspaceEpoch: 9,
      executionId: 17,
      executionAttemptId: 3,
      title: 'PAUSE BOT JOB',
      header: 'Paused at block',
      blockName: 'Login',
      instructionName: 'Review customer page',
      body: 'The same Playwright page remains open.',
      continueLabel: 'Continue',
      stopLabel: 'Stop Run',
    },
    executionPreflight: null,
    resolveExecutionPause,
    dismissExecutionPreflight: jest.fn(),
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

  expect(screen.getByRole('dialog', { name: 'PAUSE BOT JOB' })).toHaveTextContent('Login');
  expect(screen.getByRole('dialog')).toHaveTextContent('Review customer page');
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(resolveExecutionPause).toHaveBeenCalledWith('CONTINUE');
});

test('renders the authoritative WARN preflight and delegates row focus without another action', () => {
  const dismissExecutionPreflight = jest.fn();
  const onFocusPreflightIssue = jest.fn();
  const issue = {
    code: 'MISSING_RUNTIME_VALUE_WRITER',
    kind: 'VARIABLE_ORDER',
    severity: 'WARNING' as const,
    disposition: 'VARIABLE_DIAGNOSTIC' as const,
    blockId: 12,
    instructionId: 101,
    message: 'CK has no active GET or SET writer.',
  };
  const controller: BotJobDetailsControllerState = {
    state: botJobDetailsTestState,
    loadingState: false,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: '',
    status: 'TEST RUN started',
    statusTone: 'warning',
    executionPause: null,
    executionPreflight: {
      action: 'TEST_RUN',
      report: {
        enforcement: 'WARN',
        status: 'WOULD_BLOCK',
        outcome: 'WARN',
        stage: 'BOT_JOB_DETAILS_TEST_RUN',
        owner: { homeBankingId: 7, botJobId: 42 },
        runScope: { kind: 'ONE', selectedBlockId: 12 },
        graphVersion: 4,
        contentRevision: 'revision-4',
        reachableBlockIds: [12],
        reachableInstructionIds: [101],
        totalIssues: 1,
        variableDiagnosticCount: 1,
        structuralStartFailureCount: 0,
        issues: [issue],
        unavailableReason: null,
      },
    },
    resolveExecutionPause: jest.fn(),
    dismissExecutionPreflight,
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
      onFocusPreflightIssue={onFocusPreflightIssue}
    />,
  );

  expect(screen.getByRole('dialog', { name: 'Test Run preflight' })).toHaveTextContent(
    'Variable diagnostics never resend, pause, cancel, or block execution.',
  );
  expect(screen.getByRole('dialog')).not.toHaveTextContent(/would.?block|blocked/i);
  fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
  expect(onFocusPreflightIssue).toHaveBeenCalledWith(issue);
  expect(dismissExecutionPreflight).toHaveBeenCalledTimes(1);
  expect(controller.sendToolbarAction).not.toHaveBeenCalled();
});

test('requires a runtime-memory policy before TEST RUN and defaults to KEEP', () => {
  const sendToolbarAction = jest.fn();
  const controller: BotJobDetailsControllerState = {
    state: botJobDetailsTestState,
    loadingState: false,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: '',
    status: 'Ready',
    statusTone: 'neutral',
    executionPause: null,
    executionPreflight: null,
    resolveExecutionPause: jest.fn(),
    dismissExecutionPreflight: jest.fn(),
    sendAction: jest.fn(),
    sendToolbarAction,
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

  fireEvent.click(screen.getByRole('button', { name: 'Test run' }));
  expect(sendToolbarAction).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', {
    name: 'Test Run Variable Values',
  })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', {
    name: 'Run with Current Values',
  }));
  expect(sendToolbarAction).toHaveBeenCalledWith('TEST_RUN', {
    executionMode: 'ALL',
    blockId: 0,
    runtimeMemoryPolicy: 'KEEP',
  });
});

test('can reset all runtime values before LAUNCH or cancel without dispatching', () => {
  const sendToolbarAction = jest.fn();
  const controller: BotJobDetailsControllerState = {
    state: botJobDetailsTestState,
    loadingState: false,
    savingMetadata: false,
    fieldErrors: {},
    metadataSavedRevision: null,
    pendingAction: null,
    pendingToolbarAction: null,
    transferPath: '',
    status: 'Ready',
    statusTone: 'neutral',
    executionPause: null,
    executionPreflight: null,
    resolveExecutionPause: jest.fn(),
    dismissExecutionPreflight: jest.fn(),
    sendAction: jest.fn(),
    sendToolbarAction,
    saveMetadata: jest.fn(),
    refreshEnvironments: jest.fn(),
    retryBootstrap: jest.fn(),
  };

  const view = render(
    <BotJobDetailsChrome
      fallbackBotJobId={42}
      fallbackBotJobName="Payments"
      fallbackSurface="botJob"
      connected
      controller={controller}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Launch' }));
  expect(screen.getByRole('heading', {
    name: 'Launch Variable Values',
  })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(sendToolbarAction).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Launch' }));
  fireEvent.click(screen.getByRole('button', {
    name: 'Reset Values & Run',
  }));
  expect(sendToolbarAction).toHaveBeenCalledWith('LAUNCH', {
    runtimeMemoryPolicy: 'RESET',
  });
  view.unmount();
});
