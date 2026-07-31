import React from 'react';
import { Link2, Variable } from 'lucide-react';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import { RulesCard, type RulesCardEvent } from '../../RulesCard';
import gridStyles from '../../Griditem.module.scss';
import type {
  InstructionRelationshipEdge,
  RelationshipMutationState,
  RelationshipState,
} from './domain/instructionRelationshipGraph';
import { instructionRelationshipPolicy } from './domain/instructionRelationshipPolicy';
import type { WorkspaceBlock } from './domain/workspaceBlocks';
import InstructionVariableStateBadge from './InstructionVariableStateBadge';
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
  /** Opens the shared reconnect presentation for one exact graph edge. */
  onReconnect?: (edge: InstructionRelationshipEdge) => void;
  reconnectDisabled?: boolean;
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
    // The parent reference is rendered exclusively by the relationship chip
    // ("Loop connected (id: N) Name" / red "Reconnect Loop") — never as
    // "(N/A)Unknown" text here.
    return (
      <>
        <span style={{ color: '#0b5394' }}>Refresh</span>{' '}
        <span style={{ color: '#FFA500' }}>{refreshValue}s</span>{' '}
        <span style={{ color: '#0b5394' }}>Loop</span>{' '}
        <span style={{ color: '#FFA500' }}>{loopValue} times</span>
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
    // The parent reference is rendered exclusively by the relationship chip
    // ("Loop connected (id: N) Name" / red "Reconnect Loop") — never as
    // "(N/A)Unknown" text here.
    return (
      <>
        <span style={{ color: '#0b5394' }}>Time</span>{' '}
        <span style={{ color: '#FFA500' }}>{refreshValue}s</span>{' '}
        <span style={{ color: '#0b5394' }}>Loop</span>{' '}
        <span style={{ color: '#FFA500' }}>{loopValue} times</span>
      </>
    );
  }

  if (validActions.includes(instruction.actions) && instruction.operation) {
    const [, right] = instruction.operation.split(':');
    // The parent reference is rendered exclusively by the relationship chip
    // ("Parent connected (id: N) Name" / red "Reconnect Parent").
    return (
      <span style={{ color: '#FFA500' }}>{right}</span>
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
  onReconnect,
  reconnectDisabled = false,
}) => {
  // Every structural attachment a command can carry via parent_id/parent_block_id
  // (Web Field parent, loop anchor, conditional root, GOTO destination block) uses
  // ONE chip contract: broken = red clickable chip, connected = styled clickable
  // chip that opens the same reconnect dialog to modify or disconnect.
  // ELEMENT_TARGET edges always own the parent-chip pathway (legacy behavior).
  // Structural kinds (loop/conditional/block) join it only when CONNECTED or
  // broken; their other states (FIX_ORDER, SAVING, REFUSED) keep their own
  // dedicated chips below.
  const structuralParentEdge = relationshipEdges.find(edge =>
    edge.source.entity === 'INSTRUCTION'
    && edge.source.id === instruction.id
    && (edge.kind === 'ELEMENT_TARGET'
      || ((edge.kind === 'LOOP_ANCHOR'
        || edge.kind === 'CONDITIONAL_ROOT'
        || edge.kind === 'BLOCK_TARGET')
        && (edge.state === 'CONNECTED'
          || edge.state === 'RECONNECT_PARENT'
          || edge.state === 'RECONNECT_LOOP'
          || edge.state === 'REPAIR_CONDITIONAL'
          || edge.state === 'RECONNECT_BLOCK'))));
  const variableBindingEdge = relationshipEdges.find(edge =>
    edge.source.entity === 'INSTRUCTION'
    && edge.source.id === instruction.id
    && edge.kind === 'VARIABLE_BINDING');
  const relationshipPolicy = instructionRelationshipPolicy(
    instruction.actions,
  );
  const structuralKind = structuralParentEdge?.kind
    ?? (relationshipPolicy.requirements.includes('ELEMENT_TARGET')
      ? 'ELEMENT_TARGET' as const
      : relationshipPolicy.requirements.includes('LOOP_ANCHOR')
        ? 'LOOP_ANCHOR' as const
        : relationshipPolicy.requirements.includes('CONDITIONAL_ROOT')
          ? 'CONDITIONAL_ROOT' as const
          : relationshipPolicy.requirements.includes('BLOCK_TARGET')
            ? 'BLOCK_TARGET' as const
            : null);
  const structuralLabels = structuralKind === 'LOOP_ANCHOR'
    ? { broken: 'Reconnect Loop', connected: 'Loop connected', change: 'Change loop anchor' }
    : structuralKind === 'CONDITIONAL_ROOT'
      ? { broken: 'Repair Conditional', connected: 'Conditional connected', change: 'Change conditional root' }
      : structuralKind === 'BLOCK_TARGET'
        ? { broken: 'Reconnect Block', connected: 'Block connected', change: 'Change destination block' }
        : { broken: 'Reconnect Parent', connected: 'Parent connected', change: 'Change connected Web Element' };
  const requiresElementParent = structuralKind !== null;
  const requiresVariableBinding =
    relationshipPolicy.requirements.includes('VARIABLE_BINDING');
  const configuredParentId = structuralKind === 'BLOCK_TARGET'
    ? (typeof instruction.parentBlockId === 'number'
      && Number.isSafeInteger(instruction.parentBlockId)
      && instruction.parentBlockId > 0
        ? instruction.parentBlockId
        : null)
    : (typeof instruction.parentId === 'number'
      && Number.isSafeInteger(instruction.parentId)
      && instruction.parentId > 0
        ? instruction.parentId
        : null);
  const structuralTargetEntity =
    structuralKind === 'BLOCK_TARGET' ? 'BLOCK' : 'INSTRUCTION';
  // A supplied graph edge is authoritative. Only fall back to the DTO when
  // relationship capabilities are unavailable and no edge exists.
  const connectedParentId = structuralParentEdge
    ? structuralParentEdge.state === 'CONNECTED'
      && structuralParentEdge.target?.entity === structuralTargetEntity
      && Number.isSafeInteger(structuralParentEdge.target.id)
      && structuralParentEdge.target.id > 0
        ? structuralParentEdge.target.id
        : null
    : requiresElementParent
      ? configuredParentId
      : null;
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
  // The chip is the single parent display: "Parent connected (id: N) Name".
  const connectedParentName = connectedParentId === null
    ? ''
    : structuralKind === 'BLOCK_TARGET'
      ? (workspaceBlocks.find(block => block.blockId === connectedParentId)
          ?.blockName
        ?? allInstructions.find(row => row.blockId === connectedParentId)
          ?.blockName
        ?? '')
      : (allInstructions.find(row => row.id === connectedParentId)?.name ?? '');
  const connectedParentText = connectedParentName
    ? `${structuralLabels.connected} (id: ${connectedParentId}) ${connectedParentName}`
    : `${structuralLabels.connected} (id: ${connectedParentId})`;
  const reconnectParentEvent: RulesCardEvent | null =
    requiresElementParent
    && connectedParentId === null
      ? {
          color: 'red',
          rules: structuralLabels.broken,
          context: '',
          ts: instruction.id,
        }
      : null;
  const parentDetail = structuralParentEdge?.code
    ? humanizeCode(structuralParentEdge.code)
    : '';
  const reconnectParentLabel = parentDetail
    ? `${structuralLabels.broken}: ${parentDetail}`
    : structuralLabels.broken;
  const variableDetail = variableBindingEdge?.code
    ? humanizeCode(variableBindingEdge.code)
    : '';
  const reconnectVariableLabel = variableDetail
    ? `Reconnect variable: ${variableDetail}`
    : 'Reconnect variable';
  const reconnectVariableEvent: RulesCardEvent | null =
    requiresVariableBinding
    && connectedVariableId === null
      ? {
          color: 'red',
          rules: 'Reconnect Variable',
          context: '',
          ts: instruction.id,
        }
      : null;

  const chips = [
    ...relationshipEdges
      .filter(edge =>
        edge !== structuralParentEdge
        && edge !== variableBindingEdge
        && edge.state !== 'CONNECTED')
      .map(edge => ({
        key: edge.id,
        state: edge.state as Exclude<RelationshipState, 'CONNECTED'>,
        code: edge.code,
        edge,
      })),
    ...relationshipStates
      .map((state, index) => ({
        key: `state:${state}:${index}`,
        state,
        code: null,
        edge: null,
      })),
  ];

  return (
    <span
      className={gridStyles.instructionDetails}
      data-testid={`instruction-relationship-details-${instruction.id}`}
    >
      {renderOperationContent(instruction, allInstructions, workspaceBlocks)}
      {(
        instruction.variableId != null
        || chips.length > 0
        || reconnectParentEvent != null
        || connectedParentId != null
        || reconnectVariableEvent != null
        || connectedVariableId != null
      ) && (
        <span className={styles.chips}>
          <InstructionVariableStateBadge
            instruction={instruction}
            allInstructions={allInstructions}
          />
          {reconnectParentEvent && (
            <span
              className={styles.reconnectRuleCard}
              onMouseDown={event => event.stopPropagation()}
            >
              <RulesCard
                event={reconnectParentEvent}
                ariaLabel={reconnectParentLabel}
                glow
                border
                animate={false}
                pulse
                iconNode={<Link2 size={10} aria-hidden="true" />}
                title={reconnectParentLabel}
                disabled={reconnectDisabled}
                onClick={onReconnect && structuralParentEdge
                  ? () => onReconnect(structuralParentEdge)
                  : undefined}
              />
            </span>
          )}
          {connectedParentId != null && (
            structuralParentEdge && onReconnect
              ? (
                  <button
                    type="button"
                    className={[
                      styles.chip,
                      styles.reconnectButton,
                      styles.reconnectParent,
                      styles.connectedParent,
                    ].join(' ')}
                    aria-label={connectedParentText}
                    title={structuralLabels.change}
                    data-relationship-state="CONNECTED"
                    disabled={reconnectDisabled}
                    onMouseDown={event => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onReconnect(structuralParentEdge);
                    }}
                  >
                    <Link2 size={10} aria-hidden="true" />
                    {connectedParentText}
                  </button>
                )
              : (
                  <span
                    className={[
                      styles.chip,
                      styles.reconnectParent,
                      styles.connectedParent,
                      styles.connectedStatic,
                    ].join(' ')}
                    aria-label={connectedParentText}
                    title={connectedParentText}
                    data-relationship-state="CONNECTED"
                  >
                    <Link2 size={10} aria-hidden="true" />
                    {connectedParentText}
                  </span>
                )
          )}
          {reconnectVariableEvent && (
            <span
              className={styles.reconnectRuleCard}
              onMouseDown={event => event.stopPropagation()}
            >
              <RulesCard
                event={reconnectVariableEvent}
                ariaLabel={reconnectVariableLabel}
                glow
                border
                animate={false}
                pulse
                iconNode={<Variable size={10} aria-hidden="true" />}
                title={reconnectVariableLabel}
                disabled={reconnectDisabled}
                onClick={onReconnect && variableBindingEdge
                  ? () => onReconnect(variableBindingEdge)
                  : undefined}
              />
            </span>
          )}
          {connectedVariableId != null && (
            variableBindingEdge && onReconnect
              ? (
                  <button
                    type="button"
                    className={[
                      styles.chip,
                      styles.reconnectButton,
                      styles.reconnectVariable,
                    ].join(' ')}
                    aria-label={`Variable connected (id: ${connectedVariableId})`}
                    title="Change connected variable"
                    data-relationship-state="CONNECTED"
                    disabled={reconnectDisabled}
                    onMouseDown={event => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onReconnect(variableBindingEdge);
                    }}
                  >
                    <Variable size={10} aria-hidden="true" />
                    Variable connected (id: {connectedVariableId})
                  </button>
                )
              : (
                  <span
                    className={[
                      styles.chip,
                      styles.reconnectVariable,
                      styles.connectedStatic,
                    ].join(' ')}
                    aria-label={`Variable connected (id: ${connectedVariableId})`}
                    title={`Variable connected (id: ${connectedVariableId})`}
                    data-relationship-state="CONNECTED"
                  >
                    <Variable size={10} aria-hidden="true" />
                    Variable connected (id: {connectedVariableId})
                  </span>
                )
          )}
          {chips.map(({ key, state, code, edge }) => {
            const descriptor = CHIP_DESCRIPTORS[state];
            const detail = humanizeCode(code);
            const accessibleLabel = detail
              ? `${descriptor.label}: ${detail}`
              : descriptor.label;
            // Broken = red AND clickable for every reconnectable relationship,
            // not only variables: the chip is the entry point to the reconnect
            // dialog in both directions (connect / modify / disconnect).
            const reconnectableStates: readonly string[] = [
              'RECONNECT_PARENT',
              'RECONNECT_VARIABLE',
              'RECONNECT_LOOP',
              'REPAIR_CONDITIONAL',
              'RECONNECT_BLOCK',
            ];
            const reconnectKind = edge?.source.entity === 'INSTRUCTION'
              && edge.source.id === instruction.id
              && reconnectableStates.includes(state)
                ? state === 'RECONNECT_VARIABLE' ? 'VARIABLE' : 'STRUCTURAL'
                : null;
            if (edge && reconnectKind && onReconnect) {
              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    styles.chip,
                    styles.reconnectButton,
                    styles.repair,
                  ].join(' ')}
                  aria-label={accessibleLabel}
                  title={accessibleLabel}
                  data-relationship-state={state}
                  disabled={reconnectDisabled}
                  onMouseDown={event => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onReconnect(edge);
                  }}
                >
                  {reconnectKind === 'VARIABLE'
                    ? <Variable size={10} aria-hidden="true" />
                    : <Link2 size={10} aria-hidden="true" />}
                  {descriptor.label}
                </button>
              );
            }
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
