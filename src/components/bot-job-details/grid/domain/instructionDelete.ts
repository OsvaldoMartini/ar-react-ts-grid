import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import {
  canonicalInstructionAction,
  type InstructionVariableLink,
} from './instructionDependency';

const CONDITIONAL_BOUNDARY_ACTIONS = new Set([
  'IF',
  'ELSEIF',
  'ELSE',
  'ENDIF',
]);

const LOOP_BOUNDARY_ACTIONS = new Set([
  'LOOP',
  'REFRESH_LOOP',
]);

const NAVIGATION_ACTIONS = new Set([
  'GOTO',
  'EXCEL GOTO',
]);

export interface SurvivingParentReference {
  instructionId: number;
  deletedParentId: number;
}

export type InstructionDeletePlan =
  | {
      ok: true;
      selectedInstruction: BlockLoopInstructionLoadDTO;
      instructions: BlockLoopInstructionLoadDTO[];
      deleteInstructionIds: number[];
      survivingParentReferences: SurvivingParentReference[];
    }
  | {
      ok: false;
      reason: string;
    };

export type InstructionSelectionDeleteMode =
  | 'SELECTED_ONLY'
  | 'INCLUDE_CONNECTED';

export type InstructionSelectionDeletePlan =
  | ({
      ok: true;
      selectedInstructionIds: number[];
      mode: InstructionSelectionDeleteMode;
    } & Extract<InstructionDeletePlan, { ok: true }>)
  | Extract<InstructionDeletePlan, { ok: false }>;

