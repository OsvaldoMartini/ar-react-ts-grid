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
  onHoldSeconds: number | null;
  blockId: number | null;
  blockOrder: number | null;
  blockName: string;
  active: boolean | null;
  parentId: number | null;
  parentBlockId: number | null;
  variableId?: number | null;
  variableSlots?: readonly ComponentEditorVariableSlotLink[];
  storedConfiguration?: ComponentEditorStoredConfiguration | null;
}

export type ComponentEditorVariableSlot =
  | 'LEFT'
  | 'RIGHT'
  | 'GET_WRITE'
  | 'READ_SET'
  | 'READ';

export interface ComponentEditorVariableSlotLink {
  slot: string;
  variableId: number;
}

export interface ComponentEditorVariableOption {
  variableId: number;
  name: string;
  type: string;
}

export interface ComponentEditorStoredConfiguration {
  commandType: string;
  conditionSource: string;
  leftVariableId: number | null;
  operandKind: string;
  comparisonOperator: string;
  operandRawValue: string;
  operandVariableId: number | null;
  outputKey: string;
  outputColumn: string;
  outputFile: string;
  externalSourceKey: string;
  formatPolicy: string;
}
