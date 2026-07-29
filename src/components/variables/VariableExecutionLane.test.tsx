import React from 'react';
import { render } from '@testing-library/react';
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
