import type {
  RuntimeVariableMemoryEntry,
  VariableGraphEntry,
} from '../../variablesWorkspace.contract';

type ExecutionCoordinate = {
  blockOrder: number;
  instructionOrder: number;
  instructionId: number;
};

type OrderedRuntimeVariable = {
  item: RuntimeVariableMemoryEntry;
  originalIndex: number;
  coordinate: ExecutionCoordinate | null;
};

const positiveOrder = (value: number | null): number | null =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0
    ? value
    : null;

const earliestCommandCoordinate = (
  variable: VariableGraphEntry | undefined,
): ExecutionCoordinate | null => {
  if (!variable) return null;
  const coordinates = variable.commands.flatMap((command) => {
    const blockOrder = positiveOrder(command.blockOrder);
    const instructionOrder = positiveOrder(command.instructionOrder);
    if (blockOrder === null || instructionOrder === null) return [];
    return [{
      blockOrder,
      instructionOrder,
      instructionId: positiveOrder(command.id)
        ?? Number.MAX_SAFE_INTEGER,
    }];
  });
  coordinates.sort((left, right) =>
    left.blockOrder - right.blockOrder
    || left.instructionOrder - right.instructionOrder
    || left.instructionId - right.instructionId);
  return coordinates[0] ?? null;
};

/**
 * Presents runtime variables in the order their first connected command runs.
 *
 * This selector is intentionally view-only. It never persists an ordering rule
 * and keeps the authoritative runtime-array order for definitions that have no
 * usable command coordinate.
 */
export const orderRuntimeVariablesByExecution = (
  items: readonly RuntimeVariableMemoryEntry[],
  variables: readonly VariableGraphEntry[],
): RuntimeVariableMemoryEntry[] => {
  const definitions = new Map(
    variables.map(variable => [variable.id, variable] as const),
  );
  const ordered: OrderedRuntimeVariable[] = items.map((item, originalIndex) => ({
    item,
    originalIndex,
    coordinate: earliestCommandCoordinate(definitions.get(item.variableId)),
  }));
  ordered.sort((left, right) => {
    if (left.coordinate === null && right.coordinate === null) {
      return left.originalIndex - right.originalIndex;
    }
    if (left.coordinate === null) return 1;
    if (right.coordinate === null) return -1;
    return left.coordinate.blockOrder - right.coordinate.blockOrder
      || left.coordinate.instructionOrder - right.coordinate.instructionOrder
      || left.coordinate.instructionId - right.coordinate.instructionId
      || left.originalIndex - right.originalIndex;
  });
  return ordered.map(entry => entry.item);
};
