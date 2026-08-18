import React from 'react';
import { Link2, Variable } from 'lucide-react';
import type { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import { RulesCard, type RulesCardEvent } from '../../RulesCard';
import gridStyles from '../../Griditem.module.scss';
import type {
  InstructionVariableLink,
} from './domain/instructionDependency';
import type {
  InstructionRelationshipEdge,
  RelationshipMutationState,
  RelationshipState,
} from './domain/instructionRelationshipGraph';
import { instructionRelationshipPolicy } from './domain/instructionRelationshipPolicy';
import { isIfFamilyAction } from '../../variables/domain/ifFamilyRules';
import { binaryComparisonOperators } from '../../command-editor/editors/CheckValueCommandEditor';
import type { WorkspaceBlock } from './domain/workspaceBlocks';
import type { VariableCommandConfiguration } from '../../variablesWorkspace.contract';
import InstructionCommandValues from './InstructionCommandValues';
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
  variableLinks?: readonly InstructionVariableLink[];
  commandConfiguration?: VariableCommandConfiguration | null;
  /** Opens the shared reconnect presentation for one exact graph edge. */
  onReconnect?: (edge: InstructionRelationshipEdge) => void;
  /** Opens the typed command editor for comparison-variable changes. */
  onEditCommand?: () => void;
  onReconnectSecondVariable?: () => void;
  /** Middle-shim dropdown: changes only the stored comparison operator. */
  onChangeCheckOperator?: (comparisonOperator: string) => void;
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

const renderOperationContent = (
  instruction: BlockLoopInstructionLoadDTO,
): React.ReactNode => {
  if (
    instruction.actions === 'LOOP'
    || instruction.actions === 'REFRESH_LOOP'
    || instruction.actions === 'GOTO'
    || instruction.actions === 'SWIPE_UP'
    || instruction.actions === 'SWIPE_DOWN'
    || instruction.actions === 'H'
  ) {
    return (
      <InstructionCommandValues
        action={instruction.actions}
        operation={instruction.operation}
        onHoldSeconds={instruction.onHoldSeconds}
      />
    );
  }

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
  relationshipEdges = [],
  relationshipStates = [],
  variableLinks = [],
  commandConfiguration = null,
  onReconnect,
  onEditCommand,
  onReconnectSecondVariable,
  onChangeCheckOperator,
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
  // IF-family links are a CLOSED rule (2026-08-03): always auto-connected and
  // auto-repaired, so IF/ELSEIF/ELSE/ENDIF rows never show a parent chip -
  // same contract as the Variables page board.
  const isIfFamilyRow = isIfFamilyAction(instruction.actions);
  const structuralParentEdge = isIfFamilyRow ? undefined : relationshipEdges.find(edge =>
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
  const structuralKind = isIfFamilyRow
    ? null
    : structuralParentEdge?.kind
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
  const connectedParentText = structuralKind === 'ELEMENT_TARGET'
    ? `id: ${connectedParentId}`
    : `(id: ${connectedParentId})`;
  const connectedVariableName = connectedVariableId === null
    ? ''
    : variableLinks.find(variable => variable.id === connectedVariableId)
        ?.name?.trim() || 'Variable';
  const connectedVariableText = `${connectedVariableName} (id: ${connectedVariableId})`;
  const variableOnlyCheck = instruction.actions === 'CK'
    || instruction.actions === 'CSV CHECK'
    || instruction.actions === 'PDF CHECK';
  const comparisonOperator = commandConfiguration?.comparisonOperator?.trim() || '=';
  const secondVariableId = variableOnlyCheck
    && typeof commandConfiguration?.operandVariableId === 'number'
    && Number.isSafeInteger(commandConfiguration.operandVariableId)
    && commandConfiguration.operandVariableId > 0
      ? commandConfiguration.operandVariableId
      : null;
  const secondVariableName = secondVariableId === null
    ? ''
    : variableLinks.find(variable => variable.id === secondVariableId)
        ?.name?.trim() || 'Variable';
  const secondVariableText = `${secondVariableName} (id: ${secondVariableId})`;
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
        && edge.state !== 'CONNECTED'
        && !(isIfFamilyRow && edge.kind === 'CONDITIONAL_ROOT'))
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
      {renderOperationContent(instruction)}
      {(
        chips.length > 0
        || reconnectParentEvent != null
        || connectedParentId != null
        || reconnectVariableEvent != null
        || connectedVariableId != null
      ) && (
        <span className={styles.chips}>
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
                disabled={false}
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
                    disabled={false}
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
                disabled={false}
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
                    aria-label={connectedVariableText}
                    title="Change connected variable"
                    data-relationship-state="CONNECTED"
                    disabled={false}
                    onMouseDown={event => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onReconnect(variableBindingEdge);
                    }}
                  >
                    <Variable size={10} aria-hidden="true" />
                    {connectedVariableText}
                  </button>
                )
              : (
                  <span
                    className={[
                      styles.chip,
                      styles.reconnectVariable,
                      styles.connectedStatic,
                    ].join(' ')}
                    aria-label={connectedVariableText}
                    title={connectedVariableText}
                    data-relationship-state="CONNECTED"
                  >
                    <Variable size={10} aria-hidden="true" />
                    {connectedVariableText}
                  </span>
                )
          )}
          {variableOnlyCheck && (
            <select
              className={styles.checkOperator}
              aria-label={`Comparison operator ${comparisonOperator}`}
              title="Change comparison operator"
              value={comparisonOperator}
              disabled={false}
              onMouseDown={event => event.stopPropagation()}
              onClick={event => event.stopPropagation()}
              onChange={(event) => onChangeCheckOperator?.(event.target.value)}
            >
              {binaryComparisonOperators.map(operator => (
                <option key={operator} value={operator}>{operator}</option>
              ))}
            </select>
          )}
          {variableOnlyCheck && secondVariableId !== null && (
            <button
              type="button"
              className={[
                styles.chip,
                styles.reconnectButton,
                styles.reconnectVariable,
              ].join(' ')}
              aria-label={secondVariableText}
              title="Change second comparison variable"
              disabled={false}
              onMouseDown={event => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onReconnectSecondVariable?.();
              }}
            >
              <Variable size={10} aria-hidden="true" />
              {secondVariableText}
            </button>
          )}
          {variableOnlyCheck && secondVariableId === null && (
            <span
              className={styles.reconnectRuleCard}
              onMouseDown={event => event.stopPropagation()}
            >
              <RulesCard
                event={{
                  color: 'red',
                  rules: 'Reconnect Variable 2',
                  context: '',
                  ts: instruction.id,
                }}
                compactLabel="VAR 2"
                ariaLabel="Reconnect variable 2"
                glow
                border
                animate={false}
                pulse
                iconNode={<Variable size={10} aria-hidden="true" />}
                title="Reconnect variable 2"
                disabled={false}
                onClick={onReconnectSecondVariable}
              />
            </span>
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
                  disabled={false}
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
