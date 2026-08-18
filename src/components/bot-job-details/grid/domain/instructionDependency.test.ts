import {
  DependencyClosureMode,
  DependencyInstruction,
  DependencySelectionScope,
  InstructionVariableLink,
  canonicalInstructionAction,
  createInstructionDependencyResolver,
  isCrossBlockNavigation,
  resolveInstructionDependencyClosure,
  resolveInstructionMoveGroup,
} from './instructionDependency';

type Row = DependencyInstruction & { name: string };

const row = (
  id: number,
  blockId: number,
  blockOrderNumber: number,
  instructionOrderNumber: number,
  actions: string,
  parentId: number | null = null,
  variableId: number | null = null,
  parentBlockId: number | null = null,
): Row => ({
  id,
  blockId,
  blockOrderNumber,
  instructionOrderNumber,
  actions,
  name: `${actions} ${id}`,
  parentId,
  variableId,
  parentBlockId,
});

const variable = (
  id: number,
  instructionId: number | null,
): InstructionVariableLink => ({ id, instructionId });

const ids = (result: { orderedInstructions: Row[] }): number[] =>
  result.orderedInstructions.map((instruction) => instruction.id as number);

const resolve = (
  instructions: readonly Row[],
  variableLinks: readonly InstructionVariableLink[],
  selectedInstructionIds: readonly number[],
  mode: DependencyClosureMode,
  selectionScope: DependencySelectionScope = 'FULL',
) =>
  resolveInstructionDependencyClosure({
    instructions,
    variableLinks,
    selectedInstructionIds,
    mode,
    selectionScope,
  });

describe('canonical instruction actions', () => {
  it('normalizes case, payload suffixes, and backend aliases', () => {
    expect(canonicalInstructionAction(' Excel GOTO:3 ')).toBe('EXCEL GOTO');
    expect(canonicalInstructionAction('hold:5')).toBe('H');
    expect(canonicalInstructionAction('screen')).toBe('P');
    expect(canonicalInstructionAction('QUIT')).toBe('Q');
    expect(canonicalInstructionAction(null)).toBe('');
  });

  it('recognizes only actual cross-block GOTO and EXCEL GOTO edges', () => {
    expect(isCrossBlockNavigation('goto:3', 2, 1)).toBe(true);
    expect(isCrossBlockNavigation('Excel GOTO:1', 3, 2)).toBe(true);
    expect(isCrossBlockNavigation('GOTO', 1, 1)).toBe(false);
    expect(isCrossBlockNavigation('C', 2, 1)).toBe(false);
  });
});

describe('resolveInstructionMoveGroup', () => {
  it('selects the smallest nested IF..ENDIF span', () => {
    const rows = [
      row(1, 7, 1, 1, 'IF', 1),
      row(2, 7, 1, 2, 'C'),
      row(3, 7, 1, 3, 'IF', 3),
      row(4, 7, 1, 4, 'O'),
      row(5, 7, 1, 5, 'ENDIF', 3),
      row(6, 7, 1, 6, 'ENDIF', 1),
    ];

    expect(resolveInstructionMoveGroup(rows, 4).map((item) => item.id)).toEqual([
      3, 4, 5,
    ]);
  });

  it('selects the smallest LOOP/REFRESH_LOOP anchor span', () => {
    const rows = [
      row(10, 7, 1, 1, 'O'),
      row(11, 7, 1, 2, 'SET', 10),
      row(12, 7, 1, 3, 'O'),
      row(13, 7, 1, 4, 'C'),
      row(14, 7, 1, 5, 'O'),
      row(15, 7, 1, 6, 'REFRESH_LOOP', 12),
      row(16, 7, 1, 7, 'LOOP', 10),
    ];

    expect(resolveInstructionMoveGroup(rows, 12).map((item) => item.id)).toEqual([
      12, 13, 14, 15,
    ]);
  });

  it('includes a Web Field root and all of its direct dependent rows', () => {
    const rows = [
      row(20, 7, 1, 1, 'O'),
      row(21, 7, 1, 2, 'SET', 20),
      row(22, 7, 1, 3, 'C', 20),
      row(23, 7, 1, 4, 'O'),
    ];

    [20, 21, 22].forEach((selectedId) => {
      expect(
        resolveInstructionMoveGroup(rows, selectedId).map((item) => item.id),
      ).toEqual([20, 21, 22]);
    });
  });
});

