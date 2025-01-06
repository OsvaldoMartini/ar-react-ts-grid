import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import './mycomponent.scss';

// Define types for data structure
interface QuoteItem {
  id: string;
  quote: string;
}

interface CharacterData {
  BMO: QuoteItem[];
  PrincessBubblegum: QuoteItem[];
}

// Initial data for characters and quotes
const initialData: CharacterData = {
  BMO: [
    { id: "1", quote: "Sometimes life is scary and dark" },
    { id: "2", quote: "But that doesn't mean you stop living." },
  ],
  PrincessBubblegum: [
    { id: "3", quote: "I'm not a princess, I'm a scientist!" },
    { id: "4", quote: "Adventure time is my favorite show!" },
  ],
};

const App: React.FC = () => {
  const [data, setData] = useState<CharacterData>(initialData);

  // On drag end, update the data based on new item order
  const onDragEnd = (result: DropResult): void => {
    const { destination, source } = result;

    if (!destination) return;

    if (destination.index === source.index && destination.droppableId === source.droppableId) {
      return;
    }

    const sourceList = data[source.droppableId as keyof CharacterData];
    const destList = data[destination.droppableId as keyof CharacterData];
    const [movedItem] = sourceList.splice(source.index, 1);
    destList.splice(destination.index, 0, movedItem);

    setData({
      ...data,
      [source.droppableId as keyof CharacterData]: sourceList,
      [destination.droppableId as keyof CharacterData]: destList,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div id="root">
        <div className="css-18i4cbe e58bbmo0">
          <Droppable droppableId="BMO">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="droppable">
                <h2>BMO Quotes</h2>
                {data.BMO.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="draggable-item"
                      >
                        <a href="https://www.adventuretime.fandom.com/wiki/BMO" aria-label={`Quote by BMO`}>
                          <img src="https://vignette.wikia.nocookie.net/adventuretime/images/e/e4/Bmo_Character.png/revision/latest/scale-to-width-down/340?cb=20170422144348" alt="BMO" />
                        </a>
                        <div className="quote-text">
                          <p>{item.quote}</p>
                          <p><small>Character: BMO</small></p>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <Droppable droppableId="PrincessBubblegum">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="droppable">
                <h2>Princess Bubblegum Quotes</h2>
                {data.PrincessBubblegum.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="draggable-item"
                      >
                        <a href="https://www.adventuretime.fandom.com/wiki/Princess_Bubblegum" aria-label={`Quote by Princess Bubblegum`}>
                          <img src="https://vignette.wikia.nocookie.net/adventuretime/images/e/e3/Princess_Bubblegum_Character.png/revision/latest/scale-to-width-down/340?cb=20170517164544" alt="Princess Bubblegum" />
                        </a>
                        <div className="quote-text">
                          <p>{item.quote}</p>
                          <p><small>Character: Princess Bubblegum</small></p>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
};

export default App;
