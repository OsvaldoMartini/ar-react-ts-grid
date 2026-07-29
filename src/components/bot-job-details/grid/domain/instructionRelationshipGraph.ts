import {
  instructionRelationshipPolicy,
  writesRuntimeVariableValue,
  type InstructionActionPolicy,
} from './instructionRelationshipPolicy';

export type RelationshipOwner =
  | {
      workspaceKind: 'BOT_JOB';
      homeBankingId: number;
      botJobId: number;
    }
  | {
      workspaceKind: 'COMPONENT';
      homeBankingId: number;
    };

export interface RelationshipInstructionFact {
  owner: RelationshipOwner;
  id: number;
  blockId: number;
  blockOrderNumber: number;
  instructionOrderNumber: number;
  actions: string;
  tagName: string | null;
  parentId: number | null;
  parentBlockId: number | null;
  variableId: number | null;
  instructionActive: boolean | null;
  blockActive: boolean | null;
}

export interface RelationshipBlockFact {
  owner: RelationshipOwner;
  id: number;
  order: number | null;
  active: boolean | null;
}

export interface RelationshipVariableFact {
  owner: RelationshipOwner;
  id: number;
  type: string | null;
  ownerInstructionId: number | null;
}

export type InstructionRelationshipKind =
  | 'ELEMENT_TARGET'
  | 'VARIABLE_BINDING'
  | 'LOOP_ANCHOR'
  | 'CONDITIONAL_ROOT'
  | 'BLOCK_TARGET'
  | 'VARIABLE_OWNER'
  | 'VARIABLE_ORDER'
  | 'POSITIONAL_SCOPE';

export type DerivedRelationshipState =
  | 'CONNECTED'
  | 'MEMORY_ONLY'
  | 'RECONNECT_PARENT'
  | 'RECONNECT_VARIABLE'
  | 'RECONNECT_LOOP'
  | 'REPAIR_CONDITIONAL'
  | 'RECONNECT_BLOCK'
  | 'FIX_ORDER';

export type RelationshipMutationState = 'SAVING' | 'REFUSED';
export type RelationshipState =
  | DerivedRelationshipState
  | RelationshipMutationState;

export type RelationshipTarget =
  | {
      entity: 'INSTRUCTION';
      owner: RelationshipOwner;
      id: number;
    }
  | {
      entity: 'VARIABLE';
      owner: RelationshipOwner;
      id: number;
    }
  | {
      entity: 'BLOCK';
      owner: RelationshipOwner;
      id: number;
    };

export interface InstructionRelationshipEdge {
  id: string;
  kind: InstructionRelationshipKind;
  source: RelationshipTarget;
  target: RelationshipTarget | null;
  state: DerivedRelationshipState;
  code: string | null;
  required: boolean;
  compatibleTargets: readonly RelationshipTarget[];
}

export interface InstructionRelationshipIssue {
  edgeId: string;
  code: string;
  kind: InstructionRelationshipKind;
  source: RelationshipTarget;
  state: Exclude<DerivedRelationshipState, 'CONNECTED' | 'MEMORY_ONLY'>;
}

export interface InstructionRelationshipGraph {
  owner: RelationshipOwner;
  instructions: readonly RelationshipInstructionFact[];
  blocks: readonly RelationshipBlockFact[];
  variables: readonly RelationshipVariableFact[];
  edges: readonly InstructionRelationshipEdge[];
  issues: readonly InstructionRelationshipIssue[];
}

export interface BuildInstructionRelationshipGraphRequest {
  owner: RelationshipOwner;
  instructions: readonly RelationshipInstructionFact[];
  blocks: readonly RelationshipBlockFact[];
  variables: readonly RelationshipVariableFact[];
}

type ConditionalState = {
  targetId: number | null;
  code: string | null;
};

const KIND_ORDER: Readonly<Record<InstructionRelationshipKind, number>> = {
  ELEMENT_TARGET: 1,
  VARIABLE_BINDING: 2,
  VARIABLE_ORDER: 3,
  LOOP_ANCHOR: 4,
  CONDITIONAL_ROOT: 5,
  BLOCK_TARGET: 6,
  VARIABLE_OWNER: 7,
  POSITIONAL_SCOPE: 8,
};

