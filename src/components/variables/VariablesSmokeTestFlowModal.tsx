import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import { Workflow, X } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import type {
  VariablesExecutionFlowBlock,
  VariablesExecutionFlowStep,
} from './domain/variablesExecutionFlowReview';
import { variablesSmokeTestBlockKey } from './domain/variablesSmokeTestSimulation';
import type { VariablesSmokeTestPosition } from './domain/variablesSmokeTestTypes';
import HelpFlowNode, {
  type HelpFlowNodeModel,
  type HelpFlowNodeTone,
} from './connection-help/HelpFlowNode';
import graphStyles from './connection-help/VariablesConnectionGraphHelpModal.module.scss';
import styles from './VariablesSmokeTestFlowModal.module.scss';

export interface VariablesSmokeTestFlowModalProps {
  botJobId: number;
  botJobName: string;
  blocks: readonly VariablesExecutionFlowBlock[];
  scopeLabel: string;
  dynamic?: boolean;
  executionTrace?: readonly VariablesSmokeTestPosition[];
  activePosition?: VariablesSmokeTestPosition | null;
  detachedWindow?: Window | null;
  onClose: () => void;
}

const nodeTypes: NodeTypes = {
  helpFlow: HelpFlowNode,
};

const edgeDefaults = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { stroke: '#6f91ad', strokeWidth: 2 },
};

const stepTone = (step: VariablesExecutionFlowStep): HelpFlowNodeTone => {
  const action = step.action.trim().toLocaleUpperCase();
  if (['IF', 'ELSEIF', 'ELSE', 'ENDIF', 'CK', 'CHECKVALUE'].includes(action)) {
    return 'decision';
  }
  if (['GET', 'SET', 'EXCEL GOTO'].includes(action)) return 'data';
  if (['GOTO', 'LOOP', 'REFRESH LOOP', 'REFRESH_LOOP'].includes(action)) {
    return 'command';
  }
  return 'action';
};

const stepDetail = (step: VariablesExecutionFlowStep): string => {
  if (!step.active) return `${step.action} · inactive; Smoke Test bypasses this command.`;
  const operation = step.operation.trim();
  const connectionCount = step.connections.length;
  return [
    step.action,
    operation ? `Operation ${operation}` : null,
    `${connectionCount} connection${connectionCount === 1 ? '' : 's'}`,
  ].filter(Boolean).join(' · ');
};

export const buildVariablesSmokeTestBlockFlow = (
  block: VariablesExecutionFlowBlock,
  includeComplete = true,
  callCounts: ReadonlyMap<string, number> = new Map(),
  executionStepKeys: readonly string[] = [],
): { nodes: HelpFlowNodeModel[]; edges: Edge[] } => {
  const prefix = `block:${block.blockId ?? 'unassigned'}`;
  const sequenceIds = [
    `${prefix}:start`,
    ...block.steps.map(step => `${prefix}:${step.key}`),
    ...(includeComplete ? [`${prefix}:complete`] : []),
  ];
  const dynamic = !includeComplete || executionStepKeys.length > 0;
  const columns = dynamic
    ? Math.min(6, Math.max(1, sequenceIds.length))
    : Math.min(4, Math.max(1, Math.ceil(Math.sqrt(sequenceIds.length))));
  const positionFor = (index: number) => {
    const row = Math.floor(index / columns);
    const positionInRow = index % columns;
    const column = row % 2 === 0
      ? positionInRow
      : columns - positionInRow - 1;
    return {
      x: 28 + column * (dynamic ? 150 : 225),
      y: 68 + row * (dynamic ? 118 : 145),
    };
  };
  const nodes: HelpFlowNodeModel[] = [
    {
      id: sequenceIds[0],
      type: 'helpFlow',
      position: positionFor(0),
      data: {
        eyebrow: 'Execution',
        title: `Start Block #${block.blockOrder ?? block.blockId ?? '?'}`,
        detail: block.active
          ? 'Begin this Block in Smoke Test order.'
          : 'Block is inactive; its commands are bypassed.',
        tone: 'start',
        compact: dynamic,
      },
    },
    ...block.steps.map((step, index): HelpFlowNodeModel => ({
      id: sequenceIds[index + 1],
      type: 'helpFlow',
      position: positionFor(index + 1),
      data: {
        eyebrow: `Command #${step.instructionOrder ?? '?'}`,
        title: step.instructionName || step.action || 'Unnamed command',
        detail: stepDetail(step),
        tone: stepTone(step),
        compact: dynamic,
        callCount: callCounts.get(step.key) ?? 1,
      },
    })),
    ...(includeComplete ? [{
      id: sequenceIds[sequenceIds.length - 1],
      type: 'helpFlow',
      position: positionFor(sequenceIds.length - 1),
      data: {
        eyebrow: 'Complete',
        title: `Finish ${block.blockName}`,
        detail: 'Continue to the next selected Block, if any.',
        tone: 'end',
        compact: dynamic,
      },
    } as HelpFlowNodeModel] : []),
  ];
  const edgeSequenceIds = dynamic && executionStepKeys.length > 0
    ? [
        sequenceIds[0],
        ...executionStepKeys.map(stepKey => `${prefix}:${stepKey}`),
        ...(includeComplete ? [sequenceIds[sequenceIds.length - 1]] : []),
      ]
    : sequenceIds;
  const positionById = new Map(nodes.map(node => [node.id, node.position] as const));
  const edges: Edge[] = edgeSequenceIds.slice(0, -1).map((source, index) => {
    const target = edgeSequenceIds[index + 1];
    const sourcePosition = positionById.get(source) ?? positionFor(0);
    const targetPosition = positionById.get(target) ?? positionFor(0);
    const movesDown = targetPosition.y > sourcePosition.y;
    const movesRight = targetPosition.x > sourcePosition.x;
    return {
      id: `${source}->${target}:${index}`,
      source,
      target,
      sourceHandle: movesDown ? 'sourceBottom' : movesRight ? 'sourceRight' : 'sourceLeft',
      targetHandle: movesDown ? 'targetTop' : movesRight ? 'targetLeft' : 'targetRight',
      animated: block.active && block.steps[index]?.active !== false,
      ...edgeDefaults,
      style: dynamic
        ? { ...edgeDefaults.style, strokeDasharray: '8 7' }
        : edgeDefaults.style,
    };
  });
  return { nodes, edges };
};

