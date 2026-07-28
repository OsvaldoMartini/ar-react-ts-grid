import { act, renderHook } from '@testing-library/react';
import { useInstructionMemory } from './useInstructionMemory';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { COMPONENT_INSTRUCTION_GRID_POLICY } from '../instructionGrid.policy';

const ins = (id: number, blockId: number, order: number): BlockLoopInstructionLoadDTO =>
  ({
    id,
    blockId,
    blockOrderNumber: order,
    blockName: `Block ${order}`,
    instructionOrderNumber: 1,
    actions: 'C',
  } as unknown as BlockLoopInstructionLoadDTO);

const data = [ins(1, 10, 1), ins(2, 10, 1), ins(3, 20, 2)];

const capability = (
  memoryGroupRows?: {
    id: number;
    order: number;
    name: string;
    action: string;
    parentId: number | null;
    blockId: number;
  }[],
  memoryGroupBlocks?: {
    blockId: number;
    blockOrderNumber?: number;
    blockName?: string;
  }[],
  memoryGroupKey = memoryGroupRows
    ? `I:${memoryGroupRows.map(row => row.id).sort((a, b) => a - b).join(',')}|B:`
    : undefined,
) => ({
  canAdd: true,
  canMove: true,
  canDelete: true,
  reason: '',
  deleteReason: '',
  allowedBlockIds: [10, 20],
  memoryGroupRows,
  memoryGroupBlocks,
  memoryGroupKey,
});

