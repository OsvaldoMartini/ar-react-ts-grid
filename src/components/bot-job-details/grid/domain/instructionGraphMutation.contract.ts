export const INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION = 3 as const;

export const BOT_JOB_GRAPH_MUTATION_TYPE = 'BOT_JOB_GRAPH_MUTATION' as const;
export const BOT_JOB_GRAPH_MUTATION_RESPONSE =
  'botJobGraph.mutationResponse' as const;

export type InstructionGraphWorkspaceKind = 'BOT_JOB' | 'COMPONENT';
export type InstructionGraphMutationKind =
  | 'ROW_MOVE'
  | 'RELATIONSHIP_UPDATE';
export type InstructionGraphPatchOperation = 'KEEP' | 'SET' | 'CLEAR';
export type InstructionGraphRelationKind =
  | 'ELEMENT_TARGET'
  | 'LOOP_ANCHOR'
  | 'CONDITIONAL_ROOT'
  | 'BLOCK_TARGET';

export type InstructionGraphOwnerAssertion = {
  workspaceKind: InstructionGraphWorkspaceKind;
  homeBankingId: number;
  botJobId: number | null;
};

export type InstructionGraphLayoutRow = {
  instructionId: number;
  blockId: number;
  blockOrderNumber: number;
  instructionOrderNumber: number;
};

/**
 * The state object itself is mandatory on a patch. Null members are explicit
 * disconnected values; omitting the object is never interpreted as CLEAR.
 */
export type InstructionGraphRelationState = {
  parentId: number | null;
  parentBlockId: number | null;
};

export type InstructionGraphRelationPatch = {
  instructionId: number;
  relationKind: InstructionGraphRelationKind;
  operation: InstructionGraphPatchOperation;
  expected: InstructionGraphRelationState;
  replacement: InstructionGraphRelationState;
};

/**
 * A wrapper makes an explicit null distinguishable from an omitted patch.
 */
export type InstructionGraphNullableId = {
  value: number | null;
};

export type InstructionGraphVariableBindingPatch = {
  instructionId: number;
  operation: InstructionGraphPatchOperation;
  expected: InstructionGraphNullableId;
  replacement: InstructionGraphNullableId;
};

export type InstructionGraphVariableOwnerPatch = {
  variableId: number;
  operation: InstructionGraphPatchOperation;
  expected: InstructionGraphNullableId;
  replacement: InstructionGraphNullableId;
};

export type InstructionGraphMutationV3Request = {
  contractVersion: typeof INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION;
  mutationKind: InstructionGraphMutationKind;
  requestId: string;
  baseGraphVersion: number;
  graphRevision: string;
  workspaceEpoch: number;
  ownerAssertion: InstructionGraphOwnerAssertion;
  draggedInstructionId: number | null;
  layoutRows: readonly InstructionGraphLayoutRow[];
  instructionRelationPatches: readonly InstructionGraphRelationPatch[];
  variableBindingPatches: readonly InstructionGraphVariableBindingPatch[];
  variableOwnerPatches: readonly InstructionGraphVariableOwnerPatch[];
};

export type BotJobGraphMutationDraft = Pick<
  InstructionGraphMutationV3Request,
  | 'mutationKind'
  | 'draggedInstructionId'
  | 'layoutRows'
  | 'instructionRelationPatches'
  | 'variableBindingPatches'
  | 'variableOwnerPatches'
>;

type BotJobGraphMutationResponseBase = {
  contractVersion: typeof INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION;
  requestId: string;
  workspaceEpoch: number;
  ownerAssertion: InstructionGraphOwnerAssertion & {
    workspaceKind: 'BOT_JOB';
    botJobId: number;
  };
};

export type BotJobGraphMutationSuccessResponse =
  BotJobGraphMutationResponseBase & {
  ok: true;
  committedGraphVersion: number;
  graphRevision: string;
  errorCode?: never;
  message?: string;
};

export type BotJobGraphMutationErrorResponse =
  BotJobGraphMutationResponseBase & {
  ok: false;
  committedGraphVersion?: never;
  graphRevision?: never;
  errorCode: string;
  message: string;
};

export type BotJobGraphMutationResponse =
  | BotJobGraphMutationSuccessResponse
  | BotJobGraphMutationErrorResponse;

export const disconnectedInstructionRelation =
  (): InstructionGraphRelationState => ({
    parentId: null,
    parentBlockId: null,
  });

export const instructionGraphNullableId = (
  value: number | null,
): InstructionGraphNullableId => ({ value });

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const nonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const sameInstructionGraphOwner = (
  left: InstructionGraphOwnerAssertion,
  right: InstructionGraphOwnerAssertion,
): boolean =>
  left.workspaceKind === right.workspaceKind
  && left.homeBankingId === right.homeBankingId
  && left.botJobId === right.botJobId;

export const isBotJobGraphMutationResponse = (
  value: unknown,
): value is BotJobGraphMutationResponse => {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  const ownerValue = response.ownerAssertion;
  if (!ownerValue || typeof ownerValue !== 'object') return false;
  const owner = ownerValue as Record<string, unknown>;
  const validBase = response.contractVersion
      === INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION
    && nonBlankString(response.requestId)
    && positiveInteger(response.workspaceEpoch)
    && owner.workspaceKind === 'BOT_JOB'
    && positiveInteger(owner.homeBankingId)
    && positiveInteger(owner.botJobId);
  if (!validBase) return false;

  if (response.ok === true) {
    return positiveInteger(response.committedGraphVersion)
      && nonBlankString(response.graphRevision)
      && response.errorCode === undefined
      && (
        response.message === undefined
        || nonBlankString(response.message)
      );
  }

  if (response.ok === false) {
    return response.committedGraphVersion === undefined
      && response.graphRevision === undefined
      && nonBlankString(response.errorCode)
      && nonBlankString(response.message);
  }

  return false;
};
