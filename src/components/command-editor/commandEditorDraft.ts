import type { ComponentEditorCommand } from './componentEditor.types';

export interface CommandEditorBaseDraft {
  name: string;
  action: string;
  operation: string;
}

export const commandEditorBaseDraft = (
  command: ComponentEditorCommand,
): CommandEditorBaseDraft => ({
  name: command.instructionName,
  action: command.action,
  operation: command.operation,
});

export const isCommandEditorBaseDraftValid = (
  draft: CommandEditorBaseDraft,
): boolean => draft.name.trim().length > 0 && draft.action.trim().length > 0;
