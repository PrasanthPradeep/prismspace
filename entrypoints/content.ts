import { mountPrismAssistant } from '@/src/assistant/contentAssistant';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    mountPrismAssistant();
  }
});

