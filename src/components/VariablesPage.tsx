import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppWindow,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import warningRedImage from '../assets/warning_red.png';
import AlertModal from './AlertModal';
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import ReconnectWebElement from './ReconnectWebElement';
import type {
  InstructionRelationshipEdge,
  RelationshipTarget,
} from './bot-job-details/grid/domain/instructionRelationshipGraph';
import { instructionCommandPresentation } from './bot-job-details/grid/domain/instructionCommandPresentation';
import {
  canonicalInstructionAction,
  instructionRelationshipPolicy,
} from './bot-job-details/grid/domain/instructionRelationshipPolicy';
import SearchBox, { type SearchBoxOption } from './SearchBox';
import { useWebSocket } from './useWebSocket';
import {
  planVariablesFreeMove,
} from './variables/domain/variablesFreeMove';
import {
  buildVariablesReconnectMutation,
  planVariablesReconnect,
  variablesReconnectGraph,
  VARIABLES_REACT_AUTHORED_PROFILE,
  type VariablesReconnectPlan,
  type VariablesReconnectRelationKind,
} from './variables/domain/variablesReconnectMutation';
import { variableValuePresentation } from './variables/domain/variableValuePresentation';
import { hidesLegacyVariableOperation } from './variables/domain/legacyVariableOperation';
import { orderRuntimeVariablesByExecution } from './variables/domain/variableExecutionOrder';
import RuntimeMemoryPanel from './variables/RuntimeMemoryPanel';
import { runtimeMemoryPanelItems } from './variables/runtimeMemoryPanelModel';
import AddVariableModal, {
  type AddVariableBatchDraft,
  type AddVariableDraft,
} from './variables/AddVariableModal';
import VariablesBlockTransferBoard, {
  type VariablesBlockTransferIntent,
} from './variables/VariablesBlockTransferBoard';
import VariablesCommandBoard, {
  type VariablesConnectionScope,
  type VariablesCommandDropTarget,
} from './variables/VariablesCommandBoard';
import VariablesConnectionsModal, {
  type VariablesConnectionReviewItem,
  type VariablesConnectionsModalSubmission,
} from './variables/VariablesConnectionsModal';
import VariablesExecutionFlowReviewModal from './variables/VariablesExecutionFlowReviewModal';
import ComponentEditorModal from './command-editor/ComponentEditorModal';
import type { ComponentEditorCommand } from './command-editor/componentEditor.types';
import {
  useVariablesCommandEditorUpdate,
  type VariablesCommandUpdateResult,
} from './command-editor/useVariablesCommandEditorUpdate';
import {
  useVariablesCommandEditorCopy,
  type VariablesCommandCopyResult,
} from './command-editor/useVariablesCommandEditorCopy';
import {
  useVariablesCommandEditorCreate,
  type VariablesCommandCreateResult,
} from './command-editor/useVariablesCommandEditorCreate';
import {
  buildVariablesBatchResolveMutation,
  planVariablesBatchRelease,
  planVariablesBatchResolve,
  reviewVariablesBatchResolve,
  validateVariablesBatchConnectionsAuthority,
  type VariablesBatchEditableRelationshipKind,
  type VariablesBatchReleasePlan,
  type VariablesBatchResolveChoice,
  type VariablesBatchResolvePlan,
  type VariablesBatchResolveReview,
} from './variables/domain/variablesBatchConnections';
import {
  planVariablesBlockMove,
  selectVariablesBlockTransferSources,
  type VariablesBlockTransferScope,
} from './variables/domain/variablesBlockTransfer';
import {
  variablesConditionalFamilyForInstruction,
  watchVariablesConditionalBlockTransfer,
} from './variables/domain/variablesConditionalFamilyWatcher';
import { planIfFamilyAutoRepair } from './variables/domain/ifFamilyAutoRepair';
import {
  connectedVariableSlots,
  missingVariableSlots,
  requiredVariableSlots,
} from './variables/domain/variableSlotRequirements';
import {
  buildVariableResolutionAssignments,
  type VariableResolutionMode,
} from './variables/domain/variableResolutionAssignments';
import {
  useVariablesGraphMutationRight,
  type VariablesGraphMutationRightResult,
} from './variables/useVariablesGraphMutationRight';
import {
  planVariableAutoResolve,
  type VariableAutoResolvePlan,
} from './variables/domain/variableAutoResolvePlan';
import { commandEditorConfiguration } from './command-editor/commandEditorDraft';
import { useVariablesGraphMutationParent } from './variables/useVariablesGraphMutationParent';
import { useVariablesGraphMutationLeft } from './variables/useVariablesGraphMutationLeft';
import { useVariablesGraphMutationCommandVariable } from './variables/useVariablesGraphMutationCommandVariable';
import {
  useVariablesInstructionCopy,
  type VariablesInstructionCopyResult,
} from './variables/useVariablesInstructionCopy';
import {
  useVariablesCreate,
  type VariablesCreateResult,
} from './variables/useVariablesCreate';
import {
  useVariablesAutoResolve,
  type VariablesAutoResolveResult,
} from './variables/useVariablesAutoResolve';
import {
  useVariablesDelete,
  type VariablesDeleteMode,
  type VariablesDeleteResult,
} from './variables/useVariablesDelete';
import {
  useVariablesCommandDelete,
  type VariablesCommandDeleteResult,
} from './variables/useVariablesCommandDelete';
import {
  useVariablesInstructionStatus,
  type VariablesInstructionStatusResult,
} from './variables/useVariablesInstructionStatus';
import {
  planVariablesCommandDelete,
  type VariablesCommandDeletePlan,
} from './variables/domain/variablesCommandDelete';
import { useVariablesRuntimeMemory } from './variables/useVariablesRuntimeMemory';
import { useVariablesExecutionFlowReview } from './variables/useVariablesExecutionFlowReview';
import {
  normalizeVariablesWorkspaceSnapshot,
  parseVariablesWorkspaceMessage,
  VARIABLES_MANAGER_SESSION_ID,
  type VariableCommandLink,
  type VariableDiagnostic,
  type VariableGraphEntry,
  type VariableHealth,
  type VariableInstructionNode,
  type VariablesWorkspaceEnvelope,
  type VariableWorkspaceSnapshot,
} from './variablesWorkspace.contract';
import styles from './VariablesPage.module.scss';

export { VARIABLES_MANAGER_SESSION_ID };

type Props = {
  socketPort: number;
  sessionId: string;
  onClose?: () => void;
};

type Status = {
  level: 'ok' | 'warn' | 'error';
  text: string;
};

type HealthFilter = 'ALL' | VariableHealth | 'ISSUES';

type PendingRequest = {
  requestId: string;
  operation: 'variablesWorkspace.bootstrap' | 'variablesWorkspace.refresh';
};

type VariableDeleteConfirmation = {
  mode: VariablesDeleteMode;
  variableIds: number[];
  title: string;
  body: string;
};

type CommandDeleteConfirmation = {
  plan: VariablesCommandDeletePlan;
  title: string;
  body: string;
  details: string;
};

type VariablesBlockTransferAction = 'MOVE' | 'COPY';

type PendingBlockTransfer = {
  authorityKey: string;
  sourceInstructionId: number;
  targetBlockId: number;
  stage: 'ACTION' | 'SCOPE';
  action: VariablesBlockTransferAction | null;
};

const REQUEST_TIMEOUT_MS = 10_000;

const mutationAuthorityKeyFor = (
  snapshot: VariableWorkspaceSnapshot | null,
): string => snapshot
  ? [
      snapshot.bindingEpoch,
      snapshot.workspaceEpoch,
      snapshot.graphRevision,
      snapshot.botJob.homeBankingId,
      snapshot.botJob.id,
      snapshot.mutationCapability?.graphVersion ?? 'read-only',
      snapshot.mutationCapability?.graphRevision ?? 'read-only',
      snapshot.mutationCapability?.ownerAssertion.homeBankingId ?? 'read-only',
      snapshot.mutationCapability?.ownerAssertion.botJobId ?? 'read-only',
      snapshot.mutationCapability?.crossBlockProfile ?? 'same-block-only',
      snapshot.mutationCapability?.reactAuthoredProfile ?? 'legacy-only',
    ].join(':')
  : 'unbound';

type PendingReconnect = {
  authorityKey: string;
  plan: VariablesReconnectPlan;
};

type PendingConnectionsResolve = {
  mode: 'RESOLVE';
  authorityKey: string;
  scope: VariablesConnectionScope;
  plan: VariablesBatchResolvePlan;
  review: VariablesBatchResolveReview;
  choices: readonly VariablesBatchResolveChoice[];
  reviewRevision: number;
};

type PendingConnectionsRelease = {
  mode: 'RELEASE';
  authorityKey: string;
  scope: VariablesConnectionScope;
  plan: VariablesBatchReleasePlan;
  items: readonly VariablesConnectionReviewItem[];
};

type PendingConnections =
  | PendingConnectionsResolve
  | PendingConnectionsRelease;

type PendingResolveBuildResult =
  | { ok: true; pending: PendingConnectionsResolve }
  | { ok: false; message: string };

type PendingReleaseBuildResult =
  | { ok: true; pending: PendingConnectionsRelease }
  | { ok: false; message: string };

