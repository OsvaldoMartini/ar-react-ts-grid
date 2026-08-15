import { fireEvent, render, screen } from '@testing-library/react';
import SmokeTestRuntimeInstancesModal from './SmokeTestRuntimeInstancesModal';

const instances = [{
  runId: 'run-v1-1',
  integrationEpoch: 4,
  runtimeMode: 'JAVA_V1' as const,
  homeBankingId: 13,
  botJobId: 29,
  botJobName: 'Lloyds',
  status: 'RUNNING',
  stepPending: true,
  terminalPending: false,
  currentInstructionId: 1735,
  currentRequestId: 'step-9',
  startedAt: '2026-08-14T20:00:00Z',
  browserSession: 'SHARED_JAVA_PLAYWRIGHT',
}];

test('shows authoritative runtime details and controls only the selected run', () => {
  const onControl = jest.fn();
  render(<SmokeTestRuntimeInstancesModal
    instances={instances}
    loading={false}
    pendingRunId={null}
    onRefresh={jest.fn()}
    onControl={onControl}
    onClose={jest.fn()}
  />);

  expect(screen.getByText('Runtime Instances')).toBeInTheDocument();
  expect(screen.getByText('Bot Job #29 · Lloyds')).toBeInTheDocument();
  expect(screen.getByText('Instruction #1735')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Stop run run-v1-1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Kill instance run-v1-1' }));
  expect(onControl).toHaveBeenNthCalledWith(1, 'run-v1-1', 'STOP');
  expect(onControl).toHaveBeenNthCalledWith(2, 'run-v1-1', 'KILL');
});

test('renders a visible empty state', () => {
  render(<SmokeTestRuntimeInstancesModal
    instances={[]}
    loading={false}
    pendingRunId={null}
    onRefresh={jest.fn()}
    onControl={jest.fn()}
    onClose={jest.fn()}
  />);
  expect(screen.getByText('No Integration runtime instance is active.')).toBeInTheDocument();
});
