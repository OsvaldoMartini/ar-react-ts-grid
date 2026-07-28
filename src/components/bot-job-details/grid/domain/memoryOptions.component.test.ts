import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  componentInstructionMemoryItem,
  projectMemorySelections,
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

test('Bot Job EXCEL GOTO is resolved but cannot be duplicated inside the same job', () => {
  const excelGoto: BlockLoopInstructionLoadDTO = {
    ...instruction,
    id: 104,
    actions: 'EXCEL GOTO',
    name: 'Excel navigation',
  };

  expect(
    projectMemorySelections([excelGoto], [], 'BOT_JOB_COPY').instructions.get(104),
  ).toEqual(expect.objectContaining({
    canAdd: false,
    addReason: expect.stringContaining('only one EXCEL GOTO'),
  }));
  expect(
    projectMemorySelections([excelGoto], [], 'COMPONENT_COPY').instructions.get(104),
  ).toEqual(expect.objectContaining({
    canAdd: true,
  }));
});

test('does not expose a DIRECT action when it selects the same members as FULL', () => {
  const getValue: BlockLoopInstructionLoadDTO = {
    ...instruction,
    id: 102,
    instructionOrderNumber: 2,
    actions: 'GET',
    parentId: 101,
    variableId: 501,
  };
  const selection = projectMemorySelections(
    [{ ...instruction, variableId: 501 }, getValue],
    [{ id: 501, instructionId: 101 }],
    'BOT_JOB_COPY',
  ).instructions.get(102);

  expect(selection?.canAdd).toBe(true);
  expect(selection?.memoryGroupRows?.map((row) => row.id)).toEqual([101, 102]);
  expect(selection?.directMemorySelection).toBeUndefined();
});

test('exposes DIRECT when it removes positional conditional body rows', () => {
  const rows: BlockLoopInstructionLoadDTO[] = [
    { ...instruction, id: 201, instructionOrderNumber: 1, actions: 'IF', parentId: 201 },
    { ...instruction, id: 202, instructionOrderNumber: 2, actions: 'C' },
    { ...instruction, id: 203, instructionOrderNumber: 3, actions: 'ELSE', parentId: 201 },
    { ...instruction, id: 204, instructionOrderNumber: 4, actions: 'C' },
    { ...instruction, id: 205, instructionOrderNumber: 5, actions: 'ENDIF', parentId: 201 },
  ];
  const selection = projectMemorySelections(
    rows,
    [],
    'BOT_JOB_COPY',
  ).instructions.get(201);

  expect(selection?.memoryGroupRows?.map((row) => row.id)).toEqual([
    201, 202, 203, 204, 205,
  ]);
  expect(selection?.directMemorySelection?.memoryGroupRows?.map(
    (row) => row.id,
  )).toEqual([201, 203, 205]);
});
