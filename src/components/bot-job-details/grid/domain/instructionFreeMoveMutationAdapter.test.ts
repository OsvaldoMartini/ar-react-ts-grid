import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type { WorkspaceBlock } from './workspaceBlocks';
import {
  planBotJobInstructionFreeMove,
  type InstructionFreeMovePlan,
} from './instructionFreeMove';
import { buildInstructionFreeMoveMutationDraft } from './instructionFreeMoveMutationAdapter';

const block = (
  blockId: number,
  blockOrderNumber: number,
): WorkspaceBlock => ({
  blockId,
  blockOrderNumber,
  blockName: `Block ${blockId}`,
  blockActive: true,
  blockWait: 0,
});

const row = (
  id: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  actions = 'PAUSE',
  overrides: Partial<BlockLoopInstructionLoadDTO> = {},
): BlockLoopInstructionLoadDTO => ({
  homeBankingId: 2,
  botJobId: 5,
  botJobName: 'Job',
  id,
  blockId,
  blockOrderNumber,
  blockName: `Block ${blockId}`,
  blockActive: true,
  blockWait: 0,
  instructionOrderNumber,
  instructionActive: true,
  name: `${actions} ${id}`,
  description: '',
  actions,
  tagName: '',
  ...overrides,
});

const gotoPlan = (): InstructionFreeMovePlan =>
  planBotJobInstructionFreeMove(
    [
      row(1, 10, 1, 1, 'GOTO', { parentBlockId: 20 }),
      row(2, 10, 1, 2),
    ],
    1,
    30,
    0,
    [block(10, 1), block(20, 2), block(30, 3)],
  );

const loopDisconnectPlan = (): InstructionFreeMovePlan =>
  planBotJobInstructionFreeMove(
    [
      row(10, 10, 1, 1, 'C'),
      row(11, 10, 1, 2, 'LOOP', {
        parentId: 10,
        parentBlockId: 10,
      }),
      row(20, 20, 2, 1, 'C'),
    ],
    11,
    20,
    1,
    [block(10, 1), block(20, 2)],
  );

