export type InstructionGridWorkspaceKind = 'BOT_JOB' | 'COMPONENT';
export type InstructionGridTargetSession = 'botJobTasks' | 'componentTasks';
export type InstructionGridRowMoveVerb = 'ROW_MOVE' | 'COMPONENT_ROW_MOVE';

export interface InstructionGridWorkspacePolicy {
  kind: InstructionGridWorkspaceKind;
  targetSessionId: InstructionGridTargetSession;
  updateOperation: 'updateInstructions' | 'componentsUpdate';
  rowMoveVerb: InstructionGridRowMoveVerb;
  commandEditorTargetSessionId: InstructionGridTargetSession;
  header: 'BOT_JOB_DETAILS' | 'COMPONENTS';
  emptyBlockLabel: string;
  stageWholeBlockInMemory: boolean;
}

export const BOT_JOB_INSTRUCTION_GRID_POLICY: InstructionGridWorkspacePolicy = {
  kind: 'BOT_JOB',
  targetSessionId: 'botJobTasks',
  updateOperation: 'updateInstructions',
  rowMoveVerb: 'ROW_MOVE',
  commandEditorTargetSessionId: 'botJobTasks',
  header: 'BOT_JOB_DETAILS',
  emptyBlockLabel: 'No Blocks were created yet',
  stageWholeBlockInMemory: false,
};

export const COMPONENT_INSTRUCTION_GRID_POLICY: InstructionGridWorkspacePolicy = {
  kind: 'COMPONENT',
  targetSessionId: 'componentTasks',
  updateOperation: 'componentsUpdate',
  rowMoveVerb: 'COMPONENT_ROW_MOVE',
  commandEditorTargetSessionId: 'componentTasks',
  header: 'COMPONENTS',
  emptyBlockLabel: 'No components were created yet',
  stageWholeBlockInMemory: true,
};
