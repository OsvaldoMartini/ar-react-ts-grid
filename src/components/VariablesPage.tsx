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
  RelationshipTarget,
} from './bot-job-details/grid/domain/instructionRelationshipGraph';
import { instructionRelationshipPolicy } from './bot-job-details/grid/domain/instructionRelationshipPolicy';
import SearchBox, { type SearchBoxOption } from './SearchBox';
import { useWebSocket } from './useWebSocket';
import {
  planVariablesFreeMove,
} from './variables/domain/variablesFreeMove';
import {
  buildVariablesReconnectMutation,
  planVariablesReconnect,
  variablesReconnectGraph,
  type VariablesReconnectPlan,
  type VariablesReconnectRelationKind,
} from './variables/domain/variablesReconnectMutation';
import { variableValuePresentation } from './variables/domain/variableValuePresentation';
import { orderRuntimeVariablesByExecution } from './variables/domain/variableExecutionOrder';
import RuntimeMemoryPanel from './variables/RuntimeMemoryPanel';
import AddVariableModal, {
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
import VariableFlowRepairModal from './variables/VariableFlowRepairModal';
import {
  buildVariableFlowRepairMutation,
  planVariableFlowRepair,
  reviewVariableFlowRepair,
  validateVariableFlowRepairAuthority,
  type VariableFlowRepairChoice,
  type VariableFlowRepairPlan,
} from './variables/domain/variableFlowRepair';
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
  buildVariablesExecutionFlowReview,
  variablesExecutionFlowReviewAuthorityKey,
  type VariablesExecutionFlowReview,
} from './variables/domain/variablesExecutionFlowReview';
import {
  planVariablesBlockMove,
  selectVariablesBlockTransferSources,
  type VariablesBlockTransferScope,
} from './variables/domain/variablesBlockTransfer';
import { useVariablesGraphMutation } from './variables/useVariablesGraphMutation';
import {
  useVariablesInstructionCopy,
  type VariablesInstructionCopyResult,
} from './variables/useVariablesInstructionCopy';
import {
  useVariablesCreate,
  type VariablesCreateResult,
} from './variables/useVariablesCreate';
import {
  useVariablesDelete,
  type VariablesDeleteMode,
  type VariablesDeleteResult,
} from './variables/useVariablesDelete';
import { useVariablesRuntimeMemory } from './variables/useVariablesRuntimeMemory';
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

type PendingVariableFlowRepair = {
  authorityKey: string;
  plan: VariableFlowRepairPlan;
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

type PendingConnectionsReview = {
  mode: 'REVIEW';
  authorityKey: string;
  scope: VariablesConnectionScope;
  review: VariablesExecutionFlowReview;
};

type PendingConnections =
  | PendingConnectionsResolve
  | PendingConnectionsRelease
  | PendingConnectionsReview;

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
    case 'VARIABLE_OWNER':
      return 'Variable declaration Web Element';
    case 'VARIABLE_ORDER':
      return 'Execution order';
    default:
      return kind;
  }
};

const batchSourceLabels = (
  snapshot: VariableWorkspaceSnapshot,
  instructionId: number,
): { label: string; sublabel: string } => {
  const command = snapshot.commands.find(candidate =>
    candidate.id === instructionId);
  if (!command) {
    return {
      label: `Instruction ID ${instructionId}`,
      sublabel: 'Current Bot Job',
    };
  }
  return {
    label: `#${command.instructionOrder ?? '?'} ${command.name || command.command} · ID ${instructionId}`,
    sublabel: `Block #${command.blockOrder ?? '?'} ${command.blockName || command.blockId || 'Unavailable'}`,
  };
};

