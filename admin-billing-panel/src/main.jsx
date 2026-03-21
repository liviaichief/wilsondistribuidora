import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './pages/Dashboard';
import './index.css';
import { AdminAuthProvider } from './context/AdminAuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <Dashboard />
    </AdminAuthProvider>
  </React.StrictMode>
);
