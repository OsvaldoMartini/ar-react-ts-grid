import type { PlaywrightBrowserCommand } from './playwrightCommandBridge';

export type CommandRemainingByInstructionId = Readonly<Record<number, number>>;

export type ControlFlowCommandTransition = {
  instructionId: number;
  nextCursor: number;
  nextRemaining: number;
  waitMs: number;
  message: string;
  warning: string | null;
  playwrightCommand: PlaywrightBrowserCommand | null;
};
