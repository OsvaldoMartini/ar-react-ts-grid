/**
 * Command catalog for the Command Editor's command SearchBox.
 *
 * Mirrors the legacy add-command <select> exactly (codes, labels, order) so
 * the editor speaks the same vocabulary as the grid's command picker.
 */
export interface CommandEditorCommandOption {
  code: string;
  label: string;
}

export const COMMAND_EDITOR_COMMAND_OPTIONS: readonly CommandEditorCommandOption[] = Object.freeze([
  { code: 'GET', label: 'Get Value' },
  { code: 'SET', label: 'Set Value' },
  { code: 'CK', label: 'Check Value' },
  // PARKED (user request 2026-08-02): { code: 'PDF CHECK', label: 'PDF Check' },
  // PARKED (user request 2026-08-02): { code: 'CSV CHECK', label: 'CSV Check' },
  { code: 'E', label: 'Extract Field' },
  { code: 'IF', label: 'IF' },
  { code: 'ELSEIF', label: 'Else If' },
  { code: 'GOTO', label: 'GOTO' },
  { code: 'EXCEL GOTO', label: 'Excel GOTO' },
  { code: 'LOOP', label: 'Loop' },
  { code: 'REFRESH_LOOP', label: 'Refresh Loop' },
  { code: 'REFRESH', label: 'Refresh' },
  // PARKED (user request 2026-08-02): { code: 'NEXT_ENTER', label: 'Next / Enter' },
  // PARKED (user request 2026-08-02): { code: 'SWIPE_UP', label: 'Swipe Up' },
  // PARKED (user request 2026-08-02): { code: 'SWIPE_DOWN', label: 'Swipe Down' },
  { code: 'H', label: 'Wait' },
  { code: 'PAUSE', label: 'Pause' },
  { code: 'Q', label: 'Close Browser' },
  { code: 'P', label: 'Screenshot' },
]);
