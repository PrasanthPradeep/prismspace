export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'PRISM_PING') {
      sendResponse({ ok: true, source: 'background' });
      return;
    }

    if (message?.type === 'PRISM_STORAGE_GET' && typeof message.key === 'string') {
      chrome.storage.local.get(message.key).then((result) => {
        sendResponse({ ok: true, value: result[message.key] });
      });
      return true;
    }

    if (message?.type === 'PRISM_STORAGE_SET' && typeof message.key === 'string') {
      chrome.storage.local.set({ [message.key]: message.value }).then(() => {
        sendResponse({ ok: true });
      });
      return true;
    }
  });
});
