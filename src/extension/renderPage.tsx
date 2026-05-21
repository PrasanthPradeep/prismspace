import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';

type RenderOptions = {
  title?: string;
};

const FONT_STYLESHEETS = [
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css?family=JetBrains+Mono',
  'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Quantico:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Quantico:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Bitcount+Grid+Single:wght@100..900&display=swap'
];

function initializeTheme() {
  try {
    document.documentElement.dataset.theme = localStorage.getItem('aura-theme') || 'light';
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
}

function ensureFontStylesheets() {
  for (const href of FONT_STYLESHEETS) {
    if (document.querySelector(`link[href="${href}"]`)) {
      continue;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

export function renderPage(Component: ComponentType, options: RenderOptions = {}) {
  initializeTheme();
  ensureFontStylesheets();

  if (options.title) {
    document.title = options.title;
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Missing #root container');
  }

  createRoot(rootElement).render(<Component />);
}
