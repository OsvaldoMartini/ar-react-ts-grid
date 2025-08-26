import React, { useState, useEffect, useRef } from 'react';
import { ComplexMessage, ElementDTO } from './instructionsMockData';
import crossImage from '../assets/cross.png';
import pickItemImage from '../assets/pick-item5.png';
import saveImage from "../assets/save.png";
import editImage from '../assets/edit.png';
import constructionImage from '../assets/construction.png';
import clickImage from "../assets/click.png";
import linkImage from "../assets/links-icon.png";
import inputImage from "../assets/input_field.png";
import outPutImage from "../assets/output1.png";
import testInputImage from "../assets/testInput.png";
import clickTestImage from "../assets/clickTest2.png";
import warningRedImage from '../assets/warning_red.png';
import AlertModal from './AlertModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';
import './griditem.scss';
import NameDropdown from './NameDropdown';

interface GridItemScannProps {
  homeBankingIdInitial: number;
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

const GridItemScann: React.FC<GridItemScannProps> = ({ homeBankingIdInitial, dataDTO, socketPort, sessionId }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);

  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(dataDTO);
  const [elementGrouped, setElementGrouped] = useState<Record<string, { tagName: string; elements: ElementDTO[] }>>({});
  const [isElementGrouped, setIsElementGrouped] = useState<boolean>(false);

