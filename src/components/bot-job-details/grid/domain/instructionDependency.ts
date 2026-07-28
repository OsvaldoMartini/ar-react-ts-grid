/**
 * Persistence-free instruction dependency resolution shared by grid capabilities.
 *
 * This module intentionally has no React, WebSocket, or database dependencies. It mirrors the
 * backend InstructionMoveGroupService and InstructionDependencyClosureService so a workspace can
 * project legal row operations without changing or partially mutating its rendered graph.
 */

export type DependencyClosureMode =
  | 'COMPONENT_COPY'
  | 'BOT_JOB_COPY'
  | 'BOT_JOB_MOVE';

/** React-owned breadth used when projecting a Memory List selection. */
export type DependencySelectionScope = 'FULL' | 'DIRECT';

export type DependencyClosureErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_INSTRUCTION'
  | 'INVALID_INSTRUCTION_BLOCK'
  | 'DUPLICATE_INSTRUCTION_ID'
  | 'INSTRUCTION_NOT_FOUND'
  | 'DANGLING_PARENT'
  | 'INVALID_VARIABLE'
  | 'DUPLICATE_VARIABLE_ID'
  | 'DANGLING_VARIABLE'
  | 'MISSING_VARIABLE_OWNER'
  | 'DANGLING_VARIABLE_OWNER'
  | 'MISSING_VARIABLE_PRODUCER'
  | 'MISSING_GOTO_TARGET_BLOCK'
  | 'DANGLING_GOTO_TARGET_BLOCK';

export interface DependencyInstruction {
  id: number | null;
  blockId: number | null;
  blockOrderNumber?: number | null;
  instructionOrderNumber?: number | null;
  actions?: string | null;
  parentId?: number | null;
  parentBlockId?: number | null;
  variableId?: number | null;
}

/** Raw variable ownership link loaded with an authoritative instruction graph. */
export interface InstructionVariableLink {
  id: number | null;
  instructionId: number | null;
}

export interface DependencyClosureError {
  code: DependencyClosureErrorCode;
  message: string;
  instructionId: number | null;
  relatedId: number | null;
}

export interface DependencyClosureResult<
  TInstruction extends DependencyInstruction = DependencyInstruction,
> {
  successful: boolean;
  orderedInstructions: TInstruction[];
  requiredBlockIds: number[];
  error: DependencyClosureError | null;
}

export interface ResolveInstructionDependencyClosureRequest<
  TInstruction extends DependencyInstruction = DependencyInstruction,
> {
  instructions:
    | readonly (TInstruction | null | undefined)[]
    | null
    | undefined;
  variableLinks?:
    | readonly (InstructionVariableLink | null | undefined)[]
    | null;
  selectedInstructionIds: readonly number[] | null | undefined;
  mode: DependencyClosureMode | null | undefined;
  selectionScope?: DependencySelectionScope | null;
}

export interface InstructionDependencyResolver<
  TInstruction extends DependencyInstruction = DependencyInstruction,
> {
  resolve(
    selectedInstructionIds: readonly number[] | null | undefined,
    mode: DependencyClosureMode | null | undefined,
    selectionScope?: DependencySelectionScope | null,
  ): DependencyClosureResult<TInstruction>;
}

const ACTION_ALIASES: Readonly<Record<string, string>> = {
  HOLD: 'H',
  SCREEN: 'P',
  QUIT: 'Q',
};

const NON_WEB_FIELD_ACTIONS = new Set([
  'IF',
  'ELSEIF',
  'ELSE',
  'ENDIF',
  'LOOP',
  'REFRESH_LOOP',
]);

const VALID_MODES = new Set<DependencyClosureMode>([
  'COMPONENT_COPY',
  'BOT_JOB_COPY',
  'BOT_JOB_MOVE',
]);

const VALID_SELECTION_SCOPES = new Set<DependencySelectionScope>([
  'FULL',
  'DIRECT',
]);

