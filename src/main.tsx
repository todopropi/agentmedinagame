import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPushServiceWorker } from './utils/pushNotifications';

// Registre immediat del Service Worker per al suport de notificacions natives a la barra d'Android
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerPushServiceWorker().catch(console.warn);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
