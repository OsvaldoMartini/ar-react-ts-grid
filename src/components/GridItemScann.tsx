import React, { useState, useEffect } from 'react';
import { ComplexMessage, ElementDTO } from './instructionsMockData';
import './griditem.scss';

import crossImage from '../assets/cross.png';
import saveImage from "../assets/save.png";
import constructionImage from '../assets/construction.png';

import clickImage from "../assets/click.png";
import linkImage from "../assets/links-icon.png";
import inputImage from "../assets/input_field.png";
import outPutImage from "../assets/output1.png";


import AlertModal from './AlertModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';

interface GridItemScannProps {
  homeBankingId: number;
  dataDTO: ElementDTO[];
  socketPort: number;
  sessionId: string;
}

const groupByTagName = (data: ElementDTO[]) => {
  return data.reduce((result, item) => {
    const { tagName } = item;
    if (!result[tagName]) {
      result[tagName] = { tagName, elements: [] };
    }
    result[tagName].elements.push(item);
    return result;
  }, {} as Record<string, { tagName: string; elements: ElementDTO[] }>);
};

const GridItemScann: React.FC<GridItemScannProps> = ({ homeBankingId, dataDTO, socketPort, sessionId }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(dataDTO);
  const [elementGrouped, setElementGrouped] = useState<Record<string, { tagName: string; elements: ElementDTO[] }>>({});
  const [isElementGrouped, setIsElementGrouped] = useState<boolean>(false);

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);



  const [errorFlag, setErrorFlag] = useState<boolean>(false)
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [alertMessageHeader, setAlertMessageHeader] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);


  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('RECEIVED -> Last WebSocket message ', lastMessage);
      try {
        const parsedMessage = JSON.parse(lastMessage);

        const bodyData = typeof parsedMessage.body === "string"
          ? JSON.parse(parsedMessage.body)
          : parsedMessage.body;

        if (sessionId === bodyData.sessionId && bodyData.operationId === "searchTerms") {
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
      setElementGrouped(groupByTagName(elementDTO));
      setIsElementGrouped(true);
    }
  }, [elementDTO, isElementGrouped]);


  const handleClose = () => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
  };

  const totalPages = Math.ceil(Object.keys(elementGrouped).length / rowsPerPage);
  const paginatedData = Object.entries(elementGrouped).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleCreateElementDTO = (elementDTO: ElementDTO) => {
    console.log("handleCreateElementDTO:", elementDTO);

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    const message = {
      type: "NEW_ELEMENT_DTO",
      homeBankingId: homeBankingId,
      sessionId: "componentTasks",
      details: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('📤 Sent CREATE element DTO:', message);
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
      homeBankingId: homeBankingId,
      sessionId: "componentTasks",
      details: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('📤 Sent DELETE element DTO:', message);
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
    }
  };

  const getElementBlockText = (typeElement: string): string => {
    const lowerTag = typeElement.toLowerCase();

    if (["input", "textarea"].includes(lowerTag)) {
      return "Input Text";
    }
    if (lowerTag === "select") {
      return "Select Text";
    }
    if (lowerTag === "button") {
      return "Button";
    }
    if (lowerTag === "a") {
      return "Link";
    }
    return typeElement; // Default to returning the tag name
  };


  const getInstructionElement = (instruction: ElementDTO): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let imageClass = "operations"; // Default class for images

    // Set the image source based on the tag name
    if (instruction.tagName === "input") {
      imageSrc = inputImage;
      imageClass = "input-image";
    } else if (instruction.tagName === "button") {
      imageSrc = clickImage;
      imageClass = "click-image";
    } else if (instruction.tagName === "a") {
      imageSrc = linkImage;
      imageClass = "click-image";
    } else {
      imageSrc = outPutImage;
      imageClass = "output-image";
    }

    // Set the text based on the instruction properties
    text = instruction.someText?.trim() ? instruction.someText : instruction.tagName;

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return (
      <div className="instruction-type">
        {imageSrc && (
          <>
            <img src={imageSrc} alt="" className={imageClass} />
            <span>{text}</span>
          </>
        )}
        {!imageSrc && <span>{text}</span>}
      </div>
    );
  };

  const getInstructionTypeElement = (typeElement: string): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let imageClass = "operations"; // Default class for images

    // Set the image source based on the tag name
    if (typeElement === "input") {
      imageSrc = inputImage;
      imageClass = "input-image";
    } else if (typeElement === "button") {
      imageSrc = clickImage;
      imageClass = "click-image";
    } else if (typeElement === "a") {
      imageSrc = linkImage;
      imageClass = "click-image";
    } else {
      imageSrc = outPutImage;
      imageClass = "output-image";
    }

    // Set the text based on the instruction properties
    text = getElementBlockText(typeElement);

    // Return a combined image and text element if imageSrc exists, otherwise return just the text
    return (
      <div className="instruction-type">
        {imageSrc && (
          <>
            <img src={imageSrc} alt="" className={imageClass} />
            <span>{text}</span>
          </>
        )}
        {!imageSrc && <span>{text}</span>}
      </div>
    );
  };


  const handleSendDetailsDTO = (elementDTO: ElementDTO) => {
    console.log("handleSendDetailsDTO:", elementDTO);

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    const message = {
      type: "DETAILS_ELEMENT_DTO",
      homeBankingId: homeBankingId,
      sessionId: "unknow",
      details: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log('📤 Sent DETAILS element DTO:', message);
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
    }

  };

  const handleAttributeChange = (value: string) => {
    console.log('Selected attribute:', value);
  };



  return (
    <div className="grid-container">
      {/* Alert Modal (as before) */}
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

      {paginatedData.length === 0 ? (
        // No data message (as before)
        <div className="block">
          <div className="block-header color-component2">Scanned Web Elements</div>
          <div className="instruction-item"> </div>
          <div className="block">
            <div className="no-data-message">No data found</div>
          </div>
        </div>
      ) : (
        <>
          {/* Toggle Button and Pagination Controls on the same row */}
          <div className="controls-row">
            <button className="attributes-button" onClick={() => setShowAttributes(!showAttributes)}>
              {showAttributes ? 'Hide Attributes' : 'Show Attributes'}
            </button>
            <div className="pagination-controls">
              <label>Rows per page: </label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {paginatedData.map(([typeElement, elementData], index) => (
            <div key={typeElement} className="block">
              <div className="block-header color-component1">
                <span className="block-order-number">#{index + 1}</span>
                <span className="block-name">{getInstructionTypeElement(typeElement)}</span>
                <span className="block-count">({elementData.elements.length})</span>
              </div>
              <div className="instructions-list">
                {elementData.elements.map((elementDTO, i) => (
                  <div key={i} className="instruction-item">
                    <span className="instruction-line">{getInstructionElement(elementDTO)}</span>
                    {showAttributes ? (
                      <div>
                        <AttributeDropdown elementDTO={elementDTO} onChange={handleAttributeChange} />
                      </div>
                    ) : (
                      <span>{"\u00A0".repeat(100)}</span> // 100 non-breaking spaces
                    )}
                    <div className="options-column">
                      <img src={saveImage} alt="save" className="save-button" onClick={() => handleCreateElementDTO(elementDTO)} />
                      <img src={crossImage} alt="" className="cross-button" onClick={() => handleRemoveElementDTO(elementDTO)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bottom-pagination-controls"> {/* Changed class name here */}
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
              Prev
            </button>
            <span> Page {currentPage} of {totalPages} </span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GridItemScann;
