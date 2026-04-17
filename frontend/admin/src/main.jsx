import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import 'leaflet/dist/leaflet.css';
import './styles/globals.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminProvider>
      <App />
    </AdminProvider>
  </React.StrictMode>,
);
