import React from 'react';
import { render, screen } from '@testing-library/react';
import SmokeTestSimulationWorkspace from './SmokeTestSimulationWorkspace';
import type { VariablesExecutionFlowReview } from '../variables/domain/variablesExecutionFlowReview';

let mockMounts = 0;

jest.mock('../variables/VariablesSmokeTestPanel', () => ({ review }: {
  review: VariablesExecutionFlowReview;
}) => {
  const ReactInFactory = require('react');
  const [mount] = ReactInFactory.useState(() => ++mockMounts);
  return <div data-testid="execution-owner">{review.homeBankingId}:{review.botJobId}:{mount}</div>;
});

const review = (homeBankingId: number, botJobId: number) => ({
  homeBankingId,
  botJobId,
  botJobName: `Bot Job ${botJobId}`,
} as VariablesExecutionFlowReview);

const callbacks = {
  selectedBlockIds: [] as readonly number[],
  runtimeWriteAvailable: true,
  onCommitRuntimeValue: () => true,
  onActivePositionChange: () => undefined,
  onExecutionTraceChange: () => undefined,
  onCommandRemainingChange: () => undefined,
  onRunStart: () => undefined,
  onOpenExcelWriterManager: () => undefined,
  excelWriterMessages: [] as readonly string[],
  excelWriterMessageGeneration: 0,
  onPublishExcelWriterState: () => true,
  excelDataMode: 'REAL' as const,
  excelDataModePending: false,
  onExcelDataModeChange: () => undefined,
  executionMode: 'INTEGRATION' as const,
  integrationRuntimeMode: 'TYPESCRIPT_PLAYWRIGHT_V2' as const,
  v2RuntimeReady: true,
  integrationPagePolicy: 'PRESERVE_ACTIVE' as const,
  integration: {} as never,
  locatorRecoveryVerificationEnabled: true,
  onLocatorRecoveryVerificationChange: () => undefined,
  onStatusChange: () => undefined,
};

test('preserves same-owner state and remounts run-local state when the Bot Job owner changes', () => {
  mockMounts = 0;
  const { rerender } = render(
    <SmokeTestSimulationWorkspace review={review(2, 5)} {...callbacks} />,
  );
  expect(screen.getByTestId('execution-owner')).toHaveTextContent('2:5:1');

  rerender(<SmokeTestSimulationWorkspace review={review(2, 5)} {...callbacks} />);
  expect(screen.getByTestId('execution-owner')).toHaveTextContent('2:5:1');

  rerender(<SmokeTestSimulationWorkspace review={review(13, 29)} {...callbacks} />);
  expect(screen.getByTestId('execution-owner')).toHaveTextContent('13:29:2');
});
