import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type {
  DerivedRelationshipState,
  InstructionRelationshipEdge,
  InstructionRelationshipKind,
  RelationshipOwner,
} from '../bot-job-details/grid/domain/instructionRelationshipGraph';
import rulesCardStyles from '../RulesCard.module.scss';
import type { VariableInstructionNode } from '../variablesWorkspace.contract';
import VariablesCommandBoard from './VariablesCommandBoard';
import boardStyles from './VariablesCommandBoard.module.scss';

const OWNER: RelationshipOwner = {
  workspaceKind: 'BOT_JOB',
  homeBankingId: 2,
  botJobId: 30,
};

const command = (
  id: number,
  action: string,
  parentId: number | null,
  overrides: Partial<VariableInstructionNode> = {},
): VariableInstructionNode => ({
  id,
  name: `Instruction ${id}`,
  command: action,
  operation: '',
  blockId: 7,
  blockName: 'Login',
  blockOrder: 1,
  instructionOrder: id - 1639,
  parentId,
  parentBlockId: 7,
  variableId: action === 'GET' ? 12 : null,
  active: true,
  blockActive: true,
  ...overrides,
});

const elementEdge = (
  sourceId: number,
  state: 'CONNECTED' | 'RECONNECT_PARENT',
  targetId: number | null,
): InstructionRelationshipEdge => ({
  id: `ELEMENT_TARGET:${sourceId}:${state}`,
  kind: 'ELEMENT_TARGET',
  source: { entity: 'INSTRUCTION', owner: OWNER, id: sourceId },
  target: targetId === null
    ? null
    : { entity: 'INSTRUCTION', owner: OWNER, id: targetId },
  state,
  code: state === 'CONNECTED' ? null : 'MISSING_ELEMENT_TARGET',
  required: true,
  compatibleTargets: [],
});

const variableEdge = (
  sourceId: number,
  state: 'CONNECTED' | 'RECONNECT_VARIABLE',
  targetId: number | null,
): InstructionRelationshipEdge => ({
  id: `VARIABLE_BINDING:${sourceId}:${state}`,
  kind: 'VARIABLE_BINDING',
  source: { entity: 'INSTRUCTION', owner: OWNER, id: sourceId },
  target: targetId === null
    ? null
    : { entity: 'VARIABLE', owner: OWNER, id: targetId },
  state,
  code: state === 'CONNECTED' ? null : 'MISSING_VARIABLE_BINDING',
  required: true,
  compatibleTargets: [],
});

const structuralEdge = (
  sourceId: number,
  kind: Extract<
    InstructionRelationshipKind,
    'LOOP_ANCHOR' | 'CONDITIONAL_ROOT' | 'BLOCK_TARGET'
  >,
  state: Extract<
    DerivedRelationshipState,
    | 'CONNECTED'
    | 'RECONNECT_LOOP'
    | 'REPAIR_CONDITIONAL'
    | 'RECONNECT_BLOCK'
  >,
  code: string | null,
  targetId: number | null,
): InstructionRelationshipEdge => ({
  id: `${kind}:${sourceId}:${state}`,
  kind,
  source: { entity: 'INSTRUCTION', owner: OWNER, id: sourceId },
  target: targetId === null
    ? null
    : kind === 'BLOCK_TARGET'
      ? { entity: 'BLOCK', owner: OWNER, id: targetId }
      : { entity: 'INSTRUCTION', owner: OWNER, id: targetId },
  state,
  code,
  required: true,
  compatibleTargets: [],
});

const block = [{ id: 7, name: 'Login', order: 1, active: true }];

