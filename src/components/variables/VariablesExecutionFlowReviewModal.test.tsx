import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VariablesExecutionFlowReviewModal from './VariablesExecutionFlowReviewModal';
import type {
  VariablesExecutionFlowReview,
} from './domain/variablesExecutionFlowReview';

const owner = {
  workspaceKind: 'BOT_JOB' as const,
  homeBankingId: 2,
  botJobId: 32,
};

const reviewWithoutBlocks: Omit<VariablesExecutionFlowReview, 'blocks'> = {
  homeBankingId: 2,
  botJobId: 32,
  botJobName: 'Complete Flow',
  runtimeMemoryRevision: 4,
  relationshipsAvailable: true,
  connectionCount: 1,
  issueCount: 0,
  diagnostics: [],
  variableFlows: [{
    variableId: 100,
    variableName: 'account_number',
    variableType: '$String',
    configuredValue: '',
    runtimeState: 'VALUE',
    runtimeRawValue: '125.00',
    runtimeVoidReason: null,
    ownerInstructionId: 10,
    producerInstructionIds: [11],
    readerInstructionIds: [],
    connectionIds: ['edge-1'],
  }],
  unassignedConnections: [],
  steps: [{
    key: 'INSTRUCTION:10',
    instructionId: 10,
    instructionName: 'Account field',
    action: 'O',
    operation: '$SALDO',
    blockId: 7,
    blockName: 'Login',
    blockOrder: 1,
    instructionOrder: 1,
    active: true,
    connections: [],
  }, {
    key: 'INSTRUCTION:11',
    instructionId: 11,
    instructionName: 'Read account',
    action: 'GET',
    operation: 'Wait 5 seconds',
    blockId: 7,
    blockName: 'Login',
    blockOrder: 1,
    instructionOrder: 2,
    active: true,
    connections: [{
      id: 'edge-1',
      kind: 'ELEMENT_TARGET',
      state: 'CONNECTED',
      code: null,
      required: true,
      source: { entity: 'INSTRUCTION', owner, id: 11 },
      target: { entity: 'INSTRUCTION', owner, id: 10 },
      sourceLabel: '#2 Read account (ID 11)',
      targetLabel: '#1 Account field (ID 10)',
    }],
  }],
};

const review: VariablesExecutionFlowReview = {
  ...reviewWithoutBlocks,
  blocks: [{
    blockId: 7,
    blockName: 'Login',
    blockOrder: 1,
    active: true,
    steps: reviewWithoutBlocks.steps,
  }],
};

test('renders the complete read-only execution and variable flow', () => {
  const onClose = jest.fn();
  render(
    <VariablesExecutionFlowReviewModal
      review={review}
      scopeLabel="Block #1 Login · 2 visible commands"
      onClose={onClose}
    />,
  );

  expect(screen.getByRole('heading', { name: 'Review All Connections' }))
    .toBeInTheDocument();
  expect(screen.getByText('Block #1 Login')).toBeInTheDocument();
  expect(screen.getAllByText('Account field').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Read account').length).toBeGreaterThan(0);
  expect(screen.getByText('ELEMENT TARGET')).toBeInTheDocument();
  expect(screen.getByText('CONNECTED')).toBeInTheDocument();
  expect(screen.getByText('Runtime VALUE: 125.00')).toBeInTheDocument();
  expect(screen.getByText('Configured VALUE: EMPTY')).toBeInTheDocument();
  expect(screen.getByText('$SALDO')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getByText('No database change is made by this review.'))
    .toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Close connection review' }))
    .toHaveFocus();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('renders a partial review when relationship authority is unavailable', () => {
  render(
    <VariablesExecutionFlowReviewModal
      review={{
        ...review,
        relationshipsAvailable: false,
        connectionCount: 0,
        steps: review.steps.map(step => ({ ...step, connections: [] })),
        blocks: review.blocks.map(block => ({
          ...block,
          steps: block.steps.map(step => ({ ...step, connections: [] })),
        })),
      }}
      scopeLabel="All Blocks"
      onClose={jest.fn()}
    />,
  );
  expect(screen.getByText('Relationship graph unavailable'))
    .toBeInTheDocument();
  expect(screen.getAllByText('Read account').length).toBeGreaterThan(0);
});

test('restores focus to the button that opened the review', () => {
  const Harness: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    const openerRef = React.useRef<HTMLButtonElement>(null);
    return (
      <>
        <button
          ref={openerRef}
          type="button"
          onClick={() => setOpen(true)}
        >
          Open review
        </button>
        {open && (
          <VariablesExecutionFlowReviewModal
            review={review}
            scopeLabel="All Blocks"
            returnFocusElement={openerRef.current}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  };
  render(<Harness />);
  const opener = screen.getByRole('button', { name: 'Open review' });
  fireEvent.click(opener);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(opener).toHaveFocus();
});