  const [errorFlag, setErrorFlag] = useState<boolean>(false)
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [alertMessageHeader, setAlertMessageHeader] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);

  // const totalPages = Math.max(1, Math.ceil(Object.entries(elementGrouped).length / rowsPerPage));
  // const paginatedData = Object.entries(elementGrouped).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const [blockPages, setBlockPages] = useState<Record<string, number>>({});
  const [blockCurrentPages, setBlockCurrentPages] = useState<Record<string, number>>({});
  const [blockRowsPerPage, setBlockRowsPerPage] = useState<number>(10);
  const elementDTORef = useRef<HTMLInputElement>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingElementTagName, setEditingElementTagName] = useState<string | null>(null);
  const [elementName, setElementName] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  // Inside your component:
  const [hoveredRow, setHoveredRow] = useState<ElementDTO | null>(null);
  const [hoveredRowsList, setHoveredRowsList] = useState<ElementDTO[]>([]);

  const handleNextBlockPage = (typeElement: string) => {
    setBlockCurrentPages((prev) => ({
      ...prev,
      [typeElement]: Math.min((prev[typeElement] || 1) + 1, blockPages[typeElement] || 1),
    }));
  };

  const handlePrevBlockPage = (typeElement: string) => {
    setBlockCurrentPages((prev) => ({
      ...prev,
      [typeElement]: Math.max((prev[typeElement] || 1) - 1, 1),
    }));
  };

  useEffect(() => {
    const newBlockPages: Record<string, number> = {};
    Object.entries(elementGrouped).forEach(([typeElement, elementData]) => {
      newBlockPages[typeElement] = Math.max(1, Math.ceil(elementData.elements.length / blockRowsPerPage));
    });
    setBlockPages(newBlockPages);
    setBlockCurrentPages(Object.keys(elementGrouped).reduce((acc, key) => ({ ...acc, [key]: 1 }), {}));
  }, [elementGrouped, blockRowsPerPage]);

  useEffect(() => {
    console.log("Updated elementGrouped:", elementGrouped);
  }, [elementGrouped]);


  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log("RECEIVED -> Last WebSocket message ", lastMessage);
      try {
        const parsedMessage = JSON.parse(lastMessage);

        if (typeof parsedMessage.homeBankingId === "number") {
          setHomeBankingId(parsedMessage.homeBankingId);
        }

        if (sessionId === parsedMessage.sessionId) {

          const bodyData =
            typeof parsedMessage.body === "string"
              ? JSON.parse(parsedMessage.body)
              : parsedMessage.body;


          if (parsedMessage.operationId === "searchTerms") {
            setIsSending(false);
            const detailsData = Array.isArray(bodyData.details) ? bodyData.details : [];

            if (detailsData.length === 0) {
              setElementDTO([]);
              setElementGrouped({});
              // setIsElementGrouped(true);
            } else {
              setElementDTO(detailsData);
            }
            // setIsElementGrouped(false);
          } else if (parsedMessage.operationId === "clonedElement" || parsedMessage.operationId === "addPickOne") {
            // Handle clonedElement and addPickOne operations
            const newElements = bodyData.details;

            if (newElements && Array.isArray(newElements) && newElements.length > 0) {
              setIsSending(false);
              setElementDTO((prevElements) => {
                let updatedElements = [...prevElements]; // Create a copy

                // Find the maximum existing ID
                const maxId = prevElements.reduce((max, el) => Math.max(max, el.id || 0), 0);
                let nextId = maxId + 1;

                newElements.forEach((newElement) => {
                  // Check for duplicates based on both xPath AND tagName
                  if (!updatedElements.some(
                    (el) => el.xPath === newElement.xPath && el.tagName === newElement.tagName
                  )) {
                    // Assign the next sequential ID to the new element
                    const elementToAdd = { ...newElement, id: nextId++ };

                    let insertIndex = -1;
                    if (prevElements.length > 0 && bodyData?.afterXPath) {
                      insertIndex = prevElements.findIndex(
                        (el) => el.xPath === bodyData.afterXPath
                      );
                    }

                    if (insertIndex !== -1) {
                      updatedElements.splice(insertIndex + 1, 0, elementToAdd); // Insert after found index
                    } else {
                      updatedElements.push(elementToAdd); // Append at the end if not found
                    }
                  }
                });
                return updatedElements;
              });
            }
            setIsElementGrouped(false);
          } else if (parsedMessage.operationId === "activate-insert-all") {
            setIsSending(false);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [messages, sessionId]);

  useEffect(() => {
    //console.log("UseEffect -> editingInstructionId");
    if (editingElementId && elementDTORef.current) {
      elementDTORef.current.focus();
    }
  }, [editingElementId]);

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

  const handlesSendAllClick = () => {
    console.log("handleSendAllClick: Sending all ElementDTOs");

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsSending(true); // 🔒 Disable the button after first click

    // Flatten the elementGrouped object to get all ElementDTOs
    const allElements = Object.values(elementGrouped).flatMap(group => group.elements);

    const message = {
      type: "SEND_ALL_ELEMENTS_DTO",
      homeBankingId: homeBankingId,
      sessionId: `scanner-element-pane`,
      details: allElements,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent CREATE all ElementDTOs:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      setIsSending(false); // re-enable if send fails
    }
  };

  const handleRowSelectedClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    elementDTO: ElementDTO,
    action: string
  ) => {
    event.stopPropagation();

    sendWebSocketMessage(elementDTO, action);

  };

  const sendWebSocketMessage = (elementDTO: ElementDTO, action: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }
    // const sessionDestine = action === "HOVERED_ROW"
    //   ? `scannerTool-${homeBankingId}`
    //   : `scanner-element-pane-${homeBankingId}`;

    const sessionDestine = action === "HOVERED_ROW"
      ? `scannerTool`
      : `scanner-element-pane`;

    const message = {
      type: action,
      homeBankingId: homeBankingId,
      sessionId: sessionDestine,
      details: [elementDTO],
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent element DTO:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
    }
  };

  const handleRemoveElementDTO = (elementToRemove: ElementDTO) => {
    console.log("Removing elementDTO:", elementToRemove);

    // Update elementDTO state
    setElementDTO((prevElements) =>
      prevElements.filter((element) => element !== elementToRemove)
    );

    // Update elementGrouped state
    setElementGrouped((prevGrouped) => {
      const updatedGrouped = { ...prevGrouped };

      for (const tagName in updatedGrouped) {
        updatedGrouped[tagName].elements = updatedGrouped[tagName].elements.filter(
          (element) => element !== elementToRemove
        );

        // If the group is empty after removal, you might want to remove the group
        if (updatedGrouped[tagName].elements.length === 0) {
          delete updatedGrouped[tagName];
        }
      }

      return updatedGrouped;
    });
  };


  const handleRemoveRowsBlock = (blockTagName: string) => {
    console.log("Removing block:", blockTagName);

    setElementDTO((prevElements) =>
      prevElements.filter((element) => element.tagName !== blockTagName)
    );

    setElementGrouped((prevGrouped) => {
      const updatedGrouped = { ...prevGrouped };
      delete updatedGrouped[blockTagName]; // Remove the entire group
      return updatedGrouped;
    });
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
      imageClass = "link-image";
    } else {
      imageSrc = outPutImage;
      imageClass = "output-image";
    }

    // Set the text based on the instruction properties
    text = instruction.someText?.trim() ? instruction.someText : instruction.tagName;

    // If someText exists and contains commas or semicolons, split it into an array and format it correctly
    const dataNames = instruction.someText
      ?.split(/[;,]/) // Split by both "," and ";"
      .map(item => item.trim()) // Trim whitespace
      .filter(Boolean) // Remove empty values
      .map(item => {
        // Ensure the name is no longer than 150 characters
        const name = item.length > 150 ? item.substring(0, 150) : item;
        return { name, value: name };
      }); // Convert to { name, value }

    // If the array has only one element, display the text directly
    const displayText = dataNames?.length === 1 ? dataNames[0].name : text;

    return (
      <div className="instruction-type">
        {imageSrc && <img src={imageSrc} alt="" className={imageClass} />}

        {dataNames?.length > 1 ? (
          <div className="attribute-name">
            <NameDropdown dataArray={dataNames} onChange={handleNameChange} />
          </div>
        ) : (
          <span>{displayText}</span>
        )}
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




  const handleNameChange = (value: string) => {
    console.log('Selected name:', value);
  };

  const handleAttributeChange = (value: string) => {
    console.log('Selected attribute:', value);
  };


  const handleEditInstruction = (elementEdit: ElementDTO) => {
    setEditingElementId(elementEdit.xPath);
    setEditingElementTagName(elementEdit.tagName);
    setElementName(elementEdit.someText);
  };
  const handleSaveInstruction = (selectedElement: ElementDTO) => {
    // Find the instruction to get blockId and botJobId
    console.log("handleSaveInstruction", selectedElement);
    const elementToUpdate = elementDTO.find(element => selectedElement.id === element.id);

    if (!elementToUpdate) {
      setAlertImage(warningRedImage);
      setAlertClass('construction-image');
      setAlertMessageHeader(
        `Error Element not found`
      );
      setErrorFlag(true);
      setAlertMessageBody(`Element with TagName ${selectedElement.tagName} not found`);
      return;
    }

    const { id } = selectedElement;
    const updatedName = elementName; // The new value for someText

    // Update the instruction's someText
    const updatedElements = elementDTO.map((element) => {
      if (element.id === id) {
        return { ...element, someText: updatedName }; // Update the someText property
      }
      return element; // Return the original element if it's not the one to update
    });

    setElementDTO(updatedElements);
    setIsElementGrouped(false); // Trigger re-grouping
    setEditingElementId(null); // Exit edit mode
    setEditingElementTagName(null); // Exit edit mode
  };


  const renderEditButton = (elementDTO: ElementDTO, editImage: string,) => {
    return (
      <img
        src={editImage}
        alt="edit"
        className="edit-button"
        onClick={() => handleEditInstruction(elementDTO)}  // Trigger edit mode
      />
    );
  };


  const handleRowHover = (elementDTO: ElementDTO) => {
    console.clear(); // Clear previous logs to only show the current hovered row
    console.log('Hovered Row:', elementDTO);

    setHoveredRow(elementDTO);

    sendWebSocketMessage(elementDTO, "HOVERED_ROW");

    setHoveredRowsList((prevList) => {
      if (!prevList.find((el) => el.id === elementDTO.id)) {
        return [...prevList, elementDTO];
      }
      return prevList;
    });
  };

  const handleRowLeave = () => {
    setHoveredRow(null);
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

      {elementDTO.length === 0 ? (
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
            <button
              className={`send-all-button ${isSending ? 'sending' : ''}`}
              onClick={handlesSendAllClick}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Insert All Elements'}
            </button>
            <button className="attributes-button" onClick={() => setShowAttributes(!showAttributes)}>
              {showAttributes ? 'Hide Attributes' : 'Show Attributes'}
            </button>
            <div className="pagination-controls">
              <label>Rows per page: </label>
              <select
                value={blockRowsPerPage}
                onChange={(e) => {
                  setBlockRowsPerPage(Number(e.target.value));
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {Object.entries(elementGrouped).map(([typeElement, elementData], index) => {
            const currentPage = blockCurrentPages[typeElement] || 1;
            const totalPages = blockPages[typeElement] || 1;
            const paginatedElements = elementData.elements.slice(
              (currentPage - 1) * blockRowsPerPage,
              currentPage * blockRowsPerPage
            );

            return (
              <div key={typeElement} className="block">
                <div className="block-header color-component1">
                  <div className="block-header-left">
                    <span className="block-order-number">#{index + 1}</span>
                    <span className="block-name">{getInstructionTypeElement(typeElement)}</span>
                    <span className="block-count">({elementData.elements.length})</span>
                  </div>
                  {elementData.elements.length > blockRowsPerPage && (
                    <div className="bottom-pagination-controls">
                      <button disabled={currentPage === 1} onClick={() => handlePrevBlockPage(typeElement)}>
                        Prev
                      </button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button disabled={currentPage === totalPages} onClick={() => handleNextBlockPage(typeElement)}>
                        Next
                      </button>
                    </div>
                  )}
                  <img
                    src={crossImage}
                    alt="Remove Block"
                    className="cross-button"
                    onClick={() => handleRemoveRowsBlock(typeElement)}
                  />

                </div>
                <div className="instructions-list">
                  {paginatedElements.map((elementDTO, i) => (
                    <div key={i}
                      className="instruction-item"
                      onMouseEnter={() => handleRowHover(elementDTO)}
                      onMouseLeave={handleRowLeave}
                    // onDoubleClick={(event) => handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")}
                    // onClick={(event) => handleRowSelectedClick(event, elementDTO, "DETAILS_ELEMENT_DTO")}
                    >
                      {editingElementId === elementDTO.xPath && editingElementTagName === elementDTO.tagName ? (
                        <div className="edit-container">
                          <input
                            type="text"
                            value={elementName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInstruction(elementDTO); // Trigger save when "Enter" is pressed
                              }
                            }}
                            onChange={(e) => {
                              console.log(e.target.value);
                              setElementName(e.target.value);
                            }}
                            ref={elementDTORef} // Associate the ref with the input element
                            className="edit-textbox"
                          />
                          <img
                            src={saveImage}
                            alt="save"
                            className="save-button"
                            onClick={() =>
                              handleSaveInstruction(elementDTO)
                            } // Save instruction logic
                          />
                        </div>
                      ) : (
                        <span className="instruction-line">{getInstructionElement(elementDTO)}</span>)}
                      {showAttributes ? (
                        <div>
                          <AttributeDropdown dataArray={elementDTO.attributeData} onChange={handleAttributeChange} />
                        </div>
                      ) : (
                        <span>{"\u00A0".repeat(20)}</span>
                      )}
                      <div className="options-column">
                        <img src={pickItemImage} alt="" className="pick-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "DETAILS_ELEMENT_DTO")} />
                        {renderEditButton(
                          elementDTO,
                          editImage
                        )}
                        <img src={saveImage} alt="" className="save-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")} />
                        <img src={testInputImage} alt="" className="test-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_INPUT_DTO")} />
                        <img src={clickTestImage} alt="" className="test-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_CLICK_DTO")} />
                        <img src={crossImage} alt="" className="cross-button" onClick={() => handleRemoveElementDTO(elementDTO)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default GridItemScann;
