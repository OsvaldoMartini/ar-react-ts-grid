import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';

const EDITABLE_COMMANDS = new Set([
  'GET',
  'SET',
  'LOOP',
  'REFRESH_LOOP',
  'H',
  'CK',
  'PDF CHECK',
  'CSV CHECK',
  'GOTO',
  'SWIPE_UP',
  'SWIPE_DOWN',
  'E',
  'IF',
  'ELSEIF',
  'ELSE',
  'ENDIF',
]);

/**
 * Commands exposed by the Variables green edit button.
 *
 * GET opens the editor with no intrinsic configuration (placement and command
 * transformation only); its variable link stays in the reconnect workflow.
 * GET and SET keep their variable links in the reconnect workflow. ELSE and ENDIF can be transformed only through
 * the guarded IF-family dissolution flow.
 */
export const isVariablesCommandEditorEligible = (
  action: string | null | undefined,
): boolean => EDITABLE_COMMANDS.has(canonicalInstructionAction(action));

export const variablesCommandEditorActions = Object.freeze(
  Array.from(EDITABLE_COMMANDS),
);
