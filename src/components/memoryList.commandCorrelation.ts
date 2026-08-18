export type MemoryListCommandGeneration = Readonly<{
  homeBankingId: number;
  botJobId: number;
  workspaceEpoch: number;
  ownerEpoch: string;
}>;

export type PendingMemoryListCommand<TAction extends string = string> =
  MemoryListCommandGeneration & Readonly<{
    requestId: string;
    action: TAction;
  }>;

export type MemoryListCommandResponseDisposition =
  | 'IGNORE'
  | 'FAILURE'
  | 'SUCCESS'
  | 'INVALID_SUCCESS';

const objectValue = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === 'object' ? value as Record<string, unknown> : null
);

const positiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const nonBlankText = (value: unknown): string | null => (
  typeof value === 'string' && value.trim() ? value.trim() : null
);

export const memoryListCommandGeneration = (
  value: unknown,
): MemoryListCommandGeneration | null => {
  const source = objectValue(value);
  if (!source) return null;
  const homeBankingId = positiveInteger(source.homeBankingId);
  const botJobId = positiveInteger(source.botJobId);
  const workspaceEpoch = positiveInteger(source.workspaceEpoch);
  const ownerEpoch = nonBlankText(source.ownerEpoch);
  if (
    homeBankingId === null
    || botJobId === null
    || workspaceEpoch === null
    || ownerEpoch === null
  ) {
    return null;
  }
  return { homeBankingId, botJobId, workspaceEpoch, ownerEpoch };
};

export const sameMemoryListCommandGeneration = (
  left: MemoryListCommandGeneration | null,
  right: MemoryListCommandGeneration | null,
): boolean => Boolean(left && right
  && left.homeBankingId === right.homeBankingId
  && left.botJobId === right.botJobId
  && left.workspaceEpoch === right.workspaceEpoch
  && left.ownerEpoch === right.ownerEpoch);

export const createPendingMemoryListCommand = <TAction extends string>(
  requestId: string,
  action: TAction,
  generation: MemoryListCommandGeneration,
): PendingMemoryListCommand<TAction> => ({ requestId, action, ...generation });

const optionalFieldMatches = (
  response: Record<string, unknown>,
  field: keyof MemoryListCommandGeneration,
  expected: string | number,
): boolean => {
  if (!(field in response)) return true;
  if (field === 'ownerEpoch') return nonBlankText(response[field]) === expected;
  return positiveInteger(response[field]) === expected;
};

const completeResponseGenerationMatches = (
  response: Record<string, unknown>,
  expected: MemoryListCommandGeneration,
): boolean => nonBlankText(response.ownerEpoch) === expected.ownerEpoch
  && positiveInteger(response.workspaceEpoch) === expected.workspaceEpoch
  && positiveInteger(response.homeBankingId) === expected.homeBankingId
  && positiveInteger(response.botJobId) === expected.botJobId;

/**
 * Correlates one detached Memory List command response to the exact owner generation that sent it.
 * Exact failures can omit authority fields, but any supplied field must match. Successful responses
 * must prove the complete server-owned tuple before the page applies owner-specific UI effects.
 */
export const classifyMemoryListCommandResponse = <TAction extends string>(
  bodyValue: unknown,
  pending: PendingMemoryListCommand<TAction> | null,
  currentGeneration: MemoryListCommandGeneration | null,
): MemoryListCommandResponseDisposition => {
  const body = objectValue(bodyValue);
  if (
    !body
    || !pending
    || !sameMemoryListCommandGeneration(pending, currentGeneration)
    || nonBlankText(body.requestId) !== pending.requestId
  ) {
    return 'IGNORE';
  }

  const suppliedGenerationMatches = optionalFieldMatches(body, 'ownerEpoch', pending.ownerEpoch)
    && optionalFieldMatches(body, 'workspaceEpoch', pending.workspaceEpoch)
    && optionalFieldMatches(body, 'homeBankingId', pending.homeBankingId)
    && optionalFieldMatches(body, 'botJobId', pending.botJobId);

  if (body.ok === false) return suppliedGenerationMatches ? 'FAILURE' : 'IGNORE';
  if (body.ok !== true) return 'INVALID_SUCCESS';
  return completeResponseGenerationMatches(body, pending) ? 'SUCCESS' : 'INVALID_SUCCESS';
};
