import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import rulesCardStyles from '../../RulesCard.module.scss';
import InstructionRelationshipDetails from './InstructionRelationshipDetails';
import relationshipStyles from './InstructionRelationshipDetails.module.scss';
import type {
  DerivedRelationshipState,
  InstructionRelationshipEdge,
  InstructionRelationshipKind,
  RelationshipOwner,
} from './domain/instructionRelationshipGraph';

const OWNER: RelationshipOwner = {
  workspaceKind: 'BOT_JOB',
  homeBankingId: 2,
  botJobId: 5,
};

const row = (
  id: number,
  order: number,
  actions: string,
  overrides: Partial<BlockLoopInstructionLoadDTO> = {},
): BlockLoopInstructionLoadDTO => ({
  homeBankingId: 2,
  tagName: 'button',
  botJobId: 5,
  botJobName: 'Saldo Banca Stato',
  id,
  instructionOrderNumber: order,
  name: `Row ${id}`,
  description: '',
  blockId: 10,
  blockOrderNumber: 1,
  blockName: 'Login',
  blockActive: true,
  blockWait: 0,
  actions,
  instructionActive: true,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  ...overrides,
});

const relationshipEdge = (
  state: DerivedRelationshipState,
  code: string | null,
  kind: InstructionRelationshipKind = 'ELEMENT_TARGET',
  sourceId = 2,
  targetId: number | null = null,
): InstructionRelationshipEdge => {
  const target = targetId === null
    ? null
    : kind === 'VARIABLE_BINDING'
      ? { entity: 'VARIABLE' as const, owner: OWNER, id: targetId }
      : kind === 'BLOCK_TARGET'
        ? { entity: 'BLOCK' as const, owner: OWNER, id: targetId }
        : { entity: 'INSTRUCTION' as const, owner: OWNER, id: targetId };
  return {
    id: `${kind}:${sourceId}:${state}:${code ?? 'NONE'}`,
    kind,
    source: { entity: 'INSTRUCTION', owner: OWNER, id: sourceId },
    target,
    state,
    code,
    required: true,
    compatibleTargets: [],
  };
};

test('preserves the legacy LOOP relationship text and colors', () => {
  const parent = row(917, 1, 'O', { name: 'Pagina iniziale' });
  const loop = row(918, 2, 'LOOP', {
    parentId: 917,
    operation: '5:100',
  });

  render(
    <InstructionRelationshipDetails
      instruction={loop}
      allInstructions={[parent, loop]}
      relationshipEdges={[
        relationshipEdge(
          'CONNECTED',
          null,
          'LOOP_ANCHOR',
          loop.id,
          parent.id,
        ),
      ]}
    />,
  );

  expect(screen.getByTestId('instruction-relationship-details-918'))
    .toHaveTextContent('Time 5s Loop 100 times');
  expect(screen.getByText('Time')).toHaveStyle({ color: '#0b5394' });
  expect(screen.getByText('5s')).toHaveStyle({ color: '#FFA500' });
  expect(
    screen.getByLabelText('Loop connected (id: 917) Pagina iniziale'),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText(/Reconnect|Repair|Fix order|Memory only/i))
    .not.toBeInTheDocument();
});

test('keeps the connected parent badge visible and identifies its exact parent', () => {
  const parent = row(1640, 1, 'O', { name: 'User number' });
  const instruction = row(1641, 2, 'GET', {
    operation: 'user_number:value',
    parentId: parent.id,
    variableId: 100,
  });
  const edge = relationshipEdge(
    'CONNECTED',
    null,
    'ELEMENT_TARGET',
    instruction.id,
    parent.id,
  );
  const onReconnect = jest.fn();
  render(
    <InstructionRelationshipDetails
      instruction={instruction}
      allInstructions={[parent, instruction]}
      relationshipEdges={[edge]}
      onReconnect={onReconnect}
    />,
  );

  const connectedParent = screen.getByRole('button', {
    name: 'Parent connected (id: 1640) User number',
  });
  expect(connectedParent).toHaveClass(
    relationshipStyles.reconnectButton,
    relationshipStyles.connectedParent,
  );
  fireEvent.click(connectedParent);

  expect(onReconnect).toHaveBeenCalledTimes(1);
  expect(onReconnect).toHaveBeenCalledWith(edge);
  expect(screen.queryByText('Reconnect Parent')).not.toBeInTheDocument();
});

