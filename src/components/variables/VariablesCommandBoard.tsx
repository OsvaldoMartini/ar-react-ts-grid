import React, { useMemo, type DragEvent } from 'react';
import {
  Boxes,
  GripVertical,
  Link2,
  Unplug,
  Variable,
} from 'lucide-react';
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
  className,
}) => {
  const groups = useMemo<CommandGroup[]>(() => {
    const byBlock = new Map<number, CommandGroup>();
    blocks.forEach((block) => {
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

    instructions.forEach((instruction) => {
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
      .sort(groupOrder);
    if (unassigned.instructions.length > 0) {
      result.push({
        ...unassigned,
        instructions: unassigned.instructions.sort(instructionOrder),
      });
    }
    return result;
  }, [blocks, instructions]);

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
        <div>
          <span className={styles.eyebrow}>Complete instruction sequence</span>
          <h2>
            <Boxes size={17} aria-hidden="true" />
            All commands
          </h2>
          <p>Every command remains visible, including disconnected relationships.</p>
        </div>
        <div className={styles.boardStatus}>
          <span className={styles.count}>{instructions.length}</span>
          {disabled && (
            <small title={unavailableReason}>
              {unavailableReason || 'Movement unavailable'}
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
                && dropGap(group.blockId, 0, `drop:${group.blockId}:0`)}
              {group.instructions.map((instruction, index) => {
                const instructionId = instruction.id;
                const policy = instructionRelationshipPolicy(instruction.command);
                const edges = instructionId === null
                  ? []
                  : edgesByInstruction.get(instructionId) ?? [];
                const parentEdge = edges.find(edge =>
                  edge.state !== 'CONNECTED'
                  && edge.state !== 'MEMORY_ONLY'
                  && (
                    edge.kind === 'ELEMENT_TARGET'
                    || edge.kind === 'LOOP_ANCHOR'
                    || edge.kind === 'CONDITIONAL_ROOT'
                    || edge.kind === 'BLOCK_TARGET'
                  ));
                const variableEdge = edges.find(edge =>
                  edge.state === 'RECONNECT_VARIABLE'
                  && edge.kind === 'VARIABLE_BINDING');
                const reconnectParent = Boolean(
                  parentEdge
                  || (
                    (
                      instruction.parentId === null
                      && (
                        policy.requirements.includes('ELEMENT_TARGET')
                        || policy.requirements.includes('LOOP_ANCHOR')
                        || policy.requirements.includes('CONDITIONAL_ROOT')
                      )
                    )
                    || (
                      instruction.parentBlockId === null
                      && policy.requirements.includes('BLOCK_TARGET')
                    )
                  ),
                );
                const reconnectVariable = Boolean(
                  variableEdge
                  || (
                    instruction.variableId === null
                    && policy.requirements.includes('VARIABLE_BINDING')
                  ),
                );
                const canDrag = instructionId !== null
                  && !disabled
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
                        {reconnectParent && instructionId !== null && (
                          <button
                            type="button"
                            className={styles.reconnectButton}
                            disabled={disabled || !onReconnectParent}
                            title={relationshipTitle('Reconnect parent', parentEdge)}
                            onMouseDown={event => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              onReconnectParent?.(instructionId, parentEdge);
                            }}
                          >
                            <Link2 size={11} aria-hidden="true" />
                            Reconnect parent
                          </button>
                        )}
                        {reconnectVariable && instructionId !== null && (
                          <button
                            type="button"
                            className={`${styles.reconnectButton} ${styles.variableButton}`}
                            disabled={disabled || !onReconnectVariable}
                            title={relationshipTitle('Reconnect variable', variableEdge)}
                            onMouseDown={event => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              onReconnectVariable?.(instructionId, variableEdge);
                            }}
                          >
                            <Variable size={11} aria-hidden="true" />
                            Reconnect variable
                          </button>
                        )}
                        {!reconnectVariable && instruction.variableId !== null && (
                          <span
                            className={styles.variableBadge}
                            title={`Connected variable ID ${instruction.variableId}`}
                          >
                            <Variable size={10} aria-hidden="true" />
                            {instruction.variableId}
                          </span>
                        )}
                        {!reconnectParent
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
