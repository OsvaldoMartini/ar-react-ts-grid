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
  blockFilter: number | null,
  createdAt = new Date(),
): VariablesSmokeTestPlan => {
  const selectedBlocks = blockFilter === null
    ? review.blocks
    : review.blocks.filter(block => block.blockId === blockFilter);
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
  const selectedBlock = blockFilter === null
    ? null
    : blocks.find(block => block.blockId === blockFilter) ?? null;
  const scopeLabel = selectedBlock === null
    ? `All Blocks · ${steps.length} command${steps.length === 1 ? '' : 's'}`
    : `Block #${selectedBlock.blockOrder ?? selectedBlock.blockId} ${selectedBlock.blockName} · ${steps.length} command${steps.length === 1 ? '' : 's'}`;
  const timestamp = createdAt.toISOString();

  return Object.freeze({
    runId: `${review.botJobId}:${createdAt.getTime()}`,
    createdAt: timestamp,
    homeBankingId: review.homeBankingId,
    botJobId: review.botJobId,
    botJobName: review.botJobName,
    graphRevision: review.graphRevision,
    runtimeMemoryRevision: review.runtimeMemoryRevision,
    blockFilter,
    scopeLabel,
    blocks,
    steps,
    variableFlows: Object.freeze(review.variableFlows.map(frozenVariableFlow)),
  });
};

