import type {
  RuntimeVariableMemoryEntry,
  VariableCommandLink,
  VariableGraphEntry,
} from '../../variablesWorkspace.contract';
import { orderRuntimeVariablesByExecution } from './variableExecutionOrder';

const runtimeVariable = (
  variableId: number,
  name: string,
): RuntimeVariableMemoryEntry => ({
  variableId,
  name,
  type: 'String',
  state: 'VALUE',
  value: name,
  voidReason: null,
  entryRevision: 1,
  source: 'COMMAND',
});

const command = (
  id: number,
  blockOrder: number | null,
  instructionOrder: number | null,
): VariableCommandLink => ({
  id,
  name: `Command ${id}`,
  command: 'GET',
  operation: 'GetValue',
  blockId: blockOrder === null ? null : blockOrder * 10,
  blockName: blockOrder === null ? '' : `Block ${blockOrder}`,
  blockOrder,
  instructionOrder,
  parentId: null,
  parentBlockId: null,
  variableId: null,
  active: true,
  blockActive: true,
  role: 'PRODUCER',
  diagnostics: [],
});

const variable = (
  id: number,
  commands: VariableCommandLink[],
): VariableGraphEntry => ({
  id,
  name: `Variable ${id}`,
  type: 'String',
  configuredValue: '',
  localFormat: '',
  delimiter: '',
  owner: null,
  commands,
  producers: commands,
  consumers: [],
  literalAssignments: [],
  invalidLinks: [],
  diagnostics: [],
  unused: commands.length === 0,
  health: commands.length === 0 ? 'UNUSED' : 'HEALTHY',
});

test('orders each variable by its earliest connected command', () => {
  const later = runtimeVariable(2, 'Later');
  const earlier = runtimeVariable(1, 'Earlier');

  expect(orderRuntimeVariablesByExecution(
    [later, earlier],
    [
      variable(1, [
        command(109, 2, 1),
        command(108, 1, 8),
      ]),
      variable(2, [command(110, 1, 10)]),
    ],
  )).toEqual([earlier, later]);
});

test('places connected variables first and preserves the authoritative order of the unconnected tail', () => {
  const unconnectedFirst = runtimeVariable(90, 'Unconnected first');
  const connectedLater = runtimeVariable(20, 'Connected later');
  const unconnectedSecond = runtimeVariable(80, 'Unconnected second');
  const connectedEarlier = runtimeVariable(10, 'Connected earlier');

  expect(orderRuntimeVariablesByExecution(
    [
      unconnectedFirst,
      connectedLater,
      unconnectedSecond,
      connectedEarlier,
    ],
    [
      variable(10, [command(101, 1, 1)]),
      variable(20, [command(202, 2, 2)]),
      variable(80, []),
      variable(90, [command(909, null, null)]),
    ],
  )).toEqual([
    connectedEarlier,
    connectedLater,
    unconnectedFirst,
    unconnectedSecond,
  ]);
});

test('returns a new ordered array without mutating runtime entries or graph definitions', () => {
  const first = Object.freeze(runtimeVariable(1, 'First'));
  const second = Object.freeze(runtimeVariable(2, 'Second'));
  const items = Object.freeze([second, first]);
  const definitions = Object.freeze([
    Object.freeze(variable(1, [command(101, 1, 1)])),
    Object.freeze(variable(2, [command(202, 2, 1)])),
  ]);
  const originalItems = [...items];
  const originalDefinitions = [...definitions];

  const ordered = orderRuntimeVariablesByExecution(items, definitions);

  expect(ordered).toEqual([first, second]);
  expect(ordered).not.toBe(items);
  expect(items).toEqual(originalItems);
  expect(definitions).toEqual(originalDefinitions);
  expect(ordered[0]).toBe(first);
  expect(ordered[1]).toBe(second);
});
