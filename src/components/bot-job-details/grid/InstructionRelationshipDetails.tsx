import React from 'react';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import gridStyles from '../../Griditem.module.scss';
import type {
  InstructionRelationshipEdge,
  RelationshipMutationState,
  RelationshipState,
} from './domain/instructionRelationshipGraph';
import type { WorkspaceBlock } from './domain/workspaceBlocks';
import styles from './InstructionRelationshipDetails.module.scss';

export interface InstructionRelationshipDetailsProps {
  instruction: BlockLoopInstructionLoadDTO;
  allInstructions: readonly BlockLoopInstructionLoadDTO[];
  workspaceBlocks?: readonly WorkspaceBlock[];
  /**
   * The caller supplies only edges relevant to this rendered row. Variable-owner
   * edges may therefore be included alongside instruction-source edges.
   */
  relationshipEdges?: readonly InstructionRelationshipEdge[];
  /**
   * Presentation-only states for a correlated mutation. P3 does not originate
   * mutations; accepting these states keeps the renderer complete and reusable.
   */
  relationshipStates?: readonly RelationshipMutationState[];
}

type ChipDescriptor = {
  label: string;
  tone: 'neutral' | 'repair' | 'warning' | 'pending' | 'refused';
};

const CHIP_DESCRIPTORS: Readonly<
  Record<Exclude<RelationshipState, 'CONNECTED'>, ChipDescriptor>
> = {
  MEMORY_ONLY: { label: 'Memory only', tone: 'neutral' },
  RECONNECT_PARENT: { label: 'Reconnect parent', tone: 'repair' },
  RECONNECT_VARIABLE: { label: 'Reconnect variable', tone: 'repair' },
  RECONNECT_LOOP: { label: 'Reconnect loop', tone: 'repair' },
  REPAIR_CONDITIONAL: { label: 'Repair conditional', tone: 'repair' },
  RECONNECT_BLOCK: { label: 'Reconnect block', tone: 'repair' },
  FIX_ORDER: { label: 'Fix order', tone: 'warning' },
  SAVING: { label: 'Saving', tone: 'pending' },
  REFUSED: { label: 'Refused', tone: 'refused' },
};

