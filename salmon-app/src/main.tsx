import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeApi } from './api/frappeApi'

const container = document.getElementById('root');

async function startApp() {
  await initializeApi();
  
  if (container) {
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

startApp();

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}