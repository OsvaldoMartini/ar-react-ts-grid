import React from 'react';
import {
  createEvent,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableInstructionNode,
} from '../variablesWorkspace.contract';
import VariableExecutionLane from './VariableExecutionLane';

const owner: VariableInstructionNode = {
  id: 100,
  name: 'Account field',
  command: 'Web Field',
  operation: '',
  blockId: 10,
  blockName: 'Login',
  blockOrder: 1,
  instructionOrder: 1,
  parentId: null,
  parentBlockId: null,
  variableId: 1,
  active: true,
  blockActive: true,
};

const command = (
  id: number,
  blockId: number,
  blockName: string,
  blockOrder: number,
  instructionOrder: number,
  role: VariableCommandLink['role'],
): VariableCommandLink => ({
  id,
  name: `Instruction ${id}`,
  command: role === 'PRODUCER' ? 'GET' : 'CK',
  operation: '',
  blockId,
  blockName,
  blockOrder,
  instructionOrder,
  parentId: 100,
  parentBlockId: 10,
  variableId: 1,
  active: true,
  blockActive: true,
  role,
  diagnostics: [],
});

const commands = [
  command(101, 10, 'Login', 1, 2, 'PRODUCER'),
  command(201, 20, 'Summary', 2, 1, 'CONSUMER'),
];

const variable: VariableGraphEntry = {
  id: 1,
  name: 'Account number',
  type: '$String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner,
  commands,
  producers: [commands[0]],
  consumers: [commands[1]],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: false,
  health: 'HEALTHY',
};

const dataTransfer = () => {
  const data = new Map<string, string>();
  return {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? '',
  };
};

test('renders an exact AFTER drop gap at the end of every displayed block', () => {
  const { container } = render(
    <VariableExecutionLane
      variable={variable}
      authorityKey="binding-1:revision-1"
      disabled={false}
      onMove={jest.fn()}
    />,
  );

  expect(container.querySelectorAll('[data-drop-placement="AFTER"]')).toHaveLength(2);
  expect(container.querySelectorAll('[data-drop-placement="BEFORE"]')).toHaveLength(3);
  expect(container.querySelector('[data-testid="variables-lane-row-100"]'))
    .toHaveAttribute('draggable', 'false');
  expect(container.querySelector('[data-testid="variables-lane-row-101"]'))
    .toHaveAttribute('draggable', 'true');
});

test('drops on the visible top or bottom half of a row with exact placement', () => {
  const onMove = jest.fn();
  render(
    <VariableExecutionLane
      variable={variable}
      authorityKey={'binding-1:revision-1'}
      disabled={false}
      onMove={onMove}
    />,
  );
  const source = screen.getByTestId('variables-lane-row-101');
  const target = screen.getByTestId('variables-lane-row-201');
  jest.spyOn(target, 'getBoundingClientRect').mockReturnValue({
    top: 100,
    bottom: 140,
    height: 40,
    left: 0,
    right: 200,
    width: 200,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  });

  const firstTransfer = dataTransfer();
  fireEvent.dragStart(source, { dataTransfer: firstTransfer });
  const beforeOver = createEvent.dragOver(target, {
    dataTransfer: firstTransfer,
  });
  Object.defineProperty(beforeOver, 'clientY', { value: 108 });
  fireEvent(target, beforeOver);
  expect(target.className).toContain('rowDropBefore');
  const beforeDrop = createEvent.drop(target, {
    dataTransfer: firstTransfer,
  });
  Object.defineProperty(beforeDrop, 'clientY', { value: 108 });
  fireEvent(target, beforeDrop);
  expect(onMove).toHaveBeenLastCalledWith(101, 201, 'BEFORE');

  const secondTransfer = dataTransfer();
  fireEvent.dragStart(source, { dataTransfer: secondTransfer });
  const afterOver = createEvent.dragOver(target, {
    dataTransfer: secondTransfer,
  });
  Object.defineProperty(afterOver, 'clientY', { value: 132 });
  fireEvent(target, afterOver);
  expect(target.className).toContain('rowDropAfter');
  const afterDrop = createEvent.drop(target, {
    dataTransfer: secondTransfer,
  });
  Object.defineProperty(afterDrop, 'clientY', { value: 132 });
  fireEvent(target, afterDrop);
  expect(onMove).toHaveBeenLastCalledWith(101, 201, 'AFTER');
  expect(onMove).toHaveBeenCalledTimes(2);
});

test('renders explicit cross-block zones and hides the active source block zone', () => {
  const transfer = dataTransfer();
  const { container } = render(
    <VariableExecutionLane
      variable={variable}
      authorityKey="binding-1:revision-1"
      disabled={false}
      crossBlockDropZones={[{
        blockId: 10,
        blockOrderNumber: 1,
        label: '#1 Login',
        anchorInstructionId: 101,
        placement: 'AFTER',
      }, {
        blockId: 20,
        blockOrderNumber: 2,
        label: '#2 Summary',
        anchorInstructionId: 201,
        placement: 'AFTER',
      }]}
      onMove={jest.fn()}
    />,
  );

  expect(screen.getByTestId('variables-block-drop-zone-10'))
    .toBeInTheDocument();
  expect(screen.getByTestId('variables-block-drop-zone-20'))
    .toBeInTheDocument();

  fireEvent.dragStart(
    container.querySelector(
      '[data-testid="variables-lane-row-101"]',
    ) as HTMLElement,
    { dataTransfer: transfer },
  );

  expect(screen.queryByTestId('variables-block-drop-zone-10'))
    .not.toBeInTheDocument();
  expect(screen.getByTestId('variables-block-drop-zone-20'))
    .toBeInTheDocument();
});

test('shows a visible reconnect state for a disconnected variable command', () => {
  const disconnected = {
    ...commands[1],
    parentId: null,
    parentBlockId: null,
    role: 'INVALID_LINK' as const,
  };
  const disconnectedVariable: VariableGraphEntry = {
    ...variable,
    commands: [commands[0], disconnected],
    consumers: [],
    invalidLinks: [disconnected],
  };
  const { container } = render(
    <VariableExecutionLane
      variable={disconnectedVariable}
      authorityKey="binding-1:revision-1"
      disabled={false}
      onMove={jest.fn()}
    />,
  );

  expect(screen.getByText('Reconnect parent')).toBeInTheDocument();
  expect(container.querySelector('[data-testid="variables-lane-row-201"]'))
    .toHaveAttribute('draggable', 'false');
});
