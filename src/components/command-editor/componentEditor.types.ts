export interface ComponentEditorBlockOption {
  blockId: number;
  blockOrder: number;
  blockName: string;
  commandCount: number;
  active?: boolean;
}

export interface ComponentEditorCommand {
  instructionId: number;
  instructionOrder: number | null;
  instructionName: string;
  action: string;
  operation: string;
  blockId: number | null;
  blockOrder: number | null;
  blockName: string;
  active: boolean | null;
}
