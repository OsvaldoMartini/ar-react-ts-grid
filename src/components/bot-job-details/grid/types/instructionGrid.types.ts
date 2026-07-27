import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type { InstructionGridWorkspaceKind } from '../instructionGrid.policy';
import type { WorkspaceBlock } from '../domain/workspaceBlocks';

export interface UseInstructionGridProps {
  homeBankingIdInitial: number;
  data: BlockLoopInstructionLoadDTO[];
  /** Authoritative catalog, including blocks that currently have no instructions. */
  initialBlocks?: WorkspaceBlock[];
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
  /** Defaults to BOT_JOB so every existing GridItem caller keeps its behavior. */
  workspaceMode?: InstructionGridWorkspaceKind;
}
