import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import GridItem from './components/GridItem';
import instructionsMockData, { botJobMockData } from './components/instructionsMockData5';
import Navigable from './components/Navigable';
import NavigableBKP from './components/NavigableBKP';
import ToggleActive from './components/ToggleActive';
import WebSocketComponent from './components/StompSocketComponent';
import StompMessage from './components/StompMessage';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import PageOne from './pages/PageOne';
import About from './pages/About';
import Home from './pages/Home';
import Menu from './pages/Menu';
import GridDrag from './components/GridDrag2';
import MyComponent from './components/MyComponent';
import WebSocketComponentClient from './components/WebSocketClient';
import WebSocketComponentClient2 from './components/WebSocketComponentClient2';
import ErrorTest from './components/ErrorTest';

// import WebSocketComponent from './components/WebSocketComponent';


// The HTML string to be passed as dataHtml
const dataHtml = [`<input class="iam-form-control ng-pristine ng-invalid ng-touched" name="username" type="text" id="username" placeholder="" autocapitalize="off" spellcheck="false">`,
  `<input class="iam-form-control ng-untouched ng-pristine ng-invalid" name="password" type="password" id="password" placeholder="" autocapitalize="off" spellcheck="false">`];


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);


root.render(
  <React.StrictMode>
    {/* <ToggleActive items={["Londssson", "Manchester",]} /> */}
    {/* <GridItem data={[]} botJobData={botJobMockData} /> */}
    {/* <GridDrag data={instructionsMockData} botJobData={botJobMockData} /> */}
    {/* <MyComponent /> */}
    {/* <ErrorTest></ErrorTest> */}
    {/* |<WebSocketComponentClient2></WebSocketComponentClient2> */}
    {/* <WebSocketComponent></WebSocketComponent> */}
    <GridItem data={instructionsMockData} botJobData={botJobMockData} />
    {/* <WebSocketComponent></WebSocketComponent> */}
    {/* <StompMessage /> */}
    {/* <Navigable dataHtml={dataHtml} /> */}
    {/* <NavigableBKP /> */}
    {/* <Router>
      <Menu />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page1" element={<PageOne />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router> */}
  </React.StrictMode>

);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
