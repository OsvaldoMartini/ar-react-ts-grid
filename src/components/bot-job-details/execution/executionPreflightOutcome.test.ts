import type { ExecutionPreflightReport } from '../BotJobDetails.types';
import { executionPreflightOutcome } from './executionPreflightOutcome';

const report = (
  overrides: Partial<ExecutionPreflightReport> = {},
): ExecutionPreflightReport => ({
  enforcement: 'WARN',
  status: 'WOULD_BLOCK',
  stage: 'BOT_JOB_TEST_RUN',
  owner: { homeBankingId: 2, botJobId: 5 },
  runScope: { kind: 'ONE', selectedBlockId: 10 },
  graphVersion: 12,
  contentRevision: 'revision-a',
  reachableBlockIds: [10],
  reachableInstructionIds: [101],
  totalIssues: 1,
  issues: [{
    code: 'MISSING_VARIABLE_BINDING',
    kind: 'VARIABLE_BINDING',
    blockId: 10,
    instructionId: 101,
    message: 'GET has no variable binding.',
  }],
  unavailableReason: null,
  ...overrides,
});

test('presents an unclassified legacy WOULD_BLOCK observation as WARN', () => {
  expect(executionPreflightOutcome(report())).toBe('WARN');
});

test('keeps a fully classified variable-only report warning-only', () => {
  expect(executionPreflightOutcome(report({
    outcome: 'BLOCKED',
    variableDiagnosticCount: 1,
    structuralStartFailureCount: 0,
    issues: [{
      ...report().issues[0],
      disposition: 'VARIABLE_DIAGNOSTIC',
    }],
  }))).toBe('WARN');
});

test('keeps a complete variable-only issue sample warning-only when counts are omitted', () => {
  expect(executionPreflightOutcome(report({
    outcome: 'BLOCKED',
    variableDiagnosticCount: undefined,
    structuralStartFailureCount: undefined,
    issues: [{
      ...report().issues[0],
      disposition: 'VARIABLE_DIAGNOSTIC',
    }],
  }))).toBe('WARN');
});

test('returns BLOCKED only when additive facts prove a structural failure', () => {
  expect(executionPreflightOutcome(report({
    outcome: 'BLOCKED',
    variableDiagnosticCount: 0,
    structuralStartFailureCount: 1,
    issues: [{
      code: 'MISSING_LOOP_ANCHOR',
      kind: 'LOOP_ANCHOR',
      blockId: 10,
      instructionId: 101,
      message: 'LOOP has no anchor.',
      disposition: 'STRUCTURAL_START_FAILURE',
    }],
  }))).toBe('BLOCKED');
});

test('preserves READY and UNAVAILABLE independently from issue wording', () => {
  expect(executionPreflightOutcome(report({
    status: 'READY',
    outcome: 'READY',
    totalIssues: 0,
    issues: [],
  }))).toBe('READY');
  expect(executionPreflightOutcome(report({
    status: 'UNAVAILABLE',
    outcome: 'UNAVAILABLE',
    owner: null,
    runScope: null,
    graphVersion: null,
    contentRevision: null,
    reachableBlockIds: [],
    reachableInstructionIds: [],
    totalIssues: 0,
    issues: [],
    unavailableReason: 'Snapshot unavailable.',
  }))).toBe('UNAVAILABLE');
});
