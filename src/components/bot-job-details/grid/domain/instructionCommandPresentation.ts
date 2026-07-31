import { canonicalInstructionAction } from './instructionRelationshipPolicy';

export type InstructionCommandIcon =
  | 'CHECK'
  | 'CLICK'
  | 'CLOSE_BROWSER'
  | 'CONDITIONAL'
  | 'ELSE'
  | 'ENDIF'
  | 'EXCEL'
  | 'EXCEL_GOTO'
  | 'GET_VALUE'
  | 'GOTO'
  | 'INPUT'
  | 'LINK'
  | 'NEXT_ENTER'
  | 'NONE'
  | 'OUTPUT'
  | 'PAUSE'
  | 'REFRESH'
  | 'REFRESH_LOOP'
  | 'SCREENSHOT'
  | 'SET_VALUE'
  | 'SWIPE_DOWN'
  | 'SWIPE_UP'
  | 'WAIT';

export interface InstructionCommandPresentation {
  canonicalAction: string;
  label: string;
  icon: InstructionCommandIcon;
  hidden: boolean;
  known: boolean;
}

type PresentationDefinition = Readonly<{
  label: string;
  icon: InstructionCommandIcon;
}>;

/**
 * Frontend presentation registry for instruction command codes.
 *
 * Labels intentionally use the client-facing vocabulary already used by the
 * legacy GridItem images (for example `E` is `ExcelWrite`, not the Command
 * Editor's older "Extract Field" wording).
 */
export const INSTRUCTION_COMMAND_PRESENTATIONS: Readonly<
  Record<string, PresentationDefinition>
> = Object.freeze({
  I: { label: 'Input Field', icon: 'INPUT' },
  A: { label: 'Link', icon: 'LINK' },
  C: { label: 'Click', icon: 'CLICK' },
  CLICK: { label: 'Click', icon: 'CLICK' },
  O: { label: 'OutPut', icon: 'OUTPUT' },
  SET: { label: 'SetValue', icon: 'SET_VALUE' },
  GET: { label: 'GetValue', icon: 'GET_VALUE' },
  CK: { label: 'CheckValue', icon: 'CHECK' },
  'CSV CHECK': { label: 'CSV Check', icon: 'EXCEL_GOTO' },
  'PDF CHECK': { label: 'PDF Check', icon: 'EXCEL_GOTO' },
  E: { label: 'ExcelWrite', icon: 'EXCEL' },
  P: { label: 'Screenshot', icon: 'SCREENSHOT' },
  Q: { label: 'Close Browser', icon: 'CLOSE_BROWSER' },
  H: { label: 'Wait', icon: 'WAIT' },
  WAIT: { label: 'Wait', icon: 'WAIT' },
  IF: { label: 'IF', icon: 'CONDITIONAL' },
  ELSEIF: { label: 'Else If', icon: 'CONDITIONAL' },
  ELSE: { label: 'Else', icon: 'ELSE' },
  ENDIF: { label: 'End If', icon: 'ENDIF' },
  REFRESH: { label: 'Refresh', icon: 'REFRESH' },
  LOOP: { label: 'Loop', icon: 'REFRESH' },
  REFRESH_LOOP: { label: 'Refresh Loop', icon: 'REFRESH_LOOP' },
  NEXT_ENTER: { label: 'Next / Enter', icon: 'NEXT_ENTER' },
  SWIPE_UP: { label: 'Swipe Up', icon: 'SWIPE_UP' },
  SWIPE_DOWN: { label: 'Swipe Down', icon: 'SWIPE_DOWN' },
  GOTO: { label: 'GOTO', icon: 'GOTO' },
  'EXCEL GOTO': { label: 'Excel GOTO', icon: 'EXCEL_GOTO' },
  'NEXT ROW': { label: 'Excel Data Next Row', icon: 'EXCEL' },
  PAUSE: { label: 'Pause', icon: 'PAUSE' },
  BACK: { label: 'Back', icon: 'NONE' },
});

const actionTokens = (
  action: string | null | undefined,
): readonly string[] =>
  String(action ?? '')
    .split(':')
    .map(token => token.trim())
    .filter(Boolean);

/**
 * Resolve a command into one stable, descriptive UI presentation.
 *
 * The ordering mirrors GridItem: an input encoding wins first, then an anchor
 * tag, followed by Output/Click and the remaining command registry.
 */
export const instructionCommandPresentation = (
  action: string | null | undefined,
  tagName?: string | null,
): InstructionCommandPresentation => {
  const tokens = actionTokens(action);
  const canonicalAction = canonicalInstructionAction(action);
  const normalizedTag = String(tagName ?? '').trim().toLocaleLowerCase();
  const presentationAction = canonicalAction === 'I'
    ? 'I'
    : normalizedTag === 'a' || canonicalAction === 'A'
      ? 'A'
      : canonicalAction;
  const definition = INSTRUCTION_COMMAND_PRESENTATIONS[presentationAction];
  const hidden = presentationAction === 'I'
    && tokens.slice(1).some(token => token.toLocaleLowerCase() === 'hidden');

  if (definition) {
    return {
      canonicalAction: presentationAction,
      label: definition.label,
      icon: definition.icon,
      hidden,
      known: true,
    };
  }

  return {
    canonicalAction,
    label: canonicalAction || 'Unknown',
    icon: 'NONE',
    hidden: false,
    known: false,
  };
};
