import React, {
  Suspense,
  lazy,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Link2,
  Variable,
  Workflow,
  X,
} from 'lucide-react';
import type {
  VariablesExecutionFlowConnection,
  VariablesExecutionFlowDiagnostic,
  VariablesExecutionFlowReview,
} from './domain/variablesExecutionFlowReview';
import { variablesSmokeTestBlockKey } from './domain/variablesSmokeTestSimulation';
import type { VariablesSmokeTestPosition } from './domain/variablesSmokeTestTypes';
import BlockMultiSelectSearchBox, {
  type BlockMultiSelectOption,
} from '../BlockMultiSelectSearchBox';
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import VariablesSmokeTestPanel from './VariablesSmokeTestPanel';
import InstructionIntrinsicValues, {
  instructionIntrinsicValuePresentation,
} from './InstructionIntrinsicValues';
import styles from './VariablesExecutionFlowReviewModal.module.scss';
import { hidesLegacyVariableOperation } from './domain/legacyVariableOperation';

const VariablesSmokeTestFlowModal = lazy(
  () => import('./VariablesSmokeTestFlowModal'),
);

export interface VariablesExecutionFlowReviewModalProps {
  review: VariablesExecutionFlowReview;
  scopeLabel: string;
  blockFilters?: readonly number[];
  onBlockFiltersChange?: (blockIds: number[]) => void;
  runtimeWriteAvailable?: boolean;
  onCommitRuntimeValue?: (variableId: number, value: string) => boolean;
  returnFocusElement?: HTMLElement | null;
  onClose: () => void;
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const stateClass = (
  connection: VariablesExecutionFlowConnection,
): string => connection.state === 'CONNECTED'
  ? styles.connected
  : connection.state === 'MEMORY_ONLY'
    ? styles.memoryOnly
    : styles.issue;

const relationshipLabel = (
  connection: VariablesExecutionFlowConnection,
): string => connection.kind.replaceAll('_', ' ');

const VariablesExecutionFlowReviewModal: React.FC<
  VariablesExecutionFlowReviewModalProps
> = ({
  review,
  scopeLabel,
  blockFilters: controlledBlockFilters,
  onBlockFiltersChange,
  runtimeWriteAvailable = false,
  onCommitRuntimeValue,
  returnFocusElement = null,
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const smokeStepRefs = useRef(new Map<string, HTMLElement>());
  const smokeBlockRefs = useRef(new Map<string, HTMLElement>());
  const [activeSmokePosition, setActiveSmokePosition] = useState<VariablesSmokeTestPosition | null>(null);
  const [smokeExecutionTrace, setSmokeExecutionTrace] =
    useState<readonly VariablesSmokeTestPosition[]>([]);
  const [flowOpen, setFlowOpen] = useState(false);
  const [dynamicFlowEnabled, setDynamicFlowEnabled] = useState(false);
  const [dynamicFlowWindow, setDynamicFlowWindow] = useState<Window | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<number | null>(null);
  const [commandRemainingByInstructionId, setCommandRemainingByInstructionId] =
    useState<Readonly<Record<number, number>>>({});
  const [localSelectedBlockIds, setLocalSelectedBlockIds] = useState<number[]>(() =>
    review.blocks.flatMap(block => block.blockId === null ? [] : [block.blockId]));
  const selectedBlockIds = controlledBlockFilters === undefined
    ? localSelectedBlockIds
    : controlledBlockFilters;
  useEffect(() => () => {
    if (dynamicFlowWindow && !dynamicFlowWindow.closed) dynamicFlowWindow.close();
  }, [dynamicFlowWindow]);
  const returnFocusRef = useRef<HTMLElement | null>(
    returnFocusElement
    ?? (typeof document !== 'undefined'
      && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null),
  );
  const stepsById = useMemo(() => new Map(
    review.steps.flatMap(step => step.instructionId === null
      ? []
      : [[step.instructionId, step] as const]),
  ), [review.steps]);
  const blockSearchOptions = useMemo<readonly BlockMultiSelectOption[]>(() => review.blocks
    .filter(block => block.blockId !== null)
    .map(block => ({
      value: block.blockId as number,
      label: `#${block.blockOrder ?? block.blockId} ${block.blockName}`,
      sublabel: `${block.steps.length} command(s) · block ID ${block.blockId}`,
      active: block.active,
      keywords: String(block.blockId),
    })), [review.blocks]);
  const selectedBlockIdSet = useMemo(() => new Set(selectedBlockIds), [selectedBlockIds]);
  const allBlocksSelected = blockSearchOptions.length > 0
    && selectedBlockIds.length === blockSearchOptions.length;
  const visibleBlocks = useMemo(() => review.blocks.filter(block =>
    block.blockId !== null && selectedBlockIdSet.has(block.blockId)), [
    review.blocks,
    selectedBlockIdSet,
  ]);
  const visibleSteps = useMemo(
    () => visibleBlocks.flatMap(block => block.steps),
    [visibleBlocks],
  );
  const visibleStepIds = useMemo(() => new Set(
    visibleSteps.flatMap(step => step.instructionId === null
      ? []
      : [step.instructionId]),
  ), [visibleSteps]);
  const visibleVariableFlows = useMemo(() => allBlocksSelected
    ? review.variableFlows
    : review.variableFlows.filter(flow =>
        (flow.ownerInstructionId !== null
          && visibleStepIds.has(flow.ownerInstructionId))
        || flow.producerInstructionIds.some(id => visibleStepIds.has(id))
        || flow.readerInstructionIds.some(id => visibleStepIds.has(id))), [
    allBlocksSelected,
    review.variableFlows,
    visibleStepIds,
  ]);
  const visibleVariableIds = useMemo(
    () => new Set(visibleVariableFlows.map(flow => flow.variableId)),
    [visibleVariableFlows],
  );
  const variableSearchOptions = useMemo<SearchBoxOption[]>(() =>
    visibleVariableFlows.map(flow => {
      const relatedInstructionIds = [
        ...flow.endpointInstructionIds,
        ...flow.commandInstructionIds,
        ...flow.producerInstructionIds,
        ...flow.readerInstructionIds,
      ];
      const relatedSearchText = relatedInstructionIds.map(id => {
        const step = stepsById.get(id);
        return step
          ? `${id} ${step.instructionName} ${step.action} ${step.blockName}`
          : String(id);
      }).join(' ');
      return {
        value: String(flow.variableId),
        label: flow.variableName,
        sublabel: `${flow.variableType || 'Variable'} · ID ${flow.variableId}`,
        keywords: `${flow.variableId} ${flow.variableName} ${relatedSearchText}`,
      };
    }), [stepsById, visibleVariableFlows]);
  useEffect(() => {
    if (
      selectedVariableId === null
      || !visibleVariableIds.has(selectedVariableId)
    ) {
      setSelectedVariableId(visibleVariableFlows[0]?.variableId ?? null);
    }
  }, [selectedVariableId, visibleVariableFlows, visibleVariableIds]);
  const selectedVariableFlow = selectedVariableId === null
    ? null
    : visibleVariableFlows.find(flow => flow.variableId === selectedVariableId) ?? null;
  const visibleUnassignedConnections = useMemo(() => allBlocksSelected
    ? review.unassignedConnections
    : review.unassignedConnections.filter(connection => {
        const targetVisible = connection.target?.entity === 'INSTRUCTION'
          ? visibleStepIds.has(connection.target.id)
          : connection.target?.entity === 'VARIABLE'
            ? visibleVariableIds.has(connection.target.id)
            : false;
        const sourceVisible = connection.source.entity === 'INSTRUCTION'
          ? visibleStepIds.has(connection.source.id)
          : connection.source.entity === 'VARIABLE'
            ? visibleVariableIds.has(connection.source.id)
            : false;
        return sourceVisible || targetVisible;
      }), [
    allBlocksSelected,
    review.unassignedConnections,
    visibleStepIds,
    visibleVariableIds,
  ]);
  const visibleConnectionCount = useMemo(() => {
    if (allBlocksSelected) return review.connectionCount;
    const connectionIds = new Set(
      visibleSteps.flatMap(step => step.connections.map(connection => connection.id)),
    );
    visibleUnassignedConnections.forEach(connection =>
      connectionIds.add(connection.id));
    return connectionIds.size;
  }, [
    allBlocksSelected,
    review.connectionCount,
    visibleSteps,
    visibleUnassignedConnections,
  ]);
  const selectedBlock = selectedBlockIds.length === 1
    ? review.blocks.find(block => block.blockId === selectedBlockIds[0]) ?? null
    : null;
  const visibleScopeLabel = allBlocksSelected
    ? `All Blocks Â· ${visibleSteps.length} visible command${visibleSteps.length === 1 ? '' : 's'}`
    : selectedBlock
      ? `Block #${selectedBlock.blockOrder ?? selectedBlock.blockId} ${selectedBlock.blockName} Â· ${visibleSteps.length} visible command${visibleSteps.length === 1 ? '' : 's'}`
      : selectedBlockIds.length > 0
        ? `${selectedBlockIds.length} selected Blocks - ${visibleSteps.length} visible command${visibleSteps.length === 1 ? '' : 's'}`
        : scopeLabel;
  const visibleDiagnostics = useMemo(() => allBlocksSelected
    ? review.diagnostics
    : review.diagnostics.filter(diagnostic =>
        diagnostic.blockIds.length === 0
        || diagnostic.blockIds.some(blockId => selectedBlockIdSet.has(blockId))), [
    allBlocksSelected,
    review.diagnostics,
    selectedBlockIdSet,
  ]);
  const blocksById = useMemo(() => new Map(review.blocks.flatMap(block =>
    block.blockId === null ? [] : [[block.blockId, block] as const])), [review.blocks]);
  const diagnosticBlockLabel = (diagnostic: VariablesExecutionFlowDiagnostic) => {
    const visibleBlockIds = allBlocksSelected
      ? diagnostic.blockIds
      : diagnostic.blockIds.filter(blockId => selectedBlockIdSet.has(blockId));
    if (visibleBlockIds.length === 0) return 'Bot Job';
    return visibleBlockIds.map((blockId) => {
      const block = blocksById.get(blockId);
      return block
        ? `${block.blockOrder ?? blockId}# ${block.blockName}`
        : `${blockId}# Block`;
    }).join(', ');
  };

  useEffect(() => {
    const returnFocusTarget = returnFocusRef.current;
    closeRef.current?.focus();
    return () => {
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
    };
  }, []);

  useEffect(() => {
    if (activeSmokePosition === null) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = activeSmokePosition.stepKey === null
        ? smokeBlockRefs.current.get(activeSmokePosition.blockKey)
        : smokeStepRefs.current.get(activeSmokePosition.stepKey);
      target?.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSmokePosition]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const openDynamicFlowWindow = () => {
    const existing = dynamicFlowWindow;
    if (existing && !existing.closed) {
      existing.focus();
      setFlowOpen(true);
      return true;
    }
    const popup = window.open(
      '',
      `arweb-dynamic-flow-${review.botJobId}`,
      'popup=yes,width=1400,height=900,resizable=yes,scrollbars=yes',
    );
    if (!popup) return false;
    setDynamicFlowWindow(popup);
    setFlowOpen(true);
    return true;
  };
  const closeFlow = () => {
    if (dynamicFlowWindow && !dynamicFlowWindow.closed) dynamicFlowWindow.close();
    setDynamicFlowWindow(null);
    setFlowOpen(false);
    if (dynamicFlowEnabled) setDynamicFlowEnabled(false);
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={styles.dialog}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <div className={styles.titleLine}>
              <Workflow size={22} aria-hidden="true" />
              <h2 id={titleId}>Review All Connections</h2>
            </div>
            <p id={descriptionId}>
              Complete read-only Bot Job execution sequence and relationship graph.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeIcon}
            aria-label="Close connection review"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.reviewContent}>
          <section className={styles.context} aria-label="Review context">
            <div>
              <span>Bot Job</span>
              <strong>#{review.botJobId} {review.botJobName}</strong>
            </div>
            <div>
              <span>Review scope</span>
              <strong>{visibleScopeLabel}</strong>
            </div>
            <b>READ ONLY</b>
          </section>

          <div className={styles.summaryRow}>
            <section className={styles.summary} aria-label="Execution flow summary">
              <div><span>Blocks</span><strong>{visibleBlocks.length}</strong></div>
              <div><span>Commands</span><strong>{visibleSteps.length}</strong></div>
              <div><span>Connections</span><strong>{visibleConnectionCount}</strong></div>
              <div>
                <span>Diagnostics</span>
                <strong>{visibleDiagnostics.length}</strong>
              </div>
            </section>
            <div className={styles.flowActions}>
              <button
                type="button"
                className={styles.flowButton}
                aria-label={`Open execution flow for ${visibleScopeLabel}`}
                title={visibleBlocks.length === 0
                  ? 'Select at least one Block to open its flow graph'
                  : `Open separated flow graph${visibleBlocks.length === 1 ? '' : 's'} for ${visibleScopeLabel}`}
                disabled={visibleBlocks.length === 0}
                onClick={() => {
                  if (dynamicFlowEnabled) openDynamicFlowWindow();
                  else setFlowOpen(true);
                }}
              >
                FLOW
              </button>
              <button
                type="button"
                className={`${styles.dynamicFlowToggle} ${dynamicFlowEnabled ? styles.dynamicFlowOn : styles.dynamicFlowOff}`}
                aria-pressed={dynamicFlowEnabled}
                title="Show only the execution path reached by the running Smoke Test"
                onClick={() => {
                  if (dynamicFlowEnabled) {
                    closeFlow();
                    return;
                  }
                  if (openDynamicFlowWindow()) setDynamicFlowEnabled(true);
                }}
              >
                {dynamicFlowEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {!review.relationshipsAvailable && (
            <div className={styles.relationshipsUnavailable} role="status">
              <AlertTriangle size={17} aria-hidden="true" />
              <div>
                <strong>Relationship graph unavailable</strong>
                <span>
                  Blocks, commands, runtime values, and diagnostics remain available
                  for read-only review. Refresh when graph authority reconnects.
                </span>
              </div>
            </div>
          )}

          <BlockMultiSelectSearchBox
            label="Block"
            placeholder="Search block name or number..."
            options={blockSearchOptions}
            selectedValues={selectedBlockIds}
            onChange={(values) => {
              setLocalSelectedBlockIds(values);
              onBlockFiltersChange?.(values);
            }}
            selectionMode="multiple"
          />

          {visibleVariableFlows.length > 0 && (
            <section className={styles.variableSection} aria-label="Variable flows">
              <header className={styles.sectionHeading}>
                <Variable size={17} aria-hidden="true" />
                <div>
                  <h3>Variable flows</h3>
                  <p>Web Element endpoints → GET producer → variable → readers.</p>
                </div>
              </header>
              <SearchBox
                label="Variable flow"
                placeholder="Search variable, command, or Web Element name / ID..."
                headerRight="Connected relationships"
                countLabel={count => `${count} VARIABLE${count === 1 ? '' : 'S'}`}
                options={variableSearchOptions}
                value={selectedVariableId === null ? null : String(selectedVariableId)}
                onChange={value => setSelectedVariableId(value === null ? null : Number(value))}
              />
              <div className={styles.variableList}>
                {selectedVariableFlow && [selectedVariableFlow].map((flow) => {
                  const endpoints = flow.endpointInstructionIds
                    .map(id => stepsById.get(id) ?? null)
                    .filter((step): step is NonNullable<typeof step> => step !== null);
                  return (
                    <article className={styles.variableFlow} key={flow.variableId}>
                      <div className={styles.flowNode}>
                        <span>Web Element endpoints</span>
                        <strong>{endpoints.length > 0
                          ? endpoints.map(endpoint =>
                              `#${endpoint.instructionOrder} ${endpoint.instructionName}`
                            ).join(', ')
                          : 'No Web Element endpoint'}</strong>
                      </div>
                      <ArrowRight size={16} aria-hidden="true" />
                      <div className={styles.flowNode}>
                        <span>GET producer</span>
                        <strong>{flow.producerInstructionIds.length > 0
                          ? flow.producerInstructionIds.map(id => {
                              const step = stepsById.get(id);
                              return step
                                ? `#${step.instructionOrder} ${step.instructionName}`
                                : `ID ${id}`;
                            }).join(', ')
                          : 'No active producer'}</strong>
                      </div>
                      <ArrowRight size={16} aria-hidden="true" />
                      <div className={`${styles.flowNode} ${styles.variableNode}`}>
                        <span>Variable</span>
                        <strong>#{flow.variableId} {flow.variableName}</strong>
                        <small>Type {flow.variableType || 'Unspecified'}</small>
                        <small>Configured VALUE: {flow.configuredValue === ''
                          ? 'EMPTY'
                          : flow.configuredValue}</small>
                        <small>
                          Runtime {flow.runtimeState}: {flow.runtimeState === 'VALUE'
                            ? flow.runtimeRawValue === ''
                              ? 'EMPTY'
                              : flow.runtimeRawValue
                            : flow.runtimeVoidReason || 'No value'}
                        </small>
                      </div>
                      <ArrowRight size={16} aria-hidden="true" />
                      <div className={styles.flowNode}>
                        <span>Readers / checks</span>
                        <strong>{flow.readerInstructionIds.length > 0
                          ? flow.readerInstructionIds.map(id => {
                              const step = stepsById.get(id);
                              return step
                                ? `#${step.instructionOrder} ${step.instructionName}`
                                : `ID ${id}`;
                            }).join(', ')
                          : 'No readers'}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className={styles.executionSection} aria-label="Execution sequence">
            <header className={styles.sectionHeading}>
              <Boxes size={17} aria-hidden="true" />
              <div>
                <h3>Bot Job execution flow</h3>
                <p>Block order first, then instruction order. Every command is shown.</p>
              </div>
            </header>
            <div className={styles.blockList}>
              {visibleBlocks.map(block => {
                const smokeBlockKey = variablesSmokeTestBlockKey(block);
                return (
                <section
                  ref={(element) => {
                    if (element === null) smokeBlockRefs.current.delete(smokeBlockKey);
                    else smokeBlockRefs.current.set(smokeBlockKey, element);
                  }}
                  className={`${styles.block} ${!block.active ? styles.inactive : ''} ${activeSmokePosition?.blockKey === smokeBlockKey ? styles.smokeActiveBlock : ''}`}
                  key={smokeBlockKey}
                  data-smoke-active={activeSmokePosition?.blockKey === smokeBlockKey ? 'true' : 'false'}
                >
                  <header className={styles.blockHeader}>
                    <strong>Block #{block.blockOrder ?? '?'} {block.blockName}</strong>
                    <span>{block.steps.length} command{block.steps.length === 1 ? '' : 's'}</span>
                  </header>
                  <div className={styles.stepList}>
                    {block.steps.map((step, index) => (
                      <article
                        ref={(element) => {
                          if (element === null) smokeStepRefs.current.delete(step.key);
                          else smokeStepRefs.current.set(step.key, element);
                        }}
                        className={`${styles.step} ${!step.active ? styles.inactive : ''} ${activeSmokePosition?.stepKey === step.key ? styles.smokeActiveStep : ''}`}
                        key={step.key}
                        data-smoke-active={activeSmokePosition?.stepKey === step.key ? 'true' : 'false'}
                      >
                        <div className={styles.stepSequence}>
                          <span>{index === 0 ? 'START' : 'NEXT'}</span>
                          <b>{step.instructionOrder ?? '?'}</b>
                        </div>
                        <div className={styles.stepIdentity}>
                          <div className={styles.stepIdentityHeading}>
                            <strong>{step.instructionName}</strong>
                            <InstructionIntrinsicValues
                              action={step.action}
                              operation={step.operation}
                              onHoldSeconds={step.onHoldSeconds}
                              remainingCount={step.instructionId === null
                                ? null
                                : commandRemainingByInstructionId[step.instructionId]}
                            />
                          </div>
                          <small>{step.action} · Instruction ID {step.instructionId ?? 'Missing'}</small>
                          {step.operation
                            && !hidesLegacyVariableOperation(step.action)
                            && instructionIntrinsicValuePresentation(step) === null && (
                            <code className={styles.operation} title={step.operation}>
                              {step.operation}
                            </code>
                          )}
                          {step.variables.map(variable => (
                            <code
                              className={styles.operation}
                              key={`${step.key}:${variable.slot}:${variable.variableId ?? 'NONE'}`}
                              title={`${variable.variableName}: ${variable.displayValue}`}
                            >
                              {variable.variableName}: {variable.displayValue}
                            </code>
                          ))}
                        </div>
                        <div className={styles.connections}>
                          {step.connections.map(connection => (
                            <div
                              className={`${styles.connection} ${stateClass(connection)}`}
                              key={connection.id}
                            >
                              <Link2 size={13} aria-hidden="true" />
                              <span>{relationshipLabel(connection)}</span>
                              <strong>{connection.targetLabel ?? 'Not connected'}</strong>
                              <em>{connection.state.replaceAll('_', ' ')}</em>
                              {connection.code && <code>{connection.code}</code>}
                            </div>
                          ))}
                          {step.connections.length === 0 && (
                            <span className={styles.noConnections}>
                              No relationship edges — command remains in the execution sequence.
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                    {block.steps.length === 0 && (
                      <span className={styles.noConnections}>
                        Empty Block — no commands are currently assigned.
                      </span>
                    )}
                  </div>
                </section>
                );
              })}
            </div>
          </section>

          {visibleDiagnostics.length > 0 && (
            <section className={styles.diagnostics} aria-label="Graph diagnostics">
              <header className={styles.sectionHeading}>
                <AlertTriangle size={17} aria-hidden="true" />
                <div>
                  <h3>Graph diagnostics</h3>
                  <p>Authoritative relationship and workspace diagnostics.</p>
                </div>
              </header>
              <div className={styles.diagnosticList}>
                {visibleDiagnostics.map(diagnostic => (
                  <article className={styles.diagnostic} key={diagnostic.id}>
                    <span>{diagnostic.severity}</span>
                    <strong>{diagnostic.code}</strong>
                    <b>
                      {diagnosticBlockLabel(diagnostic)} - {diagnostic.sourceLabel}
                    </b>
                    <p>{diagnostic.message}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {visibleUnassignedConnections.length > 0 && (
            <section className={styles.unassigned} aria-label="Unassigned graph connections">
              <header className={styles.sectionHeading}>
                <AlertTriangle size={17} aria-hidden="true" />
                <div>
                  <h3>Unassigned graph connections</h3>
                  <p>Variable-memory or unresolved edges without an execution-row owner.</p>
                </div>
              </header>
              {visibleUnassignedConnections.map(connection => (
                <div
                  className={`${styles.connection} ${stateClass(connection)}`}
                  key={connection.id}
                >
                  <Link2 size={13} aria-hidden="true" />
                  <span>{relationshipLabel(connection)}</span>
                  <strong>{connection.sourceLabel} → {connection.targetLabel ?? 'Not connected'}</strong>
                  <em>{connection.state.replaceAll('_', ' ')}</em>
                  {connection.code && <code>{connection.code}</code>}
                </div>
              ))}
            </section>
          )}

          {visibleSteps.length === 0 && (
            <div className={styles.empty} role="status">
              <AlertTriangle size={18} aria-hidden="true" />
              This Bot Job does not contain an authoritative execution sequence.
            </div>
          )}
          </div>

          <VariablesSmokeTestPanel
            review={review}
            selectedBlockIds={selectedBlockIds}
            runtimeWriteAvailable={runtimeWriteAvailable}
            onCommitRuntimeValue={onCommitRuntimeValue}
            onActivePositionChange={setActiveSmokePosition}
            onExecutionTraceChange={setSmokeExecutionTrace}
            onCommandRemainingChange={setCommandRemainingByInstructionId}
          />
        </div>

        <footer className={styles.actions}>
          <span>
            {visibleDiagnostics.length === 0
              ? <CheckCircle2 size={16} aria-hidden="true" />
              : <AlertTriangle size={16} aria-hidden="true" />}
            No database change is made by this review.
          </span>
          <button type="button" onClick={onClose}>Close</button>
        </footer>
      </section>
      {flowOpen && (
        <Suspense fallback={null}>
          <VariablesSmokeTestFlowModal
            botJobId={review.botJobId}
            botJobName={review.botJobName}
            blocks={visibleBlocks}
            scopeLabel={visibleScopeLabel}
            dynamic={dynamicFlowEnabled}
            executionTrace={smokeExecutionTrace}
            activePosition={activeSmokePosition}
            detachedWindow={dynamicFlowWindow}
            onClose={closeFlow}
          />
        </Suspense>
      )}
    </div>
  );
};

export default VariablesExecutionFlowReviewModal;
