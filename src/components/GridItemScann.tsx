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
import CompForce from './CompForce';
import AlertModal from './AlertModal';
import DomReviewModal, { type DomReviewData, type DomReviewAction } from './DomReviewModal';
import SupportRequestModal, { type SupportRequestData, type SupportRequestAction } from './SupportRequestModal';
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
  const [findText, setFindText] = useState<string>('');
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  const toggleBlockCollapsed = (key: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const CollapseToggleIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      {collapsed && <path d="M12 5v14" />}
    </svg>
  );

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

  // Keep-selection state for the "Delete Unchecked" workflow. Each entry is the
  // id of an element the user marked "Keep" via the per-row checkbox. Clicking
  // "Delete Unchecked" prunes every element NOT in this set. State is purely
  // local — no WebSocket push; the backend sees the remaining elements on the
  // next Insert All / Save.
  const [keepSelectedIds, setKeepSelectedIds] = useState<Set<number>>(new Set());
  const [pendingDeleteCount, setPendingDeleteCount] = useState<number | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const lastProcessedIndexRef = useRef(0);

  // Inside your component:
  const [hoveredRow, setHoveredRow] = useState<ElementDTO | null>(null);
  const [hoveredRowsList, setHoveredRowsList] = useState<ElementDTO[]>([]);
  const [domReviewData, setDomReviewData] = useState<DomReviewData | null>(null);
  const [supportReqData, setSupportReqData] = useState<SupportRequestData | null>(null);
  const [elementsSupportReqData, setElementsSupportReqData] = useState<SupportRequestData | null>(null);
  const clickedSupportElementRef = useRef<ElementDTO | null>(null);

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
    if (!isSendingAll) return;
    const t = setTimeout(() => {
      setIsSendingAll(false);
    }, 15000); // 15s fallback
    return () => clearTimeout(t);
  }, [isSendingAll]);

  useEffect(() => {
    if (!isUpdatingAll) return;
    const t = setTimeout(() => {
      setIsUpdatingAll(false);
    }, 15000); // 15s fallback
    return () => clearTimeout(t);
  }, [isUpdatingAll]);

  useEffect(() => {
    const newBlockPages: Record<string, number> = {};
    Object.entries(elementGrouped).forEach(([typeElement, elementData]) => {
      newBlockPages[typeElement] = Math.max(1, Math.ceil(elementData.elements.length / blockRowsPerPage));
    });
    setBlockPages(newBlockPages);

    // Preserve the page the user was viewing in each block. Previously this
    // effect unconditionally reset every block to page 1 on EVERY elementGrouped
    // change — so toggling a force_coords badge, renaming a row, or deleting
    // one snapped all blocks back to page 1. Now:
    //   - existing blocks keep their current page (clamped to the new max in
    //     case the element count shrank and the page no longer exists),
    //   - newly-appeared blocks start at page 1,
    //   - blocks that disappeared are dropped.
    setBlockCurrentPages(prev => {
      const next: Record<string, number> = {};
      for (const key of Object.keys(elementGrouped)) {
        const maxPage = newBlockPages[key] || 1;
        const prevPage = prev[key];
        next[key] = prevPage == null ? 1 : Math.min(Math.max(prevPage, 1), maxPage);
      }
      return next;
    });
  }, [elementGrouped, blockRowsPerPage]);

  useEffect(() => {
    console.log("Updated elementGrouped:", elementGrouped);
  }, [elementGrouped]);


  useEffect(() => {
    if (messages.length === 0) return;

    const tryParse = (val: any) => {
      if (typeof val !== "string") return val;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    };

    // Accept messages for this component from multiple sessions your backend may use.
    const acceptedSessions = new Set([
      sessionId, // the one passed as prop
      "scannerGrid",
      "scannerTool",
      "scanner-element-pane",
    ]);

    // ✅ process only NEW messages since last effect run
    for (let i = lastProcessedIndexRef.current; i < messages.length; i++) {
      const msg = messages[i];
      console.log("RECEIVED -> WebSocket message", msg);

      try {
        const parsedMessage = JSON.parse(msg);

        if (typeof parsedMessage.homeBankingId === "number") {
          setHomeBankingId(parsedMessage.homeBankingId);
        }

        if (!acceptedSessions.has(parsedMessage.sessionId)) continue;

        const bodyData = tryParse(parsedMessage.body);

        switch (parsedMessage.operationId) {
          case "searchTerms": {
            setIsSendingAll(false);
            setIsUpdatingAll(false);

           const detailsData = Array.isArray(bodyData?.elementDetails)
            ? bodyData.elementDetails
            : Array.isArray(bodyData?.details)
              ? bodyData.details
              : [];


            if (detailsData.length === 0) {
              // Clear (explicit empty payload from Java - e.g. Clean List button)
              setElementDTO([]);
              setElementGrouped({});
              setBotJobId(bodyData?.botJobId);
              setBotJobName(bodyData?.botJobName);
            } else {
              // Accumulate chunks — each scan arrives as N messages of ~25 elements.
              // Dedup by (xPath + tagName); Clean List button empties the grid.
              setElementDTO((prev) => {
                const seen = new Set(
                  prev.map((el: any) => `${el.xPath}||${el.tagName}`)
                );
                const merged = [...prev];
                let nextId = prev.reduce(
                  (max: number, el: any) => Math.max(max, el.id || 0),
                  0
                );
                for (const el of detailsData) {
                  const key = `${el.xPath}||${el.tagName}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    merged.push({ ...el, id: ++nextId });
                  }
                }
                return merged;
              });
              if (typeof bodyData?.botJobId !== "undefined") setBotJobId(bodyData?.botJobId);
              if (typeof bodyData?.botJobName !== "undefined") setBotJobName(bodyData?.botJobName);
            }

            setIsElementGrouped(false);
            break;
          }

          case "clonedElement":
          case "addPickOne": {
            setIsSendingAll(false);
            setIsUpdatingAll(false);

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

          case "activate-insert-all": {
            setIsSendingAll(false);
            break;
          }

          case "activate-update-all": {
            setIsUpdatingAll(false);
            break;
          }

          case "SEND_DOM_REVIEW": {
            const reviewData: DomReviewData = {
              url: bodyData?.url || '',
              title: bodyData?.title || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
              htmlSizeKb: bodyData?.htmlSizeKb || 0,
            };
            setDomReviewData(reviewData);
            break;
          }

          case "REQUEST_SUPPORT": {
            const reqData: SupportRequestData = {
              url: bodyData?.url || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
            };
            setSupportReqData(reqData);
            break;
          }

          case "REQUEST_SUPPORT_ELEMENTS": {
            const reqData: SupportRequestData = {
              url: bodyData?.url || '',
              pcName: bodyData?.pcName || '',
              email: bodyData?.email || '',
            };
            setElementsSupportReqData(reqData);
            break;
          }

          default:
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }

    // ✅ mark all messages as processed
    lastProcessedIndexRef.current = messages.length;
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

  const handlesUpdateAllClick = () => {
    console.log("handleSendAllClick: Sending all ElementDTOs");

    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }

    setIsUpdatingAll(true); // 🔒 Disable the button after first click

    // Flatten the elementGrouped object to get all ElementDTOs
    const allElements = Object.values(elementGrouped).flatMap(group => group.elements);

    const message = {
      type: "UPDATE_ALL_ELEMENTS_DTO",
      homeBankingId: homeBankingId,
      botJobId: botJobId,
      botJobName: botJobName,
      sessionId: `scanner-element-pane`,
      elementDetails: allElements,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent UPDATE all ElementDTOs:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      setIsUpdatingAll(false); // re-enable if send fails
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

  // ── Keep-selection handlers (used by the per-row checkbox + header buttons) ──
  const toggleKeep = (id: number) => {
    setKeepSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const keepAll = () => {
    setKeepSelectedIds(new Set(elementDTO.map(el => el.id)));
  };

  const clearKeeps = () => {
    setKeepSelectedIds(new Set());
  };

  /** How many currently-visible elements are NOT marked Keep and would be removed. */
  const uncheckedCount = (): number => {
    let n = 0;
    for (const el of elementDTO) if (!keepSelectedIds.has(el.id)) n++;
    return n;
  };

  /** Opens the confirmation. Commit happens in {@link confirmDeleteUnchecked}. */
  const requestDeleteUnchecked = () => {
    const toDelete = uncheckedCount();
    if (toDelete === 0) return;
    setPendingDeleteCount(toDelete);
  };

  const confirmDeleteUnchecked = () => {
    const keep = keepSelectedIds;
    setElementDTO(prev => prev.filter(el => keep.has(el.id)));
    setElementGrouped(prevGrouped => {
      const updated = { ...prevGrouped };
      for (const tagName of Object.keys(updated)) {
        const filteredElements = updated[tagName].elements.filter(el => keep.has(el.id));
        if (filteredElements.length === 0) {
          delete updated[tagName];
        } else {
          updated[tagName] = { ...updated[tagName], elements: filteredElements };
        }
      }
      return updated;
    });
    setPendingDeleteCount(null);
  };

  const cancelDeleteUnchecked = () => {
    setPendingDeleteCount(null);
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

  // ── force_coordinates flag toggles (F / E / T / N / S) ─────────────────────
  // The UI is in CompForce; this handler just reconciles state. We update BOTH
  // `elementDTO` (source of truth) and `elementGrouped` (what the list renders
  // from) so the badge flips immediately without rebuilding the grouped map.
  // No WebSocket send here — the flags ride out on the NEW_ELEMENT_DTO /
  // UPDATE_* message when the user clicks the save button on a scanned element.
  const handleElementForceChange = (elementId: number, nextForceCoordinates: string) => {
    setElementDTO(prev =>
      prev.map(el => (el.id === elementId ? { ...el, forceCoordinates: nextForceCoordinates } : el))
    );
    setElementGrouped(prevGrouped => {
      const updated = { ...prevGrouped };
      for (const tagName in updated) {
        updated[tagName] = {
          ...updated[tagName],
          elements: updated[tagName].elements.map(el =>
            el.id === elementId ? { ...el, forceCoordinates: nextForceCoordinates } : el
          ),
        };
      }
      return updated;
    });
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


  const handleSupportRequestAction = (action: SupportRequestAction, message: string) => {
    setSupportReqData(null);
    if (action === 'cancel') return;

    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'SUPPORT_REQUEST_RESPONSE',
        sessionId,
        homeBankingId,
        action,
        message,
      }));
    }
  };

  const requestElementsSupport = (clicked: ElementDTO) => {
    clickedSupportElementRef.current = clicked;
    // Ask backend for context (pc/email/url) — reuses the same pattern as REQUEST_SUPPORT.
    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'REQUEST_SUPPORT_ELEMENTS',
        sessionId,
        homeBankingId,
      }));
    } else {
      // Fallback: open modal immediately with blank context.
      setElementsSupportReqData({ url: '', pcName: '', email: '' });
    }
  };

  const handleElementsSupportRequestAction = (action: SupportRequestAction, message: string) => {
    const clicked = clickedSupportElementRef.current;
    setElementsSupportReqData(null);
    clickedSupportElementRef.current = null;
    if (action === 'cancel') return;

    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'SUPPORT_REQUEST_ELEMENTS_RESPONSE',
        sessionId,
        homeBankingId,
        action,
        message,
        // Only the clicked element — backend will pull its live outerHTML.
        elementDetails: clicked ? [clicked] : [],
      }));
    }
  };

  const handleDomReviewAction = (action: DomReviewAction) => {
    setDomReviewData(null);
    if (action === 'cancel') return;

    if (webSocket && connected && webSocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'DOM_REVIEW_RESPONSE',
        sessionId,
        homeBankingId,
        action,
      };
      webSocket.send(JSON.stringify(message));
    }
  };

  const matchesFind = (el: ElementDTO, q: string): boolean => {
    if (!q) return true;
    const fields = [
      el.tagName,
      (el as any).nameLabel,
      (el as any).nameField,
      (el as any).definedName,
      (el as any).someText,
      (el as any).attribId,
      (el as any).attribName,
      el.xPath,
    ];
    return fields.some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
  };

  return (
    <div className="grid-container">
      <div className="grid-find-row">
        <span className="grid-find-label">Find:</span>
        <input
          className="grid-find-input"
          type="text"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          placeholder="Type to find…"
        />
      </div>
      {/* DOM Review Modal */}
      {domReviewData && (
        <DomReviewModal data={domReviewData} onAction={handleDomReviewAction} />
      )}

      {/* Support Request Modal */}
      {supportReqData && (
        <SupportRequestModal data={supportReqData} onAction={handleSupportRequestAction} />
      )}

      {elementsSupportReqData && (
        <SupportRequestModal data={elementsSupportReqData} onAction={handleElementsSupportRequestAction} />
      )}

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

      {/* Delete-Unchecked confirmation. The AlertModal renders Confirm/Cancel
          buttons when onConfirm is provided. */}
      {pendingDeleteCount !== null && (
        <AlertModal
          header="Delete Unchecked Elements?"
          body={`You are about to delete ${pendingDeleteCount} element${pendingDeleteCount === 1 ? '' : 's'} that are NOT marked Keep.`}
          extraMsg={`${keepSelectedIds.size} element${keepSelectedIds.size === 1 ? '' : 's'} will be kept. This only affects the list in this pane — it does not touch the database.`}
          onClose={cancelDeleteUnchecked}
          onConfirm={confirmDeleteUnchecked}
          imageSrc={warningRedImage}
          imageClass="warning-image"
          error={true}
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
              className={`send-all-button ${isSendingAll ? 'sending' : ''}`}
              onClick={handlesSendAllClick}
              disabled={isSendingAll}
            >
              {isSendingAll ? 'Sending...' : 'Insert All Elements'}
            </button>
            <button
              className={`update-all-button ${isUpdatingAll ? 'updating' : ''}`}
              onClick={handlesUpdateAllClick}
              disabled={isUpdatingAll}
            >
              {isUpdatingAll ? 'Updating...' : 'Update All Elements'}
            </button>
            <button className="attributes-button" onClick={() => setShowAttributes(!showAttributes)}>
              {showAttributes ? 'Hide Attributes' : 'Show Attributes'}
            </button>
            <button
              className="attributes-button"
              onClick={keepAll}
              title="Mark every element as Keep"
              disabled={keepSelectedIds.size === elementDTO.length && elementDTO.length > 0}
            >
              Keep All
            </button>
            <button
              className="attributes-button"
              onClick={clearKeeps}
              title="Clear the Keep checkboxes"
              disabled={keepSelectedIds.size === 0}
            >
              Clear Keeps
            </button>
            <button
              className="attributes-button"
              onClick={requestDeleteUnchecked}
              disabled={uncheckedCount() === 0}
              style={{
                backgroundColor: uncheckedCount() === 0 ? undefined : '#D32F2F',
                color: uncheckedCount() === 0 ? undefined : '#fff',
                fontWeight: 600,
              }}
              title="Delete every element that is NOT marked Keep"
            >
              Delete Unchecked ({uncheckedCount()})
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

          {(() => {
            const q = findText.trim().toLowerCase();
            const filteredEntries = Object.entries(elementGrouped)
              .map(([typeElement, elementData]) => {
                if (!q) return [typeElement, elementData] as const;
                const groupMatches = typeElement.toLowerCase().includes(q);
                const filteredElements = groupMatches
                  ? elementData.elements
                  : elementData.elements.filter((el) => matchesFind(el, q));
                return [typeElement, { ...elementData, elements: filteredElements }] as const;
              })
              .filter(([, elementData]) => elementData.elements.length > 0);

            if (q && filteredEntries.length === 0) {
              return (
                <div className="block">
                  <div className="no-data-message">No matches for “{findText}”</div>
                </div>
              );
            }

            return filteredEntries.map(([typeElement, elementData], index) => {
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
                    <button
                      type="button"
                      className={`block-collapse-badge ${collapsedBlocks.has(typeElement) ? 'is-collapsed' : ''}`}
                      title={collapsedBlocks.has(typeElement) ? "Expand block" : "Collapse block"}
                      onClick={() => toggleBlockCollapsed(typeElement)}
                    >
                      <CollapseToggleIcon collapsed={collapsedBlocks.has(typeElement)} />
                    </button>
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
                {!collapsedBlocks.has(typeElement) && (
                <div className="instructions-list">
                  {paginatedElements.map((elementDTO, i) => (
                    <div
                      key={i}
                      className="instruction-item"
                      onMouseEnter={() => handleRowHover(elementDTO)}
                      onMouseLeave={handleRowLeave}
                    // onDoubleClick={(event) => handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")}
                    // onClick={(event) => handleRowSelectedClick(event, elementDTO, "DETAILS_ELEMENT_DTO")}
                    >
                      {/* Keep-this-one selector. Checking it marks the element as a keeper,
                          so it survives when the user clicks "Delete Unchecked" in the header. */}
                      <input
                        type="checkbox"
                        className="keep-checkbox"
                        checked={keepSelectedIds.has(elementDTO.id)}
                        onChange={() => toggleKeep(elementDTO.id)}
                        title="Keep this element (survives 'Delete Unchecked')"
                        onClick={(e) => e.stopPropagation()}
                      />
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
                        <CompForce item={elementDTO} onChange={handleElementForceChange} />
                        <img
                          src={warningRedImage}
                          alt="Report this element to support"
                          title="Report this element to support"
                          className="warning-button"
                          onClick={() => requestElementsSupport(elementDTO)}
                        />
                        <img src={pickItemImage} alt="" className="pick-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "DETAILS_ELEMENT_DTO")} />
                        {renderEditButton(
                          elementDTO,
                          editImage
                        )}
                        <img src={saveImage} alt="" className="save-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")} />
                        {(() => {
                          // Test Input only makes sense on typeable elements (inputs, selects,
                          // textareas). For links / buttons / anchors the element can't accept
                          // text, so we hide that button and keep Test Click only.
                          const tag = (elementDTO.tagName || "").toLowerCase();
                          const isTypeable = tag === "input" || tag === "select" || tag === "textarea";
                          return isTypeable ? (
                            <img src={testInputImage} alt="Test Input" title="Test Input" className="test-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_INPUT_DTO")} />
                          ) : null;
                        })()}
                        <img src={clickTestImage} alt="Test Click" title="Test Click" className="test-button" onClick={(event) => handleRowSelectedClick(event, elementDTO, "TEST_CLICK_DTO")} />
                        <img src={crossImage} alt="" className="cross-button" onClick={() => handleRemoveElementDTO(elementDTO)} />
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            );
          });
          })()}
        </>
      )}
    </div>
  );
};

export default GridItemScann;
