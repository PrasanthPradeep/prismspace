'use client';

import { useEffect, useRef } from 'react';

import { runStorageExample } from '@/lib/extension-storage';

type LegacyHtmlPageProps = {
  headMarkup?: string;
  bodyMarkup?: string;
  scripts?: string[];
  externalScripts?: string[];
  documentClassName?: string;
  bodyClassName?: string;
};

const splitClasses = (value = '') => value.split(/\s+/).filter(Boolean);

function appendExternalScript(src: string, nodes: HTMLScriptElement[]) {
  return new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => resolve();
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
}: LegacyHtmlPageProps) {
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
    let cancelled = false;

    async function runExtensionStorage() {
      try {
        await runStorageExample();
      } catch (error) {
        if (!cancelled) {
          console.warn('Extension storage example failed.', error);
        }
      }
    }

    runExtensionStorage();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (scriptRunRef.current) {
      return undefined;
    }

    scriptRunRef.current = true;
    let cancelled = false;
    const nodes: HTMLScriptElement[] = [];

    async function runScripts() {
      if (scripts.length > 0) {
        console.warn('Inline legacy scripts were skipped. Generate external legacy scripts before packaging.');
      }

      for (const src of externalScripts) {
        if (cancelled) {
          return;
        }

        await appendExternalScript(src, nodes);
      }

      if (!cancelled) {
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
      }
    }

    runScripts();

    return () => {
      cancelled = true;
      nodes.forEach((node) => node.remove());
    };
  }, [externalScripts, scripts]);

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `${headMarkup}\n${bodyMarkup}` }}
    />
  );
}
