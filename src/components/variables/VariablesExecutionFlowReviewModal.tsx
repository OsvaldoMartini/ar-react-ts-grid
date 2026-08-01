import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import SearchBox, { type SearchBoxOption } from '../SearchBox';
import styles from './VariablesExecutionFlowReviewModal.module.scss';

export interface VariablesExecutionFlowReviewModalProps {
  review: VariablesExecutionFlowReview;
  scopeLabel: string;
  blockFilter?: number | null;
  onBlockFilterChange?: (blockId: number | null) => void;
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
  blockFilter: controlledBlockFilter,
  onBlockFilterChange,
  returnFocusElement = null,
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [localBlockFilter, setLocalBlockFilter] = useState<number | null>(null);
  const blockFilter = controlledBlockFilter === undefined
    ? localBlockFilter
    : controlledBlockFilter;
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
  const blockSearchOptions = useMemo<SearchBoxOption[]>(() => review.blocks
    .filter(block => block.blockId !== null)
    .map(block => ({
      value: String(block.blockId),
      label: `#${block.blockOrder ?? block.blockId} ${block.blockName}`,
      sublabel: `${block.steps.length} command(s) · block ID ${block.blockId}`,
      badges: [block.active
        ? { text: 'ACTIVE', tone: 'green' as const }
        : { text: 'INACTIVE', tone: 'red' as const }],
      keywords: String(block.blockId),
    })), [review.blocks]);
  const visibleBlocks = useMemo(() => blockFilter === null
    ? review.blocks
    : review.blocks.filter(block => block.blockId === blockFilter), [blockFilter, review.blocks]);
  const visibleSteps = useMemo(
    () => visibleBlocks.flatMap(block => block.steps),
    [visibleBlocks],
  );
  const visibleStepIds = useMemo(() => new Set(
    visibleSteps.flatMap(step => step.instructionId === null
      ? []
      : [step.instructionId]),
  ), [visibleSteps]);
  const visibleVariableFlows = useMemo(() => blockFilter === null
    ? review.variableFlows
    : review.variableFlows.filter(flow =>
        (flow.ownerInstructionId !== null
          && visibleStepIds.has(flow.ownerInstructionId))
        || flow.producerInstructionIds.some(id => visibleStepIds.has(id))
        || flow.readerInstructionIds.some(id => visibleStepIds.has(id))), [
    blockFilter,
    review.variableFlows,
    visibleStepIds,
  ]);
  const visibleVariableIds = useMemo(
    () => new Set(visibleVariableFlows.map(flow => flow.variableId)),
    [visibleVariableFlows],
  );
  const visibleUnassignedConnections = useMemo(() => blockFilter === null
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
    blockFilter,
    review.unassignedConnections,
    visibleStepIds,
    visibleVariableIds,
  ]);
  const visibleConnectionCount = useMemo(() => {
    if (blockFilter === null) return review.connectionCount;
    const connectionIds = new Set(
      visibleSteps.flatMap(step => step.connections.map(connection => connection.id)),
    );
    visibleUnassignedConnections.forEach(connection =>
      connectionIds.add(connection.id));
    return connectionIds.size;
  }, [
    blockFilter,
    review.connectionCount,
    visibleSteps,
    visibleUnassignedConnections,
  ]);
  const selectedBlock = blockFilter === null
    ? null
    : review.blocks.find(block => block.blockId === blockFilter) ?? null;
  const visibleScopeLabel = blockFilter === null
    ? `All Blocks Â· ${visibleSteps.length} visible command${visibleSteps.length === 1 ? '' : 's'}`
    : selectedBlock
      ? `Block #${selectedBlock.blockOrder ?? selectedBlock.blockId} ${selectedBlock.blockName} Â· ${visibleSteps.length} visible command${visibleSteps.length === 1 ? '' : 's'}`
      : scopeLabel;
  const visibleDiagnostics = useMemo(() => blockFilter === null
    ? review.diagnostics
    : review.diagnostics.filter(diagnostic =>
        diagnostic.blockIds.length === 0
        || diagnostic.blockIds.includes(blockFilter)), [blockFilter, review.diagnostics]);
  const blocksById = useMemo(() => new Map(review.blocks.flatMap(block =>
    block.blockId === null ? [] : [[block.blockId, block] as const])), [review.blocks]);
  const diagnosticBlockLabel = (diagnostic: VariablesExecutionFlowDiagnostic) => {
    const visibleBlockIds = blockFilter !== null
      && diagnostic.blockIds.includes(blockFilter)
      ? [blockFilter]
      : diagnostic.blockIds;
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

          <section className={styles.summary} aria-label="Execution flow summary">
            <div><span>Blocks</span><strong>{visibleBlocks.length}</strong></div>
            <div><span>Commands</span><strong>{visibleSteps.length}</strong></div>
            <div><span>Connections</span><strong>{visibleConnectionCount}</strong></div>
            <div>
              <span>Diagnostics</span>
              <strong>{visibleDiagnostics.length}</strong>
            </div>
          </section>

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

          <SearchBox
            label="Block"
            placeholder="Search block name or number..."
            headerRight="Commands per block"
            countLabel={count => `${count} BLOCK${count === 1 ? '' : 'S'}`}
            allOptionLabel="All blocks"
            options={blockSearchOptions}
            value={blockFilter === null ? null : String(blockFilter)}
            onChange={(value) => {
              const nextBlockFilter = value === null ? null : Number(value);
              setLocalBlockFilter(nextBlockFilter);
              onBlockFilterChange?.(nextBlockFilter);
            }}
          />

          {visibleVariableFlows.length > 0 && (
            <section className={styles.variableSection} aria-label="Variable flows">
              <header className={styles.sectionHeading}>
                <Variable size={17} aria-hidden="true" />
                <div>
                  <h3>Variable flows</h3>
                  <p>Declaration Web Field → producer → variable → readers.</p>
                </div>
              </header>
              <div className={styles.variableList}>
                {visibleVariableFlows.map((flow) => {
                  const owner = flow.ownerInstructionId === null
                    ? null
                    : stepsById.get(flow.ownerInstructionId) ?? null;
                  return (
                    <article className={styles.variableFlow} key={flow.variableId}>
                      <div className={styles.flowNode}>
                        <span>Declaration Web Field</span>
                        <strong>{owner
                          ? `#${owner.instructionOrder} ${owner.instructionName}`
                          : 'Owner missing'}</strong>
                      </div>
                      <ArrowRight size={16} aria-hidden="true" />
                      <div className={styles.flowNode}>
                        <span>GET / SET producer</span>
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
              {visibleBlocks.map(block => (
                <section
                  className={`${styles.block} ${!block.active ? styles.inactive : ''}`}
                  key={`${block.blockOrder ?? 'NONE'}:${block.blockId ?? 'NONE'}:${block.blockName}`}
                >
                  <header className={styles.blockHeader}>
                    <strong>Block #{block.blockOrder ?? '?'} {block.blockName}</strong>
                    <span>{block.steps.length} command{block.steps.length === 1 ? '' : 's'}</span>
                  </header>
                  <div className={styles.stepList}>
                    {block.steps.map((step, index) => (
                      <article
                        className={`${styles.step} ${!step.active ? styles.inactive : ''}`}
                        key={step.key}
                      >
                        <div className={styles.stepSequence}>
                          <span>{index === 0 ? 'START' : 'NEXT'}</span>
                          <b>{step.instructionOrder ?? '?'}</b>
                        </div>
                        <div className={styles.stepIdentity}>
                          <strong>{step.instructionName}</strong>
                          <small>{step.action} · Instruction ID {step.instructionId ?? 'Missing'}</small>
                          {step.operation && (
                            <code className={styles.operation} title={step.operation}>
                              {step.operation}
                            </code>
                          )}
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
              ))}
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
    </div>
  );
};

export default VariablesExecutionFlowReviewModal;
