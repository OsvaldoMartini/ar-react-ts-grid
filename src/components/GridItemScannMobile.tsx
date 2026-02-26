import React, { useState, useEffect, useRef } from 'react';
import { BotJobLoadDTO, ComplexMessage, ElementDTO } from './instructionsMockData';
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
import activeImage from '../assets/active3.png';
import inactiveImage from '../assets/inactive2.png';

import AlertModal from './AlertModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';
import './griditem.scss';
import NameDropdown from './NameDropdown';

interface GridItemScannMobileProps {
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

const GridItemScannMobile: React.FC<GridItemScannMobileProps> = ({ homeBankingIdInitial, botJobIdInitial, botJobNameInitial, dataDTO, socketPort, sessionId }) => {
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
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingElementTagName, setEditingElementTagName] = useState<string | null>(null);
  const [elementName, setElementName] = useState<string>('');
  const [isSendingAll, setIsSendingAll] = useState(false);
  // below existing useState hooks
  const [isSendingDevice, setIsSendingDevice] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true); // disabled by default
  const [isSendingDiscovery, setIsSendingDiscovery] = useState(false);
  const [isSendingScanner, setIsSendingScanner] = useState(false);

  const [appQueryApp, setappQueryApp] = useState<string>("ebanking");
  const [appQueryPackage, setappQueryPackage] = useState<string>("ch.bsct.ebanking.mobile");
  const [appMainActivity, setAppMainActivity] = useState<string>("");
  const [packagesFound, setPackagesFound] = useState<string[]>([]);
  const [scrollStep, setScrollStep] = useState<number>(0);
  const [scannerType, setScannerType] = useState<string>("UiAutomator2");
  const [findText, setFindText] = useState<string>('');

  const mapElementForSend = (el: ElementDTO): ElementDTO => el;

  const isActive = (v?: string) => v === "active";
  const toggleFlag = (value?: string) => (value === "active" ? "" : "active");

  type ValidatePayload = {
    sourceImage?: string;
    fields?: Record<string, { value?: string; confidence?: number }>;
  };

  // holds the latest json received (your sample)
  const [validatePayload, setValidatePayload] = useState<ValidatePayload | null>(null);

  // what’s checked in the UI
  const [validateChecked, setValidateChecked] = useState<Record<string, boolean>>({});


  // dropdown open/close
  const [validateOpen, setValidateOpen] = useState(false);

  const validateKeys = React.useMemo(
    () => Object.keys(validatePayload?.fields ?? {}).sort((a, b) => a.localeCompare(b)),
    [validatePayload?.fields]
  );

  const toggleValidate = (key: string) => {
    setValidateChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  const checkedCount = validateKeys.reduce(
    (acc, key) => acc + (validateChecked[key] ? 1 : 0),
    0
  );

  // const checkedCount = Object.values(validateChecked).filter(Boolean).length;
  // const checkedCount = Object.values(validateChecked).filter(Boolean).length;

  type FieldsToValidateDTO = {
    value: string;
    confidence?: number;
  };

  const buildFieldsToValidate = (): Record<string, FieldsToValidateDTO> => {
    const fields = validatePayload?.fields ?? {};
    const out: Record<string, FieldsToValidateDTO> = {};

    Object.entries(fields).forEach(([key, field]) => {
      if (!validateChecked[key]) return;
      if (!field?.value?.trim()) return;

      out[key] = {
        value: field.value,
        confidence: field.confidence,
      };
    });

    return out;
  };



  // --- ⬇⬇ PLACE IT HERE ⬇⬇ ---
  const isPackageSelectionRequired =
    packagesFound.length > 0 &&
    (!appQueryPackage || appQueryPackage.trim() === "");

  // GridItemScannMobile.tsx
  const elementDTORef = useRef<HTMLInputElement>(null);

  // Inside your component:
  const [hoveredRow, setHoveredRow] = useState<ElementDTO | null>(null);
  const [hoveredRowsList, setHoveredRowsList] = useState<ElementDTO[]>([]);

  const [botJobs, setBotJobs] = useState<BotJobLoadDTO[]>([]);
  const [selectedJob, setSelectedJob] = useState<BotJobLoadDTO | null>(null);
  const [isBotJobRunning, setIsBotJobRunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    if (scannerType !== "KeepAlive") return;

    console.log("[KeepAlive] enabled – CONNECT DEVICE every 4 minutes");

    const TWO_MINUTES = 4 * 60 * 1000; // 240000 ms

    const id = window.setInterval(() => {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
        console.warn("[KeepAlive] websocket not open – skip");
        return;
      }

      console.log("[KeepAlive] tick → sending ATTACHED_DEVICE");
      handleConnectDeviceClick();
    }, TWO_MINUTES);

    return () => {
      console.log("[KeepAlive] stopped");
      window.clearInterval(id);
    };
  }, [scannerType, webSocket]);


  useEffect(() => {
    if (!isSendingAll && !isSendingDevice && !isSendingDiscovery && !isSendingScanner && !isSendingScanner && !isBotJobRunning) return;
    const t = setTimeout(() => {
      setIsSendingAll(false);
      setIsSendingDevice(false);
      setIsSendingDiscovery(false);
      setIsSendingScanner(false);
      setIsBotJobRunning(false);
      setIsRefreshing(false);
    }, 15000); // 15s fallback
    return () => clearTimeout(t);
  }, [isSendingAll, isSendingDevice, isSendingDiscovery, isSendingScanner, isSendingScanner, isBotJobRunning]);

  useEffect(() => {
    const q = findText.trim().toLowerCase();
    const newBlockPages: Record<string, number> = {};

    Object.entries(elementGrouped).forEach(([typeElement, elementData]) => {
      const filteredElements = !q
        ? elementData.elements
        : elementData.elements.filter((el) =>
          (el.someText ?? "").toLowerCase().includes(q)
        );

      newBlockPages[typeElement] = Math.max(1, Math.ceil(filteredElements.length / blockRowsPerPage));
    });

    setBlockPages(newBlockPages);
  }, [elementGrouped, blockRowsPerPage, findText]);

  useEffect(() => {
    console.log("Updated elementGrouped:", elementGrouped);
  }, [elementGrouped]);


  useEffect(() => {
    if (messages.length === 0) return;

    const last10 = messages.slice(-10);
    const lastMessage = last10[last10.length - 1];
    console.log("RECEIVED -> Last WebSocket message ", lastMessage);

    const tryParse = (val: any) => {
      if (typeof val !== "string") return val;
      try { return JSON.parse(val); } catch { return val; }
    };

    try {
      const parsedMessage = JSON.parse(lastMessage);

      if (typeof parsedMessage?.homeBankingId === "number" && parsedMessage.homeBankingId !== -9999) {
        setHomeBankingId(parsedMessage.homeBankingId);
      }

      const acceptedSessions = new Set([
        sessionId,
        "mobile-return-server",
      ]);
      if (!acceptedSessions.has(parsedMessage.sessionId)) return;

      const bodyData = tryParse(parsedMessage.body);

      switch (parsedMessage.operationId) {
        case "validateFields": {
          const fieldsObj =
            typeof bodyData === "string" ? JSON.parse(bodyData) : bodyData;

          setValidatePayload({ fields: fieldsObj });

          // ✅ AUTO-CHECK fields that exist
          const initialChecked: Record<string, boolean> = {};

          Object.keys(fieldsObj ?? {}).forEach((key) => {
            initialChecked[key] = !!fieldsObj[key]?.value;
          });

          setValidateChecked(initialChecked);


          break;
        }


        // ---------- NEW: receive BotJobs list ----------
        case "botJobList": {
          // Body may be either an array or an object like { list: [...]} or { botJobs: [...] }
          const list =
            Array.isArray(bodyData) ? bodyData :
              Array.isArray(bodyData?.list) ? bodyData.list :
                Array.isArray(bodyData?.botJobs) ? bodyData.botJobs :
                  Array.isArray(bodyData?.botJobList) ? bodyData.botJobList : [];

          // Type it as BotJobLoadDTO[]
          setBotJobs(list as BotJobLoadDTO[]);

          // OPTIONAL: auto-select the first job by name if you want
          // if ((list as BotJobLoadDTO[]).length > 0) {
          //   const firstName = (list as BotJobLoadDTO[])[0].name ?? "Create New Bot Job";
          //   setSelectedJobOption(firstName);
          // }
          setSelectedJob(null);
          setIsRefreshing(false);
          break;
        }

        // ---------- EXISTING FLOWS ----------
        case "searchTerms": {
          setIsSendingAll(false);
          const detailsData = Array.isArray(bodyData?.details) ? bodyData.details : [];
          if (detailsData.length === 0) {
            setElementDTO([]);
            setElementGrouped({});
            if (bodyData?.homeBankingId !== -9999) {
              setHomeBankingId(bodyData?.homeBankingId);
            }
            if (bodyData?.botJobId !== -9999) {
              setBotJobId(bodyData?.botJobId);
              setBotJobName(bodyData?.botJobName);
            }
          } else {
            setElementDTO(detailsData);
          }
          break;
        }

        case "clonedElement":
        case "addPickOne": {
          setIsSendingAll(false);
          const newElements = bodyData?.elementDetails;
          if (bodyData?.homeBankingId !== -9999) {
            setHomeBankingId(bodyData?.homeBankingId);
          }
          if (bodyData?.botJobId !== -9999) {
            setBotJobId(bodyData?.botJobId);
            setBotJobName(bodyData?.botJobName);
          }

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

        case "activate-all-buttons": {
          setIsSendingAll(false);
          setIsSendingDevice(false);
          setIsSendingDiscovery(false);
          setIsSendingScanner(false);
          setIsBotJobRunning(false);
          break;
        }
        case "activate-insert-all": {
          setIsSendingAll(false);
          break;
        }
        case "activate-connect-device": {
          setIsSendingDevice(false);
          break;
        }
        case "activate-discovery-app": {
          setIsSendingDiscovery(false);
          const splitDTO = bodyData.splitDTO;
          if (!splitDTO) return;

          // --- SET MAIN ACTIVITY (if backend sent it) ---
          if (splitDTO.appMainActivity) {
            setAppMainActivity(splitDTO.appMainActivity);
          }

          // --- SET MAIN PACKAGE ---
          if (splitDTO.appQueryPackage) {
            setappQueryPackage(splitDTO.appQueryPackage);
          }

          // --- SET DROPDOWN LIST ---
          if (Array.isArray(splitDTO.packagesFound)) {
            setPackagesFound(splitDTO.packagesFound);
          }

          break;
        }
        case "activate-scanner-app": {
          setIsSendingScanner(false);
          break;
        }

        case "activate-running-bot-job": {
          // Optional: if backend returns ids/names, sync them
          if (typeof bodyData?.homeBankingId === "number" && bodyData.homeBankingId !== -9999) {
            setHomeBankingId(bodyData.homeBankingId);
          }

          if (typeof bodyData?.botJobId === "number" && bodyData.botJobId !== -9999) {
            setBotJobId(bodyData.botJobId);
            if (typeof bodyData?.botJobName === "string") {
              setBotJobName(bodyData.botJobName);
            }
          }

          // Stop the spinner / unlock the button
          setIsBotJobRunning(false);
          break;
        }

        default:
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
      type: "ATTACHED_DEVICE",
      homeBankingId,
      botJobId,
      botJobName,
      sessionId: "mobile-return-server",
      appQueryApp,        // e.g. "InLinea"
      appQueryPackage,    // e.g. "ch.bsct.ebanking.mobile" or dropdown selection
      appMainActivity,
      scannerType
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent ATTACHED_DEVICE:", message);
    } catch (err) {
      console.error("❌ Error sending ATTACHED_DEVICE:", err);
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
      sessionId: "mobile-return-server",
      appQueryApp,
      appQueryPackage,
      scannerType
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
      sessionId: "mobile-return-server",
      scrollTimes: scrollStep,
      scannerType,
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent SCANNER_APP:", message);
    } catch (err) {
      console.error("❌ Error sending SCANNER_APP:", err);
      setIsSendingScanner(false);
    }
  };

  const handleClearDataClick = () => {
    // Clear data + dependent state
    setElementDTO([]);
    setElementGrouped({});
    setIsElementGrouped(false);

    // Optional quality-of-life resets
    setBlockPages({});
    setBlockCurrentPages({});
    setHoveredRow(null);
    setHoveredRowsList([]);
  };

  // 1) Add this small helper anywhere inside the component (top-level, before returns)
  const showSelectJobAlert = () => {
    setAlertImage(warningRedImage);
    setAlertClass('construction-image');
    setAlertMessageHeader('No Bot Job selected');
    setAlertMessageBody(
      'Please select or create a Bot Job using AR Web Server / Scanner, then try again.'
    );
    setAlertMessageFooter(null);
    setErrorFlag(true);
  };

  const refreshBotJobs = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    const message = {
      type: "MOBILE_LOAD_JOBS",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    };

    try {
      setIsRefreshing(true);
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent refreshBotJobs:", message);
      setTimeout(() => setIsRefreshing(false), 2000); // brief pulse animation
    } catch (err) {
      console.error("❌ Error sending refreshBotJobs:", err);
      setIsRefreshing(false);
    }
  };

  const scrollDeviceUp = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    const message = {
      type: "MOBILE_SCROLL_UP",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent scroll up:", message);
    } catch (err) {
      console.error("❌ Error sending scroll up:", err);
    }
  };

  const scrollDeviceDown = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    const message = {
      type: "MOBILE_SCROLL_DOWN",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent scroll down:", message);
    } catch (err) {
      console.error("❌ Error sending scroll down:", err);
    }
  };

  const sendMobileBack = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    webSocket.send(JSON.stringify({
      type: "MOBILE_BACK",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    }));
  };


  const sendMobileCloseAll = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    webSocket.send(JSON.stringify({
      type: "MOBILE_CLOSE_ALL",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
      appQueryApp,
      appQueryPackage,
    }));
  };

  const sendMobileHome = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    webSocket.send(JSON.stringify({
      type: "MOBILE_HOME",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    }));
  };

  const sendMobileRecents = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    webSocket.send(JSON.stringify({
      type: "MOBILE_RECENTS",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    }));
  };

  const sendDoneCmd = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    const message = {
      type: "MOBILE_NEXT_DONE",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent next done:", message);
    } catch (err) {
      console.error("❌ Error sending next done:", err);
    }
  };

  const sendCloseKeyboardCmd = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;

    const message = {
      type: "MOBILE_CLOSE_KEYBOARD",
      homeBankingId: -9999,
      botJobId: -9999,
      sessionId: "mobile-return-server",
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent next done:", message);
    } catch (err) {
      console.error("❌ Error sending next done:", err);
    }
  };

  const handleLaunchBotJobClick = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
    if (!selectedJob) return;

    setIsBotJobRunning(true);

    const message = {
      type: "LAUNCH_BOT_JOB_TEST",       // or your actual type
      homeBankingId,                     // updated from selected job
      botJobId,                          // updated from selected job
      botJobName,                        // updated from selected job
      sessionId: "mobile-return-server",
      selectedJobName: selectedJob.name, // optional
      // ✅ array of VALUES that are checked
      fieldsToValidate: buildFieldsToValidate(),
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent LAUNCH_BOT_JOB_TEST:", message);
    } catch (err) {
      console.error("❌ Error:", err);
      setIsBotJobRunning(false);
    }
  };


  const handlesSendAllClick = () => {
    console.log("handleSendAllClick: Sending all ElementDTOs");

    // ❗ Block if no Bot Job is selected
    if (!selectedJob) {
      showSelectJobAlert();
      return;
    }

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
      sessionId: `mobile-return-server`,
      elementDetails: allElements.map(mapElementForSend),
    };

    try {
      webSocket.send(JSON.stringify(message));
      console.log("📤 Sent CREATE all ElementDTOs:", message);
    } catch (error) {
      console.error("❌ Error sending WebSocket message:", error);
      setIsSendingAll(false); // re-enable if send fails
    }
  };

  const handleActiveDeviceEnter = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    targetElement: ElementDTO
  ) => {
    event.stopPropagation();

    setElementDTO((prev) =>
      prev.map((el) =>
        el.id === targetElement.id
          ? { ...el, autoEnter: toggleFlag(el.autoEnter) }
          : el
      )
    );

    setIsElementGrouped(false);
  };

  const handleActiveDeviceScroll = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    targetElement: ElementDTO
  ) => {
    event.stopPropagation();

    // ❗ Block if no Bot Job is selected
    // if (!selectedJob) {
    //   showSelectJobAlert();
    //   return;
    // }

    // Toggle logic: if already "active", clear it, otherwise set it
    setElementDTO((prev) =>
      prev.map((el) =>
        el.id === targetElement.id
          ? { ...el, autoScroll: toggleFlag(el.autoScroll) }
          : el
      )
    );

    // force regroup if you rely on autoScroll for grouping later
    setIsElementGrouped(false);
  };


  const handleRowSelectedClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    elementDTO: ElementDTO,
    action: string
  ) => {
    event.stopPropagation();

    // ❗ Block if no Bot Job is selected
    if (!selectedJob) {
      showSelectJobAlert();
      return;
    }

    sendWebSocketMessage(elementDTO, action);
    console.log("ENTER:", elementDTO.autoEnter);
    console.log("SCROLL:", elementDTO.autoScroll);

  };


  const sendWebSocketMessage = (elementDTO: ElementDTO, action: string) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.warn("🚨 WebSocket is not connected. Cannot send message.");
      return;
    }
    // const sessionDestine = action === "HOVERED_ROW"
    //   ? `scannerTool-${homeBankingId}`
    //   : `mobile-return-server-${homeBankingId}`;

    const sessionDestine = action === "HOVERED_ROW"
      ? `mobile-return-server`
      : `mobile-return-server`;

    const message = {
      type: action,
      homeBankingId: homeBankingId,
      botJobId: selectedJob!.botJobId || botJobId,
      botJobName: selectedJob!.name || botJobName,
      sessionId: sessionDestine,
      elementDetails: [mapElementForSend(elementDTO)],
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

  const filteredGroupedEntries = React.useMemo(() => {
    const q = findText.trim().toLowerCase();
    const entries = Object.entries(elementGrouped);

    if (!q) return entries;

    return entries.filter(([typeElement, elementData]) => {
      // blockName match (string)
      const blockName = (getElementBlockText(typeElement) ?? "").toLowerCase();
      const blockMatch = blockName.includes(q);

      // instruction name match (someText)
      const instructionMatch = (elementData.elements ?? []).some((el) =>
        (el.someText ?? "").toLowerCase().includes(q)
      );

      return blockMatch || instructionMatch;
    });
  }, [elementGrouped, findText]);

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

        {/* ================= ROW 1 ================= */}
        <div className="toolbar-row toolbar-row-top">
          <button
            className={`buttons-toolbar ${isSendingDevice ? 'sending' : ''}`}
            onClick={handleConnectDeviceClick}
            disabled={isSendingDevice || isPackageSelectionRequired}
          >
            {isSendingDevice ? 'Connecting…' : 'Connect Device'}
          </button>

          <input
            type="text"
            className="toolbar-input input-app-name"
            placeholder="eBanking"
            value={appQueryApp}
            onChange={(e) => setappQueryApp(e.target.value)}
          />

          {packagesFound.length > 0 ? (
            <select
              className="toolbar-input select-package-name"
              value={appQueryPackage}
              onChange={(e) => setappQueryPackage(e.target.value)}
            >
              <option value="">Select package...</option>
              {packagesFound.map((pkg) => (
                <option key={pkg} value={pkg}>{pkg}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="toolbar-input input-package-name"
              placeholder="ch.bsct.ebanking.mobile"
              value={appQueryPackage}
              onChange={(e) => setappQueryPackage(e.target.value)}
            />
          )}

          <button
            className={`buttons-toolbar ${isSendingDiscovery ? 'sending' : ''}`}
            onClick={handleDiscoveryAppClick}
            disabled={isSendingDiscovery}
          >
            {isSendingDiscovery ? 'Discovering…' : 'Discovery App'}
          </button>

          <button
            className={`buttons-toolbar ${isSendingScanner ? 'sending' : ''}`}
            onClick={handleScannAppClick}
            disabled={isSendingScanner || isPackageSelectionRequired}
          >
            {isSendingScanner ? 'Scanning…' : 'Scanner'}
          </button>

          <select
            className="scroll-select"
            value={scannerType}
            onChange={(e) => setScannerType(e.target.value)}
            disabled={isSendingScanner || isPackageSelectionRequired}
            title="Select scanner engine"
          >
            <option value="UiAutomator2">Android</option>
            <option value="KeepAlive">Keep Alive</option>
          </select>

          <button
            className="buttons-toolbar danger"
            onClick={handleClearDataClick}
            disabled={elementDTO.length === 0}
            title={elementDTO.length === 0 ? "No data to clear" : "Clear all scanned elements"}
          >
            Clear Data
          </button>
        </div>

        {/* ================= ROW 2 ================= */}
        <div className="toolbar-row toolbar-row-bottom">

          {/* ---- LEFT: Navigation + Scrolling ---- */}
          <div className="toolbar-left">
            <div className="scroll-select-group">
              <span className="scroll-label">Navigation</span>

              <div className="scroll-buttons inline nav-buttons">
                <button type="button" className="buttons-toolbar nav-btn recents" onClick={sendMobileRecents}>(≡)</button>
                <button type="button" className="buttons-toolbar nav-btn home" onClick={sendMobileHome}>(○)</button>
                <button type="button" className="buttons-toolbar nav-btn back" onClick={sendMobileBack}>(←)</button>
                <button type="button" className="buttons-toolbar nav-btn close-all" onClick={sendMobileCloseAll}>(✕)</button>
              </div>

              <span className="scroll-label">Scrolling</span>

              <div className="scroll-buttons inline">
                <button type="button" className="buttons-toolbar scroll-btn scroll-up" onClick={scrollDeviceUp}>▲</button>
                <button type="button" className="buttons-toolbar scroll-btn scroll-down" onClick={scrollDeviceDown}>▼</button>
              </div>

              {/* NEXT / DONE button */}
              <div className="scroll-buttons inline">
                <span className="scroll-label">NEXT/DONE</span>

                <button
                  type="button"
                  className="buttons-toolbar nav-btn next-done"
                  onClick={sendDoneCmd}
                >
                  →|
                </button>
              </div>


              {/* Close Keyboard button */}
              <div className="scroll-buttons inline">
                <span className="scroll-label">Close Keyboard</span>

                <button
                  type="button"
                  className="buttons-toolbar nav-btn close-keyboard"
                  onClick={sendCloseKeyboardCmd}
                >
                  X
                </button>
              </div>
            </div>
          </div>

          {/* ---- RIGHT: Validate + Bot Job + Launch ---- */}
          <div className="toolbar-right">
            {/* <span className="toolbar-separator" aria-hidden="true" /> */}

            <div className="toolbar-inline validate-inline">
              <span className="toolbar-label">Validate (CSV/PDF):</span>

              <div className="validate-dropdown">
                <button
                  type="button"
                  className="buttons-toolbar validate-trigger"
                  onClick={() => setValidateOpen((v) => !v)}
                  disabled={!validatePayload?.fields}
                >
                  {validatePayload?.fields ? `Select (${checkedCount})` : "No data"}
                </button>

                {validateOpen && (
                  <div className="validate-menu">
                    {Object.entries(validatePayload?.fields ?? {}).map(([key, field]) => (
                      <label key={key} className="validate-item">
                        <input
                          type="checkbox"
                          checked={!!validateChecked[key]}
                          onChange={() => toggleValidate(key)}
                        />
                        <span className="validate-item-text">
                          <strong>{key}</strong>
                          <span className="validate-item-value"> {field?.value}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="toolbar-inline">

              <select
                className="toolbar-select"
                value={selectedJob ? String(selectedJob.botJobId ?? selectedJob.id ?? selectedJob.name) : ""}
                onChange={(e) => {
                  const key = e.target.value;
                  const job = botJobs.find(j => String(j.botJobId ?? j.id ?? j.name) === key) ?? null;
                  setSelectedJob(job);

                  setBotJobId(job?.botJobId ?? job?.id ?? null);
                  setBotJobName(job?.name ?? null);
                  if (job?.homeBankingId != null && job?.homeBankingId !== -9999) {
                    setHomeBankingId(job.homeBankingId);
                  }
                }}
                aria-label="Bot Job Presets"
              >
                <option value="">Select a Bot Job</option>
                {botJobs.map(j => (
                  <option
                    key={(j.botJobId ?? j.id ?? j.name) as React.Key}
                    value={String(j.botJobId ?? j.id ?? j.name)}
                  >
                    {j.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={`buttons-toolbar ${isRefreshing ? "sending" : ""}`}
                onClick={refreshBotJobs}
              >
                ↻
              </button>
            </div>

            <button
              className={`buttons-toolbar ${isBotJobRunning ? 'sending' : ''}`}
              onClick={handleLaunchBotJobClick}
              disabled={isBotJobRunning || !selectedJob}
            >
              {isBotJobRunning ? 'Running…' : 'Launch Test'}
            </button>
          </div>
        </div>
        {/* FIND ROW (same as GridItem) */}
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
      </div>

      {/* === BELOW TOOLBAR === */}
      {elementDTO.length === 0 ? (
        // Empty state uses the scrollable area too
        <div className="grid-content">
          <div className="block">
            <div className="block-header color-component2">Scanned Web Elements</div>
            <div className="instruction-item"> </div>
            <div className="block">
              <div className="no-data-message">No data found</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* SECOND FIXED ROW: Insert All / Attributes / Pagination */}
          <div className="controls-row fixed-controls-row">
            <button
              className={`send-all-button ${isSendingAll ? 'sending' : ''}`}
              onClick={handlesSendAllClick}
              disabled={isSendingAll || !selectedJob}
            >
              {isSendingAll ? 'Sending...' : 'Insert All Elements'}
            </button>

            <button
              className="attributes-button"
              onClick={() => setShowAttributes(!showAttributes)}
            >
              {showAttributes ? 'Hide Attributes' : 'Show Attributes'}
            </button>

            <div className="pagination-controls">
              <label>Rows per page: </label>
              <select
                value={blockRowsPerPage}
                onChange={(e) => setBlockRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>


          {/* SCROLLABLE GRID ONLY */}
          <div className="grid-scroll">
            <div className="grid-content">
              {filteredGroupedEntries.map(([typeElement, elementData], index) => {
                const q = findText.trim().toLowerCase();

                const filteredElements = !q
                  ? elementData.elements
                  : elementData.elements.filter((el) =>
                    (el.someText ?? "").toLowerCase().includes(q)
                  );

                const totalPages = Math.max(1, Math.ceil(filteredElements.length / blockRowsPerPage));
                const currentPage = Math.min(blockCurrentPages[typeElement] || 1, totalPages);

                const paginatedElements = filteredElements.slice(
                  (currentPage - 1) * blockRowsPerPage,
                  currentPage * blockRowsPerPage
                );

                return (
                  <div key={typeElement} className="block">
                    <div className="block-header color-component1">
                      <div className="block-header-left">
                        <span className="block-order-number">#{index + 1}</span>
                        <span className="block-name">{getInstructionTypeElement(typeElement)}</span>
                        <span className="block-count">({filteredElements.length})</span>
                      </div>

                      {filteredElements.length > blockRowsPerPage && (
                        <div className="bottom-pagination-controls">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => handlePrevBlockPage(typeElement)}
                          >
                            Prev
                          </button>
                          <span>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => handleNextBlockPage(typeElement)}
                          >
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
                      {paginatedElements.map((elementDTO, i) => {
                        const scrollOn = elementDTO.autoScroll === "active";
                        const enterOn = elementDTO.autoEnter === "active";
                        return (
                          <div
                            key={i}
                            className="instruction-item"
                            onMouseEnter={() => handleRowHover(elementDTO)}
                            onMouseLeave={handleRowLeave}
                          >
                            {editingElementId === elementDTO.xPath &&
                              editingElementTagName === elementDTO.tagName ? (
                              <div className="edit-container">
                                <input
                                  type="text"
                                  value={elementName}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveInstruction(elementDTO);
                                    }
                                  }}
                                  onChange={(e) => setElementName(e.target.value)}
                                  ref={elementDTORef}
                                  className="edit-textbox"
                                />
                                <img
                                  src={saveImage}
                                  alt="save"
                                  className="save-button"
                                  onClick={() => handleSaveInstruction(elementDTO)}
                                />
                              </div>
                            ) : (
                              <span className="instruction-line">
                                {getInstructionElement(elementDTO)}
                              </span>
                            )}

                            {showAttributes ? (
                              <div>
                                <AttributeDropdown
                                  dataArray={elementDTO.attributeData}
                                  onChange={handleAttributeChange}
                                />
                              </div>
                            ) : (
                              <span>{"\u00A0".repeat(20)}</span>
                            )}

                            <div className="options-column">
                              <div className="options-row">
                                {/* AUTO SCROLL */}
                                <div
                                  className={`options-toggle ${scrollOn ? "active" : "inactive"}`}
                                  onClick={(e) => handleActiveDeviceScroll(e, elementDTO)}
                                >
                                  <span className="options-toggle-label">scroll</span>
                                  <img
                                    src={scrollOn ? activeImage : inactiveImage}
                                    alt="auto scroll toggle"
                                    className="options-toggle-icon"
                                  />
                                </div>

                                {/* NEXT/ENTER */}
                                <div
                                  className={`options-toggle ${enterOn ? "active" : "inactive"}`}
                                  onClick={(e) => handleActiveDeviceEnter(e, elementDTO)}
                                >
                                  <span className="options-toggle-label">next/enter</span>
                                  <img
                                    src={enterOn ? activeImage : inactiveImage}
                                    alt="next/enter toggle"
                                    className="options-toggle-icon"
                                  />
                                </div>
                              </div>

                              {renderEditButton(elementDTO, editImage)}
                              <img
                                src={saveImage}
                                alt=""
                                className="save-button"
                                onClick={(event) =>
                                  handleRowSelectedClick(event, elementDTO, "NEW_ELEMENT_DTO")
                                }
                              />
                              <img
                                src={testInputImage}
                                alt=""
                                className="test-button"
                                onClick={(event) =>
                                  handleRowSelectedClick(event, elementDTO, "TEST_INPUT_DTO")
                                }
                              />
                              <img
                                src={clickTestImage}
                                alt=""
                                className="test-button"
                                onClick={(event) =>
                                  handleRowSelectedClick(event, elementDTO, "TEST_CLICK_DTO")
                                }
                              />
                              <img
                                src={crossImage}
                                alt=""
                                className="cross-button"
                                onClick={() => handleRemoveElementDTO(elementDTO)}
                              />
                            </div>
                          </div>
                        );
                      }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default GridItemScannMobile;
