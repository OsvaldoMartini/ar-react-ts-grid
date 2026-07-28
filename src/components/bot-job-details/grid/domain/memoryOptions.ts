import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { CreateBlockOption } from '../../../CreateNewBlock';
import { instructionDisplayLabel } from '../../../instructionDisplay';
import type {
  ComponentMemoryListPayload,
  MemoryInstructionGroupBlock,
  MemoryInstructionGroupRow,
  MemoryListItem,
  MemoryListItemIcon,
} from '../../../memoryList.contract';
import {
  canonicalInstructionAction,
  createInstructionDependencyResolver,
  type DependencyClosureMode,
  type DependencyClosureResult,
  type InstructionVariableLink,
} from './instructionDependency';

/**
 * Phase 6 — DOMAIN layer (pure, no React / no I/O). Mapping helpers shared by
 * `useInstructionMemory` (application layer) and GridItem's WebSocket effect.
 * Extracted verbatim from GridItem so both callers reference one implementation.
 */

/** Distinct block options (id/order/name) derived from a set of instructions, order-sorted. */
export const blockOptionsFromInstructions = (
  instructions: BlockLoopInstructionLoadDTO[],
): CreateBlockOption[] => {
  const byBlockId = new Map<number, CreateBlockOption>();
  instructions.forEach((instruction) => {
    if (!byBlockId.has(instruction.blockId)) {
      byBlockId.set(instruction.blockId, {
        blockId: instruction.blockId,
        blockOrderNumber: instruction.blockOrderNumber,
        blockName: instruction.blockName,
      });
    }
  });
  return Array.from(byBlockId.values()).sort((a, b) => a.blockOrderNumber - b.blockOrderNumber);
};

/** De-duplicate block options by id (dropping non-positive ids) and order-sort. */
export const normalizeBlockOptions = (blocks: CreateBlockOption[]): CreateBlockOption[] => {
  const byBlockId = new Map<number, CreateBlockOption>();
  blocks.forEach((block) => {
    if (block.blockId > 0) byBlockId.set(block.blockId, block);
  });
  return Array.from(byBlockId.values()).sort((a, b) => a.blockOrderNumber - b.blockOrderNumber);
};

export type MemoryGroupResolution =
  | {
      ok: true;
      instructions: BlockLoopInstructionLoadDTO[];
    }
  | {
      ok: false;
      reason: string;
    };

export type ProjectedMemorySelection = {
  canAdd: boolean;
  addReason: string;
  memoryGroupKey?: string;
  memoryGroupRows?: MemoryInstructionGroupRow[];
  memoryGroupBlocks?: MemoryInstructionGroupBlock[];
};

export type ProjectedMemorySelections = {
  instructions: Map<number, ProjectedMemorySelection>;
  blocks: Map<number, ProjectedMemorySelection>;
};

const projectDependencyClosure = (
  closure: DependencyClosureResult<BlockLoopInstructionLoadDTO>,
  mode: DependencyClosureMode,
): ProjectedMemorySelection => {
  if (!closure.successful) {
    return {
      canAdd: false,
      addReason: closure.error?.message || 'The connected Memory group could not be resolved.',
    };
  }

  const rows: MemoryInstructionGroupRow[] = [];
  for (const instruction of closure.orderedInstructions) {
    if (!Number.isSafeInteger(instruction.instructionOrderNumber)
        || instruction.instructionOrderNumber <= 0) {
      return {
        canAdd: false,
        addReason: 'A connected instruction does not have a positive display order.',
      };
    }
    rows.push({
      id: instruction.id,
      order: instruction.instructionOrderNumber,
      name: instruction.name || '',
      action: instruction.actions || '',
      parentId: instruction.parentId ?? null,
      blockId: instruction.blockId,
    });
  }

  // A Bot Job already owns the selected EXCEL GOTO. Copying that row inside the same job
  // would create a second EXCEL GOTO, which the persistence contract deliberately forbids.
  // Components remain stageable because their destination Bot Job is not known in this grid.
  if (mode === 'BOT_JOB_COPY'
      && closure.orderedInstructions.some(
        instruction => canonicalInstructionAction(instruction.actions) === 'EXCEL GOTO',
      )) {
    return {
      canAdd: false,
      addReason: 'EXCEL GOTO cannot be copied inside the same Bot Job because only one EXCEL GOTO command is allowed.',
    };
  }

  const firstRowByBlock = new Map<number, BlockLoopInstructionLoadDTO>();
  closure.orderedInstructions.forEach((instruction) => {
    if (!firstRowByBlock.has(instruction.blockId)) {
      firstRowByBlock.set(instruction.blockId, instruction);
    }
  });
  const blocks: MemoryInstructionGroupBlock[] = closure.requiredBlockIds.map((blockId) => {
    const first = firstRowByBlock.get(blockId);
    return {
      blockId,
      blockOrderNumber: first?.blockOrderNumber,
      blockName: first?.blockName,
    };
  });
  const instructionIds = rows.map((row) => row.id).join(',');
  const blockIds = blocks.map((block) => block.blockId).join(',');
  return {
    canAdd: true,
    addReason: '',
    memoryGroupKey: `I:${instructionIds}|B:${blockIds}`,
    memoryGroupRows: rows,
    memoryGroupBlocks: blocks,
  };
};

