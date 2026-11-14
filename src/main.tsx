import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Setup from './components/Setup';
import { AuthProvider } from './context/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isSupabaseConfigured ? (
      <AuthProvider>
        <App />
      </AuthProvider>
    ) : (
      <Setup />
    )}
  </React.StrictMode>
);
