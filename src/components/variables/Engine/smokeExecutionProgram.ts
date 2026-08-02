import type {
  VariablesSmokeTestBlock,
  VariablesSmokeTestPlan,
  VariablesSmokeTestStep,
} from '../domain/variablesSmokeTestTypes';

export type SmokeExecutionItem =
  | { kind: 'INACTIVE_BLOCK'; block: VariablesSmokeTestBlock }
  | { kind: 'STEP'; block: VariablesSmokeTestBlock; step: VariablesSmokeTestStep };

export type SmokeExecutionProgram = {
  items: readonly SmokeExecutionItem[];
  instructionCursorById: ReadonlyMap<number, number>;
};

/** Builds the immutable command stream consumed by the frontend Smoke engine. */
export const buildSmokeExecutionProgram = (
  plan: VariablesSmokeTestPlan,
): SmokeExecutionProgram => {
  const items: SmokeExecutionItem[] = [];
  const instructionCursorById = new Map<number, number>();

  plan.blocks.forEach((block) => {
    if (!block.active) {
      items.push({ kind: 'INACTIVE_BLOCK', block });
      return;
    }
    block.steps.forEach((step) => {
      const cursor = items.length;
      items.push({ kind: 'STEP', block, step });
      if (step.instructionId !== null) {
        instructionCursorById.set(step.instructionId, cursor);
      }
    });
  });

  return Object.freeze({
    items: Object.freeze(items),
    instructionCursorById,
  });
};
