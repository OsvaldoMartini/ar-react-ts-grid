import { useState } from 'react';

export interface UseExecutionState {
  /** Instruction id currently executing (0 = none), from the live TEST RUN frames. */
  executionId: number;
  setExecutionId: React.Dispatch<React.SetStateAction<number>>;
  /** Execution status colour/label for the row overlay. */
  executionState: string | undefined;
  setExecutionState: React.Dispatch<React.SetStateAction<string | undefined>>;
}

/**
 * Phase 6, step 4 — the live TEST-RUN execution highlight (which instruction is
 * running + its status). Extracted verbatim from GridItem. Set by the execution
 * WebSocket frame, read by the row's ExecutionStateOverlay.
 */
export function useExecutionState(): UseExecutionState {
  const [executionId, setExecutionId] = useState<number>(0);
  const [executionState, setExecutionState] = useState<string | undefined>();

  return { executionId, setExecutionId, executionState, setExecutionState };
}
