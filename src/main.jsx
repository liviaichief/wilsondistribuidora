import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { AlertProvider } from './context/AlertContext.jsx'
import { PlanProvider } from './context/PlanContext.jsx'

// Service Worker é gerenciado automaticamente pelo vite-plugin-pwa (registerType: 'autoUpdate')
// Não registrar manualmente para evitar conflitos de versão

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
