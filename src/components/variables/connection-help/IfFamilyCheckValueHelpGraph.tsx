import React from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import { Flag, GitBranch, PlayCircle } from 'lucide-react';
import checkValueImage from '../../../assets/check4.png';
import styles from './VariablesConnectionGraphHelpModal.module.scss';

type ComplexNodeTone = 'decision' | 'check' | 'action' | 'end';

interface ComplexNodeData extends Record<string, unknown> {
  eyebrow: string;
  title: string;
  detail: string;
  tone: ComplexNodeTone;
}

type ComplexNodeModel = Node<ComplexNodeData, 'complexFlow'>;

const ComplexFlowNode: React.FC<NodeProps<ComplexNodeModel>> = ({ data }) => {
  const icon = data.tone === 'check' ? (
    <img src={checkValueImage} alt="" />
  ) : data.tone === 'decision' ? (
    <GitBranch size={18} aria-hidden="true" />
  ) : data.tone === 'end' ? (
    <Flag size={18} aria-hidden="true" />
  ) : (
    <PlayCircle size={18} aria-hidden="true" />
  );

  return (
    <article className={styles.complexNode} data-tone={data.tone}>
      <Handle id="targetLeft" type="target" position={Position.Left} />
      <Handle id="targetRight" type="target" position={Position.Right} />
      <Handle id="targetTop" type="target" position={Position.Top} />
      <Handle id="targetBottom" type="target" position={Position.Bottom} />
      <Handle id="sourceRight" type="source" position={Position.Right} />
      <Handle id="sourceLeft" type="source" position={Position.Left} />
      <Handle id="sourceTop" type="source" position={Position.Top} />
      <Handle id="sourceBottom" type="source" position={Position.Bottom} />

      <div className={styles.complexNodeIcon}>{icon}</div>
      <div className={styles.complexNodeText}>
        <span>{data.eyebrow}</span>
        <strong>{data.title}</strong>
        <small>{data.detail}</small>
      </div>
    </article>
  );
};

const nodeTypes: NodeTypes = {
  complexFlow: ComplexFlowNode,
};

const nodes: ComplexNodeModel[] = [
  {
    id: 'if',
    type: 'complexFlow',
    position: { x: 40, y: 185 },
    data: {
      eyebrow: 'CASE 1',
      title: 'IF',
      detail: 'Begin the first runtime-variable condition.',
      tone: 'decision',
    },
  },
  {
    id: 'ifChecks',
    type: 'complexFlow',
    position: { x: 245, y: 185 },
    data: {
      eyebrow: 'Runtime comparisons',
      title: 'CheckValue \u00d7 0..N',
      detail: 'All checks must pass. Any failure continues to CASE 2; no checks runs the branch normally.',
      tone: 'check',
    },
  },
  {
    id: 'ifBody',
    type: 'complexFlow',
    position: { x: 480, y: 35 },
    data: {
      eyebrow: 'ALL PASS',
      title: 'CASE 1 body',
      detail: 'Execute the commands belonging to the IF branch.',
      tone: 'action',
    },
  },
  {
    id: 'elseIf',
    type: 'complexFlow',
    position: { x: 480, y: 250 },
    data: {
      eyebrow: 'CASE 2',
      title: 'ELSEIF',
      detail: 'Evaluate the next condition after any CASE 1 failure.',
      tone: 'decision',
    },
  },
  {
    id: 'elseIfChecks',
    type: 'complexFlow',
    position: { x: 690, y: 250 },
    data: {
      eyebrow: 'Runtime comparisons',
      title: 'CheckValue \u00d7 0..N',
      detail: 'All checks must pass. Any failure continues to ELSE; no checks runs the branch normally.',
      tone: 'check',
    },
  },
  {
    id: 'elseIfBody',
    type: 'complexFlow',
    position: { x: 690, y: 35 },
    data: {
      eyebrow: 'ALL PASS',
      title: 'CASE 2 body',
      detail: 'Execute the commands belonging to the ELSEIF branch.',
      tone: 'action',
    },
  },
  {
    id: 'else',
    type: 'complexFlow',
    position: { x: 690, y: 405 },
    data: {
      eyebrow: 'ANY FINAL FAILURE',
      title: 'ELSE body',
      detail: 'Run the fallback commands when no condition passes.',
      tone: 'action',
    },
  },
  {
    id: 'endif',
    type: 'complexFlow',
    position: { x: 335, y: 405 },
    data: {
      eyebrow: 'Merge',
      title: 'ENDIF',
      detail: 'All completed branches continue from this point.',
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
  { id: 'if-checks', source: 'if', target: 'ifChecks', label: 'EVALUATE', ...edgeDefaults },
  {
    id: 'if-pass',
    source: 'ifChecks',
    sourceHandle: 'sourceTop',
    target: 'ifBody',
    targetHandle: 'targetLeft',
    label: 'ALL PASS',
    ...edgeDefaults,
  },
  {
    id: 'if-fail',
    source: 'ifChecks',
    sourceHandle: 'sourceRight',
    target: 'elseIf',
    targetHandle: 'targetLeft',
    label: 'ANY FAIL',
    ...edgeDefaults,
  },
  {
    id: 'elseif-checks',
    source: 'elseIf',
    target: 'elseIfChecks',
    label: 'EVALUATE',
    ...edgeDefaults,
  },
  {
    id: 'elseif-pass',
    source: 'elseIfChecks',
    sourceHandle: 'sourceTop',
    target: 'elseIfBody',
    targetHandle: 'targetBottom',
    label: 'ALL PASS',
    ...edgeDefaults,
  },
  {
    id: 'elseif-fail',
    source: 'elseIfChecks',
    sourceHandle: 'sourceBottom',
    target: 'else',
    targetHandle: 'targetTop',
    label: 'ANY FAIL',
    ...edgeDefaults,
  },
  {
    id: 'ifbody-end',
    source: 'ifBody',
    sourceHandle: 'sourceLeft',
    target: 'endif',
    targetHandle: 'targetTop',
    ...edgeDefaults,
  },
  {
    id: 'elseifbody-end',
    source: 'elseIfBody',
    sourceHandle: 'sourceLeft',
    target: 'endif',
    targetHandle: 'targetRight',
    ...edgeDefaults,
  },
  {
    id: 'else-end',
    source: 'else',
    sourceHandle: 'sourceLeft',
    target: 'endif',
    targetHandle: 'targetRight',
    ...edgeDefaults,
  },
];

const IfFamilyCheckValueHelpGraph: React.FC = () => (
  <div className={styles.xyGraphShell}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.12, maxZoom: 1.05 }}
      minZoom={0.55}
      maxZoom={1.35}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#b8cada" />
      <Controls showInteractive={false} position="bottom-right" />
      <Panel position="top-left" className={styles.xyGraphTitle}>
        <span>Runtime variable comparison</span>
        <strong>CheckValue groups control each conditional case</strong>
      </Panel>
      <Panel position="top-right" className={styles.xyGraphRule}>
        Any failed check continues to the next condition
      </Panel>
    </ReactFlow>
  </div>
);

export default IfFamilyCheckValueHelpGraph;