/**
 * Calculate every Memory List selection from the rows currently rendered by React.
 *
 * The backend supplies raw variable ownership facts with the authoritative graph revision, but it
 * does not choose or expand Memory groups. Both instruction and whole-block projections share one
 * indexed resolver, so GridItem and GridItemComp use identical WYSIWYG dependency rules without
 * click-time database queries.
 */
export const projectMemorySelections = (
  currentInstructions: BlockLoopInstructionLoadDTO[],
  variableLinks: readonly InstructionVariableLink[],
  mode: DependencyClosureMode,
): ProjectedMemorySelections => {
  const resolver = createInstructionDependencyResolver(
    currentInstructions,
    variableLinks,
  );
  const instructionSelections = new Map<number, ProjectedMemorySelection>();
  currentInstructions.forEach((instruction) => {
    instructionSelections.set(
      instruction.id,
      projectDependencyClosure(resolver.resolve([instruction.id], mode), mode),
    );
  });

  const instructionIdsByBlock = new Map<number, number[]>();
  currentInstructions.forEach((instruction) => {
    const ids = instructionIdsByBlock.get(instruction.blockId) ?? [];
    ids.push(instruction.id);
    instructionIdsByBlock.set(instruction.blockId, ids);
  });
  const blockSelections = new Map<number, ProjectedMemorySelection>();
  instructionIdsByBlock.forEach((instructionIds, blockId) => {
    blockSelections.set(
      blockId,
      projectDependencyClosure(resolver.resolve(instructionIds, mode), mode),
    );
  });

  return {
    instructions: instructionSelections,
    blocks: blockSelections,
  };
};

/**
 * Resolve a React-calculated Memory group against the current rendered graph.
 *
 * Resolution is deliberately all-or-nothing. The UI must never stage a partial
 * parent/child or variable family when one current member is stale or absent.
 * The pure dependency resolver's deterministic array order is retained exactly.
 */
export const resolveMemoryGroupInstructions = (
  selected: BlockLoopInstructionLoadDTO,
  currentInstructions: BlockLoopInstructionLoadDTO[],
  authoritativeRows?: readonly MemoryInstructionGroupRow[],
): MemoryGroupResolution => {
  const rows = authoritativeRows === undefined
    ? [{
        id: selected.id,
        order: selected.instructionOrderNumber,
        name: selected.name,
        action: selected.actions,
        parentId: selected.parentId ?? null,
        blockId: selected.blockId,
      }]
    : authoritativeRows;
  if (rows.length === 0) {
    return { ok: false, reason: 'The connected Memory group is empty.' };
  }

  const currentById = new Map<number, BlockLoopInstructionLoadDTO>();
  for (const instruction of currentInstructions) {
    if (!Number.isSafeInteger(instruction.id) || instruction.id <= 0
        || currentById.has(instruction.id)) {
      return {
        ok: false,
        reason: 'The current instruction grid contains invalid or duplicate IDs.',
      };
    }
    currentById.set(instruction.id, instruction);
  }

  const groupIds = new Set<number>();
  const resolved: BlockLoopInstructionLoadDTO[] = [];
  for (const row of rows) {
    if (!Number.isSafeInteger(row.id) || row.id <= 0
        || !Number.isSafeInteger(row.order) || row.order <= 0
        || !Number.isSafeInteger(row.blockId) || row.blockId <= 0
        || groupIds.has(row.id)) {
      return {
        ok: false,
        reason: 'The connected Memory group contains invalid or duplicate rows.',
      };
    }
    groupIds.add(row.id);
    const current = currentById.get(row.id);
    if (!current
        || current.blockId !== row.blockId
        || current.instructionOrderNumber !== row.order) {
      return {
        ok: false,
        reason: 'The connected Memory group changed. Refresh the instruction grid.',
      };
    }
    resolved.push(current);
  }

  if (!groupIds.has(selected.id)) {
    return {
      ok: false,
      reason: 'The selected instruction is not part of its connected Memory group.',
    };
  }
  return { ok: true, instructions: resolved };
};