const variablesConnectionScopeForBlocks = (
  snapshot: VariableWorkspaceSnapshot,
  requestedBlockIds: readonly number[],
  commandSearch = '',
): VariablesConnectionScope => {
  const availableBlockIds = new Set(snapshot.blocks.map(block => block.id));
  const blockIds = requestedBlockIds.filter(blockId => availableBlockIds.has(blockId));
  const selectedBlockIds = new Set(blockIds);
  const selectedBlocks = snapshot.blocks.filter(block => selectedBlockIds.has(block.id));
  const normalizedSearch = commandSearch.trim();
  const tokens = normalizedSearch
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const visibleCommands = snapshot.commands.filter((instruction) => {
    if (instruction.blockId === null || !selectedBlockIds.has(instruction.blockId)) return false;
    if (tokens.length === 0) return true;
    const commandPresentation = instructionCommandPresentation(
      instruction.command,
      instruction.tagName,
    );
    const haystack = [
      instruction.id,
      instruction.name,
      instruction.command,
      commandPresentation.label,
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
  const instructionIds = Array.from(new Set(
    visibleCommands.flatMap(instruction =>
      instruction.id !== null
      && Number.isSafeInteger(instruction.id)
      && instruction.id > 0
        ? [instruction.id]
        : []),
  ));
  const blockLabel = blockIds.length === 0
    ? 'No Blocks selected'
    : selectedBlocks.length === 1
      ? `Block #${selectedBlocks[0].order ?? selectedBlocks[0].id} ${selectedBlocks[0].name}`
      : `${selectedBlocks.length} selected Blocks`;
  return {
    instructionIds,
    visibleCount: instructionIds.length,
    totalCount: snapshot.commands.length,
    commandSearch: normalizedSearch,
    blockIds,
    blockLabel,
    label: [
      blockLabel,
      normalizedSearch ? `Search "${normalizedSearch}"` : null,
      `${instructionIds.length} visible command${instructionIds.length === 1 ? '' : 's'}`,
    ].filter(Boolean).join(' Â· '),
  };
};

const buildPendingResolveConnections = (
  snapshot: VariableWorkspaceSnapshot,
  scope: VariablesConnectionScope,
  reviewRevision: number,
): PendingResolveBuildResult => {
  const planned = planVariablesBatchResolve(snapshot, scope.instructionIds);
  if (!planned.ok) return { ok: false, message: planned.message };
  const reviewed = reviewVariablesBatchResolve(planned.plan, []);
  if (!reviewed.ok) return { ok: false, message: reviewed.message };
  return {
    ok: true,
    pending: {
      mode: 'RESOLVE',
      authorityKey: planned.plan.authorityKey,
      scope,
      plan: planned.plan,
      review: reviewed.review,
      choices: [],
      reviewRevision,
    },
  };
};

const acceptedOperations = new Set([
  'variablesWorkspace.bootstrapResponse',
  'variablesWorkspace.refreshResponse',
  'variablesWorkspace.snapshot',
  'variablesWorkspace.errorResponse',
]);

const asObject = (value: unknown): Record<string, any> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null;

const statusText = (body: unknown, fallback: string): string => {
  const candidate = asObject(body);
  for (const value of [
    candidate?.message,
    candidate?.error,
    candidate?.detail,
  ]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
};

const variableSearchText = (variable: VariableGraphEntry): string => [
  variable.id,
  variable.name,
  variable.type,
  variable.configuredValue,
  variable.owner?.id,
  variable.owner?.name,
  variable.owner?.blockName,
  ...variable.commands.flatMap(command => [
    command.id,
    command.name,
    command.command,
    command.operation,
    command.blockName,
  ]),
  ...variable.diagnostics.flatMap(diagnostic => [
    diagnostic.code,
    diagnostic.message,
  ]),
].join(' ').toLocaleLowerCase();

const healthLabel = (health: VariableHealth): string => {
  switch (health) {
    case 'HEALTHY':
      return 'Healthy';
    case 'UNUSED':
      return 'Unused';
    case 'WARNING':
      return 'Warning';
    case 'ERROR':
      return 'Error';
    default:
      return health;
  }
};

const healthTone = (health: VariableHealth): string => {
  switch (health) {
    case 'HEALTHY':
      return styles.healthHealthy;
    case 'UNUSED':
      return styles.healthUnused;
    case 'WARNING':
      return styles.healthWarning;
    case 'ERROR':
      return styles.healthError;
    default:
      return '';
  }
};

const instructionLocation = (instruction: VariableInstructionNode): string => {
  const block = instruction.blockName
    || (instruction.blockId ? `Block ${instruction.blockId}` : 'Block unavailable');
  const blockOrder = instruction.blockOrder ? `B${instruction.blockOrder}` : 'B?';
  const rowOrder = instruction.instructionOrder ? `#${instruction.instructionOrder}` : '#?';
  return `${blockOrder} · ${block} · ${rowOrder}`;
};

const relationshipTargetLabel = (
  snapshot: VariableWorkspaceSnapshot,
  target: RelationshipTarget | null,
): string | null => {
  if (!target) return null;
  if (target.entity === 'VARIABLE') {
    const variable = snapshot.variables.find(candidate => candidate.id === target.id);
    return variable
      ? `${variable.name} · Variable ID ${variable.id}`
      : `Variable ID ${target.id}`;
  }
  if (target.entity === 'BLOCK') {
    const block = snapshot.blocks.find(candidate => candidate.id === target.id);
    return block
      ? `Block #${block.order ?? block.id} ${block.name} · ID ${block.id}`
      : `Block ID ${target.id}`;
  }
  const instruction = snapshot.commands.find(candidate => candidate.id === target.id);
  return instruction
    ? `#${instruction.instructionOrder ?? '?'} ${instruction.name || instruction.command} · ID ${target.id}`
    : `Instruction ID ${target.id}`;
};

const relationshipTargetValue = (target: RelationshipTarget): string => {
  const owner = target.owner.workspaceKind === 'BOT_JOB'
    ? `BOT_JOB:${target.owner.homeBankingId}:${target.owner.botJobId}`
    : `COMPONENT:${target.owner.homeBankingId}`;
  return `${target.entity}:${owner}:${target.id}`;
};

const batchRelationshipLabel = (
  kind: VariablesBatchEditableRelationshipKind,
): string => {
  switch (kind) {
    case 'ELEMENT_TARGET':
      return 'Web Element';
    case 'VARIABLE_BINDING':
      return 'Variable';
    case 'LOOP_ANCHOR':
      return 'LOOP anchor';
    case 'CONDITIONAL_ROOT':
      return 'Conditional root';
    case 'BLOCK_TARGET':
      return 'GOTO Block';
    default:
      return kind;
  }
};

const batchSourceLabels = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): { label: string; sublabel: string; blockId: number | null } => {
  const command = snapshot.commands.find(candidate =>
    candidate.id === instructionId);
  if (!command) {
    return {
      label: `Instruction ID ${instructionId}`,
      sublabel: 'Current Bot Job',
      blockId: null,
    };
  }
  return {
    label: `#${command.instructionOrder ?? '?'} ${command.name || command.command} · ID ${instructionId}`,
    sublabel: `Block #${command.blockOrder ?? '?'} ${command.blockName || command.blockId || 'Unavailable'}`,
    blockId: command.blockId,
  };
};

const batchResolveModalItems = (
  snapshot: VariableWorkspaceSnapshot,
  review: VariablesBatchResolveReview,
): VariablesConnectionReviewItem[] => review.items.map((item) => {
  const source = batchSourceLabels(snapshot, item.sourceInstructionId);
  // A CheckValue missing both operands counts as TWO variable repairs.
  const missingSlotCount = item.kind === 'VARIABLE_BINDING'
    ? (() => {
        const command = snapshot.commands.find(
          candidate => candidate.id === item.sourceInstructionId,
        );
        return command ? Math.max(missingVariableSlots(command).length, 1) : 1;
      })()
    : undefined;
  const stateTone: VariablesConnectionReviewItem['stateTone'] =
    item.resolution === 'AUTO' || item.resolution === 'REVIEWED'
      ? 'green'
      : item.resolution === 'REVIEW_REQUIRED'
        ? 'orange'
        : item.resolution === 'SKIPPED'
          ? 'gray'
          : 'red';
  const state = item.resolution === 'AUTO'
    ? 'AUTO SELECTED'
    : item.resolution === 'REVIEWED'
      ? 'REVIEWED'
      : item.resolution === 'REVIEW_REQUIRED'
        ? 'SELECT TARGET'
        : item.resolution === 'UNAVAILABLE'
          ? 'NO COMPATIBLE TARGET'
          : item.resolution === 'BLOCKED'
            ? 'SELECT PARENT FIRST'
            : 'SKIPPED';
  return {
    id: item.reviewId,
    blockId: source.blockId,
    sourceLabel: source.label,
    sourceSublabel: source.sublabel,
    relationLabel: batchRelationshipLabel(item.kind),
    state,
    stateTone,
    missingSlotCount,
    currentTargetLabel: relationshipTargetLabel(
      snapshot,
      item.currentTarget,
    ),
    compatibleOptions: item.compatibleTargets.map(target => ({
      value: relationshipTargetValue(target),
      label: relationshipTargetLabel(snapshot, target)
        ?? `${target.entity} ID ${target.id}`,
      sublabel: target.entity.replaceAll('_', ' '),
      badges: [{ text: target.entity, tone: 'blue' as const }],
      keywords: [
        target.entity,
        target.id,
        relationshipTargetLabel(snapshot, target),
      ].join(' '),
    })),
    initialOptionValue: item.selectedTarget
      ? relationshipTargetValue(item.selectedTarget)
      : null,
  };
});

const batchReleaseModalItems = (
  snapshot: VariableWorkspaceSnapshot,
  plan: VariablesBatchReleasePlan,
): VariablesConnectionReviewItem[] => {
  const owner = {
    workspaceKind: 'BOT_JOB' as const,
    homeBankingId: snapshot.botJob.homeBankingId,
    botJobId: snapshot.botJob.id,
  };
  const relationItems = plan.draft.instructionRelationPatches.map((patch) => {
    const source = batchSourceLabels(snapshot, patch.instructionId);
    const currentTarget: RelationshipTarget | null =
      patch.expected.parentId !== null
        ? {
            entity: 'INSTRUCTION',
            owner,
            id: patch.expected.parentId,
          }
        : patch.expected.parentBlockId !== null
          ? {
              entity: 'BLOCK',
              owner,
              id: patch.expected.parentBlockId,
            }
          : null;
    return {
      id: `${patch.instructionId}:${patch.relationKind}`,
      blockId: source.blockId,
      sourceLabel: source.label,
      sourceSublabel: source.sublabel,
      relationLabel: batchRelationshipLabel(patch.relationKind),
      state: 'WILL RELEASE',
      stateTone: 'red' as const,
      currentTargetLabel: relationshipTargetLabel(snapshot, currentTarget),
    };
  });
  const variableItems = plan.draft.variableBindingPatches.map((patch) => {
    const source = batchSourceLabels(snapshot, patch.instructionId);
    const currentTarget: RelationshipTarget | null =
      patch.expected.value === null
        ? null
        : {
            entity: 'VARIABLE',
            owner,
            id: patch.expected.value,
          };
    return {
      id: `${patch.instructionId}:VARIABLE_BINDING`,
      blockId: source.blockId,
      sourceLabel: source.label,
      sourceSublabel: source.sublabel,
      relationLabel: batchRelationshipLabel('VARIABLE_BINDING'),
      state: 'WILL RELEASE',
      stateTone: 'red' as const,
      currentTargetLabel: relationshipTargetLabel(snapshot, currentTarget),
    };
  });
  return [...relationItems, ...variableItems];
};

const buildPendingReleaseConnections = (
  snapshot: VariableWorkspaceSnapshot,
  scope: VariablesConnectionScope,
): PendingReleaseBuildResult => {
  const planned = planVariablesBatchRelease(snapshot, scope.instructionIds);
  if (!planned.ok) return { ok: false, message: planned.message };
  return {
    ok: true,
    pending: {
      mode: 'RELEASE',
      authorityKey: planned.plan.authorityKey,
      scope,
      plan: planned.plan,
      items: batchReleaseModalItems(snapshot, planned.plan),
    },
  };
};

const InstructionCard: React.FC<{
  instruction: VariableInstructionNode;
  tone: 'owner' | 'producer' | 'consumer' | 'literal' | 'invalid';
  connectedVariableId?: number;
  emptyLabel?: never;
}> = ({ instruction, tone, connectedVariableId }) => (
  <article
    className={`${styles.instructionCard} ${styles[`instruction_${tone}`]}`}
    title={instruction.id ? `Instruction ${instruction.id}` : undefined}
  >
    <div className={styles.instructionTopLine}>
      <span className={styles.commandChip}>{instruction.command || 'FIELD'}</span>
      <span className={styles.instructionId}>
        {instruction.id ? `ID ${instruction.id}` : 'Missing ID'}
      </span>
    </div>
    <strong>{instruction.name || 'Unnamed instruction'}</strong>
    <span className={styles.location}>{instructionLocation(instruction)}</span>
    {!hidesLegacyVariableOperation(instruction.command)
      && instruction.operation && (
      <code className={styles.operation} title={instruction.operation}>
        {instruction.operation}
      </code>
      )}
    {(instruction.active === false || instruction.blockActive === false) && (
      <span className={styles.inactivePill}>Inactive in execution</span>
    )}
    {connectedVariableId !== undefined && instruction.variableSlots
      ?.filter(slot => slot.variableId === connectedVariableId)
      .map(slot => (
        <span key={`${instruction.id}:${slot.slot}`} className={styles.slotPill}>
          {slot.slot}
        </span>
      ))}
  </article>
);

const EmptyRelation: React.FC<{
  title: string;
  detail: string;
  danger?: boolean;
}> = ({ title, detail, danger = false }) => (
  <div className={`${styles.emptyRelation} ${danger ? styles.emptyDanger : ''}`}>
    <strong>{title}</strong>
    <span>{detail}</span>
  </div>
);

const RelationGroup: React.FC<{
  title: string;
  count: number;
  items: VariableCommandLink[];
  tone: 'consumer' | 'literal' | 'invalid';
  emptyText: string;
  connectedVariableId?: number;
}> = ({ title, count, items, tone, emptyText, connectedVariableId }) => (
  <section className={styles.relationGroup}>
    <div className={styles.relationGroupTitle}>
      <span>{title}</span>
      <b>{count}</b>
    </div>
    <div className={styles.relationList}>
      {items.length > 0
        ? items.map(command => (
          <InstructionCard
            key={`${tone}:${command.id ?? command.name}`}
            instruction={command}
            tone={tone}
            connectedVariableId={connectedVariableId}
          />
        ))
        : <span className={styles.relationEmpty}>{emptyText}</span>}
    </div>
  </section>
);

const DiagnosticsPanel: React.FC<{
  title: string;
  diagnostics: VariableDiagnostic[];
}> = ({ title, diagnostics }) => (
  <section className={styles.diagnosticsPanel}>
    <div className={styles.diagnosticsTitle}>
      <ShieldAlert size={17} aria-hidden="true" />
      <h3>{title}</h3>
    </div>
    {diagnostics.map((diagnostic, index) => (
      <article
        key={`${diagnostic.code}:${diagnostic.variableId ?? ''}:${diagnostic.instructionId ?? index}`}
        className={diagnostic.severity === 'ERROR'
          ? styles.diagnosticError
          : styles.diagnosticWarning}
      >
        <strong>{diagnostic.code.replaceAll('_', ' ')}</strong>
        <span>{diagnostic.message}</span>
      </article>
    ))}
  </section>
);

const VariableTreeRow: React.FC<{
  variable: VariableGraphEntry;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}> = ({
  variable,
  selected,
  expanded,
  onSelect,
  onToggle,
}) => {
  const valuePresentation = variableValuePresentation(variable);
  const ownerBlockLabel = variable.owner
    ? `#${variable.owner.blockOrder ?? variable.owner.blockId ?? '?'} ${variable.owner.blockName || 'Block'}`
    : 'No owner block';
  // Commands may legitimately read/check the variable from other blocks.
  const extraBlockCount = new Set(
    variable.commands
      .map(command => command.blockId)
      .filter((blockId): blockId is number =>
        blockId != null && blockId !== variable.owner?.blockId),
  ).size;
  return (
    <article className={`${styles.treeItem} ${selected ? styles.treeItemSelected : ''}`}>
      <div className={styles.treeItemRow}>
        <button
          type="button"
          className={styles.treeToggle}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${variable.name}`}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={expanded ? '' : styles.chevronClosed}
          />
        </button>
        <button type="button" className={styles.treeSelect} onClick={onSelect}>
          <span className={styles.treeIdentity}>
            <strong title={variable.name}>{variable.name}</strong>
            <small>{variable.type || 'Variable'} · ID {variable.id}</small>
            <span
              className={styles.treeBlockChip}
              title={extraBlockCount > 0
                ? `Owner block ${ownerBlockLabel}; commands span ${extraBlockCount} other block(s)`
                : `Owner block ${ownerBlockLabel}`}
            >
              {ownerBlockLabel}
              {extraBlockCount > 0 ? ` +${extraBlockCount}` : ''}
            </span>
          </span>
          <span className={`${styles.healthBadge} ${healthTone(variable.health)}`}>
            {healthLabel(variable.health)}
          </span>
        </button>
      </div>
      {expanded && (
        <button type="button" className={styles.treeDetails} onClick={onSelect}>
          <span>
            <b>Block</b>
            {ownerBlockLabel}
          </span>
          <span>
            <b>Owner</b>
            {variable.owner?.name || 'Missing owner'}
          </span>
          <span>
            <b>GET</b>
            {valuePresentation.activeProducers.length}
          </span>
          <span>
            <b>Reads</b>
            {variable.consumers.length}
          </span>
          <span>
            <b>SET</b>
            {variable.literalAssignments.length}
          </span>
        </button>
      )}
    </article>
  );
};

const VariablesPage: React.FC<Props> = ({
  socketPort,
  sessionId,
  onClose,
}) => {
  useEffect(() => {
    document.title = 'Variables';
  }, []);
  const {
    webSocket,
    connected,
    reconnectAttempts,
    messages,
    error,
  } = useWebSocket(socketPort, sessionId);
  const processedMessagesRef = useRef(0);
  const requestCounterRef = useRef(0);
  const snapshotRef = useRef<VariableWorkspaceSnapshot | null>(null);
  const pendingRequestRef = useRef<PendingRequest | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snapshot, setSnapshot] = useState<VariableWorkspaceSnapshot | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<number | null>(null);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('ALL');
  const [selectedInstructionId, setSelectedInstructionId] =
    useState<number | null>(null);
  const [variableResolutionMode, setVariableResolutionMode] =
    useState<VariableResolutionMode>('DISTINCT');
  const [editingCommandId, setEditingCommandId] = useState<number | null>(null);
  const [addingCommand, setAddingCommand] = useState(false);
  const [sharedBlockFilters, setSharedBlockFilters] = useState<number[]>([]);
  const [draggingInstructionId, setDraggingInstructionId] =
    useState<number | null>(null);
  const [activeDropTarget, setActiveDropTarget] =
    useState<VariablesCommandDropTarget | null>(null);
  const commandDragSourceRef = useRef<{
    instructionId: number;
    blockId: number;
    index: number;
  } | null>(null);
  const [pendingReconnect, setPendingReconnect] =
    useState<PendingReconnect | null>(null);
  const [rightVariableReconnectInstructionId, setRightVariableReconnectInstructionId] =
    useState<number | null>(null);
  const [pendingConnections, setPendingConnections] =
    useState<PendingConnections | null>(null);
  const [pendingBlockTransfer, setPendingBlockTransfer] =
    useState<PendingBlockTransfer | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<VariableDeleteConfirmation | null>(null);
  const [commandDeleteConfirmation, setCommandDeleteConfirmation] =
    useState<CommandDeleteConfirmation | null>(null);
  const [addVariableOpen, setAddVariableOpen] = useState(false);
  const [addVariableSuccessVersion, setAddVariableSuccessVersion] = useState(0);
  const [clearValuesConfirmation, setClearValuesConfirmation] = useState(false);
  const [deletingVariableIds, setDeletingVariableIds] =
    useState<ReadonlySet<number>>(() => new Set());
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for Variables workspace',
  });
  const checkOperandIntentRef = useRef<
    | {
      kind: 'RESOLVE_CHECKVALUES';
      variableMode: VariableResolutionMode;
      awaitingSlot?: { instructionId: number; slot: 'LEFT' | 'RIGHT' };
    }
    | { kind: 'RELEASE'; instructionIds: readonly number[] }
    | null
  >(null);
  const checkOperandAttemptsRef = useRef(0);
  const [checkOperandKick, setCheckOperandKick] = useState(0);
  const remainingVariableIntentRef = useRef<{
    instructionIds: readonly number[];
    variableMode: VariableResolutionMode;
    creatingName: string | null;
    awaitingInstructionId: number | null;
  } | null>(null);
  const [remainingVariableKick, setRemainingVariableKick] = useState(0);
  const pendingCheckStartGraphVersionRef = useRef<number | null>(null);
  const pendingVariableResolutionModeRef = useRef<VariableResolutionMode>('DISTINCT');
  const suppressIfFamilyAutoRepairRef = useRef(false);
  const releaseSequenceRef = useRef<{
    instructionIds: readonly number[];
    phase: 'PARENT' | 'LEFT' | 'RIGHT' | 'OTHER';
    awaitingInstructionId: number | null;
  } | null>(null);
  const [releaseSequenceKick, setReleaseSequenceKick] = useState(0);
  const {
    pendingRequestId: pendingStructuralMutationRequestId,
    submit: submitGraphMutation,
    handleMessage: handleGraphMutationMessage,
    resetPending: resetGraphMutation,
  } = useVariablesGraphMutationParent({
    webSocket,
    connected,
    snapshot,
  });
  const {
    pendingRequestId: pendingCheckValueLeftRequestId,
    submit: submitCheckValueLeft,
    handleMessage: handleCheckValueLeftMessage,
    resetPending: resetCheckValueLeft,
  } = useVariablesGraphMutationLeft({
    webSocket,
    connected,
    snapshot,
  });
  const {
    pendingRequestId: pendingGraphMutationCommandVariableRequestId,
    submit: submitGraphMutationCommandVariable,
    handleMessage: handleGraphMutationCommandVariableMessage,
    resetPending: resetGraphMutationCommandVariable,
  } = useVariablesGraphMutationCommandVariable({
    webSocket,
    connected,
    snapshot,
  });
  const pendingMutationRequestId = pendingStructuralMutationRequestId
    ?? pendingGraphMutationCommandVariableRequestId;
  const {
    reviewState: executionFlowReview,
    openReview: openExecutionFlowReview,
    closeReview: closeExecutionFlowReview,
  } = useVariablesExecutionFlowReview(snapshot);

  const replaceSnapshot = useCallback((
    next: VariableWorkspaceSnapshot,
    ownerChanged = false,
  ) => {
    const previous = snapshotRef.current;
    snapshotRef.current = next;
    setSnapshot(next);
    setVariableResolutionMode(next.preferences?.variableResolutionMode ?? 'DISTINCT');
    setSharedBlockFilters(current => previous === null || ownerChanged
      ? next.blocks.map(block => block.id)
      : current.filter(blockId => next.blocks.some(block => block.id === blockId)));
    setSelectedVariableId(current =>
      !ownerChanged
      && current !== null
      && next.variables.some(variable => variable.id === current)
        ? current
        : next.variables[0]?.id ?? null);
    setSelectedInstructionId(current =>
      !ownerChanged
      && current !== null
      && next.commands.some(command => command.id === current)
        ? current
        : next.commands[0]?.id ?? null);
  }, []);

  const replaceRuntimeMemory = useCallback((
    runtimeMemory: VariableWorkspaceSnapshot['runtimeMemory'],
  ) => {
    const current = snapshotRef.current;
    if (!current) return;
    if (runtimeMemory.revision < current.runtimeMemory.revision) return;
    const next = { ...current, runtimeMemory };
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const {
    pendingVariableIds,
    pendingClearAll,
    updateValue: updateRuntimeValue,
    clearAllValues,
    handleMessage: handleRuntimeMemoryMessage,
    resetPending: resetRuntimeMemory,
  } = useVariablesRuntimeMemory({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onMemory: replaceRuntimeMemory,
    onStatus: setStatus,
  });

  const submitVariableCreateRef = useRef<(
    draft: AddVariableDraft,
  ) => string | null>(() => null);
  const refreshVariablesWorkspaceRef = useRef<() => boolean>(() => false);
  const variableCreationRefreshRequiredRef = useRef(false);
  const createVariableBatchRef = useRef<{
    names: string[];
    nextIndex: number;
    createdIds: number[];
  } | null>(null);
  type LegacyVariableAutoResolveRun = {
    phase: 'CREATING' | 'BINDINGS' | 'RIGHT_OPERANDS';
    plan: VariableAutoResolvePlan;
    createIndex: number;
    createdIdByName: Map<string, number>;
    submittedBindings: boolean;
    stalls: number;
  };
  // Transitional compatibility only; the production AUTO/Resolve entry points
  // now use the single atomic backend batch request and never populate this ref.
  const variableAutoResolveRunRef = useRef<LegacyVariableAutoResolveRun | null>(null);

  const handleVariableCreateResult = useCallback((
    result: VariablesCreateResult,
  ) => {
    if (!result.ok && remainingVariableIntentRef.current) {
      remainingVariableIntentRef.current = null;
    }
    const autoRun = variableAutoResolveRunRef.current;
    if (autoRun && autoRun.phase === 'CREATING') {
      const creation = autoRun.plan.creations[autoRun.createIndex];
      if (!result.ok || result.variableId === null || !creation) {
        variableAutoResolveRunRef.current = null;
        setStatus({
          level: 'error',
          text: result.error
            || 'Auto-resolve stopped: a variable could not be created.',
        });
        return;
      }
      autoRun.createdIdByName.set(creation.name, result.variableId);
      autoRun.createIndex += 1;
      const next = autoRun.plan.creations[autoRun.createIndex];
      if (next) {
        const requestId = submitVariableCreateRef.current({ name: next.name });
        if (!requestId) {
          variableAutoResolveRunRef.current = null;
          setStatus({
            level: 'error',
            text: `Auto-resolve stopped: “${next.name}” could not be started.`,
          });
          return;
        }
        setStatus({
          level: 'warn',
          text: `Auto-resolve: creating variable “${next.name}” (${autoRun.createIndex + 1} of ${autoRun.plan.creations.length})...`,
        });
        return;
      }
      autoRun.phase = 'BINDINGS';
      setStatus({
        level: 'warn',
        text: 'Auto-resolve: variables created. Connecting commands...',
      });
      return;
    }
    const batch = createVariableBatchRef.current;
    if (result.ok && batch) {
      if (result.variableId !== null) batch.createdIds.push(result.variableId);
      const nextIndex = batch.nextIndex + 1;
      if (nextIndex < batch.names.length) {
        batch.nextIndex = nextIndex;
        const nextName = batch.names[nextIndex];
        const nextRequestId = submitVariableCreateRef.current({ name: nextName });
        if (nextRequestId) {
          setStatus({
            level: 'warn',
            text: `Creating variable ${nextIndex + 1} of ${batch.names.length}: “${nextName}”...`,
          });
          return;
        }
        createVariableBatchRef.current = null;
        setStatus({
          level: 'error',
          text: `${batch.createdIds.length} variable(s) were created, but “${nextName}” could not be started.`,
        });
        return;
      }
      createVariableBatchRef.current = null;
      setAddVariableSuccessVersion(current => current + 1);
      variableCreationRefreshRequiredRef.current = true;
      refreshVariablesWorkspaceRef.current();
      setStatus({
        level: 'ok',
        text: batch.names.length === 1
          ? result.message || `Variable #${result.variableId ?? '?'} created.`
          : `${batch.names.length} variables created. The modal remains open.`,
      });
      return;
    }
    if (result.ok && remainingVariableIntentRef.current) {
      variableCreationRefreshRequiredRef.current = true;
      refreshVariablesWorkspaceRef.current();
    }
    createVariableBatchRef.current = null;
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message || `Variable #${result.variableId ?? '?'} created.`
        : result.error || 'Variable creation was refused.',
    });
  }, []);

  const {
    pendingRequestId: pendingCreateRequestId,
    submit: submitVariableCreate,
    handleMessage: handleVariableCreateMessage,
    resetPending: resetVariableCreate,
  } = useVariablesCreate({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleVariableCreateResult,
  });
  submitVariableCreateRef.current = submitVariableCreate;

  const handleVariableAutoResolveResult = useCallback((
    result: VariablesAutoResolveResult,
  ) => {
    setPendingConnections(null);
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message || 'Variables created and connected in one transaction.'
        : result.error || 'Variable auto-resolution was refused.',
    });
  }, []);

  const {
    pendingRequestId: pendingVariableAutoResolveRequestId,
    submit: submitVariableAutoResolve,
    handleMessage: handleVariableAutoResolveMessage,
  } = useVariablesAutoResolve({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleVariableAutoResolveResult,
  });

  const handleVariableDeleteResult = useCallback((
    result: VariablesDeleteResult,
  ) => {
    setDeletingVariableIds(new Set());
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message
          || `Deleted ${result.deletedCount} variable(s) and cleared ${result.clearedInstructionCount} instruction binding(s).`
        : result.error || 'Variable deletion was refused.',
    });
  }, []);

  const {
    pendingRequestId: pendingDeleteRequestId,
    submit: submitVariableDelete,
    handleMessage: handleVariableDeleteMessage,
    resetPending: resetVariableDelete,
  } = useVariablesDelete({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleVariableDeleteResult,
  });

  const handleCommandDeleteResult = useCallback((
    result: VariablesCommandDeleteResult,
  ) => {
    if (result.ok && result.instructionId !== null) {
      setSelectedInstructionId(current =>
        current === result.instructionId ? null : current);
      setEditingCommandId(current =>
        current === result.instructionId ? null : current);
    }
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message
          || `Command deleted. ${result.disconnectedInstructionCount} command connection(s) and ${result.disconnectedVariableCount} variable owner connection(s) were cleared.`
        : result.error || 'Command deletion was refused.',
    });
  }, []);

  const {
    pendingRequestId: pendingCommandDeleteRequestId,
    submit: submitCommandDelete,
    handleMessage: handleCommandDeleteMessage,
    resetPending: resetCommandDelete,
  } = useVariablesCommandDelete({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleCommandDeleteResult,
  });

  const handleInstructionStatusResult = useCallback((
    result: VariablesInstructionStatusResult,
  ) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? `Command ${result.active ? 'activated' : 'deactivated'}.`
        : 'The command status was not changed.'),
    });
  }, []);

  const {
    pendingInstructionId: pendingStatusInstructionId,
    submit: submitInstructionStatus,
    handleMessage: handleInstructionStatusMessage,
    resetPending: resetInstructionStatus,
  } = useVariablesInstructionStatus({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleInstructionStatusResult,
  });

  const clearPendingRequest = useCallback(() => {
    if (pendingTimeoutRef.current !== null) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    pendingRequestRef.current = null;
    setPendingRequest(null);
  }, []);

  const sendWorkspaceRequest = useCallback((
    operation: 'variablesWorkspace.bootstrap' | 'variablesWorkspace.refresh',
  ) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      setStatus({ level: 'error', text: 'Variables is not connected.' });
      return false;
    }
    if (pendingRequestRef.current) return false;
    requestCounterRef.current += 1;
    const requestId = `${Date.now()}-variables-${requestCounterRef.current}`;
    const body = {
      requestId,
      bindingEpoch: operation.endsWith('refresh')
        ? snapshotRef.current?.bindingEpoch || ''
        : '',
    };
    const nextPending = { requestId, operation };
    pendingRequestRef.current = nextPending;
    setPendingRequest(nextPending);
    try {
      webSocket.send(JSON.stringify({
        type: operation,
        sessionId,
        body: JSON.stringify(body),
      }));
    } catch (sendError) {
      clearPendingRequest();
      setStatus({
        level: 'error',
        text: sendError instanceof Error
          ? sendError.message
          : 'The Variables request could not be sent.',
      });
      return false;
    }
    pendingTimeoutRef.current = setTimeout(() => {
      if (pendingRequestRef.current?.requestId !== requestId) return;
      pendingRequestRef.current = null;
      pendingTimeoutRef.current = null;
      setPendingRequest(null);
      setStatus({
        level: 'error',
        text: snapshotRef.current
          ? 'The Variables request did not return. The last variable graph remains visible.'
          : 'The Variables request did not return. Retry when the connection is ready.',
      });
    }, REQUEST_TIMEOUT_MS);
    setStatus({
      level: 'warn',
      text: operation.endsWith('refresh')
        ? 'Refreshing variable relationships...'
        : 'Loading variable relationships...',
    });
    return true;
  }, [clearPendingRequest, sessionId, webSocket]);
  refreshVariablesWorkspaceRef.current = () => {
    const sent = sendWorkspaceRequest('variablesWorkspace.refresh');
    if (sent) variableCreationRefreshRequiredRef.current = false;
    return sent;
  };

  useEffect(() => {
    if (!variableCreationRefreshRequiredRef.current || pendingRequest !== null) return;
    refreshVariablesWorkspaceRef.current();
  }, [pendingRequest, sendWorkspaceRequest]);

  const handleGraphMutationRightResult = useCallback((
    result: VariablesGraphMutationRightResult,
  ) => {
    if (!result.ok && checkOperandIntentRef.current?.kind === 'RESOLVE_CHECKVALUES') {
      checkOperandIntentRef.current = null;
      checkOperandAttemptsRef.current = 0;
    }
    if (!result.ok && releaseSequenceRef.current?.phase === 'RIGHT') {
      releaseSequenceRef.current = null;
    }
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message || 'CheckValue right operand changed.'
        : result.error || 'The right-operand connection was refused.',
    });
    if (result.ok) {
      sendWorkspaceRequest('variablesWorkspace.refresh');
    }
  }, [sendWorkspaceRequest]);

  const {
    pendingRequestId: pendingCheckValueRightRequestId,
    submit: submitCheckValueRight,
    handleMessage: handleCheckValueRightMessage,
  } = useVariablesGraphMutationRight({
    webSocket,
    connected,
    sessionId,
    snapshot,
    operationType: 'variablesWorkspace.graphMutationRight',
    responseType: 'variablesWorkspace.graphMutationRightResponse',
    onResult: handleGraphMutationRightResult,
  });

  const handleInstructionCopyResult = useCallback((
    result: VariablesInstructionCopyResult,
  ) => {
    setDraggingInstructionId(null);
    setActiveDropTarget(null);
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message
          || `Created ${result.createdInstructionIds.length} new instruction(s).`
        : result.error || 'The instruction copy was refused.',
    });
    if (result.ok) {
      sendWorkspaceRequest('variablesWorkspace.refresh');
    }
  }, [sendWorkspaceRequest]);

  const {
    pendingRequestId: pendingCopyRequestId,
    submit: submitInstructionCopy,
    handleMessage: handleInstructionCopyMessage,
    resetPending: resetInstructionCopy,
  } = useVariablesInstructionCopy({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleInstructionCopyResult,
  });

  const handleCommandUpdateResult = useCallback((
    result: VariablesCommandUpdateResult,
  ) => {
    if (!result.ok && variableAutoResolveRunRef.current) {
      variableAutoResolveRunRef.current = null;
    }
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? 'Command updated.'
        : 'The command update was refused.'),
    });
    if (result.ok) sendWorkspaceRequest('variablesWorkspace.refresh');
  }, [sendWorkspaceRequest]);

  const {
    pendingRequestId: pendingCommandUpdateRequestId,
    submit: submitCommandUpdate,
    handleMessage: handleCommandUpdateMessage,
    resetPending: resetCommandUpdate,
  } = useVariablesCommandEditorUpdate({
    webSocket,
    connected,
    snapshot,
    onResult: handleCommandUpdateResult,
  });

  // Operator edits use the command-update contract. graphMutationRight remains
  // exclusively responsible for CHECKVALUE RIGHT-slot connect/disconnect.
  const changeCheckOperator = useCallback((
    instructionId: number,
    comparisonOperator: string,
  ) => {
    const current = snapshotRef.current;
    const command = current?.commands.find(entry => entry.id === instructionId);
    if (!command || command.blockId === null) {
      setStatus({ level: 'error', text: 'The CheckValue command is not available.' });
      return;
    }
    const configuration = commandEditorConfiguration(
      command.command,
      command.operation,
      command.onHoldSeconds ?? null,
      command.commandConfiguration ?? null,
      command.variableId ?? null,
    );
    if (configuration.kind !== 'CHECK_VALUE' && configuration.kind !== 'EXTERNAL_CHECK') {
      setStatus({ level: 'error', text: 'The selected command is not a CheckValue.' });
      return;
    }
    const requestId = submitCommandUpdate({
      action: 'UPDATE',
      sourceInstructionId: instructionId,
      targetBlockId: command.blockId,
      placement: { kind: 'KEEP' },
      draft: {
        name: command.name,
        action: command.command,
        operation: command.operation,
        configuration: {
          ...configuration,
          operator: comparisonOperator as typeof configuration.operator,
        },
      },
      allowRelationshipDisconnect: false,
      allowConditionalFamilyDissolve: false,
      conditionalFamilyDeleteIds: [],
    });
    if (!requestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. The operator was not changed.',
      });
      return;
    }
    setStatus({
      level: 'warn',
      text: `Updating the comparison operator for command #${instructionId}...`,
    });
  }, [submitCommandUpdate]);

  const handleCommandCopyResult = useCallback((
    result: VariablesCommandCopyResult,
  ) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? `Command copied as instruction ID ${result.createdInstructionId ?? 'new'}.`
        : 'The command copy was refused.'),
    });
    if (result.ok) sendWorkspaceRequest('variablesWorkspace.refresh');
  }, [sendWorkspaceRequest]);

  const {
    pendingRequestId: pendingCommandCopyRequestId,
    submit: submitCommandCopy,
    handleMessage: handleCommandCopyMessage,
    resetPending: resetCommandCopy,
  } = useVariablesCommandEditorCopy({
    webSocket,
    connected,
    snapshot,
    onResult: handleCommandCopyResult,
  });

  const handleCommandCreateResult = useCallback((
    result: VariablesCommandCreateResult,
  ) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.message || (result.ok
        ? `Command added as instruction ID ${result.createdInstructionId ?? 'new'}.`
        : 'Add Command was refused.'),
    });
    if (result.ok) sendWorkspaceRequest('variablesWorkspace.refresh');
  }, [sendWorkspaceRequest]);

  const {
    pendingRequestId: pendingCommandCreateRequestId,
    submit: submitCommandCreate,
    handleMessage: handleCommandCreateMessage,
    resetPending: resetCommandCreate,
  } = useVariablesCommandEditorCreate({
    webSocket,
    connected,
    snapshot,
    onResult: handleCommandCreateResult,
  });

  const resetOwnerScopedUi = useCallback(() => {
    createVariableBatchRef.current = null;
    clearPendingRequest();
    resetGraphMutation();
    resetCheckValueLeft();
    resetGraphMutationCommandVariable();
    resetInstructionCopy();
    resetCommandUpdate();
    resetCommandCopy();
    resetCommandCreate();
    resetVariableCreate();
    resetVariableDelete();
    resetCommandDelete();
    resetInstructionStatus();
    resetRuntimeMemory();
    closeExecutionFlowReview();
    setHealthFilter('ALL');
    setSharedBlockFilters([]);
    setDraggingInstructionId(null);
    setActiveDropTarget(null);
    setPendingReconnect(null);
    setPendingConnections(null);
    setPendingBlockTransfer(null);
    setDeleteConfirmation(null);
    setCommandDeleteConfirmation(null);
    setAddVariableOpen(false);
    setAddingCommand(false);
    setClearValuesConfirmation(false);
    setDeletingVariableIds(new Set());
  }, [
    clearPendingRequest,
    closeExecutionFlowReview,
    resetGraphMutation,
    resetCheckValueLeft,
    resetGraphMutationCommandVariable,
    resetInstructionCopy,
    resetCommandCopy,
    resetCommandCreate,
    resetCommandUpdate,
    resetRuntimeMemory,
    resetVariableCreate,
    resetVariableDelete,
    resetCommandDelete,
    resetInstructionStatus,
  ]);

  useEffect(() => {
    if (!connected) {
      clearPendingRequest();
      return;
    }
    sendWorkspaceRequest('variablesWorkspace.bootstrap');
  }, [clearPendingRequest, connected, sendWorkspaceRequest]);

  useEffect(() => () => {
    if (pendingTimeoutRef.current !== null) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (processedMessagesRef.current > messages.length) {
      processedMessagesRef.current = 0;
    }
    const pending = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;

    pending.forEach(raw => {
      if (handleVariableAutoResolveMessage(raw)) return;
      if (handleCommandCreateMessage(raw)) return;
      if (handleCommandCopyMessage(raw)) return;
      if (handleCommandUpdateMessage(raw)) return;
      if (handleInstructionCopyMessage(raw)) return;
      if (handleVariableCreateMessage(raw)) return;
      if (handleVariableDeleteMessage(raw)) return;
      if (handleCommandDeleteMessage(raw)) return;
      if (handleCheckValueRightMessage(raw)) return;
      if (handleInstructionStatusMessage(raw)) return;
      if (handleCheckValueLeftMessage(raw)) return;
      if (handleGraphMutationCommandVariableMessage(raw)) return;
      if (handleGraphMutationMessage(raw)) return;
      if (handleRuntimeMemoryMessage(raw)) return;
      let envelope: VariablesWorkspaceEnvelope;
      try {
        envelope = parseVariablesWorkspaceMessage(raw);
      } catch (messageError) {
        console.error('Could not read Variables response:', messageError);
        setStatus({ level: 'error', text: 'A Variables response could not be read.' });
        return;
      }
      if (!acceptedOperations.has(envelope.operationId)) return;

      const body = asObject(envelope.body);
      const isResponse = envelope.operationId.endsWith('Response');
      if (isResponse) {
        const requestId = typeof body?.requestId === 'string'
          ? body.requestId.trim()
          : '';
        const pending = pendingRequestRef.current;
        if (!pending || !requestId || requestId !== pending.requestId) return;
        const expectedOperation = pending.operation.endsWith('refresh')
          ? 'variablesWorkspace.refreshResponse'
          : 'variablesWorkspace.bootstrapResponse';
        if (
          envelope.operationId !== 'variablesWorkspace.errorResponse'
          && envelope.operationId !== expectedOperation
        ) {
          return;
        }
        clearPendingRequest();
      }
      if (body?.ok === false) {
        setStatus({
          level: 'error',
          text: statusText(body, 'Variable relationships could not be refreshed.'),
        });
        return;
      }

      let normalized: VariableWorkspaceSnapshot | null = null;
      try {
        normalized = normalizeVariablesWorkspaceSnapshot(envelope.body);
      } catch (normalizationError) {
        console.error('Could not normalize Variables response:', normalizationError);
      }
      if (!normalized) {
        setStatus({
          level: 'error',
          text: 'The Variables response was incomplete. The last graph remains visible.',
        });
        return;
      }

      const current = snapshotRef.current;
      const sameBotJob = current !== null
        && current.botJob.homeBankingId === normalized.botJob.homeBankingId
        && current.botJob.id === normalized.botJob.id;
      if (
        current
        && sameBotJob
        && normalized.workspaceEpoch < current.workspaceEpoch
      ) {
        return;
      }
      if (envelope.operationId === 'variablesWorkspace.snapshot') {
        clearPendingRequest();
      }
      const ownerChanged = current !== null && !sameBotJob;
      if (ownerChanged) resetOwnerScopedUi();
      replaceSnapshot(normalized, ownerChanged);
      setStatus({
        level: normalized.summary.warningCount > 0 ? 'warn' : 'ok',
        text: normalized.message || 'Variable relationships loaded',
      });
    });
  }, [
    clearPendingRequest,
    handleGraphMutationMessage,
    handleCheckValueLeftMessage,
    handleGraphMutationCommandVariableMessage,
    handleCommandCreateMessage,
    handleCommandCopyMessage,
    handleCommandUpdateMessage,
    handleInstructionCopyMessage,
    handleRuntimeMemoryMessage,
    handleVariableCreateMessage,
    handleVariableAutoResolveMessage,
    handleVariableDeleteMessage,
    handleCommandDeleteMessage,
    handleCheckValueRightMessage,
    handleInstructionStatusMessage,
    messages,
    replaceSnapshot,
    resetOwnerScopedUi,
  ]);

  useEffect(() => {
    if (error) {
      setStatus({
        level: 'error',
        text: snapshotRef.current
          ? `${error} The last variable graph remains visible.`
          : error,
      });
    }
  }, [error]);

  const filteredVariables = useMemo(() => {
    return (snapshot?.variables ?? []).filter(variable => {
      const healthMatches = healthFilter === 'ALL'
        || (healthFilter === 'ISSUES'
          ? variable.health === 'WARNING' || variable.health === 'ERROR'
          : healthFilter === 'UNUSED'
            ? variable.unused
            : variable.health === healthFilter);
      return healthMatches;
    });
  }, [healthFilter, snapshot?.variables]);

  const variableSearchOptions = useMemo<SearchBoxOption[]>(
    () => filteredVariables.map(variable => ({
      value: String(variable.id),
      label: variable.name,
      sublabel: `${variable.type || 'Variable'} · ID ${variable.id}`,
      badges: [{
        text: healthLabel(variable.health).toLocaleUpperCase(),
        tone: variable.health === 'HEALTHY'
          ? 'green' as const
          : variable.health === 'ERROR'
            ? 'red' as const
            : 'blue' as const,
      }],
      keywords: variableSearchText(variable),
    })),
    [filteredVariables],
  );

  useEffect(() => {
    if (
      selectedVariableId === null
      || !filteredVariables.some(variable => variable.id === selectedVariableId)
    ) {
      setSelectedVariableId(filteredVariables[0]?.id ?? null);
    }
  }, [filteredVariables, selectedVariableId]);

  const selectedVariable = filteredVariables.find(
    variable => variable.id === selectedVariableId,
  ) ?? null;
  const selectedValuePresentation = selectedVariable
    ? variableValuePresentation(selectedVariable)
    : null;
  const selectedRuntimeValue = selectedVariable
    ? snapshot?.runtimeMemory.variables.find(
      entry => entry.variableId === selectedVariable.id,
    ) ?? null
    : null;
  const selectedWebElementEndpoints = selectedVariable && snapshot
    ? [...new Set(selectedVariable.commands
      .filter(command => ['GET', 'SET'].includes(
        canonicalInstructionAction(command.command),
      ))
      .map(command => command.parentId)
      .filter((id): id is number => id !== null))]
      .map(parentId => snapshot.commands.find(command => command.id === parentId) ?? null)
      .filter((command): command is VariableInstructionNode => command !== null)
    : [];
  const orderedRuntimeMemory = useMemo(
    () => snapshot
      ? orderRuntimeVariablesByExecution(
          snapshot.runtimeMemory.variables,
          snapshot.variables,
        )
      : [],
    [snapshot],
  );
  const workspaceIdentityKey = snapshot
    ? `${snapshot.botJob.homeBankingId}:${snapshot.botJob.id}`
    : 'unbound';
  const mutationAuthorityKey = mutationAuthorityKeyFor(snapshot);
  const relationshipGraph = useMemo(
    () => snapshot ? variablesReconnectGraph(snapshot) : null,
    [snapshot],
  );
  const editingCommandNode = snapshot && editingCommandId !== null
    ? snapshot.commands.find(command => command.id === editingCommandId) ?? null
    : null;
  const editingCommand: ComponentEditorCommand | null = editingCommandNode?.id == null
    ? null
    : {
        instructionId: editingCommandNode.id,
        instructionOrder: editingCommandNode.instructionOrder,
        instructionName: editingCommandNode.name,
        action: editingCommandNode.command,
        operation: editingCommandNode.operation,
        onHoldSeconds: editingCommandNode.onHoldSeconds ?? null,
        blockId: editingCommandNode.blockId,
        blockOrder: editingCommandNode.blockOrder,
        blockName: editingCommandNode.blockName,
        active: editingCommandNode.active,
        parentId: editingCommandNode.parentId,
        parentBlockId: editingCommandNode.parentBlockId,
        variableId: editingCommandNode.variableId,
        storedConfiguration: editingCommandNode.commandConfiguration ?? null,
      };
  const editorCommands: ComponentEditorCommand[] = snapshot?.commands.flatMap(command =>
    command.id === null ? [] : [{
      instructionId: command.id,
      instructionOrder: command.instructionOrder,
      instructionName: command.name,
      action: command.command,
      operation: command.operation,
      onHoldSeconds: command.onHoldSeconds ?? null,
      blockId: command.blockId,
      blockOrder: command.blockOrder,
      blockName: command.blockName,
      active: command.active,
      parentId: command.parentId,
      parentBlockId: command.parentBlockId,
      variableId: command.variableId,
      storedConfiguration: command.commandConfiguration ?? null,
    }]) ?? [];
  const editorScopeLabel = editingCommand
    ? `#${editingCommand.blockOrder ?? '?'} ${editingCommand.blockName || 'Unknown Block'} · #${editingCommand.instructionOrder ?? '?'} instruction`
    : 'No command selected';
  const addCommandBlock = snapshot?.blocks.find(block =>
    sharedBlockFilters.length === 1 && block.id === sharedBlockFilters[0])
    ?? snapshot?.blocks[0]
    ?? null;
  const addCommandDraft: ComponentEditorCommand | null = addCommandBlock
    ? {
        instructionId: 0,
        instructionOrder: null,
        instructionName: 'GetValue',
        action: 'GET',
        operation: '',
        onHoldSeconds: null,
        blockId: addCommandBlock.id,
        blockOrder: addCommandBlock.order,
        blockName: addCommandBlock.name,
        active: true,
        parentId: null,
        parentBlockId: null,
        variableId: null,
        storedConfiguration: null,
      }
    : null;

  useEffect(() => {
    if (editingCommandId !== null && !editingCommandNode) {
      setEditingCommandId(null);
    }
  }, [editingCommandId, editingCommandNode]);

  useEffect(() => {
    if (
      pendingReconnect
      && pendingReconnect.authorityKey !== mutationAuthorityKey
    ) {
      setPendingReconnect(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the reconnect action again.',
      });
    }
  }, [mutationAuthorityKey, pendingReconnect]);

  useEffect(() => {
    if (
      snapshot
      && pendingConnections
      && !validateVariablesBatchConnectionsAuthority(
        pendingConnections.authorityKey,
        snapshot,
      )
    ) {
      if (pendingConnections.mode === 'RESOLVE') {
        const refreshedScope = variablesConnectionScopeForBlocks(
          snapshot,
          pendingConnections.scope.blockIds,
          pendingConnections.scope.commandSearch,
        );
        const rebuilt = buildPendingResolveConnections(
          snapshot,
          refreshedScope,
          pendingConnections.reviewRevision + 1,
        );
        if (rebuilt.ok) {
          setPendingConnections(rebuilt.pending);
          return;
        }
        setPendingConnections(null);
        setStatus({ level: 'error', text: rebuilt.message });
        return;
      }
      const refreshedScope = variablesConnectionScopeForBlocks(
        snapshot,
        pendingConnections.scope.blockIds,
        pendingConnections.scope.commandSearch,
      );
      const rebuilt = buildPendingReleaseConnections(snapshot, refreshedScope);
      if (rebuilt.ok) {
        setPendingConnections(rebuilt.pending);
        return;
      }
      setPendingConnections(null);
      setStatus({ level: 'error', text: rebuilt.message });
    }
  }, [pendingConnections, snapshot]);

  useEffect(() => {
    if (
      pendingBlockTransfer
      && pendingBlockTransfer.authorityKey !== mutationAuthorityKey
    ) {
      setPendingBlockTransfer(null);
      setDraggingInstructionId(null);
      setActiveDropTarget(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Drop the command into a Block again.',
      });
    }
  }, [mutationAuthorityKey, pendingBlockTransfer]);

  const submitVariablesMutation = useCallback((
    draft: Parameters<typeof submitGraphMutation>[0],
    mutationProfile: Parameters<typeof submitGraphMutation>[2],
    sourceInstructionId: number,
    pendingText: string,
    committedText: string,
    options: { keepConnectionsOpen?: boolean; onCommitted?: () => void } = {},
  ) => {
    const keepConnectionsOpen = options.keepConnectionsOpen === true;
    setStatus({ level: 'warn', text: pendingText });
    const mutationSubmit = draft.variableBindingPatches.length > 0
      ? submitGraphMutationCommandVariable
      : submitGraphMutation;
    const requestId = mutationSubmit(draft, {
      committed: response => {
        setPendingReconnect(null);
        if (!keepConnectionsOpen) setPendingConnections(null);
        setPendingBlockTransfer(null);
        setDraggingInstructionId(null);
        setActiveDropTarget(null);
        setStatus({
          level: 'ok',
          text: response.message || committedText,
        });
        sendWorkspaceRequest('variablesWorkspace.refresh');
        options.onCommitted?.();
      },
      refused: (response, reason) => {
        setPendingReconnect(null);
        if (!keepConnectionsOpen) setPendingConnections(null);
        setPendingBlockTransfer(null);
        setDraggingInstructionId(null);
        setActiveDropTarget(null);
        const fallback = reason === 'TIMEOUT'
          ? 'The Variables change timed out. The current graph remains visible.'
          : reason === 'WORKSPACE_CHANGED'
            ? 'The Variables target changed. The change was cancelled.'
            : 'The Variables change was not saved.';
        setStatus({
          level: 'error',
          text: response?.message || fallback,
        });
      },
    }, mutationProfile);
    if (!requestId) {
      setPendingReconnect(null);
      if (!keepConnectionsOpen) setPendingConnections(null);
      setPendingBlockTransfer(null);
      setDraggingInstructionId(null);
      setActiveDropTarget(null);
      setStatus({
        level: 'error',
        text: `Variables is busy or disconnected. Instruction #${sourceInstructionId} was not changed.`,
      });
    }
  }, [sendWorkspaceRequest, submitGraphMutationCommandVariable, submitGraphMutation]);

  // IF-family links are a CLOSED rule (user decision 2026-08-03): one IF root
  // per Block has exactly one valid wiring, so broken links repair themselves
  // instead of surfacing "Repair Conditional" choices. One attempt per
  // authoritative graph state; a refusal stays visible and is never retried
  // until the graph changes.
  const ifFamilyAutoRepairAttemptRef = useRef<string | null>(null);
  useEffect(() => {
    if (!snapshot
      || !connected
      || suppressIfFamilyAutoRepairRef.current
      || pendingMutationRequestId !== null) return;
    const plan = planIfFamilyAutoRepair(snapshot);
    if (!plan || ifFamilyAutoRepairAttemptRef.current === plan.authorityKey) return;
    ifFamilyAutoRepairAttemptRef.current = plan.authorityKey;
    submitVariablesMutation(
      plan.draft,
      VARIABLES_REACT_AUTHORED_PROFILE,
      plan.rootInstructionIds[0],
      `Auto-repairing IF family links (IDs ${plan.repairedInstructionIds.join(', ')})...`,
      'IF family links reconnected automatically.',
    );
  }, [connected, pendingMutationRequestId, snapshot, submitVariablesMutation]);

  // Rules 5+6 driver: advances the user-triggered auto-resolve run as fresh
  // snapshots arrive. Every phase submits through an existing op; a refusal or
  // a persistent stall clears the run with a visible error - never a loop.
  useEffect(() => {
    const run = variableAutoResolveRunRef.current;
    if (!run || !snapshot || run.phase === 'CREATING') return;
    const stalled = (): void => {
      run.stalls += 1;
      if (run.stalls > 6) {
        variableAutoResolveRunRef.current = null;
        setStatus({
          level: 'error',
          text: 'Auto-resolve stopped: the workspace did not reach the expected state.',
        });
      }
    };
    if (run.phase === 'BINDINGS') {
      if (pendingMutationRequestId !== null) return;
      if (run.submittedBindings) {
        run.phase = 'RIGHT_OPERANDS';
      } else {
        const capability = snapshot.mutationCapability;
        if (!capability) {
          variableAutoResolveRunRef.current = null;
          setStatus({
            level: 'error',
            text: 'Auto-resolve stopped: the Variables graph is not editable.',
          });
          return;
        }
        const visibleVariables = new Set(snapshot.variables.map(entry => entry.id));
        const createdIds = [...run.createdIdByName.values()];
        if (createdIds.some(id => !visibleVariables.has(id))) {
          stalled();
          return;
        }
        const factById = new Map(
          capability.instructionFacts.map(fact => [fact.instructionId, fact]),
        );
        const patches = run.plan.bindings.flatMap((binding) => {
          const fact = factById.get(binding.instructionId);
          const replacement = binding.variableId
            ?? (binding.pendingName
              ? run.createdIdByName.get(binding.pendingName) ?? null
              : null);
          if (!fact || fact.variableId !== null || replacement === null) return [];
          return [{
            instructionId: binding.instructionId,
            operation: 'SET' as const,
            expected: { value: fact.variableId },
            replacement: { value: replacement },
          }];
        });
        run.submittedBindings = true;
        if (patches.length === 0) {
          run.phase = 'RIGHT_OPERANDS';
        } else {
          submitVariablesMutation(
            {
              mutationKind: 'RELATIONSHIP_UPDATE',
              draggedInstructionId: null,
              layoutRows: capability.layoutRows.map(row => ({ ...row })),
              instructionRelationPatches: [],
              variableBindingPatches: patches,
              variableOwnerPatches: [],
            },
            VARIABLES_REACT_AUTHORED_PROFILE,
            run.plan.bindings[0].instructionId,
            `Auto-resolve: connecting ${patches.length} command variable(s)...`,
            'Auto-resolve: command variables connected.',
          );
          return;
        }
      }
    }
    if (run.phase === 'RIGHT_OPERANDS') {
      if (pendingCommandUpdateRequestId !== null || pendingMutationRequestId !== null) return;
      const commandsById = new Map(
        snapshot.commands.flatMap(command =>
          command.id === null ? [] : [[command.id, command] as const]),
      );
      const next = run.plan.rightOperands.find((item) => {
        const command = commandsById.get(item.instructionId);
        if (!command) return false;
        const configuration = command.commandConfiguration;
        return !configuration
          || configuration.operandKind !== 'VARIABLE'
          || !configuration.operandVariableId;
      });
      if (!next) {
        variableAutoResolveRunRef.current = null;
        setStatus({
          level: 'ok',
          text: 'Auto-resolve completed: variables created and connected (rules 5+6).',
        });
        return;
      }
      const command = commandsById.get(next.instructionId);
      const replacement = next.variableId
        ?? (next.pendingName
          ? run.createdIdByName.get(next.pendingName) ?? null
          : null);
      if (!command
        || command.blockId === null
        || replacement === null
        || !command.variableId
        || !snapshot.variables.some(entry => entry.id === replacement)) {
        stalled();
        return;
      }
      const targetBlockId = command.blockId;
      const base = commandEditorConfiguration(
        command.command,
        command.operation,
        command.onHoldSeconds ?? null,
        command.commandConfiguration ?? null,
        command.variableId ?? null,
      );
      if (base.kind !== 'CHECK_VALUE' && base.kind !== 'EXTERNAL_CHECK') {
        variableAutoResolveRunRef.current = null;
        setStatus({
          level: 'error',
          text: `Auto-resolve stopped: command #${next.instructionId} has no comparison configuration.`,
        });
        return;
      }
      const requestId = submitCommandUpdate({
        action: 'UPDATE',
        sourceInstructionId: next.instructionId,
        targetBlockId,
        placement: { kind: 'KEEP' },
        draft: {
          name: command.name,
          action: command.command,
          operation: command.operation,
          configuration: {
            ...base,
            operandKind: 'VARIABLE',
            operandVariableId: replacement,
          },
        },
        allowRelationshipDisconnect: false,
        allowConditionalFamilyDissolve: false,
        conditionalFamilyDeleteIds: [],
      });
      if (!requestId) {
        variableAutoResolveRunRef.current = null;
        setStatus({
          level: 'error',
          text: 'Auto-resolve stopped: the second comparison variable could not be started.',
        });
        return;
      }
      setStatus({
        level: 'warn',
        text: `Auto-resolve: saving second comparison variable for command #${next.instructionId}...`,
      });
    }
  }, [
    pendingCommandUpdateRequestId,
    pendingMutationRequestId,
    snapshot,
    submitCommandUpdate,
    submitVariablesMutation,
  ]);

  const handleCommandDrop = useCallback((
    target: VariablesCommandDropTarget,
  ) => {
    const current = snapshotRef.current;
    const sourceInstructionId = commandDragSourceRef.current?.instructionId
      ?? draggingInstructionId;
    if (!current || sourceInstructionId === null) {
      setStatus({
        level: 'error',
        text: 'Variables must finish loading before an instruction can move.',
      });
      return;
    }
    const source = current.mutationCapability?.layoutRows.find(
      row => row.instructionId === sourceInstructionId,
    );
    let destinationIndex = target.index;
    if (source?.blockId === target.blockId) {
      const sourceIndex = current.mutationCapability?.layoutRows
        .filter(row => row.blockId === source.blockId)
        .sort((left, right) =>
          left.instructionOrderNumber - right.instructionOrderNumber)
        .findIndex(row => row.instructionId === sourceInstructionId) ?? -1;
      if (sourceIndex >= 0 && sourceIndex < destinationIndex) {
        destinationIndex -= 1;
      }
    }
    const planned = planVariablesFreeMove(current, {
      sourceInstructionId,
      destinationBlockId: target.blockId,
      destinationIndex,
    });
    if (!planned.ok) {
      setDraggingInstructionId(null);
      setActiveDropTarget(null);
      setStatus({ level: 'error', text: planned.message });
      return;
    }
    const cleared = planned.plan.clearedRelationships.length;
    submitVariablesMutation(
      planned.plan.draft,
      planned.plan.mutationProfile,
      sourceInstructionId,
      `Moving instruction #${sourceInstructionId}${cleared > 0
        ? ` and disconnecting ${cleared} invalid relationship(s)`
        : ''}...`,
      cleared > 0
        ? `Instruction moved. ${cleared} relationship(s) now require reconnect.`
        : 'Instruction order saved.',
    );
  }, [draggingInstructionId, submitVariablesMutation]);

  const handleBlockTransferIntent = useCallback((
    intent: VariablesBlockTransferIntent,
  ) => {
    const current = snapshotRef.current;
    const capability = current?.mutationCapability;
    const source = capability?.layoutRows.find(
      row => row.instructionId === intent.sourceInstructionId,
    );
    const target = current?.blocks.find(
      block => block.id === intent.targetBlockId,
    );
    setDraggingInstructionId(null);
    setActiveDropTarget(null);
    if (!current || !capability || !source || !target) {
      setStatus({
        level: 'error',
        text: 'The command or target Block is no longer authoritative. Refresh Variables and try again.',
      });
      return;
    }
    if (source.blockId === intent.targetBlockId) {
      setStatus({
        level: 'warn',
        text: `Instruction #${intent.sourceInstructionId} is already in Block #${target.order ?? target.id}.`,
      });
      return;
    }
    setPendingBlockTransfer({
      authorityKey: mutationAuthorityKeyFor(current),
      sourceInstructionId: intent.sourceInstructionId,
      targetBlockId: intent.targetBlockId,
      stage: 'ACTION',
      action: null,
    });
    setStatus({
      level: 'warn',
      text: 'Choose whether to move the instruction or create a new copy.',
    });
  }, []);

  const chooseBlockTransferAction = useCallback((
    action: VariablesBlockTransferAction,
  ) => {
    setPendingBlockTransfer(current => current
      ? {
          ...current,
          stage: 'SCOPE',
          action,
        }
      : null);
    setStatus({
      level: 'warn',
      text: action === 'MOVE'
        ? 'Choose whether to move only the instruction or include its parents.'
        : 'Choose whether to copy only the instruction or include its parents.',
    });
  }, []);

  const submitBlockTransferScope = useCallback((
    scope: VariablesBlockTransferScope,
  ) => {
    const current = snapshotRef.current;
    const pending = pendingBlockTransfer;
    if (
      !current
      || !pending
      || pending.stage !== 'SCOPE'
      || pending.action === null
      || pending.authorityKey !== mutationAuthorityKeyFor(current)
    ) {
      setPendingBlockTransfer(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Drop the command into a Block again.',
      });
      return;
    }
    const conditionalWatch = watchVariablesConditionalBlockTransfer(
      current,
      pending.sourceInstructionId,
      pending.targetBlockId,
      pending.action,
    );
    if (!conditionalWatch.ok) {
      setPendingBlockTransfer(null);
      setStatus({ level: 'error', text: conditionalWatch.message });
      return;
    }
    const effectiveScope: VariablesBlockTransferScope = conditionalWatch.family
      ? 'WITH_PARENTS'
      : scope;
    const selection = selectVariablesBlockTransferSources(
      current,
      pending.sourceInstructionId,
      effectiveScope,
    );
    if (!selection.ok) {
      setPendingBlockTransfer(null);
      setStatus({ level: 'error', text: selection.message });
      return;
    }

    if (pending.action === 'MOVE') {
      const planned = planVariablesBlockMove(
        current,
        pending.sourceInstructionId,
        pending.targetBlockId,
        effectiveScope,
      );
      if (!planned.ok) {
        setPendingBlockTransfer(null);
        setStatus({ level: 'error', text: planned.message });
        return;
      }
      const movedCount = planned.plan.sourceInstructionIds.length;
      const disconnectedCount = planned.plan.clearedRelationships.length;
      submitVariablesMutation(
        planned.plan.draft,
        planned.plan.mutationProfile,
        pending.sourceInstructionId,
        `Moving ${movedCount} instruction${movedCount === 1 ? '' : 's'} to the selected Block...`,
        disconnectedCount > 0
          ? `${movedCount} instruction(s) moved. ${disconnectedCount} relationship(s) now require reconnect.`
          : `${movedCount} instruction${movedCount === 1 ? '' : 's'} moved to the selected Block.`,
      );
      return;
    }

    const requestId = submitInstructionCopy({
      targetBlockId: pending.targetBlockId,
      selectedInstructionId: pending.sourceInstructionId,
      scope: effectiveScope,
      sourceInstructionIds: selection.selection.sourceInstructionIds,
    });
    if (!requestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. No copy was created.',
      });
      return;
    }
    setPendingBlockTransfer(null);
    const copyCount = selection.selection.sourceInstructionIds.length;
    setStatus({
      level: 'warn',
      text: `Creating ${copyCount} new instruction ${copyCount === 1 ? 'copy' : 'copies'}...`,
    });
  }, [
    pendingBlockTransfer,
    submitInstructionCopy,
    submitVariablesMutation,
  ]);

  const parentRelationKind = useCallback((
    instructionId: number,
  ): VariablesReconnectRelationKind | null => {
    const current = snapshotRef.current;
    const fact = current?.mutationCapability?.instructionFacts.find(
      candidate => candidate.instructionId === instructionId,
    );
    if (!fact) return null;
    const policy = instructionRelationshipPolicy(fact.action);
    if (policy.requirements.includes('BLOCK_TARGET')) return 'BLOCK_TARGET';
    if (policy.requirements.includes('LOOP_ANCHOR')) return 'LOOP_ANCHOR';
    if (policy.requirements.includes('CONDITIONAL_ROOT')) {
      return 'CONDITIONAL_ROOT';
    }
    if (policy.requirements.includes('ELEMENT_TARGET')) return 'ELEMENT_TARGET';
    return fact.parentId !== null ? 'ELEMENT_TARGET' : null;
  }, []);

  const openReconnect = useCallback((
    instructionId: number,
    relationKind: VariablesReconnectRelationKind,
  ) => {
    const current = snapshotRef.current;
    if (!current) return;
    const planned = planVariablesReconnect(
      current,
      instructionId,
      relationKind,
    );
    if (!planned.ok) {
      setStatus({
        level: 'error',
        text: planned.message,
      });
      return;
    }
    setSelectedInstructionId(instructionId);
    setPendingReconnect({
      authorityKey: mutationAuthorityKeyFor(current),
      plan: planned.plan,
    });
    setStatus({
      level: 'warn',
      text: relationKind === 'VARIABLE_BINDING'
        ? 'Choose the variable to connect.'
        : 'Choose the parent to connect.',
    });
  }, []);

  const submitReconnectChoice = useCallback((
    target: RelationshipTarget | null,
  ) => {
    const current = snapshotRef.current;
    const pending = pendingReconnect;
    if (
      !current
      || !pending
      || pending.authorityKey !== mutationAuthorityKeyFor(current)
    ) {
      setPendingReconnect(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the reconnect action again.',
      });
      return;
    }
    const built = buildVariablesReconnectMutation(
      pending.plan,
      target === null
        ? { mode: 'DISCONNECT' }
        : { mode: 'CONNECT', target },
    );
    if (!built.ok) {
      setStatus({ level: 'error', text: built.message });
      return;
    }
    const sourceCommand = current.commands.find(
      command => command.id === pending.plan.sourceInstructionId,
    );
    const isCheckValueLeft = pending.plan.relationKind === 'VARIABLE_BINDING'
      && Boolean(sourceCommand
        && requiredVariableSlots(sourceCommand.command).includes('RIGHT'));
    if (isCheckValueLeft) {
      const disconnecting = target === null;
      setStatus({
        level: 'warn',
        text: disconnecting
          ? 'Disconnecting left comparison variable...'
          : 'Connecting left comparison variable...',
      });
      const requestId = submitCheckValueLeft(
        built.draft,
        {
          committed: response => {
            setPendingReconnect(null);
            setStatus({
              level: 'ok',
              text: response.message || (disconnecting
                ? 'Left comparison variable disconnected.'
                : 'Left comparison variable connected.'),
            });
            sendWorkspaceRequest('variablesWorkspace.refresh');
          },
          refused: (response, reason) => {
            setPendingReconnect(null);
            setStatus({
              level: 'error',
              text: response?.message
                || `The left comparison variable was not changed (${reason}).`,
            });
          },
        },
        built.mutationProfile,
      );
      if (!requestId) {
        setPendingReconnect(null);
        setStatus({
          level: 'error',
          text: 'Variables is busy or disconnected. The left comparison variable was not changed.',
        });
      }
      return;
    }
    submitVariablesMutation(
      built.draft,
      built.mutationProfile,
      pending.plan.sourceInstructionId,
      target === null
        ? `Disconnecting ${pending.plan.relationKind.toLocaleLowerCase()}...`
        : `Connecting ${pending.plan.relationKind.toLocaleLowerCase()}...`,
      target === null ? 'Relationship disconnected.' : 'Relationship connected.',
    );
  }, [
    pendingReconnect,
    sendWorkspaceRequest,
    submitCheckValueLeft,
    submitVariablesMutation,
  ]);

  const openReviewVisibleConnections = useCallback((
    scope: VariablesConnectionScope,
  ) => {
    const opened = openExecutionFlowReview(scope.label);
    if (!opened) {
      setStatus({
        level: 'error',
        text: 'Variables must finish loading before connections can be reviewed.',
      });
      return;
    }
    setStatus({
      level: opened.review.relationshipsAvailable ? 'ok' : 'warn',
      text: opened.review.relationshipsAvailable
        ? `Reviewing the complete ${opened.review.steps.length}-command Bot Job execution flow. No database change will be made.`
        : `Reviewing ${opened.review.steps.length} command(s) in read-only mode. Relationship authority is currently unavailable.`,
    });
  }, [openExecutionFlowReview]);

  const closeExecutionFlowReviewModal = useCallback(() => {
    closeExecutionFlowReview();
    setStatus({
      level: 'ok',
      text: 'Connection review closed. No relationship was changed.',
    });
  }, [closeExecutionFlowReview]);

  const openResolveVisibleConnections = useCallback((
    scope: VariablesConnectionScope,
  ) => {
    const current = snapshotRef.current;
    if (!current) {
      setStatus({
        level: 'error',
        text: 'Variables must finish loading before connections can be resolved.',
      });
      return;
    }
    const built = buildPendingResolveConnections(current, scope, 0);
    if (!built.ok) {
      setStatus({ level: 'error', text: built.message });
      return;
    }
    setPendingConnections(built.pending);
    setStatus({
      level: built.pending.review.items.length > 0 ? 'warn' : 'ok',
      text: built.pending.review.items.length > 0
        ? `Reviewing direct connections for ${scope.visibleCount} visible command(s).`
        : `No pending connections in ${scope.blockLabel}. Select another Block to continue.`,
    });
  }, []);

  const changeConnectionsBlockFilters = useCallback((
    nextBlockIds: number[],
  ) => {
    const current = snapshotRef.current;
    const pending = pendingConnections;
    if (!current || !pending) {
      setSharedBlockFilters(nextBlockIds);
      return;
    }
    const nextScope = variablesConnectionScopeForBlocks(
      current,
      nextBlockIds,
      pending.scope.commandSearch,
    );
    const rebuilt = pending.mode === 'RESOLVE'
      ? buildPendingResolveConnections(
          current,
          nextScope,
          pending.reviewRevision + 1,
        )
      : buildPendingReleaseConnections(current, nextScope);
    if (!rebuilt.ok) {
      setStatus({ level: 'error', text: rebuilt.message });
      return;
    }
    setSharedBlockFilters([...nextScope.blockIds]);
    setPendingConnections(rebuilt.pending);
    setStatus({
      level: rebuilt.pending.mode === 'RESOLVE'
        ? rebuilt.pending.review.items.length > 0 ? 'warn' : 'ok'
        : rebuilt.pending.items.length > 0 ? 'warn' : 'ok',
      text: rebuilt.pending.mode === 'RESOLVE'
        ? rebuilt.pending.review.items.length > 0
          ? `Reviewing direct connections for ${nextScope.visibleCount} visible command(s).`
          : `All ${nextScope.visibleCount} visible command(s) already have valid direct connections.`
        : rebuilt.pending.items.length > 0
          ? `Reviewing ${rebuilt.pending.items.length} direct connection(s) in ${nextScope.blockLabel}.`
          : `${nextScope.blockLabel} has no direct connections to release. Select another Block to continue.`,
    });
  }, [pendingConnections]);

  const openReleaseVisibleConnections = useCallback((
    scope: VariablesConnectionScope,
  ) => {
    const current = snapshotRef.current;
    if (!current) {
      setStatus({
        level: 'error',
        text: 'Variables must finish loading before connections can be released.',
      });
      return;
    }
    const built = buildPendingReleaseConnections(current, scope);
    if (!built.ok) {
      setStatus({ level: 'error', text: built.message });
      return;
    }
    setPendingConnections(built.pending);
    setStatus({
      level: built.pending.items.length > 0 ? 'warn' : 'ok',
      text: built.pending.items.length > 0
        ? `Reviewing ${built.pending.items.length} direct connection(s) before release.`
        : `${scope.blockLabel} has no direct connections to release. Select another Block to continue.`,
    });
  }, []);

  const submitVisibleConnections = useCallback((
    submission: VariablesConnectionsModalSubmission,
  ) => {
    const current = snapshotRef.current;
    const pending = pendingConnections;
    if (
      !current
      || !pending
      || !validateVariablesBatchConnectionsAuthority(
        pending.authorityKey,
        current,
      )
    ) {
      setPendingConnections(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the bulk connection action again.',
      });
      return;
    }

    if (pending.mode === 'RELEASE') {
      if (submission.mode !== 'RELEASE') {
        setStatus({
          level: 'error',
          text: 'The connection action changed before confirmation.',
        });
        return;
      }
      const expectedIds = new Set(pending.items.map(item => item.id));
      if (
        submission.itemIds.length !== expectedIds.size
        || submission.itemIds.some(itemId => !expectedIds.has(itemId))
      ) {
        setStatus({
          level: 'error',
          text: 'The reviewed release scope is incomplete. Open it again.',
        });
        return;
      }
      suppressIfFamilyAutoRepairRef.current = true;
      releaseSequenceRef.current = {
        instructionIds: [...pending.scope.instructionIds],
        phase: 'PARENT',
        awaitingInstructionId: null,
      };
      setReleaseSequenceKick(kick => kick + 1);
      setStatus({ level: 'warn', text: 'Releasing parent connections first...' });
      return;
    }

    if (submission.mode !== 'RESOLVE') {
      setStatus({
        level: 'error',
        text: 'The connection action changed before confirmation.',
      });
      return;
    }
    const reviewedItemsById = new Map(
      pending.review.items.map(item => [item.reviewId, item]),
    );
    const submittedItemIds = new Set(submission.itemIds);
    if (
      submittedItemIds.size !== submission.itemIds.length
      || submittedItemIds.size === 0
      || submission.itemIds.some(itemId => !reviewedItemsById.has(itemId))
      || submission.resolutions.some(resolution =>
        !submittedItemIds.has(resolution.itemId))
    ) {
      setStatus({
        level: 'error',
        text: 'The filtered connection scope is invalid. Open it again.',
      });
      return;
    }
    const scopedInstructionIds = [...new Set(
      submission.itemIds.flatMap(itemId => {
        const item = reviewedItemsById.get(itemId);
        return item ? [item.sourceInstructionId] : [];
      }),
    )];
    const scopedPlan = planVariablesBatchResolve(
      current,
      scopedInstructionIds,
    );
    if (!scopedPlan.ok) {
      setStatus({ level: 'error', text: scopedPlan.message });
      return;
    }
    const choicesById = new Map<string, VariablesBatchResolveChoice>();
    for (const resolution of submission.resolutions) {
      const item = reviewedItemsById.get(resolution.itemId);
      const target = item?.compatibleTargets.find(candidate =>
        relationshipTargetValue(candidate) === resolution.optionValue);
      if (!item || !target) {
        setStatus({
          level: 'error',
          text: 'A selected connection target is no longer compatible.',
        });
        return;
      }
      choicesById.set(item.reviewId, {
        reviewId: item.reviewId,
        mode: 'CONNECT',
        target,
      });
    }
    const choices = [...choicesById.values()];
    const built = buildVariablesBatchResolveMutation(
      scopedPlan.plan,
      choices,
    );
    if (!built.ok) {
      if (built.code === 'REVIEW_REQUIRED') {
        const reviewed = reviewVariablesBatchResolve(
          scopedPlan.plan,
          choices,
        );
        if (reviewed.ok) {
          setPendingConnections({
            ...pending,
            plan: scopedPlan.plan,
            review: reviewed.review,
            choices,
            reviewRevision: pending.reviewRevision + 1,
          });
          setStatus({
            level: 'warn',
            text: 'Parent choices are ready. Review the remaining compatible connections.',
          });
          return;
        }
      }
      setStatus({ level: 'error', text: built.message });
      return;
    }
    submitVariablesMutation(
      built.mutation.draft,
      built.mutation.mutationProfile,
      built.mutation.changedInstructionIds[0] ?? 0,
      `Resolving ${built.mutation.changedInstructionIds.length} visible command(s)...`,
      `${built.mutation.changedInstructionIds.length} visible command(s) resolved.`,
      { keepConnectionsOpen: true },
    );
  }, [
    pendingConnections,
    submitVariablesMutation,
  ]);

  const requestDeleteVariable = useCallback((variableId: number) => {
    const current = snapshotRef.current;
    const variable = current?.variables.find(candidate => candidate.id === variableId);
    if (!current || !variable) {
      setStatus({
        level: 'error',
        text: `Variable #${variableId} is no longer in the current Variables snapshot.`,
      });
      return;
    }
    setDeleteConfirmation({
      mode: 'SINGLE',
      variableIds: [variableId],
      title: 'Delete Variable?',
      body: `Delete variable #${variableId} “${variable.name}”? Its instruction bindings will be cleared, while all instructions and Web Elements remain available for reconnection.`,
    });
  }, []);

  const requestDeleteAllVariables = useCallback(() => {
    const current = snapshotRef.current;
    const variableIds = current?.variables.map(variable => variable.id) ?? [];
    if (variableIds.length === 0) {
      setStatus({ level: 'warn', text: 'No variables are available to delete.' });
      return;
    }
    setDeleteConfirmation({
      mode: 'ALL',
      variableIds,
      title: 'Delete All Variables?',
      body: `Delete all ${variableIds.length} variables from this Bot Job? Every instruction and Web Element will remain, and affected commands will show Reconnect Variable.`,
    });
  }, []);

  const confirmVariableDelete = useCallback(() => {
    const confirmation = deleteConfirmation;
    if (!confirmation) return;
    const requestId = submitVariableDelete(
      confirmation.mode,
      confirmation.variableIds,
    );
    if (!requestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. Nothing was deleted.',
      });
      return;
    }
    setDeletingVariableIds(new Set(confirmation.variableIds));
    setDeleteConfirmation(null);
    setStatus({
      level: 'warn',
      text: confirmation.mode === 'ALL'
        ? `Deleting ${confirmation.variableIds.length} variables...`
        : `Deleting variable #${confirmation.variableIds[0]}...`,
    });
  }, [deleteConfirmation, submitVariableDelete]);

  const requestDeleteCommand = useCallback((instructionId: number) => {
    const current = snapshotRef.current;
    const plan = current
      ? planVariablesCommandDelete(current, instructionId)
      : null;
    if (!plan) {
      setStatus({
        level: 'error',
        text: `Command #${instructionId} is no longer in the current Variables snapshot.`,
      });
      return;
    }
    const linkedCount = plan.parentRepairInstructionIds.length;
    const variableCount = plan.variableOwnerIds.length;
    const familyCount = plan.familyDeleteInstructionIds.length;
    if (familyCount > 0) {
      setCommandDeleteConfirmation({
        plan,
        title: 'Delete Complete IF Family?',
        body: `Deleting #${plan.instruction.instructionOrder ?? '?'} ${plan.instruction.name || plan.instruction.command} (ID ${plan.instruction.id}) removes its complete IF family — ${familyCount + 1} boundaries (IF, ELSEIF, ELSE, ENDIF) from Block ${plan.instruction.blockName || `#${plan.instruction.blockId}`}.`,
        details: `IF-family boundaries are always deleted together (IDs ${[plan.instruction.id, ...plan.familyDeleteInstructionIds].join(', ')}). Positional body commands remain. ${linkedCount} connected command(s) and ${variableCount} variable owner connection(s) will be disconnected and remain available for reconnection.`,
      });
      return;
    }
    setCommandDeleteConfirmation({
      plan,
      title: 'Delete Command?',
      body: `Delete only #${plan.instruction.instructionOrder ?? '?'} ${plan.instruction.name || plan.instruction.command} (ID ${plan.instruction.id}) from Block ${plan.instruction.blockName || `#${plan.instruction.blockId}`}?`,
      details: linkedCount === 0 && variableCount === 0
        ? 'Only the selected command will be deleted. No other command or variable will be removed.'
        : `Only the selected command will be deleted. ${linkedCount} directly connected command(s) and ${variableCount} variable owner connection(s) will be disconnected and remain available for reconnection.`,
    });
  }, []);

  const confirmCommandDelete = useCallback(() => {
    const confirmation = commandDeleteConfirmation;
    if (!confirmation) return;
    const requestId = submitCommandDelete(confirmation.plan);
    if (!requestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. The command was not deleted.',
      });
      return;
    }
    setCommandDeleteConfirmation(null);
    setStatus({
      level: 'warn',
      text: `Deleting command ID ${confirmation.plan.instruction.id}...`,
    });
  }, [commandDeleteConfirmation, submitCommandDelete]);

  const submitNewVariable = useCallback((draft: AddVariableBatchDraft) => {
    const names = draft.variables
      .map(variable => variable.name.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setStatus({ level: 'error', text: 'Add at least one variable name.' });
      return;
    }
    createVariableBatchRef.current = {
      names,
      nextIndex: 0,
      createdIds: [],
    };
    const requestId = submitVariableCreate({ name: names[0] });
    if (!requestId) {
      createVariableBatchRef.current = null;
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. No variable was created.',
      });
      return;
    }
    setStatus({
      level: 'warn',
      text: names.length === 1
        ? `Creating variable “${names[0]}”...`
        : `Creating variable 1 of ${names.length}: “${names[0]}”...`,
    });
  }, [submitVariableCreate]);

  // NEW 2026-08-03 (user order): the red "Resolve Parents(X) Vars(Y)" click
  // creates ONLY the missing CheckValue default variables. If the frozen
  // variable list contains any CK / CSV CHECK / PDF CHECK command, the
  // Left_Operand / Right_Operand variables are created DIRECTLY when absent -
  // never duplicated, never blocked, no existence messages. Nothing else runs.
  // ONE consolidated CheckValue-operand intent (2026-08-03 cleanup): the intent
  // clears only after a successful submit or completion; a stalled intent shows
  // a visible error after 8 attempts - never a silent dead-end, never a loop.
  const startRemainingVariableConnections = useCallback((
    instructionIds: readonly number[],
    variableMode: VariableResolutionMode,
  ) => {
    remainingVariableIntentRef.current = {
      instructionIds: [...instructionIds],
      variableMode,
      creatingName: null,
      awaitingInstructionId: null,
    };
    setRemainingVariableKick(kick => kick + 1);
  }, []);

  const startCheckValueDefaultVariables = useCallback((
    variableMode: VariableResolutionMode,
  ) => {
    const current = snapshotRef.current;
    if (!current || !pendingConnections || pendingConnections.mode !== 'RESOLVE') {
      return;
    }
    const activeSnapshot = current;
    const activeConnections = pendingConnections;
    const batchRequestId = submitVariableAutoResolve(
      activeConnections.scope.instructionIds,
      variableMode,
    );
    if (!batchRequestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. Batch resolution was not started.',
      });
      return;
    }
    setStatus({
      level: 'warn',
      text: 'Creating and connecting all scoped variables in one transaction...',
    });
    return;
    // Detect CheckValues by their MISSING SLOTS in the frozen scope - never by
    // the review items: a CK whose LEFT is already bound vanishes from the
    // VARIABLE_BINDING issue list while its RIGHT spot is still empty.
    const scopeIds = new Set(activeConnections.scope.instructionIds);
    const hasCheckValue = activeSnapshot.commands.some(command =>
      command.id !== null
      && scopeIds.has(command.id)
      && requiredVariableSlots(command.command).includes('RIGHT')
      && missingVariableSlots(command).length > 0);
    console.info('[CheckOperandDriver] trigger', { hasCheckValue });
    if (!hasCheckValue) {
      startRemainingVariableConnections(
        activeConnections.scope.instructionIds,
        variableMode,
      );
      return;
    }
    // Once the required names exist, the driver connects LEFT first and RIGHT
    // second for each CheckValue in stable execution order.
    checkOperandIntentRef.current = { kind: 'RESOLVE_CHECKVALUES', variableMode };
    checkOperandAttemptsRef.current = 0;
    setCheckOperandKick(kick => kick + 1);
    const assignments = buildVariableResolutionAssignments(
      activeSnapshot,
      activeConnections.scope.instructionIds,
      variableMode,
    );
    const commandsById = new Map(activeSnapshot.commands.flatMap(command =>
      command.id === null ? [] : [[command.id, command] as const]));
    const existingNames = new Set(activeSnapshot.variables.map(
      variable => variable.name.trim().toLowerCase()));
    const requiredNames = assignments.checks.flatMap((assignment) => {
      const command = commandsById.get(assignment.instructionId);
      const missing = command ? missingVariableSlots(command) : [];
      return [
        ...(missing.includes('LEFT') ? [assignment.leftName] : []),
        ...(missing.includes('RIGHT') ? [assignment.rightName] : []),
      ];
    });
    const toCreate = [...new Set(requiredNames)].filter(
      name => !existingNames.has(name.toLowerCase()),
    );
    if (toCreate.length === 0) {
      // Nothing to create - wake the step-1 driver so it connects directly.
      setStatus({
        level: 'warn',
        text: `Connecting CheckValue variables (${variableMode === 'SAME' ? 'Same Vars' : 'Distinct'})...`,
      });
      return;
    }
    createVariableBatchRef.current = {
      names: toCreate,
      nextIndex: 0,
      createdIds: [],
    };
    const requestId = submitVariableCreate({ name: toCreate[0] });
    if (!requestId) {
      createVariableBatchRef.current = null;
      return;
    }
    setStatus({
      level: 'warn',
      text: `Creating CheckValue default variable “${toCreate[0]}”...`,
    });
  }, [
    pendingConnections,
    startRemainingVariableConnections,
    submitVariableAutoResolve,
    submitVariableCreate,
  ]);

  const createCheckValueDefaultVariables = useCallback((
    variableMode: VariableResolutionMode,
  ) => {
    suppressIfFamilyAutoRepairRef.current = false;
    pendingVariableResolutionModeRef.current = variableMode;
    const pending = pendingConnections;
    if (!pending || pending.mode !== 'RESOLVE') return;
    const built = buildVariablesBatchResolveMutation(pending.plan, []);
    if (built.ok && built.mutation.draft.instructionRelationPatches.length > 0) {
      const expectedGraphVersion =
        pending.plan.basis.snapshot.mutationCapability!.graphVersion + 1;
      submitVariablesMutation(
        {
          ...built.mutation.draft,
          variableBindingPatches: [],
        },
        built.mutation.mutationProfile,
        built.mutation.changedInstructionIds[0] ?? 0,
        'Resolving parent connections first...',
        'Parent connections resolved.',
        {
          keepConnectionsOpen: true,
          onCommitted: () => {
            pendingCheckStartGraphVersionRef.current = expectedGraphVersion;
          },
        },
      );
      return;
    }
    startCheckValueDefaultVariables(variableMode);
  }, [pendingConnections, startCheckValueDefaultVariables, submitVariablesMutation]);

  useEffect(() => {
    const expected = pendingCheckStartGraphVersionRef.current;
    const current = snapshot?.mutationCapability?.graphVersion;
    if (expected === null || current === undefined || current < expected) return;
    pendingCheckStartGraphVersionRef.current = null;
    startCheckValueDefaultVariables(pendingVariableResolutionModeRef.current);
  }, [snapshot, startCheckValueDefaultVariables]);

  // CONSOLIDATED CheckValue driver: one intent, one effect. RESOLVE connects
  // LEFT first and RIGHT second; RELEASE clears the queued RIGHT spots.
  useEffect(() => {
    const intent = checkOperandIntentRef.current;
    if (!intent || !snapshot) return;
    if (createVariableBatchRef.current !== null
      || pendingCreateRequestId !== null
      || variableCreationRefreshRequiredRef.current
      || pendingRequest !== null
      || pendingMutationRequestId !== null
      || pendingCheckValueLeftRequestId !== null
      || pendingCheckValueRightRequestId !== null) {
      console.info('[CheckOperandDriver] waiting', {
        batch: createVariableBatchRef.current !== null,
        pendingCreate: pendingCreateRequestId,
        pendingMutation: pendingMutationRequestId,
        pendingLeft: pendingCheckValueLeftRequestId,
        pendingConnect: pendingCheckValueRightRequestId,
      });
      return;
    }
    console.info('[CheckOperandDriver] pass', {
      intent: intent.kind,
      attempts: checkOperandAttemptsRef.current,
    });
    const finish = (level: 'ok' | 'error', text: string) => {
      checkOperandIntentRef.current = null;
      checkOperandAttemptsRef.current = 0;
      setStatus({ level, text });
      if (level === 'ok' && intent.kind === 'RESOLVE_CHECKVALUES') {
        startRemainingVariableConnections(
          pendingConnections?.scope.instructionIds ?? [],
          intent.variableMode,
        );
      }
    };
    const stalled = (text: string) => {
      checkOperandAttemptsRef.current += 1;
      if (checkOperandAttemptsRef.current > 8) finish('error', text);
    };
    if (intent.kind === 'RELEASE') {
      const requestId = submitCheckValueRight(null, intent.instructionIds, 'DISCONNECT');
      if (requestId) {
        checkOperandIntentRef.current = null;
        checkOperandAttemptsRef.current = 0;
        setStatus({
          level: 'warn',
          text: `Releasing the right operand of ${intent.instructionIds.length} CheckValue command(s)...`,
        });
      } else {
        stalled('The right-operand release could not be submitted. Try again.');
      }
      return;
    }
    const scopedIds = new Set(
      pendingConnections?.scope.instructionIds
        ?? snapshot.commands.flatMap(command => command.id === null ? [] : [command.id]),
    );
    const assignments = buildVariableResolutionAssignments(
      snapshot,
      [...scopedIds],
      intent.variableMode,
    );
    const checkCommands = assignments.checks.flatMap(assignment => {
      const command = snapshot.commands.find(
        candidate => candidate.id === assignment.instructionId,
      );
      return command ? [{ command, assignment }] : [];
    });
    const effectiveMissingSlots = (command: typeof checkCommands[number]['command']) => {
      const fact = snapshot.mutationCapability?.instructionFacts.find(
        item => item.instructionId === command.id,
      );
      return missingVariableSlots(command).filter(
        slot => slot !== 'LEFT' || !fact || fact.variableId === null,
      );
    };
    if (intent.awaitingSlot) {
      const awaitedCommand = checkCommands.find(
        item => item.command.id === intent.awaitingSlot?.instructionId,
      )?.command;
      const awaitedFact = snapshot.mutationCapability?.instructionFacts.find(
        fact => fact.instructionId === intent.awaitingSlot?.instructionId,
      );
      const stillMissing = intent.awaitingSlot.slot === 'LEFT'
        ? !awaitedFact || awaitedFact.variableId === null
        : Boolean(awaitedCommand
          && missingVariableSlots(awaitedCommand).includes('RIGHT'));
      if (stillMissing) {
        return;
      }
      delete intent.awaitingSlot;
    }
    const nextCommand = checkCommands.find(
      item => effectiveMissingSlots(item.command).length > 0,
    );
    console.info('[CheckOperandDriver] next command', {
      instructionId: nextCommand?.command.id ?? null,
      missingSlots: nextCommand ? effectiveMissingSlots(nextCommand.command) : [],
    });
    if (!nextCommand || nextCommand.command.id === null) {
      finish('ok', 'CheckValue variables connected (left and right).');
      return;
    }
    const variableByName = new Map(snapshot.variables.map(
      variable => [variable.name.trim().toLowerCase(), variable.id]));
    const nextInstructionId = nextCommand.command.id;
    if (effectiveMissingSlots(nextCommand.command).includes('LEFT')) {
      const leftOperandId = variableByName.get(
        nextCommand.assignment.leftName.toLowerCase(),
      );
      const capability = snapshot.mutationCapability;
      if (!leftOperandId || !capability) {
        stalled(`${nextCommand.assignment.leftName} is not available to connect.`);
        return;
      }
      const fact = capability.instructionFacts.find(
        item => item.instructionId === nextInstructionId,
      );
      if (!fact || fact.variableId !== null) {
        stalled('The left-operand connections are not ready yet.');
        return;
      }
      checkOperandAttemptsRef.current += 1;
      intent.awaitingSlot = { instructionId: nextInstructionId, slot: 'LEFT' };
      const requestId = submitCheckValueLeft(
        {
          mutationKind: 'RELATIONSHIP_UPDATE',
          draggedInstructionId: null,
          layoutRows: capability.layoutRows.map(row => ({ ...row })),
          instructionRelationPatches: [],
          variableBindingPatches: [{
            instructionId: nextInstructionId,
            operation: 'SET',
            expected: { value: fact.variableId },
            replacement: { value: leftOperandId },
          }],
          variableOwnerPatches: [],
        },
        {
          committed: () => {
            setStatus({
              level: 'warn',
              text: `${nextCommand.assignment.leftName} connected to CheckValue #${nextInstructionId}. Connecting ${nextCommand.assignment.rightName} next...`,
            });
            sendWorkspaceRequest('variablesWorkspace.refresh');
          },
          refused: (_response, reason) => finish(
            'error',
            `${nextCommand.assignment.leftName} connection for CheckValue #${nextInstructionId} was refused (${reason}).`,
          ),
        },
        VARIABLES_REACT_AUTHORED_PROFILE,
      );
      if (!requestId) {
        delete intent.awaitingSlot;
        stalled(`The ${nextCommand.assignment.leftName} connection for CheckValue #${nextInstructionId} could not be submitted.`);
        return;
      }
      setStatus({
        level: 'warn',
        text: `Connecting ${nextCommand.assignment.leftName} to CheckValue #${nextInstructionId}...`,
      });
      return;
    }
    const rightOperandId = variableByName.get(
      nextCommand.assignment.rightName.toLowerCase(),
    );
    if (!rightOperandId) {
      stalled(`${nextCommand.assignment.rightName} is not available to connect.`);
      return;
    }
    checkOperandAttemptsRef.current += 1;
    intent.awaitingSlot = { instructionId: nextInstructionId, slot: 'RIGHT' };
    const requestId = submitCheckValueRight(rightOperandId, [nextInstructionId]);
    console.info('[CheckOperandDriver] right submit', {
      rightOperandId,
      instructionId: nextInstructionId,
      requestId,
    });
    if (requestId) {
      setStatus({
        level: 'warn',
        text: `Connecting ${nextCommand.assignment.rightName} to CheckValue #${nextInstructionId}...`,
      });
    } else {
      delete intent.awaitingSlot;
      stalled('The right-operand connection could not be submitted. Try again.');
    }
  }, [
    checkOperandKick,
    pendingCheckValueRightRequestId,
    pendingCreateRequestId,
    pendingMutationRequestId,
    pendingRequest,
    pendingCheckValueLeftRequestId,
    pendingConnections,
    snapshot,
    sendWorkspaceRequest,
    startRemainingVariableConnections,
    submitCheckValueLeft,
    submitCheckValueRight,
  ]);

  // Final resolver lane: Same Vars shares Variable_1; Distinct assigns the
  // stable sequential Variable_N belonging to each regular command.
  useEffect(() => {
    const intent = remainingVariableIntentRef.current;
    if (!intent || !snapshot) return;
    if (pendingCreateRequestId !== null
      || variableCreationRefreshRequiredRef.current
      || pendingRequest !== null
      || pendingMutationRequestId !== null
      || pendingCheckValueLeftRequestId !== null
      || pendingCheckValueRightRequestId !== null) return;
    const capability = snapshot.mutationCapability;
    if (!capability) return;
    const scopeIds = new Set(intent.instructionIds);
    const factsById = new Map(
      capability.instructionFacts.map(fact => [fact.instructionId, fact]),
    );
    if (intent.awaitingInstructionId !== null) {
      const awaited = factsById.get(intent.awaitingInstructionId);
      if (!awaited || awaited.variableId === null) return;
      intent.awaitingInstructionId = null;
    }
    const assignments = buildVariableResolutionAssignments(
      snapshot,
      [...scopeIds],
      intent.variableMode,
    );
    const nextAssignment = assignments.commands.find(assignment =>
      factsById.get(assignment.instructionId)?.variableId === null);
    if (!nextAssignment) {
      remainingVariableIntentRef.current = null;
      setPendingConnections(null);
      setStatus({ level: 'ok', text: 'All parent and variable connections resolved.' });
      return;
    }
    const targetVariable = snapshot.variables.find(
      variable => variable.name.trim().toLowerCase()
        === nextAssignment.variableName.toLowerCase(),
    );
    if (!targetVariable) {
      if (intent.creatingName === nextAssignment.variableName) return;
      intent.creatingName = nextAssignment.variableName;
      const requestId = submitVariableCreate({ name: nextAssignment.variableName });
      if (!requestId) {
        remainingVariableIntentRef.current = null;
        setStatus({
          level: 'error',
          text: `${nextAssignment.variableName} could not be created.`,
        });
      } else {
        setStatus({
          level: 'warn',
          text: `Creating ${nextAssignment.variableName}...`,
        });
      }
      return;
    }
    intent.creatingName = null;
    const nextInstructionId = nextAssignment.instructionId;
    intent.awaitingInstructionId = nextInstructionId;
    const requestId = submitGraphMutationCommandVariable(
      {
        mutationKind: 'RELATIONSHIP_UPDATE',
        draggedInstructionId: null,
        layoutRows: capability.layoutRows.map(row => ({ ...row })),
        instructionRelationPatches: [],
        variableBindingPatches: [{
          instructionId: nextInstructionId,
          operation: 'SET' as const,
          expected: { value: factsById.get(nextInstructionId)?.variableId ?? null },
          replacement: { value: targetVariable.id },
        }],
        variableOwnerPatches: [],
      },
      {
        committed: () => {
          setStatus({
            level: 'warn',
            text: `${nextAssignment.variableName} connected to command #${nextInstructionId}. Connecting the next command...`,
          });
          sendWorkspaceRequest('variablesWorkspace.refresh');
        },
        refused: (_response, reason) => {
          remainingVariableIntentRef.current = null;
          setStatus({
            level: 'error',
            text: `Remaining variable connections were refused (${reason}).`,
          });
        },
      },
      VARIABLES_REACT_AUTHORED_PROFILE,
    );
    if (!requestId) {
      intent.awaitingInstructionId = null;
      remainingVariableIntentRef.current = null;
      setStatus({ level: 'error', text: 'Remaining variable connections could not be submitted.' });
    }
  }, [
    pendingCheckValueRightRequestId,
    pendingCheckValueLeftRequestId,
    pendingCreateRequestId,
    pendingMutationRequestId,
    pendingRequest,
    remainingVariableKick,
    sendWorkspaceRequest,
    snapshot,
    submitGraphMutationCommandVariable,
    submitVariableCreate,
  ]);

  useEffect(() => {
    const run = releaseSequenceRef.current;
    if (!run || !snapshot || !snapshot.mutationCapability) return;
    if (pendingMutationRequestId !== null
      || pendingCheckValueLeftRequestId !== null
      || pendingCheckValueRightRequestId !== null) return;
    const capability = snapshot.mutationCapability;
    const scopeIds = new Set(run.instructionIds);
    const facts = capability.instructionFacts.filter(fact => scopeIds.has(fact.instructionId));
    const commandsById = new Map(snapshot.commands.flatMap(command =>
      command.id === null ? [] : [[command.id, command] as const]));
    if (run.awaitingInstructionId !== null) {
      const fact = facts.find(item => item.instructionId === run.awaitingInstructionId);
      const command = commandsById.get(run.awaitingInstructionId);
      const stillConnected = run.phase === 'PARENT'
        ? Boolean(fact && (fact.parentId !== null || fact.parentBlockId !== null))
        : run.phase === 'LEFT' || run.phase === 'OTHER'
          ? Boolean(fact && fact.variableId !== null)
          : Boolean(command && connectedVariableSlots(command).has('RIGHT'));
      if (stillConnected) return;
      run.awaitingInstructionId = null;
    }
    const baseDraft = {
      mutationKind: 'RELATIONSHIP_UPDATE' as const,
      draggedInstructionId: null,
      layoutRows: capability.layoutRows.map(row => ({ ...row })),
      variableOwnerPatches: [],
    };
    if (run.phase === 'PARENT') {
      const patches = facts.flatMap(fact =>
        fact.parentId === null && fact.parentBlockId === null ? [] : [{
          instructionId: fact.instructionId,
          relationKind: fact.relationKind,
          operation: 'CLEAR' as const,
          expected: { parentId: fact.parentId, parentBlockId: fact.parentBlockId },
          replacement: { parentId: null, parentBlockId: null },
        }]);
      if (patches.length === 0) {
        run.phase = 'LEFT';
        setReleaseSequenceKick(kick => kick + 1);
        return;
      }
      run.awaitingInstructionId = patches[0].instructionId;
      const requestId = submitGraphMutation({
        ...baseDraft,
        instructionRelationPatches: patches,
        variableBindingPatches: [],
      }, {
        committed: () => sendWorkspaceRequest('variablesWorkspace.refresh'),
        refused: (_response, reason) => {
          releaseSequenceRef.current = null;
          setStatus({ level: 'error', text: `Parent release was refused (${reason}).` });
        },
      }, VARIABLES_REACT_AUTHORED_PROFILE);
      if (!requestId) releaseSequenceRef.current = null;
      return;
    }
    if (run.phase === 'LEFT') {
      releaseSequenceRef.current = null;
      const batchReleaseRequestId = submitVariableAutoResolve(
        run.instructionIds,
        pendingVariableResolutionModeRef.current,
        'RELEASE',
      );
      if (!batchReleaseRequestId) {
        setStatus({ level: 'error', text: 'The variable release batch could not be submitted.' });
      } else {
        setStatus({ level: 'warn', text: 'Releasing all scoped variable connections in one transaction...' });
      }
      return;
    }
  }, [
    pendingCheckValueRightRequestId,
    pendingCheckValueLeftRequestId,
    pendingMutationRequestId,
    releaseSequenceKick,
    sendWorkspaceRequest,
    snapshot,
    submitGraphMutation,
    submitVariableAutoResolve,
  ]);

  const startVariableAutoResolveLegacy = useCallback(() => {
    const current = snapshotRef.current;
    if (!current || variableAutoResolveRunRef.current) return;
    const plan = planVariableAutoResolve(current);
    if (plan.creations.length === 0
      && plan.bindings.length === 0
      && plan.rightOperands.length === 0) {
      setStatus({
        level: 'ok',
        text: 'All commands already have their variables connected (rules 5+6).',
      });
      return;
    }
    variableAutoResolveRunRef.current = {
      phase: plan.creations.length > 0 ? 'CREATING' : 'BINDINGS',
      plan,
      createIndex: 0,
      createdIdByName: new Map(),
      submittedBindings: false,
      stalls: 0,
    };
    if (plan.creations.length > 0) {
      const first = plan.creations[0];
      const requestId = submitVariableCreateRef.current({ name: first.name });
      if (!requestId) {
        variableAutoResolveRunRef.current = null;
        setStatus({
          level: 'error',
          text: 'Variables is busy, disconnected, or read-only. Auto-resolve was not started.',
        });
        return;
      }
      setStatus({
        level: 'warn',
        text: `Auto-resolve: creating variable “${first.name}” (1 of ${plan.creations.length})...`,
      });
      return;
    }
    setStatus({
      level: 'warn',
      text: 'Auto-resolve: connecting variables to commands...',
    });
  }, []);

  const startVariableAutoResolve = useCallback(() => {
    const current = snapshotRef.current;
    if (!current || pendingVariableAutoResolveRequestId !== null) return;
    const requestId = submitVariableAutoResolve(
      current.commands.flatMap(command => command.id === null ? [] : [command.id]),
      variableResolutionMode,
    );
    if (!requestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. AUTO was not started.',
      });
      return;
    }
    setStatus({
      level: 'warn',
      text: 'AUTO is creating and connecting variables in one transaction...',
    });
  }, [pendingVariableAutoResolveRequestId, submitVariableAutoResolve, variableResolutionMode]);

  const confirmClearAllValues = useCallback(() => {
    if (!clearAllValues()) {
      setStatus({
        level: 'error',
        text: 'Variables is busy or disconnected. Runtime values were not cleared.',
      });
      return;
    }
    setClearValuesConfirmation(false);
  }, [clearAllValues]);

  const statusClass = status.level === 'error'
    ? styles.statusError
    : status.level === 'warn'
      ? styles.statusWarn
      : styles.statusOk;
  const subtitle = snapshot
    ? `${snapshot.botJob.name} · Bot Job ID ${snapshot.botJob.id} · ${snapshot.botJob.organizationName || 'Organization'}`
    : 'Active Bot Job variable relationships';
  const mutationDisabled = !connected
    || pendingRequest !== null
    || pendingMutationRequestId !== null
    || pendingCopyRequestId !== null
    || pendingCreateRequestId !== null
    || pendingCommandDeleteRequestId !== null
    || pendingStatusInstructionId !== null
    || pendingReconnect !== null
    || pendingConnections !== null
    || pendingBlockTransfer !== null
    || snapshot?.mutationCapability?.reactAuthoredProfile == null;
  const blockTransferSource = snapshot && pendingBlockTransfer
    ? snapshot.commands.find(
      command => command.id === pendingBlockTransfer.sourceInstructionId,
    ) ?? null
    : null;
  const blockTransferTarget = snapshot && pendingBlockTransfer
    ? snapshot.blocks.find(
      block => block.id === pendingBlockTransfer.targetBlockId,
    ) ?? null
    : null;
  const blockTransferSelection = snapshot
    && pendingBlockTransfer?.stage === 'SCOPE'
    ? selectVariablesBlockTransferSources(
        snapshot,
        pendingBlockTransfer.sourceInstructionId,
        'WITH_PARENTS',
      )
    : null;
  const blockTransferConditionalFamily = snapshot && pendingBlockTransfer
    ? variablesConditionalFamilyForInstruction(
        snapshot,
        pendingBlockTransfer.sourceInstructionId,
      )
    : null;
  const reconnectSource = snapshot && pendingReconnect
    ? snapshot.commands.find(
      command => command.id === pendingReconnect.plan.sourceInstructionId,
    ) ?? null
    : null;
  const reconnectOptions = snapshot && pendingReconnect
    ? pendingReconnect.plan.compatibleTargets.map(candidate => ({
      target: candidate.target,
      label: relationshipTargetLabel(snapshot, candidate.target)
        ?? `Target ${candidate.target.id}`,
      sublabel: candidate.target.entity.replaceAll('_', ' '),
      keywords: [
        candidate.target.entity,
        candidate.target.id,
        relationshipTargetLabel(snapshot, candidate.target),
      ].join(' '),
    }))
    : [];
  const rightVariableReconnectInstruction = snapshot
    && rightVariableReconnectInstructionId !== null
    ? snapshot.commands.find(command => command.id === rightVariableReconnectInstructionId) ?? null
    : null;
  const rightVariableReconnectCurrentId = rightVariableReconnectInstruction
    ? connectedVariableSlots(rightVariableReconnectInstruction).get('RIGHT') ?? null
    : null;
  const rightVariableReconnectOwner = snapshot ? {
    workspaceKind: 'BOT_JOB' as const,
    homeBankingId: snapshot.botJob.homeBankingId,
    botJobId: snapshot.botJob.id,
  } : null;
  const rightVariableReconnectEdge: InstructionRelationshipEdge | null =
    snapshot
    && rightVariableReconnectInstruction?.id !== null
    && rightVariableReconnectInstruction?.id !== undefined
    && rightVariableReconnectOwner
      ? {
          id: `second-operand:${rightVariableReconnectInstruction.id}`,
          kind: 'VARIABLE_BINDING',
          source: {
            entity: 'INSTRUCTION',
            owner: rightVariableReconnectOwner,
            id: rightVariableReconnectInstruction.id,
          },
          target: rightVariableReconnectCurrentId === null
            ? null
            : {
                entity: 'VARIABLE',
                owner: rightVariableReconnectOwner,
                id: rightVariableReconnectCurrentId,
              },
          state: rightVariableReconnectCurrentId === null
            ? 'RECONNECT_VARIABLE'
            : 'CONNECTED',
          code: null,
          required: true,
          compatibleTargets: snapshot.variables.map(variable => ({
            entity: 'VARIABLE' as const,
            owner: rightVariableReconnectOwner,
            id: variable.id,
          })),
        }
      : null;
  const rightVariableReconnectOptions = snapshot && rightVariableReconnectEdge
    ? rightVariableReconnectEdge.compatibleTargets.map(target => ({
        target,
        label: relationshipTargetLabel(snapshot, target) ?? `Variable ID ${target.id}`,
        sublabel: 'VARIABLE',
        keywords: `${target.id} ${relationshipTargetLabel(snapshot, target) ?? ''}`,
      }))
    : [];

  const filterButtons: Array<{ id: HealthFilter; label: string; count?: number }> = [
    { id: 'ALL', label: 'All', count: snapshot?.summary.variableCount ?? 0 },
    {
      id: 'HEALTHY',
      label: 'Healthy',
      count: snapshot?.variables.filter(variable => variable.health === 'HEALTHY').length ?? 0,
    },
    {
      id: 'UNUSED',
      label: 'Unused',
      count: snapshot?.variables.filter(variable => variable.unused).length ?? 0,
    },
    {
      id: 'ISSUES',
      label: 'Issues',
      count: snapshot?.variables.filter(
        variable => variable.health === 'WARNING' || variable.health === 'ERROR',
      ).length ?? 0,
    },
  ];

  return (
    <DetachedPageShell
      title="Variables"
      testId="variables-page"
      onClose={undefined}
      showCloseButton={false}
    >
      <main className={styles.shell}>
        <section className={styles.window}>
          <header className={styles.topBar} data-floating-workspace-drag-handle>
            <div className={styles.titleBlock}>
              <div className={styles.titleLine}>
                <AppWindow size={18} aria-hidden="true" />
                <h1 className={styles.title}>Variables</h1>
                <span className={styles.scopePill}>Bot Job scope</span>
              </div>
              <p className={styles.subtitle} title={subtitle}>{subtitle}</p>
            </div>
            <div className={styles.topBarRight} data-floating-drag-ignore="true">
              <div className={`${styles.status} ${statusClass}`} role="status">
                {connected
                  ? status.text
                  : `Reconnecting${reconnectAttempts ? ` (${reconnectAttempts})` : ''}`}
              </div>
              <PagesOpenButton
                webSocket={webSocket}
                connected={connected}
                messages={messages}
                sessionId={sessionId}
              />
              <button
                type="button"
                className={styles.closeButton}
                title="Close only this Variables window"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </header>

          <section className={styles.toolbar} data-floating-drag-ignore="true">
            <div className={styles.summaryStrip} aria-label="Variable relationship summary">
              <span><b>{snapshot?.summary.variableCount ?? 0}</b> Variables</span>
              <span><b>{snapshot?.summary.producerCount ?? 0}</b> GET writes</span>
              <span><b>{snapshot?.summary.consumerCount ?? 0}</b> Reads</span>
              <span><b>{snapshot?.edges.length ?? 0}</b> Graph links</span>
              <span className={(snapshot?.summary.warningCount ?? 0) > 0 ? styles.summaryWarning : ''}>
                <b>{snapshot?.summary.warningCount ?? 0}</b> Diagnostics
              </span>
            </div>
            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={styles.refreshButton}
                disabled={!connected || pendingRequest !== null}
                onClick={() => sendWorkspaceRequest('variablesWorkspace.refresh')}
              >
                <RefreshCw
                  className={pendingRequest ? styles.loadingIcon : ''}
                  size={15}
                  aria-hidden="true"
                />
                {pendingRequest?.operation === 'variablesWorkspace.refresh'
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>
            </div>
          </section>

          {!snapshot ? (
            status.level === 'error'
              ? (
                <section className={styles.loadingState} role="alert">
                  <ShieldAlert className={styles.loadErrorIcon} size={30} aria-hidden="true" />
                  <strong>Variables could not be loaded</strong>
                  <span>{status.text}</span>
                  <button
                    type="button"
                    className={styles.retryButton}
                    disabled={!connected || pendingRequest !== null}
                    onClick={() => sendWorkspaceRequest('variablesWorkspace.bootstrap')}
                  >
                    Retry
                  </button>
                </section>
              )
              : (
                <section className={styles.loadingState} role="status">
                  <RefreshCw className={styles.loadingIcon} size={28} aria-hidden="true" />
                  <strong>Loading Variables workspace...</strong>
                  <span>The declared variable graph is being read from the active Bot Job.</span>
                </section>
              )
          ) : (
            <section className={styles.workspace}>
              <VariablesCommandBoard
                workspaceIdentityKey={workspaceIdentityKey}
                blockFilters={sharedBlockFilters}
                onBlockFiltersChange={setSharedBlockFilters}
                blocks={snapshot.blocks}
                instructions={snapshot.commands}
                variables={snapshot.variables}
                relationshipEdges={relationshipGraph?.edges ?? []}
                disabled={mutationDisabled}
                unavailableReason={pendingMutationRequestId
                  ? 'Saving...'
                  : pendingReconnect
                    ? 'Review relationship'
                    : pendingConnections
                      ? 'Review bulk connections'
                    : snapshot.mutationCapability?.reactAuthoredProfile == null
                      ? 'Read-only'
                      : undefined}
                selectedInstructionId={selectedInstructionId}
                draggingInstructionId={draggingInstructionId}
                activeDropTarget={activeDropTarget}
                onSelectInstruction={(instructionId) => {
                  setSelectedInstructionId(instructionId);
                  const command = snapshot.commands.find(
                    candidate => candidate.id === instructionId,
                  );
                  if (
                    command?.variableId != null
                    && snapshot.variables.some(
                      variable => variable.id === command.variableId,
                    )
                  ) {
                    setSelectedVariableId(command.variableId);
                  }
                }}
                onInstructionDragStart={(event, instruction) => {
                  if (instruction.id === null) return;
                  const sourceRows = snapshot.commands
                    .filter(candidate => candidate.blockId === instruction.blockId)
                    .slice()
                    .sort((left, right) =>
                      (left.instructionOrder ?? Number.MAX_SAFE_INTEGER)
                        - (right.instructionOrder ?? Number.MAX_SAFE_INTEGER)
                      || (left.id ?? Number.MAX_SAFE_INTEGER)
                        - (right.id ?? Number.MAX_SAFE_INTEGER));
                  commandDragSourceRef.current = {
                    instructionId: instruction.id,
                    blockId: instruction.blockId ?? -1,
                    index: sourceRows.findIndex(candidate => candidate.id === instruction.id),
                  };
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'application/x-ar-variables-instruction',
                    String(instruction.id),
                  );
                  setDraggingInstructionId(instruction.id);
                  setActiveDropTarget(null);
                }}
                onInstructionDragEnd={() => {
                  commandDragSourceRef.current = null;
                  setDraggingInstructionId(null);
                  setActiveDropTarget(null);
                }}
                onDropTargetDragOver={(event) => {
                  if (commandDragSourceRef.current === null || mutationDisabled) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDropTargetDragLeave={() => undefined}
                onDropTarget={(event, target) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleCommandDrop(target);
                  commandDragSourceRef.current = null;
                }}
                onReconnectParent={(instructionId, edge) => {
                  const relationKind = edge?.kind
                    ?? parentRelationKind(instructionId);
                  if (
                    relationKind === 'ELEMENT_TARGET'
                    || relationKind === 'LOOP_ANCHOR'
                    || relationKind === 'CONDITIONAL_ROOT'
                    || relationKind === 'BLOCK_TARGET'
                  ) {
                    openReconnect(instructionId, relationKind);
                  }
                }}
                onReconnectVariable={(instructionId) =>
                  openReconnect(instructionId, 'VARIABLE_BINDING')}
                onReconnectRightVariable={setRightVariableReconnectInstructionId}
                onChangeCheckOperator={changeCheckOperator}
                onEditCommand={(instruction) => {
                  if (instruction.id === null) return;
                  setAddingCommand(false);
                  setSelectedInstructionId(instruction.id);
                  setEditingCommandId(instruction.id);
                }}
                onDeleteCommand={(instruction) => {
                  if (instruction.id !== null) requestDeleteCommand(instruction.id);
                }}
                pendingStatusInstructionId={pendingStatusInstructionId}
                onToggleInstructionStatus={(instruction, active) => {
                  if (!submitInstructionStatus(instruction, active)) {
                    setStatus({
                      level: 'error',
                      text: 'Variables is busy or disconnected. The command status was not changed.',
                    });
                  }
                }}
                onResolveVisibleConnections={openResolveVisibleConnections}
                onReviewVisibleConnections={openReviewVisibleConnections}
                onReleaseVisibleConnections={openReleaseVisibleConnections}
                onAddCommand={() => {
                  setEditingCommandId(null);
                  setAddingCommand(true);
                }}
              />

              <section
                className={styles.middleWorkspace}
                aria-label="Variables Block transfer and relationship workspace"
              >
                <VariablesBlockTransferBoard
                  key={`variables-block-transfer:${workspaceIdentityKey}`}
                  blocks={snapshot.blocks}
                  layoutRows={snapshot.mutationCapability?.layoutRows ?? []}
                  disabled={mutationDisabled}
                  unavailableReason={pendingCopyRequestId
                    ? 'Copying...'
                    : pendingMutationRequestId
                      ? 'Saving...'
                      : pendingBlockTransfer
                        ? 'Review transfer'
                        : snapshot.mutationCapability?.reactAuthoredProfile == null
                          ? 'Read-only'
                          : undefined}
                  onTransferIntent={handleBlockTransferIntent}
                />

                <section
                  className={styles.flowPanel}
                  aria-label="Selected variable relationship flow"
                >
                  <header className={styles.flowPanelHeading}>
                    <div>
                      <span className={styles.flowPanelEyebrow}>Relationship flow</span>
                      <h3>Inspect variable relationships</h3>
                      <p>
                        Trace Web Elements, producers, runtime variables, readers,
                        and diagnostics.
                      </p>
                    </div>
                    <span className={styles.flowPanelState}>
                      {selectedVariable ? 'Flow ready' : 'Select a variable'}
                    </span>
                  </header>

                  <div className={styles.flowPanelBody}>
                    <div className={styles.flowFilters}>
                  <SearchBox
                    key={`variables-relationship-search:${workspaceIdentityKey}`}
                    label="Relationship flow"
                    placeholder="Select a variable..."
                    headerRight="Defined variables"
                    countLabel={count => `${count} VARIABLE${count === 1 ? '' : 'S'}`}
                    options={variableSearchOptions}
                    value={selectedVariableId === null
                      ? null
                      : String(selectedVariableId)}
                    onChange={value =>
                      setSelectedVariableId(value === null ? null : Number(value))}
                  />
                  <div
                    className={styles.filterButtons}
                    role="group"
                    aria-label="Variable health filter"
                  >
                    {filterButtons.map(filter => (
                      <button
                        type="button"
                        key={filter.id}
                        className={healthFilter === filter.id ? styles.filterActive : ''}
                        aria-pressed={healthFilter === filter.id}
                        onClick={() => setHealthFilter(filter.id)}
                      >
                        {filter.label}
                        <span>{filter.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedVariable ? (
                  <>
                    <div className={styles.variableHeading}>
                      <div>
                        <span className={styles.variableEyebrow}>Selected variable · ID {selectedVariable.id}</span>
                        <h2>{selectedVariable.name}</h2>
                        <p>
                          {selectedVariable.type || 'Variable'}
                          {selectedVariable.localFormat ? ` · ${selectedVariable.localFormat}` : ''}
                          {selectedVariable.delimiter ? ` · delimiter “${selectedVariable.delimiter}”` : ''}
                        </p>
                      </div>
                      <span className={`${styles.healthBadge} ${healthTone(selectedVariable.health)}`}>
                        {healthLabel(selectedVariable.health)}
                      </span>
                    </div>

                    <div className={styles.valuePanel}>
                      <div className={styles.valueStateGroup}>
                        <span>Configured value</span>
                        <code
                          className={selectedValuePresentation?.configuredState === 'EMPTY'
                            ? styles.valueStateEmpty
                            : undefined}
                          title={selectedValuePresentation?.configuredDetail}
                        >
                          {selectedValuePresentation?.configuredLabel}
                        </code>
                        <span>Runtime value</span>
                        <strong
                          className={selectedRuntimeValue?.state !== 'VALUE'
                            ? styles.valueStateVoid
                            : styles.valueStateReady}
                          title={selectedRuntimeValue?.state === 'VALUE'
                            ? 'Current independent runtime-memory value.'
                            : selectedRuntimeValue?.voidReason
                              ?.replaceAll('_', ' ') || 'No runtime value yet.'}
                        >
                          {selectedRuntimeValue?.state === 'VALUE'
                            ? selectedRuntimeValue.value === ''
                              ? 'EMPTY'
                              : selectedRuntimeValue.value
                            : 'VOID'}
                        </strong>
                      </div>
                      <p>
                        Runtime memory is independent from the definition. A command or a manual
                        edit replaces the value; an empty string remains different from VOID.
                      </p>
                    </div>

                    <section className={styles.flowCanvas}>
                      <div className={styles.flowColumn}>
                        <div className={styles.flowTitle}>
                          <span>1</span>
                          Web Element endpoints
                        </div>
                        {selectedWebElementEndpoints.length > 0
                          ? selectedWebElementEndpoints.map(endpoint => (
                            <InstructionCard
                              key={`endpoint:${endpoint.id}`}
                              instruction={endpoint}
                              tone="owner"
                            />
                          ))
                          : (
                            <EmptyRelation
                              title="No Web Element endpoint"
                              detail="This variable currently has no GET source or SET target Web Element."
                            />
                          )}
                      </div>

                      <div className={styles.flowArrow} aria-hidden="true">→</div>

                      <div className={styles.flowColumn}>
                        <div className={styles.flowTitle}>
                          <span>2</span>
                          GET producer
                        </div>
                        <div className={styles.flowStack}>
                          {(selectedValuePresentation?.activeProducers.length ?? 0) > 0
                            ? selectedValuePresentation?.activeProducers.map(producer => (
                              <InstructionCard
                                key={`producer:${producer.id ?? producer.name}`}
                                instruction={producer}
                                tone="producer"
                                connectedVariableId={selectedVariable.id}
                              />
                            ))
                            : (
                              <EmptyRelation
                                title="No active GET producer"
                                detail="The variable may still receive a configured, manual, or runtime value."
                              />
                            )}
                        </div>
                      </div>

                      <div className={styles.flowArrow} aria-hidden="true">→</div>

                      <div className={styles.variableNode}>
                        <span>3 · Variable definition</span>
                        <strong>{selectedVariable.name}</strong>
                        <small>{selectedVariable.type || 'Variable'} · ID {selectedVariable.id}</small>
                        <div className={styles.nodeValueStates}>
                          <code>{selectedValuePresentation?.configuredLabel}</code>
                          <b className={selectedRuntimeValue?.state !== 'VALUE'
                            ? styles.nodeValueVoid
                            : styles.nodeValueReady}
                          >
                            {selectedRuntimeValue?.state !== 'VALUE'
                              ? 'VOID'
                              : selectedRuntimeValue.value === ''
                                ? 'EMPTY'
                                : selectedRuntimeValue.value}
                          </b>
                        </div>
                      </div>

                      <div className={styles.flowArrow} aria-hidden="true">→</div>

                      <div className={styles.outputColumn}>
                        <RelationGroup
                          title="Readers / checks"
                          count={selectedVariable.consumers.length}
                          items={selectedVariable.consumers}
                          tone="consumer"
                          emptyText="No SET, ExcelWrite, or CheckValue readers."
                          connectedVariableId={selectedVariable.id}
                        />
                        {(selectedVariable.invalidLinks.length > 0) && (
                          <RelationGroup
                            title="Invalid / legacy links"
                            count={selectedVariable.invalidLinks.length}
                            items={selectedVariable.invalidLinks}
                            tone="invalid"
                            emptyText=""
                          />
                        )}
                      </div>
                    </section>

                    {selectedVariable.diagnostics.length > 0 && (
                      <DiagnosticsPanel
                        title="Selected variable diagnostics"
                        diagnostics={selectedVariable.diagnostics}
                      />
                    )}

                    {snapshot.diagnostics.length > 0 && (
                      <DiagnosticsPanel
                        title="Bot Job graph diagnostics"
                        diagnostics={snapshot.diagnostics}
                      />
                    )}

                    {selectedVariable.health === 'HEALTHY' && (
                      <div className={styles.healthyNotice}>
                        <CheckCircle2 size={17} aria-hidden="true" />
                        The declared owner and command relationships are consistent.
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.noSelection}>
                    <Search size={24} aria-hidden="true" />
                    <strong>Select a variable</strong>
                    <span>Choose a matching variable to inspect its complete relationship flow.</span>
                  </div>
                )}

                  </div>
                </section>
              </section>

              <RuntimeMemoryPanel
                key={`variables-runtime-memory:${workspaceIdentityKey}`}
                items={runtimeMemoryPanelItems(orderedRuntimeMemory)}
                disabled={!connected}
                disabledReason={!connected
                  ? 'Variables is reconnecting. Runtime values remain visible.'
                  : undefined}
                pendingVariableIds={pendingVariableIds}
                onCommitValue={updateRuntimeValue}
                deletingVariableIds={deletingVariableIds}
                deleteDisabled={false}
                onRequestAdd={() => {
                  setStatus({
                    level: 'warn',
                    text: 'Define a new Bot Job variable.',
                  });
                  setAddVariableOpen(true);
                }}
                onRequestAuto={startVariableAutoResolve}
                onRequestClearAll={() => setClearValuesConfirmation(true)}
                clearingValues={pendingClearAll}
                onRequestDelete={requestDeleteVariable}
                onRequestDeleteAll={requestDeleteAllVariables}
              />
            </section>
          )}
        </section>
        {snapshot && pendingConnections && (
          <VariablesConnectionsModal
            key={[
              pendingConnections.authorityKey,
              pendingConnections.mode,
              pendingConnections.mode === 'RESOLVE'
                ? pendingConnections.reviewRevision
                : 0,
            ].join(':')}
            mode={pendingConnections.mode}
            scopeLabel={pendingConnections.scope.label}
            scopeCount={pendingConnections.scope.visibleCount}
            items={pendingConnections.mode === 'RESOLVE'
              ? batchResolveModalItems(snapshot, pendingConnections.review)
              : pendingConnections.items}
            blocks={snapshot.blocks}
            blockFilters={sharedBlockFilters}
            onBlockFiltersChange={changeConnectionsBlockFilters}
            pending={pendingMutationRequestId !== null}
            onConfirm={submitVisibleConnections}
            onCreateCheckValueDefaults={createCheckValueDefaultVariables}
            variableMode={variableResolutionMode}
            onVariableModeChange={(mode) => {
              setVariableResolutionMode(mode);
              if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
                setStatus({ level: 'error', text: 'The Variables preference could not be saved while disconnected.' });
                return;
              }
              webSocket.send(JSON.stringify({
                type: 'variablesWorkspace.preferences.update',
                sessionId,
                body: JSON.stringify({
                  requestId: `${Date.now().toString(36)}-variable-mode`,
                  bindingEpoch: snapshot.bindingEpoch,
                  variableResolutionMode: mode,
                }),
              }));
            }}
            onCancel={() => {
              if (pendingMutationRequestId !== null) return;
              setPendingConnections(null);
              setStatus({
                level: 'warn',
                text: 'Bulk connection action cancelled. No relationship was changed.',
              });
            }}
          />
        )}
        {executionFlowReview && (
          <VariablesExecutionFlowReviewModal
            key={executionFlowReview.authorityKey}
            review={executionFlowReview.review}
            scopeLabel={executionFlowReview.scopeLabel}
            blockFilters={sharedBlockFilters}
            onBlockFiltersChange={setSharedBlockFilters}
            runtimeWriteAvailable={connected}
            onCommitRuntimeValue={updateRuntimeValue}
            onClose={closeExecutionFlowReviewModal}
          />
        )}
        {snapshot && (editingCommand || (addingCommand && addCommandDraft)) && (
          <ComponentEditorModal
            command={editingCommand ?? addCommandDraft!}
            commands={editorCommands}
            variables={snapshot.variables.map(variable => ({
              variableId: variable.id,
              name: variable.name,
              type: variable.type,
            }))}
            botJobId={snapshot.botJob.id}
            botJobName={snapshot.botJob.name}
            status={status}
            scopeLabel={addingCommand
              ? 'Create a new Bot Job command'
              : editorScopeLabel}
            blocks={snapshot.blocks.map(block => ({
              blockId: block.id,
              blockOrder: block.order ?? block.id,
              blockName: block.name,
              commandCount: snapshot.commands.filter(
                command => command.blockId === block.id,
              ).length,
              active: block.active ?? undefined,
            }))}
            connectionCount={relationshipGraph?.edges.length ?? 0}
            diagnosticCount={snapshot.diagnostics.length}
            pending={
              pendingCommandUpdateRequestId !== null
              || pendingCommandCopyRequestId !== null
              || pendingCommandCreateRequestId !== null
            }
            mode={addingCommand ? 'CREATE' : 'EDIT'}
            enabledActions={addingCommand
              ? ['CREATE_NEW']
              : ['UPDATE', 'COPY_NEW']}
            onSubmit={(intent) => {
              const requestId = intent.action === 'CREATE_NEW'
                ? submitCommandCreate(intent)
                : intent.action === 'COPY_NEW'
                  ? submitCommandCopy(intent)
                  : submitCommandUpdate(intent);
              if (requestId) {
                setStatus({
                  level: 'warn',
                  text: intent.action === 'CREATE_NEW'
                    ? 'Adding command...'
                    : intent.action === 'COPY_NEW'
                      ? 'Copying command...'
                      : 'Updating command...',
                });
              } else {
                setStatus({
                  level: 'error',
                  text: intent.action === 'CREATE_NEW'
                    ? 'The new command could not be started.'
                    : intent.action === 'COPY_NEW'
                      ? 'The command copy could not be started.'
                      : 'The command update could not be started.',
                });
              }
            }}
            onClose={() => {
              setEditingCommandId(null);
              setAddingCommand(false);
            }}
          />
        )}
        {snapshot && pendingReconnect && (
          <ReconnectWebElement
            edge={pendingReconnect.plan.edge}
            sourceLabel={reconnectSource
              ? `#${reconnectSource.instructionOrder ?? '?'} ${reconnectSource.name || reconnectSource.command} · ID ${reconnectSource.id}`
              : `Instruction ID ${pendingReconnect.plan.sourceInstructionId}`}
            currentTargetLabel={relationshipTargetLabel(
              snapshot,
              pendingReconnect.plan.currentTarget,
            )}
            compatibleTargets={reconnectOptions}
            pending={
              !connected
              || pendingRequest !== null
              || pendingMutationRequestId !== null
            }
            onDisconnect={() => submitReconnectChoice(null)}
            onConnect={submitReconnectChoice}
            onCancel={() => {
              if (pendingMutationRequestId !== null) return;
              setPendingReconnect(null);
              setStatus({
                level: 'warn',
                text: 'Reconnect cancelled. No relationship was changed.',
              });
            }}
          />
        )}
        {snapshot && rightVariableReconnectInstruction && rightVariableReconnectEdge && (
          <ReconnectWebElement
            edge={rightVariableReconnectEdge}
            sourceLabel={`#${rightVariableReconnectInstruction.instructionOrder ?? '?'} ${
              rightVariableReconnectInstruction.name || rightVariableReconnectInstruction.command
            } · ID ${rightVariableReconnectInstruction.id} · second comparison variable`}
            currentTargetLabel={relationshipTargetLabel(
              snapshot,
              rightVariableReconnectEdge.target,
            )}
            compatibleTargets={rightVariableReconnectOptions}
            pending={pendingCheckValueRightRequestId !== null}
            onDisconnect={() => {
              if (rightVariableReconnectInstruction.id === null) return;
              const requestId = submitCheckValueRight(
                null,
                [rightVariableReconnectInstruction.id],
                'DISCONNECT',
              );
              if (requestId) setRightVariableReconnectInstructionId(null);
            }}
            onConnect={(target) => {
              if (rightVariableReconnectInstruction.id === null) return;
              const requestId = submitCheckValueRight(
                target.id,
                [rightVariableReconnectInstruction.id],
              );
              if (requestId) setRightVariableReconnectInstructionId(null);
            }}
            onCancel={() => {
              if (pendingCheckValueRightRequestId !== null) return;
              setRightVariableReconnectInstructionId(null);
            }}
          />
        )}
        {snapshot && addVariableOpen && (
          <AddVariableModal
            existingNames={snapshot.variables.map(variable => variable.name)}
            pending={pendingCreateRequestId !== null}
            successVersion={addVariableSuccessVersion}
            onSubmit={submitNewVariable}
            onCancel={() => {
              if (pendingCreateRequestId === null) setAddVariableOpen(false);
            }}
          />
        )}
        {snapshot && clearValuesConfirmation && (
          <AlertModal
            header="Clear All Variable Values?"
            body={`Reset all ${snapshot.runtimeMemory.variables.length} runtime value(s) to VOID?`}
            extraMsg={'Variable definitions and instruction relationships are preserved. Empty VALUE("") is different from VOID.'}
            onClose={() => setClearValuesConfirmation(false)}
            onConfirm={confirmClearAllValues}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error
          />
        )}
        {pendingBlockTransfer?.stage === 'ACTION' && (
          <AlertModal
            header="Move or Copy Instruction?"
            body={`Instruction #${pendingBlockTransfer.sourceInstructionId} `
              + `${blockTransferSource?.name || blockTransferSource?.command || ''} `
              + `was dropped on Block #${blockTransferTarget?.order ?? pendingBlockTransfer.targetBlockId} `
              + `${blockTransferTarget?.name || ''}. Choose the operation.`}
            extraMsg="Move changes the existing instruction. New Copy creates fresh database rows and leaves the source unchanged."
            onClose={() => {
              setPendingBlockTransfer(null);
              setStatus({
                level: 'warn',
                text: 'Block transfer cancelled. Nothing was changed.',
              });
            }}
            onConfirm={() => chooseBlockTransferAction('MOVE')}
            alternateAction={{
              label: 'NEW COPY',
              title: 'Create fresh instruction rows in the selected Block',
              onAction: () => chooseBlockTransferAction('COPY'),
              confirmLabel: 'MOVE',
              confirmTitle: 'Move the existing instruction to the selected Block',
            }}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error={false}
          />
        )}
        {pendingBlockTransfer?.stage === 'SCOPE' && (
          <AlertModal
            header={blockTransferConditionalFamily
              ? 'Transfer Complete IF Family?'
              : pendingBlockTransfer.action === 'COPY'
                ? 'Choose Copy Scope'
                : 'Choose Move Scope'}
            body={blockTransferConditionalFamily
              ? `IF family #${blockTransferConditionalFamily.rootInstructionId} contains `
                + `${blockTransferConditionalFamily.boundaryInstructionIds.length} linked `
                + 'boundaries. IF, ELSEIF, ELSE, and ENDIF always transfer together.'
              : `Instruction #${pendingBlockTransfer.sourceInstructionId} has `
                + `${blockTransferSelection?.ok
                  ? Math.max(
                      0,
                      blockTransferSelection.selection.sourceInstructionIds.length - 1,
                    )
                  : 0} explicit parent/dependency instruction(s) available. `
                + 'Choose only this instruction or include all of those parents.'}
            extraMsg={blockTransferConditionalFamily
              ? pendingBlockTransfer.action === 'COPY'
                ? 'New Copy creates fresh IDs and remaps every conditional parent to the new IF root.'
                : 'Move keeps the existing IDs and updates every conditional parent Block together.'
              : pendingBlockTransfer.action === 'COPY'
                ? 'Every copied instruction receives a fresh ID. Internal parent and variable links are remapped to the new rows.'
                : 'Move keeps the existing IDs. Relationships that cannot remain valid will become available for reconnect.'}
            onClose={() => {
              setPendingBlockTransfer(null);
              setStatus({
                level: 'warn',
                text: 'Block transfer cancelled. Nothing was changed.',
              });
            }}
            onConfirm={() => submitBlockTransferScope('WITH_PARENTS')}
            alternateAction={blockTransferConditionalFamily
              ? undefined
              : {
                  label: 'ONLY INSTRUCTION',
                  title: 'Transfer only the command that was dropped',
                  onAction: () => submitBlockTransferScope('ONLY_INSTRUCTION'),
                  confirmLabel: 'WITH ALL PARENTS',
                  confirmTitle: 'Transfer the command and its explicit dependency parents',
                }}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error={false}
          />
        )}
        {deleteConfirmation && (
          <AlertModal
            header={deleteConfirmation.title}
            body={deleteConfirmation.body}
            extraMsg="This operation changes variable definitions only. Instructions and Web Elements are preserved."
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={confirmVariableDelete}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error
          />
        )}
        {commandDeleteConfirmation && (
          <AlertModal
            header={commandDeleteConfirmation.title}
            body={commandDeleteConfirmation.body}
            extraMsg={commandDeleteConfirmation.details}
            onClose={() => setCommandDeleteConfirmation(null)}
            onConfirm={confirmCommandDelete}
            imageSrc={warningRedImage}
            imageClass="construction-image"
            error
          />
        )}
      </main>
    </DetachedPageShell>
  );
};

export default VariablesPage;