test.each([
  {
    label: 'LOOP',
    action: 'LOOP',
    kind: 'LOOP_ANCHOR' as const,
    state: 'RECONNECT_LOOP' as const,
    code: 'MISSING_LOOP_ANCHOR',
    accessibleName: /Reconnect Loop: missing loop anchor/i,
  },
  {
    label: 'conditional',
    action: 'ELSE',
    kind: 'CONDITIONAL_ROOT' as const,
    state: 'REPAIR_CONDITIONAL' as const,
    code: 'CONDITIONAL_ROOT_MISMATCH',
    accessibleName: /Repair Conditional: conditional root mismatch/i,
  },
  {
    label: 'Block navigation',
    action: 'GOTO',
    kind: 'BLOCK_TARGET' as const,
    state: 'RECONNECT_BLOCK' as const,
    code: 'MISSING_BLOCK_TARGET',
    accessibleName: /Reconnect Block: missing block target/i,
  },
])(
  'renders a red glowing clickable reconnect action for a missing $label relationship',
  ({ action, kind, state, code, accessibleName }) => {
    const instruction = command(1700, action, null, {
      parentBlockId: null,
      variableId: null,
    });
    const edge = structuralEdge(
      instruction.id!,
      kind,
      state,
      code,
      null,
    );
    const onReconnectParent = jest.fn();

    render(
      <VariablesCommandBoard
        blocks={block}
        instructions={[instruction]}
        relationshipEdges={[edge]}
        onReconnectParent={onReconnectParent}
      />,
    );

    const reconnect = screen.getByRole('button', {
      name: accessibleName,
    });
    expect(reconnect).toHaveClass(
      rulesCardStyles.red,
      rulesCardStyles.withBorder,
      rulesCardStyles.static,
      rulesCardStyles.pulse,
    );
    fireEvent.click(reconnect);

    expect(onReconnectParent).toHaveBeenCalledTimes(1);
    expect(onReconnectParent).toHaveBeenCalledWith(instruction.id, edge);
  },
);

test.each([
  {
    label: 'LOOP',
    action: 'LOOP',
    kind: 'LOOP_ANCHOR' as const,
    targetId: 1699,
    accessibleName: 'Loop connected (id: 1699)',
  },
  {
    label: 'conditional',
    action: 'ELSE',
    kind: 'CONDITIONAL_ROOT' as const,
    targetId: 1698,
    accessibleName: 'Conditional connected (id: 1698)',
  },
  {
    label: 'Block navigation',
    action: 'EXCEL GOTO',
    kind: 'BLOCK_TARGET' as const,
    targetId: 8,
    accessibleName: 'Block connected (id: 8)',
  },
])(
  'keeps a connected $label badge orange, visible, clickable, and non-independent',
  ({ action, kind, targetId, accessibleName }) => {
    const instruction = command(1700, action, targetId, {
      parentBlockId: kind === 'BLOCK_TARGET' ? targetId : 7,
      variableId: null,
    });
    const edge = structuralEdge(
      instruction.id!,
      kind,
      'CONNECTED',
      null,
      targetId,
    );
    const onReconnectParent = jest.fn();

    render(
      <VariablesCommandBoard
        blocks={block}
        instructions={[instruction]}
        relationshipEdges={[edge]}
        onReconnectParent={onReconnectParent}
      />,
    );

    const connected = screen.getByRole('button', {
      name: accessibleName,
    });
    expect(connected).toHaveClass(boardStyles.connectedParent);
    expect(screen.queryByText('Independent')).not.toBeInTheDocument();
    fireEvent.click(connected);

    expect(onReconnectParent).toHaveBeenCalledTimes(1);
    expect(onReconnectParent).toHaveBeenCalledWith(instruction.id, edge);
  },
);

