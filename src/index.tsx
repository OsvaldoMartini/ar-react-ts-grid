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

// Initialize the root
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const App: React.FC = () => {
  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>([]);
  const [componentsData, setComponentsData] = useState<ComponentsInstructionsDTO[]>([]);
  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(elementsDTOMockData);
  const [botJobData, setBotJobData] = useState<BotJobData>(botJobMockData);
  const [socketPort, setSocketPort] = useState<number>(8282);
  const [botJobId, setBotJobId] = useState<number>(0);
  const [botJobName, setBotJobName] = useState<string>("");
  const [homeBanking, setHomeBanking] = useState<number>(0); // VPBank 3
  const [sessionId, setSessionId] = useState<string>(""); // (SENDER: scannerTool) -> scannerGrid-1  -> componentTasks-1 
  const [errorFlag, setErrorFlag] = useState<boolean>(false)  //(SENDER: insertTool) -> botJobTasks-1  
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
    // Define the function for receiving JavaFX data
    (window as any).receiveDataFromJava = (jsonData: string, socketPort: number, sessionIdFromJava: string, homeBanking: number, botJobId: number, botJobName: string) => {
      try {
        console.log("sessionIdFromJava", sessionIdFromJava);

        const dataLoad = JSON.parse(jsonData);

        setSocketPort(socketPort);
        setSessionId(sessionIdFromJava);
        setHomeBanking(homeBanking);
        setBotJobId(botJobId)
        setBotJobName(botJobName)

        // Check if it's BlockLoopInstructionLoadDTO
        if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("botJobTasks")) {
          setInstructionsData(dataLoad as BlockLoopInstructionLoadDTO[]);
          // setAlertMessageHeader("DATA  BlockLoopInstructionLoadDTO " + dataLoad.length);
          // setAlertMessageBody("ReceiveDataFromJava Socket " + socketPort + " - " + sessionIdFromJava);
        } else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("componentTasks")) {
          setComponentsData(dataLoad as BlockLoopInstructionLoadDTO[]);
        }
        // Check if it's ElementDTO
        else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava.includes("scannerGrid")) {
          setElementDTO(dataLoad as ElementDTO[]);
          // setAlertMessageHeader("DATA  ElementDTO " + dataLoad.length);
          // setAlertMessageBody("ReceiveDataFromJava Socket " + socketPort + " - " + sessionIdFromJava);
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
        <GridItem homeBankingId={homeBanking} data={instructionsData} socketPort={socketPort} sessionId={sessionId} botJobId={botJobId} botJobName={botJobName} />
      )}
      {sessionId && (sessionId.includes("componentTasks")) && (
        <GridItemComp homeBankingId={homeBanking} dataComp={componentsData} socketPort={socketPort} sessionId={sessionId} botJobId={botJobId} botJobName={botJobName} />
      )}
      {sessionId && (sessionId.includes("scannerGrid")) && (
        <GridItemScann homeBankingId={homeBanking} dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} />
      )}
    </React.StrictMode>
  );
};

// Render the App component
root.render(<App />);

// Report web vitals
reportWebVitals();