const CONDITIONAL_BOUNDARY_ACTIONS = new Set([
  'IF',
  'ELSEIF',
  'ELSE',
  'ENDIF',
]);

const LOOP_BOUNDARY_ACTIONS = new Set([
  'LOOP',
  'REFRESH_LOOP',
]);

const VARIABLE_CONSUMER_ACTIONS = new Set([
  'E',
  'CK',
  'PDF CHECK',
  'CSV CHECK',
]);

const MAX_ORDER = Number.MAX_SAFE_INTEGER;

interface GraphIndex<TInstruction extends DependencyInstruction> {
  instructions: TInstruction[];
  instructionsById: Map<number, TInstruction>;
  rowsByBlock: Map<number, TInstruction[]>;
  childrenByParent: Map<number, TInstruction[]>;
  variablesById: Map<number, InstructionVariableLink>;
  variablesByOwner: Map<number, InstructionVariableLink[]>;
  usersByVariable: Map<number, TInstruction[]>;
}

interface IndexResult<TInstruction extends DependencyInstruction> {
  graph: GraphIndex<TInstruction> | null;
  error: DependencyClosureError | null;
}

/** Match the backend CommandRegistry normalization, including its legacy aliases. */
export const canonicalInstructionAction = (
  action: string | null | undefined,
): string => {
  if (action == null) return '';
  const base = action.split(':', 1)[0].trim().toUpperCase();
  return ACTION_ALIASES[base] ?? base;
};

/**
 * A cross-block GOTO parent is a navigation reference, not an ordinary ownership edge.
 */
export const isCrossBlockNavigation = (
  action: string | null | undefined,
  parentBlockId: number | null | undefined,
  instructionBlockId: number | null | undefined,
): boolean => {
  const canonical = canonicalInstructionAction(action);
  return (
    (canonical === 'GOTO' || canonical === 'EXCEL GOTO') &&
    parentBlockId != null &&
    instructionBlockId != null &&
    parentBlockId !== instructionBlockId
  );
};

const orderValue = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : MAX_ORDER;

const compareInstructionOrder = <
  TInstruction extends DependencyInstruction,
>(
  left: TInstruction,
  right: TInstruction,
): number =>
  orderValue(left.blockOrderNumber) - orderValue(right.blockOrderNumber) ||
  orderValue(left.blockId) - orderValue(right.blockId) ||
  orderValue(left.instructionOrderNumber) -
    orderValue(right.instructionOrderNumber) ||
  orderValue(left.id) - orderValue(right.id);

const compareWithinBlock = <TInstruction extends DependencyInstruction>(
  left: TInstruction,
  right: TInstruction,
): number =>
  orderValue(left.instructionOrderNumber) -
    orderValue(right.instructionOrderNumber) ||
  orderValue(left.id) - orderValue(right.id);

const isPositiveId = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value > 0;

const nullableNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

const failure = <TInstruction extends DependencyInstruction>(
  code: DependencyClosureErrorCode,
  message: string,
  instructionId: number | null,
  relatedId: number | null,
): DependencyClosureResult<TInstruction> => ({
  successful: false,
  orderedInstructions: [],
  requiredBlockIds: [],
  error: { code, message, instructionId, relatedId },
});

const success = <TInstruction extends DependencyInstruction>(
  orderedInstructions: TInstruction[],
  requiredBlockIds: number[],
): DependencyClosureResult<TInstruction> => ({
  successful: true,
  orderedInstructions,
  requiredBlockIds,
  error: null,
});

const isWebFieldDependent = (
  instruction: DependencyInstruction,
): boolean =>
  instruction.parentId != null &&
  !NON_WEB_FIELD_ACTIONS.has(String(instruction.actions ?? ''));

const indexOfInstruction = <TInstruction extends DependencyInstruction>(
  rows: readonly TInstruction[],
  instructionId: number,
): number => rows.findIndex((row) => row.id === instructionId);