const batchResolveModalItems = (
  snapshot: VariableWorkspaceSnapshot,
  review: VariablesBatchResolveReview,
): VariablesConnectionReviewItem[] => review.items.map((item) => {
  const source = item.sourceEntity === 'VARIABLE'
    ? (() => {
        const variable = snapshot.variables.find(candidate =>
          candidate.id === item.sourceVariableId);
        return variable
          ? {
              label: `${variable.name} · Variable ID ${variable.id}`,
              sublabel: 'Variable definition',
            }
          : {
              label: `Variable ID ${item.sourceId}`,
              sublabel: 'Current Bot Job',
            };
      })()
    : batchSourceLabels(snapshot, item.sourceInstructionId ?? item.sourceId);
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
    sourceLabel: source.label,
    sourceSublabel: source.sublabel,
    relationLabel: batchRelationshipLabel(item.kind),
    state,
    stateTone,
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
      sourceLabel: source.label,
      sourceSublabel: source.sublabel,
      relationLabel: batchRelationshipLabel('VARIABLE_BINDING'),
      state: 'WILL RELEASE',
      stateTone: 'red' as const,
      currentTargetLabel: relationshipTargetLabel(snapshot, currentTarget),
    };
  });
  const ownerItems = plan.draft.variableOwnerPatches.map((patch) => {
    const variable = snapshot.variables.find(candidate =>
      candidate.id === patch.variableId);
    const currentTarget: RelationshipTarget | null =
      patch.expected.value === null
        ? null
        : {
            entity: 'INSTRUCTION',
            owner,
            id: patch.expected.value,
          };
    return {
      id: `VARIABLE:${patch.variableId}:VARIABLE_OWNER`,
      sourceLabel: variable
        ? `${variable.name} · Variable ID ${variable.id}`
        : `Variable ID ${patch.variableId}`,
      sourceSublabel: 'Variable definition',
      relationLabel: batchRelationshipLabel('VARIABLE_OWNER'),
      state: 'WILL RELEASE',
      stateTone: 'red' as const,
      currentTargetLabel: relationshipTargetLabel(snapshot, currentTarget),
    };
  });
  return [...relationItems, ...variableItems, ...ownerItems];
};

const InstructionCard: React.FC<{
  instruction: VariableInstructionNode;
  tone: 'owner' | 'producer' | 'consumer' | 'literal' | 'invalid';
  emptyLabel?: never;
}> = ({ instruction, tone }) => (
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
    {instruction.operation && (
      <code className={styles.operation} title={instruction.operation}>
        {instruction.operation}
      </code>
    )}
    {(instruction.active === false || instruction.blockActive === false) && (
      <span className={styles.inactivePill}>Inactive in execution</span>
    )}
  </article>
);

const EmptyRelation: React.FC<{
  title: string;
  detail: string;
  danger?: boolean;
  actionLabel?: string;
  disabled?: boolean;
  onActivate?: () => void;
}> = ({
  title,
  detail,
  danger = false,
  actionLabel,
  disabled = false,
  onActivate,
}) => {
  const className = [
    styles.emptyRelation,
    danger ? styles.emptyDanger : '',
    onActivate ? styles.emptyRelationAction : '',
  ].filter(Boolean).join(' ');
  const content = (
    <>
      <strong>{title}</strong>
      <span>{detail}</span>
      {actionLabel && <b>{actionLabel}</b>}
    </>
  );
  return onActivate
    ? (
        <button
          type="button"
          className={className}
          disabled={disabled}
          onClick={onActivate}
        >
          {content}
        </button>
      )
    : <div className={className}>{content}</div>;
};

