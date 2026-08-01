import { canonicalInstructionAction } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';

const EDITABLE_COMMANDS = new Set([
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
]);

/**
 * Commands exposed by the Variables green edit button.
 *
 * Relationship-only commands such as GET and SET intentionally remain in the
 * reconnect workflow. IF/ELSEIF join this set only after their typed condition
 * contract is implemented.
 */
export const isVariablesCommandEditorEligible = (
  action: string | null | undefined,
): boolean => EDITABLE_COMMANDS.has(canonicalInstructionAction(action));

export const variablesCommandEditorActions = Object.freeze(
  Array.from(EDITABLE_COMMANDS),
);
