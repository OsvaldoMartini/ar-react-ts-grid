import {
  BOT_JOB_GRAPH_MUTATION_RESPONSE,
  INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
  disconnectedInstructionRelation,
  instructionGraphNullableId,
  isBotJobGraphMutationResponse,
  sameInstructionGraphOwner,
} from './instructionGraphMutation.contract';

describe('instruction graph mutation v3 contract', () => {
  it('represents explicit disconnects without omitted nullable fields', () => {
    expect(disconnectedInstructionRelation()).toEqual({
      parentId: null,
      parentBlockId: null,
    });
    expect(instructionGraphNullableId(null)).toEqual({ value: null });
  });

  it('accepts discriminated success and error Bot Job v3 responses', () => {
    expect(isBotJobGraphMutationResponse({
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      requestId: 'request-1',
      workspaceEpoch: 8,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
      ok: true,
      committedGraphVersion: 12,
      graphRevision: 'revision-12',
    })).toBe(true);
    expect(isBotJobGraphMutationResponse({
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      requestId: 'request-2',
      workspaceEpoch: 8,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
      ok: false,
      errorCode: 'STALE_VERSION',
      message: 'The graph changed before this mutation committed.',
    })).toBe(true);
  });

  it.each([
    {
      label: 'success without a committed version',
      response: {
        ok: true,
        graphRevision: 'revision-12',
      },
    },
    {
      label: 'success without an authoritative revision',
      response: {
        ok: true,
        committedGraphVersion: 12,
      },
    },
    {
      label: 'success with a blank authoritative revision',
      response: {
        ok: true,
        committedGraphVersion: 12,
        graphRevision: '   ',
      },
    },
    {
      label: 'success carrying error fields',
      response: {
        ok: true,
        committedGraphVersion: 12,
        graphRevision: 'revision-12',
        errorCode: 'UNEXPECTED',
      },
    },
    {
      label: 'error without an error code',
      response: {
        ok: false,
        message: 'Refused.',
      },
    },
    {
      label: 'error with a blank message',
      response: {
        ok: false,
        errorCode: 'REFUSED',
        message: ' ',
      },
    },
    {
      label: 'error carrying success authority',
      response: {
        ok: false,
        errorCode: 'REFUSED',
        message: 'Refused.',
        committedGraphVersion: 12,
        graphRevision: 'revision-12',
      },
    },
  ])('rejects $label', ({ response }) => {
    expect(isBotJobGraphMutationResponse({
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      requestId: 'request-invalid',
      workspaceEpoch: 8,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
      ...response,
    })).toBe(false);
  });

  it('rejects legacy, malformed, and uncorrelated response authority', () => {
    expect(isBotJobGraphMutationResponse({
      operationId: BOT_JOB_GRAPH_MUTATION_RESPONSE,
      contractVersion: 2,
      requestId: 'request-1',
      workspaceEpoch: 8,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
      ok: true,
    })).toBe(false);
    expect(isBotJobGraphMutationResponse({
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      requestId: 'request-1',
      workspaceEpoch: 8,
      ownerAssertion: {
        workspaceKind: 'BOT_JOB',
        homeBankingId: 2,
        botJobId: 5,
      },
      ok: true,
    })).toBe(false);
    expect(() => isBotJobGraphMutationResponse({
      contractVersion: INSTRUCTION_GRAPH_MUTATION_CONTRACT_VERSION,
      requestId: 'request-1',
      workspaceEpoch: 8,
      ownerAssertion: null,
      ok: false,
      errorCode: 'REFUSED',
      message: 'Refused.',
    })).not.toThrow();
  });

  it('compares the compound owner rather than numeric IDs alone', () => {
    const owner = {
      workspaceKind: 'BOT_JOB' as const,
      homeBankingId: 2,
      botJobId: 5,
    };
    expect(sameInstructionGraphOwner(owner, { ...owner })).toBe(true);
    expect(sameInstructionGraphOwner(
      owner,
      { ...owner, botJobId: 6 },
    )).toBe(false);
  });
});