const RelationGroup: React.FC<{
  title: string;
  count: number;
  items: VariableCommandLink[];
  tone: 'consumer' | 'literal' | 'invalid';
  emptyText: string;
}> = ({ title, count, items, tone, emptyText }) => (
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
  const [draggingInstructionId, setDraggingInstructionId] =
    useState<number | null>(null);
  const [activeDropTarget, setActiveDropTarget] =
    useState<VariablesCommandDropTarget | null>(null);
  const [pendingReconnect, setPendingReconnect] =
    useState<PendingReconnect | null>(null);
  const [pendingVariableFlowRepair, setPendingVariableFlowRepair] =
    useState<PendingVariableFlowRepair | null>(null);
  const [pendingConnections, setPendingConnections] =
    useState<PendingConnections | null>(null);
  const [pendingBlockTransfer, setPendingBlockTransfer] =
    useState<PendingBlockTransfer | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<VariableDeleteConfirmation | null>(null);
  const [addVariableOpen, setAddVariableOpen] = useState(false);
  const [clearValuesConfirmation, setClearValuesConfirmation] = useState(false);
  const [deletingVariableIds, setDeletingVariableIds] =
    useState<ReadonlySet<number>>(() => new Set());
  const [status, setStatus] = useState<Status>({
    level: 'warn',
    text: 'Waiting for Variables workspace',
  });
  const {
    pendingRequestId: pendingMutationRequestId,
    submit: submitGraphMutation,
    handleMessage: handleGraphMutationMessage,
  } = useVariablesGraphMutation({
    webSocket,
    connected,
    snapshot,
  });

  const replaceSnapshot = useCallback((next: VariableWorkspaceSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
    setSelectedVariableId(current =>
      current !== null && next.variables.some(variable => variable.id === current)
        ? current
        : next.variables[0]?.id ?? null);
    setSelectedInstructionId(current =>
      current !== null && next.commands.some(command => command.id === current)
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
  } = useVariablesRuntimeMemory({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onMemory: replaceRuntimeMemory,
    onStatus: setStatus,
  });

  const handleVariableCreateResult = useCallback((
    result: VariablesCreateResult,
  ) => {
    setStatus({
      level: result.ok ? 'ok' : 'error',
      text: result.ok
        ? result.message || `Variable #${result.variableId ?? '?'} created.`
        : result.error || 'Variable creation was refused.',
    });
    if (result.ok) setAddVariableOpen(false);
  }, []);

  const {
    pendingRequestId: pendingCreateRequestId,
    submit: submitVariableCreate,
    handleMessage: handleVariableCreateMessage,
  } = useVariablesCreate({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleVariableCreateResult,
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
  } = useVariablesDelete({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleVariableDeleteResult,
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
  } = useVariablesInstructionCopy({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onResult: handleInstructionCopyResult,
  });

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
      if (handleInstructionCopyMessage(raw)) return;
      if (handleVariableCreateMessage(raw)) return;
      if (handleVariableDeleteMessage(raw)) return;
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
      replaceSnapshot(normalized);
      setStatus({
        level: normalized.summary.warningCount > 0 ? 'warn' : 'ok',
        text: normalized.message || 'Variable relationships loaded',
      });
    });
  }, [
    clearPendingRequest,
    handleGraphMutationMessage,
    handleInstructionCopyMessage,
    handleRuntimeMemoryMessage,
    handleVariableCreateMessage,
    handleVariableDeleteMessage,
    messages,
    replaceSnapshot,
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
  const orderedRuntimeMemory = useMemo(
    () => snapshot
      ? orderRuntimeVariablesByExecution(
          snapshot.runtimeMemory.variables,
          snapshot.variables,
        )
      : [],
    [snapshot],
  );
  const mutationAuthorityKey = mutationAuthorityKeyFor(snapshot);
  const relationshipGraph = useMemo(
    () => snapshot ? variablesReconnectGraph(snapshot) : null,
    [snapshot],
  );
  const completeExecutionFlowReview = useMemo(
    () => snapshot ? buildVariablesExecutionFlowReview(snapshot) : null,
    [snapshot],
  );
  const resolveConnectionsMode = useMemo<'RESOLVE' | 'REVIEW'>(() => {
    if (!snapshot || !completeExecutionFlowReview) return 'RESOLVE';
    if (snapshot.mutationCapability?.reactAuthoredProfile == null) {
      return 'REVIEW';
    }
    const instructionIds = snapshot.commands.flatMap(command =>
      command.id !== null
      && Number.isSafeInteger(command.id)
      && command.id > 0
        ? [command.id]
        : []);
    const planned = planVariablesBatchResolve(snapshot, instructionIds);
    return planned.ok && planned.plan.reviewItems.length === 0
      ? 'REVIEW'
      : 'RESOLVE';
  }, [completeExecutionFlowReview, snapshot]);
  const resolveConnectionsModeForScope = useCallback((
    scope: VariablesConnectionScope,
  ): 'RESOLVE' | 'REVIEW' => {
    if (!snapshot || !completeExecutionFlowReview) return 'RESOLVE';
    if (snapshot.mutationCapability?.reactAuthoredProfile == null) {
      return 'REVIEW';
    }
    const planned = planVariablesBatchResolve(snapshot, scope.instructionIds);
    return planned.ok && planned.plan.reviewItems.length === 0
      ? 'REVIEW'
      : 'RESOLVE';
  }, [completeExecutionFlowReview, snapshot]);

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
      && pendingVariableFlowRepair
      && !validateVariableFlowRepairAuthority(
        pendingVariableFlowRepair.plan,
        snapshot,
      )
    ) {
      setPendingVariableFlowRepair(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the variable flow repair again.',
      });
    }
  }, [pendingVariableFlowRepair, snapshot]);

  useEffect(() => {
    if (!snapshot || !pendingConnections) return;
    if (pendingConnections.mode === 'REVIEW') {
      const sameOwner = pendingConnections.review.homeBankingId
        === snapshot.botJob.homeBankingId
        && pendingConnections.review.botJobId === snapshot.botJob.id;
      if (!sameOwner) {
        setPendingConnections(null);
        setStatus({
          level: 'error',
          text: 'The active Bot Job changed. Open connection review again.',
        });
        return;
      }
      const authorityKey = variablesExecutionFlowReviewAuthorityKey(snapshot);
      const nextReview = buildVariablesExecutionFlowReview(snapshot);
      if (
        pendingConnections.authorityKey !== authorityKey
        || pendingConnections.review.runtimeMemoryRevision
          !== snapshot.runtimeMemory.revision
        || pendingConnections.review.relationshipsAvailable
          !== nextReview.relationshipsAvailable
      ) {
        setPendingConnections({
          ...pendingConnections,
          authorityKey,
          review: nextReview,
        });
      }
      return;
    }
    if (!validateVariablesBatchConnectionsAuthority(
      pendingConnections.authorityKey,
      snapshot,
    )) {
      setPendingConnections(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the bulk connection action again.',
      });
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
    sourceInstructionId: number | null,
    pendingText: string,
    committedText: string,
  ) => {
    setStatus({ level: 'warn', text: pendingText });
    const requestId = submitGraphMutation(draft, {
      committed: response => {
        setPendingReconnect(null);
        setPendingVariableFlowRepair(null);
        setPendingConnections(null);
        setPendingBlockTransfer(null);
        setDraggingInstructionId(null);
        setActiveDropTarget(null);
        setStatus({
          level: 'ok',
          text: response.message || committedText,
        });
        sendWorkspaceRequest('variablesWorkspace.refresh');
      },
      refused: (response, reason) => {
        setPendingReconnect(null);
        setPendingVariableFlowRepair(null);
        setPendingConnections(null);
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
      setPendingVariableFlowRepair(null);
      setPendingConnections(null);
      setPendingBlockTransfer(null);
      setDraggingInstructionId(null);
      setActiveDropTarget(null);
      setStatus({
        level: 'error',
        text: sourceInstructionId === null
          ? 'Variables is busy or disconnected. The graph was not changed.'
          : `Variables is busy or disconnected. Instruction #${sourceInstructionId} was not changed.`,
      });
    }
  }, [sendWorkspaceRequest, submitGraphMutation]);

  const handleCommandDrop = useCallback((
    target: VariablesCommandDropTarget,
  ) => {
    const current = snapshotRef.current;
    const sourceInstructionId = draggingInstructionId;
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
    const selection = selectVariablesBlockTransferSources(
      current,
      pending.sourceInstructionId,
      scope,
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
        scope,
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
      scope,
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
    submitVariablesMutation,
  ]);

  const openVariableFlowRepair = useCallback((variableId: number) => {
    const current = snapshotRef.current;
    if (!current) {
      setStatus({
        level: 'error',
        text: 'Variables must finish loading before the flow can be repaired.',
      });
      return;
    }
    const planned = planVariableFlowRepair(current, variableId);
    if (!planned.ok) {
      setStatus({ level: 'error', text: planned.message });
      return;
    }
    setSelectedVariableId(variableId);
    setPendingVariableFlowRepair({
      authorityKey: planned.plan.authorityKey,
      plan: planned.plan,
    });
    setStatus({
      level: 'warn',
      text: 'Choose the Web Element and GET producer for this variable.',
    });
  }, []);

  const submitVariableFlowRepair = useCallback((
    choice: VariableFlowRepairChoice,
  ) => {
    const current = snapshotRef.current;
    const pending = pendingVariableFlowRepair;
    if (
      !current
      || !pending
      || !validateVariableFlowRepairAuthority(pending.plan, current)
    ) {
      setPendingVariableFlowRepair(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the variable flow repair again.',
      });
      return;
    }
    const built = buildVariableFlowRepairMutation(pending.plan, choice);
    if (!built.ok) {
      if (built.code === 'NO_CHANGES') {
        setPendingVariableFlowRepair(null);
        setStatus({ level: 'ok', text: built.message });
        return;
      }
      setStatus({ level: 'error', text: built.message });
      return;
    }
    const orderWarning = built.review.executionOrderIssueInstructionIds.length;
    submitVariablesMutation(
      built.draft,
      built.mutationProfile,
      built.changedInstructionIds[0] ?? choice.getInstructionId,
      'Connecting Web Element, GET producer, and variable...',
      orderWarning > 0
        ? `Variable flow connected. ${orderWarning} reader(s) still require execution-order review.`
        : 'Web Element, GET producer, and variable connected.',
    );
  }, [
    pendingVariableFlowRepair,
    submitVariablesMutation,
  ]);

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
    if (current.mutationCapability?.reactAuthoredProfile == null) {
      const executionReview = buildVariablesExecutionFlowReview(current);
      setPendingConnections({
        mode: 'REVIEW',
        authorityKey: variablesExecutionFlowReviewAuthorityKey(current),
        scope,
        review: executionReview,
      });
      setStatus({
        level: 'warn',
        text: `Reviewing ${executionReview.steps.length} command(s) in read-only mode. Relationship authority is currently unavailable.`,
      });
      return;
    }
    const planned = planVariablesBatchResolve(
      current,
      scope.instructionIds,
    );
    if (!planned.ok) {
      setStatus({ level: 'error', text: planned.message });
      return;
    }
    const reviewed = reviewVariablesBatchResolve(planned.plan, []);
    if (!reviewed.ok) {
      setStatus({ level: 'error', text: reviewed.message });
      return;
    }
    if (reviewed.review.items.length === 0) {
      const executionReview = buildVariablesExecutionFlowReview(current);
      setPendingConnections({
        mode: 'REVIEW',
        authorityKey: variablesExecutionFlowReviewAuthorityKey(current),
        scope,
        review: executionReview,
      });
      setStatus({
        level: 'ok',
        text: `Reviewing the complete ${executionReview.steps.length}-command Bot Job execution flow. No database change will be made.`,
      });
      return;
    }
    setPendingConnections({
      mode: 'RESOLVE',
      authorityKey: planned.plan.authorityKey,
      scope,
      plan: planned.plan,
      review: reviewed.review,
      choices: [],
      reviewRevision: 0,
    });
    setStatus({
      level: 'warn',
      text: `Reviewing connections, variable ownership, and execution order for ${scope.visibleCount} visible command(s).`,
    });
  }, []);

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
    const planned = planVariablesBatchRelease(
      current,
      scope.instructionIds,
    );
    if (!planned.ok) {
      setStatus({ level: 'error', text: planned.message });
      return;
    }
    const items = batchReleaseModalItems(current, planned.plan);
    if (items.length === 0) {
      setStatus({
        level: 'ok',
        text: `The ${scope.visibleCount} visible command(s) have no reviewed connections to release.`,
      });
      return;
    }
    setPendingConnections({
      mode: 'RELEASE',
      authorityKey: planned.plan.authorityKey,
      scope,
      plan: planned.plan,
      items,
    });
    setStatus({
      level: 'warn',
      text: `Reviewing ${items.length} connection(s) before release.`,
    });
  }, []);

  const submitVisibleConnections = useCallback((
    submission: VariablesConnectionsModalSubmission,
  ) => {
    const current = snapshotRef.current;
    const pending = pendingConnections;
    const authorityValid = current && pending
      ? pending.mode === 'REVIEW'
        ? pending.authorityKey
          === variablesExecutionFlowReviewAuthorityKey(current)
        : validateVariablesBatchConnectionsAuthority(
            pending.authorityKey,
            current,
          )
      : false;
    if (
      !current
      || !pending
      || !authorityValid
    ) {
      setPendingConnections(null);
      setStatus({
        level: 'error',
        text: 'The Variables graph changed. Open the bulk connection action again.',
      });
      return;
    }

    if (pending.mode === 'REVIEW') {
      setStatus({
        level: 'warn',
        text: 'Connection review is read-only. No graph mutation was submitted.',
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
      submitVariablesMutation(
        pending.plan.draft,
        pending.plan.mutationProfile,
        pending.plan.changedInstructionIds[0] ?? null,
        `Releasing ${pending.items.length} connection(s)...`,
        `${pending.items.length} connection(s) released.`,
      );
      return;
    }

    if (submission.mode !== 'RESOLVE') {
      setStatus({
        level: 'error',
        text: 'The connection action changed before confirmation.',
      });
      return;
    }
    const choicesById = new Map(
      pending.choices.map(choice => [choice.reviewId, choice]),
    );
    for (const resolution of submission.resolutions) {
      const item = pending.review.items.find(candidate =>
        candidate.reviewId === resolution.itemId);
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
      pending.plan,
      choices,
    );
    if (!built.ok) {
      if (built.code === 'REVIEW_REQUIRED') {
        const reviewed = reviewVariablesBatchResolve(
          pending.plan,
          choices,
        );
        if (reviewed.ok) {
          setPendingConnections({
            ...pending,
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
    const appliedCount = built.mutation.review.items.filter(item =>
      item.selectedTarget !== null
      && (
        item.resolution === 'AUTO'
        || item.resolution === 'REVIEWED'
      )).length;
    const unchangedCount =
      built.mutation.review.items.length - appliedCount;
    submitVariablesMutation(
      built.mutation.draft,
      built.mutation.mutationProfile,
      built.mutation.changedInstructionIds[0] ?? null,
      `Resolving ${appliedCount} reviewed relationship(s)...`,
      `${appliedCount} reviewed relationship(s) resolved.${unchangedCount > 0
        ? ` ${unchangedCount} unavailable or skipped relationship(s) remained unchanged.`
        : ''}`,
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

  const submitNewVariable = useCallback((draft: AddVariableDraft) => {
    const requestId = submitVariableCreate(draft);
    if (!requestId) {
      setStatus({
        level: 'error',
        text: 'Variables is busy, disconnected, or read-only. No variable was created.',
      });
      return;
    }
    setStatus({
      level: 'warn',
      text: `Creating variable “${draft.name}”...`,
    });
  }, [submitVariableCreate]);

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
    || pendingDeleteRequestId !== null
    || pendingReconnect !== null
    || pendingVariableFlowRepair !== null
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
  const variableFlowPlan = pendingVariableFlowRepair?.plan ?? null;
  const variableFlowWebElementOptions = variableFlowPlan
    ? variableFlowPlan.webElementCandidates
      .filter(candidate => candidate.compatibleGetInstructionIds.length > 0)
      .map(candidate => ({
        instructionId: candidate.instructionId,
        label: `#${candidate.instructionOrderNumber} ${candidate.name} · ID ${candidate.instructionId}`,
        sublabel: `Block #${candidate.blockOrderNumber} · Block ID ${candidate.blockId}`,
        badges: [
          { text: 'WEB ELEMENT', tone: 'blue' as const },
          ...(candidate.instructionId
            === variableFlowPlan.currentOwnerInstructionId
            ? [{ text: 'CURRENT OWNER', tone: 'green' as const }]
            : []),
        ],
        keywords: [
          candidate.instructionId,
          candidate.name,
          candidate.action,
          candidate.tagName,
          candidate.blockId,
          candidate.blockOrderNumber,
          candidate.instructionOrderNumber,
        ].join(' '),
      }))
    : [];
  const variableFlowGetOptions = variableFlowPlan
    ? variableFlowPlan.getCandidates.map(candidate => ({
        instructionId: candidate.instructionId,
        label: `#${candidate.instructionOrderNumber} ${candidate.name} · ID ${candidate.instructionId}`,
        sublabel: `Block #${candidate.blockOrderNumber} · Block ID ${candidate.blockId}`,
        badges: [{ text: 'GET', tone: 'blue' as const }],
        keywords: [
          candidate.instructionId,
          candidate.name,
          candidate.blockId,
          candidate.blockOrderNumber,
          candidate.instructionOrderNumber,
          candidate.currentParentId,
          candidate.currentVariableId,
        ].join(' '),
        compatibleWebElementInstructionIds:
          variableFlowPlan.webElementCandidates
            .filter(webElement =>
              webElement.compatibleGetInstructionIds.includes(
                candidate.instructionId,
              ))
            .map(webElement => webElement.instructionId),
      }))
    : [];
  const variableFlowCurrentOwnerLabel = snapshot && variableFlowPlan
    && variableFlowPlan.currentOwnerInstructionId !== null
    ? relationshipTargetLabel(snapshot, {
        entity: 'INSTRUCTION',
        owner: {
          workspaceKind: 'BOT_JOB',
          homeBankingId: snapshot.botJob.homeBankingId,
          botJobId: snapshot.botJob.id,
        },
        id: variableFlowPlan.currentOwnerInstructionId,
      })
    : null;

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
              <span><b>{snapshot?.summary.literalAssignmentCount ?? 0}</b> Literal SET</span>
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
                workspaceIdentityKey={`${snapshot.botJob.homeBankingId}:${snapshot.botJob.id}`}
                blocks={snapshot.blocks}
                instructions={snapshot.commands}
                relationshipEdges={relationshipGraph?.edges ?? []}
                resolveConnectionsMode={resolveConnectionsMode}
                resolveConnectionsModeForScope={resolveConnectionsModeForScope}
                resolveConnectionsDisabled={mutationDisabled}
                reviewConnectionsDisabled={completeExecutionFlowReview === null}
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
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'application/x-ar-variables-instruction',
                    String(instruction.id),
                  );
                  setDraggingInstructionId(instruction.id);
                  setActiveDropTarget(null);
                }}
                onInstructionDragEnd={() => {
                  setDraggingInstructionId(null);
                  setActiveDropTarget(null);
                }}
                onDropTargetDragOver={(event, target) => {
                  if (draggingInstructionId === null || mutationDisabled) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setActiveDropTarget(target);
                }}
                onDropTargetDragLeave={(event, target) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                  setActiveDropTarget(current =>
                    current?.blockId === target.blockId
                      && current.index === target.index
                      ? null
                      : current);
                }}
                onDropTarget={(event, target) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleCommandDrop(target);
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
                onResolveVisibleConnections={openResolveVisibleConnections}
                onReleaseVisibleConnections={openReleaseVisibleConnections}
              />

              <section
                className={styles.middleWorkspace}
                aria-label="Variables Block transfer and relationship workspace"
              >
                <VariablesBlockTransferBoard
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
                          Declaration Web Field
                        </div>
                        {selectedVariable.owner
                          ? (
                            <InstructionCard
                              instruction={selectedVariable.owner}
                              tone="owner"
                            />
                          )
                          : (
                            <EmptyRelation
                              title="Owner missing"
                              detail="The declaration no longer resolves to a Web Field."
                              danger
                              actionLabel="Connect Web Element → GET → Variable"
                              disabled={mutationDisabled}
                              onActivate={() =>
                                openVariableFlowRepair(selectedVariable.id)}
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
                              />
                            ))
                            : (
                              <EmptyRelation
                                title={(selectedValuePresentation?.activeConsumers.length ?? 0) > 0
                                  ? 'GET missing'
                                  : 'No active GET producer'}
                                detail={(selectedValuePresentation?.activeConsumers.length ?? 0) > 0
                                  ? 'Active readers exist, but no active GET command produces a value.'
                                  : 'No active GET producer is present in the declared graph.'}
                                danger
                                actionLabel="Connect Web Element → GET → Variable"
                                disabled={mutationDisabled}
                                onActivate={() =>
                                  openVariableFlowRepair(selectedVariable.id)}
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
                          emptyText="No E, CK, PDF CHECK, or CSV CHECK readers."
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

                    {selectedVariable.literalAssignments.length > 0 && (
                      <section className={styles.literalLane}>
                        <div className={styles.literalLaneHeading}>
                          <div>
                            <strong>Literal SET assignments</strong>
                            <span>
                              These commands write a literal into the declaration Web Field;
                              they do not read the variable at runtime.
                            </span>
                          </div>
                          <b>{selectedVariable.literalAssignments.length}</b>
                        </div>
                        <div className={styles.literalFlow}>
                          <div className={styles.literalCommands}>
                            {selectedVariable.literalAssignments.map(command => (
                              <InstructionCard
                                key={`literal:${command.id ?? command.name}`}
                                instruction={command}
                                tone="literal"
                              />
                            ))}
                          </div>
                          <div className={styles.literalArrow} aria-hidden="true">→</div>
                          <div className={styles.literalTarget}>
                            {selectedVariable.owner
                              ? (
                                <InstructionCard
                                  instruction={selectedVariable.owner}
                                  tone="owner"
                                />
                              )
                              : (
                                <EmptyRelation
                                  title="Target Web Field missing"
                                  detail="The literal SET target cannot be resolved."
                                  danger
                                />
                              )}
                          </div>
                        </div>
                      </section>
                    )}

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
                items={orderedRuntimeMemory.map(entry => ({
                  variableId: entry.variableId,
                  name: entry.name,
                  state: entry.state,
                  value: entry.state === 'VALUE' ? entry.value : null,
                  voidReason: entry.voidReason,
                  editable: true,
                }))}
                disabled={!connected}
                disabledReason={!connected
                  ? 'Variables is reconnecting. Runtime values remain visible.'
                  : undefined}
                pendingVariableIds={pendingVariableIds}
                onCommitValue={updateRuntimeValue}
                deletingVariableIds={deletingVariableIds}
                deleteDisabled={
                  !connected
                  || pendingDeleteRequestId !== null
                  || snapshot.mutationCapability === null
                }
                onRequestAdd={() => {
                  setStatus({
                    level: 'warn',
                    text: 'Define a new Bot Job variable.',
                  });
                  setAddVariableOpen(true);
                }}
                onRequestClearAll={() => setClearValuesConfirmation(true)}
                clearingValues={pendingClearAll}
                onRequestDelete={requestDeleteVariable}
                onRequestDeleteAll={requestDeleteAllVariables}
              />
            </section>
          )}
        </section>
        {snapshot
          && pendingConnections
          && pendingConnections.mode !== 'REVIEW'
          && (
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
            pending={pendingMutationRequestId !== null}
            onConfirm={submitVisibleConnections}
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
        {pendingConnections?.mode === 'REVIEW' && (
          <VariablesExecutionFlowReviewModal
            key={pendingConnections.authorityKey}
            review={pendingConnections.review}
            scopeLabel={pendingConnections.scope.label}
            onClose={() => {
              setPendingConnections(null);
              setStatus({
                level: 'ok',
                text: 'Connection review closed. No relationship was changed.',
              });
            }}
          />
        )}
        {snapshot && variableFlowPlan && (
          <VariableFlowRepairModal
            key={pendingVariableFlowRepair?.authorityKey}
            variableId={variableFlowPlan.variable.id}
            variableName={variableFlowPlan.variable.name}
            variableType={variableFlowPlan.variable.type}
            currentOwnerLabel={variableFlowCurrentOwnerLabel}
            webElementOptions={variableFlowWebElementOptions}
            getOptions={variableFlowGetOptions}
            pending={
              !connected
              || pendingRequest !== null
              || pendingMutationRequestId !== null
            }
            reviewWarnings={(choice) => {
              const reviewed = reviewVariableFlowRepair(
                variableFlowPlan,
                choice,
              );
              if (!reviewed.ok) return [reviewed.message];
              const warnings: string[] = [];
              if (reviewed.review.reassignedVariableId !== null) {
                warnings.push(
                  `GET #${reviewed.review.get.instructionId} currently writes variable #${reviewed.review.reassignedVariableId}; it will be reassigned.`,
                );
              }
              if (reviewed.review.duplicateOwnerVariableIds.length > 0) {
                warnings.push(
                  `Web Element #${reviewed.review.webElement.instructionId} already owns variable(s) ${reviewed.review.duplicateOwnerVariableIds.map(id => `#${id}`).join(', ')}.`,
                );
              }
              if (
                reviewed.review.executionOrderIssueInstructionIds.length > 0
              ) {
                warnings.push(
                  `${reviewed.review.executionOrderIssueInstructionIds.length} reader(s) run before this GET and will still require execution-order repair.`,
                );
              }
              return warnings;
            }}
            onConfirm={submitVariableFlowRepair}
            onCancel={() => {
              if (pendingMutationRequestId !== null) return;
              setPendingVariableFlowRepair(null);
              setStatus({
                level: 'warn',
                text: 'Variable flow repair cancelled. No relationship was changed.',
              });
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
        {snapshot && addVariableOpen && (
          <AddVariableModal
            existingNames={snapshot.variables.map(variable => variable.name)}
            pending={pendingCreateRequestId !== null}
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
            header={pendingBlockTransfer.action === 'COPY'
              ? 'Choose Copy Scope'
              : 'Choose Move Scope'}
            body={`Instruction #${pendingBlockTransfer.sourceInstructionId} has `
              + `${blockTransferSelection?.ok
                ? Math.max(
                    0,
                    blockTransferSelection.selection.sourceInstructionIds.length - 1,
                  )
                : 0} explicit parent/dependency instruction(s) available. `
              + 'Choose only this instruction or include all of those parents.'}
            extraMsg={pendingBlockTransfer.action === 'COPY'
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
            alternateAction={{
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
      </main>
    </DetachedPageShell>
  );
};

export default VariablesPage;