test('opens the exact connected variable edge from the purple badge', () => {
  const parent = row(1640, 1, 'O', { name: 'User number' });
  const instruction = row(1641, 2, 'GET', {
    operation: 'user_number:value',
    parentId: parent.id,
    variableId: 100,
  });
  const parentEdge = relationshipEdge(
    'CONNECTED',
    null,
    'ELEMENT_TARGET',
    instruction.id,
    parent.id,
  );
  const variableEdge = relationshipEdge(
    'CONNECTED',
    null,
    'VARIABLE_BINDING',
    instruction.id,
    100,
  );
  const onReconnect = jest.fn();

  render(
    <InstructionRelationshipDetails
      instruction={instruction}
      allInstructions={[parent, instruction]}
      relationshipEdges={[parentEdge, variableEdge]}
      onReconnect={onReconnect}
    />,
  );

  const connectedVariable = screen.getByRole('button', {
    name: 'Variable connected (id: 100)',
  });
  expect(connectedVariable).toHaveClass(
    relationshipStyles.reconnectButton,
    relationshipStyles.reconnectVariable,
  );
  fireEvent.click(connectedVariable);

  expect(onReconnect).toHaveBeenCalledTimes(1);
  expect(onReconnect).toHaveBeenCalledWith(variableEdge);
  expect(screen.queryByText('Reconnect Variable')).not.toBeInTheDocument();
});

test('an authoritative broken variable edge beats a stale DTO id and glows red', () => {
  const parent = row(1640, 1, 'O', { name: 'User number' });
  const instruction = row(1641, 2, 'GET', {
    operation: 'user_number:value',
    parentId: parent.id,
    variableId: 100,
  });
  const parentEdge = relationshipEdge(
    'CONNECTED',
    null,
    'ELEMENT_TARGET',
    instruction.id,
    parent.id,
  );
  const brokenVariableEdge = relationshipEdge(
    'RECONNECT_VARIABLE',
    'MISSING_VARIABLE_BINDING',
    'VARIABLE_BINDING',
    instruction.id,
  );
  const onReconnect = jest.fn();

  render(
    <InstructionRelationshipDetails
      instruction={instruction}
      allInstructions={[parent, instruction]}
      relationshipEdges={[parentEdge, brokenVariableEdge]}
      onReconnect={onReconnect}
    />,
  );

  const reconnectVariable = screen.getByRole('button', {
    name: /Reconnect variable: Missing variable binding/i,
  });
  expect(reconnectVariable).toHaveClass(
    rulesCardStyles.red,
    rulesCardStyles.withBorder,
    rulesCardStyles.static,
    rulesCardStyles.pulse,
  );
  expect(screen.queryByLabelText('Variable connected (id: 100)'))
    .not.toBeInTheDocument();

  fireEvent.click(reconnectVariable);
  expect(onReconnect).toHaveBeenCalledTimes(1);
  expect(onReconnect).toHaveBeenCalledWith(brokenVariableEdge);
});

