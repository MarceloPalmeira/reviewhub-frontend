import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './main';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz não encontrado');
createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