const isPositiveId = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const compareRenderedOrder = (
  left: BlockLoopInstructionLoadDTO,
  right: BlockLoopInstructionLoadDTO,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.id - right.id;

const isNavigation = (instruction: BlockLoopInstructionLoadDTO): boolean =>
  NAVIGATION_ACTIONS.has(canonicalInstructionAction(instruction.actions));

/**
 * Plan an instruction deletion exclusively from the graph currently rendered by React.
 *
 * This is deliberately not a positional-range resolver. IF/ELSE/ENDIF bodies and LOOP bodies
 * survive unless they are connected through an explicit ownership or variable edge. Navigation
 * parent fields are references to destinations and never ownership edges.
 */
export const planInstructionDeletion = (
  renderedInstructions: readonly BlockLoopInstructionLoadDTO[],
  variableLinks: readonly InstructionVariableLink[],
  selectedInstructionId: number,
): InstructionDeletePlan => {
  if (!isPositiveId(selectedInstructionId)) {
    return { ok: false, reason: 'A positive selected instruction ID is required.' };
  }

  const selectedMatches = renderedInstructions.filter(
    instruction => instruction.id === selectedInstructionId,
  );
  if (selectedMatches.length !== 1) {
    return {
      ok: false,
      reason: selectedMatches.length === 0
        ? 'The selected instruction is not present in the rendered grid.'
        : 'The rendered grid contains a duplicate selected instruction ID.',
    };
  }
  const selected = selectedMatches[0];
  if (!isPositiveId(selected.blockId)) {
    return {
      ok: false,
      reason: 'The selected instruction does not belong to a valid rendered block.',
    };
  }

  const sameOwner = (instruction: BlockLoopInstructionLoadDTO): boolean =>
    instruction.homeBankingId === selected.homeBankingId
    && instruction.botJobId === selected.botJobId;
  const ownerRows = renderedInstructions.filter(sameOwner);
  const rowsById = new Map<number, BlockLoopInstructionLoadDTO>();
  for (const instruction of ownerRows) {
    if (!isPositiveId(instruction.id) || rowsById.has(instruction.id)) {
      return {
        ok: false,
        reason: 'The selected owner contains invalid or duplicate instruction IDs.',
      };
    }
    rowsById.set(instruction.id, instruction);
  }

  // parentId is structural only inside its owning block. Identical parent values in another
  // block must never become an ownership cascade.
  const childrenByBlockAndParent = new Map<string, BlockLoopInstructionLoadDTO[]>();
  ownerRows.forEach((instruction) => {
    if (!isPositiveId(instruction.parentId) || instruction.parentId === instruction.id) return;
    const key = `${instruction.blockId}:${instruction.parentId}`;
    const children = childrenByBlockAndParent.get(key) ?? [];
    children.push(instruction);
    childrenByBlockAndParent.set(key, children);
  });
  childrenByBlockAndParent.forEach(children => children.sort(compareRenderedOrder));

  const variableIdsByOwner = new Map<number, number[]>();
  variableLinks.forEach((link) => {
    if (
      !isPositiveId(link.id)
      || !isPositiveId(link.instructionId)
      || !rowsById.has(link.instructionId)
    ) return;
    const ids = variableIdsByOwner.get(link.instructionId) ?? [];
    if (!ids.includes(link.id)) ids.push(link.id);
    variableIdsByOwner.set(link.instructionId, ids);
  });
  const variableConsumers = new Map<number, BlockLoopInstructionLoadDTO[]>();
  // Variables belong to the owner, not to one block. A producer deletion must include every
  // rendered consumer in that owner even when the consumer is in another block.
  ownerRows.forEach((instruction) => {
    if (!isPositiveId(instruction.variableId)) return;
    const consumers = variableConsumers.get(instruction.variableId) ?? [];
    consumers.push(instruction);
    variableConsumers.set(instruction.variableId, consumers);
  });
  variableConsumers.forEach(consumers => consumers.sort(compareRenderedOrder));

  const includedIds = new Set<number>();
  const dependencyQueue: number[] = [];
  const queuedIds = new Set<number>();
  const expandChildrenIds = new Set<number>();
  const expandedChildrenIds = new Set<number>();

  const include = (
    instruction: BlockLoopInstructionLoadDTO,
    expandOrdinaryChildren: boolean,
  ): void => {
    includedIds.add(instruction.id);
    if (expandOrdinaryChildren) expandChildrenIds.add(instruction.id);
    if (!queuedIds.has(instruction.id)) {
      queuedIds.add(instruction.id);
      dependencyQueue.push(instruction.id);
    }
  };

  const includeConditionalFamily = (
    boundary: BlockLoopInstructionLoadDTO,
  ): void => {
    const action = canonicalInstructionAction(boundary.actions);
    const rootId = action === 'IF' ? boundary.id : boundary.parentId;
    const root = isPositiveId(rootId) ? rowsById.get(rootId) : undefined;
    include(boundary, false);
    if (
      !root
      || root.blockId !== boundary.blockId
      || canonicalInstructionAction(root.actions) !== 'IF'
    ) return;
    include(root, false);
    ownerRows.forEach((candidate) => {
      if (
        candidate.blockId === root.blockId
        && CONDITIONAL_BOUNDARY_ACTIONS.has(
          canonicalInstructionAction(candidate.actions),
        )
        && (candidate.id === root.id || candidate.parentId === root.id)
      ) {
        include(candidate, false);
      }
    });
  };

  const selectedAction = canonicalInstructionAction(selected.actions);
  if (CONDITIONAL_BOUNDARY_ACTIONS.has(selectedAction)) {
    includeConditionalFamily(selected);
  } else if (LOOP_BOUNDARY_ACTIONS.has(selectedAction)) {
    include(selected, false);
    if (isPositiveId(selected.parentId) && selected.parentId !== selected.id) {
      const anchor = rowsById.get(selected.parentId);
      if (anchor?.blockId === selected.blockId) {
        // The explicit anchor family is inseparable. Expanding the anchor includes only
        // parentId-linked descendants in this block; positional rows remain untouched.
        include(anchor, true);
      }
    }
  } else {
    // A navigation command may refer to another instruction/block, but that is never ownership.
    include(selected, !isNavigation(selected));
  }

  for (let queueIndex = 0; queueIndex < dependencyQueue.length; queueIndex += 1) {
    const currentId = dependencyQueue[queueIndex];
    const current = rowsById.get(currentId);
    if (!current) continue;

    // Variable flow is directional: deleting an owner includes its consumers. Deleting a
    // consumer never walks upstream to the owner/producer.
    (variableIdsByOwner.get(currentId) ?? []).forEach((variableId) => {
      (variableConsumers.get(variableId) ?? []).forEach((consumer) => {
        include(consumer, !isNavigation(consumer));
      });
    });

    if (
      !expandChildrenIds.has(currentId)
      || expandedChildrenIds.has(currentId)
    ) {
      continue;
    }
    expandedChildrenIds.add(currentId);
    (
      childrenByBlockAndParent.get(`${current.blockId}:${currentId}`) ?? []
    ).forEach((child) => {
      if (isNavigation(child)) return;
      const action = canonicalInstructionAction(child.actions);
      if (CONDITIONAL_BOUNDARY_ACTIONS.has(action)) {
        includeConditionalFamily(child);
      } else if (LOOP_BOUNDARY_ACTIONS.has(action)) {
        include(child, false);
      } else {
        include(child, true);
      }
    });
  }

  const instructions = ownerRows
    .filter(instruction => includedIds.has(instruction.id))
    .sort(compareRenderedOrder);
  const deleteInstructionIds = instructions.map(instruction => instruction.id);
  const survivingParentReferences = ownerRows
    .filter((instruction) => {
      if (
        includedIds.has(instruction.id)
        || isNavigation(instruction)
        || !isPositiveId(instruction.parentId)
      ) return false;
      const deletedParent = rowsById.get(instruction.parentId);
      return deletedParent != null
        && deletedParent.blockId === instruction.blockId
        && includedIds.has(deletedParent.id);
    })
    .sort(compareRenderedOrder)
    .map(instruction => ({
      instructionId: instruction.id,
      deletedParentId: instruction.parentId as number,
    }));

  return {
    ok: true,
    selectedInstruction: selected,
    instructions,
    deleteInstructionIds,
    survivingParentReferences,
  };
};

/**
 * Plan deletion for checked Bot Job rows without treating variables as ownership edges.
 *
 * SELECTED_ONLY deletes exactly the checked rows. INCLUDE_CONNECTED expands only the
 * structural parent/conditional/loop families already owned by planInstructionDeletion;
 * passing an empty variable-link set is intentional because variable definitions are
 * independent records and must survive instruction deletion.
 */
export const planInstructionSelectionDeletion = (
  renderedInstructions: readonly BlockLoopInstructionLoadDTO[],
  selectedInstructionIds: readonly number[],
  mode: InstructionSelectionDeleteMode,
): InstructionSelectionDeletePlan => {
  const selectedIds = new Set<number>();
  for (const instructionId of selectedInstructionIds) {
    if (!isPositiveId(instructionId) || selectedIds.has(instructionId)) {
      return {
        ok: false,
        reason: 'Every selected instruction ID must be unique and positive.',
      };
    }
    selectedIds.add(instructionId);
  }
  if (selectedIds.size === 0) {
    return { ok: false, reason: 'Select at least one instruction row.' };
  }

  const selectedRows = renderedInstructions
    .filter(instruction => selectedIds.has(instruction.id))
    .sort(compareRenderedOrder);
  if (selectedRows.length !== selectedIds.size) {
    return {
      ok: false,
      reason: 'One or more selected instructions are no longer present. Refresh the grid.',
    };
  }
  const selectedInstruction = selectedRows[0];
  if (selectedRows.some(instruction => !(
    instruction.homeBankingId === selectedInstruction.homeBankingId
    && instruction.botJobId === selectedInstruction.botJobId
  ))) {
    return {
      ok: false,
      reason: 'Selected instructions must belong to one Bot Job owner.',
    };
  }

  const deleteIds = new Set<number>(selectedIds);
  if (mode === 'INCLUDE_CONNECTED') {
    for (const instructionId of selectedIds) {
      const connected = planInstructionDeletion(
        renderedInstructions,
        [],
        instructionId,
      );
      if (!connected.ok) return connected;
      connected.deleteInstructionIds.forEach(id => deleteIds.add(id));
    }
  }

  const ownerRows = renderedInstructions.filter(instruction => (
    instruction.homeBankingId === selectedInstruction.homeBankingId
    && instruction.botJobId === selectedInstruction.botJobId
  ));
  const instructions = ownerRows
    .filter(instruction => deleteIds.has(instruction.id))
    .sort(compareRenderedOrder);
  const deleteInstructionIds = instructions.map(instruction => instruction.id);
  const survivingParentReferences = ownerRows
    .filter(instruction => (
      !deleteIds.has(instruction.id)
      && isPositiveId(instruction.parentId)
      && deleteIds.has(instruction.parentId)
    ))
    .sort(compareRenderedOrder)
    .map(instruction => ({
      instructionId: instruction.id,
      deletedParentId: instruction.parentId as number,
    }));

  return {
    ok: true,
    selectedInstructionIds: selectedRows.map(instruction => instruction.id),
    mode,
    selectedInstruction,
    instructions,
    deleteInstructionIds,
    survivingParentReferences,
  };
};
