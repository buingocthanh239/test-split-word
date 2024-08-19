import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import './UserApp'
import reportWebVitals from './reportWebVitals';
import UserApp from './UserApp';
import ContextTest from './ContextTest';
import DocxReader from './DocReader';
import TestPromtGpt from './test-prompt-gpt';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TestPromtGpt />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