describe('useInstructionMemory', () => {
  it('seeds block options from data and starts with no memorized steps', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    expect(result.current.memorySteps).toEqual([]);
    expect(result.current.memoryTargetBlockId).toBeNull();
    expect(result.current.memoryBlockOptions.map((b) => b.blockId)).toEqual([10, 20]);
    expect(result.current.pendingMemoryMove).toBeNull();
  });

  it('handleAddToMemory ignores instructions without canAdd', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => result.current.handleAddToMemory(data[0]));
    expect(result.current.memorySteps).toEqual([]); // no capability yet
  });

  it('adds an eligible instruction once and bumps the open version', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => {
      result.current.setMemoryCapabilities(
        new Map([[1, { canAdd: true, canMove: false, canDelete: false, reason: '', deleteReason: '', allowedBlockIds: [] }]]),
      );
    });
    act(() => result.current.handleAddToMemory(data[0], 'revision-single'));
    act(() => result.current.handleAddToMemory(data[0], 'revision-single')); // duplicate ignored
    expect(result.current.memorySteps.map((s) => s.id)).toEqual([1]);
    expect((result.current.memorySteps[0] as typeof data[number] & {
      sourceRevision?: string;
    }).sourceRevision).toBe('revision-single');
    expect(result.current.memoryListOpenVersion).toBeGreaterThan(0);
    expect(result.current.memoryListOpenRequestedRef.current).toBe(true);
  });

  it('handleRemoveFromMemory drops the step by id', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => {
      result.current.setMemorySteps([data[0], data[2]]);
    });
    act(() => result.current.handleRemoveFromMemory(1));
    expect(result.current.memorySteps.map((s) => s.id)).toEqual([3]);
  });

  it('stages a connected Bot Job group atomically in backend order and deduplicates overlaps', () => {
    const field = { ...ins(4, 10, 1), instructionOrderNumber: 1, name: 'user_number' };
    const get = {
      ...ins(5, 10, 1),
      instructionOrderNumber: 2,
      name: 'Get Value',
      actions: 'GET',
      parentId: 4,
      variableId: 50,
    };
    const excel = {
      ...ins(6, 10, 1),
      instructionOrderNumber: 3,
      name: 'Extract Field',
      actions: 'E',
      parentId: 4,
      variableId: 50,
    };
    const current = [field, get, excel];
    const rows = [
      { id: 5, order: 2, name: 'Get Value', action: 'GET', parentId: 4, blockId: 10 },
      { id: 4, order: 1, name: 'user_number', action: 'C', parentId: null, blockId: 10 },
      { id: 6, order: 3, name: 'Extract Field', action: 'E', parentId: 4, blockId: 10 },
    ];
    const { result } = renderHook(() => useInstructionMemory(current));
    act(() => {
      result.current.setMemoryCapabilities(new Map([
        [6, capability(rows)],
        [5, capability(rows)],
      ]));
    });

    let firstResult: ReturnType<typeof result.current.handleAddConnectedGroupToMemory>;
    act(() => {
      firstResult = result.current.handleAddConnectedGroupToMemory(
        excel,
        current,
        'revision-bot-job',
      );
    });
    expect(firstResult!.ok).toBe(true);
    expect(result.current.memorySteps.map(step => step.id)).toEqual([5, 4, 6]);
    expect(result.current.memorySteps.every(
      step => String((step as typeof step & { dependencyGroupKey?: string })
        .dependencyGroupKey).endsWith('I:4,5,6|B:'),
    )).toBe(true);

    act(() => {
      result.current.handleAddConnectedGroupToMemory(
        get,
        current,
        'revision-bot-job',
      );
    });
    expect(result.current.memorySteps.map(step => step.id)).toEqual([5, 4, 6]);

    act(() => {
      result.current.handleRemoveFromMemory(5);
    });
    expect(result.current.memorySteps).toEqual([]);
  });

  it('stages only the authoritative DIRECT Bot Job rows and preserves source metadata', () => {
    const field = {
      ...ins(4, 10, 1),
      instructionOrderNumber: 1,
      name: 'user_number',
    };
    const get = {
      ...ins(5, 10, 1),
      instructionOrderNumber: 2,
      name: 'Get Value',
      actions: 'GET',
      parentId: 4,
      variableId: 50,
    };
    const excel = {
      ...ins(6, 10, 1),
      instructionOrderNumber: 3,
      name: 'Extract Field',
      actions: 'E',
      parentId: 4,
      variableId: 50,
    };
    const unrelated = {
      ...ins(7, 10, 1),
      instructionOrderNumber: 4,
      name: 'Unrelated consumer',
      actions: 'CHECK',
      variableId: 50,
    };
    const current = [field, get, excel, unrelated];
    const fullRows = current.map(row => ({
      id: row.id,
      order: row.instructionOrderNumber,
      name: row.name,
      action: row.actions,
      parentId: row.parentId ?? null,
      blockId: row.blockId,
    }));
    const directRows = fullRows.filter(row => row.id !== unrelated.id);
    const fullCapability = {
      ...capability(fullRows),
      directMemorySelection: {
        canAdd: true,
        addReason: '',
        memoryGroupRows: directRows,
        memoryGroupBlocks: [],
        memoryGroupKey: 'DIRECT:I:4,5,6|B:',
      },
    };
    const { result } = renderHook(() => useInstructionMemory(current));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[excel.id, fullCapability]]));
    });

    act(() => {
      result.current.handleAddConnectedGroupToMemory(
        excel,
        current,
        'revision-full',
        'FULL',
      );
    });
    expect(result.current.memorySteps.map(step => step.id)).toEqual([4, 5, 6, 7]);

    let stageResult: ReturnType<typeof result.current.handleAddConnectedGroupToMemory>;
    act(() => {
      stageResult = result.current.handleAddConnectedGroupToMemory(
        excel,
        current,
        'revision-direct',
        'DIRECT',
      );
    });

    expect(stageResult!.ok).toBe(true);
    expect(result.current.memorySteps.map(step => step.id)).toEqual([4, 5, 6]);
    expect(result.current.memorySteps.every(step => {
      const staged = step as typeof step & {
        dependencyGroupKey?: string;
        dependencySelectionScope?: string;
        sourceRevision?: string;
      };
      return staged.dependencyGroupKey?.endsWith('DIRECT:I:4,5,6|B:') === true
        && staged.dependencySelectionScope === 'DIRECT'
        && staged.sourceRevision === 'revision-direct';
    })).toBe(true);
  });

  it('replaces an overlapping Component FULL group instead of orphaning it after DIRECT staging', () => {
    const rows = [101, 102, 103, 104].map((id, index) => ({
      ...ins(id, 44, 3),
      homeBankingId: 2,
      instructionOrderNumber: index + 1,
      name: `Component ${id}`,
    }));
    const groupRows = rows.map(row => ({
      id: row.id,
      order: row.instructionOrderNumber,
      name: row.name,
      action: row.actions,
      parentId: null,
      blockId: row.blockId,
    }));
    const fullCapability = {
      ...capability(groupRows),
      directMemorySelection: {
        canAdd: true,
        addReason: '',
        memoryGroupRows: groupRows.slice(0, 3),
        memoryGroupBlocks: [],
        memoryGroupKey: 'DIRECT:I:101,102,103|B:',
      },
    };
    const { result } = renderHook(() =>
      useInstructionMemory(rows, COMPONENT_INSTRUCTION_GRID_POLICY));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[rows[0].id, fullCapability]]));
    });
    act(() => {
      result.current.handleAddConnectedGroupToMemory(
        rows[0],
        rows,
        'component-full',
        'FULL',
      );
    });
    expect(result.current.componentMemoryItems.map(
      item => item.payload?.kind === 'INSTRUCTION'
        ? item.payload.componentInstructionId
        : -1,
    )).toEqual([101, 102, 103, 104]);

    act(() => {
      result.current.handleAddConnectedGroupToMemory(
        rows[0],
        rows,
        'component-direct',
        'DIRECT',
      );
    });

    expect(result.current.componentMemoryItems.map(
      item => item.payload?.kind === 'INSTRUCTION'
        ? item.payload.componentInstructionId
        : -1,
    )).toEqual([101, 102, 103]);
    expect(result.current.componentMemoryItems.every(
      item => item.dependencySelectionScope === 'DIRECT',
    )).toBe(true);
  });

  it('does not stage any member when an authoritative group row is missing', () => {
    const field = { ...ins(4, 10, 1), instructionOrderNumber: 1, name: 'user_number' };
    const excel = {
      ...ins(6, 10, 1),
      instructionOrderNumber: 3,
      name: 'Extract Field',
      actions: 'E',
      parentId: 4,
    };
    const { result } = renderHook(() => useInstructionMemory([field, excel]));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[
        6,
        capability([
          { id: 4, order: 1, name: 'user_number', action: 'C', parentId: null, blockId: 10 },
          { id: 5, order: 2, name: 'Get Value', action: 'GET', parentId: 4, blockId: 10 },
          { id: 6, order: 3, name: 'Extract Field', action: 'E', parentId: 4, blockId: 10 },
        ]),
      ]]));
    });

    let stageResult: ReturnType<typeof result.current.handleAddConnectedGroupToMemory>;
    act(() => {
      stageResult = result.current.handleAddConnectedGroupToMemory(
        excel,
        [field, excel],
        'revision-missing-row',
      );
    });

    expect(stageResult!).toEqual({
      ok: false,
      reason: 'The connected Memory group changed. Refresh the instruction grid.',
    });
    expect(result.current.memorySteps).toEqual([]);
    expect(result.current.memoryListOpenRequestedRef.current).toBe(false);
  });

  it('refuses batch staging when no authoritative group metadata is available', () => {
    const { result } = renderHook(() => useInstructionMemory(data));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[1, capability()]]));
    });

    let stageResult: ReturnType<typeof result.current.handleAddConnectedGroupToMemory>;
    act(() => {
      stageResult = result.current.handleAddConnectedGroupToMemory(
        data[0],
        data,
        'revision-missing-metadata',
      );
    });

    expect(stageResult!).toEqual({
      ok: false,
      reason: 'Refresh the instruction grid before adding this connected group.',
    });
    expect(result.current.memorySteps).toEqual([]);
  });

  it('stages a Bot Job block fixed-point dependency union as one atomic group', () => {
    const root = {
      ...ins(10, 100, 1),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 1,
      name: 'Source field',
    };
    const get = {
      ...ins(20, 200, 2),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 1,
      name: 'Get Value',
      actions: 'GET',
      parentId: 10,
    };
    const excel = {
      ...ins(30, 200, 2),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 2,
      name: 'Extract Field',
      actions: 'E',
      parentId: 10,
    };
    const current = [root, get, excel];
    const rootRows = [
      { id: 10, order: 1, name: 'Source field', action: 'C', parentId: null, blockId: 100 },
      { id: 20, order: 1, name: 'Get Value', action: 'GET', parentId: 10, blockId: 200 },
    ];
    const dependentRows = [
      { id: 20, order: 1, name: 'Get Value', action: 'GET', parentId: 10, blockId: 200 },
      { id: 30, order: 2, name: 'Extract Field', action: 'E', parentId: 10, blockId: 200 },
    ];
    const { result } = renderHook(() => useInstructionMemory(current));
    act(() => {
      result.current.setMemoryCapabilities(new Map([
        [10, capability(rootRows)],
        [20, capability(dependentRows)],
        [30, capability(dependentRows)],
      ]));
    });

    let stageResult: ReturnType<typeof result.current.handleAddBlockToMemory>;
    act(() => {
      stageResult = result.current.handleAddBlockToMemory(
        [root],
        current,
        'revision-bot-job-block',
      );
    });

    expect(stageResult!.ok).toBe(true);
    expect(result.current.memorySteps.map(step => step.id)).toEqual([10, 20, 30]);
    const groupKeys = result.current.memorySteps.map(
      step => (step as typeof step & { dependencyGroupKey?: string }).dependencyGroupKey,
    );
    expect(new Set(groupKeys).size).toBe(1);
    expect(groupKeys[0]).toContain('BOT_JOB:2:5:I:10,20,30|B:');
  });

  it('keeps independent rows in one staged Bot Job block as separate draggable families', () => {
    const rows = [1, 2, 3].map((id, index) => ({
      ...ins(id, 100, 1),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: index + 1,
      name: `Independent ${id}`,
    }));
    const { result } = renderHook(() => useInstructionMemory(rows));
    act(() => {
      result.current.setMemoryCapabilities(new Map(rows.map(row => [
        row.id,
        capability([{
          id: row.id,
          order: row.instructionOrderNumber,
          name: row.name,
          action: row.actions,
          parentId: null,
          blockId: row.blockId,
        }]),
      ])));
    });

    act(() => {
      result.current.handleAddBlockToMemory(rows, rows, 'revision-independent-block');
    });

    const groupKeys = result.current.memorySteps.map(
      step => (step as typeof step & { dependencyGroupKey?: string }).dependencyGroupKey,
    );
    expect(new Set(groupKeys).size).toBe(3);
    expect(groupKeys).toEqual([
      expect.stringContaining('I:1|B:'),
      expect.stringContaining('I:2|B:'),
      expect.stringContaining('I:3|B:'),
    ]);
  });

  it('refuses the whole Bot Job block when a fixed-point member capability is missing', () => {
    const root = {
      ...ins(10, 100, 1),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 1,
      name: 'Source field',
    };
    const get = {
      ...ins(20, 200, 2),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 1,
      name: 'Get Value',
      actions: 'GET',
      parentId: 10,
    };
    const current = [root, get];
    const { result } = renderHook(() => useInstructionMemory(current));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[
        10,
        capability([
          { id: 10, order: 1, name: 'Source field', action: 'C', parentId: null, blockId: 100 },
          { id: 20, order: 1, name: 'Get Value', action: 'GET', parentId: 10, blockId: 200 },
        ]),
      ]]));
    });

    let stageResult: ReturnType<typeof result.current.handleAddBlockToMemory>;
    act(() => {
      stageResult = result.current.handleAddBlockToMemory(
        [root],
        current,
        'revision-stale-block',
      );
    });

    expect(stageResult!).toEqual({
      ok: false,
      reason: 'A connected instruction capability is stale. Refresh the instruction grid.',
    });
    expect(result.current.memorySteps).toEqual([]);
    expect(result.current.memoryListOpenRequestedRef.current).toBe(false);
  });

  it('stages a connected Component group as typed source items with one revision', () => {
    const field = {
      ...ins(101, 44, 3),
      homeBankingId: 2,
      instructionOrderNumber: 1,
      name: 'user_number',
    };
    const get = {
      ...field,
      id: 102,
      instructionOrderNumber: 2,
      name: 'Get Value',
      actions: 'GET',
      parentId: 101,
      variableId: 501,
    };
    const excel = {
      ...field,
      id: 103,
      instructionOrderNumber: 3,
      name: 'Extract Field',
      actions: 'E',
      parentId: 101,
      variableId: 501,
    };
    const current = [field, get, excel];
    const { result } = renderHook(() =>
      useInstructionMemory(current, COMPONENT_INSTRUCTION_GRID_POLICY));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[
        103,
        capability([
          { id: 101, order: 1, name: 'user_number', action: 'C', parentId: null, blockId: 44 },
          { id: 102, order: 2, name: 'Get Value', action: 'GET', parentId: 101, blockId: 44 },
          { id: 103, order: 3, name: 'Extract Field', action: 'E', parentId: 101, blockId: 44 },
        ]),
      ]]));
    });

    act(() => {
      result.current.handleAddConnectedGroupToMemory(excel, current, 'revision-7');
    });

    expect(result.current.componentMemoryItems.map(item => item.sourceItemKey)).toEqual([
      'INSTRUCTION:2:44:101',
      'INSTRUCTION:2:44:102',
      'INSTRUCTION:2:44:103',
    ]);
    expect(result.current.componentMemoryItems.map(item => item.payload)).toEqual([
      { kind: 'INSTRUCTION', componentInstructionId: 101, componentBlockId: 44, sourceRevision: 'revision-7' },
      { kind: 'INSTRUCTION', componentInstructionId: 102, componentBlockId: 44, sourceRevision: 'revision-7' },
      { kind: 'INSTRUCTION', componentInstructionId: 103, componentBlockId: 44, sourceRevision: 'revision-7' },
    ]);
    expect(result.current.componentMemoryItems.every(
      item => item.dependencyGroupKey?.endsWith('I:101,102,103|B:'),
    )).toBe(true);

    act(() => {
      result.current.handleRemoveComponentMemoryItem('INSTRUCTION:2:44:102');
    });
    expect(result.current.componentMemoryItems).toEqual([]);
  });

  it('replaces a re-staged Component item payload and revision without moving it', () => {
    const first = {
      ...ins(101, 44, 3),
      homeBankingId: 2,
      name: 'Original field',
    };
    const second = {
      ...ins(102, 44, 3),
      homeBankingId: 2,
      name: 'Second field',
    };
    const refreshedFirst = {
      ...first,
      name: 'Refreshed field',
      actions: 'GET',
    };
    const { result } = renderHook(() =>
      useInstructionMemory([first, second], COMPONENT_INSTRUCTION_GRID_POLICY));
    act(() => {
      result.current.setMemoryCapabilities(new Map([
        [101, capability()],
        [102, capability()],
      ]));
    });
    act(() => {
      result.current.handleAddToMemory(first, 'revision-1');
      result.current.handleAddToMemory(second, 'revision-1');
    });
    act(() => {
      result.current.handleAddToMemory(refreshedFirst, 'revision-2');
    });

    expect(result.current.componentMemoryItems.map(item => item.sourceItemKey)).toEqual([
      'INSTRUCTION:2:44:101',
      'INSTRUCTION:2:44:102',
    ]);
    expect(result.current.componentMemoryItems[0].payload).toEqual({
      kind: 'INSTRUCTION',
      componentInstructionId: 101,
      componentBlockId: 44,
      sourceRevision: 'revision-2',
    });
    expect(result.current.componentMemoryItems[0].label).toContain('Refreshed field');
  });

  it('stages an external GOTO target as a whole Component Block with no foreign IDs', () => {
    const goTo = {
      ...ins(201, 30, 2),
      homeBankingId: 2,
      instructionOrderNumber: 1,
      name: 'GOTO',
      actions: 'GOTO',
      parentId: 101,
      parentBlockId: 20,
    };
    const target = {
      ...ins(101, 20, 1),
      homeBankingId: 2,
      instructionOrderNumber: 1,
      name: 'Target field',
    };
    const targetChild = {
      ...target,
      id: 102,
      instructionOrderNumber: 2,
      name: 'Target GET',
      actions: 'GET',
      parentId: 101,
    };
    const current = [goTo, target, targetChild];
    const { result } = renderHook(() =>
      useInstructionMemory(current, COMPONENT_INSTRUCTION_GRID_POLICY));
    act(() => {
      result.current.setMemoryCapabilities(new Map([[
        201,
        capability(
          [
            { id: 101, order: 1, name: 'Target field', action: 'C', parentId: null, blockId: 20 },
            { id: 102, order: 2, name: 'Target GET', action: 'GET', parentId: 101, blockId: 20 },
            { id: 201, order: 1, name: 'GOTO', action: 'GOTO', parentId: 101, blockId: 30 },
          ],
          [{ blockId: 20, blockOrderNumber: 1, blockName: 'Block 1' }],
        ),
      ]]));
    });

    act(() => {
      result.current.handleAddConnectedGroupToMemory(goTo, current, 'revision-goto');
    });

    expect(result.current.componentMemoryItems.map(item => item.sourceItemKey)).toEqual([
      'INSTRUCTION:2:30:201',
      'BLOCK:2:20',
    ]);
    expect(result.current.componentMemoryItems.map(item => item.payload)).toEqual([
      {
        kind: 'INSTRUCTION',
        componentInstructionId: 201,
        componentBlockId: 30,
        sourceRevision: 'revision-goto',
      },
      {
        kind: 'BLOCK',
        componentBlockId: 20,
        sourceRevision: 'revision-goto',
      },
    ]);
  });

  it('stages a Component block and its external GOTO block as one atomic group', () => {
    const goTo = {
      ...ins(201, 30, 2),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 1,
      name: 'GOTO',
      actions: 'GOTO',
      parentId: 101,
      parentBlockId: 20,
    };
    const target = {
      ...ins(101, 20, 1),
      homeBankingId: 2,
      botJobId: 5,
      instructionOrderNumber: 1,
      name: 'Target field',
    };
    const targetChild = {
      ...target,
      id: 102,
      instructionOrderNumber: 2,
      name: 'Target GET',
      actions: 'GET',
      parentId: 101,
    };
    const current = [goTo, target, targetChild];
    const { result } = renderHook(() =>
      useInstructionMemory(current, COMPONENT_INSTRUCTION_GRID_POLICY));

    let stageResult: ReturnType<typeof result.current.handleStageComponentBlock>;
    act(() => {
      stageResult = result.current.handleStageComponentBlock(
        [goTo],
        current,
        'revision-block-goto',
        {
          canAddToMemory: true,
          memoryGroupKey: 'I:101,102,201|B:20',
          memoryGroupRows: [
            { id: 101, order: 1, name: 'Target field', action: 'C', parentId: null, blockId: 20 },
            { id: 102, order: 2, name: 'Target GET', action: 'GET', parentId: 101, blockId: 20 },
            { id: 201, order: 1, name: 'GOTO', action: 'GOTO', parentId: 101, blockId: 30 },
          ],
          memoryGroupBlocks: [
            { blockId: 20, blockOrderNumber: 1, blockName: 'Block 1' },
          ],
        },
      );
    });

    expect(stageResult!.ok).toBe(true);
    expect(result.current.componentMemoryItems.map(item => item.sourceItemKey)).toEqual([
      'BLOCK:2:30',
      'BLOCK:2:20',
    ]);
    expect(new Set(result.current.componentMemoryItems.map(
      item => item.dependencyGroupKey,
    )).size).toBe(1);

    act(() => {
      result.current.handleRemoveComponentMemoryItem('BLOCK:2:20');
    });
    expect(result.current.componentMemoryItems).toEqual([]);
  });
});
