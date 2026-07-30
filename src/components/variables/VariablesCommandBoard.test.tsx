import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type {
  InstructionRelationshipEdge,
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

const block = [{ id: 7, name: 'Login', order: 1, active: true }];

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
