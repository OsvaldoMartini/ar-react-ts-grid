import React, {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from 'react';
import {
  Boxes,
  GripVertical,
  Link2,
  Search,
  Unplug,
  Variable,
} from 'lucide-react';
import { RulesCard, type RulesCardEvent } from '../RulesCard';
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import type {
  InstructionRelationshipEdge,
} from '../bot-job-details/grid/domain/instructionRelationshipGraph';
import { instructionRelationshipPolicy } from '../bot-job-details/grid/domain/instructionRelationshipPolicy';
import type {
  VariableInstructionNode,
  VariableWorkspaceBlock,
} from '../variablesWorkspace.contract';
import styles from './VariablesCommandBoard.module.scss';

export type VariablesCommandDropTarget = {
  blockId: number;
  index: number;
};

export type VariablesConnectionScope = {
  instructionIds: readonly number[];
  visibleCount: number;
  totalCount: number;
  commandSearch: string;
  blockId: number | null;
  blockLabel: string;
  label: string;
};

export interface VariablesCommandBoardProps {
  blocks: readonly VariableWorkspaceBlock[];
  instructions: readonly VariableInstructionNode[];
  relationshipEdges?: readonly InstructionRelationshipEdge[];
  disabled?: boolean;
  unavailableReason?: string;
  selectedInstructionId?: number | null;
  draggingInstructionId?: number | null;
  activeDropTarget?: VariablesCommandDropTarget | null;
  canDragInstruction?: (instruction: VariableInstructionNode) => boolean;
  onSelectInstruction?: (instructionId: number) => void;
  onInstructionDragStart?: (
    event: DragEvent<HTMLElement>,
    instruction: VariableInstructionNode,
  ) => void;
  onInstructionDragEnd?: (
    event: DragEvent<HTMLElement>,
    instruction: VariableInstructionNode,
  ) => void;
  onDropTargetDragOver?: (
    event: DragEvent<HTMLElement>,
    target: VariablesCommandDropTarget,
  ) => void;
  onDropTargetDragLeave?: (
    event: DragEvent<HTMLElement>,
    target: VariablesCommandDropTarget,
  ) => void;
  onDropTarget?: (
    event: DragEvent<HTMLElement>,
    target: VariablesCommandDropTarget,
  ) => void;
  onReconnectParent?: (
    instructionId: number,
    edge?: InstructionRelationshipEdge,
  ) => void;
  onReconnectVariable?: (
    instructionId: number,
    edge?: InstructionRelationshipEdge,
  ) => void;
  onResolveVisibleConnections?: (scope: VariablesConnectionScope) => void;
  onReleaseVisibleConnections?: (scope: VariablesConnectionScope) => void;
  className?: string;
}

type CommandGroup = {
  block: VariableWorkspaceBlock | null;
  blockId: number | null;
  blockName: string;
  blockOrder: number | null;
  blockActive: boolean | null;
  instructions: VariableInstructionNode[];
};

const instructionOrder = (
  left: VariableInstructionNode,
  right: VariableInstructionNode,
): number =>
  (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  || (left.id ?? Number.MAX_SAFE_INTEGER)
  - (right.id ?? Number.MAX_SAFE_INTEGER);

const groupOrder = (left: CommandGroup, right: CommandGroup): number =>
  (left.blockOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.blockOrder ?? Number.MAX_SAFE_INTEGER)
  || (left.blockId ?? Number.MAX_SAFE_INTEGER)
  - (right.blockId ?? Number.MAX_SAFE_INTEGER);

const relationshipByInstruction = (
  edges: readonly InstructionRelationshipEdge[],
): Map<number, InstructionRelationshipEdge[]> => {
  const result = new Map<number, InstructionRelationshipEdge[]>();
  edges.forEach((edge) => {
    if (edge.source.entity !== 'INSTRUCTION') return;
    const current = result.get(edge.source.id) ?? [];
    current.push(edge);
    result.set(edge.source.id, current);
  });
  return result;
};

const relationshipTitle = (
  label: string,
  edge: InstructionRelationshipEdge | undefined,
): string => {
  if (!edge?.code) return label;
  const detail = edge.code
    .toLocaleLowerCase()
    .replaceAll('_', ' ');
  return `${label}: ${detail}`;
};

const VariablesCommandBoard: React.FC<VariablesCommandBoardProps> = ({
  blocks,
  instructions,
  relationshipEdges = [],
  disabled = false,
  unavailableReason,
  selectedInstructionId = null,
  draggingInstructionId = null,
  activeDropTarget = null,
  canDragInstruction,
  onSelectInstruction,
  onInstructionDragStart,
  onInstructionDragEnd,
  onDropTargetDragOver,
  onDropTargetDragLeave,
  onDropTarget,
  onReconnectParent,
  onReconnectVariable,
  onResolveVisibleConnections,
  onReleaseVisibleConnections,
  className,
}) => {
  const [commandSearch, setCommandSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState<number | null>(null);
  const commandSearchActive = commandSearch.trim().length > 0;

  useEffect(() => {
    if (
      blockFilter !== null
      && !blocks.some(block => block.id === blockFilter)
    ) {
      setBlockFilter(null);
    }
  }, [blockFilter, blocks]);

  const blockSearchOptions = useMemo<SearchBoxOption[]>(() => {
    const commandCounts = new Map<number, number>();
    instructions.forEach((instruction) => {
      if (instruction.blockId === null) return;
      commandCounts.set(
        instruction.blockId,
        (commandCounts.get(instruction.blockId) ?? 0) + 1,
      );
    });
    return blocks.map(block => ({
      value: String(block.id),
      label: `#${block.order ?? block.id} ${block.name}`,
      sublabel: `${commandCounts.get(block.id) ?? 0} command(s) · block ID ${block.id}`,
      badges: [block.active === false
        ? { text: 'INACTIVE', tone: 'red' as const }
        : { text: 'ACTIVE', tone: 'green' as const }],
      keywords: String(block.id),
    }));
  }, [blocks, instructions]);

  const visibleInstructions = useMemo(() => {
    const tokens = commandSearch
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return instructions.filter((instruction) => {
      if (blockFilter !== null && instruction.blockId !== blockFilter) {
        return false;
      }
      if (tokens.length === 0) return true;
      const haystack = [
        instruction.id,
        instruction.name,
        instruction.command,
        instruction.operation,
        instruction.tagName,
        instruction.blockId,
        instruction.blockName,
        instruction.blockOrder,
        instruction.instructionOrder,
        instruction.parentId,
        instruction.parentBlockId,
        instruction.variableId,
      ]
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLocaleLowerCase();
      return tokens.every(token => haystack.includes(token));
    });
  }, [blockFilter, commandSearch, instructions]);

  const visibleConnectionScope = useMemo<VariablesConnectionScope>(() => {
    const selectedBlock = blockFilter === null
      ? null
      : blocks.find(block => block.id === blockFilter) ?? null;
    const blockLabel = selectedBlock
      ? `Block #${selectedBlock.order ?? selectedBlock.id} ${selectedBlock.name}`
      : 'All Blocks';
    const normalizedSearch = commandSearch.trim();
    const instructionIds = Array.from(new Set(
      visibleInstructions.flatMap(instruction =>
        instruction.id !== null
        && Number.isSafeInteger(instruction.id)
        && instruction.id > 0
          ? [instruction.id]
          : []),
    ));
    return {
      instructionIds,
      visibleCount: instructionIds.length,
      totalCount: instructions.length,
      commandSearch: normalizedSearch,
      blockId: blockFilter,
      blockLabel,
      label: [
        blockLabel,
        normalizedSearch ? `Search "${normalizedSearch}"` : null,
        `${instructionIds.length} visible command${instructionIds.length === 1 ? '' : 's'}`,
      ].filter(Boolean).join(' · '),
    };
  }, [
    blockFilter,
    blocks,
    commandSearch,
    instructions.length,
    visibleInstructions,
  ]);

  const resolveConnectionsEvent = useMemo<RulesCardEvent>(() => ({
    color: 'green',
    rules: 'RESOLVE ALL CONNECTIONS',
    ts: 0,
  }), []);
  const releaseConnectionsEvent = useMemo<RulesCardEvent>(() => ({
    color: 'red',
    rules: 'RELEASE ALL CONNECTIONS',
    ts: 0,
  }), []);

  const groups = useMemo<CommandGroup[]>(() => {
    const byBlock = new Map<number, CommandGroup>();
    blocks
      .filter(block => blockFilter === null || block.id === blockFilter)
      .forEach((block) => {
      byBlock.set(block.id, {
        block,
        blockId: block.id,
        blockName: block.name || `Block ${block.id}`,
        blockOrder: block.order,
        blockActive: block.active,
        instructions: [],
      });
    });

    const unassigned: CommandGroup = {
      block: null,
      blockId: null,
      blockName: 'Unassigned commands',
      blockOrder: null,
      blockActive: null,
      instructions: [],
    };

    visibleInstructions.forEach((instruction) => {
      if (instruction.blockId === null) {
        unassigned.instructions.push(instruction);
        return;
      }
      const existing = byBlock.get(instruction.blockId);
      if (existing) {
        existing.instructions.push(instruction);
        return;
      }
      byBlock.set(instruction.blockId, {
        block: null,
        blockId: instruction.blockId,
        blockName: instruction.blockName || `Block ${instruction.blockId}`,
        blockOrder: instruction.blockOrder,
        blockActive: instruction.blockActive,
        instructions: [instruction],
      });
    });

    const result = [...byBlock.values()]
      .map(group => ({
        ...group,
        instructions: [...group.instructions].sort(instructionOrder),
      }))
      .filter(group => !commandSearchActive || group.instructions.length > 0)
      .sort(groupOrder);
    if (unassigned.instructions.length > 0) {
      result.push({
        ...unassigned,
        instructions: unassigned.instructions.sort(instructionOrder),
      });
    }
    return result;
  }, [
    blockFilter,
    blocks,
    commandSearchActive,
    visibleInstructions,
  ]);

  const edgesByInstruction = useMemo(
    () => relationshipByInstruction(relationshipEdges),
    [relationshipEdges],
  );

  const dropGap = (
    blockId: number,
    index: number,
    key: string,
  ) => {
    const target = { blockId, index };
    const active = activeDropTarget?.blockId === blockId
      && activeDropTarget.index === index;
    return (
      <div
        key={key}
        className={`${styles.dropGap} ${active ? styles.dropGapActive : ''}`}
        data-drop-block-id={blockId}
        data-drop-index={index}
        onDragOver={event => onDropTargetDragOver?.(event, target)}
        onDragLeave={event => onDropTargetDragLeave?.(event, target)}
        onDrop={event => onDropTarget?.(event, target)}
      >
        <span>{active ? 'Release to move here' : ''}</span>
      </div>
    );
  };

  return (
    <section
      className={[styles.board, className ?? ''].filter(Boolean).join(' ')}
      aria-label="All Bot Job commands by block"
    >
      <header className={styles.boardHeader}>
        <div className={styles.boardIdentity}>
          <span className={styles.eyebrow}>Complete instruction sequence</span>
          <h2>
            <Boxes size={17} aria-hidden="true" />
            All commands
          </h2>
          <p>Every command remains visible, including disconnected relationships.</p>
          <div className={styles.boardFilters}>
            <label className={styles.commandSearch}>
              <span>Commands</span>
              <span className={styles.commandSearchShell}>
                <Search size={14} aria-hidden="true" />
                <input
                  type="search"
                  value={commandSearch}
                  aria-label="Search commands"
                  placeholder="Search command, name, ID..."
                  onChange={event => setCommandSearch(event.target.value)}
                />
              </span>
            </label>
            <SearchBox
              label="Block"
              placeholder="Search block name or number..."
              headerRight="Commands per block"
              countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
              allOptionLabel="All blocks"
              options={blockSearchOptions}
              value={blockFilter === null ? null : String(blockFilter)}
              onChange={value =>
                setBlockFilter(value === null ? null : Number(value))}
            />
          </div>
          {(onResolveVisibleConnections || onReleaseVisibleConnections) && (
            <div
              className={styles.connectionActions}
              aria-label="Visible command connection actions"
            >
              {onResolveVisibleConnections && (
                <RulesCard
                  event={resolveConnectionsEvent}
                  animate={false}
                  pulse={false}
                  glow={false}
                  onClick={() =>
                    onResolveVisibleConnections(visibleConnectionScope)}
                  disabled={disabled || visibleConnectionScope.visibleCount === 0}
                  title={`Resolve connections for ${visibleConnectionScope.label}`}
                />
              )}
              {onReleaseVisibleConnections && (
                <RulesCard
                  event={releaseConnectionsEvent}
                  animate={false}
                  pulse={false}
                  glow={false}
                  onClick={() =>
                    onReleaseVisibleConnections(visibleConnectionScope)}
                  disabled={disabled || visibleConnectionScope.visibleCount === 0}
                  title={`Release connections for ${visibleConnectionScope.label}`}
                />
              )}
            </div>
          )}
        </div>
        <div className={styles.boardStatus}>
          <span className={styles.count}>
            {visibleInstructions.length}
            {visibleInstructions.length !== instructions.length
              ? ` / ${instructions.length}`
              : ''}
          </span>
          {(disabled || commandSearchActive) && (
            <small title={unavailableReason}>
              {commandSearchActive
                ? 'Clear command search to move rows'
                : unavailableReason || 'Movement unavailable'}
            </small>
          )}
        </div>
      </header>

      <div className={styles.blockScroll}>
        {groups.map((group) => (
          <section
            key={`command-block:${group.blockId ?? 'unassigned'}`}
            className={styles.block}
            data-block-id={group.blockId ?? undefined}
          >
            <header className={styles.blockHeader}>
              <div>
                <span>
                  {group.blockOrder !== null
                    ? `Block #${group.blockOrder}`
                    : 'Block unavailable'}
                </span>
                <h3 title={group.blockName}>{group.blockName}</h3>
              </div>
              <div className={styles.blockMeta}>
                {group.blockActive === false && (
                  <span className={styles.inactiveBadge}>Inactive</span>
                )}
                <b>{group.instructions.length}</b>
              </div>
            </header>

            <div className={styles.rows}>
              {group.blockId !== null
                && !commandSearchActive
                && dropGap(group.blockId, 0, `drop:${group.blockId}:0`)}
              {group.instructions.map((instruction, index) => {
                const instructionId = instruction.id;
                const policy = instructionRelationshipPolicy(instruction.command);
                const edges = instructionId === null
                  ? []
                  : edgesByInstruction.get(instructionId) ?? [];
                const elementParentEdge = edges.find(edge =>
                  edge.kind === 'ELEMENT_TARGET'
                  && edge.source.entity === 'INSTRUCTION'
                  && edge.source.id === instructionId);
                const otherParentEdge = edges.find(edge =>
                  edge.state !== 'CONNECTED'
                  && edge.state !== 'MEMORY_ONLY'
                  && (
                    edge.kind === 'LOOP_ANCHOR'
                    || edge.kind === 'CONDITIONAL_ROOT'
                    || edge.kind === 'BLOCK_TARGET'
                  ));
                const variableBindingEdge = edges.find(edge =>
                  edge.kind === 'VARIABLE_BINDING'
                  && edge.source.entity === 'INSTRUCTION'
                  && edge.source.id === instructionId);
                const requiresElementParent =
                  policy.requirements.includes('ELEMENT_TARGET');
                const requiresVariableBinding =
                  policy.requirements.includes('VARIABLE_BINDING');
                const configuredParentId =
                  typeof instruction.parentId === 'number'
                  && Number.isSafeInteger(instruction.parentId)
                  && instruction.parentId > 0
                    ? instruction.parentId
                    : null;
                // The graph wins whenever it supplies an edge. Falling back to
                // the DTO is only for workspaces without graph capabilities.
                const connectedParentId = elementParentEdge
                  ? elementParentEdge.state === 'CONNECTED'
                    && elementParentEdge.target?.entity === 'INSTRUCTION'
                    && Number.isSafeInteger(elementParentEdge.target.id)
                    && elementParentEdge.target.id > 0
                      ? elementParentEdge.target.id
                      : null
                  : requiresElementParent
                    ? configuredParentId
                    : null;
                const reconnectParent =
                  requiresElementParent && connectedParentId === null;
                const configuredVariableId =
                  typeof instruction.variableId === 'number'
                  && Number.isSafeInteger(instruction.variableId)
                  && instruction.variableId > 0
                    ? instruction.variableId
                    : null;
                const connectedVariableId = variableBindingEdge
                  ? variableBindingEdge.state === 'CONNECTED'
                    && variableBindingEdge.target?.entity === 'VARIABLE'
                    && Number.isSafeInteger(variableBindingEdge.target.id)
                    && variableBindingEdge.target.id > 0
                      ? variableBindingEdge.target.id
                      : null
                  : requiresVariableBinding
                    ? configuredVariableId
                    : null;
                const reconnectOtherParent = Boolean(
                  otherParentEdge
                  || (
                    instruction.parentId === null
                    && (
                      policy.requirements.includes('LOOP_ANCHOR')
                      || policy.requirements.includes('CONDITIONAL_ROOT')
                    )
                  )
                  || (
                    instruction.parentBlockId === null
                    && policy.requirements.includes('BLOCK_TARGET')
                  ),
                );
                const reconnectParentEvent: RulesCardEvent | null =
                  reconnectParent
                    ? {
                        color: 'red',
                        rules: 'Reconnect Parent',
                        context: '',
                        ts: instructionId ?? index,
                      }
                    : null;
                const reconnectVariable =
                  requiresVariableBinding && connectedVariableId === null;
                const reconnectVariableEvent: RulesCardEvent | null =
                  reconnectVariable
                    ? {
                        color: 'red',
                        rules: 'Reconnect Variable',
                        context: '',
                        ts: instructionId ?? index,
                      }
                    : null;
                const canDrag = instructionId !== null
                  && !disabled
                  && !commandSearchActive
                  && Boolean(onInstructionDragStart)
                  && (canDragInstruction?.(instruction) ?? true);
                const selected = instructionId !== null
                  && instructionId === selectedInstructionId;
                const dragging = instructionId !== null
                  && instructionId === draggingInstructionId;
                const inactive = instruction.active === false
                  || instruction.blockActive === false;

                return (
                  <React.Fragment
                    key={`command:${instructionId ?? `${group.blockId}:${index}`}`}
                  >
                    <article
                      className={[
                        styles.row,
                        selected ? styles.rowSelected : '',
                        dragging ? styles.rowDragging : '',
                        canDrag ? '' : styles.rowLocked,
                      ].filter(Boolean).join(' ')}
                      draggable={canDrag}
                      data-instruction-id={instructionId ?? undefined}
                      onDragStart={event =>
                        onInstructionDragStart?.(event, instruction)}
                      onDragEnd={event =>
                        onInstructionDragEnd?.(event, instruction)}
                    >
                      <span className={styles.grip} aria-hidden="true">
                        <GripVertical size={16} />
                      </span>
                      <span className={styles.order}>
                        #{instruction.instructionOrder ?? '?'}
                      </span>
                      <span className={styles.command}>
                        {instruction.command || 'UNKNOWN'}
                      </span>
                      <button
                        type="button"
                        className={styles.identity}
                        disabled={instructionId === null || !onSelectInstruction}
                        aria-pressed={selected}
                        onClick={() => {
                          if (instructionId !== null) {
                            onSelectInstruction?.(instructionId);
                          }
                        }}
                      >
                        <strong title={instruction.name}>
                          {instruction.name || 'Unnamed instruction'}
                        </strong>
                        <small>
                          {instructionId === null ? 'Missing ID' : `ID ${instructionId}`}
                        </small>
                      </button>
                      <div className={styles.relationships}>
                        {reconnectParentEvent && instructionId !== null && (
                          <span
                            className={styles.reconnectRuleCard}
                            onMouseDown={event => event.stopPropagation()}
                          >
                            <RulesCard
                              event={reconnectParentEvent}
                              ariaLabel={relationshipTitle(
                                'Reconnect parent',
                                elementParentEdge,
                              )}
                              glow
                              border
                              animate={false}
                              pulse
                              iconNode={<Link2 size={11} aria-hidden="true" />}
                              title={relationshipTitle(
                                'Reconnect parent',
                                elementParentEdge,
                              )}
                              disabled={disabled || !onReconnectParent}
                              onClick={onReconnectParent
                                ? () => onReconnectParent(
                                    instructionId,
                                    elementParentEdge,
                                  )
                                : undefined}
                            />
                          </span>
                        )}
                        {connectedParentId !== null && instructionId !== null && (
                          elementParentEdge && onReconnectParent
                            ? (
                                <button
                                  type="button"
                                  className={styles.connectedParent}
                                  aria-label={`Parent connected (id: ${connectedParentId})`}
                                  title="Change connected Web Element"
                                  disabled={disabled}
                                  onMouseDown={event => event.stopPropagation()}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onReconnectParent(
                                      instructionId,
                                      elementParentEdge,
                                    );
                                  }}
                                >
                                  <Link2 size={11} aria-hidden="true" />
                                  Parent connected (id: {connectedParentId})
                                </button>
                              )
                            : (
                                <span
                                  className={`${styles.connectedParent} ${styles.connectedStatic}`}
                                  aria-label={`Parent connected (id: ${connectedParentId})`}
                                  title={`Parent connected (id: ${connectedParentId})`}
                                >
                                  <Link2 size={11} aria-hidden="true" />
                                  Parent connected (id: {connectedParentId})
                                </span>
                              )
                        )}
                        {reconnectOtherParent && instructionId !== null && (
                          <button
                            type="button"
                            className={styles.reconnectButton}
                            disabled={disabled || !onReconnectParent}
                            title={relationshipTitle(
                              'Reconnect parent',
                              otherParentEdge,
                            )}
                            onMouseDown={event => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              onReconnectParent?.(
                                instructionId,
                                otherParentEdge,
                              );
                            }}
                          >
                            <Link2 size={11} aria-hidden="true" />
                            Reconnect parent
                          </button>
                        )}
                        {reconnectVariableEvent && instructionId !== null && (
                          <span
                            className={styles.reconnectRuleCard}
                            onMouseDown={event => event.stopPropagation()}
                          >
                            <RulesCard
                              event={reconnectVariableEvent}
                              ariaLabel={relationshipTitle(
                                'Reconnect variable',
                                variableBindingEdge,
                              )}
                              glow
                              border
                              animate={false}
                              pulse
                              iconNode={<Variable size={11} aria-hidden="true" />}
                              title={relationshipTitle(
                                'Reconnect variable',
                                variableBindingEdge,
                              )}
                              disabled={disabled || !onReconnectVariable}
                              onClick={onReconnectVariable
                                ? () => onReconnectVariable(
                                    instructionId,
                                    variableBindingEdge,
                                  )
                                : undefined}
                            />
                          </span>
                        )}
                        {connectedVariableId !== null && instructionId !== null && (
                          variableBindingEdge && onReconnectVariable
                            ? (
                                <button
                                  type="button"
                                  className={`${styles.connectedVariable} ${styles.variableButton}`}
                                  aria-label={`Variable connected (id: ${connectedVariableId})`}
                                  title="Change connected variable"
                                  disabled={disabled}
                                  onMouseDown={event => event.stopPropagation()}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onReconnectVariable(
                                      instructionId,
                                      variableBindingEdge,
                                    );
                                  }}
                                >
                                  <Variable size={11} aria-hidden="true" />
                                  Variable connected (id: {connectedVariableId})
                                </button>
                              )
                            : (
                                <span
                                  className={`${styles.connectedVariable} ${styles.variableButton} ${styles.connectedStatic}`}
                                  aria-label={`Variable connected (id: ${connectedVariableId})`}
                                  title={`Variable connected (id: ${connectedVariableId})`}
                                >
                                  <Variable size={11} aria-hidden="true" />
                                  Variable connected (id: {connectedVariableId})
                                </span>
                              )
                        )}
                        {!requiresVariableBinding
                          && instruction.variableId !== null && (
                          <span
                            className={styles.variableBadge}
                            title={`Connected variable ID ${instruction.variableId}`}
                          >
                            <Variable size={10} aria-hidden="true" />
                            {instruction.variableId}
                          </span>
                          )}
                        {!reconnectParent
                          && !reconnectOtherParent
                          && !reconnectVariable
                          && instruction.parentId === null
                          && instruction.variableId === null
                          && (
                            <span className={styles.independentBadge}>
                              <Unplug size={10} aria-hidden="true" />
                              Independent
                            </span>
                          )}
                        {inactive && (
                          <span className={styles.inactiveBadge}>Inactive</span>
                        )}
                      </div>
                    </article>
                    {group.blockId !== null
                      && !commandSearchActive
                      && dropGap(
                        group.blockId,
                        index + 1,
                        `drop:${group.blockId}:${index + 1}`,
                      )}
                  </React.Fragment>
                );
              })}
              {group.instructions.length === 0 && (
                <div className={styles.emptyBlock}>
                  Empty block - drop a command here.
                </div>
              )}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <div className={styles.emptyBoard} role="status">
            No Bot Job blocks or commands are available.
          </div>
        )}
      </div>
    </section>
  );
};

export default VariablesCommandBoard;