const BlockFlowGraph: React.FC<{
  block: VariablesExecutionFlowBlock;
  dynamic: boolean;
  completed: boolean;
  executionTrace: readonly VariablesSmokeTestPosition[];
  activePosition: VariablesSmokeTestPosition | null;
}> = ({ block, dynamic, completed, executionTrace, activePosition }) => {
  const blockKey = variablesSmokeTestBlockKey(block);
  const dynamicStepKeys = useMemo(() => executionTrace.flatMap(position =>
    position.blockKey === blockKey && position.stepKey !== null
      ? [position.stepKey]
      : []), [blockKey, executionTrace]);
  const callCounts = useMemo(() => {
    const counts = new Map<string, number>();
    dynamicStepKeys.forEach(stepKey => counts.set(stepKey, (counts.get(stepKey) ?? 0) + 1));
    return counts;
  }, [dynamicStepKeys]);
  const presentedBlock = useMemo<VariablesExecutionFlowBlock>(() => {
    if (!dynamic) return block;
    const stepsByKey = new Map(block.steps.map(step => [step.key, step] as const));
    const seen = new Set<string>();
    return {
      ...block,
      steps: dynamicStepKeys.flatMap(stepKey => {
        if (seen.has(stepKey)) return [];
        seen.add(stepKey);
        const step = stepsByKey.get(stepKey);
        return step ? [step] : [];
      }),
    };
  }, [block, dynamic, dynamicStepKeys]);
  const graph = useMemo(
    () => buildVariablesSmokeTestBlockFlow(
      presentedBlock,
      !dynamic || completed,
      callCounts,
      dynamicStepKeys,
    ),
    [callCounts, completed, dynamic, dynamicStepKeys, presentedBlock],
  );
  return (
    <section
      className={styles.blockGraph}
      aria-label={`Flow for Block ${block.blockName}`}
      data-smoke-active={activePosition?.blockKey === blockKey ? 'true' : 'false'}
    >
      <div className={graphStyles.xyGraphShell}>
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.16, maxZoom: 1.05 }}
          minZoom={0.3}
          maxZoom={1.35}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#b8cada" />
          <Controls showInteractive={false} position="bottom-right" />
          <Panel position="top-left" className={graphStyles.xyGraphTitle}>
            <span>Smoke Test Block flow</span>
            <strong>#{block.blockOrder ?? block.blockId ?? '?'} {block.blockName}</strong>
          </Panel>
          <Panel position="top-right" className={graphStyles.xyGraphRule}>
            {dynamic
              ? `${dynamicStepKeys.length} call${dynamicStepKeys.length === 1 ? '' : 's'} · ${presentedBlock.steps.length} step${presentedBlock.steps.length === 1 ? '' : 's'}`
              : `${block.steps.length} command${block.steps.length === 1 ? '' : 's'}`}
            {!block.active ? ' · BLOCK INACTIVE' : ''}
          </Panel>
        </ReactFlow>
      </div>
    </section>
  );
};

