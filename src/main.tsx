import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { BacktestProvider } from './context/BacktestContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BacktestProvider>
      <App />
    </BacktestProvider>
  </StrictMode>,
);
