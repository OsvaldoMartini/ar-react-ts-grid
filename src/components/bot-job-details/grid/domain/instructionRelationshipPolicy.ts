export type InstructionRelationshipRole =
  | 'WEB_ELEMENT'
  | 'VARIABLE_COMMAND'
  | 'STRUCTURAL_BOUNDARY'
  | 'NAVIGATION'
  | 'NEUTRAL_COMMAND';

export type VariableCommandSemantics =
  | 'NONE'
  | 'PRODUCER'
  | 'RUNTIME_CONSUMER'
  | 'LITERAL_ASSIGNMENT'
  | 'OUTPUT_VALIDATION';

export type StructuralBoundarySemantics =
  | 'NONE'
  | 'CONDITIONAL_ROOT'
  | 'CONDITIONAL_BOUNDARY'
  | 'LOOP_BOUNDARY';

export type RelationshipRequirement =
  | 'ELEMENT_TARGET'
  | 'VARIABLE_BINDING'
  | 'LOOP_ANCHOR'
  | 'CONDITIONAL_ROOT'
  | 'BLOCK_TARGET'
  | 'VARIABLE_ORDER';

export interface InstructionActionPolicy {
  canonicalAction: string;
  role: InstructionRelationshipRole;
  variableSemantics: VariableCommandSemantics;
  structuralSemantics: StructuralBoundarySemantics;
  requirements: readonly RelationshipRequirement[];
  allowedVariableTypes: readonly string[];
  allowedElementTags: readonly string[];
  writesRuntimeValue: boolean;
}

const ACTION_ALIASES: Readonly<Record<string, string>> = {
  HOLD: 'H',
  SCREEN: 'P',
  QUIT: 'Q',
};

const VARIABLE_TYPES = ['$String', '#Numeric'] as const;
const WRITABLE_TAGS = ['input', 'select', 'textarea'] as const;
const policy = (
  canonicalAction: string,
  overrides: Partial<Omit<InstructionActionPolicy, 'canonicalAction'>> = {},
): InstructionActionPolicy => ({
  canonicalAction,
  role: 'WEB_ELEMENT',
  variableSemantics: 'NONE',
  structuralSemantics: 'NONE',
  requirements: [],
  allowedVariableTypes: [],
  allowedElementTags: [],
  writesRuntimeValue: false,
  ...overrides,
});

