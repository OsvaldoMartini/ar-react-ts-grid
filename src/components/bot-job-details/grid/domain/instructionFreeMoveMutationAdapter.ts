import type {
  BotJobGraphMutationDraft,
  InstructionGraphRelationPatch,
  InstructionGraphVariableBindingPatch,
  InstructionGraphVariableOwnerPatch,
} from './instructionGraphMutation.contract';
import type {
  FreeMoveRelationshipImpact,
  FreeMoveRelationshipPatch,
  InstructionFreeMovePlan,
} from './instructionFreeMove';
import { instructionRelationshipPolicy } from './instructionRelationshipPolicy';

export type InstructionFreeMoveChoice =
  | {
      instructionId: number;
      relationKind: FreeMoveRelationshipImpact['relationKind'];
      action: 'KEEP';
    }
  | {
      instructionId: number;
      relationKind: FreeMoveRelationshipImpact['relationKind'];
      action: 'DISCONNECT';
    }
  | {
      instructionId: number;
      relationKind: FreeMoveRelationshipImpact['relationKind'];
      action: 'RECONNECT';
      targetType: 'INSTRUCTION' | 'BLOCK';
      targetId: number;
    };

export type BuildInstructionFreeMoveMutationRequest = {
  plan: InstructionFreeMovePlan;
  choices: readonly InstructionFreeMoveChoice[];
  /**
   * Variable state is outside the free-move relationship planner. Omitted
   * arrays preserve every variable binding/owner by emitting no patch. Explicit
   * arrays are only carried after another planner has already resolved every
   * deferred diagnostic; supplying them never bypasses that persistence gate.
   */
  variableBindingPatches?: readonly InstructionGraphVariableBindingPatch[];
  variableOwnerPatches?: readonly InstructionGraphVariableOwnerPatch[];
};

export type InstructionFreeMoveMutationErrorCode =
  | 'PLAN_REFUSED'
  | 'PLAN_NOT_CHANGED'
  | 'DEFERRED_DIAGNOSTICS'
  | 'DUPLICATE_PLAN_IMPACT'
  | 'MISSING_CHOICE'
  | 'DUPLICATE_CHOICE'
  | 'UNKNOWN_CHOICE'
  | 'INVALID_KEEP'
  | 'UNKNOWN_RECONNECT_TARGET'
  | 'INVALID_PLAN_PATCH'
  | 'DUPLICATE_RELATION_PATCH'
  | 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK';

export type InstructionFreeMoveMutationResult =
  | {
      ok: true;
      draft: BotJobGraphMutationDraft;
    }
  | {
      ok: false;
      code: InstructionFreeMoveMutationErrorCode;
      message: string;
    };

const refusal = (
  code: InstructionFreeMoveMutationErrorCode,
  message: string,
): InstructionFreeMoveMutationResult => ({ ok: false, code, message });

const toV3Patch = (
  patch: FreeMoveRelationshipPatch,
): InstructionGraphRelationPatch => {
  if (patch.relationKind === 'BLOCK_TARGET') {
    return {
      instructionId: patch.instructionId,
      relationKind: patch.relationKind,
      operation: patch.operation,
      expected: {
        parentId: null,
        parentBlockId: patch.expectedParentBlockId,
      },
      replacement: {
        parentId: null,
        parentBlockId: patch.newParentBlockId,
      },
    };
  }
  return {
    instructionId: patch.instructionId,
    relationKind: patch.relationKind,
    operation: patch.operation,
    expected: {
      parentId: patch.expectedParentId,
      parentBlockId: patch.expectedParentBlockId,
    },
    replacement: {
      parentId: patch.newParentId,
      parentBlockId: patch.newParentBlockId,
    },
  };
};

const isMechanicalKeepPatch = (
  patch: FreeMoveRelationshipPatch | null,
): patch is FreeMoveRelationshipPatch => {
  if (!patch || patch.operation !== 'KEEP') return false;
  if (patch.relationKind === 'BLOCK_TARGET') {
    return patch.expectedParentBlockId === patch.newParentBlockId;
  }
  return patch.expectedParentId === patch.newParentId
    && patch.expectedParentBlockId === patch.newParentBlockId;
};

const selectedPatch = (
  impact: FreeMoveRelationshipImpact,
  choice: InstructionFreeMoveChoice,
): InstructionFreeMoveMutationResult | FreeMoveRelationshipPatch => {
  if (choice.action === 'KEEP') {
    return isMechanicalKeepPatch(impact.keepPatch)
      ? impact.keepPatch
      : refusal(
        'INVALID_KEEP',
        `Instruction #${impact.instructionId} cannot keep its invalid `
          + `${impact.relationKind} relationship.`,
      );
  }
  if (choice.action === 'DISCONNECT') return impact.disconnectPatch;

  const option = impact.reconnectOptions.find(candidate =>
    candidate.targetType === choice.targetType
    && candidate.targetId === choice.targetId);
  return option?.patch
    ?? refusal(
      'UNKNOWN_RECONNECT_TARGET',
      `The selected ${impact.relationKind} reconnect target is not compatible `
        + `with instruction #${impact.instructionId}.`,
    );
};

/**
 * Convert one reviewed free-move preview into exact v3 mutation intent.
 *
 * This adapter never chooses a relationship target and never infers variable
 * mutations. A preserved impact may emit its mechanically predetermined KEEP
 * patch without prompting; every invalid impact requires one explicit choice.
 */
