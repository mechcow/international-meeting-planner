import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TimezoneProvider } from './context/TimezoneContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TimezoneProvider>
      <App />
    </TimezoneProvider>
  </StrictMode>
);