const addRange = <TInstruction extends DependencyInstruction>(
  rows: readonly TInstruction[],
  start: number,
  end: number,
  includedIds: Set<number>,
): void => {
  if (start < 0 || end < start || end >= rows.length) return;
  for (let index = start; index <= end; index += 1) {
    const id = rows[index].id;
    if (isPositiveId(id)) includedIds.add(id);
  }
};

const resolveMoveGroupFromBlock = <
  TInstruction extends DependencyInstruction,
>(
  sourceRows: readonly TInstruction[],
  selectedInstructionId: number,
): TInstruction[] => {
  const block = [...sourceRows].sort(compareWithinBlock);
  const selectedIndex = indexOfInstruction(block, selectedInstructionId);
  if (selectedIndex < 0) return [];

  const selected = block[selectedIndex];
  const includedIds = new Set<number>();

  // Select the smallest properly nested IF..ENDIF span containing the row.
  const conditionalStarts: number[] = [];
  let bestConditionalStart = -1;
  let bestConditionalEnd = MAX_ORDER;
  block.forEach((row, index) => {
    const action = String(row.actions ?? '');
    if (action === 'IF') conditionalStarts.push(index);
    if (action === 'ENDIF' && conditionalStarts.length > 0) {
      const start = conditionalStarts.pop() as number;
      if (
        start <= selectedIndex &&
        selectedIndex <= index &&
        (bestConditionalStart < 0 ||
          index - start < bestConditionalEnd - bestConditionalStart)
      ) {
        bestConditionalStart = start;
        bestConditionalEnd = index;
      }
    }
  });
  addRange(
    block,
    bestConditionalStart,
    bestConditionalEnd,
    includedIds,
  );

  // Select the smallest LOOP/REFRESH_LOOP anchor span containing the row.
  let bestLoopStart = -1;
  let bestLoopEnd = MAX_ORDER;
  block.forEach((boundary, boundaryIndex) => {
    const action = String(boundary.actions ?? '');
    if (
      (action !== 'LOOP' && action !== 'REFRESH_LOOP') ||
      boundary.parentId == null
    ) {
      return;
    }
    const parentIndex = indexOfInstruction(block, boundary.parentId);
    if (parentIndex < 0) return;
    const start = Math.min(parentIndex, boundaryIndex);
    const end = Math.max(parentIndex, boundaryIndex);
    if (
      start <= selectedIndex &&
      selectedIndex <= end &&
      (bestLoopStart < 0 || end - start < bestLoopEnd - bestLoopStart)
    ) {
      bestLoopStart = start;
      bestLoopEnd = end;
    }
  });
  addRange(block, bestLoopStart, bestLoopEnd, includedIds);

  // Resolve a selected Web Field child to its root and include the root's direct family.
  const selectedIsDependentChild =
    isWebFieldDependent(selected) &&
    selected.parentId !== selected.id;
  const rootId = selectedIsDependentChild
    ? selected.parentId
    : selected.id;
  if (isPositiveId(rootId)) {
    block.forEach((row) => {
      if (
        row.id === rootId ||
        (row.parentId === rootId && isWebFieldDependent(row))
      ) {
        if (isPositiveId(row.id)) includedIds.add(row.id);
      }
    });
  }

  if (includedIds.size === 0) includedIds.add(selectedInstructionId);
  return block.filter(
    (row): row is TInstruction =>
      isPositiveId(row.id) && includedIds.has(row.id),
  );
};

/**
 * Resolve the same atomic row group as the backend move-group service.
 */
export const resolveInstructionMoveGroup = <
  TInstruction extends DependencyInstruction,
>(
  rows: readonly (TInstruction | null | undefined)[],
  selectedInstructionId: number,
): TInstruction[] => {
  const selected = rows.find(
    (row): row is TInstruction =>
      row != null && row.id === selectedInstructionId,
  );
  if (selected == null || selected.blockId == null) return [];
  return resolveMoveGroupFromBlock(
    rows.filter(
      (row): row is TInstruction =>
        row != null && row.blockId === selected.blockId,
    ),
    selectedInstructionId,
  );
};