const POLICIES: Record<string, InstructionActionPolicy> = {
  GET: policy('GET', {
    role: 'VARIABLE_COMMAND',
    variableSemantics: 'PRODUCER',
    requirements: ['ELEMENT_TARGET', 'VARIABLE_BINDING'],
    allowedVariableTypes: VARIABLE_TYPES,
    writesRuntimeValue: true,
  }),
  SET: policy('SET', {
    role: 'VARIABLE_COMMAND',
    variableSemantics: 'LITERAL_ASSIGNMENT',
    requirements: ['ELEMENT_TARGET', 'VARIABLE_BINDING'],
    allowedVariableTypes: VARIABLE_TYPES,
    allowedElementTags: WRITABLE_TAGS,
    writesRuntimeValue: true,
  }),
  E: policy('E', {
    role: 'VARIABLE_COMMAND',
    variableSemantics: 'RUNTIME_CONSUMER',
    requirements: ['ELEMENT_TARGET', 'VARIABLE_BINDING', 'VARIABLE_ORDER'],
    allowedVariableTypes: VARIABLE_TYPES,
  }),
  CK: policy('CK', {
    role: 'VARIABLE_COMMAND',
    variableSemantics: 'RUNTIME_CONSUMER',
    requirements: ['VARIABLE_BINDING', 'VARIABLE_ORDER'],
    allowedVariableTypes: VARIABLE_TYPES,
  }),
  'PDF CHECK': policy('PDF CHECK', {
    role: 'VARIABLE_COMMAND',
    variableSemantics: 'OUTPUT_VALIDATION',
    requirements: ['VARIABLE_BINDING'],
    allowedVariableTypes: VARIABLE_TYPES,
  }),
  'CSV CHECK': policy('CSV CHECK', {
    role: 'VARIABLE_COMMAND',
    variableSemantics: 'OUTPUT_VALIDATION',
    requirements: ['VARIABLE_BINDING'],
    allowedVariableTypes: VARIABLE_TYPES,
  }),
  IF: policy('IF', {
    role: 'STRUCTURAL_BOUNDARY',
    structuralSemantics: 'CONDITIONAL_ROOT',
    requirements: ['CONDITIONAL_ROOT'],
  }),
  ELSEIF: policy('ELSEIF', {
    role: 'STRUCTURAL_BOUNDARY',
    structuralSemantics: 'CONDITIONAL_BOUNDARY',
    requirements: ['CONDITIONAL_ROOT'],
  }),
  ELSE: policy('ELSE', {
    role: 'STRUCTURAL_BOUNDARY',
    structuralSemantics: 'CONDITIONAL_BOUNDARY',
    requirements: ['CONDITIONAL_ROOT'],
  }),
  ENDIF: policy('ENDIF', {
    role: 'STRUCTURAL_BOUNDARY',
    structuralSemantics: 'CONDITIONAL_BOUNDARY',
    requirements: ['CONDITIONAL_ROOT'],
  }),
  LOOP: policy('LOOP', {
    role: 'STRUCTURAL_BOUNDARY',
    structuralSemantics: 'LOOP_BOUNDARY',
    requirements: ['LOOP_ANCHOR'],
  }),
  REFRESH_LOOP: policy('REFRESH_LOOP', {
    role: 'STRUCTURAL_BOUNDARY',
    structuralSemantics: 'LOOP_BOUNDARY',
    requirements: ['LOOP_ANCHOR'],
  }),
  GOTO: policy('GOTO', {
    role: 'NAVIGATION',
    requirements: ['BLOCK_TARGET'],
  }),
  'EXCEL GOTO': policy('EXCEL GOTO', {
    role: 'NAVIGATION',
    requirements: ['BLOCK_TARGET'],
  }),
};

[
  'H',
  'P',
  'Q',
  'REFRESH',
  'NEXT_ENTER',
  'NEXT ROW',
  'SWIPE_UP',
  'SWIPE_DOWN',
  'PAUSE',
  'BACK',
].forEach((action) => {
  POLICIES[action] = policy(action, { role: 'NEUTRAL_COMMAND' });
});

/** Match the backend CommandRegistry normalization, including legacy aliases. */
export const canonicalInstructionAction = (
  action: string | null | undefined,
): string => {
  if (action == null) return '';
  const base = action.split(':', 1)[0].trim().toUpperCase();
  return ACTION_ALIASES[base] ?? base;
};

export const instructionRelationshipPolicy = (
  action: string | null | undefined,
): InstructionActionPolicy => {
  const canonicalAction = canonicalInstructionAction(action);
  return POLICIES[canonicalAction] ?? policy(canonicalAction);
};

export const isCompatibleLoopAnchorAction = (
  action: string | null | undefined,
): boolean => {
  const relationshipPolicy = instructionRelationshipPolicy(action);
  return relationshipPolicy.role === 'WEB_ELEMENT'
    || relationshipPolicy.canonicalAction.length > 0;
};

export const isVariableProducerAction = (action: unknown): boolean =>
  instructionRelationshipPolicy(
    typeof action === 'string' ? action : '',
  ).variableSemantics === 'PRODUCER';

export const isVariableConsumerAction = (action: unknown): boolean =>
  instructionRelationshipPolicy(
    typeof action === 'string' ? action : '',
  ).variableSemantics === 'RUNTIME_CONSUMER';

export const writesRuntimeVariableValue = (action: unknown): boolean =>
  instructionRelationshipPolicy(
    typeof action === 'string' ? action : '',
  ).writesRuntimeValue;
