'use client';

import { useEffect } from 'react';
import { getExtensionValue, setExtensionValue } from '@/lib/extension-storage';

export default function ExtensionStorageBootstrap() {
  useEffect(() => {
    let isMounted = true;

    async function syncStoredTheme() {
      const savedTheme = await getExtensionValue<string>('theme');
      const theme = savedTheme || document.documentElement.dataset.theme || 'light';

      if (!isMounted) {
        return;
      }

      document.documentElement.dataset.theme = theme;
      await setExtensionValue('theme', theme);
    }

    syncStoredTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
