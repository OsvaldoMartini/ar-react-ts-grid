import {
  computeInstructionGraphRevision,
  sha256Utf8,
} from './instructionGraphRevision';

describe('Java-compatible instruction graph revision', () => {
  it('matches standard SHA-256 vectors', () => {
    expect(sha256Utf8('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Utf8('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the Java canonical row and variable format regardless of input order', () => {
    const first = {
      id: 1,
      blockId: 8,
      instructionOrderNumber: 2,
      actions: 'O',
    };
    const second = {
      id: 2,
      blockId: 8,
      instructionOrderNumber: 1,
      actions: 'E',
      parentId: 1,
      parentBlockId: 8,
      variableId: 100,
      operation: 'extract',
    };
    const variables = [
      { id: 101, instructionId: null },
      { id: 100, instructionId: 1 },
    ];

    expect(computeInstructionGraphRevision(
      [second, first],
      variables,
    )).toBe('062fb47de6e7fee0828cd6686c636557cfcbdcc19351f91cff2547f22e4a3d4f');
    expect(computeInstructionGraphRevision(
      [first, second],
      [...variables].reverse(),
    )).toBe('062fb47de6e7fee0828cd6686c636557cfcbdcc19351f91cff2547f22e4a3d4f');
  });

  it('changes when same-ID dependency metadata changes', () => {
    const original = {
      id: 5,
      blockId: 7,
      instructionOrderNumber: 1,
      actions: 'GET',
      parentId: 4,
      variableId: 100,
      operation: 'value',
    };

    expect(computeInstructionGraphRevision(
      [original],
      [{ id: 100, instructionId: 4 }],
    )).not.toBe(computeInstructionGraphRevision(
      [{ ...original, parentId: 3 }],
      [{ id: 100, instructionId: 4 }],
    ));
    expect(computeInstructionGraphRevision(
      [original],
      [{ id: 100, instructionId: 4 }],
    )).not.toBe(computeInstructionGraphRevision(
      [original],
      [{ id: 100, instructionId: 3 }],
    ));
  });
});
