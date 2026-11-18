import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initSync } from './sync'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

initSync()

// Prośba o trwałe przechowywanie (Safari potrafi czyścić localStorage nieużywanych stron)
void navigator.storage?.persist?.().catch(() => {})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
