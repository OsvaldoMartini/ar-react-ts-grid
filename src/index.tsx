import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import instructionsMockData, { botJobMockData, ComponentsInstructionsDTO, elementsDTOMockData } from './components/instructionsMockData';
import GridItemScann from './components/GridItemScann';
import GridItem from './components/GridItem';
import { BlockLoopInstructionLoadDTO, BotJobData, ComplexMessage, ElementDTO } from './components/instructionsMockData';
import AlertModal from './components/AlertModal';
import constructionImage from './assets/construction.png';
import GridItemComp from './components/GridItemComp';
import GridItemScannMobile from './components/GridItemScannMobile';
import ApiTestToolAI from './components/ApiTestToolAI';
import ApiTestToolAINew from './components/ApiTestToolAINew';
import OrganizationManager from './components/OrganizationManager';
import MainDashboard from './components/MainDashboard';
import NewBotJobManager from './components/NewBotJobManager';
import CloneJobManager from './components/CloneJobManager';
import ConfigManager from './components/ConfigManager';
import LicenseManager from './components/LicenseManager';
import AboutPanel from './components/AboutPanel';
import DesktopWorkspaceShell from './components/workspace/DesktopWorkspaceShell';
import ActivationRequired from './components/ActivationRequired';
import OCRConfigWorkspace from './components/ocr/OCRConfigWorkspace';
import OCRResultsWorkspace from './components/ocr/OCRResultsWorkspace';
import {
  OCR_CONFIG_WORKSPACE_KIND,
  OCR_CONFIG_WORKSPACE_SESSION_PREFIX,
  OCR_RESULTS_WORKSPACE_KIND,
  OCR_RESULTS_WORKSPACE_SESSION_PREFIX,
  PRE_SCANNER_GRID_SESSION_ID,
  SCANNER_GRID_SESSION_ID,
} from './components/scanner/Scanner.sessions';

