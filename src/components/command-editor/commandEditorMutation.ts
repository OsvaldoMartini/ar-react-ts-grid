import type { CommandEditorBaseDraft } from './commandEditorDraft';
import type { CommandEditorPlacement } from './commandEditorPlacement';
import type { CommandEditorVariableBinding } from './commandEditorVariableBindings';

export type CommandEditorMutationAction = 'UPDATE' | 'COPY_NEW' | 'CREATE_NEW';

export interface CommandEditorMutationIntent {
  action: CommandEditorMutationAction;
  sourceInstructionId: number;
  targetBlockId: number;
  placement: CommandEditorPlacement;
  draft: CommandEditorBaseDraft;
  /**
   * Relationship intent only. UPDATE carries the authoritative current value
   * and the user's desired value for each action-required slot. COPY/CREATE
   * carry an empty array so new instructions remain disconnected.
   */
  variableBindings: readonly CommandEditorVariableBinding[];
  allowRelationshipDisconnect: boolean;
  allowConditionalFamilyDissolve: boolean;
  conditionalFamilyDeleteIds: readonly number[];
}
