import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';

// Support auto-auth token via query param for seamless automated UI preview/testing
const urlParams = new URLSearchParams(window.location.search);
const tokenParam = urlParams.get('authToken');
if (tokenParam) {
    localStorage.setItem('token', tokenParam);
} else if (urlParams.get('clearAuth')) {
    localStorage.removeItem('token');
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
    <App />
  </React.StrictMode>);