// Initialize the root
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const App: React.FC = () => {
  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>([]);
  const [componentsData, setComponentsData] = useState<ComponentsInstructionsDTO[]>([]);
  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(elementsDTOMockData);
  const [botJobData, setBotJobData] = useState<BotJobData>(botJobMockData);
  const [socketPort, setSocketPort] = useState<number>(0);
  const [botJobId, setBotJobId] = useState<number>(0);
  const [botJobName, setBotJobName] = useState<string>("");
  const [homeBanking, setHomeBanking] = useState<number>(0);
  const [homeBankName, setHomeBankName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [errorFlag, setErrorFlag] = useState<boolean>(false)  //(SENDER: insertTool) -> botJobTasks-1 -> componentTasks  -> capiApiTestToolAI
  const [alertImage, setAlertImage] = useState(constructionImage);
  const [alertClass, setAlertClass] = useState('construction-image')
  const [alertMessageHeader, setAlertMessageHeader] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);


  const handleClose = () => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
  };

  // Every navigation button used to work by Java calling window.receiveDataFromJava directly into
  // an embedded JCEF browser. That bridge is gone; navigation now arrives as a "react.session.open"
  // WebSocket message (on whichever session sent the triggering request), telling the shell which
  // session/port to switch to. Every top-level view that can trigger navigation gets this callback.
  const onSessionOpen = useCallback((targetSession: string, port: number, nextBotJobId?: number) => {
    setSocketPort(port);
    setSessionId(targetSession);
    if (nextBotJobId !== undefined && nextBotJobId !== -9999) {
      setBotJobId(nextBotJobId);
    }
  }, []);

  // A Bot Job opened by the Java host gets its own Chromium application window. Its URL carries
  // the job id directly, so the address-bar-free shell can bootstrap without another handshake.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const openOcr = search.get('openOcr');
    const ocrSession = search.get('ocrSession');
    if (openOcr || ocrSession) {
      const validConfig = openOcr === OCR_CONFIG_WORKSPACE_KIND
        && Boolean(
          ocrSession?.startsWith(OCR_CONFIG_WORKSPACE_SESSION_PREFIX)
          && ocrSession.length > OCR_CONFIG_WORKSPACE_SESSION_PREFIX.length,
        );
      const validResults = openOcr === OCR_RESULTS_WORKSPACE_KIND
        && Boolean(
          ocrSession?.startsWith(OCR_RESULTS_WORKSPACE_SESSION_PREFIX)
          && ocrSession.length > OCR_RESULTS_WORKSPACE_SESSION_PREFIX.length,
        );
      if (!ocrSession || (!validConfig && !validResults)) {
        console.error('Rejected invalid detached OCR workspace route.');
        return;
      }
      onSessionOpen(ocrSession, Number(window.location.port));
      return;
    }

    const openBotJobId = search.get('openBotJob');
    if (!openBotJobId) return;
    const parsedBotJobId = Number(openBotJobId);
    onSessionOpen('botJobTasks', Number(window.location.port), Number.isNaN(parsedBotJobId) ? undefined : parsedBotJobId);
  }, [onSessionOpen]);

  // Bootstrap over WebSocket: the shell opens a short-lived handshake connection under its own
  // session id ("mainDashboardBootstrap", never a real target session) and waits for the initial
  // "react.session.open" reply to learn which session/port to start on. It closes right after so
  // the real session (e.g. MainDashboard's own socket) can register under that id without
  // colliding with this one. Skipped entirely for a Bot Job app window (see above).
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (search.has('openBotJob') || search.has('openOcr') || search.has('ocrSession')) return;
    const ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}/websocket?sessionId=mainDashboardBootstrap`);

    ws.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope?.operationId !== 'react.session.open') return;
        const body = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope.body;
        onSessionOpen(body.targetSession, body.port, body.botJobId);
      } catch (error) {
        console.error('Error parsing bootstrap WebSocket message:', error);
      } finally {
        ws.close();
      }
    };

    ws.onerror = (error) => {
      console.error('Bootstrap WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [onSessionOpen]);

  useEffect(() => {
    (window as any).receiveDataFromJava = (
      jsonData: string,
      socketPort: number,
      sessionIdFromJava: string,
      homeBanking: number,
      homeBankName: string,
      botJobId: number,
      botJobName: string
    ) => {
      try {
        console.log("sessionIdFromJava", sessionIdFromJava);

        const dataLoad = JSON.parse(jsonData);

        setSocketPort(socketPort);
        setSessionId(sessionIdFromJava);
        if (homeBanking !== -9999) {
          setHomeBanking(homeBanking);
          setHomeBankName(homeBankName);
        }
        if (botJobId !== -9999) {
          setBotJobId(botJobId);
        }
        setBotJobName(botJobName);

        // keep your resets
        setInstructionsData([] as BlockLoopInstructionLoadDTO[]);
        setComponentsData([] as BlockLoopInstructionLoadDTO[]);
        setElementDTO([] as ElementDTO[]);

        if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("botJobTasks")) {
          setInstructionsData(dataLoad as BlockLoopInstructionLoadDTO[]);
        } else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("componentTasks")) {
          setComponentsData(dataLoad as BlockLoopInstructionLoadDTO[]);
        } else if (
          Array.isArray(dataLoad)
          && dataLoad.length > 0
          && sessionIdFromJava.includes(PRE_SCANNER_GRID_SESSION_ID)
        ) {
          setElementDTO(dataLoad as ElementDTO[]);
        } else if (
          Array.isArray(dataLoad)
          && dataLoad.length > 0
          && sessionIdFromJava.includes(SCANNER_GRID_SESSION_ID)
        ) {
          // existing desktop scanner
          setElementDTO(dataLoad as ElementDTO[]);
        } else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("mobileScannerGrid")) {
          // NEW: mobile scanner
          setElementDTO(dataLoad as ElementDTO[]);
        } else {
          console.error('Unknown data format');
        }
      } catch (error) {
        console.error('Error parsing jsonData:', error);
      }
    };
  }, []);



  // useEffect(() => {

  //   if (sessionId) {
  //     setAlertMessageHeader("DATA  ElementDTO " + elementDTO.length);
  //     setAlertMessageBody("DATA  InstructionLoadDTO " + instructionsData.length);
  //     setAlertMessageFooter("ReceiveDataFromJava Socket " + socketPort + " - " + sessionId);
  //   }

  // }, [sessionId]);

  return (
    <React.StrictMode>
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
      {sessionId && (sessionId.includes("botJobTasks")) && (
        <DesktopWorkspaceShell ariaLabel="Bot Job Details" testId="bot-job-details-workspace">
          <GridItem homeBankingIdInitial={homeBanking} data={instructionsData} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} onSessionOpen={onSessionOpen} />
        </DesktopWorkspaceShell>
      )}
      {sessionId && (sessionId.includes("componentTasks")) && (
        <DesktopWorkspaceShell ariaLabel="Bot Job Components" testId="bot-job-components-workspace">
          <GridItemComp homeBankingIdInitial={homeBanking} dataComp={componentsData} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} onSessionOpen={onSessionOpen} />
        </DesktopWorkspaceShell>
      )}
      {/* Guard against scanner/pre-scan double-mounting. */}
      {sessionId
        && sessionId.includes(SCANNER_GRID_SESSION_ID)
        && !sessionId.includes(PRE_SCANNER_GRID_SESSION_ID) && (
        <DesktopWorkspaceShell ariaLabel="Page Scanner Grid" testId="page-scanner-workspace">
          <GridItemScann homeBankingIdInitial={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} onSessionOpen={onSessionOpen} />
        </DesktopWorkspaceShell>
      )}
      {sessionId && (sessionId.includes(PRE_SCANNER_GRID_SESSION_ID)) && (
        <DesktopWorkspaceShell ariaLabel="Page Scanner Grid" testId="pre-scan-workspace">
          <GridItemScann mode="preScan" homeBankingIdInitial={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} onSessionOpen={onSessionOpen} />
        </DesktopWorkspaceShell>
      )}
      {sessionId.startsWith(OCR_CONFIG_WORKSPACE_SESSION_PREFIX) && (
        <DesktopWorkspaceShell ariaLabel="OCR configuration" testId="ocr-config-window">
          <OCRConfigWorkspace socketPort={socketPort} sessionId={sessionId} />
        </DesktopWorkspaceShell>
      )}
      {sessionId.startsWith(OCR_RESULTS_WORKSPACE_SESSION_PREFIX) && (
        <DesktopWorkspaceShell ariaLabel="OCR test results" testId="ocr-results-window">
          <OCRResultsWorkspace socketPort={socketPort} sessionId={sessionId} />
        </DesktopWorkspaceShell>
      )}
      {sessionId && (sessionId.includes("mobileScannerGrid")) && (
        <GridItemScannMobile homeBankingIdInitial={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} />
      )}

      {sessionId && (sessionId.includes("organizationManager")) && (
        <OrganizationManager socketPort={socketPort} sessionId={sessionId} />
      )}

      {sessionId && (sessionId.includes("mainDashboard")) && (
        <MainDashboard socketPort={socketPort} sessionId={sessionId} onSessionOpen={onSessionOpen} />
      )}

      {sessionId && (sessionId.includes("newBotJobManager")) && (
        <NewBotJobManager socketPort={socketPort} sessionId={sessionId} onSessionOpen={onSessionOpen} />
      )}

      {sessionId && sessionId.includes("cloneJobManager") && (
        <CloneJobManager socketPort={socketPort} sessionId={sessionId} sourceBotJobId={botJobId} onSessionOpen={onSessionOpen} />
      )}

      {sessionId && (sessionId.includes("configManager")) && (
        <ConfigManager socketPort={socketPort} sessionId={sessionId} />
      )}
      {sessionId && sessionId.includes("licenseManager") && (
        <LicenseManager socketPort={socketPort} sessionId={sessionId} />
      )}
      {sessionId && sessionId.includes("aboutPanel") && (
        <AboutPanel socketPort={socketPort} sessionId={sessionId} onSessionOpen={onSessionOpen} />
      )}
      {sessionId && sessionId.includes("activationRequired") && (
        <ActivationRequired socketPort={socketPort} sessionId={sessionId} />
      )}

      {/* ── NEW: ApiTestTool – same props shape as GridItem / GridItemComp ── */}
      {sessionId && sessionId.includes("apiTestToolAI") && (
        <ApiTestToolAI
          homeBankingIdInitial={homeBanking}
          homeBankNameInitial={homeBankName}
          socketPort={socketPort}
          sessionId={sessionId}
          botJobIdInitial={botJobId}
          botJobNameInitial={botJobName}
        />
      )}

      {/* ── Avaloq API Test Simulator ── */}
      {sessionId && sessionId.includes("capiApiTestToolAI") && (
        <ApiTestToolAINew
          homeOrgIdInitial={homeBanking}
          homeOrgNameInitial={homeBankName}
          socketPort={socketPort}
          sessionId={sessionId}
          botJobIdInitial={botJobId}
          botJobNameInitial={botJobName}
        />
      )}


    </React.StrictMode>
  );
};

// Render the App component
root.render(<App />);

// Report web vitals
reportWebVitals();
