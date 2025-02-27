import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import instructionsMockData, { botJobMockData, elementsDTOMockData } from './components/instructionsMockData';
import GridItemScann from './components/GridItemScann';
import GridItem from './components/GridItem';
import { BlockLoopInstructionLoadDTO, BotJobData, ComplexMessage, ElementDTO } from './components/instructionsMockData';
import AlertModal from './components/AlertModal';
import constructionImage from './assets/construction.png';
import GridItemComp from './components/GridItemComp';

// Initialize the root
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const App: React.FC = () => {
  const [instructionsData, setInstructionsData] = useState<BlockLoopInstructionLoadDTO[]>(instructionsMockData);
  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(elementsDTOMockData);
  const [botJobData, setBotJobData] = useState<BotJobData>(botJobMockData);
  const [socketPort, setSocketPort] = useState<number>(8181);
  const [sessionId, setSessionId] = useState<string>(""); // (SENDER: scannerTool) -> scannerGrid  -> componentTasks /  (SENDER: insertTool) -> botJobTasks  
  const [errorFlag, setErrorFlag] = useState<boolean>(false)
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
    (window as any).receiveDataFromJava = (jsonData: string, socketPort: number, sessionIdFromJava: string) => {
      try {
        console.log("sessionIdFromJava", sessionIdFromJava);

        const dataLoad = JSON.parse(jsonData);

        setSocketPort(socketPort);
        setSessionId(sessionIdFromJava);

        // Check if it's BlockLoopInstructionLoadDTO
        if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava === "botJobTasks") {
          setInstructionsData(dataLoad as BlockLoopInstructionLoadDTO[]);
          // setAlertMessageHeader("DATA  BlockLoopInstructionLoadDTO " + dataLoad.length);
          // setAlertMessageBody("ReceiveDataFromJava Socket " + socketPort + " - " + sessionIdFromJava);
        }
        // Check if it's ElementDTO
        else if (Array.isArray(dataLoad) && dataLoad.length > 0 && sessionIdFromJava === "scannerGrid") {
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
      {sessionId && (sessionId === "botJobTasks") && (
        <GridItem data={instructionsData} botJobLoad={botJobData} socketPort={socketPort} sessionId={sessionId} operationId="" />
      )}
      {sessionId && (sessionId == "componentTasks") && (
        <GridItemComp data={instructionsData} botJobLoad={botJobData} socketPort={socketPort} sessionId={sessionId} operationId="" />
      )}
      {sessionId && sessionId === "scannerGrid" && (
        <GridItemScann dataDTO={elementDTO} socketPort={socketPort} sessionId={sessionId} operationId="" />
      )}
    </React.StrictMode>
  );
};

// Render the App component
root.render(<App />);

// Report web vitals
reportWebVitals();
