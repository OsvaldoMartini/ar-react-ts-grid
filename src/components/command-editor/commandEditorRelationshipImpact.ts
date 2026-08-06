import type { ComponentEditorCommand } from './componentEditor.types';
import type { CommandEditorPlacement } from './commandEditorPlacement';
import { instructionRelationshipPolicy } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';

export interface CommandEditorRelationshipImpact {
  clearParentId: boolean;
  clearParentBlockId: boolean;
  messages: readonly string[];
}

const commandOrder = (
  left: ComponentEditorCommand,
  right: ComponentEditorCommand,
): number => (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  || left.instructionId - right.instructionId;

const targetIndex = (
  command: ComponentEditorCommand,
  placement: CommandEditorPlacement,
  targetRows: readonly ComponentEditorCommand[],
): number => {
  if (placement.kind === 'TOP') return 0;
  if (placement.kind === 'END') return targetRows.length;
  if (placement.kind === 'AFTER_INSTRUCTION') {
    const index = targetRows.findIndex(row => row.instructionId === placement.instructionId);
    return index < 0 ? targetRows.length : index + 1;
  }
  return Math.max(0, Math.min(
    (command.instructionOrder ?? targetRows.length + 1) - 1,
    targetRows.length,
  ));
};

const invalidDirectDependents = (
  instruction: ComponentEditorCommand,
  targetBlockId: number,
  placement: CommandEditorPlacement,
  instructions: readonly ComponentEditorCommand[],
): ComponentEditorCommand[] => {
  const dependents = instructions.filter(
    candidate => candidate.parentId === instruction.instructionId,
  );
  if (dependents.length === 0) return [];

  const targetRows = instructions
    .filter(candidate => candidate.blockId === targetBlockId
      && candidate.instructionId !== instruction.instructionId)
    .slice()
    .sort(commandOrder);
  const finalRows = [...targetRows];
  finalRows.splice(targetIndex(instruction, placement, targetRows), 0, instruction);
  const instructionIndex = finalRows.findIndex(
    candidate => candidate.instructionId === instruction.instructionId,
  );
  return dependents.filter((dependent) => {
    if (dependent.parentBlockId !== null
      && dependent.parentBlockId !== targetBlockId) return true;
    if (dependent.blockId !== targetBlockId) return true;
    const dependentIndex = finalRows.findIndex(
      candidate => candidate.instructionId === dependent.instructionId,
    );
    return dependentIndex < 0 || instructionIndex >= dependentIndex;
  });
};

const dependentDisconnectMessages = (
  dependents: readonly ComponentEditorCommand[],
): string[] => dependents.map(dependent =>
  `Dependent instruction #${dependent.instructionOrder ?? '?'} ${dependent.instructionName}`
  + ` (ID ${dependent.instructionId}) will lose its invalid parent connection.`,
);

/**
 * Predicts relationship clearing for the new Variables Command Editor only.
 * It deliberately does not participate in GridItem or Variables drag-and-drop.
 */
export const commandEditorRelationshipImpact = (
  command: ComponentEditorCommand,
  targetBlockId: number,
  placement: CommandEditorPlacement,
  commands: readonly ComponentEditorCommand[],
): CommandEditorRelationshipImpact => {
  const invalidDependents = instructionRelationshipPolicy(command.action).role === 'WEB_ELEMENT'
    ? invalidDirectDependents(command, targetBlockId, placement, commands)
    : [];
  const dependentMessages = dependentDisconnectMessages(invalidDependents);
  const crossBlock = command.blockId !== targetBlockId;
  if (crossBlock) {
    const clearParentId = command.parentId !== null || invalidDependents.length > 0;
    const clearParentBlockId = command.parentBlockId !== null || invalidDependents.length > 0;
    return {
      clearParentId,
      clearParentBlockId,
      messages: [
        ...(command.parentId !== null
          ? [`Parent instruction ID ${command.parentId} will be disconnected because the instruction is moving to another Block.`]
          : []),
        ...(command.parentBlockId !== null
          ? [`Connected Block ID ${command.parentBlockId} will be disconnected by this cross-Block move.`]
          : []),
        ...dependentMessages,
      ],
    };
  }

  // KEEP changes command configuration only. The instruction remains at its authoritative
  // position, so an incomplete editor projection must not invent a relationship disconnect.
  if (placement.kind === 'KEEP') {
    return { clearParentId: false, clearParentBlockId: false, messages: [] };
  }

  if (command.parentId === null || command.parentId === command.instructionId) {
    return {
      clearParentId: invalidDependents.length > 0,
      clearParentBlockId: invalidDependents.length > 0,
      messages: dependentMessages,
    };
  }

  const targetRows = commands
    .filter(candidate => candidate.blockId === targetBlockId
      && candidate.instructionId !== command.instructionId)
    .slice()
    .sort(commandOrder);
  const finalRows = [...targetRows];
  finalRows.splice(targetIndex(command, placement, targetRows), 0, command);
  const commandIndex = finalRows.findIndex(row => row.instructionId === command.instructionId);
  const parentIndex = finalRows.findIndex(row => row.instructionId === command.parentId);
  const parentBlockMismatch = command.parentBlockId !== null
    && command.parentBlockId !== targetBlockId;
  const parentWillNotPrecede = parentIndex < 0 || parentIndex >= commandIndex;
  if (!parentBlockMismatch && !parentWillNotPrecede) {
    return {
      clearParentId: invalidDependents.length > 0,
      clearParentBlockId: invalidDependents.length > 0,
      messages: dependentMessages,
    };
  }

  const parent = commands.find(candidate => candidate.instructionId === command.parentId);
  const parentLabel = parent
    ? `#${parent.instructionOrder ?? '?'} ${parent.instructionName} (ID ${parent.instructionId})`
    : `instruction ID ${command.parentId}`;
  return {
    clearParentId: true,
    clearParentBlockId: command.parentBlockId !== null || invalidDependents.length > 0,
    messages: [
      parentBlockMismatch
        ? `The connected parent ${parentLabel} is not in the selected target Block.`
        : `The instruction will no longer run after its connected parent ${parentLabel}.`,
      ...dependentMessages,
    ],
  };
};

export const hasCommandEditorRelationshipImpact = (
  impact: CommandEditorRelationshipImpact,
): boolean => impact.clearParentId || impact.clearParentBlockId;
