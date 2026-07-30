import React from 'react';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import { canonicalInstructionAction } from './domain/instructionRelationshipPolicy';
import styles from './InstructionVariableStateBadge.module.scss';

export type InstructionVariableRuntimeState = 'SOURCE_DEFINED' | 'VOID';

export interface InstructionVariableStateBadgeProps {
  instruction: BlockLoopInstructionLoadDTO;
  allInstructions: readonly BlockLoopInstructionLoadDTO[];
  onClick?: () => void;
}

const isPositiveId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const compareExecutionOrder = (
  left: BlockLoopInstructionLoadDTO,
  right: BlockLoopInstructionLoadDTO,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.id - right.id;

const isActiveGetProducer = (
  instruction: BlockLoopInstructionLoadDTO,
  variableId: number,
): boolean =>
  instruction.variableId === variableId
  && canonicalInstructionAction(instruction.actions) === 'GET'
  && instruction.instructionActive === true
  && instruction.blockActive === true;

export const instructionVariableRuntimeState = (
  instruction: BlockLoopInstructionLoadDTO,
  allInstructions: readonly BlockLoopInstructionLoadDTO[],
): InstructionVariableRuntimeState | null => {
  if (!isPositiveId(instruction.variableId)) return null;

  const sourceDefined = allInstructions.some(candidate =>
    isActiveGetProducer(candidate, instruction.variableId as number)
    && (
      candidate.id === instruction.id
      || compareExecutionOrder(candidate, instruction) < 0
    ));
  return sourceDefined ? 'SOURCE_DEFINED' : 'VOID';
};

const InstructionVariableStateBadge: React.FC<
  InstructionVariableStateBadgeProps
> = ({
  instruction,
  allInstructions,
  onClick,
}) => {
  const state = instructionVariableRuntimeState(instruction, allInstructions);
  if (state === null || !isPositiveId(instruction.variableId)) return null;

  const sourceDefined = state === 'SOURCE_DEFINED';
  const label = sourceDefined ? 'SOURCE DEFINED' : 'VOID';
  const title = sourceDefined
    ? `Variable #${instruction.variableId} has an active GET source before this step.`
    : `Variable #${instruction.variableId} has no active GET source before this step.`;
  const className = [
    styles.badge,
    sourceDefined ? styles.sourceDefined : styles.voidState,
    onClick ? styles.interactive : '',
  ].filter(Boolean).join(' ');

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        title={title}
        aria-label={`${label}: variable ${instruction.variableId}`}
        data-variable-runtime-state={state}
        onClick={onClick}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={className}
      title={title}
      aria-label={`${label}: variable ${instruction.variableId}`}
      data-variable-runtime-state={state}
    >
      {label}
    </span>
  );
};

export default InstructionVariableStateBadge;
