import { resolveExcelGotoTransition } from './excelGotoCommandEngine';
import type { VariablesSmokeTestStep } from '../domain/variablesSmokeTestTypes';
import { buildSmokeExecutionProgram } from './smokeExecutionProgram';

const step = (
  instructionId: number,
  blockId: number,
  action: string,
  targetBlockId?: number,
): VariablesSmokeTestStep => ({
  key: String(instructionId),
  instructionId,
  instructionName: action,
  action,
  operation: '',
  onHoldSeconds: null,
  blockId,
  blockName: `Block ${blockId}`,
  blockOrder: blockId,
  instructionOrder: instructionId,
  active: true,
  comparisonOperator: null,
  comparisonFormatPolicy: 'STRICT',
  variables: [],
  connections: targetBlockId === undefined ? [] : [{
    id: `block-target-${instructionId}`,
    kind: 'BLOCK_TARGET',
    required: true,
    state: 'CONNECTED',
    code: null,
    source: {
      entity: 'INSTRUCTION',
      owner: { workspaceKind: 'BOT_JOB', homeBankingId: 1, botJobId: 29 },
      id: instructionId,
    },
    target: {
      entity: 'BLOCK',
      owner: { workspaceKind: 'BOT_JOB', homeBankingId: 1, botJobId: 29 },
      id: targetBlockId,
    },
    sourceLabel: action,
    targetLabel: `Block ${targetBlockId}`,
  }],
});

const program = buildSmokeExecutionProgram({
  runId: 'run',
  createdAt: '2026-08-12T00:00:00Z',
  homeBankingId: 1,
  botJobId: 29,
  botJobName: 'Lloyds',
  graphRevision: 'a'.repeat(64),
  runtimeMemoryRevision: 1,
  selectedBlockIds: [1, 2],
  scopeLabel: 'All Blocks',
  blocks: [
    { blockId: 1, blockName: 'Block 1', blockOrder: 1, active: true, steps: [step(1, 1, 'C')] },
    { blockId: 2, blockName: 'Block 2', blockOrder: 2, active: true, steps: [step(2, 2, 'EXCEL GOTO', 1)] },
  ],
  steps: [step(1, 1, 'C'), step(2, 2, 'EXCEL GOTO', 1)],
  variableFlows: [],
});

test('EXCEL GOTO advances the frozen row and returns to its target Block', () => {
  expect(resolveExcelGotoTransition(program, 1, 0, 3)).toMatchObject({
    nextCursor: 0,
    nextRowIndex: 1,
    warning: null,
  });
});

test('EXCEL GOTO leaves the loop after the final frozen row', () => {
  expect(resolveExcelGotoTransition(program, 1, 2, 3)).toMatchObject({
    nextCursor: 2,
    nextRowIndex: 2,
    warning: null,
  });
});
