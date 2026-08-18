import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';
import type {
  CommandRemainingByInstructionId,
  ControlFlowCommandTransition,
} from './controlFlowCommand.types';
import type { SmokeExecutionProgram } from './smokeExecutionProgram';

const gotoLimit = (step: VariablesSmokeTestStep): number | null => {
  if (canonicalInstructionAction(step.action) !== 'GOTO') return null;
  const limit = Number(step.operation.trim());
  return Number.isSafeInteger(limit) && limit > 0 ? limit : null;
};

const gotoTargetBlockId = (step: VariablesSmokeTestStep): number | null => {
  const target = step.connections.find(connection =>
    connection.kind === 'BLOCK_TARGET'
    && connection.state === 'CONNECTED'
    && connection.target?.entity === 'BLOCK');
  return target?.target?.id ?? null;
};

export const initialGotoRemaining = (
  program: SmokeExecutionProgram,
): CommandRemainingByInstructionId => Object.freeze(
  program.items.reduce<Record<number, number>>((remaining, item) => {
    if (item.kind !== 'STEP' || item.step.instructionId === null) return remaining;
    const limit = gotoLimit(item.step);
    if (limit !== null) remaining[item.step.instructionId] = limit;
    return remaining;
  }, {}),
);

/** Executes one GOTO decision; failures always continue after the GOTO row. */
export const resolveGotoCommandTransition = (
  program: SmokeExecutionProgram,
  cursor: number,
  remainingByInstructionId: CommandRemainingByInstructionId,
): ControlFlowCommandTransition | null => {
  const item = program.items[cursor];
  if (
    item?.kind !== 'STEP'
    || canonicalInstructionAction(item.step.action) !== 'GOTO'
    || item.step.instructionId === null
  ) {
    return null;
  }

  const instructionId = item.step.instructionId;
  const limit = gotoLimit(item.step);
  if (limit === null) {
    return {
      instructionId,
      nextCursor: cursor + 1,
      nextRemaining: 0,
      waitMs: 0,
      message: 'GOTO limit is invalid; continuing to the next command.',
      warning: 'GOTO requires a positive integer limit',
      playwrightCommand: null,
    };
  }

  const targetBlockId = gotoTargetBlockId(item.step);
  const targetCursor = targetBlockId === null
    ? undefined
    : program.firstCursorByBlockId.get(targetBlockId);
  if (
    targetBlockId === null
    || targetBlockId === item.step.blockId
    || targetCursor === undefined
  ) {
    return {
      instructionId,
      nextCursor: cursor + 1,
      nextRemaining: 0,
      waitMs: 0,
      message: 'GOTO target Block is unavailable in the selected Smoke scope; continuing.',
      warning: 'GOTO requires a connected, different, non-empty Block inside the selected scope',
      playwrightCommand: null,
    };
  }

  const currentRemaining = remainingByInstructionId[instructionId] ?? limit;
  if (currentRemaining <= 0) {
    return {
      instructionId,
      nextCursor: cursor + 1,
      nextRemaining: 0,
      waitMs: 0,
      message: `all ${limit} configured GOTO jump(s) completed; continuing.`,
      warning: null,
      playwrightCommand: null,
    };
  }

  const nextRemaining = currentRemaining - 1;
  const target = program.items[targetCursor];
  const targetLabel = target?.kind === 'STEP'
    ? `Block #${target.step.blockOrder ?? targetBlockId} ${target.step.blockName}`
    : `Block ID ${targetBlockId}`;
  return {
    instructionId,
    nextCursor: targetCursor,
    nextRemaining,
    waitMs: 0,
    message: `${nextRemaining} GOTO jump(s) remaining; jumping to ${targetLabel}.`,
    warning: null,
    playwrightCommand: null,
  };
};
