import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type {
  InstructionRelationshipEdge,
  RelationshipOwner,
  RelationshipTarget,
} from './instructionRelationshipGraph';
import type {
  BotJobGraphMutationDraft,
} from './instructionGraphMutation.contract';

export type InstructionRelationshipMutationChoice =
  | { mode: 'DISCONNECT' }
  | { mode: 'CONNECT'; target: RelationshipTarget };

export type InstructionRelationshipMutationErrorCode =
  | 'UNSUPPORTED_RELATIONSHIP'
  | 'INVALID_SOURCE'
  | 'SOURCE_NOT_FOUND'
  | 'OWNER_MISMATCH'
  | 'DUPLICATE_INSTRUCTION'
  | 'UNKNOWN_TARGET'
  | 'TARGET_TYPE_MISMATCH'
  | 'TARGET_NOT_FOUND'
  | 'NO_CHANGE';

export type InstructionRelationshipMutationResult =
  | {
      ok: true;
      draft: BotJobGraphMutationDraft;
    }
  | {
      ok: false;
      code: InstructionRelationshipMutationErrorCode;
      message: string;
    };

const refusal = (
  code: InstructionRelationshipMutationErrorCode,
  message: string,
): InstructionRelationshipMutationResult => ({ ok: false, code, message });

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const nullablePositiveInteger = (value: unknown): number | null =>
  positiveInteger(value) ? value : null;

const ownerKey = (owner: RelationshipOwner): string =>
  owner.workspaceKind === 'BOT_JOB'
    ? `BOT_JOB:${owner.homeBankingId}:${owner.botJobId}`
    : `COMPONENT:${owner.homeBankingId}`;

const targetKey = (target: RelationshipTarget): string =>
  `${target.entity}:${ownerKey(target.owner)}:${target.id}`;

/**
 * Builds one exact relationship-only mutation from the reviewed reconnect
 * dialog. React owns target selection and intent; Java receives an unchanged
 * layout plus the single compare-and-set patch that it must persist.
 */
