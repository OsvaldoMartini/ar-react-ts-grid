import type {
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';

export type VariablesCommandDeletePlan = {
  instruction: VariableInstructionNode & { id: number; blockId: number };
  parentRepairInstructionIds: readonly number[];
  variableOwnerIds: readonly number[];
};

const positiveId = (value: number | null | undefined): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;

/**
 * React owns the exact, visible delete impact. This deliberately follows only
 * direct ID relationships; positional IF/LOOP rows are never inferred.
 */
export const planVariablesCommandDelete = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): VariablesCommandDeletePlan | null => {
  const instruction = snapshot.commands.find(row => row.id === instructionId);
  if (!instruction || !positiveId(instruction.id) || !positiveId(instruction.blockId)) {
    return null;
  }

  const parentRepairInstructionIds = snapshot.commands
    .filter(row => row.parentId === instructionId && positiveId(row.id))
    .map(row => row.id as number)
    .sort((left, right) => left - right);
  const variableOwnerIds = snapshot.variables
    .filter(variable => variable.owner?.id === instructionId)
    .map(variable => variable.id)
    .filter(positiveId)
    .sort((left, right) => left - right);

  return Object.freeze({
    instruction: instruction as VariableInstructionNode & {
      id: number;
      blockId: number;
    },
    parentRepairInstructionIds: Object.freeze(parentRepairInstructionIds),
    variableOwnerIds: Object.freeze(variableOwnerIds),
  });
};
