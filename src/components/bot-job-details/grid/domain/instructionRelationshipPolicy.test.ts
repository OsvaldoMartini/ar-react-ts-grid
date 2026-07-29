import {
  canonicalInstructionAction,
  instructionRelationshipPolicy,
  isVariableConsumerAction,
  isVariableProducerAction,
  writesRuntimeVariableValue,
} from './instructionRelationshipPolicy';

describe('instructionRelationshipPolicy', () => {
  it.each([
    ['HOLD:5', 'H'],
    ['screen', 'P'],
    ['Quit', 'Q'],
    [' I:username ', 'I'],
    [null, ''],
  ])('canonicalizes %p as %s', (input, expected) => {
    expect(canonicalInstructionAction(input)).toBe(expected);
  });

  it.each([
    ['O:Account', 'WEB_ELEMENT', 'NONE', 'NONE'],
    ['GET', 'VARIABLE_COMMAND', 'PRODUCER', 'NONE'],
    ['SET', 'VARIABLE_COMMAND', 'LITERAL_ASSIGNMENT', 'NONE'],
    ['E', 'VARIABLE_COMMAND', 'RUNTIME_CONSUMER', 'NONE'],
    ['CK', 'VARIABLE_COMMAND', 'RUNTIME_CONSUMER', 'NONE'],
    ['PDF CHECK', 'VARIABLE_COMMAND', 'OUTPUT_VALIDATION', 'NONE'],
    ['CSV CHECK', 'VARIABLE_COMMAND', 'OUTPUT_VALIDATION', 'NONE'],
    ['IF', 'STRUCTURAL_BOUNDARY', 'NONE', 'CONDITIONAL_ROOT'],
    ['ELSE', 'STRUCTURAL_BOUNDARY', 'NONE', 'CONDITIONAL_BOUNDARY'],
    ['LOOP', 'STRUCTURAL_BOUNDARY', 'NONE', 'LOOP_BOUNDARY'],
    ['GOTO', 'NAVIGATION', 'NONE', 'NONE'],
    ['PAUSE', 'NEUTRAL_COMMAND', 'NONE', 'NONE'],
  ])(
    'classifies %s without using its display label',
    (action, role, variableSemantics, structuralSemantics) => {
      expect(instructionRelationshipPolicy(action)).toMatchObject({
        role,
        variableSemantics,
        structuralSemantics,
      });
    },
  );

  it('keeps the audited runtime writers and readers distinct', () => {
    expect(isVariableProducerAction('GET')).toBe(true);
    expect(isVariableProducerAction('SET')).toBe(false);
    expect(writesRuntimeVariableValue('GET')).toBe(true);
    expect(writesRuntimeVariableValue('SET')).toBe(true);
    expect(isVariableConsumerAction('E')).toBe(true);
    expect(isVariableConsumerAction('CK')).toBe(true);
    expect(isVariableConsumerAction('PDF CHECK')).toBe(false);
    expect(isVariableConsumerAction('CSV CHECK')).toBe(false);
  });

  it('models SET writable tags and does not require an earlier writer', () => {
    expect(instructionRelationshipPolicy('SET')).toMatchObject({
      requirements: ['ELEMENT_TARGET', 'VARIABLE_BINDING'],
      allowedVariableTypes: ['$String', '#Numeric'],
      allowedElementTags: ['input', 'select', 'textarea'],
      writesRuntimeValue: true,
    });
  });

  it('does not treat PDF/CSV persistence metadata as ordinary runtime-memory ordering', () => {
    for (const action of ['PDF CHECK', 'CSV CHECK']) {
      const current = instructionRelationshipPolicy(action);
      expect(current.requirements).toEqual([
        'ELEMENT_TARGET',
        'VARIABLE_BINDING',
      ]);
      expect(current.requirements).not.toContain('VARIABLE_ORDER');
    }
  });
});
