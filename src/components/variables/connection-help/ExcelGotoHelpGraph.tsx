import React from 'react';
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
import HelpFlowNode, { type HelpFlowNodeModel } from './HelpFlowNode';
import styles from './VariablesConnectionGraphHelpModal.module.scss';

const nodeTypes: NodeTypes = {
  helpFlow: HelpFlowNode,
};

const nodes: HelpFlowNodeModel[] = [
  {
    id: 'start',
    type: 'helpFlow',
    position: { x: 20, y: 20 },
    data: {
      eyebrow: 'Execution',
      title: 'Start / Rerun',
      detail: 'Begin at the first configured Block.',
      tone: 'start',
    },
  },
  {
    id: 'load',
    type: 'helpFlow',
    position: { x: 245, y: 20 },
    data: {
      eyebrow: 'Dataset',
      title: 'Load current Excel row',
      detail: 'Copy exact raw values into runtime memory.',
      tone: 'data',
    },
  },
  {
    id: 'return',
    type: 'helpFlow',
    position: { x: 470, y: 20 },
    data: {
      eyebrow: 'Loop entry',
      title: 'Return Block',
      detail: 'Enter the controlled Block/use-case scope.',
      tone: 'action',
    },
  },
  {
    id: 'scope',
    type: 'helpFlow',
    position: { x: 695, y: 20 },
    data: {
      eyebrow: 'Use case',
      title: 'Execute controlled scope',
      detail: 'Run every ordered instruction for the current row.',
      tone: 'action',
    },
  },
  {
    id: 'excelGoto',
    type: 'helpFlow',
    position: { x: 695, y: 185 },
    data: {
      eyebrow: 'Controller',
      title: 'EXCEL GOTO',
      detail: 'Evaluate the authoritative dataset row cursor.',
      tone: 'command',
    },
  },
  {
    id: 'decision',
    type: 'helpFlow',
    position: { x: 470, y: 185 },
    data: {
      eyebrow: 'Decision',
      title: 'More rows?',
      detail: 'Check whether another Excel data row exists.',
      tone: 'decision',
    },
  },
  {
    id: 'advance',
    type: 'helpFlow',
    position: { x: 245, y: 185 },
    data: {
      eyebrow: 'YES',
      title: 'Advance row',
      detail: 'Load the next row and update runtime memory.',
      tone: 'data',
    },
  },
  {
    id: 'endBlock',
    type: 'helpFlow',
    position: { x: 470, y: 350 },
    data: {
      eyebrow: 'NO',
      title: 'End Block',
      detail: 'Leave the controlled scope after the final row.',
      tone: 'end',
    },
  },
  {
    id: 'complete',
    type: 'helpFlow',
    position: { x: 695, y: 350 },
    data: {
      eyebrow: 'Complete',
      title: 'Continue execution',
      detail: 'The dataset loop cannot jump to Return Block again.',
      tone: 'end',
    },
  },
];

const edgeDefaults = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { stroke: '#6f91ad', strokeWidth: 2 },
};

const edges: Edge[] = [
  { id: 'start-load', source: 'start', target: 'load', ...edgeDefaults },
  { id: 'load-return', source: 'load', target: 'return', ...edgeDefaults },
  { id: 'return-scope', source: 'return', target: 'scope', ...edgeDefaults },
  {
    id: 'scope-excel',
    source: 'scope',
    sourceHandle: 'sourceBottom',
    target: 'excelGoto',
    targetHandle: 'targetTop',
    ...edgeDefaults,
  },
  {
    id: 'excel-decision',
    source: 'excelGoto',
    sourceHandle: 'sourceLeft',
    target: 'decision',
    targetHandle: 'targetRight',
    ...edgeDefaults,
  },
  {
    id: 'decision-advance',
    source: 'decision',
    sourceHandle: 'sourceLeft',
    target: 'advance',
    targetHandle: 'targetRight',
    label: 'YES',
    animated: true,
    ...edgeDefaults,
  },
  {
    id: 'advance-return',
    source: 'advance',
    sourceHandle: 'sourceTop',
    target: 'return',
    targetHandle: 'targetBottom',
    label: 'NEXT ROW',
    animated: true,
    ...edgeDefaults,
  },
  {
    id: 'decision-end',
    source: 'decision',
    sourceHandle: 'sourceBottom',
    target: 'endBlock',
    targetHandle: 'targetTop',
    label: 'NO',
    ...edgeDefaults,
  },
  { id: 'end-complete', source: 'endBlock', target: 'complete', ...edgeDefaults },
];

const ExcelGotoHelpGraph: React.FC = () => (
  <div className={styles.xyGraphShell}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.16, maxZoom: 1.05 }}
      minZoom={0.55}
      maxZoom={1.35}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#b8cada" />
      <Controls showInteractive={false} position="bottom-right" />
      <Panel position="top-left" className={styles.xyGraphTitle}>
        <span>Dataset loop</span>
        <strong>One Excel row drives one complete use-case pass</strong>
      </Panel>
      <Panel position="top-right" className={styles.xyGraphRule}>
        One active EXCEL GOTO per Bot Job
      </Panel>
    </ReactFlow>
  </div>
);

export default ExcelGotoHelpGraph;