test('always shows the connected or reconnect parent badge in Variables', () => {
  const parent = command(1640, 'O', null);
  const connected = command(1641, 'GET', parent.id);
  const missing = command(1642, 'GET', null);
  const connectedEdge = elementEdge(
    connected.id!,
    'CONNECTED',
    parent.id,
  );
  const missingEdge = elementEdge(missing.id!, 'RECONNECT_PARENT', null);
  const onReconnectParent = jest.fn();

  render(
    <VariablesCommandBoard
      blocks={block}
      instructions={[parent, connected, missing]}
      relationshipEdges={[
        connectedEdge,
        missingEdge,
      ]}
      onReconnectParent={onReconnectParent}
    />,
  );

  const connectedParent = screen.getByRole('button', {
    name: 'Parent connected (id: 1640)',
  });
  expect(connectedParent).toHaveClass(boardStyles.connectedParent);
  fireEvent.click(connectedParent);

  fireEvent.click(screen.getByRole('button', {
    name: /Reconnect parent: missing element target/i,
  }));
  expect(onReconnectParent).toHaveBeenNthCalledWith(
    1,
    connected.id,
    connectedEdge,
  );
  expect(onReconnectParent).toHaveBeenNthCalledWith(
    2,
    missing.id,
    missingEdge,
  );
});

test('shows clickable connected and red reconnect variable badges in Variables', () => {
  const parent = command(1640, 'O', null);
  const connected = command(1641, 'GET', parent.id);
  const staleBroken = command(1642, 'GET', parent.id, { variableId: 12 });
  const connectedEdge = variableEdge(connected.id!, 'CONNECTED', 12);
  const brokenEdge = variableEdge(
    staleBroken.id!,
    'RECONNECT_VARIABLE',
    null,
  );
  const onReconnectVariable = jest.fn();

  render(
    <VariablesCommandBoard
      blocks={block}
      instructions={[parent, connected, staleBroken]}
      relationshipEdges={[connectedEdge, brokenEdge]}
      onReconnectVariable={onReconnectVariable}
    />,
  );

  const connectedVariable = screen.getByRole('button', {
    name: 'Variable connected (id: 12)',
  });
  expect(connectedVariable).toHaveClass(
    boardStyles.connectedVariable,
    boardStyles.variableButton,
  );
  fireEvent.click(connectedVariable);

  const reconnectVariable = screen.getByRole('button', {
    name: /Reconnect variable: missing variable binding/i,
  });
  expect(reconnectVariable).toHaveClass(
    rulesCardStyles.red,
    rulesCardStyles.withBorder,
    rulesCardStyles.static,
    rulesCardStyles.pulse,
  );
  fireEvent.click(reconnectVariable);

  expect(onReconnectVariable).toHaveBeenNthCalledWith(
    1,
    connected.id,
    connectedEdge,
  );
  expect(onReconnectVariable).toHaveBeenNthCalledWith(
    2,
    staleBroken.id,
    brokenEdge,
  );
  expect(screen.getAllByLabelText('Variable connected (id: 12)'))
    .toHaveLength(1);
});

test('uses a DTO fallback only when no authoritative parent edge exists', () => {
  const parent = command(1640, 'O', null);
  const fallbackConnected = command(1641, 'GET', parent.id);
  const staleBroken = command(1642, 'GET', parent.id);

  render(
    <VariablesCommandBoard
      blocks={block}
      instructions={[parent, fallbackConnected, staleBroken]}
      relationshipEdges={[
        elementEdge(staleBroken.id!, 'RECONNECT_PARENT', null),
      ]}
      onReconnectParent={jest.fn()}
    />,
  );

  expect(screen.getAllByLabelText('Parent connected (id: 1640)'))
    .toHaveLength(1);
  expect(screen.getByRole('button', {
    name: /Reconnect parent: missing element target/i,
  })).toBeInTheDocument();
});

test('uses a DTO variable fallback only when no authoritative binding edge exists', () => {
  const parent = command(1640, 'O', null);
  const fallbackConnected = command(1641, 'GET', parent.id, {
    variableId: 12,
  });
  const staleBroken = command(1642, 'GET', parent.id, {
    variableId: 12,
  });

  render(
    <VariablesCommandBoard
      blocks={block}
      instructions={[parent, fallbackConnected, staleBroken]}
      relationshipEdges={[
        variableEdge(staleBroken.id!, 'RECONNECT_VARIABLE', null),
      ]}
      onReconnectVariable={jest.fn()}
    />,
  );

  expect(screen.getAllByLabelText('Variable connected (id: 12)'))
    .toHaveLength(1);
  expect(screen.getByRole('button', {
    name: /Reconnect variable: missing variable binding/i,
  })).toHaveClass(rulesCardStyles.red);
});

