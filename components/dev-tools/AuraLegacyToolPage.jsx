'use client';

import { useEffect } from 'react';
import LegacyHtmlPage from '@/components/legacy/LegacyHtmlPage';
import '@/styles/aura-tokens.css';
import '@/styles/aura-dev-tools.css';

const AURA_THEME_KEY = 'aura-theme';

function stripLegacyToolStyles(markup = '') {
  return markup
    .replace(/<style[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<link[^>]+fonts\.googleapis[^>]*>\s*/gi, '')
    .replace(/<link[^>]+api\.fontshare[^>]*>\s*/gi, '');
}

function getAuraTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(AURA_THEME_KEY) || 'light';
}

function setAuraTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(AURA_THEME_KEY, theme);
}

function injectThemeToggle() {
  if (document.querySelector('.aura-theme-toggle')) return;

  const header = document.querySelector('.header, .notepad-header');
  if (header) {
    const toggle = createThemeToggle();
    const closeBtn = header.querySelector('.close-btn, .close-notepad-btn');
    if (closeBtn) {
      header.insertBefore(toggle, closeBtn);
      return;
    }

    const headerButtons = header.querySelector('.header-buttons, .header-actions');
    if (headerButtons) {
      headerButtons.prepend(toggle);
      return;
    }

    const closeHeaderBtn = header.querySelector('button');
    if (closeHeaderBtn) {
      header.insertBefore(toggle, closeHeaderBtn);
      return;
    }

    header.appendChild(toggle);
    return;
  }

  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !sidebar.querySelector('.aura-theme-toggle')) {
    const row = document.createElement('div');
    row.className = 'aura-sidebar-theme-row';
    row.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:16px;';
    row.appendChild(createThemeToggle());
    sidebar.prepend(row);
    return;
  }

  if (!document.querySelector('.aura-theme-toggle-floating')) {
    const floating = createThemeToggle();
    floating.classList.add('aura-theme-toggle-floating');
    floating.style.cssText = [
      'position:fixed',
      'top:16px',
      'right:16px',
      'z-index:9999',
    ].join(';');
    document.body.appendChild(floating);
  }
}

function createThemeToggle() {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'aura-theme-toggle';
  toggle.setAttribute('aria-label', 'Toggle light/dark theme');
  toggle.title = 'Toggle theme';
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setAuraTheme(next);
  });
  return toggle;
}

function withAuraDesignSystem(headMarkup = '') {
  return stripLegacyToolStyles(headMarkup);
}

export default function AuraLegacyToolPage({
  headMarkup = '',
  ...rest
}) {
  useEffect(() => {
    setAuraTheme(getAuraTheme());

    const timer = window.setTimeout(injectThemeToggle, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <LegacyHtmlPage
      {...rest}
      headMarkup={withAuraDesignSystem(headMarkup)}
    />
  );
}