const ownerKey = (owner: RelationshipOwner): string =>
  owner.workspaceKind === 'BOT_JOB'
    ? `BOT_JOB:${owner.homeBankingId}:${owner.botJobId}`
    : `COMPONENT:${owner.homeBankingId}`;

const sameOwner = (
  left: RelationshipOwner,
  right: RelationshipOwner,
): boolean => ownerKey(left) === ownerKey(right);

const instructionTarget = (
  owner: RelationshipOwner,
  id: number,
): RelationshipTarget => ({ entity: 'INSTRUCTION', owner, id });

const variableTarget = (
  owner: RelationshipOwner,
  id: number,
): RelationshipTarget => ({ entity: 'VARIABLE', owner, id });

const blockTarget = (
  owner: RelationshipOwner,
  id: number,
): RelationshipTarget => ({ entity: 'BLOCK', owner, id });

const compareInstruction = (
  left: RelationshipInstructionFact,
  right: RelationshipInstructionFact,
): number =>
  left.blockOrderNumber - right.blockOrderNumber
  || left.blockId - right.blockId
  || left.instructionOrderNumber - right.instructionOrderNumber
  || left.id - right.id;

const compareBlock = (
  left: RelationshipBlockFact,
  right: RelationshipBlockFact,
): number =>
  (left.order ?? Number.MAX_SAFE_INTEGER)
  - (right.order ?? Number.MAX_SAFE_INTEGER)
  || left.id - right.id;

const compareVariable = (
  left: RelationshipVariableFact,
  right: RelationshipVariableFact,
): number => left.id - right.id;

const isBefore = (
  left: RelationshipInstructionFact,
  right: RelationshipInstructionFact,
): boolean => compareInstruction(left, right) < 0;

const isEffectivelyActive = (
  instruction: RelationshipInstructionFact,
): boolean =>
  instruction.instructionActive !== false
  && instruction.blockActive !== false;

const supportsVariable = (
  policy: InstructionActionPolicy,
  variable: RelationshipVariableFact,
): boolean =>
  policy.allowedVariableTypes.length === 0
  || (
    variable.type !== null
    && policy.allowedVariableTypes.includes(variable.type)
  );

const requiresOwnedVariableParentAgreement = (
  policy: InstructionActionPolicy,
): boolean =>
  policy.variableSemantics === 'PRODUCER'
  || policy.variableSemantics === 'LITERAL_ASSIGNMENT';

const supportsVariableForInstruction = (
  policy: InstructionActionPolicy,
  instruction: RelationshipInstructionFact,
  variable: RelationshipVariableFact,
): boolean =>
  supportsVariable(policy, variable)
  && (
    !requiresOwnedVariableParentAgreement(policy)
    || variable.ownerInstructionId === null
    || variable.ownerInstructionId === instruction.parentId
  );

const supportsElement = (
  policy: InstructionActionPolicy,
  instruction: RelationshipInstructionFact,
): boolean =>
  instructionRelationshipPolicy(instruction.actions).role === 'WEB_ELEMENT'
  && (
    policy.allowedElementTags.length === 0
    || (
      instruction.tagName !== null
      && policy.allowedElementTags.includes(
        instruction.tagName.trim().toLocaleLowerCase(),
      )
    )
  );

const edge = (
  owner: RelationshipOwner,
  kind: InstructionRelationshipKind,
  source: RelationshipTarget,
  target: RelationshipTarget | null,
  state: DerivedRelationshipState,
  code: string | null,
  required: boolean,
  compatibleTargets: readonly RelationshipTarget[],
  suffix = '',
): InstructionRelationshipEdge => ({
  id: [
    ownerKey(owner),
    kind,
    source.entity,
    source.id,
    target?.entity ?? 'NONE',
    target?.id ?? 'NONE',
    suffix,
  ].join(':'),
  kind,
  source,
  target,
  state,
  code,
  required,
  compatibleTargets,
});

