import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { AlertProvider } from './context/AlertContext.jsx'
import { PlanProvider } from './context/PlanContext.jsx'

// Registra Service Worker para funcionalidade PWA (offline + install prompt)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg  => console.log('SW registrado:', reg))
      .catch(err => console.log('SW falhou:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AlertProvider>
        {/* PlanProvider carrega o plano ativo e configurações de identidade do cliente */}
        <PlanProvider>
          <App />
        </PlanProvider>
      </AlertProvider>
    </ErrorBoundary>
  </StrictMode>,
)
