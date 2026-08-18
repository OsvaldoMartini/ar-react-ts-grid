import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';
import type { SmokeExecutionProgram } from './smokeExecutionProgram';

type ConditionalBoundaryKind = 'IF' | 'ELSEIF' | 'ELSE' | 'ENDIF';

type ConditionalFamily = {
  rootInstructionId: number;
  rootCursor: number;
  endifCursor: number;
  boundaryCursors: readonly number[];
};

export type ConditionalExecutionIndex = {
  familyByCursor: ReadonlyMap<number, ConditionalFamily>;
  boundaryKindByCursor: ReadonlyMap<number, ConditionalBoundaryKind>;
};

export type ConditionalExecutionState = {
  pendingBoundaryCursor: number | null;
};

export type ConditionalCommandTransition = {
  nextCursor: number;
  nextState: ConditionalExecutionState;
  message: string;
};

export const initialConditionalExecutionState = (): ConditionalExecutionState => ({
  pendingBoundaryCursor: null,
});

const stepAt = (
  program: SmokeExecutionProgram,
  cursor: number,
): VariablesSmokeTestStep | null => {
  const item = program.items[cursor];
  return item?.kind === 'STEP' ? item.step : null;
};

const boundaryKind = (
  step: VariablesSmokeTestStep | null,
): ConditionalBoundaryKind | null => {
  const action = canonicalInstructionAction(step?.action);
  return action === 'IF' || action === 'ELSEIF' || action === 'ELSE' || action === 'ENDIF'
    ? action
    : null;
};

/**
 * Indexes complete IF families from the frozen WYSIWYG execution stream.
 * Malformed families remain ordinary steps and never block Smoke execution.
 */
export const buildConditionalExecutionIndex = (
  program: SmokeExecutionProgram,
): ConditionalExecutionIndex => {
  const familyByCursor = new Map<number, ConditionalFamily>();
  const boundaryKindByCursor = new Map<number, ConditionalBoundaryKind>();

  for (let cursor = 0; cursor < program.items.length; cursor += 1) {
    const rootStep = stepAt(program, cursor);
    if (boundaryKind(rootStep) !== 'IF' || rootStep?.instructionId == null) continue;

    const rootBlockId = rootStep.blockId;
    const boundaries: number[] = [cursor];
    let depth = 1;
    let endifCursor: number | null = null;
    for (let candidateCursor = cursor + 1;
      candidateCursor < program.items.length;
      candidateCursor += 1) {
      const candidate = stepAt(program, candidateCursor);
      if (candidate === null || candidate.blockId !== rootBlockId) break;
      const kind = boundaryKind(candidate);
      if (kind === 'IF') {
        depth += 1;
        continue;
      }
      if (kind === 'ENDIF') {
        depth -= 1;
        if (depth === 0) {
          boundaries.push(candidateCursor);
          endifCursor = candidateCursor;
          break;
        }
        continue;
      }
      if (depth === 1 && (kind === 'ELSEIF' || kind === 'ELSE')) {
        boundaries.push(candidateCursor);
      }
    }
    if (endifCursor === null) continue;

    const family: ConditionalFamily = Object.freeze({
      rootInstructionId: rootStep.instructionId,
      rootCursor: cursor,
      endifCursor,
      boundaryCursors: Object.freeze(boundaries),
    });
    for (let familyCursor = cursor; familyCursor <= endifCursor; familyCursor += 1) {
      familyByCursor.set(familyCursor, family);
    }
    boundaries.forEach((boundaryCursor) => {
      const kind = boundaryKind(stepAt(program, boundaryCursor));
      if (kind !== null) boundaryKindByCursor.set(boundaryCursor, kind);
    });
    cursor = endifCursor;
  }

  return Object.freeze({ familyByCursor, boundaryKindByCursor });
};

export const resolveConditionalBoundaryTransition = (
  index: ConditionalExecutionIndex,
  cursor: number,
  state: ConditionalExecutionState,
): ConditionalCommandTransition | null => {
  const family = index.familyByCursor.get(cursor);
  const kind = index.boundaryKindByCursor.get(cursor);
  if (!family || !kind) return null;

  if (kind === 'IF') {
    return {
      nextCursor: cursor + 1,
      nextState: initialConditionalExecutionState(),
      message: 'started IF branch; CheckValue results will control branch selection',
    };
  }
  if (kind === 'ENDIF') {
    return {
      nextCursor: cursor + 1,
      nextState: initialConditionalExecutionState(),
      message: 'completed IF family at ENDIF',
    };
  }
  if (state.pendingBoundaryCursor === cursor) {
    return {
      nextCursor: cursor + 1,
      nextState: initialConditionalExecutionState(),
      message: `entered ${kind} because a CheckValue failed in the previous branch`,
    };
  }
  return {
    nextCursor: family.endifCursor,
    nextState: initialConditionalExecutionState(),
    message: `completed the active branch; skipped remaining conditions and continued to ENDIF`,
  };
};

/** Route only an actual CheckValue failure; warnings and ordinary commands never branch. */
export const resolveConditionalCheckFailureTransition = (
  index: ConditionalExecutionIndex,
  cursor: number,
): ConditionalCommandTransition | null => {
  const family = index.familyByCursor.get(cursor);
  if (!family) return null;
  const nextBoundary = family.boundaryCursors.find(boundaryCursor => boundaryCursor > cursor)
    ?? family.endifCursor;
  const kind = index.boundaryKindByCursor.get(nextBoundary) ?? 'ENDIF';
  return {
    nextCursor: nextBoundary,
    nextState: {
      pendingBoundaryCursor: kind === 'ENDIF' ? null : nextBoundary,
    },
    message: kind === 'ENDIF'
      ? 'CheckValue failed; no remaining condition matched, so execution continued to ENDIF'
      : `CheckValue failed; execution continued to ${kind}`,
  };
};
