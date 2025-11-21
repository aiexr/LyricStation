import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.scss';
import '../styles/app.scss';
import '../styles/legal.scss';
import About from '../pages/about';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <About />
  </StrictMode>,
);
