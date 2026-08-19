import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import HashtagDoradoLab from '@/components/lab/HashtagDoradoLab';

// Gate de un solo uso para vistas de "Lab" (piezas visuales sueltas que no
// vale la pena cablear dentro del árbol real de App.jsx, con todo su estado
// de Hero/sesión/GAT, solo para poder verlas). Se revisa ANTES del árbol
// normal, a propósito, para no tocar el orden de hooks de App().
const labParam = new URLSearchParams(window.location.search).get('Lab');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {labParam === 'HashtagDorado' ? (
      <HashtagDoradoLab />
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>
);
