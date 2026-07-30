import { instructionRelationshipPolicy } from './instructionRelationshipPolicy';
import type {
  InstructionRelationshipEdge,
  InstructionRelationshipGraph,
  InstructionRelationshipKind,
  RelationshipBlockFact,
  RelationshipInstructionFact,
  RelationshipOwner,
} from './instructionRelationshipGraph';

export type RunScope =
  | { readonly kind: 'ALL' }
  | {
      readonly kind: 'FROM_BLOCK';
      readonly selectedBlockId: number;
    }
  | {
      readonly kind: 'ONE';
      readonly selectedBlockId: number;
    };

export type ExecutionPreflightIssueKind =
  | InstructionRelationshipKind
  | 'RUN_SCOPE';

export type ExecutionPreflightIssueDisposition =
  | 'VARIABLE_DIAGNOSTIC'
  | 'STRUCTURAL_START_FAILURE';

export interface ExecutionRelationshipPreflightIssue {
  readonly code: string;
  readonly kind: ExecutionPreflightIssueKind;
  readonly disposition: ExecutionPreflightIssueDisposition;
  readonly blockId: number | null;
  readonly instructionId: number | null;
  readonly message: string;
  readonly edgeId: string | null;
}

export interface ExecutionRelationshipPreflightResult {
  readonly status: 'READY' | 'WARN' | 'BLOCKED';
  readonly ready: boolean;
  readonly owner: RelationshipOwner;
  readonly runScope: RunScope;
  readonly reachableBlockIds: readonly number[];
  readonly reachableInstructionIds: readonly number[];
  readonly issues: readonly ExecutionRelationshipPreflightIssue[];
}

const compareBlock = (
  left: RelationshipBlockFact,
  right: RelationshipBlockFact,
): number =>
  (left.order ?? Number.MAX_SAFE_INTEGER)
  - (right.order ?? Number.MAX_SAFE_INTEGER)
  || left.id - right.id;

