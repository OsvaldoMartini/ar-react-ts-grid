import React, { useEffect, useId, useMemo, useRef } from 'react';
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
): { nodes: HelpFlowNodeModel[]; edges: Edge[] } => {
  const prefix = `block:${block.blockId ?? 'unassigned'}`;
  const sequenceIds = [
    `${prefix}:start`,
    ...block.steps.map(step => `${prefix}:${step.key}`),
    `${prefix}:complete`,
  ];
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(sequenceIds.length))));
  const positionFor = (index: number) => {
    const row = Math.floor(index / columns);
    const positionInRow = index % columns;
    const column = row % 2 === 0
      ? positionInRow
      : columns - positionInRow - 1;
    return { x: 28 + column * 225, y: 68 + row * 145 };
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
      },
    })),
    {
      id: sequenceIds[sequenceIds.length - 1],
      type: 'helpFlow',
      position: positionFor(sequenceIds.length - 1),
      data: {
        eyebrow: 'Complete',
        title: `Finish ${block.blockName}`,
        detail: 'Continue to the next selected Block, if any.',
        tone: 'end',
      },
    },
  ];
  const edges: Edge[] = sequenceIds.slice(0, -1).map((source, index) => {
    const target = sequenceIds[index + 1];
    const sourcePosition = positionFor(index);
    const targetPosition = positionFor(index + 1);
    const movesDown = targetPosition.y > sourcePosition.y;
    const movesRight = targetPosition.x > sourcePosition.x;
    return {
      id: `${source}->${target}`,
      source,
      target,
      sourceHandle: movesDown ? 'sourceBottom' : movesRight ? 'sourceRight' : 'sourceLeft',
      targetHandle: movesDown ? 'targetTop' : movesRight ? 'targetLeft' : 'targetRight',
      animated: block.active && block.steps[index]?.active !== false,
      ...edgeDefaults,
    };
  });
  return { nodes, edges };
};

const BlockFlowGraph: React.FC<{ block: VariablesExecutionFlowBlock }> = ({ block }) => {
  const graph = useMemo(() => buildVariablesSmokeTestBlockFlow(block), [block]);
  return (
    <section className={styles.blockGraph} aria-label={`Flow for Block ${block.blockName}`}>
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
            {block.steps.length} command{block.steps.length === 1 ? '' : 's'}
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
  onClose,
}) => {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return createPortal(
    <div
      className={graphStyles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${graphStyles.dialog} ${styles.dialog}`}
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
            <b>{blocks.length} Block{blocks.length === 1 ? '' : 's'} · separated graphs</b>
          </div>
          <div className={styles.graphList}>
            {blocks.map(block => (
              <BlockFlowGraph
                key={`flow:${block.blockId ?? block.blockName}`}
                block={block}
              />
            ))}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default VariablesSmokeTestFlowModal;