/** Pick the Memory-List row icon for an instruction from its action / tag. */
export const instructionMemoryIcon = (
  instruction: BlockLoopInstructionLoadDTO,
): MemoryListItemIcon => {
  const action = String(instruction.actions || '').split(':')[0].trim().toUpperCase();
  const tagName = String(instruction.tagName || '').toLowerCase();
  if (action === 'I' || tagName === 'input' || tagName === 'textarea') return 'input';
  if (action === 'C' || tagName === 'button') return 'click';
  if (action === 'A' || tagName === 'a' || tagName === 'link') return 'link';
  if (action === 'O' || tagName === 'label') return 'output';
  if (action === 'H' || action === 'HOLD' || action === 'WAIT') return 'wait';
  if (action === 'E' || action.includes('CSV') || action.includes('PDF')) return 'excel';
  if (action === 'P') return 'screen';
  return 'default';
};

/** Project an instruction into a Memory-List item (the detached-list wire shape). */
export const instructionMemoryItem = (
  instruction: BlockLoopInstructionLoadDTO,
  dependencyGroupKey?: string,
): MemoryListItem => ({
  key: `BOT_JOB:${instruction.id}`,
  sourceKind: 'BOT_JOB',
  dependencyGroupKey,
  sourceItemKey: String(instruction.id),
  label: `(${instruction.id})${instructionDisplayLabel(instruction) || instruction.actions || 'Instruction'}`,
  detail: `Block #${instruction.blockOrderNumber} ${instruction.blockName}`,
  icon: instructionMemoryIcon(instruction),
  active: instruction.instructionActive !== false,
  payload: { instructionId: instruction.id },
});

const componentInstructionSourceKey = (
  instruction: BlockLoopInstructionLoadDTO,
): string => (
  `INSTRUCTION:${instruction.homeBankingId}:${instruction.blockId}:${instruction.id}`
);

export const componentInstructionMemoryItem = (
  instruction: BlockLoopInstructionLoadDTO,
  sourceRevision: string,
  dependencyGroupKey?: string,
): MemoryListItem<ComponentMemoryListPayload> => {
  const sourceItemKey = componentInstructionSourceKey(instruction);
  return {
    key: `COMPONENT:${sourceItemKey}`,
    sourceKind: 'COMPONENT',
    dependencyGroupKey,
    sourceItemKey,
    label: `(${instruction.id})${instructionDisplayLabel(instruction) || instruction.actions || 'Instruction'}`,
    detail: `Component block #${instruction.blockOrderNumber} ${instruction.blockName}`,
    icon: instructionMemoryIcon(instruction),
    active: instruction.instructionActive !== false,
    payload: {
      kind: 'INSTRUCTION',
      componentInstructionId: instruction.id,
      componentBlockId: instruction.blockId,
      sourceRevision,
    },
  };
};

/**
 * Stage an entire reusable component block as one authoritative Memory List item.
 *
 * The backend reloads the component graph by id and revision, then transactionally
 * remaps its instructions, variables, references, parents, and parent blocks.
 * Keeping this as one item prevents row-level eligibility filtering from silently
 * dropping dependent commands such as IF/ELSE/ENDIF, LOOP, GET, CK, and E.
 */
export const componentBlockMemoryItem = (
  instructions: BlockLoopInstructionLoadDTO[],
  sourceRevision: string,
  dependencyGroupKey?: string,
): MemoryListItem<ComponentMemoryListPayload> | null => {
  const first = instructions[0];
  if (!first) return null;
  const sourceItemKey = `BLOCK:${first.homeBankingId}:${first.blockId}`;
  return {
    key: `COMPONENT:${sourceItemKey}`,
    sourceKind: 'COMPONENT',
    dependencyGroupKey,
    sourceItemKey,
    label: first.blockName || `Component block ${first.blockId}`,
    detail: `Whole component block (${instructions.length} instruction${instructions.length === 1 ? '' : 's'})`,
    icon: 'default',
    active: first.blockActive !== false,
    payload: {
      kind: 'BLOCK',
      componentBlockId: first.blockId,
      sourceRevision,
    },
  };
};
