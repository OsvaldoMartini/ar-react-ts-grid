import type {
  VariablesExecutionFlowConnection,
  VariablesExecutionFlowReview,
  VariablesExecutionVariableFlow,
} from './variablesExecutionFlowReview';
import type {
  VariablesSmokeTestBlock,
  VariablesSmokeTestPlan,
  VariablesSmokeTestStep,
} from './variablesSmokeTestTypes';

const frozenConnection = (
  connection: VariablesExecutionFlowConnection,
): VariablesExecutionFlowConnection => Object.freeze({
  ...connection,
  source: Object.freeze({ ...connection.source }),
  target: connection.target === null
    ? null
    : Object.freeze({ ...connection.target }),
});

const frozenStep = (
  step: VariablesSmokeTestStep,
): VariablesSmokeTestStep => Object.freeze({
  ...step,
  excelWrite: step.excelWrite ? Object.freeze({ ...step.excelWrite }) : null,
  variables: Object.freeze(step.variables.map(variable => Object.freeze({ ...variable }))),
  connections: Object.freeze(step.connections.map(frozenConnection)),
});

const frozenVariableFlow = (
  flow: VariablesExecutionVariableFlow,
): VariablesExecutionVariableFlow => Object.freeze({
  ...flow,
  producerInstructionIds: Object.freeze([...flow.producerInstructionIds]),
  readerInstructionIds: Object.freeze([...flow.readerInstructionIds]),
  connectionIds: Object.freeze([...flow.connectionIds]),
});

export const buildVariablesSmokeTestPlan = (
  review: VariablesExecutionFlowReview,
  selectedBlockIds: readonly number[],
  createdAt = new Date(),
): VariablesSmokeTestPlan => {
  const selectedBlockIdSet = new Set(selectedBlockIds);
  const selectedBlocks = review.blocks.filter(block =>
    block.blockId !== null && selectedBlockIdSet.has(block.blockId));
  const blocks: readonly VariablesSmokeTestBlock[] = Object.freeze(
    selectedBlocks.map(block => {
      const steps = Object.freeze(block.steps.map(step => frozenStep({ ...step })));
      return Object.freeze({
        blockId: block.blockId,
        blockName: block.blockName,
        blockOrder: block.blockOrder,
        active: block.active,
        steps,
      });
    }),
  );
  const steps = Object.freeze(blocks.flatMap(block => block.steps));
  const allSelectableBlockCount = review.blocks.filter(block => block.blockId !== null).length;
  const selectedBlock = blocks.length === 1 ? blocks[0] : null;
  const scopeLabel = blocks.length === allSelectableBlockCount && allSelectableBlockCount > 0
    ? `All Blocks - ${steps.length} command${steps.length === 1 ? '' : 's'}`
    : selectedBlock !== null
      ? `Block #${selectedBlock.blockOrder ?? selectedBlock.blockId} ${selectedBlock.blockName} - ${steps.length} command${steps.length === 1 ? '' : 's'}`
      : `${blocks.length} selected Blocks - ${steps.length} command${steps.length === 1 ? '' : 's'}`;
  const timestamp = createdAt.toISOString();

  return Object.freeze({
    runId: `${review.botJobId}:${createdAt.getTime()}`,
    createdAt: timestamp,
    homeBankingId: review.homeBankingId,
    botJobId: review.botJobId,
    botJobName: review.botJobName,
    graphRevision: review.graphRevision,
    runtimeMemoryRevision: review.runtimeMemoryRevision,
    selectedBlockIds: Object.freeze([...selectedBlockIds]),
    scopeLabel,
    blocks,
    steps,
    variableFlows: Object.freeze(review.variableFlows.map(frozenVariableFlow)),
  });
};
