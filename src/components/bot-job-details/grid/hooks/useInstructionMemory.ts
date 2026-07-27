import { useRef, useState } from 'react';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { CreateBlockOption } from '../../../CreateNewBlock';
import type {
  ComponentMemoryListPayload,
  MemoryListItem,
} from '../../../memoryList.contract';
import {
  blockOptionsFromInstructions,
  componentBlockMemoryItem,
  componentInstructionMemoryItem,
} from '../domain/memoryOptions';
import {
  BOT_JOB_INSTRUCTION_GRID_POLICY,
  type InstructionGridWorkspacePolicy,
} from '../instructionGrid.policy';

/** Per-instruction Memory-List capability flags, keyed by instruction id. */
export type MemoryCapability = {
  canAdd: boolean;
  canMove: boolean;
  canDelete: boolean;
  deleteCount: number;
  reason: string;
  deleteReason: string;
  allowedBlockIds: number[];
  deleteRows: { id: number; name: string; action: string; order: number }[];
};

/** A memory-apply in flight: the request id awaiting a backend ack + the moved ids. */
export type PendingMemoryMove = { requestId: string; ids: Set<number> } | null;

export interface UseInstructionMemory {
  memorySteps: BlockLoopInstructionLoadDTO[];
  setMemorySteps: React.Dispatch<React.SetStateAction<BlockLoopInstructionLoadDTO[]>>;
  componentMemoryItems: MemoryListItem<ComponentMemoryListPayload>[];
  setComponentMemoryItems: React.Dispatch<React.SetStateAction<MemoryListItem<ComponentMemoryListPayload>[]>>;
  memoryItemCount: number;
  memoryTargetBlockId: number | null;
  setMemoryTargetBlockId: React.Dispatch<React.SetStateAction<number | null>>;
  memoryBlockOptions: CreateBlockOption[];
  setMemoryBlockOptions: React.Dispatch<React.SetStateAction<CreateBlockOption[]>>;
  createBlockOpen: boolean;
  setCreateBlockOpen: React.Dispatch<React.SetStateAction<boolean>>;
  memoryCapabilities: Map<number, MemoryCapability>;
  setMemoryCapabilities: React.Dispatch<React.SetStateAction<Map<number, MemoryCapability>>>;
  pendingMemoryMove: PendingMemoryMove;
  setPendingMemoryMove: React.Dispatch<React.SetStateAction<PendingMemoryMove>>;
  memoryMoveStatus: string;
  setMemoryMoveStatus: React.Dispatch<React.SetStateAction<string>>;
  memoryListOpenVersion: number;
  setMemoryListOpenVersion: React.Dispatch<React.SetStateAction<number>>;
  /** Refs coordinating the detached Memory-List open/sync handshake. */
  memoryListOpenRequestedRef: React.MutableRefObject<boolean>;
  memoryListOpenedRef: React.MutableRefObject<boolean>;
  memoryListOpenPendingRequestRef: React.MutableRefObject<string | null>;
  memoryListOwnerEpochRef: React.MutableRefObject<string>;
  /** Ask the detached Memory List to (re)open; bumps the open version the sync effect watches. */
  requestMemoryListOpen: () => void;
  /** Add a single eligible instruction to the Memory List and request it opens. */
  handleAddToMemory: (instruction: BlockLoopInstructionLoadDTO, sourceRevision?: string) => void;
  /** Add every eligible instruction in a block to the Memory List. */
  handleAddBlockToMemory: (instructions: BlockLoopInstructionLoadDTO[], sourceRevision?: string) => void;
  /** Stage one complete reusable component block. Never injects directly. */
  handleStageComponentBlock: (instructions: BlockLoopInstructionLoadDTO[], sourceRevision: string) => void;
  /** Remove one memorized step by instruction id. */
  handleRemoveFromMemory: (id: number) => void;
  handleRemoveComponentMemoryItem: (sourceItemKey: string) => void;
}

/**
 * Phase 6, step 5 — the Memory-List picking state for the Bot Job Details grid:
 * memorized steps, the target block, block options, per-instruction capabilities,
 * the in-flight apply, and the detached-list open/sync handshake refs. Extracted
 * verbatim from GridItem. `data` seeds the initial block options.
 *
 * The WebSocket effects (capabilities request, list open/sync) and `handleApplyMemory`
 * stay in GridItem — they orchestrate core grid data + the socket and consume this
 * hook's state/setters/refs; they consolidate into the data layer in a later step.
 */
