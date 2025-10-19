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
  botJobIdInitial: number;
  botJobNameInitial: string;
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

const GridItemScann: React.FC<GridItemScannProps> = ({ homeBankingIdInitial, botJobIdInitial, botJobNameInitial, dataDTO, socketPort, sessionId }) => {
  // Using the custom WebSocket hook
  const { webSocket, connected, reconnectAttempts, messages, error } = useWebSocket(socketPort, sessionId);

  const [homeBankingId, setHomeBankingId] = useState<number>(homeBankingIdInitial);
  const [botJobId, setBotJobId] = useState<number | null>(botJobIdInitial);
  const [botJobName, setBotJobName] = useState<string | null>(botJobNameInitial);

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
  const [isSendingAll, setIsSendingAll] = useState(false);
  // below existing useState hooks
  const [isSendingDevice, setIsSendingDevice] = useState(false);
  const [isSendingDiscovery, setIsSendingDiscovery] = useState(false);
  const [isSendingScanner, setIsSendingScanner] = useState(false);


  // Inside your component:
  const [hoveredRow, setHoveredRow] = useState<ElementDTO | null>(null);
  const [hoveredRowsList, setHoveredRowsList] = useState<ElementDTO[]>([]);

  const [selectedJobOption, setSelectedJobOption] = useState<string>("Create New Bot Job");
  const [newBotJobName, setNewBotJobName] = useState<string>("");
  const isCreatingNew = selectedJobOption === "Create New Bot Job";

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
    if (!isSendingAll && !isSendingDevice && !isSendingDiscovery && !isSendingScanner) return;
    const t = setTimeout(() => {
      setIsSendingAll(false);
      setIsSendingDevice(false);
      setIsSendingDiscovery(false);
      setIsSendingScanner(false);
    }, 15000); // 15s fallback
    return () => clearTimeout(t);
  }, [isSendingAll, isSendingDevice, isSendingDiscovery, isSendingScanner]);

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
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    console.log("RECEIVED -> Last WebSocket message ", lastMessage);

    const tryParse = (val: any) => {
      if (typeof val !== "string") return val;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    };

    try {
      const parsedMessage = JSON.parse(lastMessage);

      if (typeof parsedMessage.homeBankingId === "number") {
        setHomeBankingId(parsedMessage.homeBankingId);
      }

      // Accept messages for this component from multiple sessions your backend may use.
      const acceptedSessions = new Set([
        sessionId,                 // the one passed as prop
        "scannerGrid",             // your backend sender
        "scannerTool",
        "scanner-element-pane",
      ]);

      if (!acceptedSessions.has(parsedMessage.sessionId)) return;

      const bodyData = tryParse(parsedMessage.body);

      switch (parsedMessage.operationId) {
        // ---------- EXISTING FLOWS ----------
        case "searchTerms": {
          setIsSendingAll(false);

          const detailsData = Array.isArray(bodyData?.details) ? bodyData.details : [];
          if (detailsData.length === 0) {
            setElementDTO([]);
            setElementGrouped({});
            setBotJobId(bodyData?.botJobId);
            setBotJobName(bodyData?.botJobName);
          } else {
            setElementDTO(detailsData);
          }
          break;
        }

        case "clonedElement":
        case "addPickOne": {
          setIsSendingAll(false);

          const newElements = bodyData?.elementDetails;
          setBotJobId(bodyData?.botJobId);
          setBotJobName(bodyData?.botJobName);

          if (newElements && Array.isArray(newElements) && newElements.length > 0) {
            setElementDTO((prevElements) => {
              let updatedElements = [...prevElements];

              const maxId = prevElements.reduce((max, el) => Math.max(max, el.id || 0), 0);
              let nextId = maxId + 1;

              newElements.forEach((newElement: any) => {
                const isDup = updatedElements.some(
                  (el) => el.xPath === newElement.xPath && el.tagName === newElement.tagName
                );
                if (!isDup) {
                  const elementToAdd = { ...newElement, id: nextId++ };

                  let insertIndex = -1;
                  if (prevElements.length > 0 && bodyData?.afterXPath) {
                    insertIndex = prevElements.findIndex(
                      (el) => el.xPath === bodyData.afterXPath
                    );
                  }

                  if (insertIndex !== -1) {
                    updatedElements.splice(insertIndex + 1, 0, elementToAdd);
                  } else {
                    updatedElements.push(elementToAdd);
                  }
                }
              });

              return updatedElements;
            });
          }

          setIsElementGrouped(false);
          break;
        }

        // ---------- EXISTING BUTTON-ACTIVATE ----------
        case "activate-insert-all": {
          setIsSendingAll(false);
          break;
        }

        // ---------- NEW: PER-BUTTON UNLOCK ----------
        case "activate-connect-device": {
          setIsSendingDevice(false);
          break;
        }
        case "activate-discovery-app": {
          setIsSendingDiscovery(false);
          break;
        }
        case "activate-scanner-app": {
          setIsSendingScanner(false);
          break;
        }

        default:
          // no-op
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
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

  const handleConnectDeviceClick = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsSendingDevice(true); // 🔒 lock the button

    const message = {
      type: "ATTACH_DEVICE",
      homeBankingId,
      botJobId,
      botJobName,
      sessionId: "scannerTool",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent CONNECT_DEVICE:", message);
    } catch (err) {
      console.error("❌ Error sending CONNECT_DEVICE:", err);
      setIsSendingDevice(false); // 🔓 unlock on failure
    }
  };

  const handleDiscoveryAppClick = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsSendingDiscovery(true);

    const message = {
      type: "DISCOVERY_APP",
      homeBankingId,
      botJobId,
      botJobName,
      sessionId: "scannerTool",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent DISCOVERY_APP:", message);
    } catch (err) {
      console.error("❌ Error sending DISCOVERY_APP:", err);
      setIsSendingDiscovery(false);
    }
  };

  const handleScannAppClick = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsSendingScanner(true);

    const message = {
      type: "SCANNER_APP",
      homeBankingId,
      botJobId,
      botJobName,
      sessionId: "scannerTool",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent SCANNER_APP:", message);
    } catch (err) {
      console.error("❌ Error sending SCANNER_APP:", err);
      setIsSendingScanner(false);
    }
  };

  const handlesSendAllClick = () => {
    console.log("handleSendAllClick: Sending all ElementDTOs");

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsSendingAll(true); // 🔒 Disable the button after first click

    // Flatten the elementGrouped object to get all ElementDTOs
    const allElements = Object.values(elementGrouped).flatMap(group => group.elements);

    const message = {
      type: "SEND_ALL_ELEMENTS_DTO",
      homeBankingId: homeBankingId,
      botJobId: botJobId,
      botJobName: botJobName,
      sessionId: `scanner-element-pane`,
      elementDetails: allElements,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent CREATE all ElementDTOs:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      setIsSendingAll(false); // re-enable if send fails
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
      botJobId: botJobId,
      botJobName: botJobName,
      sessionId: sessionDestine,
      elementDetails: [elementDTO],
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
    const lowerTag = typeElement ? typeElement.toLowerCase() : "";

    if (["input", "textarea"].includes(lowerTag)) {
      return "Input Text";
    }
    if (lowerTag === "select") {
      return "Select Text";
    }
    if (lowerTag === "button") {
      return "Button";
    }
    if (lowerTag === "a" || lowerTag === "link") {
      return "Link";
    }
    if (lowerTag === "label") {
      return "Output";
    }

    return typeElement; //"Output Text"; // optional fallback
  };



  const getInstructionElement = (instruction: ElementDTO): JSX.Element | string | null => {
    let imageSrc: string | null = null;
    let text: string | null = null;
    let imageClass = "operations"; // Default class for images

    // Normalize to lowercase once
    const tag = instruction.tagName?.toLowerCase() || "";

    if (tag === "input") {
      imageSrc = inputImage;
      imageClass = "input-image";
    } else if (tag === "button") {
      imageSrc = clickImage;
      imageClass = "click-image";
    } else if (tag === "a" || tag === "link") {
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
    } else if (typeElement === "a" || typeElement === "link") {
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

    // sendWebSocketMessage(elementDTO, "HOVERED_ROW");

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

      {/* Top toolbar — always visible */}
      <div className="controls-toolbar">
        <button
          className={`buttons-toolbar ${isSendingDevice ? 'sending' : ''}`}
          onClick={handleConnectDeviceClick}
          disabled={isSendingDevice}
        >
          {isSendingDevice ? 'Sending…' : 'Connect Device'}
        </button>

        {/* New text fields */}
        <input
          type="text"
          className="toolbar-input"
          placeholder="InLinea"
          defaultValue="InLinea"
        />
        <input
          type="text"
          className="toolbar-input"
          placeholder="ch.bsct.ebanking.mobile"
          defaultValue="ch.bsct.ebanking.mobile"
        />

        <button
          className={`buttons-toolbar ${isSendingDiscovery ? 'sending' : ''}`}
          onClick={handleDiscoveryAppClick}
          disabled={isSendingDiscovery}
        >
          {isSendingDiscovery ? 'Sending…' : 'Discovery App'}
        </button>

        <button
          className={`buttons-toolbar ${isSendingScanner ? 'sending' : ''}`}
          onClick={handleScannAppClick}
          disabled={isSendingScanner}
        >
          {isSendingScanner ? 'Sending…' : 'Scanner App'}
        </button>

        {/* ---- vertical separator ---- */}
        <span className="toolbar-separator" aria-hidden="true" />

        {/* ---- combo box + conditional input ---- */}
        <select
          className="toolbar-select"
          value={selectedJobOption}
          onChange={(e) => setSelectedJobOption(e.target.value)}
          aria-label="Bot Job Presets"
        >
          <option value="Create New Bot Job">Create New Bot Job</option>
          <option value="Mega Job">Mega Job</option>
          <option value="Pagamento Banca Stato">Pagamento Banca Stato</option>
        </select>

        <input
          type="text"
          className="toolbar-input"
          placeholder="new Bot Job Name"
          value={newBotJobName}
          onChange={(e) => setNewBotJobName(e.target.value)}
          disabled={!isCreatingNew}
        />
      </div>

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
              className={`send-all-button ${isSendingAll ? 'sending' : ''}`}
              onClick={handlesSendAllClick}
              disabled={isSendingAll}
            >
              {isSendingAll ? 'Sending...' : 'Insert All Elements'}
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
