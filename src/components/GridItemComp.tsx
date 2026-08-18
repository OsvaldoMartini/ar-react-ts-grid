import React from 'react';
import GridItem from './GridItem';
import type {
  ComponentsInstructionsDTO,
} from './instructionsMockData';
import type { WorkspaceBlock } from './bot-job-details/grid/domain/workspaceBlocks';

export interface GridItemCompProps {
  homeBankingIdInitial: number;
  dataComp: ComponentsInstructionsDTO[];
  blocksComp?: WorkspaceBlock[];
  socketPort: number;
  sessionId: string;
  botJobIdInitial: number;
  botJobNameInitial: string;
  workspaceEpochInitial?: number;
  onSessionOpen: (targetSession: string, port: number, botJobId?: number) => void;
  onDetachedClose?: () => void;
}

/**
 * Bot Job Details and Components deliberately share one canonical grid.
 * workspaceMode supplies the routing/labels while every button, command,
 * row/block mutation, collapse behavior, and drag path stays identical.
 */
const GridItemComp: React.FC<GridItemCompProps> = ({
  dataComp,
  blocksComp,
  ...props
}) => (
  <GridItem
    {...props}
    data={dataComp}
    initialBlocks={blocksComp}
    workspaceMode="COMPONENT"
  />
);

export default GridItemComp;