const buildGraphIndex = <TInstruction extends DependencyInstruction>(
  suppliedInstructions:
    | readonly (TInstruction | null | undefined)[]
    | null
    | undefined,
  suppliedVariableLinks:
    | readonly (InstructionVariableLink | null | undefined)[]
    | null
    | undefined,
): IndexResult<TInstruction> => {
  if (suppliedInstructions == null) {
    return {
      graph: null,
      error: {
        code: 'INVALID_REQUEST',
        message: 'An authoritative instruction graph is required.',
        instructionId: null,
        relatedId: null,
      },
    };
  }

  const instructions: TInstruction[] = [];
  const instructionsById = new Map<number, TInstruction>();
  const rowsByBlock = new Map<number, TInstruction[]>();
  const childrenByParent = new Map<number, TInstruction[]>();

  for (const instruction of suppliedInstructions) {
    if (instruction == null || !isPositiveId(instruction.id)) {
      return {
        graph: null,
        error: {
          code: 'INVALID_INSTRUCTION',
          message:
            'The owner graph contains an instruction without a positive ID.',
          instructionId:
            instruction == null ? null : nullableNumber(instruction.id),
          relatedId: null,
        },
      };
    }
    if (!isPositiveId(instruction.blockId)) {
      return {
        graph: null,
        error: {
          code: 'INVALID_INSTRUCTION_BLOCK',
          message:
            'An instruction is not attached to a positive block ID.',
          instructionId: instruction.id,
          relatedId: nullableNumber(instruction.blockId),
        },
      };
    }
    if (instructionsById.has(instruction.id)) {
      return {
        graph: null,
        error: {
          code: 'DUPLICATE_INSTRUCTION_ID',
          message: 'The owner graph contains a duplicate instruction ID.',
          instructionId: instruction.id,
          relatedId: null,
        },
      };
    }

    instructionsById.set(instruction.id, instruction);
    instructions.push(instruction);
    const blockRows = rowsByBlock.get(instruction.blockId) ?? [];
    blockRows.push(instruction);
    rowsByBlock.set(instruction.blockId, blockRows);
    if (instruction.parentId != null) {
      const children = childrenByParent.get(instruction.parentId) ?? [];
      children.push(instruction);
      childrenByParent.set(instruction.parentId, children);
    }
  }

  instructions.sort(compareInstructionOrder);
  rowsByBlock.forEach((rows) => rows.sort(compareInstructionOrder));
  childrenByParent.forEach((rows) => rows.sort(compareInstructionOrder));

  const variablesById = new Map<number, InstructionVariableLink>();
  const variablesByOwner = new Map<number, InstructionVariableLink[]>();
  for (const variable of suppliedVariableLinks ?? []) {
    if (variable == null || !isPositiveId(variable.id)) {
      return {
        graph: null,
        error: {
          code: 'INVALID_VARIABLE',
          message:
            'The owner graph contains a variable without a positive ID.',
          instructionId: null,
          relatedId: variable == null ? null : nullableNumber(variable.id),
        },
      };
    }
    if (variablesById.has(variable.id)) {
      return {
        graph: null,
        error: {
          code: 'DUPLICATE_VARIABLE_ID',
          message: 'The owner graph contains a duplicate variable ID.',
          instructionId: null,
          relatedId: variable.id,
        },
      };
    }
    variablesById.set(variable.id, variable);
    if (variable.instructionId != null) {
      const owned = variablesByOwner.get(variable.instructionId) ?? [];
      owned.push(variable);
      variablesByOwner.set(variable.instructionId, owned);
    }
  }
  variablesByOwner.forEach((variables) =>
    variables.sort((left, right) => orderValue(left.id) - orderValue(right.id)),
  );

  const usersByVariable = new Map<number, TInstruction[]>();
  instructions.forEach((instruction) => {
    if (instruction.variableId == null) return;
    const users = usersByVariable.get(instruction.variableId) ?? [];
    users.push(instruction);
    usersByVariable.set(instruction.variableId, users);
  });
  usersByVariable.forEach((rows) => rows.sort(compareInstructionOrder));

  return {
    graph: {
      instructions,
      instructionsById,
      rowsByBlock,
      childrenByParent,
      variablesById,
      variablesByOwner,
      usersByVariable,
    },
    error: null,
  };
};