test.each([
  {
    label: 'missing parent',
    instruction: row(2, 2, 'LOOP', {
      operation: '5:10',
      parentId: null,
    }),
    allInstructions: [] as BlockLoopInstructionLoadDTO[],
    edge: relationshipEdge(
      'RECONNECT_LOOP',
      'MISSING_LOOP_ANCHOR',
      'LOOP_ANCHOR',
    ),
    operationText: 'Time 5s Loop 10 times',
    chipName: /Reconnect loop: Missing loop anchor/i,
  },
  {
    label: 'late parent',
    instruction: row(2, 1, 'GET', {
      operation: 'user_number:value',
      parentId: 3,
      variableId: 100,
    }),
    allInstructions: [
      row(3, 2, 'O', { name: 'Future field' }),
    ],
    edge: relationshipEdge(
      'FIX_ORDER',
      'ELEMENT_TARGET_ORDER',
      'ELEMENT_TARGET',
    ),
    operationText: 'value',
    chipName: /Reconnect parent: Element target order/i,
  },
  {
    label: 'parent in another block',
    instruction: row(2, 2, 'REFRESH_LOOP', {
      operation: '3:20',
      parentId: 4,
    }),
    allInstructions: [
      row(4, 1, 'O', {
        name: 'Other Block Field',
        blockId: 20,
        blockOrderNumber: 2,
        blockName: 'Other',
      }),
    ],
    edge: relationshipEdge(
      'RECONNECT_LOOP',
      'LOOP_ANCHOR_WRONG_BLOCK',
      'LOOP_ANCHOR',
    ),
    operationText: 'Refresh 3s Loop 20 times',
    chipName: /Reconnect loop: Loop anchor wrong block/i,
  },
])(
  'never blanks details for a $label',
  ({ instruction, allInstructions, edge, operationText, chipName }) => {
    render(
      <InstructionRelationshipDetails
        instruction={instruction}
        allInstructions={[...allInstructions, instruction]}
        relationshipEdges={[edge]}
      />,
    );

    const details = screen.getByTestId(
      `instruction-relationship-details-${instruction.id}`,
    );
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent(operationText);
    expect(screen.getByLabelText(chipName)).toBeInTheDocument();
  },
);

test('renders multiple supplied states as read-only chips', () => {
  const instruction = row(2, 2, 'GET', {
    operation: 'user_number:value',
    parentId: null,
    variableId: null,
  });

  render(
    <InstructionRelationshipDetails
      instruction={instruction}
      allInstructions={[instruction]}
      relationshipEdges={[
        relationshipEdge(
          'RECONNECT_PARENT',
          'MISSING_ELEMENT_TARGET',
          'ELEMENT_TARGET',
        ),
        relationshipEdge(
          'RECONNECT_VARIABLE',
          'MISSING_VARIABLE_BINDING',
          'VARIABLE_BINDING',
        ),
        relationshipEdge(
          'MEMORY_ONLY',
          null,
          'VARIABLE_OWNER',
          100,
        ),
      ]}
      relationshipStates={['SAVING', 'REFUSED']}
    />,
  );

  expect(screen.getByLabelText(/Reconnect parent: Missing element target/i))
    .toBeInTheDocument();
  expect(screen.getByLabelText(/Reconnect variable: Missing variable binding/i))
    .toBeInTheDocument();
  expect(screen.getByLabelText('Memory only')).toBeInTheDocument();
  expect(screen.getByLabelText('Saving')).toBeInTheDocument();
  expect(screen.getByLabelText('Refused')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('opens the exact parent or variable reconnect edge from GridItem buttons', () => {
  const instruction = row(2, 2, 'GET', {
    operation: 'user_number:value',
    parentId: null,
    variableId: null,
  });
  const parentEdge = relationshipEdge(
    'RECONNECT_PARENT',
    'MISSING_ELEMENT_TARGET',
    'ELEMENT_TARGET',
  );
  const variableEdge = relationshipEdge(
    'RECONNECT_VARIABLE',
    'MISSING_VARIABLE_BINDING',
    'VARIABLE_BINDING',
  );
  const onReconnect = jest.fn();

  render(
    <InstructionRelationshipDetails
      instruction={instruction}
      allInstructions={[instruction]}
      relationshipEdges={[parentEdge, variableEdge]}
      onReconnect={onReconnect}
    />,
  );

  fireEvent.click(screen.getByRole('button', {
    name: /Reconnect parent: Missing element target/i,
  }));
  fireEvent.click(screen.getByRole('button', {
    name: /Reconnect variable: Missing variable binding/i,
  }));

  expect(onReconnect).toHaveBeenNthCalledWith(1, parentEdge);
  expect(onReconnect).toHaveBeenNthCalledWith(2, variableEdge);
});

test('keeps a stable third-column wrapper for an action without operation details', () => {
  const instruction = row(10, 1, 'PAUSE');

  render(
    <InstructionRelationshipDetails
      instruction={instruction}
      allInstructions={[instruction]}
    />,
  );

  const details = screen.getByTestId('instruction-relationship-details-10');
  expect(details).toBeInTheDocument();
  expect(details.textContent).toBe('\u00a0');
});
