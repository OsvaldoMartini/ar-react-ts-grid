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
import MainApplicationControl, { isMainApplicationWindow } from './components/MainApplicationControl';
import DesktopWorkspaceShell from './components/workspace/DesktopWorkspaceShell';
import NewBotJobPage from './components/NewBotJobPage';
import CloneJobPage from './components/CloneJobPage';
import ConfigPage from './components/ConfigPage';
import ATemplate from './components/ATemplate';
import InfoPage from './components/InfoPage';
import LicenseManager from './components/LicenseManager';
import ActivationRequired from './components/ActivationRequired';
import OCRConfigDetachedWorkspace from './components/ocr/OCRConfigDetachedWorkspace';
import OCRResultsDetachedWorkspace from './components/ocr/OCRResultsDetachedWorkspace';
import {
  ocrWorkspaceRetargetDisposition,
  ocrWorkspaceTargetUrl,
  type OcrWorkspaceRetarget,
} from './components/ocr/OCRWorkspace.contract';
import PageScannerDetachedWorkspace from './components/scanner/PageScannerDetachedWorkspace';
import BotJobWindowControl from './components/bot-job-details/BotJobWindowControl';
import {
  botJobWindowTargetUrl,
  isBotJobWindowSession,
  type BotJobWindowTarget,
} from './components/bot-job-details/BotJobWindow.contract';
import {
  isOcrConfigWorkspaceSession,
  isOcrResultsWorkspaceSession,
  isPageScannerWorkspaceSession,
  OCR_CONFIG_WORKSPACE_KIND,
  OCR_RESULTS_WORKSPACE_KIND,
  PAGE_SCANNER_WORKSPACE_KIND,
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
  const [botJobWindowSession, setBotJobWindowSession] = useState<string>('');
  const [botJobWorkspaceEpoch, setBotJobWorkspaceEpoch] = useState<number>(0);
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

  const showWorkspaceNotice = useCallback((message: string) => {
    setErrorFlag(false);
    setAlertImage(constructionImage);
    setAlertClass('construction-image');
    setAlertMessageHeader('Workspace');
    setAlertMessageBody(message);
    setAlertMessageFooter('');
    setAlertDismissed(false);
  }, []);

  // Every navigation button used to work by Java calling window.receiveDataFromJava directly into
  // an embedded JCEF browser. That bridge is gone; navigation now arrives as a "react.session.open"
  // WebSocket message (on whichever session sent the triggering request), telling the shell which
  // session/port to switch to. Every top-level view that can trigger navigation gets this callback.
  const onSessionOpen = useCallback((targetSession: string, port: number, nextBotJobId?: number) => {
    setSocketPort(port);
    setSessionId(targetSession);
    if (isPageScannerWorkspaceSession(targetSession)) {
      setElementDTO([]);
      setBotJobName('');
    }
    if (nextBotJobId !== undefined && nextBotJobId !== -9999) {
      setBotJobId(nextBotJobId);
    }
  }, []);

  const onBotJobWindowTarget = useCallback((target: BotJobWindowTarget) => {
    if (!isBotJobWindowSession(botJobWindowSession)) return;

    if (target.botJobId === botJobId && target.workspaceEpoch === botJobWorkspaceEpoch) {
      try {
        window.focus();
      } catch {
        // Native focus is best-effort and may be refused by the window manager.
      }
      return;
    }

    // The native shell remains alive; only its authoritative Bot Job content changes.
    // Reset all job-derived presentation state before reconnecting botJobTasks so no row,
    // label, or identity from the previous target can flash in the reused panel.
    setInstructionsData([]);
    setComponentsData([]);
    setElementDTO([]);
    setBotJobId(target.botJobId);
    setBotJobName('');
    setHomeBanking(0);
    setHomeBankName('');
    setBotJobWorkspaceEpoch(target.workspaceEpoch);
    setSessionId('botJobTasks');
    setSocketPort((current) => current > 0 ? current : Number(window.location.port));

    try {
      const targetUrl = botJobWindowTargetUrl(
        window.location.href,
        botJobWindowSession,
        target.botJobId,
      );
      window.history.replaceState(window.history.state, '', targetUrl);
      window.focus();
    } catch (targetError) {
      console.error('Could not update the Bot Job native window target:', targetError);
    }
  }, [botJobId, botJobWindowSession, botJobWorkspaceEpoch]);

  const onOcrWorkspaceRetarget = useCallback((target: OcrWorkspaceRetarget) => {
    // Retarget events are accepted only by the currently connected OCR workspace. A repeated
    // click for the same binding therefore focuses this native panel without clearing its draft.
    if (target.previousSessionId !== sessionId) return;
    if (ocrWorkspaceRetargetDisposition(target, sessionId) === 'FOCUS_ONLY') {
      try {
        window.focus();
      } catch {
        // Native focus is best-effort and may be refused by the window manager.
      }
      return;
    }

    // A different scanner/job gets a fresh logical OCR session inside this same physical window.
    // Reset all identity-bearing shell state and key-remount the page before it bootstraps.
    setInstructionsData([]);
    setComponentsData([]);
    setElementDTO([]);
    setHomeBanking(target.homeBankingId);
    setHomeBankName('');
    setBotJobId(target.botJobId);
    setBotJobName('');
    setSessionId(target.sessionId);
    setSocketPort((current) => current > 0 ? current : Number(window.location.port));

    try {
      const targetUrl = ocrWorkspaceTargetUrl(
        window.location.href,
        target.kind,
        target.sessionId,
      );
      window.history.replaceState(window.history.state, '', targetUrl);
      window.focus();
    } catch (targetError) {
      console.error('Could not update the detached OCR workspace target:', targetError);
    }
  }, [sessionId]);

  // The Java host owns one reusable Bot Job Chromium application window. Its URL carries the
  // initial job plus a persistent control-session identity used for every later retarget.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const openWorkspace = search.get('openWorkspace');
    const sourceBotJobId = search.get('sourceBotJobId');
    if (openWorkspace) {
      if (
        !['newBotJobManager', 'cloneJobManager', 'configManager', 'aTemplateManager', 'aboutPanel', 'licenseManager']
          .includes(openWorkspace)
      ) {
        console.error('Rejected invalid detached workspace route.');
        return;
      }
      const parsedSourceBotJobId = sourceBotJobId ? Number(sourceBotJobId) : -9999;
      onSessionOpen(
        openWorkspace,
        Number(window.location.port),
        Number.isSafeInteger(parsedSourceBotJobId) && parsedSourceBotJobId > 0 ? parsedSourceBotJobId : undefined,
      );
      return;
    }

    const openPageScanner = search.get('openPageScanner');
    const pageScannerSession = search.get('pageScannerSession');
    if (openPageScanner || pageScannerSession) {
      const validPageScanner = openPageScanner === PAGE_SCANNER_WORKSPACE_KIND
        && Boolean(pageScannerSession && isPageScannerWorkspaceSession(pageScannerSession));
      if (!pageScannerSession || !validPageScanner) {
        console.error('Rejected invalid detached Page Scanner workspace route.');
        return;
      }
      onSessionOpen(pageScannerSession, Number(window.location.port));
      return;
    }

    const openOcr = search.get('openOcr');
    const ocrSession = search.get('ocrSession');
    if (openOcr || ocrSession) {
      const validConfig = openOcr === OCR_CONFIG_WORKSPACE_KIND
        && Boolean(ocrSession && isOcrConfigWorkspaceSession(ocrSession));
      const validResults = openOcr === OCR_RESULTS_WORKSPACE_KIND
        && Boolean(ocrSession && isOcrResultsWorkspaceSession(ocrSession));
      if (!ocrSession || (!validConfig && !validResults)) {
        console.error('Rejected invalid detached OCR workspace route.');
        return;
      }
      onSessionOpen(ocrSession, Number(window.location.port));
      return;
    }

    const openBotJobId = search.get('openBotJob');
    const controlSession = search.get('botJobWindowSession');
    if (!openBotJobId && !controlSession) return;
    const parsedBotJobId = Number(openBotJobId);
    if (
      !openBotJobId
      || !Number.isSafeInteger(parsedBotJobId)
      || parsedBotJobId <= 0
      || !controlSession
      || !isBotJobWindowSession(controlSession)
    ) {
      console.error('Rejected invalid Bot Job native workspace route.');
      return;
    }
    setBotJobWindowSession(controlSession);
    setBotJobWorkspaceEpoch(0);
    onSessionOpen('botJobTasks', Number(window.location.port), parsedBotJobId);
  }, [onSessionOpen]);

  const closeDetachedWorkspace = useCallback(() => {
    try {
      window.close();
    } catch (error) {
      console.error('Could not close detached workspace window:', error);
    }
  }, []);

  // Bootstrap over WebSocket: the shell opens a short-lived handshake connection under its own
  // session id ("mainDashboardBootstrap", never a real target session) and waits for the initial
  // "react.session.open" reply to learn which session/port to start on. It closes right after so
  // the real session (e.g. MainDashboard's own socket) can register under that id without
  // colliding with this one. Skipped entirely for a Bot Job app window (see above).
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    if (
      search.has('openBotJob')
      || search.has('openOcr')
      || search.has('ocrSession')
      || search.has('openPageScanner')
      || search.has('pageScannerSession')
      || search.has('openWorkspace')
    ) return;
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
          && (
            sessionIdFromJava.includes(PRE_SCANNER_GRID_SESSION_ID)
            || isPageScannerWorkspaceSession(sessionIdFromJava)
          )
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

  const botJobWorkspaceKey = botJobWindowSession
    ? `${botJobWindowSession}:${botJobId}:${botJobWorkspaceEpoch}`
    : `bot-job:${botJobId}:${botJobWorkspaceEpoch}`;
  const mainApplicationControlPort = socketPort > 0 ? socketPort : Number(window.location.port);

  return (
    <React.StrictMode>
      {isMainApplicationWindow(window.location.search)
        && Number.isInteger(mainApplicationControlPort)
        && mainApplicationControlPort > 0 && (
        <MainApplicationControl socketPort={mainApplicationControlPort} />
      )}
      <BotJobWindowControl
        socketPort={socketPort}
        sessionId={botJobWindowSession}
        onTarget={onBotJobWindowTarget}
      />
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
          <GridItem key={`${botJobWorkspaceKey}:details`} homeBankingIdInitial={homeBanking} data={instructionsData} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} onSessionOpen={onSessionOpen} onDetachedClose={closeDetachedWorkspace} />
        </DesktopWorkspaceShell>
      )}
      {sessionId && (sessionId.includes("componentTasks")) && (
        <DesktopWorkspaceShell ariaLabel="Bot Job Components" testId="bot-job-components-workspace">
          <GridItemComp key={`${botJobWorkspaceKey}:components`} homeBankingIdInitial={homeBanking} dataComp={componentsData} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} onSessionOpen={onSessionOpen} />
        </DesktopWorkspaceShell>
      )}
      {/* Guard against scanner/pre-scan double-mounting. */}
      {sessionId
        && sessionId.includes(SCANNER_GRID_SESSION_ID)
        && !sessionId.includes(PRE_SCANNER_GRID_SESSION_ID) && (
        <DesktopWorkspaceShell ariaLabel="Page Scanner Grid" testId="page-scanner-workspace">
          <GridItemScann
            homeBankingIdInitial={homeBanking}
            dataDTO={elementDTO}
            socketPort={socketPort}
            sessionId={sessionId}
            botJobIdInitial={botJobId}
            botJobNameInitial={botJobName}
            onSessionOpen={onSessionOpen}
            onDetachedClose={closeDetachedWorkspace}
            onWorkspaceNotice={showWorkspaceNotice}
          />
        </DesktopWorkspaceShell>
      )}
      {sessionId && (sessionId.includes(PRE_SCANNER_GRID_SESSION_ID)) && (
        <DesktopWorkspaceShell ariaLabel="Page Scanner Grid" testId="pre-scan-workspace">
          <GridItemScann
            mode="preScan"
            homeBankingIdInitial={homeBanking}
            dataDTO={elementDTO}
            socketPort={socketPort}
            sessionId={sessionId}
            botJobIdInitial={botJobId}
            botJobNameInitial={botJobName}
            onSessionOpen={onSessionOpen}
            onDetachedClose={closeDetachedWorkspace}
            onWorkspaceNotice={showWorkspaceNotice}
          />
        </DesktopWorkspaceShell>
      )}
      {isPageScannerWorkspaceSession(sessionId) && (
        <PageScannerDetachedWorkspace
          key={sessionId}
          homeBankingIdInitial={homeBanking}
          dataDTO={elementDTO}
          socketPort={socketPort}
          sessionId={sessionId}
          botJobIdInitial={botJobId}
          botJobNameInitial={botJobName}
          onSessionOpen={onSessionOpen}
          onDetachedClose={closeDetachedWorkspace}
          onWorkspaceNotice={showWorkspaceNotice}
        />
      )}
      {isOcrConfigWorkspaceSession(sessionId) && (
        <OCRConfigDetachedWorkspace
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          onWorkspaceRetarget={onOcrWorkspaceRetarget}
          onClose={closeDetachedWorkspace}
          onWorkspaceNotice={showWorkspaceNotice}
        />
      )}
      {isOcrResultsWorkspaceSession(sessionId) && (
        <OCRResultsDetachedWorkspace
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          onWorkspaceRetarget={onOcrWorkspaceRetarget}
          onClose={closeDetachedWorkspace}
          onWorkspaceNotice={showWorkspaceNotice}
        />
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
        <NewBotJobPage
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          onSessionOpen={onSessionOpen}
          onClose={closeDetachedWorkspace}
        />
      )}

      {sessionId && sessionId.includes("cloneJobManager") && (
        <CloneJobPage
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          sourceBotJobId={botJobId}
          onSessionOpen={onSessionOpen}
          onClose={closeDetachedWorkspace}
        />
      )}

      {sessionId && (sessionId.includes("configManager")) && (
        <ConfigPage
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          onClose={closeDetachedWorkspace}
        />
      )}
      {sessionId && sessionId.includes("aTemplateManager") && (
        <ATemplate
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          onClose={closeDetachedWorkspace}
        />
      )}
      {sessionId && sessionId.includes("licenseManager") && (
        <DesktopWorkspaceShell key={sessionId} ariaLabel="License Manager" testId="license-manager-workspace">
          <LicenseManager socketPort={socketPort} sessionId={sessionId} />
        </DesktopWorkspaceShell>
      )}
      {sessionId && sessionId.includes("aboutPanel") && (
        <InfoPage
          key={sessionId}
          socketPort={socketPort}
          sessionId={sessionId}
          onSessionOpen={onSessionOpen}
          onClose={closeDetachedWorkspace}
        />
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
