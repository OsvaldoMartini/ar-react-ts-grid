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
          {/* Block header with garbage, up, and down buttons */}
          <div className="block-header">
            <span>{blockId}</span>
            <span>{blockData.blockName}</span>
            <span>Instruction Count: {blockData.instructions.length}</span>
            <div className="move-buttons">
              <img src="../garbage.png" className="garbage-button" /> {/* New garbage button */}
              <img src="../up.png" className="move-button" />
              <img src="../down.png" className="move-button" />
            </div>
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
                  <img src="../up.png" className="move-button" />
                  <img src="../down.png" className="move-button" />
                  <img src="../edit.png" className="edit-button" />
                  <img src="../cross.png" className="cross-button" />
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
