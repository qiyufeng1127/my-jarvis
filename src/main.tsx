import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/design-system.css'; // 设计系统基础
import './styles/globals.css';
// import './utils/chartConfig'; // 暂时注释，需要先安装 chart.js

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