const compareInstruction = (
  left: RelationshipInstructionFact,
  right: RelationshipInstructionFact,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.id - right.id;

const isBlockActive = (block: RelationshipBlockFact): boolean =>
  block.active !== false;

const isInstructionActive = (
  instruction: RelationshipInstructionFact,
  blocksById: ReadonlyMap<number, RelationshipBlockFact>,
): boolean =>
  instruction.instructionActive !== false
  && instruction.blockActive !== false
  && blocksById.get(instruction.blockId)?.active !== false
  && blocksById.has(instruction.blockId);

const edgeFor = (
  graph: InstructionRelationshipGraph,
  instructionId: number,
  kind: InstructionRelationshipKind,
): InstructionRelationshipEdge | null =>
  graph.edges.find(edge =>
    edge.source.entity === 'INSTRUCTION'
    && edge.source.id === instructionId
    && edge.kind === kind) ?? null;

const actionOf = (row: RelationshipInstructionFact): string =>
  instructionRelationshipPolicy(row.actions).canonicalAction;

const issueDisposition = (
  code: string,
  kind: ExecutionPreflightIssueKind,
): ExecutionPreflightIssueDisposition =>
  code === 'DUPLICATE_VARIABLE_ID'
  || kind === 'ELEMENT_TARGET'
  || kind === 'VARIABLE_BINDING'
  || kind === 'VARIABLE_ORDER'
    ? 'VARIABLE_DIAGNOSTIC'
    : 'STRUCTURAL_START_FAILURE';

const issueMessage = (
  code: string,
  row: RelationshipInstructionFact | null,
  blockId: number | null,
): string => {
  if (row === null) {
    return code === 'SELECTED_BLOCK_NOT_FOUND'
      ? `The requested Block #${blockId ?? 'unknown'} is not owned by this Bot Job.`
      : `Execution preflight was blocked (${code}).`;
  }
  const action = actionOf(row) || 'Instruction';
  const instruction = `Instruction #${row.id}`;
  switch (code) {
    case 'MISSING_ELEMENT_TARGET':
      return `${action} ${instruction} has no Web Element target.`;
    case 'DANGLING_ELEMENT_TARGET':
      return `${action} ${instruction} references missing Web Element instruction #${row.parentId}.`;
    case 'ELEMENT_TARGET_WRONG_BLOCK':
      return `${action} ${instruction} references a Web Element in another Block.`;
    case 'INCOMPATIBLE_ELEMENT_TARGET':
      return `${action} ${instruction} does not reference a compatible Web Element.`;
    case 'INACTIVE_ELEMENT_TARGET':
      return `${action} ${instruction} references an inactive Web Element.`;
    case 'ELEMENT_TARGET_ORDER':
      return `${action} ${instruction} requires its Web Element target to execute first.`;
    case 'MISSING_VARIABLE_BINDING':
      return `${action} ${instruction} has no variable binding.`;
    case 'DANGLING_VARIABLE_BINDING':
      return `${action} ${instruction} references missing variable #${row.variableId}.`;
    case 'INCOMPATIBLE_VARIABLE_TYPE':
      return `${action} ${instruction} references an incompatible variable type.`;
    case 'MISSING_RUNTIME_VALUE_WRITER':
      return `${action} ${instruction} has no active GET or SET writer before it.`;
    case 'RUNTIME_VALUE_WRITER_AFTER_READER':
      return `${action} ${instruction} executes before its active GET or SET writer.`;
    case 'RUNTIME_VALUE_WRITER_OUTSIDE_SCOPE':
      return `${action} ${instruction} has an active GET or SET writer outside this run scope.`;
    case 'MISSING_LOOP_ANCHOR':
      return `${action} ${instruction} has no Web Element anchor.`;
    case 'DANGLING_LOOP_ANCHOR':
      return `${action} ${instruction} references missing anchor instruction #${row.parentId}.`;
    case 'LOOP_ANCHOR_WRONG_BLOCK':
      return `${action} ${instruction} references an anchor in another Block.`;
    case 'INCOMPATIBLE_LOOP_ANCHOR':
      return `${action} ${instruction} does not reference a Web Element anchor.`;
    case 'INACTIVE_LOOP_ANCHOR':
      return `${action} ${instruction} references an inactive Web Element anchor.`;
    case 'LOOP_ANCHOR_ORDER':
      return `${action} ${instruction} requires its anchor to execute first.`;
    case 'CONDITIONAL_ROOT_NOT_SELF':
      return `IF ${instruction} must reference itself.`;
    case 'ORPHAN_CONDITIONAL_BOUNDARY':
      return `${action} ${instruction} has no active matching IF.`;
    case 'CONDITIONAL_ROOT_MISMATCH':
      return `${action} ${instruction} does not reference its active matching IF.`;
    case 'ELSEIF_AFTER_ELSE':
      return `ELSEIF ${instruction} appears after ELSE.`;
    case 'DUPLICATE_ELSE':
      return `ELSE ${instruction} duplicates an active ELSE in the same IF family.`;
    case 'MISSING_ENDIF':
      return `IF ${instruction} has no active matching ENDIF.`;
    case 'MISSING_BLOCK_TARGET':
      return `${action} ${instruction} has no destination Block.`;
    case 'DANGLING_BLOCK_TARGET':
      return `${action} ${instruction} references an unowned destination Block #${row.parentBlockId}.`;
    case 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK':
      return `${action} ${instruction} destination must differ from containing Block #${row.blockId}.`;
    case 'INACTIVE_BLOCK_TARGET':
      return `${action} ${instruction} references an inactive destination Block.`;
    default:
      return `${instruction} is not execution-ready (${code}).`;
  }
};

const initialReachableBlocks = (
  blocks: readonly RelationshipBlockFact[],
  runScope: RunScope,
): {
  readonly ids: Set<number>;
  readonly scopeIssue: ExecutionRelationshipPreflightIssue | null;
} => {
  const ordered = [...blocks].sort(compareBlock);
  if (runScope.kind === 'ALL') {
    return {
      ids: new Set(ordered.filter(isBlockActive).map(block => block.id)),
      scopeIssue: null,
    };
  }

  const selectedIndex = ordered.findIndex(
    block => block.id === runScope.selectedBlockId,
  );
  if (selectedIndex < 0) {
    return {
      ids: new Set(),
      scopeIssue: Object.freeze({
        code: 'SELECTED_BLOCK_NOT_FOUND',
        kind: 'RUN_SCOPE',
        disposition: 'STRUCTURAL_START_FAILURE',
        blockId: runScope.selectedBlockId,
        instructionId: null,
        message: issueMessage(
          'SELECTED_BLOCK_NOT_FOUND',
          null,
          runScope.selectedBlockId,
        ),
        edgeId: null,
      }),
    };
  }

  if (runScope.kind === 'ONE') {
    const selected = ordered[selectedIndex];
    return {
      ids: new Set(isBlockActive(selected) ? [selected.id] : []),
      scopeIssue: null,
    };
  }

  return {
    ids: new Set(
      ordered.slice(selectedIndex).filter(isBlockActive).map(block => block.id),
    ),
    scopeIssue: null,
  };
};

const expandNavigationTargets = (
  graph: InstructionRelationshipGraph,
  reachableBlockIds: Set<number>,
  blocksById: ReadonlyMap<number, RelationshipBlockFact>,
): void => {
  let changed: boolean;
  do {
    changed = false;
    graph.instructions.forEach((row) => {
      if (
        !reachableBlockIds.has(row.blockId)
        || !isInstructionActive(row, blocksById)
        || instructionRelationshipPolicy(row.actions).role !== 'NAVIGATION'
      ) {
        return;
      }
      const edge = edgeFor(graph, row.id, 'BLOCK_TARGET');
      if (
        edge?.code !== null
        || edge.target?.entity !== 'BLOCK'
        || edge.target.id === row.blockId
      ) {
        return;
      }
      const target = blocksById.get(edge.target.id);
      if (target && isBlockActive(target) && !reachableBlockIds.has(target.id)) {
        reachableBlockIds.add(target.id);
        changed = true;
      }
    });
  } while (changed);
};

type ConditionalFrame = {
  readonly root: RelationshipInstructionFact;
  elseSeen: boolean;
};

const conditionalIssues = (
  rows: readonly RelationshipInstructionFact[],
): ExecutionRelationshipPreflightIssue[] => {
  const rowsByBlock = new Map<number, RelationshipInstructionFact[]>();
  rows.forEach((row) => {
    const structural =
      instructionRelationshipPolicy(row.actions).structuralSemantics;
    if (
      structural !== 'CONDITIONAL_ROOT'
      && structural !== 'CONDITIONAL_BOUNDARY'
    ) {
      return;
    }
    const current = rowsByBlock.get(row.blockId) ?? [];
    current.push(row);
    rowsByBlock.set(row.blockId, current);
  });

  const issues: ExecutionRelationshipPreflightIssue[] = [];
  const add = (
    code: string,
    row: RelationshipInstructionFact,
  ): void => {
    issues.push(Object.freeze({
      code,
      kind: 'CONDITIONAL_ROOT',
      disposition: 'STRUCTURAL_START_FAILURE',
      blockId: row.blockId,
      instructionId: row.id,
      message: issueMessage(code, row, row.blockId),
      edgeId: null,
    }));
  };

  rowsByBlock.forEach((blockRows) => {
    const stack: ConditionalFrame[] = [];
    [...blockRows].sort(compareInstruction).forEach((row) => {
      const policy = instructionRelationshipPolicy(row.actions);
      const action = policy.canonicalAction;
      if (policy.structuralSemantics === 'CONDITIONAL_ROOT') {
        if (row.parentId !== row.id) add('CONDITIONAL_ROOT_NOT_SELF', row);
        stack.push({ root: row, elseSeen: false });
        return;
      }

      const current = stack[stack.length - 1];
      if (!current) {
        add('ORPHAN_CONDITIONAL_BOUNDARY', row);
        return;
      }
      if (row.parentId !== current.root.id) {
        add('CONDITIONAL_ROOT_MISMATCH', row);
        return;
      }
      if (action === 'ELSEIF' && current.elseSeen) {
        add('ELSEIF_AFTER_ELSE', row);
        return;
      }
      if (action === 'ELSE') {
        if (current.elseSeen) add('DUPLICATE_ELSE', row);
        else current.elseSeen = true;
        return;
      }
      if (action === 'ENDIF') stack.pop();
    });
    stack.forEach(frame => add('MISSING_ENDIF', frame.root));
  });
  return issues;
};

/**
 * Derive execution eligibility from the already-built owner-scoped relationship graph.
 *
 * This function is diagnostic only. It performs no persistence, WebSocket call, reconnect
 * planning, Active-state mutation, or execution start.
 */
export const executionRelationshipPreflight = (
  graph: InstructionRelationshipGraph,
  runScope: RunScope,
): ExecutionRelationshipPreflightResult => {
  const blocks = [...graph.blocks].sort(compareBlock);
  const blocksById = new Map(blocks.map(block => [block.id, block]));
  const instructionsById = new Map(
    graph.instructions.map(row => [row.id, row]),
  );
  const {
    ids: reachableBlockIdSet,
    scopeIssue,
  } = initialReachableBlocks(blocks, runScope);
  expandNavigationTargets(graph, reachableBlockIdSet, blocksById);

  const reachableRows = graph.instructions
    .filter(row =>
      reachableBlockIdSet.has(row.blockId)
      && isInstructionActive(row, blocksById))
    .slice()
    .sort(compareInstruction);
  const reachableInstructionIdSet =
    new Set(reachableRows.map(row => row.id));
  const collected = new Map<string, ExecutionRelationshipPreflightIssue>();
  const add = (
    code: string,
    kind: ExecutionPreflightIssueKind,
    row: RelationshipInstructionFact,
    edgeId: string | null,
  ): void => {
    const key = `${row.id}:${kind}:${code}`;
    if (collected.has(key)) return;
    collected.set(key, Object.freeze({
      code,
      kind,
      disposition: issueDisposition(code, kind),
      blockId: row.blockId,
      instructionId: row.id,
      message: issueMessage(code, row, row.blockId),
      edgeId,
    }));
  };

  if (scopeIssue) {
    collected.set(
      `SCOPE:${scopeIssue.blockId}:${scopeIssue.code}`,
      scopeIssue,
    );
  }

  const reachableRowsById = new Map(reachableRows.map(row => [row.id, row]));
  graph.edges.forEach((edge) => {
    if (
      !edge.required
      || edge.source.entity !== 'INSTRUCTION'
      || !reachableRowsById.has(edge.source.id)
      || edge.kind === 'CONDITIONAL_ROOT'
      || edge.kind === 'VARIABLE_OWNER'
      || edge.kind === 'POSITIONAL_SCOPE'
      || edge.code === null
      || edge.code === 'VARIABLE_OWNER_PARENT_MISMATCH'
    ) {
      return;
    }
    const row = reachableRowsById.get(edge.source.id);
    if (row) add(edge.code, edge.kind, row, edge.id);
  });

  reachableRows.forEach((row) => {
    const policy = instructionRelationshipPolicy(row.actions);

    if (
      policy.role === 'NAVIGATION'
      && row.parentBlockId !== null
      && row.parentBlockId === row.blockId
    ) {
      add(
        'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK',
        'BLOCK_TARGET',
        row,
        edgeFor(graph, row.id, 'BLOCK_TARGET')?.id ?? null,
      );
    }

    (['ELEMENT_TARGET', 'LOOP_ANCHOR'] as const).forEach((kind) => {
      const edge = edgeFor(graph, row.id, kind);
      if (
        edge?.code !== null
        || edge.target?.entity !== 'INSTRUCTION'
      ) {
        return;
      }
      const target = instructionsById.get(edge.target.id);
      if (target && !isInstructionActive(target, blocksById)) {
        add(
          kind === 'ELEMENT_TARGET'
            ? 'INACTIVE_ELEMENT_TARGET'
            : 'INACTIVE_LOOP_ANCHOR',
          kind,
          row,
          edge.id,
        );
      }
    });

    const blockEdge = edgeFor(graph, row.id, 'BLOCK_TARGET');
    if (
      blockEdge?.code === null
      && blockEdge.target?.entity === 'BLOCK'
      && blocksById.get(blockEdge.target.id)?.active === false
    ) {
      add('INACTIVE_BLOCK_TARGET', 'BLOCK_TARGET', row, blockEdge.id);
    }

    const variableOrderEdge = edgeFor(graph, row.id, 'VARIABLE_ORDER');
    if (
      variableOrderEdge?.code === null
      && variableOrderEdge.target?.entity === 'INSTRUCTION'
      && !reachableInstructionIdSet.has(variableOrderEdge.target.id)
    ) {
      add(
        'RUNTIME_VALUE_WRITER_OUTSIDE_SCOPE',
        'VARIABLE_ORDER',
        row,
        variableOrderEdge.id,
      );
    }
  });

  conditionalIssues(reachableRows).forEach((issue) => {
    collected.set(
      `${issue.instructionId}:${issue.kind}:${issue.code}`,
      issue,
    );
  });

  const blockRank = new Map(blocks.map((block, index) => [block.id, index]));
  const instructionRank = new Map(
    [...graph.instructions]
      .sort(compareInstruction)
      .map((row, index) => [row.id, index]),
  );
  const issues = [...collected.values()].sort((left, right) =>
    (left.blockId === null
      ? Number.MAX_SAFE_INTEGER
      : blockRank.get(left.blockId) ?? Number.MAX_SAFE_INTEGER)
    - (right.blockId === null
      ? Number.MAX_SAFE_INTEGER
      : blockRank.get(right.blockId) ?? Number.MAX_SAFE_INTEGER)
    || (left.instructionId === null
      ? Number.MAX_SAFE_INTEGER
      : instructionRank.get(left.instructionId) ?? Number.MAX_SAFE_INTEGER)
    - (right.instructionId === null
      ? Number.MAX_SAFE_INTEGER
      : instructionRank.get(right.instructionId) ?? Number.MAX_SAFE_INTEGER)
    || left.kind.localeCompare(right.kind)
    || left.code.localeCompare(right.code));

  const reachableBlockIds = blocks
    .filter(block => reachableBlockIdSet.has(block.id))
    .map(block => block.id);
  const reachableInstructionIds = reachableRows.map(row => row.id);
  const blocked = issues.some(
    issue => issue.disposition === 'STRUCTURAL_START_FAILURE',
  );
  const clean = issues.length === 0;
  return Object.freeze({
    status: clean ? 'READY' : blocked ? 'BLOCKED' : 'WARN',
    ready: !blocked,
    owner: graph.owner,
    runScope: Object.freeze({ ...runScope }) as RunScope,
    reachableBlockIds: Object.freeze(reachableBlockIds),
    reachableInstructionIds: Object.freeze(reachableInstructionIds),
    issues: Object.freeze(issues),
  });
};