const humanizeCode = (code: string | null): string =>
  code
    ? code
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map((part, index) =>
          index === 0 ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
        .join(' ')
    : '';

const parentLabel = (
  instruction: BlockLoopInstructionLoadDTO,
  allInstructions: readonly BlockLoopInstructionLoadDTO[],
): { id: number | 'N/A'; name: string } => {
  const parent = allInstructions.find(candidate => candidate.id === instruction.parentId);
  return {
    id: instruction.parentId ?? 'N/A',
    name: parent?.name || 'Unknown',
  };
};

const blockLabel = (
  blockId: number | null | undefined,
  allInstructions: readonly BlockLoopInstructionLoadDTO[],
  workspaceBlocks: readonly WorkspaceBlock[],
): { order: number | 'N/A'; name: string } => {
  if (blockId == null) return { order: 'N/A', name: 'Unknown' };

  const instruction = allInstructions.find(candidate => candidate.blockId === blockId);
  if (instruction) {
    return {
      order: instruction.blockOrderNumber,
      name: instruction.blockName || 'Unknown',
    };
  }

  const catalogBlock = workspaceBlocks.find(block => block.blockId === blockId);
  return catalogBlock
    ? {
        order: catalogBlock.blockOrderNumber,
        name: catalogBlock.blockName || 'Unknown',
      }
    : { order: 'N/A', name: 'Unknown' };
};

/**
 * This is the legacy GridItem operation presentation without its validation
 * side effects. Relationship health is supplied by the typed graph and rendered
 * as chips; a broken relationship must not erase this grid column.
 */
const renderOperationContent = (
  instruction: BlockLoopInstructionLoadDTO,
  allInstructions: readonly BlockLoopInstructionLoadDTO[],
  workspaceBlocks: readonly WorkspaceBlock[],
): React.ReactNode => {
  const validActions = ['SET', 'GET'];

  if (
    (
      instruction.actions === 'CK'
      || instruction.actions === 'CSV CHECK'
      || instruction.actions === 'PDF CHECK'
    )
    && instruction.operation
  ) {
    const [left, middle, right] = instruction.operation
      .split(':')
      .map(part => part.trim());

    if (
      middle === '='
      || middle === '>'
      || middle === '<'
      || middle === '!='
      || middle === 'contains'
    ) {
      const rightLabel = instruction.actions === 'CSV CHECK'
        ? 'CSV VALUES'
        : instruction.actions === 'PDF CHECK'
          ? 'PDF VALUES'
          : right;
      const rightDisplay = middle === 'contains' ? `( ${rightLabel} )` : rightLabel;

      return (
        <>
          <span style={{ color: '#FFA500' }}>
            ({instruction.variableId}){left}
          </span>{' '}
          <span style={{ color: '#0b5394' }}>{middle}</span>{' '}
          <span style={{ color: '#FFA500' }}>{rightDisplay}</span>
        </>
      );
    }
  }

  if (instruction.actions === 'GOTO' && instruction.operation) {
    const target = blockLabel(
      instruction.parentBlockId,
      allInstructions,
      workspaceBlocks,
    );
    return (
      <>
        <span style={{ color: '#0b5394' }}>Block:</span>{' '}
        <span style={{ color: '#b163ff' }}>#{target.order} {target.name}</span>{' '}
        <span style={{ color: 'blue' }}>Limit:</span>{' '}
        <span style={{ color: '#b163ff' }}>{instruction.operation}</span>
      </>
    );
  }

  if (instruction.actions === 'REFRESH_LOOP' && instruction.operation) {
    const [refreshValue, loopValue] = instruction.operation
      .split(':')
      .map(part => part.trim());
    const parent = parentLabel(instruction, allInstructions);
    return (
      <>
        <span style={{ color: '#0b5394' }}>Refresh</span>{' '}
        <span style={{ color: '#FFA500' }}>{refreshValue}s</span>{' '}
        <span style={{ color: '#0b5394' }}>Loop</span>{' '}
        <span style={{ color: '#FFA500' }}>{loopValue} times</span>{' '}
        <span style={{ color: '#0b5394' }}>Jump To Parent</span>{' '}
        <span style={{ color: '#b163ff' }}>({parent.id}){parent.name}</span>
      </>
    );
  }

  if (
    (instruction.actions === 'SWIPE_UP' || instruction.actions === 'SWIPE_DOWN')
    && instruction.operation
  ) {
    return (
      <>
        <span style={{ color: '#0b5394' }}>Times</span>{' '}
        <span style={{ color: '#FFA500' }}>{instruction.operation}x</span>{' '}
      </>
    );
  }

  if (instruction.actions === 'LOOP' && instruction.operation) {
    const [refreshValue, loopValue] = instruction.operation
      .split(':')
      .map(part => part.trim());
    const parent = parentLabel(instruction, allInstructions);
    return (
      <>
        <span style={{ color: '#0b5394' }}>Time</span>{' '}
        <span style={{ color: '#FFA500' }}>{refreshValue}s</span>{' '}
        <span style={{ color: '#0b5394' }}>Loop</span>{' '}
        <span style={{ color: '#FFA500' }}>{loopValue} times</span>{' '}
        <span style={{ color: '#0b5394' }}>Jump To Parent</span>{' '}
        <span style={{ color: '#b163ff' }}>({parent.id}){parent.name}</span>
      </>
    );
  }

  if (validActions.includes(instruction.actions) && instruction.operation) {
    const [, right] = instruction.operation.split(':');
    const parent = parentLabel(instruction, allInstructions);
    return (
      <>
        <span style={{ color: '#0b5394' }}>({parent.id}){parent.name}</span>:
        <span style={{ color: '#FFA500' }}>{right}</span>
      </>
    );
  }

  if (instruction.actions === 'E' && instruction.operation) {
    return (
      <span style={{ color: '#FFA500' }}>
        ({instruction.variableId}){instruction.operation}
      </span>
    );
  }

  if (validActions.includes(instruction.actions)) return instruction.actions;

  return '\u00a0';
};

const chipClassName = (tone: ChipDescriptor['tone']): string => {
  switch (tone) {
    case 'neutral':
      return styles.neutral;
    case 'warning':
      return styles.warning;
    case 'pending':
      return styles.pending;
    case 'refused':
      return styles.refused;
    default:
      return styles.repair;
  }
};

const InstructionRelationshipDetails: React.FC<
  InstructionRelationshipDetailsProps
> = ({
  instruction,
  allInstructions,
  workspaceBlocks = [],
  relationshipEdges = [],
  relationshipStates = [],
}) => {
  const chips = [
    ...relationshipEdges
      .filter(edge => edge.state !== 'CONNECTED')
      .map(edge => ({
        key: edge.id,
        state: edge.state as Exclude<RelationshipState, 'CONNECTED'>,
        code: edge.code,
      })),
    ...relationshipStates
      .map((state, index) => ({
        key: `state:${state}:${index}`,
        state,
        code: null,
      })),
  ];

  return (
    <span
      className={gridStyles.instructionDetails}
      data-testid={`instruction-relationship-details-${instruction.id}`}
    >
      {renderOperationContent(instruction, allInstructions, workspaceBlocks)}
      {chips.length > 0 && (
        <span className={styles.chips}>
          {chips.map(({ key, state, code }) => {
            const descriptor = CHIP_DESCRIPTORS[state];
            const detail = humanizeCode(code);
            const accessibleLabel = detail
              ? `${descriptor.label}: ${detail}`
              : descriptor.label;
            return (
              <span
                key={key}
                className={`${styles.chip} ${chipClassName(descriptor.tone)}`}
                aria-label={accessibleLabel}
                title={accessibleLabel}
                data-relationship-state={state}
              >
                {descriptor.label}
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
};

export default InstructionRelationshipDetails;
