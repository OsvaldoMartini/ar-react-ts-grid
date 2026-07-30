import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import InstructionRelationshipDetails from './InstructionRelationshipDetails';
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
): InstructionRelationshipEdge => ({
  id: `${kind}:${sourceId}:${state}:${code ?? 'NONE'}`,
  kind,
  source: { entity: 'INSTRUCTION', owner: OWNER, id: sourceId },
  target: null,
  state,
  code,
  required: true,
  compatibleTargets: [],
});

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
        relationshipEdge('CONNECTED', null, 'LOOP_ANCHOR', loop.id),
      ]}
    />,
  );

  expect(screen.getByTestId('instruction-relationship-details-918'))
    .toHaveTextContent('Time 5s Loop 100 times Jump To Parent (917)Pagina iniziale');
  expect(screen.getByText('Time')).toHaveStyle({ color: '#0b5394' });
  expect(screen.getByText('5s')).toHaveStyle({ color: '#FFA500' });
  expect(screen.getByText('(917)Pagina iniziale')).toHaveStyle({ color: '#b163ff' });
  expect(screen.queryByLabelText(/Reconnect|Repair|Fix order|Memory only/i))
    .not.toBeInTheDocument();
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
    operationText: '(N/A)Unknown',
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
    operationText: '(3)Future field',
    chipName: /Fix order: Element target order/i,
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
    operationText: '(4)Other Block Field',
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
