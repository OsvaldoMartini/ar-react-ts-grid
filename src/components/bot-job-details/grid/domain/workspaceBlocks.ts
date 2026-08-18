import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

export interface WorkspaceBlock {
  blockId: number;
  blockOrderNumber: number;
  blockName: string;
  blockActive: boolean;
  blockWait: number;
  exportFile?: string;
}

export const workspaceBlocksFromInstructions = (
  instructions: BlockLoopInstructionLoadDTO[],
): WorkspaceBlock[] => {
  const blocks = new Map<number, WorkspaceBlock>();
  instructions.forEach((instruction) => {
    if (blocks.has(instruction.blockId)) return;
    blocks.set(instruction.blockId, {
      blockId: instruction.blockId,
      blockOrderNumber: instruction.blockOrderNumber,
      blockName: instruction.blockName,
      blockActive: instruction.blockActive !== false,
      blockWait: instruction.blockWait ?? 0,
      exportFile: instruction.exportFile,
    });
  });
  return Array.from(blocks.values())
    .sort((left, right) => left.blockOrderNumber - right.blockOrderNumber);
};

export const normalizeWorkspaceBlocks = (values: unknown[]): WorkspaceBlock[] => {
  const blocks = new Map<number, WorkspaceBlock>();
  values.forEach((value) => {
    if (!value || typeof value !== 'object') return;
    const raw = value as Record<string, unknown>;
    const blockId = Number(raw.blockId ?? raw.id);
    const blockOrderNumber = Number(raw.blockOrderNumber);
    if (!Number.isFinite(blockId) || blockId <= 0
      || !Number.isFinite(blockOrderNumber) || blockOrderNumber <= 0) return;
    blocks.set(blockId, {
      blockId,
      blockOrderNumber,
      blockName: String(raw.blockName ?? raw.name ?? ''),
      blockActive: (raw.blockActive ?? raw.active) !== false
        && (raw.blockActive ?? raw.active) !== 0,
      blockWait: Number.isFinite(Number(raw.blockWait ?? raw.wait))
        ? Number(raw.blockWait ?? raw.wait)
        : 0,
      exportFile: raw.exportFile == null ? undefined : String(raw.exportFile),
    });
  });
  return Array.from(blocks.values())
    .sort((left, right) => left.blockOrderNumber - right.blockOrderNumber);
};

/**
 * Legacy array snapshots contain only populated blocks. Preserve catalog-only
 * empty blocks until the backend sends the next authoritative object envelope.
 */
export const mergeWorkspaceBlocks = (
  current: WorkspaceBlock[],
  incoming: WorkspaceBlock[],
): WorkspaceBlock[] => {
  const merged = new Map<number, WorkspaceBlock>();
  current.forEach(block => merged.set(block.blockId, block));
  incoming.forEach(block => merged.set(block.blockId, block));
  return Array.from(merged.values())
    .sort((left, right) => left.blockOrderNumber - right.blockOrderNumber);
};
