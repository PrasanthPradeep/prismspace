import HomePage from '@/components/home/HomePage';
import { renderPage } from '@/src/extension/renderPage';

function pingBackground() {
	const runtime = globalThis.chrome?.runtime;
	if (!runtime?.sendMessage) {
		return;
	}

	try {
		const response = runtime.sendMessage({ type: 'PRISM_PING' });
		response?.catch?.(() => undefined);
	} catch {
		// Ignore startup ping failures so the popup can still render.
	}
}

pingBackground();

document.documentElement.classList.add('extension-popup');
document.body.classList.add('extension-popup');

renderPage(HomePage, { title: 'Prism Space' });
