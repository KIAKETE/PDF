import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootEl = document.getElementById('root') || (function(){
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
  return el;
})();
createRoot(rootEl).render(<App />);