import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';

export type WaitCommandExecution = {
  waitMs: number;
  message: string;
  warning: string | null;
};

/** Resolves the real in-memory delay authored by a WAIT command. */
export const resolveWaitCommandExecution = (
  step: VariablesSmokeTestStep,
): WaitCommandExecution | null => {
  if (canonicalInstructionAction(step.action) !== 'H') return null;
  const seconds = step.onHoldSeconds;
  if (
    typeof seconds !== 'number'
    || !Number.isFinite(seconds)
    || seconds < 0
  ) {
    return {
      waitMs: 0,
      message: 'WAIT duration is invalid; continuing to the next command.',
      warning: 'WAIT requires a duration greater than or equal to zero',
    };
  }
  return {
    waitMs: Math.round(seconds * 1000),
    message: `waited ${seconds} second(s); continuing.`,
    warning: null,
  };
};
