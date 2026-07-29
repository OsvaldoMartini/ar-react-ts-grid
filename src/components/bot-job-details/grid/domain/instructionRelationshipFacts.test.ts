import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type { WorkspaceBlock } from './workspaceBlocks';
import { buildInstructionRelationshipGraph } from './instructionRelationshipGraph';
import {
  buildBotJobRelationshipFacts,
  type BotJobRelationshipVariableLink,
} from './instructionRelationshipFacts';

const row = (
  overrides: Partial<BlockLoopInstructionLoadDTO> = {},
): BlockLoopInstructionLoadDTO => ({
  homeBankingId: 2,
  tagName: 'input',
  botJobId: 5,
  botJobName: 'Saldo Banca Stato',
  id: 101,
  instructionOrderNumber: 1,
  name: 'User number',
  description: '',
  blockId: 7,
  blockOrderNumber: 1,
  blockName: 'Login',
  blockActive: true,
  blockWait: 0,
  actions: 'CLICK',
  instructionActive: true,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  ...overrides,
});

const block = (
  overrides: Partial<WorkspaceBlock> = {},
): WorkspaceBlock => ({
  blockId: 7,
  blockOrderNumber: 1,
  blockName: 'Login',
  blockActive: true,
  blockWait: 0,
  ...overrides,
});

const variable = (
  overrides: Partial<BotJobRelationshipVariableLink> = {},
): BotJobRelationshipVariableLink => ({
  id: 41,
  instructionId: 101,
  type: '$String',
  ...overrides,
});

describe('buildBotJobRelationshipFacts', () => {
  it('normalizes and deterministically sorts exact Bot Job facts', () => {
    const instructions = [
      row({
        id: 103,
        actions: 'E',
        instructionOrderNumber: 3,
        parentId: 101,
        variableId: 41,
        tagName: '  ',
      }),
      row({
        id: 102,
        actions: 'GET',
        instructionOrderNumber: 2,
        parentId: 101,
        variableId: 41,
      }),
      row(),
    ];
    const blocks = [
      block({
        blockId: 8,
        blockOrderNumber: 2,
        blockName: 'Second',
        blockActive: false,
      }),
      block(),
    ];
    const variables = [
      variable({ id: 42, instructionId: null, type: ' #Numeric ' }),
      variable(),
    ];
    const originalInstructionIds = instructions.map(item => item.id);
    const originalBlockIds = blocks.map(item => item.blockId);
    const originalVariableIds = variables.map(item => item.id);

    const facts = buildBotJobRelationshipFacts({
      homeBankingId: 2,
      botJobId: 5,
      instructions,
      blocks,
      variables,
    });

    expect(facts).not.toBeNull();
    expect(facts?.owner).toEqual({
      workspaceKind: 'BOT_JOB',
      homeBankingId: 2,
      botJobId: 5,
    });
    expect(facts?.instructions.map(item => item.id)).toEqual([101, 102, 103]);
    expect(facts?.blocks.map(item => item.id)).toEqual([7, 8]);
    expect(facts?.variables.map(item => item.id)).toEqual([41, 42]);
    expect(facts?.instructions[2]).toMatchObject({
      tagName: null,
      parentId: 101,
      parentBlockId: null,
      variableId: 41,
    });
    expect(facts?.blocks[1]).toMatchObject({
      active: false,
      order: 2,
    });
    expect(facts?.variables[1]).toMatchObject({
      type: '#Numeric',
      ownerInstructionId: null,
    });

    expect(instructions.map(item => item.id)).toEqual(originalInstructionIds);
    expect(blocks.map(item => item.blockId)).toEqual(originalBlockIds);
    expect(variables.map(item => item.id)).toEqual(originalVariableIds);
  });

  it('feeds the canonical graph without changing relationship semantics', () => {
    const facts = buildBotJobRelationshipFacts({
      homeBankingId: 2,
      botJobId: 5,
      instructions: [
        row(),
        row({
          id: 102,
          actions: 'GET',
          instructionOrderNumber: 2,
          parentId: 101,
          variableId: 41,
        }),
        row({
          id: 103,
          actions: 'E',
          instructionOrderNumber: 3,
          parentId: 101,
          variableId: 41,
        }),
      ],
      blocks: [block()],
      variables: [variable()],
    });

    expect(facts).not.toBeNull();
    if (!facts) return;
    const graph = buildInstructionRelationshipGraph(facts);
    const readerIssues = graph.issues.filter(issue => issue.source.id === 103);
    expect(readerIssues).toEqual([]);
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'ELEMENT_TARGET',
        source: expect.objectContaining({ id: 102 }),
        state: 'CONNECTED',
      }),
      expect.objectContaining({
        kind: 'VARIABLE_BINDING',
        source: expect.objectContaining({ id: 102 }),
        state: 'CONNECTED',
      }),
      expect.objectContaining({
        kind: 'VARIABLE_ORDER',
        source: expect.objectContaining({ id: 103 }),
        target: expect.objectContaining({ id: 102 }),
        state: 'CONNECTED',
      }),
    ]));
  });

  it.each([
    {
      label: 'invalid compound owner',
      request: {
        homeBankingId: 0,
        botJobId: 5,
        instructions: [row()],
        blocks: [block()],
        variables: [variable()],
      },
    },
    {
      label: 'cross-owner instruction',
      request: {
        homeBankingId: 2,
        botJobId: 5,
        instructions: [row({ botJobId: 6 })],
        blocks: [block()],
        variables: [variable()],
      },
    },
    {
      label: 'duplicate instruction ID',
      request: {
        homeBankingId: 2,
        botJobId: 5,
        instructions: [row(), row({ instructionOrderNumber: 2 })],
        blocks: [block()],
        variables: [variable()],
      },
    },
    {
      label: 'invalid nullable relationship ID',
      request: {
        homeBankingId: 2,
        botJobId: 5,
        instructions: [row({ parentId: 0 })],
        blocks: [block()],
        variables: [variable()],
      },
    },
    {
      label: 'null row',
      request: {
        homeBankingId: 2,
        botJobId: 5,
        instructions: [null],
        blocks: [block()],
        variables: [variable()],
      },
    },
  ])('fails closed without throwing for $label', ({ request }) => {
    expect(() => buildBotJobRelationshipFacts(request)).not.toThrow();
    expect(buildBotJobRelationshipFacts(request)).toBeNull();
  });

  it('rejects absent collections instead of manufacturing an empty graph', () => {
    expect(buildBotJobRelationshipFacts({
      homeBankingId: 2,
      botJobId: 5,
      instructions: undefined,
      blocks: [],
      variables: [],
    })).toBeNull();
  });
});
