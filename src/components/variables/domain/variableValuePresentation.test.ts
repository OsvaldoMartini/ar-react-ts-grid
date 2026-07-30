import type { VariableGraphEntry } from '../../variablesWorkspace.contract';
import { variableValuePresentation } from './variableValuePresentation';

const variable = (
  configuredValue: string,
  producers: VariableGraphEntry['producers'],
): VariableGraphEntry => ({
  id: 12,
  name: 'Amount',
  type: '$String',
  configuredValue,
  localFormat: '',
  delimiter: '',
  owner: null,
  commands: producers,
  producers,
  consumers: [],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: producers.length === 0,
  health: producers.length === 0 ? 'UNUSED' : 'HEALTHY',
});

const producer = (
  active: boolean | null = true,
  blockActive: boolean | null = true,
): VariableGraphEntry['producers'][number] => ({
  id: 190,
  name: 'Read Amount',
  command: 'GET',
  operation: '',
  blockId: 7,
  blockName: 'Login',
  blockOrder: 1,
  instructionOrder: 2,
  parentId: 189,
  parentBlockId: null,
  variableId: 12,
  active,
  blockActive,
  role: 'PRODUCER',
  diagnostics: [],
});

test('keeps configured EMPTY separate from runtime producer topology', () => {
  const result = variableValuePresentation(variable('$EMPTY', [producer()]));

  expect(result.configuredState).toBe('EMPTY');
  expect(result.configuredLabel).toBe('EMPTY');
  expect(result.runtimeState).toBe('SOURCE_DEFINED');
  expect(result.runtimeLabel).toBe('GET source defined');
});

test('blank configuration is not mislabeled as a produced empty value', () => {
  const result = variableValuePresentation(variable('', []));

  expect(result.configuredState).toBe('NOT_CONFIGURED');
  expect(result.configuredLabel).toBe('Not configured');
  expect(result.runtimeState).toBe('VOID');
});

test('inactive GET rows do not hide VOID', () => {
  const result = variableValuePresentation(variable('$EMPTY', [
    producer(false, true),
    producer(true, false),
  ]));

  expect(result.activeProducers).toHaveLength(0);
  expect(result.runtimeLabel).toBe('VOID - no active GET producer');
});

test.each([
  [null, true],
  [true, null],
  [null, null],
])('nullable execution flags (%s, %s) do not declare an active producer', (
  active,
  blockActive,
) => {
  const result = variableValuePresentation(variable('', [
    producer(active, blockActive),
  ]));

  expect(result.activeProducers).toHaveLength(0);
  expect(result.runtimeState).toBe('VOID');
  expect(result.runtimeDetail).toContain('declared graph');
  expect(result.runtimeDetail).not.toContain('bypassed');
});
