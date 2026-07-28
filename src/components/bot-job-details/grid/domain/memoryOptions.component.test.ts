import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  componentInstructionMemoryItem,
  resolveMemoryGroupInstructions,
} from './memoryOptions';

const instruction: BlockLoopInstructionLoadDTO = {
  homeBankingId: 2,
  tagName: 'button',
  botJobId: 5,
  botJobName: 'Target Bot Job',
  id: 101,
  instructionOrderNumber: 1,
  name: 'Continue',
  description: '',
  blockId: 44,
  blockOrderNumber: 3,
  blockName: 'Reusable Login',
  blockActive: true,
  blockWait: 0,
  actions: 'CLICK',
  instructionActive: true,
};

test('component instruction memory item uses a collision-safe key and authoritative ids', () => {
  expect(componentInstructionMemoryItem(instruction, 'revision-7')).toEqual(
    expect.objectContaining({
      key: 'COMPONENT:INSTRUCTION:2:44:101',
      sourceKind: 'COMPONENT',
      sourceItemKey: 'INSTRUCTION:2:44:101',
      payload: {
        kind: 'INSTRUCTION',
        componentInstructionId: 101,
        componentBlockId: 44,
        sourceRevision: 'revision-7',
      },
    }),
  );
});

test('connected Memory resolution preserves authoritative order', () => {
  const getValue = {
    ...instruction,
    id: 102,
    instructionOrderNumber: 2,
    name: 'Get Value',
    actions: 'GET',
    parentId: 101,
    variableId: 501,
  };
  const excel = {
    ...instruction,
    id: 103,
    instructionOrderNumber: 3,
    name: 'Extract Field',
    actions: 'E',
    parentId: 101,
    variableId: 501,
  };
  const resolution = resolveMemoryGroupInstructions(
    excel,
    [instruction, getValue, excel],
    [
      { id: 102, order: 2, name: 'Get Value', action: 'GET', parentId: 101, blockId: 44 },
      { id: 101, order: 1, name: 'Continue', action: 'CLICK', parentId: null, blockId: 44 },
      { id: 103, order: 3, name: 'Extract Field', action: 'E', parentId: 101, blockId: 44 },
    ],
  );

  expect(resolution.ok).toBe(true);
  if (resolution.ok) {
    expect(resolution.instructions.map(row => row.id)).toEqual([102, 101, 103]);
  }
});

test('connected Memory resolution refuses a partial or stale group', () => {
  const excel = {
    ...instruction,
    id: 103,
    instructionOrderNumber: 3,
    name: 'Extract Field',
    actions: 'E',
    parentId: 101,
  };
  const resolution = resolveMemoryGroupInstructions(
    excel,
    [instruction, excel],
    [
      { id: 101, order: 1, name: 'Continue', action: 'CLICK', parentId: null, blockId: 44 },
      { id: 102, order: 2, name: 'Get Value', action: 'GET', parentId: 101, blockId: 44 },
      { id: 103, order: 3, name: 'Extract Field', action: 'E', parentId: 101, blockId: 44 },
    ],
  );

  expect(resolution).toEqual({
    ok: false,
    reason: 'The connected Memory group changed. Refresh the instruction grid.',
  });
});