export function useInstructionMemory(
  data: BlockLoopInstructionLoadDTO[],
  policy: InstructionGridWorkspacePolicy = BOT_JOB_INSTRUCTION_GRID_POLICY,
): UseInstructionMemory {
  const [memorySteps, setMemorySteps] = useState<BlockLoopInstructionLoadDTO[]>([]);
  const [componentMemoryItems, setComponentMemoryItems] = useState<
    MemoryListItem<ComponentMemoryListPayload>[]
  >([]);
  const [memoryTargetBlockId, setMemoryTargetBlockId] = useState<number | null>(null);
  const [memoryBlockOptions, setMemoryBlockOptions] = useState<CreateBlockOption[]>(
    policy.kind === 'COMPONENT' ? [] : blockOptionsFromInstructions(data),
  );
  const [createBlockOpen, setCreateBlockOpen] = useState<boolean>(false);
  const [memoryCapabilities, setMemoryCapabilities] = useState<Map<number, MemoryCapability>>(
    new Map(),
  );
  const [pendingMemoryMove, setPendingMemoryMove] = useState<PendingMemoryMove>(null);
  const [memoryMoveStatus, setMemoryMoveStatus] = useState('');
  const memoryListOpenRequestedRef = useRef(false);
  const memoryListOpenedRef = useRef(false);
  const memoryListOpenPendingRequestRef = useRef<string | null>(null);
  const memoryListOwnerEpochRef = useRef('');
  const [memoryListOpenVersion, setMemoryListOpenVersion] = useState(0);

  const requestMemoryListOpen = () => {
    memoryListOpenRequestedRef.current = true;
    if (memoryListOpenPendingRequestRef.current) return;
    memoryListOpenedRef.current = false;
    memoryListOwnerEpochRef.current = '';
    setMemoryListOpenVersion((version) => version + 1);
  };

  const addComponentItems = (items: MemoryListItem<ComponentMemoryListPayload>[]) => {
    setComponentMemoryItems((previous) => {
      const seen = new Set(previous.map((item) => item.sourceItemKey));
      return [
        ...previous,
        ...items.filter((item) => {
          if (seen.has(item.sourceItemKey)) return false;
          seen.add(item.sourceItemKey);
          return true;
        }),
      ];
    });
  };

  const handleAddToMemory = (
    instruction: BlockLoopInstructionLoadDTO,
    sourceRevision = '',
  ) => {
    if (!memoryCapabilities.get(instruction.id)?.canAdd) return;
    if (policy.kind === 'COMPONENT') {
      if (!sourceRevision.trim()) return;
      addComponentItems([componentInstructionMemoryItem(instruction, sourceRevision)]);
      requestMemoryListOpen();
      return;
    }
    setMemorySteps((prev) =>
      prev.some((step) => step.id === instruction.id) ? prev : [...prev, instruction],
    );
    requestMemoryListOpen();
  };

  const handleAddBlockToMemory = (
    instructions: BlockLoopInstructionLoadDTO[],
    sourceRevision = '',
  ) => {
    const eligible = instructions.filter(
      (instruction) => memoryCapabilities.get(instruction.id)?.canAdd,
    );
    if (policy.kind === 'COMPONENT') {
      if (!sourceRevision.trim()) return;
      addComponentItems(
        eligible.map((instruction) => componentInstructionMemoryItem(instruction, sourceRevision)),
      );
      if (eligible.length > 0) requestMemoryListOpen();
      return;
    }
    setMemorySteps((prev) => {
      const seen = new Set(prev.map((step) => step.id));
      const next = [...prev];
      eligible.forEach((instruction) => {
        if (!seen.has(instruction.id)) {
          seen.add(instruction.id);
          next.push(instruction);
        }
      });
      return next;
    });
    requestMemoryListOpen();
  };

  const handleStageComponentBlock = (
    instructions: BlockLoopInstructionLoadDTO[],
    sourceRevision: string,
  ) => {
    if (policy.kind !== 'COMPONENT' || !sourceRevision.trim()) return;
    const item = componentBlockMemoryItem(instructions, sourceRevision);
    if (!item) return;
    addComponentItems([item]);
    requestMemoryListOpen();
  };

  const handleRemoveFromMemory = (id: number) => {
    setMemorySteps((prev) => prev.filter((step) => step.id !== id));
  };

  const handleRemoveComponentMemoryItem = (sourceItemKey: string) => {
    setComponentMemoryItems((previous) =>
      previous.filter((item) => item.sourceItemKey !== sourceItemKey)
    );
  };

  return {
    memorySteps,
    setMemorySteps,
    componentMemoryItems,
    setComponentMemoryItems,
    memoryItemCount: policy.kind === 'COMPONENT' ? componentMemoryItems.length : memorySteps.length,
    memoryTargetBlockId,
    setMemoryTargetBlockId,
    memoryBlockOptions,
    setMemoryBlockOptions,
    createBlockOpen,
    setCreateBlockOpen,
    memoryCapabilities,
    setMemoryCapabilities,
    pendingMemoryMove,
    setPendingMemoryMove,
    memoryMoveStatus,
    setMemoryMoveStatus,
    memoryListOpenVersion,
    setMemoryListOpenVersion,
    memoryListOpenRequestedRef,
    memoryListOpenedRef,
    memoryListOpenPendingRequestRef,
    memoryListOwnerEpochRef,
    requestMemoryListOpen,
    handleAddToMemory,
    handleAddBlockToMemory,
    handleStageComponentBlock,
    handleRemoveFromMemory,
    handleRemoveComponentMemoryItem,
  };
}
