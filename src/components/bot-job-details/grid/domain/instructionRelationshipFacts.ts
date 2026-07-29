import type { BlockLoopInstructionLoadDTO } from '../../../instructionsMockData';
import type { WorkspaceBlock } from './workspaceBlocks';
import type {
  BuildInstructionRelationshipGraphRequest,
  RelationshipBlockFact,
  RelationshipInstructionFact,
  RelationshipOwner,
  RelationshipVariableFact,
} from './instructionRelationshipGraph';

export interface BotJobRelationshipVariableLink {
  id: number | null;
  instructionId: number | null;
  type?: string | null;
}

export interface BuildBotJobRelationshipFactsRequest {
  homeBankingId: number;
  botJobId: number;
  instructions:
    | readonly (BlockLoopInstructionLoadDTO | null | undefined)[]
    | null
    | undefined;
  blocks:
    | readonly (WorkspaceBlock | null | undefined)[]
    | null
    | undefined;
  variables:
    | readonly (BotJobRelationshipVariableLink | null | undefined)[]
    | null
    | undefined;
}

export type BotJobRelationshipFacts =
  BuildInstructionRelationshipGraphRequest & {
    owner: Extract<RelationshipOwner, { workspaceKind: 'BOT_JOB' }>;
  };

const positiveInteger = (value: unknown): number | null => {
  const number = typeof value === 'number' ? value : Number.NaN;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const nullablePositiveInteger = (
  value: unknown,
): { valid: boolean; value: number | null } => {
  if (value == null) return { valid: true, value: null };
  const normalized = positiveInteger(value);
  return normalized === null
    ? { valid: false, value: null }
    : { valid: true, value: normalized };
};

const nullableBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const nullableText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const uniquePositiveIds = (
  values: readonly { id: number }[],
): boolean => {
  const ids = new Set<number>();
  for (const value of values) {
    if (ids.has(value.id)) return false;
    ids.add(value.id);
  }
  return true;
};

const compareInstructions = (
  left: RelationshipInstructionFact,
  right: RelationshipInstructionFact,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.id - right.id;

const compareBlocks = (
  left: RelationshipBlockFact,
  right: RelationshipBlockFact,
): number =>
  (left.order ?? Number.MAX_SAFE_INTEGER)
  - (right.order ?? Number.MAX_SAFE_INTEGER)
  || left.id - right.id;

/**
 * Convert one rendered Bot Job grid into the persistence-free facts consumed by
 * {@link buildInstructionRelationshipGraph}.
 *
 * This boundary is deliberately strict. It returns `null` instead of inventing
 * an owner, dropping a malformed row, or assigning a stale row to the requested
 * Bot Job. Callers can therefore retain their last valid relationship graph
 * while the rendered instruction grid remains visible.
 */
export const buildBotJobRelationshipFacts = ({
  homeBankingId: homeBankingIdValue,
  botJobId: botJobIdValue,
  instructions: sourceInstructions,
  blocks: sourceBlocks,
  variables: sourceVariables,
}: BuildBotJobRelationshipFactsRequest): BotJobRelationshipFacts | null => {
  const homeBankingId = positiveInteger(homeBankingIdValue);
  const botJobId = positiveInteger(botJobIdValue);
  if (
    homeBankingId === null
    || botJobId === null
    || !Array.isArray(sourceInstructions)
    || !Array.isArray(sourceBlocks)
    || !Array.isArray(sourceVariables)
  ) {
    return null;
  }

  const owner: BotJobRelationshipFacts['owner'] = {
    workspaceKind: 'BOT_JOB',
    homeBankingId,
    botJobId,
  };

  const instructions: RelationshipInstructionFact[] = [];
  for (const candidate of sourceInstructions) {
    if (candidate == null) return null;
    const id = positiveInteger(candidate.id);
    const rowHomeBankingId = positiveInteger(candidate.homeBankingId);
    const rowBotJobId = positiveInteger(candidate.botJobId);
    const blockId = positiveInteger(candidate.blockId);
    const blockOrderNumber = positiveInteger(candidate.blockOrderNumber);
    const instructionOrderNumber = positiveInteger(
      candidate.instructionOrderNumber,
    );
    const parent = nullablePositiveInteger(candidate.parentId);
    const parentBlock = nullablePositiveInteger(candidate.parentBlockId);
    const variable = nullablePositiveInteger(candidate.variableId);
    if (
      id === null
      || rowHomeBankingId !== homeBankingId
      || rowBotJobId !== botJobId
      || blockId === null
      || blockOrderNumber === null
      || instructionOrderNumber === null
      || !parent.valid
      || !parentBlock.valid
      || !variable.valid
      || typeof candidate.actions !== 'string'
    ) {
      return null;
    }
    instructions.push({
      owner,
      id,
      blockId,
      blockOrderNumber,
      instructionOrderNumber,
      actions: candidate.actions,
      tagName: nullableText(candidate.tagName),
      parentId: parent.value,
      parentBlockId: parentBlock.value,
      variableId: variable.value,
      instructionActive: nullableBoolean(candidate.instructionActive),
      blockActive: nullableBoolean(candidate.blockActive),
    });
  }

  const blocks: RelationshipBlockFact[] = [];
  for (const candidate of sourceBlocks) {
    if (candidate == null) return null;
    const id = positiveInteger(candidate.blockId);
    const order = nullablePositiveInteger(candidate.blockOrderNumber);
    if (id === null || !order.valid) return null;
    blocks.push({
      owner,
      id,
      order: order.value,
      active: nullableBoolean(candidate.blockActive),
    });
  }

  const variables: RelationshipVariableFact[] = [];
  for (const candidate of sourceVariables) {
    if (candidate == null) return null;
    const id = positiveInteger(candidate.id);
    const ownerInstruction = nullablePositiveInteger(candidate.instructionId);
    if (id === null || !ownerInstruction.valid) return null;
    variables.push({
      owner,
      id,
      type: nullableText(candidate.type),
      ownerInstructionId: ownerInstruction.value,
    });
  }

  if (
    !uniquePositiveIds(instructions)
    || !uniquePositiveIds(blocks)
    || !uniquePositiveIds(variables)
  ) {
    return null;
  }

  instructions.sort(compareInstructions);
  blocks.sort(compareBlocks);
  variables.sort((left, right) => left.id - right.id);

  return {
    owner,
    instructions,
    blocks,
    variables,
  };
};
