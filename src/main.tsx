import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Registro automático del Service Worker para funcionamiento 100% Offline
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible.');
  },
  onOfflineReady() {
    console.log('Aplicación lista para funcionar 100% offline.');
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
