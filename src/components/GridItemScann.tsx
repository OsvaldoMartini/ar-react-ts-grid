import React, { useState, useEffect } from 'react';
import { ComplexMessage, ElementDTO } from './instructionsMockData';
import './griditem.scss';

import crossImage from '../assets/cross.png';
import saveImage from "../assets/save.png";
import constructionImage from '../assets/construction.png';

import AlertModal from './AlertModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';

interface GridItemScannProps {
  dataDTO: ElementDTO[];
  socketPort: number;
  sessionId: string;
  operationId: string;
}


// Function to group data by typeElement and sort elements within each type
const groupByTypeElement = (data: ElementDTO[]) => {
  const groupedElements = data.reduce((result, item) => {
    const { tagName } = item;

    if (!result[tagName]) {
      result[tagName] = { tagName, elements: [] };
    }

    result[tagName].elements.push(item);
    return result;
  }, {} as Record<string, { tagName: string; elements: ElementDTO[] }>);

  return groupedElements;
};

const GridItemScann: React.FC<GridItemScannProps> = ({ dataDTO, socketPort, sessionId }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [mockData, setMockData] = useState<boolean>(false);
  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(dataDTO);
  const [elementGrouped, setElementGrouped] = useState<{ [tagName: string]: { tagName: string; elements: ElementDTO[]; } }>({});
  const [isElementGrouped, setIsElementGrouped] = useState<boolean>(false);


  const [errorFlag, setErrorFlag] = useState<boolean>(false)
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [alertMessageHeader, setAlertMessageHeader] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // // Function to handle receiving data from JavaFX
  // (window as any).receiveDataFromJava = function (jsonData: string, socketPort: number) {
  //   const data: BlockLoopInstructionLoadDTO[] = JSON.parse(jsonData);
  //   const dataBotJob: BotJobData = JSON.parse(jsonData);

  //   if (data && data.length > 0) {
  //     setMockData(true);
  //   } else {
  //     if (dataBotJob) {
  //       setMockData(true);
  //     }
  //   }

  //   setSocketPort(socketPort);
  //   // setErrorFlag(true);
  //   // setAlertMessageBody("receiveDataFromJava Socket " + socketPort);
  // };


  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('RECEIVED -> Last WebSocket message ', lastMessage);
      try {
        const parsedMessage = JSON.parse(lastMessage);

        const bodyData = typeof parsedMessage.body === "string"
          ? JSON.parse(parsedMessage.body)
          : parsedMessage.body;

        if (bodyData.type === "updateInstructions") {
          // ... handle updateInstructions ...
        } else if (bodyData.sessionId === "scannerDestDTO" && bodyData.operationId === "searchTerms") {
          // Ensure detailsData is always an array if possible
          const detailsData = Array.isArray(bodyData.details) ? bodyData.details : [];

          // Update elementDTO first
          setElementDTO(detailsData);
          // Then, set isElementGrouped to false, triggering the useEffect
          setIsElementGrouped(false);
        }

      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [messages]);


  useEffect(() => {
    if (!isElementGrouped && elementDTO && elementDTO.length > 0) {
      setElementGrouped(groupByTypeElement(elementDTO));
      setIsElementGrouped(true);
    }
  }, [elementDTO, isElementGrouped]);


  const handleClose = () => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
  };

  const handleCreateElementDTO = (elementDTO: ElementDTO) => {
    console.log("handleCreateElementDTO:", elementDTO);

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    const message = {
      type: "NEW_ELEMENT_DTO",
      sessionId: "unknow",
      details: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('📤 Sent create element DTO:', message);
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
    }
  };

  const handleRemoveElementDTO = (elementDTO: ElementDTO) => {
    console.log("handleCreateElementDTO:", elementDTO);

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    const message = {
      type: "DEL_ELEMENT_DTO",
      sessionId: "unknoww",
      details: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('📤 Sent create element DTO:', message);
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
    }
  };

  const handleAttributeChange = (value: string) => {
    console.log('Selected attribute:', value);
  };

  console.log(elementGrouped)
  return (
    <div className="grid-container">
      {alertMessageBody && alertMessageBody.length > 0 && (
        <AlertModal
          header={alertMessageHeader || ''}
          body={alertMessageBody || ''}
          extraMsg={alertMessageFooter || ''}
          onClose={handleClose}
          imageSrc={alertImage}
          imageClass={alertClass}
          error={errorFlag}
        />
      )}
      <div className="grid-container">
        {Object.keys(elementGrouped).length === 0 ? (
          // Render default block if groupedData is empty
          <div className="block">
            <div className="block-header">
              <span className="block-order-number">{ }</span>
              <span className="block-name">Scanned Web Elements</span>
            </div>
          </div>
        ) : (
          Object.keys(elementGrouped).length > 0 &&
          Object.entries(elementGrouped)
            .map(([typeElement, elementData], index) => (
              <div key={typeElement} className="block">
                <div className="block-header">
                  <span className="block-order-number">#{index + 1}</span>
                  <span className="block-name">{typeElement}</span>
                  <span className="block-count">({elementData.elements.length})</span>
                </div>
                <div className="instructions-list">
                  {elementData.elements.map((elementDTO, i) => (
                    <div key={i} className="instruction-item">
                      <span className="instruction-line">
                        {elementDTO.tagName}
                      </span>

                      <div>
                        <AttributeDropdown elementDTO={elementDTO} onChange={handleAttributeChange} />
                      </div>
                      <div className="options-column">
                        <div className="move-buttons">
                          <img src={saveImage} alt="save" className="save-button" onClick={() => handleCreateElementDTO(elementDTO)} />
                          <img src={crossImage} alt="" className="cross-button" onClick={() => handleRemoveElementDTO(elementDTO)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div >
  );
};

export default GridItemScann;