const conditionalStates = (
  rowsByBlock: ReadonlyMap<number, readonly RelationshipInstructionFact[]>,
): {
  states: ReadonlyMap<number, ConditionalState>;
  scopes: ReadonlyArray<{
    instructionId: number;
    rootId: number;
  }>;
} => {
  const states = new Map<number, ConditionalState>();
  const scopes: Array<{ instructionId: number; rootId: number }> = [];

  rowsByBlock.forEach((rows) => {
    const stack: Array<{
      rootId: number;
      elseSeen: boolean;
    }> = [];

    rows.forEach((row) => {
      const policy = instructionRelationshipPolicy(row.actions);
      const action = policy.canonicalAction;

      if (policy.structuralSemantics === 'CONDITIONAL_ROOT') {
        states.set(row.id, {
          targetId: row.parentId === row.id ? row.id : null,
          code: row.parentId === row.id ? null : 'CONDITIONAL_ROOT_NOT_SELF',
        });
        stack.push({ rootId: row.id, elseSeen: false });
        return;
      }

      if (policy.structuralSemantics === 'CONDITIONAL_BOUNDARY') {
        const current = stack[stack.length - 1];
        if (!current) {
          states.set(row.id, {
            targetId: null,
            code: 'ORPHAN_CONDITIONAL_BOUNDARY',
          });
          return;
        }

        let code = row.parentId === current.rootId
          ? null
          : 'CONDITIONAL_ROOT_MISMATCH';
        if (action === 'ELSEIF' && current.elseSeen) {
          code = 'ELSEIF_AFTER_ELSE';
        }
        if (action === 'ELSE') {
          if (current.elseSeen) code = 'DUPLICATE_ELSE';
          current.elseSeen = true;
        }
        states.set(row.id, {
          targetId: code === null ? current.rootId : null,
          code,
        });
        // A malformed ENDIF cannot prove that the currently open IF family is
        // complete. Keep the root open so it is also reported as MISSING_ENDIF,
        // while the boundary itself retains CONDITIONAL_ROOT_MISMATCH.
        if (action === 'ENDIF' && row.parentId === current.rootId) stack.pop();
        return;
      }

      const current = stack[stack.length - 1];
      if (current) {
        scopes.push({
          instructionId: row.id,
          rootId: current.rootId,
        });
      }
    });

    stack.forEach(({ rootId }) => {
      states.set(rootId, {
        targetId: null,
        code: 'MISSING_ENDIF',
      });
    });
  });

  return { states, scopes };
};

const sortedTargets = (
  targets: readonly RelationshipTarget[],
  instructionOrder: ReadonlyMap<number, number>,
  blockOrder: ReadonlyMap<number, number>,
): RelationshipTarget[] => [...targets].sort((left, right) => {
  const rank = (target: RelationshipTarget): number => {
    if (target.entity === 'INSTRUCTION') {
      return instructionOrder.get(target.id) ?? Number.MAX_SAFE_INTEGER;
    }
    if (target.entity === 'BLOCK') {
      return 1_000_000 + (blockOrder.get(target.id) ?? target.id);
    }
    return 2_000_000 + target.id;
  };
  return rank(left) - rank(right)
    || left.entity.localeCompare(right.entity)
    || left.id - right.id;
});

/**
 * Build a deterministic, persistence-free relationship graph from the facts currently rendered
 * by one exact workspace owner. Facts belonging to another owner are ignored even when their
 * numeric IDs collide.
 */
