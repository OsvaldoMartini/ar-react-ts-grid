import { useRef, useState } from 'react';
import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import { CreateBlockOption } from '../../../CreateNewBlock';
import type {
  ComponentMemoryListPayload,
  MemoryInstructionGroupBlock,
  MemoryInstructionGroupRow,
  MemoryListItem,
} from '../../../memoryList.contract';
import {
  blockOptionsFromInstructions,
  componentBlockMemoryItem,
  componentInstructionMemoryItem,
  resolveMemoryGroupInstructions,
  type MemoryGroupResolution,
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
  /** Memory-specific refusal reason; distinct from the drag/move reason. */
  addReason?: string;
  /** Stable backend group identity, when the resolver exposes one. */
  memoryGroupKey?: string;
  /** Authoritative dependency closure in the exact order it must enter Memory. */
  memoryGroupRows?: MemoryInstructionGroupRow[];
  /** Optional cross-block dependency context (for example GOTO). */
  memoryGroupBlocks?: MemoryInstructionGroupBlock[];
};

export type MemoryBlockCapability = {
  canAddToMemory?: boolean;
  addReason?: string;
  memoryGroupKey?: string;
  memoryGroupRows?: MemoryInstructionGroupRow[];
  memoryGroupBlocks?: MemoryInstructionGroupBlock[];
};

/** A memory-apply in flight: the request id awaiting a backend ack + the moved ids. */
export type PendingMemoryMove = { requestId: string; ids: Set<number> } | null;

