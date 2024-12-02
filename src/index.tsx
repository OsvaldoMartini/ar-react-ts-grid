import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import GridItem from './components/GridItem';
import instructionsMockData from './components/instructionsMockData';
import Navigable from './components/Navigable';
// import WebSocketComponent from './components/WebSocketComponent';


// The HTML string to be passed as dataHtml
const dataHtml = `
  <input class="iam-form-control ng-pristine ng-invalid ng-touched" name="username" type="text" id="username" placeholder="" autocapitalize="off" spellcheck="false">
  <input class="iam-form-control ng-untouched ng-pristine ng-invalid" name="password" type="password" id="password" placeholder="" autocapitalize="off" spellcheck="false">
`;


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* <GridItem data={instructionsMockData} /> */}
    {/* <WebSocketComponent></WebSocketComponent> */}
    <Navigable />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
