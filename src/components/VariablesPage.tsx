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
import DetachedPageShell from './DetachedPageShell';
import PagesOpenButton from './PagesOpenButton';
import ReconnectRelationshipDialog from './bot-job-details/grid/ReconnectRelationshipDialog';
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
import RuntimeMemoryPanel from './variables/RuntimeMemoryPanel';
import VariablesCommandBoard, {
  type VariablesCommandDropTarget,
} from './variables/VariablesCommandBoard';
import { useVariablesGraphMutation } from './variables/useVariablesGraphMutation';
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
  const [findText, setFindText] = useState('');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('ALL');
  const [blockFilter, setBlockFilter] = useState<'ALL' | number>('ALL');
  const [selectedInstructionId, setSelectedInstructionId] =
    useState<number | null>(null);
  const [draggingInstructionId, setDraggingInstructionId] =
    useState<number | null>(null);
  const [activeDropTarget, setActiveDropTarget] =
    useState<VariablesCommandDropTarget | null>(null);
  const [pendingReconnect, setPendingReconnect] =
    useState<PendingReconnect | null>(null);
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
    updateValue: updateRuntimeValue,
    handleMessage: handleRuntimeMemoryMessage,
  } = useVariablesRuntimeMemory({
    webSocket,
    connected,
    sessionId,
    snapshot,
    onMemory: replaceRuntimeMemory,
    onStatus: setStatus,
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
      if (
        current
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
    handleRuntimeMemoryMessage,
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
    const query = findText.trim().toLocaleLowerCase();
    return (snapshot?.variables ?? []).filter(variable => {
      const healthMatches = healthFilter === 'ALL'
        || (healthFilter === 'ISSUES'
          ? variable.health === 'WARNING' || variable.health === 'ERROR'
          : healthFilter === 'UNUSED'
            ? variable.unused
            : variable.health === healthFilter);
      // A variable belongs to a block through its owning Web Field OR any linked command.
      const blockMatches = blockFilter === 'ALL'
        || variable.owner?.blockId === blockFilter
        || variable.commands.some(command => command.blockId === blockFilter);
      return healthMatches
        && blockMatches
        && (!query || variableSearchText(variable).includes(query));
    });
  }, [blockFilter, findText, healthFilter, snapshot?.variables]);

  useEffect(() => {
    if (
      blockFilter !== 'ALL'
      && snapshot
      && !snapshot.blocks.some(candidate => candidate.id === blockFilter)
    ) {
      setBlockFilter('ALL');
    }
  }, [blockFilter, snapshot]);

  const blockSearchOptions = useMemo<SearchBoxOption[]>(() => {
    const counts = new Map<number, number>();
    (snapshot?.variables ?? []).forEach((variable) => {
      const blockIds = new Set<number>();
      if (variable.owner?.blockId != null) blockIds.add(variable.owner.blockId);
      variable.commands.forEach((command) => {
        if (command.blockId != null) blockIds.add(command.blockId);
      });
      blockIds.forEach(blockId => counts.set(blockId, (counts.get(blockId) ?? 0) + 1));
    });
    return (snapshot?.blocks ?? []).map(candidate => ({
      value: String(candidate.id),
      label: `#${candidate.order ?? candidate.id} ${candidate.name}`,
      sublabel: `${counts.get(candidate.id) ?? 0} variable link(s) · block ID ${candidate.id}`,
      badges: [candidate.active === false
        ? { text: 'INACTIVE', tone: 'red' as const }
        : { text: 'ACTIVE', tone: 'green' as const }],
      keywords: String(candidate.id),
    }));
  }, [snapshot?.blocks, snapshot?.variables]);

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
  const mutationAuthorityKey = mutationAuthorityKeyFor(snapshot);
  const relationshipGraph = useMemo(
    () => snapshot ? variablesReconnectGraph(snapshot) : null,
    [snapshot],
  );

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

  const submitVariablesMutation = useCallback((
    draft: Parameters<typeof submitGraphMutation>[0],
    mutationProfile: Parameters<typeof submitGraphMutation>[2],
    sourceInstructionId: number,
    pendingText: string,
    committedText: string,
  ) => {
    setStatus({ level: 'warn', text: pendingText });
    const requestId = submitGraphMutation(draft, {
      committed: response => {
        setPendingReconnect(null);
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
      setDraggingInstructionId(null);
      setActiveDropTarget(null);
      setStatus({
        level: 'error',
        text: `Variables is busy or disconnected. Instruction #${sourceInstructionId} was not changed.`,
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
    || pendingReconnect !== null
    || snapshot?.mutationCapability?.reactAuthoredProfile == null;
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
              <label className={styles.searchControl}>
                <Search size={15} aria-hidden="true" />
                <span className={styles.srOnly}>Find variables or commands</span>
                <input
                  type="search"
                  value={findText}
                  placeholder="Find variable, block, command..."
                  onChange={event => setFindText(event.target.value)}
                />
              </label>
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

          <section className={styles.filterBar} data-floating-drag-ignore="true">
            <div className={styles.filterButtons} role="group" aria-label="Variable health filter">
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
            <SearchBox
              label="Block"
              placeholder="Search block name or number..."
              headerRight="Variables per block"
              countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
              allOptionLabel="All blocks"
              options={blockSearchOptions}
              value={blockFilter === 'ALL' ? null : String(blockFilter)}
              onChange={value => setBlockFilter(value === null ? 'ALL' : Number(value))}
            />
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
                blocks={snapshot.blocks}
                instructions={snapshot.commands}
                relationshipEdges={relationshipGraph?.edges ?? []}
                disabled={mutationDisabled}
                unavailableReason={pendingMutationRequestId
                  ? 'Saving...'
                  : pendingReconnect
                    ? 'Review relationship'
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
              />

              <section className={styles.flowPanel} aria-label="Selected variable relationship flow">
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
                                danger={(selectedValuePresentation?.activeConsumers.length ?? 0) > 0}
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
              </section>

              <RuntimeMemoryPanel
                items={snapshot.runtimeMemory.variables.map(entry => ({
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
              />
            </section>
          )}
        </section>
        {snapshot && pendingReconnect && (
          <ReconnectRelationshipDialog
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
      </main>
    </DetachedPageShell>
  );
};

export default VariablesPage;
