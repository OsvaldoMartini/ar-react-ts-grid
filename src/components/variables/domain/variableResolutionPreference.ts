import type { VariableResolutionMode } from './variableResolutionAssignments';

export const VARIABLE_RESOLUTION_MODE_PREFERENCE_KEY =
  'arweb.variables.resolve.variableMode';

export const readVariableResolutionModePreference = (): VariableResolutionMode => {
  try {
    return window.localStorage.getItem(VARIABLE_RESOLUTION_MODE_PREFERENCE_KEY)
      === 'SAME'
      ? 'SAME'
      : 'DISTINCT';
  } catch (_) {
    return 'DISTINCT';
  }
};

export const writeVariableResolutionModePreference = (
  mode: VariableResolutionMode,
): void => {
  try {
    window.localStorage.setItem(VARIABLE_RESOLUTION_MODE_PREFERENCE_KEY, mode);
  } catch (_) {
    // Storage can be unavailable in hardened/private browser contexts. The
    // current modal selection still works for this open session.
  }
};
