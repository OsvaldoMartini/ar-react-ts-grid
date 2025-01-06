import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Sample data for groupedData
const initialGroupedData = [
  {
    blockId: 1,
    blockName: 'Block 1',
    instructions: [
      { id: 'i1', name: 'Instruction 1', type: 'Type A', blockOrderNumber: 1 },
      { id: 'i2', name: 'Instruction 2', type: 'Type B', blockOrderNumber: 2 },
      { id: 'i3', name: 'Instruction 3', type: 'Type C', blockOrderNumber: 3 },
      { id: 'i4', name: 'Instruction 4', type: 'Type D', blockOrderNumber: 4 },
    ],
  },
  {
    blockId: 2,
    blockName: 'Block 2',
    instructions: [
      { id: 'i5', name: 'Instruction 5', type: 'Type E', blockOrderNumber: 1 },
      { id: 'i6', name: 'Instruction 6', type: 'Type F', blockOrderNumber: 2 },
      { id: 'i7', name: 'Instruction 7', type: 'Type G', blockOrderNumber: 3 },
      { id: 'i8', name: 'Instruction 8', type: 'Type H', blockOrderNumber: 4 },
    ],
  },
  {
    blockId: 3,
    blockName: 'Block 3',
    instructions: [
      { id: 'i9', name: 'Instruction 9', type: 'Type I', blockOrderNumber: 1 },
      { id: 'i10', name: 'Instruction 10', type: 'Type J', blockOrderNumber: 2 },
      { id: 'i11', name: 'Instruction 11', type: 'Type K', blockOrderNumber: 3 },
      { id: 'i12', name: 'Instruction 12', type: 'Type L', blockOrderNumber: 4 },
    ],
  },
];

const BlockList: React.FC = () => {
  const [groupedData, setGroupedData] = useState(initialGroupedData);

  // Handle drag end to reorder blocks
  const onDragEnd = (result: any) => {
    const { destination, source } = result;

    // If dropped outside
    if (!destination) return;

    // Reorder blocks
    if (source.index !== destination.index) {
      const reorderedBlocks = Array.from(groupedData);
      const [removed] = reorderedBlocks.splice(source.index, 1);
      reorderedBlocks.splice(destination.index, 0, removed);

      setGroupedData(reorderedBlocks);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="blocks" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {groupedData.map((blockData, index) => (
              <Draggable
                key={blockData.blockId}
                draggableId={blockData.blockId.toString()}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="block"
                    style={{
                      ...provided.draggableProps.style,
                      backgroundColor: 'blue',
                      color: 'white',
                      padding: '10px',
                      marginBottom: '10px',
                      borderRadius: '5px',
                    }}
                  >
                    {/* Block header */}
                    <div className="block-header">
                      <span className="block-order-number">
                        #{blockData.instructions[0].blockOrderNumber}
                      </span>
                      <span className="block-name">{blockData.blockName}</span>
                      <span className="block-count">({blockData.instructions.length})</span>
                    </div>

                    {/* Instructions */}
                    <div
                      className="instructions"
                      style={{
                        backgroundColor: 'white',
                        color: 'red',
                        padding: '5px',
                        marginTop: '10px',
                      }}
                    >
                      {blockData.instructions.map((instruction) => (
                        <div
                          key={instruction.id}
                          className="instruction-row"
                          style={{
                            backgroundColor: 'white',
                            color: 'red',
                            padding: '10px',
                            marginBottom: '5px',
                            borderRadius: '5px',
                          }}
                        >
                          <span>{instruction.name}</span>
                          <span>{instruction.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default BlockList;
