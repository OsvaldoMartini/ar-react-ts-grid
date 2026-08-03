import type {
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { variablesConditionalFamilyForInstruction } from './variablesConditionalFamilyWatcher';

export type VariablesCommandDeletePlan = {
  instruction: VariableInstructionNode & { id: number; blockId: number };
  /** Other IF-family boundaries deleted together with the selected one. */
  familyDeleteInstructionIds: readonly number[];
  parentRepairInstructionIds: readonly number[];
  variableOwnerIds: readonly number[];
};

const positiveId = (value: number | null | undefined): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;

/**
 * React owns the exact, visible delete impact (Java persists the authored list).
 *
 * Selecting any IF/ELSEIF/ELSE/ENDIF boundary expands the plan to the COMPLETE
 * structural family — same contract as the GridItem delete — so the Variables
 * page can never orphan ELSE/ENDIF survivors. Positional body commands between
 * the boundaries are never included.
 */
export const planVariablesCommandDelete = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): VariablesCommandDeletePlan | null => {
  const instruction = snapshot.commands.find(row => row.id === instructionId);
  if (!instruction || !positiveId(instruction.id) || !positiveId(instruction.blockId)) {
    return null;
  }

  const family = variablesConditionalFamilyForInstruction(snapshot, instructionId);
  const familyDeleteInstructionIds = (family?.boundaryInstructionIds ?? [])
    .filter(id => positiveId(id) && id !== instructionId)
    .slice()
    .sort((left, right) => left - right);
  const deletedIds = new Set<number>([instructionId, ...familyDeleteInstructionIds]);

  const parentRepairInstructionIds = snapshot.commands
    .filter(row => positiveId(row.id)
      && !deletedIds.has(row.id as number)
      && row.parentId !== null
      && deletedIds.has(row.parentId as number))
    .map(row => row.id as number)
    .sort((left, right) => left - right);
  const variableOwnerIds = snapshot.variables
    .filter(variable => positiveId(variable.owner?.id)
      && deletedIds.has(variable.owner?.id as number))
    .map(variable => variable.id)
    .filter(positiveId)
    .sort((left, right) => left - right);

  return Object.freeze({
    instruction: instruction as VariableInstructionNode & {
      id: number;
      blockId: number;
    },
    familyDeleteInstructionIds: Object.freeze(familyDeleteInstructionIds),
    parentRepairInstructionIds: Object.freeze(parentRepairInstructionIds),
    variableOwnerIds: Object.freeze(variableOwnerIds),
  });
};