describe('resolveInstructionDependencyClosure', () => {
  it('resolves parent, children, and a complete variable family to a fixed point', () => {
    const rows = [
      row(10, 7, 1, 1, 'O'),
      row(11, 7, 1, 2, 'GET', 10, 100, 7),
      row(12, 7, 1, 3, 'E', 10, 100, 7),
      row(13, 7, 1, 4, 'C', 12, null, 7),
      row(14, 7, 1, 5, 'O'),
    ];

    const result = resolve(
      rows,
      [variable(100, 10)],
      [12],
      'COMPONENT_COPY',
    );

    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([10, 11, 12, 13]);
    expect(result.requiredBlockIds).toEqual([]);
  });

  it('combines nested conditional and loop spans', () => {
    const rows = [
      row(1, 7, 1, 1, 'O'),
      row(2, 7, 1, 2, 'IF', 2, null, 7),
      row(3, 7, 1, 3, 'C'),
      row(4, 7, 1, 4, 'IF', 4, null, 7),
      row(5, 7, 1, 5, 'O'),
      row(6, 7, 1, 6, 'ENDIF', 4, null, 7),
      row(7, 7, 1, 7, 'ENDIF', 2, null, 7),
      row(8, 7, 1, 8, 'LOOP', 1, null, 7),
    ];

    const result = resolve(rows, [], [5], 'BOT_JOB_MOVE');

    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('recursively includes whole external GOTO blocks for COMPONENT_COPY', () => {
    const rows = [
      row(1, 1, 1, 1, 'goto:3', null, null, 2),
      row(2, 1, 1, 2, 'O'),
      row(20, 2, 2, 1, 'O'),
      row(21, 2, 2, 2, 'C'),
      row(22, 2, 2, 3, 'Excel GOTO:1', null, null, 3),
      row(30, 3, 3, 1, 'O'),
      row(31, 3, 3, 2, 'C'),
    ];

    const result = resolve(rows, [], [1], 'COMPONENT_COPY');

    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([1, 20, 21, 22, 30, 31]);
    expect(result.requiredBlockIds).toEqual([2, 3]);
  });

  it.each<DependencyClosureMode>(['BOT_JOB_COPY', 'BOT_JOB_MOVE'])(
    '%s leaves an external GOTO destination in place',
    (mode) => {
      const rows = [
        row(1, 1, 1, 1, 'GOTO', 20, null, 2),
        row(20, 2, 2, 1, 'O'),
        row(21, 2, 2, 2, 'C'),
      ];

      const result = resolve(rows, [], [1], mode);

      expect(result.successful).toBe(true);
      expect(ids(result)).toEqual([1]);
      expect(result.requiredBlockIds).toEqual([]);
    },
  );

  it('does not pull incoming cross-block GOTO callers when selecting a target', () => {
    const rows = [
      row(1, 1, 1, 1, 'GOTO', 20, null, 2),
      row(20, 2, 2, 1, 'O'),
      row(21, 2, 2, 2, 'C', 20, null, 2),
    ];

    const result = resolve(rows, [], [20], 'BOT_JOB_MOVE');

    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([20, 21]);
  });

  it('unions multiple selections and returns deterministic owner order', () => {
    const rows = [
      row(30, 3, 3, 2, 'C'),
      row(10, 1, 1, 2, 'C'),
      row(20, 2, 2, 1, 'O'),
      row(9, 1, 1, 1, 'O'),
    ];

    const resolver = createInstructionDependencyResolver(rows, []);
    const result = resolver.resolve([30, 9, 30], 'BOT_JOB_COPY');

    expect(ids(result)).toEqual([9, 30]);
    expect(rows.map((item) => item.id)).toEqual([30, 10, 20, 9]);
  });

  it('matches the live Check payment IF/LOOP overlap topology (802-816)', () => {
    const checkPaymentRows = [
      row(802, 36, 18, 1, 'PAUSE'),
      row(803, 36, 18, 2, 'C'),
      row(804, 36, 18, 3, 'O:Condivise (SHA)'),
      row(805, 36, 18, 4, 'H', 804, 501, 36),
      row(806, 36, 18, 5, 'IF', 806, null, 36),
      row(807, 36, 18, 6, 'GET', 804, 501, 36),
      row(808, 36, 18, 7, 'CK', 804, 501, 36),
      row(809, 36, 18, 8, 'E', 804, 501, 36),
      row(810, 36, 18, 9, 'ELSE', 806, null, 36),
      row(811, 36, 18, 10, 'C'),
      row(812, 36, 18, 11, 'C'),
      row(813, 36, 18, 12, 'H'),
      row(814, 36, 18, 13, 'C'),
      row(815, 36, 18, 14, 'LOOP', 804, null, 36),
      row(816, 36, 18, 15, 'ENDIF', 806, null, 36),
    ];

    const result = resolve(
      checkPaymentRows,
      [variable(501, 804), variable(502, 804)],
      [812],
      'COMPONENT_COPY',
    );

    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([
      804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816,
    ]);

    const directExcel = resolve(
      checkPaymentRows,
      [variable(501, 804), variable(502, 804)],
      [809],
      'COMPONENT_COPY',
      'DIRECT',
    );
    expect(directExcel.successful).toBe(true);
    expect(ids(directExcel)).toEqual([804, 805, 807, 808, 809]);

    [806, 810, 816].forEach((selectedId) => {
      const directConditional = resolve(
        checkPaymentRows,
        [variable(501, 804), variable(502, 804)],
        [selectedId],
        'COMPONENT_COPY',
        'DIRECT',
      );
      expect(ids(directConditional)).toEqual([806, 810, 816]);
    });

    const directBody = resolve(
      checkPaymentRows,
      [variable(501, 804), variable(502, 804)],
      [812],
      'COMPONENT_COPY',
      'DIRECT',
    );
    expect(ids(directBody)).toEqual([812]);
  });

  it('DIRECT selects only IF boundaries and LOOP endpoints, never positional bodies', () => {
    const rows = [
      row(1, 7, 1, 1, 'IF', 1),
      row(2, 7, 1, 2, 'C'),
      row(3, 7, 1, 3, 'ELSEIF', 1),
      row(4, 7, 1, 4, 'C'),
      row(5, 7, 1, 5, 'ELSE', 1),
      row(6, 7, 1, 6, 'C'),
      row(7, 7, 1, 7, 'ENDIF', 1),
      row(8, 7, 1, 8, 'O'),
      row(9, 7, 1, 9, 'C'),
      row(10, 7, 1, 10, 'REFRESH_LOOP', 8),
    ];

    expect(ids(resolve(rows, [], [4], 'BOT_JOB_COPY', 'DIRECT'))).toEqual([4]);
    expect(ids(resolve(rows, [], [5], 'BOT_JOB_COPY', 'DIRECT'))).toEqual([
      1, 3, 5, 7,
    ]);
    expect(ids(resolve(rows, [], [10], 'BOT_JOB_COPY', 'DIRECT'))).toEqual([
      8, 10,
    ]);
  });

  it('DIRECT includes a variable owner and GET producer without unrelated consumers', () => {
    const rows = [
      row(10, 1, 1, 1, 'O'),
      row(11, 1, 1, 2, 'GET', 10, 100, 1),
      row(12, 1, 1, 3, 'E', 10, 100, 1),
      row(20, 2, 2, 1, 'O'),
      row(21, 2, 2, 2, 'CK', 20, 100, 2),
    ];

    const result = resolve(
      rows,
      [variable(100, 10)],
      [12],
      'COMPONENT_COPY',
      'DIRECT',
    );
    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([10, 11, 12]);
  });

  it('DIRECT recursively includes required Component GOTO blocks without its source IF body', () => {
    const rows = [
      row(1, 1, 1, 1, 'IF', 1),
      row(2, 1, 1, 2, 'GOTO', 20, null, 2),
      row(3, 1, 1, 3, 'ENDIF', 1),
      row(20, 2, 2, 1, 'O'),
      row(21, 2, 2, 2, 'EXCEL GOTO', 30, null, 3),
      row(30, 3, 3, 1, 'O'),
    ];

    const result = resolve(
      rows,
      [],
      [2],
      'COMPONENT_COPY',
      'DIRECT',
    );
    expect(result.successful).toBe(true);
    expect(ids(result)).toEqual([2, 20, 21, 30]);
    expect(result.requiredBlockIds).toEqual([2, 3]);
  });

  it.each([
    ['ordinary child', row(41, 7, 1, 1, 'C', 999)],
    ['ELSE boundary', row(42, 7, 1, 1, 'ELSE', 999)],
    ['ENDIF boundary', row(43, 7, 1, 1, 'ENDIF', 999)],
    ['LOOP boundary', row(44, 7, 1, 1, 'LOOP', 999)],
  ])('DIRECT reports a dangling parent for a stale %s without throwing', (_label, selected) => {
    const result = resolve(
      [selected],
      [],
      [selected.id as number],
      'COMPONENT_COPY',
      'DIRECT',
    );

    expect(result.successful).toBe(false);
    expect(result.error).toEqual({
      code: 'DANGLING_PARENT',
      message:
        'An instruction references a parent outside the supplied owner graph.',
      instructionId: selected.id,
      relatedId: 999,
    });
    expect(result.orderedInstructions).toEqual([]);
    expect(result.requiredBlockIds).toEqual([]);
  });

  it('returns a structured dangling-parent error with no partial closure', () => {
    const result = resolve(
      [row(5, 7, 1, 1, 'E', 999, null, 7)],
      [],
      [5],
      'COMPONENT_COPY',
    );

    expect(result.successful).toBe(false);
    expect(result.error).toEqual({
      code: 'DANGLING_PARENT',
      message:
        'An instruction references a parent outside the supplied owner graph.',
      instructionId: 5,
      relatedId: 999,
    });
    expect(result.orderedInstructions).toEqual([]);
    expect(result.requiredBlockIds).toEqual([]);
  });

  it('returns specific dangling-variable and variable-owner errors', () => {
    const user = row(5, 7, 1, 1, 'GET', null, 100, 7);

    expect(resolve([user], [], [5], 'COMPONENT_COPY').error?.code).toBe(
      'DANGLING_VARIABLE',
    );
    expect(
      resolve(
        [user],
        [variable(100, null)],
        [5],
        'COMPONENT_COPY',
      ).error,
    ).toMatchObject({
      code: 'MISSING_VARIABLE_OWNER',
      instructionId: 5,
      relatedId: 100,
    });
    expect(
      resolve(
        [user],
        [variable(100, 999)],
        [5],
        'COMPONENT_COPY',
      ).error,
    ).toMatchObject({
      code: 'DANGLING_VARIABLE_OWNER',
      instructionId: 5,
      relatedId: 999,
    });
  });

  it('refuses missing and dangling COMPONENT_COPY destination blocks', () => {
    const missing = resolve(
      [row(1, 1, 1, 1, 'GOTO', null, null, 0)],
      [],
      [1],
      'COMPONENT_COPY',
    );
    expect(missing.error).toMatchObject({
      code: 'MISSING_GOTO_TARGET_BLOCK',
      instructionId: 1,
      relatedId: 0,
    });

    const dangling = resolve(
      [row(1, 1, 1, 1, 'EXCEL GOTO', null, null, 404)],
      [],
      [1],
      'COMPONENT_COPY',
    );
    expect(dangling.error).toMatchObject({
      code: 'DANGLING_GOTO_TARGET_BLOCK',
      instructionId: 1,
      relatedId: 404,
    });
  });

  it.each([
    {
      rows: [row(0, 1, 1, 1, 'O')],
      variables: [],
      code: 'INVALID_INSTRUCTION',
    },
    {
      rows: [row(1, 0, 1, 1, 'O')],
      variables: [],
      code: 'INVALID_INSTRUCTION_BLOCK',
    },
    {
      rows: [row(1, 1, 1, 1, 'O'), row(1, 1, 1, 2, 'C')],
      variables: [],
      code: 'DUPLICATE_INSTRUCTION_ID',
    },
    {
      rows: [row(1, 1, 1, 1, 'O')],
      variables: [variable(0, 1)],
      code: 'INVALID_VARIABLE',
    },
    {
      rows: [row(1, 1, 1, 1, 'O')],
      variables: [variable(100, 1), variable(100, 1)],
      code: 'DUPLICATE_VARIABLE_ID',
    },
  ])('validates malformed owner graphs: $code', ({ rows, variables, code }) => {
    const result = resolve(
      rows,
      variables,
      [1],
      'COMPONENT_COPY',
    );
    expect(result.successful).toBe(false);
    expect(result.error?.code).toBe(code);
  });

  it('validates the mode, selected IDs, and selected-row existence', () => {
    const resolver = createInstructionDependencyResolver(
      [row(1, 1, 1, 1, 'O')],
      [],
    );

    expect(resolver.resolve([1], null).error?.code).toBe('INVALID_REQUEST');
    expect(resolver.resolve([], 'BOT_JOB_COPY').error?.code).toBe(
      'INVALID_REQUEST',
    );
    expect(resolver.resolve([0], 'BOT_JOB_COPY').error?.code).toBe(
      'INVALID_REQUEST',
    );
    expect(resolver.resolve([404], 'BOT_JOB_COPY').error).toMatchObject({
      code: 'INSTRUCTION_NOT_FOUND',
      instructionId: 404,
    });
  });
});