export const buildInstructionFreeMoveMutationDraft = ({
  plan,
  choices,
  variableBindingPatches = [],
  variableOwnerPatches = [],
}: BuildInstructionFreeMoveMutationRequest): InstructionFreeMoveMutationResult => {
  if (!plan.ok) {
    return refusal(
      'PLAN_REFUSED',
      plan.error || 'The free-move plan was refused.',
    );
  }
  if (!plan.changed) {
    return refusal('PLAN_NOT_CHANGED', 'The free-move plan contains no change.');
  }
  if (plan.deferredDiagnostics.length > 0) {
    const summary = plan.deferredDiagnostics
      .map(diagnostic =>
        `#${diagnostic.instructionId} ${diagnostic.code}`)
      .join(', ');
    return refusal(
      'DEFERRED_DIAGNOSTICS',
      `The move is not ready for persistence: ${summary}.`,
    );
  }

  const impacts = new Map<number, FreeMoveRelationshipImpact>();
  for (const impact of plan.relationshipImpacts) {
    if (impacts.has(impact.instructionId)) {
      return refusal(
        'DUPLICATE_PLAN_IMPACT',
        `The plan contains more than one relationship impact for instruction `
          + `#${impact.instructionId}.`,
      );
    }
    impacts.set(impact.instructionId, impact);
  }

  const choicesByImpact = new Map<number, InstructionFreeMoveChoice>();
  for (const choice of choices) {
    const impact = impacts.get(choice.instructionId);
    if (!impact) {
      return refusal(
        'UNKNOWN_CHOICE',
        `The choice for instruction #${choice.instructionId} does not match `
          + 'a relationship impact in this plan.',
      );
    }
    if (choicesByImpact.has(choice.instructionId)) {
      return refusal(
        'DUPLICATE_CHOICE',
        `Instruction #${choice.instructionId} has more than one `
          + `${choice.relationKind} choice.`,
      );
    }
    if (impact.relationKind !== choice.relationKind) {
      return refusal(
        'UNKNOWN_CHOICE',
        `The choice for instruction #${choice.instructionId} does not match `
          + 'a relationship impact in this plan.',
      );
    }
    choicesByImpact.set(choice.instructionId, choice);
  }

  const instructionRelationPatches: InstructionGraphRelationPatch[] = [];
  const patchedInstructionIds = new Set<number>();
  for (const [instructionId, impact] of impacts) {
    const choice = choicesByImpact.get(instructionId);
    let patch: FreeMoveRelationshipPatch;
    if (!choice) {
      if (
        impact.state === 'PRESERVED'
        && isMechanicalKeepPatch(impact.keepPatch)
      ) {
        patch = impact.keepPatch;
      } else if (impact.state === 'PRESERVED' && impact.keepPatch) {
        return refusal(
          'INVALID_PLAN_PATCH',
          `Instruction #${impact.instructionId} does not contain a mechanical `
            + `${impact.relationKind} KEEP patch.`,
        );
      } else {
        return refusal(
          'MISSING_CHOICE',
          `Choose DISCONNECT or RECONNECT for instruction `
            + `#${impact.instructionId} ${impact.relationKind}.`,
        );
      }
    } else {
      const selected = selectedPatch(impact, choice);
      if ('ok' in selected) return selected;
      patch = selected;
    }
    if (patchedInstructionIds.has(patch.instructionId)) {
      return refusal(
        'DUPLICATE_RELATION_PATCH',
        `Instruction #${patch.instructionId} has more than one relationship patch.`,
      );
    }
    if (
      patch.instructionId !== impact.instructionId
      || patch.relationKind !== impact.relationKind
    ) {
      return refusal(
        'INVALID_PLAN_PATCH',
        `Instruction #${impact.instructionId} contains a relationship patch `
          + 'for a different instruction or relation kind.',
      );
    }
    patchedInstructionIds.add(patch.instructionId);
    instructionRelationPatches.push(toV3Patch(patch));
  }

  instructionRelationPatches.sort((left, right) =>
    left.instructionId - right.instructionId
    || left.relationKind.localeCompare(right.relationKind));

  const relationPatchByInstruction = new Map(
    instructionRelationPatches.map(patch => [patch.instructionId, patch]),
  );
  for (const row of plan.layoutRows) {
    const action = instructionRelationshipPolicy(row.actions).canonicalAction;
    if (action !== 'GOTO' && action !== 'EXCEL GOTO') continue;
    const patch = relationPatchByInstruction.get(row.id);
    const finalTargetBlockId = patch?.relationKind === 'BLOCK_TARGET'
      ? patch.replacement.parentBlockId
      : row.parentBlockId ?? null;
    if (finalTargetBlockId === row.blockId) {
      return refusal(
        'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
        `${action} instruction #${row.id} cannot target its containing Block. `
          + 'Choose DISCONNECT or RECONNECT to another Block.',
      );
    }
  }

  return {
    ok: true,
    draft: {
      mutationKind: 'ROW_MOVE',
      draggedInstructionId: plan.draggedInstructionId,
      layoutRows: plan.layoutRows.map(row => ({
        instructionId: row.id,
        blockId: row.blockId,
        blockOrderNumber: row.blockOrderNumber,
        instructionOrderNumber: row.instructionOrderNumber,
      })),
      instructionRelationPatches,
      variableBindingPatches: [...variableBindingPatches],
      variableOwnerPatches: [...variableOwnerPatches],
    },
  };
};
