import { canonicalInstructionAction } from '../../bot-job-details/grid/domain/instructionRelationshipPolicy';

const TYPED_VARIABLE_ACTIONS = new Set([
  'GET',
  'SET',
  'E',
  'CK',
  'CSV CHECK',
  'PDF CHECK',
]);

/** Legacy operation strings are storage compatibility data, not active UI state. */
export const hidesLegacyVariableOperation = (
  action: string | null | undefined,
): boolean => TYPED_VARIABLE_ACTIONS.has(
  canonicalInstructionAction(action ?? ''),
);