const filterBlocks = [
  { id: 7, name: 'Login', order: 1, active: true },
  { id: 8, name: 'Payment', order: 2, active: true },
];

const filterInstructions: VariableInstructionNode[] = [
  command(1640, 'O', null, {
    name: 'Username field',
    blockId: 7,
    blockName: 'Login',
    blockOrder: 1,
    instructionOrder: 1,
    variableId: null,
  }),
  command(1641, 'GET', 1640, {
    name: 'Read username',
    operation: 'account owner',
    blockId: 7,
    blockName: 'Login',
    blockOrder: 1,
    instructionOrder: 2,
  }),
  command(1700, 'CK', null, {
    name: 'Validate payment',
    operation: 'beneficiary amount',
    blockId: 8,
    blockName: 'Payment',
    blockOrder: 2,
    instructionOrder: 1,
    variableId: 12,
  }),
];

test('filters commands by text and restores all rows when cleared', () => {
  render(
    <VariablesCommandBoard
      blocks={filterBlocks}
      instructions={filterInstructions}
      onInstructionDragStart={jest.fn()}
    />,
  );

  const search = screen.getByRole('searchbox', { name: 'Search commands' });
  fireEvent.change(search, { target: { value: 'beneficiary CK' } });

  expect(screen.getByText('Validate payment')).toBeInTheDocument();
  expect(screen.queryByText('Username field')).not.toBeInTheDocument();
  expect(screen.queryByText('Read username')).not.toBeInTheDocument();
  expect(screen.getByText('1 / 3')).toBeInTheDocument();

  fireEvent.change(search, { target: { value: '' } });

  expect(screen.getByText('Username field')).toBeInTheDocument();
  expect(screen.getByText('Read username')).toBeInTheDocument();
  expect(screen.getByText('Validate payment')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('keeps filtered rows draggable and submits authoritative drop indices', () => {
  const onInstructionDragStart = jest.fn();
  const onDropTarget = jest.fn();
  const { container } = render(
    <VariablesCommandBoard
      blocks={filterBlocks}
      instructions={filterInstructions}
      onInstructionDragStart={onInstructionDragStart}
      onDropTarget={onDropTarget}
    />,
  );

  const commandRow = screen.getByText('Read username').closest('article');
  expect(commandRow).toHaveAttribute('draggable', 'true');

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search commands' }),
    { target: { value: 'Read username' } },
  );

  expect(screen.getByText('Read username').closest('article'))
    .toHaveAttribute('draggable', 'true');
  expect(screen.queryByText('Clear command search to move rows'))
    .not.toBeInTheDocument();
  expect(
    Array.from(container.querySelectorAll('[data-drop-index]'))
      .map(element => element.getAttribute('data-drop-index')),
  ).toEqual(['1', '2']);

  const row = screen.getByText('Read username').closest('article')!;
  fireEvent.dragStart(row);
  expect(onInstructionDragStart).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ id: 1641 }),
  );

  const afterFilteredRow = container.querySelector('[data-drop-index="2"]')!;
  fireEvent.drop(afterFilteredRow);
  expect(onDropTarget).toHaveBeenCalledWith(
    expect.anything(),
    { blockId: 7, index: 2 },
  );

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search commands' }),
    { target: { value: '' } },
  );
  expect(screen.getByText('Read username').closest('article'))
    .toHaveAttribute('draggable', 'true');
});