describe('free-move to v3 mutation adapter', () => {
  it('auto-emits the mechanically predetermined KEEP state for a preserved impact', () => {
    const plan = gotoPlan();
    const result = buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [],
    });

    expect(result).toEqual({
      ok: true,
      draft: expect.objectContaining({
        mutationKind: 'ROW_MOVE',
        draggedInstructionId: 1,
        layoutRows: [
          {
            instructionId: 2,
            blockId: 10,
            blockOrderNumber: 1,
            instructionOrderNumber: 1,
          },
          {
            instructionId: 1,
            blockId: 30,
            blockOrderNumber: 3,
            instructionOrderNumber: 1,
          },
        ],
        instructionRelationPatches: [{
          instructionId: 1,
          relationKind: 'BLOCK_TARGET',
          operation: 'KEEP',
          expected: { parentId: null, parentBlockId: 20 },
          replacement: { parentId: null, parentBlockId: 20 },
        }],
        variableBindingPatches: [],
        variableOwnerPatches: [],
      }),
    });
  });

  it('never auto-emits a malformed preserved patch as KEEP', () => {
    const plan = gotoPlan();
    const malformedPlan: InstructionFreeMovePlan = {
      ...plan,
      relationshipImpacts: [{
        ...plan.relationshipImpacts[0],
        keepPatch: {
          ...plan.relationshipImpacts[0].keepPatch!,
          operation: 'SET',
          newParentBlockId: 10,
        },
      }],
    };

    expect(buildInstructionFreeMoveMutationDraft({
      plan: malformedPlan,
      choices: [],
    })).toMatchObject({
      ok: false,
      code: 'INVALID_PLAN_PATCH',
    });
  });

  it('converts explicit LOOP disconnect and reconnect choices without inference', () => {
    const plan = loopDisconnectPlan();
    const disconnected = buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [{
        instructionId: 11,
        relationKind: 'LOOP_ANCHOR',
        action: 'DISCONNECT',
      }],
    });
    expect(disconnected).toMatchObject({
      ok: true,
      draft: {
        instructionRelationPatches: [{
          instructionId: 11,
          relationKind: 'LOOP_ANCHOR',
          operation: 'CLEAR',
          expected: { parentId: 10, parentBlockId: 10 },
          replacement: { parentId: null, parentBlockId: null },
        }],
      },
    });

    const reconnected = buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [{
        instructionId: 11,
        relationKind: 'LOOP_ANCHOR',
        action: 'RECONNECT',
        targetType: 'INSTRUCTION',
        targetId: 20,
      }],
    });
    expect(reconnected).toMatchObject({
      ok: true,
      draft: {
        instructionRelationPatches: [{
          instructionId: 11,
          operation: 'SET',
          expected: { parentId: 10, parentBlockId: 10 },
          replacement: { parentId: 20, parentBlockId: 20 },
        }],
      },
    });
  });

  it('refuses missing, duplicate, and unknown impact choices', () => {
    const invalidPlan = loopDisconnectPlan();
    expect(buildInstructionFreeMoveMutationDraft({
      plan: invalidPlan,
      choices: [],
    })).toMatchObject({ ok: false, code: 'MISSING_CHOICE' });

    const plan = gotoPlan();
    const choice = {
      instructionId: 1,
      relationKind: 'BLOCK_TARGET' as const,
      action: 'KEEP' as const,
    };
    expect(buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [choice, choice],
    })).toMatchObject({ ok: false, code: 'DUPLICATE_CHOICE' });

    expect(buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [
        choice,
        {
          instructionId: 1,
          relationKind: 'ELEMENT_TARGET',
          action: 'DISCONNECT',
        },
      ],
    })).toMatchObject({ ok: false, code: 'DUPLICATE_CHOICE' });

    expect(buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [{
        instructionId: 999,
        relationKind: 'BLOCK_TARGET',
        action: 'KEEP',
      }],
    })).toMatchObject({ ok: false, code: 'UNKNOWN_CHOICE' });
  });

  it('rejects multiple relationship impacts for one instruction regardless of kind', () => {
    const plan = gotoPlan();
    const originalImpact = plan.relationshipImpacts[0];
    const duplicateImpactPlan: InstructionFreeMovePlan = {
      ...plan,
      relationshipImpacts: [
        originalImpact,
        {
          ...originalImpact,
          relationKind: 'ELEMENT_TARGET',
        },
      ],
    };

    expect(buildInstructionFreeMoveMutationDraft({
      plan: duplicateImpactPlan,
      choices: [],
    })).toMatchObject({
      ok: false,
      code: 'DUPLICATE_PLAN_IMPACT',
    });
  });

  it('rejects plan patches that collapse onto the same instruction ID', () => {
    const plan = gotoPlan();
    const duplicatePatchPlan: InstructionFreeMovePlan = {
      ...plan,
      relationshipImpacts: [
        plan.relationshipImpacts[0],
        {
          instructionId: 2,
          relationKind: 'ELEMENT_TARGET',
          state: 'PRESERVED',
          reasonCode: null,
          keepPatch: {
            instructionId: 1,
            relationKind: 'ELEMENT_TARGET',
            operation: 'KEEP',
            expectedParentId: null,
            newParentId: null,
            expectedParentBlockId: null,
            newParentBlockId: null,
          },
          disconnectPatch: {
            instructionId: 2,
            relationKind: 'ELEMENT_TARGET',
            operation: 'CLEAR',
            expectedParentId: null,
            newParentId: null,
            expectedParentBlockId: null,
            newParentBlockId: null,
          },
          reconnectOptions: [],
        },
      ],
    };

    expect(buildInstructionFreeMoveMutationDraft({
      plan: duplicatePatchPlan,
      choices: [],
    })).toMatchObject({
      ok: false,
      code: 'DUPLICATE_RELATION_PATCH',
    });
  });

  it('refuses KEEP on an invalid relationship and unknown reconnect targets', () => {
    const plan = loopDisconnectPlan();
    expect(buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [{
        instructionId: 11,
        relationKind: 'LOOP_ANCHOR',
        action: 'KEEP',
      }],
    })).toMatchObject({ ok: false, code: 'INVALID_KEEP' });

    expect(buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [{
        instructionId: 11,
        relationKind: 'LOOP_ANCHOR',
        action: 'RECONNECT',
        targetType: 'INSTRUCTION',
        targetId: 999,
      }],
    })).toMatchObject({ ok: false, code: 'UNKNOWN_RECONNECT_TARGET' });
  });

  it.each([
    'GOTO',
    'EXCEL GOTO',
    'GOTO:legacy',
    'EXCEL GOTO:legacy',
  ])(
    'independently refuses a canonical %s target equal to its containing Block',
    (actions) => {
    const plan = planBotJobInstructionFreeMove(
      [
        row(25, 10, 1, 1, actions, { parentBlockId: 20 }),
        row(26, 10, 1, 2),
      ],
      25,
      20,
      0,
      [block(10, 1), block(20, 2)],
    );
    // Even a malformed/upstream plan that omits the required impact cannot
    // bypass the adapter's final navigation invariant.
    const missingImpactPlan: InstructionFreeMovePlan = {
      ...plan,
      relationshipImpacts: [],
      requiresRelationshipChoice: false,
    };

    expect(buildInstructionFreeMoveMutationDraft({
      plan: missingImpactPlan,
      choices: [],
    })).toMatchObject({
      ok: false,
      code: 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
    });
    },
  );

  it.each([
    ['VARIABLE_ORDER', row(31, 10, 1, 2, 'GET', {
      parentId: 30,
      parentBlockId: 10,
      variableId: 500,
    }), row(30, 10, 1, 1, 'C')],
    ['CONDITIONAL_STRUCTURE', row(41, 10, 1, 1, 'IF', {
      parentId: 41,
      parentBlockId: 10,
    }), row(42, 10, 1, 2, 'ENDIF', {
      parentId: 41,
      parentBlockId: 10,
    })],
  ])('refuses deferred %s diagnostics before persistence', (_, moved, other) => {
    const plan = planBotJobInstructionFreeMove(
      [moved, other],
      moved.id,
      20,
      0,
      [block(10, 1), block(20, 2)],
    );

    expect(buildInstructionFreeMoveMutationDraft({
      plan,
      choices: [],
    })).toMatchObject({ ok: false, code: 'DEFERRED_DIAGNOSTICS' });
  });

  it('emits no variable patches unless they are explicitly supplied', () => {
    const plan = gotoPlan();
    const choice = [{
      instructionId: 1,
      relationKind: 'BLOCK_TARGET' as const,
      action: 'KEEP' as const,
    }];
    const untouched = buildInstructionFreeMoveMutationDraft({ plan, choices: choice });
    expect(untouched).toMatchObject({
      ok: true,
      draft: {
        variableBindingPatches: [],
        variableOwnerPatches: [],
      },
    });

    const explicit = buildInstructionFreeMoveMutationDraft({
      plan,
      choices: choice,
      variableBindingPatches: [{
        instructionId: 1,
        operation: 'SET',
        expected: { value: 7 },
        replacement: { value: 8 },
      }],
      variableOwnerPatches: [{
        variableId: 7,
        operation: 'CLEAR',
        expected: { value: 1 },
        replacement: { value: null },
      }],
    });
    expect(explicit).toMatchObject({
      ok: true,
      draft: {
        variableBindingPatches: [{
          instructionId: 1,
          operation: 'SET',
          expected: { value: 7 },
          replacement: { value: 8 },
        }],
        variableOwnerPatches: [{
          variableId: 7,
          operation: 'CLEAR',
          expected: { value: 1 },
          replacement: { value: null },
        }],
      },
    });
  });
});