export const buildInstructionRelationshipMutation = (
  edge: InstructionRelationshipEdge,
  choice: InstructionRelationshipMutationChoice,
  instructions: readonly BlockLoopInstructionLoadDTO[],
): InstructionRelationshipMutationResult => {
  if (
    edge.kind !== 'ELEMENT_TARGET'
    && edge.kind !== 'LOOP_ANCHOR'
    && edge.kind !== 'CONDITIONAL_ROOT'
    && edge.kind !== 'BLOCK_TARGET'
    && edge.kind !== 'VARIABLE_BINDING'
  ) {
    return refusal(
      'UNSUPPORTED_RELATIONSHIP',
      `${edge.kind} cannot be changed from this instruction badge.`,
    );
  }
  if (
    edge.source.entity !== 'INSTRUCTION'
    || edge.source.owner.workspaceKind !== 'BOT_JOB'
    || !positiveInteger(edge.source.id)
  ) {
    return refusal(
      'INVALID_SOURCE',
      'The reconnect source is not an owned Bot Job instruction.',
    );
  }

  const instructionById = new Map<number, BlockLoopInstructionLoadDTO>();
  for (const instruction of instructions) {
    if (!positiveInteger(instruction.id)) {
      return refusal(
        'SOURCE_NOT_FOUND',
        'The rendered instruction graph contains an invalid instruction ID.',
      );
    }
    if (instructionById.has(instruction.id)) {
      return refusal(
        'DUPLICATE_INSTRUCTION',
        `Instruction #${instruction.id} appears more than once in the rendered graph.`,
      );
    }
    if (
      instruction.homeBankingId !== edge.source.owner.homeBankingId
      || instruction.botJobId !== edge.source.owner.botJobId
    ) {
      return refusal(
        'OWNER_MISMATCH',
        `Instruction #${instruction.id} belongs to a different Bot Job workspace.`,
      );
    }
    instructionById.set(instruction.id, instruction);
  }
  const source = instructionById.get(edge.source.id);
  if (!source) {
    return refusal(
      'SOURCE_NOT_FOUND',
      `Instruction #${edge.source.id} is no longer in the rendered graph.`,
    );
  }

  const selected = choice.mode === 'CONNECT'
    ? edge.compatibleTargets.find(candidate =>
        targetKey(candidate) === targetKey(choice.target))
    : null;
  if (choice.mode === 'CONNECT' && !selected) {
    return refusal(
      'UNKNOWN_TARGET',
      'The selected target is not compatible with this relationship.',
    );
  }
  if (
    selected
    && (
      !positiveInteger(selected.id)
      || ownerKey(selected.owner) !== ownerKey(edge.source.owner)
    )
  ) {
    return refusal(
      'OWNER_MISMATCH',
      'The selected target belongs to a different relationship workspace.',
    );
  }

  const expectedParentId = nullablePositiveInteger(source.parentId);
  const expectedParentBlockId = nullablePositiveInteger(source.parentBlockId);
  const expectedVariableId = nullablePositiveInteger(source.variableId);
  let draft: BotJobGraphMutationDraft;

  if (edge.kind === 'BLOCK_TARGET') {
    // GOTO / EXCEL GOTO destination. The v3 contract restricts block-target
    // patches to parentBlockId; a legacy non-null parentId cannot be asserted
    // here and is refused by the Java compare-and-set with a clear message.
    if (selected && selected.entity !== 'BLOCK') {
      return refusal(
        'TARGET_TYPE_MISMATCH',
        'A destination-block relationship requires a Block target.',
      );
    }
    const replacementParentBlockId = selected?.id ?? null;
    if (replacementParentBlockId === expectedParentBlockId) {
      return refusal(
        'NO_CHANGE',
        'The instruction already targets that Block.',
      );
    }
    draft = {
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: instructions.map(instruction => ({
        instructionId: instruction.id,
        blockId: instruction.blockId,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
      })),
      instructionRelationPatches: [{
        instructionId: source.id,
        relationKind: 'BLOCK_TARGET',
        operation: selected ? 'SET' : 'CLEAR',
        expected: {
          parentId: null,
          parentBlockId: expectedParentBlockId,
        },
        replacement: {
          parentId: null,
          parentBlockId: replacementParentBlockId,
        },
      }],
      variableBindingPatches: [],
      variableOwnerPatches: [],
    };
  } else if (
    edge.kind === 'ELEMENT_TARGET'
    || edge.kind === 'LOOP_ANCHOR'
    || edge.kind === 'CONDITIONAL_ROOT'
  ) {
    const targetNoun = edge.kind === 'LOOP_ANCHOR'
      ? 'loop anchor'
      : edge.kind === 'CONDITIONAL_ROOT'
        ? 'conditional root'
        : 'Web Element';
    if (selected && selected.entity !== 'INSTRUCTION') {
      return refusal(
        'TARGET_TYPE_MISMATCH',
        `A ${targetNoun} relationship requires an instruction target.`,
      );
    }
    const targetInstruction = selected
      ? instructionById.get(selected.id)
      : null;
    if (selected && !targetInstruction) {
      return refusal(
        'TARGET_NOT_FOUND',
        `Target instruction #${selected.id} is no longer in the rendered graph.`,
      );
    }
    const replacementParentId = targetInstruction?.id ?? null;
    const replacementParentBlockId = targetInstruction?.blockId ?? null;
    if (
      replacementParentId === expectedParentId
      && replacementParentBlockId === expectedParentBlockId
    ) {
      return refusal(
        'NO_CHANGE',
        `The instruction already uses that ${targetNoun}.`,
      );
    }
    draft = {
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: instructions.map(instruction => ({
        instructionId: instruction.id,
        blockId: instruction.blockId,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
      })),
      instructionRelationPatches: [{
        instructionId: source.id,
        relationKind: edge.kind,
        operation: targetInstruction ? 'SET' : 'CLEAR',
        expected: {
          parentId: expectedParentId,
          parentBlockId: expectedParentBlockId,
        },
        replacement: {
          parentId: replacementParentId,
          parentBlockId: replacementParentBlockId,
        },
      }],
      variableBindingPatches: [],
      variableOwnerPatches: [],
    };
  } else {
    if (selected && selected.entity !== 'VARIABLE') {
      return refusal(
        'TARGET_TYPE_MISMATCH',
        'A variable relationship requires a variable target.',
      );
    }
    const replacementVariableId = selected?.id ?? null;
    if (replacementVariableId === expectedVariableId) {
      return refusal(
        'NO_CHANGE',
        'The instruction already uses that variable.',
      );
    }
    draft = {
      mutationKind: 'RELATIONSHIP_UPDATE',
      draggedInstructionId: null,
      layoutRows: instructions.map(instruction => ({
        instructionId: instruction.id,
        blockId: instruction.blockId,
        blockOrderNumber: instruction.blockOrderNumber,
        instructionOrderNumber: instruction.instructionOrderNumber,
      })),
      instructionRelationPatches: [],
      variableBindingPatches: [{
        instructionId: source.id,
        operation: selected ? 'SET' : 'CLEAR',
        expected: { value: expectedVariableId },
        replacement: { value: replacementVariableId },
      }],
      variableOwnerPatches: [],
    };
  }

  return { ok: true, draft };
};
