import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Bootstrap default property for demo when none is set (required by PmsProvider)
if (typeof localStorage !== 'undefined') {
  const key = 'hs_active_property';
  const val = localStorage.getItem(key);
  if (!val || val.trim() === '') {
    localStorage.setItem(key, 'demo_property_h1');
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);