import type {
  VariableWorkspaceSnapshot,
  VariablesInstructionFact,
} from '../../variablesWorkspace.contract';
import { variablesCrossBlockDropZones } from './variablesCrossBlockTargets';

const REVISION = 'd'.repeat(64);

const fact = (
  instructionId: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  action = 'CLICK',
  relationKind: VariablesInstructionFact['relationKind'] = 'ELEMENT_TARGET',
): VariablesInstructionFact => ({
  instructionId,
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  action,
  relationKind,
  parentId: null,
  parentBlockId: null,
  variableId: null,
});

const snapshot = (
  facts: VariablesInstructionFact[],
): VariableWorkspaceSnapshot => ({
  ok: true,
  message: 'Loaded',
  requestId: 'zones',
  bindingEpoch: 'zones-binding',
  workspaceEpoch: 3,
  graphRevision: REVISION,
  botJob: {
    id: 5,
    name: 'Zones',
    homeBankingId: 2,
    organizationName: 'Bank',
  },
  summary: {
    variableCount: 0,
    producerCount: 0,
    consumerCount: 0,
    literalAssignmentCount: 0,
    warningCount: 0,
    unusedCount: 0,
  },
  blocks: [
    { id: 10, name: 'Login', order: 1, active: true },
    { id: 20, name: 'Payment', order: 2, active: true },
    { id: 30, name: 'Structural', order: 3, active: true },
    { id: 40, name: 'Empty', order: 4, active: true },
  ],
  variables: [],
  edges: [],
  diagnostics: [],
  mutationCapability: {
    enabled: true,
    contractVersion: 3,
    profile: 'VARIABLES_INDIVIDUAL_ROW_V1',
    crossBlockProfile: 'VARIABLES_INDIVIDUAL_CROSS_BLOCK_V1',
    graphVersion: 2,
    graphRevision: REVISION,
    ownerAssertion: {
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 5,
    },
    layoutRows: facts.map(({
      instructionId,
      blockId,
      blockOrderNumber,
      instructionOrderNumber,
    }) => ({
      instructionId,
      blockId,
      blockOrderNumber,
      instructionOrderNumber,
    })),
    instructionFacts: facts,
  },
});

test('creates one stable end-of-block zone only for each non-empty flat block', () => {
  const zones = variablesCrossBlockDropZones(snapshot([
    fact(101, 10, 1, 1),
    fact(102, 10, 1, 2, 'PAUSE'),
    fact(201, 20, 2, 1),
    fact(301, 30, 3, 1, 'IF', 'CONDITIONAL_ROOT'),
  ]));

  expect(zones).toEqual([
    {
      blockId: 10,
      blockOrderNumber: 1,
      label: '#1 Login',
      anchorInstructionId: 102,
      placement: 'AFTER',
    },
    {
      blockId: 20,
      blockOrderNumber: 2,
      label: '#2 Payment',
      anchorInstructionId: 201,
      placement: 'AFTER',
    },
  ]);
});

test('does not advertise cross-block zones without the exact capability', () => {
  const current = snapshot([fact(101, 10, 1, 1)]);
  if (!current.mutationCapability) throw new Error('Missing capability');
  current.mutationCapability = {
    ...current.mutationCapability,
    crossBlockProfile: null,
  };

  expect(variablesCrossBlockDropZones(current)).toEqual([]);
});
