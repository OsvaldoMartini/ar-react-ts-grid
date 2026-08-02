import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';
import type { PlaywrightPageRefreshCommand } from './playwrightCommandBridge';

/** Creates the browser command added by REFRESH_LOOP on every visit. */
export const refreshLoopPlaywrightCommand = (
  step: VariablesSmokeTestStep,
): PlaywrightPageRefreshCommand | null => {
  if (
    canonicalInstructionAction(step.action) !== 'REFRESH_LOOP'
    || step.instructionId === null
  ) {
    return null;
  }
  return Object.freeze({
    type: 'PAGE_REFRESH',
    instructionId: step.instructionId,
    blockId: step.blockId,
    source: 'REFRESH_LOOP',
  });
};
