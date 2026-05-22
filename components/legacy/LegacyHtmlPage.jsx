'use client';

import { useEffect, useRef } from 'react';

const splitClasses = (value = '') => value.split(/\s+/).filter(Boolean);

function appendExternalScript(src, nodes) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = resolve;
    document.body.appendChild(script);
    nodes.push(script);
  });
}

function appendInlineScript(content, nodes) {
  // Inline script execution is blocked by MV3 CSP in extension contexts.
  // We intentionally skip injecting inline script text to avoid CSP errors.
  // Inline scripts must be converted to external files (see repo TODOs).
  // Keep a no-op placeholder so callers can push a node if they expect one.
  const placeholder = document.createElement('script');
  placeholder.type = 'application/javascript';
  // Do not set .text or src to avoid CSP violations.
  document.body.appendChild(placeholder);
  nodes.push(placeholder);
}

export default function LegacyHtmlPage({
  headMarkup = '',
  bodyMarkup = '',
  scripts = [],
  externalScripts = [],
  documentClassName = '',
  bodyClassName = '',
}) {
  const scriptRunRef = useRef(false);

  useEffect(() => {
    const documentClasses = splitClasses(documentClassName);
    const bodyClasses = splitClasses(bodyClassName);

    if (documentClasses.length) {
      document.documentElement.classList.add(...documentClasses);
    }
    if (bodyClasses.length) {
      document.body.classList.add(...bodyClasses);
    }

    return () => {
      if (documentClasses.length) {
        document.documentElement.classList.remove(...documentClasses);
      }
      if (bodyClasses.length) {
        document.body.classList.remove(...bodyClasses);
      }
    };
  }, [bodyClassName, documentClassName]);

  useEffect(() => {
    if (scriptRunRef.current) {
      return undefined;
    }

    scriptRunRef.current = true;
    let cancelled = false;
    const nodes = [];

    async function runScripts() {
      // Load allowed external scripts (served from the extension package).
      for (const src of externalScripts) {
        if (cancelled) {
          return;
        }

        await appendExternalScript(src, nodes);
      }

      // Do NOT inject inline script text here — MV3 popup/context blocks it.
      // Inline script bodies should be moved to external files under `public/`
      // and referenced via `externalScripts` so they run under `script-src 'self'`.
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
    }

    runScripts();

    return () => {
      cancelled = true;
      nodes.forEach((node) => node.remove());
    };
  }, [externalScripts, scripts]);

  // Strip inline event handlers (onclick, onmouseover, etc.) from bodyMarkup
  // because attributes with inline JS are blocked by extension CSP.
  const sanitizedBody = bodyMarkup.replace(/\son\w+=["'][^"']*["']/gi, '');

  return (
    <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `${headMarkup}\n${sanitizedBody}` }} />
  );
}
