import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { colors, cssVariables } from './utils/colors';

const applyTheme = () => {
  const root = document.documentElement;
  Object.entries(cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.style.setProperty('--color-background', colors.bg0);
};

applyTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