test('clears command and Block filters when the workspace owner changes', () => {
  const { rerender } = render(
    <VariablesCommandBoard
      workspaceIdentityKey="2:30"
      blocks={filterBlocks}
      instructions={filterInstructions}
    />,
  );

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search commands' }),
    { target: { value: 'beneficiary' } },
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Block' }));
  fireEvent.click(screen.getByRole('option', { name: /#2 Payment/i }));
  expect(screen.queryByText('Username field')).not.toBeInTheDocument();

  rerender(
    <VariablesCommandBoard
      workspaceIdentityKey="2:32"
      blocks={filterBlocks}
      instructions={filterInstructions}
    />,
  );

  expect(screen.getByRole('searchbox', { name: 'Search commands' }))
    .toHaveValue('');
  expect(screen.getByRole('combobox', { name: 'Block' }))
    .toHaveValue('');
  expect(screen.getByText('Username field')).toBeInTheDocument();
  expect(screen.getByText('Validate payment')).toBeInTheDocument();
});

test('selects from the whole row without double-triggering nested actions', () => {
  const instruction = command(1641, 'GET', 1640);
  const edge = elementEdge(instruction.id!, 'CONNECTED', 1640);
  const onSelectInstruction = jest.fn();
  const onReconnectParent = jest.fn();
  render(
    <VariablesCommandBoard
      blocks={block}
      instructions={[instruction]}
      relationshipEdges={[edge]}
      onSelectInstruction={onSelectInstruction}
      onReconnectParent={onReconnectParent}
    />,
  );

  fireEvent.click(screen.getByText('#2'));
  expect(onSelectInstruction).toHaveBeenCalledTimes(1);
  expect(onSelectInstruction).toHaveBeenLastCalledWith(1641);

  fireEvent.click(screen.getByText('Instruction 1641'));
  expect(onSelectInstruction).toHaveBeenCalledTimes(2);

  fireEvent.click(screen.getByRole('button', {
    name: 'Parent connected (id: 1640)',
  }));
  expect(onReconnectParent).toHaveBeenCalledTimes(1);
  expect(onSelectInstruction).toHaveBeenCalledTimes(2);
});

test('renders resolve and review as independent fixed glowing actions', () => {
  const onResolveVisibleConnections = jest.fn();
  const onReviewVisibleConnections = jest.fn();
  render(
    <VariablesCommandBoard
      blocks={filterBlocks}
      instructions={filterInstructions}
      onResolveVisibleConnections={onResolveVisibleConnections}
      onReviewVisibleConnections={onReviewVisibleConnections}
    />,
  );

  const resolve = screen.getByRole('button', {
    name: /RESOLVE ALL CONNECTIONS/i,
  });
  const review = screen.getByRole('button', {
    name: /REVIEW ALL CONNECTIONS/i,
  });
  expect(resolve).toHaveClass(
    rulesCardStyles.orange,
    rulesCardStyles.withBorder,
    rulesCardStyles.static,
    rulesCardStyles.pulse,
    boardStyles.resolveConnectionsAction,
  );
  expect(review).toHaveClass(
    rulesCardStyles.green,
    rulesCardStyles.withBorder,
    rulesCardStyles.static,
    rulesCardStyles.pulse,
    boardStyles.reviewConnectionsAction,
  );
  expect(review).toHaveAttribute(
    'title',
    expect.stringContaining('Review connections for All Blocks'),
  );
  fireEvent.click(resolve);
  fireEvent.click(review);
  expect(onResolveVisibleConnections).toHaveBeenCalledWith(
    expect.objectContaining({ instructionIds: [1640, 1641, 1700] }),
  );
  expect(onReviewVisibleConnections).toHaveBeenCalledWith(
    expect.objectContaining({ instructionIds: [1640, 1641, 1700] }),
  );
});

test('keeps resolve and review enabled while mutation actions remain disabled', () => {
  const onResolveVisibleConnections = jest.fn();
  const onReviewVisibleConnections = jest.fn();
  const onReleaseVisibleConnections = jest.fn();
  render(
    <VariablesCommandBoard
      blocks={filterBlocks}
      instructions={filterInstructions}
      disabled
      unavailableReason="Read-only snapshot"
      onResolveVisibleConnections={onResolveVisibleConnections}
      onReviewVisibleConnections={onReviewVisibleConnections}
      onReleaseVisibleConnections={onReleaseVisibleConnections}
    />,
  );

  const resolve = screen.getByRole('button', {
    name: /RESOLVE ALL CONNECTIONS/i,
  });
  const review = screen.getByRole('button', {
    name: /REVIEW ALL CONNECTIONS/i,
  });
  const release = screen.getByRole('button', {
    name: /RELEASE ALL CONNECTIONS/i,
  });
  expect(resolve).toBeEnabled();
  expect(review).toBeEnabled();
  expect(release).toBeDisabled();

  fireEvent.click(resolve);
  fireEvent.click(review);
  expect(onResolveVisibleConnections).toHaveBeenCalledTimes(1);
  expect(onReviewVisibleConnections).toHaveBeenCalledTimes(1);
  fireEvent.click(release);
  expect(onReleaseVisibleConnections).not.toHaveBeenCalled();
});

test('combines the Block selector with command text filtering', () => {
  render(
    <VariablesCommandBoard
      blocks={filterBlocks}
      instructions={filterInstructions}
      onInstructionDragStart={jest.fn()}
    />,
  );

  const blockSelector = screen.getByRole('combobox', { name: 'Block' });
  fireEvent.click(blockSelector);
  fireEvent.click(screen.getByRole('option', { name: /#2 Payment/i }));

  expect(screen.getByText('Validate payment')).toBeInTheDocument();
  expect(screen.queryByText('Username field')).not.toBeInTheDocument();
  expect(screen.queryByText('Read username')).not.toBeInTheDocument();

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search commands' }),
    { target: { value: 'does-not-exist' } },
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'No Bot Job blocks or commands are available.',
  );

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search commands' }),
    { target: { value: '' } },
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Block' }));
  fireEvent.click(screen.getByRole('option', { name: 'All blocks' }));

  expect(screen.getByText('Username field')).toBeInTheDocument();
  expect(screen.getByText('Validate payment')).toBeInTheDocument();
});

test('places bulk connection actions after both filters and submits the visible scope', () => {
  const onResolveVisibleConnections = jest.fn();
  const onReleaseVisibleConnections = jest.fn();
  render(
    <VariablesCommandBoard
      blocks={filterBlocks}
      instructions={filterInstructions}
      onResolveVisibleConnections={onResolveVisibleConnections}
      onReleaseVisibleConnections={onReleaseVisibleConnections}
    />,
  );

  const commandSearch = screen.getByRole('searchbox', {
    name: 'Search commands',
  });
  const blockSearch = screen.getByRole('combobox', { name: 'Block' });
  const resolve = screen.getByRole('button', {
    name: /RESOLVE ALL CONNECTIONS/i,
  });
  const release = screen.getByRole('button', {
    name: /RELEASE ALL CONNECTIONS/i,
  });

  expect(
    blockSearch.compareDocumentPosition(resolve)
      & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  fireEvent.click(blockSearch);
  fireEvent.click(screen.getByRole('option', { name: /#2 Payment/i }));
  fireEvent.change(commandSearch, {
    target: { value: 'beneficiary CK' },
  });

  fireEvent.click(resolve);
  fireEvent.click(release);

  expect(onResolveVisibleConnections).toHaveBeenCalledWith(
    expect.objectContaining({
      instructionIds: [1700],
      visibleCount: 1,
      totalCount: 3,
      commandSearch: 'beneficiary CK',
      blockId: 8,
      blockLabel: 'Block #2 Payment',
    }),
  );
  expect(onReleaseVisibleConnections).toHaveBeenCalledWith(
    expect.objectContaining({
      instructionIds: [1700],
      visibleCount: 1,
      blockId: 8,
    }),
  );
});
