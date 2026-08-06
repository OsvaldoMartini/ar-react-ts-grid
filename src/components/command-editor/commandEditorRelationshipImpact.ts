import type { ComponentEditorCommand } from './componentEditor.types';
import type { CommandEditorPlacement } from './commandEditorPlacement';

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
  const crossBlock = command.blockId !== targetBlockId;
  if (crossBlock) {
    const clearParentId = command.parentId !== null;
    const clearParentBlockId = command.parentBlockId !== null;
    return {
      clearParentId,
      clearParentBlockId,
      messages: [
        ...(clearParentId
          ? [`Parent instruction ID ${command.parentId} will be disconnected because the command is moving to another Block.`]
          : []),
        ...(clearParentBlockId
          ? [`Connected Block ID ${command.parentBlockId} will be disconnected by this cross-Block move.`]
          : []),
      ],
    };
  }

  // KEEP changes command configuration only. The instruction remains at its authoritative
  // position, so an incomplete editor projection must not invent a relationship disconnect.
  if (placement.kind === 'KEEP') {
    return { clearParentId: false, clearParentBlockId: false, messages: [] };
  }

  if (command.parentId === null || command.parentId === command.instructionId) {
    return { clearParentId: false, clearParentBlockId: false, messages: [] };
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
    return { clearParentId: false, clearParentBlockId: false, messages: [] };
  }

  const parent = commands.find(candidate => candidate.instructionId === command.parentId);
  const parentLabel = parent
    ? `#${parent.instructionOrder ?? '?'} ${parent.instructionName} (ID ${parent.instructionId})`
    : `instruction ID ${command.parentId}`;
  return {
    clearParentId: true,
    clearParentBlockId: command.parentBlockId !== null,
    messages: [
      parentBlockMismatch
        ? `The connected parent ${parentLabel} is not in the selected target Block.`
        : `The command will no longer run after its connected parent ${parentLabel}.`,
    ],
  };
};

export const hasCommandEditorRelationshipImpact = (
  impact: CommandEditorRelationshipImpact,
): boolean => impact.clearParentId || impact.clearParentBlockId;
