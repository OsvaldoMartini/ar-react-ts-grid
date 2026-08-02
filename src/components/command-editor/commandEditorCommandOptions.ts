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
  { code: 'CK', label: 'Check Value' },
  { code: 'PDF CHECK', label: 'PDF Check' },
  { code: 'CSV CHECK', label: 'CSV Check' },
  { code: 'E', label: 'Extract Field' },
  { code: 'IF', label: 'IF' },
  { code: 'GOTO', label: 'GOTO' },
  { code: 'EXCEL GOTO', label: 'Excel GOTO' },
  { code: 'LOOP', label: 'Loop' },
  { code: 'REFRESH_LOOP', label: 'Refresh Loop' },
  { code: 'REFRESH', label: 'Refresh' },
  { code: 'NEXT_ENTER', label: 'Next / Enter' },
  { code: 'SWIPE_UP', label: 'Swipe Up' },
  { code: 'SWIPE_DOWN', label: 'Swipe Down' },
  { code: 'H', label: 'Wait' },
  { code: 'PAUSE', label: 'Pause' },
  { code: 'Q', label: 'Close Browser' },
  { code: 'P', label: 'Screenshot' },
]);
