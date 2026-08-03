import type {
  VariablesInstructionFact,
  VariableWorkspaceSnapshot,
} from '../../variablesWorkspace.contract';
import { validateIfFamilyCreate } from './ifFamilyRules';

const REVISION = 'f'.repeat(64);

const fact = (
  instructionId: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  action: string,
  overrides: Partial<VariablesInstructionFact> = {},
): VariablesInstructionFact => ({
  instructionId,
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  action,
  relationKind: 'ELEMENT_TARGET',
  parentId: null,
  parentBlockId: null,
  variableId: null,
  ...overrides,
});

// Block 10 has the complete family: CLICK, IF, CK, ELSEIF, ELSE, ENDIF.
// Block 20 has only a CLICK.
const facts = (): VariablesInstructionFact[] => [
  fact(500, 10, 1, 1, 'CLICK'),
  fact(501, 10, 1, 2, 'IF', { parentId: 501, parentBlockId: 10 }),
  fact(502, 10, 1, 3, 'CK', { parentId: 501, parentBlockId: 10 }),
  fact(503, 10, 1, 4, 'ELSEIF', { parentId: 501, parentBlockId: 10 }),
  fact(504, 10, 1, 5, 'ELSE', { parentId: 501, parentBlockId: 10 }),
  fact(505, 10, 1, 6, 'ENDIF', { parentId: 501, parentBlockId: 10 }),
  fact(601, 20, 2, 1, 'CLICK'),
];

const snapshot = (): VariableWorkspaceSnapshot => {
  const instructionFacts = facts();
  return {
    ok: true,
    message: 'Loaded',
    requestId: 'if-family-rules-test',
    bindingEpoch: 'binding-rules',
    workspaceEpoch: 7,
    graphRevision: REVISION,
    botJob: { id: 32, name: 'Bot Job 32', homeBankingId: 2, organizationName: 'Bank' },
    summary: {
      variableCount: 0,
      producerCount: 0,
      consumerCount: 0,
      literalAssignmentCount: 0,
      warningCount: 0,
      unusedCount: 0,
    },
    blocks: [
      { id: 10, name: 'Conditional', order: 1, active: true },
      { id: 20, name: 'Other', order: 2, active: true },
    ],
    commands: [],
    variables: [],
    edges: [],
    diagnostics: [],
    runtimeMemory: { revision: 0, variables: [] },
    mutationCapability: {
      enabled: true,
      contractVersion: 3,
      profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
      crossBlockProfile: null,
      reactAuthoredProfile: 'VARIABLES_REACT_AUTHORED_V1',
      graphVersion: 12,
      graphRevision: REVISION,
      ownerAssertion: { workspaceKind: 'BOT_JOB', homeBankingId: 2, botJobId: 32 },
      layoutRows: instructionFacts.map(({
        instructionId,
        blockId,
        blockOrderNumber,
        instructionOrderNumber,
      }) => ({
        instructionId, blockId, blockOrderNumber, instructionOrderNumber,
      })),
      instructionFacts,
    },
  };
};

test('a second IF in a Block that already has a family is refused', () => {
  const refusal = validateIfFamilyCreate(snapshot(), 10, 'IF', { kind: 'END' });
  expect(refusal?.code).toBe('COMMAND_CREATE_CONDITIONAL_ROOT_EXISTS');
});

test('an IF into a Block without a family is allowed', () => {
  expect(validateIfFamilyCreate(snapshot(), 20, 'IF', { kind: 'END' })).toBeNull();
});

test('ELSEIF into a Block without a complete family is refused', () => {
  const refusal = validateIfFamilyCreate(snapshot(), 20, 'ELSEIF', { kind: 'END' });
  expect(refusal?.code).toBe('COMMAND_CREATE_CONDITIONAL_FAMILY_MISSING');
});

test('ELSEIF placed after the IF root is allowed', () => {
  expect(validateIfFamilyCreate(snapshot(), 10, 'ELSEIF', {
    kind: 'AFTER_INSTRUCTION', instructionId: 501,
  })).toBeNull();
});

test('ELSEIF placed after an existing ELSEIF is allowed', () => {
  expect(validateIfFamilyCreate(snapshot(), 10, 'ELSEIF', {
    kind: 'AFTER_INSTRUCTION', instructionId: 503,
  })).toBeNull();
});

test('ELSEIF placed after the ELSE is refused', () => {
  const refusal = validateIfFamilyCreate(snapshot(), 10, 'ELSEIF', {
    kind: 'AFTER_INSTRUCTION', instructionId: 504,
  });
  expect(refusal?.code).toBe('COMMAND_CREATE_ELSEIF_PLACEMENT_INVALID');
});

test('ELSEIF at TOP (before the IF) is refused', () => {
  const refusal = validateIfFamilyCreate(snapshot(), 10, 'ELSEIF', { kind: 'TOP' });
  expect(refusal?.code).toBe('COMMAND_CREATE_ELSEIF_PLACEMENT_INVALID');
});

test('ELSEIF at END (after the ENDIF) is refused', () => {
  const refusal = validateIfFamilyCreate(snapshot(), 10, 'ELSEIF', { kind: 'END' });
  expect(refusal?.code).toBe('COMMAND_CREATE_ELSEIF_PLACEMENT_INVALID');
});

test('non-conditional commands are never gated by the IF-family rules', () => {
  expect(validateIfFamilyCreate(snapshot(), 10, 'GET', { kind: 'END' })).toBeNull();
});
