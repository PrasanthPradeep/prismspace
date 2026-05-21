import HomePage from '@/components/home/HomePage';
import { renderPage } from '@/src/extension/renderPage';

void chrome.runtime.sendMessage({ type: 'PRISM_PING' }).catch(() => undefined);

renderPage(HomePage, { title: 'Prism Space' });
