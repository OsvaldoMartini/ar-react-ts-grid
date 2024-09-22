import React from 'react';
import { BlockLoopInstructionLoadDTO } from './instructionsMockData'; // Import the data model
import './griditem.scss'; // Import the Sass file

interface GridItemProps {
  data: BlockLoopInstructionLoadDTO[];
}

// Function to group data by blockId and sort instructions within each block
const groupByBlock = (data: BlockLoopInstructionLoadDTO[]) => {
  const blocks = data.reduce((result, item) => {
    const { blockId, blockName } = item;
    if (!result[blockId]) {
      result[blockId] = { blockName, instructions: [] };
    }
    result[blockId].instructions.push(item);
    return result;
  }, {} as Record<number, { blockName: string; instructions: BlockLoopInstructionLoadDTO[] }>);

  // Sort each block's instructions by instructionOrderNumber
  Object.values(blocks).forEach(block => {
    block.instructions.sort((a, b) => a.instructionOrderNumber - b.instructionOrderNumber);
  });

  return blocks;
};

const GridItem: React.FC<GridItemProps> = ({ data }) => {
  const groupedData = groupByBlock(data);

  return (
    <div className="grid-container">
      {Object.entries(groupedData).sort(([aId], [bId]) => parseInt(aId) - parseInt(bId)).map(([blockId, blockData]) => (
        <div key={blockId} className="block">
          {/* Block header structured like the instruction rows */}
          <div className="block-header">
            <span>{blockId}</span>
            <span>{blockData.blockName}</span>
            <span>Instruction Count: {blockData.instructions.length}</span>
            {/* You can add more columns here if needed */}
          </div>
          <div className="instructions-list">
            {blockData.instructions.map((instruction) => (
              <div key={instruction.id} className="instruction-item">
                <span>{instruction.id}</span>
                <span>{instruction.instructionOrderNumber}</span>
                <span>{instruction.instructionType}</span>
                <span>{instruction.name}</span>
                <span>{instruction.description}</span>
                <div className="move-buttons">
                  <img src="../up.png" alt="Move up" className="move-button" />
                  <img src="../down.png" alt="Move down" className="move-button" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};


export default GridItem;
