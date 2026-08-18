export type CommandApplyResponseBody = {
  requestId?: string;
  ok?: boolean;
  error?: string;
  instructions?: unknown[];
};

export type CommandApplyResolution =
  | { kind: 'ignore' }
  | { kind: 'failure'; error: string }
  | { kind: 'success'; instructions: unknown[] };

export const canStartCommandApply = (pendingRequestId: string | null) => pendingRequestId === null;

export const resolveCommandApplyResponse = (
  pendingRequestId: string | null,
  body: CommandApplyResponseBody | null | undefined,
): CommandApplyResolution => {
  if (!pendingRequestId || body?.requestId !== pendingRequestId) return { kind: 'ignore' };
  if (body.ok !== true) {
    return { kind: 'failure', error: body.error || 'The command could not be saved.' };
  }
  return {
    kind: 'success',
    instructions: Array.isArray(body.instructions) ? body.instructions : [],
  };
};
