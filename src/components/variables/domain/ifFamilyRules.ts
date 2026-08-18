import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariableWorkspaceSnapshot } from '../../variablesWorkspace.contract';

/**
 * IF-family authoring rules — React is the single authority (2026-08-03 decision).
 *
 * The matching Java refusals in VariablesCommandEditorCopyTransaction are PARKED
 * (commented out); the backend persists whatever React submits. Every rule that
 * used to refuse on the server must therefore refuse HERE, before the op is sent,
 * with a user-visible message.
 */

export const IF_FAMILY_ACTIONS = Object.freeze(['IF', 'ELSEIF', 'ELSE', 'ENDIF'] as const);

export const isIfFamilyAction = (action: string | null | undefined): boolean =>
  (IF_FAMILY_ACTIONS as readonly string[]).includes(canonicalInstructionAction(action));

export interface IfFamilyCreateRefusal {
  code: string;
  message: string;
}

export type IfFamilyCreatePlacement =
  | { kind: 'TOP' | 'END' }
  | { kind: 'AFTER_INSTRUCTION'; instructionId: number }
  | { kind: 'KEEP' };

export type IfFamilyCreateRow = {
  instructionId: number;
  blockId: number;
  instructionOrderNumber: number;
  action: string;
};

const orderedBlockRows = (
  snapshot: VariableWorkspaceSnapshot,
  blockId: number,
): IfFamilyCreateRow[] => {
  const capability = snapshot.mutationCapability;
  if (!capability) return [];
  const actionById = new Map(
    capability.instructionFacts.map(fact => [
      fact.instructionId,
      canonicalInstructionAction(fact.action),
    ]),
  );
  return capability.layoutRows
    .filter(row => row.blockId === blockId)
    .slice()
    .sort((left, right) =>
      left.instructionOrderNumber - right.instructionOrderNumber
      || left.instructionId - right.instructionId)
    .map(row => ({
      instructionId: row.instructionId,
      blockId: row.blockId,
      instructionOrderNumber: row.instructionOrderNumber,
      action: actionById.get(row.instructionId) ?? '',
    }));
};

const firstActionIndex = (rows: readonly IfFamilyCreateRow[], action: string): number =>
  rows.findIndex(row => row.action === action);

export const validateIfFamilyCreateRows = (
  sourceRows: readonly IfFamilyCreateRow[],
  targetBlockId: number,
  targetAction: string,
  placement: IfFamilyCreatePlacement,
): IfFamilyCreateRefusal | null => {
  const action = canonicalInstructionAction(targetAction);
  if (action !== 'IF' && action !== 'ELSEIF') return null;
  const rows = sourceRows
    .filter(row => row.blockId === targetBlockId)
    .slice()
    .sort((left, right) =>
      left.instructionOrderNumber - right.instructionOrderNumber
      || left.instructionId - right.instructionId);

  if (action === 'IF') {
    return rows.some(row => canonicalInstructionAction(row.action) === 'IF')
      ? {
        code: 'COMMAND_CREATE_CONDITIONAL_ROOT_EXISTS',
        message: 'This Block already contains its IF family.',
      }
      : null;
  }

  const canonicalRows = rows.map(row => ({
    ...row,
    action: canonicalInstructionAction(row.action),
  }));
  const rootIndex = firstActionIndex(canonicalRows, 'IF');
  const elseIndex = firstActionIndex(canonicalRows, 'ELSE');
  const endifIndex = firstActionIndex(canonicalRows, 'ENDIF');
  if (rootIndex < 0 || elseIndex < 0 || endifIndex < 0 || elseIndex >= endifIndex) {
    return {
      code: 'COMMAND_CREATE_CONDITIONAL_FAMILY_MISSING',
      message: 'Add ELSEIF only to a complete IF, ELSE, and ENDIF family.',
    };
  }
  let index: number;
  if (placement.kind === 'TOP') index = 0;
  else if (placement.kind === 'END') index = canonicalRows.length;
  else if (placement.kind === 'AFTER_INSTRUCTION') {
    const referenceIndex = canonicalRows.findIndex(
      row => row.instructionId === placement.instructionId,
    );
    if (referenceIndex < 0) return null;
    index = referenceIndex + 1;
  } else return null;
  if (index <= rootIndex || index > elseIndex) {
    return {
      code: 'COMMAND_CREATE_ELSEIF_PLACEMENT_INVALID',
      message: 'Place ELSEIF after IF or another ELSEIF and before ELSE.',
    };
  }
  return null;
};

/**
 * Validates ADD COMMAND for IF and ELSEIF against the in-memory workspace.
 * Mirrors the parked backend refusals:
 * - COMMAND_COPY/CREATE_CONDITIONAL_ROOT_EXISTS  (one IF family per Block)
 * - COMMAND_COPY/CREATE_CONDITIONAL_FAMILY_MISSING (ELSEIF needs a complete family)
 * - COMMAND_COPY/CREATE_ELSEIF_PLACEMENT_INVALID  (ELSEIF only after IF/ELSEIF, before ELSE)
 * Returns null when the create is allowed (including for non-conditional commands).
 */
export const validateIfFamilyCreate = (
  snapshot: VariableWorkspaceSnapshot,
  targetBlockId: number,
  targetAction: string,
  placement: IfFamilyCreatePlacement,
): IfFamilyCreateRefusal | null => {
  return validateIfFamilyCreateRows(
    orderedBlockRows(snapshot, targetBlockId),
    targetBlockId,
    targetAction,
    placement,
  );
};
