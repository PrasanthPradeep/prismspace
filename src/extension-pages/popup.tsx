import HomePage from '@/components/home/HomePage';
import { extensionApi } from '@/src/extension/browserApi';
import { renderPage } from '@/src/extension/renderPage';

function pingBackground() {
	const runtime = extensionApi.runtime;
	if (!runtime?.sendMessage) {
		return;
	}

	try {
		void runtime.sendMessage({ type: 'PRISM_PING' }).catch(() => undefined);
	} catch {
		// Ignore startup ping failures so the popup can still render.
	}
}

pingBackground();

document.documentElement.classList.add('extension-popup');
document.body.classList.add('extension-popup');

renderPage(HomePage, { title: 'Prism Space' });
