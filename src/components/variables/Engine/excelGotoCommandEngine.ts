import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';
import type { SmokeExecutionProgram } from './smokeExecutionProgram';

export type ExcelGotoTransition = {
  nextCursor: number;
  nextRowIndex: number;
  message: string;
  warning: string | null;
};

const targetBlockId = (step: VariablesSmokeTestStep): number | null => {
  const target = step.connections.find(connection =>
    connection.kind === 'BLOCK_TARGET'
    && connection.state === 'CONNECTED'
    && connection.target?.entity === 'BLOCK');
  return target?.target?.id ?? null;
};

/** Advances the frozen Excel row and returns to the connected Block until the dataset is exhausted. */
export const resolveExcelGotoTransition = (
  program: SmokeExecutionProgram,
  cursor: number,
  currentRowIndex: number,
  datasetRowCount: number,
): ExcelGotoTransition | null => {
  const item = program.items[cursor];
  if (
    item?.kind !== 'STEP'
    || canonicalInstructionAction(item.step.action) !== 'EXCEL GOTO'
  ) return null;

  const blockId = targetBlockId(item.step);
  const targetCursor = blockId === null ? undefined : program.firstCursorByBlockId.get(blockId);
  if (blockId === null || blockId === item.step.blockId || targetCursor === undefined) {
    return {
      nextCursor: cursor + 1,
      nextRowIndex: currentRowIndex,
      message: 'EXCEL GOTO target Block is unavailable in the selected Integration scope; continuing.',
      warning: 'EXCEL GOTO requires a connected, different, non-empty Block inside the selected scope',
    };
  }
  if (!Number.isSafeInteger(datasetRowCount) || datasetRowCount < 1) {
    return {
      nextCursor: cursor + 1,
      nextRowIndex: currentRowIndex,
      message: 'EXCEL GOTO found no frozen Excel rows; continuing.',
      warning: 'The selected REAL or SYNTHETIC dataset is empty',
    };
  }
  const nextRowIndex = currentRowIndex + 1;
  if (nextRowIndex >= datasetRowCount) {
    return {
      nextCursor: cursor + 1,
      nextRowIndex: currentRowIndex,
      message: `all ${datasetRowCount} frozen Excel row(s) completed; continuing.`,
      warning: null,
    };
  }
  const target = program.items[targetCursor];
  const targetLabel = target?.kind === 'STEP'
    ? `Block #${target.step.blockOrder ?? blockId} ${target.step.blockName}`
    : `Block ID ${blockId}`;
  return {
    nextCursor: targetCursor,
    nextRowIndex,
    message: `advanced to frozen Excel row ${nextRowIndex + 1} of ${datasetRowCount}; returning to ${targetLabel}.`,
    warning: null,
  };
};
