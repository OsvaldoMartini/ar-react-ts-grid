import { instructionRelationshipPolicy } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  VariableInstructionNode,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { requiredVariableSlots } from './variableSlotRequirements';

export type VariableResolutionMode = 'SAME' | 'DISTINCT';

export type VariableResolutionAssignments = {
  checks: readonly {
    instructionId: number;
    leftName: string;
    rightName: string;
  }[];
  commands: readonly {
    instructionId: number;
    variableName: string;
  }[];
};

const ordered = (
  commands: readonly VariableInstructionNode[],
): Array<VariableInstructionNode & { id: number }> => commands
  .filter((command): command is VariableInstructionNode & { id: number } =>
    Number.isSafeInteger(command.id) && Number(command.id) > 0)
  .slice()
  .sort((left, right) =>
    (left.blockOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.blockOrder ?? Number.MAX_SAFE_INTEGER)
    || (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
      - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
    || left.id - right.id);

/** Stable names based on the complete scoped execution order. */
export const buildVariableResolutionAssignments = (
  snapshot: VariableWorkspaceSnapshot,
  instructionIds: readonly number[],
  mode: VariableResolutionMode,
): VariableResolutionAssignments => {
  const scope = new Set(instructionIds);
  const scoped = ordered(snapshot.commands.filter(command =>
    command.id !== null && scope.has(command.id)));
  const checks = scoped.filter(command =>
    requiredVariableSlots(command.command).includes('RIGHT'));
  const commands = scoped.filter(command =>
    !requiredVariableSlots(command.command).includes('RIGHT')
    && instructionRelationshipPolicy(command.command)
      .requirements.includes('VARIABLE_BINDING'));

  return Object.freeze({
    checks: Object.freeze(checks.map((command, index) => {
      const suffix = mode === 'SAME' ? 1 : index + 1;
      return Object.freeze({
        instructionId: command.id,
        leftName: `Left_Operand_${suffix}`,
        rightName: `Right_Operand_${suffix}`,
      });
    })),
    commands: Object.freeze(commands.map((command, index) => {
      const suffix = mode === 'SAME' ? 1 : index + 1;
      return Object.freeze({
        instructionId: command.id,
        variableName: `Variable_${suffix}`,
      });
    })),
  });
};
