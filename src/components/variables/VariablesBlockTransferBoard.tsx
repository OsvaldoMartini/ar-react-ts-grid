import React, {
  useMemo,
  useState,
  type DragEvent,
} from 'react';
import {
  Boxes,
  GripVertical,
} from 'lucide-react';
import type { InstructionGraphLayoutRow } from '../bot-job-details/grid/domain/instructionGraphMutation.contract';
import type { VariableWorkspaceBlock } from '../variablesWorkspace.contract';
import styles from './VariablesBlockTransferBoard.module.scss';

export const VARIABLES_INSTRUCTION_DRAG_MIME =
  'application/x-ar-variables-instruction';

export type VariablesBlockTransferIntent = {
  sourceInstructionId: number;
  targetBlockId: number;
};

export type VariablesBlockTransferBoardProps = {
  blocks: readonly VariableWorkspaceBlock[];
  layoutRows: readonly InstructionGraphLayoutRow[];
  disabled?: boolean;
  unavailableReason?: string;
  onTransferIntent: (intent: VariablesBlockTransferIntent) => void;
};

type BlockPresentation = {
  block: VariableWorkspaceBlock;
  instructionCount: number;
};

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number'
  && Number.isSafeInteger(value)
  && value > 0;

const acceptsInstruction = (event: DragEvent<HTMLElement>): boolean =>
  Array.from(event.dataTransfer.types ?? [])
    .includes(VARIABLES_INSTRUCTION_DRAG_MIME);

const VariablesBlockTransferBoard: React.FC<
VariablesBlockTransferBoardProps
> = ({
  blocks,
  layoutRows,
  disabled = false,
  unavailableReason,
  onTransferIntent,
}) => {
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const presentations = useMemo<BlockPresentation[]>(() => {
    const countByBlock = new Map<number, number>();
    layoutRows.forEach((row) => {
      countByBlock.set(row.blockId, (countByBlock.get(row.blockId) ?? 0) + 1);
    });
    return [...blocks]
      .sort((left, right) =>
        (left.order ?? Number.MAX_SAFE_INTEGER)
        - (right.order ?? Number.MAX_SAFE_INTEGER)
        || left.id - right.id)
      .map(block => ({
        block,
        instructionCount: countByBlock.get(block.id) ?? 0,
      }));
  }, [blocks, layoutRows]);

  const handleDragOver = (
    event: DragEvent<HTMLElement>,
    blockId: number,
  ) => {
    if (disabled || !acceptsInstruction(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setActiveBlockId(blockId);
  };

  const handleDrop = (
    event: DragEvent<HTMLElement>,
    targetBlockId: number,
  ) => {
    if (disabled || !acceptsInstruction(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveBlockId(null);
    const sourceInstructionId = Number(
      event.dataTransfer.getData(VARIABLES_INSTRUCTION_DRAG_MIME),
    );
    if (!positiveInteger(sourceInstructionId)) return;
    onTransferIntent({ sourceInstructionId, targetBlockId });
  };

  return (
    <section
      className={styles.board}
      aria-label="Variables Block transfer destinations"
    >
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Block transfer</span>
          <h3>Drop a command into a Block</h3>
          <p>
            Drop any command from All commands, then choose Move or New Copy.
          </p>
        </div>
        <span className={disabled ? styles.unavailable : styles.ready}>
          <GripVertical size={13} aria-hidden="true" />
          {disabled ? (unavailableReason || 'Unavailable') : 'Drop enabled'}
        </span>
      </header>

      <div
        className={styles.blockScroll}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setActiveBlockId(null);
          }
        }}
      >
        {presentations.map(({ block, instructionCount }) => {
          const active = activeBlockId === block.id;
          return (
            <article
              key={`variables-transfer-block:${block.id}`}
              className={[
                styles.blockCard,
                active ? styles.blockCardActive : '',
                disabled ? styles.blockCardDisabled : '',
              ].filter(Boolean).join(' ')}
              data-testid={`variables-transfer-block-${block.id}`}
              onDragOver={event => handleDragOver(event, block.id)}
              onDrop={event => handleDrop(event, block.id)}
            >
              <div className={styles.blockIdentity}>
                <Boxes size={16} aria-hidden="true" />
                <span>
                  <small>
                    {block.order === null
                      ? 'Block order unavailable'
                      : `Block #${block.order}`}
                  </small>
                  <strong title={block.name}>{block.name || `Block ${block.id}`}</strong>
                </span>
              </div>
              <div className={styles.blockDetails}>
                <span>ID {block.id}</span>
                <span>
                  {instructionCount} instruction{instructionCount === 1 ? '' : 's'}
                </span>
                <b className={block.active === false
                  ? styles.inactive
                  : block.active === true
                    ? styles.active
                    : styles.unknown}
                >
                  {block.active === false
                    ? 'Inactive'
                    : block.active === true
                      ? 'Active'
                      : 'Status unavailable'}
                </b>
              </div>
              {active && (
                <span className={styles.releaseHint}>Release to choose action</span>
              )}
            </article>
          );
        })}
        {presentations.length === 0 && (
          <div className={styles.empty}>No authoritative Blocks are available.</div>
        )}
      </div>
    </section>
  );
};

export default VariablesBlockTransferBoard;
