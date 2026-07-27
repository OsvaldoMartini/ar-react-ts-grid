import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { CreateBlockOption } from '../../../CreateNewBlock';
import { instructionDisplayLabel } from '../../../instructionDisplay';
import type {
  ComponentMemoryListPayload,
  MemoryListItem,
  MemoryListItemIcon,
} from '../../../memoryList.contract';

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
): MemoryListItem => ({
  key: `BOT_JOB:${instruction.id}`,
  sourceKind: 'BOT_JOB',
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
): MemoryListItem<ComponentMemoryListPayload> => {
  const sourceItemKey = componentInstructionSourceKey(instruction);
  return {
    key: `COMPONENT:${sourceItemKey}`,
    sourceKind: 'COMPONENT',
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
): MemoryListItem<ComponentMemoryListPayload> | null => {
  const first = instructions[0];
  if (!first) return null;
  const sourceItemKey = `BLOCK:${first.homeBankingId}:${first.blockId}`;
  return {
    key: `COMPONENT:${sourceItemKey}`,
    sourceKind: 'COMPONENT',
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
