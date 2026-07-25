import { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';

export interface UseInstructionGridProps {
  homeBankingIdInitial: number;
  data: BlockLoopInstructionLoadDTO[];
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
}