const isMode = (
  mode: DependencyClosureMode | null | undefined,
): mode is DependencyClosureMode =>
  mode != null && VALID_MODES.has(mode);

const isSelectionScope = (
  selectionScope: DependencySelectionScope | null | undefined,
): selectionScope is DependencySelectionScope =>
  selectionScope != null && VALID_SELECTION_SCOPES.has(selectionScope);

const blockOrder = <TInstruction extends DependencyInstruction>(
  graph: GraphIndex<TInstruction>,
  blockId: number,
): number => {
  let minimum = MAX_ORDER;
  (graph.rowsByBlock.get(blockId) ?? []).forEach((row) => {
    minimum = Math.min(minimum, orderValue(row.blockOrderNumber));
  });
  return minimum;
};

/**
 * Resolve the bounded, ID-based neighborhood requested by Only GET the Direct Steps.
 *
 * Unlike FULL selection this function never includes positional IF/LOOP bodies and never expands
 * every user of a variable. It selects the semantic one-hop family visible in React, then follows
 * only hard references required to persist a valid clone: ordinary parents, variable declaration
 * owners/GET producers, and complete Component navigation destinations.
 */
const resolveDirectDependencyGroup = <
  TInstruction extends DependencyInstruction,
>(
  graph: GraphIndex<TInstruction>,
  selectedInstructionIds: readonly number[],
  mode: DependencyClosureMode,
): DependencyClosureResult<TInstruction> => {
  const includedIds = new Set<number>();
  const requiredBlockIds = new Set<number>();
  const requiredQueue: number[] = [];
  let requiredIndex = 0;

  const include = (instructionId: number): void => {
    if (!includedIds.has(instructionId)) {
      includedIds.add(instructionId);
      requiredQueue.push(instructionId);
    }
  };

  const includeConditionalFamily = (
    selected: TInstruction,
    blockRows: readonly TInstruction[],
  ): void => {
    // Queue the selected row first. If its IF root is stale/missing, the
    // required-reference validation below returns DANGLING_PARENT before any
    // missing ID can be dereferenced.
    if (isPositiveId(selected.id)) include(selected.id);
    const action = canonicalInstructionAction(selected.actions);
    const rootId = action === 'IF' ? selected.id : selected.parentId;
    if (!isPositiveId(rootId)) {
      return;
    }
    include(rootId);
    blockRows.forEach((row) => {
      if (
        isPositiveId(row.id)
        && row.parentId === rootId
        && CONDITIONAL_BOUNDARY_ACTIONS.has(
          canonicalInstructionAction(row.actions),
        )
      ) {
        include(row.id);
      }
    });
  };

  const includeDirectFamily = (selected: TInstruction): void => {
    if (!isPositiveId(selected.id) || !isPositiveId(selected.blockId)) return;
    const blockRows = graph.rowsByBlock.get(selected.blockId) ?? [];
    const action = canonicalInstructionAction(selected.actions);
    if (CONDITIONAL_BOUNDARY_ACTIONS.has(action)) {
      includeConditionalFamily(selected, blockRows);
      return;
    }
    if (LOOP_BOUNDARY_ACTIONS.has(action)) {
      include(selected.id);
      if (isPositiveId(selected.parentId) && selected.parentId !== selected.id) {
        include(selected.parentId);
      }
      return;
    }

    const crossBlockNavigation = isCrossBlockNavigation(
      selected.actions,
      selected.parentBlockId,
      selected.blockId,
    );
    const rootId = !crossBlockNavigation
      && isPositiveId(selected.parentId)
      && selected.parentId !== selected.id
      ? selected.parentId
      : selected.id;
    // Keep the concrete selected row ahead of any parent reference so a
    // dangling parent is reported as data corruption instead of reaching the
    // queue as an undefined instruction.
    include(selected.id);
    include(rootId);
    blockRows.forEach((row) => {
      const rowAction = canonicalInstructionAction(row.actions);
      if (
        isPositiveId(row.id)
        && row.parentId === rootId
        && !CONDITIONAL_BOUNDARY_ACTIONS.has(rowAction)
        && !LOOP_BOUNDARY_ACTIONS.has(rowAction)
        && !isCrossBlockNavigation(
          row.actions,
          row.parentBlockId,
          row.blockId,
        )
      ) {
        include(row.id);
      }
    });
  };

  selectedInstructionIds.forEach((selectedId) => {
    includeDirectFamily(
      graph.instructionsById.get(selectedId) as TInstruction,
    );
  });

  while (requiredIndex < requiredQueue.length) {
    const currentId = requiredQueue[requiredIndex];
    requiredIndex += 1;
    const current = graph.instructionsById.get(currentId);
    if (current == null) {
      return failure(
        'DANGLING_PARENT',
        'An instruction references a parent outside the supplied owner graph.',
        null,
        currentId,
      );
    }
    const crossBlockNavigation = isCrossBlockNavigation(
      current.actions,
      current.parentBlockId,
      current.blockId,
    );

    if (
      isPositiveId(current.parentId)
      && current.parentId !== currentId
      && !crossBlockNavigation
    ) {
      if (!graph.instructionsById.has(current.parentId)) {
        return failure(
          'DANGLING_PARENT',
          'An instruction references a parent outside the supplied owner graph.',
          currentId,
          current.parentId,
        );
      }
      include(current.parentId);
    }

    if (current.variableId != null) {
      const variable = graph.variablesById.get(current.variableId);
      if (variable == null) {
        return failure(
          'DANGLING_VARIABLE',
          'An instruction references a variable outside the supplied owner graph.',
          currentId,
          current.variableId,
        );
      }
      const ownerId = variable.instructionId;
      if (!isPositiveId(ownerId)) {
        return failure(
          'MISSING_VARIABLE_OWNER',
          'A connected variable does not have an owning instruction.',
          currentId,
          current.variableId,
        );
      }
      if (!graph.instructionsById.has(ownerId)) {
        return failure(
          'DANGLING_VARIABLE_OWNER',
          'A connected variable owner is outside the supplied instruction graph.',
          currentId,
          ownerId,
        );
      }
      include(ownerId);

      if (
        VARIABLE_CONSUMER_ACTIONS.has(
          canonicalInstructionAction(current.actions),
        )
      ) {
        const producers = (graph.usersByVariable.get(current.variableId) ?? [])
          .filter(
            (candidate) =>
              canonicalInstructionAction(candidate.actions) === 'GET',
          );
        if (producers.length === 0) {
          return failure(
            'MISSING_VARIABLE_PRODUCER',
            'A selected variable consumer does not have a matching GET producer.',
            currentId,
            current.variableId,
          );
        }
        producers.forEach((producer) => {
          if (isPositiveId(producer.id)) include(producer.id);
        });
      }
    }

    if (mode === 'COMPONENT_COPY' && crossBlockNavigation) {
      const targetBlockId = current.parentBlockId;
      if (!isPositiveId(targetBlockId)) {
        return failure(
          'MISSING_GOTO_TARGET_BLOCK',
          'A component GOTO does not reference a positive target block.',
          currentId,
          nullableNumber(targetBlockId),
        );
      }
      const targetRows = graph.rowsByBlock.get(targetBlockId);
      if (targetRows == null || targetRows.length === 0) {
        return failure(
          'DANGLING_GOTO_TARGET_BLOCK',
          'A component GOTO references a block outside the supplied owner graph.',
          currentId,
          targetBlockId,
        );
      }
      requiredBlockIds.add(targetBlockId);
      targetRows.forEach((targetRow) => {
        if (isPositiveId(targetRow.id)) include(targetRow.id);
      });
    }
  }

  return success(
    graph.instructions.filter(
      (instruction) =>
        isPositiveId(instruction.id) && includedIds.has(instruction.id),
    ),
    [...requiredBlockIds].sort(
      (left, right) =>
        blockOrder(graph, left) - blockOrder(graph, right) || left - right,
    ),
  );
};