const VariablesSmokeTestFlowModal: React.FC<VariablesSmokeTestFlowModalProps> = ({
  botJobId,
  botJobName,
  blocks,
  scopeLabel,
  dynamic = false,
  executionTrace = [],
  activePosition = null,
  detachedWindow = null,
  onClose,
}) => {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [detachedTarget, setDetachedTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!dynamic) closeButtonRef.current?.focus();
  }, [dynamic]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!dynamic || detachedWindow === null || detachedWindow.closed) {
      setDetachedTarget(null);
      return undefined;
    }
    const popupDocument = detachedWindow.document;
    popupDocument.open();
    popupDocument.write('<!doctype html><html><head><meta charset="utf-8"><base href="'
      + document.baseURI + '"></head><body></body></html>');
    popupDocument.close();
    document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
      'link[rel="stylesheet"], style',
    ).forEach(node => popupDocument.head.appendChild(node.cloneNode(true)));
    popupDocument.title = 'Dynamic Flow';
    popupDocument.documentElement.style.height = '100%';
    popupDocument.body.style.height = '100%';
    popupDocument.body.style.margin = '0';
    const target = popupDocument.createElement('div');
    target.style.height = '100%';
    popupDocument.body.appendChild(target);
    setDetachedTarget(target);
    const handleDetachedClose = () => onCloseRef.current();
    detachedWindow.addEventListener('beforeunload', handleDetachedClose);
    detachedWindow.focus();
    return () => {
      detachedWindow.removeEventListener('beforeunload', handleDetachedClose);
      setDetachedTarget(null);
    };
  }, [detachedWindow, dynamic]);
  const tracedBlockKeys = useMemo(
    () => new Set(executionTrace.map(position => position.blockKey)),
    [executionTrace],
  );
  const revealedStepKeys = useMemo(
    () => new Set(executionTrace.flatMap(position =>
      position.stepKey === null ? [] : [position.stepKey])),
    [executionTrace],
  );
  const executedCallCount = executionTrace.filter(position => position.stepKey !== null).length;
  const displayedBlocks = dynamic
    ? executionTrace.length === 0
      ? blocks.slice(0, 1)
      : blocks.filter(block => tracedBlockKeys.has(variablesSmokeTestBlockKey(block)))
    : blocks;
  const lastTracedBlockKey = executionTrace.length === 0
    ? null
    : executionTrace[executionTrace.length - 1].blockKey;

  const flowContent = (
      <section
        role={dynamic ? 'region' : 'dialog'}
        aria-modal={dynamic ? undefined : true}
        aria-labelledby={titleId}
        className={`${graphStyles.dialog} ${styles.dialog} ${dynamic ? styles.detachedDialog : ''}`}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      >
        <header className={graphStyles.header}>
          <div className={graphStyles.titleLine}>
            <Workflow size={22} aria-hidden="true" />
            <div>
              <span>Selected Smoke Test scope</span>
              <h2 id={titleId}>Execution FLOW · {scopeLabel}</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={graphStyles.closeButton}
            aria-label="Close Smoke Test execution flow"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={`${graphStyles.body} ${styles.body}`}>
          <div className={styles.scopeSummary}>
            <span>Bot Job</span>
            <strong>#{botJobId} {botJobName}</strong>
            <b>{dynamic
              ? `DYNAMIC · ${executionTrace.length === 0 ? 'START' : `${executedCallCount} call${executedCallCount === 1 ? '' : 's'} · ${revealedStepKeys.size} step${revealedStepKeys.size === 1 ? '' : 's'}`}`
              : `${blocks.length} Block${blocks.length === 1 ? '' : 's'} · separated graphs`}</b>
          </div>
          <div className={styles.graphList}>
            {displayedBlocks.map((block, index) => {
              const blockKey = variablesSmokeTestBlockKey(block);
              return (
                <React.Fragment key={`flow:${block.blockId ?? block.blockName}`}>
                  <BlockFlowGraph
                    block={block}
                    dynamic={dynamic}
                    completed={dynamic && lastTracedBlockKey !== null && blockKey !== lastTracedBlockKey}
                    executionTrace={executionTrace}
                    activePosition={activePosition}
                  />
                  {dynamic && index < displayedBlocks.length - 1 && (
                    <div className={styles.blockTransition} aria-label="Continue to next Block">
                      <span>FINISH BLOCK</span>
                      <b>- - - - - - &gt;</b>
                      <span>START NEXT BLOCK</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>
  );
  if (dynamic) {
    return detachedTarget === null
      ? null
      : createPortal(
          <div className={`${graphStyles.backdrop} ${styles.detachedSurface}`}>
            {flowContent}
          </div>,
          detachedTarget,
        );
  }
  return createPortal(
    <div
      className={graphStyles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {flowContent}
    </div>,
    document.body,
  );
};

export default VariablesSmokeTestFlowModal;
