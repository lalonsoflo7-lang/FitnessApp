import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { env } from './config/env';
import { App } from './App';
import { ConfigErrorPage } from './routes/ConfigErrorPage';
import { initServiceWorker } from './pwa/serviceWorker';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>{env.ok ? <App /> : <ConfigErrorPage missing={env.missing} />}</StrictMode>,
);

initServiceWorker();