/**
 * Build an immutable graph index once and resolve many row capability projections cheaply.
 */
export const createInstructionDependencyResolver = <
  TInstruction extends DependencyInstruction,
>(
  instructions:
    | readonly (TInstruction | null | undefined)[]
    | null
    | undefined,
  variableLinks?:
    | readonly (InstructionVariableLink | null | undefined)[]
    | null,
): InstructionDependencyResolver<TInstruction> => {
  const indexed = buildGraphIndex(instructions, variableLinks);

  return {
    resolve: (
      selectedInstructionIds,
      mode,
      selectionScope = 'FULL',
    ): DependencyClosureResult<TInstruction> => {
      if (!isMode(mode)) {
        return failure(
          'INVALID_REQUEST',
          'A dependency resolution mode is required.',
          null,
          null,
        );
      }
      if (!isSelectionScope(selectionScope)) {
        return failure(
          'INVALID_REQUEST',
          'A valid dependency selection scope is required.',
          null,
          null,
        );
      }
      if (
        selectedInstructionIds == null ||
        selectedInstructionIds.length === 0
      ) {
        return failure(
          'INVALID_REQUEST',
          'At least one positive selected instruction ID is required.',
          null,
          null,
        );
      }

      const normalizedSelectedIds: number[] = [];
      const seenSelectedIds = new Set<number>();
      for (const selectedId of selectedInstructionIds) {
        if (!isPositiveId(selectedId)) {
          return failure(
            'INVALID_REQUEST',
            'Every selected instruction ID must be positive.',
            nullableNumber(selectedId),
            null,
          );
        }
        if (!seenSelectedIds.has(selectedId)) {
          seenSelectedIds.add(selectedId);
          normalizedSelectedIds.push(selectedId);
        }
      }

      if (indexed.error != null || indexed.graph == null) {
        const error = indexed.error as DependencyClosureError;
        return failure(
          error.code,
          error.message,
          error.instructionId,
          error.relatedId,
        );
      }
      const graph = indexed.graph;
      for (const selectedId of normalizedSelectedIds) {
        if (!graph.instructionsById.has(selectedId)) {
          return failure(
            'INSTRUCTION_NOT_FOUND',
            'The selected instruction does not exist in the supplied owner graph.',
            selectedId,
            null,
          );
        }
      }

      if (selectionScope === 'DIRECT') {
        return resolveDirectDependencyGroup(
          graph,
          normalizedSelectedIds,
          mode,
        );
      }

      const includedIds = new Set<number>();
      const expandedIds = new Set<number>();
      const requiredBlockIds = new Set<number>();
      const pending: number[] = [];
      let pendingIndex = 0;
      const include = (instructionId: number): void => {
        if (!includedIds.has(instructionId)) {
          includedIds.add(instructionId);
          pending.push(instructionId);
        }
      };
      normalizedSelectedIds.forEach(include);

      while (pendingIndex < pending.length) {
        const currentId = pending[pendingIndex];
        pendingIndex += 1;
        if (expandedIds.has(currentId)) continue;
        expandedIds.add(currentId);
        const current = graph.instructionsById.get(currentId) as TInstruction;

        const currentBlockRows = isPositiveId(current.blockId)
          ? graph.rowsByBlock.get(current.blockId) ?? []
          : [];
        resolveMoveGroupFromBlock(currentBlockRows, currentId).forEach(
          (grouped) => {
            if (isPositiveId(grouped.id)) include(grouped.id);
          },
        );

        const crossBlockGoto = isCrossBlockNavigation(
          current.actions,
          current.parentBlockId,
          current.blockId,
        );
        const parentId = current.parentId;
        if (
          parentId != null &&
          parentId !== currentId &&
          !crossBlockGoto
        ) {
          if (!graph.instructionsById.has(parentId)) {
            return failure(
              'DANGLING_PARENT',
              'An instruction references a parent outside the supplied owner graph.',
              currentId,
              parentId,
            );
          }
          include(parentId);
        }
        (graph.childrenByParent.get(currentId) ?? []).forEach((child) => {
          if (
            !isCrossBlockNavigation(
              child.actions,
              child.parentBlockId,
              child.blockId,
            ) &&
            isPositiveId(child.id)
          ) {
            include(child.id);
          }
        });

        const connectedVariableIds = new Set<number>();
        if (current.variableId != null) {
          connectedVariableIds.add(current.variableId);
        }
        (graph.variablesByOwner.get(currentId) ?? []).forEach((variable) => {
          if (isPositiveId(variable.id)) {
            connectedVariableIds.add(variable.id);
          }
        });
        for (const variableId of connectedVariableIds) {
          const variable = graph.variablesById.get(variableId);
          if (variable == null) {
            return failure(
              'DANGLING_VARIABLE',
              'An instruction references a variable outside the supplied owner graph.',
              currentId,
              variableId,
            );
          }
          const ownerId = variable.instructionId;
          if (!isPositiveId(ownerId)) {
            return failure(
              'MISSING_VARIABLE_OWNER',
              'A connected variable does not have an owning instruction.',
              currentId,
              variableId,
            );
          }
          if (!graph.instructionsById.has(ownerId)) {
            return failure(
              'DANGLING_VARIABLE_OWNER',
              'A connected variable owner is outside the supplied instruction graph.',
              currentId,
              ownerId,
            );
          }
          include(ownerId);
          (graph.usersByVariable.get(variableId) ?? []).forEach((user) => {
            if (isPositiveId(user.id)) include(user.id);
          });
        }

        if (mode === 'COMPONENT_COPY' && crossBlockGoto) {
          const targetBlockId = current.parentBlockId;
          if (!isPositiveId(targetBlockId)) {
            return failure(
              'MISSING_GOTO_TARGET_BLOCK',
              'A component GOTO does not reference a positive target block.',
              currentId,
              nullableNumber(targetBlockId),
            );
          }
          if (targetBlockId !== current.blockId) {
            const targetRows = graph.rowsByBlock.get(targetBlockId);
            if (targetRows == null || targetRows.length === 0) {
              return failure(
                'DANGLING_GOTO_TARGET_BLOCK',
                'A component GOTO references a block outside the supplied owner graph.',
                currentId,
                targetBlockId,
              );
            }
            requiredBlockIds.add(targetBlockId);
            targetRows.forEach((targetRow) => {
              if (isPositiveId(targetRow.id)) include(targetRow.id);
            });
          }
        }
      }

      const orderedInstructions = graph.instructions.filter(
        (row) => isPositiveId(row.id) && includedIds.has(row.id),
      );
      const orderedRequiredBlocks = [...requiredBlockIds].sort(
        (left, right) =>
          blockOrder(graph, left) - blockOrder(graph, right) || left - right,
      );
      return success(orderedInstructions, orderedRequiredBlocks);
    },
  };
};

/** Convenient one-shot wrapper; use the resolver factory for repeated row projections. */
export const resolveInstructionDependencyClosure = <
  TInstruction extends DependencyInstruction,
>({
  instructions,
  variableLinks,
  selectedInstructionIds,
  mode,
  selectionScope = 'FULL',
}: ResolveInstructionDependencyClosureRequest<TInstruction>): DependencyClosureResult<TInstruction> =>
  createInstructionDependencyResolver(instructions, variableLinks).resolve(
    selectedInstructionIds,
    mode,
    selectionScope,
  );
