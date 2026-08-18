import type { VariableWorkspaceSnapshot } from '../../variablesWorkspace.contract';
import { buildVariableResolutionAssignments } from './variableResolutionAssignments';

const command = (id: number, action: string, blockOrder: number, instructionOrder: number) => ({
  id,
  name: `${action} ${id}`,
  command: action,
  operation: '',
  blockId: blockOrder,
  blockName: `Block ${blockOrder}`,
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  active: true,
  blockActive: true,
  variableSlots: [],
});

const snapshot = {
  commands: [
    command(40, 'SET', 2, 2),
    command(20, 'CK', 1, 4),
    command(10, 'GET', 1, 2),
    command(30, 'CK', 2, 1),
    command(50, 'CLICK', 2, 3),
    command(15, 'E', 1, 3),
  ],
} as unknown as VariableWorkspaceSnapshot;

test('Same Vars shares suffixed _1 names across eligible commands', () => {
  const plan = buildVariableResolutionAssignments(snapshot, [40, 20, 10, 30, 50, 15], 'SAME');
  expect(plan.checks).toEqual([
    { instructionId: 20, leftName: 'Left_Operand_1', rightName: 'Right_Operand_1' },
    { instructionId: 30, leftName: 'Left_Operand_1', rightName: 'Right_Operand_1' },
  ]);
  expect(plan.commands).toEqual([
    { instructionId: 10, variableName: 'Variable_1' },
    { instructionId: 15, variableName: 'Variable_1' },
    { instructionId: 40, variableName: 'Variable_1' },
  ]);
});

test('Distinct assigns sequential names by block and instruction order', () => {
  const plan = buildVariableResolutionAssignments(snapshot, [40, 20, 10, 30, 50, 15], 'DISTINCT');
  expect(plan.checks).toEqual([
    { instructionId: 20, leftName: 'Left_Operand_1', rightName: 'Right_Operand_1' },
    { instructionId: 30, leftName: 'Left_Operand_2', rightName: 'Right_Operand_2' },
  ]);
  expect(plan.commands).toEqual([
    { instructionId: 10, variableName: 'Variable_1' },
    { instructionId: 15, variableName: 'Variable_2' },
    { instructionId: 40, variableName: 'Variable_3' },
  ]);
});
