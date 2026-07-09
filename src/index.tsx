import React, { useState, useEffect } from 'react';
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
  const [sessionId, setSessionId] = useState<string>(""); // (SENDER: scannerTool) -> scannerGrid-1  -> componentTasks-1 -> mobileScannerGrid
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
        } else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("preScannerGrid")) {
          setElementDTO(dataLoad as ElementDTO[]);
        } else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("scannerGrid")) {
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
        <GridItem homeBankingIdInitial={homeBanking} data={instructionsData} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} />
      )}
      {sessionId && (sessionId.includes("componentTasks")) && (
        <GridItemComp homeBankingIdInitial={homeBanking} dataComp={componentsData} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} />
      )}
      {/* Guard against preScannerGrid double-mounting: only case ("S") separates
          the two session ids, so exclude it explicitly. */}
      {sessionId && sessionId.includes("scannerGrid") && !sessionId.includes("preScannerGrid") && (
        <GridItemScann homeBankingIdInitial={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} />
      )}
      {sessionId && (sessionId.includes("preScannerGrid")) && (
        <GridItemScann mode="preScan" homeBankingIdInitial={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} />
      )}
      {sessionId && (sessionId.includes("mobileScannerGrid")) && (
        <GridItemScannMobile homeBankingIdInitial={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} botJobIdInitial={botJobId} botJobNameInitial={botJobName} />
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
