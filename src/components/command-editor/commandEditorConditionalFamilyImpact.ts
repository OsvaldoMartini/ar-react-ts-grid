import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { ComponentEditorCommand } from './componentEditor.types';

const CONDITIONAL_BOUNDARIES = new Set(['IF', 'ELSEIF', 'ELSE', 'ENDIF']);

const compareCommands = (
  left: ComponentEditorCommand,
  right: ComponentEditorCommand,
): number => (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  || left.instructionId - right.instructionId;

const isUnambiguousOrphanSuffix = (
  boundaries: readonly ComponentEditorCommand[],
): boolean => {
  let elseSeen = false;
  let endifSeen = false;
  for (const boundary of boundaries) {
    const action = canonicalInstructionAction(boundary.action);
    if (action === 'ELSEIF') {
      if (elseSeen || endifSeen) return false;
    } else if (action === 'ELSE') {
      if (elseSeen || endifSeen) return false;
      elseSeen = true;
    } else if (action === 'ENDIF') {
      if (endifSeen) return false;
      endifSeen = true;
    } else {
      return false;
    }
  }
  return boundaries.length > 0;
};

export interface CommandEditorConditionalFamilyImpact {
  selectedInstructionId: number;
  sourceAction: string;
  targetAction: string;
  boundariesToDelete: readonly ComponentEditorCommand[];
}

export const isCommandEditorConditionalBoundary = (
  action: string | null | undefined,
): boolean => CONDITIONAL_BOUNDARIES.has(canonicalInstructionAction(action));

/**
 * React-authored IF-family dissolution scope for Command Editor UPDATE.
 * A normal family is scoped by the IF root and parentId. The orphan fallback
 * deliberately supports cleanup of a former IF whose ELSE/ENDIF boundaries
 * remain, but refuses ambiguous Blocks. Positional body commands are never
 * included.
 */
export const commandEditorConditionalFamilyImpact = (
  command: ComponentEditorCommand,
  targetAction: string,
  commands: readonly ComponentEditorCommand[],
): CommandEditorConditionalFamilyImpact | null => {
  const sourceAction = canonicalInstructionAction(command.action);
  const canonicalTarget = canonicalInstructionAction(targetAction);
  if (
    sourceAction === canonicalTarget
    || !CONDITIONAL_BOUNDARIES.has(sourceAction)
    || CONDITIONAL_BOUNDARIES.has(canonicalTarget)
    || command.blockId === null
  ) {
    return null;
  }
  const boundaries = commands
    .filter(candidate => candidate.blockId === command.blockId)
    .filter(candidate => CONDITIONAL_BOUNDARIES.has(
      canonicalInstructionAction(candidate.action),
    ))
    .slice()
    .sort(compareCommands);
  const roots = boundaries.filter(
    candidate => canonicalInstructionAction(candidate.action) === 'IF',
  );
  let family: readonly ComponentEditorCommand[];
  if (roots.length === 1) {
    const root = roots[0];
    if (
      command.instructionId !== root.instructionId
      && command.parentId !== root.instructionId
    ) {
      return null;
    }
    family = boundaries.filter(candidate =>
      candidate.instructionId === root.instructionId
      || candidate.parentId === root.instructionId);
    if (family.length !== boundaries.length) return null;
  } else if (roots.length === 0) {
    const missingRootIds = new Set(
      boundaries.flatMap(candidate => candidate.parentId == null
        ? []
        : [candidate.parentId]),
    );
    if (missingRootIds.size > 1 || !isUnambiguousOrphanSuffix(boundaries)) {
      return null;
    }
    family = boundaries;
  } else {
    return null;
  }
  const boundariesToDelete = family
    .filter(candidate => candidate.instructionId !== command.instructionId);
  return {
    selectedInstructionId: command.instructionId,
    sourceAction,
    targetAction: canonicalTarget,
    boundariesToDelete,
  };
};
