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
    id: 'if',
    type: 'helpFlow',
    position: { x: 355, y: 10 },
    data: {
      eyebrow: 'Conditional root',
      title: 'IF',
      detail: 'The one IF root in this Block connects to itself.',
      tone: 'decision',
    },
  },
  {
    id: 'ifBody',
    type: 'helpFlow',
    position: { x: 75, y: 175 },
    data: {
      eyebrow: 'TRUE',
      title: 'IF body',
      detail: 'Execute the commands belonging to the true branch.',
      tone: 'action',
    },
  },
  {
    id: 'elseIf',
    type: 'helpFlow',
    position: { x: 355, y: 175 },
    data: {
      eyebrow: 'FALSE · repeatable',
      title: 'ELSEIF × N',
      detail: 'Add any number of ELSEIF branches between IF and ELSE.',
      tone: 'command',
    },
  },
  {
    id: 'elseIfBody',
    type: 'helpFlow',
    position: { x: 635, y: 175 },
    data: {
      eyebrow: 'ELSEIF TRUE',
      title: 'ELSEIF body',
      detail: 'Execute the first matching ELSEIF branch.',
      tone: 'action',
    },
  },
  {
    id: 'else',
    type: 'helpFlow',
    position: { x: 635, y: 340 },
    data: {
      eyebrow: 'ALL FALSE',
      title: 'ELSE body',
      detail: 'Run only when IF and every ELSEIF are false.',
      tone: 'command',
    },
  },
  {
    id: 'endif',
    type: 'helpFlow',
    position: { x: 355, y: 500 },
    data: {
      eyebrow: 'Merge',
      title: 'ENDIF',
      detail: 'Every branch exits the conditional family here.',
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
  {
    id: 'if-true',
    source: 'if',
    sourceHandle: 'sourceLeft',
    target: 'ifBody',
    targetHandle: 'targetTop',
    label: 'TRUE',
    ...edgeDefaults,
  },
  {
    id: 'if-false',
    source: 'if',
    sourceHandle: 'sourceBottom',
    target: 'elseIf',
    targetHandle: 'targetTop',
    label: 'FALSE',
    ...edgeDefaults,
  },
  {
    id: 'elseif-true',
    source: 'elseIf',
    sourceHandle: 'sourceRight',
    target: 'elseIfBody',
    targetHandle: 'targetLeft',
    label: 'TRUE',
    ...edgeDefaults,
  },
  {
    id: 'elseif-false',
    source: 'elseIf',
    sourceHandle: 'sourceRight',
    target: 'else',
    targetHandle: 'targetTop',
    label: 'NO MATCH',
    ...edgeDefaults,
  },
  {
    id: 'ifbody-endif',
    source: 'ifBody',
    sourceHandle: 'sourceBottom',
    target: 'endif',
    targetHandle: 'targetLeft',
    ...edgeDefaults,
  },
  {
    id: 'elseifbody-endif',
    source: 'elseIfBody',
    sourceHandle: 'sourceBottom',
    target: 'endif',
    targetHandle: 'targetRight',
    ...edgeDefaults,
  },
  {
    id: 'else-endif',
    source: 'else',
    sourceHandle: 'sourceLeft',
    target: 'endif',
    targetHandle: 'targetRight',
    ...edgeDefaults,
  },
];

const IfFamilyHelpGraph: React.FC = () => (
  <div className={styles.xyGraphShell}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.14, maxZoom: 1.05 }}
      minZoom={0.55}
      maxZoom={1.35}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#b8cada" />
      <Controls showInteractive={false} position="bottom-right" />
      <Panel position="top-left" className={styles.xyGraphTitle}>
        <span>Conditional family</span>
        <strong>IF → ELSEIF × N → ELSE → ENDIF</strong>
      </Panel>
      <Panel position="top-right" className={styles.xyGraphRule}>
        One IF root per Block
      </Panel>
    </ReactFlow>
  </div>
);

export default IfFamilyHelpGraph;
