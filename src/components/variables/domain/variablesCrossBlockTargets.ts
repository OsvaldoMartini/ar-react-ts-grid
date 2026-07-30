import type {
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';
import type { VariablesDropPlacement } from './variablesInstructionMove';

export type VariablesBlockDropZone = {
  blockId: number;
  blockOrderNumber: number;
  label: string;
  anchorInstructionId: number;
  placement: VariablesDropPlacement;
};
const factOrder = (
  left: VariablesInstructionFact,
  right: VariablesInstructionFact,
): number =>
  left.instructionOrderNumber - right.instructionOrderNumber
  || left.instructionId - right.instructionId;

/**
 * Produces stable AFTER anchors for every non-empty, structurally flat block.
 * These zones make cross-block movement reachable even when the selected
 * variable does not already have a command in the destination block.
 */
export const variablesCrossBlockDropZones = (
  snapshot: VariableWorkspaceSnapshot,
): VariablesBlockDropZone[] => {
  const capability = snapshot.mutationCapability;
  if (
    !capability
    || capability.crossBlockProfile !== 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1'
  ) {
    return [];
  }
  const factsByBlock = new Map<number, VariablesInstructionFact[]>();
  capability.instructionFacts.forEach((fact) => {
    const rows = factsByBlock.get(fact.blockId) ?? [];
    rows.push(fact);
    factsByBlock.set(fact.blockId, rows);
  });
  const blockNames = new Map(
    snapshot.blocks.map(block => [block.id, block.name]),
  );
  return [...factsByBlock.entries()]
    .map(([blockId, facts]): VariablesBlockDropZone | null => {
      if (
        facts.length === 0
        || facts.some(fact => fact.relationKind !== 'ELEMENT_TARGET')
      ) {
        return null;
      }
      const ordered = [...facts].sort(factOrder);
      const anchor = ordered[ordered.length - 1];
      const blockOrderNumber = anchor.blockOrderNumber;
      const name = blockNames.get(blockId)?.trim();
      return {
        blockId,
        blockOrderNumber,
        label: `#${blockOrderNumber} ${name || `Block ${blockId}`}`,
        anchorInstructionId: anchor.instructionId,
        placement: 'AFTER',
      };
    })
    .filter((zone): zone is VariablesBlockDropZone => zone !== null)
    .sort((left, right) =>
      left.blockOrderNumber - right.blockOrderNumber
      || left.blockId - right.blockId);
};
