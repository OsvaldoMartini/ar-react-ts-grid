import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ReconnectRelationshipDialog, {
  type ReconnectRelationshipDialogProps,
  type ReconnectRelationshipOption,
} from './ReconnectRelationshipDialog';
import type {
  InstructionRelationshipEdge,
  InstructionRelationshipKind,
  RelationshipOwner,
  RelationshipTarget,
} from './domain/instructionRelationshipGraph';

const OWNER: RelationshipOwner = {
  workspaceKind: 'BOT_JOB',
  homeBankingId: 2,
  botJobId: 5,
};

const instructionTarget = (id: number): RelationshipTarget => ({
  entity: 'INSTRUCTION',
  owner: OWNER,
  id,
});

const blockTarget = (id: number): RelationshipTarget => ({
  entity: 'BLOCK',
  owner: OWNER,
  id,
});

const relationshipEdge = (
  kind: InstructionRelationshipKind = 'LOOP_ANCHOR',
  overrides: Partial<InstructionRelationshipEdge> = {},
): InstructionRelationshipEdge => ({
  id: `${kind}:918`,
  kind,
  source: instructionTarget(918),
  target: instructionTarget(917),
  state: kind === 'BLOCK_TARGET' ? 'RECONNECT_BLOCK' : 'RECONNECT_LOOP',
  code: kind === 'BLOCK_TARGET'
    ? 'MISSING_BLOCK_TARGET'
    : 'MISSING_LOOP_ANCHOR',
  required: true,
  compatibleTargets: [],
  ...overrides,
});

const loopOptions: ReconnectRelationshipOption[] = [
  {
    target: instructionTarget(917),
    label: '(917) Pagina iniziale',
    sublabel: 'Web Element · Block #1',
    badges: [{ text: 'WEB ELEMENT', tone: 'blue' }],
  },
  {
    target: instructionTarget(920),
    label: '(920) Account field',
    sublabel: 'Web Element · Block #1',
  },
];

const renderDialog = (
  overrides: Partial<ReconnectRelationshipDialogProps> = {},
) => {
  const props: ReconnectRelationshipDialogProps = {
    edge: relationshipEdge(),
    sourceLabel: '(918) LOOP',
    currentTargetLabel: '(916) Old anchor',
    compatibleTargets: loopOptions,
    pending: false,
    onDisconnect: jest.fn(),
    onConnect: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
  render(<ReconnectRelationshipDialog {...props} />);
  return props;
};

test('shows LOOP parentId wording and an exact current-to-selected preview', () => {
  renderDialog({
    changeSummary: 'After instruction #2 in Block #3 Payment (block ID 30)',
  });

  expect(screen.getByRole('heading', { name: 'Reconnect LOOP anchor' }))
    .toBeInTheDocument();
  expect(screen.getByText(/Connecting writes parentId/i)).toBeInTheDocument();
  expect(screen.getByText('Current parentId')).toBeInTheDocument();
  expect(screen.getByText('(916) Old anchor')).toBeInTheDocument();
  expect(screen.getByText('Planned destination')).toBeInTheDocument();
  expect(screen.getByText(
    'After instruction #2 in Block #3 Payment (block ID 30)',
  )).toBeInTheDocument();
  expect(screen.getByText('Select a compatible Web Element'))
    .toBeInTheDocument();

  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('(917) Pagina iniziale'));

  expect(screen.getByText('Selected parentId')).toBeInTheDocument();
  expect(screen.getByText('(917) Pagina iniziale')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toHaveValue('(917) Pagina iniziale');
});

test('connects the exact caller-supplied target and requires a selection', () => {
  const props = renderDialog();
  const connect = screen.getByRole('button', { name: /^Connect$/i });

  expect(connect).toBeDisabled();
  fireEvent.click(connect);
  expect(props.onConnect).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('(920) Account field'));
  fireEvent.click(screen.getByRole('button', { name: /^Connect$/i }));

  expect(props.onConnect).toHaveBeenCalledTimes(1);
  expect(props.onConnect).toHaveBeenCalledWith(instructionTarget(920));
});

test('uses GOTO parentBlockId wording and only renders pre-filtered options', () => {
  const containingBlock = blockTarget(10);
  const destinationBlock = blockTarget(20);
  renderDialog({
    edge: relationshipEdge('BLOCK_TARGET', {
      target: null,
      // The graph edge deliberately contains an invalid self-target. The
      // presentation component must ignore it and use only caller options.
      compatibleTargets: [containingBlock, destinationBlock],
    }),
    sourceLabel: '(940) GOTO',
    currentTargetLabel: null,
    compatibleTargets: [{
      target: destinationBlock,
      label: '#2 Payment',
      sublabel: 'Block ID 20',
    }],
  });

  expect(screen.getByRole('heading', { name: 'Reconnect GOTO destination' }))
    .toBeInTheDocument();
  expect(screen.getByText(/Connecting writes parentBlockId/i))
    .toBeInTheDocument();
  expect(screen.getByText('Not connected')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('combobox'));
  expect(screen.getByText('#2 Payment')).toBeInTheDocument();
  expect(screen.queryByText(/Block ID 10/)).not.toBeInTheDocument();
  expect(screen.getByText('1 COMPATIBLE TARGET')).toBeInTheDocument();
});

test('exposes independent Disconnect, Cancel, close, and Escape callbacks', () => {
  const props = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: /Disconnect/i }));
  expect(props.onDisconnect).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel reconnect' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

  expect(props.onCancel).toHaveBeenCalledTimes(3);
});

test('places keyboard focus inside the dialog and traps boundary tabbing', () => {
  renderDialog();
  const combo = screen.getByRole('combobox');
  const dialog = screen.getByRole('dialog');
  expect(combo).toHaveFocus();
  fireEvent.click(combo);
  fireEvent.click(screen.getByText('(920) Account field'));

  const close = screen.getByRole('button', { name: 'Cancel reconnect' });
  const connect = screen.getByRole('button', { name: /^Connect$/i });
  connect.focus();
  fireEvent.keyDown(dialog, { key: 'Tab' });
  expect(close).toHaveFocus();

  close.focus();
  fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
  expect(connect).toHaveFocus();
});

test('locks every action while a relationship mutation is pending', () => {
  const props = renderDialog({ pending: true });
  const dialog = screen.getByRole('dialog');

  expect(screen.getByText('Saving relationship...')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeDisabled();
  expect(screen.getByRole('button', { name: /Disconnect/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel reconnect' }))
    .toBeDisabled();
  expect(screen.getByRole('button', { name: /Connecting/i })).toBeDisabled();

  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(props.onCancel).not.toHaveBeenCalled();
});
