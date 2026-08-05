import React from 'react';
import {
  CheckCircle2,
  Database,
  Flag,
  GitBranch,
  PlayCircle,
  RotateCcw,
  Table2,
} from 'lucide-react';
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import styles from './VariablesConnectionGraphHelpModal.module.scss';

export type HelpFlowNodeTone =
  | 'start'
  | 'data'
  | 'action'
  | 'command'
  | 'decision'
  | 'end';

export interface HelpFlowNodeData extends Record<string, unknown> {
  title: string;
  detail: string;
  eyebrow?: string;
  tone: HelpFlowNodeTone;
  compact?: boolean;
  callCount?: number;
}

export type HelpFlowNodeModel = Node<HelpFlowNodeData, 'helpFlow'>;

const toneIcon = (tone: HelpFlowNodeTone): React.ReactNode => {
  switch (tone) {
    case 'start':
      return <PlayCircle size={18} aria-hidden="true" />;
    case 'data':
      return <Table2 size={18} aria-hidden="true" />;
    case 'action':
      return <RotateCcw size={18} aria-hidden="true" />;
    case 'command':
      return <Database size={18} aria-hidden="true" />;
    case 'decision':
      return <GitBranch size={18} aria-hidden="true" />;
    case 'end':
      return <Flag size={18} aria-hidden="true" />;
    default:
      return <CheckCircle2 size={18} aria-hidden="true" />;
  }
};

const HelpFlowNode: React.FC<NodeProps<HelpFlowNodeModel>> = ({ data }) => (
  <article
    className={styles.xyNode}
    data-tone={data.tone}
    data-compact={data.compact === true ? 'true' : 'false'}
  >
    <Handle id="targetLeft" type="target" position={Position.Left} />
    <Handle id="targetRight" type="target" position={Position.Right} />
    <Handle id="targetTop" type="target" position={Position.Top} />
    <Handle id="targetBottom" type="target" position={Position.Bottom} />
    <Handle id="sourceRight" type="source" position={Position.Right} />
    <Handle id="sourceLeft" type="source" position={Position.Left} />
    <Handle id="sourceTop" type="source" position={Position.Top} />
    <Handle id="sourceBottom" type="source" position={Position.Bottom} />

    <div className={styles.xyNodeIcon}>{toneIcon(data.tone)}</div>
    {(data.callCount ?? 0) > 1 && (
      <b className={styles.xyNodeCallCount} aria-label={`${data.callCount} calls`}>
        ×{data.callCount}
      </b>
    )}
    <div className={styles.xyNodeText}>
      {data.eyebrow && <span>{data.eyebrow}</span>}
      <strong>{data.title}</strong>
      <small>{data.detail}</small>
    </div>
  </article>
);

export default HelpFlowNode;