export const buildInstructionRelationshipGraph = ({
  owner,
  instructions: sourceInstructions,
  blocks: sourceBlocks,
  variables: sourceVariables,
}: BuildInstructionRelationshipGraphRequest): InstructionRelationshipGraph => {
  const instructions = sourceInstructions
    .filter(item => sameOwner(item.owner, owner))
    .slice()
    .sort(compareInstruction);
  const blocks = sourceBlocks
    .filter(item => sameOwner(item.owner, owner))
    .slice()
    .sort(compareBlock);
  const variables = sourceVariables
    .filter(item => sameOwner(item.owner, owner))
    .slice()
    .sort(compareVariable);

  const instructionsById = new Map(
    instructions.map(instruction => [instruction.id, instruction]),
  );
  const blocksById = new Map(blocks.map(block => [block.id, block]));
  const variablesById = new Map(
    variables.map(variable => [variable.id, variable]),
  );
  const rowsByBlock = new Map<number, RelationshipInstructionFact[]>();
  instructions.forEach((instruction) => {
    const rows = rowsByBlock.get(instruction.blockId) ?? [];
    rows.push(instruction);
    rowsByBlock.set(instruction.blockId, rows);
  });

  const instructionOrder = new Map(
    instructions.map((instruction, index) => [instruction.id, index]),
  );
  const blockOrder = new Map(
    blocks.map((block, index) => [block.id, index]),
  );
  const relationshipEdges: InstructionRelationshipEdge[] = [];
  const { states: conditionalState, scopes: conditionalScopes } =
    conditionalStates(rowsByBlock);

  instructions.forEach((instruction) => {
    const policy = instructionRelationshipPolicy(instruction.actions);
    const source = instructionTarget(owner, instruction.id);

    if (policy.requirements.includes('ELEMENT_TARGET')) {
      const candidates = instructions.filter(candidate =>
        candidate.blockId === instruction.blockId
        && isBefore(candidate, instruction)
        && supportsElement(policy, candidate));
      const selected = instruction.parentId === null
        ? null
        : instructionsById.get(instruction.parentId) ?? null;
      let code: string | null = null;
      if (instruction.parentId === null) code = 'MISSING_ELEMENT_TARGET';
      else if (!selected) code = 'DANGLING_ELEMENT_TARGET';
      else if (selected.blockId !== instruction.blockId) {
        code = 'ELEMENT_TARGET_WRONG_BLOCK';
      } else if (!supportsElement(policy, selected)) {
        code = 'INCOMPATIBLE_ELEMENT_TARGET';
      } else if (!isBefore(selected, instruction)) {
        code = 'ELEMENT_TARGET_ORDER';
      }
      relationshipEdges.push(edge(
        owner,
        'ELEMENT_TARGET',
        source,
        selected && (code === null || code === 'ELEMENT_TARGET_ORDER')
          ? instructionTarget(owner, selected.id)
          : null,
        code === null
          ? 'CONNECTED'
          : code === 'ELEMENT_TARGET_ORDER'
            ? 'FIX_ORDER'
            : 'RECONNECT_PARENT',
        code,
        true,
        candidates.map(candidate => instructionTarget(owner, candidate.id)),
      ));
    }

    if (policy.requirements.includes('VARIABLE_BINDING')) {
      const candidates = variables.filter(variable =>
        supportsVariableForInstruction(policy, instruction, variable));
      const selected = instruction.variableId === null
        ? null
        : variablesById.get(instruction.variableId) ?? null;
      let code: string | null = null;
      if (instruction.variableId === null) code = 'MISSING_VARIABLE_BINDING';
      else if (!selected) code = 'DANGLING_VARIABLE_BINDING';
      else if (!supportsVariable(policy, selected)) {
        code = 'INCOMPATIBLE_VARIABLE_TYPE';
      } else if (
        requiresOwnedVariableParentAgreement(policy)
        && selected.ownerInstructionId !== null
        && selected.ownerInstructionId !== instruction.parentId
      ) {
        code = 'VARIABLE_OWNER_PARENT_MISMATCH';
      }
      relationshipEdges.push(edge(
        owner,
        'VARIABLE_BINDING',
        source,
        code === null && selected
          ? variableTarget(owner, selected.id)
          : null,
        code === null ? 'CONNECTED' : 'RECONNECT_VARIABLE',
        code,
        true,
        candidates.map(variable => variableTarget(owner, variable.id)),
      ));
    }

    if (
      policy.requirements.includes('VARIABLE_ORDER')
      && instruction.variableId !== null
      && variablesById.has(instruction.variableId)
    ) {
      const writers = instructions.filter(candidate =>
        candidate.variableId === instruction.variableId
        && writesRuntimeVariableValue(candidate.actions)
        && isEffectivelyActive(candidate));
      const precedingWriters = writers.filter(writer =>
        isBefore(writer, instruction));
      const selected = precedingWriters[precedingWriters.length - 1] ?? null;
      const code = selected !== null
        ? null
        : writers.length > 0
          ? 'RUNTIME_VALUE_WRITER_AFTER_READER'
          : 'MISSING_RUNTIME_VALUE_WRITER';
      relationshipEdges.push(edge(
        owner,
        'VARIABLE_ORDER',
        source,
        selected ? instructionTarget(owner, selected.id) : null,
        selected ? 'CONNECTED' : 'FIX_ORDER',
        code,
        true,
        writers.map(writer => instructionTarget(owner, writer.id)),
      ));
    }

    if (policy.requirements.includes('LOOP_ANCHOR')) {
      const candidates = instructions.filter(candidate =>
        candidate.blockId === instruction.blockId
        && isBefore(candidate, instruction)
        && instructionRelationshipPolicy(candidate.actions).role === 'WEB_ELEMENT');
      const selected = instruction.parentId === null
        ? null
        : instructionsById.get(instruction.parentId) ?? null;
      let code: string | null = null;
      if (instruction.parentId === null) code = 'MISSING_LOOP_ANCHOR';
      else if (!selected) code = 'DANGLING_LOOP_ANCHOR';
      else if (selected.blockId !== instruction.blockId) code = 'LOOP_ANCHOR_WRONG_BLOCK';
      else if (
        instructionRelationshipPolicy(selected.actions).role !== 'WEB_ELEMENT'
      ) {
        code = 'INCOMPATIBLE_LOOP_ANCHOR';
      } else if (!isBefore(selected, instruction)) code = 'LOOP_ANCHOR_ORDER';
      relationshipEdges.push(edge(
        owner,
        'LOOP_ANCHOR',
        source,
        selected && (code === null || code === 'LOOP_ANCHOR_ORDER')
          ? instructionTarget(owner, selected.id)
          : null,
        code === null
          ? 'CONNECTED'
          : code === 'LOOP_ANCHOR_ORDER'
            ? 'FIX_ORDER'
            : 'RECONNECT_LOOP',
        code,
        true,
        candidates.map(candidate => instructionTarget(owner, candidate.id)),
      ));

      if (code === null && selected) {
        const rows = rowsByBlock.get(instruction.blockId) ?? [];
        const start = rows.findIndex(row => row.id === selected.id);
        const end = rows.findIndex(row => row.id === instruction.id);
        rows.slice(start + 1, end).forEach((body) => {
          relationshipEdges.push(edge(
            owner,
            'POSITIONAL_SCOPE',
            instructionTarget(owner, body.id),
            source,
            'CONNECTED',
            null,
            false,
            [],
            `LOOP:${instruction.id}`,
          ));
        });
      }
    }

    if (policy.requirements.includes('CONDITIONAL_ROOT')) {
      const state = conditionalState.get(instruction.id) ?? {
        targetId: null,
        code: 'ORPHAN_CONDITIONAL_BOUNDARY',
      };
      relationshipEdges.push(edge(
        owner,
        'CONDITIONAL_ROOT',
        source,
        state.targetId === null
          ? null
          : instructionTarget(owner, state.targetId),
        state.code === null ? 'CONNECTED' : 'REPAIR_CONDITIONAL',
        state.code,
        true,
        policy.structuralSemantics === 'CONDITIONAL_ROOT'
          ? [source]
          : instructions
            .filter(candidate =>
              candidate.blockId === instruction.blockId
              && isBefore(candidate, instruction)
              && instructionRelationshipPolicy(candidate.actions)
                .structuralSemantics === 'CONDITIONAL_ROOT')
            .map(candidate => instructionTarget(owner, candidate.id)),
      ));
    }

    if (policy.requirements.includes('BLOCK_TARGET')) {
      const candidates = blocks
        .filter(block => block.id !== instruction.blockId)
        .map(block => blockTarget(owner, block.id));
      const selected = instruction.parentBlockId === null
        ? null
        : blocksById.get(instruction.parentBlockId) ?? null;
      const code = instruction.parentBlockId === null
        ? 'MISSING_BLOCK_TARGET'
        : selected === null
          ? 'DANGLING_BLOCK_TARGET'
          : selected.id === instruction.blockId
            ? 'BLOCK_TARGET_EQUALS_CONTAINING_BLOCK'
          : null;
      relationshipEdges.push(edge(
        owner,
        'BLOCK_TARGET',
        source,
        selected && code === null ? blockTarget(owner, selected.id) : null,
        code === null ? 'CONNECTED' : 'RECONNECT_BLOCK',
        code,
        true,
        candidates,
      ));
    }
  });

  conditionalScopes.forEach(({ instructionId, rootId }) => {
    relationshipEdges.push(edge(
      owner,
      'POSITIONAL_SCOPE',
      instructionTarget(owner, instructionId),
      instructionTarget(owner, rootId),
      'CONNECTED',
      null,
      false,
      [],
      `IF:${rootId}`,
    ));
  });

  const ownerCandidates = instructions
    .filter(instruction =>
      instructionRelationshipPolicy(instruction.actions).role === 'WEB_ELEMENT')
    .map(instruction => instructionTarget(owner, instruction.id));
  variables.forEach((variable) => {
    const source = variableTarget(owner, variable.id);
    if (variable.ownerInstructionId === null) {
      relationshipEdges.push(edge(
        owner,
        'VARIABLE_OWNER',
        source,
        null,
        'MEMORY_ONLY',
        null,
        false,
        ownerCandidates,
      ));
      return;
    }
    const selected = instructionsById.get(variable.ownerInstructionId) ?? null;
    const compatible = selected !== null
      && instructionRelationshipPolicy(selected.actions).role === 'WEB_ELEMENT';
    relationshipEdges.push(edge(
      owner,
      'VARIABLE_OWNER',
      source,
      compatible ? instructionTarget(owner, selected.id) : null,
      compatible ? 'CONNECTED' : 'RECONNECT_PARENT',
      selected === null
        ? 'DANGLING_VARIABLE_OWNER'
        : compatible
          ? null
          : 'INCOMPATIBLE_VARIABLE_OWNER',
      false,
      ownerCandidates,
    ));
  });

  relationshipEdges.forEach((item) => {
    item.compatibleTargets = sortedTargets(
      item.compatibleTargets,
      instructionOrder,
      blockOrder,
    );
  });
  relationshipEdges.sort((left, right) => {
    const instructionRank = (target: RelationshipTarget): number =>
      target.entity === 'INSTRUCTION'
        ? instructionOrder.get(target.id) ?? Number.MAX_SAFE_INTEGER
        : target.entity === 'BLOCK'
          ? 1_000_000 + (blockOrder.get(target.id) ?? target.id)
          : 2_000_000 + target.id;
    return instructionRank(left.source) - instructionRank(right.source)
      || KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
      || left.id.localeCompare(right.id);
  });

  const issues: InstructionRelationshipIssue[] = relationshipEdges
    .filter((item): item is InstructionRelationshipEdge & {
      code: string;
      state: Exclude<DerivedRelationshipState, 'CONNECTED' | 'MEMORY_ONLY'>;
    } => item.code !== null
      && item.state !== 'CONNECTED'
      && item.state !== 'MEMORY_ONLY')
    .map(item => ({
      edgeId: item.id,
      code: item.code,
      kind: item.kind,
      source: item.source,
      state: item.state,
    }));

  return {
    owner,
    instructions,
    blocks,
    variables,
    edges: relationshipEdges,
    issues,
  };
};
