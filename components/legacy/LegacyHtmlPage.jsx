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
      return;
    }

    scriptRunRef.current = true;
    let cancelled = false;
    const nodes = [];

    async function runScripts() {
      for (const src of externalScripts) {
        if (cancelled) return;
        await appendExternalScript(src, nodes);
      }

      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
    }

    runScripts();

    return () => {
      cancelled = true;
      nodes.forEach((node) => node.remove());
    };
  }, [externalScripts]);

  // Strip inline event handlers — blocked by MV3 CSP
  const sanitizedBody = bodyMarkup.replace(/\son\w+=["'][^"']*["']/gi, '');

  return (
    <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `${headMarkup}\n${sanitizedBody}` }} />
  );
}
