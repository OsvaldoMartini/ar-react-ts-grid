import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Define the structure of the Block and Instruction
interface Instruction {
  id: string;
  name: string;
  type: string;
}

interface Block {
  id: string;
  blockName: string;
  blockOrder: number;
  instructions: Instruction[];
}

// Initial data for blocks and instructions
const initialData: Block[] = [
  {
    id: '1',
    blockName: 'Block 1',
    blockOrder: 1,
    instructions: [
      { id: '1-1', name: 'Instruction 1', type: 'Type A' },
      { id: '1-2', name: 'Instruction 2', type: 'Type B' },
      { id: '1-3', name: 'Instruction 3', type: 'Type C' },
      { id: '1-4', name: 'Instruction 4', type: 'Type D' }
    ]
  },
  {
    id: '2',
    blockName: 'Block 2',
    blockOrder: 2,
    instructions: [
      { id: '2-1', name: 'Instruction 1', type: 'Type A' },
      { id: '2-2', name: 'Instruction 2', type: 'Type B' },
      { id: '2-3', name: 'Instruction 3', type: 'Type C' },
      { id: '2-4', name: 'Instruction 4', type: 'Type D' }
    ]
  }
];

// Reorder function for Drag and Drop functionality
const reorder = <T extends { id: string }>(
  list: T[],
  startIndex: number,
  endIndex: number
): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const BlockInstructionsDnd: React.FC = () => {
  const [blocks, setBlocks] = React.useState(initialData);

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Handle invalid drop
    if (!destination) {
      return;
    }

    // Handle dragging instructions within a block
    if (draggableId.includes('-')) {
      const [blockId, instructionId] = draggableId.split('-');
      const blockIndex = blocks.findIndex((block) => block.id === blockId);
      const instructionIndex = blocks[blockIndex].instructions.findIndex(
        (instruction) => instruction.id === instructionId
      );

      const updatedInstructions = reorder(
        blocks[blockIndex].instructions,
        source.index,
        destination.index
      );

      const newBlocks = [...blocks];
      newBlocks[blockIndex] = {
        ...blocks[blockIndex],
        instructions: updatedInstructions
      };

      setBlocks(newBlocks);
    } else {
      // Handle dragging blocks
      const startIndex = source.index;
      const endIndex = destination.index;

      const reorderedBlocks = reorder(blocks, startIndex, endIndex);

      // Update block order
      const updatedBlocks = reorderedBlocks.map((block, index) => ({
        ...block,
        blockOrder: index + 1
      }));

      setBlocks(updatedBlocks);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Droppable for blocks */}
      <Droppable droppableId="blocks" direction="vertical">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '10px',
            }}
          >
            {blocks.map((block, blockIndex) => (
              <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      backgroundColor: 'blue',
                      color: 'white',
                      padding: '10px',
                      marginBottom: '10px',
                      borderRadius: '5px',
                    }}
                  >
                    {/* Ensure this section is draggable */}
                    <h3 {...provided.dragHandleProps}>{block.blockName} (Order: {block.blockOrder})</h3>

                    {/* Droppable for instructions within each block */}
                    <Droppable droppableId={block.id} type="instruction">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            backgroundColor: 'blue',
                            padding: '5px',
                            marginTop: '10px',
                          }}
                        >
                          {block.instructions.map((instruction, index) => (
                            <Draggable
                              key={instruction.id}
                              draggableId={`${block.id}-${instruction.id}`}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    backgroundColor: 'white',
                                    color: 'red',
                                    padding: '10px',
                                    margin: '5px 0',
                                    borderRadius: '5px',
                                  }}
                                >
                                  <p>{instruction.name} (Type: {instruction.type})</p>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
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

export default BlockInstructionsDnd;
