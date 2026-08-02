import type { CommandEditorBaseDraft } from './commandEditorDraft';
import type { CommandEditorPlacement } from './commandEditorPlacement';

export type CommandEditorMutationAction = 'UPDATE' | 'COPY_NEW';

export interface CommandEditorMutationIntent {
  action: CommandEditorMutationAction;
  sourceInstructionId: number;
  targetBlockId: number;
  placement: CommandEditorPlacement;
  draft: CommandEditorBaseDraft;
  allowRelationshipDisconnect: boolean;
}
