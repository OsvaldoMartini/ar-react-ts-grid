// Functional Test tab — shared types between the panel components, the
// socket hook, and the persisted mappings. Only INPUT-text bot job
// instructions (`actions LIKE 'I:%'`) are in scope for v1.

export interface BotJobInputField {
  id: number;
  name: string | null;
  clientNamed: string | null;
  actions: string;          // always "I:..." in v1
  xpath: string | null;
  cssSelector: string | null;
  blockId: number;
  blockName: string | null;
  blockOrderNumber: number;
  instructionOrderNumber: number;
}

export type ApiFieldDirection = "input" | "output" | "io";

export interface ApiFieldRow {
  // Composite identity: spec file + endpoint path + field name keeps it stable
  // across reloads of the same spec.
  key: string;
  specFile: string;
  specTitle: string;
  fieldName: string;
  fieldType: string;
  required: boolean;
  direction: ApiFieldDirection;
  isParam: boolean;
}

export interface FieldMapping {
  apiKey: string;             // ApiFieldRow.key
  botFieldId: number;         // BotJobInputField.id
  createdAt: string;          // ISO timestamp
}
