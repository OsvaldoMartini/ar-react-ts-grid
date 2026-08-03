import type { VariablesExecutionFlowBlock } from './domain/variablesExecutionFlowReview';
import { buildVariablesSmokeTestBlockFlow } from './VariablesSmokeTestFlowModal';

const block: VariablesExecutionFlowBlock = {
  blockId: 10,
  blockName: 'Login',
  blockOrder: 1,
  active: true,
  steps: [
    {
      key: 'INSTRUCTION:101',
      instructionId: 101,
      instructionName: 'Open login',
      action: 'CLICK',
      operation: '',
      onHoldSeconds: null,
      blockId: 10,
      blockName: 'Login',
      blockOrder: 1,
      instructionOrder: 1,
      active: true,
      comparisonOperator: null,
      comparisonFormatPolicy: 'EXACT_TEXT',
      variables: [],
      connections: [],
    },
    {
      key: 'INSTRUCTION:102',
      instructionId: 102,
      instructionName: 'Read account',
      action: 'GET',
      operation: '',
      onHoldSeconds: null,
      blockId: 10,
      blockName: 'Login',
      blockOrder: 1,
      instructionOrder: 2,
      active: true,
      comparisonOperator: null,
      comparisonFormatPolicy: 'EXACT_TEXT',
      variables: [],
      connections: [],
    },
  ],
};

test('builds one ordered graph with start and complete nodes for a selected Block', () => {
  const graph = buildVariablesSmokeTestBlockFlow(block);

  expect(graph.nodes.map(node => node.id)).toEqual([
    'block:10:start',
    'block:10:INSTRUCTION:101',
    'block:10:INSTRUCTION:102',
    'block:10:complete',
  ]);
  expect(graph.edges.map(edge => [edge.source, edge.target])).toEqual([
    ['block:10:start', 'block:10:INSTRUCTION:101'],
    ['block:10:INSTRUCTION:101', 'block:10:INSTRUCTION:102'],
    ['block:10:INSTRUCTION:102', 'block:10:complete'],
  ]);
  expect(graph.nodes[2].data.tone).toBe('data');
});