type MemoryInstructionSelection = BlockLoopInstructionLoadDTO & {
  dependencyGroupKey?: string;
};

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
  /**
   * Atomically stage the selected instruction's complete authoritative dependency
   * group. Validation happens before the single state update; partial groups are
   * never added.
   */
  handleAddConnectedGroupToMemory: (
    instruction: BlockLoopInstructionLoadDTO,
    currentInstructions: BlockLoopInstructionLoadDTO[],
    sourceRevision?: string,
  ) => MemoryGroupResolution;
  /**
   * Atomically stage a Bot Job block plus the fixed-point union of every
   * authoritative per-row dependency closure.
   */
  handleAddBlockToMemory: (
    instructions: BlockLoopInstructionLoadDTO[],
    currentInstructions: BlockLoopInstructionLoadDTO[],
  ) => MemoryGroupResolution;
  /** Stage one complete reusable component block without row-level filtering. */
  handleStageComponentBlock: (
    instructions: BlockLoopInstructionLoadDTO[],
    currentInstructions: BlockLoopInstructionLoadDTO[],
    sourceRevision: string,
    capability?: MemoryBlockCapability,
  ) => MemoryGroupResolution;
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
  const [memorySteps, setMemoryStepSelections] = useState<MemoryInstructionSelection[]>([]);
  const setMemorySteps: React.Dispatch<React.SetStateAction<BlockLoopInstructionLoadDTO[]>> =
    (nextValue) => {
      setMemoryStepSelections((previous) => {
        const next = typeof nextValue === 'function'
          ? nextValue(previous)
          : nextValue;
        return next as MemoryInstructionSelection[];
      });
    };
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
      const incoming = new Map(items.map((item) => [item.sourceItemKey, item]));
      const merged = previous.map((item) => {
        const update = incoming.get(item.sourceItemKey);
        if (!update) return item;
        incoming.delete(item.sourceItemKey);
        return update;
      });
      return [...merged, ...incoming.values()];
    });
  };

  const dependencyGroupKey = (
    instruction: BlockLoopInstructionLoadDTO,
    backendKey?: string,
  ): string | undefined => {
    const normalized = String(backendKey || '').trim();
    if (!normalized) return undefined;
    return [
      policy.kind,
      instruction.homeBankingId,
      instruction.botJobId,
      normalized,
    ].join(':');
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

  const handleAddConnectedGroupToMemory = (
    instruction: BlockLoopInstructionLoadDTO,
    currentInstructions: BlockLoopInstructionLoadDTO[],
    sourceRevision = '',
  ): MemoryGroupResolution => {
    const capability = memoryCapabilities.get(instruction.id);
    if (!capability?.canAdd) {
      return {
        ok: false,
        reason: capability?.addReason || capability?.reason
          || 'This instruction cannot be added to Memory List.',
      };
    }
    if (policy.kind === 'COMPONENT' && !sourceRevision.trim()) {
      return {
        ok: false,
        reason: 'Refresh Components before adding this connected group.',
      };
    }
    if (!capability.memoryGroupRows) {
      return {
        ok: false,
        reason: 'Refresh the instruction grid before adding this connected group.',
      };
    }

    const resolution = resolveMemoryGroupInstructions(
      instruction,
      currentInstructions,
      capability.memoryGroupRows,
    );
    if (!resolution.ok) return resolution;
    const groupKey = dependencyGroupKey(instruction, capability.memoryGroupKey);

    if (policy.kind === 'COMPONENT') {
      const requiredBlocks = capability.memoryGroupBlocks ?? [];
      const requiredBlockIds = new Set(requiredBlocks.map((block) => block.blockId));
      const blockItems: MemoryListItem<ComponentMemoryListPayload>[] = [];
      for (const requiredBlock of requiredBlocks) {
        const blockInstructions = resolution.instructions.filter(
          (member) => member.blockId === requiredBlock.blockId,
        );
        const liveBlockInstructions = currentInstructions.filter(
          (member) => member.blockId === requiredBlock.blockId,
        );
        const connectedIds = new Set(blockInstructions.map((member) => member.id));
        if (blockInstructions.length === 0
            || blockInstructions.length !== liveBlockInstructions.length
            || liveBlockInstructions.some((member) => !connectedIds.has(member.id))
            || (requiredBlock.blockOrderNumber !== undefined
              && blockInstructions[0].blockOrderNumber !== requiredBlock.blockOrderNumber)
            || (requiredBlock.blockName !== undefined
              && blockInstructions[0].blockName !== requiredBlock.blockName)) {
          return {
            ok: false,
            reason: 'A connected component Block changed. Refresh Components before adding it.',
          };
        }
        const blockItem = componentBlockMemoryItem(
          blockInstructions,
          sourceRevision,
          groupKey,
        );
        if (!blockItem) {
          return {
            ok: false,
            reason: 'A connected component Block could not be staged.',
          };
        }
        blockItems.push(blockItem);
      }
      addComponentItems([
        ...resolution.instructions
          .filter((member) => !requiredBlockIds.has(member.blockId))
          .map((member) => componentInstructionMemoryItem(
            member,
            sourceRevision,
            groupKey,
          )),
        ...blockItems,
      ]);
    } else {
      setMemorySteps((previous) => {
        const groupIds = new Set(resolution.instructions.map((member) => member.id));
        const seen = new Set(previous.map((step) => step.id));
        const next = previous.map((step) => (
          groupKey && groupIds.has(step.id)
            ? { ...step, dependencyGroupKey: groupKey }
            : step
        ));
        resolution.instructions.forEach((member) => {
          if (!seen.has(member.id)) {
            seen.add(member.id);
            next.push({ ...member, dependencyGroupKey: groupKey });
          }
        });
        return next;
      });
    }
    requestMemoryListOpen();
    return resolution;
  };

  const handleAddBlockToMemory = (
    instructions: BlockLoopInstructionLoadDTO[],
    currentInstructions: BlockLoopInstructionLoadDTO[],
  ): MemoryGroupResolution => {
    const first = instructions[0];
    if (policy.kind !== 'BOT_JOB' || !first) {
      return {
        ok: false,
        reason: 'This Bot Job Block cannot be added to Memory List.',
      };
    }

    const selectedIds = new Set<number>();
    for (const instruction of instructions) {
      if (instruction.blockId !== first.blockId
          || !Number.isSafeInteger(instruction.id)
          || instruction.id <= 0
          || selectedIds.has(instruction.id)) {
        return {
          ok: false,
          reason: 'The selected Bot Job Block is invalid. Refresh the instruction grid.',
        };
      }
      selectedIds.add(instruction.id);
    }
    const liveBlock = currentInstructions.filter(
      (instruction) => instruction.blockId === first.blockId,
    );
    if (liveBlock.length !== instructions.length
        || liveBlock.some((instruction) => !selectedIds.has(instruction.id))) {
      return {
        ok: false,
        reason: 'The selected Bot Job Block changed. Refresh the instruction grid.',
      };
    }

    const queue = instructions.map((instruction) => instruction.id);
    const processed = new Set<number>();
    const unionById = new Map<number, BlockLoopInstructionLoadDTO>();
    const firstSeen = new Map<number, number>();
    const outgoing = new Map<number, Set<number>>();
    const indegree = new Map<number, number>();
    const register = (instruction: BlockLoopInstructionLoadDTO) => {
      if (!unionById.has(instruction.id)) {
        firstSeen.set(instruction.id, firstSeen.size);
        unionById.set(instruction.id, instruction);
        outgoing.set(instruction.id, new Set());
        indegree.set(instruction.id, 0);
        queue.push(instruction.id);
      }
    };
    const addOrderEdge = (beforeId: number, afterId: number) => {
      if (beforeId === afterId) return;
      const neighbors = outgoing.get(beforeId);
      if (!neighbors || neighbors.has(afterId)) return;
      neighbors.add(afterId);
      indegree.set(afterId, (indegree.get(afterId) ?? 0) + 1);
    };

    while (queue.length > 0) {
      const instructionId = queue.shift()!;
      if (processed.has(instructionId)) continue;
      processed.add(instructionId);
      const current = currentInstructions.find(
        (instruction) => instruction.id === instructionId,
      );
      const capability = memoryCapabilities.get(instructionId);
      if (!current || !capability?.canAdd || !capability.memoryGroupRows
          || !String(capability.memoryGroupKey || '').trim()) {
        return {
          ok: false,
          reason: capability?.addReason || capability?.reason
            || 'A connected instruction capability is stale. Refresh the instruction grid.',
        };
      }
      const resolution = resolveMemoryGroupInstructions(
        current,
        currentInstructions,
        capability.memoryGroupRows,
      );
      if (!resolution.ok) return resolution;

      const resolvedIds = new Set(resolution.instructions.map((member) => member.id));
      for (const requiredBlock of capability.memoryGroupBlocks ?? []) {
        const requiredRows = currentInstructions.filter(
          (member) => member.blockId === requiredBlock.blockId,
        );
        if (requiredRows.length === 0
            || requiredRows.some((member) => !resolvedIds.has(member.id))
            || (requiredBlock.blockOrderNumber !== undefined
              && requiredRows[0].blockOrderNumber !== requiredBlock.blockOrderNumber)
            || (requiredBlock.blockName !== undefined
              && requiredRows[0].blockName !== requiredBlock.blockName)) {
          return {
            ok: false,
            reason: 'A connected Bot Job Block changed. Refresh the instruction grid.',
          };
        }
      }

      resolution.instructions.forEach(register);
      for (let index = 1; index < resolution.instructions.length; index += 1) {
        addOrderEdge(
          resolution.instructions[index - 1].id,
          resolution.instructions[index].id,
        );
      }
    }

    if ([...selectedIds].some((id) => !unionById.has(id))) {
      return {
        ok: false,
        reason: 'The complete Bot Job Block dependency closure is unavailable.',
      };
    }

    const ready = [...unionById.keys()]
      .filter((id) => indegree.get(id) === 0)
      .sort((left, right) => firstSeen.get(left)! - firstSeen.get(right)!);
    const ordered: BlockLoopInstructionLoadDTO[] = [];
    while (ready.length > 0) {
      const id = ready.shift()!;
      ordered.push(unionById.get(id)!);
      outgoing.get(id)?.forEach((neighbor) => {
        const nextIndegree = (indegree.get(neighbor) ?? 0) - 1;
        indegree.set(neighbor, nextIndegree);
        if (nextIndegree === 0) {
          ready.push(neighbor);
          ready.sort((left, right) => firstSeen.get(left)! - firstSeen.get(right)!);
        }
      });
    }
    if (ordered.length !== unionById.size) {
      return {
        ok: false,
        reason: 'Connected instruction closures disagree about their required order.',
      };
    }

    const groupKey = dependencyGroupKey(
      first,
      `BLOCK:${first.blockId}|I:${[...unionById.keys()].sort((a, b) => a - b).join(',')}`,
    );
    if (!groupKey) {
      return {
        ok: false,
        reason: 'The Bot Job Block dependency group is unavailable.',
      };
    }
    const groupIds = new Set(ordered.map((instruction) => instruction.id));
    setMemorySteps((previous) => {
      const firstExistingIndex = previous.findIndex((step) => groupIds.has(step.id));
      const remaining = previous.filter((step) => !groupIds.has(step.id));
      const insertionIndex = firstExistingIndex < 0
        ? remaining.length
        : previous
          .slice(0, firstExistingIndex)
          .filter((step) => !groupIds.has(step.id))
          .length;
      const grouped = ordered.map((instruction) => ({
        ...instruction,
        dependencyGroupKey: groupKey,
      }));
      return [
        ...remaining.slice(0, insertionIndex),
        ...grouped,
        ...remaining.slice(insertionIndex),
      ];
    });
    requestMemoryListOpen();
    return { ok: true, instructions: ordered };
  };

  const handleStageComponentBlock = (
    instructions: BlockLoopInstructionLoadDTO[],
    currentInstructions: BlockLoopInstructionLoadDTO[],
    sourceRevision: string,
    capability?: MemoryBlockCapability,
  ): MemoryGroupResolution => {
    const first = instructions[0];
    if (policy.kind !== 'COMPONENT' || !sourceRevision.trim()) {
      return {
        ok: false,
        reason: 'Refresh Components before adding this block.',
      };
    }
    if (!first || capability?.canAddToMemory !== true
        || !capability.memoryGroupRows) {
      return {
        ok: false,
        reason: capability?.addReason
          || 'Refresh Components before adding this connected block.',
      };
    }
    const resolution = resolveMemoryGroupInstructions(
      first,
      currentInstructions,
      capability.memoryGroupRows,
    );
    if (!resolution.ok) return resolution;

    const selectedIds = new Set(instructions.map((instruction) => instruction.id));
    const resolvedIds = new Set(resolution.instructions.map((instruction) => instruction.id));
    if (selectedIds.size !== instructions.length
        || instructions.some((instruction) => !resolvedIds.has(instruction.id))) {
      return {
        ok: false,
        reason: 'The complete Component Block changed. Refresh Components.',
      };
    }

    const groupKey = dependencyGroupKey(first, capability.memoryGroupKey);
    const blockIds = new Set<number>([
      first.blockId,
      ...(capability.memoryGroupBlocks ?? []).map((block) => block.blockId),
    ]);
    const blockItems: MemoryListItem<ComponentMemoryListPayload>[] = [];
    for (const blockId of blockIds) {
      const liveBlock = currentInstructions.filter(
        (instruction) => instruction.blockId === blockId,
      );
      const connectedBlock = resolution.instructions.filter(
        (instruction) => instruction.blockId === blockId,
      );
      if (liveBlock.length === 0
          || liveBlock.length !== connectedBlock.length
          || liveBlock.some((instruction) => !resolvedIds.has(instruction.id))) {
        return {
          ok: false,
          reason: 'A connected Component Block changed. Refresh Components.',
        };
      }
      const blockItem = componentBlockMemoryItem(
        connectedBlock,
        sourceRevision,
        groupKey,
      );
      if (!blockItem) {
        return {
          ok: false,
          reason: 'A connected Component Block could not be staged.',
        };
      }
      blockItems.push(blockItem);
    }

    addComponentItems([
      ...blockItems,
      ...resolution.instructions
        .filter((instruction) => !blockIds.has(instruction.blockId))
        .map((instruction) => componentInstructionMemoryItem(
          instruction,
          sourceRevision,
          groupKey,
        )),
    ]);
    requestMemoryListOpen();
    return resolution;
  };

  const handleRemoveFromMemory = (id: number) => {
    setMemorySteps((previous) => {
      const selected = previous.find((step) => step.id === id) as
        | MemoryInstructionSelection
        | undefined;
      if (!selected?.dependencyGroupKey) {
        return previous.filter((step) => step.id !== id);
      }
      return previous.filter(
        (step) => (step as MemoryInstructionSelection).dependencyGroupKey
          !== selected.dependencyGroupKey,
      );
    });
  };

  const handleRemoveComponentMemoryItem = (sourceItemKey: string) => {
    setComponentMemoryItems((previous) => {
      const selected = previous.find((item) => item.sourceItemKey === sourceItemKey);
      if (!selected?.dependencyGroupKey) {
        return previous.filter((item) => item.sourceItemKey !== sourceItemKey);
      }
      return previous.filter(
        (item) => item.dependencyGroupKey !== selected.dependencyGroupKey,
      );
    });
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
    handleAddConnectedGroupToMemory,
    handleAddBlockToMemory,
    handleStageComponentBlock,
    handleRemoveFromMemory,
    handleRemoveComponentMemoryItem,
  };
}
