import type { ComponentEditorCommand } from './componentEditor.types';

export type CommandEditorPlacement =
  | { kind: 'KEEP' }
  | { kind: 'TOP' }
  | { kind: 'END' }
  | { kind: 'AFTER_INSTRUCTION'; instructionId: number };

export interface CommandEditorPlacementOption {
  value: string;
  label: string;
  placement: CommandEditorPlacement;
}

const commandOrder = (
  left: ComponentEditorCommand,
  right: ComponentEditorCommand,
): number => (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  || left.instructionId - right.instructionId;

export const commandEditorPlacementOptions = (
  command: ComponentEditorCommand,
  targetBlockId: number,
  commands: readonly ComponentEditorCommand[],
  excludedInstructionIds: readonly number[] = [],
): readonly CommandEditorPlacementOption[] => {
  const excludedIds = new Set(excludedInstructionIds);
  const options: CommandEditorPlacementOption[] = [];
  if (targetBlockId === command.blockId) {
    options.push({
      value: 'KEEP',
      label: 'Keep current position',
      placement: { kind: 'KEEP' },
    });
  }
  options.push(
    { value: 'TOP', label: 'At the top', placement: { kind: 'TOP' } },
    { value: 'END', label: 'At the end', placement: { kind: 'END' } },
  );
  commands
    .filter(candidate =>
      candidate.blockId === targetBlockId
      && candidate.instructionId !== command.instructionId
      && !excludedIds.has(candidate.instructionId))
    .slice()
    .sort(commandOrder)
    .forEach(candidate => options.push({
      value: `AFTER:${candidate.instructionId}`,
      label: `After #${candidate.instructionOrder ?? '?'} ${candidate.instructionName}`,
      placement: {
        kind: 'AFTER_INSTRUCTION',
        instructionId: candidate.instructionId,
      },
    }));
  return Object.freeze(options);
};

export const commandEditorPlacementFromValue = (
  options: readonly CommandEditorPlacementOption[],
  value: string,
): CommandEditorPlacement | null =>
  options.find(option => option.value === value)?.placement ?? null;
