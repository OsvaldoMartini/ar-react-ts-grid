import React, { useMemo } from 'react';
import { GripVertical, LockKeyhole, MoveVertical } from 'lucide-react';
import type {
  VariableCommandLink,
  VariableGraphEntry,
  VariableInstructionNode,
} from '../variablesWorkspace.contract';
import type { VariablesDropPlacement } from './domain/variablesInstructionMove';
import { useVariablesInstructionDrag } from './useVariablesInstructionDrag';
import styles from './VariableExecutionLane.module.scss';

type LaneRow = {
  instruction: VariableInstructionNode;
  command: VariableCommandLink | null;
  owner: boolean;
};

type Props = {
  variable: VariableGraphEntry;
  authorityKey: string;
  disabled: boolean;
  unavailableReason?: string;
  onMove: (
    sourceInstructionId: number,
    targetInstructionId: number,
    placement: VariablesDropPlacement,
  ) => void;
};

const rowOrder = (left: LaneRow, right: LaneRow): number =>
  (left.instruction.blockOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.instruction.blockOrder ?? Number.MAX_SAFE_INTEGER)
  || (left.instruction.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  - (right.instruction.instructionOrder ?? Number.MAX_SAFE_INTEGER)
  || (left.instruction.id ?? Number.MAX_SAFE_INTEGER)
  - (right.instruction.id ?? Number.MAX_SAFE_INTEGER);

const blockLabel = (instruction: VariableInstructionNode): string =>
  `#${instruction.blockOrder ?? instruction.blockId ?? '?'} `
  + (instruction.blockName || `Block ${instruction.blockId ?? '?'}`);

const VariableExecutionLane: React.FC<Props> = ({
  variable,
  authorityKey,
  disabled,
  unavailableReason,
  onMove,
}) => {
  const rows = useMemo<LaneRow[]>(() => {
    const values: LaneRow[] = variable.commands.map(command => ({
      instruction: command,
      command,
      owner: false,
    }));
    if (variable.owner) {
      values.push({
        instruction: variable.owner,
        command: null,
        owner: true,
      });
    }
    return values
      .filter(row => row.instruction.id !== null)
      .sort(rowOrder);
  }, [variable.commands, variable.owner]);

  const drag = useVariablesInstructionDrag({
    authorityKey,
    disabled,
    onDropInstruction: onMove,
  });

  const dropGap = (
    targetInstructionId: number,
    placement: VariablesDropPlacement,
    key: string,
  ) => {
    const active = drag.isDropActive(targetInstructionId, placement);
    return (
      <div
        key={key}
        className={`${styles.dropGap} ${active ? styles.dropGapActive : ''}`}
        data-drop-placement={placement}
        onDragOver={event =>
          drag.onDragOver(event, targetInstructionId, placement)}
        onDragLeave={event =>
          drag.onDragLeave(event, targetInstructionId, placement)}
        onDrop={event => drag.onDrop(event, targetInstructionId, placement)}
      >
        <span>{active ? `Move ${placement.toLowerCase()}` : ''}</span>
      </div>
    );
  };

  return (
    <section className={styles.lane} aria-label="Variable execution order">
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Individual instruction movement</span>
          <h3>Execution order</h3>
          <p>
            Drag one command to an exact gap in the same block. Parent and
            variable links stay unchanged.
          </p>
        </div>
        <span className={disabled ? styles.lockedBadge : styles.readyBadge}>
          {disabled
            ? <LockKeyhole size={14} aria-hidden="true" />
            : <MoveVertical size={14} aria-hidden="true" />}
          {disabled ? (unavailableReason || 'Unavailable') : 'Drag enabled'}
        </span>
      </header>

      <div className={styles.rows}>
        {rows.length === 0 && (
          <div className={styles.empty}>No owner or variable commands are available.</div>
        )}
        {rows.map((row, index) => {
          const instructionId = row.instruction.id as number;
          const previous = rows[index - 1]?.instruction;
          const next = rows[index + 1]?.instruction;
          const startsBlock = !previous
            || previous.blockId !== row.instruction.blockId;
          const endsBlock = !next
            || next.blockId !== row.instruction.blockId;
          const draggable = !disabled
            && !row.owner
            && row.command?.role !== 'INVALID_LINK';
          const dragging = drag.sourceInstructionId === instructionId;
          return (
            <React.Fragment key={`lane:${instructionId}`}>
              {startsBlock && (
                <div className={styles.blockDivider}>
                  <span>{blockLabel(row.instruction)}</span>
                </div>
              )}
              {dropGap(instructionId, 'BEFORE', `before:${instructionId}`)}
              <article
                className={[
                  styles.row,
                  row.owner ? styles.ownerRow : '',
                  dragging ? styles.dragging : '',
                  !draggable && !row.owner ? styles.rowDisabled : '',
                ].filter(Boolean).join(' ')}
                draggable={draggable}
                onDragStart={event => drag.onDragStart(event, instructionId)}
                onDragEnd={drag.onDragEnd}
                data-testid={`variables-lane-row-${instructionId}`}
              >
                <span className={styles.grip} aria-hidden="true">
                  {row.owner
                    ? <LockKeyhole size={16} />
                    : <GripVertical size={17} />}
                </span>
                <span className={styles.order}>
                  #{row.instruction.instructionOrder ?? '?'}
                </span>
                <span className={styles.command}>
                  {row.owner ? 'OWNER' : row.instruction.command || 'FIELD'}
                </span>
                <span className={styles.identity}>
                  <strong>{row.instruction.name || 'Unnamed instruction'}</strong>
                  <small>ID {instructionId}</small>
                </span>
                {row.command?.role && (
                  <span className={styles.role}>{row.command.role.replaceAll('_', ' ')}</span>
                )}
                {(row.instruction.active === false
                  || row.instruction.blockActive === false) && (
                  <span className={styles.inactive}>Inactive</span>
                )}
              </article>
              {endsBlock
                && dropGap(instructionId, 'AFTER', `after:${instructionId}`)}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default VariableExecutionLane;
