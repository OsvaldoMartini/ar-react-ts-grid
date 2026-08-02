import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';
import type { SmokeExecutionProgram } from './smokeExecutionProgram';
import type { PlaywrightBrowserCommand } from './playwrightCommandBridge';
import { refreshLoopPlaywrightCommand } from './refreshLoopCommandEngine';

export type LoopCommandConfiguration = {
  intervalSeconds: number;
  repetitions: number;
};

export type LoopCommandTransition = {
  instructionId: number;
  nextCursor: number;
  nextRemaining: number;
  waitMs: number;
  message: string;
  warning: string | null;
  playwrightCommand: PlaywrightBrowserCommand | null;
};

export type LoopRemainingByInstructionId = Readonly<Record<number, number>>;

const isLoopAction = (action: string): boolean => {
  const canonical = canonicalInstructionAction(action);
  return canonical === 'LOOP' || canonical === 'REFRESH_LOOP';
};

export const parseLoopCommandConfiguration = (
  step: VariablesSmokeTestStep,
): LoopCommandConfiguration | null => {
  if (!isLoopAction(step.action)) return null;
  const [intervalText, repetitionsText] = step.operation
    .split(':')
    .map(part => part.trim());
  const intervalSeconds = Number(intervalText);
  const repetitions = Number(repetitionsText);
  if (
    !Number.isFinite(intervalSeconds)
    || intervalSeconds < 0
    || !Number.isSafeInteger(repetitions)
    || repetitions < 1
  ) {
    return null;
  }
  return { intervalSeconds, repetitions };
};

const loopAnchorInstructionId = (step: VariablesSmokeTestStep): number | null => {
  const anchor = step.connections.find(connection =>
    connection.kind === 'LOOP_ANCHOR'
    && connection.state === 'CONNECTED'
    && connection.target?.entity === 'INSTRUCTION');
  return anchor?.target?.id ?? null;
};

export const initialLoopRemaining = (
  program: SmokeExecutionProgram,
): LoopRemainingByInstructionId => Object.freeze(
  program.items.reduce<Record<number, number>>((remaining, item) => {
    if (item.kind !== 'STEP' || item.step.instructionId === null) return remaining;
    const configuration = parseLoopCommandConfiguration(item.step);
    if (configuration !== null) {
      remaining[item.step.instructionId] = configuration.repetitions;
    }
    return remaining;
  }, {}),
);

/**
 * Resolves one LOOP transition without persistence or browser access.
 * A configured count of N performs N complete jumps back to the parent.
 * The initial pass before LOOP is not deducted from the configured count.
 */
export const resolveLoopCommandTransition = (
  program: SmokeExecutionProgram,
  cursor: number,
  remainingByInstructionId: LoopRemainingByInstructionId,
): LoopCommandTransition | null => {
  const item = program.items[cursor];
  if (item?.kind !== 'STEP' || !isLoopAction(item.step.action)) return null;
  const instructionId = item.step.instructionId;
  if (instructionId === null) return null;

  const configuration = parseLoopCommandConfiguration(item.step);
  if (configuration === null) {
    return {
      instructionId,
      nextCursor: cursor + 1,
      nextRemaining: 0,
      waitMs: 0,
      message: 'LOOP configuration is invalid; continuing to the next command.',
      warning: 'LOOP requires operation interval:count with interval >= 0 and count >= 1',
      playwrightCommand: refreshLoopPlaywrightCommand(item.step),
    };
  }

  const anchorId = loopAnchorInstructionId(item.step);
  const anchorCursor = anchorId === null
    ? undefined
    : program.instructionCursorById.get(anchorId);
  if (anchorId === null || anchorCursor === undefined || anchorCursor >= cursor) {
    return {
      instructionId,
      nextCursor: cursor + 1,
      nextRemaining: 0,
      waitMs: 0,
      message: 'LOOP anchor is unavailable in the selected Smoke scope; continuing.',
      warning: 'LOOP requires a connected preceding instruction inside the selected scope',
      playwrightCommand: refreshLoopPlaywrightCommand(item.step),
    };
  }

  const currentRemaining = remainingByInstructionId[instructionId]
    ?? configuration.repetitions;
  if (currentRemaining <= 0) {
    return {
      instructionId,
      nextCursor: cursor + 1,
      nextRemaining: 0,
      waitMs: 0,
      message: `all ${configuration.repetitions} configured loop repeat(s) completed; continuing.`,
      warning: null,
      playwrightCommand: null,
    };
  }

  const nextRemaining = Math.max(0, currentRemaining - 1);
  const waitMs = Math.round(configuration.intervalSeconds * 1000);
  const anchor = program.items[anchorCursor];
  const anchorLabel = anchor?.kind === 'STEP'
    ? `#${anchor.step.instructionOrder ?? '?'} ${anchor.step.instructionName} (ID ${anchorId})`
    : `instruction ID ${anchorId}`;
  return {
    instructionId,
    nextCursor: anchorCursor,
    nextRemaining,
    waitMs,
    message: `waited ${configuration.intervalSeconds}s; ${nextRemaining} loop(s) remaining; returning to ${anchorLabel}.`,
    warning: null,
    playwrightCommand: refreshLoopPlaywrightCommand(item.step),
  };
};
